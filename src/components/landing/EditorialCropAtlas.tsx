import React, { useState } from 'react';
import { Clock, Droplets, Sparkles, ArrowRight } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { CROPS_DATABASE } from '../../data/agriData.ts';
import { IMAGES } from '../../data/assets.ts';

export function EditorialCropAtlas() {
  const { lang } = useLang();
  const isBn = lang === 'bn';
  const [selectedSeason, setSelectedSeason] = useState<'all' | 'Rabi' | 'Kharif-1' | 'Kharif-2'>('all');

  const crops = Object.values(CROPS_DATABASE).filter((c) => {
    if (selectedSeason === 'all') return true;
    return c.seasonEn === selectedSeason;
  });

  return (
    <section id="crops" className="relative py-24 md:py-32 border-b border-white/10 bg-[#070e1a]/60">
      <div className="container-x">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#B8FF3D] uppercase mb-3">
              <span>AGRONOMIC ATLAS</span>
              <span aria-hidden="true">·</span>
              <span>AEZ CROPPING</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              {isBn ? 'বাংলাদেশের প্রধান ফসল ও জলবায়ু উপযোগিতা' : 'Bangladesh Crop Atlas & Climate Suitability'}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#8FA3B8] leading-relaxed">
              {isBn
                ? 'বারি ও ব্রি বিজ্ঞানীদের সুপারিশ অনুসারে প্রতিটি ফসলের পানির প্রয়োজনীয়তা, জীবনকাল এবং ফলন সম্ভাবনা।'
                : 'Validated water needs, growing periods, and yield potential mapped across Bangladesh’s agro-ecological zones.'}
            </p>
          </div>

          {/* Season Filter Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1626] border border-white/10 self-start md:self-end">
            {(['all', 'Rabi', 'Kharif-1', 'Kharif-2'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSeason(s)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  selectedSeason === s
                    ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                    : 'text-[#8FA3B8] hover:text-white'
                }`}
              >
                {s === 'all' && (isBn ? 'সব ফসল' : 'All Crops')}
                {s === 'Rabi' && (isBn ? 'রবি (শীত)' : 'Rabi (Winter)')}
                {s === 'Kharif-1' && (isBn ? 'খরিপ-১' : 'Kharif-1')}
                {s === 'Kharif-2' && (isBn ? 'খরিপ-২ (বর্ষা)' : 'Kharif-2')}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Editorial Photo Split Banner */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-14 items-center">
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden border border-white/10 bg-[#0B1626] aspect-[16/9] sm:aspect-[21/9]">
            <img
              src={IMAGES.cropHarvest}
              alt="Harvested mustard and lentils on natural jute"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 scrim-editorial-card" />
            <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#B8FF3D] font-bold block mb-1">
                {isBn ? 'মাটির গুণ ও পানি সাশ্রয়' : 'ECOLOGICAL GROUNDWATER RESILIENCE'}
              </span>
              <h4 className="text-lg sm:text-xl font-bold text-white font-display">
                {isBn
                  ? 'সরিষা ও ডাল ফসলে ৪০-৪৫% কম সেচ ব্যয়'
                  : 'Up to 45% Irrigation Reduction via Mustard & Pulses'}
              </h4>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
              <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] font-bold">
                <Sparkles className="w-4 h-4" />
                <span>{isBn ? 'বিজ্ঞানসম্মত বিশ্লেষণ' : 'DATA-DRIVEN COMPATIBILITY'}</span>
              </div>
              <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed">
                {isBn
                  ? 'আপনার এলাকার মাটির ধরন, বর্ষার বিলম্ব এবং মূলস্তরের আর্দ্রতা মিলিয়ে এগ্রিঅরবিট স্বয়ংক্রিয়ভাবে কোন ফসলটি সবচেয়ে কম ঝুঁকিপূর্ণ তা নির্ধারণ করে।'
                  : 'By matching local soil texture, monsoon shift patterns, and root-zone moisture, AgriOrbit calculates precise suitability scores without black-box AI.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={goAnalyze}
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#B8FF3D] hover:underline uppercase font-mono cursor-pointer"
                >
                  <span>{isBn ? 'আপনার জমির জন্য ফসল যাচাই করুন' : 'Check suitability for your field'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Crop Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {crops.slice(0, 8).map((crop) => (
            <div
              key={crop.id}
              className="p-5 rounded-2xl bg-[#0B1626] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-white/5 text-[#00E5FF] border border-white/10 uppercase">
                    {isBn ? crop.seasonBn : crop.seasonEn}
                  </span>
                  <span className="text-[11px] font-mono font-semibold text-[#B8FF3D]">
                    {crop.suitabilityScore}/100 SCORE
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white group-hover:text-[#B8FF3D] transition-colors">
                  {isBn ? crop.nameBn : crop.nameEn}
                </h3>
                <p className="text-xs text-[#8FA3B8] italic mt-0.5 mb-4">
                  {crop.scientificName}
                </p>

                <div className="space-y-2 text-xs text-[#8FA3B8] py-3 border-t border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-white/50" />
                      {isBn ? 'জীবনকাল' : 'Duration'}
                    </span>
                    <span className="text-white font-mono">{crop.durationDays} {isBn ? 'দিন' : 'd'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-white/50" />
                      {isBn ? 'পানির চাহিদা' : 'Water'}
                    </span>
                    <span className="text-white font-mono">{isBn ? crop.waterRequirementBn : crop.waterRequirementEn}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <div className="text-[11px] text-[#8FA3B8] line-clamp-2">
                  {isBn ? crop.shortWhyBn : crop.shortWhyEn}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
