import type { CropData, FarmerPriorityId, Language } from '../types';
import { CROPS_DATABASE } from '../data/agriData';
import { cropById } from '../data/crops';

export type SeasonFilter = 'All' | 'Rabi' | 'Kharif-1' | 'Kharif-2';

// Secondary priority influence is half the primary strength (rounded).
const SECONDARY_WEIGHT = 0.5;

export interface TelemetryContext {
  rainfall30d?: number; // mm
  soilMoisture?: number | null; // m³/m³
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

  // Calibrate base score to allow dynamic rule adjustments without artificial clamping
  const calibratedBase = Math.round(crop.suitabilityScore * 0.85);
  let score = calibratedBase;
  const deltas: ScoreDeltas = {
    base: calibratedBase,
    dryPenalty: 0,
    optimalSowingBonus: 0,
    heatPenalty: 0,
    waterDeficitPenalty: 0,
    primaryPriorityDelta: 0,
    secondaryPriorityDelta: 0,
    finalScore: calibratedBase,
  };

  const rain = telemetry?.rainfall30d;
  const soil = telemetry?.soilMoisture;
  const maxT = telemetry?.maxTemp;
  const wBal = telemetry?.waterBalance;
  const hasTelemetry = rain !== undefined && soil !== undefined && maxT !== undefined && wBal !== undefined;

  if (!hasTelemetry) {
    crop.notEnoughData = true;
  }

  const dynamicObservationsEn: string[] = [];
  const dynamicObservationsBn: string[] = [];
  const dynamicRulesEn: string[] = [];
  const dynamicRulesBn: string[] = [];

  const cropMeta = cropById(crop.id);
  if (cropMeta?.data_confidence === 'estimated') {
    dynamicObservationsBn.push('এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।');
    dynamicObservationsEn.push('Estimated data: preliminary parameters; confirm with local upazila agriculture office.');
  }

    if (hasTelemetry) {
  // ─────────────────────────────────────────────────────────────
    // RULE 1: DRY STRESS PENALTY (Rainfall < 50mm AND Soil Moisture < 0.15)
    // ─────────────────────────────────────────────────────────────
    if (soil !== null && soil !== undefined && rain < 50 && soil < 0.15) {
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
    if (soil !== null && soil !== undefined && soil >= 0.25 && soil <= 0.3) {
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

    // Priority-specific explain-why rule annotations
  if (primary === 'higher_income' && (crop.valueCategory === 'high' || ['potato', 'maize', 'mustard', 'lentil'].includes(crop.id))) {
    dynamicRulesEn.push('Rule INC-01: High commercial value crop (+5 pts) approximate value category, not live market price.');
    dynamicRulesBn.push('রুল INC-01: উচ্চ বাণিজ্যিক মূল্যের সম্ভাবনা (+৫ পয়েন্ট) আনুমানিক শ্রেণী, তাৎক্ষণিক বাজারদর নয়।');
  }
  if (primary === 'quick_harvest' && crop.durationDays <= 85) {
    dynamicRulesEn.push(`Rule HARV-01: Quick turnaround crop (${crop.durationDays} days <= 85) frees field early (+4 to +6 pts).`);
    dynamicRulesBn.push(`রুল HARV-01: দ্রুত ফসল ঘরে তোলার সুবিধা (${crop.durationDays} দিন) জমি দ্রুত খালি করে (+৪ থেকে +৬ পয়েন্ট)।`);
  }
  if (primary === 'family_food' && (crop.isStaple || ['boro_rice', 'aman_rice', 'aus_rice', 'wheat', 'lentil'].includes(crop.id))) {
    dynamicRulesEn.push('Rule STAPLE-01: Essential staple food crop awarded +5 nutritional security bonus.');
    dynamicRulesBn.push('রুল STAPLE-01: পরিবারের মৌলিক খাদ্য ও পুষ্টি নিরাপত্তার প্রধান ফসল হিসেবে +৫ পয়েন্ট বোনাস।');
  }

  // Final score — stop artificial 98% clamping, allow real dynamic score
  const finalScore = Math.max(20, Math.min(100, Math.round(score)));
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
    case 'lower_cost': {
      let d = 0;
      if (crop.id === 'mustard' || crop.id === 'lentil' || crop.id === 'jute') d += 4;
      if (crop.id === 'boro_rice' || crop.id === 'potato') d -= 12;
      return d;
    }
    case 'reduce_risk':
    case 'maximize_yield': {
      let d = 0;
      if (crop.durationDays <= 80) d += 6;
      else if (crop.durationDays <= 95) d += 4;
      else if (crop.durationDays <= 115) d += 2;
      else if (crop.durationDays >= 140) d -= 4;
      return d;
    }
    case 'higher_income':
    case 'maximize_profit': {
      // High commercial value category (approximate, not live market prices)
      const cat = crop.valueCategory || (['potato', 'maize', 'mustard', 'lentil', 'boro_rice'].includes(crop.id) ? 'high' : 'medium');
      return cat === 'high' ? 5 : cat === 'medium' ? 2 : 0;
    }
    case 'quick_harvest': {
      let d = 0;
      if (crop.durationDays <= 75) d += 6;
      else if (crop.durationDays <= 90) d += 4;
      else if (crop.durationDays <= 110) d += 2;
      else if (crop.durationDays >= 140) d -= 5;
      return d;
    }
    case 'family_food': {
      const isStaple = crop.isStaple ?? ['boro_rice', 'aman_rice', 'aus_rice', 'wheat', 'lentil', 'mungbean'].includes(crop.id);
      return isStaple ? 5 : 0;
    }
    default:
      return 0;
  }
}

export function getRankedCrops(
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null = null,
  season: SeasonFilter = 'All',
  telemetry?: TelemetryContext,
): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE)
    .filter((c, idx, arr) => arr.findIndex((x) => x.id === c.id) === idx)
    .map((crop) => evaluateCropWithNasa(crop, primary, secondary, telemetry));

