import React, { useState } from 'react';
import { HelpCircle, Check, Droplets, Calendar, Sparkles, Filter } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { getRankedCrops, SeasonFilter } from '../lib/cropSuitability';

interface CropRecommendationProps {
  selectedPriority: FarmerPriorityId;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
}

export const CropRecommendation: React.FC<CropRecommendationProps> = ({
  selectedPriority,
  language,
  onExplainCrop,
}) => {
  const [filterSeason, setFilterSeason] = useState<SeasonFilter>('All');

  const displayedCrops = getRankedCrops(selectedPriority, filterSeason);

  return (
    <section id="crops-section" className="py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#A855F7] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Step 4 • {language === 'en' ? 'Crop Suitability Evaluation' : 'ফসল উপযোগিতা মূল্যায়ন'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              {language === 'en' ? 'Rule-Based Crop Compatibility' : '১০টি প্রধান ফসলের উপযোগিতা তালিকা'}
            </h2>
          </div>

          {/* Season Filter Chips */}
          <div className="flex items-center gap-1.5 bg-[#3B0764] p-1 rounded-xl border border-[#6D28D9]/40 text-xs">
            <span className="text-[#E9D5FF]/60 px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span className="hidden sm:inline">{language === 'en' ? 'Season:' : 'মৌসুম:'}</span>
            </span>
            {(['All', 'Rabi', 'Kharif-1', 'Kharif-2'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterSeason(s)}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                  filterSeason === s
                    ? 'bg-[#A855F7] text-white shadow'
                    : 'text-[#E9D5FF]/70 hover:text-white'
                }`}
              >
                {s === 'All' && (language === 'en' ? 'All (10)' : 'সকল')}
                {s === 'Rabi' && (language === 'en' ? 'Rabi (রবি)' : 'রবি')}
                {s === 'Kharif-1' && (language === 'en' ? 'Kharif-1 (খ-১)' : 'খরিফ-১')}
                {s === 'Kharif-2' && (language === 'en' ? 'Kharif-2 (খ-২)' : 'খরিফ-২')}
              </button>
            ))}
          </div>
        </div>

        {/* Crops Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {displayedCrops.map((crop) => {
            const isHigh = crop.suitabilityTier === 'high';
            const isMod = crop.suitabilityTier === 'moderate';

            return (
              <div
                key={crop.id}
                className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                  isHigh
                    ? 'bg-[#3B0764]/80 border-emerald-500/50 shadow-lg shadow-emerald-950/20'
                    : isMod
                    ? 'bg-[#3B0764]/60 border-amber-500/40'
                    : 'bg-[#2E1065]/60 border-slate-700/50 opacity-80'
                }`}
              >
                <div>
                  {/* Top Bar: Name & Suitability Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-black text-white">
                          {language === 'en' ? crop.nameEn : crop.nameBn}
                        </h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-[#6D28D9]/70 text-[#E9D5FF] border border-[#A855F7]/30">
                          {language === 'en' ? crop.seasonEn : crop.seasonBn}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E9D5FF]/60 italic font-serif">
                        {crop.scientificName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black shadow-sm ${
                        isHigh
                          ? 'bg-emerald-500 text-slate-950'
                          : isMod
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-700 text-slate-300'
                      }`}>
                        {isHigh && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        <span>{crop.suitabilityScore}% Match</span>
                      </div>
                      <span className="block text-[10px] text-[#E9D5FF]/70 mt-0.5 font-medium">
                        {isHigh
                          ? (language === 'en' ? 'Highly Suitable' : 'উচ্চ উপযোগী')
                          : isMod
                          ? (language === 'en' ? 'Moderately Suitable' : 'মাঝারি উপযোগী')
                          : (language === 'en' ? 'Marginal / High Input' : 'কম উপযোগী / বাড়তি খরচ')}
                      </span>
                    </div>
                  </div>

                  {/* Why it is suitable (Explicit User Requirement) */}
                  <div className="p-3 rounded-xl bg-[#2E1065]/90 border border-[#6D28D9]/30 mb-3 text-xs leading-relaxed text-[#E9D5FF]/90">
                    <strong className="text-white block mb-0.5">
                      {language === 'en' ? 'Why Suitable:' : 'উপযোগিতার কারণ:'}
                    </strong>
                    {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
                  </div>

                  {/* Compact Metrics Pill Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs mb-4">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#3B0764] border border-[#6D28D9]/20 text-[#E9D5FF]/80">
                      <Droplets className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#E9D5FF]/60 block leading-tight">
                          {language === 'en' ? 'Water Requirement' : 'পানির চাহিদা'}
                        </span>
                        <span className="font-semibold text-white">
                          {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#3B0764] border border-[#6D28D9]/20 text-[#E9D5FF]/80">
                      <Calendar className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <div>
                        <span className="text-[10px] text-[#E9D5FF]/60 block leading-tight">
                          {language === 'en' ? 'Crop Duration' : 'জীবনকাল'}
                        </span>
                        <span className="font-semibold text-white">
                          {crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* "Explain Why" Button (Transparent Rule Breakdown Trigger) */}
                <button
                  onClick={() => onExplainCrop(crop)}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#6D28D9]/50 hover:bg-[#6D28D9] border border-[#A855F7]/40 text-[#E9D5FF] hover:text-white font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#A855F7]" />
                  <span>
                    {language === 'en'
                      ? `Explain Why: ${crop.nameEn.split(' ')[0]} →`
                      : `কেন এই ফসল? যৌক্তিক বিশ্লেষণ →`}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
