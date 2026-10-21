import React from 'react';
import {
  Printer,
  Share2,
  Calendar,
  Droplets,
  Thermometer,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  MapPin,
  Leaf,
  Info,
} from 'lucide-react';
import type { CropData, DistrictId, FarmerPriorityId, Language } from '../../types';
import type { EngineResult } from '../../lib/engine';
import { formatPriorityLabel, type TelemetryContext } from '../../lib/cropSuitability';
import { SmsAdvisoryButton } from './SmsAdvisoryButton';

export interface FarmerAdvisoryCardProps {
  districtName: string;
  upazilaName: string;
  fieldLat: number;
  fieldLng: number;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  telemetry: TelemetryContext;
  engineResult: EngineResult;
  topCrops: CropData[];
  onExplainCrop: (crop: CropData) => void;
  className?: string;
}

/**
 * Section 8: Dedicated Farmer Advisory Card
 * Mobile-friendly, print-ready, comprehensive advisory summary card.
 */
export const FarmerAdvisoryCard: React.FC<FarmerAdvisoryCardProps> = ({
  districtName,
  upazilaName,
  fieldLat,
  fieldLng,
  selectedPriority,
  secondaryPriority,
  language,
  telemetry,
  engineResult,
  topCrops,
  onExplainCrop,
  className = '',
}) => {
  const isEn = language === 'en';

  const rotationSequenceEn = engineResult.picks.map((p) => p.crop.nameEn).join(' → ');
  const rotationSequenceBn = engineResult.picks.map((p) => p.crop.nameBn).join(' → ');

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    const shareTitle = isEn
      ? `AgriOrbit Advisory for ${upazilaName}, ${districtName}`
      : `${upazilaName}, ${districtName}-এর এগ্রিঅরবিট কৃষি পরামর্শ`;
    const shareText = isEn
      ? `AgriOrbit Advisory: Recommended 3-Season Rotation: ${rotationSequenceEn}. Data: NASA POWER, SMAP & BARI.`
      : `এগ্রিঅরবিট কৃষি পরামর্শ: প্রস্তাবিত ৩-মৌসুমী পরিক্রমা: ${rotationSequenceBn}। তথ্যসূত্র: নাসা ও বিএআরআই।`;

    if (navigator.share) {
      navigator.share({
        title: shareTitle,
        text: shareText,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(window.location.href);
      alert(isEn ? 'Advisory link copied to clipboard!' : 'পরামর্শের লিংকটি কপি করা হয়েছে!');
    }
  };

  return (
    <div
      id="farmer-advisory-card"
      className={`rounded-3xl bg-[#0B1626] border border-[#B8FF3D]/40 p-6 sm:p-10 shadow-2xl relative overflow-hidden print:border-black print:bg-white print:text-black ${className}`}
    >
      {/* Decorative Watermark / Accent Glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#B8FF3D]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 print:hidden" />

      {/* Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 print:border-black/20">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold mb-1 text-[#B8FF3D] print:text-emerald-700">
            <CheckCircle2 className="w-4 h-4" />
            <span>{isEn ? 'DECISION-SUPPORT ADVISORY CERTIFICATE' : 'কৃষি সিদ্ধান্ত সহায়তা সনদ'}</span>
          </div>
          <h3 className="font-display text-2xl sm:text-3xl font-bold text-white print:text-black">
            {isEn ? `Field Advisory: ${upazilaName}, ${districtName}` : `${upazilaName}, ${districtName} কৃষি পরামর্শ কার্ড`}
          </h3>
          <div className="flex items-center gap-2 text-xs font-mono text-[#8FA3B8] print:text-gray-600 mt-1">
            <MapPin className="w-3.5 h-3.5 text-[#00E5FF] print:text-blue-600" />
            <span>{fieldLat.toFixed(2)}° N · {fieldLng.toFixed(2)}° E</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>{new Date().toLocaleDateString(isEn ? 'en-US' : 'bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
        </div>

        {/* Priority Badge */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <div className="px-3.5 py-1.5 rounded-xl bg-[#050B14] border border-white/10 print:border-black/20 text-xs">
            <span className="text-[#8FA3B8] print:text-gray-600 text-[10px] uppercase font-mono block">
              {isEn ? 'Selected Priority' : 'নির্বাচিত লক্ষ্য'}
            </span>
            <span className="font-bold text-[#B8FF3D] print:text-emerald-700 capitalize">
              {formatPriorityLabel(selectedPriority, isEn ? 'en' : 'bn')}
              {secondaryPriority ? ` + ${formatPriorityLabel(secondaryPriority, isEn ? 'en' : 'bn')}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 3 Summary Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-b border-white/10 print:border-black/20">
        {/* Pillar 1: Field Conditions */}
        <div className="p-5 rounded-2xl bg-[#050B14] print:bg-gray-50 border border-white/10 print:border-gray-200">
          <span className="text-xs font-mono uppercase text-[#00E5FF] print:text-blue-600 font-bold block mb-3">
            01 · {isEn ? 'Key Field Conditions' : 'মাঠের প্রধান উপাত্ত'}
          </span>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#8FA3B8] print:text-gray-600">{isEn ? '30-Day Rainfall' : '৩০ দিনের বৃষ্টি'}:</span>
              <span className="font-mono font-bold text-white print:text-black">{Math.round(telemetry.rainfall30d ?? 38)} mm</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8FA3B8] print:text-gray-600">{isEn ? 'Soil Moisture' : 'মাটির আর্দ্রতা'}:</span>
              <span className="font-mono font-bold text-[#00E5FF] print:text-blue-700">{(telemetry.soilMoisture ?? 0.22).toFixed(2)} m³/m³</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#8FA3B8] print:text-gray-600">{isEn ? 'Daily Max Temp' : 'সর্বোচ্চ তাপমাত্রা'}:</span>
              <span className="font-mono font-bold text-white print:text-black">{(telemetry.maxTemp ?? 32).toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between items-center" title={`Net Water Balance = Rain (${Math.round(telemetry.rainfall30d ?? 38)} mm) - ET0. Deficit if negative.`}>
              <span className="text-[#8FA3B8] print:text-gray-600">{isEn ? 'Net Water Balance' : 'নিট পানি অবস্থা'}:</span>
              <span className={`font-mono font-bold ${(telemetry.waterBalance ?? 0) < -50 ? 'text-[#FF5C5C] print:text-red-600' : 'text-[#B8FF3D] print:text-emerald-600'}`}>
                {(telemetry.waterBalance ?? 0) < 0 ? `${Math.round(telemetry.waterBalance ?? 0)} mm` : `+${Math.round(telemetry.waterBalance ?? 0)} mm`}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 2: Recommended 3-Season Rotation */}
        <div className="p-5 rounded-2xl bg-[#050B14] print:bg-gray-50 border border-white/10 print:border-gray-200">
          <span className="text-xs font-mono uppercase text-[#B8FF3D] print:text-emerald-700 font-bold block mb-3">
            02 · {isEn ? 'Recommended 3-Season Cycle' : 'প্রস্তাবিত ৩-মৌসুমী পরিক্রমা'}
          </span>
          <div className="space-y-2 text-xs">
            {engineResult.picks.map((pick, i) => {
              const seasonName = pick.season === 'rabi' ? (isEn ? 'Rabi' : 'রবি') : pick.season === 'kharif1' ? (isEn ? 'Kharif-1' : 'খরিফ-১') : (isEn ? 'Kharif-2' : 'খরিফ-২');
              return (
                <div key={pick.season} className="flex items-center justify-between p-2 rounded-lg bg-white/5 print:bg-white border border-white/5 print:border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-[#8FA3B8] print:text-gray-500 font-bold">0{i + 1}</span>
                    <span className="font-bold text-white print:text-black">{isEn ? pick.crop.nameEn : pick.crop.nameBn}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#B8FF3D] print:text-emerald-700 font-bold">{seasonName} ({pick.score}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pillar 3: Agronomic Benefits */}
        <div className="p-5 rounded-2xl bg-[#050B14] print:bg-gray-50 border border-white/10 print:border-gray-200">
          <span className="text-xs font-mono uppercase text-white print:text-black font-bold block mb-3">
            03 · {isEn ? 'Agronomic Impact' : 'কৃষি ও মাটির লাভ'}
          </span>
          <div className="space-y-2 text-xs text-[#8FA3B8] print:text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#B8FF3D] print:text-emerald-600 shrink-0 mt-0.5" />
              <span>{isEn ? 'Disrupts pest and pathogen cycles via botanical family alternation.' : 'গোত্র পরিবর্তন করে ক্ষতিকর পোকা ও রোগবালাইয়ের চক্র ভেঙে দেয়।'}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#00E5FF] print:text-blue-600 shrink-0 mt-0.5" />
              <span>{isEn ? 'Enriches soil with biological Rhizobium nitrogen fixation for subsequent crops.' : 'রাইজোবিয়াম ব্যাকটেরিয়ার সাহায্যে জমিতে প্রাকৃতিক নাইট্রোজেন সংবন্ধন ঘটিয়ে মাটির উর্বরতা বাড়ায়।'}</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-white print:text-black shrink-0 mt-0.5" />
              <span>{isEn ? 'Substantially lowers irrigation fuel and groundwater pumping requirements compared to continuous-flooded cereals.' : 'টানা জলাবদ্ধ ফসলের তুলনায় সেচ জ্বালানি ও ভূগর্ভস্থ পানি উত্তোলনের প্রয়োজনীয়তা উল্লেখযোগ্যভাবে হ্রাস করে।'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advisory Action Statement */}
      <div className="py-6">
        <h4 className="font-display text-lg sm:text-xl font-bold text-white print:text-black mb-2 leading-relaxed">
          {isEn ? (
            <>
              "Based on field observations in <span className="text-[#00E5FF] print:text-blue-600">{districtName}</span>, your priority to{' '}
              <span className="text-[#B8FF3D] print:text-emerald-700">{formatPriorityLabel(selectedPriority, 'en')}</span>, and NASA Earth observations, AgriOrbit recommends considering the sequence{' '}
              <span className="underline decoration-[#B8FF3D] text-white print:text-black">{rotationSequenceEn}</span> for your field's annual cycle."
            </>
          ) : (
            <>
              "বর্তমান <span className="text-[#00E5FF] print:text-blue-600">{districtName}</span> জেলার উপগ্রহ পরিস্থিতি, আপনার{' '}
              <span className="text-[#B8FF3D] print:text-emerald-700">
                {formatPriorityLabel(selectedPriority, 'bn')}
              </span>{' '}
              অগ্রাধিকার এবং নাসার পর্যবেক্ষণ অনুযায়ী, এগ্রিঅরবিট{' '}
              <span className="underline decoration-[#B8FF3D] text-white print:text-black">{rotationSequenceBn}</span> শস্য আবর্তন বিবেচনা করার পরামর্শ দিচ্ছে।"
            </>
          )}
        </h4>
        <p className="text-xs sm:text-sm text-[#8FA3B8] print:text-gray-600 leading-relaxed">
          {isEn
            ? 'This plan protects groundwater levels during dry winter months while maximizing food harvest and biological soil health across all three seasons.'
            : 'এই পরিকল্পনাটি শুষ্ক শীতের মাসগুলোতে ভূগর্ভস্থ পানির স্তর রক্ষা করার পাশাপাশি খাদ্য উৎপাদন ও মাটির স্বাস্থ্য সুনিশ্চিত করে।'}
        </p>
      </div>

      {/* Constructive Advisory Disclaimer */}
      <div className="mt-2 text-[11px] text-slate-400 print:text-gray-600 leading-relaxed border-t border-white/10 print:border-black/20 pt-3">
        {isEn
          ? "Your feedback helps us improve AgriOrbit's recommendations. Recommendations are advisory based on NASA Earth observations and BARI/BRRI guidelines. Always verify with your local Upazila Agriculture Officer."
          : "আপনার মতামত এগ্রিঅরবিটের সুপারিশ আরও নিখুঁত করতে সহায়তা করে। সুপারিশসমূহ নাসার উপগ্রহ উপাত্ত ও বিএআরআই/বিআরআরআই নির্দেশিকার ভিত্তিতে প্রণীত। চূড়ান্ত বাস্তবায়নে স্থানীয় উপজেলা কৃষি কর্মকর্তার পরামর্শ নিন।"}
      </div>

      {/* Provenance & Action Cluster */}
      <div className="pt-6 border-t border-white/10 print:border-black/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-[11px] font-mono text-[#8FA3B8] print:text-gray-600">
          <ShieldCheck className="w-4 h-4 text-[#B8FF3D] print:text-emerald-600 shrink-0" />
          <span>
            {isEn
              ? 'Data: NASA POWER (Daily) · SMAP (Snapshot) · MODIS (Snapshot) · Open-Meteo · BARI Guidelines'
              : 'তথ্যসূত্র: নাসা পাওয়ার (দৈনিক) · স্ম্যাপ (স্ন্যাপশট) · মডিস (স্ন্যাপশট) · ওপেন-মেটিও · বিএআরআই'}
          </span>
        </div>

        {/* Print, Share, SMS buttons */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto print:hidden">
          <SmsAdvisoryButton
            district={districtName}
            upazila={upazilaName}
            language={language}
          />
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isEn ? 'Print Advisory' : 'প্রিন্ট করুন'}</span>
          </button>
          <button
            onClick={handleShare}
            className="px-5 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer flex-1 sm:flex-none shadow-md"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{isEn ? 'Share Plan' : 'শেয়ার করুন'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
