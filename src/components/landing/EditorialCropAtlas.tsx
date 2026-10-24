import { useState, useMemo } from 'react';
import {
  Clock,
  Droplets,
  Search,
  X,
  Thermometer,
  AlertTriangle,
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

function toBn(val: any, isBn: boolean = true): string {
  if (val == null) return '';
  const s = String(val);
  return isBn ? s.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[+d]) : s;
}

export function EditorialCropAtlas() {
  const { lang, t } = useLang();
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
    for (const [, arr] of map.entries()) {
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
    <section id="crops" className="relative py-20 md:py-28 border-b border-[#262626]">
      <div className="container-x">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#A3A3A3] block mb-2">
              {isBn ? 'ফসল নির্দেশিকা' : 'Crop Atlas'}
            </span>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold text-[#FAFAFA] tracking-tight">
              {isBn ? 'বাংলাদেশের প্রধান ফসল ও আবহাওয়া সহনশীলতা' : 'Bangladesh Crop Atlas & Climate Suitability'}
            </h2>
            <p className="mt-3 text-base text-[#A3A3A3] leading-relaxed">
              {isBn
                ? `বারি (BARI) ও ব্রি (BRRI)-এর পরামর্শ এবং নাসার তথ্য মিলিয়ে আপনার এলাকার জন্য ${toBn(totalCrops)}টি ফসলের মূল্যায়ন।`
                : `${totalCrops} crops, scored for your district using BARI/BRRI guidance and NASA data.`}
            </p>
          </div>

          {/* Example score tag */}
          <div className="flex flex-col items-start md:items-end gap-1.5">
            <div className="text-xs font-mono text-[#A3A3A3] flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <span>{isBn ? 'রংপুরের জন্য নমুনা স্কোর' : 'Example scores for Rangpur'}</span>
            </div>
            <span className="text-[11px] font-mono text-[#737373]">
              {isBn ? 'যেকোনো ফসলে চাপ দিয়ে বিস্তারিত দেখুন' : 'Click any card to inspect full field data'}
            </span>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="space-y-4 mb-10 p-4 sm:p-5 rounded-xl bg-[#141414] border border-[#262626]">
          {/* Row 1: Search & Season tabs */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Box */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#737373]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isBn ? 'ফসলের নাম দিয়ে খুঁজুন (বাংলা বা ইংরেজি)...' : 'Search by crop name (English or Bangla)...'}
                className="w-full min-h-[40px] pl-10 pr-9 py-2 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none placeholder:text-[#737373] font-mono"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-[#737373] hover:text-[#FAFAFA] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Season Tabs */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0A0A0A] border border-[#262626] overflow-x-auto no-scrollbar flex-nowrap">
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
                  className={`px-3 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer whitespace-nowrap ${
                    selectedSeason === tab.id
                      ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium'
                      : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
                  }`}
                >
                  {isBn ? tab.bn : tab.en}
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Category Filter Chips */}
          <div className="pt-3 border-t border-[#262626] flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-nowrap">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap border ${
                selectedCategory === 'all'
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] border-transparent font-medium'
                  : 'bg-transparent border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#404040]'
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors cursor-pointer whitespace-nowrap border ${
                    isSelected
                      ? 'bg-[#FAFAFA] text-[#0A0A0A] border-transparent font-medium'
                      : 'bg-transparent border-[#262626] text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#404040]'
                  }`}
                >
                  <span>{isBn ? cat.name_bn : cat.name_en}</span>
                  <span className="ml-1 opacity-60">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Crops Container */}
        {filteredCrops.length === 0 ? (
          <div className="text-center py-14 px-4 rounded-xl bg-[#141414] border border-[#262626]">
            <Search className="w-8 h-8 text-[#737373] mx-auto mb-2" />
            <h3 className="text-base font-semibold text-[#FAFAFA]">
              {isBn ? 'কোনো ফসল পাওয়া যায়নি' : 'No crops found matching filters'}
            </h3>
            <p className="text-xs text-[#737373] mt-1">
              {isBn ? 'অন্য কোনো নাম বা ফিল্টার পরিবর্তন করে চেষ্টা করুন।' : 'Try adjusting your search query or season filter.'}
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {CROP_CATEGORIES.map((cat) => {
              const cropsInCat = cropsByCategory.get(cat.id) || [];
              if (cropsInCat.length === 0) return null;

              const isExpanded = expandedCategories[cat.id] || selectedCategory === cat.id;
              const displayCrops = isExpanded ? cropsInCat : cropsInCat.slice(0, 8);
              const hasMore = cropsInCat.length > 8 && !isExpanded;

              return (
                <div key={cat.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-center justify-between border-b border-[#262626] pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-lg font-semibold text-[#FAFAFA]">
                        {isBn ? cat.name_bn : cat.name_en}
                      </h3>
                      <span className="text-xs font-mono text-[#737373] px-2 py-0.5 rounded bg-[#0A0A0A] border border-[#262626]">
                        {cropsInCat.length} {isBn ? 'টি' : 'crops'}
                      </span>
                    </div>

                    <p className="hidden md:block text-xs text-[#737373] max-w-md text-right font-mono">
                      {isBn ? cat.description_bn : cat.description_en}
                    </p>
                  </div>

                  {/* Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {displayCrops.map((crop) => {
                      const dataCrop = CROPS_DATABASE[crop.id];
                      const score = dataCrop?.suitabilityScore ?? (crop.recommendable ? 85 : 0);
                      const isEstimated = crop.data_confidence === 'estimated';
                      const isNonRecommendable = !crop.recommendable;

                      return (
                        <div
                          key={crop.id}
                          onClick={() => setDetailCrop(crop)}
                          className="p-5 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#404040] transition-colors duration-150 flex flex-col justify-between group cursor-pointer relative"
                        >
                          <div>
                            {/* Card Top: Season labels + Score or Badge */}
                            <div className="flex items-center justify-between mb-3 gap-2">
                              <span className="font-mono text-xs text-[#737373]">
                                {crop.seasons.map((s) => getSeasonLabel(s)).join(', ')}
                              </span>

                              {isNonRecommendable ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]">
                                  {isBn ? 'সুপারিশ নয়' : 'Not Recommended'}
                                </span>
                              ) : isEstimated ? (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]">
                                  {isBn ? 'আনুমানিক' : 'Estimated'}
                                </span>
                              ) : (
                                <span className="text-xs font-mono font-semibold text-[#FAFAFA]">
                                  {score}/100
                                </span>
                              )}
                            </div>

                            {/* Crop Titles */}
                            <h4 className="text-base font-semibold text-[#FAFAFA] group-hover:text-[#22C55E] transition-colors flex items-center justify-between">
                              <span>{isBn ? crop.name_bn : crop.name_en}</span>
                              <ChevronRight className="w-4 h-4 text-[#737373] group-hover:text-[#22C55E] transition-colors" />
                            </h4>
                            <p className="text-xs text-[#737373] italic mt-0.5 mb-3 truncate">
                              {crop.scientific_name || (isBn ? 'তথ্য নেই' : 'No scientific name')}
                            </p>

                            {/* Stats */}
                            <div className="space-y-1.5 text-xs text-[#A3A3A3] py-2.5 border-t border-b border-[#262626]">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[#737373]">
                                  <Clock className="w-3.5 h-3.5" />
                                  {isBn ? 'জীবনকাল' : 'Duration'}
                                </span>
                                <span className="text-[#FAFAFA] font-mono">
                                  {crop.duration_days
                                    ? `${toBn(crop.duration_days.min, isBn)}–${toBn(crop.duration_days.max, isBn)} ${isBn ? 'দিন' : 'd'}`
                                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[#737373]">
                                  <Droplets className="w-3.5 h-3.5" />
                                  {isBn ? 'পানি' : 'Water'}
                                </span>
                                <span className="text-[#FAFAFA] font-mono">
                                  {crop.water_need_mm
                                    ? `${toBn(crop.water_need_mm.min, isBn)}–${toBn(crop.water_need_mm.max, isBn)} ${isBn ? 'মিমি' : 'mm'}`
                                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-[#737373]">
                                  <Thermometer className="w-3.5 h-3.5" />
                                  {isBn ? 'অনুকূল তাপমাত্রা' : 'Opt. Temp'}
                                </span>
                                <span className="text-[#FAFAFA] font-mono">
                                  {crop.temperature_c.optimal_min != null && crop.temperature_c.optimal_max != null
                                    ? `${toBn(crop.temperature_c.optimal_min, isBn)}–${toBn(crop.temperature_c.optimal_max, isBn)}°${isBn ? 'সে' : 'C'}`
                                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Caution */}
                          <div className="pt-2.5">
                            <p className="text-[11px] text-[#737373] line-clamp-2 leading-relaxed">
                              {crop.key_risks_bn[0]
                                ? (isBn ? `সতর্কতা: ${crop.key_risks_bn[0]}` : `Caution: ${crop.key_risks_en[0] || crop.key_risks_bn[0]}`)
                                : (isBn ? 'তথ্য নেই' : 'No data')}
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
                        className="px-4 py-2 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-[#A3A3A3] hover:text-[#FAFAFA] hover:border-[#404040] transition-colors cursor-pointer"
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

        {/* Provenance Footer Note */}
        <div className="mt-14 p-5 sm:p-6 rounded-xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Database className="w-4 h-4 text-[#22C55E] shrink-0 mt-1" />
            <div className="text-xs text-[#A3A3A3]">
              <span className="font-semibold text-[#FAFAFA] block mb-0.5">
                {isBn ? 'তথ্যের উৎস ও ভিত্তি' : 'Where the numbers come from'}
              </span>
              <p className="text-[#737373]">
                {isBn
                  ? t.atlas.provenanceDesc(researchCount, estimatedCount)
                  : t.atlas.provenanceDesc(researchCount, estimatedCount)}
              </p>
            </div>
          </div>

          <div className="text-[11px] font-mono text-[#737373] border border-[#262626] px-3 py-1.5 rounded-lg bg-[#0A0A0A] whitespace-nowrap">
            {isBn ? 'সূত্র: ব্রি ২১তম সংস্করণ ও বারি নির্দেশিকা' : 'Sources: BRRI 21st Ed. & BARI Guidelines'}
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {detailCrop && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
          onClick={() => setDetailCrop(null)}
        >
          <div
            className="w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-2xl overflow-y-auto rounded-xl bg-[#141414] border border-[#262626] p-5 sm:p-7 shadow-2xl relative space-y-5 text-[#FAFAFA]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#262626] pb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#0A0A0A] text-[#A3A3A3] border border-[#262626]">
                    {CROP_CATEGORIES.find((c) => c.id === detailCrop.category_id)?.[isBn ? 'name_bn' : 'name_en']}
                  </span>
                  {detailCrop.data_confidence === 'estimated' ? (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {isBn ? 'আনুমানিক তথ্য' : 'Estimated Data'}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#22C55E]/10 text-[#22C55E] border border-[#22C55E]/30">
                      {isBn ? 'গবেষণা-ভিত্তিক' : 'Research-Backed'}
                    </span>
                  )}
                  {!detailCrop.recommendable && (
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/30">
                      {isBn ? 'সুপারিশ নয়' : 'Non-Recommendable'}
                    </span>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-semibold font-display text-[#FAFAFA]">
                  {isBn ? detailCrop.name_bn : detailCrop.name_en}
                </h3>
                <p className="text-xs text-[#737373] italic mt-0.5">
                  {detailCrop.scientific_name || (isBn ? 'তথ্য নেই' : 'No scientific name')}
                  {detailCrop.plant_family && (
                    <span className="ml-2 font-mono text-[11px] text-[#A3A3A3]">
                      ({isBn ? 'গোত্র:' : 'Family:'} {detailCrop.plant_family})
                    </span>
                  )}
                </p>
              </div>

              <button
                onClick={() => setDetailCrop(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#737373] hover:text-[#FAFAFA] transition-colors cursor-pointer"
                aria-label="Close detail modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Estimated Warning */}
            {detailCrop.data_confidence === 'estimated' && (
              <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 flex items-start gap-2.5 text-xs text-[#F59E0B]">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {isBn
                    ? 'এই ফসলের তথ্য এখনো প্রাথমিক উৎস থেকে নেওয়া; স্থানীয় কৃষি কর্মকর্তার সাথে পরামর্শ করে নিশ্চিত হোন।'
                    : 'This crop data is estimated from preliminary agricultural references. Verify with your local agriculture officer.'}
                </p>
              </div>
            )}

            {/* Sowing & Harvest Windows */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider block">
                  {isBn ? 'বপন বা রোপণ সময়' : 'Sowing Window'}
                </span>
                <p className="font-semibold text-[#FAFAFA] text-sm">
                  {isBn ? detailCrop.sowing_window.months_bn : detailCrop.sowing_window.months_en}
                </p>
              </div>
              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-[11px] font-mono text-[#737373] uppercase tracking-wider block">
                  {isBn ? 'ফসল কাটার সময়' : 'Harvest Window'}
                </span>
                <p className="font-semibold text-[#FAFAFA] text-sm">
                  {isBn ? detailCrop.harvest_window.months_bn : detailCrop.harvest_window.months_en}
                </p>
              </div>
            </div>

            {/* Growth Stages Timeline */}
            {detailCrop.growth_stages.length > 0 && (
              <div className="p-4 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-2.5">
                <span className="text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#22C55E]" />
                  {isBn ? 'ফসলের বিভিন্ন ধাপ ও সময়কাল' : 'Growth Stages Timeline'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                  {detailCrop.growth_stages.map((stg, i) => (
                    <div key={i} className="p-2.5 rounded-md bg-[#141414] border border-[#262626] text-xs">
                      <span className="text-[10px] font-mono text-[#737373] block mb-0.5">
                        {isBn ? `ধাপ ${i + 1}` : `Stage ${i + 1}`} ({stg.weeks_min}–{stg.weeks_max} {isBn ? 'সপ্তাহ' : 'wks'})
                      </span>
                      <p className="font-medium text-[#FAFAFA]">{isBn ? stg.name_bn : stg.name_en}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agronomic Metrics */}
            <div className="grid sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-[10px] font-mono text-[#737373] uppercase block flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-[#A3A3A3]" />
                  {isBn ? 'তাপমাত্রা' : 'Temperature'}
                </span>
                <p className="font-mono font-semibold text-sm text-[#FAFAFA]">
                  {detailCrop.temperature_c.optimal_min != null
                    ? `${toBn(detailCrop.temperature_c.optimal_min, isBn)}–${toBn(detailCrop.temperature_c.optimal_max, isBn)}°${isBn ? 'সে' : 'C'}`
                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                </p>
                <span className="text-[10px] text-[#737373] block">
                  {isBn ? `ন্যূনতম: ${toBn(detailCrop.temperature_c.base ?? 'নেই', isBn)}°সে` : `Base: ${detailCrop.temperature_c.base ?? 'N/A'}°C`}
                  {detailCrop.temperature_c.critical_max && ` · সংকট: ${detailCrop.temperature_c.critical_max}°C`}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-[10px] font-mono text-[#737373] uppercase block flex items-center gap-1">
                  <Droplets className="w-3 h-3 text-[#A3A3A3]" />
                  {isBn ? 'পানির চাহিদা' : 'Water Need'}
                </span>
                <p className="font-mono font-semibold text-sm text-[#FAFAFA]">
                  {detailCrop.water_need_mm
                    ? `${toBn(detailCrop.water_need_mm.min, isBn)}–${toBn(detailCrop.water_need_mm.max, isBn)} ${isBn ? 'মিমি' : 'mm'}`
                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                </p>
                <span className="text-[10px] text-[#737373] block truncate">
                  {isBn ? detailCrop.irrigation_notes_bn : detailCrop.irrigation_notes_en}
                </span>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-[10px] font-mono text-[#737373] uppercase block flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-[#A3A3A3]" />
                  {isBn ? 'মাটির আর্দ্রতা' : 'Soil Moisture'}
                </span>
                <p className="font-mono font-semibold text-sm text-[#FAFAFA]">
                  {detailCrop.smap_optimal.min != null
                    ? `${Math.round(detailCrop.smap_optimal.min * 100)}%–${Math.round(detailCrop.smap_optimal.max! * 100)}%`
                    : (isBn ? 'তথ্য নেই' : 'N/A')}
                </p>
                <span className="text-[10px] text-[#737373] block">
                  {detailCrop.smap_optimal.min != null ? `${detailCrop.smap_optimal.min} - ${detailCrop.smap_optimal.max} m³/m³` : ''}
                </span>
              </div>
            </div>

            {/* Key Risks */}
            {detailCrop.key_risks_bn.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-[#F59E0B]" />
                  {isBn ? 'প্রধান ঝুঁকি ও সতর্কতা' : 'Key Climate & Agronomic Risks'}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detailCrop.key_risks_bn.map((risk, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-[#0A0A0A] border border-[#262626] text-xs text-[#A3A3A3]"
                    >
                      {isBn ? risk : (detailCrop.key_risks_en[i] || risk)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Algorithm Decision Logic */}
            {detailCrop.decision_rules_bn && detailCrop.decision_rules_bn.length > 0 && (
              <div className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626] space-y-1">
                <span className="text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
                  {isBn ? 'সিদ্ধান্ত লজিক' : 'Algorithm Decision Logic'}
                </span>
                <p className="text-xs text-[#737373] leading-relaxed">
                  {isBn ? detailCrop.decision_rules_bn[0] : (detailCrop.decision_rules_en?.[0] || detailCrop.decision_rules_bn[0])}
                </p>
              </div>
            )}

            {/* Sources & Citations */}
            <div className="border-t border-[#262626] pt-3.5 space-y-1.5">
              <span className="text-xs font-mono text-[#737373] uppercase tracking-wider block">
                {isBn ? 'উৎস ও রেফারেন্স' : 'Sources & Scientific Provenance'}
              </span>
              <div className="space-y-1 text-xs text-[#737373] font-mono">
                {detailCrop.sources.map((s, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-[#22C55E]" />
                    <span className="text-[#A3A3A3]">{s.file}</span>
                    <span>· {s.section}</span>
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
