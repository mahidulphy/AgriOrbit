// Loads data for a district or upazila with a 4-level safety net:
//   1. CLIENT 24H CACHE — localStorage cache per upazila / district
//   2. LIVE — NASA POWER + Open-Meteo at upazila centroid, straight from the internet
//   3. PUBLIC CACHE — public/cache/<district>.json
//   4. BUNDLED — Rangpur snapshot compiled into the app (only used for Rangpur)

import { fetchAll, type LocationCache } from './power.ts';
import { getDistrictAdmin } from '../data/districts.ts';
import { getUpazila, DISTRICT_WIDE_UPAZILA } from './location.ts';
import type { DistrictId } from '../data/bdAdmin.ts';
import fallbackRangpur from '../data/fallback-rangpur.json';

export type DataMode = 'live' | 'cache' | 'bundled' | 'unavailable';

export interface LoadedData {
  data: LocationCache;
  mode: DataMode;
  error?: string;
  sourceNote?: string;
}

export const BUNDLED_RANGPUR = fallbackRangpur as LocationCache;

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

export async function loadLocationData(
  districtId: string,
  upazilaId?: string,
  customLat?: number,
  customLon?: number,
  offline = false,
): Promise<LoadedData> {
  const d = getDistrictAdmin(districtId);
  const isRangpur = districtId === 'rangpur' || d?.id === 'rangpur';
  const hasSpecificUpazila = Boolean(upazilaId && upazilaId !== DISTRICT_WIDE_UPAZILA);

  // 1. Resolve exact target coordinates & name
  let targetLat = customLat;
  let targetLon = customLon;
  let targetName = d ? d.nameEn : districtId;

  if (hasSpecificUpazila && d) {
    const upz = getUpazila(d.id as DistrictId, upazilaId);
    if (upz && upz.lat && upz.lng) {
      targetLat = upz.lat;
      targetLon = upz.lng;
      targetName = `${d.nameEn} - ${upz.nameEn}`;
    }
  }

  if (targetLat === undefined || targetLon === undefined) {
    if (d) {
      targetLat = d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2));
      targetLon = d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2));
    } else {
      targetLat = 23.685;
      targetLon = 90.3563;
    }
  }

  const cacheKey = hasSpecificUpazila
    ? `agriorbit_cache_upz_${districtId}_${upazilaId}`
    : `agriorbit_cache_dist_${districtId}`;

  // 2. Check 24-hour browser localStorage cache
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cachedObj = JSON.parse(cachedStr) as LocationCache;
        const fetchedTime = new Date(cachedObj.fetchedAt).getTime();
        const ageMs = Date.now() - fetchedTime;
        if (!isNaN(fetchedTime) && ageMs < TWENTY_FOUR_HOURS_MS) {
          return {
            data: cachedObj,
            mode: 'cache',
            sourceNote: `Cached on-demand upazila observation (${Math.round(ageMs / 3600000)}h ago)`,
          };
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }

  // 3. Live on-demand fetch from NASA POWER + Open-Meteo (8s timeout)
  if (!offline) {
    try {
      const liveData = await fetchAll(targetName, Number(targetLat.toFixed(4)), Number(targetLon.toFixed(4)), 8000);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(liveData));
        } catch {
          // ignore quota exceeded
        }
      }
      return {
        data: liveData,
        mode: 'live',
        sourceNote: hasSpecificUpazila ? 'Live NASA POWER + Open-Meteo at upazila centroid' : 'Live at district HQ',
      };
    } catch {
      // fall through to fallback cache
    }
  }

  // 4. Stale browser cache fallback
  if (typeof window !== 'undefined') {
    try {
      const cachedStr = localStorage.getItem(cacheKey);
      if (cachedStr) {
        const cachedObj = JSON.parse(cachedStr) as LocationCache;
        return {
          data: cachedObj,
          mode: 'cache',
          sourceNote: 'Stale offline upazila cache',
        };
      }
    } catch {
      // ignore
    }
  }

  // 5. Pre-built public district cache /cache/<district>.json
  if (d) {
    try {
      const res = await fetch(`/cache/${d.id}.json`);
      if (res.ok) {
        const distCache = await res.json();
        return {
          data: distCache,
          mode: 'cache',
          sourceNote: hasSpecificUpazila ? 'District baseline fallback for upazila' : 'District pre-built cache',
        };
      }
    } catch {
      // fall through
    }
  }

  // 6. Bundled fallback for Rangpur only
  if (isRangpur) {
    return {
      data: BUNDLED_RANGPUR,
      mode: 'bundled',
      sourceNote: 'Bundled Rangpur benchmark',
    };
  }

  return {
    data: null as any,
    mode: 'unavailable',
    error: `Data unavailable for ${targetName}`,
  };
}

export async function loadDistrict(districtId: string, offline = false): Promise<LoadedData> {
  return loadLocationData(districtId, undefined, undefined, undefined, offline);
}
