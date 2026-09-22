import React from 'react';
import { MapPin, ArrowRight, ArrowLeft, Layers } from 'lucide-react';
import { DistrictId, Language } from '../../types';
import { DISTRICTS } from '../../data/agriData';

interface FarmLocationSetupProps {
  selectedDistrict: DistrictId;
  selectedUpazila: string;
  onSelectDistrict: (districtId: DistrictId) => void;
  onSelectUpazila: (upazilaId: string) => void;
  language: Language;
  onContinue: () => void;
  onBack: () => void;
}

export const FarmLocationSetup: React.FC<FarmLocationSetupProps> = ({
  selectedDistrict,
  selectedUpazila,
  onSelectDistrict,
  onSelectUpazila,
  language,
  onContinue,
  onBack,
}) => {
  const currentDistrictInfo = DISTRICTS[selectedDistrict];

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDistrict = e.target.value as DistrictId;
    onSelectDistrict(newDistrict);
    // Auto-select first upazila of new district
    if (DISTRICTS[newDistrict]?.upazilas?.[0]) {
      onSelectUpazila(DISTRICTS[newDistrict].upazilas[0].id);
    }
  };

  return (
    <div className="min-h-screen bg-[#2E1065] text-[#E9D5FF] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#A855F7] selection:text-white relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#6D28D9]/25 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Card */}
      <div className="w-full max-w-xl bg-[#3B0764]/80 border border-[#6D28D9]/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#6D28D9]/40">
          <button
            onClick={onBack}
            className="text-xs text-[#E9D5FF]/70 hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#A855F7]">
            <span className="font-bold text-white bg-[#A855F7] px-2 py-0.5 rounded text-[11px]">01</span>
            <span className="text-[#E9D5FF]/40">/ 04</span>
            <span className="font-sans font-semibold text-[#E9D5FF]/80 ml-1">
              {language === 'en' ? 'Location Setup' : 'অবস্থান নির্বাচন'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#6D28D9] flex items-center justify-center text-white mb-3 shadow-md">
            <MapPin className="w-5 h-5 text-cyan-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'Where is your farm?' : 'আপনার খামার বা জমি কোথায় অবস্থিত?'}
          </h2>
          <p className="text-xs sm:text-sm text-[#E9D5FF]/80 mt-1">
            {language === 'en'
              ? 'Select your administrative district and upazila in Bangladesh to calibrate regional agro-climate data.'
              : 'আঞ্চলিক উপগ্রহ ও কৃষি-পরিবেশগত তথ্য বিশ্লেষণের জন্য জেলা ও উপজেলা নির্বাচন করুন।'}
          </p>
        </div>

        {/* Dropdowns */}
        <div className="space-y-4 mb-6">
          {/* District Dropdown */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'District / জেলা' : 'জেলা'}
            </label>
            <div className="relative">
              <select
                value={selectedDistrict}
                onChange={handleDistrictChange}
                className="w-full px-4 py-3 rounded-xl bg-[#2E1065] border border-[#6D28D9] text-white text-sm font-semibold focus:outline-none focus:border-[#A855F7] cursor-pointer appearance-none"
              >
                {Object.values(DISTRICTS).map((dist) => (
                  <option key={dist.id} value={dist.id} className="bg-[#2E1065] text-white">
                    {language === 'en' ? dist.nameEn : dist.nameBn}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-3.5 text-[#A855F7]">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-[#E9D5FF]/60 mt-1">
              {language === 'en'
                ? 'Structure supports scaling to all 64 districts of Bangladesh.'
                : 'বাংলাদেশের সকল ৬৪টি জেলার উপযোগী করে নকশা করা।'}
            </p>
          </div>

          {/* Upazila Dropdown */}
          <div>
            <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
              {language === 'en' ? 'Upazila / উপজেলা' : 'উপজেলা'}
            </label>
            <div className="relative">
              <select
                value={selectedUpazila}
                onChange={(e) => onSelectUpazila(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#2E1065] border border-[#6D28D9] text-white text-sm font-semibold focus:outline-none focus:border-[#A855F7] cursor-pointer appearance-none"
              >
                {currentDistrictInfo.upazilas.map((upz) => (
                  <option key={upz.id} value={upz.id} className="bg-[#2E1065] text-white">
                    {language === 'en' ? upz.nameEn : upz.nameBn}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-3.5 text-[#A855F7]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Selected Region Agro-Ecological Context Card */}
        <div className="p-4 rounded-2xl bg-[#2E1065] border border-[#6D28D9]/50 mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Layers className="w-4 h-4 text-[#A855F7]" />
            <span>
              {language === 'en' ? 'Agro-Ecological Profile' : 'কৃষি-বাস্তুসংস্থান বিবরণ'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-[10px] text-[#E9D5FF]/60 block">Agro-Ecological Zone (AEZ)</span>
              <span className="font-semibold text-white">
                {language === 'en' ? currentDistrictInfo.agroZoneEn : currentDistrictInfo.agroZoneBn}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#E9D5FF]/60 block">Dominant Soil Type</span>
              <span className="font-semibold text-white">
                {language === 'en' ? currentDistrictInfo.soilTypeEn : currentDistrictInfo.soilTypeBn}
              </span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/40 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{language === 'en' ? 'Continue to Field Selection' : 'জমি চিহ্নিতকরণে এগিয়ে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
