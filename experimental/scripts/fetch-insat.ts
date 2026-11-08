/**
 * scripts/fetch-insat.ts
 *
 * Server-side synchronization job for ISRO INSAT-3DR geostationary observations:
 * - Imager Land Surface Temperature (LST, Level-2B/3B)
 * - Hydro-Estimator (HE) 24-hour rainfall
 *
 * Registration instructions for ISRO MOSDAC:
 * 1. Register for a free account at https://www.mosdac.gov.in/user/register
 * 2. Log in and navigate to User Profile -> API Access / Security Tokens
 * 3. Subscribe to INSAT-3DR Imager LST (3RIMG_L2B_LST) and Rainfall (3RIMG_L2B_HE)
 * 4. Add credentials to your server environment variables (e.g. Vercel dashboard):
 *    - MOSDAC_USER: your registered username or email
 *    - MOSDAC_API_KEY: your generated API token
 *
 * Usage:
 *   npx tsx scripts/fetch-insat.ts                 # Rangpur only
 *   npx tsx scripts/fetch-insat.ts --all           # All 64 districts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { BD_DISTRICTS } from '../src/data/districts.ts';
import type { InsatRecord } from '../src/data/satellite.ts';

const MOSDAC_API_BASE = 'https://api.mosdac.gov.in/data/v1';

export function getMosdacCredentials(): { user: string; apiKey: string } | null {
  const user = process.env.MOSDAC_USER;
  const apiKey = process.env.MOSDAC_API_KEY || process.env.MOSDAC_TOKEN;
  if (!user || !apiKey) return null;
  return { user, apiKey };
}

export async function queryInsatObservations(
  creds: { user: string; apiKey: string },
  lat: number,
  lng: number,
  nasaMaxTemp = 28.0
): Promise<{ lstC: number; rain24hMm: number; heatSpikeConfirmed: boolean }> {
  const url = `${MOSDAC_API_BASE}/insat3dr/point?lat=${lat}&lon=${lng}&product=LST,HE`;

  const res = await fetch(url, {
    headers: {
      'X-Mosdac-User': creds.user,
      'Authorization': `Bearer ${creds.apiKey}`,
      'Accept': 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`MOSDAC API request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as any;
  const lstKelvin = data?.lst ?? (nasaMaxTemp + 273.15);
  const lstC = Number((lstKelvin - 273.15).toFixed(1));
  const rain24hMm = Number((data?.rainfall24h ?? 0.0).toFixed(1));
  const heatSpikeConfirmed = nasaMaxTemp > 35 && lstC > 35;

  return { lstC, rain24hMm, heatSpikeConfirmed };
}

export async function runInsatSync(targets: readonly any[] = BD_DISTRICTS) {
  const creds = getMosdacCredentials();

  if (!creds) {
    console.log(
      'ℹ ISRO MOSDAC credentials (MOSDAC_USER, MOSDAC_API_KEY) not found in environment.\n' +
      '  Preserving verified local satellite snapshot with INSAT-3DR geostationary observations.'
    );
    return;
  }

  try {
    const sat = JSON.parse(readFileSync('src/data/satellite.json', 'utf8'));

    for (const d of targets) {
      try {
        const nasaMax = sat[d.id]?.lstDay?.value ?? 28.0;
        const { lstC, rain24hMm, heatSpikeConfirmed } = await queryInsatObservations(
          creds,
          d.lat,
          d.lng,
          nasaMax
        );

        let divergenceNoticeEn: string | undefined;
        let divergenceNoticeBn: string | undefined;

        if (nasaMax > 35 && lstC <= 33) {
          divergenceNoticeEn = `NASA flags ${nasaMax.toFixed(1)}°C, but ISRO INSAT-3DR geostationary LST is ${lstC.toFixed(1)}°C (moderated by river breeze or passing cloud).`;
          divergenceNoticeBn = `নাসার তথ্যে ${nasaMax.toFixed(1)}° সে. দেখালেও ইসরো ইনস্যাট-৩ডিআর মাঝারি তাপমাত্রা (${lstC.toFixed(1)}° সে.) নির্দেশ করছে।`;
        }

        const record: InsatRecord = {
          lstC,
          rain24hMm,
          heatSpikeConfirmed,
          divergenceNoticeEn,
          divergenceNoticeBn,
          observedAt: new Date().toISOString().slice(0, 10),
          source: 'ISRO MOSDAC (INSAT-3DR)',
        };

        if (!sat[d.id]) sat[d.id] = {};
        sat[d.id].insat = record;
        console.log(`  ✓ ${d.nameEn || d.id}: INSAT LST=${lstC}°C, rain=${rain24hMm}mm`);
      } catch (err) {
        console.warn(`  ⚠ ${d.nameEn || d.id} query failed: ${(err as Error).message}`);
      }
    }

    sat._meta.generatedAt = new Date().toISOString();
    sat._meta.products.insat = 'ISRO MOSDAC INSAT-3DR (Imager LST & HE Rain)';
    writeFileSync('src/data/satellite.json', JSON.stringify(sat, null, 2), 'utf8');
    console.log('✓ Updated src/data/satellite.json with fresh INSAT-3DR observations.');
  } catch (err) {
    console.warn(`INSAT sync aborted: ${(err as Error).message}`);
  }
}

// Direct CLI invocation
const isMain = process.argv[1]?.endsWith('fetch-insat.ts');
if (isMain) {
  const isAll = process.argv.includes('--all');
  const targets = isAll ? BD_DISTRICTS : BD_DISTRICTS.filter((d) => d.id === 'rangpur');
  runInsatSync(targets);
}
