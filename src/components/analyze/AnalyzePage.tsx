import React, { useState, useEffect } from 'react';
import { useLang } from '../../lang.tsx';
import { goHome } from '../../lib/nav.ts';
import { DEMO_LOCATION } from '../../lib/location.ts';
import type { DistrictId, FarmerPriorityId, Language, SelectedLocation } from '../../types.ts';
import { FarmLocationStep } from '../journey/FarmLocationStep.tsx';
import { FarmerPrioritySetup } from '../journey/FarmerPrioritySetup.tsx';
import { DashboardView } from '../journey/DashboardView.tsx';

type AnalyzeStep = 'location' | 'priority' | 'dashboard';

function initialStep(): AnalyzeStep {
  if (typeof window !== 'undefined') {
    if (window.location.hash.includes('dashboard')) return 'dashboard';
    if (window.location.hash.includes('priority')) return 'priority';
  }
  return 'location';
}

export function AnalyzePage() {
  const { lang, setLang } = useLang();
  const [step, setStepState] = useState<AnalyzeStep>(initialStep);
  const [location, setLocation] = useState<SelectedLocation>(DEMO_LOCATION);
  const [primaryPriority, setPrimaryPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>(null);

  const setStep = (next: AnalyzeStep) => {
    setStepState(next);
    window.location.hash = `#/analyze/${next}`;
  };

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
      userName="Farmer"
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
