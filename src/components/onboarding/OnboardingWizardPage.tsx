import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  AlertTriangle,
  RefreshCw,
  X,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { UserMenu } from '../auth/UserMenu';
import {
  saveFarmField,
  saveFarmerProfile,
  loadFarmerProfile,
  type FarmField,
  type FarmerProfileData,
  DEFAULT_INITIAL_FIELD,
  DEFAULT_FARMER_PROFILE_DATA,
} from '../../lib/farmerProfileService';
import { getDistrictAdmin, type DistrictId } from '../../data/bdAdmin';
import { DISTRICT_WIDE_UPAZILA } from '../../lib/location';
import type { FarmerPriorityId } from '../../types';
import {
  PersonalInfoSection,
  FarmFieldSection,
  CropHistorySection,
  FarmingPrioritiesSection,
  PastHazardsSection,
} from '../profile/sections';

const toBnDigit = (n: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(n).replace(/\d/g, (d) => bnDigits[Number(d)]);
};

const getStepTitle = (s: number, guest: boolean, bn: boolean): string => {
  if (guest) {
    switch (s) {
      case 1:
        return bn ? 'জমির তথ্য' : 'Farm Field';
      case 2:
        return bn ? 'ফসলের ইতিহাস' : 'Crop History';
      case 3:
        return bn ? 'চাষের লক্ষ্য' : 'Farming Priorities';
      case 4:
        return bn ? 'অতীতের দুর্যোগ (ঐচ্ছিক)' : 'Past Hazards (Optional)';
      default:
        return '';
    }
  } else {
    switch (s) {
      case 1:
        return bn ? 'ব্যক্তিগত তথ্য' : 'Personal Info';
      case 2:
        return bn ? 'জমির তথ্য' : 'Farm Field';
      case 3:
        return bn ? 'ফসলের ইতিহাস' : 'Crop History';
      case 4:
        return bn ? 'চাষের লক্ষ্য' : 'Farming Priorities';
      case 5:
        return bn ? 'অতীতের দুর্যোগ (ঐচ্ছিক)' : 'Past Hazards (Optional)';
      default:
        return '';
    }
  }
};

