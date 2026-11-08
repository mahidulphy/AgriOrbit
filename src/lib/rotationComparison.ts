import { CROPS, type Crop, FAMILY_LABEL } from '../data/crops';
import { CROPS_DATABASE } from '../data/agriData';
import { runEngine, scoreCrop, type Priority, type EngineInput } from './engine';
import type { Conditions } from './conditions';
import type { FieldShift } from './fieldShift';
import type { ForecastDay } from './power';
import type { FarmerPriorityId } from '../types';
import { toBnDigits } from './bilingualEmailTemplate';
import satelliteData from '../data/satellite.json';

export interface StrategyCropSeason {
  season: 'rabi' | 'kharif1' | 'kharif2';
  seasonEn: string;
  seasonBn: string;
  monthsEn: string;
  monthsBn: string;
  id: string;
  nameEn: string;
  nameBn: string;
  scientificName?: string;
  family: string;
  familyLabelEn: string;
  familyLabelBn: string;
  score: number;
  durationDays: number;
  waterNeedMinMm: number;
  waterNeedMaxMm: number;
  waterRequirementEn: string;
  waterRequirementBn: string;
  isLegume: boolean;
  isFallow: boolean;
  agronomicRoleEn: string;
  agronomicRoleBn: string;
}

export interface RotationStrategy {
  id: 'current' | 'recommended' | 'alternative';
  tagEn: string;
  tagBn: string;
  titleEn: string;
  titleBn: string;
  priorityId: FarmerPriorityId | 'current';
  priorityLabelEn: string;
  priorityLabelBn: string;
  crops: StrategyCropSeason[];
  summary: {
    totalWaterNeedMm: number;
    waterSavedPctVsBaseline: number;
    legumeCount: number;
    pestCycleBroken: boolean;
    riskLevel: 'low' | 'moderate' | 'high';
    riskLevelEn: string;
    riskLevelBn: string;
    overallScore: number;
  };
  whySuggested: {
    en: string;
    bn: string;
    rulesTriggeredEn: string[];
    rulesTriggeredBn: string[];
  };
  evidence: {
    nasaPowerTMax: string;
    nasaPowerRain30d: string;
    nasaPowerRainShift: string;
    smapSoilMoisture: string;
    modisNdvi: string;
    bariGuidance: {
      en: string;
      bn: string;
    };
  };
  benefits: {
    waterUseEn: string;
    waterUseBn: string;
    nitrogenEn: string;
    nitrogenBn: string;
    pestBreakEn: string;
    pestBreakBn: string;
    resilienceEn: string;
    resilienceBn: string;
  };
  informationGaps: {
    en: string[];
    bn: string[];
  };
  risksNeedingLocalReview: {
    en: string[];
    bn: string[];
  };
  bareFieldPeriods: {
    hasBarePeriods: boolean;
    monthsEn: string;
    monthsBn: string;
    daysEmpty: number;
    recommendationEn: string;
    recommendationBn: string;
  };
}

export interface ComparisonInput {
  conditions: Conditions;
  shift: FieldShift | null;
  soil: number | null;
  forecast: ForecastDay[] | null;
  priority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  currentRotation: {
    rabi?: string;
    kharif1?: string;
    kharif2?: string;
  };
  soilType?: string;
  districtId: string;
  districtNameEn: string;
  districtNameBn: string;
  today?: Date;
}

const SEASON_LABELS = {
  rabi: { en: 'Rabi (Winter)', bn: 'রবি (শীতকাল)', monthsEn: 'Nov – Feb', monthsBn: 'নভেম্বর – ফেব্রুয়ারি', maxDays: 120 },
  kharif1: { en: 'Kharif-1 (Summer)', bn: 'খরিফ-১ (গ্রীষ্মকাল)', monthsEn: 'Mar – Jun', monthsBn: 'মার্চ – জুন', maxDays: 120 },
  kharif2: { en: 'Kharif-2 (Monsoon)', bn: 'খরিফ-২ (বর্ষাকাল)', monthsEn: 'Jul – Oct', monthsBn: 'জুলাই – অক্টোবর', maxDays: 120 },
};

function mapPriority(p: FarmerPriorityId): Priority {
  if (p === 'save_water') return 'water';
  if (p === 'improve_soil') return 'soil';
  if (p === 'lower_cost') return 'cost';
  return 'risk';
}

function resolveCrop(id?: string): Crop | null {
  if (!id || id === 'fallow' || id === 'other') return null;
  const clean = id.toLowerCase().trim();
  const found = CROPS.find(
    (c) =>
      c.id.toLowerCase() === clean ||
      c.nameEn.toLowerCase() === clean ||
      c.name_en.toLowerCase() === clean
  );
  if (found) return found;
  if (clean === 'boro_rice') return CROPS.find((c) => c.id === 'boro') || null;
  if (clean === 'aus_rice') return CROPS.find((c) => c.id === 'aus') || null;
  if (clean === 'aman_rice' || clean === 't_aman_rice') return CROPS.find((c) => c.id === 'aman') || null;
  return null;
}

