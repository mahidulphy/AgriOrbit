import React, { useState, useMemo } from 'react';
import {
  ArrowDown,
  HelpCircle,
  Droplet,
  CheckCircle2,
  ShieldCheck,
  Printer,
  Share2,
  Compass,
  ArrowRight,
  Layers,
  Leaf,
  AlertTriangle,
  FileQuestion,
  Calendar,
  Satellite,
  TrendingDown,
  TrendingUp,
  Award,
  Sparkles,
} from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../types';
import { CROPS_DATABASE } from '../data/agriData';
import { getDistrictAdmin } from '../data/bdAdmin';
import { SmsAdvisoryButton } from './dashboard/SmsAdvisoryButton';
import type { EngineResult } from '../lib/engine';
import { formatPriorityLabel, type TelemetryContext } from '../lib/cropSuitability';
import { FAMILY_LABEL } from '../data/crops';
import { toBnDigits } from '../lib/bilingualEmailTemplate';
import {
  generateRotationComparison,
  type RotationStrategy,
  type StrategyCropSeason,
} from '../lib/rotationComparison';
import type { Conditions } from '../lib/conditions';
import type { FieldShift } from '../lib/fieldShift';
import type { ForecastDay } from '../lib/power';

interface SeasonRotationProps {
  selectedDistrict: DistrictId;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
  engineResult?: EngineResult;
  telemetry?: TelemetryContext;
  conditions?: Conditions;
  shift?: FieldShift | null;
  soil?: number | null;
  forecast?: ForecastDay[] | null;
  currentRotation?: {
    rabi?: string;
    kharif1?: string;
    kharif2?: string;
  };
  soilType?: string;
  isSimulating?: boolean;
}

