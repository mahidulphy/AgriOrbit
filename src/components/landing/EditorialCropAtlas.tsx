import { useState } from 'react';
import { Clock, Droplets } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { CROPS_DATABASE } from '../../data/agriData.ts';

export function EditorialCropAtlas() {
  const { lang } = useLang();
  const isBn = lang === 'bn';
  const [selectedSeason, setSelectedSeason] = useState<'all' | 'Rabi' | 'Kharif-1' | 'Kharif-2'>('all');

  // Sorted descending by suitabilityScore within active filter per requirement A.11
  const crops = Object.values(CROPS_DATABASE)
    .filter((c) => {
      if (selectedSeason === 'all') return true;
      return c.seasonEn === selectedSeason;
    })
    .sort((a, b) => b.suitabilityScore - a.suitabilityScore);

  return (
    <section id="crops" className="relative py-24 md:py-32 border-b border-white/10 bg-[#070e1a]/60">
      <div className="container-x">
        {/* Editorial Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
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

          {/* Season Filter Pills and Rangpur Baseline Tag */}
          <div className="flex flex-col items-start md:items-end gap-2.5 self-start md:self-end">
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-[#0B1626] border border-white/10">
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
                  {s === 'Kharif-1' && (isBn ? 'খরিফ-১' : 'Kharif-1')}
                  {s === 'Kharif-2' && (isBn ? 'খরিফ-২ (বর্ষা)' : 'Kharif-2')}
                </button>
              ))}
            </div>
            <div className="text-xs font-mono text-[#8FA3B8] flex items-center gap-1.5 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF3D]" />
              <span>{isBn ? 'রংপুরের জন্য নমুনা স্কোর' : 'Example scores for Rangpur'}</span>
            </div>
          </div>
        </div>

        {/* All 10 Verified Crops Grid (Sorted Descending by Suitability Score) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {crops.map((crop) => (
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
