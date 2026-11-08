/**
 * api/sync-jaxa.ts
 *
 * Vercel Serverless Function / Daily Cron for JAXA GSMaP v8 rainfall & AMSR2 soil moisture sync.
 * Runs server-side. Keeps JAXA API credentials in server environment variables (JAXA_EARTH_API_KEY).
 * Saves fresh per-district observations to Supabase / storage cache.
 */

import { getJaxaCredentials, queryJaxaObservations } from '../scripts/fetch-jaxa';
import { BD_DISTRICTS } from '../src/data/districts';

export default async function handler(req: any, res?: any) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers?.authorization;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (res && typeof res.status === 'function') {
      return res.status(401).json({ error: 'Unauthorized: invalid or missing CRON_SECRET' });
    }
    return new Response(JSON.stringify({ error: 'Unauthorized: invalid or missing CRON_SECRET' }), { status: 401 });
  }

  const creds = getJaxaCredentials();
  if (!creds) {
    const payload = {
      status: 'skipped',
      message: 'JAXA_EARTH_API_KEY not configured. Preserving latest snapshot.',
    };
    if (res && typeof res.status === 'function') {
      return res.status(200).json(payload);
    }
    return new Response(JSON.stringify(payload), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  try {
    const districtQuery = typeof req.query?.district === 'string' ? req.query.district.toLowerCase() : null;
    const targets = districtQuery
      ? BD_DISTRICTS.filter((d) => d.id === districtQuery)
      : [BD_DISTRICTS.find((d) => d.id === 'rangpur')!];

    const results: Record<string, any> = {};

    for (const d of targets) {
      if (!d) continue;
      const data = await queryJaxaObservations(creds.apiKey, d.lat, d.lng);
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
    const errorPayload = { error: err?.message || 'JAXA sync failed' };
    if (res && typeof res.status === 'function') {
      return res.status(500).json(errorPayload);
    }
    return new Response(JSON.stringify(errorPayload), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
