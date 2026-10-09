import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crosshair,
  Globe,
  Layers,
  MapPin,
  Satellite,
} from 'lucide-react';
import { BD_DISTRICTS, BD_DIVISIONS, getDistrictAdmin, type DistrictId } from '../../data/bdAdmin';
import type { Language, SelectedLocation } from '../../types';
import { getNasaContext, nasaSourceLabel } from '../../lib/nasaContext';
import {
  DISTRICT_WIDE_UPAZILA,
  formatLocation,
  getDistrictProfile,
  getUpazilasFor,
  locationFromDistrict,
} from '../../lib/location';
import { matchUpazila, reverseGeocode } from '../../lib/geocode';
import { BangladeshMap, type MapFlyTarget } from '../map/BangladeshMap';

interface FarmLocationStepProps {
  location: SelectedLocation;
  onChangeLocation: (location: SelectedLocation) => void;
  language: Language;
  onContinue: () => void;
  onBack: () => void;
}

const PRESETS: { name: string; district: DistrictId; dLat: number; dLng: number }[] = [
  { name: 'North Paddy Field #1', district: 'rangpur', dLat: 0.008, dLng: 0.006 },
  { name: 'South Alluvial Basin #4', district: 'rangpur', dLat: -0.012, dLng: 0.004 },
  { name: 'Riverbank Silt Plot #9', district: 'rangpur', dLat: -0.004, dLng: -0.011 },
  { name: 'Village Uplands #14 (Default)', district: 'rangpur', dLat: 0.0, dLng: 0.0 },
];

const SOURCE_LABEL: Record<SelectedLocation['source'], { en: string; bn: string }> = {
  init: { en: 'Demo default', bn: 'ডেমো অবস্থান' },
  'district-selector': { en: 'District selector', bn: 'জেলা নির্বাচন' },
  'upazila-selector': { en: 'Upazila selector', bn: 'উপজেলা নির্বাচন' },
  'map-click': { en: 'Map click', bn: 'মানচিত্রে ক্লিক' },
  preset: { en: 'Plot preset', bn: 'প্লট নির্বাচন' },
};

