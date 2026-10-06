// The 10 crops AgriOrbit can recommend, with the agronomy tags the rule
// engine uses. Values are simplified from published Bangladeshi crop
// guidance (BARI for non-rice crops; rice guidance is BRRI's domain).
// Andalib / Parvez: please double-check numbers against the source guides.

import type { SeasonId } from '../lib/fieldShift.ts';

export type Family = 'grass' | 'legume' | 'mustard' | 'nightshade' | 'mallow';
export type Level = 'low' | 'medium' | 'high';

export interface Crop {
  id: string;
  nameEn: string;
  nameBn: string;
  family: Family;
  seasons: SeasonId[];
  tempMin: number; // ideal season mean temperature range, °C
  tempMax: number;
  water: Level; // irrigation / water need
  soilMin: number; // ideal soil moisture at sowing, m³/m³
  soilMax: number;
  nutrient: number; // + adds nitrogen (legume), − uses it up
  days: number; // field duration
  cost: Level; // input cost
  floodTolerant?: boolean;
  source: 'BARI' | 'BRRI';
}

export const CROPS: Crop[] = [
  { id: 'boro', nameEn: 'Boro rice', nameBn: 'বোরো ধান', family: 'grass', seasons: ['rabi'], tempMin: 18, tempMax: 30, water: 'high', soilMin: 0.3, soilMax: 0.45, nutrient: -2, days: 150, cost: 'high', source: 'BRRI' },
  { id: 'wheat', nameEn: 'Wheat', nameBn: 'গম', family: 'grass', seasons: ['rabi'], tempMin: 15, tempMax: 24, water: 'low', soilMin: 0.2, soilMax: 0.3, nutrient: -2, days: 110, cost: 'medium', source: 'BARI' },
  { id: 'maize', nameEn: 'Maize', nameBn: 'ভুট্টা', family: 'grass', seasons: ['rabi', 'kharif1'], tempMin: 18, tempMax: 32, water: 'medium', soilMin: 0.2, soilMax: 0.32, nutrient: -3, days: 120, cost: 'medium', source: 'BARI' },
  { id: 'mustard', nameEn: 'Mustard', nameBn: 'সরিষা', family: 'mustard', seasons: ['rabi'], tempMin: 15, tempMax: 25, water: 'low', soilMin: 0.18, soilMax: 0.28, nutrient: -1, days: 85, cost: 'low', source: 'BARI' },
  { id: 'lentil', nameEn: 'Lentil', nameBn: 'মসুর ডাল', family: 'legume', seasons: ['rabi'], tempMin: 15, tempMax: 25, water: 'low', soilMin: 0.15, soilMax: 0.25, nutrient: 2, days: 110, cost: 'low', source: 'BARI' },
  { id: 'potato', nameEn: 'Potato', nameBn: 'আলু', family: 'nightshade', seasons: ['rabi'], tempMin: 15, tempMax: 22, water: 'medium', soilMin: 0.22, soilMax: 0.32, nutrient: -2, days: 95, cost: 'high', source: 'BARI' },
  { id: 'mungbean', nameEn: 'Mungbean', nameBn: 'মুগ ডাল', family: 'legume', seasons: ['kharif1'], tempMin: 25, tempMax: 35, water: 'low', soilMin: 0.18, soilMax: 0.3, nutrient: 2, days: 65, cost: 'low', source: 'BARI' },
  { id: 'jute', nameEn: 'Jute', nameBn: 'পাট', family: 'mallow', seasons: ['kharif1'], tempMin: 24, tempMax: 34, water: 'medium', soilMin: 0.25, soilMax: 0.4, nutrient: 0, days: 120, cost: 'low', source: 'BARI' },
  { id: 'aus', nameEn: 'Aus rice', nameBn: 'আউশ ধান', family: 'grass', seasons: ['kharif1'], tempMin: 25, tempMax: 33, water: 'medium', soilMin: 0.25, soilMax: 0.4, nutrient: -2, days: 110, cost: 'medium', source: 'BRRI' },
  { id: 'aman', nameEn: 'T. Aman rice', nameBn: 'রোপা আমন ধান', family: 'grass', seasons: ['kharif2'], tempMin: 24, tempMax: 32, water: 'high', soilMin: 0.3, soilMax: 0.45, nutrient: -2, days: 140, cost: 'medium', floodTolerant: true, source: 'BRRI' },
];

export const FAMILY_LABEL: Record<Family, { en: string; bn: string }> = {
  grass: { en: 'Grass family (cereals)', bn: 'ঘাস গোত্র (দানাশস্য)' },
  legume: { en: 'Legume · adds nitrogen', bn: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে' },
  mustard: { en: 'Mustard family', bn: 'সরিষা গোত্র' },
  nightshade: { en: 'Potato family', bn: 'আলু গোত্র' },
  mallow: { en: 'Jute family', bn: 'পাট গোত্র' },
};

export const cropById = (id: string) => CROPS.find((c) => c.id === id)!;
