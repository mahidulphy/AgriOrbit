/**
 * AgriOrbit Field Action Weather Advisory Engine
 *
 * PIPELINE:
 *   NASA GPM / IMERG (Recent rainfall observation / estimate - ~10km grid)
 *           ↓
 *   Open-Meteo (7-day precipitation forecast)
 *           ↓
 *   Current field conditions (SMAP root-zone soil moisture: High/Moderate/Low)
 *           ↓
 *   Crop / season context (cropping season, specific field operations)
 *           ↓
 *   AgriOrbit deterministic rules (configurable & transparent thresholds)
 *           ↓
 *   FIELD ACTION ADVISORY
 *
 * SCIENTIFIC HONESTY & PROVENANCE:
 * - NASA GPM observes recent precipitation (~10 km grid). NOT a weather forecast.
 * - Open-Meteo provides 7-day weather forecast. NOT NASA data.
 * - AgriOrbit deterministic rules combine these with crop context to advise the farmer.
 * - NASA does NOT endorse or issue farmer crop instructions.
 */

import type { DistrictId } from '../data/bdAdmin';
import type { FarmerPriorityId, Language } from '../types';
import { STRINGS } from '../i18n';
import {
  type GpmObservationResult,
  getGpmObservation,
  GPM_THRESHOLDS,
} from '../services/gpm';
import {
  type WeatherForecastResult,
  getWeatherForecast,
  FORECAST_THRESHOLDS,
} from '../services/weatherForecast';

export interface AdvisoryThresholds {
  /** 7-day forecast rainfall threshold for heavy rain risk (mm) */
  heavyRain7dMm: number;
  /** 7-day forecast rainfall threshold for extreme downpour (mm) */
  extremeRain7dMm: number;
  /** Single-day peak rain threshold (mm) */
  peakRainSingleDayMm: number;
  /** 7-day forecast rainfall threshold for dry spell (mm) */
  drySpell7dMm: number;
  /** NASA GPM recent 7-day rainfall threshold for elevated conditions (mm) */
  gpmElevatedRainMm: number;
  /** NASA GPM recent 7-day rainfall threshold for deficit conditions (mm) */
  gpmDeficitRainMm: number;
  /** SMAP soil moisture low / deficit threshold (m³/m³) */
  soilMoistureLow: number;
  /** SMAP soil moisture high / saturation threshold (m³/m³) */
  soilMoistureHigh: number;
}

export const DEFAULT_ADVISORY_THRESHOLDS: AdvisoryThresholds = {
  heavyRain7dMm: 65,
  extremeRain7dMm: 120,
  peakRainSingleDayMm: 30,
  drySpell7dMm: 10,
  gpmElevatedRainMm: 40,
  gpmDeficitRainMm: 12,
  soilMoistureLow: 0.20,
  soilMoistureHigh: 0.28,
};

export type ConditionType =
  | 'heavy_rain_saturated'
  | 'heavy_rain_recharge'
  | 'heavy_rain_moderate'
  | 'dry_spell'
  | 'favorable';

export type AdvisorySeverity = 'danger' | 'warning' | 'info' | 'success';

export interface EvaluatedParameter {
  parameter: string;
  source: 'NASA GPM' | 'Open-Meteo' | 'NASA SMAP' | 'Season Calendar';
  observedValue: string | number;
  thresholdCondition: string;
  satisfied: boolean;
}

export interface WeatherAdvisoryResult {
  conditionType: ConditionType;
  severity: AdvisorySeverity;
  ruleId: string;
  titleEn: string;
  titleBn: string;
  headlineEn: string;
  headlineBn: string;

  // Provenance 1: NASA GPM Observation
  gpm: GpmObservationResult;

  // Provenance 2: Open-Meteo Forecast
  forecast: WeatherForecastResult;

