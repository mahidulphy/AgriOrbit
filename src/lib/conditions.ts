// Current field conditions from the last 30 days of NASA POWER daily data.
// ET₀ (crop water demand) uses the Hargreaves method — it only needs
// min/max temperature, which POWER gives us. FAO-56, eq. 52.

import type { DailyData } from './power.ts';

export interface Conditions {
  rain30: number; // mm, sum of last 30 available days
  rainUnavailable?: boolean; // true if no valid precipitation observations exist
  unusuallyHighRain?: boolean; // true if 30-day rain > 1200 mm or daily peak > 350 mm
  tMax30: number; // °C, hottest day in the window
  tMaxAvg: number; // °C, mean daily high
  rh: number; // %, mean humidity
  et0: number; // mm/day, mean crop water demand
  et0Total: number; // mm over the window
  waterBalance: number; // rain − ET₀, mm (negative = deficit)
  from: string; // YYYY-MM-DD
  to: string; // YYYY-MM-DD (POWER lags 2–3 days behind today)
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
const iso = (k: string) => `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`;

/** Extraterrestrial radiation Ra in mm/day (FAO-56, eqs. 21–25). */
function extraterrestrialRadiation(latDeg: number, dayOfYear: number): number {
  const phi = (latDeg * Math.PI) / 180;
  const dr = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const delta = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const ws = Math.acos(-Math.tan(phi) * Math.tan(delta));
  const ra = ((24 * 60) / Math.PI) * 0.082 * dr * (ws * Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.sin(ws));
  return ra * 0.408; // MJ/m²/day -> mm/day
}

export function hargreavesEt0(tMax: number, tMin: number, latDeg: number, date: Date): number {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const doy = Math.floor((date.getTime() - start) / 86400000);
  const ra = extraterrestrialRadiation(latDeg, doy);
  const tMean = (tMax + tMin) / 2;
  return 0.0023 * ra * (tMean + 17.8) * Math.sqrt(Math.max(0, tMax - tMin));
}

export function computeConditions(daily: DailyData, lat: number, days = 30): Conditions {
  if (!daily || !daily.T2M_MAX) {
    return {
      rain30: 0,
      rainUnavailable: true,
      tMax30: 0,
      tMaxAvg: 0,
      rh: 0,
      et0: 0,
      et0Total: 0,
      waterBalance: 0,
      from: 'N/A',
      to: 'N/A',
    };
  }

  // Guard against NASA sentinel values (-999, negative precipitation, or out-of-range values)
  // Only remove -999 fill values and negative numbers; do NOT filter by calendar year (works across New Year in Jan).
  const allValidKeys = Object.keys(daily.T2M_MAX)
    .filter((k) => {
      const tMax = daily.T2M_MAX[k];
      const tMin = daily.T2M_MIN?.[k];
      const rain = daily.PRECTOTCORR?.[k];
      const rh = daily.RH2M?.[k];
      return (
        tMax !== undefined && tMax > -900 &&
        tMin !== undefined && tMin > -900 &&
        rain !== undefined && rain >= 0 &&
        rh !== undefined && rh >= 0 && rh <= 100
      );
    })
    .sort();

  if (allValidKeys.length === 0) {
    return {
      rain30: 0,
      rainUnavailable: true,
      tMax30: 0,
      tMaxAvg: 0,
      rh: 0,
      et0: 0,
      et0Total: 0,
      waterBalance: 0,
      from: 'N/A',
      to: 'N/A',
    };
  }

  // Take the last `days` available days ending at the latest valid date
  const keys = allValidKeys.slice(-days);

  const et0s = keys.map((k) => hargreavesEt0(daily.T2M_MAX[k], daily.T2M_MIN[k], lat, new Date(iso(k))));
  
  const validRainValues = keys.map((k) => {
    const val = daily.PRECTOTCORR[k];
    return val !== undefined && val >= 0 ? val : 0;
  });

  const rawRain = sum(validRainValues);
  const maxDailyRain = Math.max(...validRainValues, 0);

  // Heavy monsoon totals in Sylhet/Sunamganj can be real. If unusually high, flag for UI note without dropping data.
  const isUnusuallyHigh = rawRain > 1200 || maxDailyRain > 350;

  const rain30 = rawRain;
  const et0Total = sum(et0s);
  // Net water balance = (Rainfall - ET0). If Rainfall < ET0, it is strictly negative (deficit).
  const waterBalance = rain30 - et0Total;

  return {
    rain30,
    rainUnavailable: false,
    unusuallyHighRain: isUnusuallyHigh,
    tMax30: Math.max(...keys.map((k) => daily.T2M_MAX[k])),
    tMaxAvg: sum(keys.map((k) => daily.T2M_MAX[k])) / keys.length,
    rh: sum(keys.map((k) => daily.RH2M[k])) / keys.length,
    et0: et0Total / keys.length,
    et0Total,
    waterBalance,
    from: iso(keys[0]),
    to: iso(keys[keys.length - 1]),
  };
}
