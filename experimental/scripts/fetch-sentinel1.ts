/**
 * scripts/fetch-sentinel1.ts
 *
 * Server-side synchronization job for ESA Sentinel-1 (C-SAR radar) flood and waterlogging detection.
 * Uses Copernicus Data Space Ecosystem (CDSE) / Sentinel Hub Statistical API.
 * Computes the percentage of cropland with low VV backscatter (< -15 dB) over the last 12 days.
 *
 * Usage:
 *   npx tsx scripts/fetch-sentinel1.ts                 # Rangpur only
 *   npx tsx scripts/fetch-sentinel1.ts --all           # All 64 districts
 *
 * Credentials required in env (Vercel serverless / local):
 *   CDSE_CLIENT_ID or SENTINEL_HUB_CLIENT_ID
 *   CDSE_CLIENT_SECRET or SENTINEL_HUB_CLIENT_SECRET
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { BD_DISTRICTS } from '../src/data/districts.ts';
import type { Sentinel1Record } from '../src/data/satellite.ts';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const k = trimmed.slice(0, idx).trim();
      const v = trimmed.slice(idx + 1).trim();
      if (!process.env[k]) process.env[k] = v;
    }
  }
}

const CDSE_TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token';
const CDSE_STATS_URL = 'https://sh.dataspace.copernicus.eu/api/v1/statistics';

export interface CdseCredentials {
  clientId: string;
  clientSecret: string;
}

export function getCdseCredentials(): CdseCredentials | null {
  const clientId = process.env.CDSE_CLIENT_ID || process.env.SENTINEL_HUB_CLIENT_ID;
  const clientSecret = process.env.CDSE_CLIENT_SECRET || process.env.SENTINEL_HUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return { clientId, clientSecret };
}

export async function fetchCdseToken(creds: CdseCredentials): Promise<string> {
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', creds.clientId);
  params.append('client_secret', creds.clientSecret);

  const res = await fetch(CDSE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`CDSE token request failed (${res.status}): ${await res.text()}`);
  }

  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const waitTime = (i + 1) * 3500;
      console.log(`    [CDSE] Rate limit 429 hit. Backing off ${waitTime / 1000}s...`);
      await new Promise((r) => setTimeout(r, waitTime));
      continue;
    }
    return res;
  }
  return fetch(url, options);
}

export async function querySentinel1FloodedCroplandPct(
  token: string,
  lat: number,
  lng: number,
  deltaDeg = 0.15
): Promise<{ floodedPct: number; startDate: string; endDate: string }> {
  const now = new Date();
  const endDate = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - 12 * 86400000);
  const startDate = start.toISOString().slice(0, 10);

  const bbox = [lng - deltaDeg, lat - deltaDeg, lng + deltaDeg, lat + deltaDeg];

  // Evalscript: C-SAR VV linear backscatter < 0.03 (~ -15.2 dB) indicates standing water / surface flooding
  const evalscript = `//VERSION=3
function setup() {
  return {
    input: [{ bands: ["VV", "dataMask"] }],
    output: [
      { id: "default", bands: 1, sampleType: "FLOAT32" },
      { id: "dataMask", bands: 1, sampleType: "UINT8" }
    ]
  };
}
function evaluatePixel(samples) {
  // VV backscatter < 0.03 (-15.2 dB) indicates smooth water specular reflection
  var isWater = (samples.VV > 0 && samples.VV < 0.03) ? 1.0 : 0.0;
  return {
    default: [isWater],
    dataMask: [samples.dataMask]
  };
}`;

  const body = {
    input: {
      bounds: {
        bbox,
        properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
      },
      data: [
        {
          type: 'sentinel-1-grd',
          dataFilter: {
            timeRange: { from: `${startDate}T00:00:00Z`, to: `${endDate}T23:59:59Z` },
            acquisitionMode: 'IW',
            polarization: 'DV',
          },
        },
      ],
    },
    aggregation: {
      timeRange: { from: `${startDate}T00:00:00Z`, to: `${endDate}T23:59:59Z` },
      aggregationInterval: { of: 'P12D' },
      evalscript,
    },
    calculations: {
      default: {},
    },
  };

  const res = await fetchWithRetry(CDSE_STATS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`CDSE statistics call failed (${res.status}): ${await res.text()}`);
  }

  const result = (await res.json()) as any;
  const mean = result?.data?.[0]?.outputs?.default?.bands?.B0?.stats?.mean ?? 0;
  const floodedPct = Math.min(100, Math.max(0, Number((mean * 100).toFixed(1))));

  return { floodedPct, startDate, endDate };
}

export async function runSentinel1Sync(targets: readonly any[] = BD_DISTRICTS) {
  const creds = getCdseCredentials();

  if (!creds) {
    console.log(
      'ℹ CDSE credentials (CDSE_CLIENT_ID, CDSE_CLIENT_SECRET) not found in environment.\n' +
      '  Preserving verified local satellite snapshot without network calls.'
    );
    return;
  }

  try {
    const token = await fetchCdseToken(creds);
    console.log('✓ Successfully authenticated with Copernicus Data Space Ecosystem (CDSE).');

    const sat = JSON.parse(readFileSync('src/data/satellite.json', 'utf8'));

    for (const d of targets) {
      try {
        const { floodedPct, startDate, endDate } = await querySentinel1FloodedCroplandPct(
          token,
          d.lat,
          d.lng
        );

        const status =
          floodedPct > 20
            ? 'severe_inundation'
            : floodedPct > 10
            ? 'moderate_waterlogging'
            : 'normal';

        const rec: Sentinel1Record = {
          floodedCroplandPct: floodedPct,
          observationWindow: {
            startDate,
            endDate,
            daysCount: 12,
          },
          polarization: 'VV',
          resolutionMeters: 10,
          status,
          statusEn:
            status === 'normal'
              ? `${floodedPct}% normal cropland drainage`
              : `${floodedPct}% cropland waterlogged / flooded`,
          statusBn:
            status === 'normal'
              ? `${floodedPct}% স্বাভাবিক নিষ্কাশন অবস্থা`
              : `${floodedPct}% ফসলি জমিতে জলাবদ্ধতা শনাক্ত`,
          observedAt: endDate,
          source: 'ESA Sentinel-1 C-SAR',
        };

        if (!sat[d.id]) sat[d.id] = {};
        sat[d.id].sentinel1 = rec;
        console.log(`✓ ${d.nameEn}: ${floodedPct}% flooded (Sentinel-1 SAR)`);
        await new Promise((r) => setTimeout(r, 800));
      } catch (err) {
        console.warn(`✗ ${d.nameEn} Sentinel-1 sync skipped: ${(err as Error).message}`);
      }
    }

    sat._meta.products.sentinel1 = 'ESA Sentinel-1 C-SAR IW GRD (10m)';
    sat._meta.lastSentinel1Sync = new Date().toISOString();
    writeFileSync('src/data/satellite.json', JSON.stringify(sat, null, 2), 'utf8');
    console.log('✓ Updated src/data/satellite.json with fresh Sentinel-1 observations.');
  } catch (err) {
    console.warn(`CDSE Sentinel-1 sync aborted: ${(err as Error).message}`);
  }
}

// Direct CLI invocation
const isMain = process.argv[1]?.endsWith('fetch-sentinel1.ts');
if (isMain) {
  const isAll = process.argv.includes('--all');
  const targets = isAll ? BD_DISTRICTS : BD_DISTRICTS.filter((d) => d.id === 'rangpur');
  runSentinel1Sync(targets);
}
