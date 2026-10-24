import React, { useState } from 'react';
import {
  HelpCircle,
  Droplets,
  Calendar,
  Filter,
  ArrowUpRight,
  Check,
  AlertCircle,
  Sparkles,
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
      ? 'bg-slate-600'
      : isHigh
      ? 'bg-[#B8FF3D]'
      : isMod
      ? 'bg-[#00E5FF]'
      : 'bg-[#FF5C5C]/80';

    // Contextual NASA Badges
    const showWaterSaver = isDry && crop.waterRequirementEn === 'Low';
    const showWaterPenalty = isDry && (crop.waterRequirementEn === 'High' || crop.id === 'boro_rice');
    const showOptimalSowing = isOptimalSowing && (crop.suitabilityScore >= 80);
    const showHeatStress = isHot && (crop.id === 'wheat' || crop.id === 'potato');
    const isEstimated = cropById(crop.id)?.data_confidence === 'estimated';

    return (
      <div
        key={crop.id}
        className={`p-6 rounded-2xl bg-[#0B1626] border transition-all ${
          isTopThree
            ? 'border-[#B8FF3D]/40 shadow-lg shadow-black/40 hover:border-[#B8FF3D]'
            : isHigh
            ? 'border-[#B8FF3D]/30 hover:border-[#B8FF3D]'
            : isMod
            ? 'border-white/10 hover:border-[#00E5FF]/40'
            : 'border-white/5 opacity-85 hover:opacity-100'
        }`}
      >
        {/* Header Row: Title, Season, Score */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex flex-wrap items-baseline gap-3 mb-1.5">
              {isTopThree && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30">
                  <Award className="w-3 h-3" />
                  {language === 'en' ? `#${index + 1} Top Recommendation` : `#${index + 1} শীর্ষ প্রস্তাবনা`}
                </span>
              )}
              <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                {language === 'en' ? crop.nameEn : crop.nameBn}
              </h3>
              <span className="text-xs text-[#8FA3B8] font-mono">
                {language === 'en' ? crop.seasonEn : crop.seasonBn}
              </span>
              <span className="text-xs text-[#8FA3B8] italic font-serif">
                ({crop.scientificName})
              </span>
            </div>

            {/* Dynamic Rule Trigger Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {isEstimated && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'en' ? 'Estimated data' : 'আনুমানিক তথ্য'}
                </span>
              )}
              {showWaterSaver && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30">
                  <Droplets className="w-3 h-3" />
                  {language === 'en' ? 'Dry-Resilient (+4)' : 'কম পানিতে টিকে থাকে (+৪)'}
                </span>
              )}
              {showWaterPenalty && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30">
                  <AlertCircle className="w-3 h-3" />
                  {language === 'en' ? 'Water Deficit Penalty (-20)' : 'পানির অভাবে ২০ নম্বর কাটা'}
                </span>
              )}
              {showOptimalSowing && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                  <Sparkles className="w-3 h-3" />
                  {language === 'en' ? 'Optimal Sowing Moisture' : 'বীজ বোনার উপযুক্ত রস'}
                </span>
              )}
              {showHeatStress && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-amber-400/10 text-amber-300 border border-amber-400/30">
                  <SunDim className="w-3 h-3" />
                  {language === 'en' ? 'Heat Sensitive (-10)' : 'গরম সহ্য করতে পারে না (-১০)'}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right">
              <div className="flex items-baseline justify-end gap-1.5">
                <span className="font-mono text-2xl font-bold text-white">
                  {crop.notEnoughData ? (language === 'en' ? 'Not enough data' : 'পর্যাপ্ত তথ্য নেই') : `${crop.suitabilityScore}%`}
                </span>
              </div>
              <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                crop.notEnoughData ? 'text-amber-400' : isHigh ? 'text-[#B8FF3D]' : isMod ? 'text-[#00E5FF]' : 'text-[#FF5C5C]'
              }`}>
                {tierLabel}
              </span>
            </div>

            <button
              onClick={() => onExplainCrop(crop)}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>{language === 'en' ? 'Explain Why' : 'কারণ দেখুন'}</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#B8FF3D]" />
            </button>
          </div>
        </div>

        {/* Progress Bar (Visual Suitability Scale) */}
        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-4">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${crop.suitabilityScore}%` }}
          />
        </div>

        {/* Reasons & Supporting Data Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5 text-xs text-slate-300">
          <div>
            <span className="block text-[10px] uppercase font-mono text-slate-400 font-medium mb-0.5">
              {language === 'en' ? 'Water Requirement' : 'পানির চাহিদা'}
            </span>
            <span className="font-bold text-white">
              {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}
            </span>
            <span className="block text-xs text-slate-300 mt-0.5">
              {language === 'en' ? crop.waterDetailEn : crop.waterDetailBn}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-mono text-slate-400 font-medium mb-0.5">
              {language === 'en' ? 'Growth Duration' : 'সময়কাল'}
            </span>
            <span className="font-mono text-white font-bold">
              {crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}
            </span>
            <span className="block text-xs text-slate-300 mt-0.5">
              {language === 'en' ? 'From seeding to harvest' : 'বীজ বোনা থেকে ফসল তোলা'}
            </span>
          </div>

          <div>
            <span className="block text-[10px] uppercase font-mono text-slate-400 font-medium mb-0.5">
              {language === 'en' ? 'Agronomic Fit' : 'প্রধান সুবিধা'}
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <section id="crops-section" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-2">
              <span>03</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'CROP COMPATIBILITY EVALUATION' : 'কোন ফসল কেমন হবে'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {language === 'en' ? 'NASA Data-Driven Crop Compatibility' : `${displayedCrops.length}টি ফসলের চাষের সম্ভাবনা`}
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1 max-w-xl">
              {language === 'en'
                ? 'Scores computed by deterministic agronomic rules reacting to NASA POWER weather (live) and NASA SMAP/MODIS observations (dated), and your priorities.'
                : 'নাসার আবহাওয়া ও মাটির রসের তথ্য এবং আপনার চাহিদার ওপর ভিত্তি করে এই সম্ভাবনা হিসাব করা হয়েছে।'} 
            </p>
          </div>

          {/* Season Filter Tabs */}
          <div className="p-1 rounded-xl bg-[#0B1626] border border-white/10 flex items-center gap-1 text-xs self-start sm:self-auto">
            <span className="text-[#8FA3B8] px-2 text-[11px] font-mono hidden md:inline">
              {language === 'en' ? 'Season' : 'মৌসুম'}:
            </span>
            {(['All', 'Rabi', 'Kharif-1', 'Kharif-2'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeason(s)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  filterSeason === s
                    ? 'bg-[#B8FF3D] text-[#050B14]'
                    : 'text-[#8FA3B8] hover:text-white'
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
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-[#8FA3B8] px-1">
            <span>
              {language === 'en'
                ? `Showing Top 3 Recommended Crops (${filterSeason} Season)`
                : `সেরা ৩টি প্রস্তাবিত ফসল (${filterSeason === 'All' ? 'সব মৌসুম' : filterSeason})`}
            </span>
            <span className="text-[#B8FF3D] font-bold">
              {topThreeCrops.length} {language === 'en' ? 'Primary Matches' : 'টি সেরা ফসল'}
            </span>
          </div>

          {topThreeCrops.map((crop, idx) => renderCropCard(crop, idx, true))}
        </div>

        {/* Expandable Remaining Crops Section */}
        {remainingCrops.length > 0 && (
          <div className="pt-2">
            {showAllCrops && (
              <div className="space-y-4 mb-6 animate-fadeIn">
                <div className="text-xs font-mono text-[#8FA3B8] px-1">
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
                className="px-6 py-3 rounded-2xl bg-[#0B1626] hover:bg-white/10 border border-white/10 hover:border-[#B8FF3D]/50 text-xs font-mono font-bold text-white transition-all flex items-center gap-2 cursor-pointer shadow-lg group"
              >
                <span>
                  {showAllCrops
                    ? (language === 'en' ? 'Collapse to Top 3 Crops ↑' : 'শুধু সেরা ৩টি ফসল দেখুন ↑')
                    : (language === 'en'
                        ? `View All Evaluated Crops (${remainingCrops.length} More) ↓`
                        : `সব ফসল দেখুন (আরও ${remainingCrops.length}টি) ↓`)}
                </span>
                {showAllCrops ? (
                  <ChevronUp className="w-4 h-4 text-[#B8FF3D] group-hover:-translate-y-0.5 transition-transform" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#B8FF3D] group-hover:translate-y-0.5 transition-transform" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
