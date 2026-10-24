import React from 'react';
import { X, Check, Database, AlertCircle, ShieldCheck, Droplet, Layers, Compass, Calculator } from 'lucide-react';
import { CropData, FarmerPriorityId, Language, ScoreDeltas } from '../types';
import { priorityInfluenceText } from '../lib/cropSuitability';
import { cropById } from '../data/crops';
import { toBnDigits } from '../lib/bilingualEmailTemplate';

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

  const isEstimated = cropById(crop.id)?.data_confidence === 'estimated';
  const isBn = language === 'bn';

  const fmtPt = (num: number, signed = true) => {
    if (isBn) {
      const bn = toBnDigits(Math.abs(num));
      if (num < 0) return `−${bn}`;
      if (signed && num > 0) return `+${bn}`;
      return bn;
    }
    if (num < 0) return `${num}`;
    if (signed && num > 0) return `+${num}`;
    return `${num}`;
  };

  const fallbackDeltas: ScoreDeltas = {
    base: 70,
    dryPenalty: 0,
    heatPenalty: 0,
    waterDeficitPenalty: 0,
    optimalSowingBonus: 0,
    primaryPriorityDelta: 0,
    secondaryPriorityDelta: 0,
    finalScore: 70,
  };

  const deltas: ScoreDeltas = crop.deltas ?? fallbackDeltas;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={language === 'en' ? `Scientific reasoning for ${crop.nameEn}` : `${crop.nameBn}-এর বৈজ্ঞানিক কারণ`}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-[#141414] border border-[#262626] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#141414] p-5 sm:p-6 border-b border-[#262626] flex items-start justify-between z-10">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#737373] font-mono font-medium mb-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{language === 'en' ? 'SCIENTIFIC REASONING' : 'বৈজ্ঞানিক কারণ'}</span>
            </div>
            <h3 className="font-display text-xl sm:text-2xl font-semibold text-[#FAFAFA] flex items-baseline gap-3">
              <span>{language === 'en' ? `Why ${crop.nameEn}?` : `কেন ${crop.nameBn}?`}</span>
              <span className="font-mono text-sm font-semibold text-[#22C55E]">
                {isBn ? `${toBnDigits(crop.suitabilityScore)}% উপযুক্ত` : `${crop.suitabilityScore}% Match`}
              </span>
            </h3>
            <p className="text-xs text-[#737373] italic mt-0.5">
              {crop.scientificName} · {language === 'en' ? crop.seasonEn : crop.seasonBn} season
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0A0A0A] border border-[#262626] flex items-center justify-center text-[#737373] hover:text-[#FAFAFA] transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {/* Estimated Data Warning Banner */}
          {isEstimated && (
            <div className="p-3.5 rounded-lg bg-[#F59E0B]/10 border border-[#F59E0B]/30 text-[#F59E0B] text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium font-mono text-xs uppercase tracking-wider">
                  {language === 'en' ? 'Estimated Data' : 'আনুমানিক তথ্য'}
                </div>
                <p className="mt-0.5 leading-relaxed text-xs">
                  {language === 'en'
                    ? 'This crop’s data has not yet been field-verified; please confirm with your local agriculture extension office.'
                    : 'এই ফসলের তথ্য এখনো যাচাই করা হয়নি; স্থানীয় কৃষি অফিসে নিশ্চিত হোন।'}
                </p>
              </div>
            </div>
          )}

          {/* DETERMINISTIC RULE-BASED SCORE CALCULATION TABLE */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-[#FAFAFA] font-mono font-medium">
                <Calculator className="w-3.5 h-3.5 text-[#22C55E]" />
                <span>{language === 'en' ? 'Score Breakdown' : 'স্কোরের হিসাব'}</span>
              </div>
              <span className="text-[10px] font-mono text-[#737373] px-2 py-0.5 rounded bg-[#141414] border border-[#262626]">
                {language === 'en' ? 'Rule-Based' : 'নিয়ম-ভিত্তিক'}
              </span>
            </div>

            <p className="text-xs text-[#737373] mb-3">
              {language === 'en'
                ? 'AgriOrbit evaluates empirical agronomic rules against NASA Earth observations to determine final suitability based on BARI/BRRI guidance and NASA data.'
                : 'নাসার স্যাটেলাইট তথ্য আর বারি (BARI) ও ব্রি (BRRI)-এর কৃষি নিয়মের ওপর ভিত্তি করে এগ্রিঅরবিট এই হিসাব করে।'} 
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#262626] text-[#737373] text-[11px]">
                    <th className="py-2 pr-3 font-medium">{language === 'en' ? 'Rule / Factor' : 'মানদণ্ড / নিয়ম'}</th>
                    <th className="py-2 px-3 font-medium">{language === 'en' ? 'Source' : 'উৎস'}</th>
                    <th className="py-2 px-3 text-right font-medium">{language === 'en' ? 'Points' : 'নম্বর'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#262626] text-[#A3A3A3]">
                  {/* Base */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-[#FAFAFA] font-medium block">
                        {language === 'en' ? 'Baseline Agronomic Potential' : 'ফসলের ভিত্তি নম্বর'}
                      </span>
                      <span className="text-[11px] text-[#737373]">
                        {language === 'en' ? 'Published BARI/BRRI seasonal crop guidelines' : 'বিএআরআই/বিআরআরআই মৌসুমী নির্দেশিকা'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">BARI/BRRI</td>
                    <td className="py-2.5 px-3 text-right font-semibold text-[#FAFAFA]">{fmtPt(deltas.base)}</td>
                  </tr>

                  {/* SMAP Soil Moisture Adjustment */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-[#FAFAFA] font-medium block">
                        {language === 'en' ? 'NASA SMAP Soil Moisture Adjustment' : 'মাটির রস অনুযায়ী সমন্বয় (নাসা)'}
                      </span>
                      <span className="text-[11px] text-[#737373]">
                        {deltas.dryPenalty < 0
                          ? (language === 'en' ? 'Severe moisture deficit penalty' : 'মাটি বেশি শুকনা থাকায় নম্বর কাটা হয়েছে')
                          : deltas.dryPenalty > 0
                          ? (language === 'en' ? 'Drought-resilient crop bonus awarded' : 'কম পানির সহনশীল ফসলে বাড়তি নম্বর যোগ')
                          : (language === 'en' ? 'Rootzone soil moisture within standard tolerance' : 'মাটিতে স্বাভাবিক রস রয়েছে')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">NASA SMAP</td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${
                      deltas.dryPenalty < 0 ? 'text-[#EF4444]' : deltas.dryPenalty > 0 ? 'text-[#22C55E]' : 'text-[#737373]'
                    }`}>
                      {fmtPt(deltas.dryPenalty)}
                    </td>
                  </tr>

                  {/* Optimal Sowing Bonus if applicable */}
                  {deltas.optimalSowingBonus > 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Optimal Sowing Window Bonus' : 'বপনের জন্য আদর্শ রস থাকায় বোনাস'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {language === 'en' ? 'Soil moisture matches germination zone' : 'মাটির রস দ্রুত চারা গজানোর অনুকূল'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">NASA SMAP</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#22C55E]">{fmtPt(deltas.optimalSowingBonus)}</td>
                    </tr>
                  )}

                  {/* Thermal Stress Penalty if applicable */}
                  {deltas.heatPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Thermal Stress Avoidance Penalty' : 'অতিরিক্ত গরমের ঝুঁকিতে নম্বর কাটা হয়েছে'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {language === 'en' ? 'Max daily temperature exceeded 35°C on sensitive crop' : 'তাপমাত্রা ৩৫°সে অতিক্রম করায় নম্বর কাটা হয়েছে'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">
                        {crop.explanation?.rulesSatisfied?.some((r) => r.includes('ISRO'))
                          ? 'NASA + ISRO INSAT'
                          : 'NASA POWER'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#EF4444]">{fmtPt(deltas.heatPenalty)}</td>
                    </tr>
                  )}

                  {/* Water Deficit / ET0 */}
                  {deltas.waterDeficitPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Evapotranspiration Deficit (ET₀)' : 'পানির ঘাটতি (ET₀)'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {language === 'en' ? 'Rainfall − ET₀ balance increases irrigation need' : 'বৃষ্টি − বাষ্পীভবন ঘাটতির কারণে সেচের প্রয়োজন'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">NASA POWER</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#EF4444]">{fmtPt(deltas.waterDeficitPenalty)}</td>
                    </tr>
                  )}

                  {/* JAXA AMSR2 / SPI Drought Confirmation */}
                  {deltas.jaxaDroughtPenalty !== undefined && deltas.jaxaDroughtPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Dual-Satellite Drought Index (JAXA-01)' : 'যৌথ উপগ্রহ খরা সূচক (JAXA-01)'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {deltas.jaxaDroughtPenalty < 0
                            ? (language === 'en'
                              ? 'JAXA AMSR2 + SPI and NASA SMAP confirm severe topsoil drought (-15 pts)'
                              : 'জাক্সা এএমএসআর২ ও নাসা স্ম্যাপ উভয়েই তীব্র খরা নিশ্চিত করেছে (-১৫)')
                            : (language === 'en'
                              ? 'Drought-hardy crop bonus under low moisture (+5 pts)'
                              : 'শুষ্ক পরিস্থিতিতে খরা-সহনশীল ফসলে বাড়তি নম্বর (+৫)')
                          }
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">JAXA Earth API</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${deltas.jaxaDroughtPenalty > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        {fmtPt(deltas.jaxaDroughtPenalty)}
                      </td>
                    </tr>
                  )}

                  {/* Sentinel-2 10m Vegetation Health / Crop Stress */}
                  {deltas.sentinel2StressPenalty !== undefined && deltas.sentinel2StressPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Vegetation Health & Canopy Stress (VEG-02)' : 'সবুজায়ন ও বৃদ্ধি পরিস্থিতি (VEG-02)'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {deltas.sentinel2StressPenalty < 0
                            ? (language === 'en'
                              ? 'ESA Sentinel-2 10m NDVI detected delayed canopy / crop stress (-10 pts)'
                              : 'সেন্টিনেল-২ ১০মি উপগ্রহে ফসলের বৃদ্ধি ঘাটতি শনাক্ত (-১০)')
                            : (language === 'en'
                              ? 'Compensatory fast-maturing catch crop bonus (+5 pts)'
                              : 'স্বল্পমেয়াদী ক্ষতিপূরণমূলক ফসলে বাড়তি নম্বর (+৫)')
                          }
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">ESA Sentinel-2</td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${deltas.sentinel2StressPenalty > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                        {fmtPt(deltas.sentinel2StressPenalty)}
                      </td>
                    </tr>
                  )}

                  {/* Sentinel-1 SAR Flooding / Waterlogging */}
                  {deltas.sentinel1FloodPenalty !== undefined && deltas.sentinel1FloodPenalty !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Cropland Flooding / Waterlogging (SAR-01)' : 'জলাবদ্ধতা ঝুঁকি (SAR-01)'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {language === 'en'
                            ? 'ESA Sentinel-1 SAR radar detected standing water in cropland (>10%)'
                            : 'সেন্টিনেল-১ রাডার চিত্রে ফসলি জমিতে অতিরিক্ত পানি ও জলাবদ্ধতা শনাক্ত (>১০%)'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">ESA Sentinel-1</td>
                      <td className="py-2.5 px-3 text-right font-semibold text-[#EF4444]">{fmtPt(deltas.sentinel1FloodPenalty)}</td>
                    </tr>
                  )}

                  {/* Farmer Priority Steering */}
                  <tr>
                    <td className="py-2.5 pr-3">
                      <span className="text-[#FAFAFA] font-medium block">
                        {language === 'en' ? 'Farmer Priority Alignment' : 'আপনার চাহিদার প্রভাব'}
                      </span>
                      <span className="text-[11px] text-[#737373]">
                        {language === 'en'
                          ? `Steering based on primary target: ${selectedPriority.replace('_', ' ')}`
                          : `আপনার পছন্দের চাহিদার ভিত্তিতে প্রাপ্ত নম্বর`}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">
                      {language === 'en' ? 'Farmer Choice' : 'কৃষকের লক্ষ্য'}
                    </td>
                    <td className={`py-2.5 px-3 text-right font-semibold ${
                      deltas.primaryPriorityDelta > 0 ? 'text-[#22C55E]' : deltas.primaryPriorityDelta < 0 ? 'text-[#EF4444]' : 'text-[#737373]'
                    }`}>
                      {fmtPt(deltas.primaryPriorityDelta)}
                    </td>
                  </tr>

                  {/* Secondary Priority if present */}
                  {deltas.secondaryPriorityDelta !== 0 && (
                    <tr>
                      <td className="py-2.5 pr-3">
                        <span className="text-[#FAFAFA] font-medium block">
                          {language === 'en' ? 'Secondary Priority Alignment (50% wt)' : 'সহায়ক চাহিদার প্রভাব'}
                        </span>
                        <span className="text-[11px] text-[#737373]">
                          {secondaryPriority ? secondaryPriority.replace('_', ' ') : ''}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap text-[#737373]">
                        {language === 'en' ? 'Farmer Choice' : 'কৃষকের লক্ষ্য'}
                      </td>
                      <td className={`py-2.5 px-3 text-right font-semibold ${
                        deltas.secondaryPriorityDelta > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                      }`}>
                        {fmtPt(deltas.secondaryPriorityDelta)}
                      </td>
                    </tr>
                  )}

                  {/* Final Match Score */}
                  <tr className="bg-[#141414] font-semibold">
                    <td className="py-3 pr-3 text-[#FAFAFA]">
                      <span>{language === 'en' ? 'FINAL SUITABILITY SCORE' : 'মোট স্কোর'}</span>
                    </td>
                    <td className="py-3 px-3 text-[#737373] text-[11px]">AgriOrbit Engine</td>
                    <td className="py-3 px-3 text-right text-sm text-[#22C55E] font-display">
                      {isBn ? `${toBnDigits(crop.suitabilityScore)}%` : `${crop.suitabilityScore}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 01: NASA Observations Evaluated */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#A3A3A3] font-mono font-medium mb-2.5">
              <Database className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{language === 'en' ? '01 · NASA Observations Evaluated' : '০১ · স্যাটেলাইট থেকে পাওয়া তথ্য'}</span>
            </div>
            <ul className="space-y-2 text-xs text-[#A3A3A3]">
              {(language === 'en'
                ? crop.explanation.observationsTriggered
                : crop.explanation.observationsTriggeredBn
              ).map((obs, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-[#FAFAFA]">{obs}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 02: Farmer Priority Alignment */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#A3A3A3] font-mono font-medium mb-2.5">
              <Compass className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{language === 'en' ? '02 · Farmer Priority Alignment' : '০২ · আপনার চাহিদার সাথে মিল'}</span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-[#A3A3A3] mb-2.5">
              <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[#FAFAFA]">
                {language === 'en'
                  ? crop.explanation.priorityAlignment
                  : crop.explanation.priorityAlignmentBn}
              </p>
            </div>
            <div className="pt-2.5 border-t border-[#262626] text-xs text-[#737373] leading-relaxed">
              <strong className="text-[#FAFAFA] block font-mono text-[11px] uppercase mb-0.5">
                {language === 'en' ? 'Engine Rule Influence:' : 'নিয়ম প্রভাব:'}
              </strong>
              {priorityInfluenceText(selectedPriority, secondaryPriority, language)}
            </div>
          </div>

          {/* 03: Agronomic Rules Satisfied */}
          <div className="p-4 sm:p-5 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#A3A3A3] font-mono font-medium mb-2.5">
              <Layers className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{language === 'en' ? '03 · BARI Agronomic Rules Satisfied' : '০৩ · বারি ও ব্রির কৃষি নিয়মাবলী'}</span>
            </div>
            <ul className="space-y-2 text-xs text-[#A3A3A3]">
              {(language === 'en'
                ? crop.explanation.rulesSatisfied
                : crop.explanation.rulesSatisfiedBn
              ).map((rule, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <Check className="w-3.5 h-3.5 text-[#22C55E] shrink-0 mt-0.5" />
                  <span className="leading-relaxed text-[#FAFAFA]">{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Water Savings Note if present */}
          {(crop.explanation.waterSavingsVsAlternative || crop.explanation.waterSavingsVsAlternativeBn) && (
            <div className="p-3.5 rounded-lg bg-[#141414] border border-[#262626] text-xs text-[#A3A3A3] leading-relaxed flex items-start gap-2.5">
              <Droplet className="w-4 h-4 shrink-0 mt-0.5 text-[#38BDF8]" />
              <span>
                {language === 'en'
                  ? crop.explanation.waterSavingsVsAlternative
                  : crop.explanation.waterSavingsVsAlternativeBn}
              </span>
            </div>
          )}

          {/* Trust Declaration */}
          <div className="text-[11px] font-mono text-[#737373] pt-1 text-center">
            Derived from NASA POWER (surface meteorology), NASA SMAP (soil moisture), NASA MODIS (NDVI), and BARI/BRRI agronomic models.
          </div>
        </div>
      </div>
    </div>
  );
};
