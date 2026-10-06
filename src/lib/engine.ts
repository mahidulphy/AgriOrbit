// AgriOrbit rule engine — 100% rule-based, no machine learning.
//
// Every point added or removed is recorded as a Reason, so "Explain Why"
// can show the farmer exactly which data + which rule produced each score.
// The engine never formats text; the UI turns Reason codes into EN/বাংলা.

import { CROPS, type Crop } from '../data/crops.ts';
import { SEASON_MONTHS, SEASONS, type FieldShift, type SeasonId } from './fieldShift.ts';
import type { Conditions } from './conditions.ts';
import type { ForecastDay } from './power.ts';

/** All thresholds in one place, so the team can tune them. */
export const RULES = {
  base: 60, // starting score for any crop that BARI/BRRI lists for the season
  dryRainMm: 50, // 30-day rain below this ...
  drySoil: 0.15, // ... AND soil moisture below this -> penalize thirsty crops
  heatC: 35, // max temperature above this -> heat-stress alert
  optimalSoil: [0.25, 0.3] as [number, number], // optimal-sowing badge
  floodRain7d: 150, // forecast rain over 7 days (mm) -> flood alert. TODO Parvez: confirm
  deficitMm: -50, // rain − ET₀ over 30 days below this -> water deficit
};

export type Priority = 'water' | 'soil' | 'cost' | 'risk';
export type Source = 'BARI' | 'BRRI' | 'POWER' | 'SMAP' | 'OpenMeteo' | 'Priority';

export type ReasonCode =
  | 'base'
  | 'tempOk'
  | 'tempOff'
  | 'heatSeason'
  | 'heatNow'
  | 'dry'
  | 'soilOptimal'
  | 'soilFit'
  | 'soilOff'
  | 'deficit'
  | 'flood'
  | 'priWater'
  | 'priSoil'
  | 'priCost'
  | 'priShort'
  | 'priLong'
  | 'priFlood';

export interface Reason {
  code: ReasonCode;
  delta: number;
  source: Source;
  v: Record<string, number | string>;
}

export interface CropScore {
  crop: Crop;
  season: SeasonId;
  score: number;
  reasons: Reason[];
  optimalSowing: boolean;
}

export type RotationNoteCode = 'nitrogenForced' | 'nitrogenUnmet' | 'familyBlocked';
export interface RotationNote {
  season: SeasonId; // the season the note applies to
  code: RotationNoteCode;
  v: Record<string, number | string>; // crop ids / balances
}

export type AlertCode = 'heat' | 'lowWater' | 'flood';
export interface Alert {
  code: AlertCode;
  source: Source;
  v: Record<string, number>;
}

export interface EngineInput {
  conditions: Conditions;
  soil: number; // SMAP (or what-if) soil moisture, m³/m³
  shift: FieldShift;
  forecast: ForecastDay[];
  priority: Priority;
  today?: Date;
}

export interface EngineResult {
  seasons: SeasonId[]; // planning order, starting with the next season to sow
  picks: CropScore[]; // the recommended crop for each season
  options: Record<SeasonId, CropScore[]>; // every valid crop, best first
  notes: RotationNote[];
  nutrientTrail: number[]; // running soil-nitrogen balance after each pick
  alerts: Alert[];
}

// ───────────────────────── helpers ─────────────────────────

const LEVEL_WATER = { low: 10, medium: 0, high: -15 };
const LEVEL_COST = { low: 10, medium: 0, high: -10 };
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const round1 = (x: number) => Math.round(x * 10) / 10;

/** Sow the current season if we're in its first 2 months, otherwise plan from the next one. */
export function planSeasons(today = new Date()): SeasonId[] {
  const month = today.getMonth() + 1;
  const current = SEASONS.find((s) => SEASON_MONTHS[s].includes(month))!;
  const idx = SEASONS.indexOf(current);
  const start = SEASON_MONTHS[current].indexOf(month) <= 1 ? idx : (idx + 1) % 3;
  return [0, 1, 2].map((i) => SEASONS[(start + i) % 3]);
}

