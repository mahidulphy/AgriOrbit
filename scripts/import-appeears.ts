/**
 * scripts/import-appeears.ts
 *
 * Imports real NASA Earthdata AppEEARS observations for all 64 Bangladesh districts.
 * Request: agriorbit_bd_districts_oct2026
 * Task ID: 3d27655e-9af7-4df5-a83d-9785ec7600b9
 *
 * Rules:
 * 1. MOD13Q1.061 (NDVI, 250m, 16-day composite):
 *    - NDVI = MOD13Q1_061__250m_16_days_NDVI (already scaled, -1..1)
 *    - QA = MOD13Q1_061__250m_16_days_pixel_reliability (keep 0 good or 1 marginal only; cloudy pixels skipped)
 *    - Period start = Date
 * 2. MOD11A2.061 (LST Day & Night, 1km, 8-day composite):
 *    - MOD11A2_061_LST_Day_1km, MOD11A2_061_LST_Night_1km in KELVIN (0.0 = skip)
 *    - QA: MODLAND keep 0b00; keep 0b01 only if LST_Error_Flag is 0b00 or 0b01 (<=2K)
 *    - Convert to °C (K - 273.15), 1 decimal place
 * 3. SPL3SMP_E.006 (Root-Zone / Surface Soil Moisture, 9km daily):
 *    - SMAP uses L-band passive microwave radiometry (~1.4 GHz) and is NOT blocked by cloud cover.
 *    - Nulls arise strictly from retrieval quality flag disqualifications (water fraction, dense vegetation
 *      scattering, radio-frequency interference [RFI], or complex topography where bit 0 != 0).
 *    - AM = ..._AM_soil_moisture, PM = ..._PM_soil_moisture_pm
 *    - Keep ONLY rows where Recommended_Quality_Description says "has recommended quality"
 *    - Valid physical range: 0.02 - 0.6 m³/m³
 *    - Values > 0.50 m³/m³ are flagged as "possible_water_contamination" (e.g. Gopalganj floodplain wetlands)
 *    - Latest recommended value in the last 14 days of data (AM first, then PM). If none -> null.
 *
 * Never fills nulls with neighbours, regional averages, or placeholder values.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BD_DISTRICTS } from '../src/data/districts.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

export interface SmapData {
  value: number;
  date: string;
  pass: 'AM' | 'PM';
  recentCount: number;
  flag?: 'possible_water_contamination';
}

export interface NdviData {
  value: number;
  periodStart: string;
  reliability: number;
}

export interface LstData {
  value: number;
  periodStart: string;
}

export interface DistrictSatelliteRecord {
  smap: SmapData | null;
  ndvi: NdviData | null;
  lstDay: LstData | null;
  lstNight: LstData | null;
}

export interface SatelliteDatasetMeta {
  request: string;
  requestId: string;
  pointType: string;
  products: {
    smap: string;
    ndvi: string;
    lst: string;
  };
  generatedAt: string;
}

export interface SatelliteDataset {
  [districtId: string]: DistrictSatelliteRecord | SatelliteDatasetMeta;
  _meta: SatelliteDatasetMeta;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split(/\r?\n/);
  const parseLine = (text: string): string[] => {
    const result: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += c;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const header = parseLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const obj: Record<string, string> = {};
    for (let j = 0; j < header.length; j++) {
      obj[header[j]] = values[j] ?? '';
    }
    rows.push(obj);
  }
  return rows;
}

export function importAppeearsData(): SatelliteDataset {
  const appeearsDir = resolve(rootDir, 'docs/data/appeears');

  // Load Request Metadata
  const requestJsonPath = resolve(appeearsDir, 'agriorbit-bd-districts-oct2026-request.json');
  const requestData = JSON.parse(readFileSync(requestJsonPath, 'utf8'));

  // 1. Parse MOD13Q1 (NDVI)
  const mod13CsvPath = resolve(appeearsDir, 'agriorbit-bd-districts-oct2026-MOD13Q1-061-results.csv');
  const mod13Rows = parseCsv(readFileSync(mod13CsvPath, 'utf8'));
  const ndviByDistrict: Record<string, NdviData[]> = {};
  for (const row of mod13Rows) {
    const id = row.ID;
    if (!ndviByDistrict[id]) ndviByDistrict[id] = [];
    const val = parseFloat(row.MOD13Q1_061__250m_16_days_NDVI);
    const qa = parseInt(row.MOD13Q1_061__250m_16_days_pixel_reliability, 10);
    const date = row.Date;
    if (!isNaN(val) && (qa === 0 || qa === 1)) {
      ndviByDistrict[id].push({
        value: Math.round(val * 10000) / 10000,
        periodStart: date,
        reliability: qa,
      });
    }
  }

  // 2. Parse MOD11A2 (LST Day & Night)
  const mod11CsvPath = resolve(appeearsDir, 'agriorbit-bd-districts-oct2026-MOD11A2-061-results.csv');
  const mod11Rows = parseCsv(readFileSync(mod11CsvPath, 'utf8'));
  const lstDayByDistrict: Record<string, LstData[]> = {};
  const lstNightByDistrict: Record<string, LstData[]> = {};
  for (const row of mod11Rows) {
    const id = row.ID;
    const date = row.Date;

    // Day LST
    const dayK = parseFloat(row.MOD11A2_061_LST_Day_1km);
    const dayModland = row.MOD11A2_061_QC_Day_MODLAND;
    const dayErr = row.MOD11A2_061_QC_Day_LST_Error_Flag;
    const dayValid =
      !isNaN(dayK) &&
      dayK > 0 &&
      (dayModland === '0b00' || (dayModland === '0b01' && (dayErr === '0b00' || dayErr === '0b01')));
    if (dayValid) {
      if (!lstDayByDistrict[id]) lstDayByDistrict[id] = [];
      lstDayByDistrict[id].push({
        value: Math.round((dayK - 273.15) * 10) / 10,
        periodStart: date,
      });
    }

    // Night LST
    const nightK = parseFloat(row.MOD11A2_061_LST_Night_1km);
    const nightModland = row.MOD11A2_061_QC_Night_MODLAND;
    const nightErr = row.MOD11A2_061_QC_Night_LST_Error_Flag;
    const nightValid =
      !isNaN(nightK) &&
      nightK > 0 &&
      (nightModland === '0b00' || (nightModland === '0b01' && (nightErr === '0b00' || nightErr === '0b01')));
    if (nightValid) {
      if (!lstNightByDistrict[id]) lstNightByDistrict[id] = [];
      lstNightByDistrict[id].push({
        value: Math.round((nightK - 273.15) * 10) / 10,
        periodStart: date,
      });
    }
  }

  // 3. Parse SPL3SMP_E-006 (Soil Moisture)
  const smapCsvPath = resolve(appeearsDir, 'agriorbit-bd-districts-oct2026-SPL3SMP-E-006-results.csv');
  const smapRows = parseCsv(readFileSync(smapCsvPath, 'utf8'));

  // Calculate 14-day window from available data
  const allSmapDates = Array.from(new Set(smapRows.map((r) => r.Date))).sort();
  const last14SmapDates = allSmapDates.slice(-14);
  const cutoffDate = last14SmapDates[0]; // 14-day boundary

  const smapByDistrict: Record<
    string,
    { date: string; amVal: number; pmVal: number; amValid: boolean; pmValid: boolean }[]
  > = {};

  for (const row of smapRows) {
    const id = row.ID;
    if (!smapByDistrict[id]) smapByDistrict[id] = [];

    const date = row.Date;
    const amVal = parseFloat(row.SPL3SMP_E_006_Soil_Moisture_Retrieval_Data_AM_soil_moisture);
    const pmVal = parseFloat(row.SPL3SMP_E_006_Soil_Moisture_Retrieval_Data_PM_soil_moisture_pm);
    const amQual = row.SPL3SMP_E_006_Soil_Moisture_Retrieval_Data_AM_retrieval_qual_flag_Recommended_Quality_Description;
    const pmQual = row.SPL3SMP_E_006_Soil_Moisture_Retrieval_Data_PM_retrieval_qual_flag_pm_Recommended_Quality_Description;

    const amValid =
      !isNaN(amVal) && amVal >= 0.02 && amVal <= 0.6 && !!amQual && amQual.includes('has recommended quality');
    const pmValid =
      !isNaN(pmVal) && pmVal >= 0.02 && pmVal <= 0.6 && !!pmQual && pmQual.includes('has recommended quality');

    smapByDistrict[id].push({
      date,
      amVal,
      pmVal,
      amValid,
      pmValid,
    });
  }

  const dataset: SatelliteDataset = {
    _meta: {
      request: requestData.task_name ?? 'agriorbit_bd_districts_oct2026',
      requestId: requestData.task_id ?? '3d27655e-9af7-4df5-a83d-9785ec7600b9',
      pointType: 'district_hq',
      products: {
        smap: 'SPL3SMP_E.006',
        ndvi: 'MOD13Q1.061',
        lst: 'MOD11A2.061',
      },
      generatedAt: new Date().toISOString(),
    },
  };

  for (const district of BD_DISTRICTS) {
    const id = district.id;

    // NDVI (latest 16-day period meeting QA 0 or 1)
    const ndviRecords = (ndviByDistrict[id] || []).sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const latestNdvi = ndviRecords[0] ?? null;

    // LST Day (latest 8-day composite meeting QA)
    const lstDayRecords = (lstDayByDistrict[id] || []).sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const latestLstDay = lstDayRecords[0] ?? null;

    // LST Night (latest 8-day composite meeting QA)
    const lstNightRecords = (lstNightByDistrict[id] || []).sort((a, b) => b.periodStart.localeCompare(a.periodStart));
    const latestLstNight = lstNightRecords[0] ?? null;

    // SMAP (latest recommended retrieval in the last 14 days of data: AM first, then PM)
    const districtSmapRecords = smapByDistrict[id] || [];
    const recentSmap = districtSmapRecords
      .filter((r) => r.date >= cutoffDate)
      .sort((a, b) => b.date.localeCompare(a.date));

    let chosenSmap: { value: number; date: string; pass: 'AM' | 'PM' } | null = null;
    let recentCount = 0;

    for (const r of recentSmap) {
      if (r.amValid) recentCount++;
      if (r.pmValid) recentCount++;
      if (!chosenSmap) {
        if (r.amValid) {
          chosenSmap = {
            value: Math.round(r.amVal * 10000) / 10000,
            date: r.date,
            pass: 'AM',
          };
        } else if (r.pmValid) {
          chosenSmap = {
            value: Math.round(r.pmVal * 10000) / 10000,
            date: r.date,
            pass: 'PM',
          };
        }
      }
    }

    const smapData: SmapData | null = chosenSmap
      ? {
          ...chosenSmap,
          recentCount,
          ...(chosenSmap.value > 0.5 ? { flag: 'possible_water_contamination' as const } : {}),
        }
      : null;

    dataset[id] = {
      smap: smapData,
      ndvi: latestNdvi,
      lstDay: latestLstDay,
      lstNight: latestLstNight,
    };
  }

  return dataset;
}

export function formatDistrictTable(dataset: SatelliteDataset): { table: string; nullCounts: Record<string, number> } {
  const lines: string[] = [];
  lines.push('| District | SMAP (date, pass) | NDVI (period) | LST Day | LST Night |');
  lines.push('| :--- | :--- | :--- | :--- | :--- |');

  let nullSmap = 0;
  let nullNdvi = 0;
  let nullLstDay = 0;
  let nullLstNight = 0;

  for (const district of BD_DISTRICTS) {
    const data = dataset[district.id] as DistrictSatelliteRecord | undefined;
    const smapStr = data?.smap
      ? `${data.smap.value} (${data.smap.date}, ${data.smap.pass})`
      : 'null';
    const ndviStr = data?.ndvi
      ? `${data.ndvi.value} (${data.ndvi.periodStart})`
      : 'null';
    const lstDayStr = data?.lstDay
      ? `${data.lstDay.value}°C (${data.lstDay.periodStart})`
      : 'null';
    const lstNightStr = data?.lstNight
      ? `${data.lstNight.value}°C (${data.lstNight.periodStart})`
      : 'null';

    if (!data?.smap) nullSmap++;
    if (!data?.ndvi) nullNdvi++;
    if (!data?.lstDay) nullLstDay++;
    if (!data?.lstNight) nullLstNight++;

    lines.push(`| ${district.nameEn} (\`${district.id}\`) | ${smapStr} | ${ndviStr} | ${lstDayStr} | ${lstNightStr} |`);
  }

  return {
    table: lines.join('\n'),
    nullCounts: {
      smap: nullSmap,
      ndvi: nullNdvi,
      lstDay: nullLstDay,
      lstNight: nullLstNight,
    },
  };
}

// Execute CLI run
if (process.argv[1] && process.argv[1].endsWith('import-appeears.ts')) {
  console.log('Ingesting NASA AppEEARS observations for all 64 districts...');
  const dataset = importAppeearsData();
  const outputPath = resolve(rootDir, 'src/data/satellite.json');
  writeFileSync(outputPath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`✓ Wrote satellite dataset to ${outputPath}`);

  const { table, nullCounts } = formatDistrictTable(dataset);
  console.log('\n--- OBSERVATION TABLE FOR ALL 64 DISTRICTS ---\n');
  console.log(table);
  console.log('\n--- NULL COUNTS PER LAYER ---');
  console.log(`SMAP: ${nullCounts.smap} nulls / 64 (${64 - nullCounts.smap} valid)`);
  console.log(`NDVI: ${nullCounts.ndvi} nulls / 64 (${64 - nullCounts.ndvi} valid)`);
  console.log(`LST Day: ${nullCounts.lstDay} nulls / 64 (${64 - nullCounts.lstDay} valid)`);
  console.log(`LST Night: ${nullCounts.lstNight} nulls / 64 (${64 - nullCounts.lstNight} valid)`);
}
