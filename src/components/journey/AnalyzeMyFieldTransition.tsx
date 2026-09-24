import React, { useState, useEffect } from 'react';
import { ArrowRight, Check, Satellite } from 'lucide-react';
import { DistrictId, FarmerPriorityId, Language } from '../../types';
import { getDistrictAdmin } from '../../data/bdAdmin';
import { Eyebrow, PrimaryButton } from '../ui';
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
  const admin = getDistrictAdmin(selectedDistrict);
  const districtName =
    language === 'en' ? admin?.nameEn ?? selectedDistrict : admin?.nameBn ?? selectedDistrict;
  const [activeStep, setActiveStep] = useState(0);

  const streams = [
    { name: 'NASA POWER', labelEn: 'Rainfall and temperature profile', labelBn: 'বৃষ্টি ও তাপমাত্রা' },
    { name: 'NASA SMAP', labelEn: 'Surface and root-zone soil moisture', labelBn: 'মাটির আর্দ্রতা' },
    { name: 'NASA MODIS', labelEn: 'Vegetation index (NDVI) and surface heat', labelBn: 'উদ্ভিদ সূচক ও তাপ' },
    { name: 'BARI agronomy', labelEn: 'Agro-ecological calendar rules', labelBn: 'কৃষি ক্যালেন্ডার নিয়ম' },
    { name: 'Priority filter', labelEn: selectedPriority.replace('_', ' '), labelBn: 'অগ্রাধিকার ফিল্টার' },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev < streams.length ? prev + 1 : prev));
    }, 650);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center px-4 sm:px-6 py-10 selection:bg-[#B8FF3D] selection:text-[#050B14]">
      <div className="w-full max-w-2xl mt-6 sm:mt-10">
        <div className="flex items-center gap-3">
          <Satellite className="w-5 h-5 text-[#00E5FF]" />
          <p className="tnum text-xs text-[#8FA3B8]">
            {fieldLat}° N, {fieldLng}° E · {districtName}
          </p>
        </div>
        <Eyebrow className="mt-6">{language === 'en' ? 'Analysis' : 'বিশ্লেষণ'}</Eyebrow>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
          {language === 'en' ? 'Reading your field…' : 'জমি পড়া হচ্ছে…'}
        </h1>

        <ol className="mt-8 border-t border-white/10">
          {streams.map((stream, idx) => {
            const done = activeStep > idx;
            const active = activeStep === idx;
            return (
              <li key={stream.name} className="flex items-center justify-between gap-4 py-3.5 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`tnum flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${
                      done
                        ? 'border-[#B8FF3D] bg-[#B8FF3D] text-[#050B14]'
                        : active
                          ? 'border-[#00E5FF] text-[#00E5FF]'
                          : 'border-white/15 text-[#8FA3B8]'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3 stroke-[3]" /> : idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className={`text-sm font-semibold ${done || active ? 'text-white' : 'text-[#8FA3B8]'}`}>
                      {stream.name}
                    </p>
                    <p className="text-xs text-[#8FA3B8]">
                      {language === 'en' ? stream.labelEn : stream.labelBn}
                    </p>
                  </div>
                </div>
                <span className="tnum text-[11px] uppercase tracking-wider text-[#8FA3B8] shrink-0">
                  {done ? (language === 'en' ? 'Done' : 'সম্পন্ন') : active ? '…' : ''}
                </span>
              </li>
            );
          })}
        </ol>

        <p className="text-xs text-[#8FA3B8] italic mt-6">{AGRIORBIT_TAGLINE}</p>

        <PrimaryButton onClick={onViewDashboard} className="w-full sm:w-auto px-10 py-3.5 text-base mt-6">
          <span>{language === 'en' ? 'View Field Analysis' : 'মাঠ বিশ্লেষণ দেখুন'}</span>
          <ArrowRight className="w-4 h-4" />
        </PrimaryButton>
      </div>
    </div>
  );
};