export function computeAlerts(inp: EngineInput): Alert[] {
  const { conditions: c, soil, forecast } = inp;
  const alerts: Alert[] = [];

  const fMax = Math.max(...forecast.map((d) => d.tMax));
  if (c.tMax30 > RULES.heatC) alerts.push({ code: 'heat', source: 'POWER', v: { t: round1(c.tMax30) } });
  else if (fMax > RULES.heatC) alerts.push({ code: 'heat', source: 'OpenMeteo', v: { t: round1(fMax) } });

  if (c.rain30 < RULES.dryRainMm && soil < RULES.drySoil)
    alerts.push({ code: 'lowWater', source: 'SMAP', v: { rain: Math.round(c.rain30), soil } });

  const rain7 = forecast.reduce((a, d) => a + d.rain, 0);
  if (rain7 > RULES.floodRain7d) alerts.push({ code: 'flood', source: 'OpenMeteo', v: { rain: Math.round(rain7) } });

  return alerts;
}

// ───────────────────────── scoring ─────────────────────────

/**
 * Score one crop for one season.
 * `isFirst` = the season about to be sown, so today's field conditions
 * (rain, soil, forecast) apply. Later seasons use the climate of the
 * latest decade (NASA POWER monthly) instead.
 */
export function scoreCrop(crop: Crop, season: SeasonId, isFirst: boolean, inp: EngineInput, alerts: Alert[]): CropScore {
  const r: Reason[] = [];
  const add = (code: ReasonCode, delta: number, source: Source, v: Reason['v'] = {}) => r.push({ code, delta, source, v });

  // 1. Local guideline: this crop is grown in this season.
  add('base', RULES.base, crop.source, { season });

  // 2. Temperature fit, using the season's average over the latest 10 years.
  const s = inp.shift.seasons.find((x) => x.season === season)!;
  const t = round1(s.nowTemp);
  if (t >= crop.tempMin && t <= crop.tempMax) add('tempOk', 15, 'POWER', { t, min: crop.tempMin, max: crop.tempMax });
  else {
    const off = t < crop.tempMin ? crop.tempMin - t : t - crop.tempMax;
    add('tempOff', -Math.min(20, Math.round(off * 4)), 'POWER', { t, min: crop.tempMin, max: crop.tempMax });
  }

  // 3. Seasonal heat: hot-season daily highs above 35°C hurt heat-sensitive crops.
  if (s.nowHeat > RULES.heatC && crop.tempMax < RULES.heatC) add('heatSeason', -8, 'POWER', { heat: round1(s.nowHeat) });

  if (isFirst) {
    const { rain30, waterBalance } = inp.conditions;
    const soil = inp.soil;

    // 4. DRY RULE: 30-day rain < 50 mm AND soil < 0.15 -> thirsty crops lose points.
    if (rain30 < RULES.dryRainMm && soil < RULES.drySoil && crop.water !== 'low')
      add('dry', crop.water === 'high' ? -20 : -8, 'SMAP', { rain: Math.round(rain30), soil });

    // 5. Soil moisture at sowing.
    const optimal = soil >= RULES.optimalSoil[0] && soil <= RULES.optimalSoil[1];
    if (optimal) add('soilOptimal', 5, 'SMAP', { soil });
    if (soil >= crop.soilMin && soil <= crop.soilMax) add('soilFit', 5, 'SMAP', { soil, min: crop.soilMin, max: crop.soilMax });
    else if (soil < crop.soilMin - 0.05 || soil > crop.soilMax + 0.05) add('soilOff', -5, 'SMAP', { soil, min: crop.soilMin, max: crop.soilMax });

    // 6. Water balance: rain minus crop water demand (ET₀) over 30 days.
    if (waterBalance < RULES.deficitMm && crop.water === 'high') add('deficit', -5, 'POWER', { balance: Math.round(waterBalance) });

    // 7. Short-term risks from alerts.
    if (alerts.some((a) => a.code === 'flood') && !crop.floodTolerant) add('flood', -10, 'OpenMeteo', {});
    const heat = alerts.find((a) => a.code === 'heat');
    if (heat && crop.tempMax < RULES.heatC) add('heatNow', -5, heat.source, { t: heat.v.t });
  }

  // 8. Farmer priority.
  switch (inp.priority) {
    case 'water':
      if (LEVEL_WATER[crop.water]) add('priWater', LEVEL_WATER[crop.water], 'Priority', { level: crop.water });
      break;
    case 'soil':
      if (crop.nutrient) add('priSoil', crop.nutrient * 5, 'Priority', { n: crop.nutrient });
      break;
    case 'cost':
      if (LEVEL_COST[crop.cost]) add('priCost', LEVEL_COST[crop.cost], 'Priority', { level: crop.cost });
      break;
    case 'risk':
      if (crop.days <= 90) add('priShort', 8, 'Priority', { days: crop.days });
      if (crop.days >= 140) add('priLong', -6, 'Priority', { days: crop.days });
      if (crop.floodTolerant) add('priFlood', 4, 'Priority', {});
      break;
  }

  const score = clamp(r.reduce((a, x) => a + x.delta, 0), 0, 100);
  return { crop, season, score, reasons: r, optimalSowing: r.some((x) => x.code === 'soilOptimal') };
}

