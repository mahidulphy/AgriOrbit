import type { CropData, FarmerPriorityId, Language } from '../types';
import { CROPS_DATABASE } from '../data/agriData';
import { cropById } from '../data/crops';
import { toBnDigits } from './bilingualEmailTemplate';
export const WATERLOGGING_SENSITIVE_CROPS = new Set<string>([
  'sesame',
  'chili',
  'brinjal',
  'lentil',
  'chickpea',
  'sweet_potato',
  'tomato',
  'potato',
  'mustard',
  'blackgram',
  'grass_pea',
  'groundnut',
  'garlic',
  'ginger',
  'turmeric',
  'soybean',
]);

export function isWaterloggingSensitive(cropId: string): boolean {
  return WATERLOGGING_SENSITIVE_CROPS.has(cropId);
}


export type SeasonFilter = 'All' | 'Rabi' | 'Kharif-1' | 'Kharif-2';

// Secondary priority influence is half the primary strength (rounded).
const SECONDARY_WEIGHT = 0.5;

export interface TelemetryContext {
  rainfall30d?: number; // mm
  soilMoisture?: number | null; // m³/m³
  maxTemp?: number; // °C
  waterBalance?: number; // rain30 - ET0 in mm
  sentinel1FloodedCroplandPct?: number | null; // % cropland inundated (ESA Sentinel-1 SAR)
  sentinel2Ndvi10m?: number | null; // 10m field NDVI (ESA Sentinel-2 MSI)
  sentinel2AnomalyPct?: number | null; // % deviation from baseline NDVI
  jaxaRain30dMm?: number | null; // 30-day rain from JAXA GSMaP v8
  jaxaSoilMoisture?: number | null; // soil moisture m³/m³ from JAXA AMSR2
  jaxaSpi30dIndex?: number | null; // JAXA 30-day Standardized Precipitation Index
}

