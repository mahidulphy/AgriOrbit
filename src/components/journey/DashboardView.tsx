import React, { useState } from 'react';
import {
  AlertTriangle,
  Droplets,
  LogOut,
  MapPin,
  Satellite,
  Thermometer,
  TrendingDown,
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
import { Eyebrow, KV, Meter, Rule } from '../ui';

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

type Tab = 'overview' | 'conditions' | 'crops' | 'rotation';

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
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [explainCrop, setExplainCrop] = useState<CropData | null>(null);

  const district = getDistrictProfile(selectedDistrict);
  const nasaData = getNasaContext(selectedDistrict);
  const power = nasaData.power;
  const smap = nasaData.smap;
  const modis = nasaData.modis;
  const alerts: RiskAlert[] = nasaData.alerts;
  const rotationPlan = ROTATION_PLANS[selectedPriority];
  const upazilaName = getUpazilaName(selectedDistrict, selectedUpazila, language);

  const tabs: { id: Tab; en: string; bn: string }[] = [
    { id: 'overview', en: 'Overview', bn: 'সারসংক্ষেপ' },
    { id: 'conditions', en: 'Field Conditions', bn: 'মাটির অবস্থা' },
    { id: 'crops', en: 'Crop Plan', bn: 'ফসল পরিকল্পনা' },
    { id: 'rotation', en: '3-Season Rotation', bn: '৩-মৌসুমী আবর্তন' },
  ];

  const show = (t: Tab) => activeTab === 'overview' || activeTab === t;

  return (
    <div className="min-h-screen bg-[#050B14] text-white font-sans selection:bg-[#B8FF3D] selection:text-[#050B14]">
      {/* ── App header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-[#050B14]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-2 sm:gap-4">
          <BrandLogo badge="Field Engine" />

          <nav className="hidden md:flex items-stretch gap-5 text-sm font-medium self-stretch">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`whitespace-nowrap shrink-0 transition cursor-pointer border-b-2 -mb-px ${
                  activeTab === t.id
                    ? 'border-[#B8FF3D] text-white font-semibold'
                    : 'border-transparent text-[#8FA3B8] hover:text-white'
                }`}
              >
                {language === 'en' ? t.en : t.bn}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onChangeFieldLocation}
              title="Click to change field or district"
              className="hidden lg:flex items-center gap-1.5 text-xs text-[#8FA3B8] hover:text-white transition cursor-pointer whitespace-nowrap"
            >
              <MapPin className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span className="tnum">
                {upazilaName}, {language === 'en' ? district.nameEn.split(' ')[0] : district.nameBn.split(' ')[0]}
              </span>
              <span className="underline underline-offset-2">{language === 'en' ? 'Change' : 'বদলান'}</span>
            </button>
            <LanguageSwitcher language={language} onLanguageChange={onLanguageChange} />
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[#8FA3B8] hover:text-[#FF5C5C] transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        {/* Mobile tabs: horizontal scroll strip */}
        <nav className="md:hidden flex gap-5 px-4 overflow-x-auto border-t border-white/10 text-sm font-medium whitespace-nowrap">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`py-2.5 shrink-0 transition cursor-pointer border-b-2 -mb-px ${
                activeTab === t.id
                  ? 'border-[#B8FF3D] text-white font-semibold'
                  : 'border-transparent text-[#8FA3B8]'
              }`}
            >
              {language === 'en' ? t.en : t.bn}
            </button>
          ))}
        </nav>
      </header>

      {/* ── Field header: what is happening on my field? ───── */}
      <section className="px-4 sm:px-6 pt-8 pb-6 border-b border-white/10">
        <div className="max-w-7xl mx-auto">
          <Eyebrow>
            {language === 'en' ? 'Your field' : 'আপনার জমি'} · {upazilaName},{' '}
            {language === 'en' ? district.nameEn : district.nameBn}
          </Eyebrow>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-2">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              {language === 'en' ? 'Field analysis' : 'মাঠ বিশ্লেষণ'}
            </h1>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-[#8FA3B8]">
              <span className="tnum">
                {fieldLat}° N, {fieldLng}° E
              </span>
              <span>{district.defaultFieldTag}</span>
              <span>
                {language === 'en' ? district.agroZoneEn : district.agroZoneBn}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-4 text-xs">
            <p className="text-[#8FA3B8]">
              {language === 'en' ? 'Priority: ' : 'লক্ষ্য: '}
              <strong className="text-[#B8FF3D] font-semibold capitalize">
                {selectedPriority.replace('_', ' ')}
                {secondaryPriority ? ` + ${secondaryPriority.replace('_', ' ')}` : ''}
              </strong>
            </p>
            <button onClick={onChangePriority} className="text-white underline underline-offset-2 hover:text-[#B8FF3D] transition cursor-pointer">
              {language === 'en' ? 'Change priority' : 'লক্ষ্য বদলান'}
            </button>
            <button onClick={onChangeFieldLocation} className="text-white underline underline-offset-2 hover:text-[#B8FF3D] transition cursor-pointer">
              {language === 'en' ? 'Change location' : 'অবস্থান বদলান'}
            </button>
            <p className="text-[#00E5FF]">
              NASA: {nasaSourceLabel(nasaData, language === 'en' ? district.nameEn : district.nameBn, language)}
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-14">
        {/* ── Key risks first ──────────────────────────────── */}
        {show('overview') && (
          <section>
            <Eyebrow tone="lime">{language === 'en' ? 'Key risks & openings' : 'প্রধান ঝুঁকি ও সুযোগ'}</Eyebrow>
            <div className="mt-4 border-t border-white/10">
              {alerts.map((alert) => {
                const tone =
                  alert.type === 'warning'
                    ? 'border-l-[#FF5C5C]'
                    : alert.type === 'info'
                      ? 'border-l-[#00E5FF]'
                      : 'border-l-[#B8FF3D]';
                const tag =
                  alert.type === 'warning'
                    ? 'text-[#FF5C5C]'
                    : alert.type === 'info'
                      ? 'text-[#00E5FF]'
                      : 'text-[#B8FF3D]';
                return (
                  <div key={alert.id} className={`flex gap-4 py-4 border-b border-white/10 border-l-2 ${tone} pl-4`}>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">
                        {language === 'en' ? alert.titleEn : alert.titleBn}{' '}
                        <span className={`text-[11px] font-semibold uppercase tracking-wider ml-1 ${tag}`}>
                          {alert.type === 'warning'
                            ? language === 'en' ? 'Risk' : 'ঝুঁকি'
                            : alert.type === 'info'
                              ? language === 'en' ? 'Note' : 'নোট'
                              : language === 'en' ? 'Favorable' : 'অনুকূল'}
                        </span>
                      </p>
                      <p className="text-sm text-[#8FA3B8] mt-0.5 leading-relaxed">
                        {language === 'en' ? alert.descEn : alert.descBn}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Current conditions: varied hierarchy ─────────── */}
        {show('conditions') && (
          <section>
            <Eyebrow>{language === 'en' ? 'Current conditions' : 'বর্তমান অবস্থা'}</Eyebrow>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-2">
              {language === 'en' ? 'What the satellites see today' : 'আজ উপগ্রহ যা দেখছে'}
            </h2>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 mt-8">
              {/* Lead: rainfall */}
              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                  {language === 'en' ? 'Rainfall · NASA POWER' : 'বৃষ্টিপাত · নাসা পাওয়ার'}
                </p>
                <p className="tnum text-5xl font-bold tracking-tight mt-2">
                  {power.rainfallMm}
                  <span className="text-lg font-medium text-[#8FA3B8]"> mm / 30-day</span>
                </p>
                <p className={`text-sm font-semibold mt-1 ${power.rainfallAnomalyPct < 0 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}`}>
                  {power.rainfallAnomalyPct > 0 ? `+${power.rainfallAnomalyPct}%` : `${power.rainfallAnomalyPct}%`}{' '}
                  <span className="text-[#8FA3B8] font-normal">
                    {language === 'en' ? 'vs 10-year seasonal normal' : '১০ বছরের গড়ের তুলনায়'}
                  </span>
                </p>
                <Meter value={Math.max(0, 100 + power.rainfallAnomalyPct)} tone="cyan" className="mt-4 max-w-sm" />

                <dl className="mt-6 border-t border-white/10 max-w-sm">
                  <KV label={language === 'en' ? 'Air temperature (2 m)' : 'বায়ুর তাপমাত্রা'}>
                    <span className="tnum font-semibold">{power.tempC}°C</span>
                  </KV>
                  <div className="border-b border-white/10" />
                  <KV label={language === 'en' ? 'Relative humidity' : 'আপেক্ষিক আর্দ্রতা'}>
                    <span className="tnum font-semibold">{power.humidityPct}%</span>
                  </KV>
                  <div className="border-b border-white/10" />
                  <KV label={language === 'en' ? 'Solar radiation' : 'সৌর বিকিরণ'}>
                    <span className="tnum font-semibold">{power.radiationMj} MJ/m²</span>
                  </KV>
                  <div className="border-b border-white/10" />
                </dl>
              </div>

              {/* Supporting: soil + vegetation */}
              <div className="space-y-8">
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8] flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-[#00E5FF]" />
                    {language === 'en' ? 'Soil moisture · NASA SMAP' : 'মাটির আর্দ্রতা · নাসা স্ম্যাপ'}
                  </p>
                  <p className="tnum text-3xl font-bold tracking-tight mt-2">
                    {smap.surfaceMoisture}
                    <span className="text-sm font-medium text-[#8FA3B8]"> m³/m³</span>
                  </p>
                  <p className="text-sm text-[#8FA3B8] mt-1">
                    {language === 'en' ? smap.statusEn : smap.statusBn} ·{' '}
                    {language === 'en'
                      ? 'below the preferred range for flood crops; suits tap-root legumes.'
                      : 'বোরোর জন্য কম; ডাল ফসলের জন্য উপযোগী।'}
                  </p>
                  <Meter value={smap.levelPct} tone="cyan" className="mt-3" />
                  <p className="tnum text-[11px] text-[#8FA3B8]/70 mt-1.5 flex justify-between">
                    <span>Deficit &lt;0.15</span>
                    <span>Preferred 0.22–0.30</span>
                    <span>Surplus</span>
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                    {language === 'en' ? 'Vegetation & heat · NASA MODIS' : 'উদ্ভিদ ও তাপ · নাসা মডিস'}
                  </p>
                  <div className="flex items-baseline gap-6 mt-2">
                    <p className="tnum text-3xl font-bold tracking-tight">
                      {modis.ndvi}
                      <span className="text-sm font-medium text-[#8FA3B8]"> NDVI</span>
                    </p>
                    <p className="tnum text-3xl font-bold tracking-tight flex items-center gap-1.5">
                      <Thermometer className="w-5 h-5 text-[#8FA3B8]" />
                      {modis.landSurfaceTempC}°C
                    </p>
                  </div>
                  <p className="text-sm text-[#B8FF3D] mt-1">
                    {language === 'en' ? modis.ndviStatusEn : modis.ndviStatusBn}
                  </p>
                </div>

                <div className="border-l-2 border-[#00E5FF]/40 pl-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                    {language === 'en' ? 'Climate shift' : 'জলবায়ু পরিবর্তন'}
                  </p>
                  <div className="tnum mt-2 space-y-1.5 text-sm">
                    <p>
                      <span className="text-[#FF5C5C] font-bold">−24%</span>{' '}
                      <span className="text-[#8FA3B8]">
                        {language === 'en' ? 'pre-monsoon rain · dry spells +18 days' : 'প্রাক-বর্ষা বৃষ্টি · খরা +১৮ দিন'}
                      </span>
                    </p>
                    <p>
                      <span className="text-[#FF5C5C] font-bold">+1.2°C</span>{' '}
                      <span className="text-[#8FA3B8]">
                        {language === 'en' ? 'mean Rabi temperature' : 'রবি গড় তাপমাত্রা'}
                      </span>
                    </p>
                    <p>
                      <span className="text-[#FF5C5C] font-bold">−3.4 m</span>{' '}
                      <span className="text-[#8FA3B8]">
                        {language === 'en' ? 'groundwater level · pumping cost +32% since 2018' : 'ভূগর্ভস্থ পানি · ২০১৮ থেকে সেচ খরচ +৩২%'}
                      </span>
                    </p>
                    <p>
                      <span className="text-white font-bold">0.82%</span>{' '}
                      <span className="text-[#FF5C5C] font-semibold">(low)</span>{' '}
                      <span className="text-[#8FA3B8]">
                        {language === 'en' ? 'soil organic carbon — needs pulse rotation' : 'জৈব কার্বন — ডাল আবর্তন প্রয়োজন'}
                      </span>
                    </p>
                  </div>
                  <div className="mt-3 flex gap-1.5 text-xs text-[#8FA3B8]">
                    <TrendingDown className="w-3.5 h-3.5 text-[#FF5C5C] shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {language === 'en' ? nasaData.climateShiftInsightEn : nasaData.climateShiftInsightBn}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {show('crops') && (
          <CropRecommendation
            selectedPriority={selectedPriority}
            secondaryPriority={secondaryPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
          />
        )}

        {show('rotation') && (
          <SeasonRotation
            selectedDistrict={selectedDistrict}
            selectedPriority={selectedPriority}
            language={language}
            onExplainCrop={(crop) => setExplainCrop(crop)}
          />
        )}
      </main>

      <ExplainWhyModal
        crop={explainCrop}
        selectedPriority={selectedPriority}
        secondaryPriority={secondaryPriority}
        language={language}
        onClose={() => setExplainCrop(null)}
      />

      <div className="mt-4">
        <AppFooter language={language} userName={userName} />
      </div>
    </div>
  );
};