  const sorted = [...allCrops].sort((a, b) => {
    if (b.suitabilityScore !== a.suitabilityScore) {
      return b.suitabilityScore - a.suitabilityScore;
    }
    const cropA = cropById(a.id);
    const cropB = cropById(b.id);
    if (cropA?.data_confidence === 'research' && cropB?.data_confidence !== 'research') return -1;
    if (cropB?.data_confidence === 'research' && cropA?.data_confidence !== 'research') return 1;
    return a.nameEn.localeCompare(b.nameEn);
  });
  return season === 'All' ? sorted : sorted.filter((c) => c.seasonEn === season);
}

export function formatPriorityLabel(priority: FarmerPriorityId, lang: 'en' | 'bn'): string {
  switch (priority) {
    case 'save_water':
      return lang === 'en' ? 'Save Water' : 'পানি সাশ্রয়';
    case 'lower_cost':
      return lang === 'en' ? 'Lower Cost' : 'কম খরচ';
    case 'improve_soil':
      return lang === 'en' ? 'Improve Soil Health' : 'মাটির উর্বরতা বৃদ্ধি';
    case 'reduce_risk':
      return lang === 'en' ? 'Reduce Climate Risk' : 'আবহাওয়ার ঝুঁকি কমানো';
    case 'higher_income':
      return lang === 'en' ? 'Higher Income' : 'বেশি আয়ের সম্ভাবনা';
    case 'quick_harvest':
      return lang === 'en' ? 'Quick Harvest' : 'দ্রুত ফসল তোলা';
    case 'family_food':
      return lang === 'en' ? 'Family Food Security' : 'পারিবারিক খাদ্য নিরাপত্তা';
    case 'maximize_profit':
      return lang === 'en' ? 'Higher Income' : 'বেশি আয়ের সম্ভাবনা';
    case 'maximize_yield':
      return lang === 'en' ? 'Reduce Climate Risk' : 'আবহাওয়ার ঝুঁকি কমানো';
    default:
      return String(priority).replace('_', ' ');
  }
}

export const PRIORITY_META: Record<
  FarmerPriorityId,
  { titleEn: string; titleBn: string }
> = {
  save_water: { titleEn: 'Save Water', titleBn: 'পানি সাশ্রয়' },
  lower_cost: { titleEn: 'Lower Cost', titleBn: 'কম খরচ' },
  improve_soil: { titleEn: 'Improve Soil Health', titleBn: 'মাটির উর্বরতা বৃদ্ধি' },
  reduce_risk: { titleEn: 'Reduce Climate Risk', titleBn: 'আবহাওয়ার ঝুঁকি কমানো' },
  higher_income: { titleEn: 'Higher Income', titleBn: 'বেশি আয়ের সম্ভাবনা' },
  quick_harvest: { titleEn: 'Quick Harvest', titleBn: 'দ্রুত ফসল তোলা' },
  family_food: { titleEn: 'Family Food Security', titleBn: 'পারিবারিক খাদ্য নিরাপত্তা' },
  maximize_profit: { titleEn: 'Higher Income', titleBn: 'বেশি আয়ের সম্ভাবনা' },
  maximize_yield: { titleEn: 'Reduce Climate Risk', titleBn: 'আবহাওয়ার ঝুঁকি কমানো' },
};

