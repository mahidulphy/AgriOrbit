import type { DistrictId } from './data/bdAdmin';

export type { DistrictId };

export type LocationSource =
  | 'init'
  | 'district-selector'
  | 'upazila-selector'
  | 'map-click'
  | 'preset';

export interface SelectedLocation {
  latitude: number;
  longitude: number;
  district: DistrictId;
  upazila: string;
  source: LocationSource;
}

export type FarmerPriorityId = 'save_water' | 'improve_soil' | 'lower_cost' | 'reduce_risk';

export type Language = 'en' | 'bn';

export type UserJourneyStage =
  | 'landing'
  | 'auth'
  | 'welcome'
  | 'farm_location'
  | 'farmer_priority'
  | 'analyze_transition'
  | 'dashboard';

export interface UpazilaInfo {
  id: string;
  nameEn: string;
  nameBn: string;
}

export interface DistrictInfo {
  id: DistrictId;
  nameEn: string;
  nameBn: string;
  division: string;
  divisionBn: string;
  lat: number;
  lng: number;
  agroZoneEn: string;
  agroZoneBn: string;
  soilTypeEn: string;
  soilTypeBn: string;
  defaultFieldTag: string;
  upazilas: UpazilaInfo[];
}

export interface NasaPowerData {
  rainfallMm: number;
  rainfallAnomalyPct: number; // e.g. -38% vs normal
  tempC: number;
  humidityPct: number;
  radiationMj: number;
}

export interface SmapData {
  surfaceMoisture: number; // m3/m3 e.g. 0.18
  statusEn: 'Deficit' | 'Below Preferred' | 'Optimal' | 'Surplus';
  statusBn: 'ঘাটতি' | 'প্রয়োজনের চেয়ে কম' | 'অনুকূল' | 'অতিরিক্ত আর্দ্র';
  levelPct: number; // 0-100 for gauge
}

export interface ModisData {
  ndvi: number; // e.g. 0.64
  ndviStatusEn: 'Vegetation Stressed' | 'Moderate Greenery' | 'Healthy Crop Stand';
  ndviStatusBn: 'ফসল দুর্বল' | 'মাঝারি সবুজ' | 'সুস্থ ও সতেজ';
  landSurfaceTempC: number;
}

export interface RiskAlert {
  id: string;
  type: 'warning' | 'info' | 'success';
  icon: string;
  titleEn: string;
  titleBn: string;
  descEn: string;
  descBn: string;
}

export interface CropData {
  id: string;
  nameEn: string;
  nameBn: string;
  scientificName: string;
  seasonEn: 'Rabi' | 'Kharif-1' | 'Kharif-2';
  seasonBn: 'রবি' | 'খরিফ-১' | 'খরিফ-২';
  suitabilityScore: number; // 0 - 100
  suitabilityTier: 'high' | 'moderate' | 'marginal';
  waterRequirementEn: string;
  waterRequirementBn: string;
  waterDetailEn: string;
  waterDetailBn: string;
  durationDays: number;
  shortWhyEn: string;
  shortWhyBn: string;
  explanation: {
    observationsTriggered: string[];
    observationsTriggeredBn: string[];
    priorityAlignment: string;
    priorityAlignmentBn: string;
    rulesSatisfied: string[];
    rulesSatisfiedBn: string[];
    waterSavingsVsAlternative?: string;
    waterSavingsVsAlternativeBn?: string;
  };
}

export interface RotationPlan {
  priority: FarmerPriorityId;
  summaryEn: string;
  summaryBn: string;
  estimatedWaterSavingPct: number;
  soilHealthGainPct: number;
  seasons: {
    seasonEn: string;
    seasonBn: string;
    monthsEn: string;
    monthsBn: string;
    crop: CropData;
    agronomicRoleEn: string;
    agronomicRoleBn: string;
  }[];
}
