import React, { useState } from 'react';
import { HelpCircle, Droplets, Calendar, Filter, ArrowUpRight, Check, AlertCircle } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { getRankedCrops, SeasonFilter } from '../lib/cropSuitability';

interface CropRecommendationProps {
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
}

export const CropRecommendation: React.FC<CropRecommendationProps> = ({
  selectedPriority,
  secondaryPriority = null,
  language,
  onExplainCrop,
}) => {
  const [filterSeason, setFilterSeason] = useState<SeasonFilter>('All');
  const displayedCrops = getRankedCrops(selectedPriority, secondaryPriority, filterSeason);

  return (
    <section id="crops-section" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Section Editorial Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-2">
              <span>03</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'CROP COMPATIBILITY EVALUATION' : 'ফসল উপযোগিতা মূল্যায়ন'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {language === 'en' ? 'Rule-Based Crop Compatibility' : '১০টি প্রধান ফসলের উপযোগিতা মূল্যায়ন'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1 max-w-xl">
              {language === 'en'
                ? 'Scores computed by deterministic agronomic rules matching current NASA observation levels and your selected priorities.'
                : 'নাসার উপগ্রহ উপাত্ত এবং আপনার পছন্দের লক্ষ্যের সাথে মিলিয়ে তৈরি করা উপযোগিতা স্কোর।'}
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
                {s === 'All' && (language === 'en' ? 'All (10)' : 'সকল')}
                {s === 'Rabi' && (language === 'en' ? 'Rabi' : 'রবি')}
                {s === 'Kharif-1' && (language === 'en' ? 'Kharif-1' : 'খরিফ-১')}
                {s === 'Kharif-2' && (language === 'en' ? 'Kharif-2' : 'খরিফ-২')}
              </button>
            ))}
          </div>
        </div>

        {/* Crop Comparison Visual List */}
        <div className="space-y-4">
          {displayedCrops.map((crop) => {
            const isHigh = crop.suitabilityTier === 'high';
            const isMod = crop.suitabilityTier === 'moderate';

            const tierLabel = isHigh
              ? (language === 'en' ? 'High suitability' : 'উচ্চ উপযোগিতা')
              : isMod
              ? (language === 'en' ? 'Moderate suitability' : 'মাঝারি উপযোগিতা')
              : (language === 'en' ? 'Lower suitability' : 'কম উপযোগিতা');

            const barColor = isHigh
              ? 'bg-[#B8FF3D]'
              : isMod
              ? 'bg-[#00E5FF]'
              : 'bg-[#FF5C5C]/80';

            return (
              <div
                key={crop.id}
                className={`p-6 rounded-2xl bg-[#0B1626] border transition-all ${
                  isHigh
                    ? 'border-[#B8FF3D]/40 hover:border-[#B8FF3D]'
                    : isMod
                    ? 'border-white/10 hover:border-[#00E5FF]/40'
                    : 'border-white/5 opacity-85 hover:opacity-100'
                }`}
              >
                {/* Header Row: Title, Season, Score */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-baseline gap-3">
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

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="font-mono text-2xl font-bold text-white">
                          {crop.suitabilityScore}%
                        </span>
                      </div>
                      <span className={`text-[10px] uppercase font-mono font-bold tracking-wider ${
                        isHigh ? 'text-[#B8FF3D]' : isMod ? 'text-[#00E5FF]' : 'text-[#FF5C5C]'
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-white/5 text-xs text-[#8FA3B8]">
                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#8FA3B8] mb-0.5">
                      {language === 'en' ? 'Water Requirement' : 'পানির চাহিদা'}
                    </span>
                    <span className="font-bold text-white">
                      {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}
                    </span>
                    <span className="block text-[11px] text-[#8FA3B8] mt-0.5">
                      {language === 'en' ? crop.waterDetailEn : crop.waterDetailBn}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#8FA3B8] mb-0.5">
                      {language === 'en' ? 'Growth Duration' : 'সময়কাল'}
                    </span>
                    <span className="font-mono text-white font-bold">
                      {crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}
                    </span>
                    <span className="block text-[11px] text-[#8FA3B8] mt-0.5">
                      {language === 'en' ? 'From seeding to harvest' : 'বপন থেকে কর্তন পর্যন্ত'}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[10px] uppercase font-mono text-[#8FA3B8] mb-0.5">
                      {language === 'en' ? 'Agronomic Fit' : 'প্রধান সুবিধা'}
                    </span>
                    <p className="text-[11px] text-[#8FA3B8] leading-relaxed">
                      {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
