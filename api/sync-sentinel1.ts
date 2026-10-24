/**
 * api/sync-sentinel1.ts
 *
 * Vercel Serverless Function / Daily Cron for ESA Sentinel-1 SAR flood & waterlogging sync.
 * Runs server-side. Keeps CDSE API keys in Vercel environment variables (CDSE_CLIENT_ID, CDSE_CLIENT_SECRET).
 * Saves fresh per-district observations to Supabase / storage cache.
 */

import { getCdseCredentials, fetchCdseToken, querySentinel1FloodedCroplandPct } from '../scripts/fetch-sentinel1';
import { BD_DISTRICTS } from '../src/data/districts';

export default async function handler(req: any, res?: any) {
  // Validate optional bearer CRON_SECRET for authorized invocation
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers?.authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (res && typeof res.status === 'function') {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing CRON_SECRET' });
    }
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing CRON_SECRET' }), { status: 401 });
  }

  const creds = getCdseCredentials();
  if (!creds) {
    const payload = {
      status: 'skipped',
      message: 'CDSE_CLIENT_ID and CDSE_CLIENT_SECRET not configured. Preserving latest snapshot.',
    };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const token = await fetchCdseToken(creds);
    const districtQuery = typeof req.query?.district === 'string' ? req.query.district.toLowerCase() : null;
    const targets = districtQuery
      ? BD_DISTRICTS.filter((d) => d.id === districtQuery)
      : [BD_DISTRICTS.find((d) => d.id === 'rangpur')!];

    const results: Record<string, any> = {};

    for (const d of targets) {
      if (!d) continue;
      const data = await querySentinel1FloodedCroplandPct(token, d.lat, d.lng);
      results[d.id] = data;
    }

    const payload = {
      status: 'success',
      timestamp: new Date().toISOString(),
      updatedDistricts: Object.keys(results),
      results,
    };

    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    const errorPayload = { error: err?.message || 'Sentinel-1 sync failed' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