export const FarmLocationStep: React.FC<FarmLocationStepProps> = ({
  location,
  onChangeLocation,
  language,
  onContinue,
  onBack,
}) => {
  const [flyTarget, setFlyTarget] = useState<MapFlyTarget | null>(null);
  const [resolving, setResolving] = useState(false);
  const [outsideMessage, setOutsideMessage] = useState(false);
  const flyNonce = useRef(0);
  const requestSeq = useRef(0);

  const names = formatLocation(location, language);
  const upazilas = getUpazilasFor(location.district);
  const nasa = getNasaContext(location.district);
  const sourceLabel = SOURCE_LABEL[location.source];

  const flyTo = (lng: number, lat: number, zoom: number) => {
    flyNonce.current += 1;
    setFlyTarget({ lng, lat, zoom, nonce: flyNonce.current });
  };

  const handleDistrictChange = (districtId: DistrictId) => {
    const next = locationFromDistrict(districtId, undefined, 'district-selector');
    onChangeLocation(next);
    setOutsideMessage(false);
    const admin = getDistrictAdmin(districtId);
    if (admin) flyTo(admin.lng, admin.lat, 9);
  };

  const handleUpazilaChange = (upazilaId: string) => {
    onChangeLocation({ ...location, upazila: upazilaId, source: 'upazila-selector' });
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;
    setResolving(true);
    setOutsideMessage(false);
    const geo = await reverseGeocode(lat, lng);
    if (seq !== requestSeq.current) return;
    setResolving(false);

    if (geo.outsideBangladesh) {
      onChangeLocation({ ...location, latitude: lat, longitude: lng, source: 'map-click' });
      setOutsideMessage(true);
      return;
    }

    const sameDistrict = geo.district.id === location.district;
    const candidates = getUpazilasFor(geo.district.id as DistrictId);
    const matchedUpazila = matchUpazila(candidates, geo.addressHint);
    onChangeLocation({
      latitude: lat,
      longitude: lng,
      district: geo.district.id as DistrictId,
      upazila: matchedUpazila ?? (sameDistrict ? location.upazila : candidates[0]?.id ?? DISTRICT_WIDE_UPAZILA),
      source: 'map-click',
    });
  };

  const handlePreset = (preset: (typeof PRESETS)[number]) => {
    const admin = getDistrictAdmin(preset.district);
    if (!admin) return;
    const lat = Number((admin.lat + preset.dLat).toFixed(4));
    const lng = Number((admin.lng + preset.dLng).toFixed(4));
    const presetUpazilas = getUpazilasFor(preset.district);
    onChangeLocation({
      latitude: lat,
      longitude: lng,
      district: preset.district,
      upazila: presetUpazilas[0]?.id ?? DISTRICT_WIDE_UPAZILA,
      source: 'preset',
    });
    setOutsideMessage(false);
    flyTo(lng, lat, 12);
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D] font-editorial relative">
      <div className="w-full max-w-6xl bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative z-10">
        {/* Navigation / Progress Header */}
        <div className="flex items-center justify-between pb-6 mb-8 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-xs font-semibold text-[#8FA3B8] hover:text-white flex items-center gap-2 cursor-pointer transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{language === 'en' ? 'Back to Overview' : 'পূর্ববর্তী পাতা'}</span>
          </button>

          <div className="flex items-center gap-2 font-mono text-xs text-[#00E5FF]">
            <span className="font-bold text-[#050B14] bg-[#B8FF3D] px-2.5 py-0.5 rounded text-xs">01</span>
            <span className="text-[#8FA3B8]">/ 03</span>
            <span className="font-sans font-semibold text-white ml-1">
              {language === 'en' ? 'Farm Location' : 'খামারের অবস্থান'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-2">
            <MapPin className="w-3.5 h-3.5 text-[#B8FF3D]" />
            <span>{language === 'en' ? 'LOCATION SELECTION' : 'অবস্থান নির্ধারণ'}</span>
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
            {language === 'en' ? 'Pinpoint Your Farm Location' : 'আপনার খামারের অবস্থান নির্ধারণ করুন'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1 max-w-2xl leading-relaxed">
            {language === 'en'
              ? 'Select your district and upazila, or click directly on the interactive map. The 5 km observation circle synchronizes with NASA datasets.'
              : 'জেলা ও উপজেলা নির্বাচন করুন অথবা মানচিত্রে সরাসরি জমিতে ক্লিক করুন। ৫ কিমি ব্যাসার্ধের বৃত্তটি নাসার উপগ্রহ তথ্যের সাথে সংযুক্ত।'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT: Selectors & Details (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* District Dropdown */}
            <div>
              <label className="block text-xs font-mono font-bold text-white mb-2 uppercase tracking-wider">
                {language === 'en' ? 'District / জেলা' : 'জেলা'}
              </label>
              <div className="relative">
                <select
                  value={location.district}
                  onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
                  className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#B8FF3D]/60 cursor-pointer appearance-none"
                >
                  {BD_DIVISIONS.map((div) => (
                    <optgroup
                      key={div.nameEn}
                      label={language === 'en' ? `${div.nameEn} Division` : `${div.nameBn} বিভাগ`}
                    >
                      {(BD_DISTRICTS as readonly { id: string; nameEn: string; nameBn: string; division: string }[])
                        .filter((d) => d.division === div.nameEn)
                        .map((d) => (
                          <option key={d.id} value={d.id} className="bg-[#050B14] text-white">
                            {language === 'en' ? d.nameEn : d.nameBn}
                          </option>
                        ))}
                    </optgroup>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF] text-xs">▼</div>
              </div>
            </div>

            {/* Upazila Dropdown */}
            <div>
              <label className="block text-xs font-mono font-bold text-white mb-2 uppercase tracking-wider">
                {language === 'en' ? 'Upazila / উপজেলা' : 'উপজেলা'}
              </label>
              <div className="relative">
                <select
                  value={location.upazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#B8FF3D]/60 cursor-pointer appearance-none"
                >
                  {upazilas.length > 0 ? (
                    upazilas.map((upz) => (
                      <option key={upz.id} value={upz.id} className="bg-[#050B14] text-white">
                        {language === 'en' ? upz.nameEn : upz.nameBn}
                      </option>
                    ))
                  ) : (
                    <option value={DISTRICT_WIDE_UPAZILA} className="bg-[#050B14] text-white">
                      {language === 'en' ? 'District-wide' : 'সমগ্র জেলা'}
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF] text-xs">▼</div>
              </div>
            </div>

            {/* Selected Location Summary Card */}
            <div className="p-5 rounded-2xl bg-[#050B14] border border-[#B8FF3D]/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs uppercase font-mono text-[#B8FF3D] font-bold">
                  {language === 'en' ? 'Selected Field Coordinates' : 'নির্বাচিত জমির স্থানাঙ্ক'}
                </span>
                <span className="text-[10px] font-mono text-[#8FA3B8]">
                  {language === 'en' ? sourceLabel.en : sourceLabel.bn}
                </span>
              </div>
              <p className="text-base font-bold text-white">
                {names.district} · {names.upazila}
                {names.upazila !== (language === 'en' ? 'District-wide' : 'সমগ্র জেলা') &&
                  (language === 'en' ? ' Upazila' : ' উপজেলা')}
              </p>
              <div className="flex items-center gap-4 font-mono text-xs text-[#8FA3B8]">
                <span>
                  LAT <strong className="text-white font-bold">{location.latitude}° N</strong>
                </span>
                <span>
                  LNG <strong className="text-white font-bold">{location.longitude}° E</strong>
                </span>
                {resolving && <span className="text-[#00E5FF] animate-pulse">Resolving…</span>}
              </div>
              {outsideMessage && (
                <p className="text-xs text-[#FF5C5C] font-semibold pt-1">
                  {language === 'en'
                    ? 'Please select a field within Bangladesh.'
                    : 'অনুগ্রহ করে বাংলাদেশের সীমানার ভেতরে জমি নির্বাচন করুন।'}
                </p>
              )}
            </div>

            {/* Quick Plot Presets */}
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#8FA3B8] block mb-2">
                {language === 'en' ? 'Demo Plot Presets:' : 'ডেমো প্লট নির্বাচন:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePreset(preset)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#8FA3B8] hover:text-white font-medium transition cursor-pointer"
                  >
                    📍 {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Telemetry Snapshot Preview */}
            <div className="p-4 rounded-xl bg-[#050B14] border border-white/10 text-xs space-y-2">
              <div className="flex items-center justify-between text-xs text-[#8FA3B8]">
                <span className="font-mono">{nasaSourceLabel(nasa, names.district, language)}</span>
                <span className="font-bold text-[#00E5FF]">5 km Context</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-center pt-1">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="block text-[10px] text-[#8FA3B8]">Rainfall</span>
                  <span className="text-white font-bold">{nasa.power.rainfallMm} mm</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="block text-[10px] text-[#8FA3B8]">Soil H₂O</span>
                  <span className="text-white font-bold">{nasa.smap.surfaceMoisture}</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <span className="block text-[10px] text-[#8FA3B8]">NDVI</span>
                  <span className="text-[#B8FF3D] font-bold">{nasa.modis.ndvi}</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Map Canvas (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="rounded-2xl overflow-hidden border border-white/15 shadow-2xl bg-[#050B14]">
              <BangladeshMap
                latitude={location.latitude}
                longitude={location.longitude}
                onSelect={handleMapSelect}
                flyTarget={flyTarget}
              >
                <div className="absolute top-4 left-4 z-10 bg-[#050B14]/90 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/10 text-xs font-mono flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#B8FF3D] animate-pulse" />
                  <span>Click anywhere in Bangladesh to reposition pin</span>
                </div>
              </BangladeshMap>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end gap-4 pt-2">
              <button
                onClick={onContinue}
                className="px-8 py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/90 text-[#050B14] font-bold text-sm tracking-tight transition-all duration-150 transform hover:-translate-y-0.5 shadow-xl shadow-[#B8FF3D]/20 flex items-center gap-2 cursor-pointer"
              >
                <span>{language === 'en' ? 'Continue to Priorities' : 'পরবর্তী ধাপ: লক্ষ্য নির্বাচন'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
