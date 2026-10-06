// "Field Shift": how the local climate has changed between two decades.
// Pure functions over NASA POWER monthly data — easy to test and explain.
//
// DATA NOTE (important, keep this honest):
// NASA POWER rainfall (PRECTOTCORR) over Bangladesh shows step changes around
// 1997 and 2016 (source/processing changes — every district roughly doubles
// in 1997), and T2M drops ~1°C in 1997. So:
//   1. We compare 2001–2010 vs the latest 10 years (avoids the 1997 break).
//   2. For rain we compare WHEN it falls (each season's share of yearly rain),
//      not HOW MUCH, because the 2016 step inflates recent totals.

import type { MonthlyData } from './power.ts';

export type SeasonId = 'rabi' | 'kharif1' | 'kharif2';

/** Bangladesh cropping seasons (calendar months, 1 = Jan). */
export const SEASON_MONTHS: Record<SeasonId, number[]> = {
  rabi: [11, 12, 1, 2],
  kharif1: [3, 4, 5, 6],
  kharif2: [7, 8, 9, 10],
};

export const SEASONS: SeasonId[] = ['rabi', 'kharif1', 'kharif2'];

/** First comparison decade. Change here if the team picks another window. */
export const THEN_RANGE: [number, number] = [2001, 2010];

export interface SeasonShift {
  season: SeasonId;
  thenTemp: number; // °C, mean
  nowTemp: number;
  dTemp: number; // °C change
  thenHeat: number; // °C, mean of daily max
  nowHeat: number;
  dHeat: number;
  thenShare: number; // % of the year's rain that falls in this season
  nowShare: number;
  dShare: number; // percentage points
}

export interface FieldShift {
  thenRange: [number, number];
  nowRange: [number, number];
  seasons: SeasonShift[];
  yearly: { year: number; temp: number }[]; // annual mean temp, from THEN_RANGE start
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
const daysIn = (year: number, month: number) => new Date(year, month, 0).getDate();
const key = (y: number, m: number) => `${y}${String(m).padStart(2, '0')}`;

function seasonStats(m: MonthlyData, season: SeasonId, from: number, to: number) {
  const temps: number[] = [];
  const heats: number[] = [];
  let rain = 0; // total mm over the whole window
  for (let y = from; y <= to; y++) {
    for (const mo of SEASON_MONTHS[season]) {
      const k = key(y, mo);
      if (m.T2M[k] !== undefined) temps.push(m.T2M[k]);
      if (m.T2M_MAX[k] !== undefined) heats.push(m.T2M_MAX[k]);
      rain += (m.PRECTOTCORR[k] ?? 0) * daysIn(y, mo); // mm/day -> mm/month
    }
  }
  return { temp: mean(temps), heat: mean(heats), rain };
}

function windowStats(m: MonthlyData, range: [number, number]) {
  const stats = SEASONS.map((s) => seasonStats(m, s, ...range));
  const totalRain = stats.reduce((a, s) => a + s.rain, 0);
  return stats.map((s) => ({ ...s, share: (s.rain / totalRain) * 100 }));
}

/** Compares THEN_RANGE with the latest 10 complete years available. */
export function computeFieldShift(m: MonthlyData): FieldShift {
  const years = Object.keys(m.T2M)
    .filter((k) => k.endsWith('13')) // POWER's "month 13" = annual value
    .map((k) => Number(k.slice(0, 4)));
  const last = Math.max(...years);
  const nowRange: [number, number] = [last - 9, last];

  const a = windowStats(m, THEN_RANGE);
  const b = windowStats(m, nowRange);

  const seasons = SEASONS.map((season, i) => ({
    season,
    thenTemp: a[i].temp,
    nowTemp: b[i].temp,
    dTemp: b[i].temp - a[i].temp,
    thenHeat: a[i].heat,
    nowHeat: b[i].heat,
    dHeat: b[i].heat - a[i].heat,
    thenShare: a[i].share,
    nowShare: b[i].share,
    dShare: b[i].share - a[i].share,
  }));

  const yearly = years
    .filter((y) => y >= THEN_RANGE[0])
    .sort((x, y) => x - y)
    .map((year) => ({ year, temp: m.T2M[`${year}13`] }));

  return { thenRange: THEN_RANGE, nowRange, seasons, yearly };
}

/** The season with the biggest warming, for a headline. */
export function warmestShift(fs: FieldShift): SeasonShift {
  return [...fs.seasons].sort((x, y) => y.dTemp - x.dTemp)[0];
}

/** The season whose share of yearly rain changed most, for a headline. */
export function rainTimingShift(fs: FieldShift): SeasonShift {
  return [...fs.seasons].sort((x, y) => Math.abs(y.dShare) - Math.abs(x.dShare))[0];
}
