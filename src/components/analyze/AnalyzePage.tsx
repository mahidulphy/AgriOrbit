import React, { useState } from 'react';
import { useLang } from '../../lang.tsx';
import { goHome } from '../../lib/nav.ts';
import { DEMO_LOCATION } from '../../lib/location.ts';
import type { DistrictId, FarmerPriorityId, Language, SelectedLocation } from '../../types.ts';
import { FarmLocationStep } from '../journey/FarmLocationStep.tsx';
import { FarmerPrioritySetup } from '../journey/FarmerPrioritySetup.tsx';
import { DashboardView } from '../journey/DashboardView.tsx';

type AnalyzeStep = 'location' | 'priority' | 'dashboard';

export function AnalyzePage() {
  const { lang, setLang } = useLang();
  const [step, setStep] = useState<AnalyzeStep>('location');
  const [location, setLocation] = useState<SelectedLocation>(DEMO_LOCATION);
  const [primaryPriority, setPrimaryPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>(null);

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
