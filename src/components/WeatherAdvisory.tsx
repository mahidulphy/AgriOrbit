import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertTriangle,
  CloudRain,
  ChevronDown,
  ChevronUp,
  X,
  HelpCircle,
  Satellite,
  Compass,
  CheckCircle2,
  Droplets,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import type { DistrictId } from '../data/bdAdmin';
import type { FarmerPriorityId, Language } from '../types';
import {
  type WeatherAdvisoryResult,
  getWeatherAdvisoryForLocation,
  evaluateWeatherAdvisory,
} from '../lib/weatherAdvisory';
import { computeGpmMetricsFromDaily } from '../services/gpm';
import { computeForecastMetrics } from '../services/weatherForecast';
import { DataTileStatusBadge } from './common/DataTileStatusBadge';
import fallbackRangpur from '../data/fallback-rangpur.json';
import type { LocationCache } from '../lib/power';
import { getDistrictSatellite } from '../data/satellite';
import { getDistrictAdmin } from '../data/districts';

export interface WeatherAdvisoryProps {
  districtId: DistrictId | string;
  upazilaName?: string;
  lat?: number;
  lng?: number;
  soilMoisture?: number | null;
  priority?: FarmerPriorityId;
  language?: Language;
  onDismiss?: () => void;
  className?: string;
}

/**
 * 2. Field Action Weather Advisory Banner
 *
 * SCIENTIFIC FOUNDATION:
 *   NASA POWER (precipitation) (Recent rainfall observation / estimate - ~10km grid)
 *           ↓
 *   Open-Meteo (7-day precipitation forecast)
 *           ↓
 *   Current field conditions (SMAP root-zone soil moisture: High/Moderate/Low)
 *           ↓
 *   Crop / season context
 *           ↓
 *   AgriOrbit deterministic rules
 *           ↓
 *   FIELD ACTION ADVISORY
 */
