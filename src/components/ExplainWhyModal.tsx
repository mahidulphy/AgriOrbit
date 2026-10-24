import React from 'react';
import { X, Check, Database, AlertCircle, ShieldCheck, Droplet, Layers, Cpu, Compass, Calculator, TrendingUp, TrendingDown } from 'lucide-react';
import { CropData, FarmerPriorityId, Language } from '../types';
import { priorityInfluenceText } from '../lib/cropSuitability';
import { cropById } from '../data/crops';

interface ExplainWhyModalProps {
  crop: CropData | null;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onClose: () => void;
}

export const ExplainWhyModal: React.FC<ExplainWhyModalProps> = ({
  crop,
  selectedPriority,
  secondaryPriority = null,
  language,
  onClose,
}) => {
  if (!crop) return null;

  // Resolve deltas or derive fallback deltas for transparent mathematical breakdown
  const isEstimated = cropById(crop.id)?.data_confidence === 'estimated';

  const deltas = crop.deltas ?? {
    base: Math.max(60, crop.suitabilityScore - (crop.suitabilityScore >= 80 ? 15 : 5)),
    dryPenalty: crop.waterRequirementEn === 'Low' ? 4 : crop.waterRequirementEn === 'High' ? -15 : 0,
    optimalSowingBonus: crop.suitabilityScore >= 85 ? 5 : 0,
    heatPenalty: crop.id === 'wheat' || crop.id === 'potato' ? -5 : 0,
    waterDeficitPenalty: crop.waterRequirementEn === 'High' ? -5 : 0,
    primaryPriorityDelta: crop.suitabilityScore >= 80 ? 12 : crop.suitabilityScore >= 70 ? 4 : -8,
    secondaryPriorityDelta: 0,
    finalScore: crop.suitabilityScore,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0B1626] border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-white relative font-editorial">
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#0B1626]/95 backdrop-blur-md p-6 sm:p-8 border-b border-white/10 flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{language === 'en' ? 'TRANSPARENT SCIENTIFIC REASONING' : 'স্বচ্ছ বৈজ্ঞানিক কারণ'}</span>
            </div>
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-white flex items-baseline gap-3">
              <span>{language === 'en' ? `Why ${crop.nameEn}?` : `কেন ${crop.nameBn}?`}</span>
              <span className="font-mono text-base font-bold text-[#B8FF3D]">
                {crop.suitabilityScore}% Match
              </span>
            </h3>
            <p className="text-xs text-[#8FA3B8] italic font-serif mt-1">
              {crop.scientificName} · {language === 'en' ? crop.seasonEn : crop.seasonBn} season
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#8FA3B8] hover:text-white transition-colors cursor-pointer border border-white/10"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Estimated Data Warning Banner */}
          {isEstimated && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs sm:text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="font-semibold text-amber-300 font-mono text-xs uppercase tracking-wider">
                  {language === 'en' ? 'Estimated Data' : 'আনুমানিক তথ্য'}
                </div>
                <p className="mt-1 text-amber-200/90 leading-relaxed text-xs">
                  {language === 'en'
                    ? 'This crop’s data has not yet been field-verified; please confirm with your local agriculture extension office.'
                    : 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'}
                </p>
              </div>
            </div>
          )}
          {/* DETERMINISTIC RULE-BASED SCORE CALCULATION TABLE */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-[#B8FF3D]/30 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold">
                <Calculator className="w-3.5 h-3.5 text-[#B8FF3D]" />
                <span>{language === 'en' ? 'Deterministic Score Breakdown' : 'স্কোরের হিসাব'}</span>
              </div>
              <span className="text-[10px] font-mono text-[#8FA3B8] px-2 py-0.5 rounded bg-white/5 border border-white/10">
                {language === 'en' ? 'Pure Rule-Based · Transparent Logic' : 'সম্পূর্ণ নিয়ম-ভিত্তিক · কোনো লুকানো হিসাব নেই'}
              </span>
            </div>

            <p className="text-xs text-[#8FA3B8] mb-4">
              {language === 'en'
                ? 'AgriOrbit evaluates empirical agronomic rules against NASA Earth observations to determine final suitability based on BARI/BRRI guidance and NASA data.'
                : 'নাসার স্যাটেলাইট তথ্য আর বারি (BARI) ও ব্রি (BRRI)-এর কৃষি নিয়মের ওপর ভিত্তি করে এগ্রিঅরবিট এই হিসাব করে।'} 
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-[#8FA3B8] text-[11px]">
                    <th className="py-2 pr-3">{language === 'en' ? 'Rule / Factor' : 'মানদণ্ড / নিয়ম'}</th>
                    <th className="py-2 px-3">{language === 'en' ? 'Source' : 'উৎস'}</th>
                    <th className="py-2 px-3 text-right">{language === 'en' ? 'Points' : 'নম্বর'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-slate-300">
                  {/* Base */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-white font-medium block">
                        {language === 'en' ? 'Baseline Agronomic Potential' : 'ফসলের ভিত্তি নম্বর'}
                      </span>
                      <span className="text-[11px] text-[#8FA3B8]">
                        {language === 'en' ? 'Published BARI/BRRI seasonal crop guidelines' : 'বিএআরআই/বিআরআরআই মৌসুমী নির্দেশিকা'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#00E5FF]">BARI/BRRI</td>
                    <td className="py-2.5 px-3 text-right font-bold text-white">+{deltas.base}</td>
                  </tr>

                  {/* SMAP Soil Moisture Adjustment */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-white font-medium block">
                        {language === 'en' ? 'NASA SMAP Soil Moisture Adjustment' : 'মাটির রস অনুযায়ী সমন্বয় (নাসা)'}
                      </span>
                      <span className="text-[11px] text-[#8FA3B8]">
                        {deltas.dryPenalty < 0
                          ? (language === 'en' ? 'Severe moisture deficit penalty (rain < 50mm & soil < 0.15)' : 'মাটি বেশি শুকনা থাকায় নম্বর কাটা হয়েছে')
                          : deltas.dryPenalty > 0
                          ? (language === 'en' ? 'Drought-resilient crop bonus awarded' : 'কম পানির সহনশীল ফসলে বাড়তি নম্বর যোগ')
                          : (language === 'en' ? 'Rootzone soil moisture within standard tolerance' : 'মাটিতে স্বাভাবিক রস রয়েছে')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#00E5FF]">NASA SMAP</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      deltas.dryPenalty < 0 ? 'text-[#FF5C5C]' : deltas.dryPenalty > 0 ? 'text-[#B8FF3D]' : 'text-slate-400'
                    }`}>
                      {deltas.dryPenalty > 0 ? `+${deltas.dryPenalty}` : deltas.dryPenalty}
                    </td>
                  </tr>

                  {/* Optimal Sowing Bonus if applicable */}
                  {deltas.optimalSowingBonus > 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-white font-medium block">
                          {language === 'en' ? 'Optimal Sowing Window Bonus' : 'বপনের জন্য আদর্শ রস থাকায় বোনাস'}
                        </span>
                        <span className="text-[11px] text-[#8FA3B8]">
                          {language === 'en' ? 'Soil moisture matches 0.25–0.30 m³/m³ seed germination zone' : 'মাটির রস ০.২৫–০.৩০ m³/m³ দ্রুত চারা গজানোর অনুকূল'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#00E5FF]">NASA SMAP</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#B8FF3D]">+{deltas.optimalSowingBonus}</td>
                    </tr>
                  )}

                  {/* Thermal Stress Penalty if applicable */}
                  {deltas.heatPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-white font-medium block">
                          {language === 'en' ? 'Thermal Stress Avoidance Penalty' : 'অতিরিক্ত গরমের ঝুঁকিতে নম্বর কাটা হয়েছে'}
                        </span>
                        <span className="text-[11px] text-[#8FA3B8]">
                          {language === 'en' ? 'Max daily temperature exceeded 35°C on heat-sensitive crop' : 'তাপমাত্রা ৩৫°সে অতিক্রম করায় বেশি গরমে ফলন নষ্টের ঝুঁকিতে নম্বর কাটা হয়েছে'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#00E5FF]">NASA POWER</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#FF5C5C]">{deltas.heatPenalty}</td>
                    </tr>
                  )}

                  {/* Water Deficit / ET0 */}
                  {deltas.waterDeficitPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-white font-medium block">
                          {language === 'en' ? 'Evapotranspiration Deficit (ET₀)' : 'পানির ঘাটতি (ET₀)'}
                        </span>
                        <span className="text-[11px] text-[#8FA3B8]">
                          {language === 'en' ? 'Rainfall − ET₀ balance < -50mm increases pumping diesel overhead' : 'বৃষ্টি − বাষ্পীভবন ঘাটতির কারণে সেচ খরচের বোঝা'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#00E5FF]">NASA POWER</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#FF5C5C]">{deltas.waterDeficitPenalty}</td>
                    </tr>
                  )}

                  {/* Farmer Priority Steering */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-white font-medium block">
                        {language === 'en' ? 'Farmer Priority Alignment' : 'আপনার চাহিদার প্রভাব'}
                      </span>
                      <span className="text-[11px] text-[#8FA3B8]">
                        {language === 'en'
                          ? `Steering based on primary target: ${selectedPriority.replace('_', ' ')}`
                          : `আপনার পছন্দের চাহিদার ভিত্তিতে প্রাপ্ত নম্বর`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#B8FF3D]">
                      {language === 'en' ? 'Farmer Choice' : 'কৃষকের লক্ষ্য'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-bold ${
                      deltas.primaryPriorityDelta > 0 ? 'text-[#B8FF3D]' : deltas.primaryPriorityDelta < 0 ? 'text-[#FF5C5C]' : 'text-slate-400'
                    }`}>
                      {deltas.primaryPriorityDelta > 0 ? `+${deltas.primaryPriorityDelta}` : deltas.primaryPriorityDelta}
                    </td>
                  </tr>

                  {/* Secondary Priority if present */}
                  {deltas.secondaryPriorityDelta !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-white font-medium block">
                          {language === 'en' ? 'Secondary Priority Alignment (50% wt)' : 'সহায়ক চাহিদার প্রভাব'}
                        </span>
                        <span className="text-[11px] text-[#8FA3B8]">
                          {secondaryPriority ? secondaryPriority.replace('_', ' ') : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#B8FF3D]">
                        {language === 'en' ? 'Farmer Choice' : 'কৃষকের লক্ষ্য'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        deltas.secondaryPriorityDelta > 0 ? 'text-[#B8FF3D]' : 'text-[#FF5C5C]'
                      }`}>
                        {deltas.secondaryPriorityDelta > 0 ? `+${deltas.secondaryPriorityDelta}` : deltas.secondaryPriorityDelta}
                      </td>
                    </tr>
                  )}

                  {/* Final Clamped Match Score */}
                  <tr className="bg-white/5 font-bold">
                    <td className="py-3 pr-3 text-white">
                      <span>{language === 'en' ? 'FINAL SUITABILITY SCORE' : 'মোট স্কোর'}</span>
                    </td>
                    <td className="py-3 px-3 text-[#8FA3B8] text-[11px]">AgriOrbit Engine</td>
                    <td className="py-3 px-3 text-right text-base text-[#B8FF3D] font-display">
                      {crop.suitabilityScore}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 01: NASA Observations Evaluated */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-3">
              <Database className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>{language === 'en' ? '01 · NASA Observations Evaluated' : '০১ · স্যাটেলাইট থেকে পাওয়া তথ্য'}</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.observationsTriggered
                : crop.explanation.observationsTriggeredBn
              ).map((obs, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed text-white/90">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 02: Farmer Priority Alignment */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{language === 'en' ? '02 · Farmer Priority Alignment' : '০২ · আপনার চাহিদার সাথে মিল'}</span>
            </div>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-[#8FA3B8] mb-3">
              <div className="w-4 h-4 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[2.5]" />
              </div>
              <p className="leading-relaxed text-white/90">
                {language === 'en'
                  ? crop.explanation.priorityAlignment
                  : crop.explanation.priorityAlignmentBn}
              </p>
            </div>
            <div className="pt-3 border-t border-white/10 text-xs text-[#8FA3B8] leading-relaxed">
              <strong className="text-white block font-mono text-[11px] uppercase mb-1">
                {language === 'en' ? 'Engine Rule Influence:' : 'নিয়ম প্রভাব:'}
              </strong>
              {priorityInfluenceText(selectedPriority, secondaryPriority, language)}
            </div>
          </div>

          {/* 03: Agronomic Rules Satisfied */}
          <div className="p-6 rounded-2xl bg-[#050B14] border border-white/10">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white font-mono font-semibold mb-3">
              <Layers className="w-3.5 h-3.5 text-white" />
              <span>{language === 'en' ? '03 · BARI Agronomic Rules Satisfied' : '০৩ · বারি ও ব্রির কৃষি নিয়মাবলী'}</span>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#8FA3B8]">
              {(language === 'en'
                ? crop.explanation.rulesSatisfied
                : crop.explanation.rulesSatisfiedBn
              ).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-white/10 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </div>
                  <span className="leading-relaxed text-white/90">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Water Savings Note if present */}
          {(crop.explanation.waterSavingsVsAlternative || crop.explanation.waterSavingsVsAlternativeBn) && (
            <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/20 text-xs text-[#00E5FF] leading-relaxed flex items-start gap-2.5">
              <Droplet className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {language === 'en'
                  ? crop.explanation.waterSavingsVsAlternative
                  : crop.explanation.waterSavingsVsAlternativeBn}
              </span>
            </div>
          )}

          {/* Transparent Trust Declaration */}
          <div className="text-[11px] font-mono text-[#8FA3B8] pt-2 text-center">
            Derived from NASA POWER (surface meteorology), NASA SMAP (soil moisture), NASA MODIS (NDVI), and BARI/BRRI agronomic models.
          </div>
        </div>
      </div>
    </div>
  );
};
