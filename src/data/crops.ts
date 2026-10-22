// AgriOrbit Crop Knowledge Base
// Single source of truth for all 37 crops across 6 categories.
// Generated from research files: crop-list.txt, crop-rules.txt, and missing-values.json.

import type { SeasonId } from '../lib/fieldShift.ts';
import type { CropCategoryId } from './cropCategories.ts';
import type { CropData } from '../types.ts';

export type Family =
  | 'poaceae'
  | 'grass'
  | 'fabaceae'
  | 'legume'
  | 'brassicaceae'
  | 'mustard'
  | 'solanaceae'
  | 'nightshade'
  | 'malvaceae'
  | 'mallow'
  | 'araceae'
  | 'convolvulaceae'
  | 'dioscoreaceae'
  | 'euphorbiaceae'
  | 'amaryllidaceae'
  | 'zingiberaceae'
  | 'pedaliaceae'
  | 'asteraceae';

export type Level = 'low' | 'medium' | 'high';

export interface SowingWindow {
  months_en: string;
  months_bn: string;
  start_month: number;
  end_month: number;
}

export interface GrowthStage {
  name_en: string;
  name_bn: string;
  weeks_min: number;
  weeks_max: number;
}

export interface TemperatureThresholds {
  base: number | null;
  optimal_min: number | null;
  optimal_max: number | null;
  critical_min: number | null;
  critical_max: number | null;
  notes_en?: string | null;
  notes_bn?: string | null;
}

export interface HumidityThresholds {
  optimal_min: number | null;
  optimal_max: number | null;
  risk_above: number | null;
  notes_en?: string | null;
  notes_bn?: string | null;
}

export interface RainfallAlert {
  condition: string;
  threshold: number;
  window_days: number;
  alert_en: string;
  alert_bn: string;
}

export interface CropSource {
  field: string;
  file: string;
  section: string;
  confidence?: 'research' | 'estimated';
}

export interface Crop {
  id: string;
  category_id: CropCategoryId;
  parent_group: string | null;
  name_en: string;
  name_bn: string;
  scientific_name: string | null;
  plant_family: string;
  is_legume: boolean;
  seasons: SeasonId[];
  occupies_seasons?: SeasonId[];
  is_long_duration?: boolean;
  sowing_window: SowingWindow;
  harvest_window: SowingWindow;
  duration_days: { min: number; max: number } | null;
  growth_stages: GrowthStage[];
  water_need_mm: { min: number; max: number } | null;
  irrigation_notes_en: string | null;
  irrigation_notes_bn: string | null;
  temperature_c: TemperatureThresholds;
  humidity: HumidityThresholds;
  smap_optimal: { min: number | null; max: number | null };
  rainfall_alerts: RainfallAlert[];
  key_risks_en: string[];
  key_risks_bn: string[];
  decision_rules_en?: string[];
  decision_rules_bn?: string[];
  nasa_data_link_en: string | null;
  nasa_data_link_bn: string | null;
  value_category: Level | null;
  is_staple: boolean;
  floodTolerant?: boolean;
  data_confidence: 'research' | 'estimated';
  data_complete: boolean;
  recommendable: boolean;
  sources: CropSource[];

  // Backwards-compatible aliases for existing engine & UI components
  nameEn: string;
  nameBn: string;
  family: Family;
  tempMin: number;
  tempMax: number;
  water: Level;
  soilMin: number;
  soilMax: number;
  nutrient: number;
  days: number;
  cost: Level;
  source: 'BARI' | 'BRRI' | 'Research' | 'Estimated';
}

