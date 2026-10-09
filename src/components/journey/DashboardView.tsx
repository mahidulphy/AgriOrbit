import React, { useState } from 'react';
import {
  Satellite,
  MapPin,
  LogOut,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Droplets,
  Thermometer,
  Wind,
  Layers,
  Sparkles,
  Compass,
} from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language, RiskAlert } from '../../types';
import { ROTATION_PLANS } from '../../data/agriData';
import { getDistrictProfile, getUpazilaName } from '../../lib/location';
import { getNasaContext, nasaSourceLabel } from '../../lib/nasaContext';
import { CropRecommendation } from '../CropRecommendation';
import { SeasonRotation } from '../SeasonRotation';
import { ExplainWhyModal } from '../ExplainWhyModal';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { AppFooter } from '../common/AppFooter';
import { DataTileStatusBadge } from '../common/DataTileStatusBadge';
import { IMAGES } from '../../data/assets';
import {
  ShortTermRiskAlert,
  MiniMapThumbnail,
  FarmerFeedbackLoop,
} from '../dashboard';

interface DashboardViewProps {
  userName: string;
  selectedDistrict: DistrictId;
  selectedUpazila: string;
  fieldLat: number;
  fieldLng: number;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  onChangeFieldLocation: () => void;
  onChangePriority: () => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  userName,
  selectedDistrict,
  selectedUpazila,
  fieldLat,
  fieldLng,
  selectedPriority,
  secondaryPriority,
  language,
  onLanguageChange,
  onChangeFieldLocation,
  onChangePriority,
  onLogout,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'conditions' | 'crops' | 'rotation'>('overview');
  const [explainCrop, setExplainCrop] = useState<CropData | null>(null);

  const district = getDistrictProfile(selectedDistrict);
  const nasaData = getNasaContext(selectedDistrict);
  const power = nasaData.power;
  const smap = nasaData.smap;
  const modis = nasaData.modis;
  const alerts: RiskAlert[] = nasaData.alerts;
  const rotationPlan = ROTATION_PLANS[selectedPriority];

  const upazilaName = getUpazilaName(selectedDistrict, selectedUpazila, language);
  const districtName = language === 'en' ? district.nameEn : district.nameBn;

  // Determine editorial water stress state based on smap and rainfall
  const isWaterStressed = smap.surfaceMoisture < 0.22 || power.rainfallAnomalyPct < -20;

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#050B14]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <BrandLogo badge={language === 'en' ? 'Field Advisory' : 'কৃষি উপদেষ্টা'} />

