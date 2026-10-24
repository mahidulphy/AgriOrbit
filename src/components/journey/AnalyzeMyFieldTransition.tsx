import React, { useState, useEffect } from 'react';
import { Satellite, ArrowRight, Orbit, ShieldCheck, Check } from 'lucide-react';
import { DistrictId, FarmerPriorityId, Language } from '../../types';
import { getDistrictAdmin } from '../../data/bdAdmin';
import { AGRIORBIT_TAGLINE } from '../common/AppFooter';

interface AnalyzeMyFieldTransitionProps {
  selectedDistrict: DistrictId;
  selectedPriority: FarmerPriorityId;
  fieldLat: number;
  fieldLng: number;
  language: Language;
  onViewDashboard: () => void;
}

export const AnalyzeMyFieldTransition: React.FC<AnalyzeMyFieldTransitionProps> = ({
  selectedDistrict,
  selectedPriority,
  fieldLat,
  fieldLng,
  language,
  onViewDashboard,
}) => {
  const district = getDistrictAdmin(selectedDistrict) ?? {
    nameEn: selectedDistrict,
    nameBn: selectedDistrict,
  };
  const [activeStep, setActiveStep] = useState(0);

  const streams = [
    { name: 'NASA POWER', labelEn: 'Precipitation & Temperature profile ingested', labelBn: 'বৃষ্টিপাত ও তাপমাত্রার তথ্য দেখা হচ্ছে' },
    { name: 'NASA SMAP', labelEn: 'Root-zone and surface soil moisture assessed', labelBn: 'মাটির ওপর ও গভীরে রসের পরিমাণ যাচাই' },
    { name: 'NASA MODIS', labelEn: 'Vegetation health index (NDVI) & LST verified', labelBn: 'গাছের সজীবতা ও জমির তাপমাত্রা যাচাই' },
    { name: 'BARI Agronomy', labelEn: 'Agro-ecological calendar rules cross-referenced', labelBn: 'বারি (BARI) ও ব্রি (BRRI)-এর কৃষি নিয়মের সাথে মেলানো' },
    { name: 'Farmer Priority', labelEn: `Weighted filter applied: ${selectedPriority.replace('_', ' ')}`, labelBn: 'আপনার চাহিদা মেলানো হচ্ছে' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < streams.length ? prev + 1 : prev));
    }, 600);
    return () => clearInterval(timer);
  }, [streams.length]);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-editorial relative selection:bg-[#22C55E]/20 selection:text-[#22C55E]">
      {/* Editorial Card */}
      <div className="w-full max-w-xl bg-[#141414] border border-[#262626] rounded-xl p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        {/* Orbit Icon */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#262626] flex items-center justify-center">
            <Satellite className="w-7 h-7 text-[#FAFAFA] " />
          </div>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#FAFAFA] font-mono font-semibold mb-3">
          <span>{fieldLat.toFixed(2)}° N · {fieldLng.toFixed(2)}° E</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
          {language === 'en' ? 'Calibrating Observations' : 'স্যাটেলাইটের তথ্য যাচাই করা হচ্ছে'}
        </h2>

        <p className="text-xs sm:text-sm text-[#A3A3A3] max-w-md mx-auto mb-8 leading-relaxed">
          {language === 'en'
            ? `Pairing Earth observations for ${district.nameEn} with your selected farming priority.`
            : `${district.nameBn}-এর স্যাটেলাইট তথ্যের সাথে আপনার চাহিদা মেলানো হচ্ছে।`}
        </p>

        {/* Pipeline Step List */}
        <div className="space-y-3 mb-8 text-left">
          {streams.map((stream, idx) => {
            const isCompleted = activeStep > idx;
            const isProcessing = activeStep === idx;

            return (
              <div
                key={stream.name}
                className={`p-3.5 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-[#0A0A0A] border-[#22C55E]/40 text-[#FAFAFA]'
                    : isProcessing
                    ? 'bg-[#0A0A0A] border-[#404040] text-[#FAFAFA]'
                    : 'bg-[#0A0A0A] border-[#262626] text-[#A3A3A3] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-[#22C55E] text-black'
                        : isProcessing
                        ? 'bg-[#404040] text-white'
                        : 'bg-white/10 text-[#A3A3A3]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">{stream.name}</strong>
                    <span className="text-[11px] text-[#A3A3A3]">
                      {language === 'en' ? stream.labelEn : stream.labelBn}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono shrink-0 uppercase tracking-wider text-[#A3A3A3]">
                  {isCompleted ? '✓' : isProcessing ? 'Reading…' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        {/* View Field Analysis Button */}
        <button
          onClick={onViewDashboard}
          className="w-full py-3.5 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-sm tracking-tight transition-colors flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{language === 'en' ? 'Open Field Analysis' : 'ফিল্ড অ্যানালাইসিস দেখুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
