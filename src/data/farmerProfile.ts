import { BD_DISTRICTS } from './districts';
import { CROPS } from './crops';

export interface FarmerProfile {
  fullName: string;
  phone: string;
  districtId: string;
  upazila: string;
  village: string;
  landSize: number;
  landUnit: 'bigha' | 'acre' | 'decimal';
  landElevation: 'high' | 'medium_high' | 'medium_low' | 'low';
  soilType: 'loam' | 'clay_loam' | 'sandy_loam' | 'clay' | 'silt_loam';
  irrigation: 'deep_tubewell' | 'shallow_tubewell' | 'canal_surface' | 'rainfed';
  previousCrops: string[];
  pastDamages: string[];
  pastDamageNotes: string;
  primaryGoal: 'yield' | 'resilience' | 'low_cost' | 'soil_health';
  updatedAt: string;
}

export const PAST_DAMAGE_OPTIONS = [
  { id: 'flood', en: 'Flood / Inundation', bn: 'বন্যা / প্লাবন' },
  { id: 'drought', en: 'Drought / Dry Spell', bn: 'খরা / অনাবৃষ্টি' },
  { id: 'salinity', en: 'Salinity Intrusion', bn: 'লবণাক্ততা বৃদ্ধি' },
  { id: 'heat_wave', en: 'Extreme Heat Wave', bn: 'তীব্র তাপদাহ' },
  { id: 'hailstorm', en: 'Hailstorm', bn: 'শিলাবৃষ্টি' },
  { id: 'river_erosion', en: 'Riverbank Erosion', bn: 'নদী ভাঙন' },
  { id: 'pest_outbreak', en: 'Pest Outbreak', bn: 'পোকামাকড় ও বালাই আক্রমণ' },
  { id: 'cold_wave', en: 'Cold Wave / Fog', bn: 'শৈত্যপ্রবাহ ও কুয়াশা' },
  { id: 'waterlogging', en: 'Waterlogging in Fields', bn: 'দীর্ঘমেয়াদী জলাবদ্ধতা' },
  { id: 'cyclone', en: 'Storm / Cyclone Winds', bn: 'ঝড় ও ঘূর্ণিঝড়' },
  { id: 'none', en: 'No Major Damage in Past', bn: 'অতীতে কোনো বড় ক্ষতি হয়নি' },
] as const;

export const LAND_ELEVATION_OPTIONS = [
  { id: 'high', en: 'High Land (Flood-free)', bn: 'উঁচু জমি (বন্যা মুক্ত)' },
  { id: 'medium_high', en: 'Medium High Land (Shallow Water)', bn: 'মাঝারি উঁচু জমি' },
  { id: 'medium_low', en: 'Medium Low Land (Floodplain)', bn: 'মাঝারি নিচু জমি' },
  { id: 'low', en: 'Low Land / Beel Basin', bn: 'নিচু জমি / হাওড়-বিল' },
] as const;

export const SOIL_TYPE_OPTIONS = [
  { id: 'loam', en: 'Loam (Balanced & Fertile)', bn: 'দোআঁশ মাটি (সুষম)' },
  { id: 'clay_loam', en: 'Clay Loam (Water-retentive)', bn: 'এঁটেল দোআঁশ' },
  { id: 'sandy_loam', en: 'Sandy Loam (Quick draining)', bn: 'বেলে দোআঁশ' },
  { id: 'silt_loam', en: 'Silt Alluvium (River basin)', bn: 'পলি দোআঁশ (নদী অববাহিকা)' },
  { id: 'clay', en: 'Heavy Clay (Dense soil)', bn: 'ভারী এঁটেল মাটি' },
] as const;

export const IRRIGATION_OPTIONS = [
  { id: 'deep_tubewell', en: 'Deep Tubewell (DTW)', bn: 'গভীর নলকূপ (DTW)' },
  { id: 'shallow_tubewell', en: 'Shallow Tubewell (STW)', bn: 'অগভীর নলকূপ (STW)' },
  { id: 'canal_surface', en: 'River / Canal Surface Lift', bn: 'নদী বা খালের পানি' },
  { id: 'rainfed', en: 'Rainfed (No Permanent Source)', bn: 'বৃষ্টির পানি নির্ভর' },
] as const;

export const FARMING_GOALS = [
  { id: 'yield', en: 'Maximize Yield & Income', bn: 'সর্বোচ্চ ফলন ও লাভ' },
  { id: 'resilience', en: 'Climate Resilience & Safety', bn: 'দুর্যোগ সহনশীলতা ও ঝুঁকি হ্রাস' },
  { id: 'low_cost', en: 'Low Input & Fertilizer Cost', bn: 'কম খরচ ও সাশ্রয়ী চাষ' },
  { id: 'soil_health', en: 'Long-term Soil Fertility', bn: 'মাটির উর্বরতা ও স্বাস্থ্য রক্ষা' },
] as const;

export const DEFAULT_FARMER_PROFILE: FarmerProfile = {
  fullName: '',
  phone: '',
  districtId: '',
  upazila: '',
  village: '',
  landSize: 1.0,
  landUnit: 'bigha',
  landElevation: 'medium_high',
  soilType: 'loam',
  irrigation: 'deep_tubewell',
  previousCrops: [],
  pastDamages: [],
  pastDamageNotes: '',
  primaryGoal: 'soil_health',
  updatedAt: new Date().toISOString(),
};

const STORAGE_KEY_PREFIX = 'agriorbit_farmer_profile_';

export function getFarmerProfile(userId?: string): FarmerProfile {
  if (typeof window === 'undefined') return DEFAULT_FARMER_PROFILE;
  try {
    if (userId && userId !== 'guest_user') {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        return { ...DEFAULT_FARMER_PROFILE, ...parsed };
      }
    }
  } catch (err) {
    console.error('Failed to load farmer profile', err);
  }
  return DEFAULT_FARMER_PROFILE;
}

export function saveFarmerProfile(profile: FarmerProfile, userId?: string): void {
  if (typeof window === 'undefined') return;
  try {
    if (userId && userId !== 'guest_user') {
      const key = `${STORAGE_KEY_PREFIX}${userId}`;
      const payload = { ...profile, updatedAt: new Date().toISOString() };
      localStorage.setItem(key, JSON.stringify(payload));
    }
  } catch (err) {
    console.error('Failed to save farmer profile', err);
  }
}