export const OnboardingWizardPage: React.FC = () => {
  const { user, isGuest, displayName, refreshProfile, setOnboardingCompleted } = useAuth();
  const { lang, setLang } = useLang();
  const isBn = lang === 'bn';

  const isGuestMode = Boolean(isGuest || !user);
  const totalSteps = isGuestMode ? 4 : 5;
  const stepStorageKey = user?.id
    ? `agriorbit_onboarding_step_${user.id}`
    : 'agriorbit_guest_onboarding_step';

  const [step, setStep] = useState<number>(1);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [savingStep, setSavingStep] = useState<boolean>(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Form State matching Profile Data Model exactly
  const [fullName, setFullName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [communicationMethod, setCommunicationMethod] = useState<FarmerProfileData['communicationMethod']>('in_app');
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  const [field, setField] = useState<FarmField>({
    ...DEFAULT_INITIAL_FIELD,
    id: 'field_primary_default',
    name: 'Plot 1',
    isPrimary: true,
  });

  const [currentCrop, setCurrentCrop] = useState<string>('aman');
  const [previousCrop, setPreviousCrop] = useState<string>('jute');

  const [selectedPriorities, setSelectedPriorities] = useState<FarmerPriorityId[]>([]);
  const [pastDamages, setPastDamages] = useState<string[]>([]);
  const [pastDamageNotes, setPastDamageNotes] = useState<string>('');

  // Per-field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Initialize data on mount & resume at unfinished step
  useEffect(() => {
    let active = true;

    async function initOnboardingData() {
      setLoadingInitial(true);
      try {
        let initialStep = 1;
        const storedStep =
          sessionStorage.getItem(stepStorageKey) || localStorage.getItem(stepStorageKey);

        if (storedStep) {
          const parsed = parseInt(storedStep, 10);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= totalSteps) {
            initialStep = parsed;
          }
        } else {
          const hash = window.location.hash || '';
          if (hash.includes('step=priority')) {
            initialStep = isGuestMode ? 3 : 4;
          } else if (hash.includes('step=location')) {
            initialStep = isGuestMode ? 1 : 2;
          }
        }

        if (user?.id) {
          // Authenticated farmer
          const { profile, fields } = await loadFarmerProfile(user.id);
          if (active) {
            const resolvedName =
              profile.fullName ||
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              displayName ||
              '';
            setFullName(resolvedName);
            setPhone(profile.phone || '');
            setCommunicationMethod(profile.communicationMethod || 'in_app');
            setAvatarUrl(profile.avatarUrl || user.user_metadata?.avatar_url || '');

            if (profile.priorities && profile.priorities.length > 0) {
              setSelectedPriorities(profile.priorities.slice(0, 2));
            } else if (profile.primaryPriority) {
              setSelectedPriorities([profile.primaryPriority]);
            }

            if (profile.pastDamages && profile.pastDamages.length > 0) {
              setPastDamages(profile.pastDamages);
            }
            if (profile.pastDamageNotes) {
              setPastDamageNotes(profile.pastDamageNotes);
            }

            if (fields && fields.length > 0) {
              const primary = fields.find((f) => f.isPrimary) || fields[0];
              setField({ ...primary });
              if (primary.currentCrop) setCurrentCrop(primary.currentCrop);
              if (primary.previousCrop) setPreviousCrop(primary.previousCrop);
            } else {
              const dAdmin = getDistrictAdmin('rangpur');
              setField((prev) => ({
                ...prev,
                division: dAdmin?.division || 'Rangpur',
                district: 'rangpur',
                upazila: DISTRICT_WIDE_UPAZILA,
                latitude: dAdmin ? dAdmin.lat : 25.7439,
                longitude: dAdmin ? dAdmin.lng : 89.2752,
              }));
            }
          }
        } else {
          // Guest mode initialization from sessionStorage
          if (active) {
            const guestProfileRaw = sessionStorage.getItem('agriorbit_guest_profile');
            if (guestProfileRaw) {
              try {
                const gp = JSON.parse(guestProfileRaw);
                if (gp.fullName) setFullName(gp.fullName);
                if (gp.phone) setPhone(gp.phone);
                if (gp.communicationMethod) setCommunicationMethod(gp.communicationMethod);
              } catch {}
            } else if (displayName && displayName !== 'Guest' && displayName !== 'Guest Farmer') {
              setFullName(displayName);
            }

            const guestFieldRaw = sessionStorage.getItem('agriorbit_guest_field');
            if (guestFieldRaw) {
              try {
                const gf = JSON.parse(guestFieldRaw);
                setField((prev) => ({ ...prev, ...gf }));
                if (gf.currentCrop) setCurrentCrop(gf.currentCrop);
                if (gf.previousCrop) setPreviousCrop(gf.previousCrop);
              } catch {}
            }

            const guestPrioritiesRaw = sessionStorage.getItem('agriorbit_guest_priorities');
            const guestPriority = sessionStorage.getItem('agriorbit_guest_priority');
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

            const guestHazardsRaw = sessionStorage.getItem('agriorbit_guest_hazards');
            if (guestHazardsRaw) {
              try {
                const gh = JSON.parse(guestHazardsRaw);
                if (Array.isArray(gh.pastDamages)) setPastDamages(gh.pastDamages);
                if (gh.pastDamageNotes) setPastDamageNotes(gh.pastDamageNotes);
              } catch {}
            }
          }
        }

        if (active) {
          setStep(initialStep);
        }
      } catch (err) {
        console.warn('Failed to initialize onboarding data:', err);
      } finally {
        if (active) setLoadingInitial(false);
      }
    }

    initOnboardingData();
    return () => {
      active = false;
    };
  }, [user?.id, displayName, isGuestMode, totalSteps, stepStorageKey]);

  // Update Field helper
  const handleFieldChange = (updated: Partial<FarmField>) => {
    setField((prev) => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString(),
    }));
    setFieldErrors({});
  };

  // Toggle Priority helper (Max 2 in onboarding)
  const handleTogglePriority = (pId: FarmerPriorityId) => {
    setFieldErrors({});
    setSelectedPriorities((prev) => {
      if (prev.includes(pId)) {
        return prev.filter((p) => p !== pId);
      }
      if (prev.length < 2) {
        return [...prev, pId];
      }
      // Replace secondary with the new one
      return [prev[0], pId];
    });
  };

  // Toggle Hazards helper
  const handleToggleHazard = (hId: string) => {
    setPastDamages((prev) => {
      if (hId === 'none') {
        return prev.includes('none') ? [] : ['none'];
      }
      const withoutNone = prev.filter((id) => id !== 'none');
      if (withoutNone.includes(hId)) {
        const next = withoutNone.filter((id) => id !== hId);
        return next.length === 0 ? ['none'] : next;
      }
      return [...withoutNone, hId];
    });
  };

  // Personal Info Validation (Signed-in Step 1)
  const validatePersonalInfo = (): boolean => {
    const errs: Record<string, string> = {};
    if (!fullName || fullName.trim().length < 2) {
      errs.fullName = isBn
        ? 'অনুগ্রহ করে কৃষকের পূর্ণ নাম লিখুন (কমপক্ষে ২টি অক্ষর)'
        : 'Please enter your full name (at least 2 characters)';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Farm Field Validation (Signed-in Step 2 / Guest Step 1)
  const validateFarmField = (): boolean => {
    const errs: Record<string, string> = {};
    if (!field.district) {
      errs.district = isBn ? 'একটি জেলা নির্বাচন করুন' : 'Please select a district';
    }
    if (!field.area || field.area <= 0) {
      errs.area = isBn ? 'জমির সঠিক পরিমাপ লিখুন' : 'Please enter a valid land area';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Crop History Validation (Signed-in Step 3 / Guest Step 2)
  const validateCropHistory = (): boolean => {
    const errs: Record<string, string> = {};
    if (!currentCrop) {
      errs.currentCrop = isBn ? 'বর্তমান ফসল নির্বাচন করুন' : 'Please select current crop';
    }
    if (!previousCrop) {
      errs.previousCrop = isBn ? 'পূর্ববর্তী ফসল নির্বাচন করুন' : 'Please select previous crop';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Farming Priorities Validation (Signed-in Step 4 / Guest Step 3)
  const validateFarmingPriorities = (): boolean => {
    const errs: Record<string, string> = {};
    if (selectedPriorities.length === 0) {
      errs.priority = isBn
        ? 'অনুগ্রহ করে অন্তত একটি প্রধান লক্ষ্য নির্বাচন করুন'
        : 'Please select at least one primary farming goal';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Forward Navigation & Auto-save per step
  const handleNext = async () => {
    setSaveError(null);

    if (!isGuestMode) {
      // --- SIGNED-IN USER FLOW (5 steps) ---
      if (step === 1) {
        if (!validatePersonalInfo()) return;
        setSavingStep(true);
        try {
          if (user?.id) {
            const res = await saveFarmerProfile(
              {
                fullName: fullName.trim(),
                phone: phone.trim(),
                communicationMethod,
              },
              user.id
            );
            if (!res.success) throw new Error(res.error || (isBn ? 'ব্যক্তিগত তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save personal info'));
          }
          sessionStorage.setItem(stepStorageKey, '2');
          localStorage.setItem(stepStorageKey, '2');
          setStep(2);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save personal info'));
        } finally {
          setSavingStep(false);
        }
      } else if (step === 2) {
        if (!validateFarmField()) return;
        setSavingStep(true);
        try {
          const dAdmin = getDistrictAdmin(field.district as DistrictId);
          const updatedField: FarmField = {
            ...field,
            id: field.id || crypto.randomUUID(),
            name: field.name || `${dAdmin?.nameEn || 'Primary'} Plot 1`,
            division: dAdmin?.division || field.division || 'Rangpur',
            district: field.district,
            upazila: field.upazila || DISTRICT_WIDE_UPAZILA,
            area: Number(field.area) || 1.5,
            unit: field.unit || 'bigha',
            elevation: field.elevation || 'medium_high',
            soilType: field.soilType || 'loam',
            irrigation: field.irrigation || 'shallow_tubewell',
            waterSource: field.waterSource || (field.irrigation === 'canal_surface' ? 'river' : field.irrigation === 'rainfed' ? 'rainwater' : 'groundwater'),
            currentCrop,
            previousCrop,
            isPrimary: true,
            updatedAt: new Date().toISOString(),
          };

          if (user?.id) {
            const res = await saveFarmField(updatedField, user.id);
            if (res.error) throw new Error(res.error);
          }
          setField(updatedField);
          sessionStorage.setItem(stepStorageKey, '3');
          localStorage.setItem(stepStorageKey, '3');
          setStep(3);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'জমির তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save field details'));
        } finally {
          setSavingStep(false);
        }
      } else if (step === 3) {
        if (!validateCropHistory()) return;
        setSavingStep(true);
        try {
          const updatedField: FarmField = {
            ...field,
            currentCrop,
            previousCrop,
            updatedAt: new Date().toISOString(),
          };

          if (user?.id) {
            const res = await saveFarmField(updatedField, user.id);
            if (res.error) throw new Error(res.error);
          }
          setField(updatedField);
          sessionStorage.setItem(stepStorageKey, '4');
          localStorage.setItem(stepStorageKey, '4');
          setStep(4);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'ফসলের ইতিহাস সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save crop history'));
        } finally {
          setSavingStep(false);
        }
      } else if (step === 4) {
        if (!validateFarmingPriorities()) return;
        setSavingStep(true);
        try {
          const primary = selectedPriorities[0];

          if (user?.id) {
            const pRes = await saveFarmerProfile(
              {
                primaryPriority: primary,
                priorities: selectedPriorities,
                onboardingCompleted: true,
              },
              user.id
            );
            if (!pRes.success) throw new Error(pRes.error || (isBn ? 'অগ্রাধিকার সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save priorities'));

            if (setOnboardingCompleted) {
              setOnboardingCompleted(true);
            }
            await refreshProfile();
          }

          localStorage.setItem('agriorbit_selected_priority', primary);
          localStorage.setItem('agriorbit_selected_priorities', JSON.stringify(selectedPriorities));

          sessionStorage.setItem(stepStorageKey, '5');
          localStorage.setItem(stepStorageKey, '5');
          setStep(5);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'অগ্রাধিকার সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save priorities'));
        } finally {
          setSavingStep(false);
        }
      }
    } else {
      // --- GUEST USER FLOW (4 steps) ---
      if (step === 1) {
        // Step 1: Farm Field
        if (!validateFarmField()) return;
        setSavingStep(true);
        try {
          const dAdmin = getDistrictAdmin(field.district as DistrictId);
          const updatedField: FarmField = {
            ...field,
            id: field.id || 'guest_field_1',
            name: field.name || `${dAdmin?.nameEn || 'Primary'} Plot 1`,
            division: dAdmin?.division || field.division || 'Rangpur',
            district: field.district,
            upazila: field.upazila || DISTRICT_WIDE_UPAZILA,
            area: Number(field.area) || 1.5,
            unit: field.unit || 'bigha',
            elevation: field.elevation || 'medium_high',
            soilType: field.soilType || 'loam',
            irrigation: field.irrigation || 'shallow_tubewell',
            waterSource: field.waterSource || (field.irrigation === 'canal_surface' ? 'river' : field.irrigation === 'rainfed' ? 'rainwater' : 'groundwater'),
            currentCrop,
            previousCrop,
            isPrimary: true,
            updatedAt: new Date().toISOString(),
          };

          sessionStorage.setItem('agriorbit_guest_field', JSON.stringify(updatedField));
          setField(updatedField);
          sessionStorage.setItem(stepStorageKey, '2');
          localStorage.setItem(stepStorageKey, '2');
          setStep(2);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'জমির তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save field details'));
        } finally {
          setSavingStep(false);
        }
      } else if (step === 2) {
        // Step 2: Crop History
        if (!validateCropHistory()) return;
        setSavingStep(true);
        try {
          const updatedField: FarmField = {
            ...field,
            currentCrop,
            previousCrop,
            updatedAt: new Date().toISOString(),
          };
          sessionStorage.setItem('agriorbit_guest_field', JSON.stringify(updatedField));
          setField(updatedField);
          sessionStorage.setItem(stepStorageKey, '3');
          localStorage.setItem(stepStorageKey, '3');
          setStep(3);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'ফসলের ইতিহাস সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save crop history'));
        } finally {
          setSavingStep(false);
        }
      } else if (step === 3) {
        // Step 3: Farming Priorities
        if (!validateFarmingPriorities()) return;
        setSavingStep(true);
        try {
          const primary = selectedPriorities[0];
          const secondary = selectedPriorities[1] || null;

          sessionStorage.setItem('agriorbit_guest_priorities', JSON.stringify(selectedPriorities));
          sessionStorage.setItem('agriorbit_guest_priority', primary);
          if (secondary) {
            sessionStorage.setItem('agriorbit_guest_secondary_priority', secondary);
          } else {
            sessionStorage.removeItem('agriorbit_guest_secondary_priority');
          }
          sessionStorage.setItem('agriorbit_guest_onboarding_completed', 'true');
          localStorage.setItem('agriorbit_guest_mode', 'true');
          localStorage.setItem('agriorbit_selected_priority', primary);
          localStorage.setItem('agriorbit_selected_priorities', JSON.stringify(selectedPriorities));

          sessionStorage.setItem(stepStorageKey, '4');
          localStorage.setItem(stepStorageKey, '4');
          setStep(4);
        } catch (err: any) {
          setSaveError(err?.message || (isBn ? 'অগ্রাধিকার সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save priorities'));
        } finally {
          setSavingStep(false);
        }
      }
    }
  };

  // Back Navigation
  const handleBack = () => {
    setSaveError(null);
    setFieldErrors({});
    const prevStep = Math.max(1, step - 1);
    sessionStorage.setItem(stepStorageKey, String(prevStep));
    localStorage.setItem(stepStorageKey, String(prevStep));
    setStep(prevStep);
  };

  // Finish Onboarding from Final Step (Save Hazards)
  const handleFinishWithHazards = async () => {
    setSavingStep(true);
    setSaveError(null);
    try {
      if (user?.id) {
        const res = await saveFarmerProfile(
          {
            pastDamages,
            pastDamageNotes,
            onboardingCompleted: true,
          },
          user.id
        );
        if (!res.success) throw new Error(res.error || (isBn ? 'তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save past hazard data'));
        if (setOnboardingCompleted) setOnboardingCompleted(true);
        await refreshProfile();
      } else {
        sessionStorage.setItem(
          'agriorbit_guest_hazards',
          JSON.stringify({ pastDamages, pastDamageNotes })
        );
        sessionStorage.setItem('agriorbit_guest_onboarding_completed', 'true');
        localStorage.setItem('agriorbit_guest_mode', 'true');
      }

      sessionStorage.removeItem(stepStorageKey);
      localStorage.removeItem(stepStorageKey);
      window.location.hash = '#/dashboard';
    } catch (err: any) {
      setSaveError(err?.message || (isBn ? 'তথ্য সংরক্ষণে সমস্যা হয়েছে' : 'Failed to save past hazards'));
    } finally {
      setSavingStep(false);
    }
  };

  // Skip Final Step directly to dashboard
  const handleSkipHazards = () => {
    if (isGuestMode) {
      sessionStorage.setItem('agriorbit_guest_onboarding_completed', 'true');
      localStorage.setItem('agriorbit_guest_mode', 'true');
    }
    sessionStorage.removeItem(stepStorageKey);
    localStorage.removeItem(stepStorageKey);
    window.location.hash = '#/dashboard';
  };

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF] mb-3" />
        <span className="font-mono text-xs text-slate-400">
          {isBn ? 'অনবোর্ডিং তথ্য প্রস্তুত হচ্ছে...' : 'Loading Onboarding Setup...'}
        </span>
      </div>
    );
  }

  const progressPercent = Math.round((step / totalSteps) * 100);
  const isPrioritiesStep = isGuestMode ? step === 3 : step === 4;
  const isFinalStep = step === totalSteps;

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      {/* 1. Navbar Header */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050B14]/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <span className="hidden sm:inline-block text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/20">
              {isBn ? 'প্রাথমিক খামার নিবন্ধন' : 'Farm Setup Wizard'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher language={lang} onLanguageChange={setLang} />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* 2. Unified Progress Bar ("ধাপ X / Y" and step name) */}
      <div className="w-full bg-[#07101D] border-b border-white/10 px-4 sm:px-6 py-3.5 sticky top-16 z-40">
        <div className="max-w-4xl mx-auto space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm font-mono">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-[#B8FF3D]/15 text-[#B8FF3D] font-bold border border-[#B8FF3D]/30">
                {isBn
                  ? `ধাপ ${toBnDigit(step)} / ${toBnDigit(totalSteps)}`
                  : `Step ${step} / ${totalSteps}`}
              </span>
              <span className="font-bold text-white">
                {getStepTitle(step, isGuestMode, isBn)}
              </span>
            </div>
            <span className="text-[#00E5FF] font-bold">
              {isBn ? `${toBnDigit(progressPercent)}%` : `${progressPercent}%`}
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00E5FF] to-[#B8FF3D] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Error Banner with Retry */}
      {saveError && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-5 w-full animate-fadeIn">
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs sm:text-sm flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <span>{saveError}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={isFinalStep ? handleFinishWithHazards : handleNext}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/40 text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isBn ? 'পুনরায় চেষ্টা' : 'Retry'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Wizard Step Form Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-2xl space-y-6">
          {/* STEP: Personal Info (Signed-in only, Step 1) */}
          {!isGuestMode && step === 1 && (
            <PersonalInfoSection
              fullName={fullName}
              onFullNameChange={setFullName}
              email={user?.email || ''}
              phone={phone}
              onPhoneChange={setPhone}
              communicationMethod={communicationMethod}
              onCommunicationMethodChange={setCommunicationMethod}
              avatarUrl={avatarUrl}
              errors={fieldErrors}
              isBn={isBn}
              showAvatarUpload={false}
            />
          )}

          {/* STEP: Farm Field (Signed-in Step 2, Guest Step 1) */}
          {((!isGuestMode && step === 2) || (isGuestMode && step === 1)) && (
            <FarmFieldSection
              field={field}
              onChange={handleFieldChange}
              isBn={isBn}
              isOnboarding={true}
              errors={fieldErrors}
            />
          )}

          {/* STEP: Crop History (Signed-in Step 3, Guest Step 2) */}
          {((!isGuestMode && step === 3) || (isGuestMode && step === 2)) && (
            <CropHistorySection
              currentCrop={currentCrop}
              onCurrentCropChange={setCurrentCrop}
              previousCrop={previousCrop}
              onPreviousCropChange={setPreviousCrop}
              isBn={isBn}
              showPlannedNext={false}
              errors={fieldErrors}
            />
          )}

          {/* STEP: Farming Priorities (Signed-in Step 4, Guest Step 3) */}
          {((!isGuestMode && step === 4) || (isGuestMode && step === 3)) && (
            <FarmingPrioritiesSection
              selectedPriorities={selectedPriorities}
              onTogglePriority={handleTogglePriority}
              primaryPriority={selectedPriorities[0]}
              onSetPrimaryPriority={(pId) => {
                setSelectedPriorities((prev) => [pId, ...prev.filter((p) => p !== pId)]);
              }}
              isBn={isBn}
              maxSelectable={2}
              error={fieldErrors.priority}
            />
          )}

          {/* STEP: Past Hazards (Signed-in Step 5, Guest Step 4 - Optional / Can be skipped) */}
          {((!isGuestMode && step === 5) || (isGuestMode && step === 4)) && (
            <PastHazardsSection
              pastDamages={pastDamages}
              onToggleDamage={handleToggleHazard}
              pastDamageNotes={pastDamageNotes}
              onNotesChange={setPastDamageNotes}
              isBn={isBn}
            />
          )}

          {/* Bottom Actions Bar */}
          <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={savingStep}
                  className="w-full sm:w-auto min-h-[48px] px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-mono text-sm font-semibold flex items-center justify-center gap-2 border border-white/15 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isBn ? 'পূর্ববর্তী ধাপ' : 'Back'}</span>
                </button>
              ) : (
                <span className="text-xs font-mono text-slate-500 hidden sm:inline-block">
                  {isBn ? 'ধাপ ১ বাধ্যতামূলক' : 'Step 1 is required'}
                </span>
              )}
            </div>

            <div className="w-full sm:w-auto flex items-center gap-3 justify-end">
              {/* Skip button for Final Step */}
              {isFinalStep && (
                <button
                  type="button"
                  onClick={handleSkipHazards}
                  disabled={savingStep}
                  className="flex-1 sm:flex-initial min-h-[48px] px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white font-mono text-sm border border-white/15 transition-colors cursor-pointer"
                >
                  {isBn ? 'এড়িয়ে যান (Skip)' : 'Skip this step'}
                </button>
              )}

              {/* Direct Skip to Dashboard on Priorities Step (optional shortcut) */}
              {isPrioritiesStep && selectedPriorities.length >= 1 && (
                <button
                  type="button"
                  onClick={async () => {
                    await handleNext();
                    handleSkipHazards();
                  }}
                  disabled={savingStep}
                  className="hidden md:inline-flex min-h-[48px] items-center px-4 py-2.5 rounded-xl text-xs font-mono text-[#00E5FF] hover:bg-white/5 cursor-pointer"
                >
                  {isBn ? 'এখনই ড্যাশবোর্ডে প্রবেশ করুন' : 'Finish & Go to Dashboard'}
                </button>
              )}

              {/* Primary Next / Finish Button */}
              {!isFinalStep ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={savingStep}
                  className="w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#B8FF3D]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingStep ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <span>
                        {isPrioritiesStep
                          ? isBn
                            ? 'পরবর্তী: দুর্যোগ তথ্য (ঐচ্ছিক)'
                            : 'Next: Past Hazards (Optional)'
                          : isBn
                          ? 'পরবর্তী ধাপ'
                          : 'Next Step'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinishWithHazards}
                  disabled={savingStep}
                  className="w-full sm:w-auto min-h-[48px] px-7 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#B8FF3D] hover:opacity-90 text-black font-mono font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-[#00E5FF]/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {savingStep ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isBn ? 'চূড়ান্ত সংরক্ষণ...' : 'Finalizing...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>{isBn ? 'সম্পূর্ণ করুন ও ড্যাশবোর্ডে প্রবেশ করুন' : 'Finish & Enter Dashboard'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