export interface ScoreDeltas {
  base: number;
  dryPenalty: number;
  optimalSowingBonus: number;
  heatPenalty: number;
  waterDeficitPenalty: number;
  sentinel1FloodPenalty: number;
  sentinel2StressPenalty: number;
  jaxaDroughtPenalty: number;
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
    sentinel1FloodPenalty: 0,
    sentinel2StressPenalty: 0,
    jaxaDroughtPenalty: 0,
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
    dynamicObservationsBn.push('এই ফসলের তথ্য এখনো পুরোপুরি যাচাই করা হয়নি, কৃষি অফিসের পরামর্শ নিয়ে চাষ করুন।');
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
          `নাসার তথ্য অনুযায়ী বৃষ্টি কম (${rain.toFixed(0)} মিমি < ৫০ মিমি) ও মাটিতে রস কম (${soil.toFixed(2)} < ০.১৫), পানির ঘাটতি রয়েছে।`,
        );
        dynamicRulesEn.push(
          `Rule DRY-01: High-water crops face heavy -20 penalty due to low rainfall (<50 mm) and dry rootzone (<0.15 m³/m³).`,
        );
        dynamicRulesBn.push(
          `নিয়ম DRY-01: বৃষ্টি কম (<৫০ মিমি) ও মাটিতে রস কম (<০.১৫) থাকায় বেশি সেচের ফসলে ২০ নম্বর কাটা হয়েছে।`,
        );
      } else if (crop.waterRequirementEn === 'Medium') {
        const penalty = -8;
        score += penalty;
        deltas.dryPenalty = penalty;
        dynamicRulesEn.push(`Rule DRY-02: Moderate-water crop absorbs light -8 penalty under water-deficit conditions.`);
        dynamicRulesBn.push(`নিয়ম DRY-02: পানির ঘাটতির কারণে মাঝারি সেচের ফসলে ৮ নম্বর কাটা হয়েছে।`);
      } else if (crop.waterRequirementEn === 'Low') {
        score += 4;
        deltas.dryPenalty = 4;
        dynamicRulesEn.push(`Rule DRY-03: Low-water crop awarded +4 water-saver resilience bonus under dry conditions.`);
        dynamicRulesBn.push(`নিয়ম DRY-03: শুকনা আবহাওয়ায় কম পানির সহনশীল ফসলে +৪ নম্বর যোগ হয়েছে।`);
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
        `মাটিতে রসের পরিমাণ (${soil.toFixed(2)}) বীজ গজানোর উপযোগী ভালো অবস্থায় (০.২৫–০.৩০) আছে।`,
      );
      dynamicRulesEn.push(`Rule SOW-01: Optimal sowing moisture verified (+5 bonus) for rapid seedling emergence.`);
      dynamicRulesBn.push(`নিয়ম SOW-01: বীজ গজানোর উপযোগী ভালো রস থাকায় +৫ নম্বর যোগ হয়েছে।`);
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
          `সর্বোচ্চ তাপমাত্রা ${maxT.toFixed(1)}°সে (> ৩৫°সে), অতিরিক্ত গরমে ফসল নষ্ট হওয়ার ঝুঁকি।`,
        );
        dynamicRulesEn.push(`Rule HEAT-02: Thermal avoidance penalty (-10 pts) triggered for heat-vulnerable crops.`);
        dynamicRulesBn.push(`নিয়ম HEAT-02: গরম সহ্য করতে না পারা ফসলে ১০ নম্বর কাটা হয়েছে।`);
      }
    }
  
    // ─────────────────────────────────────────────────────────────
    
    // ─────────────────────────────────────────────────────────────
    // RULE SAR-01: ESA SENTINEL-1 SAR FLOOD & WATERLOGGING DETECTION
    // ─────────────────────────────────────────────────────────────
    const floodPct = telemetry?.sentinel1FloodedCroplandPct;
    if (floodPct !== undefined && floodPct !== null && floodPct > 10) {
      const cropDef = cropById(crop.id);
      const isExplicitlyTolerant =
        cropDef?.floodTolerant === true ||
        crop.id === 'aman' ||
        crop.id === 'boro' ||
        crop.id === 'aus' ||
        crop.id === 'jute';

      const isSensitive =
        !isExplicitlyTolerant &&
        (WATERLOGGING_SENSITIVE_CROPS.has(crop.id) ||
          cropDef?.key_risks_en?.some((r) => /waterlog|waterlogging|poor drainage/i.test(r)) ||
          crop.shortWhyEn?.toLowerCase().includes('waterlog'));

      if (isSensitive) {
        const penalty = -15;
        score += penalty;
        deltas.sentinel1FloodPenalty = penalty;
        dynamicObservationsEn.push(
          `ESA Sentinel-1 SAR: ${floodPct.toFixed(1)}% of district cropland is flooded/waterlogged in the last 12 days.`
        );
        dynamicObservationsBn.push(
          `ইএসএ সেন্টিনেল-১ রাডার: বিগত ১২ দিনে ফসলি জমির ${toBnDigits(floodPct.toFixed(1))}% এলাকায় জলাবদ্ধতা শনাক্ত হয়েছে।`
        );
        dynamicRulesEn.push(
          `Rule SAR-01: Sentinel-1: ${floodPct.toFixed(1)}% of cropland flooded > 10% → waterlogging-sensitive crops -15.`
        );
        dynamicRulesBn.push(
          `নিয়ম SAR-01: সেন্টিনেল-১: জমিতে ${toBnDigits(floodPct.toFixed(1))}% জলাবদ্ধতা (> ১০%) → পানি সংবেদনশীল ফসলে -১৫ নম্বর।`
        );
      }
    }


    // RULE VEG-02: ESA SENTINEL-2 10M VEGETATION HEALTH & CROP STRESS
    // ─────────────────────────────────────────────────────────────
    const s2Anomaly = telemetry?.sentinel2AnomalyPct;
    const s2Ndvi = telemetry?.sentinel2Ndvi10m;
    if (s2Anomaly !== undefined && s2Anomaly !== null && s2Anomaly < -15) {
      const isSlowOrDemanding = (crop.durationDays ?? 100) >= 120 || crop.waterRequirementEn === 'High';
      const isFastOrResilient = (crop.durationDays ?? 100) <= 85 || ['mungbean', 'mustard', 'radish', 'blackgram', 'sesame'].includes(crop.id);

      if (isSlowOrDemanding) {
        const penalty = -10;
        score += penalty;
        deltas.sentinel2StressPenalty = penalty;
        dynamicObservationsEn.push(
          `ESA Sentinel-2: 10m NDVI is ${s2Ndvi !== null && s2Ndvi !== undefined ? s2Ndvi.toFixed(2) : 'depressed'} (${s2Anomaly.toFixed(1)}% vs baseline) indicates field canopy stress.`
        );
        dynamicObservationsBn.push(
          `ইএসএ সেন্টিনেল-২: ১০মি NDVI ${s2Ndvi !== null && s2Ndvi !== undefined ? s2Ndvi.toFixed(2) : ''} (স্বাভাবিকের চেয়ে ${toBnDigits(Math.abs(s2Anomaly).toFixed(1))}% কম) জমিতে বৃদ্ধির ঘাটতি নির্দেশ করে।`
        );
        dynamicRulesEn.push(
          `Rule VEG-02: Sentinel-2 10m NDVI anomaly (${s2Anomaly.toFixed(1)}% < -15%) → long-duration/demanding crops penalized -10.`
        );
        dynamicRulesBn.push(
          `নিয়ম VEG-02: সেন্টিনেল-২ ১০মি NDVI ঘাটতি (${toBnDigits(Math.abs(s2Anomaly).toFixed(1))}% < -১৫%) → দীর্ঘমেয়াদী ফসলে -১০ নম্বর।`
        );
      } else if (isFastOrResilient) {
        const bonus = 5;
        score += bonus;
        deltas.sentinel2StressPenalty = bonus;
        dynamicObservationsEn.push(
          `ESA Sentinel-2: 10m NDVI indicates canopy lag (${s2Anomaly.toFixed(1)}%); favoring short-duration catch crop.`
        );
        dynamicObservationsBn.push(
          `ইএসএ সেন্টিনেল-২: ১০মি চিত্রে ফসলে বৃদ্ধির ধকল (${toBnDigits(Math.abs(s2Anomaly).toFixed(1))}%), তাই দ্রুত সংগ্রহযোগ্য ফসল অগ্রাধিকার দেওয়া হয়েছে।`
        );
        dynamicRulesEn.push(
          `Rule VEG-02: Sentinel-2 10m NDVI anomaly (${s2Anomaly.toFixed(1)}% < -15%) → short-duration catch crop +5 bonus.`
        );
        dynamicRulesBn.push(
          `নিয়ম VEG-02: সেন্টিনেল-২ ১০মি NDVI ঘাটতি (${toBnDigits(Math.abs(s2Anomaly).toFixed(1))}% < -১৫%) → স্বল্পমেয়াদী বিকল্প ফসলে +৫ বোনাস।`
        );
      }
    }


    // RULE JAXA-01: DUAL-SATELLITE DROUGHT CONFIRMATION (JAXA AMSR2 + SPI & SMAP)
    // ─────────────────────────────────────────────────────────────
    const amsr2 = telemetry?.jaxaSoilMoisture;
    const spi = telemetry?.jaxaSpi30dIndex;
    const isDualDrought =
      (amsr2 !== undefined && amsr2 !== null && amsr2 < 0.16 && soil !== null && soil !== undefined && soil < 0.18) ||
      (spi !== undefined && spi !== null && spi < -1.2);

    if (isDualDrought) {
      if (crop.waterRequirementEn === 'High' || crop.id === 'boro_rice') {
        const penalty = -15;
        score += penalty;
        deltas.jaxaDroughtPenalty = penalty;
        dynamicObservationsEn.push(
          `JAXA AMSR2 (${amsr2 !== null && amsr2 !== undefined ? amsr2.toFixed(2) : 'N/A'} m³/m³) & SPI drought index (${spi !== null && spi !== undefined ? spi.toFixed(2) : 'N/A'}) confirm severe moisture depletion.`
        );
        dynamicObservationsBn.push(
          `জাক্সা এএমএসআর২ (${amsr2 !== null && amsr2 !== undefined ? amsr2.toFixed(2) : ''} m³/m³) ও খরা সূচক SPI (${spi !== null && spi !== undefined ? spi.toFixed(2) : ''}) মাটিতে তীব্র পানিশূন্যতা নিশ্চিত করেছে।`
        );
        dynamicRulesEn.push(
          `Rule JAXA-01: Dual-agency satellite drought verified (AMSR2 + SMAP + SPI < -1.2) → high-water crop penalized -15.`
        );
        dynamicRulesBn.push(
          `নিয়ম JAXA-01: যৌথ উপগ্রহ পর্যবেক্ষণ দ্বারা খরা নিশ্চিত (AMSR2 + SMAP + SPI < -১.২) → সেচনির্ভর ফসলে -১৫ নম্বর।`
        );
      } else if (crop.waterRequirementEn === 'Low' || ['sesame', 'chickpea', 'mustard', 'grass_pea'].includes(crop.id)) {
        const bonus = 5;
        score += bonus;
        deltas.jaxaDroughtPenalty = bonus;
        dynamicObservationsEn.push(
          `JAXA SPI (${spi !== null && spi !== undefined ? spi.toFixed(2) : 'N/A'}) confirms dry spell; drought-hardy crop promoted.`
        );
        dynamicObservationsBn.push(
          `জাক্সা খরা সূচক অনুযায়ী শুষ্ক পরিস্থিতি বিরাজ করায় খরা-সহনশীল ফসল অগ্রাধিকার পেয়েছে।`
        );
        dynamicRulesEn.push(
          `Rule JAXA-01: Dual-agency satellite drought verified → drought-hardy crop +5 bonus.`
        );
        dynamicRulesBn.push(
          `নিয়ম JAXA-01: যৌথ উপগ্রহ তথ্যে খরা পরিস্থিতিতে খরা-সহনশীল ফসলে +৫ বোনাস।`
        );
      }
    }

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
        `নিয়ম ET-04: বেশি বাষ্পীভবনের (${wBal.toFixed(0)} মিমি) কারণে সেচনির্ভর ফসলে ৫ নম্বর কাটা হয়েছে।`,
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
    dynamicRulesBn.push('নিয়ম INC-01: ভালো বাজারমূল্যের সম্ভাবনা থাকায় +৫ নম্বর (আনুমানিক হিসাব, তাৎক্ষণিক বাজারদর নয়)।');
  }
  if (primary === 'quick_harvest' && crop.durationDays <= 85) {
    dynamicRulesEn.push(`Rule HARV-01: Quick turnaround crop (${crop.durationDays} days <= 85) frees field early (+4 to +6 pts).`);
    dynamicRulesBn.push(`নিয়ম HARV-01: দ্রুত ফসল ওঠায় (${crop.durationDays} দিন) জমি তাড়াতাড়ি খালি হয় (+৪ থেকে +৬ নম্বর)।`);
  }
  if (primary === 'family_food' && (crop.isStaple || ['boro_rice', 'aman_rice', 'aus_rice', 'wheat', 'lentil'].includes(crop.id))) {
    dynamicRulesEn.push('Rule STAPLE-01: Essential staple food crop awarded +5 nutritional security bonus.');
    dynamicRulesBn.push('নিয়ম STAPLE-01: পরিবারের মূল খোরাকির ফসল হিসেবে +৫ নম্বর যোগ হয়েছে।');
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
      return lang === 'en' ? 'Save Water' : 'পানি বাঁচানো';
    case 'lower_cost':
      return lang === 'en' ? 'Lower Cost' : 'কম খরচ';
    case 'improve_soil':
      return lang === 'en' ? 'Improve Soil Health' : 'মাটির শক্তি ফেরানো';
    case 'reduce_risk':
      return lang === 'en' ? 'Reduce Climate Risk' : 'আবহাওয়ার ঝুঁকি কমানো';
    case 'higher_income':
      return lang === 'en' ? 'Higher Income' : 'বেশি লাভ';
    case 'quick_harvest':
      return lang === 'en' ? 'Quick Harvest' : 'দ্রুত ফসল তোলা';
    case 'family_food':
      return lang === 'en' ? 'Family Food Security' : 'পারিবারিক খোরাকি';
    case 'maximize_profit':
      return lang === 'en' ? 'Higher Income' : 'বেশি লাভ';
    case 'maximize_yield':
      return lang === 'en' ? 'Good Yield' : 'ভালো ফলন';
    default:
      return String(priority).replace('_', ' ');
  }
}

