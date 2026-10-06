// Refreshes the OFFLINE cache so a live demo never shows a blank screen.
//
//   node scripts/fetch-cache.ts           -> Rangpur only (fast)
//   node scripts/fetch-cache.ts --all     -> all 64 districts (~3 min)
//
// Writes public/cache/<district>.json, and also src/data/fallback-rangpur.json
// (bundled into the app as the last-resort fallback).
// Requires Node 22.18+ / 24 (runs TypeScript directly).

import { mkdirSync, writeFileSync } from 'node:fs';
import { fetchAll } from '../src/lib/power.ts';
import { BD_DISTRICTS } from '../src/data/districts.ts';

const all = process.argv.includes('--all');
const targets = all ? BD_DISTRICTS : BD_DISTRICTS.filter((d) => d.id === 'rangpur');

mkdirSync('public/cache', { recursive: true });

for (const d of targets) {
  // Rangpur uses the project's focus point (25.75, 89.25); others use district HQ.
  const lat = d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2));
  const lon = d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2));
  try {
    const data = await fetchAll(d.nameEn, lat, lon, 60000);
    const json = JSON.stringify(data);
    writeFileSync(`public/cache/${d.id}.json`, json);
    if (d.id === 'rangpur') writeFileSync('src/data/fallback-rangpur.json', json);
    console.log(`✓ ${d.nameEn} (${(json.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`✗ ${d.nameEn}: ${(err as Error).message}`);
  }
  if (all) await new Promise((r) => setTimeout(r, 1500)); // be polite to NASA's servers
}
