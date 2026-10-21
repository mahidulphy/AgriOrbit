import React from 'react';
import { ArrowDown, HelpCircle, Droplet, Sparkles, CheckCircle2, ShieldCheck, Printer, Share2, Compass, ArrowRight, Layers, Leaf } from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../types';
import { ROTATION_PLANS, CROPS_DATABASE } from '../data/agriData';
import { getDistrictAdmin } from '../data/bdAdmin';
import { IMAGES } from '../data/assets';
import { SmsAdvisoryButton } from './dashboard/SmsAdvisoryButton';
import type { EngineResult } from '../lib/engine';
import { formatPriorityLabel, type TelemetryContext } from '../lib/cropSuitability';
import { FAMILY_LABEL } from '../data/crops';

interface SeasonRotationProps {
  selectedDistrict: DistrictId;
  selectedPriority: FarmerPriorityId;
  language: Language;
  onExplainCrop: (crop: CropData) => void;
  engineResult?: EngineResult;
  telemetry?: TelemetryContext;
}

export const SeasonRotation: React.FC<SeasonRotationProps> = ({
  selectedDistrict,
  selectedPriority,
  language,
  onExplainCrop,
  engineResult,
  telemetry,
}) => {
  const district = getDistrictAdmin(selectedDistrict) ?? {
    nameEn: selectedDistrict,
    nameBn: selectedDistrict,
  };
  const rotationPlan = ROTATION_PLANS[selectedPriority];

  // Map engineResult.picks if available, otherwise fall back to static rotation plan
  const dynamicSeasons = engineResult
    ? engineResult.picks.map((pick) => {
        const cropKey =
          pick.crop.id === 'boro'
            ? 'boro_rice'
            : pick.crop.id === 'aus'
            ? 'aus_rice'
            : pick.crop.id === 'aman'
            ? 't_aman_rice'
            : pick.crop.id;
        const dbCrop = CROPS_DATABASE[cropKey] || {
          id: pick.crop.id,
          nameEn: pick.crop.nameEn,
          nameBn: pick.crop.nameBn,
          scientificName: '',
          seasonEn: pick.season === 'rabi' ? 'Rabi' : pick.season === 'kharif1' ? 'Kharif-1' : 'Kharif-2',
          seasonBn: pick.season === 'rabi' ? 'রবি' : pick.season === 'kharif1' ? 'খরিফ-১' : 'খরিফ-২',
          suitabilityScore: pick.score,
          suitabilityTier: pick.score >= 85 ? 'high' : pick.score >= 70 ? 'moderate' : 'marginal',
          waterRequirementEn: pick.crop.water === 'low' ? 'Low' : pick.crop.water === 'high' ? 'High' : 'Moderate',
          waterRequirementBn: pick.crop.water === 'low' ? 'কম' : pick.crop.water === 'high' ? 'বেশি' : 'মাঝারি',
          waterDetailEn: `${pick.crop.days} days cycle`,
          waterDetailBn: `${pick.crop.days} দিনের চক্র`,
          durationDays: pick.crop.days,
          shortWhyEn: '',
          shortWhyBn: '',
          explanation: {
            observationsTriggered: [],
            observationsTriggeredBn: [],
            priorityAlignment: '',
            priorityAlignmentBn: '',
            rulesSatisfied: [],
            rulesSatisfiedBn: [],
          },
        };

        const richCrop: CropData = {
          ...dbCrop,
          suitabilityScore: pick.score,
          suitabilityTier: pick.score >= 85 ? 'high' : pick.score >= 70 ? 'moderate' : 'marginal',
        };

        const seasonLabel = {
          rabi: { en: 'Rabi', bn: 'রবি', monthsEn: 'Nov – Feb', monthsBn: 'নভেম্বর – ফেব্রুয়ারি' },
          kharif1: { en: 'Kharif-1', bn: 'খরিফ-১', monthsEn: 'Mar – Jun', monthsBn: 'মার্চ – জুন' },
          kharif2: { en: 'Kharif-2', bn: 'খরিফ-২', monthsEn: 'Jul – Oct', monthsBn: 'জুলাই – অক্টোবর' },
        }[pick.season];

        let roleEn = '';
        let roleBn = '';
        if (pick.crop.family === 'legume') {
          roleEn = 'Biological Rhizobium nitrogen fixation naturally enriches topsoil organic fertility for subsequent crops in line with BARI/BRRI rotation standards.';
          roleBn = 'শিকড়ে রাইজোবিয়াম ব্যাকটেরিয়ার মাধ্যমে মাটিতে প্রাকৃতিক নাইট্রোজেন সংবন্ধন ঘটিয়ে পরবর্তী ফসলের জন্য মাটির স্বাস্থ্য বাড়ায়।';
        } else if (pick.crop.family === 'mustard') {
          roleEn = 'Deep tap-root utilizes residual moisture; short duration frees field rapidly for summer pulse sowing.';
          roleBn = 'গভীর শিকড়ে মাটির নিচের রস ব্যবহার করে; স্বল্প সময়ে ঘরে ওঠায় পরবর্তী ডাল চাষের পথ সুগম করে।';
        } else if (pick.crop.id === 'aman') {
          roleEn = 'Monsoon rainwater capture; tall canopy suppresses weeds with zero diesel pumping needed.';
          roleBn = 'বর্ষার বৃষ্টির পূর্ণ সদ্ব্যবহার; দ্রুত বেড়ে আগাছা দমন করে এবং কোনো কৃত্রিম সেচ লাগে না।';
        } else if (pick.crop.id === 'boro') {
          roleEn = 'High-yielding winter grain harvest; requires managed irrigation and subsequent pulse recharge.';
          roleBn = 'শীতকালীন প্রধান খাদ্যশস্য; উচ্চ ফলনের জন্য সুষম সেচ ব্যবস্থাপনা প্রয়োজন।';
        } else {
          roleEn = 'Diversifies crop revenue, disrupts soil-borne pest cycles, and optimizes seasonal field utilization.';
          roleBn = 'ফসলের বহুমুখীকরণ নিশ্চিত করে, মাটির রোগবালাই চক্র ভেঙে দেয় এবং উৎপাদন বৃদ্ধি করে।';
        }

        return {
          seasonEn: seasonLabel.en,
          seasonBn: seasonLabel.bn,
          monthsEn: seasonLabel.monthsEn,
          monthsBn: seasonLabel.monthsBn,
          crop: richCrop,
          cropModel: pick.crop,
          score: pick.score,
          optimalSowing: pick.optimalSowing,
          agronomicRoleEn: roleEn,
          agronomicRoleBn: roleBn,
        };
      })
    : null;

  const displaySeasons = dynamicSeasons || rotationPlan.seasons.map(s => ({
    seasonEn: s.seasonEn,
    seasonBn: s.seasonBn,
    monthsEn: s.monthsEn,
    monthsBn: s.monthsBn,
    crop: s.crop,
    cropModel: null,
    score: s.crop.suitabilityScore,
    optimalSowing: false,
    agronomicRoleEn: s.agronomicRoleEn,
    agronomicRoleBn: s.agronomicRoleBn,
  }));

  const sequenceNamesEn = displaySeasons.map((s) => s.crop.nameEn.split(' ')[0]).join(' → ');
  const sequenceNamesBn = displaySeasons.map((s) => s.crop.nameBn).join(' → ');

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: 'AgriOrbit Crop Rotation Advisory',
        text: `AgriOrbit Recommendation for ${district.nameEn}: ${sequenceNamesEn}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert(language === 'en' ? 'Link copied to clipboard!' : 'লিংকটি কপি করা হয়েছে!');
    }
  };

  return (
    <section id="rotation-section" className="py-6 sm:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Editorial Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-12 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-2">
              <span>04</span>
              <span aria-hidden="true">·</span>
              <span>{language === 'en' ? 'ANNUAL AGRO-CYCLE' : 'বার্ষিক শস্য পরিক্রমা'}</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {language === 'en' ? 'Recommended 3-Season Rotation' : '৩-মৌসুমী টেকসই শস্য পরিক্রমা'}
            </h2>
            <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1 max-w-xl">
              {language === 'en'
                ? 'An aligned annual strategy replacing high-draw monoculture with moisture-efficient pulse rotations.'
                : 'একক ফসলের ক্ষতি রোধ করে ৩টি মৌসুমের একটি ধারাবাহিক ও সুষম খাদ্য-শস্য চক্র।'}
            </p>
          </div>

          {/* Strategy Impact Badges */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[#0B1626] border border-white/10 flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#00E5FF]">~{rotationPlan.estimatedWaterSavingPct}%</span>
              <span className="text-[11px] text-[#8FA3B8] font-mono uppercase">Water Saved</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1626] border border-white/10 flex items-center gap-3">
              <span className="font-mono text-xl font-bold text-[#B8FF3D]">+{rotationPlan.soilHealthGainPct}%</span>
              <span className="text-[11px] text-[#8FA3B8] font-mono uppercase">Soil Gain</span>
            </div>
          </div>
        </div>

        {/* Verified Agronomic Rotation Rules Badges */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Rule A: Botanical Family Alternation Verified' : 'রুল ক: গোত্র আবর্তন নিশ্চিত (একক ফসল পরিহার)'}</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 text-xs font-mono font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Rule B: Biological Nitrogen Balance Active' : 'রুল খ: প্রাকৃতিক নাইট্রোজেন সংবন্ধন সক্রিয়'}</span>
          </div>
          {engineResult?.nutrientTrail && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 text-slate-300 border border-white/10 text-xs font-mono">
              <span className="text-[#8FA3B8]">{language === 'en' ? 'Running Soil N Trail' : 'মাটির নাইট্রোজেন প্রবাহ'}:</span>
              <span className="text-[#B8FF3D] font-bold">
                {engineResult.nutrientTrail.map((n) => (n > 0 ? `+${n}` : `${n}`)).join(' → ')} N
              </span>
            </div>
          )}
        </div>

        {/* 3-Season Journey Cards with Visual Connector Rails */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative">
          {displaySeasons.map((season, index) => {
            const crop = season.crop;
            const isLast = index === displaySeasons.length - 1;

            return (
              <div
                key={`${season.seasonEn}-${crop.id}`}
                className="p-6 sm:p-8 rounded-2xl bg-[#0B1626] border border-white/10 hover:border-white/20 transition-all flex flex-col justify-between relative group"
              >
                <div>
                  {/* Top Season Number & Months */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-3">
                    <span className="text-[#B8FF3D] font-bold uppercase">
                      0{index + 1} · {language === 'en' ? season.seasonEn : season.seasonBn}
                    </span>
                    <span>{language === 'en' ? season.monthsEn : season.monthsBn}</span>
                  </div>

                  {/* Botanical Family Badge if available */}
                  {season.cropModel && (
                    <div className="mb-2">
                      <span className="inline-block text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-white/5 text-[#00E5FF] border border-white/10">
                        {language === 'en'
                          ? FAMILY_LABEL[season.cropModel.family]?.en
                          : FAMILY_LABEL[season.cropModel.family]?.bn}
                      </span>
                    </div>
                  )}

                  {/* Crop Name & Score */}
                  <div className="flex items-baseline justify-between gap-2 mb-1">
                    <h3 className="font-display text-2xl font-bold text-white">
                      {language === 'en' ? crop.nameEn : crop.nameBn}
                    </h3>
                    <span className="font-mono text-sm font-bold text-[#B8FF3D]">
                      {season.score}%
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 font-mono block mb-4">
                    {crop.durationDays} {language === 'en' ? 'Days growth duration' : 'দিন সময়কাল'}
                  </span>

                  {/* Agronomic Role in Cycle */}
                  <div className="p-4 rounded-xl bg-[#050B14] border border-white/5 text-xs text-slate-300 leading-relaxed mb-6">
                    <span className="text-[10px] uppercase font-mono text-white block mb-1">
                      {language === 'en' ? 'Agronomic Function' : 'পরিক্রমায় ভূমিকা'}:
                    </span>
                    {language === 'en' ? season.agronomicRoleEn : season.agronomicRoleBn}
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#00E5FF]">
                    {language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn} Water
                  </span>

                  <button
                    onClick={() => onExplainCrop(crop)}
                    className="text-xs font-semibold text-[#B8FF3D] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{language === 'en' ? 'Explain Why' : 'কারণ দেখুন'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Actionable Editorial Decision Support Certificate */}
        <div className="rounded-3xl bg-[#0B1626] border border-[#B8FF3D]/40 p-8 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#B8FF3D]" />
              <span>{language === 'en' ? 'AgriOrbit Decision Support Advisory' : 'এগ্রিঅরবিট চূড়ান্ত কৃষি পরামর্শ'}</span>
            </div>

            <h3 className="font-display text-xl sm:text-2xl font-bold text-white mb-4 leading-snug">
              {language === 'en' ? (
                <>
                  "Based on field observations in{' '}
                  <span className="text-[#00E5FF]">{district.nameEn}</span>, your priority to{' '}
                  <span className="text-[#B8FF3D]">{formatPriorityLabel(selectedPriority, 'en')}</span>, and NASA Earth observations, AgriOrbit recommends considering the sequence{' '}
                  <span className="text-white underline decoration-[#B8FF3D]">
                    {sequenceNamesEn}
                  </span>{' '}
                  for the upcoming annual cycle."
                </>
              ) : (
                <>
                  "বর্তমান{' '}
                  <span className="text-[#00E5FF]">{district.nameBn}</span>{' '}
                  জেলার উপগ্রহ পরিস্থিতি, আপনার{' '}
                  <span className="text-[#B8FF3D]">
                    {selectedPriority === 'save_water' && 'পানি সাশ্রয়'}
                    {selectedPriority === 'improve_soil' && 'মাটির উর্বরতা বৃদ্ধি'}
                    {selectedPriority === 'maximize_profit' && 'সর্বোচ্চ লাভ'}
                    {selectedPriority === 'maximize_yield' && 'সর্বোচ্চ ফলন'}
                    {selectedPriority === 'lower_cost' && 'কম খরচ'}
                    {selectedPriority === 'reduce_risk' && 'জলবায়ু ঝুঁকি হ্রাস'}
                  </span>{' '}
                  অগ্রাধিকার এবং নাসার পর্যবেক্ষণ অনুযায়ী, এগ্রিঅরবিট{' '}
                  <span className="text-white underline decoration-[#B8FF3D]">
                    {sequenceNamesBn}
                  </span>{' '}
                  শস্য আবর্তন বিবেচনা করার পরামর্শ দিচ্ছে।"
                </>
              )}
            </h3>

            <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed mb-8">
              {language === 'en' ? rotationPlan.summaryEn : rotationPlan.summaryBn}
            </p>

            {/* Print & Share Actions */}
            <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-[#8FA3B8]">
                <ShieldCheck className="w-4 h-4 text-[#B8FF3D] shrink-0" />
                <span>
                  {language === 'en'
                    ? 'AgriOrbit provides explainable decision support. Farmers make the final decision.'
                    : 'এগ্রিঅরবিট তথ্যভিত্তিক সিদ্ধান্ত সহায়তা দেয়। চূড়ান্ত সিদ্ধান্ত কৃষকের নিজের।'}
                </span>
              </div>

              <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 w-full sm:w-auto">
                <SmsAdvisoryButton
                  district={district.nameEn}
                  language={language}
                />
                <button
                  onClick={handlePrint}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Print Advisory' : 'প্রিন্ট'}</span>
                </button>
                <button
                  onClick={handleShare}
                  className="px-5 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none shadow-md"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{language === 'en' ? 'Share Plan' : 'শেয়ার'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
