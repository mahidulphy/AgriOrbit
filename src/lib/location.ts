// Single canonical farm-location model and its resolvers.
// App holds ONE SelectedLocation; every screen derives from it.

import { DISTRICTS } from '../data/agriData';
import { getDistrictAdmin, type DistrictId } from '../data/bdAdmin';
import type { DistrictInfo, SelectedLocation, UpazilaInfo } from '../types';
import upazilasRaw from '../data/upazilas.json';

export interface UpazilaRecord {
  id: string;
  pcode: string;
  district_id: string;
  name_en: string;
  name_bn: string;
  lat: number;
  lon: number;
  area_sqkm: number;
  source: string;
}

const ALL_UPAZILAS: UpazilaRecord[] = upazilasRaw as UpazilaRecord[];

// Index upazilas by district for instant O(1) lookup
const UPAZILAS_BY_DISTRICT = new Map<string, UpazilaInfo[]>();

for (const u of ALL_UPAZILAS) {
  const dId = u.district_id;
  if (!UPAZILAS_BY_DISTRICT.has(dId)) {
    UPAZILAS_BY_DISTRICT.set(dId, []);
  }
  UPAZILAS_BY_DISTRICT.get(dId)!.push({
    id: u.id,
    nameEn: u.name_en,
    nameBn: u.name_bn,
    lat: u.lat,
    lng: u.lon,
    pcode: u.pcode,
    area_sqkm: u.area_sqkm,
  });
}

export const DEMO_LOCATION: SelectedLocation = {
  latitude: 25.57212, // Exact Mithapukur centroid from HDX/OCHA COD-AB
  longitude: 89.260919,
  district: 'rangpur',
  upazila: 'rangpur_mithapukur',
  source: 'init',
};

export const DISTRICT_WIDE_UPAZILA = 'district-wide';

/**
 * Returns all upazilas for a district (all 64 districts supported).
 */
export function getUpazilasFor(district: DistrictId): UpazilaInfo[] {
  const list = UPAZILAS_BY_DISTRICT.get(district);
  if (list && list.length > 0) return list;
  return DISTRICTS[district]?.upazilas ?? [];
}

/**
 * Finds an upazila by id, slug, or name with fallback tolerance.
 */
export function getUpazila(district: DistrictId, upazilaId?: string): UpazilaInfo | undefined {
  if (!upazilaId || upazilaId === DISTRICT_WIDE_UPAZILA) return undefined;
  const list = getUpazilasFor(district);
  const cleanId = upazilaId.toLowerCase().trim();
  return list.find(
    (u) =>
      u.id === cleanId ||
      u.id === `${district}_${cleanId}` ||
      u.id.endsWith(`_${cleanId}`) ||
      u.nameEn.toLowerCase() === cleanId ||
      u.nameBn === upazilaId
  );
}

export function locationFromDistrict(
  district: DistrictId,
  upazila?: string,
  source: SelectedLocation['source'] = 'district-selector',
): SelectedLocation {
  const admin = getDistrictAdmin(district);
  const upz = upazila ? getUpazila(district, upazila) : undefined;

  return {
    latitude: upz?.lat ?? admin?.lat ?? 23.685,
    longitude: upz?.lng ?? admin?.lng ?? 90.3563,
    district,
    upazila: upz?.id ?? upazila ?? DISTRICT_WIDE_UPAZILA,
    source,
  };
}

export function getUpazilaName(
  district: DistrictId,
  upazilaId: string,
  language: 'en' | 'bn',
): string {
  if (!upazilaId || upazilaId === DISTRICT_WIDE_UPAZILA) {
    return language === 'en' ? 'District-wide' : 'সমগ্র জেলা';
  }
  const found = getUpazila(district, upazilaId);
  if (found) return language === 'en' ? found.nameEn : found.nameBn;
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
    upazilas: getUpazilasFor(district),
  };
}

export function formatLocation(
  location: SelectedLocation,
  language: 'en' | 'bn',
): { district: string; upazila: string; label: string; isDistrictWide: boolean } {
  const admin = getDistrictAdmin(location.district);
  const profile = getDistrictProfile(location.district);
  const districtName = language === 'en'
    ? (admin?.nameEn ?? profile.nameEn.split(' (')[0])
    : (admin?.nameBn ?? profile.nameBn.split(' (')[0]);
  const isDistrictWide = !location.upazila || location.upazila === DISTRICT_WIDE_UPAZILA;
  const upazilaName = getUpazilaName(location.district, location.upazila, language);
  const label = isDistrictWide ? districtName : `${districtName} › ${upazilaName}`;

  return {
    district: districtName,
    upazila: upazilaName,
    label,
    isDistrictWide,
  };
}
