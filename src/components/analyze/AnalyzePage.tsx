import { useState, useEffect } from 'react';
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
  const { user, displayName } = useAuth();
  const [step, setStepState] = useState<AnalyzeStep>(initialStep);
  const [location, setLocation] = useState<SelectedLocation>(DEMO_LOCATION);
  const [primaryPriority, setPrimaryPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>(null);
  const [farmerName, setFarmerName] = useState<string>('');

  const setStep = (next: AnalyzeStep) => {
    setStepState(next);
    window.location.hash = next === 'dashboard' ? '#/dashboard' : `#/analyze/${next}`;
  };

  useEffect(() => {
    async function syncFarmerContext() {
      try {
        const { profile, fields } = await loadFarmerProfile(user?.id);
        if (profile) {
          if (profile.fullName) setFarmerName(profile.fullName);
          if (profile.primaryPriority) setPrimaryPriority(profile.primaryPriority);
          if (profile.priorities && profile.priorities.length > 1) {
            setSecondaryPriority(profile.priorities[1]);
          }
        }
        if (fields && fields.length > 0) {
          const activeField = getActiveField(fields);
          if (activeField && activeField.district) {
            setLocation({
              district: activeField.district as DistrictId,
              upazila: activeField.upazila || '',
              latitude: activeField.latitude,
              longitude: activeField.longitude,
              source: 'preset',
            });
          }
        }
      } catch (err) {
        console.error('Failed to sync farmer context into AnalyzePage', err);
      }
    }
    syncFarmerContext();
  }, [user?.id]);

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
      language={lang}
      onLanguageChange={handleLanguageChange}
      onChangeFieldLocation={() => setStep('location')}
      onChangePriority={() => setStep('priority')}
      onLogout={goHome}
    />
  );
}
