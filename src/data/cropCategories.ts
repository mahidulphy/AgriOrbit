// Categories for AgriOrbit Crop Knowledge Base
// Strict order (1-6) as specified in Part 1

export type CropCategoryId =
  | 'cereal'
  | 'pulses'
  | 'oilseeds'
  | 'tubers'
  | 'cash_fiber'
  | 'spices_veg';

export interface CropCategory {
  id: CropCategoryId;
  order: number;
  name_en: string;
  name_bn: string;
  description_en: string;
  description_bn: string;
}

export const CROP_CATEGORIES: CropCategory[] = [
  {
    id: 'cereal',
    order: 1,
    name_en: 'Cereal Crops',
    name_bn: 'দানা জাতীয় ফসল',
    description_en: 'Rice, wheat, maize, and staple cereal grains',
    description_bn: 'ধান, গম, ভুট্টা এবং প্রধান দানাশস্য',
  },
  {
    id: 'pulses',
    order: 2,
    name_en: 'Pulses: Nitrogen Fixers',
    name_bn: 'ডাল জাতীয় ফসল',
    description_en: 'Legumes that naturally fix atmospheric nitrogen into the soil',
    description_bn: 'ডাল জাতীয় ফসল যা মাটিতে প্রাকৃতিকভাবে নাইট্রোজেন যুক্ত করে',
  },
  {
    id: 'oilseeds',
    order: 3,
    name_en: 'Oilseeds',
    name_bn: 'তেলজাতীয় ফসল',
    description_en: 'Mustard, groundnut, sesame, sunflower, and soybean',
    description_bn: 'সরিষা, চীনাবাদাম, তিল, সূর্যমুখী ও সয়াবিন',
  },
  {
    id: 'tubers',
    order: 4,
    name_en: 'Tuber Crops',
    name_bn: 'কন্দাল ফসল',
    description_en: 'Potato, sweet potato, yams, and taros',
    description_bn: 'আলু, মিষ্টি আলু, মেটে আলু ও কচু জাতীয় ফসল',
  },
  {
    id: 'cash_fiber',
    order: 5,
    name_en: 'Cash & Fiber Crops',
    name_bn: 'অর্থকরী ও আঁশ জাতীয় ফসল',
    description_en: 'Jute, sugarcane, cotton, and commercial cash crops',
    description_bn: 'পাট, আখ, তুলা ও বাণিজ্যিক ফসল',
  },
  {
    id: 'spices_veg',
    order: 6,
    name_en: 'Spices & Major Veg',
    name_bn: 'প্রধান মসলা ও অর্থকরী সবজি',
    description_en: 'Onion, garlic, chili, ginger, turmeric, and high-value vegetables',
    description_bn: 'পেঁয়াজ, রসুন, মরিচ, আদা, হলুদ ও প্রধান সবজি',
  },
];

export const categoryById = (id: CropCategoryId | string): CropCategory | undefined =>
  CROP_CATEGORIES.find((cat) => cat.id === id);