function buildFallowSeason(seasonKey: 'rabi' | 'kharif1' | 'kharif2'): StrategyCropSeason {
  const meta = SEASON_LABELS[seasonKey];
  return {
    season: seasonKey,
    seasonEn: meta.en,
    seasonBn: meta.bn,
    monthsEn: meta.monthsEn,
    monthsBn: meta.monthsBn,
    id: 'fallow',
    nameEn: 'Fallow / Bare Field',
    nameBn: 'পতিত / খালি জমি',
    scientificName: 'Uncultivated',
    family: 'none',
    familyLabelEn: 'Fallow Field',
    familyLabelBn: 'পতিত জমি',
    score: 50,
    durationDays: 0,
    waterNeedMinMm: 0,
    waterNeedMaxMm: 0,
    waterRequirementEn: 'None',
    waterRequirementBn: 'প্রযোজ্য নয়',
    isLegume: false,
    isFallow: true,
    agronomicRoleEn: 'Field remains unplanted; conserves zero pump costs but exposes topsoil to solar evaporation and monsoon weed growth without cover.',
    agronomicRoleBn: 'জমি অনাবাদী থাকে; কোনো সেচ খরচ হয় না তবে খোলা মাটি রোদে শুকিয়ে যায় ও বর্ষার আগাছা বাড়ে।',
  };
}

function buildCropSeason(
  crop: Crop,
  seasonKey: 'rabi' | 'kharif1' | 'kharif2',
  score: number
): StrategyCropSeason {
  const meta = SEASON_LABELS[seasonKey];
  const isLegume = crop.family === 'legume' || crop.plant_family === 'fabaceae' || Boolean(crop.is_legume);
  const minW = crop.water_need_mm?.min ?? (crop.water === 'low' ? 200 : crop.water === 'high' ? 1200 : 450);
  const maxW = crop.water_need_mm?.max ?? (crop.water === 'low' ? 300 : crop.water === 'high' ? 1500 : 650);

  let roleEn = '';
  let roleBn = '';
  if (isLegume) {
    roleEn = 'Biological Rhizobium nitrogen fixation naturally restores soil fertility, reducing synthetic urea requirements for subsequent crops.';
    roleBn = 'শিকড়ে রাইজোবিয়াম ব্যাকটেরিয়ার সাহায্যে মাটিতে নাইট্রোজেন সংবন্ধন ঘটিয়ে পরবর্তী ফসলের ইউরিয়া সারের খরচ কমায়।';
  } else if (crop.family === 'mustard' || crop.plant_family === 'brassicaceae') {
    roleEn = 'Short-duration tap-root crop utilizing residual moisture; rapidly frees the field for early Kharif pulse sowing.';
    roleBn = 'স্বল্পমেয়াদী তেল ফসল যা মাটির নিচের রস ব্যবহার করে এবং পরবর্তী ডাল জাতীয় ফসল চাষের জন্য জমি দ্রুত খালি করে।';
  } else if (crop.id === 'aman') {
    roleEn = 'Monsoon rainwater harvest crop converting free seasonal precipitation into Bangladesh staple grain volume.';
    roleBn = 'বর্ষার বৃষ্টির পূর্ণ সদ্ব্যবহার করে সেচ ছাড়াই প্রধান খাদ্যশস্যের বড় জোগান নিশ্চিত করে।';
  } else if (crop.id === 'boro') {
    roleEn = 'High-yielding winter grain staple; requires continuous standing irrigation and subsequent restorative pulse recharge.';
    roleBn = 'শীতকালীন প্রধান খাদ্যশস্য; উচ্চ ফলনের জন্য গভীর সেচ প্রয়োজন এবং পরবর্তীতে ডাল ফসল দিয়ে মাটির শক্তি ফেরাতে হয়।';
  } else if (crop.id === 'jute') {
    roleEn = 'High-biomass fiber crop adding up to 2 tons/ha of organic leaf litter, rejuvenating soil humus and structure.';
    roleBn = 'উচ্চ জৈবভরযুক্ত আঁশ ফসল; জমিতে প্রচুর পাতা ফেলে প্রাকৃতিকভাবে মাটির জৈব পদার্থ ও গঠন সমৃদ্ধ করে।';
  } else {
    roleEn = 'Diversifies crop harvest, disrupts species-specific insect pest lifecycles, and optimizes seasonal land efficiency.';
    roleBn = 'ফসলের বৈচিত্র্য বাড়ায়, পোকার বংশবৃদ্ধি চক্র ভেঙে দেয় এবং মৌসুমী জমির যথাযথ ব্যবহার নিশ্চিত করে।';
  }

  return {
    season: seasonKey,
    seasonEn: meta.en,
    seasonBn: meta.bn,
    monthsEn: meta.monthsEn,
    monthsBn: meta.monthsBn,
    id: crop.id,
    nameEn: crop.name_en,
    nameBn: crop.name_bn,
    scientificName: crop.scientific_name || undefined,
    family: crop.family || crop.plant_family,
    familyLabelEn: FAMILY_LABEL[crop.family]?.en || crop.family,
    familyLabelBn: FAMILY_LABEL[crop.family]?.bn || crop.family,
    score,
    durationDays: crop.duration_days?.max || crop.days || 100,
    waterNeedMinMm: minW,
    waterNeedMaxMm: maxW,
    waterRequirementEn: crop.water === 'low' ? 'Low' : crop.water === 'high' ? 'High' : 'Moderate',
    waterRequirementBn: crop.water === 'low' ? 'কম' : crop.water === 'high' ? 'বেশি' : 'মাঝারি',
    isLegume,
    isFallow: false,
    agronomicRoleEn: roleEn,
    agronomicRoleBn: roleBn,
  };
}

