import React, { useState } from 'react';
import {
  Droplets,
  ArrowUpRight,
  AlertCircle,
  SunDim,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { getRankedCrops, SeasonFilter, type TelemetryContext } from '../lib/cropSuitability';
import { cropById } from '../data/crops';

interface CropRecommendationProps {
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
  telemetry?: TelemetryContext;
}

export const CropRecommendation: React.FC<CropRecommendationProps> = ({
  selectedPriority,
  secondaryPriority = null,
  language,
  onExplainCrop,
  telemetry,
}) => {
  const [filterSeason, setFilterSeason] = useState<SeasonFilter>('All');
  const [showAllCrops, setShowAllCrops] = useState(false);

  const displayedCrops = getRankedCrops(selectedPriority, secondaryPriority, filterSeason, telemetry);
  const topThreeCrops = displayedCrops.slice(0, 3);
  const remainingCrops = displayedCrops.slice(3);

  const isDry =
    telemetry?.rainfall30d !== undefined &&
    telemetry?.soilMoisture !== undefined &&
    telemetry.rainfall30d < 50 &&
    telemetry.soilMoisture !== null && telemetry.soilMoisture < 0.15;
  const isOptimalSowing =
    telemetry?.soilMoisture !== undefined &&
    telemetry.soilMoisture !== null && telemetry.soilMoisture >= 0.25 &&
    telemetry.soilMoisture <= 0.30;
  const isHot =
    telemetry?.maxTemp !== undefined &&
    telemetry.maxTemp > 35;

  const renderCropCard = (crop: CropData, index: number, isTopThree: boolean) => {
    const isHigh = crop.suitabilityTier === 'high';
    const isMod = crop.suitabilityTier === 'moderate';

    const tierLabel = crop.notEnoughData
      ? (language === 'en' ? 'Not enough data' : 'পর্যাপ্ত তথ্য নেই')
      : isHigh
      ? (language === 'en' ? 'High suitability' : 'চাষের উপযোগী')
      : isMod
      ? (language === 'en' ? 'Moderate suitability' : 'মাঝারি উপযোগী')
      : (language === 'en' ? 'Lower suitability' : 'কম উপযোগী');

    const barColor = crop.notEnoughData
      ? 'bg-[#737373]'
      : isHigh
      ? 'bg-[#22C55E]'
      : isMod
      ? 'bg-[#FAFAFA]'
      : 'bg-[#EF4444]';

    // Contextual Badges
    const showWaterSaver = isDry && crop.waterRequirementEn === 'Low';
    const showWaterPenalty = isDry && (crop.waterRequirementEn === 'High' || crop.id === 'boro_rice');
    const showOptimalSowing = isOptimalSowing && (crop.suitabilityScore >= 80);
    const showHeatStress = isHot && (crop.id === 'wheat' || crop.id === 'potato');
    const isEstimated = cropById(crop.id)?.data_confidence === 'estimated';

    return (
      <div
        key={crop.id}
        className={`p-5 sm:p-6 rounded-xl bg-[#141414] border transition-colors ${
          isTopThree
            ? 'border-[#262626] hover:border-[#404040]'
            : isHigh
            ? 'border-[#262626] hover:border-[#404040]'
            : 'border-[#262626] opacity-90 hover:opacity-100 hover:border-[#404040]'
        }`}
      >
        {/* Header Row: Title, Season, Score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3.5">
          <div>
            <div className="flex flex-wrap items-baseline gap-2.5 mb-1.5">
              {isTopThree && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-[#0A0A0A] text-[#FAFAFA] border border-[#262626]">
                  <Award className="w-3 h-3 text-[#22C55E]" />
                  {language === 'en' ? `#${index + 1} Top Choice` : `#${index + 1} শীর্ষ প্রস্তাবনা`}
                </span>
              )}
              <h3 className="font-display text-lg sm:text-xl font-semibold text-[#FAFAFA] tracking-tight">
                {language === 'en' ? crop.nameEn : crop.nameBn}
              </h3>
              <span className="text-xs text-[#737373] font-mono">
                {language === 'en' ? crop.seasonEn : crop.seasonBn}
              </span>
              <span className="text-xs text-[#737373] italic">
                ({crop.scientificName})
              </span>
            </div>

            {/* Rule Trigger Badges (max 1 or 2 small ones) */}
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              {isEstimated && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'en' ? 'Estimated' : 'আনুমানিক'}
                </span>
              )}
              {showWaterSaver && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                  <Droplets className="w-3 h-3" />
                  {language === 'en' ? 'Dry-Resilient' : 'কম পানিতে টিকে'}
                </span>
              )}
              {showWaterPenalty && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'en' ? 'Water Deficit' : 'পানির ঘাটতি'}
                </span>
              )}
              {showOptimalSowing && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#0A0A0A] text-[#FAFAFA] border border-[#262626]">
                  {language === 'en' ? 'Optimal Sowing' : 'বপনের উপযুক্ত রস'}
                </span>
              )}
              {showHeatStress && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                  <SunDim className="w-3 h-3" />
                  {language === 'en' ? 'Heat Sensitive' : 'গরম সংবেদনশীল'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-mono text-xl font-semibold text-[#FAFAFA]">
                  {crop.notEnoughData ? (language === 'en' ? 'N/A' : 'তথ্য নেই') : `${crop.suitabilityScore}%`}
                </span>
              </div>
              <span className={`text-[10px] uppercase font-mono font-medium tracking-wider ${
                crop.notEnoughData ? 'text-[#737373]' : isHigh ? 'text-[#22C55E]' : 'text-[#A3A3A3]'
              }`}>
                {tierLabel}
              </span>
            </div>

            <button
              onClick={() => onExplainCrop(crop)}
              className="px-3 py-1.5 rounded-lg bg-[#0A0A0A] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono font-medium text-[#FAFAFA] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Explain' : 'কারণ দেখুন'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#22C55E]" />
            </button>
          </div>
        </div>

        {/* Visual Suitability Bar */}
        <div className="w-full bg-[#0A0A0A] h-1.5 rounded-full overflow-hidden mb-3.5 border border-[#262626]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${crop.suitabilityScore}%` }}
          />
        </div>

        {/* Reasons & Supporting Data Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#262626] text-xs text-[#A3A3A3]">
          <div>
            <span className="block text-[10px] uppercase font-mono text-[#737373] font-medium mb-0.5">
              {language === 'en' ? 'Water Requirement' : 'পানির চাহিদা'}
            </span>
            <span className="font-medium text-[#FAFAFA]">
              {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}
            </span>
            <span className="block text-xs text-[#737373] mt-0.5">
              {language === 'en' ? crop.waterDetailEn : crop.waterDetailBn}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-mono text-[#737373] font-medium mb-0.5">
              {language === 'en' ? 'Growth Duration' : 'সময়কাল'}
            </span>
            <span className="font-mono text-[#FAFAFA] font-medium">
              {crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}
            </span>
            <span className="block text-xs text-[#737373] mt-0.5">
              {language === 'en' ? 'From seeding to harvest' : 'বীজ বোনা থেকে ফসল তোলা'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-mono text-[#737373] font-medium mb-0.5">
              {language === 'en' ? 'Agronomic Fit' : 'প্রধান সুবিধা'}
            </span>
            <p className="text-xs text-[#A3A3A3] leading-relaxed line-clamp-2">
              {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="crops-section" className="py-6 sm:py-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <span className="text-xs uppercase tracking-wider text-[#737373] font-mono font-medium block mb-1.5">
              {language === 'en' ? 'CROP EVALUATION' : 'ফসল মূল্যায়ন'}
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-[#FAFAFA] tracking-tight">
              {language === 'en' ? 'Data-Driven Crop Compatibility' : `${displayedCrops.length}টি ফসলের সম্ভাবনা`}
            </h2>
            <p className="text-xs text-[#737373] mt-1 max-w-xl">
              {language === 'en'
                ? 'Scores computed by deterministic agronomic rules reacting to NASA weather and soil observations.'
                : 'নাসার আবহাওয়া ও মাটির রসের তথ্য এবং আপনার চাহিদার ওপর ভিত্তি করে এই সম্ভাবনা হিসাব করা হয়েছে।'} 
            </p>
          </div>

          {/* Season Filter Tabs */}
          <div className="p-1 rounded-lg bg-[#0A0A0A] border border-[#262626] flex items-center gap-1 text-xs self-start sm:self-auto">
            {(['All', 'Rabi', 'Kharif-1', 'Kharif-2'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeason(s)}
                className={`px-3 py-1.5 rounded-md font-mono text-xs transition-colors cursor-pointer whitespace-nowrap ${
                  filterSeason === s
                    ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium'
                    : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                }`}
              >
                {s === 'All' && (language === 'en' ? `All (${displayedCrops.length})` : `সব (${displayedCrops.length})`)}
                {s === 'Rabi' && (language === 'en' ? 'Rabi' : 'রবি')}
                {s === 'Kharif-1' && (language === 'en' ? 'Kharif-1' : 'খরিফ-১')}
                {s === 'Kharif-2' && (language === 'en' ? 'Kharif-2' : 'খরিফ-২')}
              </button>
            ))}
          </div>
        </div>

        {/* Top 3 Crops Display */}
        <div className="space-y-3.5 mb-5">
          <div className="flex items-center justify-between text-xs font-mono text-[#737373] px-1">
            <span>
              {language === 'en'
                ? `Showing Top 3 Recommended Crops (${filterSeason} Season)`
                : `সেরা ৩টি প্রস্তাবিত ফসল (${filterSeason === 'All' ? 'সব মৌসুম' : filterSeason})`}
            </span>
            <span className="text-[#FAFAFA] font-medium">
              {topThreeCrops.length} {language === 'en' ? 'Matches' : 'টি ফসল'}
            </span>
          </div>

          {topThreeCrops.map((crop, idx) => renderCropCard(crop, idx, true))}
        </div>

        {/* Expandable Remaining Crops Section */}
        {remainingCrops.length > 0 && (
          <div className="pt-2">
            {showAllCrops && (
              <div className="space-y-3.5 mb-5 animate-fadeIn">
                <div className="text-xs font-mono text-[#737373] px-1">
                  {language === 'en'
                    ? `Additional Evaluated Crops (${remainingCrops.length} remaining)`
                    : `অন্যান্য ফসল (${remainingCrops.length}টি বাকি)`}
                </div>
                {remainingCrops.map((crop, idx) => renderCropCard(crop, idx + 3, false))}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllCrops(!showAllCrops)}
                className="px-5 py-2.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono font-medium text-[#FAFAFA] transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>
                  {showAllCrops
                    ? (language === 'en' ? 'Collapse to Top 3 Crops ↑' : 'শুধু সেরা ৩টি ফসল দেখুন ↑')
                    : (language === 'en'
                        ? `View All Evaluated Crops (${remainingCrops.length} More) ↓`
                        : `সব ফসল দেখুন (আরও ${remainingCrops.length}টি) ↓`)}
                </span>
                {showAllCrops ? (
                  <ChevronUp className="w-4 h-4 text-[#737373]" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#737373]" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
