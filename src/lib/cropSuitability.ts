import type { CropData, FarmerPriorityId, Language } from '../types';
import { CROPS_DATABASE } from '../data/agriData';

export type SeasonFilter = 'All' | 'Rabi' | 'Kharif-1' | 'Kharif-2';

// Secondary priority influence is half the primary strength (rounded).
const SECONDARY_WEIGHT = 0.5;

function adjustCropForPriority(crop: CropData, priority: FarmerPriorityId): CropData {
  let adjustedScore = crop.suitabilityScore;

  if (priority === 'save_water') {
    if (crop.waterRequirementEn === 'Low') adjustedScore = Math.min(98, adjustedScore + 4);
    if (crop.id === 'boro_rice') adjustedScore = 52;
  } else if (priority === 'improve_soil') {
    if (crop.id === 'mungbean' || crop.id === 'jute' || crop.id === 'lentil') {
      adjustedScore = Math.min(97, adjustedScore + 5);
    }
  } else if (priority === 'maximize_profit') {
    // Profit-oriented: strong local suitability (yield proxy) combined with
    // low/moderate water demand (cost proxy). Indicative, not a price forecast.
    if (crop.suitabilityScore >= 85 && crop.waterRequirementEn !== 'High') {
      adjustedScore = Math.min(98, adjustedScore + 4);
    }
    if (crop.suitabilityTier === 'marginal') {
      adjustedScore = Math.max(50, adjustedScore - 8);
    }
  } else if (priority === 'maximize_yield') {
    // Yield-oriented: amplify proven local performers, penalize marginal
    // high-input options that need ideal conditions to deliver.
    if (crop.suitabilityScore >= 85) {
      adjustedScore = Math.min(98, adjustedScore + 3);
    }
    if (crop.suitabilityTier === 'marginal') {
      adjustedScore = Math.max(50, adjustedScore - 8);
    }
  } else if (priority === 'lower_cost') {
    if (crop.id === 'mustard' || crop.id === 'lentil' || crop.id === 'jute') {
      adjustedScore = Math.min(96, adjustedScore + 3);
    }
    if (crop.id === 'boro_rice' || crop.id === 'potato') {
      adjustedScore = Math.max(50, adjustedScore - 12);
    }
  } else if (priority === 'reduce_risk') {
    if (crop.durationDays <= 90) {
      adjustedScore = Math.min(95, adjustedScore + 4);
    }
  }

  const tier: CropData['suitabilityTier'] =
    adjustedScore >= 85 ? 'high' : adjustedScore >= 70 ? 'moderate' : 'marginal';

  return { ...crop, suitabilityScore: adjustedScore, suitabilityTier: tier };
}

/** Raw point delta of one priority, before clamps — used at half weight for secondary. */
function priorityDelta(crop: CropData, priority: FarmerPriorityId): number {
  switch (priority) {
    case 'save_water':
      if (crop.id === 'boro_rice') return 52 - crop.suitabilityScore;
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
      if (crop.id === 'mustard' || crop.id === 'lentil' || crop.id === 'jute') d += 3;
      if (crop.id === 'boro_rice' || crop.id === 'potato') d -= 12;
      return d;
    }
    case 'reduce_risk':
      return crop.durationDays <= 90 ? 4 : 0;
  }
}

export function getRankedCrops(
  primary: FarmerPriorityId,
  secondary: FarmerPriorityId | null = null,
  season: SeasonFilter = 'All',
): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE).map((crop) => {
    const adjusted = adjustCropForPriority(crop, primary);
    if (secondary && secondary !== primary) {
      const delta = Math.round(priorityDelta(crop, secondary) * SECONDARY_WEIGHT);
      const score = Math.min(98, Math.max(50, adjusted.suitabilityScore + delta));
      const tier: CropData['suitabilityTier'] =
        score >= 85 ? 'high' : score >= 70 ? 'moderate' : 'marginal';
      return { ...adjusted, suitabilityScore: score, suitabilityTier: tier };
    }
    return adjusted;
  });
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

/**
 * Transparent, data-honest description of how each priority steers the
 * engine. Shown in "Explain Why" so farmers see the reasoning. Profit and
 * yield wordings stay indicative — no invented prices or yield figures.
 */
export const PRIORITY_INFLUENCE: Record<FarmerPriorityId, { en: string; bn: string }> = {
  save_water: {
    en: 'Save Water boost: low-water crops gain up to +4 match points; flood-irrigated Boro rice is capped at 52% when water is limited.',
    bn: 'পানি সাশ্রয় প্রভাব: স্বল্প পানির ফসল সর্বোচ্চ +৪ পয়েন্ট পায়; পানি সীমিত থাকলে বোরো ধান ৫২%-এ সীমাবদ্ধ থাকে।',
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
    en: 'Lower Cost boost: low-input Mustard, Lentil, and Jute gain up to +3; diesel-heavy Boro and capital-heavy Potato lose up to 12.',
    bn: 'কম খরচ প্রভাব: সাশ্রয়ী সরিষা, মসুর ও পাট সর্বোচ্চ +৩ পায়; ব্যয়বহুল বোরো ও আলু সর্বোচ্চ ১২ হারায়।',
  },
  reduce_risk: {
    en: 'Climate Risk boost: short-duration crops (90 days or less) gain up to +4 for escaping heatwaves and flash floods.',
    bn: 'ঝুঁকি হ্রাস প্রভাব: স্বল্পমেয়াদী ফসল (৯০ দিন বা কম) সর্বোচ্চ +৪ পায়।',
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