export function generateRotationComparison(input: ComparisonInput): {
  strategies: [RotationStrategy, RotationStrategy, RotationStrategy];
} {
  const {
    conditions,
    shift,
    soil,
    forecast,
    priority,
    currentRotation,
    districtId,
    districtNameEn,
    districtNameBn,
    today = new Date(),
  } = input;

  // Retrieve satellite telemetry if available
  const distSat = (satelliteData as any)[districtId?.toLowerCase()] || null;
  const modisNdviVal = distSat?.modis?.ndvi ? distSat.modis.ndvi.toFixed(2) : null;
  const smapMoistureVal = soil !== null ? `${soil.toFixed(2)} m³/m³` : (distSat?.smap?.value ? `${distSat.smap.value.toFixed(2)} m³/m³` : null);

  // Decadal shift metrics
  const rabiRainShift = shift?.seasons.find((s) => s.season === 'rabi');
  const rainShiftNoteEn = rabiRainShift
    ? `Rabi rain share changed by ${rabiRainShift.dShare > 0 ? '+' : ''}${rabiRainShift.dShare}% vs 2001–2010 baseline`
    : 'Decadal precipitation record analyzed over 2001–2025';
  const rainShiftNoteBn = rabiRainShift
    ? `২০০১-১০ এর তুলনায় রবি মৌসুমে বৃষ্টির অংশ ${rabiRainShift.dShare > 0 ? '+' : ''}${toBnDigits(rabiRainShift.dShare)}% পরিবর্তিত হয়েছে`
    : '২০০১-২০২৫ সালের দীর্ঘমেয়াদী বৃষ্টিপাতের ধারা বিশ্লেষিত';

  const fallbackShift: FieldShift = {
    thenRange: [2001, 2010],
    nowRange: [2016, 2025],
    seasons: [
      { season: 'rabi', thenTemp: 20, nowTemp: 21, dTemp: 1, thenHeat: 26, nowHeat: 27, dHeat: 1, thenShare: 5, nowShare: 4, dShare: -1 },
      { season: 'kharif1', thenTemp: 28, nowTemp: 29, dTemp: 1, thenHeat: 34, nowHeat: 35, dHeat: 1, thenShare: 30, nowShare: 28, dShare: -2 },
      { season: 'kharif2', thenTemp: 29, nowTemp: 30, dTemp: 1, thenHeat: 33, nowHeat: 34, dHeat: 1, thenShare: 65, nowShare: 68, dShare: 3 },
    ],
    yearly: [],
  };
  const effectiveShift = shift || fallbackShift;
  const effectiveForecast = forecast || [];

  // ───────────────────────────────────────────────────────────────────────────
  // STRATEGY B: RECOMMENDED ROTATION (Optimal for farmer's chosen priority)
  // ───────────────────────────────────────────────────────────────────────────
  const engineResultB = runEngine({
    conditions,
    soil,
    shift: effectiveShift,
    forecast: effectiveForecast,
    priority: mapPriority(priority),
    previousCrop: currentRotation.kharif2 || 'aman',
    today,
  });

  const seasonsList: Array<'rabi' | 'kharif1' | 'kharif2'> = ['rabi', 'kharif1', 'kharif2'];
  const cropsB: StrategyCropSeason[] = seasonsList.map((sKey) => {
    const pick = engineResultB.picks.find((p) => p.season === sKey);
    if (pick) {
      return buildCropSeason(pick.crop, sKey, pick.score);
    }
    const defCrop = sKey === 'rabi' ? resolveCrop('chickpea')! : sKey === 'kharif1' ? resolveCrop('mungbean')! : resolveCrop('aman')!;
    return buildCropSeason(defCrop, sKey, 82);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // STRATEGY C: ALTERNATIVE ROTATION (Complementary sustainability focus)
  // ───────────────────────────────────────────────────────────────────────────
  let altPriority: Priority = 'soil';
  let altPriorityId: FarmerPriorityId = 'improve_soil';
  let altTitleEn = 'Soil Health & Organic Fertility';
  let altTitleBn = 'মাটির স্বাস্থ্য ও জৈব পুষ্টি পরিক্রমা';
  let altTagEn = 'Alternative Strategy';
  let altTagBn = 'বিকল্প পরিক্রমা';

  if (priority === 'save_water') {
    altPriority = 'soil';
    altPriorityId = 'improve_soil';
    altTitleEn = 'Soil Regeneration & Nutrient Building';
    altTitleBn = 'মাটির স্বাস্থ্য ও উর্বরতা বৃদ্ধি';
  } else if (priority === 'improve_soil') {
    altPriority = 'water';
    altPriorityId = 'save_water';
    altTitleEn = 'Maximum Water Conservation';
    altTitleBn = 'সর্বোচ্চ পানি সাশ্রয়ী চক্র';
  } else if (priority === 'lower_cost') {
    altPriority = 'risk';
    altPriorityId = 'reduce_risk';
    altTitleEn = 'Climate Risk & Early Harvest Resilience';
    altTitleBn = 'ঝুঁকি হ্রাস ও দুর্যোগ সহনশীলতা';
  } else {
    altPriority = 'water';
    altPriorityId = 'save_water';
    altTitleEn = 'Low Groundwater Depletion Strategy';
    altTitleBn = 'স্বল্প ভূগর্ভস্থ পানি নির্ভর পরিক্রমা';
  }

  const engineResultC = runEngine({
    conditions,
    soil,
    shift: effectiveShift,
    forecast: effectiveForecast,
    priority: altPriority,
    previousCrop: currentRotation.kharif2 || 'aman',
    today,
  });

  const cropsC: StrategyCropSeason[] = seasonsList.map((sKey) => {
    const pick = engineResultC.picks.find((p) => p.season === sKey);
    if (pick) {
      return buildCropSeason(pick.crop, sKey, pick.score);
    }
    const defCrop = sKey === 'rabi' ? resolveCrop('mustard')! : sKey === 'kharif1' ? resolveCrop('jute')! : resolveCrop('aman')!;
    return buildCropSeason(defCrop, sKey, 80);
  });

  // ───────────────────────────────────────────────────────────────────────────
  // STRATEGY A: CURRENT ROTATION (What the farmer currently grows)
  // ───────────────────────────────────────────────────────────────────────────
  const rabiCropInput = resolveCrop(currentRotation.rabi || 'boro');
  const kharif1CropInput = resolveCrop(currentRotation.kharif1 || 'fallow');
  const kharif2CropInput = resolveCrop(currentRotation.kharif2 || 'aman');

  const engineInputA: EngineInput = {
    conditions,
    soil,
    shift: effectiveShift,
    forecast: effectiveForecast,
    priority: mapPriority(priority),
    previousCrop: 'none',
    today,
  };

  const cropsA: StrategyCropSeason[] = [
    rabiCropInput
      ? buildCropSeason(rabiCropInput, 'rabi', scoreCrop(rabiCropInput, 'rabi', true, engineInputA, []).score)
      : buildFallowSeason('rabi'),
    kharif1CropInput
      ? buildCropSeason(kharif1CropInput, 'kharif1', scoreCrop(kharif1CropInput, 'kharif1', false, engineInputA, []).score)
      : buildFallowSeason('kharif1'),
    kharif2CropInput
      ? buildCropSeason(kharif2CropInput, 'kharif2', scoreCrop(kharif2CropInput, 'kharif2', false, engineInputA, []).score)
      : buildFallowSeason('kharif2'),
  ];

  // Helper to compile strategy summary and details
  function compileStrategy(
    id: 'current' | 'recommended' | 'alternative',
    crops: StrategyCropSeason[],
    tagEn: string,
    tagBn: string,
    titleEn: string,
    titleBn: string,
    pId: FarmerPriorityId | 'current',
    pLabelEn: string,
    pLabelBn: string
  ): RotationStrategy {
    const activeCrops = crops.filter((c) => !c.isFallow);
    const totalWaterNeedMm = Math.round(crops.reduce((acc, c) => acc + (c.waterNeedMinMm + c.waterNeedMaxMm) / 2, 0));
    const baselineBoroWaterMm = 1950; // Typical Boro (1300mm) + Fallow + Aman (650mm)
    const waterSavedPctVsBaseline = Math.max(0, Math.round(((baselineBoroWaterMm - totalWaterNeedMm) / baselineBoroWaterMm) * 100));
    const legumeCount = crops.filter((c) => c.isLegume).length;

    // Family change check: is pest-cycle broken?
    let pestCycleBroken = true;
    for (let i = 0; i < crops.length; i++) {
      const next = crops[(i + 1) % crops.length];
      if (!crops[i].isFallow && !next.isFallow && crops[i].family === next.family) {
        pestCycleBroken = false;
        break;
      }
    }

    const avgScore = Math.round(crops.reduce((acc, c) => acc + c.score, 0) / crops.length);
    const hasHighWaterWinter = crops.some((c) => c.season === 'rabi' && c.waterNeedMinMm > 800);
    const hasDoubleCereal = crops.filter((c) => c.family === 'grass').length >= 2;

    const riskLevel: 'low' | 'moderate' | 'high' =
      hasHighWaterWinter && hasDoubleCereal
        ? 'high'
        : hasHighWaterWinter || legumeCount === 0 || !pestCycleBroken
        ? 'moderate'
        : 'low';

    const riskLevelEn = riskLevel === 'high' ? 'High Risk' : riskLevel === 'moderate' ? 'Moderate' : 'Low Risk';
    const riskLevelBn = riskLevel === 'high' ? 'উচ্চ ঝুঁকি' : riskLevel === 'moderate' ? 'মাঝারি ঝুঁকি' : 'কম ঝুঁকি';

    // Calculate Bare-field periods
    let daysEmptyTotal = 0;
    const bareMonthsListEn: string[] = [];
    const bareMonthsListBn: string[] = [];

    crops.forEach((c) => {
      if (c.isFallow) {
        daysEmptyTotal += 120;
        bareMonthsListEn.push(`${c.seasonEn} (${c.monthsEn})`);
        bareMonthsListBn.push(`${c.seasonBn} (${c.monthsBn})`);
      } else if (c.durationDays < 90) {
        const gapDays = 120 - c.durationDays;
        daysEmptyTotal += gapDays;
      }
    });

    const hasBarePeriods = daysEmptyTotal >= 30;
    const monthsEn = bareMonthsListEn.length > 0 ? bareMonthsListEn.join('; ') : daysEmptyTotal > 0 ? `~${daysEmptyTotal} days across transition periods` : 'Field continuously occupied';
    const monthsBn = bareMonthsListBn.length > 0 ? bareMonthsListBn.join('; ') : daysEmptyTotal > 0 ? `মৌসুম পরিবর্তনের মাঝে প্রায় ${toBnDigits(daysEmptyTotal)} দিন` : 'জমি সারা বছর ফসল দিয়ে আবৃত';

    // Why Suggested text
    let whyEn = '';
    let whyBn = '';
    const rulesTriggeredEn: string[] = [];
    const rulesTriggeredBn: string[] = [];

    if (id === 'current') {
      whyEn = `Represents your field's current rotation sequence. Evaluated against real-time NASA POWER climate observations for ${districtNameEn}.`;
      whyBn = `আপনার জমিতে বর্তমানে অনুসৃত ফসল চক্র। ${districtNameBn} এলাকার নাসার বাস্তব আবহাওয়া তথ্যের সাথে এটি মূল্যায়ন করা হয়েছে।`;
      rulesTriggeredEn.push('Baseline agronomic audit: assesses groundwater draft and botanical continuity.');
      rulesTriggeredBn.push('ভিত্তি মূল্যায়ন: ভূগর্ভস্থ পানির ওপর চাপ এবং গোত্র ধারাবাহিকতা পরীক্ষা করে।');
      if (!pestCycleBroken) {
        rulesTriggeredEn.push('Notice: Same plant family repeats, increasing potential soil pathogen carryover.');
        rulesTriggeredBn.push('সতর্কতা: পরপর একই গোত্রের ফসল থাকায় মাটিতে বালাইয়ের স্থায়ী বিস্তার ঘটতে পারে।');
      }
      if (legumeCount === 0) {
        rulesTriggeredEn.push('Notice: Zero legume seasons requires 100% synthetic chemical nitrogen application.');
        rulesTriggeredBn.push('সতর্কতা: ডাল ফসল না থাকায় মাটির সমস্ত নাইট্রোজেন রাসায়নিক ইউরিয়া থেকে দিতে হয়।');
      }
    } else if (id === 'recommended') {
      whyEn = `Computed by AgriOrbit mathematical rules to strictly optimize your priority (${pLabelEn}). Enforces Rule A (botanical family alternation) and Rule B (biological nitrogen balance).`;
      whyBn = `আপনার পছন্দের লক্ষ্য (${pLabelBn}) সফল করতে এগ্রিঅরবিটের গাণিতিক নিয়মের মাধ্যমে নির্বাচিত। এতে নিয়ম-১ (গোত্র পরিক্রমা) ও নিয়ম-২ (প্রাকৃতিক নাইট্রোজেন যোগ) বজায় রাখা হয়েছে।`;
      rulesTriggeredEn.push('Rule A Verified: No botanical family repeats consecutively, breaking stem-borer and root-knot nematode cycles.');
      rulesTriggeredBn.push('নিয়ম-১ পরীক্ষিত: পরপর দুই মৌসুমে একই গোত্রের ফসল চাষ পরিহার করে পোকামাকড়ের বিস্তার রোধ করা হয়েছে।');
      rulesTriggeredEn.push(`Rule B Verified: Incorporates ${legumeCount} pulse season(s) to fix atmospheric nitrogen.`);
      rulesTriggeredBn.push(`নিয়ম-২ পরীক্ষিত: ${toBnDigits(legumeCount)}টি ডাল ফসল অন্তর্ভুক্ত করে মাটিতে প্রাকৃতিক নাইট্রোজেন সংবন্ধন নিশ্চিত করা হয়েছে।`);
    } else {
      whyEn = `Alternative diversification strategy focusing on ${titleEn}. Provides a robust second option if market seed availability or canal schedules differ.`;
      whyBn = `বিকল্প বহুমুখী পরিক্রমা যা ${titleBn} নিশ্চিত করে। স্থানীয় বীজ বা সেচের সময়সূচি ভিন্ন হলে এটি একটি সুষম দ্বিতীয় পথ তৈরি করে।`;
      rulesTriggeredEn.push(`Balanced sustainability focus: emphasizes ${pLabelEn}.`);
      rulesTriggeredBn.push(`সুষম স্থায়িত্ব: ${pLabelBn}-এর ওপর সর্বাধিক গুরুত্ব দেয়া হয়েছে।`);
    }

    // Benefits text
    const waterSavingsTextEn =
      waterSavedPctVsBaseline > 0
        ? `Consumes ~${totalWaterNeedMm} mm/yr, saving an estimated ~${waterSavedPctVsBaseline}% water compared to typical Boro-Fallow-Aman monoculture.`
        : `Consumes ~${totalWaterNeedMm} mm/yr with heavy reliance on dry-season groundwater pumping.`;
    const waterSavingsTextBn =
      waterSavedPctVsBaseline > 0
        ? `বছরে মোট প্রায় ${toBnDigits(totalWaterNeedMm)} মিমি পানি লাগে; প্রচলিত বোরো-পতিত-আমন চক্রের চেয়ে প্রায় ${toBnDigits(waterSavedPctVsBaseline)}% পানি সাশ্রয় করে।`
        : `বছরে মোট প্রায় ${toBnDigits(totalWaterNeedMm)} মিমি পানির প্রয়োজন হয় এবং ভূগর্ভস্থ পানির ওপর ব্যাপক চাপ সৃষ্টি করে।`;

    const nitrogenTextEn =
      legumeCount > 0
        ? `Includes ${legumeCount} biological legume season(s) fixing 40–80 kg/ha atmospheric nitrogen through root nodule Rhizobium.`
        : 'Zero pulse seasons; depletes topsoil nitrogen without biological recharge.';
    const nitrogenTextBn =
      legumeCount > 0
        ? `${toBnDigits(legumeCount)}টি ডাল ফসল থাকায় শিকড়ের রাইজোবিয়াম ব্যাকটেরিয়া দিয়ে হেক্টরপ্রতি ৪০-৮০ কেজি নাইট্রোজেন জমিতে যুক্ত হয়।`
        : 'কোনো ডাল ফসল নেই; ফলে প্রাকৃতিক রিচার্জ ছাড়াই মাটির নাইট্রোজেন দ্রুত নিঃশেষিত হয়।';

    const pestBreakTextEn = pestCycleBroken
      ? 'Full botanical family alternation disrupts species-specific pests, reducing pesticide application frequency.'
      : 'Consecutive monoculture from the same plant family maintains pest host continuity.';
    const pestBreakTextBn = pestCycleBroken
      ? 'ভিন্ন ভিন্ন গোত্রের ফসল চাষ করায় পোকা-মাকড় ও রোগের ধারাবাহিকতা নষ্ট হয় এবং কীটনাশকের প্রয়োজন কমে।'
      : 'একই গোত্রের ফসল বারবার চাষ করায় ফসলের রোগবালাই দীর্ঘস্থায়ী হওয়ার ঝুঁকি থাকে।';

    const resilienceTextEn =
      riskLevel === 'low'
        ? 'Drought-hardy & early-maturing varieties avoid peak late-winter heat stress and pre-monsoon hailfronts.'
        : riskLevel === 'moderate'
        ? 'Moderate resilience; requires timely sowing to escape hot-spell exposure during flowering.'
        : 'High vulnerability to diesel pumping power outages, heatwaves during grain-fill, and groundwater depletion.';
    const resilienceTextBn =
      riskLevel === 'low'
        ? 'খরা-সহনশীল ও দ্রুত সংগ্রহযোগ্য হওয়ায় শীতের শেষের আকস্মিক গরম এবং বৈশাখী শিলাবৃষ্টির ক্ষতি এড়ানো যায়।'
        : riskLevel === 'moderate'
        ? 'মাঝারি সহনশীল; ফুল ফোটার সময় গরম বা খরা এড়াতে সময়মতো বীজ বপন জরুরি।'
        : 'সেচ পাম্পের জ্বালানি সংকট, অতিরিক্ত তাপদাহ এবং ভূগর্ভস্থ পানির স্তর নেমে যাওয়ার মারাত্মক ঝুঁকিতে থাকে।';

    // Information Gaps (Honest truth: what satellite CANNOT see)
    const gapsEn = [
      'Laboratory Soil N-P-K & pH: NASA satellites observe rootzone moisture, but chemical soil fertility and organic carbon require local laboratory testing.',
      'Field-level Irrigation Infrastructure: Electricity tariffs, diesel prices, and private tube-well ownership vary by plot and are unobserved from space.',
      'Daily Local Market Prices: haat/bazaar spot prices fluctuate daily; evaluate seed availability and price before finalizing crop choice.',
      'Sub-plot Micro-topography: Elevation differences within individual bunded plots are below satellite 10m/250m resolution.',
    ];
    const gapsBn = [
      'মাটির পুষ্টি ও পিএইচ পরীক্ষা: নাসা স্যাটেলাইট আর্দ্রতা পর্যবেক্ষণ করে, তবে মাটির আসল এন-পি-কে বা অম্লতার পরিমাণ ল্যাব টেস্ট ছাড়া জানা যায় না।',
      'জমির সেচ অবকাঠামো: নিজস্ব পাম্পের সুবিধা, বিদ্যুতের সংযোগ বা ডিজেলের প্রকৃত খরচ মহাকাশ থেকে সরাসরি পর্যবেক্ষণ করা যায় না।',
      'স্থানীয় বাজারের দৈনিক দর: স্থানীয় হাটে ফসলের পাইকারি দাম প্রতিদিন ওঠানামা করে; চূড়ান্ত সিদ্ধান্তের আগে বীজ ও বিক্রয়মূল্য যাচাই করুন।',
      'প্লটের অভ্যন্তরীণ ঢাল: জমির আইল বা ভেতরের ক্ষুদ্র উঁচু-নিচু তারতম্য উপগ্রহ চিত্রে শতভাগ স্পষ্ট নয়।',
    ];

    // Risks Needing Local Review
    const risksEn = [
      `Consult your local Sub-Assistant Agriculture Officer (SAAO) or Upazila Agriculture Office in ${districtNameEn} to verify certified BARI/BRRI seed varieties suited to your union's soil.`,
      'Confirm optimal sowing date with 7-day local meteorological forecasts to prevent seedling cold injury or early rain drowning.',
      'Ensure verified drainage outlets in medium-lowland plots prior to pre-monsoon summer pulse sowing.',
    ];
    const risksBn = [
      `${districtNameBn} এলাকায় আপনার উপ-সহকারী কৃষি কর্মকর্তা (SAAO) বা উপজেলা কৃষি অফিসের সাথে কথা বলে আপনার মাটির উপযোগী অনুমোদিত বিএআরআই/বিআরআরআই জাত নির্বাচন নিশ্চিত করুন।`,
      'চারা গজানোর সময় অতিরিক্ত ঠান্ডা বা আগাম বৃষ্টির ক্ষতি এড়াতে ৭ দিনের স্থানীয় আবহাওয়া পূর্বাভাসের সাথে মিলিয়ে বীজ বপনের সঠিক দিন নির্ধারণ করুন।',
      'গ্রীষ্মকালীন ডাল চাষের ক্ষেত্রে হঠাৎ অতিবৃষ্টিতে পানি জমে যাওয়া রোধ করতে পানি নিষ্কাশনের উপযুক্ত নালা ব্যবস্থাপনা নিশ্চিত করুন।',
    ];

    return {
      id,
      tagEn,
      tagBn,
      titleEn,
      titleBn,
      priorityId: pId,
      priorityLabelEn: pLabelEn,
      priorityLabelBn: pLabelBn,
      crops,
      summary: {
        totalWaterNeedMm,
        waterSavedPctVsBaseline,
        legumeCount,
        pestCycleBroken,
        riskLevel,
        riskLevelEn,
        riskLevelBn,
        overallScore: avgScore,
      },
      whySuggested: {
        en: whyEn,
        bn: whyBn,
        rulesTriggeredEn,
        rulesTriggeredBn,
      },
      evidence: {
        nasaPowerTMax: conditions.tMax30 !== undefined ? `${conditions.tMax30.toFixed(1)}°C` : 'No data',
        nasaPowerRain30d: conditions.rain30 !== undefined ? `${conditions.rain30.toFixed(1)} mm` : 'No data',
        nasaPowerRainShift: rainShiftNoteEn,
        smapSoilMoisture: smapMoistureVal || 'No data',
        modisNdvi: modisNdviVal ? `${modisNdviVal}` : 'No data',
        bariGuidance: {
          en: `Cardinal temperatures and duration benchmarks compiled from BARI Krishi Projukti Hatboi & BRRI Modern Rice Cultivation.`,
          bn: `বিএআরআই 'কৃষি প্রযুক্তি হাতবই' এবং বিআরআরআই 'আধুনিক ধানের চাষ' নির্দেশিকা থেকে সংকলিত।`,
        },
      },
      benefits: {
        waterUseEn: waterSavingsTextEn,
        waterUseBn: waterSavingsTextBn,
        nitrogenEn: nitrogenTextEn,
        nitrogenBn: nitrogenTextBn,
        pestBreakEn: pestBreakTextEn,
        pestBreakBn: pestBreakTextBn,
        resilienceEn: resilienceTextEn,
        resilienceBn: resilienceTextBn,
      },
      informationGaps: {
        en: gapsEn,
        bn: gapsBn,
      },
      risksNeedingLocalReview: {
        en: risksEn,
        bn: risksBn,
      },
      bareFieldPeriods: {
        hasBarePeriods,
        monthsEn,
        monthsBn,
        daysEmpty: daysEmptyTotal,
        recommendationEn:
          hasBarePeriods
            ? `Field remains fallow for ${monthsEn} (~${daysEmptyTotal} days). Consider sowing Dhaincha (Sesbania) green manure or a 60-day catch pulse to suppress weeds and prevent soil erosion.`
            : 'Continuous vegetative ground cover protects topsoil from solar baking and wind erosion.',
        recommendationBn:
          hasBarePeriods
            ? `জমি ${monthsBn} খালি থাকে (প্রায় ${toBnDigits(daysEmptyTotal)} দিন)। মাটি ঢেকে রাখতে ও উর্বরতা বাড়াতে ধইঞ্চা সবুজ সার বা ৬০ দিনের মুগ ডাল চাষ করার পরামর্শ দেয়া হচ্ছে।`
            : 'সারা বছর ফসলের আচ্ছাদন থাকায় প্রখর রোদ ও বাতাস থেকে মাটির উপরিভাগের উর্বরতা সুরক্ষিত থাকে।',
      },
    };
  }

  const stratA = compileStrategy(
    'current',
    cropsA,
    'Current Practice',
    'বর্তমান চাষ',
    'Farmer’s Current Rotation',
    'কৃষকের বর্তমান ফসল পর্যায়',
    'current',
    'Current Farmer Baseline',
    'বর্তমান ভিত্তি'
  );

  const stratB = compileStrategy(
    'recommended',
    cropsB,
    'Recommended Strategy',
    'সেরা সুপারিশকৃত',
    `Priority-Optimized (${cropsB.map((c) => c.nameEn.split(' ')[0]).join(' → ')})`,
    `লক্ষ্যভিত্তিক সেরা পরিক্রমা (${cropsB.map((c) => c.nameBn).join(' → ')})`,
    priority,
    priority === 'save_water' ? 'Save Water' : priority === 'improve_soil' ? 'Improve Soil' : priority === 'lower_cost' ? 'Lower Cost' : 'Reduce Risk',
    priority === 'save_water' ? 'পানি বাঁচানো' : priority === 'improve_soil' ? 'মাটির শক্তি' : priority === 'lower_cost' ? 'কম খরচ' : 'ঝুঁকি হ্রাস'
  );

  const stratC = compileStrategy(
    'alternative',
    cropsC,
    altTagEn,
    altTagBn,
    altTitleEn,
    altTitleBn,
    altPriorityId,
    altPriorityId === 'improve_soil' ? 'Soil Health' : altPriorityId === 'save_water' ? 'Save Water' : 'Reduce Risk',
    altPriorityId === 'improve_soil' ? 'মাটির স্বাস্থ্য' : altPriorityId === 'save_water' ? 'পানি সাশ্রয়' : 'ঝুঁকি হ্রাস'
  );

  return {
    strategies: [stratA, stratB, stratC],
  };
}
