// Loads data for a district with a 3-level safety net, so the demo never
// shows a blank screen:
//   1. LIVE   — NASA POWER + Open-Meteo, straight from the internet
//   2. CACHE  — public/cache/<district>.json (refresh: node scripts/fetch-cache.ts --all)
//   3. BUNDLED — Rangpur snapshot compiled into the app (only used for Rangpur)

import { fetchAll, type LocationCache } from './power.ts';
import { getDistrictAdmin } from '../data/districts.ts';
import fallbackRangpur from '../data/fallback-rangpur.json';

export type DataMode = 'live' | 'cache' | 'bundled' | 'unavailable';

export interface LoadedData {
  data: LocationCache;
  mode: DataMode;
  error?: string;
}

export const BUNDLED_RANGPUR = fallbackRangpur as LocationCache;

export async function loadDistrict(districtId: string, offline = false): Promise<LoadedData> {
  const d = getDistrictAdmin(districtId);
  const isRangpur = districtId === 'rangpur' || d?.id === 'rangpur';

  if (!offline && d) {
    try {
      const lat = d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2));
      const lon = d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2));
      return { data: await fetchAll(d.nameEn, lat, lon, 8000), mode: 'live' };
    } catch {
      // fall through to cache
    }
  }

  if (d) {
    try {
      const res = await fetch(`/cache/${d.id}.json`);
      if (res.ok) return { data: await res.json(), mode: 'cache' };
    } catch {
      // fall through to bundled if Rangpur
    }
  }

  // Never show fallback-rangpur.json for another district; show "Data unavailable for <district>"
  if (isRangpur) {
    return { data: BUNDLED_RANGPUR, mode: 'bundled' };
  }

  return {
    data: null as any,
    mode: 'unavailable',
    error: `Data unavailable for ${d ? d.nameEn : districtId}`,
  };
}
