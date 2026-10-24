import React, { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  Droplets,
  Sprout,
  TrendingUp,
  HelpCircle,
  Sliders,
  MapPin,
  User,
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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { CropData, DistrictId, FarmerPriorityId, Language } from '../../types';
import { getDistrictProfile, getUpazilaName, DISTRICT_WIDE_UPAZILA } from '../../lib/location';
import { CropRecommendation } from '../CropRecommendation';
import { SeasonRotation } from '../SeasonRotation';
import { ExplainWhyModal } from '../ExplainWhyModal';
import { Header } from '../common/Header';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { DataTileStatusBadge, formatBadgeDate } from '../common/DataTileStatusBadge';
import {
  ShortTermRiskAlert,
  MiniMapThumbnail,
  FarmerFeedbackLoop,
  FarmerAdvisoryCard,
  FaqSection,
} from '../dashboard';
import { UserMenu } from '../auth/UserMenu';
import { NotificationBell } from '../notifications/NotificationBell';
import { loadLocationData, loadDistrict, BUNDLED_RANGPUR, type LoadedData } from '../../lib/data';
import { computeConditions } from '../../lib/conditions';
import { computeFieldShift } from '../../lib/fieldShift';
import { runEngine, type Priority } from '../../lib/engine';
import { useDistrictSatellite } from '../../lib/satelliteService';
import { FieldShiftPanel } from '../landing/FieldShiftSection';
import { getRankedCrops, formatPriorityLabel, type TelemetryContext } from '../../lib/cropSuitability';
import { toBnDigits } from '../../lib/bilingualEmailTemplate';

interface DashboardViewProps {
  userName: string;
  selectedDistrict: DistrictId;
  selectedUpazila: string;
  fieldLat: number;
  fieldLng: number;
  selectedPriority: FarmerPriorityId;
  secondaryPriority?: FarmerPriorityId | null;
  previousCrop?: string;
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
  previousCrop,
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
  const isDistrictWide = !selectedUpazila || selectedUpazila === DISTRICT_WIDE_UPAZILA;
  const upazilaName = getUpazilaName(selectedDistrict, selectedUpazila, language);
  const districtName = language === 'en' ? district.nameEn : district.nameBn;
  const locationBreadcrumb = isDistrictWide ? districtName : `${districtName} › ${upazilaName}`;

  // NASA POWER & Open-Meteo 4-level safety net (Client 24h Cache -> Live -> Public Cache -> Bundled)
  const [loaded, setLoaded] = useState<LoadedData>({
    data: BUNDLED_RANGPUR,
    mode: 'bundled',
  });
  const [isLoadingData, setIsLoadingData] = useState(false);

  useEffect(() => {
    let active = true;
    setIsLoadingData(true);
    loadLocationData(selectedDistrict, selectedUpazila, fieldLat, fieldLng)
      .then((res) => {
        if (!active) return;
        setLoaded(res);
        setIsLoadingData(false);
      })
      .catch((err) => {
        if (!active) return;
        console.warn('Dashboard data fetch failed, falling back to bundled dataset:', err);
        setLoaded({
          data: BUNDLED_RANGPUR,
          mode: 'bundled',
        });
        setIsLoadingData(false);
      });

    return () => {
      active = false;
    };
  }, [selectedDistrict, selectedUpazila, fieldLat, fieldLng]);

  // Derived baseline conditions & climate shift from real NASA POWER records
  const hasData = loaded.mode !== 'unavailable' && !!loaded.data;
  const conditions = useMemo(
    () => hasData ? computeConditions(loaded.data.daily, loaded.data.lat) : computeConditions(BUNDLED_RANGPUR.daily, BUNDLED_RANGPUR.lat),
    [loaded.data.daily, loaded.data.lat]
  );

  const fieldShift = useMemo(() => {
    const dMonthly = hasData ? loaded.data.monthly : BUNDLED_RANGPUR.monthly;
    const shiftCacheKey = selectedUpazila && selectedUpazila !== DISTRICT_WIDE_UPAZILA
      ? `agriorbit_field_shift_${selectedDistrict}_${selectedUpazila}`
      : `agriorbit_field_shift_${selectedDistrict}`;

    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem(shiftCacheKey);
        if (cached) return JSON.parse(cached);
      } catch {}
    }

    const computed = computeFieldShift(dMonthly, district.id);
    if (typeof window !== 'undefined' && hasData) {
      try {
        localStorage.setItem(shiftCacheKey, JSON.stringify(computed));
      } catch {}
    }
    return computed;
  }, [hasData, loaded.data?.monthly, district.id, selectedDistrict, selectedUpazila]);

  // Real NASA Earthdata observations for the active district (updated dynamically from Supabase/cache)
  const {
    satellite: districtSat,
    isSmapFresh,
    isNdviFresh,
    isLstFresh,
  } = useDistrictSatellite(district.id);
  const sentinel2Data = districtSat?.sentinel2 ?? null;
  const jaxaData = districtSat?.jaxa ?? null;
  const insatData = districtSat?.insat ?? null;
  const nisarData = districtSat?.nisar ?? null;
  const smapData = districtSat?.smap ?? null;
  const ndviData = districtSat?.ndvi ?? null;
  const lstDayData = districtSat?.lstDay ?? null;
  const lstNightData = districtSat?.lstNight ?? null;
  const isSoilFlaggedWater = smapData?.flag === 'possible_water_contamination';
  const realSoilMoisture = (smapData && !isSoilFlaggedWater) ? smapData.value : null;

  // What-If Environmental Simulator Controls
  const [whatIfActive, setWhatIfActive] = useState(false);
  const [simSoil, setSimSoil] = useState<number>(smapData?.value ?? 0.22);
  const [simRain, setSimRain] = useState<number>(Math.round(conditions.rain30));
  const [simMaxTemp, setSimMaxTemp] = useState<number>(Math.round(conditions.tMax30));

  // Sync simulation sliders when base district data updates (if not actively simulating)
  useEffect(() => {
    if (!whatIfActive) {
      setSimSoil(smapData?.value ?? 0.22);
      setSimRain(Math.round(conditions.rain30));
      setSimMaxTemp(Math.round(conditions.tMax30));
    }
  }, [smapData?.value, conditions.rain30, conditions.tMax30, whatIfActive]);

  // Active telemetry driving the scoring engine:
  // If soil is null or flagged as possible water contamination, engine receives null to skip soil rules
  const activeSoil: number | null = whatIfActive ? simSoil : realSoilMoisture;
  const activeRain = whatIfActive ? simRain : conditions.rain30;
  const activeMaxTemp = whatIfActive ? simMaxTemp : conditions.tMax30;
  const activeWaterBalance = activeRain - conditions.et0Total;

  const telemetry: TelemetryContext = useMemo(
    () => ({
      rainfall30d: conditions.rainUnavailable ? null : activeRain,
      soilMoisture: activeSoil,
      maxTemp: activeMaxTemp,
      waterBalance: conditions.rainUnavailable ? null : activeWaterBalance,
      sentinel1FloodedCroplandPct: districtSat?.sentinel1?.floodedCroplandPct ?? null,
      sentinel2Ndvi10m: sentinel2Data?.ndvi10m ?? null,
      sentinel2AnomalyPct: sentinel2Data?.anomalyPct ?? null,
      jaxaRain30dMm: jaxaData?.gsmapRain30dMm ?? null,
      jaxaSoilMoisture: jaxaData?.amsr2SoilMoisture ?? null,
      jaxaSpi30dIndex: jaxaData?.spi30dIndex ?? null,
      insatLstC: insatData?.lstC ?? null,
      insatHeatConfirmed: insatData?.heatSpikeConfirmed ?? false,
      nisarSoilMoisture200m: nisarData?.soilMoisture200m ?? null,
    }),
    [activeRain, activeSoil, activeMaxTemp, activeWaterBalance, conditions.rainUnavailable, districtSat?.sentinel1?.floodedCroplandPct, sentinel2Data?.ndvi10m, sentinel2Data?.anomalyPct, jaxaData?.gsmapRain30dMm, jaxaData?.amsr2SoilMoisture, jaxaData?.spi30dIndex, insatData?.lstC, insatData?.heatSpikeConfirmed, nisarData?.soilMoisture200m]
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
        forecast: loaded.data?.forecast ?? BUNDLED_RANGPUR.forecast,
        priority: mapPriority(selectedPriority),
        previousCrop: previousCrop,
        today: new Date(),
      }),
    [conditions, activeRain, activeMaxTemp, activeWaterBalance, activeSoil, fieldShift, loaded.data.forecast, selectedPriority, previousCrop]
  );

  // Ranked crops for Crop Plan & Advisory Card
  const rankedCrops = useMemo(
    () => {
      const list = getRankedCrops(selectedPriority, secondaryPriority, 'All', telemetry);
      if (!engineResult || !engineResult.picks || engineResult.picks.length === 0) return list;
      const topPickId = engineResult.picks[0].crop.id;
      const topKey = topPickId === 'boro' ? 'boro_rice' : topPickId === 'aus' ? 'aus_rice' : topPickId === 'aman' ? 't_aman_rice' : topPickId;
      const topIdx = list.findIndex((c) => c.id === topKey || c.id === topPickId);
      if (topIdx >= 0) {
        const topCrop = { ...list[topIdx], suitabilityScore: engineResult.picks[0].score };
        const remaining = list.filter((_, idx) => idx !== topIdx);
        return [topCrop, ...remaining];
      }
      return list;
    },
    [selectedPriority, secondaryPriority, telemetry, engineResult]
  );

  // Water stressed threshold
  const isWaterStressed = (activeSoil !== null && activeSoil < 0.20) || activeRain < 50 || activeWaterBalance < -50;

  const DASHBOARD_NAV_ITEMS = [
    { id: 'overview' as const, en: 'Overview', bn: 'সারসংক্ষেপ', icon: LayoutDashboard },
    { id: 'conditions' as const, en: 'Field Conditions', bn: 'মাঠের অবস্থা', icon: Droplets },
    { id: 'crops' as const, en: 'Crop Plan', bn: 'ফসলের পরিকল্পনা', icon: Sprout },
    { id: 'shift' as const, en: 'Climate Shift', bn: 'আবহাওয়া বদল', icon: TrendingUp },
    { id: 'explain' as const, en: 'Explain Why', bn: 'পরামর্শের কারণ', icon: HelpCircle },
  ];

  const handleTabClick = (tabId: DashboardTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA] flex flex-col font-editorial selection:bg-[#22C55E] selection:text-black">
      {/* 0. Universal Unified Header across all pages */}
      <Header />

      <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100dvh-4rem)]">
        {/* 1. DEDICATED APPLICATION SIDEBAR (DESKTOP - 1024px+) */}
        <aside className="hidden lg:flex flex-col w-64 lg:w-72 bg-[#0A0A0A] border-r border-[#262626] shrink-0 sticky top-16 h-[calc(100dvh-4rem)] z-30 justify-between overflow-y-auto">
          <div className="p-5 flex flex-col gap-6">
            {/* App Brand Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-[#22C55E]" />
                <span className="font-display font-semibold text-sm text-[#FAFAFA]">
                  {language === 'en' ? 'Field Advisory' : 'কৃষি উপদেষ্টা'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#FAFAFA] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-white/5 border border-[#262626]">
                {language === 'en' ? 'Dashboard' : 'ড্যাশবোর্ড'}
              </span>
            </div>

          {/* Selected Field Context Card */}
          <div className="p-3.5 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#A3A3A3]">
              <span className="uppercase">{language === 'en' ? 'Active Field' : 'আপনার জমি'}</span>
              <button
                onClick={onChangeFieldLocation}
                className="text-[#FAFAFA] hover:underline font-bold text-[10px] uppercase cursor-pointer"
              >
                {language === 'en' ? 'Change' : 'বদলান'}
              </button>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#22C55E] shrink-0 mt-0.5" />
              <div className="min-w-0">
                <h4 className="font-display font-bold text-sm text-white truncate" title={locationBreadcrumb}>
                  {locationBreadcrumb}
                </h4>
                <p className="text-[10px] font-mono text-[#A3A3A3]">
                  {language === 'bn'
                    ? `${toBnDigits(fieldLat.toFixed(2))}° উ · ${toBnDigits(fieldLng.toFixed(2))}° পূ`
                    : `${fieldLat.toFixed(2)}° N · ${fieldLng.toFixed(2)}° E`}
                </p>
              </div>
            </div>

            {/* Active Priority Chip */}
            <div className="pt-2 border-t border-[#262626] flex items-center justify-between text-[10px]">
              <span className="text-[#A3A3A3] font-mono">{language === 'en' ? 'Priority' : 'লক্ষ্য'}:</span>
              <button
                onClick={onChangePriority}
                className="font-bold text-[#22C55E] hover:underline capitalize truncate max-w-[120px] cursor-pointer"
              >
                {formatPriorityLabel(selectedPriority, language)}
              </button>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <span className="px-3 text-[10px] font-mono uppercase tracking-wider text-[#737373] font-semibold block mb-2">
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
                      ? 'bg-[#22C55E] text-black font-bold'
                      : 'text-[#A3A3A3] hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#A3A3A3]'}`} />
                  <span className="truncate">{language === 'en' ? item.en : item.bn}</span>
                </button>
              );
            })}

            {/* Direct Link to Farmer Profile & Fields */}
            <a
              href="#/profile"
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#FAFAFA] hover:text-white hover:bg-[#404040]/10 transition-all text-left cursor-pointer border border-[#262626] mt-2"
            >
              <User className="w-4 h-4 shrink-0 text-[#FAFAFA]" />
              <span className="truncate">{language === 'en' ? 'Farmer Profile & Fields' : 'প্রোফাইল ও জমি'}</span>
            </a>
          </nav>

          {/* What-If Simulator Quick Trigger in Sidebar */}
          <div className="pt-2">
            <button
              onClick={() => setWhatIfActive(!whatIfActive)}
              className={`w-full p-3 rounded-2xl border text-xs font-mono transition-all cursor-pointer flex items-center justify-between ${
                whatIfActive
                  ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 shadow-md shadow-purple-900/30'
                  : 'bg-[#141414] border-[#262626] text-[#A3A3A3] hover:text-white hover:border-[#262626]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sliders className={`w-4 h-4 ${whatIfActive ? 'text-purple-400' : 'text-[#22C55E]'}`} />
                <span className="font-semibold">{language === 'en' ? 'What-If Simulator' : 'সিমুলেটর'}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${whatIfActive ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-[#A3A3A3]'}`}>
                {whatIfActive ? (language === 'en' ? 'Active' : 'চালু') : (language === 'en' ? 'Off' : 'বন্ধ')}
              </span>
            </button>
          </div>
        </div>

        {/* Sidebar Footer Utilities */}
        <div className="p-4 border-t border-[#262626] bg-[#0A0A0A] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
            <button
              onClick={onLogout}
              title={language === 'en' ? 'Exit to Public Website' : 'হোমে ফিরুন'}
              className="p-2 rounded-xl bg-white/5 hover:bg-[#FF5C5C]/20 border border-[#262626] text-[#A3A3A3] hover:text-[#FF5C5C] transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-mono"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold">{language === 'en' ? 'Exit' : 'হোমে ফিরুন'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DASHBOARD SUB-BAR (<1024px) */}
      <div className="lg:hidden sticky top-16 z-30 bg-[#0A0A0A] border-b border-[#262626] px-4 py-2.5 flex items-center justify-between">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626] text-xs font-medium text-[#FAFAFA] flex items-center gap-2 cursor-pointer hover:border-[#404040]"
          aria-label="Open field sections"
        >
          <Menu className="w-3.5 h-3.5 text-[#22C55E]" />
          <span className="font-semibold">{DASHBOARD_NAV_ITEMS.find((t) => t.id === activeTab)?.[language === 'en' ? 'en' : 'bn']}</span>
          <ChevronDown className="w-3 h-3 text-[#737373]" />
        </button>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#A3A3A3] truncate max-w-[150px]">{locationBreadcrumb}</span>
          <button
            onClick={() => setWhatIfActive(!whatIfActive)}
            className={`px-2.5 py-1 rounded-lg border text-xs font-mono cursor-pointer flex items-center gap-1 ${
              whatIfActive ? 'bg-purple-950/60 text-[#22C55E] border-[#262626]' : 'bg-[#141414] text-[#A3A3A3] border-[#262626]'
            }`}
          >
            <Sliders className="w-3 h-3 text-[#22C55E]" />
            <span>{whatIfActive ? (language === 'en' ? 'Sim on' : 'সিম চালু') : (language === 'en' ? 'Sim' : 'সিম')}</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-72 max-w-[85vw] bg-[#0A0A0A] h-full p-5 flex flex-col justify-between border-r border-[#262626] overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <BrandLogo imgClassName="h-7 w-auto object-contain mix-blend-screen shrink-0" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-[#A3A3A3] hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Location Context */}
              <div className="p-3 rounded-xl bg-[#141414] border border-[#262626] text-xs">
                <span className="text-[10px] text-[#A3A3A3] font-mono uppercase block">{language === 'en' ? 'Active Field' : 'নির্বাচিত জমি'}</span>
                <span className="font-bold text-white block mt-0.5">{locationBreadcrumb}</span>
                <button
                  onClick={() => { setMobileMenuOpen(false); onChangeFieldLocation(); }}
                  className="text-[11px] text-[#FAFAFA] underline mt-1 block cursor-pointer"
                >
                  {language === 'en' ? 'Change Location' : 'এলাকা বদলান'}
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
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#22C55E] text-black font-bold'
                          : 'text-[#A3A3A3] hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{language === 'en' ? item.en : item.bn}</span>
                    </button>
                  );
                })}

                <a
                  href="#/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-[#FAFAFA] hover:text-white hover:bg-[#404040]/10 transition-all text-left cursor-pointer border border-[#262626] mt-2"
                >
                  <User className="w-4 h-4 shrink-0 text-[#FAFAFA]" />
                  <span className="truncate">{language === 'en' ? 'Farmer Profile & Fields' : 'প্রোফাইল ও জমি'}</span>
                </a>
              </div>
            </div>

            <div className="pt-2 border-t border-[#262626] flex flex-col gap-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-mono text-slate-400">{language === 'en' ? 'Account:' : 'অ্যাকাউন্ট:'}</span>
                <UserMenu />
              </div>
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                className="w-full py-2.5 rounded-xl bg-white/5 border border-[#262626] text-xs font-mono text-center text-[#FF5C5C] cursor-pointer"
              >
                {language === 'en' ? 'Exit to Website' : 'হোমে ফিরুন'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Operational Sub-Bar (Desktop Sticky below Universal Header) */}
        <div className="hidden lg:flex sticky top-16 z-20 h-14 border-b border-[#262626] bg-[#0A0A0A] px-6 items-center justify-between shrink-0">
          {/* Breadcrumb & Field Identity */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-[#A3A3A3]">{language === 'en' ? 'AgriOrbit' : 'এগ্রিঅরবিট'}</span>
            <span className="text-white/30">/</span>
            <span className="text-white font-bold">{locationBreadcrumb}</span>
            <span className="text-white/30">/</span>
            <span className="text-[#22C55E] capitalize">
              {DASHBOARD_NAV_ITEMS.find((t) => t.id === activeTab)?.[language === 'en' ? 'en' : 'bn']}
            </span>
          </div>

          {/* Quick Status Chips */}
          <div className="flex items-center gap-3 text-xs">
            {/* Satellite Live Pulse Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#141414] border border-[#262626] text-[11px] font-mono text-slate-300">
              <span className={`w-2 h-2 rounded-full ${whatIfActive ? 'bg-purple-400 ' : loaded.mode === 'live' ? 'bg-[#22C55E]' : 'bg-[#404040]'}`} />
              <span>
                {whatIfActive
                  ? (language === 'en' ? 'Simulation Active' : 'সিমুলেশন চলছে')
                  : (() => {
                      if (loaded.mode === 'unavailable') {
                        return language === 'en' ? `Data unavailable for ${districtName.split(' ')[0]}` : `${districtName.split(' ')[0]}-এর তথ্য পাওয়া যায়নি`;
                      }
                      const rawDate = loaded?.data?.fetchedAt || conditions?.to;
                      if (!rawDate) {
                        return language === 'en' ? 'Data unavailable' : 'তথ্য পাওয়া যায়নি';
                      }
                      const dateObj = new Date(rawDate);
                      if (isNaN(dateObj.getTime())) {
                        return language === 'en' ? 'Data unavailable' : 'তথ্য পাওয়া যায়নি';
                      }
                      const dateStr = dateObj.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      });
                      if (loaded.mode === 'cache') {
                        return language === 'en' ? `Cached NASA POWER data from ${dateStr}` : `সংরক্ষিত নাসা পাওয়ার তথ্য (${dateStr})`;
                      }
                      return language === 'en' ? `NASA data · ${dateStr}` : `নাসা তথ্য · ${dateStr}`;
                    })()}
              </span>
            </div>

            {/* Coordinates */}
            <span className="text-[#A3A3A3] font-mono text-[11px] hidden lg:inline">
              {language === 'bn'
                ? `${toBnDigits(fieldLat.toFixed(2))}° উ, ${toBnDigits(fieldLng.toFixed(2))}° পূ`
                : `${fieldLat.toFixed(2)}°N, ${fieldLng.toFixed(2)}°E`}
            </span>

            {/* Quick What-If Toggle */}
            <button
              onClick={() => setWhatIfActive(!whatIfActive)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                whatIfActive
                  ? 'bg-purple-950/60 text-[#22C55E] border-[#262626] shadow-md shadow-purple-900/30'
                  : 'bg-white/5 hover:bg-white/10 text-slate-200 border-[#262626]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{language === 'en' ? 'Simulator' : 'সিমুলেটর'}</span>
              {whatIfActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] animate-pulse" />
              )}
            </button>
          </div>
        </div>

        {/* Short Term Weather & Agronomic Risk Alert Banner */}
        <ShortTermRiskAlert
          language={language}
          districtId={selectedDistrict}
          upazilaName={upazilaName}
          lat={fieldLat}
          lng={fieldLng}
          soilMoisture={activeSoil}
          priority={selectedPriority}
        />

        {/* Content Workspace */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OVERVIEW (EXECUTIVE WORKING DASHBOARD)                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'overview' && (
            <div className="space-y-8 animate-fadeIn scroll-mt-20">
              {/* 1. Active Field & Strategy Context Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-none">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#22C55E]/15 border border-[#262626] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#22C55E]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#FAFAFA]">
                        {language === 'en' ? 'Active Field Location' : 'নির্বাচিত জমি'}
                      </span>
                      <span className="text-white/20">·</span>
                      <span className="text-xs text-slate-400 font-mono">
                        {language === 'bn'
                          ? `${toBnDigits(fieldLat.toFixed(2))}° উ, ${toBnDigits(fieldLng.toFixed(2))}° পূ`
                          : `${fieldLat.toFixed(2)}° N, ${fieldLng.toFixed(2)}° E`}
                      </span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white mt-0.5">
                      {locationBreadcrumb}
                    </h3>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Priority Badge */}
                  <div className="px-3 py-1.5 rounded-xl bg-[#0A0A0A] border border-[#262626] flex items-center gap-2">
                    <span className="text-slate-400 font-medium">{language === 'en' ? 'Priority:' : 'চাহিদা:'}</span>
                    <span className="font-bold text-[#22C55E] capitalize">
                      {formatPriorityLabel(selectedPriority, language)}
                    </span>
                    <button
                      onClick={onChangePriority}
                      className="text-[11px] text-[#FAFAFA] hover:underline font-semibold ml-1 cursor-pointer"
                    >
                      {language === 'en' ? 'Change' : 'পরিবর্তন'}
                    </button>
                  </div>

                  {/* Change Field Location Button */}
                  <button
                    onClick={onChangeFieldLocation}
                    className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-white font-medium hover:text-[#22C55E] transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Compass className="w-3.5 h-3.5 text-[#FAFAFA]" />
                    <span>{language === 'en' ? 'Change Field' : 'জমি পরিবর্তন'}</span>
                  </button>
                </div>
              </div>

              {/* 2. PRIMARY FOCUS: THE HERO RECOMMENDED FARMER ACTION CARD */}
              <div className="p-6 sm:p-8 rounded-xl bg-[#141414] border border-[#262626] shadow-none relative overflow-hidden">
                {/* Top Tag Row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-[#22C55E]/15 text-[#22C55E] border border-[#262626] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Primary Recommended Action' : 'শীর্ষ প্রস্তাবিত পদক্ষেপ'}</span>
                    </span>
                    <span className="text-xs text-slate-300 font-medium">
                      {language === 'en' ? 'Upcoming Rabi Season (Nov – Feb)' : 'আসন্ন রবি মৌসুম (নভেম্বর – ফেব্রুয়ারি)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">{language === 'en' ? 'Suitability Score:' : 'স্কোর:'}</span>
                    <span className="px-3 py-1 rounded-xl bg-[#0A0A0A] border border-[#262626] text-sm font-bold text-[#22C55E]">
                      {language === 'bn'
                        ? `${toBnDigits((rankedCrops[0] ?? { suitabilityScore: 88 }).suitabilityScore)}/${toBnDigits(100)} (উপযুক্ত)`
                        : `${(rankedCrops[0] ?? { suitabilityScore: 88 }).suitabilityScore}/100 (Match)`}
                    </span>
                  </div>
                </div>

                {/* Main Action Headline */}
                <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight leading-snug">
                  {language === 'en'
                    ? `Plant ${(rankedCrops[0] ?? { nameEn: 'Lentil' }).nameEn} (${(rankedCrops[0] ?? { nameBn: 'মসুর ডাল' }).nameBn}) as Primary Anchor Crop`
                    : `আসন্ন রবি মৌসুমে প্রধান ফসল হিসেবে ${(rankedCrops[0] ?? { nameBn: 'মসুর ডাল' }).nameBn} (${(rankedCrops[0] ?? { nameEn: 'Lentil' }).nameEn}) চাষ করুন`}
                </h2>

                {/* Why It Matters & Next Step Grid */}
                <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4 pt-5 border-t border-[#262626]">
                  {/* Why this action matters */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A]/80 border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#FAFAFA]">
                      <Info className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Why This Matters' : 'কেন এটি গুরুত্বপূর্ণ'}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      {language === 'en'
                        ? `NASA SMAP satellite snapshot records topsoil moisture at ${(activeSoil !== null ? activeSoil.toFixed(2) : 'N/A')} m³/m³ ${conditions.rainUnavailable ? 'with 30-day precipitation data unavailable' : `with 30-day precipitation of ${Math.round(activeRain)} mm`}. ${(rankedCrops[0] ?? { nameEn: 'Lentil' }).nameEn} requires significantly fewer supplemental irrigations than flood-irrigated winter Boro rice, reducing diesel pumping and conserving precious groundwater according to BARI guidelines.`
                        : `নাসার স্ম্যাপ উপগ্রহের স্ন্যাপশট অনুযায়ী মাটির আর্দ্রতা ${activeSoil !== null ? `${toBnDigits(activeSoil.toFixed(2))} m³/m³` : 'তথ্য নেই'} ${conditions.rainUnavailable ? '(৩০ দিনের বৃষ্টিপাতের তথ্য সাময়িকভাবে অনুপলব্ধ)' : `এবং ৩০ দিনের মোট বৃষ্টিপাত ${toBnDigits(Math.round(activeRain))} মিমি`}। বিএআরআই নির্দেশনা অনুযায়ী বোরো ধানের তুলনায় ${(rankedCrops[0] ?? { nameBn: 'মসুর ডাল' }).nameBn} চাষে অনেক কম সেচ লাগে, যা ডিজেল পাম্পিং কমায় এবং ভূগর্ভস্থ পানি সংরক্ষণ করে।`}
                    </p>
                  </div>

                  {/* Practical Next Step */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0A0A0A]/80 border border-[#262626] space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#22C55E]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{language === 'en' ? 'Practical Next Step' : 'পরবর্তী বাস্তব পদক্ষেপ'}</span>
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed font-normal">
                      {language === 'en'
                        ? `Prepare land with shallow tillage to retain residual soil moisture. Procure certified BARI seeds and complete sowing between November 1 and 20 before terminal winter heat sets in.`
                        : `মাটির রস ধরে রাখতে হালকা চাষ দিয়ে জমি প্রস্তুত করুন। বিএআরআই অনুমোদিত প্রত্যয়িত বীজ সংগ্রহ করুন এবং শীতের আগাম গরমের ঝুঁকি এড়াতে ১ থেকে ২০ নভেম্বরের মধ্যে বীজ বপন সম্পন্ন করুন।`}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => handleTabClick('crops')}
                    className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-sm cursor-pointer flex items-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <span>{language === 'en' ? 'View 3-Season Rotation Plan' : '৩-মৌসুমী পরিক্রমা দেখুন'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setExplainCrop(rankedCrops[0] ?? null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-white font-medium text-sm cursor-pointer flex items-center gap-2 transition-colors"
                  >
                    <HelpCircle className="w-4 h-4 text-[#FAFAFA]" />
                    <span>{language === 'en' ? 'Explain Scoring Logic' : 'স্কোরের নিয়ম দেখুন'}</span>
                  </button>
                </div>
              </div>

              {/* 3. Field Condition Cards (5-KPI Grid: Rainfall, Soil Moisture, Max Temp, Relative Humidity, ET0) */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* 1. 30-Day Rainfall */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium">{language === 'en' ? '30-Day Rain' : '৩০ দিনের বৃষ্টি'}</span>
                      <span
                        className="text-[#FAFAFA] font-semibold text-[11px] border-b border-dotted border-white/30 cursor-help"
                        title={language === 'en' ? 'NASA POWER ~50 km grid; neighboring upazilas may show similar values.' : 'NASA POWER ~৫০ কিমি গ্রিড; পাশের উপজেলায় একই মান আসতে পারে।'}
                      >
                        NASA POWER <span className="text-[10px] text-[#A3A3A3] font-normal">(~50km)</span>
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-display">
                      {conditions.rainUnavailable ? (
                        <span className="text-amber-400 text-sm font-sans font-medium">
                          {language === 'en' ? 'Data Unavailable' : 'তথ্য নেই'}
                        </span>
                      ) : (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(activeRain)) : Math.round(activeRain)}{' '}
                          <span className="text-sm text-slate-400 font-normal">{language === 'bn' ? 'মিমি' : 'mm'}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#262626] text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1" title={`${language === 'en' ? 'Net Water Balance = Rainfall' : 'নিট পানি ভারসাম্য = বৃষ্টি'} (${Math.round(activeRain)} mm) − ET₀ Demand (${Math.round(conditions.et0Total)} mm) = ${activeWaterBalance >= 0 ? '+' : ''}${Math.round(activeWaterBalance)} mm`}>
                        <span>{language === 'en' ? 'Net balance:' : 'নিট পানি:'}</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </span>
                      <span className={`font-semibold ${activeWaterBalance < -50 ? 'text-[#FF5C5C]' : 'text-[#22C55E]'}`}>
                        {language === 'bn'
                          ? (activeWaterBalance >= 0 ? `+${toBnDigits(Math.round(activeWaterBalance))} মিমি` : `−${toBnDigits(Math.abs(Math.round(activeWaterBalance)))} মিমি`)
                          : (activeWaterBalance >= 0 ? `+${Math.round(activeWaterBalance)} mm` : `${Math.round(activeWaterBalance)} mm`)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Soil Moisture */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium">{language === 'en' ? 'Soil Moisture' : 'মাটির আর্দ্রতা'}</span>
                      <span className="text-[#22C55E] font-semibold text-[11px]" title="NASA SMAP L3 Soil Moisture">
                        {whatIfActive
                          ? (language === 'en' ? 'NASA SMAP · Simulated' : 'নাসা স্ম্যাপ · সিমুলেশন')
                          : smapData
                          ? `NASA SMAP · ${smapData.date} (${smapData.pass})`
                          : (language === 'en' ? 'NASA SMAP · No data' : 'নাসা স্ম্যাপ · তথ্য নেই')}
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-display flex items-baseline gap-2">
                      {whatIfActive ? (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(simSoil * 100)) : Math.round(simSoil * 100)}%{' '}
                          <span className="text-xs text-slate-400 font-normal font-mono">
                            ({language === 'bn' ? toBnDigits(simSoil.toFixed(2)) : simSoil.toFixed(2)} m³/m³)
                          </span>
                        </>
                      ) : smapData ? (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(smapData.value * 100)) : Math.round(smapData.value * 100)}%{' '}
                          <span className="text-xs text-slate-400 font-normal font-mono">
                            ({language === 'bn' ? toBnDigits(smapData.value.toFixed(2)) : smapData.value.toFixed(2)} m³/m³)
                          </span>
                        </>
                      ) : (
                        <span className="text-lg text-slate-400 font-normal font-mono">
                          {language === 'en' ? 'No data' : 'তথ্য নেই'}
                        </span>
                      )}
                    </div>
                    {!whatIfActive && isSoilFlaggedWater && (
                      <div className="mt-1 text-[11px] text-amber-400 font-medium">
                        {language === 'en' ? '⚠ may include open water' : '⚠ উন্মুক্ত জলাশয় অন্তর্ভুক্ত থাকতে পারে'}
                      </div>
                    )}
                    {/* Gauge bar */}
                    {(whatIfActive || smapData) && (
                      <div className="w-full bg-white/10 h-1.5 rounded-full mt-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            !whatIfActive && isSoilFlaggedWater
                              ? 'bg-amber-400'
                              : (whatIfActive ? simSoil : smapData!.value) < 0.15
                              ? 'bg-[#FF5C5C]'
                              : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                              ? 'bg-[#22C55E]'
                              : 'bg-[#404040]'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(10, ((whatIfActive ? simSoil : smapData!.value) / 0.40) * 100))}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-slate-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <span>{language === 'en' ? 'Status:' : 'অবস্থা:'}</span>
                      <span className="text-[10px] font-mono text-[#737373] bg-white/5 px-1 py-0.5 rounded border border-[#262626]">
                        {language === 'en' ? '9 km' : '৯ কিমি'}
                      </span>
                    </span>
                    <span
                      className={`font-semibold ${
                        !whatIfActive && !smapData
                          ? 'text-slate-400'
                          : !whatIfActive && isSoilFlaggedWater
                          ? 'text-amber-400'
                          : (whatIfActive ? simSoil : smapData!.value) < 0.15
                          ? 'text-[#FF5C5C]'
                          : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                          ? 'text-[#22C55E]'
                          : 'text-[#FAFAFA]'
                      }`}
                    >
                      {!whatIfActive && !smapData
                        ? (language === 'en' ? 'No data' : 'তথ্য নেই')
                        : !whatIfActive && isSoilFlaggedWater
                        ? (language === 'en' ? 'Uncertain' : 'অনিশ্চিত')
                        : (whatIfActive ? simSoil : smapData!.value) < 0.15
                        ? (language === 'en' ? 'Deficit' : 'ঘাটতি')
                        : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                        ? (language === 'en' ? 'Optimal' : 'বপন উপযোগী')
                        : (language === 'en' ? 'Adequate' : 'পর্যাপ্ত')}
                    </span>
                  </div>
                </div>

                {/* 3. Daily Max Temp */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium">{language === 'en' ? 'Max Day Temp' : 'সর্বোচ্চ তাপমাত্রা'}</span>
                      <span
                        className="text-[#FAFAFA] font-semibold text-[11px] border-b border-dotted border-white/30 cursor-help"
                        title={language === 'en' ? 'NASA POWER ~50 km grid; neighboring upazilas may show similar values.' : 'NASA POWER ~৫০ কিমি গ্রিড; পাশের উপজেলায় একই মান আসতে পারে।'}
                      >
                        NASA POWER <span className="text-[10px] text-[#A3A3A3] font-normal">(~50km)</span>
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-display">
                      {language === 'bn' ? toBnDigits(activeMaxTemp.toFixed(1)) : activeMaxTemp.toFixed(1)}{' '}
                      <span className="text-sm text-slate-400 font-normal">{language === 'bn' ? '° সে.' : '°C'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#262626] text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? '30d Mean:' : '৩০ দিনের গড়:'}</span>
                      <span className="font-semibold text-slate-200">
                        {language === 'bn' ? `${toBnDigits(conditions.tMaxAvg.toFixed(1))}° সে.` : `${conditions.tMaxAvg.toFixed(1)}°C`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 4. Relative Humidity */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium">{language === 'en' ? 'Air Humidity' : 'বাতাসের আর্দ্রতা'}</span>
                      <span
                        className="text-sky-300 font-semibold text-[11px] border-b border-dotted border-sky-300/30 cursor-help"
                        title={language === 'en' ? 'NASA POWER ~50 km grid; neighboring upazilas may show similar values.' : 'NASA POWER ~৫০ কিমি গ্রিড; পাশের উপজেলায় একই মান আসতে পারে।'}
                      >
                        NASA POWER <span className="text-[10px] text-sky-400/80 font-normal">(~50km)</span>
                      </span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-display">
                      {language === 'bn' ? toBnDigits(Math.round(conditions.rh)) : Math.round(conditions.rh)}{' '}
                      <span className="text-sm text-slate-400 font-normal">%</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#262626] text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? 'Sensor:' : 'সেন্সর:'}</span>
                      <span className="font-medium text-slate-300">{language === 'en' ? 'Relative Humidity' : 'বাতাসের আর্দ্রতা'}</span>
                    </div>
                  </div>
                </div>

                {/* 5. Crop Water Need (ET0) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between col-span-2 sm:col-span-1">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-medium">{language === 'en' ? 'Crop Water Need' : 'ফসলের পানির চাহিদা'}</span>
                      <span className="text-[#22C55E] font-semibold text-[11px]">FAO-56</span>
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1 font-display">
                      {language === 'bn' ? toBnDigits(conditions.et0.toFixed(1)) : conditions.et0.toFixed(1)}{' '}
                      <span className="text-sm text-slate-400 font-normal">{language === 'bn' ? 'মিমি/দিন' : 'mm/d'}</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2.5 border-t border-[#262626] text-xs text-slate-400">
                    <div className="flex justify-between items-center">
                      <span>{language === 'en' ? 'Total Demand:' : 'মোট চাহিদা:'}</span>
                      <span className="font-semibold text-slate-200">
                        {language === 'bn' ? `${toBnDigits(Math.round(conditions.et0Total))} মিমি` : `${Math.round(conditions.et0Total)} mm`}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two-Column Operational Layout: Top Crops (Left) & Rotation Timeline (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Top 3 Recommended Crops (7 Cols) */}
                <div className="lg:col-span-7 space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <Sprout className="w-4 h-4 text-[#22C55E]" />
                      <h3 className="font-display font-bold text-lg text-white">
                        {language === 'en' ? 'Top Crop Recommendations' : 'শীর্ষ প্রস্তাবিত ফসল'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabClick('crops')}
                      className="text-xs font-mono text-[#FAFAFA] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>
                        {language === 'en'
                          ? `See all ${rankedCrops.length} crops (tobacco excluded) →`
                          : `অনুমোদিত সকল ${toBnDigits(rankedCrops.length)}টি ফসল (তামাক ব্যতীত) →`}
                      </span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rankedCrops.slice(0, 3).map((crop, idx) => (
                      <div
                        key={crop.id}
                        className="p-4 rounded-xl bg-[#141414] border border-[#262626] hover:border-[#404040] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#22C55E]/15 text-[#22C55E] border border-[#262626]">
                              #{language === 'bn' ? toBnDigits(idx + 1) : idx + 1}
                            </span>
                            <h4 className="font-display font-bold text-base text-white truncate">
                              {language === 'en' ? crop.nameEn : crop.nameBn}
                            </h4>
                            <span className="text-xs font-mono text-slate-300">
                              ({language === 'en' ? crop.seasonEn : crop.seasonBn})
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 line-clamp-1">
                            {language === 'en' ? crop.shortWhyEn : crop.shortWhyBn}
                          </p>
                          <div className="mt-1 flex items-center gap-3 text-xs font-mono text-slate-400">
                            <span>{language === 'en' ? 'Water' : 'পানি'}: <strong className="text-white">{language === 'en' ? crop.waterRequirementEn : crop.waterRequirementBn}</strong></span>
                            <span>•</span>
                            <span>
                              {language === 'bn' ? toBnDigits(crop.durationDays) : crop.durationDays} {language === 'en' ? 'Days' : 'দিন'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          <div className="text-right">
                            <span className="font-mono text-xl font-bold text-[#22C55E] block leading-none">
                              {language === 'bn' ? `${toBnDigits(crop.suitabilityScore)}/${toBnDigits(100)}` : `${crop.suitabilityScore}/100`}
                            </span>
                            <span className="text-[9px] font-mono uppercase text-[#A3A3A3]">
                              {language === 'en' ? 'Match' : 'উপযুক্ত'}
                            </span>
                          </div>
                          <button
                            onClick={() => setExplainCrop(crop)}
                            className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-[#262626] text-xs font-mono text-[#FAFAFA] cursor-pointer"
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
                  <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#FAFAFA]" />
                      <h3 className="font-display font-bold text-lg text-white">
                        {language === 'en' ? 'Annual Rotation Sequence' : 'বার্ষিক আবর্তন পরিক্রমা'}
                      </h3>
                    </div>
                    <button
                      onClick={() => handleTabClick('crops')}
                      className="text-xs font-mono text-[#FAFAFA] hover:underline cursor-pointer"
                    >
                      {language === 'en' ? 'Details →' : 'বিস্তারিত →'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#141414] border border-[#262626] space-y-3">
                    {/* Season Trail */}
                    <div className="space-y-2.5">
                      {engineResult.picks.map((pick, i) => {
                        const seasonLabel = pick.season === 'rabi' ? (language === 'en' ? 'Rabi' : 'রবি') : pick.season === 'kharif1' ? (language === 'en' ? 'Kharif-1' : 'খরিফ-১') : (language === 'en' ? 'Kharif-2' : 'খরিফ-২');
                        const months = language === 'bn'
                          ? (pick.season === 'rabi' ? 'নভেম্বর–ফেব্রুয়ারি' : pick.season === 'kharif1' ? 'মার্চ–জুন' : 'জুলাই–অক্টোবর')
                          : (pick.season === 'rabi' ? 'Nov–Feb' : pick.season === 'kharif1' ? 'Mar–Jun' : 'Jul–Oct');
                        return (
                          <div key={pick.season} className="p-3 rounded-xl bg-[#0A0A0A] border border-[#262626] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] font-mono flex items-center justify-center font-bold text-[#22C55E]">
                                {language === 'en' ? `0${i + 1}` : `০${toBnDigits(i + 1)}`}
                              </span>
                              <div>
                                <h5 className="font-display font-bold text-sm text-white">
                                  {language === 'en' ? pick.crop.nameEn : pick.crop.nameBn}
                                </h5>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {seasonLabel} ({months})
                                </span>
                              </div>
                            </div>
                            <span className="font-mono text-xs font-bold text-[#22C55E]">
                              {language === 'bn' ? toBnDigits(pick.score) : pick.score}%
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Rule Badges */}
                    <div className="pt-3 border-t border-[#262626] space-y-1.5 text-xs font-mono text-slate-300">
                      <div className="flex items-center gap-1.5 text-[#22C55E]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{language === 'en' ? 'Rule A: Family Alternation Verified' : 'নিয়ম ১: একই ফসল বারবার নয়'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#FAFAFA]">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{language === 'en' ? 'Rule B: Biological N-Balance Active' : 'নিয়ম ২: নাইট্রোজেন সংবন্ধন সক্রিয়'}</span>
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

              {/* Collapsible Advanced Decision Tools: What-If Environmental Simulator */}
              <div className="rounded-2xl bg-[#141414] border border-[#262626] overflow-hidden shadow-none transition-all">
                <button
                  type="button"
                  onClick={() => setWhatIfActive(!whatIfActive)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-colors ${
                      whatIfActive ? 'bg-purple-950/60 border-purple-500/40 text-purple-300' : 'bg-white/5 border-[#262626] text-slate-300'
                    }`}>
                      <Sliders className="w-5 h-5 text-[#22C55E]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-bold">
                          {language === 'en' ? 'Advanced Decision Tool' : 'কৃষি সিদ্ধান্ত নেওয়ার টুল'}
                        </span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded font-mono ${
                          whatIfActive ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-[#A3A3A3]'
                        }`}>
                          {whatIfActive ? (language === 'en' ? 'SIMULATOR ACTIVE' : 'সিমুলেটর চালু') : (language === 'en' ? 'READY' : 'প্রস্তুত')}
                        </span>
                      </div>
                      <h4 className="font-display font-bold text-base text-white mt-0.5">
                        {language === 'en' ? 'What-If Environmental Stress Simulator' : 'পরিবেশগত খরা ও তাপমাত্রা সিমুলেটর'}
                      </h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#22C55E] font-medium hidden sm:inline">
                      {whatIfActive
                        ? (language === 'en' ? 'Hide Controls' : 'লুকান')
                        : (language === 'en' ? 'Simulate Climate Scenarios' : 'সিমুলেশন চালান')}
                    </span>
                    {whatIfActive ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Collapsed Simulator Panel Body */}
                {whatIfActive && (
                  <div className="p-5 sm:p-6 border-t border-[#262626] bg-[#0A0A0A]/90 space-y-5 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#262626]">
                      <div>
                        <p className="text-xs text-slate-300">
                          {language === 'en'
                            ? 'Adjust environmental variables below to test how different drought or heatwave conditions impact crop suitability scores and rotation plans in real time.'
                            : 'নিচের স্লাইডারগুলো পরিবর্তন করে দেখুন কীভাবে খরা বা অতিরিক্ত তাপমাত্রা ফসলের সম্ভাবনা এবং ৩-মৌসুমের শস্য পর্যায় বদলে দেয়।'} 
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSimSoil(smapData?.value ?? 0.22);
                            setSimRain(Math.round(conditions.rain30));
                            setSimMaxTemp(Math.round(conditions.tMax30));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs font-mono text-[#22C55E] cursor-pointer flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{language === 'en' ? 'Reset to NASA Baseline' : 'মূল মানে ফেরত'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Scenario Preset Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono text-[#A3A3A3] font-medium mr-1">
                        {language === 'en' ? 'Quick Scenarios:' : 'পরিস্থিতি বাছুন:'}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSoil(0.12);
                          setSimRain(15);
                          setSimMaxTemp(36);
                        }}
                        className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {language === 'bn' ? `তীব্র খরা (${toBnDigits('0.12')} m³, ${toBnDigits(15)} মিমি)` : 'Severe Drought (0.12 m³, 15mm)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSoil(0.28);
                          setSimRain(85);
                          setSimMaxTemp(28);
                        }}
                        className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {language === 'bn' ? `অনুকূল বপন (${toBnDigits('0.28')} m³, ${toBnDigits(85)} মিমি)` : 'Optimal Sowing (0.28 m³, 85mm)'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSimSoil(0.18);
                          setSimRain(35);
                          setSimMaxTemp(38);
                        }}
                        className="px-3 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-[#262626] text-xs text-slate-200 hover:text-white transition-colors cursor-pointer"
                      >
                        {language === 'bn' ? `তাপদাহ (${toBnDigits(38)}° সে.)` : 'Heatwave Blast (38°C)'}
                      </button>
                    </div>

                    {/* The 3 Sliders */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      {/* 1. Soil Moisture Slider */}
                      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium">
                            {language === 'en' ? 'SMAP Soil Moisture' : 'মাটির আর্দ্রতা'}
                          </span>
                          <span className="font-mono text-sm font-bold text-[#FAFAFA]">
                            {language === 'bn'
                              ? `${toBnDigits(Math.round(simSoil * 100))}% (${toBnDigits(simSoil.toFixed(2))} m³/m³)`
                              : `${Math.round(simSoil * 100)}% (${simSoil.toFixed(2)} m³/m³)`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0.10"
                          max="0.40"
                          step="0.01"
                          value={simSoil}
                          onChange={(e) => setSimSoil(parseFloat(e.target.value))}
                          className="w-full accent-[#22C55E] cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span className={simSoil < 0.15 ? 'text-[#FF5C5C] font-bold' : ''}>Deficit (&lt;0.15)</span>
                          <span className={simSoil >= 0.25 && simSoil <= 0.30 ? 'text-[#22C55E] font-bold' : ''}>Target (0.25–0.30)</span>
                        </div>
                      </div>

                      {/* 2. Rainfall Slider */}
                      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium">
                            {language === 'en' ? '30-Day Rain' : '৩০ দিনের বৃষ্টি'}
                          </span>
                          <span className="font-mono text-sm font-bold text-[#22C55E]">
                            {language === 'bn' ? toBnDigits(simRain) : simRain}{' '}
                            <span className="text-[11px] font-normal text-slate-400">{language === 'bn' ? 'মিমি' : 'mm'}</span>
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="300"
                          step="5"
                          value={simRain}
                          onChange={(e) => setSimRain(parseInt(e.target.value, 10))}
                          className="w-full accent-[#22C55E] cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span className={simRain < 50 ? 'text-[#FF5C5C] font-bold' : ''}>Dry (&lt;50mm)</span>
                          <span className={simRain > 150 ? 'text-sky-400 font-bold' : ''}>Heavy (&gt;150mm)</span>
                        </div>
                      </div>

                      {/* 3. Max Temperature Slider */}
                      <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-300 font-medium">
                            {language === 'en' ? 'Daily Max Temp' : 'সর্বোচ্চ তাপমাত্রা'}
                          </span>
                          <span className="font-mono text-sm font-bold text-white">
                            {language === 'bn' ? `${toBnDigits(simMaxTemp)}° সে.` : `${simMaxTemp}°C`}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="42"
                          step="1"
                          value={simMaxTemp}
                          onChange={(e) => setSimMaxTemp(parseInt(e.target.value, 10))}
                          className="w-full accent-[#22C55E] cursor-pointer"
                        />
                        <div className="flex justify-between text-[11px] font-mono text-slate-400">
                          <span>Mild (25°C)</span>
                          <span className={simMaxTemp > 35 ? 'text-[#FF5C5C] font-bold' : ''}>Heatwave (&gt;35°C)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: FIELD CONDITIONS (ENVIRONMENTAL TELEMETRY & SIMULATOR)     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'conditions' && (
            <div className="space-y-8 animate-fadeIn scroll-mt-20">
              <div className="pb-4 border-b border-[#262626]">
                <span className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider font-bold block mb-1">
                  {language === 'en' ? 'Environmental Field Data' : 'জমির পরিবেশের তথ্য'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? `Field Observations for ${upazilaName}` : `${upazilaName}-এর উপগ্রহ পর্যবেক্ষণ`}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {language === 'en'
                    ? 'NASA Earth observation radiometers and weather forecast data monitoring soil rootzone, moisture balance, and thermal levels.'
                    : 'নাসার স্যাটেলাইট তথ্য ও পূর্বাভাস, যা মাটির রস, বাষ্পীভবন ও তাপমাত্রা জানায়।'} 
                </p>
              </div>

              {/* Telemetry 3-Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Rainfall */}
                <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA POWER"
                        status={whatIfActive ? 'simulated' : loaded.mode === 'live' ? 'live' : loaded.mode === 'cache' ? 'cached' : loaded.mode === 'unavailable' ? 'unavailable' : 'snapshot'}
                        date={loaded.data?.fetchedAt ? loaded.data.fetchedAt.split('T')[0] : undefined}
                        language={language}
                      />
                      <span className={`font-mono text-xs font-semibold ${activeWaterBalance < -50 ? 'text-[#FF5C5C]' : 'text-[#22C55E]'}`}>
                        {language === 'bn'
                          ? (activeWaterBalance < 0 ? `−${toBnDigits(Math.abs(Math.round(activeWaterBalance)))} মিমি নিট` : `+${toBnDigits(Math.round(activeWaterBalance))} মিমি নিট`)
                          : (activeWaterBalance < 0 ? `${Math.round(activeWaterBalance)} mm Net` : `+${Math.round(activeWaterBalance)} mm Net`)}
                      </span>
                    </div>

                    <div className="font-mono text-4xl font-bold text-white mb-1">
                      {conditions.rainUnavailable ? (
                        <span className="text-2xl text-[#A3A3A3] font-normal font-mono">
                          {language === 'en' ? 'Data Unavailable' : 'তথ্য নেই'}
                        </span>
                      ) : (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(activeRain)) : Math.round(activeRain)}{' '}
                          <span className="text-base text-slate-400 font-normal">{language === 'bn' ? 'মিমি' : 'mm'}</span>
                        </>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {conditions.rainUnavailable
                        ? (language === 'en'
                            ? 'Precipitation telemetry is temporarily unavailable for this region.'
                            : 'এই অঞ্চলের বৃষ্টিপাতের উপগ্রহ তথ্য সাময়িকভাবে অনুপলব্ধ।')
                        : (language === 'en'
                            ? `Cumulative 30-day precipitation. Net balance vs crop ET₀ demand is ${Math.round(activeWaterBalance)} mm.`
                            : `৩০ দিনের মোট বৃষ্টিপাত। বাষ্পীভবন চাহিদার তুলনায় নিট পানির অবস্থা ${toBnDigits(Math.round(activeWaterBalance))} মিমি।`)}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-[#262626] flex justify-between text-xs font-mono text-slate-400">
                    <span>{language === 'en' ? 'Crop Water Demand (ET₀)' : 'ফসলের বাষ্পীভবন চাহিদা (ET₀)'}</span>
                    <span className="text-white font-bold">
                      {language === 'bn'
                        ? `${toBnDigits(Math.round(conditions.et0Total))} মিমি (${toBnDigits(conditions.et0.toFixed(1))} মিমি/দিন)`
                        : `${Math.round(conditions.et0Total)} mm (${conditions.et0.toFixed(1)} mm/d)`}
                    </span>
                  </div>
                </div>

                {/* 2. Soil Moisture */}
                <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <DataTileStatusBadge
                        sourceName="NASA SMAP"
                        status={whatIfActive ? 'simulated' : smapData ? (isSmapFresh ? 'daily' : 'snapshot') : 'unavailable'}
                        customLabel={
                          whatIfActive
                            ? (language === 'en' ? 'NASA SMAP · Simulated' : 'নাসা স্ম্যাপ · সিমুলেশন')
                            : smapData
                            ? (language === 'en'
                                ? `NASA SMAP · observed ${formatBadgeDate(smapData.date, 'en')} (${smapData.pass})`
                                : `নাসা স্ম্যাপ · পর্যবেক্ষণ ${formatBadgeDate(smapData.date, 'bn')} (${smapData.pass})`)
                            : (language === 'en' ? 'NASA SMAP · No data' : 'নাসা স্ম্যাপ · তথ্য নেই')
                        }
                        language={language}
                      />
                      <span
                        className={`font-mono text-xs font-semibold ${
                          !whatIfActive && !smapData
                            ? 'text-slate-400'
                            : !whatIfActive && isSoilFlaggedWater
                            ? 'text-amber-400'
                            : (whatIfActive ? simSoil : smapData!.value) < 0.15
                            ? 'text-[#FF5C5C]'
                            : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                            ? 'text-[#22C55E]'
                            : 'text-[#FAFAFA]'
                        }`}
                      >
                        {!whatIfActive && !smapData
                          ? (language === 'en' ? 'No data' : 'তথ্য নেই')
                          : !whatIfActive && isSoilFlaggedWater
                          ? (language === 'en' ? 'Uncertain' : 'অনিশ্চিত')
                          : (whatIfActive ? simSoil : smapData!.value) < 0.15
                          ? (language === 'en' ? 'Moisture Deficit' : 'আর্দ্রতা ঘাটতি')
                          : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                          ? (language === 'en' ? 'Optimal Sowing' : 'বপন উপযোগী')
                          : (language === 'en' ? 'Adequate' : 'পর্যাপ্ত')}
                      </span>
                    </div>

                    <div className="font-mono text-4xl font-bold text-white mb-1 flex items-baseline gap-2">
                      {whatIfActive ? (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(simSoil * 100)) : Math.round(simSoil * 100)}%{' '}
                          <span className="text-xs text-slate-400 font-normal font-mono">
                            ({language === 'bn' ? toBnDigits(simSoil.toFixed(2)) : simSoil.toFixed(2)} m³/m³)
                          </span>
                        </>
                      ) : smapData ? (
                        <>
                          {language === 'bn' ? toBnDigits(Math.round(smapData.value * 100)) : Math.round(smapData.value * 100)}%{' '}
                          <span className="text-xs text-slate-400 font-normal font-mono">
                            ({language === 'bn' ? toBnDigits(smapData.value.toFixed(2)) : smapData.value.toFixed(2)} m³/m³)
                          </span>
                        </>
                      ) : (
                        <span className="text-2xl text-slate-400 font-normal font-mono">
                          {language === 'en' ? 'No data' : 'তথ্য নেই'}
                        </span>
                      )}
                    </div>

                    {!whatIfActive && isSoilFlaggedWater && (
                      <div className="mb-2 text-xs text-amber-400 font-medium">
                        {language === 'en' ? '⚠ may include open water' : '⚠ উন্মুক্ত জলাশয় অন্তর্ভুক্ত থাকতে পারে'}
                      </div>
                    )}

                    {(whatIfActive || smapData) && (
                      <>
                        <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              !whatIfActive && isSoilFlaggedWater
                                ? 'bg-amber-400'
                                : (whatIfActive ? simSoil : smapData!.value) < 0.15
                                ? 'bg-[#FF5C5C]'
                                : (whatIfActive ? simSoil : smapData!.value) >= 0.25 && (whatIfActive ? simSoil : smapData!.value) <= 0.30
                                ? 'bg-[#22C55E]'
                                : 'bg-[#404040]'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(
                                  10,
                                  (((whatIfActive ? simSoil : smapData!.value) / 0.4) * 100)
                                )
                              )}%`,
                            }}
                          />
                        </div>
                        <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                          <span>0.00</span>
                          <span>0.15 (Deficit)</span>
                          <span>0.25–0.30 (Ideal)</span>
                          <span>0.40+</span>
                        </div>
                      </>
                    )}

                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {language === 'en'
                        ? 'Topsoil 0–5 cm moisture level via L-band radiometer. Informs seed germination capacity and surface soil drying.'
                        : '০–৫ সেমি শিকড় স্তরের আর্দ্রতা (L-ব্যান্ড রেডিওমিটার, মেঘ ভেদ করতে সক্ষম)। বীজ গজানো ও ফসলের শিকড় প্রসারণের সক্ষমতা নির্দেশ করে।'}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-2 font-mono leading-relaxed border-t border-[#262626] pt-2">
                      {language === 'en'
                        ? 'Measured at the district HQ point (SMAP 9 km).'
                        : 'জেলা সদর দফতর বিন্দুতে পরিমাপকৃত (SMAP ৯ কিমি)।'}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-[#262626] space-y-1.5 text-xs font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>{language === 'en' ? 'Relative Humidity' : 'বাতাসের আপেক্ষিক আর্দ্রতা'}</span>
                      <span className="text-white font-semibold">
                        {language === 'bn' ? `${toBnDigits(Math.round(conditions.rh))}% RH` : `${Math.round(conditions.rh)}% RH`}
                      </span>
                    </div>
                    {jaxaData && (
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'Cross-Check: JAXA AMSR2' : 'যাচাই: জাক্সা এএমএসআর২'}</span>
                        <span className="text-white font-semibold">
                          {language === 'bn' ? `${toBnDigits(jaxaData.amsr2SoilMoisture.toFixed(2))} m³/m³` : `${jaxaData.amsr2SoilMoisture.toFixed(2)} m³/m³`}
                        </span>
                      </div>
                    )}
                    {nisarData && (
                      <div className="flex justify-between">
                        <span>{language === 'en' ? 'NASA-ISRO NISAR (200m SAR)' : 'নাসা-ইসরো নিসার (২০০মি)'}</span>
                        <span className="text-white font-semibold">
                          {language === 'bn' ? `${toBnDigits(nisarData.soilMoisture200m.toFixed(2))} m³/m³` : `${nisarData.soilMoisture200m.toFixed(2)} m³/m³`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 3. Temperature & Biosphere */}
                <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-1.5 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <DataTileStatusBadge
                          sourceName="NASA MODIS NDVI"
                          status={ndviData ? (isNdviFresh ? 'daily' : 'snapshot') : 'unavailable'}
                          customLabel={
                            ndviData
                              ? (language === 'en'
                                  ? `${ndviData.source || 'NASA MODIS'} NDVI · observed ${formatBadgeDate(ndviData.periodStart, 'en')}`
                                  : `${ndviData.source || 'নাসা মোডিস'} NDVI · পর্যবেক্ষণ ${formatBadgeDate(ndviData.periodStart, 'bn')}`)
                              : (language === 'en' ? 'NASA MODIS NDVI · No data' : 'নাসা মোডিস NDVI · তথ্য নেই')
                          }
                          language={language}
                        />
                        <DataTileStatusBadge
                          sourceName="NASA MODIS LST"
                          status={lstDayData ? (isLstFresh ? 'daily' : 'snapshot') : 'unavailable'}
                          customLabel={
                            lstDayData
                              ? (language === 'en'
                                  ? `NASA MODIS LST · observed ${formatBadgeDate(lstDayData.periodStart, 'en')}`
                                  : `নাসা মোডিস LST · পর্যবেক্ষণ ${formatBadgeDate(lstDayData.periodStart, 'bn')}`)
                              : (language === 'en' ? 'NASA MODIS LST · No data' : 'নাসা মোডিস LST · তথ্য নেই')
                          }
                          language={language}
                        />
                        <DataTileStatusBadge
                          sourceName="ISRO INSAT"
                          status={insatData ? 'snapshot' : 'unavailable'}
                          customLabel={
                            insatData
                              ? (language === 'bn' ? `ইসরো ইনস্যাট-৩ডিআর · ${toBnDigits(insatData.lstC)}° সে.` : `ISRO INSAT-3DR · ${insatData.lstC}°C`)
                              : (language === 'en' ? 'ISRO INSAT · No data' : 'ইসরো ইনস্যাট · তথ্য নেই')
                          }
                          language={language}
                        />
                      </div>
                      <span className={`font-mono text-xs font-semibold ${activeMaxTemp > 35 ? 'text-[#FF5C5C]' : 'text-[#22C55E]'}`}>
                        {activeMaxTemp > 35
                          ? (language === 'en' ? 'Heat Stress (>35°C)' : 'তাপপ্রবাহ সতর্কতা (>৩৫° সে.)')
                          : (language === 'en' ? 'Safe Growth Range' : 'অনুকূল তাপমাত্রা')}
                      </span>
                    </div>

                    <div className="font-mono text-4xl font-bold text-white mb-1">
                      {language === 'bn' ? `${toBnDigits(activeMaxTemp.toFixed(1))}° সে.` : `${activeMaxTemp.toFixed(1)}°C`}
                    </div>
                    <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                      {language === 'en'
                        ? `Vegetation index is ${ndviData ? `${ndviData.value.toFixed(2)} NDVI` : 'unavailable (cloud cover across composite)'}. Daytime land surface thermal reading is ${lstDayData ? `${lstDayData.value.toFixed(1)}°C` : 'unavailable'}, monitored for flowering heat sensitivity.`
                        : `উদ্ভিদ সজীবতা সূচক ${ndviData ? `${toBnDigits(ndviData.value.toFixed(2))} NDVI` : 'অনুপলব্ধ (মেঘের আচ্ছাদন)'}। ভূ-পৃষ্ঠের তাপমাত্রা ${lstDayData ? `${toBnDigits(lstDayData.value.toFixed(1))}° সে.` : 'অনুপলব্ধ'}, ফুল ফোটা ও দানা বাঁধার জন্য পর্যবেক্ষণাধীন।`}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-2 font-mono leading-relaxed border-t border-[#262626] pt-2">
                      {isDistrictWide
                        ? (language === 'en'
                            ? 'SMAP: 9 km resolution · MODIS: 250 m resolution. Measured at district HQ.'
                            : 'SMAP: ৯ কিমি রেজোলিউশন · MODIS: ২৫০ মি রেজোলিউশন। জেলা সদর দফতরে পরিমাপকৃত।')
                        : (language === 'en'
                            ? 'SMAP: 9 km resolution · MODIS: 250 m resolution. Measured for active field point (fallback to district value if cloudy).'
                            : 'SMAP: ৯ কিমি রেজোলিউশন · MODIS: ২৫০ মি রেজোলিউশন। নির্বাচিত জমির জন্য পরিমাপকৃত (মেঘলা থাকলে জেলা মান ব্যবহৃত হয়)।')}
                    </p>
                  </div>
                  <div className="pt-4 mt-6 border-t border-[#262626] space-y-1.5 text-xs font-mono text-slate-400">
                    <div className="flex justify-between">
                      <span>{language === 'en' ? 'Cross-Check: ISRO INSAT-3DR LST' : 'যাচাই: ইসরো ইনস্যাট-৩ডিআর LST'}</span>
                      <span className="text-white font-semibold">
                        {insatData ? (language === 'bn' ? `${toBnDigits(insatData.lstC)}° সে.` : `${insatData.lstC}°C`) : 'N/A'}
                      </span>
                    </div>
                    {insatData && insatData.heatSpikeConfirmed && (
                      <div className="text-[11px] text-amber-300 font-sans leading-tight">
                        {language === 'en'
                          ? '✓ Heat stress confirmed by 2 space agencies (NASA + ISRO INSAT-3DR).'
                          : '✓ দুই মহাকাশ সংস্থা (নাসা ও ইসরো) দ্বারা তাপপ্রবাহ নিশ্চিত।'}
                      </div>
                    )}
                    {insatData && insatData.divergenceNoticeEn && (
                      <div className="text-[11px] text-[#A3A3A3] font-sans leading-tight">
                        {language === 'en' ? insatData.divergenceNoticeEn : insatData.divergenceNoticeBn}
                      </div>
                    )}
                    <div className="flex justify-between pt-1 border-t border-[#262626]/60">
                      <span>MODIS Surface Temp (Day / Night)</span>
                      <span className="text-white font-semibold">
                        {lstDayData ? `${lstDayData.value.toFixed(1)}°C` : 'N/A'} / {lstNightData ? `${lstNightData.value.toFixed(1)}°C` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Spatial Resolution Disclaimer */}
              <div className="p-4 rounded-2xl bg-[#0A0A0A] border border-[#262626] flex items-start gap-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-[#FAFAFA] shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  {language === 'en'
                    ? `Spatial resolution note: NASA SMAP (9 km), GPM/POWER (10 km to 0.5°), and MODIS (250m–1km) observations represent regional agro-climatic conditions across ${upazilaName}, providing broad environmental indicators rather than direct in-situ sensor probes buried in this specific field.`
                    : `তথ্যের পরিধি: নাসা স্ম্যাপ (৯ কিমি), জিপিএম/পাওয়ার (১০ কিমি) ও মডিস (২৫০মি–১কিমি)-এর তথ্য পুরো ${upazilaName} এলাকার সাধারণ অবস্থা দেখায়, কোনো একক জমিতে বসানো মিটারের মাপ নয়।`}
                </p>
              </div>
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: CROP PLAN (RECOMMENDATIONS & ROTATION)                     */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'crops' && (
            <div className="space-y-8 animate-fadeIn scroll-mt-20">
              <div className="pb-4 border-b border-[#262626]">
                <span className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider font-bold block mb-1">
                  {language === 'en' ? 'Cropping Strategy & Rotation' : 'ফসলের পরিকল্পনা ও পরিক্রমা'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? `Seasonal Plan for ${upazilaName}` : `${upazilaName}-এর জন্য শস্য পরিকল্পনা`}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1">
                  {language === 'en'
                    ? 'Individual crop suitability scores and balanced 3-season crop cycle avoiding continuous high-irrigation cereals.'
                    : 'নাসার স্যাটেলাইট তথ্য ও বিএআরআই নির্দেশিকা অনুযায়ী ফসলের স্কোর ও ৩-মৌসুমী পরিক্রমা।'} 
                </p>
              </div>

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
            <div className="space-y-8 animate-fadeIn scroll-mt-20">
              <div className="pb-4 border-b border-[#262626]">
                <span className="text-xs font-mono uppercase text-[#FAFAFA] tracking-wider font-bold block mb-1">
                  {language === 'en' ? 'Decadal Climate Shift' : 'দীর্ঘমেয়াদী আবহাওয়া বদল'}
                </span>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                  {language === 'en' ? `Climate Shift in ${districtName}` : `${districtName}-এর আবহাওয়া বদল`}
                </h2>
                <p className="text-xs sm:text-sm text-[#A3A3A3] mt-1">
                  {language === 'en'
                    ? 'Comparing NASA POWER 2001–2010 historical baseline with the recent decadal period (2016–2025).'
                    : 'নাসার তথ্য অনুযায়ী ২০০১–২০১০ সালের তুলনায় সাম্প্রতিক ২০১৬–২০২৫ মৌসুমের আবহাওয়ার পরিবর্তন।'} 
                </p>
              </div>

              <FieldShiftPanel shift={fieldShift} />
            </div>
          )}

          {/* ═════════════════════════════════════════════════════════════════ */}
          {/* TAB 5: EXPLAIN WHY (TRANSPARENT DETERMINISTIC RULES & BREAKDOWN)  */}
          {/* ═════════════════════════════════════════════════════════════════ */}
          {activeTab === 'explain' && (
            <div className="space-y-8 animate-fadeIn scroll-mt-20">
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] space-y-2">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#FAFAFA] uppercase">
                  <ShieldCheck className="w-4 h-4 text-[#FAFAFA]" />
                  <span>{language === 'en' ? 'Core Scientific Methodology' : 'মৌলিক বৈজ্ঞানিক নীতিমালা'}</span>
                </div>
                <h2 className="font-display text-2xl font-bold text-white">
                  {language === 'en' ? 'Transparent, 100% Rule-Based Decision Architecture' : 'সম্পূর্ণ স্বচ্ছ ও নিয়ম-ভিত্তিক পরামর্শ ব্যবস্থা'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {language === 'en'
                    ? 'AgriOrbit relies on deterministic agronomic rules. Every recommendation stems from transparent criteria based on BARI/BRRI guidance, published agro-ecological research, and NASA Earth observations.'
                    : 'এগ্রিঅরবিট স্পষ্ট কৃষি নিয়মের ভিত্তিতে পরিচালিত হয়। প্রতিটি সুপারিশ নাসা উপগ্রহ পর্যবেক্ষণ, বিএআরআই/বিআরআরআই কৃষি গবেষণা নির্দেশিকা এবং কৃষকের নিজস্ব লক্ষ্যের ভিত্তিতে তৈরি।'}
                </p>
              </div>

              {/* The 4 Empirical Rules */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                  <span className="font-mono text-xs text-[#22C55E] font-bold block uppercase">
                    {language === 'en' ? 'Rule 1 · Moisture Deficit Rule' : 'নিয়ম ১ · মাটির আর্দ্রতা ঘাটতি নীতি'}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? '30-Day Rain < 50 mm AND Soil < 0.15 m³/m³' : '৩০ দিনের বৃষ্টি < ৫০ মিমি এবং মাটির রস < ০.১৫'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'en'
                      ? 'Penalizes high-water flood-irrigation crops (such as winter Boro rice) by -20 points, elevating drought-resilient legumes and taproot pulses.'
                      : 'অতিরিক্ত পানিগ্রাহী বোরো ধানের স্কোর ২০ পয়েন্ট কেটে দেয় এবং খরা-সহনশীল মসুর ও সরিষার অবস্থান শীর্ষে নিয়ে আসে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                  <span className="font-mono text-xs text-[#FAFAFA] font-bold block uppercase">
                    {language === 'en' ? 'Rule 2 · Optimal Sowing Window Rule' : 'নিয়ম ২ · বপনের অনুকূল আর্দ্রতা নীতি'}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'SMAP Soil Moisture 0.25 to 0.30 m³/m³' : 'মাটির আর্দ্রতা ০.২৫ থেকে ০.৩০ m³/m³'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'en'
                      ? 'Awards a +5 point bonus and an "Optimal Sowing Moisture" badge, signaling prime seed germination conditions.'
                      : 'উপযুক্ত আর্দ্রতার জন্য ৫ পয়েন্ট বোনাস দেয় এবং জমিতে বীজ বপনের অনুকূল সময় নির্দেশ করে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                  <span className="font-mono text-xs text-[#FF5C5C] font-bold block uppercase">
                    {language === 'en' ? 'Rule 3 · Thermal Stress Rule' : 'নিয়ম ৩ · তাপপ্রবাহ সতর্কতা নীতি'}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'Daily Max Temperature > 35°C' : 'সর্বোচ্চ তাপমাত্রা > ৩৫° সে.'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'en'
                      ? 'Applies heat penalties to terminal-heat-sensitive crops (Wheat and Potato) to avoid flowering blast and yield failure.'
                      : 'ফুল ফোটা ও দানা বাঁধার সময় তাপমাত্রা বেশি থাকলে গম ও আলুর জন্য সতর্কতা জারি করে।'}
                  </p>
                </div>

                <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] space-y-2">
                  <span className="font-mono text-xs text-[#22C55E] font-bold block uppercase">
                    {language === 'en' ? 'Rule 4 · Botanical Alternation & Nitrogen Triggers' : 'নিয়ম ৪ · পর্যায়ক্রম ও নাইট্রোজেন বৃদ্ধি'}
                  </span>
                  <h4 className="text-sm font-bold text-white">
                    {language === 'en' ? 'Rotation Rule A & Rule B' : 'শস্য পর্যায় নীতি ১ ও ২'}
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {language === 'en'
                      ? 'Rule A prevents repeating identical plant families consecutively. Rule B forces a legume (Mungbean/Lentil) when the soil nutrient trail drops below zero.'
                      : 'পরপর দুই মৌসুমে একই জাতের ফসল না লাগিয়ে রোগবালাই কমানো হয়, আর মাটিতে নাইট্রোজেন কমলে ডাল জাতীয় ফসল বেছে নেওয়া হয়।'}
                  </p>
                </div>
              </div>

              {/* Interactive Score Breakdown Trigger */}
              <div className="p-6 rounded-2xl bg-[#141414] border border-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="font-display text-lg font-bold text-white">
                    {language === 'en' ? `Inspect Score Breakdown: ${rankedCrops[0]?.nameEn}` : `স্কোরের কারণ দেখুন: ${rankedCrops[0]?.nameBn}`}
                  </h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {language === 'en'
                      ? 'Open the full mathematical table showing every point delta from BARI, SMAP, POWER, and your priorities.'
                      : 'নাসার প্রতিটি স্যাটেলাইট তথ্যের জন্য কীভাবে নম্বর যোগ বা কাটা হয়েছে তার বিস্তারিত টেবিল দেখুন।'} 
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExplainCrop(rankedCrops[0])}
                  className="px-5 py-2.5 rounded-xl bg-[#22C55E] hover:bg-[#16a34a] text-black font-bold text-xs cursor-pointer flex items-center gap-2 shrink-0"
                >
                  <Calculator className="w-4 h-4" />
                  <span>{language === 'en' ? 'Open Mathematical Table' : 'হিসাবের বিস্তারিত দেখুন'}</span>
                </button>
              </div>

              {/* Frequently Asked Questions (FAQ) Section */}
              <FaqSection language={language} />
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
