import React, { useState, useRef } from 'react';
import { MapPin, Navigation, Layers, Droplets, Info } from 'lucide-react';
import { BD_DISTRICTS, BD_DIVISIONS } from '../../../data/districts';
import { getDistrictAdmin, type DistrictId } from '../../../data/bdAdmin';
import {
  LAND_ELEVATION_OPTIONS,
  SOIL_TYPE_OPTIONS,
  IRRIGATION_OPTIONS,
} from '../../../data/farmerProfile';
import { reverseGeocode, matchUpazila } from '../../../lib/geocode';
import { getUpazilasFor, DISTRICT_WIDE_UPAZILA } from '../../../lib/location';
import type { FarmField } from '../../../lib/farmerProfileService';
import { BangladeshMap, type MapFlyTarget } from '../../map/BangladeshMap';

export interface FarmFieldSectionProps {
  field: FarmField;
  onChange: (updatedField: Partial<FarmField>) => void;
  isBn: boolean;
  isOnboarding?: boolean;
  errors?: { district?: string; area?: string; name?: string };
}

export const FarmFieldSection: React.FC<FarmFieldSectionProps> = ({
  field,
  onChange,
  isBn,
  isOnboarding = false,
  errors,
}) => {
  const [showMap, setShowMap] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [mapFlyTarget, setMapFlyTarget] = useState<MapFlyTarget | null>(null);

  const flyNonce = useRef(0);
  const requestSeq = useRef(0);

  const flyTo = (lng: number, lat: number, zoom: number) => {
    flyNonce.current += 1;
    setMapFlyTarget({ lng, lat, zoom, nonce: flyNonce.current });
  };

  const currentDistrictId = (field.district || 'rangpur') as DistrictId;
  const upazilaList = getUpazilasFor(currentDistrictId);

  const handleDistrictChange = (dId: DistrictId) => {
    const admin = getDistrictAdmin(dId);
    const upazilas = getUpazilasFor(dId);
    const newUpazila = upazilas[0]?.id ?? DISTRICT_WIDE_UPAZILA;

    const lat = admin ? admin.lat : field.latitude;
    const lng = admin ? admin.lng : field.longitude;
    const division = admin ? admin.division : field.division;

    onChange({
      district: dId,
      division,
      upazila: newUpazila,
      latitude: lat,
      longitude: lng,
    });

    if (admin) {
      flyTo(admin.lng, admin.lat, 10);
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;
    const geo = await reverseGeocode(lat, lng);
    if (seq !== requestSeq.current) return;

    if (!geo.outsideBangladesh && geo.district.id) {
      const candidates = getUpazilasFor(geo.district.id as DistrictId);
      const matched = matchUpazila(candidates, geo.addressHint);
      const dAdmin = getDistrictAdmin(geo.district.id as DistrictId);

      onChange({
        district: geo.district.id,
        division: dAdmin?.division || field.division,
        upazila: matched || candidates[0]?.id || DISTRICT_WIDE_UPAZILA,
        latitude: lat,
        longitude: lng,
      });
    } else {
      onChange({
        latitude: lat,
        longitude: lng,
      });
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert(isBn ? 'আপনার ব্রাউজার লোকেশন সাপোর্ট করে না' : 'Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setLocating(false);
        const { latitude, longitude } = pos.coords;
        handleMapSelect(latitude, longitude);
        flyTo(longitude, latitude, 12);
      },
      (err) => {
        setLocating(false);
        console.warn('Geolocation error:', err);
        alert(isBn ? 'আপনার বর্তমান লোকেশন পাওয়া যায়নি।' : 'Unable to retrieve your current location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-white/10 pb-4">
        <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#00E5FF]" />
          <span>{isBn ? 'জমির অবস্থান ও বৈশিষ্ট্য' : 'Field Location & Specifications'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isBn
            ? 'আপনার জমির অবস্থান এবং বৈশিষ্ট্য নির্ধারণ করুন। নাসা স্যাটেলাইট এই অবস্থানের আবহাওয়া ও মাটির তথ্য বিশ্লেষণ করবে।'
            : 'Specify your field plot location and soil characteristics to power NASA agro-climatic telemetry.'}
        </p>
      </div>

      {/* Onboarding multi-field informative note */}
      {isOnboarding && (
        <div className="p-3.5 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF]/25 flex items-start gap-3 text-xs sm:text-sm text-[#00E5FF]">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5 text-[#00E5FF]" />
          <p className="leading-relaxed">
            {isBn
              ? 'এখানে আপনার প্রধান চাষের জমির তথ্য দিন। অনবোর্ডিং শেষে প্রোফাইল পেজ (Profile) থেকে যেকোনো সময় আরও একাধিক জমি যুক্ত করতে পারবেন।'
              : 'Register your primary cultivation plot here. You can easily add and manage more fields anytime from your Profile later.'}
          </p>
        </div>
      )}

      {/* Profile specific: Field Name & Primary Checkbox */}
      {!isOnboarding && (
        <div className="grid sm:grid-cols-3 gap-4 items-end p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {isBn ? 'জমির নাম / প্লট নম্বর' : 'Field Name / Plot Label'} <span className="text-[#00E5FF]">*</span>
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={isBn ? 'যেমন: উত্তর বিলের ধানি জমি' : 'e.g. North Basin Plot 1'}
              className="w-full min-h-[48px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white text-base focus:border-[#00E5FF] focus:outline-none"
              required
            />
            {errors?.name && <p className="text-xs text-red-400 mt-1 font-mono">{errors.name}</p>}
          </div>

          <div className="pb-2">
            <label className="flex items-center gap-2.5 text-xs font-mono text-slate-300 cursor-pointer min-h-[48px]">
              <input
                type="checkbox"
                checked={field.isPrimary}
                onChange={(e) => onChange({ isPrimary: e.target.checked })}
                className="w-5 h-5 rounded bg-[#07101D] border-white/20 text-[#B8FF3D] focus:ring-0 cursor-pointer"
              />
              <span className="font-semibold text-white">{isBn ? 'প্রধান সক্রিয় জমি' : 'Set as Primary Field'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Grid: Form Controls (Left) & Interactive Map (Right) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls */}
        <div className="lg:col-span-6 space-y-5">
          {/* District Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
                {isBn ? 'জেলা নির্বাচন করুন (৬৪ জেলা)' : 'Select District (64 Districts)'} <span className="text-[#00E5FF]">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-xs font-mono text-[#00E5FF] hover:text-[#B8FF3D] flex items-center gap-1 transition-colors cursor-pointer py-1"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? (isBn ? 'শনাক্ত হচ্ছে...' : 'Locating...') : (isBn ? 'আমার অবস্থান' : 'Use GPS')}</span>
              </button>
            </div>
            <select
              value={field.district || 'rangpur'}
              onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
              className="w-full min-h-[48px] px-3.5 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] transition-colors cursor-pointer"
            >
              {BD_DIVISIONS.map((div) => {
                const dists = BD_DISTRICTS.filter((d) => d.division === div.nameEn);
                return (
                  <optgroup key={div.nameEn} label={isBn ? div.nameBn : div.nameEn} className="bg-[#050B14] text-slate-300 font-bold">
                    {dists.map((d) => (
                      <option key={d.id} value={d.id}>
                        {isBn ? d.nameBn : d.nameEn}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {errors?.district && <p className="text-xs text-red-400 mt-1 font-mono">{errors.district}</p>}
          </div>

          {/* Upazila Selection */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {isBn ? 'উপজেলা' : 'Upazila'}
            </label>
            <select
              value={field.upazila || DISTRICT_WIDE_UPAZILA}
              onChange={(e) => onChange({ upazila: e.target.value })}
              className="w-full min-h-[48px] px-3.5 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] transition-colors cursor-pointer"
            >
              <option value={DISTRICT_WIDE_UPAZILA}>
                {isBn ? 'সমগ্র জেলা (গড় আবহাওয়া)' : 'District-wide (Average)'}
              </option>
              {upazilaList.map((u) => (
                <option key={u.id} value={u.id}>
                  {isBn ? u.nameBn : u.nameEn}
                </option>
              ))}
            </select>
          </div>

          {/* Village / Area (Optional) */}
          <div>
            <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              {isBn ? 'গ্রাম / মৌজা (ঐচ্ছিক)' : 'Village / Area (Optional)'}
            </label>
            <input
              type="text"
              value={field.village || ''}
              onChange={(e) => onChange({ village: e.target.value })}
              placeholder={isBn ? 'যেমন: রামপুর / উত্তর পাড়া' : 'e.g. Rampur / Uttar Para'}
              className="w-full min-h-[48px] px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF]"
            />
          </div>

          {/* Land Area and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isBn ? 'জমির পরিমাপ' : 'Land Area'} <span className="text-[#00E5FF]">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={field.area || ''}
                onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
                placeholder="1.5"
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF]"
              />
              {errors?.area && <p className="text-xs text-red-400 mt-1 font-mono">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isBn ? 'একক' : 'Unit'}
              </label>
              <select
                value={field.unit || 'bigha'}
                onChange={(e) => onChange({ unit: e.target.value as any })}
                className="w-full min-h-[48px] px-3 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] cursor-pointer"
              >
                <option value="bigha">{isBn ? 'বিঘা (৩৩ শতাংশ)' : 'Bigha (33 dec)'}</option>
                <option value="acre">{isBn ? 'একর' : 'Acre'}</option>
                <option value="decimal">{isBn ? 'শতাংশ / শতক' : 'Decimal'}</option>
                <option value="hectare">{isBn ? 'হেক্টর' : 'Hectare'}</option>
              </select>
            </div>
          </div>

          {/* Elevation, Soil Type & Irrigation */}
          <div className="space-y-4 pt-1">
            {/* Elevation */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isBn ? 'জমির উচ্চতা ও প্লাবন ধরন' : 'Land Elevation / Inundation'}
              </label>
              <select
                value={field.elevation || 'medium_high'}
                onChange={(e) => onChange({ elevation: e.target.value as any })}
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] cursor-pointer"
              >
                {LAND_ELEVATION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isBn ? 'মাটির ধরন' : 'Soil Classification'}
              </label>
              <select
                value={field.soilType || 'loam'}
                onChange={(e) => onChange({ soilType: e.target.value as any })}
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] cursor-pointer"
              >
                {SOIL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Irrigation Source */}
            <div>
              <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                {isBn ? 'সেচ সুবিধা ও ব্যবস্থা' : 'Irrigation Infrastructure'}
              </label>
              <select
                value={field.irrigation || 'shallow_tubewell'}
                onChange={(e) => {
                  const irr = e.target.value as FarmField['irrigation'];
                  const wSource = irr === 'canal_surface' ? 'river' : irr === 'rainfed' ? 'rainwater' : 'groundwater';
                  onChange({ irrigation: irr, waterSource: wSource });
                }}
                className="w-full min-h-[48px] px-3.5 py-2.5 bg-[#0B1626] border border-white/15 rounded-xl text-white text-base focus:outline-none focus:border-[#00E5FF] cursor-pointer"
              >
                {IRRIGATION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Map Pin & Interactive Visualizer */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              {isBn ? 'স্যাটেলাইট জিপিএস অবস্থান পিন' : 'Interactive Map Pin'}
            </span>
            <span className="text-xs font-mono text-[#00E5FF]">
              {field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="rounded-2xl border border-white/15 overflow-hidden bg-[#050B14] relative h-[320px] sm:h-[400px]">
            <BangladeshMap
              latitude={field.latitude}
              longitude={field.longitude}
              onSelect={handleMapSelect}
              flyTarget={mapFlyTarget}
            />

            {/* Overlay hint */}
            <div className="absolute bottom-3 inset-x-3 bg-[#0B1626]/90 backdrop-blur-md border border-white/10 rounded-xl p-2.5 text-center text-xs text-slate-300 font-mono pointer-events-none">
              {isBn
                ? '📍 মানচিত্রে সরাসরি ক্লিক করে আপনার জমির সুনির্দিষ্ট অবস্থান নির্ধারণ করতে পারেন।'
                : '📍 Click anywhere on the map to pin your field coordinates.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
