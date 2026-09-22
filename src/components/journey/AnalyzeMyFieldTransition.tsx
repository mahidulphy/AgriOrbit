import React, { useState, useEffect } from 'react';
import { Satellite, ArrowRight, Orbit, ShieldCheck } from 'lucide-react';
import { DistrictId, FarmerPriorityId, Language } from '../../types';
import { DISTRICTS } from '../../data/agriData';
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
  const district = DISTRICTS[selectedDistrict];
  const [activeStep, setActiveStep] = useState(0);

  const streams = [
    { name: 'NASA POWER', labelEn: 'Precipitation & Temperature profile ingested', labelBn: 'বৃষ্টিপাত ও তাপমাত্রা তথ্য বিশ্লেষণ' },
    { name: 'NASA SMAP', labelEn: 'Root-zone and surface soil moisture assessed', labelBn: 'মাটির পৃষ্ঠ ও মূলস্তরের আর্দ্রতা নিরীক্ষা' },
    { name: 'NASA MODIS', labelEn: 'Vegetation health index (NDVI) & LST verified', labelBn: 'উদ্ভিদের সজীবতা সূচক ও ভূপৃষ্ঠের তাপমাত্রা যাচাই' },
    { name: 'BARI Agronomy', labelEn: 'Agro-ecological calendar rules cross-referenced', labelBn: 'কৃষি গবেষণা নির্দেশিকার সাথে সমন্বয়' },
    { name: 'Farmer Priority', labelEn: `Weighted filter applied: ${selectedPriority.replace('_', ' ')}`, labelBn: `কৃষকের অগ্রাধিকার নিয়মে প্রয়োগ` },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < streams.length ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(timer);
  }, [streams.length]);

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00E5FF]/10 blur-[130px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-2xl bg-[#0B1626] border-2 border-[#00E5FF]/30 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10 text-center">
        {/* Orbit Icon with pulsating animation */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-[#00E5FF]/40 animate-ping" />
          <div className="w-16 h-16 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/40 flex items-center justify-center shadow-lg shadow-black/50">
            <Satellite className="w-8 h-8 text-[#00E5FF] animate-pulse" />
          </div>
        </div>

        {/* Heading */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#050B14] border border-white/10 text-[#8FA3B8] text-xs font-mono mb-3">
          <Orbit className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>Coordinates: {fieldLat}° N, {fieldLng}° E</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
          {language === 'en' ? 'Analyzing your field...' : 'আপনার জমি বিশ্লেষণ করা হচ্ছে...'}
        </h2>

        <p className="text-sm text-[#8FA3B8] max-w-md mx-auto mb-8">
          {language === 'en'
            ? `Calibrating Earth observations for ${district.nameEn} with your selected farming priority.`
            : `${district.nameBn}-এর জন্য উপগ্রহ তথ্য ও আপনার অগ্রাধিকার সমন্বয় করা হচ্ছে।`}
        </p>

        {/* Visual Pipeline: Telemetry streams flowing into Decision Engine */}
        <div className="space-y-2.5 mb-8 text-left max-w-lg mx-auto">
          {streams.map((stream, idx) => {
            const isCompleted = activeStep > idx;
            const isProcessing = activeStep === idx;

            return (
              <div
                key={stream.name}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCompleted
                    ? 'bg-[#050B14] border-[#B8FF3D]/40 text-white'
                    : isProcessing
                    ? 'bg-[#00E5FF]/10 border-[#00E5FF]/50 text-white animate-pulse'
                    : 'bg-[#050B14] border-white/10 text-[#8FA3B8]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isCompleted
                        ? 'bg-[#B8FF3D] text-[#050B14]'
                        : isProcessing
                        ? 'bg-[#00E5FF] text-[#050B14]'
                        : 'bg-white/10 text-[#8FA3B8]'
                    }`}
                  >
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div>
                    <strong className="block text-xs font-extrabold">{stream.name}</strong>
                    <span className="text-[11px] opacity-80">
                      {language === 'en' ? stream.labelEn : stream.labelBn}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-mono shrink-0 uppercase tracking-wider">
                  {isCompleted ? 'Done' : isProcessing ? 'Reading...' : 'Queued'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Core Philosophy Banner */}
        <div className="p-3.5 rounded-2xl bg-[#050B14] border border-white/10 text-xs text-[#8FA3B8] mb-8 font-medium flex items-center justify-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#B8FF3D]" />
          <span>
            {language === 'en'
              ? AGRIORBIT_TAGLINE
              : 'নাসা পর্যবেক্ষণ করে → এগ্রিঅরবিট ব্যাখ্যা করে → সিদ্ধান্ত নেন কৃষক'}
          </span>
        </div>

        {/* View Field Analysis Button */}
        <button
          onClick={onViewDashboard}
          className="w-full sm:w-auto px-10 py-4 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-extrabold text-base shadow-xl shadow-black/50 transition transform hover:-translate-y-0.5 cursor-pointer inline-flex items-center justify-center gap-2"
        >
          <span>{language === 'en' ? 'View Field Analysis' : 'ফিল্ড অ্যানালাইসিস ড্যাশবোর্ড দেখুন'}</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
