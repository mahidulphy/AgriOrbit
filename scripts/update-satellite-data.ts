/**
 * scripts/update-satellite-data.ts
 *
 * Automated Daily Satellite Ingestion Engine for AgriOrbit
 *
 * Sources:
 * 1. NASA ORNL DAAC MODIS / VIIRS Land Product Subsets Web Service:
 *    - Real-time REST API returning JSON subsets directly (no heavy file downloads).
 *    - Queries MOD13Q1 (Terra 250m) and MYD13Q1 (Aqua 250m), with VIIRS VNP13A1 (500m)
 *      as active operational backup, selecting whichever has the latest observation date.
 * 2. NASA AppEEARS API (SMAP Enhanced L3 Daily 9km - SPL3SMP_E.006):
 *    - Authenticates via NASA Earthdata login.
 *    - Submits point extraction request for Bangladesh districts, polls task status,
 *      and parses quality-filtered AM/PM soil moisture observations (m³/m³).
 *
 * Targets:
 * - Upserts rows into Supabase table `satellite_observations` (district, source, value, observed_date, fetched_at)
 * - Updates local snapshot cache in `src/data/satellite.json` so the app works seamlessly offline / bundled.
 *
 * Usage:
 *   npx tsx scripts/update-satellite-data.ts --district rangpur       # Single district test
 *   npx tsx scripts/update-satellite-data.ts                         # All 64 districts
 *   npx tsx scripts/update-satellite-data.ts --skip-smap             # MODIS/VIIRS only
 *   npx tsx scripts/update-satellite-data.ts --dry-run               # Preview without saving
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { BD_DISTRICTS } from '../src/data/districts.ts';
import type { SmapRecord, NdviRecord, DistrictSatelliteRecord } from '../src/data/satellite.ts';

const ORNL_BASE = 'https://modis.ornl.gov/rst/api/v1';
const APPEEARS_BASE = 'https://appeears.earthdatacloud.nasa.gov/api';

interface NdviCandidate {
  product: 'MYD13Q1' | 'MOD13Q1' | 'VNP13A1';
  band: string;
  modisDate: string;
  calendarDate: string;
}

interface SupabaseObservationRow {
  district: string;
  source: string;
  value: number;
  observed_date: string;
  metadata: Record<string, any>;
  fetched_at: string;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. MODIS & VIIRS NDVI VIA ORNL DAAC REST API
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function findLatestNdviProductAndDate(
  sampleLat = 25.75,
  sampleLng = 89.25
): Promise<NdviCandidate> {
  const candidates: { product: 'MYD13Q1' | 'MOD13Q1' | 'VNP13A1'; band: string }[] = [
    { product: 'MYD13Q1', band: '250m_16_days_NDVI' },
    { product: 'MOD13Q1', band: '250m_16_days_NDVI' },
    { product: 'VNP13A1', band: '500_m_16_days_NDVI' },
  ];

  let best: NdviCandidate | null = null;

  for (const c of candidates) {
    try {
      const url = `${ORNL_BASE}/${c.product}/dates?latitude=${sampleLat}&longitude=${sampleLng}`;
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) continue;
      const data = (await res.json()) as { dates?: { modis_date: string; calendar_date: string }[] };
      const dates = data?.dates;
      if (!dates || dates.length === 0) continue;

      const latest = dates[dates.length - 1];
      if (!best || latest.calendar_date > best.calendarDate) {
        best = {
          product: c.product,
          band: c.band,
          modisDate: latest.modis_date,
          calendarDate: latest.calendar_date,
        };
      }
    } catch (err: any) {
      console.warn(`[ORNL] Warning checking dates for ${c.product}:`, err?.message);
    }
  }

  if (!best) {
    throw new Error('Failed to query latest dates from ORNL DAAC MODIS/VIIRS services.');
  }

  return best;
}

export async function fetchDistrictNdvi(
  candidate: NdviCandidate,
  lat: number,
  lng: number
): Promise<{ value: number; periodStart: string; product: string; reliability: number } | null> {
  const url = `${ORNL_BASE}/${candidate.product}/subset?latitude=${lat}&longitude=${lng}&band=${candidate.band}&startDate=${candidate.modisDate}&endDate=${candidate.modisDate}&kmAboveBelow=0&kmLeftRight=0`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    console.warn(`[ORNL] Subset error ${res.status} for coord (${lat}, ${lng})`);
    return null;
  }

  const json = (await res.json()) as any;
  const subset = json?.subset?.[0];
  if (!subset || !Array.isArray(subset.data) || subset.data.length === 0) {
    return null;
  }

  const rawVal = subset.data[0];
  // Filter out fill values (-3000 for MODIS, -15000 for VIIRS) or non-physical negative outliers
  if (rawVal < -2000 || rawVal > 10000) {
    return null;
  }

  const scaled = Number((rawVal * 0.0001).toFixed(2));
  return {
    value: scaled,
    periodStart: subset.calendar_date || candidate.calendarDate,
    product: candidate.product,
    reliability: 0,
  };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 2. NASA SMAP SOIL MOISTURE VIA APPEEARS API (SPL3SMP_E.006)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function getEarthdataCredentials(): { username?: string; password?: string; token?: string } | null {
  const username = process.env.EARTHDATA_USERNAME;
  const password = process.env.EARTHDATA_PASSWORD;
  const token = process.env.EARTHDATA_TOKEN;

  if (token) return { token };
  if (username && password) return { username, password };
  return null;
}

export async function loginAppeears(creds: { username?: string; password?: string; token?: string }): Promise<string> {
  const headers: Record<string, string> = {};
  if (creds.token) {
    headers.Authorization = `Bearer ${creds.token}`;
  } else if (creds.username && creds.password) {
    const authString = Buffer.from(`${creds.username}:${creds.password}`).toString('base64');
    headers.Authorization = `Basic ${authString}`;
  }

  const res = await fetch(`${APPEEARS_BASE}/login`, {
    method: 'POST',
    headers,
  });

  if (!res.ok) {
    throw new Error(`AppEEARS authentication failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}

export async function submitSmapTask(
  token: string,
  districts: { id: string; lat: number; lng: number }[],
  daysBack = 5
): Promise<string> {
  const today = new Date();
  const start = new Date(today.getTime() - daysBack * 24 * 60 * 60 * 1000);

  const fmt = (d: Date) =>
    `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;

  const payload = {
    task_type: 'point',
    task_name: `agriorbit_daily_smap_${Date.now()}`,
    params: {
      dates: [
        {
          startDate: fmt(start),
          endDate: fmt(today),
        },
      ],
      layers: [
        {
          product: 'SPL3SMP_E.006',
          layer: 'Soil_Moisture_Retrieval_Data_AM_soil_moisture',
        },
        {
          product: 'SPL3SMP_E.006',
          layer: 'Soil_Moisture_Retrieval_Data_PM_soil_moisture',
        },
      ],
      coordinates: districts.map((d) => ({
        id: d.id,
        latitude: d.lat,
        longitude: d.lng,
      })),
    },
  };

  const res = await fetch(`${APPEEARS_BASE}/task`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AppEEARS task submission failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { task_id: string };
  return data.task_id;
}

export async function pollAppeearsTask(token: string, taskId: string, maxWaitMs = 300000): Promise<void> {
  const start = Date.now();
  console.log(`[AppEEARS] Waiting for task ${taskId} to complete...`);

  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${APPEEARS_BASE}/task/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`AppEEARS status check error (${res.status})`);
    }
    const data = (await res.json()) as { status: string; error?: string };
    const status = data.status;

    if (status === 'done') {
      console.log(`[AppEEARS] Task completed successfully in ${Math.round((Date.now() - start) / 1000)}s.`);
      return;
    }
    if (status === 'error') {
      throw new Error(`AppEEARS task processing failed: ${data.error || 'Unknown error'}`);
    }

    // Wait 15 seconds before next poll
    await new Promise((r) => setTimeout(r, 15000));
  }

  throw new Error(`AppEEARS task timed out after ${Math.round(maxWaitMs / 1000)}s.`);
}

export async function downloadSmapResults(
  token: string,
  taskId: string
): Promise<Map<string, { value: number; date: string; pass: 'AM' | 'PM'; flag?: 'possible_water_contamination' }>> {
  const bundleRes = await fetch(`${APPEEARS_BASE}/bundle/${taskId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!bundleRes.ok) {
    throw new Error(`AppEEARS bundle lookup failed (${bundleRes.status})`);
  }
  const bundle = (await bundleRes.json()) as { files?: { file_id: string; file_name: string }[] };
  const csvFile = bundle?.files?.find((f) => f.file_name.endsWith('.csv') && f.file_name.includes('SPL3SMP_E'));

  if (!csvFile) {
    throw new Error('AppEEARS bundle missing SMAP CSV result file.');
  }

  const fileRes = await fetch(`${APPEEARS_BASE}/bundle/${taskId}/${csvFile.file_id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!fileRes.ok) {
    throw new Error(`AppEEARS result file download failed (${fileRes.status})`);
  }

  const csvText = await fileRes.text();
  const lines = csvText.split('\n').filter((l) => l.trim().length > 0);
  if (lines.length < 2) return new Map();

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
  const idIdx = headers.findIndex((h) => h.toLowerCase() === 'id');
  const dateIdx = headers.findIndex((h) => h.toLowerCase() === 'date');
  const amIdx = headers.findIndex((h) => h.includes('AM_soil_moisture') && !h.includes('Quality'));
  const pmIdx = headers.findIndex((h) => h.includes('PM_soil_moisture') && !h.includes('Quality'));

  const results = new Map<string, { value: number; date: string; pass: 'AM' | 'PM'; flag?: 'possible_water_contamination' }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    const id = cols[idIdx]?.toLowerCase();
    const dateStr = cols[dateIdx];
    if (!id || !dateStr) continue;

    const amVal = amIdx >= 0 ? parseFloat(cols[amIdx]) : NaN;
    const pmVal = pmIdx >= 0 ? parseFloat(cols[pmIdx]) : NaN;

    let validVal: number | null = null;
    let pass: 'AM' | 'PM' = 'AM';

    if (!isNaN(amVal) && amVal >= 0.02 && amVal <= 0.8) {
      validVal = amVal;
      pass = 'AM';
    } else if (!isNaN(pmVal) && pmVal >= 0.02 && pmVal <= 0.8) {
      validVal = pmVal;
      pass = 'PM';
    }

    if (validVal !== null) {
      const rounded = Number(validVal.toFixed(2));
      const flag = rounded > 0.5 ? ('possible_water_contamination' as const) : undefined;

      const existing = results.get(id);
      if (!existing || dateStr > existing.date) {
        results.set(id, { value: rounded, date: dateStr, pass, flag });
      }
    }
  }

  return results;
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 3. SUPABASE SYNC AND LOCAL CACHE PERSISTENCE
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function syncObservationsToSupabase(rows: SupabaseObservationRow[]): Promise<number> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://qxlaaqfogzxqxzktsxjy.supabase.co';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey || serviceKey.includes('placeholder')) {
    console.log('[Supabase] SUPABASE_SERVICE_ROLE_KEY not provided. Skipping database sync.');
    return 0;
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const { data, error } = await supabase.from('satellite_observations').upsert(rows, {
      onConflict: 'district,source,observed_date',
    });

    if (error) {
      console.warn('[Supabase] Upsert warning (check SUPABASE_SERVICE_ROLE_KEY in GitHub secrets):', error.message);
      console.log('ℹ Continuing pipeline; observations will still be saved to src/data/satellite.json.');
      return 0;
    }

    console.log(`[Supabase] Successfully upserted ${rows.length} observation rows.`);
    return rows.length;
  } catch (err: any) {
    console.warn('[Supabase] Connection error during sync:', err?.message);
    return 0;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * MAIN RUNNER
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function runSatelliteUpdate(options: {
  district?: string;
  skipSmap?: boolean;
  skipNdvi?: boolean;
  dryRun?: boolean;
}) {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log(' AgriOrbit Daily Satellite Data Ingestion Job');
  console.log('════════════════════════════════════════════════════════════════════');

  const targetDistrict = options.district ? options.district.toLowerCase() : null;
  const targets = targetDistrict
    ? BD_DISTRICTS.filter((d) => d.id === targetDistrict)
    : BD_DISTRICTS;

  if (targets.length === 0) {
    throw new Error(`No district found matching: ${options.district}`);
  }

  console.log(`Processing ${targets.length} target district(s)...`);

  const supabaseRows: SupabaseObservationRow[] = [];
  const fetchedAtIso = new Date().toISOString();

  // Load existing satellite.json
  const satelliteJsonPath = resolve('src/data/satellite.json');
  const existingSatelliteData: Record<string, any> = JSON.parse(readFileSync(satelliteJsonPath, 'utf8'));

  // 1. Process MODIS / VIIRS NDVI via ORNL DAAC
  if (!options.skipNdvi) {
    console.log('\n[1/2] Fetching MODIS / VIIRS NDVI from NASA ORNL DAAC...');
    try {
      const bestProduct = await findLatestNdviProductAndDate(targets[0].lat, targets[0].lng);
      console.log(`✓ Selected newest available product: ${bestProduct.product} (${bestProduct.calendarDate})`);

      let ndviCount = 0;
      for (const d of targets) {
        const ndvi = await fetchDistrictNdvi(bestProduct, d.lat, d.lng);
        if (ndvi) {
          ndviCount++;
          // Merge into satellite.json
          if (existingSatelliteData[d.id]) {
            existingSatelliteData[d.id].ndvi = {
              value: ndvi.value,
              periodStart: ndvi.periodStart,
              reliability: ndvi.reliability,
              source: ndvi.product,
            };
          }

          supabaseRows.push({
            district: d.id,
            source: `${ndvi.product}_NDVI`,
            value: ndvi.value,
            observed_date: ndvi.periodStart,
            metadata: {
              product: ndvi.product,
              reliability: ndvi.reliability,
            },
            fetched_at: fetchedAtIso,
          });
        }
      }
      console.log(`✓ Successfully updated NDVI for ${ndviCount}/${targets.length} districts.`);
    } catch (err: any) {
      console.error('[ORNL] NDVI fetch failed:', err?.message);
    }
  }

  // 2. Process SMAP via AppEEARS
  if (!options.skipSmap) {
    console.log('\n[2/2] Fetching SMAP Enhanced L3 Soil Moisture from NASA AppEEARS...');
    const creds = getEarthdataCredentials();

    if (!creds) {
      console.log(
        'ℹ EARTHDATA_USERNAME and EARTHDATA_PASSWORD (or EARTHDATA_TOKEN) are not set.\n' +
        '  Skipping live AppEEARS submission and preserving latest SMAP snapshot.'
      );
    } else {
      try {
        const token = await loginAppeears(creds);
        console.log('✓ Successfully authenticated with NASA Earthdata.');

        const taskId = await submitSmapTask(
          token,
          targets.map((t) => ({ id: t.id, lat: t.lat, lng: t.lng }))
        );
        console.log(`✓ Submitted AppEEARS task: ${taskId}`);

        await pollAppeearsTask(token, taskId);
        const smapResults = await downloadSmapResults(token, taskId);
        console.log(`✓ Extracted SMAP records for ${smapResults.size} districts.`);

        let smapCount = 0;
        for (const [id, rec] of smapResults.entries()) {
          smapCount++;
          if (existingSatelliteData[id]) {
            existingSatelliteData[id].smap = {
              value: rec.value,
              date: rec.date,
              pass: rec.pass,
              recentCount: 1,
              ...(rec.flag ? { flag: rec.flag } : {}),
            };
          }

          supabaseRows.push({
            district: id,
            source: 'SMAP',
            value: rec.value,
            observed_date: rec.date,
            metadata: {
              pass: rec.pass,
              flag: rec.flag || null,
            },
            fetched_at: fetchedAtIso,
          });
        }
      } catch (err: any) {
        console.warn('[AppEEARS] SMAP job warning:', err?.message);
        console.log('ℹ Preserving existing SMAP records.');
      }
    }
  }

  // 3. Write rows to Supabase
  if (!options.dryRun && supabaseRows.length > 0) {
    try {
      await syncObservationsToSupabase(supabaseRows);
    } catch (err: any) {
      console.warn('[Supabase] Sync skipped due to error:', err?.message);
    }
  }

  // 4. Save updated satellite.json
  if (!options.dryRun) {
    if (existingSatelliteData._meta) {
      existingSatelliteData._meta.generatedAt = fetchedAtIso;
    }
    writeFileSync(satelliteJsonPath, JSON.stringify(existingSatelliteData, null, 2) + '\n', 'utf8');
    console.log(`\n✓ Saved updated snapshot to ${satelliteJsonPath}`);
  }

  console.log('\n✓ Daily satellite ingestion finished successfully.');
}

// Direct execution from CLI
if (process.argv[1]?.includes('update-satellite-data')) {
  const args = process.argv.slice(2);
  const districtIdx = args.indexOf('--district');
  const district = districtIdx >= 0 ? args[districtIdx + 1] : undefined;
  const skipSmap = args.includes('--skip-smap');
  const skipNdvi = args.includes('--skip-ndvi');
  const dryRun = args.includes('--dry-run');

  runSatelliteUpdate({ district, skipSmap, skipNdvi, dryRun }).catch((err) => {
    console.error('Fatal error during satellite update:', err);
    process.exit(1);
  });
}