export const PRIORITY_INFLUENCE: Record<FarmerPriorityId, { en: string; bn: string }> = {
  save_water: {
    en: 'Save Water boost: low-water crops gain up to +4 match points; flood-irrigated Boro rice is penalized by up to 18 points when water is limited.',
    bn: 'পানি সাশ্রয় প্রভাব: স্বল্প পানির ফসল সর্বোচ্চ +৪ পয়েন্ট পায়; পানি সীমিত থাকলে বোরো ধান ১৮ পয়েন্ট পর্যন্ত কর্তন পায়।',
  },
  lower_cost: {
    en: 'Lower Cost boost: low-input Mustard, Lentil, and Jute gain up to +4; diesel-heavy Boro and capital-heavy Potato lose up to 12.',
    bn: 'কম খরচ প্রভাব: সাশ্রয়ী সরিষা, মসুর ও পাট সর্বোচ্চ +৪ পায়; ব্যয়বহুল বোরো ও আলু সর্বোচ্চ ১২ হারায়।',
  },
  improve_soil: {
    en: 'Soil Health boost: nitrogen-fixing Mungbean, Jute, and Lentil gain up to +5 match points for rebuilding soil fertility.',
    bn: 'মাটির উর্বরতা প্রভাব: নাইট্রোজেন সংবন্ধনকারী মুগ, পাট ও মসুর সর্বোচ্চ +৫ পয়েন্ট পায়।',
  },
  reduce_risk: {
    en: 'Climate Risk boost: short-duration crops gain up to +6 for escaping heatwaves and erratic storms.',
    bn: 'ঝুঁকি হ্রাস প্রভাব: দুর্যোগ এড়াতে স্বল্পমেয়াদী সহনশীল ফসল সর্বোচ্চ +৬ পয়েন্ট পায়।',
  },
  higher_income: {
    en: 'Higher Income boost (approximate, not live market prices): high commercial value crops (Potato, Maize, Mustard, Lentil) gain +5 points.',
    bn: 'বেশি আয় প্রভাব (আনুমানিক, বাজারদর নয়): উচ্চ বাণিজ্যিক মূল্যের ফসল (আলু, ভুট্টা, সরিষা, মসুর) সর্বোচ্চ +৫ পয়েন্ট পায়।',
  },
  quick_harvest: {
    en: 'Quick Harvest boost: ultra-fast turnaround crops (<=75 days like Mungbean, Mustard) gain up to +6 to free land rapidly.',
    bn: 'দ্রুত ফসল তোলার প্রভাব: দ্রুততম ফসল (মুগ ডাল, সরিষা) দ্রুত জমি খালি করতে সর্বোচ্চ +৬ পয়েন্ট পায়।',
  },
  family_food: {
    en: 'Food Security boost: daily household staples (rice, wheat, pulses) gain +5 points for securing family nutrition.',
    bn: 'খাদ্য নিরাপত্তা প্রভাব: পারিবারিক পুষ্টি ও খোরাকি মেটাতে প্রধান দানা ও ডাল শস্য সর্বোচ্চ +৫ পয়েন্ট পায়।',
  },
  maximize_profit: {
    en: 'Higher Income boost (approximate, not live market prices): high commercial value crops gain +5 points.',
    bn: 'বেশি আয় প্রভাব (আনুমানিক, বাজারদর নয়): উচ্চ বাণিজ্যিক মূল্যের ফসল সর্বোচ্চ +৫ পয়েন্ট পায়।',
  },
  maximize_yield: {
    en: 'Climate Risk boost: short-duration and resilient crops gain up to +6 points.',
    bn: 'ঝুঁকি হ্রাস প্রভাব: স্বল্পমেয়াদী সহনশীল ফসল সর্বোচ্চ +৬ পয়েন্ট পায়।',
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
