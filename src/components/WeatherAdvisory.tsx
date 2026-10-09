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

export interface WeatherAdvisoryProps {
  districtId: DistrictId | string;
  upazilaName?: string;
  lat?: number;
  lng?: number;
  soilMoisture?: number;
  priority?: FarmerPriorityId;
  language?: Language;
  onDismiss?: () => void;
  className?: string;
}

/**
 * 2. Field Action Weather Advisory Banner
 *
 * SCIENTIFIC FOUNDATION:
 *   NASA GPM / IMERG (Recent rainfall observation / estimate - ~10km grid)
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

  // Instant deterministic initial advisory from bundled snapshot to guarantee zero blank screens
  const defaultInitialAdvisory = useMemo(() => {
    const bundled = fallbackRangpur as LocationCache;
    const gpm = computeGpmMetricsFromDaily(bundled.daily.PRECTOTCORR, 'bundled', bundled.fetchedAt);
    const forecast = computeForecastMetrics(bundled.forecast, 'bundled', bundled.fetchedAt);
    return evaluateWeatherAdvisory({
      gpm,
      forecast,
      soilMoisture,
      districtId,
      upazilaName,
      farmerPriority: priority,
    });
  }, [districtId, upazilaName, soilMoisture, priority]);

  // Dynamic field-specific update whenever district, upazila, coordinates, or soil moisture changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    getWeatherAdvisoryForLocation(districtId, lat, lng, soilMoisture, priority, {
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
      border: 'border-red-500/30',
      bgGradient: 'from-red-950/40 via-[#0B1626]/95 to-red-950/30',
      text: 'text-red-200',
      accent: 'text-red-400',
      ping: 'bg-red-400',
      badge: 'bg-red-500/20 text-red-300 border-red-500/30',
    },
    warning: {
      border: 'border-amber-500/30',
      bgGradient: 'from-amber-950/40 via-[#0B1626]/95 to-amber-950/30',
      text: 'text-amber-200',
      accent: 'text-amber-400',
      ping: 'bg-amber-400',
      badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    info: {
      border: 'border-[#00E5FF]/30',
      bgGradient: 'from-cyan-950/40 via-[#0B1626]/95 to-cyan-950/30',
      text: 'text-cyan-200',
      accent: 'text-[#00E5FF]',
      ping: 'bg-[#00E5FF]',
      badge: 'bg-[#00E5FF]/20 text-cyan-300 border-[#00E5FF]/30',
    },
    success: {
      border: 'border-[#B8FF3D]/30',
      bgGradient: 'from-emerald-950/30 via-[#0B1626]/95 to-emerald-950/20',
      text: 'text-emerald-200',
      accent: 'text-[#B8FF3D]',
      ping: 'bg-[#B8FF3D]',
      badge: 'bg-[#B8FF3D]/20 text-emerald-300 border-[#B8FF3D]/30',
    },
  }[activeAdvisory.severity];

  return (
    <div
      role="region"
      aria-label="Weather Advisory"
      className={`relative w-full border-b ${severityColors.border} bg-gradient-to-r ${severityColors.bgGradient} backdrop-blur-md transition-all duration-300 ${className}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* COLLAPSED VIEW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            {/* Live Radar Pulse Indicator */}
            <div className="relative flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
              <span className={`absolute inline-flex h-3 w-3 rounded-full ${severityColors.ping} opacity-75 animate-ping`} />
              <span className={`relative inline-flex items-center justify-center rounded-lg p-1.5 ${severityColors.badge} border`}>
                {activeAdvisory.severity === 'danger' || activeAdvisory.severity === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                ) : (
                  <CloudRain className="w-4 h-4 text-[#00E5FF] shrink-0" />
                )}
              </span>
            </div>

            {/* Headline and Provenance */}
            <div className="flex-1 min-w-0 text-xs sm:text-sm font-medium leading-snug">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${severityColors.badge}`}>
                  {isEn ? 'WEATHER ADVISORY' : 'আবহাওয়া উপদেষ্টা'}
                </span>
                <span className="text-[11px] font-mono text-[#8FA3B8] hidden md:inline">
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
              className="text-xs font-mono font-bold text-[#00E5FF] hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <span>{isExpanded ? (isEn ? 'Collapse ↑' : 'সংক্ষেপ করুন ↑') : (isEn ? 'View Details →' : 'বিস্তারিত দেখুন →')}</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label={isEn ? 'Dismiss alert' : 'সতর্কতা বাতিল করুন'}
              title={isEn ? 'Dismiss alert' : 'সতর্কতা বাতিল করুন'}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#8FA3B8] hover:text-white transition-colors cursor-pointer border border-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* EXPANDED SCIENTIFIC VIEW */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-4 animate-in fade-in duration-300">
            {/* Header Title with Field Coordinates Context */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
              <div>
                <span className="text-[10px] font-mono text-[#00E5FF] uppercase tracking-wider font-bold block mb-0.5">
                  {isEn ? 'FIELD ACTION ADVISORY' : 'মাঠ পর্যায়ের কার্যকারী পরামর্শ'}
                </span>
                <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                  {isEn ? activeAdvisory.titleEn : activeAdvisory.titleBn}
                </h3>
              </div>
              <div className="text-[11px] font-mono text-[#8FA3B8] bg-[#050B14]/80 px-3 py-1 rounded-lg border border-white/10 self-start sm:self-center">
                <span>{upazilaName}</span>
                <span className="mx-1.5 text-white/30">·</span>
                <span>{lat.toFixed(2)}°N, {lng.toFixed(2)}°E</span>
              </div>
            </div>

            {/* 3 SCIENTIFIC TILES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {/* TILE 1: NASA GPM Observation */}
              <div className="p-4 rounded-2xl bg-[#0B1626]/90 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="NASA GPM"
                      status={activeAdvisory.gpm.dataStatus === 'live' ? 'live' : activeAdvisory.gpm.dataStatus === 'cached' ? 'cached' : 'snapshot'}
                      date={activeAdvisory.gpm.updatedAt}
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#8FA3B8]">
                      {activeAdvisory.gpm.spatialResolution}
                    </span>
                  </div>

                  <span className="text-xs text-[#8FA3B8] block font-mono">
                    {isEn ? 'Recent Observed Rainfall' : 'সাম্প্রতিক বৃষ্টিপাত পর্যবেক্ষণ'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {activeAdvisory.gpm.recentRain7dMm} <span className="text-xs font-normal text-[#8FA3B8]">mm</span>
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

                  <p className="text-xs text-[#8FA3B8] mt-2 leading-relaxed">
                    {isEn ? activeAdvisory.gpm.observedSummaryEn : activeAdvisory.gpm.observedSummaryBn}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8FA3B8]">
                  <span>NASA GPM / IMERG</span>
                  <span>{activeAdvisory.gpm.observationWindow.daysCount} days</span>
                </div>
              </div>

              {/* TILE 2: Open-Meteo 7-Day Forecast */}
              <div className="p-4 rounded-2xl bg-[#0B1626]/90 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="Open-Meteo"
                      status={activeAdvisory.forecast.dataStatus === 'live' ? 'live' : activeAdvisory.forecast.dataStatus === 'cached' ? 'cached' : 'snapshot'}
                      date={activeAdvisory.forecast.updatedAt}
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#8FA3B8]">7-Day ECMWF/GFS</span>
                  </div>

                  <span className="text-xs text-[#8FA3B8] block font-mono">
                    {isEn ? '7-Day Precipitation Forecast' : '৭ দিনের বৃষ্টিপাত পূর্বাভাস'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {activeAdvisory.forecast.totalRain7dMm} <span className="text-xs font-normal text-[#8FA3B8]">mm expected</span>
                    </span>
                  </div>

                  <p className="text-xs text-[#8FA3B8] mt-2 leading-relaxed">
                    {isEn ? activeAdvisory.forecast.forecastSummaryEn : activeAdvisory.forecast.forecastSummaryBn}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8FA3B8]">
                  <span>Peak: {activeAdvisory.forecast.peakRainMm} mm</span>
                  <span>{activeAdvisory.forecast.rainDaysCount} rain days</span>
                </div>
              </div>

              {/* TILE 3: Field Condition (Soil Moisture) */}
              <div className="p-4 rounded-2xl bg-[#0B1626]/90 border border-white/10 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                    <DataTileStatusBadge
                      sourceName="NASA SMAP"
                      status="snapshot"
                      date="2026-10-06"
                      language={language}
                    />
                    <span className="text-[10px] font-mono text-[#8FA3B8]">SPL3SMP_E (9km)</span>
                  </div>

                  <span className="text-xs text-[#8FA3B8] block font-mono">
                    {isEn ? 'Root-Zone Soil Moisture' : 'মাটির মূলস্তরের আর্দ্রতা'}
                  </span>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold text-white">
                      {isEn ? activeAdvisory.fieldCondition.soilMoistureStatus : activeAdvisory.fieldCondition.soilMoistureStatusBn}
                    </span>
                    <span className="text-xs font-mono text-[#00E5FF]">
                      {activeAdvisory.fieldCondition.soilMoistureValue.toFixed(2)} m³/m³
                    </span>
                  </div>

                  <p className="text-xs text-[#8FA3B8] mt-2 leading-relaxed">
                    {isEn ? activeAdvisory.fieldCondition.rootZoneInsightEn : activeAdvisory.fieldCondition.rootZoneInsightBn}
                  </p>
                </div>

                <div className="pt-2.5 mt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-[#8FA3B8]">
                  <span>{isEn ? 'Status' : 'অবস্থা'}</span>
                  <span className="text-white">{isEn ? activeAdvisory.fieldCondition.smapStatusLabelEn : activeAdvisory.fieldCondition.smapStatusLabelBn}</span>
                </div>
              </div>
            </div>

            {/* AGRIORBIT ADVISORY CARD */}
            <div className="p-5 rounded-2xl bg-[#050B14] border border-[#B8FF3D]/40 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold text-[#050B14] bg-[#B8FF3D] px-2.5 py-0.5 rounded uppercase tracking-wider">
                    AGRIORBIT ADVISORY
                  </span>
                  <span className="text-xs font-mono text-[#8FA3B8]">
                    {isEn ? 'Rule-Based Agronomic Action' : 'নিয়মভিত্তিক কৃষি সিদ্ধান্ত'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowWhyModal(true)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#00E5FF] hover:text-white font-mono hover:underline cursor-pointer self-start sm:self-auto"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>{isEn ? 'Why am I seeing this?' : 'আমি কেন এটি দেখছি?'}</span>
                </button>
              </div>

              {/* Core Farmer Action Callout */}
              <div className="my-2.5">
                <p className="font-editorial text-base sm:text-lg font-bold text-[#B8FF3D] leading-snug">
                  "{isEn ? activeAdvisory.advisory.recommendedActionEn : activeAdvisory.advisory.recommendedActionBn}"
                </p>
                <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                  {isEn ? activeAdvisory.advisory.agronomicRationaleEn : activeAdvisory.advisory.agronomicRationaleBn}
                </p>
              </div>

              {/* Crop-Specific Operation Note */}
              {activeAdvisory.advisory.cropSpecificNoteEn && (
                <div className="mt-3 p-3 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 text-xs text-amber-200">
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
              <div className="mt-3 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#8FA3B8]">
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
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0B1626] border border-white/20 p-6 sm:p-8 shadow-2xl text-white font-editorial">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#B8FF3D]" />
                <h4 className="font-display text-lg sm:text-xl font-bold">
                  {isEn ? 'Transparent Advisory Reasoning' : 'পরামর্শ নির্ধারণের স্বচ্ছ তথ্য ও নিয়ম'}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="p-1.5 rounded-xl hover:bg-white/10 text-[#8FA3B8] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scientific Architecture Explanation */}
            <div className="space-y-4 text-xs sm:text-sm text-[#8FA3B8]">
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/10 space-y-2">
                <span className="font-mono text-xs text-[#00E5FF] font-bold block uppercase tracking-wider">
                  {isEn ? 'Scientific Provenance Chain' : 'তথ্যের উৎস ও দায়িত্বের বিভাজন'}
                </span>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <p>
                    <strong className="text-white">NASA GPM:</strong> {isEn ? 'Observes what is happening (recent rainfall estimates on a ~10 km satellite grid).' : 'নাসার জিপিএম স্যাটেলাইট পর্যবেক্ষণ করে অতীতে কী বৃষ্টিপাত হয়েছে (~১০ কিমি গ্রিড)।'}
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
                    <li key={idx} className="p-2 rounded-lg bg-white/5 border border-white/10 text-[#B8FF3D] flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#B8FF3D] shrink-0" />
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
                <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#050B14]">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-white/5 border-b border-white/10 text-[#8FA3B8]">
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
                          <td className="p-2.5 text-[#00E5FF]">{item.observedValue}</td>
                          <td className="p-2.5 text-[#8FA3B8]">{item.thresholdCondition}</td>
                          <td className="p-2.5">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${item.satisfied ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-[#8FA3B8]'}`}>
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
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-[11px] text-[#8FA3B8] leading-relaxed">
                <span className="font-bold text-white block mb-0.5">
                  {isEn ? 'Scientific Integrity Note:' : 'বৈজ্ঞানিক সততা সম্পর্কিত বিজ্ঞপ্তি:'}
                </span>
                {isEn ? activeAdvisory.whyExplanation.scientificNotesEn : activeAdvisory.whyExplanation.scientificNotesBn}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => setShowWhyModal(false)}
                className="px-5 py-2 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-xs cursor-pointer"
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
