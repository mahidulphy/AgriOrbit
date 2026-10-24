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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 font-editorial relative selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* Editorial Card */}
      <div className="w-full max-w-xl bg-[#0B1626] border border-white/10 rounded-3xl p-8 sm:p-12 shadow-2xl relative z-10 text-center">
        {/* Orbit Icon */}
        <div className="relative w-16 h-16 mx-auto mb-6 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center">
            <Satellite className="w-7 h-7 text-[#00E5FF] animate-pulse" />
          </div>
        </div>

        {/* Eyebrow */}
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-3">
          <span>{fieldLat.toFixed(2)}° N · {fieldLng.toFixed(2)}° E</span>
        </div>

        <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
          {language === 'en' ? 'Calibrating Observations' : 'স্যাটেলাইটের তথ্য যাচাই করা হচ্ছে'}
        </h2>

        <p className="text-xs sm:text-sm text-[#8FA3B8] max-w-md mx-auto mb-8 leading-relaxed">
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
                    ? 'bg-[#050B14] border-[#B8FF3D]/30 text-white'
                    : isProcessing
                    ? 'bg-[#050B14] border-[#00E5FF]/50 text-white'
                    : 'bg-[#050B14] border-white/5 text-[#8FA3B8] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-[#B8FF3D] text-[#050B14]'
                        : isProcessing
                        ? 'bg-[#00E5FF] text-[#050B14]'
                        : 'bg-white/10 text-[#8FA3B8]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-white">{stream.name}</strong>
                    <span className="text-[11px] text-[#8FA3B8]">
                      {language === 'en' ? stream.labelEn : stream.labelBn}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono shrink-0 uppercase tracking-wider text-[#8FA3B8]">
                  {isCompleted ? '✓' : isProcessing ? 'Reading…' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        {/* View Field Analysis Button */}
        <button
          onClick={onViewDashboard}
          className="w-full py-4 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-sm tracking-tight transition-all duration-150 transform hover:-translate-y-0.5 shadow-xl shadow-[#B8FF3D]/20 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{language === 'en' ? 'Open Field Analysis' : 'ফিল্ড অ্যানালাইসিস দেখুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