export const SeasonRotation: React.FC<SeasonRotationProps> = ({
  selectedDistrict,
  selectedPriority,
  secondaryPriority,
  language,
  onExplainCrop,
  engineResult,
  telemetry,
  conditions,
  shift,
  soil,
  forecast,
  currentRotation,
  soilType,
  isSimulating = false,
}) => {
  const isBn = language === 'bn';
  const district = getDistrictAdmin(selectedDistrict) ?? {
    nameEn: selectedDistrict,
    nameBn: selectedDistrict,
  };

  // Compute 3-strategy rotation comparison
  const comparison = useMemo(() => {
    return generateRotationComparison({
      conditions: conditions || {
        rain30: 15,
        tMax30: 28,
        tMaxAvg: 26,
        rh: 70,
        et0: 3.5,
        et0Total: 105,
        waterBalance: -40,
        from: '2026-01-01',
        to: '2026-01-31',
      },
      shift: shift || null,
      soil: soil ?? null,
      forecast: forecast || null,
      priority: selectedPriority,
      secondaryPriority: secondaryPriority || null,
      currentRotation: currentRotation || {
        rabi: 'boro',
        kharif1: 'fallow',
        kharif2: 'aman',
      },
      soilType: soilType || 'loam',
      districtId: selectedDistrict,
      districtNameEn: district.nameEn,
      districtNameBn: district.nameBn,
    });
  }, [
    conditions,
    shift,
    soil,
    forecast,
    selectedPriority,
    secondaryPriority,
    currentRotation,
    soilType,
    selectedDistrict,
    district.nameEn,
    district.nameBn,
  ]);

  // Active strategy tab: 'recommended' by default, or 'current', or 'alternative'
  const [activeStrategyId, setActiveStrategyId] = useState<'current' | 'recommended' | 'alternative'>('recommended');

  const activeStrategy: RotationStrategy = useMemo(() => {
    return (
      comparison.strategies.find((s) => s.id === activeStrategyId) ||
      comparison.strategies[1]
    );
  }, [comparison, activeStrategyId]);

  // Helper to convert StrategyCropSeason into rich CropData for explain modal
  const handleExplain = (cropSeason: StrategyCropSeason) => {
    if (cropSeason.isFallow) return;
    const cropKey =
      cropSeason.id === 'boro'
        ? 'boro_rice'
        : cropSeason.id === 'aus'
        ? 'aus_rice'
        : cropSeason.id === 'aman'
        ? 't_aman_rice'
        : cropSeason.id;

    const baseDb =
      CROPS_DATABASE[cropKey] ||
      CROPS_DATABASE[cropSeason.id] || {
        id: cropSeason.id,
        nameEn: cropSeason.nameEn,
        nameBn: cropSeason.nameBn,
        scientificName: cropSeason.scientificName || '',
        category: 'Field Crop',
        seasonEn: cropSeason.seasonEn,
        seasonBn: cropSeason.seasonBn,
        suitabilityScore: cropSeason.score,
        suitabilityTier: cropSeason.score >= 85 ? 'high' : cropSeason.score >= 70 ? 'moderate' : 'marginal',
        waterRequirementEn: cropSeason.waterRequirementEn,
        waterRequirementBn: cropSeason.waterRequirementBn,
        waterDetailEn: `${cropSeason.durationDays} days cycle`,
        waterDetailBn: `${toBnDigits(cropSeason.durationDays)} দিনের চক্র`,
        durationDays: cropSeason.durationDays,
        shortWhyEn: cropSeason.agronomicRoleEn,
        shortWhyBn: cropSeason.agronomicRoleBn,
        explanation: {
          observationsTriggered: [],
          observationsTriggeredBn: [],
          priorityAlignment: activeStrategy.whySuggested.en,
          priorityAlignmentBn: activeStrategy.whySuggested.bn,
          rulesSatisfied: activeStrategy.whySuggested.rulesTriggeredEn,
          rulesSatisfiedBn: activeStrategy.whySuggested.rulesTriggeredBn,
        },
      };

    const richCrop: CropData = {
      ...baseDb,
      suitabilityScore: cropSeason.score,
      suitabilityTier: cropSeason.score >= 85 ? 'high' : cropSeason.score >= 70 ? 'moderate' : 'marginal',
    };

    onExplainCrop(richCrop);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const seqEn = activeStrategy.crops.map((c) => c.nameEn.split(' ')[0]).join(' → ');
    if (navigator.share) {
      navigator
        .share({
          title: `AgriOrbit Crop Rotation - ${activeStrategy.titleEn}`,
          text: `AgriOrbit Strategy (${activeStrategy.titleEn}) for ${district.nameEn}: ${seqEn}`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert(language === 'en' ? 'Link copied to clipboard!' : 'লিংকটি কপি করা হয়েছে!');
    }
  };

  return (
    <section id="rotation-section" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#262626] pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#22C55E] font-mono font-semibold mb-2">
              <span>04</span>
              <span aria-hidden="true">·</span>
              <span>{isBn ? 'নাসা ফিল্ড শিফট শস্য আবর্তন তুলনা' : 'NASA FIELD SHIFT · 3 ROTATION STRATEGIES'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {isBn ? '৩টি শস্য আবর্তন কৌশলের তুলনামূলক বিশ্লেষণ' : 'Compare 3 Rotation Strategies'}
            </h2>
            <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1 max-w-2xl leading-relaxed">
              {isBn
                ? 'আপনার বর্তমান চাষ পদ্ধতির সাথে নাসা কৃত্রিম উপগ্রহ উপাত্ত ও বারি/বিআরআরআই নির্দেশিত সেরা ও বিকল্প টেকসই শস্য পর্যায় পাশাপাশি তুলনা করুন।'
                : 'Compare your existing rotation side-by-side with NASA Earth observation-aligned and alternative agro-ecological pathways.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-[11px] font-mono text-[#FAFAFA] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isBn ? 'রুল-এ: গোত্র পরিবর্তন' : 'Rule A: Family Alternation'}</span>
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-[11px] font-mono text-[#FAFAFA] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isBn ? 'রুল-বি: ডাল নাইট্রোজেন' : 'Rule B: Legume N Recharge'}</span>
            </div>
          </div>
        </div>

        {/* What-If Simulation Active Banner */}
        {isSimulating && (
          <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/40 text-xs font-mono text-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-purple-950/20">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse shrink-0" />
              <div>
                <span className="font-bold text-white mr-1.5">
                  {isBn ? 'পরিবেশগত সিমুলেশন পরিস্থিতি সক্রিয়:' : 'Environmental Scenario Active:'}
                </span>
                <span className="text-purple-300">
                  {isBn
                    ? `মাটির রস ${toBnDigits((soil ?? 0.2).toFixed(2))} m³/m³, বৃষ্টি ${toBnDigits(Math.round(conditions?.rain30 ?? 0))} মিমি, সর্বোচ্চ তাপমাত্রা ${toBnDigits(Math.round(conditions?.tMax30 ?? 0))}°সে`
                    : `Soil Moisture ${(soil ?? 0.2).toFixed(2)} m³/m³, Rain ${Math.round(conditions?.rain30 ?? 0)} mm, Max Temp ${Math.round(conditions?.tMax30 ?? 0)}°C`}
                </span>
              </div>
            </div>
            <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 whitespace-nowrap self-start sm:self-auto">
              {isBn ? '৩টি কৌশলই তাৎক্ষণিক পুনর্মূল্যায়নকৃত' : 'All 3 Strategies Live Recalculated'}
            </span>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* REQUIREMENT 4: SIMPLE COMPARISON ROW ON TOP */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#22C55E]" />
              <h3 className="font-mono text-xs uppercase tracking-wider font-semibold text-[#FAFAFA]">
                {isBn ? 'কৌশলসমূহের সরাসরি তুলনামূলক চিত্র' : 'High-Level Comparison Matrix'}
              </h3>
            </div>
            <span className="text-[11px] font-mono text-[#737373]">
              {isBn ? 'এক নজরে পানি, ডাল, ঝুঁকি ও মূল্যায়ন স্কোর' : 'Summary of Water, Legumes, Climate Risk & Score'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {comparison.strategies.map((strategy) => {
              const isSelected = strategy.id === activeStrategyId;
              const seqDisplay = strategy.crops
                .map((c) => (isBn ? c.nameBn.split(' ')[0] : c.nameEn.split(' ')[0]))
                .join(' → ');

              return (
                <div
                  key={strategy.id}
                  onClick={() => setActiveStrategyId(strategy.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'bg-[#1C1C1C] border-[#22C55E] ring-1 ring-[#22C55E]/40'
                      : 'bg-[#0A0A0A] border-[#262626] hover:border-[#404040]'
                  }`}
                >
                  <div>
                    {/* Header Badge */}
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold tracking-wider ${
                          strategy.id === 'recommended'
                            ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                            : strategy.id === 'current'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}
                      >
                        {isBn ? strategy.tagBn : strategy.tagEn}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#FAFAFA]">
                        {isBn ? `${toBnDigits(strategy.summary.overallScore)}%` : `${strategy.summary.overallScore}%`}
                      </span>
                    </div>

                    <h4 className="font-display text-sm font-semibold text-white mb-1">
                      {isBn ? strategy.titleBn : strategy.titleEn}
                    </h4>

                    {/* Sequence */}
                    <p className="font-mono text-xs text-[#22C55E] font-medium mb-3 truncate" title={seqDisplay}>
                      {seqDisplay}
                    </p>

                    {/* Comparison Row Metrics */}
                    <div className="space-y-2 py-2 border-t border-[#262626] text-xs font-mono">
                      {/* Water Need */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#737373] flex items-center gap-1">
                          <Droplet className="w-3.5 h-3.5 text-blue-400" />
                          <span>{isBn ? 'বার্ষিক পানি:' : 'Annual Water:'}</span>
                        </span>
                        <span className="text-[#FAFAFA] font-medium">
                          {isBn ? toBnDigits(strategy.summary.totalWaterNeedMm) : strategy.summary.totalWaterNeedMm} mm
                          {strategy.summary.waterSavedPctVsBaseline > 0 && (
                            <span className="text-[#22C55E] ml-1">
                              (-{isBn ? toBnDigits(strategy.summary.waterSavedPctVsBaseline) : strategy.summary.waterSavedPctVsBaseline}%)
                            </span>
                          )}
                        </span>
                      </div>

                      {/* Legumes Count */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#737373] flex items-center gap-1">
                          <Leaf className="w-3.5 h-3.5 text-[#22C55E]" />
                          <span>{isBn ? 'ডাল/লেগিউম:' : 'Legume Seasons:'}</span>
                        </span>
                        <span className="text-[#FAFAFA] font-medium">
                          {isBn ? `${toBnDigits(strategy.summary.legumeCount)}/৩` : `${strategy.summary.legumeCount}/3`}
                        </span>
                      </div>

                      {/* Pest Cycle */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#737373]">{isBn ? 'রোগবালাই দমন:' : 'Pest Break:'}</span>
                        <span
                          className={`font-medium ${
                            strategy.summary.pestCycleBroken ? 'text-[#22C55E]' : 'text-amber-400'
                          }`}
                        >
                          {strategy.summary.pestCycleBroken
                            ? isBn
                              ? 'চক্র ভঙ্গ'
                              : 'Broken'
                            : isBn
                            ? 'একই গোত্র ঝুঁকি'
                            : 'Unbroken'}
                        </span>
                      </div>

                      {/* Risk Level */}
                      <div className="flex items-center justify-between">
                        <span className="text-[#737373]">{isBn ? 'ঝুঁকি স্তর:' : 'Climate Risk:'}</span>
                        <span
                          className={`font-semibold ${
                            strategy.summary.riskLevel === 'low'
                              ? 'text-[#22C55E]'
                              : strategy.summary.riskLevel === 'moderate'
                              ? 'text-amber-400'
                              : 'text-red-400'
                          }`}
                        >
                          {isBn ? strategy.summary.riskLevelBn : strategy.summary.riskLevelEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`w-full mt-3 py-1.5 px-3 rounded-lg text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      isSelected
                        ? 'bg-[#22C55E] text-black font-bold'
                        : 'bg-white/5 hover:bg-white/10 text-[#FAFAFA]'
                    }`}
                  >
                    <span>{isSelected ? (isBn ? 'নির্বাচিত বিস্তারিত' : 'Viewing Details') : (isBn ? 'বিস্তারিত দেখুন' : 'Inspect Strategy')}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* DETAILED STRATEGY CARD (Full 3-Season Journey + Evidence + Gaps + Risks) */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl bg-[#141414] border border-[#262626] p-6 sm:p-8 space-y-8">
          {/* Active Strategy Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#262626] pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`text-[11px] font-mono px-2.5 py-0.5 rounded uppercase font-bold tracking-wider ${
                    activeStrategy.id === 'recommended'
                      ? 'bg-[#22C55E]/20 text-[#22C55E] border border-[#22C55E]/30'
                      : activeStrategy.id === 'current'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}
                >
                  {isBn ? activeStrategy.tagBn : activeStrategy.tagEn}
                </span>
                <span className="text-xs text-[#737373] font-mono">
                  {isBn ? 'লক্ষ্য:' : 'Priority:'} {isBn ? activeStrategy.priorityLabelBn : activeStrategy.priorityLabelEn}
                </span>
              </div>
              <h3 className="font-display text-2xl font-bold text-white">
                {isBn ? activeStrategy.titleBn : activeStrategy.titleEn}
              </h3>
            </div>

            {/* Quick Metrics Badges */}
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#262626] text-right">
                <span className="block text-[10px] font-mono text-[#737373] uppercase">
                  {isBn ? 'বার্ষিক পানি' : 'Total Water'}
                </span>
                <span className="font-mono text-base font-bold text-blue-400">
                  {isBn ? toBnDigits(activeStrategy.summary.totalWaterNeedMm) : activeStrategy.summary.totalWaterNeedMm} mm
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0A0A0A] border border-[#262626] text-right">
                <span className="block text-[10px] font-mono text-[#737373] uppercase">
                  {isBn ? 'উপযোগিতা স্কোর' : 'Strategy Score'}
                </span>
                <span className="font-mono text-base font-bold text-[#22C55E]">
                  {isBn ? `${toBnDigits(activeStrategy.summary.overallScore)}%` : `${activeStrategy.summary.overallScore}%`}
                </span>
              </div>
            </div>
          </div>

          {/* 3-Season Journey Sequence Cards */}
          <div>
            <h4 className="font-mono text-xs uppercase tracking-wider text-[#A3A3A3] mb-4 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{isBn ? 'বার্ষিক ৩টি মৌসুমের শস্য পর্যায়' : 'Annual 3-Season Sequence'}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {activeStrategy.crops.map((cropSeason, index) => {
                const isLast = index === activeStrategy.crops.length - 1;
                return (
                  <div
                    key={`${activeStrategy.id}-${cropSeason.season}-${cropSeason.id}`}
                    className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] flex flex-col justify-between hover:border-[#404040] transition-colors relative group"
                  >
                    <div>
                      {/* Top Season Number & Month Range */}
                      <div className="flex items-center justify-between text-xs font-mono text-[#737373] mb-2.5">
                        <span className="text-[#22C55E] font-bold uppercase">
                          {isBn ? `০${toBnDigits(index + 1)}` : `0${index + 1}`} · {isBn ? cropSeason.seasonBn : cropSeason.seasonEn}
                        </span>
                        <span>{isBn ? cropSeason.monthsBn : cropSeason.monthsEn}</span>
                      </div>

                      {/* Badges: Family & Legume */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-[#FAFAFA] border border-[#262626]">
                          {isBn ? cropSeason.familyLabelBn : cropSeason.familyLabelEn}
                        </span>
                        {cropSeason.isLegume && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-[#22C55E] border border-emerald-500/20 font-semibold">
                            {isBn ? 'ডাল (নাইট্রোজেন)' : 'Legume (N-fixing)'}
                          </span>
                        )}
                        {cropSeason.isFallow && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                            {isBn ? 'পতিত জমি' : 'Fallow Field'}
                          </span>
                        )}
                      </div>

                      {/* Crop Name & Score */}
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <h5 className="font-display text-xl font-bold text-white">
                          {isBn ? cropSeason.nameBn : cropSeason.nameEn}
                        </h5>
                        {!cropSeason.isFallow && (
                          <span className="font-mono text-sm font-bold text-[#22C55E]">
                            {isBn ? `${toBnDigits(cropSeason.score)}%` : `${cropSeason.score}%`}
                          </span>
                        )}
                      </div>

                      {/* Duration */}
                      {!cropSeason.isFallow ? (
                        <span className="text-xs text-[#737373] font-mono block mb-3">
                          {isBn ? `${toBnDigits(cropSeason.durationDays)} দিন চাষকাল` : `${cropSeason.durationDays} Days growth duration`}
                        </span>
                      ) : (
                        <span className="text-xs text-amber-500/80 font-mono block mb-3">
                          {isBn ? 'অনাবাদী / মাটি বিশ্রাম' : 'Uncultivated / Fallow rest'}
                        </span>
                      )}

                      {/* Agronomic Function */}
                      <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] text-xs text-[#A3A3A3] leading-relaxed mb-4">
                        <span className="text-[10px] uppercase font-mono text-[#FAFAFA] block mb-1">
                          {isBn ? 'পরিক্রমায় ভূমিকা' : 'Agronomic Role'}:
                        </span>
                        {isBn ? cropSeason.agronomicRoleBn : cropSeason.agronomicRoleEn}
                      </div>
                    </div>

                    {/* Bottom Water & Explain */}
                    <div className="pt-3 border-t border-[#262626] flex items-center justify-between">
                      <span className="text-xs font-mono text-[#FAFAFA]">
                        {cropSeason.isFallow
                          ? isBn
                            ? 'সেচ লাগে না'
                            : 'Zero irrigation'
                          : isBn
                          ? `${cropSeason.waterRequirementBn} পানি (${toBnDigits(cropSeason.waterNeedMinMm)}-${toBnDigits(cropSeason.waterNeedMaxMm)} মিমি)`
                          : `${cropSeason.waterRequirementEn} Water (${cropSeason.waterNeedMinMm}-${cropSeason.waterNeedMaxMm} mm)`}
                      </span>

                      {!cropSeason.isFallow && (
                        <button
                          type="button"
                          onClick={() => handleExplain(cropSeason)}
                          className="text-xs font-semibold text-[#22C55E] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <span>{isBn ? 'কারণ' : 'Why'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* REQUIREMENT 3.A: WHY SUGGESTED */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#22C55E]" />
              <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                {isBn ? 'কৌশলটির কারণ ও সারসংক্ষেপ (Why Suggested)' : 'Why This Strategy Was Suggested'}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-[#A3A3A3] leading-relaxed">
              {isBn ? activeStrategy.whySuggested.bn : activeStrategy.whySuggested.en}
            </p>

            {activeStrategy.whySuggested.rulesTriggeredEn.length > 0 && (
              <div className="pt-2 flex flex-wrap gap-2">
                {(isBn ? activeStrategy.whySuggested.rulesTriggeredBn : activeStrategy.whySuggested.rulesTriggeredEn).map((rule, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-[#141414] border border-[#262626] text-xs font-mono text-[#FAFAFA]"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E]" />
                    <span>{rule}</span>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* REQUIREMENT 3.B: EVIDENCE (Real satellite & BARI values / "No data") */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <div className="flex items-center gap-2">
                <Satellite className="w-4 h-4 text-[#22C55E]" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                  {isBn ? 'বাস্তব প্রমাণ ও উপাত্ত (Evidence & Satellite Observations)' : 'Supporting Evidence & Satellite Observations'}
                </h4>
              </div>
              <span className="text-[10px] font-mono text-[#737373]">
                {isBn ? 'শুধুমাত্র আসল উপাত্ত — অনুপস্থিত থাকলে "উপাত্ত নেই"' : 'Real observations only — "No data" if unobserved'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {/* NASA POWER Tmax */}
              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626]">
                <span className="block text-[10px] font-mono text-[#737373] uppercase mb-1">
                  {isBn ? 'নাসা পাওয়ার সর্বোচ্চ তাপমাত্রা' : 'NASA POWER Tmax'}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {activeStrategy.evidence.nasaPowerTMax}
                </span>
              </div>

              {/* NASA POWER 30d Rain */}
              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626]">
                <span className="block text-[10px] font-mono text-[#737373] uppercase mb-1">
                  {isBn ? 'নাসা পাওয়ার ৩০ দিনের বৃষ্টি' : 'NASA POWER 30d Rain'}
                </span>
                <span className="font-mono text-sm font-bold text-white">
                  {activeStrategy.evidence.nasaPowerRain30d}
                </span>
              </div>

              {/* SMAP Soil Moisture */}
              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626]">
                <span className="block text-[10px] font-mono text-[#737373] uppercase mb-1">
                  {isBn ? 'নাসা স্ম্যাপ মাটির আর্দ্রতা' : 'NASA SMAP Soil Moisture'}
                </span>
                <span className="font-mono text-sm font-bold text-[#22C55E]">
                  {activeStrategy.evidence.smapSoilMoisture}
                </span>
              </div>

              {/* MODIS NDVI */}
              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626]">
                <span className="block text-[10px] font-mono text-[#737373] uppercase mb-1">
                  {isBn ? 'নাসা মোডিস ভেজিটেশন (NDVI)' : 'NASA MODIS NDVI'}
                </span>
                <span className="font-mono text-sm font-bold text-[#22C55E]">
                  {activeStrategy.evidence.modisNdvi}
                </span>
              </div>

              {/* Decadal Shift */}
              <div className="p-3 rounded-lg bg-[#141414] border border-[#262626] col-span-2 sm:col-span-1">
                <span className="block text-[10px] font-mono text-[#737373] uppercase mb-1">
                  {isBn ? 'দশকওয়ারি বৃষ্টি পরিবর্তন' : 'Decadal Rain Shift'}
                </span>
                <span className="font-mono text-xs text-[#FAFAFA] block leading-tight">
                  {isBn ? activeStrategy.evidence.nasaPowerRainShift : activeStrategy.evidence.nasaPowerRainShift}
                </span>
              </div>
            </div>

            {/* BARI/BRRI Guidance */}
            <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] text-xs font-mono text-[#A3A3A3] flex items-start gap-2">
              <span className="text-[#22C55E] font-bold shrink-0">{isBn ? 'কৃষি নির্দেশিকা:' : 'Agronomic Guidance:'}</span>
              <span>{isBn ? activeStrategy.evidence.bariGuidance.bn : activeStrategy.evidence.bariGuidance.en}</span>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* REQUIREMENT 3.C: BENEFITS */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#22C55E]" />
              <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                {isBn ? 'প্রত্যাশিত সুবিধাসমূহ (Benefits & Impacts)' : 'Expected Benefits & Agro-Ecological Gains'}
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Water benefit */}
              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] space-y-1">
                <span className="text-xs font-mono font-bold text-blue-400 flex items-center gap-1.5">
                  <Droplet className="w-3.5 h-3.5" />
                  <span>{isBn ? 'পানির ব্যবহার ও সাশ্রয়' : 'Water Use Footprint'}</span>
                </span>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  {isBn ? activeStrategy.benefits.waterUseBn : activeStrategy.benefits.waterUseEn}
                </p>
              </div>

              {/* Nitrogen benefit */}
              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] space-y-1">
                <span className="text-xs font-mono font-bold text-[#22C55E] flex items-center gap-1.5">
                  <Leaf className="w-3.5 h-3.5" />
                  <span>{isBn ? 'মাটির জৈব নাইট্রোজেন' : 'Biological Nitrogen Balance'}</span>
                </span>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  {isBn ? activeStrategy.benefits.nitrogenBn : activeStrategy.benefits.nitrogenEn}
                </p>
              </div>

              {/* Pest Break benefit */}
              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] space-y-1">
                <span className="text-xs font-mono font-bold text-purple-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'রোগবালাই ও পোকা দমন' : 'Pest-Cycle Interruption'}</span>
                </span>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  {isBn ? activeStrategy.benefits.pestBreakBn : activeStrategy.benefits.pestBreakEn}
                </p>
              </div>

              {/* Climate Resilience benefit */}
              <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] space-y-1">
                <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  <span>{isBn ? 'আবহাওয়ার চরমভাবাপন্নতা প্রতিরোধ' : 'Climate & Heat Resilience'}</span>
                </span>
                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  {isBn ? activeStrategy.benefits.resilienceBn : activeStrategy.benefits.resilienceEn}
                </p>
              </div>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* REQUIREMENT 3.D & 3.E: INFORMATION GAPS & LOCAL REVIEW RISKS */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Information Gaps */}
            <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-3">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-4 h-4 text-amber-400" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                  {isBn ? 'উপাত্তের সীমাবদ্ধতা (Information Gaps)' : 'Information Gaps (Unseen from Space)'}
                </h4>
              </div>
              <p className="text-[11px] text-[#737373] leading-relaxed">
                {isBn
                  ? 'নাসা স্যাটেলাইট উপগ্রহ থেকে সবকিছু পর্যবেক্ষণ করতে পারে না। নিম্নলিখিত বিষয়গুলো স্থানীয়ভাবে প্রযোজ্য:'
                  : 'NASA satellites provide regional observations. The following field conditions cannot be observed remotely:'}
              </p>
              <ul className="space-y-2 text-xs text-[#A3A3A3]">
                {(isBn ? activeStrategy.informationGaps.bn : activeStrategy.informationGaps.en).map((gap, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                    <span>{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Risks Needing Local Review */}
            <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#22C55E]" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                  {isBn ? 'স্থানীয় কৃষি কর্মকর্তা পর্যালোচনা (Local Review Needed)' : 'Risks Needing Local Review'}
                </h4>
              </div>
              <p className="text-[11px] text-[#737373] leading-relaxed">
                {isBn
                  ? 'চূড়ান্ত বীজ ক্রয় ও বপনের পূর্বে আপনার এলাকার উপ-সহকারী কৃষি কর্মকর্তা (SAAO) বা উপজেলা কৃষি অফিসের সাথে কথা বলুন:'
                  : 'Prior to purchasing seeds or sowing, consult your local Sub-Assistant Agriculture Officer (SAAO) or Upazila Agriculture Office:'}
              </p>
              <ul className="space-y-2 text-xs text-[#A3A3A3]">
                {(isBn ? activeStrategy.risksNeedingLocalReview.bn : activeStrategy.risksNeedingLocalReview.en).map((risk, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] mt-1.5 shrink-0" />
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* REQUIREMENT 3.F: BARE-FIELD PERIODS */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="p-5 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <h4 className="font-mono text-xs uppercase tracking-wider font-semibold text-white">
                  {isBn ? 'অনাবাদী / পতিত সময়কাল ও মাটি সুরক্ষা' : 'Bare-Field Periods & Ground Cover Advisory'}
                </h4>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {isBn
                  ? `খালি জমি: ${toBnDigits(activeStrategy.bareFieldPeriods.daysEmpty)} দিন`
                  : `Empty Duration: ~${activeStrategy.bareFieldPeriods.daysEmpty} Days`}
              </span>
            </div>

            <p className="text-xs text-[#A3A3A3] leading-relaxed">
              {isBn ? activeStrategy.bareFieldPeriods.recommendationBn : activeStrategy.bareFieldPeriods.recommendationEn}
            </p>
          </div>

          {/* ────────────────────────────────────────────────────────────────────────── */}
          {/* DECISION SUPPORT CERTIFICATE & ACTIONS */}
          {/* ────────────────────────────────────────────────────────────────────────── */}
          <div className="pt-6 border-t border-[#262626] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#737373]">
              <ShieldCheck className="w-4 h-4 text-[#22C55E]" />
              <span>
                {isBn
                  ? 'এগ্রিঅরবিট তথ্যভিত্তিক সিদ্ধান্ত সহায়তা দেয়। জমির চূড়ান্ত সিদ্ধান্ত কৃষকের নিজের।'
                  : 'AgriOrbit provides explainable decision support. Farmers make the final decision.'}
              </span>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
              <SmsAdvisoryButton
                district={district.nameEn}
                language={language}
              />
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#262626] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isBn ? 'প্রিন্ট' : 'Print Advisory'}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="px-5 py-2.5 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none shadow-none"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{isBn ? 'শেয়ার' : 'Share Plan'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
