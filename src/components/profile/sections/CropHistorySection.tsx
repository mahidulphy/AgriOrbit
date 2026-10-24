import React from 'react';
import { Sprout, RefreshCw } from 'lucide-react';
import { CROPS, FAMILY_LABEL, resolveCropId as canonicalResolveCropId } from '../../../data/crops';
import { CROP_CATEGORIES } from '../../../data/cropCategories';

export interface CropHistorySectionProps {
  currentCrop: string;
  onCurrentCropChange: (val: string) => void;
  previousCrop: string;
  onPreviousCropChange: (val: string) => void;
  plannedNextCrop?: string;
  onPlannedNextCropChange?: (val: string) => void;
  isBn: boolean;
  showPlannedNext?: boolean;
  errors?: { currentCrop?: string; previousCrop?: string };
}

export function resolveCropId(val: string): string {
  if (!val) return 'fallow';
  const lower = val.toLowerCase().trim();
  if (lower === 'fallow' || lower.includes('খালি') || lower.includes('পতিত') || lower.includes('preparing')) return 'fallow';
  if (lower === 'other' || lower.includes('অন্য')) return 'other';
  return canonicalResolveCropId(val) || val;
}

export const CropHistorySection: React.FC<CropHistorySectionProps> = ({
  currentCrop,
  onCurrentCropChange,
  previousCrop,
  onPreviousCropChange,
  plannedNextCrop,
  onPlannedNextCropChange,
  isBn,
  showPlannedNext = false,
  errors,
}) => {
  const normalizedCurrent = resolveCropId(currentCrop);
  const normalizedPrevious = resolveCropId(previousCrop);

  const prevCropData = CROPS.find((c) => c.id === normalizedPrevious);
  const currCropData = CROPS.find((c) => c.id === normalizedCurrent);

  const renderGroupedOptions = () => (
    <>
      <optgroup label={isBn ? '── সাধারণ অবস্থা ──' : '── Field Status ──'} className="bg-[#141414] text-[#A3A3A3]">
        <option value="fallow" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'জমি খালি ছিল (পতিত)' : 'Field was empty / Fallow'}</option>
        <option value="other" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'অন্য ফসল (তালিকাবহির্ভূত)' : 'Other crop'}</option>
      </optgroup>
      {CROP_CATEGORIES.map((cat) => {
        const catCrops = CROPS.filter((c) => c.category_id === cat.id);
        return (
          <optgroup key={cat.id} label={isBn ? cat.name_bn : cat.name_en} className="bg-[#141414] text-[#A3A3A3]">
            {catCrops.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#141414] text-[#FAFAFA]">
                {isBn ? c.name_bn : c.name_en}
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
          <span>{isBn ? 'ফসলের ইতিহাস ও আবর্তন তথ্য' : 'Crop History & Rotation Sequence'}</span>
        </h2>
        <p className="text-xs text-[#737373] mt-1">
          {isBn
            ? 'বর্তমানে এবং পূর্বে চাষকৃত ফসলের তথ্য দিন। আমাদের আবর্তন অ্যালগরিদম একই গোত্রের ফসল পরপর চাষ রোধ করে মাটির উর্বরতা রক্ষা করবে।'
            : 'Tell us what is currently growing and what you grew last season. AgriOrbit rotation logic uses this to prevent soil depletion.'}
        </p>
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
              <span>{isBn ? 'আবর্তনে গোত্র ফিল্টার হবে:' : 'Rotation will filter family:'}</span>
              <span className="font-medium text-[#22C55E]">{prevCropData.plant_family}</span>
              <span>({isBn ? FAMILY_LABEL[prevCropData.plant_family]?.bn : FAMILY_LABEL[prevCropData.plant_family]?.en})</span>
            </p>
          )}
          {errors?.previousCrop && (
            <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.previousCrop}</p>
          )}
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
