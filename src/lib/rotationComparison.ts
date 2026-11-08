import { CROPS, type Crop, FAMILY_LABEL } from '../data/crops';
import { CROPS_DATABASE } from '../data/agriData';
import { runEngine, scoreCrop, type Priority, type EngineInput } from './engine';
import type { Conditions } from './conditions';
import type { FieldShift } from './fieldShift';
import type { ForecastDay } from './power';
import type { FarmerPriorityId } from '../types';
import { toBnDigits } from './bilingualEmailTemplate';
import { getDistrictSatellite } from '../data/satellite';

export interface VulnerableSeasonRisk {
  severity: 'high' | 'medium' | 'low';
  titleEn: string;
  titleBn: string;
  reasonEn: string;
  reasonBn: string;
  evidenceEn: string;
  evidenceBn: string;
}

export interface SoilHealthRole {
  id: 'nitrogen_fixer' | 'deep_roots' | 'drought_tolerant' | 'ground_cover' | 'green_manure';
  labelEn: string;
  labelBn: string;
  descEn: string;
  descBn: string;
  badgeClass: string;
}

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
  soilHealthRoles: SoilHealthRole[];
  vulnerableSeasonRisk?: VulnerableSeasonRisk;
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
  confidence: {
    level: 'high' | 'medium' | 'low';
    levelEn: string;
    levelBn: string;
    reasonEn: string;
    reasonBn: string;
  };
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
  irrigationAvailability?: 'yes' | 'limited' | 'no';
  mainPurpose?: 'home_food' | 'local_market' | 'both';
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

export function getSoilHealthRoles(crop: Crop | null): SoilHealthRole[] {
  if (!crop) return [];
  const roles: SoilHealthRole[] = [];
  const cid = crop.id.toLowerCase();
  const isLegume = crop.family === 'legume' || crop.plant_family === 'fabaceae' || Boolean(crop.is_legume);

  // 1. Nitrogen fixer
  if (isLegume) {
    roles.push({
      id: 'nitrogen_fixer',
      labelEn: 'Nitrogen Fixer',
      labelBn: 'নাইট্রোজেন সংবন্ধনকারী',
      descEn: 'Biological Rhizobium root nodules fix atmospheric nitrogen, naturally enriching soil fertility for following crops.',
      descBn: 'শিকড়ে রাইজোবিয়াম ব্যাকটেরিয়া বাতাস থেকে নাইট্রোজেন সংবন্ধন করে পরবর্তী ফসলের জন্য মাটির উর্বরতা বাড়ায়।',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    });
  }

  // 2. Deep roots (only crops in our 37-crop list)
  const deepRootCrops = ['sunflower', 'mustard', 'maize', 'cotton'];
  if (deepRootCrops.includes(cid) || crop.family === 'mustard' || crop.plant_family === 'brassicaceae') {
    roles.push({
      id: 'deep_roots',
      labelEn: 'Deep Roots',
      labelBn: 'গভীর মূলীয় ফসল',
      descEn: 'Deep taproots penetrate subsoil plow-pans, improving soil aeration and recycling deep subsoil nutrients.',
      descBn: 'মাটির শক্ত স্তর ভেঙে বাতাস চলাচল বাড়ায় এবং গভীর স্তর থেকে পুষ্টি উপাদান ওপরে টেনে আনে।',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    });
  }

  // 3. Drought tolerant (only crops in our 37-crop list)
  const droughtCrops = ['chickpea', 'grass_pea', 'sesame'];
  if (droughtCrops.includes(cid) || (crop.water === 'low' && !isLegume)) {
    roles.push({
      id: 'drought_tolerant',
      labelEn: 'Drought Tolerant',
      labelBn: 'খরা-সহনশীল',
      descEn: 'Thrives under low soil moisture; protects dry topsoil from erosion and prevents groundwater depletion.',
      descBn: 'অল্প পানিতে বেড়ে ওঠে; ভূগর্ভস্থ পানির অপচয় রোধ করে এবং শুষ্ক মৌসুমে জমির ক্ষয়রোধ করে।',
      badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    });
  }

  // 4. Green manure (mungbean, blackgram)
  if (cid === 'mungbean' || cid === 'blackgram') {
    roles.push({
      id: 'green_manure',
      labelEn: 'Green Manure',
      labelBn: 'সবুজ সার',
      descEn: 'Ploughed-under biomass enriches topsoil with quick-decomposing organic matter, stimulating soil biological activity.',
      descBn: 'জমিতে মিশে গিয়ে দ্রুত পচনশীল জৈব পদার্থ যোগ করে এবং মাটির অনুজীবের কার্যকারিতা বাড়ায়।',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    });
  }

  // 5. Ground cover (sweet potato only)
  if (cid === 'sweet_potato') {
    roles.push({
      id: 'ground_cover',
      labelEn: 'Ground Cover',
      labelBn: 'মাটির আচ্ছাদন',
      descEn: 'Dense creeping foliage shields topsoil from solar baking and heavy monsoon rain erosion while suppressing weed growth.',
      descBn: 'ঘন পাতা মাটিকে ঢেকে রেখে প্রখর রোদে রস শুকিয়ে যাওয়া রোধ করে এবং আগাছা জন্মাতে দেয় না।',
      badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
    });
  }

  return roles;
}

