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
    if (seq !== requestSeq.current) return; // superseded by a newer selection
    setResolving(false);

    if (geo.outsideBangladesh) {
      // Keep the exact pin, but do not touch the Bangladesh selectors.
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
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00E5FF]/10 blur-[120px] pointer-events-none rounded-full" />

      <div className="w-full max-w-6xl bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#00E5FF]">
            <span className="font-bold text-[#050B14] bg-[#00E5FF] px-2 py-0.5 rounded text-[11px]">01</span>
            <span className="text-[#8FA3B8]">/ 03</span>
            <span className="font-sans font-semibold text-[#8FA3B8] ml-1">
              {language === 'en' ? 'Farm Location' : 'খামারের অবস্থান'}
            </span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#B8FF3D]/10 border border-[#B8FF3D]/30 flex items-center justify-center mb-2 shadow-md">
            <MapPin className="w-5 h-5 text-[#B8FF3D]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'Select Your Farm Location' : 'আপনার খামারের অবস্থান নির্বাচন করুন'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
            {language === 'en'
              ? 'Choose your district and upazila, or click your field directly on the map — both stay in sync.'
              : 'জেলা ও উপজেলা নির্বাচন করুন অথবা মানচিত্রে সরাসরি জমিতে ক্লিক করুন — উভয়ই সমন্বিত থাকবে।'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT: selectors + location summary */}
          <div className="space-y-4">
            {/* District Dropdown */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'District / জেলা' : 'জেলা'}
              </label>
              <div className="relative">
                <select
                  value={location.district}
                  onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
                  className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#00E5FF]/60 cursor-pointer appearance-none"
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
                <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF]">▼</div>
              </div>
              <p className="text-[11px] text-[#8FA3B8] mt-1">
                {language === 'en'
                  ? 'All 64 districts of Bangladesh, grouped by division.'
                  : 'বিভাগ অনুযায়ী বাংলাদেশের সকল ৬৪টি জেলা।'}
              </p>
            </div>

            {/* Upazila Dropdown */}
            <div>
              <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">
                {language === 'en' ? 'Upazila / উপজেলা' : 'উপজেলা'}
              </label>
              <div className="relative">
                <select
                  value={location.upazila}
                  onChange={(e) => handleUpazilaChange(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#050B14] border border-white/10 text-white text-sm font-semibold focus:outline-none focus:border-[#00E5FF]/60 cursor-pointer appearance-none"
                >
                  {upazilas.length > 0 ? (
                    upazilas.map((upz) => (
                      <option key={upz.id} value={upz.id} className="bg-[#050B14] text-white">
                        {language === 'en' ? upz.nameEn : upz.nameBn}
                      </option>
                    ))
                  ) : (
                    <option value={DISTRICT_WIDE_UPAZILA} className="bg-[#050B14] text-white">
                      {language === 'en' ? 'District-wide (upazila list coming soon)' : 'সমগ্র জেলা (উপজেলা তালিকা শীঘ্রই)'}
                    </option>
                  )}
                </select>
                <div className="pointer-events-none absolute right-4 top-3.5 text-[#00E5FF]">▼</div>
              </div>
            </div>

            {/* Selected Location Card */}
            <div className="p-4 rounded-2xl bg-[#050B14] border border-[#B8FF3D]/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <Layers className="w-4 h-4 text-[#B8FF3D]" />
                  <span>{language === 'en' ? 'Selected Location' : 'নির্বাচিত অবস্থান'}</span>
                </div>
                <span className="text-[10px] font-mono text-[#8FA3B8]">
                  {language === 'en' ? sourceLabel.en : sourceLabel.bn}
                </span>
              </div>
              <p className="text-sm font-bold text-white">
                {names.district} · {names.upazila}
                {names.upazila !== (language === 'en' ? 'District-wide' : 'সমগ্র জেলা') &&
                  (language === 'en' ? ' Upazila' : ' উপজেলা')}{' '}
                · Bangladesh
              </p>
              <div className="flex items-center gap-4 font-mono text-xs text-[#8FA3B8]">
                <span>
                  LAT <strong className="text-white text-sm">{location.latitude}° N</strong>
                </span>
                <span>
                  LNG <strong className="text-white text-sm">{location.longitude}° E</strong>
                </span>
                {resolving && <span className="text-[#00E5FF] animate-pulse">…</span>}
              </div>
              {outsideMessage && (
                <p className="text-xs text-[#FF5C5C] font-semibold">
                  {language === 'en'
                    ? 'Please select a field within Bangladesh.'
                    : 'অনুগ্রহ করে বাংলাদেশের ভেতরে জমি নির্বাচন করুন।'}
                </p>
              )}
            </div>

            {/* Quick Plot Presets */}
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8FF3D] block mb-2">
                {language === 'en' ? 'Quick Plot Presets:' : 'দ্রুত প্লট নির্বাচন:'}
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

            {/* NASA context status */}
            <div className="p-4 rounded-2xl bg-[#050B14] border border-[#00E5FF]/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Satellite className="w-4 h-4 text-[#00E5FF]" />
                <span>{language === 'en' ? 'NASA Observation Context' : 'নাসা পর্যবেক্ষণ প্রেক্ষাপট'}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 font-mono text-center">
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-[#8FA3B8]">
                    {language === 'en' ? 'Rainfall' : 'বৃষ্টি'}
                  </span>
                  <strong className="text-white text-sm">{nasa.power.rainfallMm}mm</strong>
                  <span className={`block text-[10px] font-bold ${nasa.power.rainfallAnomalyPct < 0 ? 'text-[#FF5C5C]' : 'text-[#B8FF3D]'}`}>
                    {nasa.power.rainfallAnomalyPct}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-[#8FA3B8]">
                    {language === 'en' ? 'Soil H₂O' : 'মাটির রস'}
                  </span>
                  <strong className="text-white text-sm">{nasa.smap.surfaceMoisture}</strong>
                  <span className="block text-[10px] text-[#8FA3B8]">m³/m³</span>
                </div>
                <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                  <span className="block text-[10px] text-[#8FA3B8]">NDVI</span>
                  <strong className="text-white text-sm">{nasa.modis.ndvi}</strong>
                  <span className="block text-[10px] text-[#B8FF3D]">/ 1.0</span>
                </div>
              </div>
              <p className="text-[11px] text-[#8FA3B8]">
                {nasaSourceLabel(nasa, names.district, language)}{' '}
                <span className="text-[#8FA3B8]/70">
                  {language === 'en'
                    ? '· Pin is exact; satellite data is surrounding grid-cell context.'
                    : '· পিন সঠিক; উপগ্রহ তথ্য আশপাশের গ্রিড প্রেক্ষাপট।'}
                </span>
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={onContinue}
              className="w-full py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-black text-sm shadow-lg shadow-black/40 transition cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{language === 'en' ? 'Continue to Analyze My Field' : 'জমি বিশ্লেষণে এগিয়ে যান'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* RIGHT: real interactive map */}
          <div className="flex flex-col">
            <BangladeshMap
              latitude={location.latitude}
              longitude={location.longitude}
              onSelect={handleMapSelect}
              flyTarget={flyTarget}
            >
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm border border-[#00E5FF]/30 text-[10px] font-mono text-[#00E5FF] pointer-events-none">
                NASA context cell · ~9 km around pin
              </div>
              <button
                type="button"
                onClick={() =>
                  flyTo(BANGLADESH_CENTER_LNG, BANGLADESH_CENTER_LAT, BANGLADESH_OVERVIEW_ZOOM)
                }
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-white border border-white/10 hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Bangladesh overview' : 'বাংলাদেশ মানচিত্র'}</span>
              </button>
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-[#8FA3B8] border border-white/10 pointer-events-none hidden sm:flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>
                  {language === 'en' ? 'Click map to move pin' : 'পিন সরাতে মানচিত্রে ক্লিক করুন'}
                </span>
              </div>
            </BangladeshMap>

            {/* Agro-ecological context */}
            <div className="mt-4 p-4 rounded-2xl bg-[#050B14] border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Check className="w-4 h-4 text-[#B8FF3D]" />
                <span>{language === 'en' ? 'Agro-Ecological Profile' : 'কৃষি-বাস্তুসংস্থান বিবরণ'}</span>
              </div>
              <AgroProfile location={location} language={language} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const BANGLADESH_CENTER_LAT = 23.685;
const BANGLADESH_CENTER_LNG = 90.3563;
const BANGLADESH_OVERVIEW_ZOOM = 5.5;

const AgroProfile: React.FC<{ location: SelectedLocation; language: Language }> = ({
  location,
  language,
}) => {
  const profile = getDistrictProfile(location.district);
  return (
    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
      <div>
        <span className="text-[10px] text-[#8FA3B8] block">Agro-Ecological Zone (AEZ)</span>
        <span className="font-semibold text-white">
          {language === 'en' ? profile.agroZoneEn : profile.agroZoneBn}
        </span>
      </div>
      <div>
        <span className="text-[10px] text-[#8FA3B8] block">Dominant Soil Type</span>
        <span className="font-semibold text-white">
          {language === 'en' ? profile.soilTypeEn : profile.soilTypeBn}
        </span>
      </div>
    </div>
  );
};
