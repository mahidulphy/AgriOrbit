import { useState, useMemo } from 'react';
import {
  Clock,
  Droplets,
  Search,
  X,
  Thermometer,
  CloudRain,
  AlertTriangle,
  Info,
  ChevronRight,
  Database,
  Satellite,
  Compass,
} from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { CROPS, type Crop } from '../../data/crops.ts';
import { CROP_CATEGORIES, type CropCategoryId } from '../../data/cropCategories.ts';
import { CROPS_DATABASE } from '../../data/agriData.ts';

type SeasonFilter = 'all' | 'rabi' | 'kharif1' | 'kharif2';

export function EditorialCropAtlas() {
  const { lang } = useLang();
  const isBn = lang === 'bn';

  const [selectedCategory, setSelectedCategory] = useState<CropCategoryId | 'all'>('all');
  const [selectedSeason, setSelectedSeason] = useState<SeasonFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [detailCrop, setDetailCrop] = useState<Crop | null>(null);

  // Filter crops based on category, season, and search query
  const filteredCrops = useMemo(() => {
    return CROPS.filter((crop) => {
      // Category filter
      if (selectedCategory !== 'all' && crop.category_id !== selectedCategory) {
        return false;
      }
      // Season filter
      if (selectedSeason !== 'all' && !crop.seasons.includes(selectedSeason)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNameEn = crop.name_en.toLowerCase().includes(q);
        const matchNameBn = crop.name_bn.toLowerCase().includes(q);
        const matchSci = crop.scientific_name?.toLowerCase().includes(q) || false;
        if (!matchNameEn && !matchNameBn && !matchSci) return false;
      }
      return true;
    });
  }, [selectedCategory, selectedSeason, searchQuery]);

  // Group by category
  const cropsByCategory = useMemo(() => {
    const map = new Map<CropCategoryId, Crop[]>();
    for (const cat of CROP_CATEGORIES) {
      map.set(cat.id, []);
    }
    for (const crop of filteredCrops) {
      const arr = map.get(crop.category_id);
      if (arr) {
        arr.push(crop);
      }
    }
    // Sort within each category by suitability score
    for (const [catId, arr] of map.entries()) {
      arr.sort((a, b) => {
        const scoreA = CROPS_DATABASE[a.id]?.suitabilityScore ?? (a.recommendable ? 85 : 0);
        const scoreB = CROPS_DATABASE[b.id]?.suitabilityScore ?? (b.recommendable ? 85 : 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        if (a.data_confidence === 'research' && b.data_confidence !== 'research') return -1;
        if (b.data_confidence === 'research' && a.data_confidence !== 'research') return 1;
        return a.name_en.localeCompare(b.name_en);
      });
    }
    return map;
  }, [filteredCrops]);

  const researchCount = CROPS.filter((c) => c.data_confidence === 'research').length;
  const estimatedCount = CROPS.filter((c) => c.data_confidence === 'estimated').length;
  const totalCrops = CROPS.length;

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const getSeasonLabel = (s: string) => {
    if (s === 'rabi') return isBn ? 'রবি' : 'Rabi';
    if (s === 'kharif1') return isBn ? 'খরিফ-১' : 'Kharif-1';
    if (s === 'kharif2') return isBn ? 'খরিফ-২' : 'Kharif-2';
    return s;
  };

  return (
    <section id="crops" className="relative py-24 md:py-32 border-b border-white/10 bg-[#070e1a]/80">
      <div className="container-x">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#B8FF3D] uppercase mb-3">
              <span>AGRONOMIC ATLAS</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? `${totalCrops}টি ফসলের পূর্ণ জ্ঞানভাণ্ডার` : `FULL ${totalCrops} CROP KNOWLEDGE BASE`}</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
              {isBn ? 'বাংলাদেশের প্রধান ফসল ও জলবায়ু উপযোগিতা' : 'Bangladesh Crop Atlas & Climate Suitability'}
            </h2>
            <p className="mt-4 text-base sm:text-lg text-[#8FA3B8] leading-relaxed">
              {isBn
                ? `বারি (BARI) ও ব্রি (BRRI) গবেষণা নির্দেশিকা এবং নাসার স্যাটেলাইট পর্যবেক্ষণ অনুযায়ী ${totalCrops}টি ফসলের তাপমাত্রা, পানির চাহিদা ও বাস্তব কৃষি উপযোগিতা।`
                : `Comprehensive agro-climatic database of ${totalCrops} Bangladeshi crops combining BARI & BRRI scientific research with NASA Earth observation parameters.`}
            </p>
          </div>

          {/* Example score tag */}
          <div className="flex flex-col items-start md:items-end gap-2">
            <div className="text-xs font-mono text-[#8FA3B8] flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#0B1626] border border-white/10">
              <span className="w-2 h-2 rounded-full bg-[#B8FF3D] animate-pulse" />
              <span>{isBn ? 'রংপুর অঞ্চলের উদাহরণ স্কোর' : 'Example scores for Rangpur'}</span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {isBn ? 'কার্ডে ট্যাপ করে বিস্তারিত দেখুন' : 'Click any card to inspect full telemetry'}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-4 mb-10 p-4 sm:p-5 rounded-2xl bg-[#0B1626] border border-white/10">
          {/* Row 1: Search & Season tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#8FA3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'ফসলের নাম দিয়ে খুঁজুন (বাংলা বা ইংরেজি)...' : 'Search by crop name (English or Bangla)...'}
                className="w-full min-h-[44px] pl-10 pr-9 py-2 rounded-xl bg-white/5 border border-white/15 text-white text-sm focus:border-[#B8FF3D] focus:outline-none placeholder:text-slate-500 font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Season Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#050B14] border border-white/10 overflow-x-auto">
              {(
                [
                  { id: 'all', en: 'All Seasons', bn: 'সব মৌসুম' },
                  { id: 'rabi', en: 'Rabi (Winter)', bn: 'রবি (শীত)' },
                  { id: 'kharif1', en: 'Kharif-1 (Summer)', bn: 'খরিফ-১ (গ্রীষ্ম)' },
                  { id: 'kharif2', en: 'Kharif-2 (Monsoon)', bn: 'খরিফ-২ (বর্ষা)' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedSeason(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer whitespace-nowrap ${
                    selectedSeason === tab.id
                      ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                      : 'text-[#8FA3B8] hover:text-white'
                  }`}
                >
                  {isBn ? tab.bn : tab.en}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Category Filter Chips */}
          <div className="pt-2 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap border ${
                selectedCategory === 'all'
                  ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-bold shadow-sm'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {isBn ? `সব ফসল (${filteredCrops.length})` : `All Categories (${filteredCrops.length})`}
            </button>
            {CROP_CATEGORIES.map((cat) => {
              const count = cropsByCategory.get(cat.id)?.length || 0;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-bold shadow-sm'
                      : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <span>{isBn ? cat.name_bn : cat.name_en}</span>
                  <span className="ml-1.5 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crops Container */}
        {filteredCrops.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-2xl bg-[#0B1626] border border-white/10">
            <Search className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">
              {isBn ? 'কোনো ফসল পাওয়া যায়নি' : 'No crops found matching filters'}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {isBn ? 'অন্য কোনো নাম বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।' : 'Try adjusting your search query or season filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {CROP_CATEGORIES.map((cat) => {
              const cropsInCat = cropsByCategory.get(cat.id) || [];
              if (cropsInCat.length === 0) return null;

              const isExpanded = expandedCategories[cat.id] || selectedCategory === cat.id;
              const displayCrops = isExpanded ? cropsInCat : cropsInCat.slice(0, 8);
              const hasMore = cropsInCat.length > 8 && !isExpanded;

              return (
                <div key={cat.id} className="space-y-5">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                      <h3 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                        {isBn ? cat.name_bn : cat.name_en}
                      </h3>
                      <span className="text-xs font-mono text-[#8FA3B8] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                        {cropsInCat.length} {isBn ? 'টি ফসল' : 'crops'}
                      </span>
                    </div>

                    <p className="hidden md:block text-xs text-[#8FA3B8] max-w-md text-right font-mono">
                      {isBn ? cat.description_bn : cat.description_en}
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                    {displayCrops.map((crop) => {
                      const dataCrop = CROPS_DATABASE[crop.id];
                      const score = dataCrop?.suitabilityScore ?? (crop.recommendable ? 85 : 0);
                      const isEstimated = crop.data_confidence === 'estimated';
                      const isNonRecommendable = !crop.recommendable;

                      return (
                        <div
                          key={crop.id}
                          onClick={() => setDetailCrop(crop)}
                          className="p-5 rounded-2xl bg-[#0B1626] border border-white/10 hover:border-[#B8FF3D]/50 hover:bg-[#0E1B2E] transition-all flex flex-col justify-between group cursor-pointer relative"
                        >
                          <div>
                            {/* Card Top: Season badges + Score */}
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <div className="flex flex-wrap gap-1">
                                {crop.seasons.map((s) => (
                                  <span
                                    key={s}
                                    className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#00E5FF] border border-white/10 uppercase"
                                  >
                                    {getSeasonLabel(s)}
                                  </span>
                                ))}
                              </div>

                              {isNonRecommendable ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30">
                                  {isBn ? 'প্রস্তাবযোগ্য নয়' : 'Not Recommendable'}
                                </span>
                              ) : (
                                <div className="text-right">
                                  <span className="text-[11px] font-mono font-bold text-[#B8FF3D]">
                                    {score}/100
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Crop Titles */}
                            <h4 className="text-lg font-bold text-white group-hover:text-[#B8FF3D] transition-colors flex items-center justify-between">
                              <span>{isBn ? crop.name_bn : crop.name_en}</span>
                              <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#B8FF3D] group-hover:translate-x-0.5 transition-all" />
                            </h4>
                            <p className="text-xs text-[#8FA3B8] italic mt-0.5 mb-3">
                              {crop.scientific_name || (isBn ? 'দ্বিপদ নাম অনুপস্থিত' : 'Scientific name not recorded')}
                            </p>

                            {/* Estimated Badge */}
                            {isEstimated && (
                              <div className="mb-3 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono text-amber-300">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{isBn ? 'আনুমানিক তথ্য' : 'Estimated data'}</span>
                              </div>
                            )}

                            {/* Telemetry Stats */}
                            <div className="space-y-2 text-xs text-[#8FA3B8] py-3 border-t border-b border-white/10">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-white/50" />
                                  {isBn ? 'জীবনকাল' : 'Duration'}
                                </span>
                                <span className="text-white font-mono">
                                  {crop.duration_days
                                    ? `${crop.duration_days.min}–${crop.duration_days.max} ${isBn ? 'দিন' : 'days'}`
                                    : (isBn ? 'তথ্য নেই' : 'No data')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Droplets className="w-3.5 h-3.5 text-white/50" />
                                  {isBn ? 'পানির চাহিদা' : 'Water need'}
                                </span>
                                <span className="text-white font-mono">
                                  {crop.water_need_mm
                                    ? `${crop.water_need_mm.min}–${crop.water_need_mm.max} mm`
                                    : (isBn ? 'তথ্য নেই' : 'No data')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5">
                                  <Thermometer className="w-3.5 h-3.5 text-white/50" />
                                  {isBn ? 'অনুকূল তাপমাত্রা' : 'Opt. Temp'}
                                </span>
                                <span className="text-white font-mono">
                                  {crop.temperature_c.optimal_min != null && crop.temperature_c.optimal_max != null
                                    ? `${crop.temperature_c.optimal_min}–${crop.temperature_c.optimal_max}°C`
                                    : (isBn ? 'তথ্য নেই' : 'No data')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Short Why / Description */}
                          <div className="pt-3">
                            <p className="text-[11px] text-[#8FA3B8] line-clamp-2 leading-relaxed">
                              {crop.key_risks_bn[0]
                                ? (isBn ? `সতর্কতা: ${crop.key_risks_bn[0]}` : `Caution: ${crop.key_risks_en[0] || crop.key_risks_bn[0]}`)
                                : (isBn ? 'মৌসুম ও মাটির আর্দ্রতার জন্য উপযোগী।' : 'Agronomically suited to the agro-ecological season.')}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Show More Button if category has >8 cards */}
                  {hasMore && (
                    <div className="text-center pt-2">
                      <button
                        onClick={() => toggleCategoryExpand(cat.id)}
                        className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-[#00E5FF] hover:bg-white/10 hover:border-[#00E5FF]/40 transition-all cursor-pointer"
                      >
                        {isBn ? `আরও ${cropsInCat.length - 8}টি ফসল দেখুন ↓` : `Show all ${cropsInCat.length} crops in this category ↓`}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Transparency Footer Note */}
        <div className="mt-16 p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-5 h-5 text-[#B8FF3D] flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-slate-300">
              <span className="font-bold text-white block mb-0.5">
                {isBn ? 'স্বচ্ছ গবেষণা ও তথ্যভাণ্ডার কাঠামো' : 'Transparent Agronomic Data Provenance'}
              </span>
              <p className="text-slate-400">
                {isBn
                  ? `${researchCount}টি ফসলের তথ্য গবেষণা-ভিত্তিক (বারি ও ব্রি প্রকাশিত নথি), এবং ${estimatedCount}টি প্রাথমিক প্রাক্কলন। বারি ও ব্রি নির্দেশিকা এবং নাসা উপাত্তের ভিত্তিতে প্রণীত।`
                  : `${researchCount} crops are strictly research-backed (BARI/BRRI research guidelines), and ${estimatedCount} are estimated from published agricultural literature. Based on BARI/BRRI guidance and NASA data.`}
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-400 border border-white/10 px-3 py-1.5 rounded-xl bg-white/5 whitespace-nowrap">
            {isBn ? 'সূত্র: ব্রি আধুনিক ধানের চাষ (২১তম সংস্করণ) ও বারি নির্দেশিকা' : 'Sources: BRRI 21st Ed. & BARI Agronomy Guidelines'}
          </div>
        </div>
      </div>

      {/* DETAIL SHEET MODAL */}
      {detailCrop && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          onClick={() => setDetailCrop(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0B1626] border border-white/15 p-6 sm:p-8 shadow-2xl relative space-y-6 text-white"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#00E5FF] border border-white/10">
                    {CROP_CATEGORIES.find((c) => c.id === detailCrop.category_id)?.[isBn ? 'name_bn' : 'name_en']}
                  </span>
                  {detailCrop.data_confidence === 'estimated' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {isBn ? 'আনুমানিক তথ্য' : 'Estimated Data'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30">
                      {isBn ? 'গবেষণা-ভিত্তিক' : 'Research-Backed'}
                    </span>
                  )}
                  {!detailCrop.recommendable && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                      {isBn ? 'প্রস্তাবযোগ্য নয়' : 'Non-Recommendable'}
                    </span>
                  )}
                </div>

                <h3 className="text-2xl sm:text-3xl font-bold font-display text-white">
                  {isBn ? detailCrop.name_bn : detailCrop.name_en}
                </h3>
                <p className="text-xs sm:text-sm text-[#8FA3B8] italic mt-0.5">
                  {detailCrop.scientific_name || (isBn ? 'দ্বিপদ নাম অনুপস্থিত' : 'No scientific name')}
                  {detailCrop.plant_family && (
                    <span className="ml-2 font-mono text-[11px] text-[#00E5FF]">
                      ({isBn ? 'গোত্র:' : 'Family:'} {detailCrop.plant_family})
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setDetailCrop(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close detail modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Estimated Warning Banner */}
            {detailCrop.data_confidence === 'estimated' && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs sm:text-sm text-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isBn
                    ? 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'
                    : 'This crop data is estimated from preliminary agricultural references. Always verify with your local Upazila Agriculture Officer before field deployment.'}
                </p>
              </div>
            )}

            {/* Sowing & Harvest Windows */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  {isBn ? 'বপন বা রোপণ সময়' : 'Sowing Window'}
                </span>
                <p className="font-bold text-white text-sm">
                  {isBn ? detailCrop.sowing_window.months_bn : detailCrop.sowing_window.months_en}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 space-y-1">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">
                  {isBn ? 'ফসল কাটার সময়' : 'Harvest Window'}
                </span>
                <p className="font-bold text-white text-sm">
                  {isBn ? detailCrop.harvest_window.months_bn : detailCrop.harvest_window.months_en}
                </p>
              </div>
            </div>

            {/* Growth Stages Timeline */}
            {detailCrop.growth_stages.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10 space-y-3">
                <span className="text-xs font-mono font-bold text-[#B8FF3D] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  {isBn ? 'ধাপভিত্তিক সময়কাল ও জীবনচক্র' : 'Growth Stages Timeline'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {detailCrop.growth_stages.map((stg, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/5 border border-white/10 text-xs">
                      <span className="text-[10px] font-mono text-slate-400 block mb-0.5">
                        {isBn ? `ধাপ ${i + 1}` : `Stage ${i + 1}`} ({stg.weeks_min}–{stg.weeks_max} {isBn ? 'সপ্তাহ' : 'wks'})
                      </span>
                      <p className="font-medium text-white">{isBn ? stg.name_bn : stg.name_en}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Technical Agronomic Metrics */}
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              {/* Temperature */}
              <div className="p-3.5 rounded-xl bg-[#050B14] border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-amber-400" />
                  {isBn ? 'তাপমাত্রা' : 'Temperature'}
                </span>
                <p className="font-mono font-bold text-sm text-white">
                  {detailCrop.temperature_c.optimal_min != null
                    ? `${detailCrop.temperature_c.optimal_min}–${detailCrop.temperature_c.optimal_max}°C`
                    : (isBn ? 'তথ্য নেই' : 'No data')}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {isBn ? `বেস: ${detailCrop.temperature_c.base ?? 'নেই'}°C` : `Base: ${detailCrop.temperature_c.base ?? 'N/A'}°C`}
                  {detailCrop.temperature_c.critical_max && ` · সংকট: ${detailCrop.temperature_c.critical_max}°C`}
                </span>
              </div>

              {/* Water Need */}
              <div className="p-3.5 rounded-xl bg-[#050B14] border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#00E5FF]" />
                  {isBn ? 'পানির চাহিদা' : 'Water Need'}
                </span>
                <p className="font-mono font-bold text-sm text-white">
                  {detailCrop.water_need_mm
                    ? `${detailCrop.water_need_mm.min}–${detailCrop.water_need_mm.max} mm`
                    : (isBn ? 'তথ্য নেই' : 'No data')}
                </p>
                <span className="text-[10px] text-slate-400 block line-clamp-1">
                  {isBn ? detailCrop.irrigation_notes_bn : detailCrop.irrigation_notes_en}
                </span>
              </div>

              {/* SMAP Soil Moisture */}
              <div className="p-3.5 rounded-xl bg-[#050B14] border border-white/10 space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-[#B8FF3D]" />
                  {isBn ? 'SMAP আর্দ্রতা' : 'SMAP Moisture'}
                </span>
                <p className="font-mono font-bold text-sm text-white">
                  {detailCrop.smap_optimal.min != null
                    ? `${Math.round(detailCrop.smap_optimal.min * 100)}%–${Math.round(detailCrop.smap_optimal.max! * 100)}%`
                    : (isBn ? 'তথ্য নেই' : 'No data')}
                </p>
                <span className="text-[10px] text-slate-400 block">
                  {detailCrop.smap_optimal.min != null ? `${detailCrop.smap_optimal.min} - ${detailCrop.smap_optimal.max} m³/m³` : ''}
                </span>
              </div>
            </div>

            {/* Key Risks */}
            {detailCrop.key_risks_bn.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {isBn ? 'প্রধান জলবায়ু ও উৎপাদন ঝুঁকি' : 'Key Climate & Agronomic Risks'}
                </span>
                <div className="flex flex-wrap gap-2">
                  {detailCrop.key_risks_bn.map((risk, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200"
                    >
                      {isBn ? risk : (detailCrop.key_risks_en[i] || risk)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Algorithm Decision Logic */}
            {detailCrop.decision_rules_bn && detailCrop.decision_rules_bn.length > 0 && (
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10 space-y-1.5">
                <span className="text-xs font-mono font-bold text-[#00E5FF] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5" />
                  {isBn ? 'অ্যালগরিদমের সিদ্ধান্ত লজিক (Rule Engine)' : 'Algorithm Decision Logic'}
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {isBn ? detailCrop.decision_rules_bn[0] : (detailCrop.decision_rules_en?.[0] || detailCrop.decision_rules_bn[0])}
                </p>
              </div>
            )}

            {/* Sources & Citations */}
            <div className="border-t border-white/10 pt-4 space-y-2">
              <span className="text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider block">
                {isBn ? 'উৎস ও রেফারেন্স' : 'Sources & Scientific Provenance'}
              </span>
              <div className="space-y-1 text-xs text-slate-400 font-mono">
                {detailCrop.sources.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8FF3D]" />
                    <span className="text-white">{s.file}</span>
                    <span>· {s.section}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/5 border border-white/10 uppercase">
                      {s.confidence || 'research'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
