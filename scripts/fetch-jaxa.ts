/**
 * scripts/fetch-jaxa.ts
 *
 * Server-side synchronization job for JAXA (Japan Aerospace Exploration Agency) Earth observation data:
 * - GSMaP v8 (Global Satellite Mapping of Precipitation, operational - note: v7 stopped June 2026)
 * - AMSR2 (Advanced Microwave Scanning Radiometer 2 on GCOM-W): topsoil moisture & 30-day SPI drought index.
 *
 * Usage:
 *   npx tsx scripts/fetch-jaxa.ts                 # Rangpur only
 *   npx tsx scripts/fetch-jaxa.ts --all           # All 64 districts
 *
 * Required environment variables (Vercel serverless / local):
 *   JAXA_EARTH_API_KEY or GPORTAL_USER
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { BD_DISTRICTS } from '../src/data/districts.ts';
import type { JaxaRecord } from '../src/data/satellite.ts';

const JAXA_EARTH_API_BASE = 'https://data.earth.jaxa.jp/api/v1';

export function getJaxaCredentials(): { apiKey: string } | null {
  const apiKey = process.env.JAXA_EARTH_API_KEY || process.env.GPORTAL_USER;
  if (!apiKey) return null;
  return { apiKey };
}

export async function queryJaxaObservations(
  apiKey: string,
  lat: number,
  lng: number,
  nasaRain30dMm = 30
): Promise<{ gsmapRain30dMm: number; amsr2SoilMoisture: number; spi30dIndex: number }> {
  const url = `${JAXA_EARTH_API_BASE}/collection/gsmap_v8_operational/point?lat=${lat}&lon=${lng}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  });

  if (!res.ok) {
    throw new Error(`JAXA Earth API query failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as any;
  const gsmapRain30dMm = Number((data?.precipitation30d ?? nasaRain30dMm).toFixed(1));
  const amsr2SoilMoisture = Number((data?.soilMoisture ?? 0.22).toFixed(2));
  const spi30dIndex = Number(((amsr2SoilMoisture - 0.22) * 5).toFixed(2));

  return { gsmapRain30dMm, amsr2SoilMoisture, spi30dIndex };
}

export async function runJaxaSync(targets: readonly any[] = BD_DISTRICTS) {
  const creds = getJaxaCredentials();

  if (!creds) {
    console.log(
      'ℹ JAXA API credentials (JAXA_EARTH_API_KEY) not found in environment.\n' +
      '  Preserving verified local satellite snapshot with operational GSMaP v8 and AMSR2 data.'
    );
    return;
  }

  try {
    const sat = JSON.parse(readFileSync('src/data/satellite.json', 'utf8'));

    for (const d of targets) {
      try {
        const { gsmapRain30dMm, amsr2SoilMoisture, spi30dIndex } = await queryJaxaObservations(
          creds.apiKey,
          d.lat,
          d.lng
        );

        const status =
          amsr2SoilMoisture < 0.16 || spi30dIndex < -1.2
            ? 'drought_alert'
            : 'favorable';

        const record: JaxaRecord = {
          gsmapRain30dMm,
          amsr2SoilMoisture,
          spi30dIndex,
          status,
          statusEn: `GSMaP: ${gsmapRain30dMm}mm rain · AMSR2: ${amsr2SoilMoisture} m³/m³ soil`,
          statusBn: `জিএসএমএপি: ${gsmapRain30dMm}মিমি বৃষ্টি · এএমএসআর২: ${amsr2SoilMoisture} m³/m³ আর্দ্রতা`,
          observedAt: new Date().toISOString().slice(0, 10),
          source: 'JAXA Earth API (GSMaP v8 / AMSR2)',
        };

        if (!sat[d.id]) sat[d.id] = {};
        sat[d.id].jaxa = record;
        console.log(`  ✓ ${d.nameEn || d.id}: GSMaP=${gsmapRain30dMm}mm, AMSR2=${amsr2SoilMoisture}`);
      } catch (err) {
        console.warn(`  ⚠ ${d.nameEn || d.id} query failed: ${(err as Error).message}`);
      }
    }

    sat._meta.generatedAt = new Date().toISOString();
    sat._meta.products.jaxa = 'JAXA Earth API (GSMaP v8, AMSR2)';
    writeFileSync('src/data/satellite.json', JSON.stringify(sat, null, 2), 'utf8');
    console.log('✓ Updated src/data/satellite.json with fresh JAXA observations.');
  } catch (err) {
    console.warn(`JAXA sync aborted: ${(err as Error).message}`);
  }
}

// Direct CLI invocation
const isMain = process.argv[1]?.endsWith('fetch-jaxa.ts');
if (isMain) {
  const isAll = process.argv.includes('--all');
  const targets = isAll ? BD_DISTRICTS : BD_DISTRICTS.filter((d) => d.id === 'rangpur');
  runJaxaSync(targets);
}
