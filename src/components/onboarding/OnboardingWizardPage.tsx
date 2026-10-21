import React, { useState, useEffect, useRef } from 'react';
import {
  Check,
  MapPin,
  Sliders,
  ArrowRight,
  ArrowLeft,
  Navigation,
  Loader2,
  Droplets,
  Sprout,
  Coins,
  ShieldAlert,
  User,
  Phone,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { BD_DISTRICTS, BD_DIVISIONS } from '../../data/districts';
import { getDistrictAdmin, type DistrictId } from '../../data/bdAdmin';
import { BangladeshMap, type MapFlyTarget } from '../map/BangladeshMap';
import { reverseGeocode, matchUpazila } from '../../lib/geocode';
import {
  getUpazilasFor,
  locationFromDistrict,
  DISTRICT_WIDE_UPAZILA,
} from '../../lib/location';
import {
  saveFarmField,
  saveFarmerProfile,
  loadFarmerProfile,
  type FarmField,
} from '../../lib/farmerProfileService';
import type { FarmerPriorityId } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserMenu } from '../auth/UserMenu';

export const OnboardingWizardPage: React.FC = () => {
  const { user, isGuest, displayName, refreshProfile } = useAuth();
  const { lang, setLang } = useLang();
  const isBn = lang === 'bn';

  // Determine starting step based on URL query or auth status
  const getInitialStep = (): number => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      if (hash.includes('step=priority')) return 3;
      if (hash.includes('step=location')) return 2;
    }
    // Guests skip step 1 (personal details) and start directly at step 2 (location)
    return !user || isGuest ? 2 : 1;
  };

  const [step, setStep] = useState<number>(getInitialStep);
  const isDirectEdit = typeof window !== 'undefined' && (window.location.hash.includes('step=priority') || window.location.hash.includes('step=location'));

  // Step 1: Personal Details State
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');

  // Step 2: Field Location & Specs State
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('rangpur');
  const [selectedUpazila, setSelectedUpazila] = useState<string>(DISTRICT_WIDE_UPAZILA);
  const [fieldLat, setFieldLat] = useState<number>(25.7439);
  const [fieldLng, setFieldLng] = useState<number>(89.2752);
  const [area, setArea] = useState<string>('1.5');
  const [unit, setUnit] = useState<FarmField['unit']>('bigha');
  const [soilType, setSoilType] = useState<FarmField['soilType']>('loam');
  const [irrigation, setIrrigation] = useState<FarmField['irrigation']>('shallow_tubewell');

  // Step 3: Farming Priority State (NO pre-selected default)
  const [selectedPriority, setSelectedPriority] = useState<FarmerPriorityId | null>(null);

  // UI state
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [mapFlyTarget, setMapFlyTarget] = useState<MapFlyTarget | null>(null);
  const flyNonce = useRef(0);
  const requestSeq = useRef(0);

  // Pre-fill existing data if available
  useEffect(() => {
    async function initData() {
      if (user?.id) {
        try {
          const { profile, fields } = await loadFarmerProfile(user.id);
          if (profile) {
            setFullName(profile.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '');
            setPhone(profile.phone || '');
            if (profile.primaryPriority) {
              setSelectedPriority(profile.primaryPriority);
            }
          }
          if (fields && fields.length > 0) {
            const primary = fields.find((f) => f.isPrimary) || fields[0];
            setSelectedDistrict((primary.district as DistrictId) || 'rangpur');
            setSelectedUpazila(primary.upazila || DISTRICT_WIDE_UPAZILA);
            setFieldLat(primary.latitude || 25.7439);
            setFieldLng(primary.longitude || 89.2752);
            setArea(String(primary.area || '1.5'));
            setUnit(primary.unit || 'bigha');
            setSoilType(primary.soilType || 'loam');
            setIrrigation(primary.irrigation || 'shallow_tubewell');
          }
        } catch (e) {
          console.warn('Could not load existing farmer profile', e);
        }
      } else {
        // Pre-fill guest data from sessionStorage if available
        try {
          const guestField = sessionStorage.getItem('agriorbit_guest_field');
          const guestPriority = sessionStorage.getItem('agriorbit_guest_priority');
          if (guestField) {
            const parsed = JSON.parse(guestField);
            if (parsed.district) setSelectedDistrict(parsed.district);
            if (parsed.upazila) setSelectedUpazila(parsed.upazila);
            if (parsed.latitude) setFieldLat(parsed.latitude);
            if (parsed.longitude) setFieldLng(parsed.longitude);
            if (parsed.area) setArea(String(parsed.area));
            if (parsed.unit) setUnit(parsed.unit);
            if (parsed.soilType) setSoilType(parsed.soilType);
            if (parsed.irrigation) setIrrigation(parsed.irrigation);
          }
          if (guestPriority) {
            setSelectedPriority(guestPriority as FarmerPriorityId);
          }
        } catch {
          // ignore
        }
        if (displayName && displayName !== 'Guest' && displayName !== 'Guest Farmer') {
          setFullName(displayName);
        }
      }
    }
    initData();
  }, [user?.id, displayName]);

  const flyTo = (lng: number, lat: number, zoom: number) => {
    flyNonce.current += 1;
    setMapFlyTarget({ lng, lat, zoom, nonce: flyNonce.current });
  };

  const handleDistrictChange = (dId: DistrictId) => {
    setSelectedDistrict(dId);
    const upazilas = getUpazilasFor(dId);
    setSelectedUpazila(upazilas[0]?.id ?? DISTRICT_WIDE_UPAZILA);
    const admin = getDistrictAdmin(dId);
    if (admin) {
      setFieldLat(admin.lat);
      setFieldLng(admin.lng);
      flyTo(admin.lng, admin.lat, 10);
    }
  };

  const handleMapSelect = async (lat: number, lng: number) => {
    const seq = ++requestSeq.current;
    const geo = await reverseGeocode(lat, lng);
    if (seq !== requestSeq.current) return;

    setFieldLat(lat);
    setFieldLng(lng);

    if (!geo.outsideBangladesh && geo.district.id) {
      setSelectedDistrict(geo.district.id as DistrictId);
      const candidates = getUpazilasFor(geo.district.id as DistrictId);
      const matched = matchUpazila(candidates, geo.addressHint);
      setSelectedUpazila(matched || candidates[0]?.id || DISTRICT_WIDE_UPAZILA);
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

  const handleCompleteOnboarding = async () => {
    if (!selectedPriority) {
      alert(isBn ? 'দয়া করে একটি প্রধান লক্ষ্য বেছে নিন।' : 'Please select your primary farming priority.');
      return;
    }

    setSaving(true);
    try {
      const districtAdmin = getDistrictAdmin(selectedDistrict);
      const divisionName = districtAdmin?.division || 'Rangpur';
      const districtName = districtAdmin?.nameEn || 'Rangpur';

      if (user?.id) {
        // Authenticated user: Save to farmer_fields and farmer_profiles
        const newField: FarmField = {
          id: crypto.randomUUID(),
          name: `${districtName} Plot 1`,
          division: divisionName,
          district: selectedDistrict,
          upazila: selectedUpazila,
          village: '',
          latitude: fieldLat,
          longitude: fieldLng,
          area: parseFloat(area) || 1.5,
          unit: unit,
          elevation: 'medium_high',
          soilType: soilType,
          irrigation: irrigation,
          waterSource: irrigation === 'canal_surface' ? 'river' : irrigation === 'rainfed' ? 'rainwater' : 'groundwater',
          currentCrop: 'Fallow / Preparing',
          previousCrop: 'T. Aman',
          plannedNextCrop: '',
          growingSeason: 'rabi',
          isPrimary: true,
          notes: 'Configured during initial AgriOrbit setup',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        await saveFarmField(newField, user.id);
        await saveFarmerProfile(
          {
            fullName: fullName.trim() || displayName || user.email?.split('@')[0] || 'Farmer',
            phone: phone.trim(),
            primaryPriority: selectedPriority,
            priorities: [selectedPriority],
            onboardingCompleted: true,
          },
          user.id
        );
        await refreshProfile();
      } else {
        // Guest user: Save to sessionStorage
        sessionStorage.setItem(
          'agriorbit_guest_field',
          JSON.stringify({
            district: selectedDistrict,
            upazila: selectedUpazila,
            latitude: fieldLat,
            longitude: fieldLng,
            area: parseFloat(area) || 1.5,
            unit: unit,
            soilType: soilType,
            irrigation: irrigation,
            division: divisionName,
          })
        );
        sessionStorage.setItem('agriorbit_guest_priority', selectedPriority);
        sessionStorage.setItem('agriorbit_guest_onboarding_completed', 'true');
        localStorage.setItem('agriorbit_guest_mode', 'true');
        localStorage.setItem('agriorbit_selected_priority', selectedPriority);
      }

      // Sync active priority to legacy keys for recommendation engine cross-compatibility
      localStorage.setItem('agriorbit_selected_priority', selectedPriority);

      // Navigate straight to dashboard
      window.location.hash = '#/dashboard';
    } catch (err) {
      console.error('Error completing onboarding:', err);
      alert(isBn ? 'তথ্য সংরক্ষণে সমস্যা হয়েছে, আবার চেষ্টা করুন।' : 'Failed to save setup. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isGuestMode = !user || isGuest;
  const totalSteps = isGuestMode ? 2 : 3;
  const currentStepNumber = isGuestMode ? (step === 2 ? 1 : 2) : step;

  const currentDistrictObj = BD_DISTRICTS.find((d) => d.id === selectedDistrict);
  const upazilaList = getUpazilasFor(selectedDistrict);

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-sans selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* Top Bar */}
      <header className="w-full border-b border-white/10 bg-[#0B1626]/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <LanguageSwitcher language={lang} onLanguageChange={setLang} />
            <UserMenu compact />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col justify-center">
        <div className="bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative">
          {/* Header & Steps Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-white/10">
            <div>
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-[#B8FF3D] font-mono font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#B8FF3D]" />
                <span>
                  {isBn ? 'ফার্ম সেটআপ ও অনবোর্ডিং' : 'Farm Setup & Onboarding'}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-display text-white">
                {step === 1 && (isBn ? 'ব্যক্তিগত তথ্য দিন' : 'Personal Details')}
                {step === 2 && (isBn ? 'আপনার জমির অবস্থান ও বিবরণ' : 'Field Location & Specifications')}
                {step === 3 && (isBn ? 'আপনার প্রধান চাষের লক্ষ্য নির্বাচন করুন' : 'Select Your Primary Farming Priority')}
              </h1>
            </div>

            {/* Stepper Pills */}
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="font-bold text-[#050B14] bg-[#B8FF3D] px-2.5 py-1 rounded text-xs">
                0{currentStepNumber}
              </span>
              <span className="text-slate-400">/ 0{totalSteps}</span>
              <span className="text-slate-300 font-sans ml-1 text-xs hidden sm:inline">
                {step === 1 && (isBn ? 'বিবরণ' : 'Details')}
                {step === 2 && (isBn ? 'জমি' : 'Field')}
                {step === 3 && (isBn ? 'লক্ষ্য' : 'Priority')}
              </span>
            </div>
          </div>

          {/* ================= STEP 1: PERSONAL DETAILS ================= */}
          {step === 1 && (
            <div className="space-y-6 max-w-xl mx-auto py-4">
              <p className="text-sm text-slate-300">
                {isBn
                  ? 'AgriOrbit ব্যবহারের জন্য আপনার নাম ও মোবাইল নম্বর নিশ্চিত করুন। এটি আপনার খামারের সার্টিফিকেটে যুক্ত থাকবে।'
                  : 'Confirm your name and phone number for AgriOrbit. This will appear on your advisory certificates.'}
              </p>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  {isBn ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={isBn ? 'যেমন: মোঃ রহিম উদ্দিন' : 'e.g. Md. Rahim Uddin'}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                  {isBn ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Mobile Phone (Optional)'}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={isBn ? '+৮৮০ ১৭...' : '+880 17...'}
                    className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors font-mono"
                  />
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!fullName.trim()}
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00c8e0] text-[#050B14] font-bold text-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#00E5FF]/20"
                >
                  <span>{isBn ? 'পরবর্তী ধাপ (জমির বিবরণ)' : 'Next: Field Setup'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 2: FIELD LOCATION & SPECS ================= */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Controls (Left 5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  {/* District Selection */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      {isBn ? 'জেলা নির্বাচন করুন (৬৪ জেলা)' : 'Select District (64 Districts)'}
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => handleDistrictChange(e.target.value as DistrictId)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors cursor-pointer"
                    >
                      {BD_DIVISIONS.map((div) => {
                        const dists = BD_DISTRICTS.filter((d) => d.division === div.nameEn);
                        return (
                          <optgroup key={div.nameEn} label={isBn ? div.nameBn : div.nameEn} className="bg-[#0B1626] text-slate-200">
                            {dists.map((d) => (
                              <option key={d.id} value={d.id}>
                                {isBn ? d.nameBn : d.nameEn}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })}
                    </select>
                  </div>

                  {/* Upazila Selection */}
                  <div>
                    <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      {isBn ? 'উপজেলা' : 'Upazila'}
                    </label>
                    <select
                      value={selectedUpazila}
                      onChange={(e) => setSelectedUpazila(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] transition-colors cursor-pointer"
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

                  {/* Geolocation Button */}
                  <button
                    type="button"
                    onClick={handleUseMyLocation}
                    disabled={locating}
                    className="w-full py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-xs font-mono flex items-center justify-center gap-2 cursor-pointer transition-colors"
                  >
                    {locating ? (
                      <Loader2 className="w-3.5 h-3.5 text-[#00E5FF] animate-spin" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 text-[#00E5FF]" />
                    )}
                    <span>
                      {locating
                        ? (isBn ? 'অবস্থান খোঁজা হচ্ছে...' : 'Locating...')
                        : (isBn ? 'আমার বর্তমান অবস্থান ব্যবহার করুন' : 'Use My Current Location')}
                    </span>
                  </button>

                  {/* Field Size & Unit */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        {isBn ? 'জমির পরিমাণ' : 'Field Size'}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-[#00E5FF]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        {isBn ? 'একক' : 'Unit'}
                      </label>
                      <select
                        value={unit}
                        onChange={(e) => setUnit(e.target.value as FarmField['unit'])}
                        className="w-full px-3 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] cursor-pointer"
                      >
                        <option value="bigha">{isBn ? 'বিঘা (৩৩ শতাংশ)' : 'Bigha (33 dec)'}</option>
                        <option value="acre">{isBn ? 'একর' : 'Acre'}</option>
                        <option value="decimal">{isBn ? 'শতাংশ / ডেসিমেল' : 'Decimal'}</option>
                        <option value="hectare">{isBn ? 'হেক্টর' : 'Hectare'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Soil Type & Irrigation */}
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        {isBn ? 'মাটির ধরন' : 'Soil Type'}
                      </label>
                      <select
                        value={soilType}
                        onChange={(e) => setSoilType(e.target.value as FarmField['soilType'])}
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] cursor-pointer"
                      >
                        <option value="loam">{isBn ? 'দোআঁশ (সবচেয়ে উর্বর)' : 'Loam (Most fertile)'}</option>
                        <option value="clay_loam">{isBn ? 'এঁটেল দোআঁশ' : 'Clay Loam'}</option>
                        <option value="sandy_loam">{isBn ? 'বেলে দোআঁশ (পানি কম টানে)' : 'Sandy Loam (Quick draining)'}</option>
                        <option value="clay">{isBn ? 'এঁটেল মাটি' : 'Clay'}</option>
                        <option value="silt_loam">{isBn ? 'পলি দোআঁশ (নদী তীরবর্তী)' : 'Silt Loam'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-mono font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                        {isBn ? 'সেচ ব্যবস্থা' : 'Irrigation Source'}
                      </label>
                      <select
                        value={irrigation}
                        onChange={(e) => setIrrigation(e.target.value as FarmField['irrigation'])}
                        className="w-full px-3.5 py-2.5 bg-white/5 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#00E5FF] cursor-pointer"
                      >
                        <option value="shallow_tubewell">{isBn ? 'অগভীর নলকূপ (শ্যালো)' : 'Shallow Tubewell (STW)'}</option>
                        <option value="deep_tubewell">{isBn ? 'গভীর নলকূপ (ডিপ)' : 'Deep Tubewell (DTW)'}</option>
                        <option value="canal_surface">{isBn ? 'খাল / নদী (সারফেস পাম্প)' : 'Canal / Surface Pump'}</option>
                        <option value="rainfed">{isBn ? 'বৃষ্টির পানি নির্ভর (সেচহীন)' : 'Rainfed (No machine irrigation)'}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Map View (Right 7 cols) */}
                <div className="lg:col-span-7 flex flex-col space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                      <span>{isBn ? 'মানচিত্রে জমিতে ক্লিক করুন' : 'Click on your field to pin location'}</span>
                    </span>
                    <span className="text-[#B8FF3D]">
                      {fieldLat.toFixed(4)}° N, {fieldLng.toFixed(4)}° E
                    </span>
                  </div>

                  <div className="w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden border border-white/15 relative">
                    <BangladeshMap
                      latitude={fieldLat}
                      longitude={fieldLng}
                      flyTarget={mapFlyTarget}
                      onSelect={handleMapSelect}
                    />
                  </div>
                </div>
              </div>

              {/* Step 2 Actions */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                {!isGuestMode && !isDirectEdit ? (
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-3 rounded-xl bg-[#00E5FF] hover:bg-[#00c8e0] text-[#050B14] font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-[#00E5FF]/20"
                >
                  <span>{isBn ? 'পরবর্তী: লক্ষ্য নির্ধারণ' : 'Next: Select Priority'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ================= STEP 3: FARMING PRIORITY (4 CARDS, NO DEFAULT) ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <p className="text-sm text-slate-300">
                {isBn
                  ? 'আপনার খামারের জন্য সবচেয়ে গুরুত্বপূর্ণ লক্ষ্যটি বেছে নিন। নাসা উপগ্রহ ডেটা এই লক্ষ্যের ভিত্তিতে ফসল র‍্যাংকিং করবে।'
                  : 'Choose the most critical objective for your farm. NASA satellite rules will optimize crop recommendations to meet this goal.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 1. Save Water */}
                <div
                  onClick={() => setSelectedPriority('save_water')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPriority === 'save_water'
                      ? 'bg-[#00E5FF]/10 border-[#00E5FF] shadow-xl shadow-[#00E5FF]/15 ring-1 ring-[#00E5FF]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#00E5FF]/20 border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF]">
                        <Droplets className="w-5 h-5" />
                      </div>
                      {selectedPriority === 'save_water' && (
                        <div className="w-6 h-6 rounded-full bg-[#00E5FF] flex items-center justify-center text-[#050B14]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mb-1.5">
                      {isBn ? 'পানি সাশ্রয় (Save Water)' : 'Save Water'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {isBn
                        ? 'গভীর সেচের পরিবর্তে কম পানির ডাল ও তৈলবীজকে প্রাধান্য দেয়, ফলে ভূগর্ভস্থ পানির অপচয় ও পাম্পিং খরচ রোধ হয়।'
                        : 'Prioritizes drought-tolerant legumes and oilseeds requiring minimal irrigation instead of continuous groundwater pumping.'}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#00E5FF] pt-2 border-t border-white/10">
                    {isBn ? 'বোরোর চেয়ে মসুর ও সরিষাকে অগ্রাধিকার দেয়' : 'Boosts Lentil & Mustard over heavy Boro'}
                  </div>
                </div>

                {/* 2. Lower Cost */}
                <div
                  onClick={() => setSelectedPriority('lower_cost')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPriority === 'lower_cost'
                      ? 'bg-[#B8FF3D]/10 border-[#B8FF3D] shadow-xl shadow-[#B8FF3D]/15 ring-1 ring-[#B8FF3D]'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-[#B8FF3D]/20 border border-[#B8FF3D]/40 flex items-center justify-center text-[#B8FF3D]">
                        <Coins className="w-5 h-5" />
                      </div>
                      {selectedPriority === 'lower_cost' && (
                        <div className="w-6 h-6 rounded-full bg-[#B8FF3D] flex items-center justify-center text-[#050B14]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mb-1.5">
                      {isBn ? 'কম খরচ (Lower Cost)' : 'Lower Cost'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {isBn
                        ? 'সেচের জন্য ডিজেল ও রাসায়নিক সারের বাড়তি খরচ কমিয়ে স্বল্প পুঁজিতে সম্মানজনক মুনাফার সুযোগ তৈরি করে।'
                        : 'Minimizes costly diesel pumping and synthetic fertilizers, favoring low-input high-margin cash crops.'}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-[#B8FF3D] pt-2 border-t border-white/10">
                    {isBn ? 'ব্যয়বহুল আলুর চেয়ে সাশ্রয়ী ফসল বাছাই' : 'Favors low-input Mustard & Pulses over capex Potato'}
                  </div>
                </div>

                {/* 3. Soil Health */}
                <div
                  onClick={() => setSelectedPriority('improve_soil')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPriority === 'improve_soil'
                      ? 'bg-emerald-500/10 border-emerald-400 shadow-xl shadow-emerald-500/15 ring-1 ring-emerald-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                        <Sprout className="w-5 h-5" />
                      </div>
                      {selectedPriority === 'improve_soil' && (
                        <div className="w-6 h-6 rounded-full bg-emerald-400 flex items-center justify-center text-[#050B14]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mb-1.5">
                      {isBn ? 'মাটির স্বাস্থ্য (Improve Soil Health)' : 'Improve Soil Health'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {isBn
                        ? 'মাটিতে প্রাকৃতিকভাবে নাইট্রোজেন সংবন্ধন ও জৈব পদার্থ বৃদ্ধিকারী ফসল নির্বাচন করে জমির উর্বরতা বাড়ায়।'
                        : 'Selects nitrogen-fixing pulses and high biomass rotation crops to regenerate depleted soil biology.'}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-emerald-400 pt-2 border-t border-white/10">
                    {isBn ? 'মুগডাল ও পাটের মাধ্যমে প্রাকৃতিক নাইট্রোজেন বৃদ্ধি' : 'Boosts Mungbean & Jute for biological fertility'}
                  </div>
                </div>

                {/* 4. Lower Risk */}
                <div
                  onClick={() => setSelectedPriority('reduce_risk')}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                    selectedPriority === 'reduce_risk'
                      ? 'bg-amber-500/10 border-amber-400 shadow-xl shadow-amber-500/15 ring-1 ring-amber-400'
                      : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      {selectedPriority === 'reduce_risk' && (
                        <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-[#050B14]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-display font-bold text-base text-white mb-1.5">
                      {isBn ? 'ঝুঁকি হ্রাস (Reduce Climate Risk)' : 'Lower Risk'}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-3">
                      {isBn
                        ? 'আকস্মিক খরা, তাপপ্রবাহ বা আগাম বন্যার মতো চরম আবহাওয়ার ক্ষতি এড়াতে সহনশীল ও নিরাপদ ফসল নিশ্চিত করে।'
                        : 'Avoids vulnerable weather windows; picks resilient varieties against sudden heat waves or early monsoons.'}
                    </p>
                  </div>
                  <div className="text-[11px] font-mono text-amber-400 pt-2 border-t border-white/10">
                    {isBn ? 'স্বল্পমেয়াদী ও চরম আবহাওয়া সহনশীল ফসল' : 'Picks short-duration crops to escape weather stress'}
                  </div>
                </div>
              </div>

              {/* Step 3 Actions */}
              <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
                </button>

                <button
                  type="button"
                  disabled={!selectedPriority || saving}
                  onClick={handleCompleteOnboarding}
                  className="px-7 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#a6eb2f] text-[#050B14] font-bold text-sm flex items-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#B8FF3D]/25"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isBn ? 'সংরক্ষণ করা হচ্ছে...' : 'Saving Setup...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isBn ? 'ড্যাশবোর্ডে প্রবেশ করুন' : 'Complete Setup & Go to Dashboard'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
