import React, { useState } from 'react';
import { Crosshair, MapPin, ArrowLeft, AlertCircle, Check } from 'lucide-react';
import { DistrictId, Language } from '../../types';
import { DISTRICTS } from '../../data/agriData';

interface FieldLocationSelectionProps {
  selectedDistrict: DistrictId;
  fieldLat: number;
  fieldLng: number;
  onUpdateCoordinates: (lat: number, lng: number) => void;
  language: Language;
  onConfirmFieldLocation: () => void;
  onBack: () => void;
}

export const FieldLocationSelection: React.FC<FieldLocationSelectionProps> = ({
  selectedDistrict,
  fieldLat,
  fieldLng,
  onUpdateCoordinates,
  language,
  onConfirmFieldLocation,
  onBack,
}) => {
  const district = DISTRICTS[selectedDistrict];
  const [markerOffset, setMarkerOffset] = useState({ x: 50, y: 50 }); // percentage

  // Preset farm plot options in the upazila
  const plotPresets = [
    { name: 'North Paddy Field #1', dLat: 0.008, dLng: 0.006, x: 58, y: 42 },
    { name: 'South Alluvial Basin #4', dLat: -0.012, dLng: 0.004, x: 54, y: 64 },
    { name: 'Riverbank Silt Plot #9', dLat: -0.004, dLng: -0.011, x: 38, y: 54 },
    { name: 'Village Uplands #14 (Default)', dLat: 0.0, dLng: 0.0, x: 50, y: 50 },
  ];

  const handleSelectPreset = (preset: typeof plotPresets[0]) => {
    onUpdateCoordinates(
      Number((district.lat + preset.dLat).toFixed(4)),
      Number((district.lng + preset.dLng).toFixed(4))
    );
    setMarkerOffset({ x: preset.x, y: preset.y });
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 100);

    const latDelta = ((50 - yPct) / 100) * 0.04;
    const lngDelta = ((xPct - 50) / 100) * 0.04;

    setMarkerOffset({ x: xPct, y: yPct });
    onUpdateCoordinates(
      Number((district.lat + latDelta).toFixed(4)),
      Number((district.lng + lngDelta).toFixed(4))
    );
  };

  return (
    <div className="min-h-screen bg-[#2E1065] text-[#E9D5FF] flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#A855F7] selection:text-white relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#6D28D9]/25 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-3xl bg-[#3B0764]/80 border border-[#6D28D9]/70 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative z-10">
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
            <span className="font-bold text-white bg-[#A855F7] px-2 py-0.5 rounded text-[11px]">02</span>
            <span className="text-[#E9D5FF]/40">/ 04</span>
            <span className="font-sans font-semibold text-[#E9D5FF]/80 ml-1">
              {language === 'en' ? 'Field Selection' : 'নির্দিষ্ট জমি চিহ্নিতকরণ'}
            </span>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#6D28D9] flex items-center justify-center text-white mb-2 shadow-md">
            <Crosshair className="w-5 h-5 text-amber-300" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'Select your field' : 'আপনার কৃষি জমি চিহ্নিত করুন'}
          </h2>
          <p className="text-xs sm:text-sm text-[#E9D5FF]/80 mt-1">
            {language === 'en'
              ? `Pin your actual field plot in ${district.nameEn}. Click anywhere on the map or choose a farm plot below.`
              : `${district.nameBn}-এ আপনার নির্দিষ্ট জমি নির্ধারণ করুন। মানচিত্রে ক্লিক করুন অথবা নিচের প্লট নির্বাচন করুন।`}
          </p>
        </div>

        {/* Quick Search / Plot Presets */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A855F7]">
              {language === 'en' ? 'Quick Plot Presets:' : 'দ্রুত প্লট নির্বাচন:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plotPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-[#2E1065] hover:bg-[#6D28D9]/50 border border-[#6D28D9]/60 text-xs text-[#E9D5FF] font-medium transition cursor-pointer"
              >
                📍 {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Interactive Map Visual Stage */}
        <div
          onClick={handleMapClick}
          className="relative h-64 sm:h-80 w-full rounded-2xl bg-[#1E0A45] border-2 border-[#6D28D9] overflow-hidden cursor-crosshair shadow-inner group mb-4"
        >
          {/* Gridded Earth Observation overlay */}
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage: `linear-gradient(#A855F7 1px, transparent 1px), linear-gradient(90deg, #A855F7 1px, transparent 1px)`,
              backgroundSize: '36px 36px',
            }}
          />

          {/* Simulated satellite regional heatmap & field contours */}
          <div className="absolute inset-0 flex items-center justify-center opacity-40 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 240" fill="none">
              <path
                d="M 40,80 Q 120,40 220,100 T 360,140"
                stroke="#A855F7"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <path
                d="M 60,160 Q 180,120 280,180 T 380,110"
                stroke="#06B6D4"
                strokeWidth="2"
                strokeDasharray="4 4"
              />
              <rect x="130" y="70" width="140" height="90" rx="8" fill="#6D28D9" fillOpacity="0.25" stroke="#A855F7" strokeWidth="1.5" />
            </svg>
          </div>

          {/* NASA Footprint Cell Label */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm border border-[#6D28D9]/50 text-[10px] font-mono text-cyan-300">
            NASA Observation Grid Cell #248 (Coverage ~9km)
          </div>

          {/* Interactive Marker Pin */}
          <div
            className="absolute transform -translate-x-1/2 -translate-y-full transition-all duration-300 pointer-events-none"
            style={{ left: `${markerOffset.x}%`, top: `${markerOffset.y}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 font-black text-[11px] shadow-lg flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>Selected Plot</span>
              </div>
              <div className="w-2.5 h-2.5 bg-amber-400 rotate-45 -mt-1 shadow-md" />
              <div className="w-3 h-3 rounded-full bg-amber-400/40 animate-ping mt-1" />
            </div>
          </div>

          {/* Helper hint */}
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-[#E9D5FF] border border-[#6D28D9]/50 pointer-events-none">
            {language === 'en' ? 'Click anywhere on map to reposition field pin' : 'পিন পরিবর্তন করতে মানচিত্রে ক্লিক করুন'}
          </div>
        </div>

        {/* Selected Field Coordinates Bar */}
        <div className="p-3.5 rounded-xl bg-[#2E1065] border border-[#6D28D9]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-4">
          <div className="flex items-center gap-4 font-mono text-[#E9D5FF]">
            <div>
              <span className="text-[#E9D5FF]/60 block text-[10px]">LATITUDE</span>
              <strong className="text-white text-sm">{fieldLat}° N</strong>
            </div>
            <div className="h-6 w-px bg-[#6D28D9]/60" />
            <div>
              <span className="text-[#E9D5FF]/60 block text-[10px]">LONGITUDE</span>
              <strong className="text-white text-sm">{fieldLng}° E</strong>
            </div>
          </div>

          <div className="text-[11px] text-[#E9D5FF]/80">
            {language === 'en' ? 'Anchor: ' : 'প্লট: '}
            <strong className="text-white">{district.defaultFieldTag}</strong>
          </div>
        </div>

        {/* IMPORTANT: Scientific Transparency Notice (Explicit User Requirement) */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 flex items-start gap-3 text-xs leading-relaxed text-amber-200 mb-6">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">
              {language === 'en' ? 'Scientific Spatial Resolution Notice:' : 'উপগ্রহ তথ্যের পরিসর সংক্রান্ত ব্যাখ্যা:'}
            </strong>
            {language === 'en'
              ? 'NASA datasets provide gridded regional observations (SMAP soil moisture ~9km, POWER rainfall ~50km, MODIS vegetation 250m). They do not measure sub-meter field rows directly. Your field pin anchors the localized soil profile and BARI crop calendar rules.'
              : 'নাসার উপগ্রহগুলো আঞ্চলিক গ্রিড পরিসরে তথ্য প্রদান করে (স্ম্যাপ ~৯ কিমি, পাওয়ার ~৫০ কিমি, মডিস ২৫০ মি)। আপনার নির্ধারিত ফিল্ড পিনের মাধ্যমে স্থানীয় মাটির ধরন ও বিএআরআই কৃষি ক্যালেন্ডারের সঠিক সমন্বয় ঘটে।'}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onConfirmFieldLocation}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#A855F7] hover:from-[#6D28D9] hover:to-[#9333EA] text-white font-black text-sm shadow-lg shadow-[#7C3AED]/40 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{language === 'en' ? 'Confirm Field Location' : 'জমির অবস্থান নিশ্চিত করুন'}</span>
        </button>
      </div>
    </div>
  );
};