export function getVulnerableSeasonRisk(
  seasonKey: 'rabi' | 'kharif1' | 'kharif2',
  cropId: string,
  shift: FieldShift | null,
  conditions?: Conditions | null
): VulnerableSeasonRisk {
  const cleanId = cropId.toLowerCase().trim();
  const shiftSeason = shift?.seasons.find((s) => s.season === seasonKey);
  const hasShift = Boolean(shiftSeason && typeof shiftSeason.dHeat === 'number');
  const thenYears = shift ? `${shift.thenRange[0]}–${shift.thenRange[1]}` : '2001–2010';
  const nowYears = shift ? `${shift.nowRange[0]}–${shift.nowRange[1]}` : '2016–2025';

  if (seasonKey === 'rabi') {
    if (cleanId === 'wheat') {
      const dHeat = shiftSeason?.dHeat;
      const dTemp = shiftSeason?.dTemp;
      const hasNumbers = hasShift && typeof dHeat === 'number' && typeof dTemp === 'number';
      const isRising = hasNumbers && dHeat > 0;

      let reasonEn = 'Wheat in Rabi: wheat can face heat in March during grain filling; sow on time. Temperatures >30°C can affect pollen and grain development.';
      let reasonBn = 'রবি মৌসুমে গম: মার্চে দানা বাঁধার সময় গরমে পড়ার ঝুঁকি থাকে; সময়মতো বীজ বপন করুন। ৩০°সে-এর বেশি তাপমাত্রা পরাগায়ন ব্যাহত ও দানা চিটা করতে পারে।';
      let evidenceEn = 'NASA POWER seasonal baseline: temperatures >30°C during late-winter grain filling reduce yield potential.';
      let evidenceBn = 'NASA POWER মৌসুমী তথ্য: শীতের শেষ ভাগে গম পরিপক্ব হওয়ার সময় উচ্চ তাপমাত্রা ফলন কমিয়ে দিতে পারে।';

      if (hasNumbers) {
        if (isRising) {
          reasonEn = 'Wheat in Rabi: late-season heat is rising during grain filling (late Feb–Mar). Temperatures >30°C can affect pollen and grain development.';
          reasonBn = 'রবি মৌসুমে গম: দানা বাঁধার সময় (ফেব্রুয়ারির শেষ–মার্চ) গরমের প্রকোপ বাড়ছে। ৩০°সে-এর বেশি তাপমাত্রা পরাগায়ন ব্যাহত ও দানা চিটা করতে পারে।';
          evidenceEn = `NASA POWER decadal shift: Rabi daily high temperature change is +${dHeat.toFixed(1)}°C (mean temperature change ${dTemp > 0 ? '+' : ''}${dTemp.toFixed(1)}°C) comparing ${thenYears} vs ${nowYears}. Late-winter heat spikes shorten grain filling.`;
          evidenceBn = `NASA POWER দশকভিত্তিক পরিবর্তন: রবি মৌসুমে সর্বোচ্চ তাপমাত্রা পরিবর্তন +${toBnDigits(dHeat.toFixed(1))}°সে (গড় তাপমাত্রা পরিবর্তন ${dTemp > 0 ? '+' : ''}${toBnDigits(dTemp.toFixed(1))}°সে), ভিত্তি দশক ${toBnDigits(thenYears)} বনাম ${toBnDigits(nowYears)}। শীতের শেষের তাপদাহে ফলন কমে।`;
        } else {
          reasonEn = 'Wheat in Rabi: wheat can still face heat in March; sow on time. Temperatures >30°C can affect pollen and grain development.';
          reasonBn = 'রবি মৌসুমে গম: মার্চে গম এখনও গরমে পড়ার ঝুঁকিতে থাকে; সময়মতো বীজ বপন করুন। ৩০°সে-এর বেশি তাপমাত্রা পরাগায়ন ব্যাহত ও দানা চিটা করতে পারে।';
          evidenceEn = `NASA POWER decadal shift: Rabi daily high temperature change is ${dHeat.toFixed(1)}°C (mean temperature change ${dTemp > 0 ? '+' : ''}${dTemp.toFixed(1)}°C) comparing ${thenYears} vs ${nowYears}. Even without upward warming, late-winter heat in March remains a seasonal constraint.`;
          evidenceBn = `NASA POWER দশকভিত্তিক পরিবর্তন: রবি মৌসুমে সর্বোচ্চ তাপমাত্রা পরিবর্তন ${toBnDigits(dHeat.toFixed(1))}°সে (গড় তাপমাত্রা পরিবর্তন ${dTemp > 0 ? '+' : ''}${toBnDigits(dTemp.toFixed(1))}°সে), ভিত্তি দশক ${toBnDigits(thenYears)} বনাম ${toBnDigits(nowYears)}। তাপমাত্রা না বাড়লেও মার্চের স্বাভাবিক গরম গম চাষে একটি মৌসুমী সীমাবদ্ধতা।`;
        }
      }

      return {
        severity: 'high',
        titleEn: 'Watch out: late-season heat',
        titleBn: 'সতর্কতা: মৌসুমের শেষে গরমের ঝুঁকি',
        reasonEn,
        reasonBn,
        evidenceEn,
        evidenceBn,
      };
    }
    if (cleanId === 'boro') {
      const nowShare = shiftSeason?.nowShare;
      const dShare = shiftSeason?.dShare;
      const hasNumbers = hasShift && typeof nowShare === 'number' && typeof dShare === 'number';
      return {
        severity: 'high',
        titleEn: 'Watch out: high winter groundwater use',
        titleBn: 'সতর্কতা: শুষ্ক মৌসুমে অতিরিক্ত সেচ নির্ভরতা',
        reasonEn: 'Boro rice requires intensive winter irrigation, drawing heavily on local groundwater when seasonal rainfall is low.',
        reasonBn: 'বোরো ধানে শুষ্ক শীতকালে প্রচুর সেচের প্রয়োজন হয়; বৃষ্টি কম থাকায় ভূগর্ভস্থ পানির ওপর চাপ বাড়ে।',
        evidenceEn: hasNumbers
          ? `NASA POWER: Rabi rain contributes only ${nowShare}% of annual precipitation (${dShare > 0 ? '+' : ''}${dShare}% shift vs ${thenYears}). High irrigation demand requires extensive groundwater extraction.`
          : 'NASA POWER decadal records show negligible rainfall in Rabi, requiring heavy groundwater pumping.',
        evidenceBn: hasNumbers
          ? `নাসা পাওয়ার: রবি মৌসুমে বার্ষিক বৃষ্টির মাত্র ${toBnDigits(nowShare)}% হয় (${toBnDigits(thenYears)}-এর তুলনায় পরিবর্তন ${dShare > 0 ? '+' : ''}${toBnDigits(dShare)}%)। পানির চাহিদা পূরণে ভূগর্ভস্থ সেচের প্রয়োজন হয়।`
          : 'NASA POWER তথ্য অনুযায়ী রবি মৌসুমে বৃষ্টিপাত অত্যন্ত কম থাকায় ভূগর্ভস্থ সেচের ওপর বেশি নির্ভর করতে হয়।',
      };
    }
    if (cleanId === 'potato') {
      const rh = conditions?.rh;
      const hasRh = typeof rh === 'number' && Number.isFinite(rh);
      return {
        severity: 'medium',
        titleEn: 'Watch out: fog & late blight risk',
        titleBn: 'সতর্কতা: কুয়াশা ও নাবি ধসা রোগের ঝুঁকি',
        reasonEn: 'Potato can be vulnerable to late blight during humid, foggy winter periods with fluctuating temperatures.',
        reasonBn: 'শীতের ঘন কুয়াশা ও আর্দ্র আবহাওয়ায় আলুর জমিতে নাবি ধসা (লেট ব্লাইট) রোগের ঝুঁকি বাড়তে পারে।',
        evidenceEn: hasRh
          ? `NASA POWER: Winter relative humidity (~${Math.round(rh)}%) and cool temperatures favor late blight spore germination.`
          : 'NASA POWER: Winter relative humidity and fluctuating temperatures favor late blight spore germination.',
        evidenceBn: hasRh
          ? `নাসা পাওয়ার: শীতকালীন আপেক্ষিক আর্দ্রতা (~${toBnDigits(Math.round(rh))}%) ও ঠান্ডা আবহাওয়া নাবি ধসা রোগের জন্য অনুকূল।`
          : 'নাসা পাওয়ার: শীতকালীন আপেক্ষিক আর্দ্রতা ও তাপমাত্রার ওঠানামা নাবি ধসা রোগের জন্য অনুকূল।',
      };
    }
    if (cleanId === 'fallow') {
      return {
        severity: 'medium',
        titleEn: 'Notice: unused soil moisture',
        titleBn: 'খেয়াল করুন: মাটির জমা আর্দ্রতা কাজে লাগছে না',
        reasonEn: 'Leaving the field fallow in Rabi leaves post-monsoon soil moisture unused without providing crop cover.',
        reasonBn: 'রবিতে জমি খালি রাখলে মাটির অবশিষ্ট রস কাজে লাগানো যায় না এবং জমি অনাবাদী থাকে।',
        evidenceEn: 'NASA SMAP: Post-monsoon rootzone soil moisture evaporates rapidly without vegetative crop cover.',
        evidenceBn: 'NASA SMAP: কোনো আচ্ছাদন ফসল না থাকলে বর্ষা-পরবর্তী মাটির জমা আর্দ্রতা রোদে দ্রুত শুকিয়ে অপচয় হয়।',
      };
    }
    return {
      severity: 'low',
      titleEn: 'Favorable: climate well-suited',
      titleBn: 'অনুকূল: জলবায়ুর সাথে মানানসই',
      reasonEn: 'Crop is well-adapted to seasonal climate conditions with modest management risk.',
      reasonBn: 'ফসলটি এই মৌসুমের সাধারণ আবহাওয়ার সাথে মানানসই এবং ঝুঁকি তুলনামূলক কম।',
      evidenceEn: 'BARI agricultural guidance & NASA POWER seasonal baseline.',
      evidenceBn: 'BARI কৃষি নির্দেশিকা ও NASA POWER মৌসুমী আবহাওয়া তথ্য।',
    };
  }

  if (seasonKey === 'kharif1') {
    if (cleanId === 'fallow') {
      const dHeat = shiftSeason?.dHeat;
      const hasNumbers = hasShift && typeof dHeat === 'number';
      return {
        severity: 'high',
        titleEn: 'Caution: soil baking & storm erosion',
        titleBn: 'সতর্কতা: প্রখর রোদ ও ঝড়ে মাটির ক্ষয়',
        reasonEn: 'Leaving the field bare in Kharif-1 exposes topsoil to intense pre-monsoon heat and storm runoff.',
        reasonBn: 'খরিফ-১ মৌসুমে জমি খালি রাখলে প্রখর রোদে মাটি শুকিয়ে যায় এবং কালবৈশাখী ঝড়ে উর্বর মাটি ধুয়ে যেতে পারে।',
        evidenceEn: hasNumbers
          ? `NASA POWER: Kharif-1 daily high temperature shift is ${dHeat > 0 ? '+' : ''}${dHeat.toFixed(1)}°C (${thenYears} vs ${nowYears}). Intense pre-monsoon heat bakes unshaded topsoil.`
          : 'NASA POWER: Pre-monsoon solar radiation and convection storms peak before monsoon onset.',
        evidenceBn: hasNumbers
          ? `নাসা পাওয়ার: খরিফ-১ মৌসুমে সর্বোচ্চ তাপমাত্রা পরিবর্তন ${dHeat > 0 ? '+' : ''}${toBnDigits(dHeat.toFixed(1))}°সে (${toBnDigits(thenYears)} বনাম ${toBnDigits(nowYears)})। প্রখর রোদে খোলা মাটি শুকিয়ে উর্বরতা হারায়।`
          : 'নাসা পাওয়ার: বর্ষার আগে সৌর বিকিরণ ও কালবৈশাখী ঝড়ের তীব্রতা বেশি থাকে।',
      };
    }
    if (cleanId === 'aus') {
      const nowShare = shiftSeason?.nowShare;
      const dShare = shiftSeason?.dShare;
      const hasNumbers = hasShift && typeof nowShare === 'number' && typeof dShare === 'number';
      return {
        severity: 'medium',
        titleEn: 'Watch out: dry spells & harvest rain',
        titleBn: 'সতর্কতা: আগাম খরা ও কাটার সময় বৃষ্টি',
        reasonEn: 'Aus rice can face dry spells during April germination, while early monsoon rains may coincide with harvest.',
        reasonBn: 'এপ্রিলের খরায় আউশের চারা গজানো ব্যাহত হতে পারে এবং কাটার সময় আগাম বর্ষায় পাকা ধান ক্ষতিগ্রস্ত হতে পারে।',
        evidenceEn: hasNumbers
          ? `NASA POWER: Pre-monsoon rainfall accounts for ${nowShare}% of annual rain (${dShare > 0 ? '+' : ''}${dShare}% shift vs ${thenYears}), with high inter-annual volatility during germination.`
          : 'NASA POWER & SMAP: Pre-monsoon rainfall and soil moisture show high inter-annual volatility during germination.',
        evidenceBn: hasNumbers
          ? `নাসা পাওয়ার: বর্ষা শুরুর আগে বার্ষিক বৃষ্টির ${toBnDigits(nowShare)}% হয় (${toBnDigits(thenYears)}-এর তুলনায় পরিবর্তন ${dShare > 0 ? '+' : ''}${toBnDigits(dShare)}%), যা চারা গজানোর সময় অনিশ্চয়তা তৈরি করে।`
          : 'নাসা পাওয়ার ও এসএমএপি: বর্ষার আগে বৃষ্টি ও মাটির রসে তীব্র অনিশ্চয়তা থাকায় চারা গজানো ঝুঁকিপূর্ণ হতে পারে।',
      };
    }
    return {
      severity: 'low',
      titleEn: 'Favorable: climate well-suited',
      titleBn: 'অনুকূল: জলবায়ুর সাথে মানানসই',
      reasonEn: 'Crop handles pre-monsoon temperatures and protects topsoil with vegetative biomass ahead of Aman.',
      reasonBn: 'গ্রীষ্মের তাপ সহ্য করতে পারে এবং আমন রোপণের আগে জমিকে সবুজ আচ্ছাদনে ঢেকে রাখে।',
      evidenceEn: 'NASA POWER Kharif-1 heat observations & BARI guidance.',
      evidenceBn: 'নাসা পাওয়ার খরিফ-১ পর্যবেক্ষণ ও বারি নির্দেশিকা।',
    };
  }

  // kharif2
  if (cleanId === 'fallow') {
    const nowShare = shiftSeason?.nowShare;
    const dShare = shiftSeason?.dShare;
    const hasNumbers = hasShift && typeof nowShare === 'number' && typeof dShare === 'number';
    return {
      severity: 'high',
      titleEn: 'Caution: monsoon soil & nutrient runoff',
      titleBn: 'সতর্কতা: বর্ষার বৃষ্টিতে উর্বর মাটি ধুয়ে যাওয়া',
      reasonEn: 'Leaving land unplanted during peak monsoon risks topsoil erosion and nutrient leaching.',
      reasonBn: 'বর্ষার ভরা মৌসুমে জমি খালি ফেলে রাখলে ভারী বৃষ্টিতে উর্বর মাটি ও পুষ্টি উপাদান ধুয়ে যায়।',
      evidenceEn: hasNumbers
        ? `NASA POWER: Monsoon delivers ${nowShare}% of total annual rainfall (${dShare > 0 ? '+' : ''}${dShare}% shift vs ${thenYears}). Uncovered topsoil suffers severe runoff and nutrient leaching.`
        : 'NASA POWER: Heavy monsoon rainfall causes severe soil erosion and nutrient leaching on unplanted fields.',
      evidenceBn: hasNumbers
        ? `নাসা পাওয়ার: বর্ষাকালেই মোট বার্ষিক বৃষ্টির ${toBnDigits(nowShare)}% হয় (${toBnDigits(thenYears)}-এর তুলনায় পরিবর্তন ${dShare > 0 ? '+' : ''}${toBnDigits(dShare)}%)। খালি জমি বৃষ্টির পানিতে উর্বর মাটি ও পুষ্টি উপাদান হারায়।`
        : 'নাসা পাওয়ার: বর্ষার প্রবল বৃষ্টিতে খালি জমির উর্বর মাটি ও সার ধুয়ে নষ্ট হয়।',
    };
  }
  if (cleanId === 'aman') {
    const dShare = shiftSeason?.dShare;
    const nowShare = shiftSeason?.nowShare;
    const hasNumbers = hasShift && typeof dShare === 'number' && typeof nowShare === 'number';
    return {
      severity: 'medium',
      titleEn: 'Watch out: late-season rain deficit',
      titleBn: 'সতর্কতা: মৌসুমের শেষে অনাবৃষ্টির ঝুঁকি',
      reasonEn: 'T. Aman depends on monsoon rain; early rain cessation in October during flowering can require supplemental irrigation.',
      reasonBn: 'রোপা আমন বৃষ্টির ওপর নির্ভরশীল; অক্টোবরের শেষে ফুল ফোটার সময় বৃষ্টি কমে গেলে সম্পূরক সেচের প্রয়োজন হতে পারে।',
      evidenceEn: hasNumbers
        ? `NASA POWER: Kharif-2 rainfall share shift is ${dShare > 0 ? '+' : ''}${dShare}% (${nowShare}% of annual rain in ${nowYears}), with dry spells during grain filling.`
        : 'NASA POWER: Early withdrawal of late-monsoon rainfall creates dry spells during rice flowering and grain filling.',
      evidenceBn: hasNumbers
        ? `নাসা পাওয়ার: খরিফ-২ বৃষ্টিপাতের অংশে পরিবর্তন ${dShare > 0 ? '+' : ''}${toBnDigits(dShare)}% (${toBnDigits(nowYears)}-এ বার্ষিক বৃষ্টির ${toBnDigits(nowShare)}%), যাতে ফুল ফোটার সময় অনাবৃষ্টির ঝুঁকি বাড়ে।`
        : 'নাসা পাওয়ার: বর্ষার শেষে অনাবৃষ্টির কারণে ফুল ফোটা বা দানা বাঁধার সময় সম্পূরক সেচের প্রয়োজন হতে পারে।',
    };
  }
  return {
    severity: 'low',
    titleEn: 'Favorable: climate well-suited',
    titleBn: 'অনুকূল: জলবায়ুর সাথে মানানসই',
    reasonEn: 'Crop utilizes plentiful monsoon rainfall effectively with minimal supplemental irrigation needed.',
    reasonBn: 'প্রাকৃতিক বৃষ্টির পানির পূর্ণ সদ্ব্যবহার করে এবং বাড়তি সেচ ছাড়াই বেড়ে ওঠে।',
    evidenceEn: 'NASA POWER precipitation records & BARI/BRRI agronomy.',
    evidenceBn: 'নাসা পাওয়ার বৃষ্টিপাত রেকর্ড ও বারি/ব্রি কৃষি গবেষণা।',
  };
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
    soilHealthRoles: [],
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
    soilHealthRoles: getSoilHealthRoles(crop),
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
  const distSat = getDistrictSatellite(districtId);
  const modisNdviVal = distSat?.ndvi?.value ? distSat.ndvi.value.toFixed(2) : null;
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
    irrigationAvailability: input.irrigationAvailability,
    mainPurpose: input.mainPurpose,
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
    altTitleBn = 'সর্বোচ্চ পানি সাশ্রয়ী পরিক্রমা';
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
    irrigationAvailability: input.irrigationAvailability,
    mainPurpose: input.mainPurpose,
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
    irrigationAvailability: input.irrigationAvailability,
    mainPurpose: input.mainPurpose,
  };

  const cropsA: StrategyCropSeason[] = [
    rabiCropInput
      ? {
          ...buildCropSeason(rabiCropInput, 'rabi', scoreCrop(rabiCropInput, 'rabi', true, engineInputA, []).score),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('rabi', rabiCropInput.id, shift, conditions),
        }
      : {
          ...buildFallowSeason('rabi'),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('rabi', 'fallow', shift, conditions),
        },
    kharif1CropInput
      ? {
          ...buildCropSeason(kharif1CropInput, 'kharif1', scoreCrop(kharif1CropInput, 'kharif1', false, engineInputA, []).score),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('kharif1', kharif1CropInput.id, shift, conditions),
        }
      : {
          ...buildFallowSeason('kharif1'),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('kharif1', 'fallow', shift, conditions),
        },
    kharif2CropInput
      ? {
          ...buildCropSeason(kharif2CropInput, 'kharif2', scoreCrop(kharif2CropInput, 'kharif2', false, engineInputA, []).score),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('kharif2', kharif2CropInput.id, shift, conditions),
        }
      : {
          ...buildFallowSeason('kharif2'),
          vulnerableSeasonRisk: getVulnerableSeasonRisk('kharif2', 'fallow', shift, conditions),
        },
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
    const monthsBn = bareMonthsListBn.length > 0 ? bareMonthsListBn.join('; ') : daysEmptyTotal > 0 ? `মৌসুম পরিবর্তনের মাঝে প্রায় ${toBnDigits(daysEmptyTotal)} দিন` : 'জমি সারা বছর ফসলে ঢাকা থাকে';

    // Why Suggested text
    let whyEn = '';
    let whyBn = '';
    const rulesTriggeredEn: string[] = [];
    const rulesTriggeredBn: string[] = [];

    if (id === 'current') {
      whyEn = `Represents your field's current rotation sequence. Evaluated against real-time NASA POWER climate observations for ${districtNameEn}.`;
      whyBn = `আপনার জমিতে বর্তমানে যা চাষ করছেন। ${districtNameBn} এলাকার নাসার বাস্তব আবহাওয়ার সাথে মিলিয়ে এটি যাচাই করা হয়েছে।`;
      rulesTriggeredEn.push('Baseline agronomic audit: assesses groundwater draft and botanical continuity.');
      rulesTriggeredBn.push('বর্তমান অবস্থা যাচাই: ভূগর্ভস্থ পানির ব্যবহার ও পরপর একই পরিবারের ফসল হচ্ছে কি না তা দেখা হয়েছে।');
      if (!pestCycleBroken) {
        rulesTriggeredEn.push('Notice: Same plant family repeats, increasing potential soil pathogen carryover.');
        rulesTriggeredBn.push('সতর্কতা: পরপর একই পরিবারের ফসল থাকায় মাটিতে রোগবালাই ও পোকা বাসা বাঁধতে পারে।');
      }
      if (legumeCount === 0) {
        rulesTriggeredEn.push('Notice: Zero legume seasons requires 100% synthetic chemical nitrogen application.');
        rulesTriggeredBn.push('সতর্কতা: কোনো ডাল ফসল না থাকায় মাটির নাইট্রোজেন ঘাটতি মেটাতে পুরোপুরি ইউরিয়া সারের ওপর নির্ভর করতে হবে।');
      }
    } else if (id === 'recommended') {
      whyEn = `Computed by AgriOrbit mathematical rules to strictly optimize your priority (${pLabelEn}). Enforces Rule A (botanical family alternation) and Rule B (biological nitrogen balance).`;
      whyBn = `আপনার অগ্রাধিকার (${pLabelBn}) সফল করতে স্পষ্ট নিয়মের ভিত্তিতে এই ফসলগুলো বেছে নেওয়া হয়েছে। এতে নিয়ম-১ (ভিন্ন পরিবারের ফসল) ও নিয়ম-২ (মাটিতে নাইট্রোজেন ফেরানো) নিশ্চিত করা হয়েছে।`;
      rulesTriggeredEn.push('Rule A Verified: No botanical family repeats consecutively, breaking stem-borer and root-knot nematode cycles.');
      rulesTriggeredBn.push('নিয়ম-১ মানা হয়েছে: পরপর দুই মৌসুমে একই পরিবারের ফসল (যেমন ধানের পর ধান) না লাগিয়ে রোগবালাই ও পোকামাকড়ের উপদ্রব কমানো হয়েছে।');
      rulesTriggeredEn.push(`Rule B Verified: Incorporates ${legumeCount} pulse season(s) to fix atmospheric nitrogen.`);
      rulesTriggeredBn.push(`নিয়ম-২ মানা হয়েছে: ${toBnDigits(legumeCount)}টি ডাল জাতীয় ফসল রেখে মাটিতে প্রাকৃতিকভাবে নাইট্রোজেন সার যোগ করা হয়েছে।`);
    } else {
      whyEn = `Alternative diversification strategy focusing on ${titleEn}. Provides a robust second option if market seed availability or canal schedules differ.`;
      whyBn = `আরেকটি বিকল্প উপায়, যা ${titleBn} বজায় রাখে। বাজারে বীজ বা সেচের সুবিধায় হেরফের হলে এটি একটি ভালো দ্বিতীয় পছন্দ।`;
      rulesTriggeredEn.push(`Balanced sustainability focus: emphasizes ${pLabelEn}.`);
      rulesTriggeredBn.push(`ভারসাম্যপূর্ণ চাষাবাদ: এখানে ${pLabelBn}-কে বিশেষ গুরুত্ব দেওয়া হয়েছে।`);
    }

    // Benefits text
    const waterSavingsTextEn =
      waterSavedPctVsBaseline > 0
        ? `Consumes ~${totalWaterNeedMm} mm/yr, saving an estimated ~${waterSavedPctVsBaseline}% water compared to typical Boro-Fallow-Aman monoculture.`
        : `Consumes ~${totalWaterNeedMm} mm/yr with heavy reliance on dry-season groundwater pumping.`;
    const waterSavingsTextBn =
      waterSavedPctVsBaseline > 0
        ? `বছরে মোট প্রায় ${toBnDigits(totalWaterNeedMm)} মিমি পানি লাগে; প্রচলিত বোরো-পতিত-আমন পরিক্রমার চেয়ে প্রায় ${toBnDigits(waterSavedPctVsBaseline)}% পানি সাশ্রয় করে।`
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
      'মাটির সার ও অম্লতা পরীক্ষা: স্যাটেলাইট মাটির রস দেখতে পেলেও মাটিতে কী পরিমাণ সার বা অম্লতা আছে তা ল্যাব পরীক্ষা ছাড়া নিশ্চিত হওয়া যায় না।',
      'সেচ সুবিধা: জমিতে নিজের পাম্প আছে কি না, বিদ্যুতের লাইন নাকি ডিজেলচালিত মেশিন—তা ওপর থেকে দেখার উপায় নেই।',
      'স্থানীয় বাজারের দৈনিক দর: স্থানীয় হাটে ফসলের পাইকারি দাম প্রতিদিন ওঠানামা করে; চূড়ান্ত সিদ্ধান্তের আগে বীজ ও বিক্রয়মূল্য যাচাই করুন।',
      'জমির উঁচু-নিচু অবস্থা: জমির ভেতরের আইল বা ছোটখাটো উঁচু-নিচু জায়গা স্যাটেলাইটে পরিষ্কার দেখা যায় না।',
    ];

    // Risks Needing Local Review
    const risksEn = [
      `Consult your local Sub-Assistant Agriculture Officer (SAAO) or Upazila Agriculture Office in ${districtNameEn} to verify certified BARI/BRRI seed varieties suited to your union's soil.`,
      'Confirm optimal sowing date with 7-day local meteorological forecasts to prevent seedling cold injury or early rain drowning.',
      'Ensure verified drainage outlets in medium-lowland plots prior to pre-monsoon summer pulse sowing.',
    ];
    const risksBn = [
      `${districtNameBn} এলাকায় আপনার উপ-সহকারী কৃষি কর্মকর্তা (SAAO) বা উপজেলা কৃষি অফিসের সাথে কথা বলে মাটির উপযোগী অনুমোদিত বারি বা ব্রি জাত বেছে নিন।`,
      'চারা গজানোর সময় অতিরিক্ত ঠান্ডা বা আগাম বৃষ্টির ক্ষতি এড়াতে ৭ দিনের স্থানীয় আবহাওয়া পূর্বাভাসের সাথে মিলিয়ে বীজ বপনের সঠিক দিন নির্ধারণ করুন।',
      'গ্রীষ্মে ডাল চাষে হঠাৎ বেশি বৃষ্টিতে যেন পানি না জমে, সেজন্য জমির পানি বের হওয়ার নালা কেটে রাখুন।',
    ];

    // Confidence Scoring: based on data completeness
    const hasLivePower = conditions.rain30 !== null && !conditions.rainUnavailable && conditions.tMax30 > 0;
    const hasLiveSmap = soil !== null || Boolean(distSat?.smap?.value);
    const hasKnownSoil = Boolean(input.soilType && input.soilType !== 'dont_know' && input.soilType !== 'unknown');
    const hasEstimatedCrop = crops.some((c) => {
      const cp = resolveCrop(c.id);
      return cp?.data_confidence === 'estimated';
    });

    let confLevel: 'high' | 'medium' | 'low' = 'high';
    let confEn = '';
    let confBn = '';
    if (!hasLivePower) {
      confLevel = 'low';
      confEn = 'NASA satellite data is temporarily unavailable for this district; relying on fallback climatology. Verify with local SAAO.';
      confBn = 'এই জেলার নাসার উপগ্রহ তথ্য সাময়িকভাবে অপ্রাপ্য; অনুমানের ওপর নির্ভরশীল। স্থানীয় উপসহকারী কৃষি কর্মকর্তার (SAAO) সাথে যাচাই করুন।';
    } else if (hasEstimatedCrop) {
      confLevel = 'medium';
      confEn = 'NASA POWER and SMAP data available for this district, soil type known; some crops use estimated values.';
      confBn = 'এই জেলার NASA POWER ও SMAP তথ্য পাওয়া গেছে, মাটির ধরন জানা; কিছু ফসলের জন্য আনুমানিক মান ব্যবহার করা হয়েছে।';
    } else if (!hasKnownSoil) {
      confLevel = 'medium';
      confEn = 'NASA POWER and SMAP data available for this district, but field soil texture is unspecified ("Don\'t know").';
      confBn = 'এই জেলার NASA POWER ও SMAP তথ্য পাওয়া গেছে, তবে নির্দিষ্ট জমির মাটির ধরন জানা নেই ("জানা নেই" নির্বাচিত)।';
    } else if (!hasLiveSmap) {
      confLevel = 'medium';
      confEn = 'NASA POWER data available; soil moisture based on regional estimate; some crops use estimated values.';
      confBn = 'NASA POWER তথ্য পাওয়া গেছে; মাটির আর্দ্রতা আঞ্চলিক অনুমানের ওপর ভিত্তি করে তৈরি।';
    } else {
      confLevel = 'high';
      confEn = 'NASA POWER and SMAP data available for this district, soil type known, crop values from BARI/BRRI guidance.';
      confBn = 'এই জেলার NASA POWER ও SMAP তথ্য পাওয়া গেছে, মাটির ধরন জানা, ফসলের মান BARI/BRRI নির্দেশিকা থেকে।';
    }

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
      confidence: {
        level: confLevel,
        levelEn: confLevel === 'high' ? 'High Confidence' : confLevel === 'medium' ? 'Medium Confidence' : 'Low Confidence',
        levelBn: confLevel === 'high' ? 'উচ্চ নির্ভরযোগ্যতা' : confLevel === 'medium' ? 'মাঝারি নির্ভরযোগ্যতা' : 'স্বল্প নির্ভরযোগ্যতা',
        reasonEn: confEn,
        reasonBn: confBn,
      },
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
          bn: `বারি 'কৃষি প্রযুক্তি হাতবই' এবং ব্রি 'আধুনিক ধানের চাষ' নির্দেশিকা থেকে সংকলিত।`,
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
            ? `জমি ${monthsBn} খালি থাকে (প্রায় ${toBnDigits(daysEmptyTotal)} দিন)। মাটি ভালো রাখতে ও উর্বরতা বাড়াতে এ সময়ে ধইঞ্চার মতো সবুজ সার বা স্বল্পমেয়াদী মুগ ডাল চাষ করতে পারেন।`
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
