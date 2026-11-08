import React from 'react';
import { Sprout, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { CROPS, FAMILY_LABEL, resolveCropId as canonicalResolveCropId } from '../../../data/crops';
import { CROP_CATEGORIES } from '../../../data/cropCategories';

export interface CropHistorySectionProps {
  currentCrop: string;
  onCurrentCropChange: (val: string) => void;
  previousCrop: string;
  onPreviousCropChange: (val: string) => void;
  plannedNextCrop?: string;
  onPlannedNextCropChange?: (val: string) => void;
  // Current 3-season rotation baseline for NASA Field Shift comparison
  currentRotationRabi?: string;
  onCurrentRotationRabiChange?: (val: string) => void;
  currentRotationKharif1?: string;
  onCurrentRotationKharif1Change?: (val: string) => void;
  currentRotationKharif2?: string;
  onCurrentRotationKharif2Change?: (val: string) => void;
  irrigationAvailability?: 'yes' | 'limited' | 'no';
  onIrrigationAvailabilityChange?: (val: 'yes' | 'limited' | 'no') => void;
  mainPurpose?: 'home_food' | 'local_market' | 'both';
  onMainPurposeChange?: (val: 'home_food' | 'local_market' | 'both') => void;
  isBn: boolean;
  showPlannedNext?: boolean;
  errors?: { currentCrop?: string; previousCrop?: string };
}

export function resolveCropId(val: string): string {
  if (!val) return 'fallow';
  const lower = val.toLowerCase().trim();
  if (lower === 'fallow' || lower.includes('খালি') || lower.includes('পতিত') || lower.includes('preparing') || lower.includes('bare')) return 'fallow';
  if (lower === 'other' || lower.includes('অন্য')) return 'other';
  if (lower === 'boro_rice') return 'boro';
  if (lower === 'aus_rice') return 'aus';
  if (lower === 'aman_rice' || lower === 't_aman_rice') return 'aman';
  return canonicalResolveCropId(val) || val;
}

export const CropHistorySection: React.FC<CropHistorySectionProps> = ({
  currentCrop,
  onCurrentCropChange,
  previousCrop,
  onPreviousCropChange,
  plannedNextCrop,
  onPlannedNextCropChange,
  currentRotationRabi = 'boro',
  onCurrentRotationRabiChange,
  currentRotationKharif1 = 'fallow',
  onCurrentRotationKharif1Change,
  currentRotationKharif2 = 'aman',
  onCurrentRotationKharif2Change,
  irrigationAvailability = 'yes',
  onIrrigationAvailabilityChange,
  mainPurpose = 'both',
  onMainPurposeChange,
  isBn,
  showPlannedNext = false,
  errors,
}) => {
  const normalizedCurrent = resolveCropId(currentCrop);
  const normalizedPrevious = resolveCropId(previousCrop);
  const normalizedRabi = resolveCropId(currentRotationRabi);
  const normalizedKharif1 = resolveCropId(currentRotationKharif1);
  const normalizedKharif2 = resolveCropId(currentRotationKharif2);

  const prevCropData = CROPS.find((c) => c.id === normalizedPrevious);
  const currCropData = CROPS.find((c) => c.id === normalizedCurrent);
  const rabiCropData = CROPS.find((c) => c.id === normalizedRabi);
  const kharif1CropData = CROPS.find((c) => c.id === normalizedKharif1);
  const kharif2CropData = CROPS.find((c) => c.id === normalizedKharif2);

  const renderGroupedOptions = (seasonFilter?: 'rabi' | 'kharif1' | 'kharif2') => (
    <>
      <optgroup label={isBn ? '── জমি অবস্থা ──' : '── Field Status ──'} className="bg-[#141414] text-[#A3A3A3]">
        <option value="fallow" className="bg-[#141414] text-[#FAFAFA]">
          {isBn ? 'পতিত / খালি জমি (Fallow / Bare)' : 'Field Empty / Fallow'}
        </option>
        <option value="other" className="bg-[#141414] text-[#FAFAFA]">
          {isBn ? 'অন্যান্য ফসল (Other)' : 'Other crop'}
        </option>
      </optgroup>
      {CROP_CATEGORIES.map((cat) => {
        let catCrops = CROPS.filter((c) => c.category_id === cat.id);
        if (seasonFilter) {
          catCrops = catCrops.filter(
            (c) => !c.seasons || c.seasons.length === 0 || c.seasons.includes(seasonFilter)
          );
        }
        if (catCrops.length === 0) return null;
        return (
          <optgroup key={cat.id} label={isBn ? cat.name_bn : cat.name_en} className="bg-[#141414] text-[#A3A3A3]">
            {catCrops.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#141414] text-[#FAFAFA]">
                {isBn ? c.name_bn : c.name_en} {c.is_legume ? (isBn ? ' [ডাল/নাইট্রোজেন]' : ' [Legume]') : ''}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#262626] pb-4">
        <h2 className="font-display text-lg font-semibold text-[#FAFAFA] flex items-center gap-2">
          <Sprout className="w-5 h-5 text-[#22C55E]" />
          <span>{isBn ? 'ফসলের ইতিহাস ও বর্তমান ফসল পরিক্রমা' : 'Crop History & Current Rotation'}</span>
        </h2>
        <p className="text-xs text-[#737373] mt-1 leading-relaxed">
          {isBn
            ? 'NASA ও BARI পরিক্রমা বিশ্লেষণের জন্য আপনার বর্তমান ৩-মৌসুমের ফসল পরিক্রমা এবং সাম্প্রতিক ফসলের তথ্য দিন।'
            : 'Enter your typical 3-season crop cycle and recent field history for NASA Field Shift evaluation.'}
        </p>
      </div>

      {/* NASA Field Shift Baseline: Current 3-Season Rotation */}
      <div className="p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#22C55E]" />
            <h3 className="font-mono text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
              {isBn ? 'আপনার বর্তমান বার্ষিক ফসল পরিক্রমা (৩ মৌসুম)' : 'Your Current Annual Crop Rotation (3 Seasons)'}
            </h3>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20">
            {isBn ? 'ফিল্ড শিফট বেসলাইন' : 'Field Shift Baseline'}
          </span>
        </div>
        <p className="text-xs text-[#A3A3A3] leading-relaxed">
          {isBn
            ? 'জমিতে সাধারণত প্রতি বছর কোন মৌসুমে কী চাষ করেন? (যদি কোনো মৌসুমে জমি খালি থাকে তবে "পতিত জমি" নির্বাচন করুন):'
            : 'What do you typically cultivate in your field each season? Select "Fallow" if left bare:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Rabi Season */}
          <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#262626] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-[#22C55E] uppercase">
                  {isBn ? '১. রবি (শীতকাল)' : '1. Rabi (Winter)'}
                </span>
                <span className="text-[10px] text-[#737373] font-mono">
                  {isBn ? 'নভেম্বর – ফেব্রু' : 'Nov – Feb'}
                </span>
              </div>
              <select
                value={normalizedRabi}
                onChange={(e) => onCurrentRotationRabiChange && onCurrentRotationRabiChange(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded bg-[#141414] border border-[#262626] text-[#FAFAFA] text-xs focus:border-[#22C55E] focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions('rabi')}
              </select>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#737373]">
              {rabiCropData ? (
                <span className="text-[#A3A3A3]">
                  {isBn ? 'গোত্র:' : 'Family:'} {FAMILY_LABEL[rabiCropData.family]?.en || rabiCropData.family}
                </span>
              ) : (
                <span className="text-amber-500/80">{isBn ? 'পতিত / অনাবাদী' : 'Fallow / Rest'}</span>
              )}
            </div>
          </div>

          {/* Kharif-1 Season */}
          <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#262626] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-[#22C55E] uppercase">
                  {isBn ? '২. খরিফ-১ (গ্রীষ্ম)' : '2. Kharif-1 (Summer)'}
                </span>
                <span className="text-[10px] text-[#737373] font-mono">
                  {isBn ? 'মার্চ – জুন' : 'Mar – Jun'}
                </span>
              </div>
              <select
                value={normalizedKharif1}
                onChange={(e) => onCurrentRotationKharif1Change && onCurrentRotationKharif1Change(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded bg-[#141414] border border-[#262626] text-[#FAFAFA] text-xs focus:border-[#22C55E] focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions('kharif1')}
              </select>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#737373]">
              {kharif1CropData ? (
                <span className="text-[#A3A3A3]">
                  {isBn ? 'গোত্র:' : 'Family:'} {FAMILY_LABEL[kharif1CropData.family]?.en || kharif1CropData.family}
                </span>
              ) : (
                <span className="text-amber-500/80">{isBn ? 'পতিত / অনাবাদী' : 'Fallow / Rest'}</span>
              )}
            </div>
          </div>

          {/* Kharif-2 Season */}
          <div className="p-3 rounded-lg bg-[#0A0A0A] border border-[#262626] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-mono font-bold text-[#22C55E] uppercase">
                  {isBn ? '৩. খরিফ-২ (বর্ষা)' : '3. Kharif-2 (Monsoon)'}
                </span>
                <span className="text-[10px] text-[#737373] font-mono">
                  {isBn ? 'জুলাই – অক্টো' : 'Jul – Oct'}
                </span>
              </div>
              <select
                value={normalizedKharif2}
                onChange={(e) => onCurrentRotationKharif2Change && onCurrentRotationKharif2Change(e.target.value)}
                className="w-full min-h-[40px] px-2.5 py-1.5 rounded bg-[#141414] border border-[#262626] text-[#FAFAFA] text-xs focus:border-[#22C55E] focus:outline-none cursor-pointer"
              >
                {renderGroupedOptions('kharif2')}
              </select>
            </div>
            <div className="mt-2 text-[10px] font-mono text-[#737373]">
              {kharif2CropData ? (
                <span className="text-[#A3A3A3]">
                  {isBn ? 'গোত্র:' : 'Family:'} {FAMILY_LABEL[kharif2CropData.family]?.en || kharif2CropData.family}
                </span>
              ) : (
                <span className="text-amber-500/80">{isBn ? 'পতিত / অনাবাদী' : 'Fallow / Rest'}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rotation Rule A Educational Banner */}
      <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-start gap-3">
        <RefreshCw className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-semibold text-[#FAFAFA] block font-mono">
            {isBn ? 'রুল-এ (Rule A: বোটানিক্যাল ফিল্টার)' : 'Rule A (Botanical Family Filter)'}
          </span>
          <p className="text-[#A3A3A3] leading-relaxed">
            {isBn
              ? 'পরপর দুই মৌসুমে একই গোত্রের ফসল (যেমন: আমন ধানের পর বোরো ধান) চাষ করলে রোগবালাইয়ের ঝুঁকি বাড়ে এবং মাটির নির্দিষ্ট পুষ্টি উপাদান দ্রুত হ্রাস পায়।'
              : 'Growing crops from the same botanical family consecutively increases pest susceptibility and accelerates specific soil nutrient exhaustion.'}
          </p>
        </div>
      </div>

      {/* Current and Previous Crop Inputs */}
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Current Crop */}
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'বর্তমানে জমিতে কী ফসল আছে?' : 'What is growing now?'} <span className="text-[#22C55E]">*</span>
          </label>
          <div className="relative">
            <Sprout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <select
              value={normalizedCurrent}
              onChange={(e) => onCurrentCropChange(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
            >
              {renderGroupedOptions()}
            </select>
          </div>
          {currCropData?.plant_family && (
            <p className="text-[11px] font-mono text-[#737373] mt-1 flex items-center gap-1">
              <span>{isBn ? 'গোত্র:' : 'Family:'}</span>
              <span className="font-medium text-[#A3A3A3]">{currCropData.plant_family}</span>
              <span>· {isBn ? FAMILY_LABEL[currCropData.plant_family]?.bn : FAMILY_LABEL[currCropData.plant_family]?.en}</span>
            </p>
          )}
          {errors?.currentCrop && (
            <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.currentCrop}</p>
          )}
        </div>

        {/* Previous Crop */}
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'গত মৌসুমে কী ফসল চাষ করেছিলেন?' : 'What did you grow last season?'} <span className="text-[#22C55E]">*</span>
          </label>
          <div className="relative">
            <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <select
              value={normalizedPrevious}
              onChange={(e) => onPreviousCropChange(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
            >
              {renderGroupedOptions()}
            </select>
          </div>
          {prevCropData?.plant_family && (
            <p className="text-[11px] font-mono text-[#737373] mt-1 flex items-center gap-1">
              <span>{isBn ? 'পরিক্রমায় পরিবার ফিল্টার হবে:' : 'Rotation will filter family:'}</span>
              <span className="font-medium text-[#22C55E]">{prevCropData.plant_family}</span>
              <span>({isBn ? FAMILY_LABEL[prevCropData.plant_family]?.bn : FAMILY_LABEL[prevCropData.plant_family]?.en})</span>
            </p>
          )}
          {errors?.previousCrop && (
            <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.previousCrop}</p>
          )}
        </div>
      </div>

      {/* Optional Farmer Constraints: Irrigation & Selling Purpose */}
      <div className="pt-4 mt-2 border-t border-[#262626]/70 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'সেচ পানির প্রাপ্যতা (ঐচ্ছিক)' : 'Irrigation Available? (Optional)'}
          </label>
          <select
            value={irrigationAvailability}
            onChange={(e) => onIrrigationAvailabilityChange?.(e.target.value as 'yes' | 'limited' | 'no')}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
          >
            <option value="yes" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'হ্যাঁ (পর্যাপ্ত সেচ সুবিধা আছে)' : 'Yes (Adequate irrigation available)'}
            </option>
            <option value="limited" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'সীমিত (দূরবর্তী বা ব্যয়বহুল সেচ)' : 'Limited (Scarce / high pump cost)'}
            </option>
            <option value="no" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'না (সম্পূর্ণ বৃষ্টির ওপর নির্ভরশীল)' : 'No (Rainfed only / no pump access)'}
            </option>
          </select>
          <p className="text-[11px] font-mono text-[#737373] mt-1">
            {isBn
              ? 'সেচ না থাকলে বোরো ইত্যাদি অতিরিক্ত পানি চাওয়া ফসলে নম্বর কমবে।'
              : 'Penalises high-water crops (Boro etc.) if irrigation is limited or absent.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'উৎপাদনের মূল উদ্দেশ্য (ঐচ্ছিক)' : 'Main Goal for Harvest? (Optional)'}
          </label>
          <select
            value={mainPurpose}
            onChange={(e) => onMainPurposeChange?.(e.target.value as 'home_food' | 'local_market' | 'both')}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
          >
            <option value="both" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'উভয়ই (পারিবারিক খাদ্য ও বিক্রি)' : 'Both (Home food & local market)'}
            </option>
            <option value="home_food" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'পারিবারিক খাবার (পুষ্টি ও খোরাকি)' : 'Home food (Family nutrition)'}
            </option>
            <option value="local_market" className="bg-[#141414] text-[#FAFAFA]">
              {isBn ? 'স্থানীয় বাজারে বিক্রি (নগদ আয়)' : 'Local market (Cash income)'}
            </option>
          </select>
          <p className="text-[11px] font-mono text-[#737373] mt-1">
            {isBn
              ? 'পরামর্শের ব্যাখ্যায় প্রাসঙ্গিক প্রেক্ষাপট হিসেবে ব্যবহৃত হয়।'
              : 'Used as agronomic advisory context without fake market pricing.'}
          </p>
        </div>
      </div>

      {/* Planned Next Crop (Only shown in Profile or when enabled) */}
      {showPlannedNext && onPlannedNextCropChange && (
        <div className="pt-2">
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'পরবর্তী সম্ভাব্য পরিকল্পিত ফসল (ঐচ্ছিক)' : 'Planned Next Crop (Optional)'}
          </label>
          <select
            value={plannedNextCrop || 'mustard'}
            onChange={(e) => onPlannedNextCropChange(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
          >
            {renderGroupedOptions()}
          </select>
        </div>
      )}
    </div>
  );
};
