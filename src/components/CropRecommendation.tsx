import React, { useState } from 'react';
import { ArrowRight, Calendar, Droplets } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { getRankedCrops, SeasonFilter } from '../lib/cropSuitability';
import { Eyebrow, Meter, TierBadge } from './ui';

interface CropRecommendationProps {
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
}

const SEASONS: SeasonFilter[] = ['All', 'Rabi', 'Kharif-1', 'Kharif-2'];

export const CropRecommendation: React.FC<CropRecommendationProps> = ({
  selectedPriority,
  secondaryPriority = null,
  language,
  onExplainCrop,
}) => {
  const [filterSeason, setFilterSeason] = useState<SeasonFilter>('All');

  const displayedCrops = getRankedCrops(selectedPriority, secondaryPriority, filterSeason);

  return (
    <section id="crops-section">
      <Eyebrow tone="lime">
        Step 4 · {language === 'en' ? 'Crop suitability' : 'ফসল উপযোগিতা'}
      </Eyebrow>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-2">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {language === 'en' ? 'What suits this field, ranked' : 'এই জমিতে কী মানানসই, ক্রমানুসারে'}
        </h2>
        <div className="flex gap-4 text-sm font-medium border-b border-white/10 self-start" role="tablist">
          {SEASONS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={filterSeason === s}
              onClick={() => setFilterSeason(s)}
              className={`pb-2 transition cursor-pointer whitespace-nowrap border-b-2 -mb-px ${
                filterSeason === s
                  ? 'border-[#B8FF3D] text-white font-semibold'
                  : 'border-transparent text-[#8FA3B8] hover:text-white'
              }`}
            >
              {s === 'All' ? (language === 'en' ? 'All (10)' : 'সকল') : s === 'Rabi' ? (language === 'en' ? 'Rabi' : 'রবি') : s}
            </button>
          ))}
        </div>
      </div>

      <ol className="mt-6 border-t border-white/10">
        {displayedCrops.map((crop, rank) => (
          <li key={crop.id} className="grid sm:grid-cols-[auto_1fr_auto] gap-x-6 gap-y-3 py-5 border-b border-white/10">
            <span className="tnum text-sm font-semibold text-[#8FA3B8] pt-1 hidden sm:block">
              {String(rank + 1).padStart(2, '0')}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h3 className="font-bold text-white">
                  {language === 'en' ? crop.nameEn : crop.nameBn}
                </h3>
                <TierBadge tier={crop.suitabilityTier} language={language} />
                <span className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                  {language === 'en' ? crop.seasonEn : crop.seasonBn}
                </span>
              </div>
              <p className="text-sm text-[#8FA3B8] mt-1 leading-relaxed max-w-2xl">
                {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
              </p>
              <p className="tnum flex flex-wrap gap-x-4 gap-y-0.5 mt-2 text-xs text-[#8FA3B8]">
                <span className="inline-flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#00E5FF]" />
                  {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn} ·{' '}
                  {language === 'en' ? crop.waterDetailEn : crop.waterDetailBn}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-[#8FA3B8]" />
                  {crop.durationDays} {language === 'en' ? 'days' : 'দিন'}
                </span>
                <span className="italic">{crop.scientificName}</span>
              </p>
            </div>
            <div className="sm:w-36 sm:text-right shrink-0">
              <p className="tnum text-2xl font-bold tracking-tight">
                {crop.suitabilityScore}
                <span className="text-xs font-medium text-[#8FA3B8]">%</span>
              </p>
              <Meter value={crop.suitabilityScore} tone={crop.suitabilityTier === 'moderate' ? 'cyan' : 'lime'} className="mt-1.5 sm:ml-auto sm:max-w-28" />
              <button
                onClick={() => onExplainCrop(crop)}
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#00E5FF] hover:text-white transition cursor-pointer"
              >
                {language === 'en' ? 'Explain why' : 'কেন দেখুন'}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
