import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Crosshair, Globe, MapPin, Satellite } from 'lucide-react';
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
import { Eyebrow, KV, PrimaryButton, Rule } from '../ui';

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

const BANGLADESH_CENTER_LAT = 23.685;
const BANGLADESH_CENTER_LNG = 90.3563;
const BANGLADESH_OVERVIEW_ZOOM = 5.5;

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
  const profile = getDistrictProfile(location.district);
  const sourceLabel = SOURCE_LABEL[location.source];

  const flyTo = (lng: number, lat: number, zoom: number) => {
    flyNonce.current += 1;
    setFlyTarget({ lng, lat, zoom, nonce: flyNonce.current });
  };

  const handleDistrictChange = (districtId: DistrictId) => {
    onChangeLocation(locationFromDistrict(districtId, undefined, 'district-selector'));
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

  const selectClass =
    'w-full px-3.5 py-2.5 rounded-lg bg-[#050B14] border border-white/10 text-white text-sm font-medium focus:outline-none focus:border-[#00E5FF]/60 cursor-pointer appearance-none';

  return (
    <div className="min-h-screen bg-[#050B14] text-white px-4 sm:px-6 py-8 selection:bg-[#B8FF3D] selection:text-[#050B14]">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1.5 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>
          <p className="tnum text-xs text-[#8FA3B8]">
            <span className="text-[#00E5FF] font-semibold">01</span> / 03 ·{' '}
            {language === 'en' ? 'Farm Location' : 'খামারের অবস্থান'}
          </p>
        </div>

        <div className="mt-6 mb-8 max-w-2xl">
          <Eyebrow tone="lime">{language === 'en' ? 'Step 01 — Location' : 'ধাপ ০১ — অবস্থান'}</Eyebrow>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mt-2">
            {language === 'en' ? 'Select your farm location' : 'খামারের অবস্থান নির্বাচন করুন'}
          </h1>
          <p className="text-sm sm:text-base text-[#8FA3B8] mt-2 leading-relaxed">
            {language === 'en'
              ? 'Pick a district and upazila, or click the field itself. Both update the same location.'
              : 'জেলা ও উপজেলা বাছুন, অথবা জমিতেই ক্লিক করুন। দুটোই একই অবস্থান হালনাগাদ করে।'}
          </p>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8 lg:gap-10 items-start">
          {/* LEFT: controls */}
          <div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-1 gap-4">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8] mb-1.5">
                  {language === 'en' ? 'District' : 'জেলা'}
                </label>
                <div className="relative">
                  <select
                    value={location.district}
                    onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
                    className={selectClass}
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
                  <div className="pointer-events-none absolute right-3.5 top-3 text-[#00E5FF] text-xs">▼</div>
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8] mb-1.5">
                  {language === 'en' ? 'Upazila' : 'উপজেলা'}
                </label>
                <div className="relative">
                  <select
                    value={location.upazila}
                    onChange={(e) => handleUpazilaChange(e.target.value)}
                    className={selectClass}
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
                  <div className="pointer-events-none absolute right-3.5 top-3 text-[#00E5FF] text-xs">▼</div>
                </div>
              </div>
            </div>

            {/* Selected location readout */}
            <dl className="mt-6 border-t border-white/10">
              <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/10">
                <dt className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                  {language === 'en' ? 'Selected field' : 'নির্বাচিত জমি'}
                </dt>
                <dd className="text-sm font-semibold text-white text-right">
                  {names.district} · {names.upazila}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/10">
                <dt className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                  {language === 'en' ? 'Coordinates' : 'স্থানাঙ্ক'}
                </dt>
                <dd className="text-sm text-white tnum">
                  {location.latitude}° N, {location.longitude}° E
                  {resolving && <span className="text-[#00E5FF] animate-pulse"> …</span>}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 py-2.5 border-b border-white/10">
                <dt className="text-[11px] uppercase tracking-wider text-[#8FA3B8]">
                  {language === 'en' ? 'Set via' : 'নির্ধারণ মাধ্যম'}
                </dt>
                <dd className="text-xs text-[#8FA3B8]">
                  {language === 'en' ? sourceLabel.en : sourceLabel.bn}
                </dd>
              </div>
            </dl>
            {outsideMessage && (
              <p className="text-xs text-[#FF5C5C] font-semibold mt-3">
                {language === 'en'
                  ? 'Please select a field within Bangladesh.'
                  : 'অনুগ্রহ করে বাংলাদেশের ভেতরে জমি নির্বাচন করুন।'}
              </p>
            )}

            {/* Presets */}
            <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8] mt-6 mb-2">
              {language === 'en' ? 'Saved plots' : 'সংরক্ষিত প্লট'}
            </p>
            <div className="border-t border-white/10">
              {PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => handlePreset(preset)}
                  className="w-full flex items-center gap-2.5 py-2.5 border-b border-white/10 text-sm text-[#8FA3B8] hover:text-white transition cursor-pointer text-left"
                >
                  <MapPin className="w-3.5 h-3.5 text-[#B8FF3D] shrink-0" />
                  <span className="truncate">{preset.name}</span>
                </button>
              ))}
            </div>

            {/* NASA context */}
            <div className="mt-6">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#8FA3B8] mb-1">
                <Satellite className="w-3.5 h-3.5 text-[#00E5FF]" />
                <span>{language === 'en' ? 'NASA context here' : 'এখানে নাসা প্রেক্ষাপট'}</span>
              </p>
              <dl className="border-t border-white/10">
                <KV label={language === 'en' ? 'Rainfall (30-day)' : 'বৃষ্টিপাত (৩০ দিন)'}>
                  <span className="tnum font-semibold">
                    {nasa.power.rainfallMm} mm · {nasa.power.rainfallAnomalyPct}%
                  </span>
                </KV>
                <KV label={language === 'en' ? 'Soil moisture' : 'মাটির আর্দ্রতা'}>
                  <span className="tnum font-semibold">{nasa.smap.surfaceMoisture} m³/m³</span>
                </KV>
                <KV label={language === 'en' ? 'Vegetation (NDVI)' : 'উদ্ভিদ (এনডিভিআই)'}>
                  <span className="tnum font-semibold">{nasa.modis.ndvi} / 1.0</span>
                </KV>
              </dl>
              <p className="text-[11px] text-[#8FA3B8]/80 mt-2 leading-relaxed">
                {nasaSourceLabel(nasa, names.district, language)}
                {language === 'en'
                  ? ' · 5 km analysis context; satellite native resolutions vary.'
                  : ' · ৫ কিমি বিশ্লেষণ প্রেক্ষাপট; প্রকৃত রেজোলিউশন ভিন্ন।'}
              </p>
            </div>

            <PrimaryButton onClick={onContinue} className="w-full py-3.5 text-base mt-6">
              <span>{language === 'en' ? 'Continue to Analyze My Field' : 'জমি বিশ্লেষণে এগিয়ে যান'}</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>

          {/* RIGHT: map */}
          <div className="min-w-0">
            <BangladeshMap
              latitude={location.latitude}
              longitude={location.longitude}
              onSelect={handleMapSelect}
              flyTarget={flyTarget}
            >
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-sm border border-[#B8FF3D]/30 text-[10px] font-mono text-[#B8FF3D] pointer-events-none">
                NASA observation context · 5 km radius
              </div>
              <button
                type="button"
                onClick={() => flyTo(BANGLADESH_CENTER_LNG, BANGLADESH_CENTER_LAT, BANGLADESH_OVERVIEW_ZOOM)}
                className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/70 backdrop-blur-sm text-[11px] text-white border border-white/10 hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition flex items-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>{language === 'en' ? 'Bangladesh overview' : 'বাংলাদেশ মানচিত্র'}</span>
              </button>
              <div className="absolute bottom-3 right-3 px-3 py-1 rounded-md bg-black/70 backdrop-blur-sm text-[11px] text-[#8FA3B8] border border-white/10 pointer-events-none hidden sm:flex items-center gap-1">
                <Crosshair className="w-3 h-3" />
                <span>{language === 'en' ? 'Click map to move pin' : 'পিন সরাতে মানচিত্রে ক্লিক করুন'}</span>
              </div>
            </BangladeshMap>

            <dl className="mt-4 border-t border-white/10 sm:grid sm:grid-cols-2 sm:gap-x-8">
              <KV label="Agro-Ecological Zone">
                {language === 'en' ? profile.agroZoneEn : profile.agroZoneBn}
              </KV>
              <KV label={language === 'en' ? 'Dominant soil' : 'প্রধান মাটি'}>
                {language === 'en' ? profile.soilTypeEn : profile.soilTypeBn}
              </KV>
            </dl>
            <Rule className="mt-1" />
          </div>
        </div>
      </div>
    </div>
  );
};
