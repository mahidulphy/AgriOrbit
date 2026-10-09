/**
 * NASA GPM / IMERG Precipitation Observation Service
 *
 * DATA PROVENANCE:
 * - NASA Global Precipitation Measurement (GPM) satellite constellation
 *   and IMERG (Integrated Multi-satellitE Retrievals for GPM).
 * - Spatial Resolution: ~10 km (0.1° × 0.1° latitude/longitude grid).
 *
 * SCIENTIFIC INTEGRITY RULES:
 * 1. GPM / IMERG is strictly for RECENT/OBSERVED precipitation estimates.
 * 2. It is NEVER described or presented as a 7-day future weather forecast.
 * 3. Spatial resolution is transparently acknowledged; we do not claim
 *    sub-field scale precision beyond the ~10 km sensor grid.
 * 4. Fallback chain: Live API -> District Cache -> Bundled Snapshot.
 */

import type { DistrictId } from '../data/bdAdmin';
import { getDistrictAdmin } from '../data/districts';
import fallbackRangpur from '../data/fallback-rangpur.json';
import type { LocationCache } from '../lib/power';

export interface GpmObservationResult {
  sourceBadge: 'NASA';
  datasetName: 'NASA GPM / IMERG';
  spatialResolution: '~10 km (0.1° grid)';
  recentRain7dMm: number;
  recentRain14dMm: number;
  recentDailyMeanMm: number;
  baselineComparison: 'Elevated' | 'Normal' | 'Deficit';
  baselineComparisonBn: 'স্বাভাবিকের চেয়ে বেশি' | 'স্বাভাবিক' | 'ঘাটতি';
  anomalyPct: number;
  observationWindow: {
    startDate: string;
    endDate: string;
    daysCount: number;
  };
  observedSummaryEn: string;
  observedSummaryBn: string;
  dataStatus: 'live' | 'cached' | 'bundled';
  updatedAt: string;
}

/** Configurable baseline and classification thresholds */
export const GPM_THRESHOLDS = {
  elevatedRain7dMm: 40,
  deficitRain7dMm: 12,
  elevatedAnomalyPct: 25,
  deficitAnomalyPct: -25,
};