          {/* Clean Segmented Tab Control */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-[#0B1626] rounded-xl border border-white/10 text-xs font-semibold">
            {(
              [
                { id: 'overview', en: 'Field Story', bn: 'সারসংক্ষেপ' },
                { id: 'conditions', en: 'Telemetry', bn: 'উপগ্রহ পরিমাপ' },
                { id: 'crops', en: 'Crop Compatibility', bn: 'ফসল উপযোগিতা' },
                { id: 'rotation', en: '3-Season Cycle', bn: '৩-মৌসুমী পরিক্রমা' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                    : 'text-[#8FA3B8] hover:text-white'
                }`}
              >
                {language === 'en' ? tab.en : tab.bn}
              </button>
            ))}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Field Location Indicator */}
            <button
              onClick={onChangeFieldLocation}
              title="Change field coordinates"
              className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0B1626] hover:bg-white/5 border border-white/10 text-xs font-mono text-white transition-colors cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{upazilaName}, {districtName.split(' ')[0]}</span>
              <span className="text-[10px] text-[#00E5FF] uppercase font-bold ml-1">Change</span>
            </button>

            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />

            <button
              onClick={onLogout}
              title="Return to public view"
              className="p-2 rounded-xl bg-white/5 hover:bg-[#FF5C5C]/20 border border-white/10 text-[#8FA3B8] hover:text-[#FF5C5C] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. SHORT-TERM RISK ALERT / FIELD ACTION WEATHER ADVISORY */}
      <ShortTermRiskAlert
        language={language}
        districtId={selectedDistrict}
        upazilaName={upazilaName}
        lat={fieldLat}
        lng={fieldLng}
        soilMoisture={smap.surfaceMoisture}
        priority={selectedPriority}
      />

      {/* 3. FIELD ANALYSIS EDITORIAL HEADER */}
      <section className="border-b border-white/10 bg-[#050B14] py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-3">
            <span>FIELD ANALYSIS</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>{upazilaName}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span>{districtName}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-white/70">{fieldLat.toFixed(2)}° N · {fieldLng.toFixed(2)}° E</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                {language === 'en'
                  ? `Agro-Climatic Profile: ${upazilaName}`
                  : `${upazilaName} কৃষি জলবায়ু নিরীক্ষা`}
              </h1>
              <p className="text-sm sm:text-base text-[#8FA3B8] mt-2 max-w-2xl">
                {language === 'en'
                  ? `${district.agroZoneEn} · ${district.soilTypeEn}`
                  : `${district.agroZoneBn} · ${district.soilTypeBn}`}
              </p>
            </div>

            {/* Header Companion Cluster: Mini Map Thumbnail + Priority Pill */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shrink-0">
              {/* Mini Map Thumbnail Layer */}
              <MiniMapThumbnail
                district={districtName}
                upazila={upazilaName}
                lat={fieldLat}
                lng={fieldLng}
                language={language}
                onExpand={onChangeFieldLocation}
              />

              {/* Active Priority Indicator Pill */}
              <div className="flex items-center gap-2">
                <div className="px-4 py-2.5 rounded-2xl bg-[#0B1626] border border-white/10 text-xs">
                  <span className="text-[#8FA3B8] block text-[10px] uppercase font-mono mb-0.5">
                    {language === 'en' ? 'Active Priority' : 'সক্রিয় লক্ষ্য'}
                  </span>
                  <span className="font-bold text-[#B8FF3D] capitalize">
                    {selectedPriority.replace('_', ' ')}
                    {secondaryPriority ? ` + ${secondaryPriority.replace('_', ' ')}` : ''}
                  </span>
                </div>

                <button
                  onClick={onChangePriority}
                  className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white transition-colors cursor-pointer"
                >
                  {language === 'en' ? 'Edit' : 'পরিবর্তন'}
                </button>
              </div>
            </div>
          </div>

          {/* LARGE EDITORIAL SUMMARY BANNER: "Your field is currently under moderate water stress." */}
          <div className={`p-6 sm:p-8 rounded-3xl border transition-all ${
            isWaterStressed
              ? 'bg-[#0B1626] border-[#FF5C5C]/30 shadow-xl shadow-black/40'
              : 'bg-[#0B1626] border-[#B8FF3D]/30 shadow-xl shadow-black/40'
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="max-w-3xl">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider font-mono font-semibold mb-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isWaterStressed ? 'bg-[#FF5C5C]' : 'bg-[#B8FF3D]'}`} />
                  <span className={isWaterStressed ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}>
                    {isWaterStressed
                      ? (language === 'en' ? 'Observation Alert: Water Deficit' : 'উপগ্রহ সতর্কতা: পানির ঘাটতি')
                      : (language === 'en' ? 'Observation Status: Optimal Moisture' : 'আর্দ্রতা পরিস্থিতি: স্বাভাবিক')}
                  </span>
                </div>

                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2 leading-snug">
                  {isWaterStressed
                    ? (language === 'en'
                        ? 'Your field is currently under moderate water stress.'
                        : 'আপনার জমিতে বর্তমানে মাঝারি মাত্রার পানির ঘাটতি পরিলক্ষিত হচ্ছে।')
                    : (language === 'en'
                        ? 'Your field displays adequate moisture for active vegetation.'
                        : 'আপনার জমিতে বর্তমানে উদ্ভিদের বৃদ্ধির জন্য পর্যাপ্ত আর্দ্রতা রয়েছে।')}
                </h2>

                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? `Pre-monsoon precipitation is ${power.rainfallAnomalyPct}% vs the 30-year NASA historical average. Root-zone soil moisture is ${smap.surfaceMoisture} m³/m³ (${smap.statusEn}). High-irrigation flood crops face heavy diesel pumping overhead.`
                    : `নাসার ৩০ বছরের ঐতিহাসিক গড়ের তুলনায় বৃষ্টিপাত ${power.rainfallAnomalyPct}% কম। মাটির মূলস্তরের আর্দ্রতা ${smap.surfaceMoisture} m³/m³ (${smap.statusBn})। অতিরিক্ত সেচের ধান চাষে বাড়তি ব্যয়ের ঝুঁকি রয়েছে।`}
                </p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => setActiveTab('crops')}
                  className="px-5 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs sm:text-sm tracking-tight transition-all cursor-pointer whitespace-nowrap"
                >
                  {language === 'en' ? 'See Recommended Crops' : 'উপযুক্ত ফসল দেখুন'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MAIN EDITORIAL CONTENT TABS */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-16">
        {/* OVERVIEW / CONDITIONS TAB */}
        {(activeTab === 'overview' || activeTab === 'conditions') && (
          <>
            {/* SUPPORTING DATA VISUALLY: RAIN, SOIL MOISTURE, TEMPERATURE */}
            <section>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-4">
                <span>OBSERVED TELEMETRY</span>
                <span aria-hidden="true">·</span>
                <span>{nasaSourceLabel(nasaData, districtName, language)}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. RAINFALL CARD */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA POWER"
                        status="cached"
                        date="2026-10-06"
                        language={language}
                      />
                      <span className="font-mono text-xs text-[#FF5C5C] font-semibold">
                        {power.rainfallAnomalyPct}% vs Normal
                      </span>
                    </div>

                    <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                      {power.rainfallMm} <span className="text-base font-normal text-[#8FA3B8]">mm</span>
                    </div>

                    <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                      {language === 'en'
                        ? 'Cumulative pre-monsoon precipitation deficit. Unirrigated topsoil dries within 4–5 days of sun exposure.'
                        : 'প্রাক-বর্ষা মৌসুমে স্বাভাবিকের চেয়ে কম বৃষ্টি। রোদে মাটির উপরিভাগের রস দ্রুত শুকিয়ে যায়।'}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                    <span>Solar Radiation</span>
                    <span className="text-white font-bold">{power.radiationMj} MJ/m²</span>
                  </div>
                </div>

                {/* 2. SOIL MOISTURE CARD */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA SMAP"
                        status="snapshot"
                        date="2026-10-06"
                        language={language}
                      />
                      <span className="font-mono text-xs text-[#00E5FF] font-semibold">
                        {language === 'en' ? smap.statusEn : smap.statusBn}
                      </span>
                    </div>

                    <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                      {smap.surfaceMoisture} <span className="text-base font-normal text-[#8FA3B8]">m³/m³</span>
                    </div>

                    {/* Gauge Bar */}
                    <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className="bg-[#00E5FF] h-full rounded-full transition-all duration-500"
                        style={{ width: `${smap.levelPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                      <span>Deficit (&lt;0.15)</span>
                      <span>Target (0.22–0.30)</span>
                      <span>Surplus</span>
                    </div>

                    <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                      {language === 'en'
                        ? '0–5 cm rootzone layer measured by L-band radiometer. Insufficient for continuous standing flood irrigation.'
                        : '০–৫ সেমি শিকড় স্তরের আর্দ্রতা। গভীর পানির বোরো চাষের জন্য অপ্রতুল, তবে ডাল ফসলের জন্য কার্যকর।'}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                    <span>Air Humidity</span>
                    <span className="text-white font-semibold">{power.humidityPct}% RH</span>
                  </div>
                </div>

                {/* 3. TEMPERATURE & BIOSPHERE CARD */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA MODIS"
                        status="snapshot"
                        date="2026-10-06"
                        language={language}
                      />
                      <span className="font-mono text-xs text-[#B8FF3D] font-semibold">
                        {language === 'en' ? modis.ndviStatusEn : modis.ndviStatusBn}
                      </span>
                    </div>

                    <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                      {power.tempC}°C <span className="text-base font-normal text-[#8FA3B8]">2m Mean</span>
                    </div>

                    <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                      {language === 'en'
                        ? `Vegetation index is ${modis.ndvi} NDVI (moderate greenery). Surface thermal reading is ${modis.landSurfaceTempC}°C, within safe photosynthetic limits.`
                        : `উদ্ভিদ সজীবতা সূচক ${modis.ndvi} NDVI (মাঝারি সবুজ)। ভূপৃষ্ঠের তাপমাত্রা ${modis.landSurfaceTempC}°C, যা ফসলের জন্য সহনীয়।`}
                    </p>
                  </div>

                  <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                    <span>Land Surface Temp</span>
                    <span className="text-white font-semibold">{modis.landSurfaceTempC}°C</span>
                  </div>
                </div>
              </div>
            </section>

            {/* WHY THIS MATTERS: Visual agronomic explanation */}
            <section className="p-8 sm:p-10 rounded-3xl bg-[#0B1626] border border-white/10">
              <div className="max-w-3xl mb-8">
                <span className="text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold block mb-1">
                  AGRONOMIC REASONING
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? 'Why this matters for your field' : 'আপনার জমির জন্য এই তথ্যের গুরুত্ব'}
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#8FA3B8]">
                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="font-mono text-xs text-[#00E5FF] font-semibold block mb-2">01 · Water Conservation</span>
                  <p className="leading-relaxed">
                    {language === 'en'
                      ? 'Because subsurface moisture is low and rainfall anomaly is negative, choosing high-irrigation Boro rice increases diesel pumping costs by ৳12,000–৳18,000 per acre.'
                      : 'যেহেতু বৃষ্টিপাত ও মাটির রস কম, অতিরিক্ত সেচ নির্ভর বোরো ধান চাষ করলে একর প্রতি ১২,০০০–১৮,০০০ টাকা বাড়তি ডিজেল ও বিদ্যুৎ খরচ হবে।'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="font-mono text-xs text-[#B8FF3D] font-semibold block mb-2">02 · Tap-Root Advantage</span>
                  <p className="leading-relaxed">
                    {language === 'en'
                      ? 'Lentil and Mustard possess tap roots that exploit deeper subsoil moisture, requiring only 1–2 light irrigations to reach full maturity.'
                      : 'মসুর ও সরিষার শিকড় মাটির গভীরে প্রবেশ করে রস টানতে পারে, ফলে মাত্র ১-২টি হালকা সেচেই কাঙ্ক্ষিত ফলন পাওয়া যায়।'}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="font-mono text-xs text-white font-semibold block mb-2">03 · Biological Soil Recovery</span>
                  <p className="leading-relaxed">
                    {language === 'en'
                      ? 'A summer Mungbean catch-crop fixes 40 kg biological nitrogen per hectare, lowering fertilizer needs for the subsequent monsoon T. Aman rice by 30%.'
                      : 'গ্রীষ্মকালীন মুগডাল চাষ করলে মাটিতে হেক্টর প্রতি ৪০ কেজি প্রাকৃতিক নাইট্রোজেন জমা হয়, যা পরবর্তী আমন ধানে ৩০% ইউরিয়া সারের খরচ বাঁচায়।'}
                  </p>
                </div>
              </div>
            </section>

            {/* FIELD CLIMATE SHIFT TIMELINE */}
            <section className="p-8 sm:p-10 rounded-3xl bg-[#0B1626] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold block mb-1">
                    CLIMATE SHIFT IN {districtName.toUpperCase()}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {language === 'en' ? 'Long-Term Environmental Trend' : 'দীর্ঘমেয়াদী জলবায়ু রূপান্তর'}
                  </h3>
                </div>
                <div className="text-xs text-[#8FA3B8] font-mono">
                  30-Year NASA POWER Baseline vs 5-Year Recent
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="text-xs text-[#8FA3B8] block mb-1">Pre-Monsoon Rainfall</span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#FF5C5C]">-24%</span>
                    <TrendingDown className="w-4 h-4 text-[#FF5C5C]" />
                  </div>
                  <span className="text-xs text-[#8FA3B8]">Dry spells extended 18 days longer</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="text-xs text-[#8FA3B8] block mb-1">Mean Rabi Temperature</span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#FF5C5C]">+1.2°C</span>
                    <TrendingUp className="w-4 h-4 text-[#FF5C5C]" />
                  </div>
                  <span className="text-xs text-[#8FA3B8]">Warm nights during grain-filling</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="text-xs text-[#8FA3B8] block mb-1">Groundwater Depth</span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#00E5FF]">-3.4 m</span>
                    <TrendingDown className="w-4 h-4 text-[#00E5FF]" />
                  </div>
                  <span className="text-xs text-[#8FA3B8]">Pumping energy cost +32% since 2018</span>
                </div>

                <div className="p-5 rounded-2xl bg-[#050B14] border border-white/10">
                  <span className="text-xs text-[#8FA3B8] block mb-1">Soil Organic Matter</span>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-[#B8FF3D]">0.82%</span>
                    <span className="text-xs text-[#8FA3B8] font-mono">(Low)</span>
                  </div>
                  <span className="text-xs text-[#8FA3B8]">Pulse rotation required for nitrogen</span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* CROP COMPATIBILITY EVALUATION (Embedded component) */}
        {(activeTab === 'overview' || activeTab === 'crops') && (
          <CropRecommendation
            selectedPriority={selectedPriority}
            secondaryPriority={secondaryPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
          />
        )}

        {/* 3-SEASON ROTATION CYCLE (Embedded component) */}
        {(activeTab === 'overview' || activeTab === 'rotation') && (
          <SeasonRotation
            selectedDistrict={selectedDistrict}
            selectedPriority={selectedPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
          />
        )}

        {/* 5. FARMER FEEDBACK LOOP (DATA COLLECTION) */}
        <FarmerFeedbackLoop
          language={language}
          district={districtName}
          upazila={upazilaName}
          selectedPriority={selectedPriority}
        />
      </main>

      {/* 4. EXPLAIN WHY TRANSPARENCY MODAL */}
      <ExplainWhyModal
        crop={explainCrop}
        selectedPriority={selectedPriority}
        secondaryPriority={secondaryPriority}
        language={language}
        onClose={() => setExplainCrop(null)}
      />

      {/* 5. FOOTER */}
      <AppFooter language={language} userName={userName} />
    </div>
  );
};