  // Field Condition
  fieldCondition: {
    soilMoistureStatus: 'High' | 'Moderate' | 'Low';
    soilMoistureStatusBn: 'উচ্চ' | 'মাঝারি' | 'কম';
    soilMoistureValue: number;
    smapStatusLabelEn: string;
    smapStatusLabelBn: string;
    rootZoneInsightEn: string;
    rootZoneInsightBn: string;
  };

  // Provenance 3: AgriOrbit Advisory
  advisory: {
    sourceBadge: 'AGRIORBIT';
    recommendedActionEn: string;
    recommendedActionBn: string;
    agronomicRationaleEn: string;
    agronomicRationaleBn: string;
    cropSpecificNoteEn?: string;
    cropSpecificNoteBn?: string;
  };

  // Provenance Transparency: "Why am I seeing this?"
  whyExplanation: {
    rulesTriggered: string[];
    rulesTriggeredBn: string[];
    thresholdsEvaluated: EvaluatedParameter[];
    scientificNotesEn: string;
    scientificNotesBn: string;
  };

  dataSourceStatus: {
    isLive: boolean;
    provenanceLabelEn: string;
    provenanceLabelBn: string;
  };
}

export interface AdvisoryRuleContext {
  gpm: GpmObservationResult;
  forecast: WeatherForecastResult;
  soilMoisture: number; // SMAP m³/m³ (e.g. 0.18, 0.26, 0.32)
  districtId: DistrictId | string;
  upazilaName?: string;
  season?: 'Rabi' | 'Kharif-1' | 'Kharif-2';
  targetCropId?: string;
  farmerPriority?: FarmerPriorityId;
  thresholds?: Partial<AdvisoryThresholds>;
}

/**
 * Derives Bangladesh cropping season if not explicitly provided.
 * Kharif-1: March–June
 * Kharif-2: July–October (Aman rice season)
 * Rabi: November–February (Winter pulses, mustard, wheat, boro)
 */
export function getBangladeshSeason(date = new Date()): 'Rabi' | 'Kharif-1' | 'Kharif-2' {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 6) return 'Kharif-1';
  if (month >= 7 && month <= 10) return 'Kharif-2';
  return 'Rabi';
}

/**
 * Pure, deterministic evaluation of the AgriOrbit Weather Advisory rules.
 * Does not make network calls; 100% testable across all weather/soil permutations.
 */
