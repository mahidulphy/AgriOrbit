/**
 * Open-Meteo Weather Forecast Service
 *
 * DATA PROVENANCE:
 * - Open-Meteo short-term numerical weather forecast model (ECMWF / GFS blend).
 * - Spatial resolution: ~1–2 km interpolated local weather forecast.
 *
 * SCIENTIFIC INTEGRITY RULES:
 * 1. Open-Meteo provides the 7-DAY PRECIPITATION AND TEMPERATURE FORECAST.
 * 2. It is strictly credited to Open-Meteo.
 * 3. It is NEVER labeled or claimed as NASA data.
 * 4. Resilient fallback chain: Live API -> District Cache -> Bundled Snapshot.
 */

import type { DistrictId } from '../data/bdAdmin';
import { getDistrictAdmin } from '../data/districts';
import fallbackRangpur from '../data/fallback-rangpur.json';
import type { ForecastDay, LocationCache } from '../lib/power';

export interface WeatherForecastResult {
  sourceBadge: 'FORECAST';
  providerName: 'Open-Meteo';
  totalRain7dMm: number;
  rainDaysCount: number;
  peakRainMm: number;
  peakRainDate: string;
  hasHeavyRainRisk: boolean;
  forecastDays: ForecastDay[];
  forecastSummaryEn: string;
  forecastSummaryBn: string;
  dataStatus: 'live' | 'cached' | 'bundled';
  updatedAt: string;
}

/** Configurable forecast risk thresholds */
export const FORECAST_THRESHOLDS = {
  heavyRain7dMm: 65,
  extremeRain7dMm: 120,
  peakRainSingleDayMm: 30,
};

/**
 * Computes structured forecast metrics deterministically from an array of 7-day forecast items.
 */
export function computeForecastMetrics(
  forecastDays: ForecastDay[],
  dataStatus: 'live' | 'cached' | 'bundled' = 'cached',
  updatedAtIso?: string,
): WeatherForecastResult {
  if (!forecastDays || forecastDays.length === 0) {
    return {
      sourceBadge: 'FORECAST',
      providerName: 'Open-Meteo',
      totalRain7dMm: 0,
      rainDaysCount: 0,
      peakRainMm: 0,
      peakRainDate: 'N/A',
      hasHeavyRainRisk: false,
      forecastDays: [],
      forecastSummaryEn: 'No short-term weather forecast available.',
      forecastSummaryBn: 'কোন স্বল্পমেয়াদী আবহাওয়া পূর্বাভাস পাওয়া যায়নি।',
      dataStatus,
      updatedAt: updatedAtIso ?? new Date().toISOString(),
    };
  }

  const days = forecastDays.slice(0, 7);
  const totalRain7d = Math.round(days.reduce((acc, d) => acc + (d.rain ?? 0), 0) * 10) / 10;
  const rainDays = days.filter((d) => (d.rain ?? 0) >= 1.0).length;

  let peakRain = 0;
  let peakDate = days[0]?.date ?? 'N/A';

  for (const day of days) {
    if ((day.rain ?? 0) > peakRain) {
      peakRain = Math.round((day.rain ?? 0) * 10) / 10;
      peakDate = day.date;
    }
  }

  const hasHeavyRisk =
    totalRain7d >= FORECAST_THRESHOLDS.heavyRain7dMm ||
    peakRain >= FORECAST_THRESHOLDS.peakRainSingleDayMm;

  let summaryEn: string;
  let summaryBn: string;

  if (totalRain7d >= FORECAST_THRESHOLDS.extremeRain7dMm) {
    summaryEn = `Heavy downpours forecast: ~${totalRain7d} mm expected across ${rainDays} rainy days (peak ${peakRain} mm on ${peakDate}).`;
    summaryBn = `অতি ভারী বৃষ্টিপাতের সম্ভাবনা: আগামী ৭ দিনে মোট ~${totalRain7d} মিমি বৃষ্টি এবং ${peakDate}-এ সর্বোচ্চ ${peakRain} মিমি।`;
  } else if (hasHeavyRisk) {
    summaryEn = `Significant rainfall projected: ~${totalRain7d} mm expected over next 7 days (${rainDays} rainy days).`;
    summaryBn = `উল্লেখযোগ্য বৃষ্টিপাতের পূর্বাভাস: আগামী ৭ দিনে প্রায় ${totalRain7d} মিমি বৃষ্টিপাত হতে পারে।`;
  } else if (totalRain7d <= 8) {
    summaryEn = `Dry forecast: Only ~${totalRain7d} mm precipitation projected over the next 7 days.`;
    summaryBn = `শুষ্ক আবহাওয়া: আগামী ৭ দিনে মাত্র ~${totalRain7d} মিমি বৃষ্টিপাতের সম্ভাবনা।`;
  } else {
    summaryEn = `Moderate rainfall: ~${totalRain7d} mm projected over the next 7 days.`;
    summaryBn = `মাঝারি বৃষ্টিপাত: আগামী ৭ দিনে প্রায় ${totalRain7d} মিমি বৃষ্টিপাতের সম্ভাবনা রয়েছে।`;
  }

  return {
    sourceBadge: 'FORECAST',
    providerName: 'Open-Meteo',
    totalRain7dMm: totalRain7d,
    rainDaysCount: rainDays,
    peakRainMm: peakRain,
    peakRainDate: peakDate,
    hasHeavyRainRisk: hasHeavyRisk,
    forecastDays: days,
    forecastSummaryEn: summaryEn,
    forecastSummaryBn: summaryBn,
    dataStatus,
    updatedAt: updatedAtIso ?? new Date().toISOString(),
  };
}