export const CROPS: Crop[] = [
  {
    "id": "aus",
    "category_id": "cereal",
    "parent_group": "rice",
    "name_en": "Aus Rice",
    "name_bn": "আউশ ধান",
    "scientific_name": "Oryza sativa var. aus",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "March – April",
      "months_bn": "চৈত্র – বৈশাখ (মার্চ – এপ্রিল)",
      "start_month": 3,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "July – August",
      "months_bn": "আষাঢ় – শ্রাবণ (জুলাই – আগস্ট)",
      "start_month": 7,
      "end_month": 8
    },
    "duration_days": {
      "min": 100,
      "max": 120
    },
    "growth_stages": [
      {
        "name_en": "Seedling & Vegetative",
        "name_bn": "বীজতলা ও অঙ্গজ বৃদ্ধি",
        "weeks_min": 5,
        "weeks_max": 6
      },
      {
        "name_en": "Panicle & Flowering",
        "name_bn": "থোড় ও ফুল ফোটা",
        "weeks_min": 3,
        "weeks_max": 4
      },
      {
        "name_en": "Ripening",
        "name_bn": "দানা গঠন ও পরিপক্কতা",
        "weeks_min": 4,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 500,
      "max": 700
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 20,
      "optimal_min": 26,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 38,
      "notes_bn": "ফুল ফোটার সময় ৩৮°C এর বেশি সংকটপূর্ণ",
      "notes_en": "Critical >38°C at flowering"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "শুরুতে ৬০-৭০%, শেষে ৮০-৮৫%",
      "notes_en": "60-70% initially, 80-85% at harvest"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [
      {
        "condition": "drought",
        "threshold": 0,
        "window_days": 30,
        "alert_en": "Zero rain in March with inadequate irrigation suggests switching to summer sesame or mungbean",
        "alert_bn": "মার্চে শূন্য বৃষ্টিপাত ও সেচ সংকট থাকলে তিল বা মুগডালে শিফট করার পরামর্শ"
      }
    ],
    "key_risks_en": [
      "Drought stress during critical stages",
      "কাটার সময় ভারী বৃষ্টিতে শিষেই ধান গজানো"
    ],
    "key_risks_bn": [
      "প্রারম্ভিক খরা",
      "কাটার সময় ভারী বৃষ্টিতে শিষেই ধান গজানো"
    ],
    "decision_rules_en": [
      "If March rainfall is zero and irrigation is inadequate, cancel Aus and recommend sesame or mungbean."
    ],
    "decision_rules_bn": [
      "মার্চ মাসে যদি বৃষ্টিপাত শূন্য থাকে এবং সেচের পানি অপ্রতুল হয়, তবে আউশ ধান বাতিল করে স্বল্পমেয়াদী গ্রীষ্মকালীন তিল বা মুগডালে শিফট করার লজিক কার্যকর হবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "**১. আউশ ধান (Aus Rice) — প্রাক-বর্ষা বা গ্রীষ্মকালীন ধান**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৩. আউশ ধান",
        "confidence": "research"
      }
    ],
    "nameEn": "Aus Rice",
    "nameBn": "আউশ ধান",
    "family": "grass",
    "tempMin": 26,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -2,
    "days": 120,
    "cost": "medium",
    "source": "BRRI"
  },
  {
    "id": "aman",
    "category_id": "cereal",
    "parent_group": "rice",
    "name_en": "Aman Rice (T. Aman)",
    "name_bn": "আমন ধান (রোপা আমন)",
    "scientific_name": "Oryza sativa",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "July – August",
      "months_bn": "১৫ আষাঢ় – ১৫ শ্রাবণ (জুলাই – আগস্ট)",
      "start_month": 7,
      "end_month": 8
    },
    "harvest_window": {
      "months_en": "November – December",
      "months_bn": "অগ্রহায়ণ (নভেম্বর – ডিসেম্বর)",
      "start_month": 11,
      "end_month": 12
    },
    "duration_days": {
      "min": 110,
      "max": 160
    },
    "growth_stages": [
      {
        "name_en": "Seedbed",
        "name_bn": "বীজতলা পর্যায়",
        "weeks_min": 3,
        "weeks_max": 4
      },
      {
        "name_en": "Vegetative Tillering",
        "name_bn": "অঙ্গজ বৃদ্ধি ও টিলারিং",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Panicle & Flowering",
        "name_bn": "থোড় ও ফুল ফোটা",
        "weeks_min": 3,
        "weeks_max": 4
      },
      {
        "name_en": "Ripening",
        "name_bn": "পরিপক্কতা ও ফসল কাটা",
        "weeks_min": 4,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 1000,
      "max": 1250
    },
    "irrigation_notes_en": "High water requirement; regular irrigation or standing water needed",
    "irrigation_notes_bn": "উচ্চ সেচ নির্ভর; নিয়মিত সেচ বা স্থির পানি বজায় রাখা প্রয়োজন",
    "temperature_c": {
      "base": 18,
      "optimal_min": 25,
      "optimal_max": 33,
      "critical_min": 15,
      "critical_max": 37,
      "notes_bn": "ফুল ফোটার সময় ৩৭°C এর বেশি সংকটপূর্ণ",
      "notes_en": "Critical >37°C at flowering"
    },
    "humidity": {
      "optimal_min": 80,
      "optimal_max": 90,
      "risk_above": 95,
      "notes_bn": "বৃদ্ধি পর্যায়ে ৮০-৯০%, কাটার সময় ৬০-৭০%",
      "notes_en": "80-90% vegetative, 60-70% harvest"
    },
    "smap_optimal": {
      "min": 0.3,
      "max": 0.45
    },
    "rainfall_alerts": [
      {
        "condition": "monsoon_deficit",
        "threshold": 40,
        "window_days": 30,
        "alert_en": "July rainfall forecast 40% below normal suggests drought-tolerant varieties (BRRI dhan56/71)",
        "alert_bn": "জুলাই বৃষ্টিপাতের পূর্বাভাস স্বাভাবিকের চেয়ে ৪০% কম থাকলে খরা-সহনশীল জাত (ব্রি ধান৫৬/৭১) নির্বাচনের নির্দেশ"
      }
    ],
    "key_risks_en": [
      "Drought stress during critical stages",
      "Pest attacks",
      "Flash flood risk"
    ],
    "key_risks_bn": [
      "আশ্বিনা খরা (সেপ্টেম্বর-অক্টোবরে বৃষ্টি না হওয়া)",
      "মাজরা ও কারেন্ট পোকা",
      "আগাম বন্যা"
    ],
    "decision_rules_en": [
      "If July rainfall forecast is 40% below normal, recommend drought-tolerant varieties (BRRI dhan56/71)."
    ],
    "decision_rules_bn": [
      "জুলাই মাসে বৃষ্টিপাতের পূর্বাভাস যদি স্বাভাবিকের চেয়ে ৪০ শতাংশ কম থাকে, তবে অ্যালগরিদম সাধারণ দীর্ঘমেয়াদী আমনের বদলে খরা-সহনশীল জাত যেমন ব্রি ধান৫৬ বা ৭১ নির্বাচন করার নির্দেশ দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": true,
    "floodTolerant": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "**২. আমন ধান (Aman Rice) — বর্ষাকালীন বা প্রধান মৌসুমি ধান**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২. আমন ধান (রোপা আমন)",
        "confidence": "research"
      }
    ],
    "nameEn": "Aman Rice (T. Aman)",
    "nameBn": "আমন ধান (রোপা আমন)",
    "family": "grass",
    "tempMin": 25,
    "tempMax": 33,
    "water": "high",
    "soilMin": 0.3,
    "soilMax": 0.45,
    "nutrient": -2,
    "days": 160,
    "cost": "medium",
    "source": "BRRI"
  },
  {
    "id": "boro",
    "category_id": "cereal",
    "parent_group": "rice",
    "name_en": "Boro Rice",
    "name_bn": "বোরো ধান",
    "scientific_name": "Oryza sativa var. boro",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "December – January",
      "months_bn": "অগ্রহায়ণ – পৌষ (ডিসেম্বর – জানুয়ারি)",
      "start_month": 12,
      "end_month": 1
    },
    "harvest_window": {
      "months_en": "April – May",
      "months_bn": "বৈশাখ – জ্যৈষ্ঠ (এপ্রিল – মে)",
      "start_month": 4,
      "end_month": 5
    },
    "duration_days": {
      "min": 140,
      "max": 160
    },
    "growth_stages": [
      {
        "name_en": "Seedbed",
        "name_bn": "বীজতলা পর্যায়",
        "weeks_min": 4,
        "weeks_max": 5
      },
      {
        "name_en": "Vegetative Tillering",
        "name_bn": "চারার অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 8
      },
      {
        "name_en": "Panicle & Flowering",
        "name_bn": "থোড় ও ফুল ফোটা পর্যায়",
        "weeks_min": 3,
        "weeks_max": 4
      },
      {
        "name_en": "Grain Filling & Maturity",
        "name_bn": "দানা গঠন ও পরিপক্কতা পর্যায়",
        "weeks_min": 4,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 1200,
      "max": 1500
    },
    "irrigation_notes_en": "High water requirement; regular irrigation or standing water needed",
    "irrigation_notes_bn": "উচ্চ সেচ নির্ভর; নিয়মিত সেচ বা স্থির পানি বজায় রাখা প্রয়োজন",
    "temperature_c": {
      "base": 12,
      "optimal_min": 22,
      "optimal_max": 32,
      "critical_min": 10,
      "critical_max": 35,
      "notes_bn": "চারা অবস্থায় <১০°C কোল্ড ইনজুরি, ফুল ফোটার সময় >৩৫°C চিটা",
      "notes_en": "Cold injury <10°C in nursery, sterility >35°C at flowering"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "শুরুতে ৫০-৬০%, মার্চ-এপ্রিলে ৭০-৭৫%",
      "notes_en": "50-60% initially, 70-75% in March-April"
    },
    "smap_optimal": {
      "min": 0.35,
      "max": 0.5
    },
    "rainfall_alerts": [
      {
        "condition": "flash_flood",
        "threshold": 100,
        "window_days": 1,
        "alert_en": "GPM rainfall >100mm in 24h at harvest triggers early flash flood alert for haor/lowlands",
        "alert_bn": "ফসল কাটার সময়ে ২৪ ঘণ্টায় ১০০ মিমি বেশি বৃষ্টিপাত রেকর্ড হলে হাওর বা নিচু এলাকার জন্য আগাম বন্যা সতর্কতা জারি"
      }
    ],
    "key_risks_en": [
      "Cold stress and frost injury",
      "Flash flood risk",
      "ভূগর্ভস্থ পানির সংকট ও অতিরিক্ত সেচ খরচ"
    ],
    "key_risks_bn": [
      "শীতকালীন তীব্র শৈত্যপ্রবাহ",
      "হাওরে আগাম বন্যা (Flash Flood)",
      "ভূগর্ভস্থ পানির সংকট ও অতিরিক্ত সেচ খরচ"
    ],
    "decision_rules_en": [
      "If December soil moisture is <20% and irrigation is inadequate, switch to wheat or rabi maize."
    ],
    "decision_rules_bn": [
      "ডিসেম্বরে যদি দেখা যায় মাটির আর্দ্রতা ২০ শতাংশের কম এবং পর্যাপ্ত সেচের সুযোগ নেই, তবে অ্যালগরিদম বোরো ধান চাষের পরিবর্তে গম অথবা রবি ভুট্টা চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "**৩. বোরো ধান (Boro Rice) — শীতকালীন ধান (সম্পূর্ণ সেচনির্ভর)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১. বোরো ধান",
        "confidence": "research"
      }
    ],
    "nameEn": "Boro Rice",
    "nameBn": "বোরো ধান",
    "family": "grass",
    "tempMin": 22,
    "tempMax": 32,
    "water": "high",
    "soilMin": 0.35,
    "soilMax": 0.5,
    "nutrient": -3,
    "days": 160,
    "cost": "high",
    "source": "BRRI"
  },
  {
    "id": "wheat",
    "category_id": "cereal",
    "parent_group": null,
    "name_en": "Wheat",
    "name_bn": "গম",
    "scientific_name": "Triticum aestivum",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "15 November – 30 November",
      "months_bn": "কার্তিক – অগ্রহায়ণ (১৫ নভেম্বর – ৩০ নভেম্বর)",
      "start_month": 11,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "March – April",
      "months_bn": "ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)",
      "start_month": 3,
      "end_month": 4
    },
    "duration_days": {
      "min": 100,
      "max": 115
    },
    "growth_stages": [
      {
        "name_en": "Crown Root & Tillering",
        "name_bn": "ক্রাউন রুট ও টিলারিং",
        "weeks_min": 4,
        "weeks_max": 5
      },
      {
        "name_en": "Booting & Heading",
        "name_bn": "শীষ বের হওয়া ও ফুল ফোটা",
        "weeks_min": 4,
        "weeks_max": 5
      },
      {
        "name_en": "Grain Filling & Ripening",
        "name_bn": "দানা গঠন ও পরিপক্কতা",
        "weeks_min": 4,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 200,
      "max": 300
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 4,
      "optimal_min": 15,
      "optimal_max": 25,
      "critical_min": 4,
      "critical_max": 30,
      "notes_bn": "দানা গঠনকালে ২৫-৩০°C টার্মিনাল হিট স্ট্রেস",
      "notes_en": "Terminal heat stress 25-30°C during grain filling"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 60,
      "risk_above": 85,
      "notes_bn": "৮৫% এর বেশি আর্দ্রতা ও কুয়াশায় ব্লাস্ট ঝুঁকি",
      "notes_en": "Blast disease risk above 85% with fog"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [
      {
        "condition": "heat_wave",
        "threshold": 30,
        "window_days": 7,
        "alert_en": "Feb-March heat wave suggests fast-maturing oilseeds or pulses instead of late wheat",
        "alert_bn": "ফেব্রুয়ারি-মার্চে আগাম তাপদাহের সম্ভাবনা থাকলে দেরিতে বপন করা গম বাতিল করে দ্রুত পরিপক্ক তেলবীজ/ডালে সুপারিশ"
      }
    ],
    "key_risks_en": [
      "Heat stress during reproductive stage",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "টার্মিনাল হিট স্ট্রেস (ফেব্রুয়ারি-মার্চে অকাল তাপমাত্রা বৃদ্ধি)",
      "ব্লাস্ট রোগ (আর্দ্রতা >৮৫% ও বৃষ্টি/কুয়াশা)"
    ],
    "decision_rules_en": [
      "If Feb-March forecast indicates early heat wave, recommend fast-maturing oilseeds/pulses over late wheat."
    ],
    "decision_rules_bn": [
      "ফেব্রুয়ারি ও মার্চের পূর্বাভাসে যদি আগাম তাপদাহের সম্ভাবনা থাকে, তবে অ্যালগরিদম দেরিতে বপন করা গম বাতিল করে জমিতে দ্রুত পরিপক্ক তেলবীজ বা ডাল জাতীয় ফসলের সুপারিশ করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **গম (Wheat) — শীত মৌসুম (Rabi Crop)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৪. গম",
        "confidence": "research"
      }
    ],
    "nameEn": "Wheat",
    "nameBn": "গম",
    "family": "grass",
    "tempMin": 15,
    "tempMax": 25,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": -2,
    "days": 115,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "maize",
    "category_id": "cereal",
    "parent_group": null,
    "name_en": "Maize (Rabi & Kharif-1)",
    "name_bn": "ভুট্টা",
    "scientific_name": "Zea mays",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "Rabi: mid-Oct – Dec; Kharif: mid-Feb – March",
      "months_bn": "রবি: মধ্য-অক্টোবর – ডিসেম্বর; খরিফ-১: মধ্য-ফেব্রুয়ারি – মার্চ",
      "start_month": 10,
      "end_month": 3
    },
    "harvest_window": {
      "months_en": "Rabi: April – May; Kharif: June – July",
      "months_bn": "রবি: এপ্রিল – মে; খরিফ-১: জুন – জুলাই",
      "start_month": 4,
      "end_month": 7
    },
    "duration_days": {
      "min": 130,
      "max": 155
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Growth",
        "name_bn": "অঙ্গজ বৃদ্ধি",
        "weeks_min": 6,
        "weeks_max": 7
      },
      {
        "name_en": "Tasseling & Silking",
        "name_bn": "ফুল ও মোচা আসা",
        "weeks_min": 3,
        "weeks_max": 4
      },
      {
        "name_en": "Grain Filling & Maturity",
        "name_bn": "দানা গঠন ও পরিপক্কতা",
        "weeks_min": 5,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 500,
      "max": 700
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 8,
      "optimal_min": 21,
      "optimal_max": 32,
      "critical_min": 10,
      "critical_max": 35,
      "notes_bn": "শৈত্যপ্রবাহ <১০°C বৃদ্ধি বন্ধ, সিল্কিংয়ে >৩৫°C হিট স্ট্রেস",
      "notes_en": "Growth halts <10°C, heat stress >35°C at silking"
    },
    "humidity": {
      "optimal_min": 55,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "রবিতে ৫৫-৭০%, খরিফে ৭০-৮০%",
      "notes_en": "55-70% in Rabi, 70-80% in Kharif"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [
      {
        "condition": "groundwater_depletion",
        "threshold": 0,
        "window_days": 0,
        "alert_en": "Falling groundwater level where Boro planned triggers rabi maize shift for 50% water savings",
        "alert_bn": "ভূগর্ভস্থ পানির স্তর নিচে নামলে বোরোর পরিবর্তে ৫০% পানি সাশ্রয়ী রবি ভুট্টায় শিফট করার সিদ্ধান্ত"
      }
    ],
    "key_risks_en": [
      "Cold stress and frost injury",
      "Drought stress during critical stages",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "শৈত্যপ্রবাহ (<১০°C বৃদ্ধি বন্ধ)",
      "সিল্কিংয়ে হিট স্ট্রেস ও খরা",
      "জলাবদ্ধতা (২৪-৪৮ ঘণ্টায় গাছ ধ্বংস)"
    ],
    "decision_rules_en": [
      "In falling groundwater areas where Boro is planned, recommend rabi maize to save 50% water."
    ],
    "decision_rules_bn": [
      "ভূগর্ভস্থ পানির স্তর নিচে নেমে যাওয়া এলাকায় যদি শীতকালীন বোরো ধান চাষের পরিকল্পনা থাকে, তবে অ্যালগরিদম পানি সাশ্রয়ের জন্য ৫০ শতাংশ কম পানি লাগে এমন রবি ভুট্টায় শিফট করার সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **বাংলাদেশে ভুট্টার ২টি আলাদা মৌসুম ও জাতভিত্তিক বৈশিষ্ট্য:**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৫. ভুট্টা",
        "confidence": "research"
      }
    ],
    "nameEn": "Maize (Rabi & Kharif-1)",
    "nameBn": "ভুট্টা",
    "family": "grass",
    "tempMin": 21,
    "tempMax": 32,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -3,
    "days": 155,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "lentil",
    "category_id": "pulses",
    "parent_group": null,
    "name_en": "Lentil",
    "name_bn": "মসুর ডাল",
    "scientific_name": "Lens culinaris",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "mid-October – mid-November",
      "months_bn": "কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)",
      "start_month": 10,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "February – mid-March",
      "months_bn": "ফাল্গুন (ফেব্রুয়ারি – মধ্য-মার্চ)",
      "start_month": 2,
      "end_month": 3
    },
    "duration_days": {
      "min": 100,
      "max": 115
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 200,
      "max": 250
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 5,
      "optimal_min": 15,
      "optimal_max": 25,
      "critical_min": 5,
      "critical_max": 30,
      "notes_bn": "ফুল ফোটার সময় >২৮-৩০°C ফুল ঝরে যায়",
      "notes_en": "Flowers abort at >28-30°C"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 65,
      "risk_above": 80,
      "notes_bn": "উচ্চ আর্দ্রতায় স্টেমফাইলিয়াম ব্লাইট রোগ",
      "notes_en": "Stemphylium blight risk under high humidity"
    },
    "smap_optimal": {
      "min": 0.18,
      "max": 0.25
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "ফুল ফোটার সময় মেঘলা ও কুয়াশাচ্ছন্ন আবহাওয়া (স্টেমফাইলিয়াম ব্লাইট)",
      "Heat stress during reproductive stage"
    ],
    "key_risks_bn": [
      "অকাল বৃষ্টি ও জলাবদ্ধতা (গোড়া পচা)",
      "ফুল ফোটার সময় মেঘলা ও কুয়াশাচ্ছন্ন আবহাওয়া (স্টেমফাইলিয়াম ব্লাইট)",
      "মার্চে তাপদাহ"
    ],
    "decision_rules_en": [
      "মাটিতে নাইট্রোজেনের ঘাটতি থাকলে এবং রবি মৌসুমে বোরো ধানের জন্য পর্যাপ্ত সেচ না থাকলে অ্যালগরিদম মাটির স্বাস্থ্য ফিরিয়ে আনতে মসুর ডাল চাষের নির্দেশ দেবে।"
    ],
    "decision_rules_bn": [
      "মাটিতে নাইট্রোজেনের ঘাটতি থাকলে এবং রবি মৌসুমে বোরো ধানের জন্য পর্যাপ্ত সেচ না থাকলে অ্যালগরিদম মাটির স্বাস্থ্য ফিরিয়ে আনতে মসুর ডাল চাষের নির্দেশ দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **মসুর ডাল (Lentil) — রবি মৌসুম (শীতকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৭. মসুর ডাল",
        "confidence": "research"
      }
    ],
    "nameEn": "Lentil",
    "nameBn": "মসুর ডাল",
    "family": "legume",
    "tempMin": 15,
    "tempMax": 25,
    "water": "low",
    "soilMin": 0.18,
    "soilMax": 0.25,
    "nutrient": 2,
    "days": 115,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "mungbean",
    "category_id": "pulses",
    "parent_group": null,
    "name_en": "Mungbean",
    "name_bn": "মুগডাল",
    "scientific_name": "Vigna radiata",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "kharif1",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "Kharif-1: late-Feb – March; Kharif-2: Aug – mid-Sep",
      "months_bn": "খরিফ-১: ফেব্রুয়ারি শেষ – মার্চ; খরিফ-২: আগস্ট – মধ্য-সেপ্টেম্বর",
      "start_month": 2,
      "end_month": 9
    },
    "harvest_window": {
      "months_en": "Kharif-1: late-April – May; Kharif-2: Oct – Nov",
      "months_bn": "খরিফ-১: এপ্রিল শেষ – মে; খরিফ-২: অক্টোবর – নভেম্বর",
      "start_month": 4,
      "end_month": 11
    },
    "duration_days": {
      "min": 60,
      "max": 75
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 2,
        "weeks_max": 4
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 2,
        "weeks_max": 4
      }
    ],
    "water_need_mm": {
      "min": 200,
      "max": 300
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 12,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 12,
      "critical_max": 40,
      "notes_bn": "ফুল ফোটার সময় চরম তাপদাহে ফুল ঝরে",
      "notes_en": "Flowers drop under severe heat at flowering"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "মেঘলা ও উচ্চ আর্দ্রতায় হলুদ মোজাইক ভাইরাস",
      "notes_en": "YMV risk under prolonged cloudy humidity"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "কাটার সময় প্রাক-বর্ষার বৃষ্টি (পড স্প্রাউটিং ও পচন)",
      "মেঘলা আবহাওয়ায় হলুদ মোজাইক ভাইরাস (YMV)",
      "Drought stress during critical stages"
    ],
    "key_risks_bn": [
      "কাটার সময় প্রাক-বর্ষার বৃষ্টি (পড স্প্রাউটিং ও পচন)",
      "মেঘলা আবহাওয়ায় হলুদ মোজাইক ভাইরাস (YMV)",
      "খরিফ-১ এ দীর্ঘায়িত খরা"
    ],
    "decision_rules_en": [
      "দক্ষিণাঞ্চলের উপকূলীয় এলাকায় আমন ধান কাটার পর মধ্যবর্তী ফাঁকা সময়ে মাটির লবণাক্ততা বৃদ্ধির ঝুঁকি থাকলে অ্যালগরিদম মুগডাল চাষের নির্দেশ দেবে।"
    ],
    "decision_rules_bn": [
      "দক্ষিণাঞ্চলের উপকূলীয় এলাকায় আমন ধান কাটার পর মধ্যবর্তী ফাঁকা সময়ে মাটির লবণাক্ততা বৃদ্ধির ঝুঁকি থাকলে অ্যালগরিদম মুগডাল চাষের নির্দেশ দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **মুগডাল (Mungbean) — খরিফ-১ (বসন্ত/গ্রীষ্ম) এবং খরিফ-২ (শরৎ)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১০. মুগডাল",
        "confidence": "research"
      }
    ],
    "nameEn": "Mungbean",
    "nameBn": "মুগডাল",
    "family": "legume",
    "tempMin": 25,
    "tempMax": 35,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": 2,
    "days": 75,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "grass_pea",
    "category_id": "pulses",
    "parent_group": null,
    "name_en": "Grass Pea",
    "name_bn": "খেসারি ডাল",
    "scientific_name": "Lathyrus sativus",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "mid-October – mid-November",
      "months_bn": "কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)",
      "start_month": 10,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "February – mid-March",
      "months_bn": "ফাল্গুন (ফেব্রুয়ারি – মধ্য-মার্চ)",
      "start_month": 2,
      "end_month": 3
    },
    "duration_days": {
      "min": 110,
      "max": 125
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 150,
      "max": 200
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 5,
      "optimal_min": 15,
      "optimal_max": 25,
      "critical_min": 5,
      "critical_max": 30,
      "notes_bn": "শীতকালীন নাতিশীতোষ্ণ আবহাওয়া অনুকূল",
      "notes_en": "Cool winter climate favorable"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 65,
      "risk_above": 80,
      "notes_bn": "ফুল ফোটার সময় ডাউনি মিলডিউ রোগঝুঁকি",
      "notes_en": "Downy mildew risk during flowering"
    },
    "smap_optimal": {
      "min": 0.18,
      "max": 0.25
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "চারা অবস্থায় জমিতে পানি জমে থাকা (শিকড় পচা)",
      "ফুল ফোটার সময় একটানা মেঘলা ও আর্দ্র আবহাওয়া (ডাউনি মিলডিউ)",
      "পাকার সময় শিলাবৃষ্টি"
    ],
    "key_risks_bn": [
      "চারা অবস্থায় জমিতে পানি জমে থাকা (শিকড় পচা)",
      "ফুল ফোটার সময় একটানা মেঘলা ও আর্দ্র আবহাওয়া (ডাউনি মিলডিউ)",
      "পাকার সময় শিলাবৃষ্টি"
    ],
    "decision_rules_en": [
      "আমন ধান কাটার পর জমিতে সেচের পানির ঘাটতি থাকলে এবং মাটির আর্দ্রতা ২০ শতাংশের কাছাকাছি থাকলে অ্যালগরিদম শূন্য সেচে রোটেশন ফসল হিসেবে খেসারি চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "আমন ধান কাটার পর জমিতে সেচের পানির ঘাটতি থাকলে এবং মাটির আর্দ্রতা ২০ শতাংশের কাছাকাছি থাকলে অ্যালগরিদম শূন্য সেচে রোটেশন ফসল হিসেবে খেসারি চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "low",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **খেসারি ডাল (Grass Pea) — রবি মৌসুম (শীতকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৬. খেসারি ডাল",
        "confidence": "research"
      }
    ],
    "nameEn": "Grass Pea",
    "nameBn": "খেসারি ডাল",
    "family": "legume",
    "tempMin": 15,
    "tempMax": 25,
    "water": "low",
    "soilMin": 0.18,
    "soilMax": 0.25,
    "nutrient": 2,
    "days": 125,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "blackgram",
    "category_id": "pulses",
    "parent_group": null,
    "name_en": "Blackgram",
    "name_bn": "মাষকলাই",
    "scientific_name": "Vigna mungo",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "15 August – 25 September",
      "months_bn": "ভাদ্র – আশ্বিন (১৫ আগস্ট – ২৫ সেপ্টেম্বর)",
      "start_month": 8,
      "end_month": 9
    },
    "harvest_window": {
      "months_en": "November – December",
      "months_bn": "কার্তিক – অগ্রহায়ণ (নভেম্বর – ডিসেম্বর)",
      "start_month": 11,
      "end_month": 12
    },
    "duration_days": {
      "min": 70,
      "max": 85
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 2,
        "weeks_max": 4
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 3,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 250,
      "max": 350
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 12,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 12,
      "critical_max": 38,
      "notes_bn": "ফুল ফোটার সময় ৩৫°C এর বেশি ক্ষতিকর",
      "notes_en": "Harmful above 35°C at flowering"
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "অতিরিক্ত আর্দ্রতায় গোড়া পচন ও YMV",
      "notes_en": "Root rot and YMV under high humidity"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.28
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Pest attacks"
    ],
    "key_risks_bn": [
      "অতিরিক্ত বৃষ্টিপাত ও জলাবদ্ধতা (গোড়া ও শিকড় পচন)",
      "পোকা মাকড় ও ইয়েলো মোজাইক ভাইরাস (YMV)"
    ],
    "decision_rules_en": [
      "আগস্ট ও সেপ্টেম্বরে চরাঞ্চলে বা পতিত জমিতে স্বল্প সময়ে মাটির উর্বরতা বাড়াতে এবং পরবর্তী শীতকালীন ফসলের প্রস্তুতি হিসেবে অ্যালগরিদম মাষকলাই চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "আগস্ট ও সেপ্টেম্বরে চরাঞ্চলে বা পতিত জমিতে স্বল্প সময়ে মাটির উর্বরতা বাড়াতে এবং পরবর্তী শীতকালীন ফসলের প্রস্তুতি হিসেবে অ্যালগরিদম মাষকলাই চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **মাষকলাই (Blackgram) — খরিফ-২ মৌসুম (দেরি-গ্রীষ্ম / শরৎকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৯. মাষকলাই",
        "confidence": "research"
      }
    ],
    "nameEn": "Blackgram",
    "nameBn": "মাষকলাই",
    "family": "legume",
    "tempMin": 25,
    "tempMax": 35,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.28,
    "nutrient": 2,
    "days": 85,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "chickpea",
    "category_id": "pulses",
    "parent_group": null,
    "name_en": "Chickpea",
    "name_bn": "ছোলা",
    "scientific_name": "Cicer arietinum",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "November",
      "months_bn": "কার্তিক – অগ্রহায়ণ (নভেম্বর)",
      "start_month": 11,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "late-February – March",
      "months_bn": "ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – মার্চ)",
      "start_month": 2,
      "end_month": 3
    },
    "duration_days": {
      "min": 120,
      "max": 135
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 200,
      "max": 250
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 5,
      "optimal_min": 15,
      "optimal_max": 25,
      "critical_min": 5,
      "critical_max": 32,
      "notes_bn": "পড ফিলিংয়ের সময় ৩০-৩২°C এ চিটা হয়",
      "notes_en": "Pod filling impaired above 30-32°C"
    },
    "humidity": {
      "optimal_min": 40,
      "optimal_max": 60,
      "risk_above": 75,
      "notes_bn": "উচ্চ আর্দ্রতা (>৭৫%) ও কুয়াশায় বোট্রাইটিস গ্রে মোল্ড",
      "notes_en": "Botrytis grey mould if humidity >75%"
    },
    "smap_optimal": {
      "min": 0.15,
      "max": 0.22
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "ফুল ফোটার সময় উচ্চ আর্দ্রতা (>৭৫%) ও কুয়াশা (বোট্রাইটিস গ্রে মোল্ড)"
    ],
    "key_risks_bn": [
      "অকাল বৃষ্টি ও জলাবদ্ধতা (শিকড় পচন ও উইল্ট রোগ)",
      "ফুল ফোটার সময় উচ্চ আর্দ্রতা (>৭৫%) ও কুয়াশা (বোট্রাইটিস গ্রে মোল্ড)"
    ],
    "decision_rules_en": [
      "বরেন্দ্র বা শুষ্ক অঞ্চলে আমন ধান কাটার পর তীব্র পানির সংকট থাকলে অ্যালগরিদম বিকল্প ফসল হিসেবে ছোলা রোটেশন করার সুপারিশ করবে।"
    ],
    "decision_rules_bn": [
      "বরেন্দ্র বা শুষ্ক অঞ্চলে আমন ধান কাটার পর তীব্র পানির সংকট থাকলে অ্যালগরিদম বিকল্প ফসল হিসেবে ছোলা রোটেশন করার সুপারিশ করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **ছোলা (Chickpea) — রবি মৌসুম (শীতকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৮. ছোলা",
        "confidence": "research"
      }
    ],
    "nameEn": "Chickpea",
    "nameBn": "ছোলা",
    "family": "legume",
    "tempMin": 15,
    "tempMax": 25,
    "water": "low",
    "soilMin": 0.15,
    "soilMax": 0.22,
    "nutrient": 2,
    "days": 135,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "mustard",
    "category_id": "oilseeds",
    "parent_group": null,
    "name_en": "Mustard / Rapeseed",
    "name_bn": "সরিষা",
    "scientific_name": "Brassica napus",
    "plant_family": "brassicaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "mid-October – mid-November",
      "months_bn": "কার্তিক (মধ্য-অক্টোবর – মধ্য-নভেম্বর)",
      "start_month": 10,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "January – February",
      "months_bn": "মাঘ – ফাল্গুন (জানুয়ারি – ফেব্রুয়ারি)",
      "start_month": 1,
      "end_month": 2
    },
    "duration_days": {
      "min": 70,
      "max": 90
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 5,
        "weeks_max": 7
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 2,
        "weeks_max": 4
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 3,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 150,
      "max": 250
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 6,
      "optimal_min": 12,
      "optimal_max": 22,
      "critical_min": 6,
      "critical_max": 28,
      "notes_bn": "বীজ গঠনের সময় >২৫-২৮°C তেল কমে যায়",
      "notes_en": "Seed oil yield drops above 25-28°C"
    },
    "humidity": {
      "optimal_min": 55,
      "optimal_max": 70,
      "risk_above": 85,
      "notes_bn": "কুয়াশাচ্ছন্ন আর্দ্রতায় জাপপোকা (জাব) আক্রমণ",
      "notes_en": "Aphid outbreak under warm humid fog"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Pest attacks",
      "Waterlogging and poor drainage",
      "ফুল ফোটার সময় মেঘলা আকাশ"
    ],
    "key_risks_bn": [
      "জাপপোকা (Aphid) আক্রমণ (উষ্ণ ও কুয়াশাচ্ছন্ন আবহাওয়ায়)",
      "অকাল বৃষ্টি ও জলাবদ্ধতা",
      "ফুল ফোটার সময় মেঘলা আকাশ"
    ],
    "decision_rules_en": [
      "আমন ও বোরো ধানের মধ্যবর্তী ৭০ থেকে ৮০ দিনের গ্যাপে জমি ফেলে না রেখে স্বল্পমেয়াদী সরিষা আবাদের সিদ্ধান্ত কার্যকর হবে।"
    ],
    "decision_rules_bn": [
      "আমন ও বোরো ধানের মধ্যবর্তী ৭০ থেকে ৮০ দিনের গ্যাপে জমি ফেলে না রেখে স্বল্পমেয়াদী সরিষা আবাদের সিদ্ধান্ত কার্যকর হবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **সরিষা (Mustard / Rapeseed) — রবি মৌসুম (শীতকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১১. সরিষা",
        "confidence": "research"
      }
    ],
    "nameEn": "Mustard / Rapeseed",
    "nameBn": "সরিষা",
    "family": "mustard",
    "tempMin": 12,
    "tempMax": 22,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": -1,
    "days": 90,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "groundnut",
    "category_id": "oilseeds",
    "parent_group": null,
    "name_en": "Groundnut",
    "name_bn": "চীনাবাদাম",
    "scientific_name": "Arachis hypogaea",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "Rabi: mid-Oct – Dec; Kharif-1: mid-Feb – April",
      "months_bn": "রবি: মধ্য-অক্টোবর – ডিসেম্বর; খরিফ-১: মধ্য-ফেব্রুয়ারি – এপ্রিল",
      "start_month": 10,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "Rabi: April – May; Kharif-1: June – July",
      "months_bn": "রবি: এপ্রিল – মে; খরিফ-১: জুন – জুলাই",
      "start_month": 4,
      "end_month": 7
    },
    "duration_days": {
      "min": 120,
      "max": 150
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 350,
      "max": 500
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 12,
      "optimal_min": 22,
      "optimal_max": 30,
      "critical_min": 12,
      "critical_max": 35,
      "notes_bn": "পেগিং ও পড ফিলিংয়ে ২০-২৮°C প্রয়োজন",
      "notes_en": "Pegging and pod filling require 20-28°C"
    },
    "humidity": {
      "optimal_min": 55,
      "optimal_max": 70,
      "risk_above": 85,
      "notes_bn": "উচ্চ আর্দ্রতায় টিক্কা রোগ বাড়ে",
      "notes_en": "Tikka leaf spot aggravated by humidity"
    },
    "smap_optimal": {
      "min": 0.18,
      "max": 0.25
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "পেগিং পর্যায়ে মাটির আর্দ্রতাহীনতা ও শক্ত মাটি (ফল ঢুকতে পারে না)",
      "Flash flood risk",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "পেগিং পর্যায়ে মাটির আর্দ্রতাহীনতা ও শক্ত মাটি (ফল ঢুকতে পারে না)",
      "কাটার সময় আগাম বর্ষা/বন্যা (হাওর/চরে পচে যাওয়া)",
      "টিক্কা পাতা পোড়া রোগ"
    ],
    "decision_rules_en": [
      "চরে বেলে-দোআঁশ মাটিতে বোরো ধানের মতো অতিরিক্ত পানির ফসল বাদ দিয়ে অ্যালগরিদম বাণিজ্যিকভাবে লাভজনক চীনাবাদাম চাষের লজিক প্রদর্শন করবে।"
    ],
    "decision_rules_bn": [
      "চরে বেলে-দোআঁশ মাটিতে বোরো ধানের মতো অতিরিক্ত পানির ফসল বাদ দিয়ে অ্যালগরিদম বাণিজ্যিকভাবে লাভজনক চীনাবাদাম চাষের লজিক প্রদর্শন করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **চীনাবাদাম (Groundnut) — রবি (শীতকালীন) ও খরিফ (গ্রীষ্মকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৩. চীনাবাদাম",
        "confidence": "research"
      }
    ],
    "nameEn": "Groundnut",
    "nameBn": "চীনাবাদাম",
    "family": "legume",
    "tempMin": 22,
    "tempMax": 30,
    "water": "medium",
    "soilMin": 0.18,
    "soilMax": 0.25,
    "nutrient": 2,
    "days": 150,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "sesame",
    "category_id": "oilseeds",
    "parent_group": null,
    "name_en": "Sesame",
    "name_bn": "তিল",
    "scientific_name": "Sesamum indicum",
    "plant_family": "pedaliaceae",
    "is_legume": false,
    "seasons": [
      "kharif1",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "mid-February – April",
      "months_bn": "ফাল্গুন – চৈত্র (মধ্য-ফেব্রুয়ারি – এপ্রিল)",
      "start_month": 2,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "May – June",
      "months_bn": "জ্যৈষ্ঠ – আষাঢ় (মে – জুন)",
      "start_month": 5,
      "end_month": 6
    },
    "duration_days": {
      "min": 85,
      "max": 100
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 5,
        "weeks_max": 7
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 3,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 200,
      "max": 300
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 15,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 40,
      "notes_bn": "উষ্ণ ও রৌদ্রোজ্জ্বল আবহাওয়া অনুকূল",
      "notes_en": "Warm sunny weather optimal"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 65,
      "risk_above": 80,
      "notes_bn": "কম আর্দ্রতা ও রৌদ্রোজ্জ্বল পরিবেশ পছন্দ করে",
      "notes_en": "Prefers lower humidity and direct sunlight"
    },
    "smap_optimal": {
      "min": 0.15,
      "max": 0.23
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "কাটার সময় কালবৈশাখী ঝড় ও ভারী বৃষ্টি (ফল ফেটে বীজ ঝরে যাওয়া)"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতা (চারা অবস্থায় ১২ ঘণ্টা পানি জমলে সম্পূর্ণ ক্ষেত নষ্ট)",
      "কাটার সময় কালবৈশাখী ঝড় ও ভারী বৃষ্টি (ফল ফেটে বীজ ঝরে যাওয়া)"
    ],
    "decision_rules_en": [
      "বসন্ত ও গ্রীষ্মের শুরুতে বৃষ্টিপাত কম থাকলে এবং জমিতে সেচের ঘাটতি থাকলে কম খরচের তেলবীজ হিসেবে অ্যালগরিদম তিল চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "বসন্ত ও গ্রীষ্মের শুরুতে বৃষ্টিপাত কম থাকলে এবং জমিতে সেচের ঘাটতি থাকলে কম খরচের তেলবীজ হিসেবে অ্যালগরিদম তিল চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **তিল (Sesame) — খরিফ-১ মৌসুম (গ্রীষ্ম/প্রাক-বর্ষা)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১২. তিল",
        "confidence": "research"
      }
    ],
    "nameEn": "Sesame",
    "nameBn": "তিল",
    "family": "pedaliaceae",
    "tempMin": 25,
    "tempMax": 35,
    "water": "low",
    "soilMin": 0.15,
    "soilMax": 0.23,
    "nutrient": -1,
    "days": 100,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "sunflower",
    "category_id": "oilseeds",
    "parent_group": null,
    "name_en": "Sunflower",
    "name_bn": "সূর্যমুখী",
    "scientific_name": "Helianthus annuus",
    "plant_family": "asteraceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "mid-November – late-December",
      "months_bn": "অগ্রহায়ণ – পৌষ (নভেম্বর মধ্য – ডিসেম্বর শেষ)",
      "start_month": 11,
      "end_month": 12
    },
    "harvest_window": {
      "months_en": "April – May",
      "months_bn": "চৈত্র – বৈশাখ (এপ্রিল – মে)",
      "start_month": 4,
      "end_month": 5
    },
    "duration_days": {
      "min": 90,
      "max": 110
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 350,
      "max": 500
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 8,
      "optimal_min": 20,
      "optimal_max": 28,
      "critical_min": 8,
      "critical_max": 34,
      "notes_bn": "পরাগায়নে ২৫-২৮°C আদর্শ",
      "notes_en": "Pollination optimal at 25-28°C"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 65,
      "risk_above": 80,
      "notes_bn": "মাথায় পানি জমলে স্ক্লেরোটিনিয়া পচন রোগ",
      "notes_en": "Head rot (Sclerotinia) under wet humidity"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "কাটার সময় (এপ্রিল-মে) কালবৈশাখী ঝড় ও শিলাবৃষ্টি (গাছ ভেঙে মাথায় পানি জমে পচন)",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "কাটার সময় (এপ্রিল-মে) কালবৈশাখী ঝড় ও শিলাবৃষ্টি (গাছ ভেঙে মাথায় পানি জমে পচন)",
      "স্ক্লেরোটিনিয়া হেড রট রোগ"
    ],
    "decision_rules_en": [
      "উপকূলীয় অঞ্চলে মধ্যম মাত্রার লবণাক্ততা এবং মিঠা পানির সেচের অভাব থাকলে অ্যালগরিদম রবি মৌসুমে সূর্যমুখী চাষের সুপারিশ করবে।"
    ],
    "decision_rules_bn": [
      "উপকূলীয় অঞ্চলে মধ্যম মাত্রার লবণাক্ততা এবং মিঠা পানির সেচের অভাব থাকলে অ্যালগরিদম রবি মৌসুমে সূর্যমুখী চাষের সুপারিশ করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **সূর্যমুখী (Sunflower) — প্রধানত রবি মৌসুম (শীতকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৪. সূর্যমুখী",
        "confidence": "research"
      }
    ],
    "nameEn": "Sunflower",
    "nameBn": "সূর্যমুখী",
    "family": "asteraceae",
    "tempMin": 20,
    "tempMax": 28,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": -1,
    "days": 110,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "soybean",
    "category_id": "oilseeds",
    "parent_group": null,
    "name_en": "Soybean",
    "name_bn": "সয়াবিন",
    "scientific_name": "Glycine max",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "Rabi: mid-Dec – mid-Jan; Kharif-2: July – August",
      "months_bn": "রবি: মধ্য-ডিসেম্বর – মধ্য-জানুয়ারি; খরিফ-২: জুলাই – আগস্ট",
      "start_month": 12,
      "end_month": 8
    },
    "harvest_window": {
      "months_en": "Rabi: March – May; Kharif-2: Oct – Dec",
      "months_bn": "রবি: মার্চ – মে; খরিফ-২: অক্টোবর – ডিসেম্বর",
      "start_month": 3,
      "end_month": 12
    },
    "duration_days": {
      "min": 90,
      "max": 120
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 300,
      "max": 500
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 10,
      "optimal_min": 25,
      "optimal_max": 30,
      "critical_min": 10,
      "critical_max": 40,
      "notes_bn": "শুঁটি গঠনকালে ৩৫-৪০°C তাপমাত্রা সংকটপূর্ণ",
      "notes_en": "Critical above 35-40°C during pod formation"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 70,
      "risk_above": 85,
      "notes_bn": "৫০-৭০% অনুকূল আর্দ্রতা",
      "notes_en": "50-70% optimal relative humidity"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [
      {
        "condition": "waterlogging",
        "threshold": 50,
        "window_days": 1,
        "alert_en": "Waterlogging risk: ensure adequate drainage",
        "alert_bn": "জলাবদ্ধতার ঝুঁকি: দ্রুত পানি নিষ্কাশন নিশ্চিত করুন"
      }
    ],
    "key_risks_en": [],
    "key_risks_bn": [],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "estimated",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "all",
        "file": "missing-values.json",
        "section": "Soybean",
        "confidence": "estimated"
      }
    ],
    "nameEn": "Soybean",
    "nameBn": "সয়াবিন",
    "family": "legume",
    "tempMin": 25,
    "tempMax": 30,
    "water": "low",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": 2,
    "days": 120,
    "cost": "low",
    "source": "Estimated"
  },
  {
    "id": "potato",
    "category_id": "tubers",
    "parent_group": null,
    "name_en": "Potato",
    "name_bn": "আলু",
    "scientific_name": "Solanum tuberosum",
    "plant_family": "solanaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "1 November – 30 November",
      "months_bn": "কার্তিক – অগ্রহায়ণ (১ নভেম্বর – ৩০ নভেম্বর)",
      "start_month": 11,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "late-January – February",
      "months_bn": "মাঘ – ফাল্গুন (জানুয়ারি শেষ – ফেব্রুয়ারি)",
      "start_month": 1,
      "end_month": 2
    },
    "duration_days": {
      "min": 80,
      "max": 100
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 5,
        "weeks_max": 7
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 3,
        "weeks_max": 5
      }
    ],
    "water_need_mm": {
      "min": 300,
      "max": 500
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 7,
      "optimal_min": 15,
      "optimal_max": 20,
      "critical_min": 7,
      "critical_max": 25,
      "notes_bn": "রাতের তাপমাত্রা >২০-২২°C হলে কন্দ গঠন বন্ধ হয়",
      "notes_en": "Tuber bulking halts if night temp >20-22°C"
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 80,
      "risk_above": 85,
      "notes_bn": "আর্দ্রতা >৮৫% ও কুয়াশায় লেট ব্লাইটের তীব্র আক্রমণ",
      "notes_en": "Late blight epidemics if humidity >85%"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Fungal/bacterial disease pressure",
      "আর্দ্রতা >৮৫%",
      "Heat stress during reproductive stage",
      "অসময়ে বৃষ্টিতে কন্দ পচা"
    ],
    "key_risks_bn": [
      "লেট ব্লাইট / নাবি ধসা রোগ (টানা মেঘলা ও কুয়াশাচ্ছন্ন আবহাওয়া",
      "আর্দ্রতা >৮৫%",
      "তাপমাত্রা ১২-২২°C)",
      "অসময়ে বৃষ্টিতে কন্দ পচা"
    ],
    "decision_rules_en": [
      "সেচ সুবিধা ও শীতল আবহাওয়ায় উচ্চ লাভজনক বাণিজ্যিক রোটেশন হিসেবে অ্যালগরিদম সরিষার পাশাপাশি আলু চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "সেচ সুবিধা ও শীতল আবহাওয়ায় উচ্চ লাভজনক বাণিজ্যিক রোটেশন হিসেবে অ্যালগরিদম সরিষার পাশাপাশি আলু চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **১. আলু (Potato — *Solanum tuberosum*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২০. আলু",
        "confidence": "research"
      }
    ],
    "nameEn": "Potato",
    "nameBn": "আলু",
    "family": "nightshade",
    "tempMin": 15,
    "tempMax": 20,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -2,
    "days": 100,
    "cost": "high",
    "source": "BARI"
  },
  {
    "id": "sweet_potato",
    "category_id": "tubers",
    "parent_group": null,
    "name_en": "Sweet Potato",
    "name_bn": "মিষ্টি আলু",
    "scientific_name": "Ipomoea batatas",
    "plant_family": "convolvulaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "late-October – November",
      "months_bn": "কার্তিক – অগ্রহায়ণ (অক্টোবর শেষ – নভেম্বর)",
      "start_month": 10,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "late-February – March",
      "months_bn": "ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – মার্চ)",
      "start_month": 2,
      "end_month": 3
    },
    "duration_days": {
      "min": 110,
      "max": 130
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 350,
      "max": 500
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 10,
      "optimal_min": 22,
      "optimal_max": 30,
      "critical_min": 10,
      "critical_max": 35,
      "notes_bn": "কন্দ গঠনে রাতের তাপমাত্রা ১৫-২০°C আদর্শ",
      "notes_en": "Night temp 15-20°C ideal for tuber formation"
    },
    "humidity": {
      "optimal_min": 55,
      "optimal_max": 70,
      "risk_above": 80,
      "notes_bn": "পরিপক্কতায় মাঝারি আর্দ্রতা উত্তম",
      "notes_en": "Moderate humidity optimal at bulking"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.28
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Pest attacks",
      "অতি শুষ্ক মাটিতে কন্দ ফেটে যাওয়া"
    ],
    "key_risks_bn": [
      "কন্দ পাকার সময় জলাবদ্ধতা (চব্বিশ ঘণ্টায় পচে যায়)",
      "সুইপোকা ও উইভিল পোকা",
      "অতি শুষ্ক মাটিতে কন্দ ফেটে যাওয়া"
    ],
    "decision_rules_en": [
      "নদীর উপকূল ও চরাঞ্চলে আমন ধান কাটার পর সেচ পানির সংকট ও হালকা লবণাক্ততার ঝুঁকি থাকলে অ্যালগরিদম কম খরচে মিষ্টিআলু চাষের পরামর্শ দেবে।"
    ],
    "decision_rules_bn": [
      "নদীর উপকূল ও চরাঞ্চলে আমন ধান কাটার পর সেচ পানির সংকট ও হালকা লবণাক্ততার ঝুঁকি থাকলে অ্যালগরিদম কম খরচে মিষ্টিআলু চাষের পরামর্শ দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "low",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **২. মিষ্টিআলু (Sweet Potato — *Ipomoea batatas*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২১. মিষ্টি আলু",
        "confidence": "research"
      }
    ],
    "nameEn": "Sweet Potato",
    "nameBn": "মিষ্টি আলু",
    "family": "convolvulaceae",
    "tempMin": 22,
    "tempMax": 30,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.28,
    "nutrient": -1,
    "days": 130,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "greater_yam",
    "category_id": "tubers",
    "parent_group": "yam",
    "name_en": "Greater Yam",
    "name_bn": "মেটেআলু / গাছআলু",
    "scientific_name": "Dioscorea alata",
    "plant_family": "dioscoreaceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "March – April",
      "months_bn": "ফাল্গুন – বৈশাখ (মার্চ – এপ্রিল)",
      "start_month": 3,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "December – January",
      "months_bn": "পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)",
      "start_month": 12,
      "end_month": 1
    },
    "duration_days": {
      "min": 240,
      "max": 270
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 17,
        "weeks_max": 19
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 9,
        "weeks_max": 11
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 10,
        "weeks_max": 12
      }
    ],
    "water_need_mm": {
      "min": 800,
      "max": 1200
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 40,
      "notes_bn": "উষ্ণ ও আর্দ্র আবহাওয়ায় ভালো বাড়ে",
      "notes_en": "Thrives in warm, humid weather"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "টানা বৃষ্টি ও উষ্ণ আর্দ্রতায় এনথ্রাকনোজ ব্লাইট",
      "notes_en": "Anthracnose blight in persistent wet weather"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "এনথ্রাকনোজ ব্লাইট (টানা বৃষ্টি ও উষ্ণ আর্দ্রতায় পাতা ঝলসানো)"
    ],
    "key_risks_bn": [
      "টানা জলাবদ্ধতায় কন্দ পচন",
      "এনথ্রাকনোজ ব্লাইট (টানা বৃষ্টি ও উষ্ণ আর্দ্রতায় পাতা ঝলসানো)"
    ],
    "decision_rules_en": [
      "বসতবাড়ির আশপাশে বা গভীর মাটির জমিতে মাচা তৈরির ব্যবস্থা থাকলে দীর্ঘমেয়াদী পারিবারিক খাদ্য ও পুষ্টি নিরাপত্তার জন্য অ্যালগরিদম মেটেআলু চাষের লজিক দেবে।"
    ],
    "decision_rules_bn": [
      "বসতবাড়ির আশপাশে বা গভীর মাটির জমিতে মাচা তৈরির ব্যবস্থা থাকলে দীর্ঘমেয়াদী পারিবারিক খাদ্য ও পুষ্টি নিরাপত্তার জন্য অ্যালগরিদম মেটেআলু চাষের লজিক দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৩. মেটেআলু / গাছআলু / মাছআলু (Greater Yam — *Dioscorea alata*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২২. মেটেআলু / গাছআলু",
        "confidence": "research"
      }
    ],
    "nameEn": "Greater Yam",
    "nameBn": "মেটেআলু / গাছআলু",
    "family": "dioscoreaceae",
    "tempMin": 25,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 270,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "giant_taro",
    "category_id": "tubers",
    "parent_group": "taro",
    "name_en": "Giant Taro",
    "name_bn": "কচু / মানকচু",
    "scientific_name": "Alocasia macrorrhizos",
    "plant_family": "araceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "February – April",
      "months_bn": "মাঘ – চৈত্র (ফেব্রুয়ারি – এপ্রিল)",
      "start_month": 2,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "December – January",
      "months_bn": "পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)",
      "start_month": 12,
      "end_month": 1
    },
    "duration_days": {
      "min": 280,
      "max": 330
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 20,
        "weeks_max": 22
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 13,
        "weeks_max": 15
      }
    ],
    "water_need_mm": {
      "min": 1000,
      "max": 1500
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 23,
      "optimal_max": 33,
      "critical_min": 15,
      "critical_max": 38,
      "notes_bn": "ছায়াযুক্ত স্যাঁতসেঁতে পরিবেশ সহনশীল",
      "notes_en": "Tolerant to shade and dampness"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 95,
      "notes_bn": "উচ্চ আর্দ্রতায় চমৎকার বৃদ্ধি হয়",
      "notes_en": "Vigorous foliage growth in high humidity"
    },
    "smap_optimal": {
      "min": 0.3,
      "max": 0.45
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Drought stress during critical stages",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "চরম খরায় পাতার বিস্তার বন্ধ ও কন্দ শক্ত হয়ে যাওয়া",
      "কন্দ পচন রোগ (অতিরিক্ত জলাবদ্ধতা ও ড্রেনেজ না থাকা)"
    ],
    "decision_rules_en": [
      "বসতবাড়ির আঙিনায় বড় গাছের ছায়াযুক্ত স্যাঁতসেঁতে পতিত জমিতে যেখানে অন্য ফসল হয় না, সেখানে অ্যালগরিদম মানকচু চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "বসতবাড়ির আঙিনায় বড় গাছের ছায়াযুক্ত স্যাঁতসেঁতে পতিত জমিতে যেখানে অন্য ফসল হয় না, সেখানে অ্যালগরিদম মানকচু চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৪. কচু / মানকচু (Giant Taro — *Alocasia macrorrhizos*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৩. কচু / মানকচু",
        "confidence": "research"
      }
    ],
    "nameEn": "Giant Taro",
    "nameBn": "কচু / মানকচু",
    "family": "araceae",
    "tempMin": 23,
    "tempMax": 33,
    "water": "medium",
    "soilMin": 0.3,
    "soilMax": 0.45,
    "nutrient": -1,
    "days": 330,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "water_taro",
    "category_id": "tubers",
    "parent_group": "taro",
    "name_en": "Water Taro",
    "name_bn": "পানিকচু",
    "scientific_name": "Colocasia esculenta var. aquatilis",
    "plant_family": "araceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "mid-January – April",
      "months_bn": "মাঘ – চৈত্র (মধ্য-জানুয়ারি – এপ্রিল)",
      "start_month": 1,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "Stem: April – Oct; Corm: Oct – Dec",
      "months_bn": "লতি: এপ্রিল – অক্টোবর; কাণ্ড/কচু: অক্টোবর – ডিসেম্বর",
      "start_month": 4,
      "end_month": 12
    },
    "duration_days": {
      "min": 180,
      "max": 240
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 14,
        "weeks_max": 16
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 9,
        "weeks_max": 11
      }
    ],
    "water_need_mm": {
      "min": 1200,
      "max": 1800
    },
    "irrigation_notes_en": "High water requirement; regular irrigation or standing water needed",
    "irrigation_notes_bn": "উচ্চ সেচ নির্ভর; নিয়মিত সেচ বা স্থির পানি বজায় রাখা প্রয়োজন",
    "temperature_c": {
      "base": 16,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 16,
      "critical_max": 38,
      "notes_bn": "উষ্ণ আবহাওয়া ও দাঁড়িয়ে থাকা পানি সহায়ক",
      "notes_en": "Warm climate and standing water favorable"
    },
    "humidity": {
      "optimal_min": 75,
      "optimal_max": 90,
      "risk_above": 95,
      "notes_bn": "জলাবদ্ধ ও চরম আর্দ্র পরিবেশ সহনশীল",
      "notes_en": "Thrives in saturated damp conditions"
    },
    "smap_optimal": {
      "min": 0.35,
      "max": 0.55
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Drought stress during critical stages",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "শুকনো খরা বা পানির স্তর শুকিয়ে যাওয়া",
      "ব্লাইট বা পাতা ঝলসানো রোগ"
    ],
    "decision_rules_en": [
      "নিচু ও জলাবদ্ধ জমি যেখানে বর্ষাকালে পানি জমে থাকে এবং অন্য কোনো শাকসবজি চাষ করা যায় না, সেখানে অ্যালগরিদম পানিকচু চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "নিচু ও জলাবদ্ধ জমি যেখানে বর্ষাকালে পানি জমে থাকে এবং অন্য কোনো শাকসবজি চাষ করা যায় না, সেখানে অ্যালগরিদম পানিকচু চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "floodTolerant": true,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৫. পানিকচু (Water Taro — *Colocasia esculenta var. aquatilis*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৪. পানিকচু",
        "confidence": "research"
      }
    ],
    "nameEn": "Water Taro",
    "nameBn": "পানিকচু",
    "family": "araceae",
    "tempMin": 25,
    "tempMax": 35,
    "water": "high",
    "soilMin": 0.35,
    "soilMax": 0.55,
    "nutrient": -1,
    "days": 240,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "eddoe_taro",
    "category_id": "tubers",
    "parent_group": "taro",
    "name_en": "Taro / Eddoe",
    "name_bn": "মুখীকচু",
    "scientific_name": "Colocasia esculenta var. antiquorum",
    "plant_family": "araceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "mid-January – April",
      "months_bn": "মাঘ – বৈশাখ (মধ্য-জানুয়ারি – এপ্রিল)",
      "start_month": 1,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "August – October",
      "months_bn": "ভাদ্র – কার্তিক (আগস্ট – অক্টোবর)",
      "start_month": 8,
      "end_month": 10
    },
    "duration_days": {
      "min": 150,
      "max": 180
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 700,
      "max": 1000
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 14,
      "optimal_min": 24,
      "optimal_max": 32,
      "critical_min": 14,
      "critical_max": 37,
      "notes_bn": "মাঝারি উষ্ণ তাপমাত্রা অনুকূল",
      "notes_en": "Moderately warm climate optimal"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "উচ্চ আর্দ্রতায় পাতা ঝলসানো রোগঝুঁকি",
      "notes_en": "Leaf blight risk under damp conditions"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতা (স্থায়ী পানি জমলে মুখী পচে নষ্ট হয়ে যায়)",
      "পাতা ঝলসানো রোগ (Phytophthora colocasiae)"
    ],
    "decision_rules_en": [
      "উঁচু ও মাঝারি উঁচু দোআঁশ জমিতে বর্ষা মৌসুমে পানি নিষ্কাশনের সুব্যবস্থা থাকলে লাভজনক সবজি হিসেবে মুখীকচু চাষের নির্দেশ দেবে।"
    ],
    "decision_rules_bn": [
      "উঁচু ও মাঝারি উঁচু দোআঁশ জমিতে বর্ষা মৌসুমে পানি নিষ্কাশনের সুব্যবস্থা থাকলে লাভজনক সবজি হিসেবে মুখীকচু চাষের নির্দেশ দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৬. মুখীকচু (Taro / Eddoe — *Colocasia esculenta var. antiquorum*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৫. মুখীকচু",
        "confidence": "research"
      }
    ],
    "nameEn": "Taro / Eddoe",
    "nameBn": "মুখীকচু",
    "family": "araceae",
    "tempMin": 24,
    "tempMax": 32,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 180,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "tannia",
    "category_id": "tubers",
    "parent_group": "taro",
    "name_en": "Tannia / Cocoyam",
    "name_bn": "সাহেবী কচু / মৌলভী কচু",
    "scientific_name": "Xanthosoma sagittifolium",
    "plant_family": "araceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "March – May",
      "months_bn": "ফাল্গুন – বৈশাখ (মার্চ – মে)",
      "start_month": 3,
      "end_month": 5
    },
    "harvest_window": {
      "months_en": "December – February",
      "months_bn": "পৌষ – মাঘ (ডিসেম্বর – ফেব্রুয়ারি)",
      "start_month": 12,
      "end_month": 2
    },
    "duration_days": {
      "min": 240,
      "max": 300
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 18,
        "weeks_max": 20
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 10,
        "weeks_max": 12
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 12,
        "weeks_max": 14
      }
    ],
    "water_need_mm": {
      "min": 800,
      "max": 1200
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 38,
      "notes_bn": "আংশিক ছায়া ও উষ্ণ আবহাওয়া পছন্দ করে",
      "notes_en": "Prefers partial shade and warmth"
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 80,
      "risk_above": 90,
      "notes_bn": "উষ্ণ আর্দ্র পরিবেশে রাইজোম দ্রুত বাড়ে",
      "notes_en": "Rhizomes expand in warm humid conditions"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Drought stress during critical stages",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "দীর্ঘমেয়াদী খরায় রাইজোম ছোট হয়ে যাওয়া",
      "জলাবদ্ধতায় রাইজোম পচন"
    ],
    "decision_rules_en": [
      "উঁচু ও মাঝারি উঁচু জমিতে খরা ও আংশিক ছায়াযুক্ত পরিবেশে দীর্ঘমেয়াদী কন্দাল ফসল হিসেবে সাহেবী কচু চাষের সিদ্ধান্ত কার্যকর হবে।"
    ],
    "decision_rules_bn": [
      "উঁচু ও মাঝারি উঁচু জমিতে খরা ও আংশিক ছায়াযুক্ত পরিবেশে দীর্ঘমেয়াদী কন্দাল ফসল হিসেবে সাহেবী কচু চাষের সিদ্ধান্ত কার্যকর হবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৭. সাহেবী কচু / মৌলভী কচু / বিলাতী কচু (Tannia / Cocoyam — *Xanthosoma sagittifolium*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৬. সাহেবী কচু / মৌলভী কচু",
        "confidence": "research"
      }
    ],
    "nameEn": "Tannia / Cocoyam",
    "nameBn": "সাহেবী কচু / মৌলভী কচু",
    "family": "araceae",
    "tempMin": 25,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 300,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "elephant_foot_yam",
    "category_id": "tubers",
    "parent_group": "taro",
    "name_en": "Elephant Foot Yam",
    "name_bn": "ওলকচু",
    "scientific_name": "Amorphophallus paeoniifolius",
    "plant_family": "araceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "late-February – April",
      "months_bn": "ফাল্গুন – চৈত্র (ফেব্রুয়ারি শেষ – এপ্রিল)",
      "start_month": 2,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "November – January",
      "months_bn": "কার্তিক – পৌষ (নভেম্বর – জানুয়ারি)",
      "start_month": 11,
      "end_month": 1
    },
    "duration_days": {
      "min": 210,
      "max": 250
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 15,
        "weeks_max": 17
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 10,
        "weeks_max": 12
      }
    ],
    "water_need_mm": {
      "min": 800,
      "max": 1100
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 38,
      "notes_bn": "উষ্ণ বর্ষাকালীন বৃদ্ধি ও শুষ্ক শীতকালীন পরিপক্কতা",
      "notes_en": "Warm monsoon growth with dry winter harvest"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 80,
      "risk_above": 85,
      "notes_bn": "টানা জলাবদ্ধতায় কন্দ পচন রোগ বাড়ে",
      "notes_en": "Corm collar rot in waterlogged conditions"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "আর্লি স্প্রাউটিংয়ে শুকিয়ে যাওয়া"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতায় ওলের কন্দ পচন (কলা রট / কন্দ পচা)",
      "আর্লি স্প্রাউটিংয়ে শুকিয়ে যাওয়া"
    ],
    "decision_rules_en": [
      "গভীর ঝুরঝুরে পলি-দোআঁশ মাটিতে একক মৌসুমে উচ্চ ওজনের কন্দাল ফসল উৎপাদনের জন্য অ্যালগরিদম ওলকচু চাষের সুপারিশ করবে।"
    ],
    "decision_rules_bn": [
      "গভীর ঝুরঝুরে পলি-দোআঁশ মাটিতে একক মৌসুমে উচ্চ ওজনের কন্দাল ফসল উৎপাদনের জন্য অ্যালগরিদম ওলকচু চাষের সুপারিশ করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৮. ওলকচু (Elephant Foot Yam — *Amorphophallus paeoniifolius*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৭. ওলকচু",
        "confidence": "research"
      }
    ],
    "nameEn": "Elephant Foot Yam",
    "nameBn": "ওলকচু",
    "family": "araceae",
    "tempMin": 25,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 250,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "cassava",
    "category_id": "tubers",
    "parent_group": null,
    "name_en": "Cassava",
    "name_bn": "কাসাভা / শিমুল আলু",
    "scientific_name": "Manihot esculenta",
    "plant_family": "euphorbiaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "April – May or October – November",
      "months_bn": "চৈত্র – বৈশাখ (এপ্রিল – মে) বা আশ্বিন – কার্তিক (অক্টোবর – নভেম্বর)",
      "start_month": 4,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "10–12 months after planting",
      "months_bn": "বপনের ১০-১২ মাস পর",
      "start_month": 2,
      "end_month": 11
    },
    "duration_days": {
      "min": 280,
      "max": 320
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 20,
        "weeks_max": 22
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 12,
        "weeks_max": 14
      }
    ],
    "water_need_mm": {
      "min": 600,
      "max": 900
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 13,
      "optimal_min": 25,
      "optimal_max": 32,
      "critical_min": 12,
      "critical_max": 38,
      "notes_bn": "তাপমাত্রা <১৫°C হলে বৃদ্ধি স্তব্ধ হয়",
      "notes_en": "Growth halts below 15°C"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "মাঝারি আর্দ্রতায় শিকড় ভালো বাড়ে",
      "notes_en": "Roots develop well under moderate humidity"
    },
    "smap_optimal": {
      "min": 0.15,
      "max": 0.25
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Cold stress and frost injury"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতা (চব্বিশ থেকে আটচল্লিশ ঘণ্টা পানি জমলে শিকড় সম্পূর্ণ পচে যায়)",
      "তীব্র শীত (<১২°C পাতা ঝরে যায়)"
    ],
    "decision_rules_en": [
      "অনুর্বর লাল মাটি, পাহাড়ি ঢাল বা খরাপ্রবণ পতিত জমিতে যেখানে অন্য কোনো ফসল বাঁচে না, সেখানে অ্যালগরিদম বিকল্প খাদ্য ও স্টার্চ উৎপাদনের জন্য কাসাভা চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "অনুর্বর লাল মাটি, পাহাড়ি ঢাল বা খরাপ্রবণ পতিত জমিতে যেখানে অন্য কোনো ফসল বাঁচে না, সেখানে অ্যালগরিদম বিকল্প খাদ্য ও স্টার্চ উৎপাদনের জন্য কাসাভা চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "low",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **৯. কাসাভা / শিমুল আলু (Cassava / Tapioca — *Manihot esculenta*)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৮. কাসাভা / শিমুল আলু",
        "confidence": "research"
      }
    ],
    "nameEn": "Cassava",
    "nameBn": "কাসাভা / শিমুল আলু",
    "family": "euphorbiaceae",
    "tempMin": 25,
    "tempMax": 32,
    "water": "medium",
    "soilMin": 0.15,
    "soilMax": 0.25,
    "nutrient": -2,
    "days": 320,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "jute",
    "category_id": "cash_fiber",
    "parent_group": null,
    "name_en": "Jute",
    "name_bn": "পাট",
    "scientific_name": "Corchorus olitorius",
    "plant_family": "malvaceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "March – April",
      "months_bn": "চৈত্র – বৈশাখ (মার্চ – এপ্রিল)",
      "start_month": 3,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "July – August",
      "months_bn": "শ্রাবণ – ভাদ্র (জুলাই – আগস্ট)",
      "start_month": 7,
      "end_month": 8
    },
    "duration_days": {
      "min": 100,
      "max": 120
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 500,
      "max": 700
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 18,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 43,
      "notes_bn": "উষ্ণ ও আর্দ্র আবহাওয়ায় দ্রুত বাড়ে",
      "notes_en": "Rapid growth in warm and humid conditions"
    },
    "humidity": {
      "optimal_min": 80,
      "optimal_max": 90,
      "risk_above": 95,
      "notes_bn": "আঁশের বৃদ্ধির জন্য উচ্চ আর্দ্রতা অনুকূল",
      "notes_en": "High humidity accelerates fiber elongation"
    },
    "smap_optimal": {
      "min": 0.3,
      "max": 0.45
    },
    "rainfall_alerts": [
      {
        "condition": "early_waterlogging",
        "threshold": 50,
        "window_days": 1,
        "alert_en": "Waterlogging at seedling stage halts plant growth",
        "alert_bn": "চারা অবস্থায় জলাবদ্ধতা বৃদ্ধি স্তব্ধ করে দেয়"
      }
    ],
    "key_risks_en": [],
    "key_risks_bn": [],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "estimated",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "all",
        "file": "missing-values.json",
        "section": "Jute",
        "confidence": "estimated"
      }
    ],
    "nameEn": "Jute",
    "nameBn": "পাট",
    "family": "mallow",
    "tempMin": 18,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.3,
    "soilMax": 0.45,
    "nutrient": 0,
    "days": 120,
    "cost": "low",
    "source": "Estimated"
  },
  {
    "id": "sugarcane",
    "category_id": "cash_fiber",
    "parent_group": null,
    "name_en": "Sugarcane",
    "name_bn": "আখ",
    "scientific_name": "Saccharum officinarum",
    "plant_family": "poaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1",
      "kharif2"
    ],
    "occupies_seasons": [
      "rabi",
      "kharif1",
      "kharif2"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "October – January",
      "months_bn": "কার্তিক – পৌষ (অক্টোবর – জানুয়ারি)",
      "start_month": 10,
      "end_month": 1
    },
    "harvest_window": {
      "months_en": "October – March (10-14 months after planting)",
      "months_bn": "রোপণের ১০-১৪ মাস পর (কার্তিক – চৈত্র)",
      "start_month": 10,
      "end_month": 3
    },
    "duration_days": {
      "min": 310,
      "max": 400
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 25,
        "weeks_max": 27
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 13,
        "weeks_max": 15
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 16,
        "weeks_max": 18
      }
    ],
    "water_need_mm": {
      "min": 1200,
      "max": 1650
    },
    "irrigation_notes_en": "High water requirement; regular irrigation or standing water needed",
    "irrigation_notes_bn": "উচ্চ সেচ নির্ভর; নিয়মিত সেচ বা স্থির পানি বজায় রাখা প্রয়োজন",
    "temperature_c": {
      "base": 12,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 12,
      "critical_max": 37,
      "notes_bn": "বৃদ্ধি পর্যায়ে ২৭-৩৫°C ও পরিপক্কতায় শীতল রৌদ্রোজ্জ্বল আবহাওয়া",
      "notes_en": "27-35°C during growth, cool sunny during ripening"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "বৃদ্ধি পর্যায়ে উচ্চ আর্দ্রতা রস বাড়ায়",
      "notes_en": "High humidity aids cane juice accumulation"
    },
    "smap_optimal": {
      "min": 0.35,
      "max": 0.5
    },
    "rainfall_alerts": [],
    "key_risks_en": [],
    "key_risks_bn": [],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "estimated",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "all",
        "file": "missing-values.json",
        "section": "Sugarcane",
        "confidence": "estimated"
      }
    ],
    "nameEn": "Sugarcane",
    "nameBn": "আখ",
    "family": "grass",
    "tempMin": 25,
    "tempMax": 35,
    "water": "high",
    "soilMin": 0.35,
    "soilMax": 0.5,
    "nutrient": -3,
    "days": 400,
    "cost": "high",
    "source": "Estimated"
  },
  {
    "id": "cotton",
    "category_id": "cash_fiber",
    "parent_group": null,
    "name_en": "Cotton",
    "name_bn": "তুলা",
    "scientific_name": "Gossypium hirsutum",
    "plant_family": "malvaceae",
    "is_legume": false,
    "seasons": [
      "kharif2"
    ],
    "occupies_seasons": [
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "June – August",
      "months_bn": "আষাঢ় – শ্রাবণ (জুন – আগস্ট)",
      "start_month": 6,
      "end_month": 8
    },
    "harvest_window": {
      "months_en": "January – February",
      "months_bn": "পৌষ – মাঘ (জানুয়ারি – ফেব্রুয়ারি)",
      "start_month": 1,
      "end_month": 2
    },
    "duration_days": {
      "min": 150,
      "max": 180
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 600,
      "max": 900
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 15,
      "optimal_min": 25,
      "optimal_max": 35,
      "critical_min": 15,
      "critical_max": 38,
      "notes_bn": "গুটি গঠনকালে ৩৮°C-এর বেশি সংকটপূর্ণ",
      "notes_en": "Critical >38°C during boll development"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 70,
      "risk_above": 80,
      "notes_bn": "গুটি ফোটার সময় কম আর্দ্রতা ও সূর্যালোক আবশ্যক",
      "notes_en": "Dry sunny weather needed for boll opening"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [
      {
        "condition": "boll_rot",
        "threshold": 50,
        "window_days": 3,
        "alert_en": "Heavy rain during boll opening causes boll rot and fiber damage",
        "alert_bn": "গুটি ফোটার সময় অতিবৃষ্টিতে গুটি পচন ও আঁশের ক্ষতি"
      }
    ],
    "key_risks_en": [],
    "key_risks_bn": [],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "estimated",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "all",
        "file": "missing-values.json",
        "section": "Cotton",
        "confidence": "estimated"
      }
    ],
    "nameEn": "Cotton",
    "nameBn": "তুলা",
    "family": "mallow",
    "tempMin": 25,
    "tempMax": 35,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": 0,
    "days": 180,
    "cost": "medium",
    "source": "Estimated"
  },
  {
    "id": "tobacco",
    "category_id": "cash_fiber",
    "parent_group": null,
    "name_en": "Tobacco",
    "name_bn": "তামাক",
    "scientific_name": "Nicotiana tabacum",
    "plant_family": "solanaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "October – December (local guide)",
      "months_bn": "কার্তিক – পৌষ (স্থানীয় নির্দেশিকা)",
      "start_month": 10,
      "end_month": 12
    },
    "harvest_window": {
      "months_en": "February – April (local guide)",
      "months_bn": "ফাল্গুন – চৈত্র (স্থানীয় নির্দেশিকা)",
      "start_month": 2,
      "end_month": 4
    },
    "duration_days": null,
    "growth_stages": [],
    "water_need_mm": null,
    "irrigation_notes_en": null,
    "irrigation_notes_bn": null,
    "temperature_c": {
      "base": null,
      "optimal_min": null,
      "optimal_max": null,
      "critical_min": null,
      "critical_max": null,
      "notes_en": null,
      "notes_bn": null
    },
    "humidity": {
      "optimal_min": null,
      "optimal_max": null,
      "risk_above": null,
      "notes_en": null,
      "notes_bn": null
    },
    "smap_optimal": {
      "min": null,
      "max": null
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Drought stress during critical stages",
      "অতিবৃষ্টি",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "খরা",
      "অতিবৃষ্টি",
      "জলাবদ্ধতা ও রোগবালাই"
    ],
    "nasa_data_link_en": null,
    "nasa_data_link_bn": null,
    "value_category": null,
    "is_staple": false,
    "data_confidence": "estimated",
    "data_complete": false,
    "recommendable": false,
    "sources": [
      {
        "field": "all",
        "file": "missing-values.json",
        "section": "Tobacco",
        "confidence": "estimated"
      }
    ],
    "nameEn": "Tobacco",
    "nameBn": "তামাক",
    "family": "nightshade",
    "tempMin": 15,
    "tempMax": 30,
    "water": "medium",
    "soilMin": 0.2,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 100,
    "cost": "medium",
    "source": "Estimated"
  },
  {
    "id": "onion",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Onion",
    "name_bn": "পেঁয়াজ",
    "scientific_name": "Allium cepa",
    "plant_family": "amaryllidaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "Rabi: late-Oct – Nov; Kharif: March – April",
      "months_bn": "রবি: কার্তিক – অগ্রহায়ণ (অক্টোবর শেষ – নভেম্বর); খরিফ: ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)",
      "start_month": 10,
      "end_month": 4
    },
    "harvest_window": {
      "months_en": "Rabi: March – April; Kharif: July – August",
      "months_bn": "রবি: ফাল্গুন – চৈত্র (মার্চ – এপ্রিল); খরিফ: আষাঢ় – শ্রাবণ (জুলাই – আগস্ট)",
      "start_month": 3,
      "end_month": 8
    },
    "duration_days": {
      "min": 90,
      "max": 125
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 350,
      "max": 500
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 7,
      "optimal_min": 15,
      "optimal_max": 25,
      "critical_min": 7,
      "critical_max": 34,
      "notes_bn": "রাতের তাপমাত্রা <১২°C থাকলে বোল্টিং হয়",
      "notes_en": "Bolting occurs if night temp <12°C"
    },
    "humidity": {
      "optimal_min": 55,
      "optimal_max": 70,
      "risk_above": 80,
      "notes_bn": "উচ্চ আর্দ্রতায় পার্পল ব্লচ রোগের প্রাদুর্ভাব",
      "notes_en": "Purple blotch outbreaks in wet humidity"
    },
    "smap_optimal": {
      "min": 0.23,
      "max": 0.32
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Fungal/bacterial disease pressure",
      "আর্দ্রতার ওঠানামায় কন্দ ফেটে যাওয়া"
    ],
    "key_risks_bn": [
      "কাটার সময় বৃষ্টি ও জলাবদ্ধতা (কন্দ পচা)",
      "পার্পল ব্লচ রোগ (উচ্চ আর্দ্রতা ও উষ্ণতায়)",
      "আর্দ্রতার ওঠানামায় কন্দ ফেটে যাওয়া"
    ],
    "decision_rules_en": [
      "উঁচু বেলে-দোআঁশ জমিতে সেচ ও ড্রেনেজের সুব্যবস্থা থাকলে উচ্চমূল্যের মসলা হিসেবে অ্যালগরিদম পেঁয়াজ চাষের অগ্রাধিকার দেবে।"
    ],
    "decision_rules_bn": [
      "উঁচু বেলে-দোআঁশ জমিতে সেচ ও ড্রেনেজের সুব্যবস্থা থাকলে উচ্চমূল্যের মসলা হিসেবে অ্যালগরিদম পেঁয়াজ চাষের অগ্রাধিকার দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **পেঁয়াজ (Onion) — রবি (শীতকালীন) ও খরিফ (গ্রীষ্মকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৫. পেঁয়াজ",
        "confidence": "research"
      }
    ],
    "nameEn": "Onion",
    "nameBn": "পেঁয়াজ",
    "family": "amaryllidaceae",
    "tempMin": 15,
    "tempMax": 25,
    "water": "medium",
    "soilMin": 0.23,
    "soilMax": 0.32,
    "nutrient": -1,
    "days": 125,
    "cost": "high",
    "source": "BARI"
  },
  {
    "id": "garlic",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Garlic",
    "name_bn": "রসুন",
    "scientific_name": "Allium sativum",
    "plant_family": "amaryllidaceae",
    "is_legume": false,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "mid-October – November",
      "months_bn": "কার্তিক (মধ্য-অক্টোবর – নভেম্বর)",
      "start_month": 10,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "March – April",
      "months_bn": "ফাল্গুন – চৈত্র (মার্চ – এপ্রিল)",
      "start_month": 3,
      "end_month": 4
    },
    "duration_days": {
      "min": 110,
      "max": 125
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 300,
      "max": 400
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 6,
      "optimal_min": 12,
      "optimal_max": 22,
      "critical_min": 6,
      "critical_max": 30,
      "notes_bn": "কন্দ গঠনে ভার্নালাইজেশন প্রয়োজন",
      "notes_en": "Requires chilling vernalization for clove division"
    },
    "humidity": {
      "optimal_min": 50,
      "optimal_max": 65,
      "risk_above": 80,
      "notes_bn": "শুষ্ক ও নাতিশীতোষ্ণ শীতকালে ভালো হয়",
      "notes_en": "Best in dry, sunny, cool winter conditions"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.28
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Cold stress and frost injury",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "শীতের তীব্রতা ও দৈর্ঘ্যের অভাব (কোয়া বিভাজন না হওয়া)",
      "সেচ ও বৃষ্টির জলাবদ্ধতা (কন্দ পচন)"
    ],
    "decision_rules_en": [
      "বিল ও নিচু এলাকার কাদামাটিতে আমন ধান কাটার পর জিরো-টিলেজে খড় মালচিং দিয়ে বিনা চাষে রসুন আবাদের সিদ্ধান্ত সক্রিয় হবে।"
    ],
    "decision_rules_bn": [
      "বিল ও নিচু এলাকার কাদামাটিতে আমন ধান কাটার পর জিরো-টিলেজে খড় মালচিং দিয়ে বিনা চাষে রসুন আবাদের সিদ্ধান্ত সক্রিয় হবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **রসুন (Garlic) — সম্পূর্ণ রবি মৌসুম (শীতকালীন ফসল)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৭. রসুন",
        "confidence": "research"
      }
    ],
    "nameEn": "Garlic",
    "nameBn": "রসুন",
    "family": "amaryllidaceae",
    "tempMin": 12,
    "tempMax": 22,
    "water": "medium",
    "soilMin": 0.2,
    "soilMax": 0.28,
    "nutrient": -1,
    "days": 125,
    "cost": "high",
    "source": "BARI"
  },
  {
    "id": "chili",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Chili",
    "name_bn": "মরিচ",
    "scientific_name": "Capsicum annuum",
    "plant_family": "solanaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "Rabi: Oct – Nov; Kharif-1: Feb – March",
      "months_bn": "রবি: অক্টোবর – নভেম্বর; খরিফ-১: ফেব্রুয়ারি – মার্চ",
      "start_month": 10,
      "end_month": 3
    },
    "harvest_window": {
      "months_en": "Rabi: Jan – April; Kharif-1: May – July",
      "months_bn": "রবি: জানুয়ারি – এপ্রিল; খরিফ-১: মে – জুলাই",
      "start_month": 1,
      "end_month": 7
    },
    "duration_days": {
      "min": 130,
      "max": 150
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 8,
        "weeks_max": 10
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 400,
      "max": 600
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 10,
      "optimal_min": 20,
      "optimal_max": 30,
      "critical_min": 10,
      "critical_max": 35,
      "notes_bn": "রাতে <১৫°C হলে ফুল ঝরে যায়",
      "notes_en": "Flowers drop if night temp <15°C"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "উচ্চ আর্দ্রতায় ডাইব্যাক ও এনথ্রাকনোজ রোগ",
      "notes_en": "Anthracnose dieback risk in heavy humidity"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Fungal/bacterial disease pressure",
      "Fungal/bacterial disease pressure"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতা (চব্বিশ ঘণ্টায় শিকড় পচে গাছ মরে যায়)",
      "এনথ্রাকনোজ / ডাইব্যাক রোগ",
      "থ্রিপস পোকা ও পাতা কোকড়ানো রোগ"
    ],
    "decision_rules_en": [
      "বন্যাবিহীন উঁচু ও মাঝারি উঁচু সুনিষ্কাশিত জমিতে কৃষক যদি নিয়মিত নগদ আয় চায়, তবে অ্যালগরিদম মরিচ চাষের নির্দেশনা দেবে।"
    ],
    "decision_rules_bn": [
      "বন্যাবিহীন উঁচু ও মাঝারি উঁচু সুনিষ্কাশিত জমিতে কৃষক যদি নিয়মিত নগদ আয় চায়, তবে অ্যালগরিদম মরিচ চাষের নির্দেশনা দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **মরিচ (Chili) — রবি (শীতকালীন) ও খরিফ (গ্রীষ্মকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৬. মরিচ",
        "confidence": "research"
      }
    ],
    "nameEn": "Chili",
    "nameBn": "মরিচ",
    "family": "nightshade",
    "tempMin": 20,
    "tempMax": 30,
    "water": "medium",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": -1,
    "days": 150,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "ginger",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Ginger",
    "name_bn": "আদা",
    "scientific_name": "Zingiber officinale",
    "plant_family": "zingiberaceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "April – May",
      "months_bn": "চৈত্র – বৈশাখ (এপ্রিল – মে)",
      "start_month": 4,
      "end_month": 5
    },
    "harvest_window": {
      "months_en": "December – January",
      "months_bn": "পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)",
      "start_month": 12,
      "end_month": 1
    },
    "duration_days": {
      "min": 240,
      "max": 270
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 17,
        "weeks_max": 19
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 9,
        "weeks_max": 11
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 10,
        "weeks_max": 12
      }
    ],
    "water_need_mm": {
      "min": 1200,
      "max": 1500
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 13,
      "optimal_min": 25,
      "optimal_max": 32,
      "critical_min": 13,
      "critical_max": 35,
      "notes_bn": "তীব্র তাপদাহ ক্ষতিকর; আদা ২০-৪০% ছায়া পছন্দ করে",
      "notes_en": "Severe heat harmful; prefers 20-40% partial shade"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "রাইজোম রট রোধে মাটির সুনিষ্কাশন জরুরি",
      "notes_en": "Soil drainage crucial to avoid rhizome rot"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Fungal/bacterial disease pressure",
      "Heat stress during reproductive stage"
    ],
    "key_risks_bn": [
      "রাইজোম রট / কন্দ পচা রোগ (পানি নিষ্কাশনের অভাব হলে)",
      "তীব্র সূর্যালোক ও তাপদাহ (আদা ২০-৪০% ছায়া পছন্দ করে)"
    ],
    "decision_rules_en": [
      "বাগানের ছায়াযুক্ত উঁচু জমি বা পাহাড়ি ঢালে যেখানে সরাসরি সূর্যালোক কম পায়, সেখানে অ্যালগরিদম আদা চাষের লজিক দেবে।"
    ],
    "decision_rules_bn": [
      "বাগানের ছায়াযুক্ত উঁচু জমি বা পাহাড়ি ঢালে যেখানে সরাসরি সূর্যালোক কম পায়, সেখানে অ্যালগরিদম আদা চাষের লজিক দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **আদা (Ginger) — দীর্ঘমেয়াদী খরিফ/বার্ষিক ফসল**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৮. আদা",
        "confidence": "research"
      }
    ],
    "nameEn": "Ginger",
    "nameBn": "আদা",
    "family": "zingiberaceae",
    "tempMin": 25,
    "tempMax": 32,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 270,
    "cost": "high",
    "source": "BARI"
  },
  {
    "id": "turmeric",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Turmeric",
    "name_bn": "হলুদ",
    "scientific_name": "Curcuma longa",
    "plant_family": "zingiberaceae",
    "is_legume": false,
    "seasons": [
      "kharif1"
    ],
    "occupies_seasons": [
      "kharif1",
      "kharif2",
      "rabi"
    ],
    "is_long_duration": true,
    "sowing_window": {
      "months_en": "April – May",
      "months_bn": "চৈত্র – বৈশাখ (এপ্রিল – মে)",
      "start_month": 4,
      "end_month": 5
    },
    "harvest_window": {
      "months_en": "December – January",
      "months_bn": "পৌষ – মাঘ (ডিসেম্বর – জানুয়ারি)",
      "start_month": 12,
      "end_month": 1
    },
    "duration_days": {
      "min": 250,
      "max": 280
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 17,
        "weeks_max": 19
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 9,
        "weeks_max": 11
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 11,
        "weeks_max": 13
      }
    ],
    "water_need_mm": {
      "min": 1000,
      "max": 1400
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 14,
      "optimal_min": 25,
      "optimal_max": 34,
      "critical_min": 14,
      "critical_max": 38,
      "notes_bn": "উষ্ণ ও আর্দ্র জলবায়ু সহায়ক",
      "notes_en": "Warm, humid conditions favorable"
    },
    "humidity": {
      "optimal_min": 70,
      "optimal_max": 85,
      "risk_above": 90,
      "notes_bn": "বর্ষায় উষ্ণ আর্দ্রতায় দ্রুত পাতা গজায়",
      "notes_en": "Vigorous leaf growth during monsoon"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Fungal/bacterial disease pressure",
      "Waterlogging and poor drainage"
    ],
    "key_risks_bn": [
      "রাইজোম পচন ও পাতা ঝলসানো রোগ",
      "দীর্ঘায়িত জলাবদ্ধতা"
    ],
    "decision_rules_en": [
      "বসতবাড়ির পতিত উঁচু জমিতে বা ফলের বাগানের নিচে অন্তর্বর্তীকালীন ফসল হিসেবে অ্যালগরিদম হলুদ চাষের সুপারিশ করবে।"
    ],
    "decision_rules_bn": [
      "বসতবাড়ির পতিত উঁচু জমিতে বা ফলের বাগানের নিচে অন্তর্বর্তীকালীন ফসল হিসেবে অ্যালগরিদম হলুদ চাষের সুপারিশ করবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **হলুদ (Turmeric) — দীর্ঘমেয়াদী খরিফ/বার্ষিক ফসল**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "১৯. হলুদ",
        "confidence": "research"
      }
    ],
    "nameEn": "Turmeric",
    "nameBn": "হলুদ",
    "family": "zingiberaceae",
    "tempMin": 25,
    "tempMax": 34,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 280,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "tomato",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Tomato",
    "name_bn": "টমেটো",
    "scientific_name": "Solanum lycopersicum",
    "plant_family": "solanaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1"
    ],
    "sowing_window": {
      "months_en": "Rabi: Oct – Nov; Summer: May – June",
      "months_bn": "রবি: কার্তিক – অগ্রহায়ণ (অক্টোবর – নভেম্বর); গ্রীষ্মকালীন: বৈশাখ – জ্যৈষ্ঠ (মে – জুন)",
      "start_month": 10,
      "end_month": 6
    },
    "harvest_window": {
      "months_en": "Rabi: Jan – March; Summer: July – Sep",
      "months_bn": "রবি: পৌষ – চৈত্র (জানুয়ারি – মার্চ); গ্রীষ্মকালীন: শ্রাবণ – আশ্বিন (জুলাই – সেপ্টেম্বর)",
      "start_month": 1,
      "end_month": 9
    },
    "duration_days": {
      "min": 100,
      "max": 125
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 7,
        "weeks_max": 9
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 4,
        "weeks_max": 6
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 4,
        "weeks_max": 6
      }
    ],
    "water_need_mm": {
      "min": 400,
      "max": 600
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 10,
      "optimal_min": 20,
      "optimal_max": 28,
      "critical_min": 10,
      "critical_max": 34,
      "notes_bn": "রাতের তাপমাত্রা >২৫°C হলে পরাগায়ন ব্যর্থ ও ফল ঝরে",
      "notes_en": "Night temp >25°C causes pollination failure"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "কুয়াশা ও আর্দ্রতা >৮৫% হলে লেট ব্লাইটের আক্রমণ",
      "notes_en": "Late blight attacks when humidity >85%"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Cold stress and frost injury",
      "Waterlogging and poor drainage",
      "Heat stress during reproductive stage"
    ],
    "key_risks_bn": [
      "নাবি ধসা / লেট ব্লাইট রোগ (শীতকালে কুয়াশা ও মেঘলা আবহাওয়ায়)",
      "জলাবদ্ধতা (১২ ঘণ্টায় গাছ ঢলে পড়ে)",
      "অতিরিক্ত তাপদাহে ফুল ঝরা"
    ],
    "decision_rules_en": [
      "শীতকালে সেচের সুব্যবস্থা এবং উঁচু বেড তৈরি করার সুযোগ থাকলে উচ্চমূল্যের অর্থকরী সবজি হিসেবে টমেটো চাষের লজিক কার্যকর হবে।"
    ],
    "decision_rules_bn": [
      "শীতকালে সেচের সুব্যবস্থা এবং উঁচু বেড তৈরি করার সুযোগ থাকলে উচ্চমূল্যের অর্থকরী সবজি হিসেবে টমেটো চাষের লজিক কার্যকর হবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **টমেটো (Tomato) — রবি (শীতকালীন) ও খরিফ (গ্রীষ্মকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "২৯. টমেটো",
        "confidence": "research"
      }
    ],
    "nameEn": "Tomato",
    "nameBn": "টমেটো",
    "family": "nightshade",
    "tempMin": 20,
    "tempMax": 28,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 125,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "brinjal",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Brinjal",
    "name_bn": "বেগুন",
    "scientific_name": "Solanum melongena",
    "plant_family": "solanaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif1",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "Rabi: Sep – Oct; Kharif: Feb – March",
      "months_bn": "রবি: আশ্বিন – কার্তিক (সেপ্টেম্বর – অক্টোবর); খরিফ: ফাল্গুন – চৈত্র (ফেব্রুয়ারি – মার্চ)",
      "start_month": 9,
      "end_month": 3
    },
    "harvest_window": {
      "months_en": "Rabi: Dec – April; Kharif: May – Sep",
      "months_bn": "রবি: পৌষ – বৈশাখ (ডিসেম্বর – এপ্রিল); খরিফ: জ্যৈষ্ঠ – আশ্বিন (মে – সেপ্টেম্বর)",
      "start_month": 12,
      "end_month": 9
    },
    "duration_days": {
      "min": 150,
      "max": 180
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 500,
      "max": 800
    },
    "irrigation_notes_en": "Moderate water requirement; 2-3 supplementary irrigations needed",
    "irrigation_notes_bn": "মাঝারি পানির চাহিদা; ২-৩টি সম্পূরক সেচ প্রয়োজন",
    "temperature_c": {
      "base": 12,
      "optimal_min": 22,
      "optimal_max": 32,
      "critical_min": 10,
      "critical_max": 35,
      "notes_bn": "রাতে <১০°C নামলে ফলের আকার বিকৃত হয়",
      "notes_en": "Night temp <10°C deforms fruit shape"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "উচ্চ আর্দ্রতায় ব্যাকটেরিয়াল উইল্ট রোগ বাড়ে",
      "notes_en": "Bacterial wilt prevalent in saturated soil"
    },
    "smap_optimal": {
      "min": 0.25,
      "max": 0.35
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Waterlogging and poor drainage",
      "Pest attacks"
    ],
    "key_risks_bn": [
      "জলাবদ্ধতা (চব্বিশ ঘণ্টা পানি জমলে ব্যাকটেরিয়াল উইল্ট ও শিকড় পচন)",
      "ডগা ও ফল ছিদ্রকারী পোকা"
    ],
    "decision_rules_en": [
      "সুনিষ্কাশিত পলি-দোআঁশ মাটিতে কৃষক যদি দীর্ঘমেয়াদী কিস্তিতে নিয়মিত আয় নিশ্চিত করতে চায়, তবে অ্যালগরিদম বেগুন চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "সুনিষ্কাশিত পলি-দোআঁশ মাটিতে কৃষক যদি দীর্ঘমেয়াদী কিস্তিতে নিয়মিত আয় নিশ্চিত করতে চায়, তবে অ্যালগরিদম বেগুন চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "high",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **বেগুন (Brinjal) — রবি (শীতকালীন) ও খরিফ (গ্রীষ্ম/বর্ষাকালীন)**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৩০. বেগুন",
        "confidence": "research"
      }
    ],
    "nameEn": "Brinjal",
    "nameBn": "বেগুন",
    "family": "nightshade",
    "tempMin": 22,
    "tempMax": 32,
    "water": "medium",
    "soilMin": 0.25,
    "soilMax": 0.35,
    "nutrient": -1,
    "days": 180,
    "cost": "medium",
    "source": "BARI"
  },
  {
    "id": "radish",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Radish",
    "name_bn": "মুলা",
    "scientific_name": "Raphanus sativus",
    "plant_family": "brassicaceae",
    "is_legume": false,
    "seasons": [
      "rabi",
      "kharif2"
    ],
    "sowing_window": {
      "months_en": "Rabi: Sep – Nov; Early: August",
      "months_bn": "রবি: আশ্বিন – অগ্রহায়ণ (সেপ্টেম্বর – নভেম্বর); আগাম: ভাদ্র (আগস্ট)",
      "start_month": 8,
      "end_month": 11
    },
    "harvest_window": {
      "months_en": "October – January (40-60 days after sowing)",
      "months_bn": "বপনের ৪০-৬০ দিন পর (অক্টোবর – জানুয়ারি)",
      "start_month": 10,
      "end_month": 1
    },
    "duration_days": {
      "min": 40,
      "max": 60
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 3,
        "weeks_max": 5
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 2,
        "weeks_max": 3
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 2,
        "weeks_max": 4
      }
    ],
    "water_need_mm": {
      "min": 250,
      "max": 350
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 10,
      "optimal_min": 15,
      "optimal_max": 20,
      "critical_min": 10,
      "critical_max": 28,
      "notes_bn": "তাপমাত্রা >২৮°C হলে বোল্টিং হয়",
      "notes_en": "Premature bolting occurs above 28°C"
    },
    "humidity": {
      "optimal_min": 60,
      "optimal_max": 70,
      "risk_above": 80,
      "notes_bn": "আর্দ্রতার তারতম্যে মূল ফেটে যায়",
      "notes_en": "Root cracking occurs with moisture swings"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.28
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "Heat stress during reproductive stage",
      "আর্দ্রতার চরম তারতম্যে মুলা ফেটে যাওয়া ও ফাঁপা স্পঞ্জি হওয়া"
    ],
    "key_risks_bn": [
      "উচ্চ তাপমাত্রা (>২৮°C বোল্টিং ও শক্ত মূল)",
      "আর্দ্রতার চরম তারতম্যে মুলা ফেটে যাওয়া ও ফাঁপা স্পঞ্জি হওয়া"
    ],
    "decision_rules_en": [
      "দুটি প্রধান ফসলের মধ্যবর্তী সময়ে জমি যদি মাত্র দেড় থেকে দুই মাস ফাঁকা থাকে, তবে সেই স্বল্প সময়ের সর্বোচ্চ ব্যবহারে অ্যালগরিদম মুলা চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "দুটি প্রধান ফসলের মধ্যবর্তী সময়ে জমি যদি মাত্র দেড় থেকে দুই মাস ফাঁকা থাকে, তবে সেই স্বল্প সময়ের সর্বোচ্চ ব্যবহারে অ্যালগরিদম মুলা চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **মুলা (Radish) — রবি (শীতকালীন) ও আগাম খরিফ-২**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৩১. মুলা",
        "confidence": "research"
      }
    ],
    "nameEn": "Radish",
    "nameBn": "মুলা",
    "family": "mustard",
    "tempMin": 15,
    "tempMax": 20,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.28,
    "nutrient": -1,
    "days": 60,
    "cost": "low",
    "source": "BARI"
  },
  {
    "id": "country_bean",
    "category_id": "spices_veg",
    "parent_group": null,
    "name_en": "Country Bean",
    "name_bn": "শিম",
    "scientific_name": "Lablab purpureus",
    "plant_family": "fabaceae",
    "is_legume": true,
    "seasons": [
      "rabi"
    ],
    "sowing_window": {
      "months_en": "July – late-August",
      "months_bn": "আষাঢ় – ভাদ্র (জুলাই – আগস্ট শেষ)",
      "start_month": 7,
      "end_month": 8
    },
    "harvest_window": {
      "months_en": "November – March",
      "months_bn": "অগ্রহায়ণ – চৈত্র (নভেম্বর – মার্চ)",
      "start_month": 11,
      "end_month": 3
    },
    "duration_days": {
      "min": 150,
      "max": 180
    },
    "growth_stages": [
      {
        "name_en": "Vegetative Stage",
        "name_bn": "অঙ্গজ বৃদ্ধি পর্যায়",
        "weeks_min": 11,
        "weeks_max": 13
      },
      {
        "name_en": "Flowering / Tuberization",
        "name_bn": "ফুল ফোটা / কন্দ গঠন",
        "weeks_min": 6,
        "weeks_max": 8
      },
      {
        "name_en": "Ripening & Harvest",
        "name_bn": "পরিপক্কতা ও ফসল আহরণ",
        "weeks_min": 6,
        "weeks_max": 8
      }
    ],
    "water_need_mm": {
      "min": 400,
      "max": 600
    },
    "irrigation_notes_en": "Low water requirement; 1-2 light irrigations or rainfed",
    "irrigation_notes_bn": "কম পানি লাগে; ১-২টি হালকা সম্পূরক সেচ বা বৃষ্টির আর্দ্রতায় চাষ",
    "temperature_c": {
      "base": 15,
      "optimal_min": 18,
      "optimal_max": 28,
      "critical_min": 12,
      "critical_max": 32,
      "notes_bn": "রাতের তাপমাত্রা <২০°C আবশ্যক; >৩২°C ফুল ঝরে",
      "notes_en": "Night temp <20°C required; flowers drop above 32°C"
    },
    "humidity": {
      "optimal_min": 65,
      "optimal_max": 75,
      "risk_above": 85,
      "notes_bn": "কুয়াশাচ্ছন্ন আর্দ্রতায় ফুল পচন ও পোকা আক্রমণ",
      "notes_en": "Flower rot and pod borer under heavy fog"
    },
    "smap_optimal": {
      "min": 0.2,
      "max": 0.3
    },
    "rainfall_alerts": [],
    "key_risks_en": [
      "ফুল ফোটার সময় অতিবৃষ্টি ও কুয়াশা (ফুল পচন ও পোড বোরার আক্রমণ)",
      "Heat stress during reproductive stage",
      "মাটির আর্দ্রতা >৩৫% এ শিকড় পচন"
    ],
    "key_risks_bn": [
      "ফুল ফোটার সময় অতিবৃষ্টি ও কুয়াশা (ফুল পচন ও পোড বোরার আক্রমণ)",
      "উচ্চ তাপমাত্রা (>৩২°C ফুল ঝরে যাওয়া)",
      "মাটির আর্দ্রতা >৩৫% এ শিকড় পচন"
    ],
    "decision_rules_en": [
      "বসতবাড়ির আশপাশে, আইলে বা মাচাযুক্ত জমিতে বায়ুমণ্ডলীয় নাইট্রোজেন ধরে রেখে মাটির স্বাস্থ্য উন্নয়ন ও শীতকালীন সবজি হিসেবে অ্যালগরিদম শিম চাষের সিদ্ধান্ত দেবে।"
    ],
    "decision_rules_bn": [
      "বসতবাড়ির আশপাশে, আইলে বা মাচাযুক্ত জমিতে বায়ুমণ্ডলীয় নাইট্রোজেন ধরে রেখে মাটির স্বাস্থ্য উন্নয়ন ও শীতকালীন সবজি হিসেবে অ্যালগরিদম শিম চাষের সিদ্ধান্ত দেবে।"
    ],
    "nasa_data_link_en": "NASA POWER agro-climatology (temperature, precipitation, solar radiation) & NASA SMAP surface soil moisture monitoring",
    "nasa_data_link_bn": "নাসা পাওয়ার কৃষি-আবহাওয়া (তাপমাত্রা, বৃষ্টিপাত, সৌর বিকিরণ) ও নাসা স্ম্যাপ মাটির আর্দ্রতা ডেটা",
    "value_category": "medium",
    "is_staple": false,
    "data_confidence": "research",
    "data_complete": true,
    "recommendable": true,
    "sources": [
      {
        "field": "crop_characteristics",
        "file": "crop-list.txt",
        "section": "### **শিম (Country Bean) — প্রধানত রবি (শীতকালীন) ও বিশেষ গ্রীষ্মকালীন**",
        "confidence": "research"
      },
      {
        "field": "thresholds_and_rules",
        "file": "crop-rules.txt",
        "section": "৩২. শিম",
        "confidence": "research"
      }
    ],
    "nameEn": "Country Bean",
    "nameBn": "শিম",
    "family": "legume",
    "tempMin": 18,
    "tempMax": 28,
    "water": "low",
    "soilMin": 0.2,
    "soilMax": 0.3,
    "nutrient": 2,
    "days": 180,
    "cost": "medium",
    "source": "BARI"
  }
];

