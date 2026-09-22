import React, { useState } from 'react';
import {
  Satellite,
  MapPin,
  LogOut,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
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

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-sans selection:bg-[#B8FF3D] selection:text-[#050B14]">
      {/* 1. Logged-in App Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#050B14]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Field Engine Tag */}
          <BrandLogo badge="Field Engine" />

          {/* Nav Tabs for Logged-In User */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs font-bold">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'overview' ? 'bg-[#B8FF3D] text-[#050B14] shadow' : 'text-[#8FA3B8] hover:text-white'
              }`}
            >
              {language === 'en' ? 'Overview' : 'সারসংক্ষেপ'}
            </button>
            <button
              onClick={() => setActiveTab('conditions')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'conditions' ? 'bg-[#B8FF3D] text-[#050B14] shadow' : 'text-[#8FA3B8] hover:text-white'
              }`}
            >
              {language === 'en' ? 'Field Conditions' : 'মাটির অবস্থা'}
            </button>
            <button
              onClick={() => setActiveTab('crops')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'crops' ? 'bg-[#B8FF3D] text-[#050B14] shadow' : 'text-[#8FA3B8] hover:text-white'
              }`}
            >
              {language === 'en' ? 'Crop Plan' : 'ফসল পরিকল্পনা'}
            </button>
            <button
              onClick={() => setActiveTab('rotation')}
              className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
                activeTab === 'rotation' ? 'bg-[#B8FF3D] text-[#050B14] shadow' : 'text-[#8FA3B8] hover:text-white'
              }`}
            >
              {language === 'en' ? '3-Season Rotation' : '৩-মৌসুমী আবর্তন'}
            </button>
          </nav>

          {/* Right Actions: Field Badge, Language, User Menu */}
          <div className="flex items-center gap-3">
            {/* Active Field Badge */}
            <button
              onClick={onChangeFieldLocation}
              title="Click to change field or district"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white transition cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{upazilaName}, {language === 'en' ? district.nameEn.split(' ')[0] : district.nameBn.split(' ')[0]}</span>
              <span className="text-[10px] text-[#00E5FF] font-bold underline ml-1">Edit</span>
            </button>

            {/* Language Switcher */}
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />

            {/* Logout / Switch User */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-xl bg-white/5 hover:bg-[#FF5C5C]/15 border border-white/10 text-[#8FA3B8] hover:text-[#FF5C5C] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Field Analysis Header: Location & Field Pin Bar */}
      <section className="bg-[#0B1626] border-b border-white/10 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-1">
              <MapPin className="w-4 h-4 text-[#B8FF3D]" />
              <span>
                {language === 'en' ? 'Your Field' : 'আপনার কৃষি জমি'} • {upazilaName}, {language === 'en' ? district.nameEn : district.nameBn}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-white">
              {language === 'en' ? 'Field Analysis Dashboard' : 'ফিল্ড অ্যানালাইসিস ড্যাশবোর্ড'}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#8FA3B8] mt-2 font-mono">
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#00E5FF]">
                Lat: {fieldLat}° N, Lng: {fieldLng}° E
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-white">
                {district.defaultFieldTag}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#B8FF3D]">
                AEZ: {language === 'en' ? district.agroZoneEn : district.agroZoneBn}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
                NASA: {nasaSourceLabel(nasaData, language === 'en' ? district.nameEn : district.nameBn, language)}
              </span>
            </div>
          </div>

          {/* Quick Actions & Priority Tag */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-xl bg-white/5 border border-[#B8FF3D]/30 text-xs">
              <span className="text-[#8FA3B8] block text-[10px] uppercase font-bold">
                {language === 'en' ? 'Active Priority:' : 'সক্রিয় লক্ষ্য:'}
              </span>
              <strong className="text-white capitalize flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#B8FF3D] animate-pulse" />
                {selectedPriority.replace('_', ' ')}
                {secondaryPriority ? ` + ${secondaryPriority.replace('_', ' ')}` : ''}
              </strong>
            </div>

            <button
              onClick={onChangePriority}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition cursor-pointer"
            >
              {language === 'en' ? 'Change Priority' : 'লক্ষ্য বদলান'}
            </button>

            <button
              onClick={onChangeFieldLocation}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition cursor-pointer"
            >
              {language === 'en' ? 'Change Location' : 'অবস্থান বদলান'}
            </button>
          </div>
        </div>
      </section>

      {/* 3. Main Dashboard Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex-1 space-y-12">
        {/* SECTION 1: RISK ALERTS */}
        <section>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-3">
            <AlertTriangle className="w-4 h-4 text-[#FF5C5C]" />
            <span>{language === 'en' ? 'Field Risk & Opportunity Alerts' : 'ঝুঁকি ও সহায়ক আবহাওয়া সতর্কতা'}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {alerts.map((alert) => {
              const isWarning = alert.type === 'warning';
              const isInfo = alert.type === 'info';
              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-xl border flex items-start gap-3 transition shadow-sm ${
                    isWarning
                      ? 'bg-[#FF5C5C]/5 border-[#FF5C5C]/40 text-[#FF5C5C]'
                      : isInfo
                      ? 'bg-[#00E5FF]/5 border-[#00E5FF]/40 text-[#00E5FF]'
                      : 'bg-[#B8FF3D]/5 border-[#B8FF3D]/40 text-[#B8FF3D]'
                  }`}
                >
                  <span className="text-xl shrink-0 mt-0.5">{alert.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-white">
                        {language === 'en' ? alert.titleEn : alert.titleBn}
                      </h4>
                      <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        isWarning ? 'bg-[#FF5C5C]/15 text-[#FF5C5C]' : 'bg-[#B8FF3D]/15 text-[#B8FF3D]'
                      }`}>
                        {isWarning ? 'Warning' : 'Good'}
                      </span>
                    </div>
                    <p className="text-xs text-[#8FA3B8] mt-1 leading-relaxed">
                      {language === 'en' ? alert.descEn : alert.descBn}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: CURRENT CONDITIONS — COMPACT VERTICAL WHITE NASA DATA CARDS */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-4 gap-2">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00E5FF] mb-1">
                <Satellite className="w-4 h-4 text-[#00E5FF]" />
                <span>{language === 'en' ? 'Current Conditions • Compact NASA Telemetry' : 'বর্তমান অবস্থা • নাসার উপগ্রহ পরিমাপ'}</span>
              </div>
              <h2 className="text-2xl font-black text-white">
                {language === 'en' ? 'Real-Time Earth Observation Footprint' : 'মাঠ পর্যায়ের উপগ্রহ তথ্য পর্যবেক্ষণ'}
              </h2>
            </div>
            <p className="text-xs text-[#8FA3B8]">
              {language === 'en' ? 'Updated daily via NASA atmospheric & orbital passes' : 'নাসার উপগ্রহ থেকে দৈনিক হালনাগাদকৃত'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* NASA POWER CARD (dark telemetry card) */}
            <div className="bg-[#0B1626] text-white rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
                    <strong className="font-extrabold text-sm text-white">NASA POWER</strong>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                    Atmospheric
                  </span>
                </div>

                {/* Rainfall */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-[#8FA3B8] mb-1">
                    <span className="flex items-center gap-1">
                      <span>🌧</span>
                      <span>{language === 'en' ? 'Rainfall' : 'বৃষ্টিপাত'}</span>
                    </span>
                    <span className="font-mono text-[#FF5C5C] font-bold">
                      {power.rainfallAnomalyPct > 0 ? `+${power.rainfallAnomalyPct}%` : `${power.rainfallAnomalyPct}%`}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {power.rainfallMm} <span className="text-xs font-medium text-[#8FA3B8]">mm / 30-day</span>
                  </div>
                  <span className="text-[11px] text-[#FF5C5C] font-semibold block mt-0.5">
                    {language === 'en' ? 'Moderate rainfall deficit vs historical' : 'স্বাভাবিকের তুলনায় কম বৃষ্টিপাত'}
                  </span>
                </div>

                {/* Temperature & Humidity */}
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[#8FA3B8] block text-[11px] flex items-center gap-1">
                      <span>🌡</span>
                      <span>{language === 'en' ? 'Temperature' : 'তাপমাত্রা'}</span>
                    </span>
                    <span className="text-lg font-black text-white font-mono">{power.tempC}°C</span>
                    <span className="block text-[10px] text-[#8FA3B8]">2m Mean air</span>
                  </div>
                  <div>
                    <span className="text-[#8FA3B8] block text-[11px] flex items-center gap-1">
                      <span>💧</span>
                      <span>{language === 'en' ? 'Humidity' : 'আর্দ্রতা'}</span>
                    </span>
                    <span className="text-lg font-black text-white font-mono">{power.humidityPct}%</span>
                    <span className="block text-[10px] text-[#8FA3B8]">Relative moisture</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8FA3B8] font-mono">
                <span>Solar Radiation: {power.radiationMj} MJ/m²</span>
                <span>Spatial: ~50km</span>
              </div>
            </div>

            {/* NASA SMAP CARD (dark telemetry card) */}
            <div className="bg-[#0B1626] text-white rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#00E5FF]" />
                    <strong className="font-extrabold text-sm text-white">NASA SMAP</strong>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                    Subsurface
                  </span>
                </div>

                {/* Soil Moisture */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-[#8FA3B8] mb-1">
                    <span className="flex items-center gap-1">
                      <span>💧</span>
                      <span>{language === 'en' ? 'Soil Moisture' : 'মাটির আর্দ্রতা'}</span>
                    </span>
                    <span className="font-bold text-[#FF5C5C] font-mono">
                      {language === 'en' ? smap.statusEn : smap.statusBn}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {smap.surfaceMoisture} <span className="text-xs font-medium text-[#8FA3B8]">m³/m³ (0-5cm)</span>
                  </div>

                  {/* Level Gauge Bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                    <div
                      className="bg-[#00E5FF] h-full rounded-full"
                      style={{ width: `${smap.levelPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-[#8FA3B8] mt-1 font-mono">
                    <span>Deficit (&lt;0.15)</span>
                    <span>Preferred (0.22-0.30)</span>
                    <span>Surplus</span>
                  </div>
                </div>

                {/* Agronomic status note */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8FA3B8]">
                  <strong className="block text-[11px] text-white mb-0.5">
                    {language === 'en' ? 'Agronomic Readiness:' : 'জমির রস অবস্থা:'}
                  </strong>
                  {language === 'en'
                    ? 'Sub-surface moisture is below preferred range for flood crops; ideal for tap-root legumes.'
                    : 'বোরো ধানের জন্য আর্দ্রতা কম, কিন্তু মসুর ও ডাল ফসলের জন্য শিকড় বিস্তারে দারুণ উপযোগী।'}
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8FA3B8] font-mono">
                <span>Radiometer L-Band</span>
                <span>Spatial: ~9km</span>
              </div>
            </div>

            {/* NASA MODIS CARD (dark telemetry card) */}
            <div className="bg-[#0B1626] text-white rounded-2xl p-5 border border-white/10 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#B8FF3D]" />
                    <strong className="font-extrabold text-sm text-white">NASA MODIS</strong>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30">
                    Biosphere
                  </span>
                </div>

                {/* NDVI Vegetation Index */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-[#8FA3B8] mb-1">
                    <span className="flex items-center gap-1">
                      <span>🌱</span>
                      <span>{language === 'en' ? 'Vegetation Health (NDVI)' : 'উদ্ভিদ সজীবতা সূচক'}</span>
                    </span>
                    <span className="font-bold text-[#B8FF3D] font-mono">
                      {language === 'en' ? modis.ndviStatusEn : modis.ndviStatusBn}
                    </span>
                  </div>
                  <div className="text-2xl font-black text-white font-mono">
                    {modis.ndvi} <span className="text-xs font-medium text-[#8FA3B8]">/ 1.0 NDVI</span>
                  </div>
                  <span className="text-[11px] text-[#B8FF3D] font-semibold block mt-0.5">
                    {language === 'en' ? 'Canopy reflection indicates healthy stand' : 'মাঠে ফসলের সবুজ বিস্তার স্বাভাবিক'}
                  </span>
                </div>

                {/* Land Surface Temp */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#8FA3B8]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#8FA3B8] flex items-center gap-1">
                      <span>🌡</span>
                      <span>{language === 'en' ? 'Land Surface Temp' : 'ভূপৃষ্ঠের তাপমাত্রা'}</span>
                    </span>
                    <span className="font-black text-white font-mono">{modis.landSurfaceTempC}°C</span>
                  </div>
                  <span className="block text-[10px] text-[#8FA3B8] mt-1">
                    {language === 'en' ? 'Thermal band indicates safe canopy temperature' : 'তাপপ্রবাহের ক্ষতি নেই'}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-2.5 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8FA3B8] font-mono">
                <span>Terra/Aqua Satellite</span>
                <span>Spatial: 250m</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: CLIMATE SHIFT — "How is my farming environment changing?" */}
        <section className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-2">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#00E5FF] block mb-1">
                {language === 'en' ? 'Climate Shift Analysis' : 'জলবায়ুর রূপান্তর নিরীক্ষা'}
              </span>
              <h3 className="text-2xl font-extrabold text-white">
                {language === 'en' ? 'How is my farming environment changing?' : 'আমার এলাকার কৃষি পরিবেশ কীভাবে বদলে যাচ্ছে?'}
              </h3>
            </div>
            <p className="text-xs text-[#8FA3B8] max-w-sm">
              {language === 'en'
                ? 'Comparing 30-year NASA historical baselines against the last 5 years in your district.'
                : 'গত ৩০ বছরের উপগ্রহ গড়ের সাথে সাম্প্রতিক ৫ বছরের তুলনামূলক চিত্র।'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
              <span className="text-xs text-[#8FA3B8] block mb-1">
                {language === 'en' ? 'Pre-Monsoon Rainfall' : 'প্রাক-বর্ষা বৃষ্টিপাত'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FF5C5C] font-mono">-24%</span>
                <TrendingDown className="w-4 h-4 text-[#FF5C5C]" />
              </div>
              <p className="text-[11px] text-[#8FA3B8] mt-1">
                {language === 'en' ? 'Winter dry spells are lasting 18 days longer' : 'শীতকালীন খরা ১৮ দিন দীর্ঘায়িত হচ্ছে'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
              <span className="text-xs text-[#8FA3B8] block mb-1">
                {language === 'en' ? 'Mean Rabi Temperature' : 'রবি মৌসুমের গড় তাপমাত্রা'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FF5C5C] font-mono">+1.2°C</span>
                <TrendingUp className="w-4 h-4 text-[#FF5C5C]" />
              </div>
              <p className="text-[11px] text-[#8FA3B8] mt-1">
                {language === 'en' ? 'Warm nights affect wheat grain filling' : 'রাতের তাপমাত্রা বৃদ্ধিতে গমের দানা হালকা হয়'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
              <span className="text-xs text-[#8FA3B8] block mb-1">
                {language === 'en' ? 'Groundwater Extraction' : 'সেচের পানির স্তরের অবনমন'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FF5C5C] font-mono">-3.4m</span>
                <TrendingDown className="w-4 h-4 text-[#FF5C5C]" />
              </div>
              <p className="text-[11px] text-[#8FA3B8] mt-1">
                {language === 'en' ? 'Pumping costs have risen by 32% since 2018' : 'ডিজেল ও বিদ্যুৎ খরচ ৩২% বৃদ্ধি পেয়েছে'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
              <span className="text-xs text-[#8FA3B8] block mb-1">
                {language === 'en' ? 'Soil Organic Carbon' : 'মাটির জৈব পদার্থ'}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#FF5C5C] font-mono">0.82%</span>
                <span className="text-xs text-[#FF5C5C] font-semibold">(Low)</span>
              </div>
              <p className="text-[11px] text-[#8FA3B8] mt-1">
                {language === 'en' ? 'Requires pulse rotation to rebuild nitrogen' : 'উর্বরতা ফেরাতে ডাল শস্যের আবর্তন জরুরি'}
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 4: CROP SUITABILITY (10 Crops rule-based evaluation) */}
        <CropRecommendation
          selectedPriority={selectedPriority}
          language={language}
          onExplainCrop={(crop) => setExplainCrop(crop)}
        />

        {/* SECTION 5: 3-SEASON CROP ROTATION & FINAL ADVISORY */}
        <SeasonRotation
          selectedDistrict={selectedDistrict}
          selectedPriority={selectedPriority}
          language={language}
          onExplainCrop={(crop) => setExplainCrop(crop)}
        />
      </main>

      {/* 4. Explain Why Modal */}
      <ExplainWhyModal
        crop={explainCrop}
        language={language}
        onClose={() => setExplainCrop(null)}
      />

      {/* 5. Footer */}
      <AppFooter language={language} userName={userName} />
    </div>
  );
};
