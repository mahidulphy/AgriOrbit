import type { CropData, FarmerPriorityId, Language } from '../types';
import { CROPS_DATABASE } from '../data/agriData';

export type SeasonFilter = 'All' | 'Rabi' | 'Kharif-1' | 'Kharif-2';

// Secondary priority influence is half the primary strength (rounded).
const SECONDARY_WEIGHT = 0.5;

export interface TelemetryContext {
  rainfall30d?: number; // mm
  soilMoisture?: number; // m³/m³
  maxTemp?: number; // °C
  waterBalance?: number; // rain30 - ET0 in mm
}

export interface ScoreDeltas {
  base: number;
  dryPenalty: number;
  optimalSowingBonus: number;
  heatPenalty: number;
  waterDeficitPenalty: number;
  primaryPriorityDelta: number;
  secondaryPriorityDelta: number;
  finalScore: number;
}

/**
 * Deterministic rule-based crop scoring driven directly by NASA Earth observations
 * (NASA POWER rainfall, max temperature, Hargreaves ET₀ water deficit, NASA SMAP soil moisture)
 * combined with farmer priority steering.
 */
function evaluateCropWithNasa(
  baseCrop: CropData,
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null,
  telemetry?: TelemetryContext,
): CropData & { deltas: ScoreDeltas } {
  // Deep copy so we don't mutate CROPS_DATABASE
  const crop: CropData = JSON.parse(JSON.stringify(baseCrop));

  let score = crop.suitabilityScore;
  const deltas: ScoreDeltas = {
    base: score,
    dryPenalty: 0,
    optimalSowingBonus: 0,
    heatPenalty: 0,
    waterDeficitPenalty: 0,
    primaryPriorityDelta: 0,
    secondaryPriorityDelta: 0,
    finalScore: score,
  };

  const rain = telemetry?.rainfall30d ?? 38;
  const soil = telemetry?.soilMoisture ?? 0.18;
  const maxT = telemetry?.maxTemp ?? 33.7;
  const wBal = telemetry?.waterBalance ?? -65;

  const dynamicObservationsEn: string[] = [];
  const dynamicObservationsBn: string[] = [];
  const dynamicRulesEn: string[] = [];
  const dynamicRulesBn: string[] = [];

  // ─────────────────────────────────────────────────────────────
  // RULE 1: DRY STRESS PENALTY (Rainfall < 50mm AND Soil Moisture < 0.15)
  // ─────────────────────────────────────────────────────────────
  if (rain < 50 && soil < 0.15) {
    if (crop.waterRequirementEn === 'High' || crop.id === 'boro_rice') {
      const penalty = -20;
      score += penalty;
      deltas.dryPenalty = penalty;
      dynamicObservationsEn.push(
        `NASA POWER rainfall (${rain.toFixed(0)} mm < 50 mm) & SMAP soil moisture (${soil.toFixed(2)} < 0.15 m³/m³) confirm severe moisture deficit.`,
      );
      dynamicObservationsBn.push(
        `নাসা পাওয়ার বৃষ্টিপাত (${rain.toFixed(0)} মিমি < ৫০ মিমি) ও স্ম্যাপ আর্দ্রতা (${soil.toFixed(2)} < ০.১৫) তীব্র পানির ঘাটতি নিশ্চিত করে।`,
      );
      dynamicRulesEn.push(
        `Rule DRY-01: High-water crops face heavy -20 penalty due to low rainfall (<50 mm) and dry rootzone (<0.15 m³/m³).`,
      );
      dynamicRulesBn.push(
        `রুল DRY-01: বৃষ্টি ঘাটতি (<৫০ মিমি) ও শুষ্ক মাটির (<০.১৫) কারণে উচ্চ সেচ নির্ভর ফসলে ২০ পয়েন্ট কর্তন।`,
      );
    } else if (crop.waterRequirementEn === 'Medium') {
      const penalty = -8;
      score += penalty;
      deltas.dryPenalty = penalty;
      dynamicRulesEn.push(`Rule DRY-02: Moderate-water crop absorbs light -8 penalty under water-deficit conditions.`);
      dynamicRulesBn.push(`রুল DRY-02: পানি ঘাটতির পরিবেশে মাঝারি পানির ফসলে ৮ পয়েন্ট কর্তন।`);
    } else if (crop.waterRequirementEn === 'Low') {
      score += 4;
      deltas.dryPenalty = 4;
      dynamicRulesEn.push(`Rule DRY-03: Low-water crop awarded +4 water-saver resilience bonus under dry conditions.`);
      dynamicRulesBn.push(`রুল DRY-03: শুষ্ক পরিবেশে স্বল্প পানির সহনশীল ফসলে +৪ পয়েন্ট বোনাস।`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 2: OPTIMAL SOWING MOISTURE BADGE (Soil 0.25 - 0.30 m³/m³)
  // ─────────────────────────────────────────────────────────────
  if (soil >= 0.25 && soil <= 0.3) {
    const bonus = 5;
    score += bonus;
    deltas.optimalSowingBonus = bonus;
    dynamicObservationsEn.push(
      `SMAP surface moisture (${soil.toFixed(2)} m³/m³) matches the optimal 0.25–0.30 seed germination range.`,
    );
    dynamicObservationsBn.push(
      `স্ম্যাপ আর্দ্রতা (${soil.toFixed(2)} m³/m³) বীজ গজানোর জন্য সবচেয়ে আদর্শ ০.২৫–০.৩০ সীমার মধ্যে রয়েছে।`,
    );
    dynamicRulesEn.push(`Rule SOW-01: Optimal sowing moisture verified (+5 bonus) for rapid seedling emergence.`);
    dynamicRulesBn.push(`রুল SOW-01: দ্রুত চারা গজানোর অনুকূল আর্দ্রতার জন্য বপন প্রস্তুতি বোনাস (+৫ পয়েন্ট)।`);
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 3: HEAT-STRESS ALERT / AVOIDANCE (Max Temp > 35°C)
  // ─────────────────────────────────────────────────────────────
  if (maxT > 35) {
    if (crop.id === 'wheat' || crop.id === 'potato') {
      const penalty = -10;
      score += penalty;
      deltas.heatPenalty = penalty;
      dynamicObservationsEn.push(
        `NASA POWER max temperature reached ${maxT.toFixed(1)}°C (> 35°C threshold), risking heat-induced terminal sterility.`,
      );
      dynamicObservationsBn.push(
        `নাসা পাওয়ার পরিমাপে সর্বোচ্চ তাপমাত্রা ${maxT.toFixed(1)}° সে. (> ৩৫° সে. সীমা), তাপজনিত ফলন বিপর্যয়ের ঝুঁকি।`,
      );
      dynamicRulesEn.push(`Rule HEAT-02: Thermal avoidance penalty (-10 pts) triggered for heat-vulnerable crops.`);
      dynamicRulesBn.push(`রুল HEAT-02: তাপ-সংবেদনশীল ফসলে সতর্কতা ও ১০ পয়েন্ট কর্তন।`);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 4: EVAPOTRANSPIRATION DEFICIT (Rainfall - ET₀ < -50 mm)
  // ─────────────────────────────────────────────────────────────
  if (wBal < -50 && crop.waterRequirementEn === 'High') {
    const penalty = -5;
    score += penalty;
    deltas.waterDeficitPenalty = penalty;
    dynamicRulesEn.push(
      `Rule ET-04: High evapotranspiration deficit (${wBal.toFixed(0)} mm) penalizes flood irrigation overhead (-5 pts).`,
    );
    dynamicRulesBn.push(
      `রুল ET-04: পানির অতিরিক্ত বাষ্পীভবন ঘাটতির (${wBal.toFixed(0)} মিমি) কারণে সেচনির্ভর ফসলে ৫ পয়েন্ট কর্তন।`,
    );
  }

  // ─────────────────────────────────────────────────────────────
  // RULE 5: FARMER PRIORITY STEERING
  // ─────────────────────────────────────────────────────────────
  const p1Delta = priorityDelta(crop, primary);
  score += p1Delta;
  deltas.primaryPriorityDelta = p1Delta;

  if (secondary && secondary !== primary) {
    const p2Delta = Math.round(priorityDelta(crop, secondary) * SECONDARY_WEIGHT);
    score += p2Delta;
    deltas.secondaryPriorityDelta = p2Delta;
  }

  // Final score clamping
  const finalScore = Math.min(98, Math.max(45, Math.round(score)));
  deltas.finalScore = finalScore;

  const tier: CropData['suitabilityTier'] =
    finalScore >= 85 ? 'high' : finalScore >= 70 ? 'moderate' : 'marginal';

  // Merge dynamic explain-why rules at the front of the arrays
  if (dynamicObservationsEn.length > 0) {
    crop.explanation.observationsTriggered = [
      ...dynamicObservationsEn,
      ...crop.explanation.observationsTriggered,
    ];
    crop.explanation.observationsTriggeredBn = [
      ...dynamicObservationsBn,
      ...crop.explanation.observationsTriggeredBn,
    ];
  }
  if (dynamicRulesEn.length > 0) {
    crop.explanation.rulesSatisfied = [...dynamicRulesEn, ...crop.explanation.rulesSatisfied];
    crop.explanation.rulesSatisfiedBn = [...dynamicRulesBn, ...crop.explanation.rulesSatisfiedBn];
  }

  return {
    ...crop,
    suitabilityScore: finalScore,
    suitabilityTier: tier,
    deltas,
  };
}

/** Raw point delta of one priority, before clamps — used at half weight for secondary. */
function priorityDelta(crop: CropData, priority: FarmerPriorityId): number {
  switch (priority) {
    case 'save_water':
      if (crop.id === 'boro_rice') return -18;
      return crop.waterRequirementEn === 'Low' ? 4 : 0;
    case 'improve_soil':
      return crop.id === 'mungbean' || crop.id === 'jute' || crop.id === 'lentil' ? 5 : 0;
    case 'maximize_profit': {
      let d = 0;
      if (crop.suitabilityScore >= 85 && crop.waterRequirementEn !== 'High') d += 4;
      if (crop.suitabilityTier === 'marginal') d -= 8;
      return d;
    }
    case 'maximize_yield': {
      let d = 0;
      if (crop.suitabilityScore >= 85) d += 3;
      if (crop.suitabilityTier === 'marginal') d -= 8;
      return d;
    }
    case 'lower_cost': {
      let d = 0;
      if (crop.id === 'mustard' || crop.id === 'lentil' || crop.id === 'jute') d += 4;
      if (crop.id === 'boro_rice' || crop.id === 'potato') d -= 12;
      return d;
    }
    case 'reduce_risk':
      return crop.durationDays <= 90 ? 5 : 0;
  }
}

export function getRankedCrops(
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null = null,
  season: SeasonFilter = 'All',
  telemetry?: TelemetryContext,
): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE).map((crop) =>
    evaluateCropWithNasa(crop, primary, secondary, telemetry),
  );
  const sorted = [...allCrops].sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  return season === 'All' ? sorted : sorted.filter((c) => c.seasonEn === season);
}

export const PRIORITY_META: Record<
  FarmerPriorityId,
  { titleEn: string; titleBn: string }
> = {
  save_water: { titleEn: 'Save Water', titleBn: 'পানি সাশ্রয়' },
  improve_soil: { titleEn: 'Improve Soil Health', titleBn: 'মাটির উর্বরতা বৃদ্ধি' },
  maximize_profit: { titleEn: 'Maximize Profit', titleBn: 'সর্বোচ্চ লাভ' },
  maximize_yield: { titleEn: 'Maximize Yield', titleBn: 'সর্বোচ্চ ফলন' },
  lower_cost: { titleEn: 'Lower Cost', titleBn: 'কম খরচ' },
  reduce_risk: { titleEn: 'Reduce Climate Risk', titleBn: 'জলবায়ু ঝুঁকি হ্রাস' },
};

export const PRIORITY_INFLUENCE: Record<FarmerPriorityId, { en: string; bn: string }> = {
  save_water: {
    en: 'Save Water boost: low-water crops gain up to +4 match points; flood-irrigated Boro rice is penalized by up to 18 points when water is limited.',
    bn: 'পানি সাশ্রয় প্রভাব: স্বল্প পানির ফসল সর্বোচ্চ +৪ পয়েন্ট পায়; পানি সীমিত থাকলে বোরো ধান ১৮ পয়েন্ট পর্যন্ত কর্তন পায়।',
  },
  improve_soil: {
    en: 'Soil Health boost: nitrogen-fixing Mungbean, Jute, and Lentil gain up to +5 match points for rebuilding soil fertility.',
    bn: 'মাটির উর্বরতা প্রভাব: নাইট্রোজেন সংবন্ধনকারী মুগ, পাট ও মসুর সর্বোচ্চ +৫ পয়েন্ট পায়।',
  },
  maximize_profit: {
    en: 'Profit-oriented (indicative, not a price forecast): crops combining strong local suitability with low/moderate water cost gain up to +4; marginal high-input options lose up to 8. Based on input-cost proxies, not market prices.',
    bn: 'লাভ-ভিত্তিক (নির্দেশক, বাজারদরের পূর্বাভাস নয়): ভালো উপযোগিতা ও কম/মাঝারি খরচের ফসল সর্বোচ্চ +৪ পায়; ব্যয়বহুল প্রান্তিক ফসল সর্বোচ্চ ৮ হারায়।',
  },
  maximize_yield: {
    en: 'Yield-oriented: proven local performers (85%+ base suitability) gain up to +3; marginal crops needing ideal conditions lose up to 8. Reflects expected suitability, not a guaranteed harvest.',
    bn: 'ফলন-ভিত্তিক: প্রমাণিত উপযোগী ফসল (৮৫%+) সর্বোচ্চ +৩ পায়; আদর্শ পরিবেশ নির্ভর প্রান্তিক ফসল সর্বোচ্চ ৮ হারায়। এটি সম্ভাব্য উপযোগিতা, নিশ্চিত ফলন নয়।',
  },
  lower_cost: {
    en: 'Lower Cost boost: low-input Mustard, Lentil, and Jute gain up to +4; diesel-heavy Boro and capital-heavy Potato lose up to 12.',
    bn: 'কম খরচ প্রভাব: সাশ্রয়ী সরিষা, মসুর ও পাট সর্বোচ্চ +৪ পায়; ব্যয়বহুল বোরো ও আলু সর্বোচ্চ ১২ হারায়।',
  },
  reduce_risk: {
    en: 'Climate Risk boost: short-duration crops (90 days or less) gain up to +5 for escaping heatwaves and flash floods.',
    bn: 'ঝুঁকি হ্রাস প্রভাব: স্বল্পমেয়াদী ফসল (৯০ দিন বা কম) সর্বোচ্চ +৫ পায়।',
  },
};

export function priorityInfluenceText(
  priority: FarmerPriorityId,
  secondary: FarmerPriorityId | null,
  language: Language,
): string {
  const main = language === 'en' ? PRIORITY_INFLUENCE[priority].en : PRIORITY_INFLUENCE[priority].bn;
  if (!secondary || secondary === priority) return main;
  const sub =
    language === 'en' ? PRIORITY_INFLUENCE[secondary].en : PRIORITY_INFLUENCE[secondary].bn;
  const prefix =
    language === 'en'
      ? 'Secondary priority applies the same rules at half strength: '
      : 'সহায়ক অগ্রাধিকার একই নিয়ম অর্ধেক মাত্রায় প্রয়োগ করে: ';
  return `${main} ${prefix}${sub}`;
}
