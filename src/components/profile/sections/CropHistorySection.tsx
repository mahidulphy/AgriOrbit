import React from 'react';
import { Sprout, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { CROPS, FAMILY_LABEL, type Crop } from '../../../data/crops';

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

export const CROP_OPTIONS = [
  ...CROPS.map((c) => ({
    id: c.id,
    nameEn: c.nameEn,
    nameBn: c.nameBn,
    family: c.family,
    familyEn: FAMILY_LABEL[c.family]?.en || '',
    familyBn: FAMILY_LABEL[c.family]?.bn || '',
  })),
  {
    id: 'fallow',
    nameEn: 'Field was empty / Fallow',
    nameBn: 'জমি খালি ছিল (পতিত)',
    family: undefined,
    familyEn: 'No crop grown',
    familyBn: 'ফসল চাষ হয়নি',
  },
  {
    id: 'other',
    nameEn: 'Other crop',
    nameBn: 'অন্য ফসল (তালিকাবহির্ভূত)',
    family: undefined,
    familyEn: 'Non-catalog variety',
    familyBn: 'অন্যান্য জাত',
  },
];

export function resolveCropId(val: string): string {
  if (!val) return 'fallow';
  const lower = val.toLowerCase().trim();
  if (lower === 'fallow' || lower.includes('খালি') || lower.includes('পতিত') || lower.includes('preparing')) return 'fallow';
  if (lower === 'other' || lower.includes('অন্য')) return 'other';
  if (lower === 't. aman' || lower === 't_aman' || lower === 'aman' || lower.includes('আমন')) return 'aman';
  if (lower === 'boro' || lower.includes('বোরো')) return 'boro';
  if (lower === 'aus' || lower.includes('আউশ')) return 'aus';
  if (lower === 'wheat' || lower.includes('গম')) return 'wheat';
  if (lower === 'maize' || lower.includes('ভুট্টা')) return 'maize';
  if (lower === 'mustard' || lower.includes('সরিষা')) return 'mustard';
  if (lower === 'lentil' || lower.includes('মসুর')) return 'lentil';
  if (lower === 'potato' || lower.includes('আলু')) return 'potato';
  if (lower === 'mungbean' || lower.includes('মুগ')) return 'mungbean';
  if (lower === 'jute' || lower.includes('পাট')) return 'jute';
  return val;
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Sprout className="w-5 h-5 text-[#B8FF3D]" />
          <span>{isBn ? 'ফসলের ইতিহাস ও আবর্তন তথ্য' : 'Crop History & Rotation Sequence'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isBn
            ? 'বর্তমানে এবং পূর্বে চাষকৃত ফসলের তথ্য দিন। আমাদের আবর্তন অ্যালগরিদম একই গোত্রের ফসল পরপর চাষ রোধ করে মাটির উর্বরতা রক্ষা করবে।'
            : 'Tell us what is currently growing and what you grew last season. AgriOrbit rotation logic uses this to prevent soil depletion.'}
        </p>
      </div>

      {/* Rotation Rule A Educational Banner */}
      <div className="p-4 rounded-2xl bg-[#B8FF3D]/10 border border-[#B8FF3D]/30 flex items-start gap-3">
        <RefreshCw className="w-5 h-5 text-[#B8FF3D] flex-shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm space-y-1">
          <span className="font-bold text-[#B8FF3D] block font-mono">
            {isBn ? 'রুল-এ (Rule A: বোটানিক্যাল ফিল্টার)' : 'Rule A (Botanical Family Filter)'}
          </span>
          <p className="text-slate-300 leading-relaxed">
            {isBn
              ? 'পরপর দুই মৌসুমে একই গোত্রের ফসল (যেমন: আমন ধানের পর বোরো ধান) চাষ করলে রোগবালাইয়ের ঝুঁকি বাড়ে এবং মাটির নির্দিষ্ট পুষ্টি উপাদান দ্রুত হ্রাস পায়।'
              : 'Growing crops from the same botanical family consecutively increases pest susceptibility and accelerates specific soil nutrient exhaustion.'}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Current Crop */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'বর্তমানে জমিতে কী ফসল আছে?' : 'What is growing now?'} <span className="text-[#00E5FF]">*</span>
          </label>
          <div className="relative">
            <Sprout className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={normalizedCurrent}
              onChange={(e) => onCurrentCropChange(e.target.value)}
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-[#0B1626] border border-white/15 text-white text-base focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>
          {currCropData?.family && (
            <p className="text-[11px] font-mono text-[#00E5FF] mt-1.5 flex items-center gap-1">
              <span>{isBn ? 'গোত্র:' : 'Family:'}</span>
              <span className="font-semibold">{isBn ? currCropData.family : currCropData.family}</span>
              <span>· {isBn ? FAMILY_LABEL[currCropData.family]?.bn : FAMILY_LABEL[currCropData.family]?.en}</span>
            </p>
          )}
          {errors?.currentCrop && (
            <p className="text-xs text-red-400 mt-1 font-mono">{errors.currentCrop}</p>
          )}
        </div>

        {/* Previous Crop */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'গত মৌসুমে কী ফসল চাষ করেছিলেন?' : 'What did you grow last season?'} <span className="text-[#00E5FF]">*</span>
          </label>
          <div className="relative">
            <RefreshCw className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={normalizedPrevious}
              onChange={(e) => onPreviousCropChange(e.target.value)}
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-[#0B1626] border border-white/15 text-white text-base focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
            >
              {CROP_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {isBn ? c.nameBn : c.nameEn}
                </option>
              ))}
            </select>
          </div>
          {prevCropData?.family && (
            <p className="text-[11px] font-mono text-[#B8FF3D] mt-1.5 flex items-center gap-1">
              <span>{isBn ? 'আবর্তনে গোত্র ব্লক হবে:' : 'Rotation will filter family:'}</span>
              <span className="font-semibold">{isBn ? prevCropData.family : prevCropData.family}</span>
            </p>
          )}
          {errors?.previousCrop && (
            <p className="text-xs text-red-400 mt-1 font-mono">{errors.previousCrop}</p>
          )}
        </div>
      </div>

      {/* Planned Next Crop (Only shown in Profile or when enabled) */}
      {showPlannedNext && onPlannedNextCropChange && (
        <div className="pt-2">
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'পরবর্তী সম্ভাব্য পরিকল্পিত ফসল (ঐচ্ছিক)' : 'Planned Next Crop (Optional)'}
          </label>
          <select
            value={plannedNextCrop || 'mustard'}
            onChange={(e) => onPlannedNextCropChange(e.target.value)}
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#0B1626] border border-white/15 text-white text-base focus:border-[#00E5FF] focus:outline-none cursor-pointer"
          >
            {CROP_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {isBn ? c.nameBn : c.nameEn}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
