import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { goHome } from '../../lib/nav.ts';
import { DEMO_LOCATION } from '../../lib/location.ts';
import type { DistrictId, FarmerPriorityId, Language, SelectedLocation } from '../../types.ts';
import { FarmLocationStep } from '../journey/FarmLocationStep.tsx';
import { FarmerPrioritySetup } from '../journey/FarmerPrioritySetup.tsx';
import { DashboardView } from '../journey/DashboardView.tsx';
import { loadFarmerProfile, getActiveField } from '../../lib/farmerProfileService.ts';

type AnalyzeStep = 'location' | 'priority' | 'dashboard';

function initialStep(): AnalyzeStep {
  if (typeof window !== 'undefined') {
    if (window.location.hash.includes('priority')) return 'priority';
    if (window.location.hash.includes('location')) return 'location';
  }
  return 'dashboard';
}

export function AnalyzePage() {
  const { lang, setLang } = useLang();
  const { user, isGuest, displayName, signOut } = useAuth();
  const [step, setStepState] = useState<AnalyzeStep>(initialStep);
  const [location, setLocation] = useState<SelectedLocation>(DEMO_LOCATION);
  const [primaryPriority, setPrimaryPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>(null);
  const [previousCrop, setPreviousCrop] = useState<string>('jute');
  const [farmerName, setFarmerName] = useState<string>('');

  // Authentication & profile loading states
  const [loadingProfile, setLoadingProfile] = useState<boolean>(() => Boolean(user?.id));
  const [profileError, setProfileError] = useState<string | null>(null);
  const [hasResolvedField, setHasResolvedField] = useState<boolean>(() => !user?.id);

  const setStep = (next: AnalyzeStep) => {
    setStepState(next);
    window.location.hash = next === 'dashboard' ? '#/dashboard' : `#/analyze/${next}`;
  };

  const syncFarmerContext = useCallback(async () => {
    // 1. Guest mode or logged-out visitor: read session storage or fallback to demo
    if (!user || isGuest) {
      setLoadingProfile(false);
      setProfileError(null);
      setHasResolvedField(true);
      try {
        const guestFieldRaw = sessionStorage.getItem('agriorbit_guest_field');
        const guestPriorityRaw = sessionStorage.getItem('agriorbit_guest_priority');
        if (guestFieldRaw) {
          const gf = JSON.parse(guestFieldRaw);
          if (gf.previousCrop) setPreviousCrop(gf.previousCrop);
          if (gf.district) {
            setLocation({
              district: gf.district as DistrictId,
              upazila: gf.upazila || '',
              latitude: gf.latitude,
              longitude: gf.longitude,
              source: 'preset',
            });
          }
        }
        if (guestPriorityRaw) {
          setPrimaryPriority(guestPriorityRaw as FarmerPriorityId);
        }
      } catch {
        // ignore
      }
      return;
    }

    // 2. Authenticated farmer: load from Supabase & local cache
    setLoadingProfile(true);
    setProfileError(null);

    try {
      const { profile, fields, error } = await loadFarmerProfile(user.id);

      if (error && (!fields || fields.length === 0)) {
        setProfileError(error);
        setLoadingProfile(false);
        return;
      }

      // Check whether user has at least one saved field with a district
      const active = fields && fields.length > 0 ? getActiveField(fields) : null;
      if (!active || !active.district) {
        // Authenticated user with no saved field MUST complete onboarding
        window.location.hash = '#/onboarding';
        return;
      }

      // Update state with farmer's actual field location and priorities
      if (profile) {
        if (profile.fullName) setFarmerName(profile.fullName);
        if (profile.primaryPriority) setPrimaryPriority(profile.primaryPriority);
        if (profile.priorities && profile.priorities.length > 1) {
          setSecondaryPriority(profile.priorities[1]);
        }
      }

      if (active.previousCrop) setPreviousCrop(active.previousCrop);
      setLocation({
        district: active.district as DistrictId,
        upazila: active.upazila || active.upazilaId || '',
        latitude: active.latitude,
        longitude: active.longitude,
        source: 'preset',
      });

      setHasResolvedField(true);
      setProfileError(null);
    } catch (err: any) {
      console.error('Failed to sync farmer context into AnalyzePage', err);
      setProfileError(err?.message || 'Failed to load farmer field observations');
    } finally {
      setLoadingProfile(false);
    }
  }, [user, isGuest]);

  useEffect(() => {
    syncFarmerContext();
  }, [syncFarmerContext]);

  useEffect(() => {
    const onHash = () => {
      setStepState(initialStep());
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const handleLanguageChange = (newLang: Language) => {
    setLang(newLang);
  };

  // State A: Loading profile observations for signed-in user
  if (user?.id && loadingProfile) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-lg border border-[#262626] bg-[#141414] flex items-center justify-center text-[#22C55E] mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono text-xs text-[#737373]">
          {lang === 'en' ? 'Loading your field observations...' : 'আপনার জমির উপাত্ত লোড হচ্ছে...'}
        </p>
      </div>
    );
  }

  // State B: Error loading profile for signed-in user (NO silent Rangpur demo fallback!)
  if (user?.id && profileError) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141414] border border-[#262626] rounded-2xl p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-[#FAFAFA]">
              {lang === 'en' ? 'Unable to load your field profile' : 'আপনার জমির তথ্য লোড করা যায়নি'}
            </h3>
            <p className="text-xs text-[#A3A3A3] mt-1.5 font-mono">
              {profileError}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => syncFarmerContext()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22C55E] text-black text-xs font-semibold hover:bg-[#16a34a] transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{lang === 'en' ? 'Retry' : 'পুনরায় চেষ্টা করুন'}</span>
            </button>
            <button
              onClick={async () => {
                await signOut();
                goHome();
              }}
              className="px-4 py-2 rounded-lg bg-[#262626] text-[#FAFAFA] text-xs font-medium hover:bg-[#333333] transition-colors cursor-pointer"
            >
              {lang === 'en' ? 'Sign Out' : 'লগআউট করুন'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // State C: Signed-in user without resolved field yet
  if (user?.id && !hasResolvedField) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-4">
        <div className="w-10 h-10 rounded-lg border border-[#262626] bg-[#141414] flex items-center justify-center text-[#22C55E] mb-3">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono text-xs text-[#737373]">
          {lang === 'en' ? 'Verifying field location...' : 'জমির অবস্থান যাচাই করা হচ্ছে...'}
        </p>
      </div>
    );
  }

  if (step === 'location') {
    return (
      <FarmLocationStep
        location={location}
        onChangeLocation={setLocation}
        language={lang}
        onContinue={() => setStep('priority')}
        onBack={goHome}
      />
    );
  }

  if (step === 'priority') {
    return (
      <FarmerPrioritySetup
        selectedPriority={primaryPriority}
        secondaryPriority={secondaryPriority}
        onSelectPrimaryPriority={setPrimaryPriority}
        onSelectSecondaryPriority={setSecondaryPriority}
        language={lang}
        onContinue={() => setStep('dashboard')}
        onBack={() => setStep('location')}
      />
    );
  }

  return (
    <DashboardView
      userName={farmerName || displayName || (lang === 'en' ? 'Farmer' : 'খামারী')}
      selectedDistrict={location.district as DistrictId}
      selectedUpazila={location.upazila}
      fieldLat={location.latitude}
      fieldLng={location.longitude}
      selectedPriority={primaryPriority}
      secondaryPriority={secondaryPriority}
      previousCrop={previousCrop}
      language={lang}
      onLanguageChange={handleLanguageChange}
      onChangeFieldLocation={() => {
        window.location.hash = '#/onboarding?step=location';
      }}
      onChangePriority={() => {
        window.location.hash = '#/onboarding?step=priority';
      }}
      onLogout={goHome}
    />
  );
}
