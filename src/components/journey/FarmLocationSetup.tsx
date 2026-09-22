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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00E5FF]/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Card */}
      <div className="w-full max-w-xl bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#00E5FF]">
            <span className="font-bold text-[#050B14] bg-[#00E5FF] px-2 py-0.5 rounded text-[11px]">01</span>
            <span className="text-[#8FA3B8]">/ 04</span>
            <span className="font-sans font-semibold text-[#8FA3B8] ml-1">
              {language === 'en' ? 'Location Setup' : 'অবস্থান নির্বাচন'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center mb-3 shadow-md">
            <MapPin className="w-5 h-5 text-[#00E5FF]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'Where is your farm?' : 'আপনার খামার বা জমি কোথায় অবস্থিত?'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
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
                className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#00E5FF]/60 cursor-pointer appearance-none"
              >
                {Object.values(DISTRICTS).map((dist) => (
                  <option key={dist.id} value={dist.id} className="bg-[#050B14] text-white">
                    {language === 'en' ? dist.nameEn : dist.nameBn}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF]">
                ▼
              </div>
            </div>
            <p className="text-[11px] text-[#8FA3B8] mt-1">
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
                className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#00E5FF]/60 cursor-pointer appearance-none"
              >
                {currentDistrictInfo.upazilas.map((upz) => (
                  <option key={upz.id} value={upz.id} className="bg-[#050B14] text-white">
                    {language === 'en' ? upz.nameEn : upz.nameBn}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF]">
                ▼
              </div>
            </div>
          </div>
        </div>

        {/* Selected Region Agro-Ecological Context Card */}
        <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10 mb-8 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-white">
            <Layers className="w-4 h-4 text-[#00E5FF]" />
            <span>
              {language === 'en' ? 'Agro-Ecological Profile' : 'কৃষি-বাস্তুসংস্থান বিবরণ'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div>
              <span className="text-[10px] text-[#8FA3B8] block">Agro-Ecological Zone (AEZ)</span>
              <span className="font-semibold text-white">
                {language === 'en' ? currentDistrictInfo.agroZoneEn : currentDistrictInfo.agroZoneBn}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#8FA3B8] block">Dominant Soil Type</span>
              <span className="font-semibold text-white">
                {language === 'en' ? currentDistrictInfo.soilTypeEn : currentDistrictInfo.soilTypeBn}
              </span>
            </div>
          </div>
        </div>

        {/* Continue Button */}
        <button
          onClick={onContinue}
          className="w-full py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-black text-sm shadow-lg shadow-black/40 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <span>{language === 'en' ? 'Continue to Field Selection' : 'জমি চিহ্নিতকরণে এগিয়ে যান'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
