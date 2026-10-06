// Loads data for a district with a 3-level safety net, so the demo never
// shows a blank screen:
//   1. LIVE   — NASA POWER + Open-Meteo, straight from the internet
//   2. CACHE  — public/cache/<district>.json (refresh: node scripts/fetch-cache.ts --all)
//   3. BUNDLED — Rangpur snapshot compiled into the app

import { fetchAll, type LocationCache } from './power.ts';
import { getDistrictAdmin } from '../data/districts.ts';
import fallbackRangpur from '../data/fallback-rangpur.json';

export type DataMode = 'live' | 'cache' | 'bundled';

export interface LoadedData {
  data: LocationCache;
  mode: DataMode;
}

export const BUNDLED_RANGPUR = fallbackRangpur as LocationCache;

export async function loadDistrict(districtId: string, offline = false): Promise<LoadedData> {
  const d = getDistrictAdmin(districtId);
  if (!d) return { data: BUNDLED_RANGPUR, mode: 'bundled' };

  if (!offline) {
    try {
      const lat = d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2));
      const lon = d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2));
      return { data: await fetchAll(d.nameEn, lat, lon, 8000), mode: 'live' };
    } catch {
      // fall through to cache
    }
  }

  try {
    const res = await fetch(`/cache/${d.id}.json`);
    if (res.ok) return { data: await res.json(), mode: 'cache' };
  } catch {
    // fall through to bundled
  }

  return { data: BUNDLED_RANGPUR, mode: 'bundled' };
}