export function evaluateWeatherAdvisory(context: AdvisoryRuleContext): WeatherAdvisoryResult {
  const thresholds: AdvisoryThresholds = {
    ...DEFAULT_ADVISORY_THRESHOLDS,
    ...context.thresholds,
  };

  const { gpm, forecast, soilMoisture } = context;
  const season = context.season ?? getBangladeshSeason();
  const upazila = context.upazilaName ?? 'Selected Field';

  // Determine Soil Moisture Tier
  let soilMoistureStatus: 'High' | 'Moderate' | 'Low' = 'Moderate';
  let soilMoistureStatusBn: 'উচ্চ' | 'মাঝারি' | 'কম' = 'মাঝারি';
  let smapLabelEn = 'Optimal Range (0.20–0.28 m³/m³)';
  let smapLabelBn = 'অনুকূল মাত্রা (০.২০–০.২৮ m³/m³)';
  let rootZoneInsightEn = 'Root-zone moisture is sufficient for moderate-demand vegetation.';
  let rootZoneInsightBn = 'মাটির মূলস্তরে উদ্ভিদের জন্য পর্যাপ্ত আর্দ্রতা রয়েছে।';

  if (soilMoisture >= thresholds.soilMoistureHigh) {
    soilMoistureStatus = 'High';
    soilMoistureStatusBn = 'উচ্চ';
    smapLabelEn = 'High / Near-Saturation (> 0.28 m³/m³)';
    smapLabelBn = 'অতিরিক্ত আর্দ্রতা (> ০.২৮ m³/m³)';
    rootZoneInsightEn = 'Topsoil is heavily saturated; risk of standing waterlogging if additional rain occurs.';
    rootZoneInsightBn = 'মাটির উপরিভাগ অতিরিক্ত ভেজা; আরও বৃষ্টি হলে পানি জমে যাওয়ার ঝুঁকি রয়েছে।';
  } else if (soilMoisture < thresholds.soilMoistureLow) {
    soilMoistureStatus = 'Low';
    soilMoistureStatusBn = 'কম';
    smapLabelEn = 'Deficit / Low Moisture (< 0.20 m³/m³)';
    smapLabelBn = 'ঘাটতি / স্বল্প আর্দ্রতা (< ০.২০ m³/m³)';
    rootZoneInsightEn = 'Root-zone moisture is depleted; un-irrigated topsoil dries out rapidly.';
    rootZoneInsightBn = 'মাটির মূলস্তরে রস কম; সেচবিহীন জমি দ্রুত শুকিয়ে যায়।';
  }

  // Evaluate Rule Conditions
  const isForecastHeavyRain =
    forecast.totalRain7dMm >= thresholds.heavyRain7dMm ||
    forecast.peakRainMm >= thresholds.peakRainSingleDayMm;

  const isForecastDry = forecast.totalRain7dMm <= thresholds.drySpell7dMm;
  const isGpmElevated = gpm.recentRain7dMm >= thresholds.gpmElevatedRainMm || gpm.baselineComparison === 'Elevated';
  const isGpmDeficit = gpm.recentRain7dMm <= thresholds.gpmDeficitRainMm || gpm.baselineComparison === 'Deficit';

  let conditionType: ConditionType = 'favorable';
  let severity: AdvisorySeverity = 'success';
  let ruleId = 'RULE-FAV-01';
  let titleEn = 'Weather Advisory: Favorable Field Conditions';
  let titleBn = 'আবহাওয়া উপদেষ্টা: অনুকূল মাঠ পরিস্থিতি';
  let headlineEn = 'Conditions favorable for standard seasonal field operations';
  let headlineBn = 'স্বাভাবিক মৌসুমী কৃষি কাজের জন্য আবহাওয়া অনুকূল রয়েছে';

  let recommendedActionEn = STRINGS.en.weatherAdvisory.actions.proceedRoutineOperations;
  let recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.proceedRoutineOperations;
  let agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.favorableBalance(forecast.totalRain7dMm, soilMoisture.toFixed(2));
  let agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.favorableBalance(forecast.totalRain7dMm, soilMoisture.toFixed(2));
  let cropSpecificNoteEn: string | undefined;
  let cropSpecificNoteBn: string | undefined;

  const evaluatedParams: EvaluatedParameter[] = [
    {
      parameter: '7-Day Precipitation Forecast (Open-Meteo)',
      source: 'Open-Meteo',
      observedValue: `${forecast.totalRain7dMm} mm`,
      thresholdCondition: `forecast ${forecast.totalRain7dMm}mm ${forecast.totalRain7dMm >= thresholds.heavyRain7dMm ? '>' : '≤'} heavyRain7dMm ${thresholds.heavyRain7dMm}mm`,
      satisfied: isForecastHeavyRain,
    },
    {
      parameter: 'Recent Observed Rainfall (NASA GPM / IMERG)',
      source: 'NASA GPM',
      observedValue: `${gpm.recentRain7dMm} mm (${gpm.baselineComparison})`,
      thresholdCondition: `gpmRecent ${gpm.recentRain7dMm}mm ${gpm.recentRain7dMm >= thresholds.gpmElevatedRainMm ? '>' : '≤'} gpmElevated ${thresholds.gpmElevatedRainMm}mm`,
      satisfied: isGpmElevated,
    },
    {
      parameter: 'Root-Zone Soil Moisture (NASA SMAP)',
      source: 'NASA SMAP',
      observedValue: `${soilMoisture.toFixed(2)} m³/m³ (${soilMoistureStatus})`,
      thresholdCondition: `soilMoisture ${soilMoisture.toFixed(2)} ${soilMoisture >= thresholds.soilMoistureHigh ? '>' : '≤'} soilMoistureHigh ${thresholds.soilMoistureHigh}`,
      satisfied: soilMoistureStatus === 'High',
    },
    {
      parameter: 'Cropping Season Context',
      source: 'Season Calendar',
      observedValue: season,
      thresholdCondition: 'season = Kharif-2 (Aman) / Rabi (Winter) / Kharif-1',
      satisfied: true,
    },
  ];

  // ----------------------------------------------------
  // DETERMINISTIC RULE BRANCHES
  // ----------------------------------------------------

  // RULE 1: Heavy Rainfall + High Soil Moisture
  if (isForecastHeavyRain && soilMoistureStatus === 'High') {
    conditionType = 'heavy_rain_saturated';
    severity = 'danger';
    ruleId = 'RULE-HR-SATURATED-01';
    titleEn = 'Weather Advisory: Heavy Rainfall & Waterlogging Risk';
    titleBn = 'আবহাওয়া উপদেষ্টা: ভারী বৃষ্টি ও জলাবদ্ধতার উচ্চ ঝুঁকি';
    headlineEn = 'Heavy rainfall predicted over saturated soil';
    headlineBn = 'অতিরিক্ত আর্দ্র মাটিতে ভারী বৃষ্টিপাতের পূর্বাভাস';

    recommendedActionEn = STRINGS.en.weatherAdvisory.actions.avoidIrrigationDrainage;
    recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.avoidIrrigationDrainage;
    agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.saturatedRisk(forecast.totalRain7dMm, soilMoisture.toFixed(2));
    agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.saturatedRisk(forecast.totalRain7dMm, soilMoisture.toFixed(2));

    if (season === 'Kharif-2') {
      cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.amanDelaySeedbeds;
      cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.amanDelaySeedbeds;
    } else if (season === 'Rabi') {
      cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.rabiDelayPotatoPulse;
      cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.rabiDelayPotatoPulse;
    } else {
      cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.postponeFertilizerSprays;
      cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.postponeFertilizerSprays;
    }
  }

  // RULE 2: Heavy Rainfall + Low Soil Moisture (Natural Recharge)
  else if (isForecastHeavyRain && soilMoistureStatus === 'Low') {
    conditionType = 'heavy_rain_recharge';
    severity = 'warning';
    ruleId = 'RULE-HR-RECHARGE-02';
    titleEn = 'Weather Advisory: Natural Soil Moisture Recharge Expected';
    titleBn = 'আবহাওয়া উপদেষ্টা: প্রাকৃতিক বৃষ্টিতে মাটির আর্দ্রতা পূরণের সুযোগ';
    headlineEn = 'Heavy rain expected to recharge dry soil — pause pumping';
    headlineBn = 'আসন্ন বৃষ্টি শুষ্ক জমি ভিজিয়ে দেবে — সেচ পাম্প স্থগিত রাখুন';

    recommendedActionEn = STRINGS.en.weatherAdvisory.actions.delayPlannedIrrigation;
    recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.delayPlannedIrrigation;
    agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.naturalRecharge(forecast.totalRain7dMm, soilMoisture.toFixed(2));
    agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.naturalRecharge(forecast.totalRain7dMm, soilMoisture.toFixed(2));

    cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.naturalRechargeTilling;
    cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.naturalRechargeTilling;
  }

  // RULE 3: Heavy Rainfall + Moderate Soil Moisture
  else if (isForecastHeavyRain) {
    conditionType = 'heavy_rain_moderate';
    severity = 'warning';
    ruleId = 'RULE-HR-MODERATE-03';
    titleEn = 'Weather Advisory: Heavy Rainfall Risk Ahead';
    titleBn = 'আবহাওয়া উপদেষ্টা: আগামী ৭ দিনে ভারী বৃষ্টিপাতের ঝুঁকি';
    headlineEn = `Heavy rainfall predicted (~${forecast.totalRain7dMm} mm over next 7 days)`;
    headlineBn = `আগামী ৭ দিনে প্রায় ${forecast.totalRain7dMm} মিমি ভারী বৃষ্টির পূর্বাভাস`;

    recommendedActionEn = STRINGS.en.weatherAdvisory.actions.holdOffIrrigationDelayFertilizer;
    recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.holdOffIrrigationDelayFertilizer;
    agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.heavyRainModerate(forecast.totalRain7dMm, forecast.peakRainMm, forecast.peakRainDate);
    agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.heavyRainModerate(forecast.totalRain7dMm, forecast.peakRainMm, forecast.peakRainDate);

    if (season === 'Kharif-2') {
      cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.amanReinforceBunds;
      cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.amanReinforceBunds;
    } else {
      cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.delayPesticideSprays;
      cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.delayPesticideSprays;
    }
  }

  // RULE 4: Persistent Dry Spell & Moisture Deficit
  else if (isForecastDry && (soilMoistureStatus === 'Low' || isGpmDeficit)) {
    conditionType = 'dry_spell';
    severity = 'warning';
    ruleId = 'RULE-DRY-SPELL-04';
    titleEn = 'Weather Advisory: Dry Spell & Soil Moisture Deficit';
    titleBn = 'আবহাওয়া উপদেষ্টা: অনাবৃষ্টি ও মাটির আর্দ্রতা ঘাটতি';
    headlineEn = 'Dry conditions persist — low rainfall and low soil moisture';
    headlineBn = 'শুষ্ক আবহাওয়া অব্যাহত — বৃষ্টিপাতের ঘাটতি ও মাটিতে রসের অভাব';

    recommendedActionEn = STRINGS.en.weatherAdvisory.actions.scheduleLightIrrigationMulch;
    recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.scheduleLightIrrigationMulch;
    agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.drySpellDeficit(forecast.totalRain7dMm, gpm.recentRain7dMm, soilMoisture.toFixed(2));
    agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.drySpellDeficit(forecast.totalRain7dMm, gpm.recentRain7dMm, soilMoisture.toFixed(2));

    cropSpecificNoteEn = STRINGS.en.weatherAdvisory.cropNotes.droughtSensitiveMicroIrrigation;
    cropSpecificNoteBn = STRINGS.bn.weatherAdvisory.cropNotes.droughtSensitiveMicroIrrigation;
  }

  // RULE 5: Favorable
  else {
    conditionType = 'favorable';
    severity = 'success';
    ruleId = 'RULE-FAV-05';
    titleEn = 'Weather Advisory: Favorable Field Conditions';
    titleBn = 'আবহাওয়া উপদেষ্টা: অনুকূল মাঠ পরিস্থিতি';
    headlineEn = 'Favorable weather and moisture for routine field operations';
    headlineBn = 'স্বাভাবিক কৃষি কাজের জন্য আবহাওয়া ও মাটির অবস্থা অনুকূল';

    recommendedActionEn = STRINGS.en.weatherAdvisory.actions.proceedRoutineOperations;
    recommendedActionBn = STRINGS.bn.weatherAdvisory.actions.proceedRoutineOperations;
    agronomicRationaleEn = STRINGS.en.weatherAdvisory.rationales.favorableBalance(forecast.totalRain7dMm, soilMoisture.toFixed(2));
    agronomicRationaleBn = STRINGS.bn.weatherAdvisory.rationales.favorableBalance(forecast.totalRain7dMm, soilMoisture.toFixed(2));
  }

  // Rule transparency triggers list
  const rulesTriggered = [
    `${ruleId}: ${titleEn}`,
    `Precipitation Condition: Forecast ${forecast.totalRain7dMm} mm (Threshold: ${isForecastHeavyRain ? '≥ ' + thresholds.heavyRain7dMm : 'Normal'} mm)`,
    `Field Moisture Condition: SMAP ${soilMoisture.toFixed(2)} m³/m³ classified as ${soilMoistureStatus}`,
    `Cropping Season Context: ${season} in ${upazila}`,
  ];

  const rulesTriggeredBn = [
    `${ruleId}: ${titleBn}`,
    `বৃষ্টিপাত পরিস্থিতি: পূর্বাভাস ${forecast.totalRain7dMm} মিমি`,
    `মাটির আর্দ্রতা পরিস্থিতি: এসএমএপি ${soilMoisture.toFixed(2)} m³/m³ (${soilMoistureStatusBn})`,
    `মৌসুমী প্রেক্ষাপট: ${season} (${upazila})`,
  ];

  const isLive = gpm.dataStatus === 'live' || forecast.dataStatus === 'live';
  const provenanceLabelEn = isLive
    ? 'Live Observation · NASA GPM + Open-Meteo'
    : `Using cached observation · Updated ${new Date(gpm.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  const provenanceLabelBn = isLive
    ? 'সরাসরি উপগ্রহ তথ্য · নাসা জিপিএম + ওপেন-মেটিও'
    : `সংরক্ষিত তথ্য ব্যবহার হচ্ছে · আপডেট: ${new Date(gpm.updatedAt).toLocaleDateString('bn-BD', { day: '2-digit', month: 'short', year: 'numeric' })}`;

  return {
    conditionType,
    severity,
    ruleId,
    titleEn,
    titleBn,
    headlineEn,
    headlineBn,
    gpm,
    forecast,
    fieldCondition: {
      soilMoistureStatus,
      soilMoistureStatusBn,
      soilMoistureValue: soilMoisture,
      smapStatusLabelEn: smapLabelEn,
      smapStatusLabelBn: smapLabelBn,
      rootZoneInsightEn,
      rootZoneInsightBn,
    },
    advisory: {
      sourceBadge: 'AGRIORBIT',
      recommendedActionEn,
      recommendedActionBn,
      agronomicRationaleEn,
      agronomicRationaleBn,
      cropSpecificNoteEn,
      cropSpecificNoteBn,
    },
    whyExplanation: {
      rulesTriggered,
      rulesTriggeredBn,
      thresholdsEvaluated: evaluatedParams,
      scientificNotesEn:
        'NASA GPM observes recent cumulative rainfall over a ~10 km grid. Open-Meteo provides the 7-day numerical forecast. AgriOrbit combines these physical inputs with local soil characteristics and cropping calendars using deterministic agronomic rules. NASA does not issue agricultural advisories.',
      scientificNotesBn:
        'নাসা জিপিএম ১০ কিমি গ্রিডে সাম্প্রতিক বৃষ্টিপাত পর্যবেক্ষণ করে। ওপেন-মেটিও আগামী ৭ দিনের পূর্বাভাস দেয়। এগ্রিঅরবিট এই তথ্যগুলো স্থানীয় মাটির চরিত্র ও কৃষি ক্যালেন্ডারের সাথে মিলিয়ে সুনির্দিষ্ট নিয়মের ভিত্তিতে পরামর্শ তৈরি করে। নাসা সরাসরি কৃষকদের কোন পরামর্শ জারি করে না।',
    },
    dataSourceStatus: {
      isLive,
      provenanceLabelEn,
      provenanceLabelBn,
    },
  };
}

/**
 * End-to-end async loader that coordinates the full Advisory pipeline for the selected field.
 */
export async function getWeatherAdvisoryForLocation(
  districtId: DistrictId | string,
  lat?: number,
  lng?: number,
  soilMoisture = 0.22,
  farmerPriority?: FarmerPriorityId,
  options?: {
    upazilaName?: string;
    season?: 'Rabi' | 'Kharif-1' | 'Kharif-2';
    thresholds?: Partial<AdvisoryThresholds>;
  },
): Promise<WeatherAdvisoryResult> {
  const [gpm, forecast] = await Promise.all([
    getGpmObservation(districtId, lat, lng),
    getWeatherForecast(districtId, lat, lng),
  ]);

  return evaluateWeatherAdvisory({
    gpm,
    forecast,
    soilMoisture,
    districtId,
    upazilaName: options?.upazilaName,
    season: options?.season,
    farmerPriority,
    thresholds: options?.thresholds,
  });
}