// ───────────────────────── rotation ─────────────────────────

/**
 * Try every 3-season combination (only ~30) and keep the best-scoring one
 * that passes both rotation rules:
 *   A. FAMILY FILTER — never the same plant family twice in a row.
 *   B. NITROGEN TRIGGER — if the running nutrient balance is below 0, the
 *      next crop must be a legume (when a legume grows in that season).
 */
export function runEngine(inp: EngineInput): EngineResult {
  const seasons = planSeasons(inp.today);
  const alerts = computeAlerts(inp);

  const options = Object.fromEntries(
    seasons.map((s, i) => [
      s,
      CROPS.filter((c) => c.seasons.includes(s))
        .map((c) => scoreCrop(c, s, i === 0, inp, alerts))
        .sort((a, b) => b.score - a.score),
    ]),
  ) as Record<SeasonId, CropScore[]>;

  const hasLegume = (s: SeasonId) => options[s].some((o) => o.crop.family === 'legume');

  let best: CropScore[] | null = null;
  let bestTotal = -Infinity;

  for (const a of options[seasons[0]])
    for (const b of options[seasons[1]])
      for (const c of options[seasons[2]]) {
        const seq = [a, b, c];
        let balance = 0;
        let ok = true;
        for (let i = 0; i < 3 && ok; i++) {
          if (i > 0) {
            if (seq[i].crop.family === seq[i - 1].crop.family) ok = false; // rule A
            if (balance < 0 && hasLegume(seasons[i]) && seq[i].crop.family !== 'legume') ok = false; // rule B
          }
          balance += seq[i].crop.nutrient;
        }
        const total = a.score + b.score + c.score;
        if (ok && total > bestTotal) {
          bestTotal = total;
          best = seq;
        }
      }

  // Safety net (should never happen with the current crop table).
  const picks = best ?? seasons.map((s) => options[s][0]);

  // Record WHY the rotation looks the way it does, for Explain Why.
  const notes: RotationNote[] = [];
  const nutrientTrail: number[] = [];
  let balance = 0;
  picks.forEach((p, i) => {
    if (i > 0) {
      const prev = picks[i - 1];
      if (balance < 0) {
        notes.push(
          p.crop.family === 'legume'
            ? { season: p.season, code: 'nitrogenForced', v: { balance, prev: prev.crop.id } }
            : { season: p.season, code: 'nitrogenUnmet', v: { balance, crop: p.crop.id } },
        );
      }
      const blocked = options[p.season].find((o) => o.score > p.score && o.crop.family === prev.crop.family);
      if (blocked) notes.push({ season: p.season, code: 'familyBlocked', v: { crop: blocked.crop.id, prev: prev.crop.id } });
    }
    balance += p.crop.nutrient;
    nutrientTrail.push(balance);
  });

  return { seasons, picks, options, notes, nutrientTrail, alerts };
}

/** The strongest positive reason (other than the base score), used in the advisory sentence. */
export function topReason(cs: CropScore): Reason | undefined {
  return cs.reasons.filter((r) => r.code !== 'base' && r.delta > 0).sort((a, b) => b.delta - a.delta)[0];
}
