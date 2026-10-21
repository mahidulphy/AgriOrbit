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
  ShieldCheck,
  TrendingUp,
  Clock,
  AlertTriangle,
  RefreshCw,
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
  const { user, isGuest, displayName, refreshProfile, setOnboardingCompleted } = useAuth();
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
  const [selectedPriorities, setSelectedPriorities] = useState<FarmerPriorityId[]>([]);
  const [saveError, setSaveError] = useState<string | null>(null);

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
            if (profile.priorities && profile.priorities.length > 0) {
              setSelectedPriorities(profile.priorities.slice(0, 2));
            } else if (profile.primaryPriority) {
              setSelectedPriorities([profile.primaryPriority]);
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
          const guestPrioritiesRaw = sessionStorage.getItem('agriorbit_guest_priorities');
          if (guestPrioritiesRaw) {
            try {
              const parsed = JSON.parse(guestPrioritiesRaw);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSelectedPriorities(parsed.slice(0, 2));
              }
            } catch {}
          } else if (guestPriority) {
            setSelectedPriorities([guestPriority as FarmerPriorityId]);
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

    const handleTogglePriority = (pId: FarmerPriorityId) => {
    setSaveError(null);
    setSelectedPriorities((prev) => {
      if (prev.includes(pId)) {
        return prev.filter((p) => p !== pId);
      }
      if (prev.length < 2) {
        return [...prev, pId];
      }
      return [prev[0], pId];
    });
  };

    const handleCompleteOnboarding = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log('[ONBOARDING_DEBUG] 1. Finish button clicked');
    console.log('[ONBOARDING_DEBUG] 2. Current selectedPriorities:', selectedPriorities);

    if (selectedPriorities.length === 0) {
      console.warn('[ONBOARDING_DEBUG] Validation failed: No priority selected');
      setSaveError(
        isBn
          ? 'দয়া করে অন্তত একটি প্রধান লক্ষ্য বেছে নিন।'
          : 'Please select at least one primary priority.'
      );
      return;
    }

    setSaving(true);
    setSaveError(null);
    console.log('[ONBOARDING_DEBUG] 3. Starting save process. User authenticated:', Boolean(user?.id), 'isGuest:', isGuest);

    try {
      const primaryPriority = selectedPriorities[0];
      const secondaryPriority = selectedPriorities[1] || null;
      const districtAdmin = getDistrictAdmin(selectedDistrict);
      const divisionName = districtAdmin?.division || 'Rangpur';
      const districtName = districtAdmin?.nameEn || 'Rangpur';

      if (user?.id) {
        console.log('[ONBOARDING_DEBUG] 4a. Saving farm field for user:', user.id);
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

        const fieldRes = await saveFarmField(newField, user.id);
        console.log('[ONBOARDING_DEBUG] 4b. saveFarmField result:', fieldRes);
        if (fieldRes.error) {
          console.warn('[ONBOARDING_DEBUG] Field save warning:', fieldRes.error);
        }

        console.log('[ONBOARDING_DEBUG] 5a. Saving farmer profile (onboarding_completed: true)...');
        const profileRes = await saveFarmerProfile(
          {
            fullName: fullName.trim() || displayName || user.email?.split('@')[0] || 'Farmer',
            phone: phone.trim(),
            primaryPriority,
            priorities: selectedPriorities,
            onboardingCompleted: true,
          },
          user.id
        );
        console.log('[ONBOARDING_DEBUG] 5b. saveFarmerProfile result:', profileRes);

        if (!profileRes.success && profileRes.error) {
          console.error('[ONBOARDING_DEBUG] Profile save reported error:', profileRes.error);
          throw new Error(profileRes.error);
        }

        console.log('[ONBOARDING_DEBUG] 6a. Updating auth context state directly to true...');
        if (setOnboardingCompleted) {
          setOnboardingCompleted(true);
        }

        console.log('[ONBOARDING_DEBUG] 6b. Calling refreshProfile()...');
        await refreshProfile();
        console.log('[ONBOARDING_DEBUG] 6c. Profile refreshed successfully.');
      } else {
        console.log('[ONBOARDING_DEBUG] 4-guest. Saving guest state to sessionStorage & localStorage...');
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
        sessionStorage.setItem('agriorbit_guest_priority', primaryPriority);
        if (secondaryPriority) {
          sessionStorage.setItem('agriorbit_guest_secondary_priority', secondaryPriority);
        } else {
          sessionStorage.removeItem('agriorbit_guest_secondary_priority');
        }
        sessionStorage.setItem('agriorbit_guest_priorities', JSON.stringify(selectedPriorities));
        sessionStorage.setItem('agriorbit_guest_onboarding_completed', 'true');
        localStorage.setItem('agriorbit_guest_mode', 'true');
        console.log('[ONBOARDING_DEBUG] Guest state saved successfully.');
      }

      // Sync active priority to legacy keys for recommendation engine cross-compatibility
      localStorage.setItem('agriorbit_selected_priority', primaryPriority);
      localStorage.setItem('agriorbit_selected_priorities', JSON.stringify(selectedPriorities));

      console.log('[ONBOARDING_DEBUG] 7. Onboarding successfully completed! Navigating to #/dashboard now.');
      window.location.hash = '#/dashboard';
    } catch (err: any) {
      console.error('[ONBOARDING_DEBUG] Save error caught:', err);
      setSaveError(
        isBn
          ? `তথ্য সংরক্ষণে সমস্যা হয়েছে: ${err?.message || 'অনুগ্রহ করে আবার চেষ্টা করুন।'}`
          : `Failed to complete setup: ${err?.message || 'Please check your connection and retry.'}`
      );
    } finally {
      setSaving(false);
      console.log('[ONBOARDING_DEBUG] Save process ended. saving = false');
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

          {/* ================= STEP 3: FARMING PRIORITY (7 CARDS, UP TO 2 GOALS) ================= */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <p className="text-xs sm:text-sm text-slate-300">
                  {isBn
                    ? 'আপনার খামারের জন্য সর্বোচ্চ ২টি লক্ষ্য বেছে নিন (১ম লক্ষ্য পূর্ণ প্রভাব, ২য় লক্ষ্য ৫০% প্রভাব পাবে)।'
                    : 'Choose up to 2 farming goals (1st goal receives full weight, 2nd goal receives 50% weight).'}
                </p>
                <div className="text-xs font-mono font-semibold shrink-0">
                  <span className={selectedPriorities.length > 0 ? 'text-[#B8FF3D]' : 'text-slate-400'}>
                    {isBn ? `নির্বাচিত: ${selectedPriorities.length}/২` : `Selected: ${selectedPriorities.length}/2`}
                  </span>
                </div>
              </div>

              {saveError && (
                <div className="p-3.5 sm:p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{saveError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCompleteOnboarding}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-200 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
                    <span>{isBn ? 'পুনরায় চেষ্টা করুন' : 'Retry'}</span>
                  </button>
                </div>
              )}

              {/* 7 Priority Cards in 2-Column Compact Grid on Mobile */}
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 pt-1">
                {[
                  {
                    id: 'save_water' as FarmerPriorityId,
                    icon: Droplets,
                    titleEn: 'Save Water',
                    titleBn: 'বিদ্যুৎ ও সেচ খরচ বাঁচানো',
                    subEn: 'Prioritizes drought-tolerant pulses & oilseeds over thirsty Boro.',
                    subBn: 'অতিরিক্ত সেচের বদলে কম পানির ডাল ও তেলবীজকে প্রাধান্য দেয়।',
                    exampleEn: 'Boosts Lentil & Mustard over heavy Boro',
                    exampleBn: 'বোরোর চেয়ে মসুর ও সরিষাকে অগ্রাধিকার দেয়',
                    borderColor: 'border-[#00E5FF]',
                    bgColor: 'bg-[#00E5FF]/10',
                    ringColor: 'ring-[#00E5FF]',
                    textColor: 'text-[#00E5FF]',
                    badgeBg: 'bg-[#00E5FF] text-[#050B14]',
                    iconBg: 'bg-[#00E5FF]/20 border-[#00E5FF]/40 text-[#00E5FF]',
                  },
                  {
                    id: 'lower_cost' as FarmerPriorityId,
                    icon: Coins,
                    titleEn: 'Low Input Cost',
                    titleBn: 'কম খরচে আবাদ',
                    subEn: 'Minimizes costly diesel pumping and synthetic fertilizers.',
                    subBn: 'সেচ ও রাসায়নিক সারের বাড়তি খরচ কমিয়ে স্বল্প পুঁজিতে আবাদ।',
                    exampleEn: 'Favors low-input Mustard & Pulses over capex Potato',
                    exampleBn: 'ব্যয়বহুল আলুর চেয়ে সাশ্রয়ী সরিষা ও ডাল বাছাই',
                    borderColor: 'border-[#B8FF3D]',
                    bgColor: 'bg-[#B8FF3D]/10',
                    ringColor: 'ring-[#B8FF3D]',
                    textColor: 'text-[#B8FF3D]',
                    badgeBg: 'bg-[#B8FF3D] text-[#050B14]',
                    iconBg: 'bg-[#B8FF3D]/20 border-[#B8FF3D]/40 text-[#B8FF3D]',
                  },
                  {
                    id: 'improve_soil' as FarmerPriorityId,
                    icon: Sprout,
                    titleEn: 'Soil Health',
                    titleBn: 'মাটির উর্বরতা বৃদ্ধি',
                    subEn: 'Biological nitrogen fixation and organic matter replenishment.',
                    subBn: 'প্রাকৃতিক নাইট্রোজেন সংবন্ধন ও মাটির জৈব শক্তি পুনরুদ্ধার।',
                    exampleEn: 'Boosts Mungbean & Jute for biological fertility',
                    exampleBn: 'মুগডাল ও পাটের মাধ্যমে প্রাকৃতিক নাইট্রোজেন বৃদ্ধি',
                    borderColor: 'border-emerald-400',
                    bgColor: 'bg-emerald-500/10',
                    ringColor: 'ring-emerald-400',
                    textColor: 'text-emerald-400',
                    badgeBg: 'bg-emerald-400 text-[#050B14]',
                    iconBg: 'bg-emerald-500/20 border-emerald-400/40 text-emerald-400',
                  },
                  {
                    id: 'reduce_risk' as FarmerPriorityId,
                    icon: ShieldAlert,
                    titleEn: 'Climate Resilience',
                    titleBn: 'আবহাওয়ার ঝুঁকি কমানো',
                    subEn: 'Avoids vulnerable weather windows against heatwaves or storms.',
                    subBn: 'আকস্মিক খরা, তাপপ্রবাহ বা আগাম বন্যার ক্ষতি এড়াতে সহনশীল ফসল।',
                    exampleEn: 'Picks short-duration resilient varieties against weather stress',
                    exampleBn: 'স্বল্পমেয়াদী ও চরম আবহাওয়া সহনশীল জাত',
                    borderColor: 'border-amber-400',
                    bgColor: 'bg-amber-500/10',
                    ringColor: 'ring-amber-400',
                    textColor: 'text-amber-400',
                    badgeBg: 'bg-amber-400 text-[#050B14]',
                    iconBg: 'bg-amber-500/20 border-amber-400/40 text-amber-400',
                  },
                  {
                    id: 'higher_income' as FarmerPriorityId,
                    icon: TrendingUp,
                    titleEn: 'Higher Profit Potential',
                    titleBn: 'বেশি আয়ের সম্ভাবনা',
                    subEn: 'Commercial cash crops with high return potential.',
                    subBn: 'বাজারে ভালো দাম পাওয়া সম্ভাবনাময় বাণিজ্যিক ফসল।',
                    exampleEn: 'Favors Potato, Maize, Mustard, Lentil',
                    exampleBn: 'বাণিজ্যিক ফসল: আলু, ভুট্টা, সরিষা, মসুর',
                    disclaimerEn: '* Approximate value category, not live market prices',
                    disclaimerBn: '* আনুমানিক আয়ের শ্রেণী, তাৎক্ষণিক বাজারদর নয়',
                    borderColor: 'border-purple-400',
                    bgColor: 'bg-purple-500/10',
                    ringColor: 'ring-purple-400',
                    textColor: 'text-purple-300',
                    badgeBg: 'bg-purple-400 text-[#050B14]',
                    iconBg: 'bg-purple-500/20 border-purple-400/40 text-purple-300',
                  },
                  {
                    id: 'quick_harvest' as FarmerPriorityId,
                    icon: Clock,
                    titleEn: 'Quick Harvest',
                    titleBn: 'দ্রুত ফসল তোলা',
                    subEn: 'Fast turnaround (65–85 days) to free land rapidly for the next crop.',
                    subBn: 'মাত্র ৬৫-৮৫ দিনে ঘরে ওঠে এবং জমি দ্রুত পরবর্তী ফসলের জন্য খালি করে।',
                    exampleEn: 'Rapid 65-80d crops: Mungbean, Mustard',
                    exampleBn: 'দ্রুততম ফসল: মুগ ডাল (৬৫ দিন), সরিষা (৮০ দিন)',
                    borderColor: 'border-orange-400',
                    bgColor: 'bg-orange-500/10',
                    ringColor: 'ring-orange-400',
                    textColor: 'text-orange-400',
                    badgeBg: 'bg-orange-400 text-[#050B14]',
                    iconBg: 'bg-orange-500/20 border-orange-400/40 text-orange-400',
                  },
                  {
                    id: 'family_food' as FarmerPriorityId,
                    icon: ShieldCheck,
                    titleEn: 'Family Food Security',
                    titleBn: 'পারিবারিক খাদ্য নিরাপত্তা',
                    subEn: 'Secures year-round household nutrition: rice, wheat, and daily pulses.',
                    subBn: 'পরিবারের সারা বছরের ভাত, আটা ও ডালের চাহিদা ও পুষ্টি নিশ্চিত করে।',
                    exampleEn: 'Prioritizes staple food: Rice, Wheat, Lentils',
                    exampleBn: 'মৌলিক খাদ্য নিরাপত্তা: ধান, গম, মসুর ডাল',
                    borderColor: 'border-sky-400',
                    bgColor: 'bg-sky-500/10',
                    ringColor: 'ring-sky-400',
                    textColor: 'text-sky-400',
                    badgeBg: 'bg-sky-400 text-[#050B14]',
                    iconBg: 'bg-sky-500/20 border-sky-400/40 text-sky-400',
                  },
                ].map((card) => {
                  const Icon = card.icon;
                  const rank = selectedPriorities.indexOf(card.id);
                  const isSelected = rank >= 0;

                  return (
                    <div
                      key={card.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={() => handleTogglePriority(card.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleTogglePriority(card.id);
                        }
                      }}
                      className={`p-3 sm:p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between select-none min-h-[145px] sm:min-h-[175px] ${
                        isSelected
                          ? `${card.bgColor} ${card.borderColor} shadow-lg ring-1 ${card.ringColor}`
                          : 'bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/[0.07]'
                      }`}
                    >
                      <div>
                        {/* Header: Icon + Badge */}
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center shrink-0 border ${card.iconBg}`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {rank === 0 && (
                            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#B8FF3D] text-[#050B14] flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{isBn ? '১ম লক্ষ্য' : '1st'}</span>
                            </span>
                          )}

                          {rank === 1 && (
                            <span className="text-[10px] sm:text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#00E5FF] text-[#050B14] flex items-center gap-1 shadow-sm">
                              <Check className="w-3 h-3 stroke-[3]" />
                              <span>{isBn ? '২য় (৫০%)' : '2nd (50%)'}</span>
                            </span>
                          )}
                        </div>

                        {/* Title & Description */}
                        <h3 className="font-display font-bold text-xs sm:text-sm text-white mb-1 leading-snug">
                          {isBn ? card.titleBn : card.titleEn}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-300 leading-snug mb-2 line-clamp-2">
                          {isBn ? card.subBn : card.subEn}
                        </p>
                      </div>

                      {/* Footer: Example & Disclaimer */}
                      <div>
                        <div className={`text-[10px] sm:text-[11px] font-mono ${card.textColor} pt-1.5 border-t border-white/10 truncate`}>
                          {isBn ? card.exampleBn : card.exampleEn}
                        </div>
                        {card.disclaimerBn && (
                          <div className="text-[9px] text-slate-400 italic pt-0.5 leading-none">
                            {isBn ? card.disclaimerBn : card.disclaimerEn}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step 3 Actions */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isBn ? 'পূর্ববর্তী' : 'Back'}</span>
                </button>

                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  {selectedPriorities.length === 0 && (
                    <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-lg text-center">
                      {isBn ? 'একটি লক্ষ্য বেছে নিন (সর্বোচ্চ ২টি)' : 'Choose a goal (up to 2)'}
                    </span>
                  )}

                  <button
                    type="button"
                    disabled={selectedPriorities.length === 0 || saving}
                    onClick={handleCompleteOnboarding}
                    className="relative z-10 w-full sm:w-auto px-7 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#a6eb2f] text-[#050B14] font-bold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#B8FF3D]/25"
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
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
