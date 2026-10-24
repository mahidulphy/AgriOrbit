import React, { useState, useRef } from 'react';
import { MapPin, Navigation, Info } from 'lucide-react';
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
  const [, setShowMap] = useState<boolean>(true);
  const [locating, setLocating] = useState<boolean>(false);
  const [mapFlyTarget, setMapFlyTarget] = useState<MapFlyTarget | null>(null);
  const [upazilaSearch, setUpazilaSearch] = useState<string>('');

  const flyNonce = useRef(0);
  const requestSeq = useRef(0);

  const flyTo = (lng: number, lat: number, zoom: number) => {
    flyNonce.current += 1;
    setMapFlyTarget({ lng, lat, zoom, nonce: flyNonce.current });
  };

  const currentDistrictId = (field.district || 'rangpur') as DistrictId;
  const upazilaList = getUpazilasFor(currentDistrictId);

  const filteredUpazilas = upazilaSearch.trim()
    ? upazilaList.filter(
        (u) =>
          u.nameEn.toLowerCase().includes(upazilaSearch.toLowerCase()) ||
          u.nameBn.includes(upazilaSearch.trim())
      )
    : upazilaList;

  const handleDistrictChange = (dId: DistrictId) => {
    const admin = getDistrictAdmin(dId);
    const upazilas = getUpazilasFor(dId);
    const newUpazila = upazilas[0]?.id ?? DISTRICT_WIDE_UPAZILA;
    const firstUpz = upazilas[0];

    const lat = firstUpz?.lat ?? (admin ? admin.lat : field.latitude);
    const lng = firstUpz?.lng ?? (admin ? admin.lng : field.longitude);
    const division = admin ? admin.division : field.division;

    setUpazilaSearch('');
    onChange({
      district: dId,
      division,
      upazila: newUpazila,
      latitude: lat,
      longitude: lng,
    });

    flyTo(lng, lat, 10);
  };

  const handleUpazilaChange = (upazilaId: string) => {
    if (upazilaId === DISTRICT_WIDE_UPAZILA) {
      const admin = getDistrictAdmin(currentDistrictId);
      onChange({
        upazila: DISTRICT_WIDE_UPAZILA,
        latitude: admin ? admin.lat : field.latitude,
        longitude: admin ? admin.lng : field.longitude,
      });
      if (admin) flyTo(admin.lng, admin.lat, 9);
      return;
    }
    const upz = upazilaList.find((u) => u.id === upazilaId);
    onChange({
      upazila: upazilaId,
      latitude: upz?.lat ?? field.latitude,
      longitude: upz?.lng ?? field.longitude,
    });
    if (upz?.lat && upz?.lng) {
      flyTo(upz.lng, upz.lat, 11);
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;
    setShowMap(true);

    onChange({
      latitude: lat,
      longitude: lng,
    });

    try {
      const geo = await reverseGeocode(lat, lng);
      if (seq !== requestSeq.current) return;

      if (geo && geo.district && !geo.outsideBangladesh) {
        const upazilas = getUpazilasFor(geo.district.id as DistrictId);
        const resolvedUpazila = matchUpazila(upazilas, geo.addressHint);

        onChange({
          district: geo.district.id,
          division: geo.district.division || field.division,
          upazila: resolvedUpazila ?? undefined,
        });
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err);
    }
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert(isBn ? 'আপনার ব্রাউজারে জিপিএস সুবিধা নেই।' : 'Geolocation not supported by this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        handleMapSelect(latitude, longitude);
        flyTo(longitude, latitude, 12);
        setLocating(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocating(false);
        alert(isBn ? 'আপনার অবস্থান শনাক্ত করা যায়নি।' : 'Unable to retrieve your current location.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-semibold text-lg text-[#FAFAFA]">
          {isBn ? 'জমির অবস্থান ও ভৌগোলিক তথ্য' : 'Field Location & Land Characteristics'}
        </h3>
        <p className="text-xs text-[#737373] mt-1">
          {isBn
            ? 'জমির সঠিক অবস্থান নির্ধারণ করুন যাতে নাসা স্যাটেলাইট তথ্য সঠিকভাবে মেলানো যায়।'
            : 'Pinpoint your field plot so satellite observations match your exact ground reality.'}
        </p>
      </div>

      {isOnboarding && (
        <div className="p-3.5 rounded-xl bg-[#141414] border border-[#262626] flex items-start gap-3 text-xs text-[#A3A3A3]">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#22C55E]" />
          <p className="leading-relaxed">
            {isBn
              ? 'এখানে আপনার প্রধান চাষের জমির তথ্য দিন। অনবোর্ডিং শেষে প্রোফাইল থেকে যেকোনো সময় আরও একাধিক জমি যুক্ত করতে পারবেন।'
              : 'Register your primary cultivation plot here. You can add more fields anytime from your Profile later.'}
          </p>
        </div>
      )}

      {/* Profile specific: Field Name & Primary Checkbox */}
      {!isOnboarding && (
        <div className="grid sm:grid-cols-3 gap-4 items-end p-4 rounded-xl bg-[#0A0A0A] border border-[#262626]">
          <div className="sm:col-span-2">
            <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
              {isBn ? 'জমির নাম / প্লট নম্বর' : 'Field Name / Plot Label'} <span className="text-[#22C55E]">*</span>
            </label>
            <input
              type="text"
              value={field.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder={isBn ? 'যেমন: উত্তর বিলের ধানি জমি' : 'e.g. North Basin Plot 1'}
              className="w-full min-h-[44px] px-3.5 py-2 rounded-lg bg-[#141414] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none"
              required
            />
            {errors?.name && <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.name}</p>}
          </div>

          <div className="pb-1">
            <label className="flex items-center gap-2.5 text-xs font-mono text-[#A3A3A3] cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={field.isPrimary}
                onChange={(e) => onChange({ isPrimary: e.target.checked })}
                className="w-4 h-4 rounded bg-[#0A0A0A] border-[#262626] text-[#22C55E] accent-[#22C55E] focus:ring-0 cursor-pointer"
              />
              <span className="font-medium text-[#FAFAFA]">{isBn ? 'প্রধান সক্রিয় জমি' : 'Set as Primary Field'}</span>
            </label>
          </div>
        </div>
      )}

      {/* Main Grid: Form Controls (Left) & Interactive Map (Right) */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Form Controls */}
        <div className="lg:col-span-6 space-y-4">
          {/* District Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider">
                {isBn ? 'জেলা নির্বাচন করুন (৬৪ জেলা)' : 'Select District (64 Districts)'} <span className="text-[#22C55E]">*</span>
              </label>
              <button
                type="button"
                onClick={handleUseMyLocation}
                disabled={locating}
                className="text-xs font-mono text-[#737373] hover:text-[#FAFAFA] flex items-center gap-1 transition-colors cursor-pointer py-1"
              >
                <Navigation className={`w-3.5 h-3.5 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? (isBn ? 'শনাক্ত হচ্ছে...' : 'Locating...') : (isBn ? 'আমার অবস্থান' : 'Use GPS')}</span>
              </button>
            </div>
            <select
              value={field.district || 'rangpur'}
              onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] transition-colors cursor-pointer"
            >
              {BD_DIVISIONS.map((div) => {
                const dists = BD_DISTRICTS.filter((d) => d.division === div.nameEn);
                return (
                  <optgroup key={div.nameEn} label={isBn ? div.nameBn : div.nameEn} className="bg-[#141414] text-[#A3A3A3] font-semibold">
                    {dists.map((d) => (
                      <option key={d.id} value={d.id} className="bg-[#141414] text-[#FAFAFA]">
                        {isBn ? d.nameBn : d.nameEn}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
            {errors?.district && <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.district}</p>}
          </div>

          {/* Upazila Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider">
                {isBn ? 'উপজেলা' : 'Upazila'} ({upazilaList.length})
              </label>
            </div>
            {upazilaList.length > 5 && (
              <div className="mb-2">
                <input
                  type="text"
                  value={upazilaSearch}
                  onChange={(e) => setUpazilaSearch(e.target.value)}
                  placeholder={isBn ? 'উপজেলা খুঁজুন (বাংলা / English)...' : 'Search upazila (English / বাংলা)...'}
                  className="w-full min-h-[38px] px-3 py-1.5 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-xs focus:outline-none focus:border-[#22C55E] placeholder-[#737373]"
                />
              </div>
            )}
            <select
              value={field.upazila || DISTRICT_WIDE_UPAZILA}
              onChange={(e) => handleUpazilaChange(e.target.value)}
              className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] transition-colors cursor-pointer"
            >
              <option value={DISTRICT_WIDE_UPAZILA} className="bg-[#141414] text-[#FAFAFA]">
                {isBn ? 'সমগ্র জেলা (জেলা-ভিত্তিক গড়)' : 'Entire District (District-wide)'}
              </option>
              {filteredUpazilas.map((u) => (
                <option key={u.id} value={u.id} className="bg-[#141414] text-[#FAFAFA]">
                  {isBn ? `${u.nameBn} (${u.nameEn})` : `${u.nameEn} (${u.nameBn})`}
                </option>
              ))}
            </select>
          </div>

          {/* Village / Area (Optional) */}
          <div>
            <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
              {isBn ? 'গ্রাম / মৌজা (ঐচ্ছিক)' : 'Village / Area (Optional)'}
            </label>
            <input
              type="text"
              value={field.village || ''}
              onChange={(e) => onChange({ village: e.target.value })}
              placeholder={isBn ? 'যেমন: রামপুর / উত্তর পাড়া' : 'e.g. Rampur / Uttar Para'}
              className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E]"
            />
          </div>

          {/* Land Area and Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                {isBn ? 'জমির পরিমাপ' : 'Land Area'} <span className="text-[#22C55E]">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={field.area || ''}
                onChange={(e) => onChange({ area: parseFloat(e.target.value) || 0 })}
                placeholder="1.5"
                className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E]"
              />
              {errors?.area && <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.area}</p>}
            </div>

            <div>
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                {isBn ? 'একক' : 'Unit'}
              </label>
              <select
                value={field.unit || 'bigha'}
                onChange={(e) => onChange({ unit: e.target.value as any })}
                className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                <option value="bigha" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'বিঘা (৩৩ শতাংশ)' : 'Bigha (33 dec)'}</option>
                <option value="acre" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'একর' : 'Acre'}</option>
                <option value="decimal" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'শতাংশ / শতক' : 'Decimal'}</option>
                <option value="hectare" className="bg-[#141414] text-[#FAFAFA]">{isBn ? 'হেক্টর' : 'Hectare'}</option>
              </select>
            </div>
          </div>

          {/* Elevation, Soil Type & Irrigation */}
          <div className="space-y-3 pt-1">
            {/* Elevation */}
            <div>
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                {isBn ? 'জমির উচ্চতা ও প্লাবন ধরন' : 'Land Elevation / Inundation'}
              </label>
              <select
                value={field.elevation || 'medium_high'}
                onChange={(e) => onChange({ elevation: e.target.value as any })}
                className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                {LAND_ELEVATION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#141414] text-[#FAFAFA]">
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Soil Type */}
            <div>
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                {isBn ? 'মাটির ধরন' : 'Soil Classification'}
              </label>
              <select
                value={field.soilType || 'loam'}
                onChange={(e) => onChange({ soilType: e.target.value as any })}
                className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                {SOIL_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#141414] text-[#FAFAFA]">
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>

            {/* Irrigation Source */}
            <div>
              <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
                {isBn ? 'সেচ সুবিধা ও ব্যবস্থা' : 'Irrigation Infrastructure'}
              </label>
              <select
                value={field.irrigation || 'shallow_tubewell'}
                onChange={(e) => {
                  const irr = e.target.value as FarmField['irrigation'];
                  const wSource = irr === 'canal_surface' ? 'river' : irr === 'rainfed' ? 'rainwater' : 'groundwater';
                  onChange({ irrigation: irr, waterSource: wSource });
                }}
                className="w-full min-h-[44px] px-3 py-2 bg-[#0A0A0A] border border-[#262626] rounded-lg text-[#FAFAFA] text-sm focus:outline-none focus:border-[#22C55E] cursor-pointer"
              >
                {IRRIGATION_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#141414] text-[#FAFAFA]">
                    {isBn ? opt.bn : opt.en}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right: Map Pin & Interactive Visualizer */}
        <div className="lg:col-span-6 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider">
              {isBn ? 'স্যাটেলাইট জিপিএস অবস্থান পিন' : 'Interactive Map Pin'}
            </span>
            <span className="text-xs font-mono text-[#737373]">
              {field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E
            </span>
          </div>

          <div className="rounded-xl border border-[#262626] overflow-hidden bg-[#0A0A0A] relative h-[320px] sm:h-[390px]">
            <BangladeshMap
              latitude={field.latitude}
              longitude={field.longitude}
              onSelect={handleMapSelect}
              flyTarget={mapFlyTarget}
            />

            {/* Overlay hint */}
            <div className="absolute bottom-3 inset-x-3 bg-[#141414]/90 border border-[#262626] rounded-lg p-2 text-center text-xs text-[#737373] font-mono pointer-events-none">
              {isBn
                ? 'মানচিত্রে সরাসরি ক্লিক করে আপনার জমির অবস্থান চিহ্নিত করতে পারেন।'
                : 'Click anywhere on the map to pin your field coordinates.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
