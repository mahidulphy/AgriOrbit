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

export type Priority = 'water' | 'soil' | 'cost' | 'risk' | 'income' | 'harvest' | 'food';
export type Source = 'BARI' | 'BRRI' | 'Research' | 'Estimated' | 'POWER' | 'SMAP' | 'OpenMeteo' | 'Priority';

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
  | 'priFlood'
  | 'priIncome'
  | 'priFood'
  | 'estimatedNotice';

export interface InactiveRule {
  id: string;
  crop_id: string;
  condition_en: string;
  condition_bn: string;
  suggestion_en: string;
  suggestion_bn: string;
  active: false;
  reason_inactive_en: string;
  reason_inactive_bn: string;
  source_file: string;
  source_section: string;
}

export const INACTIVE_FORECAST_RULES: InactiveRule[] = [
  {
    id: 'RULE_BORO_DEC_SMAP',
    crop_id: 'boro',
    condition_en: 'December soil moisture < 20% and inadequate irrigation',
    condition_bn: 'ডিসেম্বরে মাটির আর্দ্রতা ২০% এর কম এবং পর্যাপ্ত সেচের সুযোগ নেই',
    suggestion_en: 'Recommend wheat or rabi maize instead of Boro rice for water saving',
    suggestion_bn: 'বোরো ধান পরিহার করে গম অথবা রবি ভুট্টা চাষের সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires long-range seasonal soil moisture & irrigation sensor network',
    reason_inactive_bn: 'নিষ্ক্রিয়: দীর্ঘমেয়াদী আর্দ্রতা পূর্বাভাস ও সেচ সেন্সর তথ্য অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '১. বোরো ধান (Boro Rice)',
  },
  {
    id: 'RULE_AMAN_JULY_RAIN',
    crop_id: 'aman',
    condition_en: 'July rainfall forecast is 40% below normal',
    condition_bn: 'জুলাই মাসে বৃষ্টিপাতের পূর্বাভাস স্বাভাবিকের চেয়ে ৪০% কম',
    suggestion_en: 'Recommend drought-tolerant varieties (BRRI dhan56/71) instead of long-duration Aman',
    suggestion_bn: 'দীর্ঘমেয়াদী আমনের বদলে খরা-সহনশীল জাত (ব্রি ধান৫৬/৭১) নির্বাচনের নির্দেশ',
    active: false,
    reason_inactive_en: 'Not active: requires sub-seasonal long-range monsoon precipitation anomaly forecast',
    reason_inactive_bn: 'নিষ্ক্রিয়: উপ-মৌসুমি দীর্ঘমেয়াদী বৃষ্টিপাত অসঙ্গতি পূর্বাভাস অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '২. আমন ধান (Aman Rice)',
  },
  {
    id: 'RULE_AUS_MARCH_RAIN',
    crop_id: 'aus',
    condition_en: 'March rainfall is zero and irrigation is inadequate',
    condition_bn: 'মার্চ মাসে বৃষ্টিপাত শূন্য এবং সেচের পানি অপ্রতুল',
    suggestion_en: 'Cancel Aus and switch to short-duration summer sesame or mungbean',
    suggestion_bn: 'আউশ ধান বাতিল করে স্বল্পমেয়াদী গ্রীষ্মকালীন তিল বা মুগডালে শিফট করার সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires pre-monsoon precipitation outlook & farm irrigation status',
    reason_inactive_bn: 'নিষ্ক্রিয়: প্রাক-বর্ষা বৃষ্টিপাত পূর্বাভাস ও খামার সেচ সক্ষমতা তথ্য অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৩. আউশ ধান (Aus Rice)',
  },
  {
    id: 'RULE_WHEAT_HEAT_WAVE',
    crop_id: 'wheat',
    condition_en: 'Early heat wave likely during February–March grain filling',
    condition_bn: 'ফেব্রুয়ারি ও মার্চের পূর্বাভাসে আগাম তাপদাহের সম্ভাবনা',
    suggestion_en: 'Cancel late-sown wheat and recommend fast-maturing oilseeds or pulses',
    suggestion_bn: 'দেরিতে বপন করা গম বাতিল করে দ্রুত পরিপক্ক তেলবীজ বা ডাল জাতীয় ফসলের সুপারিশ',
    active: false,
    reason_inactive_en: 'Not active: requires 45-day sub-seasonal terminal heat wave forecast',
    reason_inactive_bn: 'নিষ্ক্রিয়: ৪৫ দিনের দীর্ঘমেয়াদী শীতকালীন তাপদাহ পূর্বাভাস অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৪. গম (Wheat)',
  },
  {
    id: 'RULE_MAIZE_GROUNDWATER',
    crop_id: 'maize',
    condition_en: 'Severe groundwater table depletion in areas where Boro is planned',
    condition_bn: 'যেখানে বোরো ধানের পরিকল্পনা আছে কিন্তু ভূগর্ভস্থ পানির স্তর আশঙ্কাজনকভাবে নিচে',
    suggestion_en: 'Shift to rabi maize to save 50% irrigation water',
    suggestion_bn: '৫০% সেচের পানি বাঁচাতে রবি ভুট্টায় শিফট করার সিদ্ধান্ত',
    active: false,
    reason_inactive_en: 'Not active: requires real-time aquifer/groundwater table depth telemetry',
    reason_inactive_bn: 'নিষ্ক্রিয়: রিয়েল-টাইম ভূগর্ভস্থ পানির স্তর সেন্সর ডেটা অনুপস্থিত',
    source_file: 'crop-rules.txt',
    source_section: '৫. ভুট্টা (Maize)',
  },
];

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
  previousCrop?: string;
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
  if (!crop.recommendable) {
    return { crop, season, score: 0, reasons: [], optimalSowing: false };
  }

  const r: Reason[] = [];
  const add = (code: ReasonCode, delta: number, source: Source, v: Reason['v'] = {}) => r.push({ code, delta, source, v });

  // Estimated data notice
  if (crop.data_confidence === 'estimated') {
    add('estimatedNotice', 0, 'Estimated', {
      noticeBn: 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।',
      noticeEn: 'This crop data is estimated and not yet fully verified; please confirm with your local agriculture office.',
    });
  }

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
    case 'income':
      if (crop.value_category === 'high') add('priIncome', 8, 'Priority', { level: 'high' });
      else if (crop.value_category === 'medium') add('priIncome', 3, 'Priority', { level: 'medium' });
      break;
    case 'harvest':
      if (crop.days <= 75) add('priShort', 10, 'Priority', { days: crop.days });
      else if (crop.days <= 90) add('priShort', 6, 'Priority', { days: crop.days });
      else if (crop.days >= 140) add('priLong', -6, 'Priority', { days: crop.days });
      break;
    case 'food':
      if (crop.is_staple) add('priFood', 8, 'Priority', {});
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
      CROPS.filter((c) => c.recommendable && (c.seasons.includes(s) || Boolean(c.occupies_seasons?.includes(s))))
        .map((c) => scoreCrop(c, s, i === 0, inp, alerts))
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.crop.data_confidence === 'research' && b.crop.data_confidence !== 'research') return -1;
          if (b.crop.data_confidence === 'research' && a.crop.data_confidence !== 'research') return 1;
          return a.crop.name_en.localeCompare(b.crop.name_en);
        }),
    ]),
  ) as Record<SeasonId, CropScore[]>;

  const isLegume = (c: Crop) => c.is_legume || c.family === 'legume' || c.plant_family === 'fabaceae';
  const hasLegume = (s: SeasonId) => options[s].some((o) => isLegume(o.crop));

  const normalizedPrev = inp.previousCrop ? inp.previousCrop.toLowerCase().trim() : '';
  const prevCrop = normalizedPrev && normalizedPrev !== 'fallow' && normalizedPrev !== 'other'
    ? (CROPS.find(
        (c) =>
          c.id.toLowerCase() === normalizedPrev ||
          c.nameEn.toLowerCase() === normalizedPrev ||
          c.name_en.toLowerCase() === normalizedPrev ||
          c.nameBn === inp.previousCrop ||
          c.name_bn === inp.previousCrop
      ))
    : undefined;
  const prevFamily = prevCrop?.plant_family || prevCrop?.family;

  let best: CropScore[] | null = null;
  let bestTotal = -Infinity;

  for (const a of options[seasons[0]])
    for (const b of options[seasons[1]])
      for (const c of options[seasons[2]]) {
        const seq = [a, b, c];
        let balance = 0;
        let ok = true;

        // Long-duration continuity: if a occupies season 1, skip if b is not a
        if (a.crop.occupies_seasons?.includes(seasons[1]) && b.crop.id !== a.crop.id) {
          continue;
        }
        // If b occupies season 2, skip if c is not b
        if (b.crop.occupies_seasons?.includes(seasons[2]) && c.crop.id !== b.crop.id) {
          continue;
        }

        const fam0 = seq[0].crop.plant_family || seq[0].crop.family;
        if (prevFamily && fam0 === prevFamily) {
          ok = false; // rule A against real previous crop
        }
        for (let i = 0; i < 3 && ok; i++) {
          if (i > 0) {
            const isContinuing = seq[i].crop.id === seq[i - 1].crop.id && Boolean(seq[i - 1].crop.occupies_seasons?.includes(seasons[i]));
            const famCurr = seq[i].crop.plant_family || seq[i].crop.family;
            const famPrev = seq[i - 1].crop.plant_family || seq[i - 1].crop.family;
            if (!isContinuing && famCurr === famPrev) ok = false; // rule A
            if (balance < 0 && hasLegume(seasons[i]) && !isLegume(seq[i].crop)) ok = false; // rule B
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
  if (prevCrop && prevFamily) {
    const blocked0 = options[seasons[0]].find(
      (o) => o.score > picks[0].score && o.crop.family === prevFamily
    );
    if (blocked0) {
      notes.push({ season: seasons[0], code: 'familyBlocked', v: { crop: blocked0.crop.id, prev: prevCrop.id } });
    }
  }
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
      const prevFam = prev.crop.plant_family || prev.crop.family;
      const blocked = options[p.season].find((o) => o.score > p.score && (o.crop.plant_family === prevFam || o.crop.family === prevFam));
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