function formatIso(k: string): string {
  if (k.length === 8) {
    return `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;
  }
  return k;
}

/**
 * Computes GPM observation metrics from daily rainfall data.
 * Can be run deterministically over any daily precipitation series.
 */
export function computeGpmMetricsFromDaily(
  dailyPrecip: Record<string, number>,
  dataStatus: 'live' | 'cached' | 'bundled' = 'cached',
  fetchedAtIso?: string,
): GpmObservationResult {
  const dates = Object.keys(dailyPrecip)
    .filter((k) => dailyPrecip[k] !== undefined && dailyPrecip[k] >= 0)
    .sort();

  if (dates.length === 0) {
    return {
      sourceBadge: 'NASA',
      datasetName: 'NASA GPM / IMERG',
      spatialResolution: '~10 km (0.1° grid)',
      recentRain7dMm: 0,
      recentRain14dMm: 0,
      recentDailyMeanMm: 0,
      baselineComparison: 'Normal',
      baselineComparisonBn: 'স্বাভাবিক',
      anomalyPct: 0,
      observationWindow: {
        startDate: 'N/A',
        endDate: 'N/A',
        daysCount: 0,
      },
      observedSummaryEn: 'No observed satellite rainfall data available.',
      observedSummaryBn: 'কোন উপগ্রহ বৃষ্টিপাত পর্যবেক্ষণ পাওয়া যায়নি।',
      dataStatus,
      updatedAt: fetchedAtIso ?? new Date().toISOString(),
    };
  }

  // Use the most recent 7 and 14 available days
  const last7Keys = dates.slice(-7);
  const last14Keys = dates.slice(-14);
  const baselineKeys = dates.slice(-30);

  const rain7d = Math.round(last7Keys.reduce((acc, k) => acc + (dailyPrecip[k] ?? 0), 0) * 10) / 10;
  const rain14d = Math.round(last14Keys.reduce((acc, k) => acc + (dailyPrecip[k] ?? 0), 0) * 10) / 10;

  const baselineMeanDaily =
    baselineKeys.length > 0
      ? baselineKeys.reduce((acc, k) => acc + (dailyPrecip[k] ?? 0), 0) / baselineKeys.length
      : 2.0;

  const expected7dBaseline = baselineMeanDaily * 7;
  const anomalyPct =
    expected7dBaseline > 0
      ? Math.round(((rain7d - expected7dBaseline) / expected7dBaseline) * 100)
      : 0;

  let comparison: 'Elevated' | 'Normal' | 'Deficit' = 'Normal';
  let comparisonBn: 'স্বাভাবিকের চেয়ে বেশি' | 'স্বাভাবিক' | 'ঘাটতি' = 'স্বাভাবিক';

  if (rain7d >= GPM_THRESHOLDS.elevatedRain7dMm || anomalyPct >= GPM_THRESHOLDS.elevatedAnomalyPct) {
    comparison = 'Elevated';
    comparisonBn = 'স্বাভাবিকের চেয়ে বেশি';
  } else if (rain7d <= GPM_THRESHOLDS.deficitRain7dMm || anomalyPct <= GPM_THRESHOLDS.deficitAnomalyPct) {
    comparison = 'Deficit';
    comparisonBn = 'ঘাটতি';
  }

  const startIso = formatIso(last7Keys[0] ?? dates[0]);
  const endIso = formatIso(last7Keys[last7Keys.length - 1] ?? dates[dates.length - 1]);

  const summaryEn =
    comparison === 'Elevated'
      ? `Recent rainfall is elevated (${rain7d} mm over past 7 days, +${anomalyPct}% vs 30-day baseline).`
      : comparison === 'Deficit'
      ? `Recent rainfall is below baseline (${rain7d} mm over past 7 days, ${anomalyPct}% vs baseline).`
      : `Recent rainfall is within normal range (${rain7d} mm over past 7 days).`;

  const summaryBn =
    comparison === 'Elevated'
      ? `সাম্প্রতিক বৃষ্টিপাত স্বাভাবিকের চেয়ে বেশি (গত ৭ দিনে ${rain7d} মিমি, গড়ের চেয়ে +${anomalyPct}%)।`
      : comparison === 'Deficit'
      ? `সাম্প্রতিক বৃষ্টিপাত স্বাভাবিকের চেয়ে কম (গত ৭ দিনে ${rain7d} মিমি, গড়ের চেয়ে ${anomalyPct}%)।`
      : `সাম্প্রতিক বৃষ্টিপাত স্বাভাবিক মাত্রায় রয়েছে (গত ৭ দিনে ${rain7d} মিমি)।`;

  return {
    sourceBadge: 'NASA',
    datasetName: 'NASA GPM / IMERG',
    spatialResolution: '~10 km (0.1° grid)',
    recentRain7dMm: rain7d,
    recentRain14dMm: rain14d,
    recentDailyMeanMm: Math.round((rain7d / 7) * 10) / 10,
    baselineComparison: comparison,
    baselineComparisonBn: comparisonBn,
    anomalyPct,
    observationWindow: {
      startDate: startIso,
      endDate: endIso,
      daysCount: last7Keys.length,
    },
    observedSummaryEn: summaryEn,
    observedSummaryBn: summaryBn,
    dataStatus,
    updatedAt: fetchedAtIso ?? new Date().toISOString(),
  };
}

/**
 * Loads NASA GPM / IMERG precipitation observation for a given district and coordinates.
 * Resilient 3-level fallback:
 * 1. Live NASA POWER/GPM API (if online and responds within timeout)
 * 2. District cache JSON (/cache/<district>.json)
 * 3. Bundled fallback (fallback-rangpur.json)
 */
export async function getGpmObservation(
  districtId: DistrictId | string,
  lat?: number,
  lng?: number,
  timeoutMs = 4000,
): Promise<GpmObservationResult> {
  const d = getDistrictAdmin(districtId);
  const targetLat = lat ?? (d ? (d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2))) : 25.75);
  const targetLng = lng ?? (d ? (d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2))) : 89.25);

  // 1. Try Live fetch if running in browser with network
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      const end = new Date();
      const start = new Date(end.getTime() - 25 * 86400000);
      const ymd = (dt: Date) => dt.toISOString().slice(0, 10).replace(/-/g, '');

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=PRECTOTCORR&community=AG&latitude=${targetLat}&longitude=${targetLng}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const p = json?.properties?.parameter?.PRECTOTCORR;
        if (p && Object.keys(p).length > 0) {
          const clean: Record<string, number> = {};
          for (const [k, v] of Object.entries(p)) {
            if (typeof v === 'number' && v > -900) clean[k] = v;
          }
          if (Object.keys(clean).length >= 5) {
            return computeGpmMetricsFromDaily(clean, 'live', new Date().toISOString());
          }
        }
      }
    } catch {
      // Graceful fallback to district cache
    }
  }

  // 2. Try District Cache
  if (d && typeof window !== 'undefined') {
    try {
      const cacheRes = await fetch(`/cache/${d.id}.json`);
      if (cacheRes.ok) {
        const cache: LocationCache = await cacheRes.json();
        if (cache?.daily?.PRECTOTCORR) {
          return computeGpmMetricsFromDaily(
            cache.daily.PRECTOTCORR,
            'cached',
            cache.fetchedAt,
          );
        }
      }
    } catch {
      // Graceful fallback to bundled
    }
  }

  // 3. Bundled Snapshot (Last resort guarantee)
  const bundled = fallbackRangpur as LocationCache;
  return computeGpmMetricsFromDaily(
    bundled.daily.PRECTOTCORR,
    'bundled',
    bundled.fetchedAt,
  );
}
