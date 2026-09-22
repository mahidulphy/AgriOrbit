import React, { useState } from 'react';
import { FarmerPriorityId, Language, SelectedLocation, UserJourneyStage } from './types';
import { DEMO_LOCATION } from './lib/location';
import { LandingPage } from './components/journey/LandingPage';
import { AuthScreen } from './components/journey/AuthScreen';
import { WelcomeOnboarding } from './components/journey/WelcomeOnboarding';
import { FarmLocationStep } from './components/journey/FarmLocationStep';
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

  // ONE canonical farm location (Rangpur / Mithapukur demo default).
  // District dropdowns, map pin, presets, and NASA context all derive from it.
  const [selectedLocation, setSelectedLocation] = useState<SelectedLocation>(DEMO_LOCATION);

  // Farmer Priorities
  const [selectedPriority, setSelectedPriority] = useState<FarmerPriorityId>('save_water');
  const [secondaryPriority, setSecondaryPriority] = useState<FarmerPriorityId | null>('improve_soil');

  // How It Works Modal
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

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

      {/* 4. UNIFIED FARM LOCATION (district + upazila + real map + pin) */}
      {journeyStage === 'farm_location' && (
        <FarmLocationStep
          location={selectedLocation}
          onChangeLocation={setSelectedLocation}
          language={language}
          onContinue={() => setJourneyStage('farmer_priority')}
          onBack={() => setJourneyStage('welcome')}
        />
      )}

      {/* 5. FARMER PRIORITY SETUP */}
      {journeyStage === 'farmer_priority' && (
        <FarmerPrioritySetup
          selectedPriority={selectedPriority}
          secondaryPriority={secondaryPriority}
          onSelectPrimaryPriority={setSelectedPriority}
          onSelectSecondaryPriority={setSecondaryPriority}
          language={language}
          onContinue={() => setJourneyStage('analyze_transition')}
          onBack={() => setJourneyStage('farm_location')}
        />
      )}

      {/* 6. ANALYZE MY FIELD TRANSITION */}
      {journeyStage === 'analyze_transition' && (
        <AnalyzeMyFieldTransition
          selectedDistrict={selectedLocation.district}
          selectedPriority={selectedPriority}
          fieldLat={selectedLocation.latitude}
          fieldLng={selectedLocation.longitude}
          language={language}
          onViewDashboard={() => setJourneyStage('dashboard')}
        />
      )}

      {/* 7. FIELD ANALYSIS DASHBOARD: ONLY APPEARS HERE AFTER THE FULL JOURNEY */}
      {journeyStage === 'dashboard' && (
        <DashboardView
          userName={userName}
          selectedDistrict={selectedLocation.district}
          selectedUpazila={selectedLocation.upazila}
          fieldLat={selectedLocation.latitude}
          fieldLng={selectedLocation.longitude}
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
