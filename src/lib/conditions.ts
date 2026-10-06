// Current field conditions from the last 30 days of NASA POWER daily data.
// ET₀ (crop water demand) uses the Hargreaves method — it only needs
// min/max temperature, which POWER gives us. FAO-56, eq. 52.

import type { DailyData } from './power.ts';

export interface Conditions {
  rain30: number; // mm, sum of last 30 available days
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
  // Only use days where every variable exists.
  const keys = Object.keys(daily.T2M_MAX)
    .filter((k) => daily.T2M_MIN[k] !== undefined && daily.PRECTOTCORR[k] !== undefined && daily.RH2M[k] !== undefined)
    .sort()
    .slice(-days);

  const et0s = keys.map((k) => hargreavesEt0(daily.T2M_MAX[k], daily.T2M_MIN[k], lat, new Date(iso(k))));
  const rain30 = sum(keys.map((k) => daily.PRECTOTCORR[k]));
  const et0Total = sum(et0s);

  return {
    rain30,
    tMax30: Math.max(...keys.map((k) => daily.T2M_MAX[k])),
    tMaxAvg: sum(keys.map((k) => daily.T2M_MAX[k])) / keys.length,
    rh: sum(keys.map((k) => daily.RH2M[k])) / keys.length,
    et0: et0Total / keys.length,
    et0Total,
    waterBalance: rain30 - et0Total,
    from: iso(keys[0]),
    to: iso(keys[keys.length - 1]),
  };
}
