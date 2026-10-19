import React, { useState, useEffect, useMemo } from 'react';
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
  Sliders,
  RefreshCw,
  Sun,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  HelpCircle,
  Calculator,
  Info,
  Award,
  ChevronRight,
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
  FarmerAdvisoryCard,
} from '../dashboard';
import { loadDistrict, BUNDLED_RANGPUR, type LoadedData } from '../../lib/data';
import { computeConditions } from '../../lib/conditions';
import { computeFieldShift } from '../../lib/fieldShift';
import { runEngine, type Priority } from '../../lib/engine';
import { SATELLITE_BY_DIVISION } from '../../data/satellite';
import { FieldShiftPanel } from '../landing/FieldShiftSection';
import { getRankedCrops, type TelemetryContext } from '../../lib/cropSuitability';

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

const mapPriority = (p: FarmerPriorityId): Priority => {
  switch (p) {
    case 'save_water':
      return 'water';
    case 'improve_soil':
      return 'soil';
    case 'lower_cost':
    case 'maximize_profit':
      return 'cost';
    case 'reduce_risk':
    case 'maximize_yield':
    default:
      return 'risk';
  }
};

type DashboardTab = 'overview' | 'conditions' | 'crops' | 'shift' | 'explain';

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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [explainCrop, setExplainCrop] = useState<CropData | null>(null);

  const district = getDistrictProfile(selectedDistrict);
  const upazilaName = getUpazilaName(selectedDistrict, selectedUpazila, language);
  const districtName = language === 'en' ? district.nameEn : district.nameBn;

  // NASA POWER & Open-Meteo 3-level safety net (Live -> Cache -> Bundled)
  const [loaded, setLoaded] = useState<LoadedData>({
    data: BUNDLED_RANGPUR,
    mode: 'bundled',
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoadingData(true);
    loadDistrict(selectedDistrict)
      .then((res) => {
        if (active) {
          setLoaded(res);
          setIsLoadingData(false);
        }
      })
      .catch(() => {
        if (active) setIsLoadingData(false);
      });
    return () => {
      active = false;
    };
  }, [selectedDistrict]);

  // Derived baseline conditions & climate shift from real NASA POWER records
  const conditions = useMemo(
    () => computeConditions(loaded.data.daily, loaded.data.lat),
    [loaded.data.daily, loaded.data.lat]
  );

  const fieldShift = useMemo(
    () => computeFieldShift(loaded.data.monthly),
    [loaded.data.monthly]
  );

  // Satellite division context (SMAP & MODIS)
  const sat = SATELLITE_BY_DIVISION[district.division] ?? SATELLITE_BY_DIVISION['Rangpur'];

  // What-If Environmental Simulator Controls
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [simSoil, setSimSoil] = useState<number>(sat.soil);
  const [simRain, setSimRain] = useState<number>(Math.round(conditions.rain30));
  const [simMaxTemp, setSimMaxTemp] = useState<number>(Math.round(conditions.tMax30));

  // Sync simulation sliders when base district data updates (if not actively simulating)
  useEffect(() => {
    if (!whatIfActive) {
      setSimSoil(sat.soil);
      setSimRain(Math.round(conditions.rain30));
      setSimMaxTemp(Math.round(conditions.tMax30));
    }
  }, [sat.soil, conditions.rain30, conditions.tMax30, whatIfActive]);

  // Active telemetry driving the scoring engine
  const activeSoil = whatIfActive ? simSoil : sat.soil;
  const activeRain = whatIfActive ? simRain : conditions.rain30;
  const activeMaxTemp = whatIfActive ? simMaxTemp : conditions.tMax30;
  const activeWaterBalance = activeRain - conditions.et0Total;

  const telemetry: TelemetryContext = useMemo(
    () => ({
      rainfall30d: activeRain,
      soilMoisture: activeSoil,
      maxTemp: activeMaxTemp,
      waterBalance: activeWaterBalance,
    }),
    [activeRain, activeSoil, activeMaxTemp, activeWaterBalance]
  );

  // Pure mathematical rule engine execution
  const engineResult = useMemo(
    () =>
      runEngine({
        conditions: {
          ...conditions,
          rain30: activeRain,
          tMax30: activeMaxTemp,
          waterBalance: activeWaterBalance,
        },
        soil: activeSoil,
        shift: fieldShift,
        forecast: loaded.data.forecast,
        priority: mapPriority(selectedPriority),
        today: new Date(),
      }),
    [conditions, activeRain, activeMaxTemp, activeWaterBalance, activeSoil, fieldShift, loaded.data.forecast, selectedPriority]
  );

  // Ranked crops for Crop Plan & Advisory Card
  const rankedCrops = useMemo(
    () => getRankedCrops(selectedPriority, secondaryPriority, 'All', telemetry),
    [selectedPriority, secondaryPriority, telemetry]
  );

  // Water stressed threshold
  const isWaterStressed = activeSoil < 0.20 || activeRain < 50 || activeWaterBalance < -50;

  const DASHBOARD_TABS = [
    { id: 'overview' as const, en: 'Overview', bn: 'সারসংক্ষেপ' },
    { id: 'conditions' as const, en: 'Field Conditions', bn: 'মাঠের পরিস্থিতি' },
    { id: 'crops' as const, en: 'Crop Plan', bn: 'ফসলের পরিকল্পনা' },
    { id: 'shift' as const, en: 'Climate Shift', bn: 'জলবায়ু রূপান্তর' },
    { id: 'explain' as const, en: 'Explain Why', bn: 'স্বচ্ছ নিয়ম ও ব্যাখ্যা' },
  ];

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* 1. TOP BAR */}
      <header className="sticky top-0 z-40 bg-[#050B14]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          <BrandLogo badge={language === 'en' ? 'Field Advisory' : 'কৃষি উপদেষ্টা'} />

          {/* Simple Clean Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 p-1 bg-[#0B1626] rounded-xl border border-white/10 text-xs font-semibold">
            {DASHBOARD_TABS.map((tab) => (
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

        {/* Mobile Horizontal Navigation Tabs */}
        <div className="flex md:hidden overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden px-4 py-2 border-t border-white/5 bg-[#0B1626]/80 gap-1.5 text-xs font-semibold">
          {DASHBOARD_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                activeTab === tab.id
                  ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-sm'
                  : 'text-[#8FA3B8] bg-white/5'
              }`}
            >
              {language === 'en' ? tab.en : tab.bn}
            </button>
          ))}
        </div>
      </header>

      {/* 2. SECTION 3: SHORT-TERM RISK ALERT / FIELD ACTION WEATHER ADVISORY */}
      <ShortTermRiskAlert
        language={language}
        districtId={selectedDistrict}
        upazilaName={upazilaName}
        lat={fieldLat}
        lng={fieldLng}
        soilMoisture={activeSoil}
        priority={selectedPriority}
      />

      {/* 3. SECTION 1: WELCOME AND SELECTED FIELD */}
      <section className="border-b border-white/10 bg-[#050B14] py-10 sm:py-14 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          {/* Eyebrow greeting & metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-semibold mb-3">
            <span className="text-[#B8FF3D] uppercase tracking-wider">
              {language === 'en' ? 'Your Field, Your Next Decision' : 'আপনার জমি, আপনার পরবর্তী সিদ্ধান্ত'}
            </span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-[#00E5FF]">{upazilaName}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-white/80">{districtName}</span>
            <span aria-hidden="true" className="text-white/30">·</span>
            <span className="text-[#8FA3B8]">{fieldLat.toFixed(4)}° N · {fieldLng.toFixed(4)}° E</span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight leading-tight">
                {upazilaName}, {districtName}, {language === 'en' ? 'Bangladesh' : 'বাংলাদেশ'}
              </h1>
              <p className="text-sm sm:text-base text-[#8FA3B8] mt-2 max-w-2xl">
                {language === 'en'
                  ? `${district.agroZoneEn} · ${district.soilTypeEn}`
                  : `${district.agroZoneBn} · ${district.soilTypeBn}`}
              </p>

              {/* Data Provenance Badge */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-white/5 border border-white/10 text-slate-300">
                  <span className={`w-2 h-2 rounded-full ${whatIfActive ? 'bg-purple-400 animate-pulse' : loaded.mode === 'live' ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'}`} />
                  <span>
                    {whatIfActive
                      ? (language === 'en' ? 'What-If Simulation Active' : 'সিমুলেশন চলছে')
                      : loaded.mode === 'live'
                      ? (language === 'en' ? 'NASA POWER & SMAP · Live Stream' : 'নাসা পাওয়ার ও স্ম্যাপ · লাইভ উপাত্ত')
                      : (language === 'en' ? 'NASA POWER & SMAP · District Cache' : 'নাসা পাওয়ার ও স্ম্যাপ · জেলা ক্যাশ')}
                  </span>
                </span>
                <span className="text-xs text-[#8FA3B8] font-mono">
                  {language === 'en' ? 'Updated' : 'আপডেট'}: {loaded.data.fetchedAt.split('T')[0]}
                </span>
              </div>
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
                  {language === 'en' ? 'Change' : 'পরিবর্তন'}
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
                    ? `Pre-monsoon 30-day precipitation is ${activeRain.toFixed(0)} mm (${conditions.waterBalance < -50 ? 'deficit' : 'balanced'}). Root-zone soil moisture is ${activeSoil.toFixed(2)} m³/m³ (${activeSoil < 0.20 ? 'Water Deficit' : 'Optimal'}). High-irrigation flood crops face heavy diesel pumping overhead.`
                    : `৩০ দিনের বৃষ্টিপাত ${activeRain.toFixed(0)} মিমি (${conditions.waterBalance < -50 ? 'পানির ঘাটতি' : 'পরিমিত'})। মাটির মূলস্তরের আর্দ্রতা ${activeSoil.toFixed(2)} m³/m³। অতিরিক্ত সেচের ধান চাষে বাড়তি ব্যয়ের ঝুঁকি রয়েছে।`}
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

          {/* WHAT-IF ENVIRONMENTAL SIMULATOR */}
          <div className="mt-8 p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-1">
                  <Sliders className="w-4 h-4 text-[#B8FF3D]" />
                  <span>{language === 'en' ? 'What-If Environmental Simulator' : 'পরিবেশগত খরা ও বৃষ্টি সিমুলেটর'}</span>
                  {whatIfActive && (
                    <span className="px-2 py-0.5 rounded-full bg-[#B8FF3D]/20 text-[#B8FF3D] text-[10px] uppercase font-bold border border-[#B8FF3D]/40">
                      {language === 'en' ? 'Active' : 'সক্রিয়'}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#8FA3B8]">
                  {language === 'en'
                    ? 'Adjust NASA environmental variables to observe real-time score penalties, bonuses, and rotation adjustments in the explainable rule engine.'
                    : 'খরা বা বৃষ্টিপাতের পরিমাণ পরিবর্তন করে দেখুন নিয়ম ইঞ্জিন কীভাবে রিয়েল-টাইমে ফসলের স্কোর ও আবর্তন পরিবর্তন করে।'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setWhatIfActive(!whatIfActive)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    whatIfActive
                      ? 'bg-[#B8FF3D] text-[#050B14] shadow-md shadow-[#B8FF3D]/20'
                      : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                  }`}
                >
                  {whatIfActive
                    ? (language === 'en' ? 'Simulation Active (Click to Exit)' : 'সিমুলেশন চলছে (বন্ধ করুন)')
                    : (language === 'en' ? 'Enable Simulation Controls' : 'সিমুলেশন চালু করুন')}
                </button>
                {whatIfActive && (
                  <button
                    onClick={() => {
                      setWhatIfActive(false);
                      setSimSoil(sat.soil);
                      setSimRain(Math.round(conditions.rain30));
                      setSimMaxTemp(Math.round(conditions.tMax30));
                    }}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#8FA3B8] hover:text-white border border-white/10 transition-colors cursor-pointer"
                    title={language === 'en' ? 'Reset to NASA observations' : 'নাসার তথ্যে ফেরত যান'}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Simulation Sliders & Presets */}
            {whatIfActive && (
              <div className="pt-6 border-t border-white/10 space-y-6 animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Slider 1: Soil Moisture */}
                  <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#8FA3B8]">{language === 'en' ? 'SMAP Soil Moisture' : 'মাটির আর্দ্রতা'}</span>
                      <span className="text-[#00E5FF] font-bold text-sm">{simSoil.toFixed(2)} m³/m³</span>
                    </div>
                    <input
                      type="range"
                      min="0.10"
                      max="0.35"
                      step="0.01"
                      value={simSoil}
                      onChange={(e) => setSimSoil(parseFloat(e.target.value))}
                      className="w-full accent-[#00E5FF] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1.5">
                      <span className={simSoil < 0.15 ? 'text-[#FF5C5C] font-bold' : ''}>Drought (&lt;0.15)</span>
                      <span className={simSoil >= 0.25 && simSoil <= 0.30 ? 'text-[#B8FF3D] font-bold' : ''}>Optimal (0.25-0.30)</span>
                      <span>Surplus (&gt;0.32)</span>
                    </div>
                  </div>

                  {/* Slider 2: 30-Day Rainfall */}
                  <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#8FA3B8]">{language === 'en' ? '30-Day Rainfall' : '৩০ দিনের বৃষ্টি'}</span>
                      <span className="text-[#B8FF3D] font-bold text-sm">{simRain} mm</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="150"
                      step="5"
                      value={simRain}
                      onChange={(e) => setSimRain(parseInt(e.target.value))}
                      className="w-full accent-[#B8FF3D] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1.5">
                      <span className={simRain < 50 ? 'text-[#FF5C5C] font-bold' : ''}>Low (&lt;50mm)</span>
                      <span>Normal (50–100mm)</span>
                      <span>High (&gt;120mm)</span>
                    </div>
                  </div>

                  {/* Slider 3: Max Temperature */}
                  <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10">
                    <div className="flex items-center justify-between text-xs font-mono mb-2">
                      <span className="text-[#8FA3B8]">{language === 'en' ? 'Daily Max Temp' : 'সর্বোচ্চ তাপমাত্রা'}</span>
                      <span className="text-[#FF5C5C] font-bold text-sm">{simMaxTemp.toFixed(1)}°C</span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="42"
                      step="0.5"
                      value={simMaxTemp}
                      onChange={(e) => setSimMaxTemp(parseFloat(e.target.value))}
                      className="w-full accent-[#FF5C5C] cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1.5">
                      <span>Mild (&lt;28°C)</span>
                      <span>Standard</span>
                      <span className={simMaxTemp > 35 ? 'text-[#FF5C5C] font-bold' : ''}>Heat Stress (&gt;35°C)</span>
                    </div>
                  </div>
                </div>

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <span className="text-[11px] font-mono text-[#8FA3B8] mr-2">
                    {language === 'en' ? 'Quick Test Scenarios:' : 'ঝটপট দৃশ্যপট:'}
                  </span>
                  <button
                    onClick={() => {
                      setSimSoil(0.12);
                      setSimRain(25);
                      setSimMaxTemp(34);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    🏜️ {language === 'en' ? 'Severe Drought' : 'তীব্র খরা (<৫০ মিমি, <০.১৫)'}
                  </button>
                  <button
                    onClick={() => {
                      setSimSoil(0.28);
                      setSimRain(70);
                      setSimMaxTemp(27);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    🌱 {language === 'en' ? 'Optimal Sowing Window' : 'অনুকূল বপন (০.২৮ আর্দ্রতা)'}
                  </button>
                  <button
                    onClick={() => {
                      setSimSoil(0.16);
                      setSimRain(35);
                      setSimMaxTemp(38);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    🌡️ {language === 'en' ? 'Extreme Heatwave' : 'তীব্র তাপপ্রবাহ (>৩৫° সে.)'}
                  </button>
                  <button
                    onClick={() => {
                      setSimSoil(sat.soil);
                      setSimRain(Math.round(conditions.rain30));
                      setSimMaxTemp(Math.round(conditions.tMax30));
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#B8FF3D] transition-colors cursor-pointer ml-auto"
                  >
                    🔄 {language === 'en' ? 'Reset to NASA' : 'নাসার মূল মান'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. MAIN DASHBOARD CONTENT AREA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full space-y-16">
        {/* TAB 1: OVERVIEW & CONDITIONS (SECTION 2: CURRENT FIELD CONDITIONS) */}
        {(activeTab === 'overview' || activeTab === 'conditions') && (
          <section id="conditions-section">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-4">
              <span>OBSERVED TELEMETRY</span>
              <span aria-hidden="true">·</span>
              <span>
                {whatIfActive
                  ? (language === 'en' ? 'Active What-If Environmental Simulation' : 'সক্রিয় পরিবেশগত সিমুলেশন')
                  : loaded.mode === 'live'
                  ? (language === 'en' ? `Live NASA POWER + Open-Meteo for ${districtName}` : `${districtName}-এর লাইভ নাসা ও ওপেন-মেটিও উপাত্ত`)
                  : (language === 'en' ? `NASA POWER Grid Cache for ${districtName}` : `${districtName}-এর অফলাইন নাসা গ্রিড ক্যাশ`)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. RAINFALL CARD */}
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <DataTileStatusBadge
                      sourceName={whatIfActive ? 'What-If Model' : 'NASA POWER'}
                      status={whatIfActive ? 'simulated' : loaded.mode === 'live' ? 'live' : 'cached'}
                      date={loaded.data.fetchedAt.split('T')[0]}
                      language={language}
                    />
                    <span className={`font-mono text-xs font-semibold ${activeWaterBalance < -50 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}`}>
                      {activeWaterBalance < 0 ? `${Math.round(activeWaterBalance)} mm Net` : `+${Math.round(activeWaterBalance)} mm Net`}
                    </span>
                  </div>

                  <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                    {Math.round(activeRain)} <span className="text-base font-normal text-[#8FA3B8]">mm</span>
                  </div>

                  <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                    {language === 'en'
                      ? `Cumulative 30-day precipitation. Net balance vs crop ET₀ demand is ${Math.round(activeWaterBalance)} mm.`
                      : `৩০ দিনের মোট বৃষ্টিপাত। বাষ্পীভবন চাহিদার তুলনায় নিট পানির অবস্থা ${Math.round(activeWaterBalance)} মিমি।`}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                  <span>Hargreaves ET₀ Demand</span>
                  <span className="text-white font-bold">{Math.round(conditions.et0Total)} mm ({conditions.et0.toFixed(1)} mm/d)</span>
                </div>
              </div>

              {/* 2. SOIL MOISTURE CARD */}
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <DataTileStatusBadge
                      sourceName={whatIfActive ? 'Simulated SMAP' : 'NASA SMAP'}
                      status={whatIfActive ? 'simulated' : 'snapshot'}
                      date={whatIfActive ? 'Simulated' : sat.date}
                      language={language}
                    />
                    <span className={`font-mono text-xs font-semibold ${
                      activeSoil < 0.15 ? 'text-[#FF5C5C]' : activeSoil >= 0.25 && activeSoil <= 0.30 ? 'text-[#B8FF3D]' : 'text-[#00E5FF]'
                    }`}>
                      {activeSoil < 0.15
                        ? (language === 'en' ? 'Moisture Deficit' : 'আর্দ্রতা ঘাটতি')
                        : activeSoil >= 0.25 && activeSoil <= 0.30
                        ? (language === 'en' ? 'Optimal Sowing' : 'বপন উপযোগী')
                        : (language === 'en' ? 'Adequate' : 'পর্যাপ্ত')}
                    </span>
                  </div>

                  <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                    {activeSoil.toFixed(2)} <span className="text-base font-normal text-[#8FA3B8]">m³/m³</span>
                  </div>

                  {/* Gauge Bar */}
                  <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        activeSoil < 0.15 ? 'bg-[#FF5C5C]' : activeSoil >= 0.25 && activeSoil <= 0.30 ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, (activeSoil / 0.40) * 100))}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                    <span className={activeSoil < 0.15 ? 'text-[#FF5C5C] font-bold' : ''}>Deficit (&lt;0.15)</span>
                    <span className={activeSoil >= 0.25 && activeSoil <= 0.30 ? 'text-[#B8FF3D] font-bold' : ''}>Target (0.25–0.30)</span>
                    <span>Surplus</span>
                  </div>

                  <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                    {language === 'en'
                      ? '0–5 cm rootzone layer measured by L-band radiometer. Evaluates seed germination and shallow vs deep taproot crops.'
                      : '০–৫ সেমি শিকড় স্তরের আর্দ্রতা। বীজ গজানো ও ফসলের শিকড় প্রসারণের সক্ষমতা নির্দেশ করে।'}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                  <span>Air Humidity (RH2M)</span>
                  <span className="text-white font-semibold">{Math.round(conditions.rh)}% RH</span>
                </div>
              </div>

              {/* 3. TEMPERATURE & BIOSPHERE CARD */}
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                    <DataTileStatusBadge
                      sourceName="NASA MODIS / POWER"
                      status={whatIfActive ? 'simulated' : 'snapshot'}
                      date={whatIfActive ? 'Simulated' : sat.date}
                      language={language}
                    />
                    <span className={`font-mono text-xs font-semibold ${activeMaxTemp > 35 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}`}>
                      {activeMaxTemp > 35
                        ? (language === 'en' ? 'Heat Stress (>35°C)' : 'তাপপ্রবাহ সতর্কতা (>৩৫° সে.)')
                        : (language === 'en' ? 'Safe Growth Range' : 'অনুকূল তাপমাত্রা')}
                    </span>
                  </div>

                  <div className="font-mono text-3xl sm:text-4xl font-bold text-white mb-1">
                    {activeMaxTemp.toFixed(1)}°C <span className="text-base font-normal text-[#8FA3B8]">Max ({conditions.tMaxAvg.toFixed(1)}° Mean)</span>
                  </div>

                  <p className="text-xs text-[#8FA3B8] leading-relaxed mt-3">
                    {language === 'en'
                      ? `Vegetation index is ${sat.ndvi} NDVI. Daytime thermal reading is ${sat.lst}°C, monitored for flowering heat sensitivity.`
                      : `উদ্ভিদ সজীবতা সূচক ${sat.ndvi} NDVI। ভূ-পৃষ্ঠের তাপমাত্রা ${sat.lst}°C, ফুল ফোটা ও দানা বাঁধার জন্য পর্যবেক্ষণাধীন।`}
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
                  <span>MODIS Surface Temp</span>
                  <span className="text-white font-semibold">{sat.lst}°C</span>
                </div>
              </div>
            </div>

            {/* HONEST SPATIAL RESOLUTION DISCLAIMER */}
            <div className="mt-4 p-4 rounded-2xl bg-[#050B14] border border-white/10 flex items-start gap-3 text-xs text-[#8FA3B8]">
              <Info className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {language === 'en'
                  ? `Spatial resolution note: NASA SMAP (9 km), GPM/POWER (10 km to 0.5°), and MODIS (250m–1km) observations represent regional agro-climatic conditions across ${upazilaName}, providing broad environmental indicators rather than direct in-situ sensor probes buried in this specific field.`
                  : `স্থানিক সূক্ষ্মতা বিজ্ঞপ্তি: নাসা স্ম্যাপ (৯ কিমি), জিপিএম/পাওয়ার (১০ কিমি) এবং মডিস (২৫০মি-১কিমি) উপাত্তসমূহ ${upazilaName}-এর পুরো অঞ্চলের পরিবেশগত নির্দেশক, কোনো নির্দিষ্ট জমির গভীরে সরাসরি বসানো সেন্সরের একক পরিমাপ নয়।`}
              </p>
            </div>
          </section>
        )}

        {/* WHY THIS MATTERS: Visual agronomic explanation (In Conditions & Overview) */}
        {(activeTab === 'overview' || activeTab === 'conditions') && (
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
        )}

        {/* TAB: CLIMATE SHIFT (SECTION 4: CLIMATE SHIFT) */}
        {(activeTab === 'overview' || activeTab === 'shift') && (
          <section id="climate-shift-section" className="p-8 sm:p-10 rounded-3xl bg-[#0B1626] border border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold block mb-1">
                  CLIMATE SHIFT IN {districtName.toUpperCase()}
                </span>
                <h3 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? 'Long-Term Decadal Shift (Field Shift)' : 'দীর্ঘমেয়াদী জলবায়ু রূপান্তর (ফিল্ড শিফট)'}
                </h3>
              </div>
              <div className="text-xs text-[#8FA3B8] font-mono">
                {language === 'en' ? 'NASA POWER 2001–2010 vs Latest 10-Year Decadal Shift' : 'নাসা পাওয়ার ২০০১-২০১০ বনাম সাম্প্রতিক ১০ বছরের তুলনা'}
              </div>
            </div>

            <FieldShiftPanel shift={fieldShift} />
          </section>
        )}

        {/* TAB: CROPS (SECTION 5: CROP SUITABILITY) */}
        {(activeTab === 'overview' || activeTab === 'crops') && (
          <CropRecommendation
            selectedPriority={selectedPriority}
            secondaryPriority={secondaryPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
            telemetry={telemetry}
          />
        )}

        {/* TAB: CROPS / ROTATION (SECTION 6: THREE-SEASON ROTATION) */}
        {(activeTab === 'overview' || activeTab === 'crops') && (
          <SeasonRotation
            selectedDistrict={selectedDistrict}
            selectedPriority={selectedPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
            engineResult={engineResult}
            telemetry={telemetry}
          />
        )}

        {/* SECTION 8: DEDICATED FARMER ADVISORY CARD */}
        {(activeTab === 'overview' || activeTab === 'crops') && (
          <section id="advisory-card-section">
            <FarmerAdvisoryCard
              districtName={districtName}
              upazilaName={upazilaName}
              fieldLat={fieldLat}
              fieldLng={fieldLng}
              selectedPriority={selectedPriority}
              secondaryPriority={secondaryPriority}
              language={language}
              telemetry={telemetry}
              engineResult={engineResult}
              topCrops={rankedCrops.slice(0, 3)}
              onExplainCrop={(crop) => setExplainCrop(crop)}
            />
          </section>
        )}

        {/* TAB: EXPLAIN WHY (SECTION 7: EXPLAIN WHY COMPREHENSIVE OVERVIEW) */}
        {(activeTab === 'explain') && (
          <section id="explain-tab-section" className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="p-8 rounded-3xl bg-[#0B1626] border border-white/10">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#00E5FF] font-mono font-semibold mb-2">
                <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                <span>{language === 'en' ? 'Core Scientific Methodology' : 'মৌলিক বৈজ্ঞানিক নীতিমালা'}</span>
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mb-2">
                {language === 'en' ? 'Transparent, 100% Rule-Based Decision Architecture' : 'স্বচ্ছ, শতভাগ নিয়ম-ভিত্তিক সিদ্ধান্ত কাঠামো'}
              </h2>
              <p className="text-sm text-[#8FA3B8] max-w-3xl leading-relaxed">
                {language === 'en'
                  ? 'AgriOrbit deliberately avoids "black-box" machine learning. Every recommendation stems from transparent, deterministic agronomic rules combining NASA Earth observations, BARI crop standards, and farmer priorities.'
                  : 'এগ্রিঅরবিট কোনো ব্ল্যাক-বক্স মেশিন লার্নিং ব্যবহার করে না। প্রতিটি সুপারিশ নাসা উপগ্রহ পর্যবেক্ষণ, বিএআরআই কৃষি গবেষণা মানদণ্ড এবং কৃষকের নিজস্ব লক্ষ্যের ভিত্তিতে তৈরি।'}
              </p>
            </div>

            {/* The 5 Deterministic Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
                <span className="font-mono text-xs text-[#B8FF3D] font-bold block uppercase">
                  Rule 1 · Moisture Deficit Rule
                </span>
                <h4 className="text-base font-bold text-white">
                  {language === 'en' ? '30-Day Rain < 50 mm AND Soil < 0.15 m³/m³' : '৩০ দিনের বৃষ্টি < ৫০ মিমি এবং মাটির রস < ০.১৫'}
                </h4>
                <p className="text-xs text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? 'Penalizes high-water flood-irrigation crops (such as winter Boro rice) by -20 points, elevating drought-resilient legumes and taproot pulses.'
                    : 'অতিরিক্ত পানিগ্রাহী বোরো ধানের স্কোর ২০ পয়েন্ট কেটে দেয় এবং খরা-সহনশীল মসুর ও সরিষার অবস্থান শীর্ষে নিয়ে আসে।'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
                <span className="font-mono text-xs text-[#00E5FF] font-bold block uppercase">
                  Rule 2 · Optimal Sowing Window Rule
                </span>
                <h4 className="text-base font-bold text-white">
                  {language === 'en' ? 'SMAP Soil Moisture 0.25 to 0.30 m³/m³' : 'মাটির আর্দ্রতা ০.২৫ থেকে ০.৩০ m³/m³'}
                </h4>
                <p className="text-xs text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? 'Awards a +5 point bonus and an "Optimal Sowing Moisture" badge, signaling prime seed germination conditions.'
                    : 'উপযুক্ত আর্দ্রতার জন্য ৫ পয়েন্ট বোনাস দেয় এবং জমিতে বীজ বপনের অনুকূল সময় নির্দেশ করে।'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
                <span className="font-mono text-xs text-[#FF5C5C] font-bold block uppercase">
                  Rule 3 · Thermal Stress Rule
                </span>
                <h4 className="text-base font-bold text-white">
                  {language === 'en' ? 'Daily Max Temperature > 35°C' : 'সর্বোচ্চ তাপমাত্রা > ৩৫° সে.'}
                </h4>
                <p className="text-xs text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? 'Applies heat penalties to terminal-heat-sensitive crops (Wheat and Potato) to avoid flowering blast and yield failure.'
                    : 'ফুল ফোটা ও দানা বাঁধার সময় তাপমাত্রা বেশি থাকলে গম ও আলুর জন্য সতর্কতা জারি করে।'}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
                <span className="font-mono text-xs text-[#B8FF3D] font-bold block uppercase">
                  Rule 4 · Botanical Alternation & Nitrogen Triggers
                </span>
                <h4 className="text-base font-bold text-white">
                  {language === 'en' ? 'Rotation Rule A & Rule B' : 'আবর্তন নীতি ক ও খ'}
                </h4>
                <p className="text-xs text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? 'Rule A prevents repeating identical plant families consecutively. Rule B forces a legume (Mungbean/Lentil) when the soil nutrient trail drops below zero.'
                    : 'পরপর দুই মৌসুমে একই গোত্রের ফসল নিষিদ্ধ করে রোগ দমন করা হয় এবং মাটির নাইট্রোজেন কমে গেলে বাধ্যতামূলক ডাল জাতীয় ফসল অন্তর্ভুক্ত করা হয়।'}
                </p>
              </div>
            </div>

            {/* Quick Link to inspect top crop breakdown */}
            <div className="p-8 rounded-3xl bg-[#0B1626] border border-[#B8FF3D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <h4 className="font-display text-xl font-bold text-white mb-1">
                  {language === 'en' ? `Inspect Score Breakdown: ${rankedCrops[0]?.nameEn}` : `স্কোর গণনা দেখুন: ${rankedCrops[0]?.nameBn}`}
                </h4>
                <p className="text-xs text-[#8FA3B8]">
                  {language === 'en'
                    ? 'Open the full interactive mathematical table showing every point delta from BARI, SMAP, POWER, and your priorities.'
                    : 'নাসার প্রতিটি স্যাটেলাইট উপাত্তের জন্য কীভাবে পয়েন্ট যোগ বা বিয়োগ হয়েছে তার বিশদ টেবিল দেখুন।'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setExplainCrop(rankedCrops[0])}
                className="px-6 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer shrink-0"
              >
                <span>{language === 'en' ? 'Open Mathematical Breakdown' : 'গাণিতিক গণনা দেখুন'}</span>
                <Calculator className="w-4 h-4 text-[#050B14]" />
              </button>
            </div>
          </section>
        )}

        {/* 5. FARMER FEEDBACK LOOP (COMMUNITY VALIDATION) */}
        <FarmerFeedbackLoop
          language={language}
          district={districtName}
          upazila={upazilaName}
          selectedPriority={selectedPriority}
        />
      </main>

      {/* 5. EXPLAIN WHY TRANSPARENCY MODAL */}
      <ExplainWhyModal
        crop={explainCrop}
        selectedPriority={selectedPriority}
        secondaryPriority={secondaryPriority}
        language={language}
        onClose={() => setExplainCrop(null)}
      />

      {/* 6. FOOTER */}
      <AppFooter language={language} userName={userName} />
    </div>
  );
};