export const WeatherAdvisory: React.FC<WeatherAdvisoryProps> = ({
  districtId,
  upazilaName = 'Mithapukur',
  lat = 25.58,
  lng = 89.27,
  soilMoisture = 0.22,
  priority = 'save_water',
  language = 'en',
  onDismiss,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [advisory, setAdvisory] = useState<WeatherAdvisoryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isEn = language === 'en';
  const admin = getDistrictAdmin(districtId);
  const districtSat = getDistrictSatellite(districtId);
  const smapRecord = districtSat?.smap ?? null;
  const sentinel1Record = districtSat?.sentinel1 ?? null;
  const isSoilFlaggedWater = smapRecord?.flag === 'possible_water_contamination';
  const effectiveSoilMoisture = (soilMoisture !== undefined && soilMoisture !== null) ? soilMoisture : (smapRecord?.value ?? 0.22);

  // Instant deterministic initial advisory from bundled snapshot to guarantee zero blank screens
  const defaultInitialAdvisory = useMemo(() => {
    const isRangpur = districtId === 'rangpur';
    const bundled = fallbackRangpur as LocationCache;
    const gpm = isRangpur
      ? computeGpmMetricsFromDaily(bundled.daily.PRECTOTCORR, 'bundled', bundled.fetchedAt)
      : {
          sourceBadge: 'NASA' as const,
          datasetName: 'NASA POWER (precipitation)' as const,
          spatialResolution: '~10 km (0.1° grid)' as const,
          recentRain7dMm: 0,
          recentRain14dMm: 0,
          recentDailyMeanMm: 0,
          baselineComparison: 'Normal' as const,
          baselineComparisonBn: 'স্বাভাবিক' as const,
          anomalyPct: 0,
          observationWindow: { startDate: 'N/A', endDate: 'N/A', daysCount: 0 },
          observedSummaryEn: `Data unavailable for ${admin?.nameEn ?? districtId}`,
          observedSummaryBn: `${admin?.nameBn ?? districtId}-এর জন্য তথ্য পাওয়া যায়নি`,
          dataStatus: 'unavailable' as const,
          updatedAt: '',
        };
    const forecast = isRangpur
      ? computeForecastMetrics(bundled.forecast, 'bundled', bundled.fetchedAt)
      : {
          sourceBadge: 'FORECAST' as const,
          providerName: 'Open-Meteo' as const,
          totalRain7dMm: 0,
          rainDaysCount: 0,
          peakRainMm: 0,
          peakRainDate: 'N/A',
          hasHeavyRainRisk: false,
          forecastDays: [],
          forecastSummaryEn: `Data unavailable for ${admin?.nameEn ?? districtId}`,
          forecastSummaryBn: `${admin?.nameBn ?? districtId}-এর জন্য তথ্য পাওয়া যায়নি`,
          dataStatus: 'unavailable' as const,
          updatedAt: '',
        };
    return evaluateWeatherAdvisory({
      gpm,
      forecast,
      soilMoisture: effectiveSoilMoisture,
      districtId,
      upazilaName,
      farmerPriority: priority,
      sentinel1FloodedCroplandPct: sentinel1Record?.floodedCroplandPct ?? null,
    });
  }, [districtId, upazilaName, soilMoisture, priority, sentinel1Record?.floodedCroplandPct]);

  // Dynamic field-specific update whenever district, upazila, coordinates, or soil moisture changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getWeatherAdvisoryForLocation(districtId, lat, lng, effectiveSoilMoisture, priority, {
      upazilaName,
    })
      .then((res) => {
        if (!isCancelled) {
          setAdvisory(res);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setAdvisory(defaultInitialAdvisory);
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [districtId, lat, lng, soilMoisture, priority, upazilaName, defaultInitialAdvisory]);

  const activeAdvisory = advisory ?? defaultInitialAdvisory;

  if (isDismissed) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Severity-dependent styling
  const severityColors = {
    danger: {
      border: 'border-[#262626]',
      bgGradient: 'bg-[#0A0A0A]',
      text: 'text-red-400',
      accent: 'text-red-400',
      ping: 'bg-red-400',
      badge: 'bg-red-500/10 text-red-400 border-red-500/20',
    },
    warning: {
      border: 'border-[#262626]',
      bgGradient: 'bg-[#0A0A0A]',
      text: 'text-amber-400',
      accent: 'text-amber-400',
      ping: 'bg-amber-400',
      badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    },
    info: {
      border: 'border-[#262626]',
      bgGradient: 'bg-[#0A0A0A]',
      text: 'text-[#A3A3A3]',
      accent: 'text-[#FAFAFA]',
      ping: 'bg-[#737373]',
      badge: 'bg-white/5 text-[#A3A3A3] border-[#262626]',
    },
    success: {
      border: 'border-[#262626]',
      bgGradient: 'bg-[#0A0A0A]',
      text: 'text-[#22C55E]',
      accent: 'text-[#22C55E]',
      ping: 'bg-[#22C55E]',
      badge: 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20',
    },
  }[activeAdvisory.severity];

  return (
    <div
      role="region"
      aria-label="Weather Advisory"
      className={`relative w-full border-b border-[#262626] bg-[#0A0A0A] transition-all duration-200 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* COLLAPSED VIEW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            {/* Live Radar Pulse Indicator */}
            <div className="relative flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              
              <span className={`relative inline-flex items-center justify-center rounded-lg p-1.5 ${severityColors.badge} border`}>
                {activeAdvisory.severity === 'danger' || activeAdvisory.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <CloudRain className="w-4 h-4 text-[#FAFAFA] shrink-0" />
                )}
              </span>
            </div>

            {/* Headline and Provenance */}
            <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium leading-snug">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${severityColors.badge}`}>
                  {isEn ? 'WEATHER ADVISORY' : 'আবহাওয়া বার্তা'}
                </span>
                <span className="text-[11px] font-mono text-[#A3A3A3] hidden md:inline">
                  {upazilaName} · {activeAdvisory.dataSourceStatus.isLive ? 'Live' : 'Cached Snapshot'}
                </span>
              </div>
              <p className="font-editorial text-white text-xs sm:text-sm font-semibold truncate sm:whitespace-normal">
                {isEn ? activeAdvisory.headlineEn : activeAdvisory.headlineBn}
              </p>
            </div>
          </div>

          {/* Action Cluster */}
          <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
            <button
              type="button"
              onClick={() => setIsExpanded((prev) => !prev)}
              className="text-xs font-mono font-semibold text-[#FAFAFA] hover:text-white px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] border border-[#262626] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isExpanded ? (isEn ? 'Collapse ↑' : 'সংক্ষেপ করুন ↑') : (isEn ? 'View Details →' : 'বিস্তারিত দেখুন →')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={isEn ? 'Dismiss alert' : 'সতর্কতা বাতিল করুন'}
              title={isEn ? 'Dismiss alert' : 'সতর্কতা বাতিল করুন'}
              className="p-1.5 rounded-lg bg-[#141414] hover:bg-[#1f1f1f] text-[#737373] hover:text-[#FAFAFA] transition-colors cursor-pointer border border-[#262626]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EXPANDED SCIENTIFIC VIEW */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-[#262626] space-y-4 animate-in fade-in duration-300">
            {/* Header Title with Field Coordinates Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <span className="text-[10px] font-mono text-[#FAFAFA] uppercase tracking-wider font-bold block mb-0.5">
                  {isEn ? 'FIELD ACTION ADVISORY' : 'জমির জন্য করণীয় পরামর্শ'}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {isEn ? activeAdvisory.titleEn : activeAdvisory.titleBn}
                </h3>
              </div>
              <div className="text-[11px] font-mono text-[#737373] bg-[#0A0A0A] px-3 py-1 rounded-lg border border-[#262626] self-start sm:self-center">
                <span>{upazilaName}</span>
                <span className="mx-1.5 text-white/30">·</span>
                <span>{lat.toFixed(2)}°N, {lng.toFixed(2)}°E</span>
              </div>
            </div>

            {/* Sentinel-1 SAR Flooding Banner */}
            {sentinel1Record && sentinel1Record.floodedCroplandPct > 10 && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 flex items-start gap-3 text-xs font-mono">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-semibold block text-amber-300">
                    {isEn ? 'ESA Sentinel-1 SAR Waterlogging Alert (Rule SAR-01)' : 'ইএসএ সেন্টিনেল-১ জলাবদ্ধতা সতর্কতা (নিয়ম SAR-01)'}
                  </span>
                  <span className="text-[#D4D4D4] leading-relaxed block font-sans">
                    {isEn
                      ? `Copernicus SAR detected ${sentinel1Record.floodedCroplandPct.toFixed(1)}% flooded cropland in ${admin?.nameEn ?? districtId} (>10% threshold). Waterlogging-sensitive crops (sesame, chili, brinjal, lentil, chickpea, etc.) have received a -15 suitability penalty.`
                      : `কোপার্নিকাস সেন্টিনেল-১ রাডারে ${admin?.nameBn ?? districtId} জেলার ${sentinel1Record.floodedCroplandPct.toFixed(1)}% ফসলি জমিতে জলাবদ্ধতা ধরা পড়েছে (>১০% সীমা)। জলাবদ্ধতা-সংবেদনশীল ফসলে (তিল, মরিচ, বেগুন, মসুর, ছোলা ইত্যাদি) ১৫ নম্বর কাটা হয়েছে।`}
                  </span>
                </div>
              </div>
            )}

            {/* 3 SCIENTIFIC TILES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* TILE 1: NASA POWER (precipitation) Observation */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="NASA POWER (precipitation)"
                      status={activeAdvisory.gpm.dataStatus === 'live' ? 'live' : activeAdvisory.gpm.dataStatus === 'cached' ? 'cached' : 'snapshot'}
                      date={activeAdvisory.gpm.updatedAt}
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#A3A3A3]">
                      {activeAdvisory.gpm.spatialResolution}
                    </span>
                  </div>

                  <span className="text-xs text-[#A3A3A3] block font-mono">
                    {isEn ? 'Recent Observed Rainfall' : 'সাম্প্রতিক বৃষ্টিপাত পর্যবেক্ষণ'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {activeAdvisory.gpm.recentRain7dMm} <span className="text-xs font-normal text-[#A3A3A3]">mm</span>
                    </span>
                    <span
                      className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        activeAdvisory.gpm.baselineComparison === 'Elevated'
                          ? 'bg-amber-500/20 text-amber-300'
                          : activeAdvisory.gpm.baselineComparison === 'Deficit'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {isEn ? activeAdvisory.gpm.baselineComparison : activeAdvisory.gpm.baselineComparisonBn}
                    </span>
                  </div>

                  <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                    {isEn ? activeAdvisory.gpm.observedSummaryEn : activeAdvisory.gpm.observedSummaryBn}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                  <span>NASA POWER (precipitation)</span>
                  <span>{activeAdvisory.gpm.observationWindow.daysCount} days</span>
                </div>
              </div>

              {/* TILE 2: Open-Meteo 7-Day Forecast */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="Open-Meteo"
                      status={activeAdvisory.forecast.dataStatus === 'live' ? 'live' : activeAdvisory.forecast.dataStatus === 'cached' ? 'cached' : 'snapshot'}
                      date={activeAdvisory.forecast.updatedAt}
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#A3A3A3]">7-Day ECMWF/GFS</span>
                  </div>

                  <span className="text-xs text-[#A3A3A3] block font-mono">
                    {isEn ? '7-Day Precipitation Forecast' : '৭ দিনের বৃষ্টিপাত পূর্বাভাস'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {activeAdvisory.forecast.totalRain7dMm} <span className="text-xs font-normal text-[#A3A3A3]">mm expected</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                    {isEn ? activeAdvisory.forecast.forecastSummaryEn : activeAdvisory.forecast.forecastSummaryBn}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                  <span>Peak: {activeAdvisory.forecast.peakRainMm} mm</span>
                  <span>{activeAdvisory.forecast.rainDaysCount} rain days</span>
                </div>
              </div>

              {/* TILE 3: Field Condition (Soil Moisture) */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="NASA SMAP"
                      status={smapRecord ? 'snapshot' : 'unavailable'}
                      customLabel={
                        smapRecord
                          ? `NASA SMAP · ${smapRecord.date} (${smapRecord.pass})`
                          : (isEn ? 'NASA SMAP · No data' : 'নাসা স্ম্যাপ · তথ্য নেই')
                      }
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#A3A3A3]">SPL3SMP_E (9km)</span>
                  </div>

                  <span className="text-xs text-[#A3A3A3] block font-mono">
                    {isEn ? 'Root-Zone Soil Moisture' : 'মাটির গভীরের রস'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {smapRecord ? (
                        `${smapRecord.value.toFixed(2)} m³/m³`
                      ) : (
                        <span className="text-base text-slate-400 font-normal">{isEn ? 'No data' : 'তথ্য নেই'}</span>
                      )}
                    </span>
                    {isSoilFlaggedWater && (
                      <span className="text-[10px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                        {isEn ? 'may include open water' : 'উন্মুক্ত জলাশয় অন্তর্ভুক্ত থাকতে পারে'}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                    {smapRecord
                      ? (isEn ? activeAdvisory.fieldCondition.rootZoneInsightEn : activeAdvisory.fieldCondition.rootZoneInsightBn)
                      : (isEn ? 'No recommended quality observation in the last 14 days (water fraction, dense vegetation, or RFI).' : 'বিগত ১৪ দিনে কোনো গ্রহণযোগ্য মানের পর্যবেক্ষণ পাওয়া যায়নি (অতিরিক্ত জলাশয় বা ঘন বনায়ন)।')}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed border-t border-[#262626] pt-2">
                    {isEn
                      ? 'Measured at the district HQ point (SMAP 9 km).'
                      : 'জেলা সদর দফতর বিন্দুতে পরিমাপকৃত (SMAP ৯ কিমি)।'}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                  <span>{isEn ? 'Status' : 'অবস্থা'}</span>
                  <span className={isSoilFlaggedWater ? 'text-amber-400 font-semibold' : 'text-white'}>
                    {!smapRecord
                      ? (isEn ? 'No data' : 'তথ্য নেই')
                      : isSoilFlaggedWater
                      ? (isEn ? 'Uncertain' : 'অনিশ্চিত')
                      : (isEn ? activeAdvisory.fieldCondition.smapStatusLabelEn : activeAdvisory.fieldCondition.smapStatusLabelBn)}
                  </span>
                </div>
              </div>

              {/* TILE 4: ESA Sentinel-1 SAR Cropland Waterlogging */}
              <div className="p-4 rounded-xl bg-[#141414] border border-[#262626] flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="ESA Sentinel-1"
                      status={sentinel1Record ? 'snapshot' : 'unavailable'}
                      customLabel={
                        sentinel1Record
                          ? `ESA Sentinel-1 · ${sentinel1Record.observationWindow?.daysCount ?? 12}d SAR`
                          : (isEn ? 'Sentinel-1 · Not available today' : 'সেন্টিনেল-১ · আজকের তথ্য নেই')
                      }
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#A3A3A3]">10m SAR (VV)</span>
                  </div>

                  <span className="text-xs text-[#A3A3A3] block font-mono">
                    {isEn ? 'Cropland Flooding / Waterlogging' : 'ফসলি জমিতে পানি / জলাবদ্ধতা'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {sentinel1Record ? (
                        `${sentinel1Record.floodedCroplandPct.toFixed(1)}%`
                      ) : (
                        <span className="text-base text-slate-400 font-normal">{isEn ? 'Not available today' : 'আজকের তথ্য পাওয়া যায়নি'}</span>
                      )}
                    </span>
                    {sentinel1Record && (
                      <span
                        className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          sentinel1Record.floodedCroplandPct > 10
                            ? 'bg-amber-500/20 text-amber-300'
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}
                      >
                        {sentinel1Record.floodedCroplandPct > 10
                          ? (isEn ? '>10% Alert' : '>১০% সতর্কতা')
                          : (isEn ? 'Safe Drainage' : 'স্বাভাবিক নিষ্কাশন')}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-[#A3A3A3] mt-2 leading-relaxed">
                    {sentinel1Record
                      ? (isEn ? sentinel1Record.statusEn : sentinel1Record.statusBn)
                      : (isEn ? 'No quality microwave SAR observation in the last 12 days.' : 'বিগত ১২ দিনে কোনো গ্রহণযোগ্য রাডার পর্যবেক্ষণ পাওয়া যায়নি।')}
                  </p>

                  <p className="text-[10px] text-slate-400 mt-2 font-mono leading-relaxed border-t border-[#262626] pt-2">
                    {isEn
                      ? 'Copernicus SAR penetrates clouds to map waterlogged fields.'
                      : 'কোপার্নিকাস রাডার মেঘ ভেদ করে ফসলি জমিতে জলাবদ্ধতা শনাক্ত করে।'}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#A3A3A3]">
                  <span>Rule SAR-01</span>
                  <span>{sentinel1Record && sentinel1Record.floodedCroplandPct > 10 ? (isEn ? '-15 Sensitive' : '-১৫ সংবেদনশীল') : (isEn ? 'No penalty' : 'পেনাল্টি নেই')}</span>
                </div>
              </div>
            </div>

            {/* AGRIORBIT ADVISORY CARD */}
            <div className="p-5 rounded-xl bg-[#141414] border border-[#262626] relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-black bg-[#22C55E] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    AGRIORBIT ADVISORY
                  </span>
                  <span className="text-xs font-mono text-[#A3A3A3]">
                    {isEn ? 'Rule-Based Agronomic Action' : 'কৃষি নিয়ম অনুযায়ী করণীয়'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWhyModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#22C55E] hover:underline font-mono cursor-pointer self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Why am I seeing this?' : 'কেন এই পরামর্শ দেওয়া হলো?'}</span>
                </button>
              </div>

              {/* Core Farmer Action Callout */}
              <div className="my-2.5">
                <p className="font-editorial text-base sm:text-lg font-bold text-[#22C55E] leading-snug">
                  "{isEn ? activeAdvisory.advisory.recommendedActionEn : activeAdvisory.advisory.recommendedActionBn}"
                </p>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {isEn ? activeAdvisory.advisory.agronomicRationaleEn : activeAdvisory.advisory.agronomicRationaleBn}
                </p>
              </div>

              {/* Crop-Specific Operation Note */}
              {activeAdvisory.advisory.cropSpecificNoteEn && (
                <div className="mt-3 p-3 rounded-xl bg-[#0A0A0A] border border-[#262626] flex items-start gap-2.5 text-xs text-amber-200">
                  <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-300 mr-1.5">
                      {isEn ? 'Crop-Specific Context:' : 'সুনির্দিষ্ট ফসলের জন্য:'}
                    </span>
                    <span>
                      {isEn ? activeAdvisory.advisory.cropSpecificNoteEn : activeAdvisory.advisory.cropSpecificNoteBn}
                    </span>
                  </div>
                </div>
              )}

              {/* Provenance Footer */}
              <div className="mt-3 pt-3 border-t border-[#262626] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#A3A3A3]">
                <span>{isEn ? activeAdvisory.dataSourceStatus.provenanceLabelEn : activeAdvisory.dataSourceStatus.provenanceLabelBn}</span>
                <span className="text-white/50">Rule ID: {activeAdvisory.ruleId}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* "WHY AM I SEEING THIS?" TRANSPARENCY MODAL */}
      {showWhyModal && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-[#141414] border border-[#262626] p-6 sm:p-8 text-[#FAFAFA] font-editorial">
            <div className="flex items-center justify-between pb-4 border-b border-[#262626] mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#22C55E]" />
                <h4 className="font-display text-lg sm:text-xl font-bold">
                  {isEn ? 'Transparent Advisory Reasoning' : 'পরামর্শ নির্ধারণের স্বচ্ছ তথ্য ও নিয়ম'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[#A3A3A3] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scientific Architecture Explanation */}
            <div className="space-y-4 text-xs sm:text-sm text-[#A3A3A3]">
              <div className="p-4 rounded-xl bg-[#0A0A0A] border border-[#262626] space-y-2">
                <span className="font-mono text-xs text-[#FAFAFA] font-bold block uppercase tracking-wider">
                  {isEn ? 'Scientific Provenance Chain' : 'তথ্যের উৎস ও দায়িত্বের বিভাজন'}
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">NASA POWER (precipitation):</strong> {isEn ? 'Observes what is happening (recent rainfall estimates on a ~10 km satellite/model grid).' : 'নাসা পাওয়ার পর্যবেক্ষণ করে অতীতে কী বৃষ্টিপাত হয়েছে (~১০ কিমি গ্রিড)।'}
                  </p>
                  <p>
                    <strong className="text-white">Open-Meteo:</strong> {isEn ? 'Provides what is expected (next 7-day numerical weather precipitation forecast).' : 'ওপেন-মেটিও আগামী ৭ দিনের সম্ভাব্য বৃষ্টিপাতের পূর্বাভাস দেয়।'}
                  </p>
                  <p>
                    <strong className="text-white">AgriOrbit:</strong> {isEn ? 'Explains what the farmer should consider doing via deterministic agronomic rules.' : 'এগ্রিঅরবিট এই দুই তথ্য মিলিয়ে সুনির্দিষ্ট কৃষি নিয়মের ভিত্তিতে কৃষকের জন্য করণীয় নির্ধারণ করে।'}
                  </p>
                </div>
              </div>

              {/* Exact Rules Triggered */}
              <div>
                <span className="font-mono text-xs text-white font-bold block mb-2">
                  {isEn ? 'Triggered Deterministic Rules:' : 'কার্যকর হওয়া নিয়মাবলি:'}
                </span>
                <ul className="space-y-1.5 font-mono text-xs">
                  {activeAdvisory.whyExplanation.rulesTriggered.map((rule, idx) => (
                    <li key={idx} className="p-2 rounded-lg bg-white/5 border border-[#262626] text-[#22C55E] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
                      <span>{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Parameter & Threshold Table */}
              <div>
                <span className="font-mono text-xs text-white font-bold block mb-2">
                  {isEn ? 'Evaluated Parameters vs Thresholds:' : 'মূল্যায়নকৃত প্যারামিটার ও সীমা:'}
                </span>
                <div className="overflow-x-auto rounded-lg border border-[#262626] bg-[#0A0A0A]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/5 border-b border-[#262626] text-[#A3A3A3]">
                      <tr>
                        <th className="p-2.5">Parameter</th>
                        <th className="p-2.5">Observed</th>
                        <th className="p-2.5">Threshold</th>
                        <th className="p-2.5">Condition</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                      {activeAdvisory.whyExplanation.thresholdsEvaluated.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-semibold text-white">{item.parameter}</td>
                          <td className="p-2.5 text-[#FAFAFA]">{item.observedValue}</td>
                          <td className="p-2.5 text-[#A3A3A3]">{item.thresholdCondition}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.satisfied ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-[#A3A3A3]'}`}>
                              {item.satisfied ? 'Active' : 'Normal'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Honest Scientific Disclaimer */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-[#262626] text-[11px] text-[#A3A3A3] leading-relaxed">
                <span className="font-bold text-white block mb-0.5">
                  {isEn ? 'Scientific Integrity Note:' : 'সঠিক তথ্যের নিশ্চয়তা:'}
                </span>
                {isEn ? activeAdvisory.whyExplanation.scientificNotesEn : activeAdvisory.whyExplanation.scientificNotesBn}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#262626] flex justify-end">
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2 rounded-lg bg-[#22C55E] hover:bg-[#16a34a] text-black font-semibold text-xs cursor-pointer"
              >
                {isEn ? 'Close Explanation' : 'বন্ধ করুন'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