export const PRIORITY_META: Record<
  FarmerPriorityId,
  { titleEn: string; titleBn: string }
> = {
  save_water: { titleEn: 'Save Water', titleBn: 'পানি বাঁচানো' },
  lower_cost: { titleEn: 'Lower Cost', titleBn: 'কম খরচ' },
  improve_soil: { titleEn: 'Improve Soil Health', titleBn: 'মাটির শক্তি ফেরানো' },
  reduce_risk: { titleEn: 'Reduce Climate Risk', titleBn: 'আবহাওয়ার ঝুঁকি কমানো' },
  higher_income: { titleEn: 'Higher Income', titleBn: 'বেশি লাভ' },
  quick_harvest: { titleEn: 'Quick Harvest', titleBn: 'দ্রুত ফসল তোলা' },
  family_food: { titleEn: 'Family Food Security', titleBn: 'পারিবারিক খোরাকি' },
  maximize_profit: { titleEn: 'Higher Income', titleBn: 'বেশি লাভ' },
  maximize_yield: { titleEn: 'Good Yield', titleBn: 'ভালো ফলন' },
};

export const PRIORITY_INFLUENCE: Record<FarmerPriorityId, { en: string; bn: string }> = {
  save_water: {
    en: 'Save Water boost: low-water crops gain up to +4 match points; flood-irrigated Boro rice is penalized by up to 18 points when water is limited.',
    bn: 'পানি বাঁচানোর প্রভাব: কম পানির ফসল সর্বোচ্চ +৪ নম্বর পায়; পানি কম থাকলে সেচনির্ভর বোরো ধান ১৮ নম্বর পর্যন্ত হারায়।',
  },
  lower_cost: {
    en: 'Lower Cost boost: low-input Mustard, Lentil, and Jute gain up to +4; diesel-heavy Boro and capital-heavy Potato lose up to 12.',
    bn: 'কম খরচের প্রভাব: কম খরচের সরিষা, মসুর ও পাট সর্বোচ্চ +৪ পায়; বেশি খরচের বোরো ও আলুর নম্বর ১২ পর্যন্ত কমে যায়।',
  },
  improve_soil: {
    en: 'Soil Health boost: nitrogen-fixing Mungbean, Jute, and Lentil gain up to +5 match points for rebuilding soil fertility.',
    bn: 'মাটির শক্তি ফেরানোর প্রভাব: মাটিতে নাইট্রোজেন যোগ করা মুগ, পাট ও মসুর সর্বোচ্চ +৫ নম্বর পায়।',
  },
  reduce_risk: {
    en: 'Climate Risk boost: short-duration crops gain up to +6 for escaping heatwaves and erratic storms.',
    bn: 'ঝুঁকি কমানোর প্রভাব: দুর্যোগ এড়াতে কম সময়ে ওঠা সহনশীল ফসল সর্বোচ্চ +৬ নম্বর পায়।',
  },
  higher_income: {
    en: 'Higher Income boost (approximate, not live market prices): high commercial value crops (Potato, Maize, Mustard, Lentil) gain +5 points.',
    bn: 'বেশি লাভের প্রভাব (আনুমানিক, বাজারদর নয়): বেশি দামের ফসল (আলু, ভুট্টা, সরিষা, মসুর) সর্বোচ্চ +৫ নম্বর পায়।',
  },
  quick_harvest: {
    en: 'Quick Harvest boost: ultra-fast turnaround crops (<=75 days like Mungbean, Mustard) gain up to +6 to free land rapidly.',
    bn: 'দ্রুত ফসল তোলার প্রভাব: খুব কম সময়ে ওঠা ফসল (মুগ ডাল, সরিষা) জমি তাড়াতাড়ি খালি করার জন্য সর্বোচ্চ +৬ নম্বর পায়।',
  },
  family_food: {
    en: 'Food Security boost: daily household staples (rice, wheat, pulses) gain +5 points for securing family nutrition.',
    bn: 'পারিবারিক খোরাকির প্রভাব: পরিবারের খাওয়ার জন্য প্রধান দানা ও ডাল জাতীয় ফসল সর্বোচ্চ +৫ নম্বর পায়।',
  },
  maximize_profit: {
    en: 'Higher Income boost (approximate, not live market prices): high commercial value crops gain +5 points.',
    bn: 'বেশি লাভের প্রভাব (আনুমানিক, বাজারদর নয়): বেশি দামের ফসল সর্বোচ্চ +৫ নম্বর পায়।',
  },
  maximize_yield: {
    en: 'Good Yield boost: reliable, proven crops gain up to +6 points under favorable conditions.',
    bn: 'ভালো ফলনের প্রভাব: নিয়মমাফিক ভালো ফলন দেয় এমন নির্ভরযোগ্য ফসল সর্বোচ্চ +৬ নম্বর পায়।',
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
      : 'দ্বিতীয় পছন্দের ক্ষেত্রে নিয়মগুলো অর্ধেক গুরুত্ব পায়: ';
  return `${main} ${prefix}${sub}`;
}