/**
 * Fetches 7-day Open-Meteo forecast with resilient fallbacks.
 * 1. Live Open-Meteo endpoint
 * 2. District Cache (/cache/<district>.json)
 * 3. Bundled Snapshot
 */
export async function getWeatherForecast(
  districtId: DistrictId | string,
  lat?: number,
  lng?: number,
  timeoutMs = 4000,
): Promise<WeatherForecastResult> {
  const d = getDistrictAdmin(districtId);
  const targetLat = lat ?? (d ? (d.id === 'rangpur' ? 25.75 : Number(d.lat.toFixed(2))) : 25.75);
  const targetLng = lng ?? (d ? (d.id === 'rangpur' ? 89.25 : Number(d.lng.toFixed(2))) : 89.25);

  // 1. Try Live Open-Meteo fetch
  if (typeof window !== 'undefined' && navigator.onLine) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      const url = `https://api.open-meteo.com/v1/forecast?latitude=${targetLat}&longitude=${targetLng}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FDhaka&forecast_days=7`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) {
        const json = await res.json();
        const daily = json?.daily;
        if (daily?.time && Array.isArray(daily.time) && daily.time.length >= 7) {
          const days: ForecastDay[] = daily.time.map((date: string, i: number) => ({
            date,
            tMax: Number(daily.temperature_2m_max?.[i] ?? 30),
            tMin: Number(daily.temperature_2m_min?.[i] ?? 22),
            rain: Number(daily.precipitation_sum?.[i] ?? 0),
          }));
          return computeForecastMetrics(days, 'live', new Date().toISOString());
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
        if (cache?.forecast && Array.isArray(cache.forecast) && cache.forecast.length > 0) {
          return computeForecastMetrics(
            cache.forecast,
            'cached',
            cache.fetchedAt,
          );
        }
      }
    } catch {
      // Graceful fallback to bundled
    }
  }

  // 3. Bundled Snapshot (Guaranteed offline resilience)
  const bundled = fallbackRangpur as LocationCache;
  return computeForecastMetrics(
    bundled.forecast,
    'bundled',
    bundled.fetchedAt,
  );
}
