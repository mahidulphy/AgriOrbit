// Single canonical farm-location model and its resolvers.
// App holds ONE SelectedLocation; every screen derives from it.

import { DISTRICTS } from '../data/agriData';
import { getDistrictAdmin, type DistrictId } from '../data/bdAdmin';
import type { DistrictInfo, SelectedLocation, UpazilaInfo } from '../types';

export const DEMO_LOCATION: SelectedLocation = {
  latitude: 25.7439,
  longitude: 89.2752,
  district: 'rangpur',
  upazila: 'mithapukur',
  source: 'init',
};

export const DISTRICT_WIDE_UPAZILA = 'district-wide';

export function locationFromDistrict(
  district: DistrictId,
  upazila?: string,
  source: SelectedLocation['source'] = 'district-selector',
): SelectedLocation {
  const admin = getDistrictAdmin(district);
  const upazilas = getUpazilasFor(district);
  return {
    latitude: admin?.lat ?? 23.685,
    longitude: admin?.lng ?? 90.3563,
    district,
    upazila: upazila ?? upazilas[0]?.id ?? DISTRICT_WIDE_UPAZILA,
    source,
  };
}

/** Curated upazilas where available; empty means district-wide coverage. */
export function getUpazilasFor(district: DistrictId): UpazilaInfo[] {
  return DISTRICTS[district]?.upazilas ?? [];
}

export function getUpazilaName(
  district: DistrictId,
  upazilaId: string,
  language: 'en' | 'bn',
): string {
  const found = getUpazilasFor(district).find((u) => u.id === upazilaId);
  if (found) return language === 'en' ? found.nameEn : found.nameBn;
  if (upazilaId === DISTRICT_WIDE_UPAZILA) {
    return language === 'en' ? 'District-wide' : 'সমগ্র জেলা';
  }
  return upazilaId;
}

/** Detailed agronomy profile where curated, otherwise an honest fallback. */
export function getDistrictProfile(district: DistrictId): DistrictInfo {
  const curated = DISTRICTS[district];
  if (curated) return curated;
  const admin = getDistrictAdmin(district);
  const nameEn = admin?.nameEn ?? district;
  const nameBn = admin?.nameBn ?? district;
  return {
    id: district,
    nameEn,
    nameBn,
    division: admin?.division ?? 'Bangladesh',
    divisionBn: admin?.divisionBn ?? 'বাংলাদেশ',
    lat: admin?.lat ?? 23.685,
    lng: admin?.lng ?? 90.3563,
    agroZoneEn: 'Bangladesh (district-wide context)',
    agroZoneBn: 'বাংলাদেশ (জেলা-ভিত্তিক প্রেক্ষাপট)',
    soilTypeEn: 'Regional approximation — curated profile coming soon',
    soilTypeBn: 'আঞ্চলিক আনুমানিক তথ্য — বিস্তারিত প্রোফাইল শীঘ্রই',
    defaultFieldTag: `${nameEn} district area`,
    upazilas: [],
  };
}

export function formatLocation(
  location: SelectedLocation,
  language: 'en' | 'bn',
): { district: string; upazila: string } {
  const profile = getDistrictProfile(location.district);
  return {
    district: language === 'en' ? profile.nameEn : profile.nameBn,
    upazila: getUpazilaName(location.district, location.upazila, language),
  };
}
