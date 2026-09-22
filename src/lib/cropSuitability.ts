import type { CropData, FarmerPriorityId } from '../types';
import { CROPS_DATABASE } from '../data/agriData';

export type SeasonFilter = 'All' | 'Rabi' | 'Kharif-1' | 'Kharif-2';

function adjustCropForPriority(crop: CropData, priority: FarmerPriorityId): CropData {
  let adjustedScore = crop.suitabilityScore;

  if (priority === 'save_water') {
    if (crop.waterRequirementEn === 'Low') adjustedScore = Math.min(98, adjustedScore + 4);
    if (crop.id === 'boro_rice') adjustedScore = 52;
  } else if (priority === 'improve_soil') {
    if (crop.id === 'mungbean' || crop.id === 'jute' || crop.id === 'lentil') {
      adjustedScore = Math.min(97, adjustedScore + 5);
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

export function getRankedCrops(priority: FarmerPriorityId, season: SeasonFilter = 'All'): CropData[] {
  const allCrops = Object.values(CROPS_DATABASE).map((crop) =>
    adjustCropForPriority(crop, priority),
  );
  const sorted = [...allCrops].sort((a, b) => b.suitabilityScore - a.suitabilityScore);
  return season === 'All' ? sorted : sorted.filter((c) => c.seasonEn === season);
}
