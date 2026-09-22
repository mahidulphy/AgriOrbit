import React, { useState } from 'react';
import { DistrictId, FarmerPriorityId, Language, UserJourneyStage } from './types';
import { DISTRICTS } from './data/agriData';
import { LandingPage } from './components/journey/LandingPage';
import { AuthScreen } from './components/journey/AuthScreen';
import { WelcomeOnboarding } from './components/journey/WelcomeOnboarding';
import { FarmLocationSetup } from './components/journey/FarmLocationSetup';
import { FieldLocationSelection } from './components/journey/FieldLocationSelection';
import { FarmerPrioritySetup } from './components/journey/FarmerPrioritySetup';
import { AnalyzeMyFieldTransition } from './components/journey/AnalyzeMyFieldTransition';
import { DashboardView } from './components/journey/DashboardView';
import { HowItWorksModal } from './components/HowItWorksModal';

export default function App() {
  // Journey state machine: Starts at 'landing' as required!
  const [journeyStage, setJourneyStage] = useState<UserJourneyStage>('landing');

  // User State
  const [userName, setUserName] = useState<string>('Farmer Rafiqul');
  const [language, setLanguage] = useState<Language>('en');

  // Farm & Field State (Rangpur is default demonstration location)
  const [selectedDistrict, setSelectedDistrict] = useState<DistrictId>('rangpur');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('mithapukur');
  const [fieldLat, setFieldLat] = useState<number>(25.7439);
  const [fieldLng, setFieldLng] = useState<number>(89.2752);

  // Farmer Priorities
  const [selectedPriority, setSelectedPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>('improve_soil');

  // How It Works Modal
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

  // Synchronize coordinates when district changes
  const handleDistrictChange = (districtId: DistrictId) => {
    setSelectedDistrict(districtId);
    const dist = DISTRICTS[districtId];
    setFieldLat(dist.lat);
    setFieldLng(dist.lng);
    if (dist.upazilas[0]) {
      setSelectedUpazila(dist.upazilas[0].id);
    }
  };

  const handleUpdateCoordinates = (lat: number, lng: number) => {
    setFieldLat(lat);
    setFieldLng(lng);
  };

  const handleAuthSuccess = (name: string) => {
    setUserName(name);
    setJourneyStage('welcome');
  };

  return (
    <>
      {/* 1. LANDING PAGE: First screen is a normal, beautiful product landing page */}
      {journeyStage === 'landing' && (
        <LandingPage
          language={language}
          onLanguageChange={setLanguage}
          onStartAnalysis={() => setJourneyStage('auth')}
          onOpenLogin={() => setJourneyStage('auth')}
          onOpenHowItWorks={() => setIsHowItWorksOpen(true)}
        />
      )}

      {/* 2. LOGIN / SIGN UP SCREEN */}
      {journeyStage === 'auth' && (
        <AuthScreen
          language={language}
          onSuccess={handleAuthSuccess}
          onBackToLanding={() => setJourneyStage('landing')}
        />
      )}

      {/* 3. WELCOME / ONBOARDING */}
      {journeyStage === 'welcome' && (
        <WelcomeOnboarding
          userName={userName}
          language={language}
          onGetStarted={() => setJourneyStage('farm_location')}
        />
      )}

      {/* 4. FARM LOCATION SETUP */}
      {journeyStage === 'farm_location' && (
        <FarmLocationSetup
          selectedDistrict={selectedDistrict}
          selectedUpazila={selectedUpazila}
          onSelectDistrict={handleDistrictChange}
          onSelectUpazila={setSelectedUpazila}
          language={language}
          onContinue={() => setJourneyStage('field_selection')}
          onBack={() => setJourneyStage('welcome')}
        />
      )}

      {/* 5. FIELD LOCATION SELECTION */}
      {journeyStage === 'field_selection' && (
        <FieldLocationSelection
          selectedDistrict={selectedDistrict}
          fieldLat={fieldLat}
          fieldLng={fieldLng}
          onUpdateCoordinates={handleUpdateCoordinates}
          language={language}
          onConfirmFieldLocation={() => setJourneyStage('farmer_priority')}
          onBack={() => setJourneyStage('farm_location')}
        />
      )}

      {/* 6. FARMER PRIORITY SETUP */}
      {journeyStage === 'farmer_priority' && (
        <FarmerPrioritySetup
          selectedPriority={selectedPriority}
          secondaryPriority={secondaryPriority}
          onSelectPrimaryPriority={setSelectedPriority}
          onSelectSecondaryPriority={setSecondaryPriority}
          language={language}
          onContinue={() => setJourneyStage('analyze_transition')}
          onBack={() => setJourneyStage('field_selection')}
        />
      )}

      {/* 7. ANALYZE MY FIELD TRANSITION */}
      {journeyStage === 'analyze_transition' && (
        <AnalyzeMyFieldTransition
          selectedDistrict={selectedDistrict}
          selectedPriority={selectedPriority}
          fieldLat={fieldLat}
          fieldLng={fieldLng}
          language={language}
          onViewDashboard={() => setJourneyStage('dashboard')}
        />
      )}

      {/* 8. FIELD ANALYSIS DASHBOARD: ONLY APPEARS HERE AFTER THE FULL JOURNEY */}
      {journeyStage === 'dashboard' && (
        <DashboardView
          userName={userName}
          selectedDistrict={selectedDistrict}
          selectedUpazila={selectedUpazila}
          fieldLat={fieldLat}
          fieldLng={fieldLng}
          selectedPriority={selectedPriority}
          secondaryPriority={secondaryPriority}
          language={language}
          onLanguageChange={setLanguage}
          onChangeFieldLocation={() => setJourneyStage('farm_location')}
          onChangePriority={() => setJourneyStage('farmer_priority')}
          onLogout={() => setJourneyStage('landing')}
        />
      )}

      {/* Global How It Works Modal */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
        language={language}
      />
    </>
  );
}
