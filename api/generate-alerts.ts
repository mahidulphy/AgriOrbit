import { processGenerateAlerts } from '../src/lib/alertGenerator.ts';

export default async function handler(req: any, res?: any) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;

  // Support both Web standard Request/Response and Node.js IncomingMessage/ServerResponse
  if (res && typeof res.status === 'function') {
    try {
      const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
      const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true';
      const authHeader = req.headers.authorization || req.headers.Authorization;

      const result = await processGenerateAlerts({
        authHeader,
        dryRun,
        supabaseUrl,
      });

      return res.status(result.status).json(result.body);
    } catch (err: any) {
      console.error('Serverless generate-alerts exception:', err);
      return res.status(500).json({ error: err?.message || 'Internal server error' });
    }
  } else {
    try {
      const url = new URL(req.url);
      const dryRun = url.searchParams.get('dryRun') === '1' || url.searchParams.get('dryRun') === 'true';
      const authHeader = req.headers?.get ? req.headers.get('authorization') : req.headers?.authorization;

      const result = await processGenerateAlerts({
        authHeader,
        dryRun,
        supabaseUrl,
      });

      return new Response(JSON.stringify(result.body), {
        status: result.status,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err: any) {
      console.error('Web Request generate-alerts exception:', err);
      return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}
