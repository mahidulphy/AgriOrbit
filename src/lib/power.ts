// NASA POWER + Open-Meteo fetch helpers.
// Used by BOTH the browser app and `scripts/fetch-cache.ts` (Node), so this
// file must stay dependency-free (no React, no imports).

export type Series = Record<string, number>; // key: YYYYMM or YYYYMMDD -> value

export interface MonthlyData {
  T2M: Series; // mean air temp, °C
  T2M_MAX: Series; // mean of daily max temp, °C
  PRECTOTCORR: Series; // rainfall, mm/day (monthly mean)
}

export interface DailyData {
  T2M: Series;
  T2M_MAX: Series;
  T2M_MIN: Series;
  PRECTOTCORR: Series; // mm/day
  RH2M: Series; // relative humidity, %
}

export interface ForecastDay {
  date: string; // YYYY-MM-DD
  tMax: number;
  tMin: number;
  rain: number; // mm
}

export interface LocationCache {
  name: string;
  lat: number;
  lon: number;
  fetchedAt: string; // ISO date
  monthly: MonthlyData;
  daily: DailyData;
  forecast: ForecastDay[];
}

const POWER = 'https://power.larc.nasa.gov/api/temporal';

/** fetch() that gives up after `ms` milliseconds. */
async function fetchJson(url: string, ms = 10000): Promise<any> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** POWER uses -999 for "no data yet" (e.g. the most recent 2-3 days). Drop those. */
function clean(series: Series): Series {
  const out: Series = {};
  for (const [k, v] of Object.entries(series)) if (v > -900) out[k] = v;
  return out;
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

export async function fetchPowerMonthly(lat: number, lon: number, startYear: number, endYear: number, ms?: number): Promise<MonthlyData> {
  const url = `${POWER}/monthly/point?parameters=T2M,T2M_MAX,PRECTOTCORR&community=AG&latitude=${lat}&longitude=${lon}&start=${startYear}&end=${endYear}&format=JSON`;
  const p = (await fetchJson(url, ms)).properties.parameter;
  return { T2M: clean(p.T2M), T2M_MAX: clean(p.T2M_MAX), PRECTOTCORR: clean(p.PRECTOTCORR) };
}

/** Last `days` days of daily NASA POWER data (the newest 2-3 days are usually empty). */
export async function fetchPowerDaily(lat: number, lon: number, days = 60, ms?: number): Promise<DailyData> {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);
  const url = `${POWER}/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M&community=AG&latitude=${lat}&longitude=${lon}&start=${ymd(start)}&end=${ymd(end)}&format=JSON`;
  const p = (await fetchJson(url, ms)).properties.parameter;
  return {
    T2M: clean(p.T2M),
    T2M_MAX: clean(p.T2M_MAX),
    T2M_MIN: clean(p.T2M_MIN),
    PRECTOTCORR: clean(p.PRECTOTCORR),
    RH2M: clean(p.RH2M),
  };
}

/** 7-day forecast from Open-Meteo (NOT NASA — credited separately in the UI). */
export async function fetchForecast(lat: number, lon: number, ms?: number): Promise<ForecastDay[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=Asia%2FDhaka&forecast_days=7`;
  const d = (await fetchJson(url, ms)).daily;
  return d.time.map((date: string, i: number) => ({
    date,
    tMax: d.temperature_2m_max[i],
    tMin: d.temperature_2m_min[i],
    rain: d.precipitation_sum[i] ?? 0,
  }));
}

/** Monthly data runs from 1991 to the last year POWER has published. */
export async function fetchAll(name: string, lat: number, lon: number, ms?: number): Promise<LocationCache> {
  const lastYear = new Date().getFullYear() - 1;
  const [monthly, daily, forecast] = await Promise.all([
    fetchPowerMonthly(lat, lon, 1991, lastYear, ms).catch(() => fetchPowerMonthly(lat, lon, 1991, lastYear - 1, ms)),
    fetchPowerDaily(lat, lon, 60, ms),
    fetchForecast(lat, lon, ms),
  ]);
  return { name, lat, lon, fetchedAt: new Date().toISOString(), monthly, daily, forecast };
}
