// NASA observation context follows the selected field location.
// Exact curated telemetry for coverage districts; otherwise the nearest
// coverage region is used and clearly labeled as a regional approximation.
// Resolution honesty is preserved: the pin is exact, the observation is
// grid-cell context.

import { DISTRICT_NASA_DATA } from '../data/agriData';
import { getDistrictAdmin, haversineKm, type DistrictId } from '../data/bdAdmin';
import type { Language, ModisData, NasaPowerData, RiskAlert, SmapData } from '../types';

export interface NasaContext {
  power: NasaPowerData;
  smap: SmapData;
  modis: ModisData;
  alerts: RiskAlert[];
  climateShiftInsightEn: string;
  climateShiftInsightBn: string;
  /** District whose telemetry backs this context. */
  sourceDistrict: DistrictId;
  /** True when borrowed from another district's coverage region. */
  isApproximate: boolean;
}

const COVERAGE_ORDER: DistrictId[] = ['rangpur', 'rajshahi', 'khulna', 'dhaka'];

export function getNasaContext(district: DistrictId): NasaContext {
  const exact = DISTRICT_NASA_DATA[district];
  if (exact) {
    return { ...exact, sourceDistrict: district, isApproximate: false };
  }
  const admin = getDistrictAdmin(district);
  let best: DistrictId = 'rangpur';
  let bestDist = Number.POSITIVE_INFINITY;
  for (const candidate of COVERAGE_ORDER) {
    const candidateAdmin = getDistrictAdmin(candidate);
    if (!admin || !candidateAdmin) continue;
    const d = haversineKm(admin.lat, admin.lng, candidateAdmin.lat, candidateAdmin.lng);
    if (d < bestDist) {
      bestDist = d;
      best = candidate;
    }
  }
  const borrowed = DISTRICT_NASA_DATA[best];
  if (!borrowed) throw new Error(`No NASA coverage data for fallback ${best}`);
  return { ...borrowed, sourceDistrict: best, isApproximate: true };
}

export function nasaSourceLabel(
  context: NasaContext,
  currentDistrictName: string,
  language: Language,
): string {
  if (!context.isApproximate) {
    return language === 'en'
      ? `Calibrated for ${currentDistrictName}`
      : `${currentDistrictName}-এর জন্য বিন্যস্ত`;
  }
  const sourceAdmin = getDistrictAdmin(context.sourceDistrict);
  const sourceName =
    language === 'en' ? sourceAdmin?.nameEn ?? context.sourceDistrict : sourceAdmin?.nameBn ?? context.sourceDistrict;
  return language === 'en'
    ? `Regional approximation from ${sourceName} coverage`
    : `${sourceName} অঞ্চলের তথ্যের ভিত্তিতে আনুমানিক`;
}