export const FAMILY_LABEL: Record<string, { en: string; bn: string }> = {
  poaceae: { en: 'Grass family (cereals & sugarcane)', bn: 'ঘাস গোত্র (দানাশস্য ও আখ)' },
  grass: { en: 'Grass family (cereals & sugarcane)', bn: 'ঘাস গোত্র (দানাশস্য ও আখ)' },
  fabaceae: { en: 'Legume · fixes atmospheric nitrogen', bn: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে' },
  legume: { en: 'Legume · fixes atmospheric nitrogen', bn: 'ডাল জাতীয় · নাইট্রোজেন যোগ করে' },
  brassicaceae: { en: 'Mustard family (Brassicaceae)', bn: 'সরিষা গোত্র' },
  mustard: { en: 'Mustard family (Brassicaceae)', bn: 'সরিষা গোত্র' },
  solanaceae: { en: 'Nightshade family (Solanaceae)', bn: 'আলু ও বেগুন গোত্র' },
  nightshade: { en: 'Nightshade family (Solanaceae)', bn: 'আলু ও বেগুন গোত্র' },
  malvaceae: { en: 'Mallow family (fiber crops)', bn: 'পাট ও তুলা গোত্র' },
  mallow: { en: 'Mallow family (fiber crops)', bn: 'পাট ও তুলা গোত্র' },
  araceae: { en: 'Arum family (Taro species)', bn: 'কচু গোত্র' },
  convolvulaceae: { en: 'Morning glory family (Sweet potato)', bn: 'মিষ্টি আলু গোত্র' },
  dioscoreaceae: { en: 'Yam family (Dioscoreaceae)', bn: 'মেটে আলু গোত্র' },
  euphorbiaceae: { en: 'Spurge family (Cassava)', bn: 'কাসাভা গোত্র' },
  amaryllidaceae: { en: 'Allium family (Onion & Garlic)', bn: 'পেঁয়াজ ও রসুন গোত্র' },
  zingiberaceae: { en: 'Ginger family (Zingiberaceae)', bn: 'আদা ও হলুদ গোত্র' },
  pedaliaceae: { en: 'Sesame family (Pedaliaceae)', bn: 'তিল গোত্র' },
  asteraceae: { en: 'Sunflower family (Asteraceae)', bn: 'সূর্যমুখী গোত্র' },
};

export const CROP_ID_MAP: Record<string, string> = {
  // rice aliases
  boro_rice: 'boro',
  aus_rice: 'aus',
  aman_rice: 'aman',
  t_aman: 'aman',
  't. aman': 'aman',
  t_aman_rice: 'aman',
  // Bengali aliases
  'বোরো': 'boro',
  'বোরো ধান': 'boro',
  'আউশ': 'aus',
  'আউশ ধান': 'aus',
  'আমন': 'aman',
  'আমন ধান': 'aman',
  'রোপা আমন': 'aman',
  'রোপা আমন ধান': 'aman',
  'গম': 'wheat',
  'ভুট্টা': 'maize',
  'মসুর': 'lentil',
  'মসুর ডাল': 'lentil',
  'মুগ': 'mungbean',
  'মুগ ডাল': 'mungbean',
  'মুগডাল': 'mungbean',
  'সরিষা': 'mustard',
  'আলু': 'potato',
  'গোল আলু': 'potato',
  'পাট': 'jute',
  'খেসারি': 'grass_pea',
  'খেসারি ডাল': 'grass_pea',
  'মাষকলাই': 'blackgram',
  'মাষকলাই ডাল': 'blackgram',
  'ছোলা': 'chickpea',
  'ছোলা ডাল': 'chickpea',
  'চীনাবাদাম': 'groundnut',
  'চিনাবাদাম': 'groundnut',
  'বাদাম': 'groundnut',
  'তিল': 'sesame',
  'সূর্যমুখী': 'sunflower',
  'সয়াবিন': 'soybean',
  'মিষ্টি আলু': 'sweet_potato',
  'মিষ্টিআলু': 'sweet_potato',
  'মেটে আলু': 'greater_yam',
  'মেটেআলু': 'greater_yam',
  'গাছআলু': 'greater_yam',
  'মাছআলু': 'greater_yam',
  'বড় পেঁচালু': 'greater_yam',
  'কচু': 'giant_taro',
  'মানকচু': 'giant_taro',
  'পানিকচু': 'water_taro',
  'মুখীকচু': 'eddoe_taro',
  'সাহেবী কচু': 'tannia',
  'মৌলভী কচু': 'tannia',
  'বিলাতী কচু': 'tannia',
  'দুধকচু': 'tannia',
  'ওলকচু': 'elephant_foot_yam',
  'কাসাভা': 'cassava',
  'শিমুল আলু': 'cassava',
  'আখ': 'sugarcane',
  'তুলা': 'cotton',
  'তামাক': 'tobacco',
  'পেঁয়াজ': 'onion',
  'রসুন': 'garlic',
  'মরিচ': 'chili',
  'আদা': 'ginger',
  'হলুদ': 'turmeric',
  'টমেটো': 'tomato',
  'বেগুন': 'brinjal',
  'মূলা': 'radish',
  'মুলা': 'radish',
  'শিম': 'country_bean',
};

export function resolveCropId(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = val.trim();
  const lower = trimmed.toLowerCase().replace(/[\s\-_]+/g, '_');
  if (CROP_ID_MAP[trimmed]) return CROP_ID_MAP[trimmed];
  if (CROP_ID_MAP[lower]) return CROP_ID_MAP[lower];
  const directMatch = CROPS.find(
    (c) =>
      c.id.toLowerCase() === lower ||
      c.name_en.toLowerCase() === trimmed.toLowerCase() ||
      c.name_bn === trimmed ||
      c.nameEn.toLowerCase() === trimmed.toLowerCase() ||
      c.nameBn === trimmed
  );
  if (directMatch) return directMatch.id;
  return lower;
}

export const cropById = (id: string): Crop => {
  const canonical = resolveCropId(id);
  const found = CROPS.find((c) => c.id === canonical || c.id === id);
  return (found || CROPS[0])!;
};

const BASE_SCORES = {
  boro: 78,
  aman: 88,
  aus: 82,
  wheat: 86,
  maize: 87,
  lentil: 94,
  mungbean: 91,
  grass_pea: 90,
  blackgram: 89,
  chickpea: 85,
  mustard: 92,
  groundnut: 86,
  sesame: 88,
  sunflower: 84,
  soybean: 83,
  potato: 84,
  sweet_potato: 88,
  greater_yam: 81,
  giant_taro: 80,
  water_taro: 83,
  eddoe_taro: 85,
  tannia: 82,
  elephant_foot_yam: 84,
  cassava: 79,
  jute: 89,
  sugarcane: 80,
  cotton: 82,
  tobacco: 60,
  onion: 87,
  garlic: 86,
  chili: 88,
  ginger: 83,
  turmeric: 85,
  tomato: 86,
  brinjal: 87,
  radish: 90,
  country_bean: 88,
};

export function toCropData(crop: Crop): CropData {
  const isEstimated = crop.data_confidence === 'estimated';
  const obsEn: string[] = [
    `NASA POWER agro-meteorology indicates seasonal suitability for ${crop.name_en}.`,
    `SMAP rootzone moisture (${crop.smap_optimal.min ?? 0.20} - ${crop.smap_optimal.max ?? 0.35} m³/m³) matches crop establishment requirements.`,
  ];
  const obsBn: string[] = [
    `নাসা পাওয়ার কৃষি-আবহাওয়া তথ্য অনুযায়ী ${crop.name_bn}-এর অনুকূল পরিবেশ বিদ্যমান।`,
    `স্ম্যাপ আর্দ্রতা (${crop.smap_optimal.min ?? 0.20} - ${crop.smap_optimal.max ?? 0.35}) এই ফসলের বৃদ্ধির জন্য সামঞ্জস্যপূর্ণ।`,
  ];

  if (isEstimated) {
    obsEn.push('Estimated data: unverified with field trials; confirm with local upazila agriculture office.');
    obsBn.push('এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।');
  }

  const seasonEnMap: Record<string, 'Rabi' | 'Kharif-1' | 'Kharif-2'> = {
    rabi: 'Rabi',
    kharif1: 'Kharif-1',
    kharif2: 'Kharif-2',
  };
  const seasonBnMap: Record<string, 'রবি' | 'খরিফ-১' | 'খরিফ-২'> = {
    rabi: 'রবি',
    kharif1: 'খরিফ-১',
    kharif2: 'খরিফ-২',
  };

  const primarySeason = crop.seasons[0] || 'rabi';
  const waterReqEn = crop.water === 'high' ? 'High' : crop.water === 'low' ? 'Low' : 'Medium';
  const waterReqBn = crop.water === 'high' ? 'বেশি' : crop.water === 'low' ? 'কম' : 'মাঝারি';

  return {
    id: crop.id,
    nameEn: crop.name_en,
    nameBn: crop.name_bn,
    scientificName: crop.scientific_name || '',
    seasonEn: seasonEnMap[primarySeason] || 'Rabi',
    seasonBn: seasonBnMap[primarySeason] || 'রবি',
    suitabilityScore: (BASE_SCORES as Record<string, number>)[crop.id] || 85,
    suitabilityTier: 'high',
    waterRequirementEn: waterReqEn,
    waterRequirementBn: waterReqBn,
    waterDetailEn: crop.irrigation_notes_en || `${crop.water_need_mm?.min ?? 300}-${crop.water_need_mm?.max ?? 600}mm total water need`,
    waterDetailBn: crop.irrigation_notes_bn || `${crop.water_need_mm?.min ?? 300}-${crop.water_need_mm?.max ?? 600} মিমি মোট পানির চাহিদা`,
    durationDays: crop.duration_days?.max || crop.days || 100,
    valueCategory: crop.value_category || undefined,
    isStaple: crop.is_staple,
    shortWhyEn: crop.key_risks_en[0] ? `Resilient choice; monitor ${crop.key_risks_en[0].toLowerCase()}.` : 'Suitable for season and soil moisture.',
    shortWhyBn: crop.key_risks_bn[0] ? `মৌসুমের উপযোগী ফসল; ${crop.key_risks_bn[0]} এড়িয়ে চলার পরামর্শ।` : 'মৌসুম ও মাটির আর্দ্রতার জন্য উপযোগী।',
    explanation: {
      observationsTriggered: obsEn,
      observationsTriggeredBn: obsBn,
      priorityAlignment: isEstimated
        ? 'Estimated data: recommendations should be cross-checked with local agricultural extension.'
        : 'Aligned with field conditions and seasonal crop rotation guidelines.',
      priorityAlignmentBn: isEstimated
        ? 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'
        : 'জমির আবহাওয়া ও মৌসুমী ফসল পরিক্রমার সাথে সামঞ্জস্যপূর্ণ।',
      rulesSatisfied: crop.decision_rules_en && crop.decision_rules_en.length > 0
        ? crop.decision_rules_en
        : [`Rule: Season match for ${crop.name_en}`],
      rulesSatisfiedBn: crop.decision_rules_bn && crop.decision_rules_bn.length > 0
        ? crop.decision_rules_bn
        : [`রুল: ${crop.name_bn} মৌসুমী উৎপাদন নিয়মের সাথে সামঞ্জস্যপূর্ণ`],
    },
  };
}

export const CROPS_DATABASE: Record<string, CropData> = (() => {
  const db: Record<string, CropData> = {};
  for (const c of CROPS) {
    if (c.recommendable) {
      db[c.id] = toCropData(c);
    }
  }
  // aliases for backward compatibility
  if (db['boro']) db['boro_rice'] = db['boro'];
  if (db['aman']) db['aman_rice'] = db['aman'];
  if (db['aus']) db['aus_rice'] = db['aus'];
  return db;
})();
