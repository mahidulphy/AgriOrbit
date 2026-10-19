import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Droplets,
  Sprout,
  TrendingUp,
  HelpCircle,
  Sliders,
  MapPin,
  LogOut,
  Menu,
  X,
  Printer,
  Share2,
  Compass,
  ShieldCheck,
  CheckCircle2,
  Calculator,
  Info,
  Award,
  ArrowRight,
  RefreshCw,
  Sun,
  Layers,
  Thermometer,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../../types';
import { getDistrictProfile, getUpazilaName } from '../../lib/location';
import { CropRecommendation } from '../CropRecommendation';
import { SeasonRotation } from '../SeasonRotation';
import { ExplainWhyModal } from '../ExplainWhyModal';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { DataTileStatusBadge } from '../common/DataTileStatusBadge';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const DASHBOARD_NAV_ITEMS = [
    { id: 'overview' as const, en: 'Overview', bn: 'সারসংক্ষেপ', icon: LayoutDashboard },
    { id: 'conditions' as const, en: 'Field Conditions', bn: 'মাঠের পরিস্থিতি', icon: Droplets },
    { id: 'crops' as const, en: 'Crop Plan', bn: 'ফসলের পরিকল্পনা', icon: Sprout },
    { id: 'shift' as const, en: 'Climate Shift', bn: 'জলবায়ু রূপান্তর', icon: TrendingUp },
    { id: 'explain' as const, en: 'Explain Why', bn: 'স্বচ্ছ নিয়ম ও ব্যাখ্যা', icon: HelpCircle },
  ];

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col md:flex-row font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* 1. DEDICATED APPLICATION SIDEBAR (DESKTOP) */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-[#070D18] border-r border-white/10 shrink-0 h-screen sticky top-0 z-30 justify-between">
        <div className="p-5 flex flex-col gap-6 overflow-y-auto">
          {/* App Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#B8FF3D]/20 border border-[#B8FF3D]/40 flex items-center justify-center">
                <Sprout className="w-5 h-5 text-[#B8FF3D]" />
              </div>
              <div>
                <span className="font-display font-bold text-lg text-white tracking-tight block leading-tight">
                  AgriOrbit
                </span>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase font-bold tracking-wider">
                  {language === 'en' ? 'Decision Dashboard' : 'কৃষি ড্যাশবোর্ড'}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Field Context Card */}
          <div className="p-3.5 rounded-2xl bg-[#0B1626] border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3B8]">
              <span className="uppercase">{language === 'en' ? 'Active Field' : 'নির্বাচিত জমি'}</span>
              <button
                onClick={onChangeFieldLocation}
                className="text-[#00E5FF] hover:underline font-bold text-[10px] uppercase cursor-pointer"
              >
                {language === 'en' ? 'Change' : 'পরিবর্তন'}
              </button>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#B8FF3D] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm text-white truncate">
                  {upazilaName}, {districtName.split(' ')[0]}
                </h4>
                <p className="text-[10px] font-mono text-[#8FA3B8]">
                  {fieldLat.toFixed(2)}° N · {fieldLng.toFixed(2)}° E
                </p>
              </div>
            </div>

            {/* Active Priority Chip */}
            <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px]">
              <span className="text-[#8FA3B8] font-mono">{language === 'en' ? 'Priority' : 'লক্ষ্য'}:</span>
              <button
                onClick={onChangePriority}
                className="font-bold text-[#B8FF3D] hover:underline capitalize truncate max-w-[120px] cursor-pointer"
              >
                {selectedPriority.replace('_', ' ')}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#8FA3B8]/60 font-semibold block mb-2">
              {language === 'en' ? 'Navigation' : 'মেনু'}
            </span>
            {DASHBOARD_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#B8FF3D] text-[#050B14] font-bold shadow-md shadow-[#B8FF3D]/20'
                      : 'text-[#8FA3B8] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#050B14]' : 'text-[#8FA3B8]'}`} />
                  <span className="truncate">{language === 'en' ? item.en : item.bn}</span>
                </button>
              );
            })}
          </nav>

          {/* What-If Simulator Quick Trigger in Sidebar */}
          <div className="pt-2">
            <button
              onClick={() => setWhatIfActive(!whatIfActive)}
              className={`w-full p-3 rounded-2xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                whatIfActive
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-md shadow-purple-900/30'
                  : 'bg-[#0B1626] border-white/10 text-[#8FA3B8] hover:text-white hover:border-white/20'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${whatIfActive ? 'text-purple-400' : 'text-[#B8FF3D]'}`} />
                <span className="font-semibold">{language === 'en' ? 'What-If Simulator' : 'সিমুলেটর'}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${whatIfActive ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-[#8FA3B8]'}`}>
                {whatIfActive ? (language === 'en' ? 'Active' : 'চালু') : (language === 'en' ? 'Off' : 'বন্ধ')}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Utilities */}
        <div className="p-4 border-t border-white/10 bg-[#050B14]/80 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
            <button
              onClick={onLogout}
              title={language === 'en' ? 'Exit to Public Website' : 'মূল ওয়েবসাইটে ফিরে যান'}
              className="p-2 rounded-xl bg-white/5 hover:bg-[#FF5C5C]/20 border border-white/10 text-[#8FA3B8] hover:text-[#FF5C5C] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold">{language === 'en' ? 'Exit' : 'প্রস্থান'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE TOP BAR & DRAWER */}
      <header className="md:hidden sticky top-0 z-40 bg-[#070D18]/95 backdrop-blur-md border-b border-white/10 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-white cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
          <span className="font-display font-bold text-base text-white">AgriOrbit</span>
          <span className="text-[10px] font-mono text-[#B8FF3D] uppercase font-bold px-1.5 py-0.5 rounded bg-[#B8FF3D]/10 border border-[#B8FF3D]/30">
            {language === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
          <button
            onClick={onLogout}
            className="p-1.5 rounded-lg bg-white/5 text-[#8FA3B8] hover:text-white border border-white/10 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-72 bg-[#070D18] h-full p-5 flex flex-col justify-between border-r border-white/10">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="font-display font-bold text-lg text-white">AgriOrbit Menu</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#8FA3B8] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Location Context */}
              <div className="p-3 rounded-xl bg-[#0B1626] border border-white/10 text-xs">
                <span className="text-[10px] text-[#8FA3B8] font-mono uppercase block">{language === 'en' ? 'Active Field' : 'নির্বাচিত জমি'}</span>
                <span className="font-bold text-white block mt-0.5">{upazilaName}, {districtName}</span>
                <button
                  onClick={() => { setMobileMenuOpen(false); onChangeFieldLocation(); }}
                  className="text-[11px] text-[#00E5FF] underline mt-1 block"
                >
                  {language === 'en' ? 'Change Location' : 'স্থান পরিবর্তন'}
                </button>
              </div>

              {/* Navigation items */}
              <div className="space-y-1">
                {DASHBOARD_NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleTabClick(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-[#B8FF3D] text-[#050B14] font-bold'
                          : 'text-[#8FA3B8] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{language === 'en' ? item.en : item.bn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-center text-[#FF5C5C]"
            >
              {language === 'en' ? 'Exit to Website' : 'মূল সাইটে প্রস্থান'}
            </button>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Operational Header Bar */}
        <header className="hidden md:flex h-16 border-b border-white/10 bg-[#0B1626]/80 backdrop-blur-md px-6 items-center justify-between shrink-0">
          {/* Breadcrumb & Field Identity */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#8FA3B8]">{language === 'en' ? 'AgriOrbit' : 'এগ্রিঅরবিট'}</span>
            <span className="text-white/30">/</span>
            <span className="text-white font-bold">{upazilaName}, {districtName}</span>
            <span className="text-white/30">/</span>
            <span className="text-[#B8FF3D] capitalize">
              {DASHBOARD_NAV_ITEMS.find((t) => t.id === activeTab)?.[language === 'en' ? 'en' : 'bn']}
            </span>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-3 text-xs">
            {/* Satellite Live Pulse Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#050B14] border border-white/10 text-[11px] font-mono text-slate-300">
              <span className={`w-2 h-2 rounded-full ${whatIfActive ? 'bg-purple-400 animate-pulse' : loaded.mode === 'live' ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'}`} />
              <span>
                {whatIfActive
                  ? (language === 'en' ? 'Simulation Active' : 'সিমুলেশন চলছে')
                  : loaded.mode === 'live'
                  ? (language === 'en' ? 'NASA POWER & SMAP Live' : 'নাসা লাইভ ফিড')
                  : (language === 'en' ? 'NASA POWER Cache' : 'নাসা ক্যাশ')}
              </span>
            </div>

            {/* Coordinates */}
            <span className="text-[#8FA3B8] font-mono text-[11px] hidden lg:inline">
              {fieldLat.toFixed(2)}°N, {fieldLng.toFixed(2)}°E
            </span>

            {/* Quick What-If Toggle */}
            <button
              onClick={() => setWhatIfActive(!whatIfActive)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                whatIfActive
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md shadow-purple-900/30'
                  : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{language === 'en' ? 'Simulator' : 'সিমুলেটর'}</span>
            </button>
          </div>
        </header>

        {/* Urgent Risk Alert Banner (Section 3: Field Action Weather Advisory) */}
        <ShortTermRiskAlert
          language={language}
          districtId={selectedDistrict}
          upazilaName={upazilaName}
          lat={fieldLat}
          lng={fieldLng}
          soilMoisture={activeSoil}
          priority={selectedPriority}
        />

        {/* Global What-If Simulator Drawer (when active) */}
        {whatIfActive && (
          <div className="p-4 sm:p-6 bg-purple-950/20 border-b border-purple-500/30 px-6 sm:px-8 animate-fadeIn">
            <div className="max-w-6xl mx-auto space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-purple-300">
                    {language === 'en' ? 'What-If Environmental Simulator Active' : 'পরিবেশগত খরা ও বৃষ্টি সিমুলেটর সক্রিয়'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSimSoil(sat.soil);
                      setSimRain(Math.round(conditions.rain30));
                      setSimMaxTemp(Math.round(conditions.tMax30));
                    }}
                    className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono text-[#B8FF3D] cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>{language === 'en' ? 'Reset to NASA' : 'মূল মানে ফেরত'}</span>
                  </button>
                  <button
                    onClick={() => setWhatIfActive(false)}
                    className="p-1 rounded-lg hover:bg-white/10 text-[#8FA3B8] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Soil */}
                <div className="p-3.5 rounded-xl bg-[#050B14] border border-purple-500/30">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#8FA3B8]">{language === 'en' ? 'SMAP Soil Moisture' : 'মাটির আর্দ্রতা'}</span>
                    <span className="text-[#00E5FF] font-bold">{simSoil.toFixed(2)} m³/m³</span>
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
                  <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                    <span className={simSoil < 0.15 ? 'text-[#FF5C5C] font-bold' : ''}>Drought (&lt;0.15)</span>
                    <span className={simSoil >= 0.25 && simSoil <= 0.30 ? 'text-[#B8FF3D] font-bold' : ''}>Optimal (0.25–0.30)</span>
                  </div>
                </div>

                {/* Rain */}
                <div className="p-3.5 rounded-xl bg-[#050B14] border border-purple-500/30">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#8FA3B8]">{language === 'en' ? '30-Day Rain' : '৩০ দিনের বৃষ্টি'}</span>
                    <span className="text-[#B8FF3D] font-bold">{simRain} mm</span>
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
                  <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                    <span className={simRain < 50 ? 'text-[#FF5C5C] font-bold' : ''}>Dry (&lt;50mm)</span>
                    <span>High (&gt;120mm)</span>
                  </div>
                </div>

                {/* Temp */}
                <div className="p-3.5 rounded-xl bg-[#050B14] border border-purple-500/30">
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-[#8FA3B8]">{language === 'en' ? 'Max Temp' : 'সর্বোচ্চ তাপমাত্রা'}</span>
                    <span className="text-[#FF5C5C] font-bold">{simMaxTemp.toFixed(1)}°C</span>
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
                  <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                    <span>Mild</span>
                    <span className={simMaxTemp > 35 ? 'text-[#FF5C5C] font-bold' : ''}>Heat Stress (&gt;35°C)</span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="text-[11px] font-mono text-[#8FA3B8] mr-1">
                  {language === 'en' ? 'Quick Scenarios:' : 'ঝটপট পরিস্থিতি:'}
                </span>
                <button
                  onClick={() => { setSimSoil(0.12); setSimRain(25); setSimMaxTemp(34); }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-slate-300 cursor-pointer"
                >
                  🏜️ {language === 'en' ? 'Drought' : 'খরা'}
                </button>
                <button
                  onClick={() => { setSimSoil(0.28); setSimRain(70); setSimMaxTemp(27); }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-slate-300 cursor-pointer"
                >
                  🌱 {language === 'en' ? 'Optimal Sowing' : 'অনুকূল বপন'}
                </button>
                <button
                  onClick={() => { setSimSoil(0.16); setSimRain(35); setSimMaxTemp(38); }}
                  className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 font-mono text-slate-300 cursor-pointer"
                >
                  🌡️ {language === 'en' ? 'Heatwave' : 'তাপপ্রবাহ'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW (EXECUTIVE WORKING DASHBOARD)                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn">
              {/* Executive Status Banner */}
              <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
                isWaterStressed
                  ? 'bg-[#0B1626] border-[#FF5C5C]/40 shadow-xl'
                  : 'bg-[#0B1626] border-[#B8FF3D]/40 shadow-xl'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-xs font-mono font-semibold mb-1.5">
                      <span className={`w-2 h-2 rounded-full ${isWaterStressed ? 'bg-[#FF5C5C]' : 'bg-[#B8FF3D]'}`} />
                      <span className={isWaterStressed ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}>
                        {isWaterStressed
                          ? (language === 'en' ? 'OBSERVATION ALERT: WATER DEFICIT' : 'উপগ্রহ সতর্কতা: পানির ঘাটতি')
                          : (language === 'en' ? 'OBSERVATION STATUS: OPTIMAL MOISTURE' : 'আর্দ্রতা পরিস্থিতি: স্বাভাবিক')}
                      </span>
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
                      {isWaterStressed
                        ? (language === 'en'
                            ? 'Field moisture is below seasonal tolerance; favor tap-root legumes.'
                            : 'জমিতে পানির ঘাটতি রয়েছে; গভীর শিকড়ের ডাল ফসল নির্বাচন করুন।')
                        : (language === 'en'
                            ? 'Root-zone moisture is balanced for seasonal crop sowing.'
                            : 'মাটিতে উদ্ভিদের বৃদ্ধির জন্য পর্যাপ্ত আর্দ্রতা রয়েছে।')}
                    </h2>
                    <p className="text-xs text-[#8FA3B8] mt-1">
                      {language === 'en'
                        ? `Precipitation is ${activeRain.toFixed(0)} mm (net ${Math.round(activeWaterBalance)} mm vs ET₀). Root-zone soil moisture is ${activeSoil.toFixed(2)} m³/m³.`
                        : `৩০ দিনের বৃষ্টিপাত ${activeRain.toFixed(0)} মিমি (বাষ্পীভবনের তুলনায় নিট ${Math.round(activeWaterBalance)} মিমি)। মাটির আর্দ্রতা ${activeSoil.toFixed(2)} m³/m³।`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleTabClick('crops')}
                      className="px-4 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{language === 'en' ? 'View Full Crop Plan' : 'পূর্ণাঙ্গ পরিকল্পনা'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Compact 4-Metric Telemetry KPI Row (Section 2) */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Rainfall */}
                <div className="p-4 rounded-xl bg-[#0B1626] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3B8] mb-1">
                    <span>{language === 'en' ? '30-Day Rain' : '৩০ দিনের বৃষ্টি'}</span>
                    <span className="text-[#00E5FF]">POWER</span>
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {Math.round(activeRain)} <span className="text-xs text-[#8FA3B8] font-normal">mm</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#8FA3B8] flex justify-between font-mono">
                    <span>ET₀: {Math.round(conditions.et0Total)}mm</span>
                    <span className={activeWaterBalance < -50 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}>
                      {activeWaterBalance < 0 ? `${Math.round(activeWaterBalance)}mm` : `+${Math.round(activeWaterBalance)}mm`}
                    </span>
                  </div>
                </div>

                {/* 2. Soil Moisture */}
                <div className="p-4 rounded-xl bg-[#0B1626] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3B8] mb-1">
                    <span>{language === 'en' ? 'Soil Moisture' : 'মাটির আর্দ্রতা'}</span>
                    <span className="text-[#B8FF3D]">SMAP</span>
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {activeSoil.toFixed(2)} <span className="text-xs text-[#8FA3B8] font-normal">m³/m³</span>
                  </div>
                  {/* Gauge bar */}
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${activeSoil < 0.15 ? 'bg-[#FF5C5C]' : activeSoil >= 0.25 && activeSoil <= 0.30 ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'}`}
                      style={{ width: `${Math.min(100, Math.max(10, (activeSoil / 0.40) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* 3. Max Temperature */}
                <div className="p-4 rounded-xl bg-[#0B1626] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3B8] mb-1">
                    <span>{language === 'en' ? 'Daily Max Temp' : 'সর্বোচ্চ তাপমাত্রা'}</span>
                    <span className={activeMaxTemp > 35 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}>
                      {activeMaxTemp > 35 ? 'Alert' : 'Safe'}
                    </span>
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {activeMaxTemp.toFixed(1)}°C
                  </div>
                  <div className="mt-1 text-[10px] text-[#8FA3B8] font-mono truncate">
                    {language === 'en' ? `Mean: ${conditions.tMaxAvg.toFixed(1)}°C` : `গড়: ${conditions.tMaxAvg.toFixed(1)}°সে`}
                  </div>
                </div>

                {/* 4. MODIS Vegetation */}
                <div className="p-4 rounded-xl bg-[#0B1626] border border-white/10">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#8FA3B8] mb-1">
                    <span>{language === 'en' ? 'Vegetation Index' : 'উদ্ভিদ সজীবতা'}</span>
                    <span className="text-[#00E5FF]">MODIS</span>
                  </div>
                  <div className="font-mono text-2xl font-bold text-white">
                    {sat.ndvi} <span className="text-xs text-[#8FA3B8] font-normal">NDVI</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#8FA3B8] font-mono">
                    {language === 'en' ? `Surface: ${sat.lst}°C` : `ভূ-পৃষ্ঠ: ${sat.lst}°সে`}
                  </div>
                </div>
              </div>

              {/* Two-Column Operational Layout: Top Crops (Left) & Rotation Timeline (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Top 3 Recommended Crops (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-[#B8FF3D]" />
                      <h3 className="font-display font-bold text-lg text-white">
                        {language === 'en' ? 'Top Crop Recommendations' : 'শীর্ষ প্রস্তাবিত ফসল'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabClick('crops')}
                      className="text-xs font-mono text-[#00E5FF] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>{language === 'en' ? 'See all 10 crops →' : 'সকল ১০টি ফসল →'}</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rankedCrops.slice(0, 3).map((crop, idx) => (
                      <div
                        key={crop.id}
                        className="p-4 rounded-xl bg-[#0B1626] border border-white/10 hover:border-[#B8FF3D]/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30">
                              #{idx + 1}
                            </span>
                            <h4 className="font-display font-bold text-base text-white truncate">
                              {language === 'en' ? crop.nameEn : crop.nameBn}
                            </h4>
                            <span className="text-xs font-mono text-[#8FA3B8]">
                              ({language === 'en' ? crop.seasonEn : crop.seasonBn})
                            </span>
                          </div>
                          <p className="text-xs text-[#8FA3B8] line-clamp-1">
                            {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-[11px] font-mono text-[#8FA3B8]">
                            <span>{language === 'en' ? 'Water' : 'পানি'}: <strong className="text-white">{language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}</strong></span>
                            <span>•</span>
                            <span>{crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <span className="font-mono text-xl font-bold text-[#B8FF3D] block leading-none">
                              {crop.suitabilityScore}%
                            </span>
                            <span className="text-[9px] font-mono uppercase text-[#8FA3B8]">Match</span>
                          </div>
                          <button
                            onClick={() => setExplainCrop(crop)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-[#00E5FF] cursor-pointer"
                          >
                            {language === 'en' ? 'Why?' : 'কেন?'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Column: 3-Season Rotation Timeline (5 Cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-white/10">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#00E5FF]" />
                      <h3 className="font-display font-bold text-lg text-white">
                        {language === 'en' ? 'Annual Rotation Sequence' : 'বার্ষিক আবর্তন পরিক্রমা'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabClick('crops')}
                      className="text-xs font-mono text-[#00E5FF] hover:underline cursor-pointer"
                    >
                      {language === 'en' ? 'Details →' : 'বিস্তারিত →'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B1626] border border-white/10 space-y-3">
                    {/* Season Trail */}
                    <div className="space-y-2.5">
                      {engineResult.picks.map((pick, i) => {
                        const seasonLabel = pick.season === 'rabi' ? (language === 'en' ? 'Rabi' : 'রবি') : pick.season === 'kharif1' ? (language === 'en' ? 'Kharif-1' : 'খরিফ-১') : (language === 'en' ? 'Kharif-2' : 'খরিফ-২');
                        const months = pick.season === 'rabi' ? 'Nov–Feb' : pick.season === 'kharif1' ? 'Mar–Jun' : 'Jul–Oct';
                        return (
                          <div key={pick.season} className="p-3 rounded-xl bg-[#050B14] border border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center font-bold text-[#B8FF3D]">
                                0{i + 1}
                              </span>
                              <div>
                                <h5 className="font-display font-bold text-sm text-white">
                                  {language === 'en' ? pick.crop.nameEn : pick.crop.nameBn}
                                </h5>
                                <span className="text-[10px] font-mono text-[#8FA3B8]">
                                  {seasonLabel} ({months})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#B8FF3D]">
                              {pick.score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rule Badges */}
                    <div className="pt-3 border-t border-white/5 space-y-1.5 text-[11px] font-mono text-[#8FA3B8]">
                      <div className="flex items-center gap-1.5 text-[#B8FF3D]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{language === 'en' ? 'Rule A: Family Alternation Verified' : 'রুল ক: গোত্র আবর্তন নিশ্চিত'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#00E5FF]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{language === 'en' ? 'Rule B: Biological N-Balance Active' : 'রুল খ: নাইট্রোজেন সংবন্ধন সক্রিয়'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Dedicated Decision Support Advisory Card (Section 8) */}
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
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FIELD CONDITIONS (ENVIRONMENTAL TELEMETRY & SIMULATOR)     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'conditions' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="pb-4 border-b border-white/10">
                <span className="text-xs font-mono uppercase text-[#00E5FF] tracking-wider font-bold block mb-1">
                  {language === 'en' ? 'Environmental Telemetry' : 'পরিবেশগত উপাত্ত'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? `Field Observations for ${upazilaName}` : `${upazilaName}-এর উপগ্রহ পর্যবেক্ষণ`}
                </h2>
                <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
                  {language === 'en'
                    ? 'NASA Earth observation radiometers and weather forecast data monitoring soil rootzone, moisture balance, and thermal levels.'
                    : 'নাসার উপগ্রহ পর্যবেক্ষণ ও পূর্বাভাস উপাত্ত যা মাটির আর্দ্রতা, বাষ্পীভবন ও তাপমাত্রা পরিমাপ করে।'}
                </p>
              </div>

              {/* Telemetry 3-Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Rainfall */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA POWER"
                        status={whatIfActive ? 'simulated' : loaded.mode === 'live' ? 'live' : 'cached'}
                        date={loaded.data.fetchedAt.split('T')[0]}
                        language={language}
                      />
                      <span className={`font-mono text-xs font-semibold ${activeWaterBalance < -50 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}`}>
                        {activeWaterBalance < 0 ? `${Math.round(activeWaterBalance)} mm Net` : `+${Math.round(activeWaterBalance)} mm Net`}
                      </span>
                    </div>

                    <div className="font-mono text-4xl font-bold text-white mb-1">
                      {Math.round(activeRain)} <span className="text-base text-[#8FA3B8] font-normal">mm</span>
                    </div>
                    <p className="text-xs text-[#8FA3B8] mt-3 leading-relaxed">
                      {language === 'en'
                        ? `Cumulative 30-day precipitation. Net balance vs crop ET₀ demand is ${Math.round(activeWaterBalance)} mm.`
                        : `৩০ দিনের মোট বৃষ্টিপাত। বাষ্পীভবন চাহিদার তুলনায় নিট পানির অবস্থা ${Math.round(activeWaterBalance)} মিমি।`}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/10 flex justify-between text-xs font-mono text-[#8FA3B8]">
                    <span>Hargreaves ET₀</span>
                    <span className="text-white font-bold">{Math.round(conditions.et0Total)} mm ({conditions.et0.toFixed(1)} mm/d)</span>
                  </div>
                </div>

                {/* 2. Soil Moisture */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA SMAP"
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

                    <div className="font-mono text-4xl font-bold text-white mb-1">
                      {activeSoil.toFixed(2)} <span className="text-base text-[#8FA3B8] font-normal">m³/m³</span>
                    </div>
                    <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          activeSoil < 0.15 ? 'bg-[#FF5C5C]' : activeSoil >= 0.25 && activeSoil <= 0.30 ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(10, (activeSoil / 0.40) * 100))}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-[#8FA3B8] font-mono mt-1">
                      <span className={activeSoil < 0.15 ? 'text-[#FF5C5C] font-bold' : ''}>Deficit (&lt;0.15)</span>
                      <span className={activeSoil >= 0.25 && activeSoil <= 0.30 ? 'text-[#B8FF3D] font-bold' : ''}>Target (0.25–0.30)</span>
                    </div>
                    <p className="text-xs text-[#8FA3B8] mt-3 leading-relaxed">
                      {language === 'en'
                        ? '0–5 cm rootzone layer measured by L-band radiometer. Evaluates seed germination and shallow vs deep taproot crops.'
                        : '০–৫ সেমি শিকড় স্তরের আর্দ্রতা। বীজ গজানো ও ফসলের শিকড় প্রসারণের সক্ষমতা নির্দেশ করে।'}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/10 flex justify-between text-xs font-mono text-[#8FA3B8]">
                    <span>Air Humidity (RH2M)</span>
                    <span className="text-white font-semibold">{Math.round(conditions.rh)}% RH</span>
                  </div>
                </div>

                {/* 3. Temperature & Biosphere */}
                <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
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

                    <div className="font-mono text-4xl font-bold text-white mb-1">
                      {activeMaxTemp.toFixed(1)}°C
                    </div>
                    <p className="text-xs text-[#8FA3B8] mt-3 leading-relaxed">
                      {language === 'en'
                        ? `Vegetation index is ${sat.ndvi} NDVI. Daytime thermal reading is ${sat.lst}°C, monitored for flowering heat sensitivity.`
                        : `উদ্ভিদ সজীবতা সূচক ${sat.ndvi} NDVI। ভূ-পৃষ্ঠের তাপমাত্রা ${sat.lst}°C, ফুল ফোটা ও দানা বাঁধার জন্য পর্যবেক্ষণাধীন।`}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-white/10 flex justify-between text-xs font-mono text-[#8FA3B8]">
                    <span>MODIS Surface Temp</span>
                    <span className="text-white font-semibold">{sat.lst}°C</span>
                  </div>
                </div>
              </div>

              {/* Spatial Resolution Disclaimer */}
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10 flex items-start gap-3 text-xs text-[#8FA3B8]">
                <Info className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'en'
                    ? `Spatial resolution note: NASA SMAP (9 km), GPM/POWER (10 km to 0.5°), and MODIS (250m–1km) observations represent regional agro-climatic conditions across ${upazilaName}, providing broad environmental indicators rather than direct in-situ sensor probes buried in this specific field.`
                    : `স্থানিক সূক্ষ্মতা বিজ্ঞপ্তি: নাসা স্ম্যাপ (৯ কিমি), জিপিএম/পাওয়ার (১০ কিমি) এবং মডিস (২৫০মি-১কিমি) উপাত্তসমূহ ${upazilaName}-এর পুরো অঞ্চলের পরিবেশগত নির্দেশক, কোনো নির্দিষ্ট জমির গভীরে সরাসরি বসানো সেন্সরের একক পরিমাপ নয়।`}
                </p>
              </div>

              {/* Agronomic Reasoning */}
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-4">
                <h3 className="font-display font-bold text-lg text-white">
                  {language === 'en' ? 'Agronomic Reasoning for your Soil & Weather' : 'মাটি ও আবহাওয়ার কৃষিগত বিশ্লেষণ'}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#8FA3B8]">
                  <div className="p-4 rounded-xl bg-[#050B14] border border-white/5 space-y-1">
                    <span className="font-mono text-[#00E5FF] font-bold block">01 · Water Conservation</span>
                    <p>{language === 'en' ? 'Because subsurface moisture is low and rainfall anomaly is negative, choosing high-irrigation Boro rice increases diesel pumping costs by ৳12,000–৳18,000 per acre.' : 'যেহেতু বৃষ্টিপাত ও মাটির রস কম, অতিরিক্ত সেচ নির্ভর বোরো ধান চাষ করলে একর প্রতি ১২,০০০–১৮,০০০ টাকা বাড়তি ডিজেল ও বিদ্যুৎ খরচ হবে।'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#050B14] border border-white/5 space-y-1">
                    <span className="font-mono text-[#B8FF3D] font-bold block">02 · Tap-Root Advantage</span>
                    <p>{language === 'en' ? 'Lentil and Mustard possess tap roots that exploit deeper subsoil moisture, requiring only 1–2 light irrigations to reach full maturity.' : 'মসুর ও সরিষার শিকড় মাটির গভীরে প্রবেশ করে রস টানতে পারে, ফলে মাত্র ১-২টি হালকা সেচেই কাঙ্ক্ষিত ফলন পাওয়া যায়।'}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[#050B14] border border-white/5 space-y-1">
                    <span className="font-mono text-white font-bold block">03 · Biological Soil Recovery</span>
                    <p>{language === 'en' ? 'A summer Mungbean catch-crop fixes 40 kg biological nitrogen per hectare, lowering fertilizer needs for the subsequent monsoon T. Aman rice by 30%.' : 'গ্রীষ্মকালীন মুগডাল চাষ করলে মাটিতে হেক্টর প্রতি ৪০ কেজি প্রাকৃতিক নাইট্রোজেন জমা হয়, যা পরবর্তী আমন ধানে ৩০% ইউরিয়া সারের খরচ বাঁচায়।'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CROP PLAN (COMPATIBILITY & 3-SEASON ROTATION)             */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'crops' && (
            <div className="space-y-8 animate-fadeIn">
              <CropRecommendation
                selectedPriority={selectedPriority}
                secondaryPriority={secondaryPriority}
                language={language}
                onExplainCrop={(crop) => setExplainCrop(crop)}
                telemetry={telemetry}
              />

              <SeasonRotation
                selectedDistrict={selectedDistrict}
                selectedPriority={selectedPriority}
                language={language}
                onExplainCrop={(crop) => setExplainCrop(crop)}
                engineResult={engineResult}
                telemetry={telemetry}
              />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: CLIMATE SHIFT (DECADAL COMPARISON 2001-2010 vs 2016-2025)  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'shift' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="pb-4 border-b border-white/10">
                <span className="text-xs font-mono uppercase text-[#00E5FF] tracking-wider font-bold block mb-1">
                  {language === 'en' ? 'Decadal Climate Shift' : 'জলবায়ুর দীর্ঘমেয়াদী পরিবর্তন'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? `Climate Shift in ${districtName}` : `${districtName}-এর আবহাওয়া রূপান্তর (ফিল্ড শিফট)`}
                </h2>
                <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
                  {language === 'en'
                    ? 'Comparing NASA POWER 2001–2010 historical baseline with the recent decadal period (2016–2025).'
                    : 'নাসা পাওয়ার উপাত্ত থেকে ২০০১-২০১০ ভিত্তি বর্ষের সাথে সাম্প্রতিক ২০১৬-২০২৫ মৌসুমের তুলনা।'}
                </p>
              </div>

              <FieldShiftPanel shift={fieldShift} />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: EXPLAIN WHY (TRANSPARENT DETERMINISTIC RULES & BREAKDOWN)  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'explain' && (
            <div className="space-y-8 animate-fadeIn">
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-white/10 space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#00E5FF] uppercase">
                  <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
                  <span>{language === 'en' ? 'Core Scientific Methodology' : 'মৌলিক বৈজ্ঞানিক নীতিমালা'}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {language === 'en' ? 'Transparent, 100% Rule-Based Decision Architecture' : 'স্বচ্ছ, শতভাগ নিয়ম-ভিত্তিক সিদ্ধান্ত কাঠামো'}
                </h2>
                <p className="text-xs sm:text-sm text-[#8FA3B8] leading-relaxed">
                  {language === 'en'
                    ? 'AgriOrbit deliberately avoids "black-box" machine learning. Every recommendation stems from transparent, deterministic agronomic rules combining NASA Earth observations, BARI crop standards, and farmer priorities.'
                    : 'এগ্রিঅরবিট কোনো ব্ল্যাক-বক্স মেশিন লার্নিং ব্যবহার করে না। প্রতিটি সুপারিশ নাসা উপগ্রহ পর্যবেক্ষণ, বিএআরআই কৃষি গবেষণা মানদণ্ড এবং কৃষকের নিজস্ব লক্ষ্যের ভিত্তিতে তৈরি।'}
                </p>
              </div>

              {/* The 5 Empirical Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#0B1626] border border-white/10 space-y-2">
                  <span className="font-mono text-xs text-[#B8FF3D] font-bold block uppercase">
                    Rule 1 · Moisture Deficit Rule
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? '30-Day Rain < 50 mm AND Soil < 0.15 m³/m³' : '৩০ দিনের বৃষ্টি < ৫০ মিমি এবং মাটির রস < ০.১৫'}
                  </h4>
                  <p className="text-xs text-[#8FA3B8] leading-relaxed">
                    {language === 'en'
                      ? 'Penalizes high-water flood-irrigation crops (such as winter Boro rice) by -20 points, elevating drought-resilient legumes and taproot pulses.'
                      : 'অতিরিক্ত পানিগ্রাহী বোরো ধানের স্কোর ২০ পয়েন্ট কেটে দেয় এবং খরা-সহনশীল মসুর ও সরিষার অবস্থান শীর্ষে নিয়ে আসে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1626] border border-white/10 space-y-2">
                  <span className="font-mono text-xs text-[#00E5FF] font-bold block uppercase">
                    Rule 2 · Optimal Sowing Window Rule
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'SMAP Soil Moisture 0.25 to 0.30 m³/m³' : 'মাটির আর্দ্রতা ০.২৫ থেকে ০.৩০ m³/m³'}
                  </h4>
                  <p className="text-xs text-[#8FA3B8] leading-relaxed">
                    {language === 'en'
                      ? 'Awards a +5 point bonus and an "Optimal Sowing Moisture" badge, signaling prime seed germination conditions.'
                      : 'উপযুক্ত আর্দ্রতার জন্য ৫ পয়েন্ট বোনাস দেয় এবং জমিতে বীজ বপনের অনুকূল সময় নির্দেশ করে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1626] border border-white/10 space-y-2">
                  <span className="font-mono text-xs text-[#FF5C5C] font-bold block uppercase">
                    Rule 3 · Thermal Stress Rule
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'Daily Max Temperature > 35°C' : 'সর্বোচ্চ তাপমাত্রা > ৩৫° সে.'}
                  </h4>
                  <p className="text-xs text-[#8FA3B8] leading-relaxed">
                    {language === 'en'
                      ? 'Applies heat penalties to terminal-heat-sensitive crops (Wheat and Potato) to avoid flowering blast and yield failure.'
                      : 'ফুল ফোটা ও দানা বাঁধার সময় তাপমাত্রা বেশি থাকলে গম ও আলুর জন্য সতর্কতা জারি করে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#0B1626] border border-white/10 space-y-2">
                  <span className="font-mono text-xs text-[#B8FF3D] font-bold block uppercase">
                    Rule 4 · Botanical Alternation & Nitrogen Triggers
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'Rotation Rule A & Rule B' : 'আবর্তন নীতি ক ও খ'}
                  </h4>
                  <p className="text-xs text-[#8FA3B8] leading-relaxed">
                    {language === 'en'
                      ? 'Rule A prevents repeating identical plant families consecutively. Rule B forces a legume (Mungbean/Lentil) when the soil nutrient trail drops below zero.'
                      : 'পরপর দুই মৌসুমে একই গোত্রের ফসল নিষিদ্ধ করে রোগ দমন করা হয় এবং মাটির নাইট্রোজেন কমে গেলে বাধ্যতামূলক ডাল জাতীয় ফসল অন্তর্ভুক্ত করা হয়।'}
                  </p>
                </div>
              </div>

              {/* Interactive Score Breakdown Trigger */}
              <div className="p-6 rounded-2xl bg-[#0B1626] border border-[#B8FF3D]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-lg font-bold text-white">
                    {language === 'en' ? `Inspect Score Breakdown: ${rankedCrops[0]?.nameEn}` : `স্কোর গণনা দেখুন: ${rankedCrops[0]?.nameBn}`}
                  </h4>
                  <p className="text-xs text-[#8FA3B8] mt-0.5">
                    {language === 'en'
                      ? 'Open the full mathematical table showing every point delta from BARI, SMAP, POWER, and your priorities.'
                      : 'নাসার প্রতিটি স্যাটেলাইট উপাত্তের জন্য কীভাবে পয়েন্ট যোগ বা বিয়োগ হয়েছে তার বিশদ টেবিল দেখুন।'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExplainCrop(rankedCrops[0])}
                  className="px-5 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{language === 'en' ? 'Open Mathematical Table' : 'গাণিতিক গণনা দেখুন'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Farmer Community Feedback Loop (Active on all tabs) */}
          <FarmerFeedbackLoop
            language={language}
            district={districtName}
            upazila={upazilaName}
            selectedPriority={selectedPriority}
          />
        </main>
      </div>

      {/* 4. EXPLAIN WHY TRANSPARENCY MODAL */}
      <ExplainWhyModal
        crop={explainCrop}
        selectedPriority={selectedPriority}
        secondaryPriority={secondaryPriority}
        language={language}
        onClose={() => setExplainCrop(null)}
      />
    </div>
  );
};
