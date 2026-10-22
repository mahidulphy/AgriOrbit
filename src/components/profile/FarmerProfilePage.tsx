import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Shield,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Camera,
  MapPin,
  Sprout,
  Plus,
  Trash2,
  Edit2,
  Save,
  Globe,
  Bell,
  Star,
  Layers,
  Droplets,
  HelpCircle,
  Loader2,
  X,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { BrandLogo } from '../common/BrandLogo';
import { BD_DISTRICTS } from '../../data/districts';
import { CROPS } from '../../data/crops';
import type { FarmerPriorityId } from '../../types';
import {
  FarmField,
  FarmerProfileData,
  loadFarmerProfile,
  saveFarmerProfile,
  saveFarmField,
  deleteFarmField,
  uploadAvatar,
  calculateProfileCompletion,
  COMMUNICATION_METHODS,
  DEFAULT_INITIAL_FIELD,
} from '../../lib/farmerProfileService';
import {
  PAST_DAMAGE_OPTIONS,
  LAND_ELEVATION_OPTIONS,
  SOIL_TYPE_OPTIONS,
  IRRIGATION_OPTIONS,
} from '../../data/farmerProfile';
import { PRIORITY_META, PRIORITY_INFLUENCE } from '../../lib/cropSuitability';
import {
  PersonalInfoSection,
  FarmFieldSection,
  CropHistorySection,
  FarmingPrioritiesSection,
  PastHazardsSection,
} from './sections';

export const FarmerProfilePage: React.FC = () => {
  const { user, isGuest, displayName, avatarUrl: authAvatarUrl, provider } = useAuth();
  const { lang, setLang } = useLang();
  const isBn = lang === 'bn';

  // Component State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FarmerProfileData | null>(null);
  const [fields, setFields] = useState<FarmField[]>([]);
  const [activeTab, setActiveTab] = useState<'info' | 'fields' | 'preferences' | 'history'>('info');

  // Toasts and Dialogs
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<FarmField | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Profile on mount
  useEffect(() => {
    let isMounted = true;
    async function fetchProfile() {
      setLoading(true);
      try {
        const { profile: loadedProfile, fields: loadedFields } = await loadFarmerProfile(user?.id);
        if (isMounted) {
          // If profile lacks avatar but Google auth has one, use it
          if (!loadedProfile.avatarUrl && authAvatarUrl) {
            loadedProfile.avatarUrl = authAvatarUrl;
          }
          if (displayName && !loadedProfile.fullName) {
            loadedProfile.fullName = displayName;
          }
          setProfile(loadedProfile);
          setFields(loadedFields);
        }
      } catch (err: any) {
        if (isMounted) setErrorMessage(err?.message || 'Failed to load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user?.id, authAvatarUrl, displayName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Avatar Upload Handler
  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setErrorMessage(null);
    try {
      const res = await uploadAvatar(file, user?.id || 'guest_user');
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.url) {
        setProfile({ ...profile, avatarUrl: res.url });
        await saveFarmerProfile({ avatarUrl: res.url }, user?.id);
        showToast(isBn ? 'প্রোফাইল ছবি হালনাগাদ হয়েছে!' : 'Avatar updated successfully!');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Profile Save Handler
  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!profile) return;

    setSaving(true);
    setErrorMessage(null);
    try {
      const res = await saveFarmerProfile(profile, user?.id);
      if (res.success) {
        showToast(isBn ? 'প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!' : 'Profile saved successfully!');
      } else {
        setErrorMessage(res.error || 'Failed to save');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Priority Toggle Handler
  const handleTogglePriority = (priorityId: FarmerPriorityId) => {
    if (!profile) return;
    const exists = profile.priorities.includes(priorityId);
    let nextPriorities: FarmerPriorityId[];

    if (exists) {
      // Keep at least one priority
      if (profile.priorities.length === 1) return;
      nextPriorities = profile.priorities.filter((p) => p !== priorityId);
    } else {
      nextPriorities = [...profile.priorities, priorityId];
    }

    const nextPrimary = nextPriorities.includes(profile.primaryPriority)
      ? profile.primaryPriority
      : nextPriorities[0];

    setProfile({
      ...profile,
      priorities: nextPriorities,
      primaryPriority: nextPrimary,
    });
  };

  // Field Management Handlers
  const handleOpenAddField = () => {
    const newField: FarmField = {
      id: `field_${Date.now()}`,
      name: `${isBn ? 'নতুন জমি' : 'New Field Plot'} #${fields.length + 1}`,
      division: 'Rangpur',
      district: 'dinajpur',
      upazila: 'Kaharole',
      village: '',
      latitude: 25.6217,
      longitude: 88.6355,
      area: 1.0,
      unit: 'bigha',
      elevation: 'medium_high',
      soilType: 'loam',
      irrigation: 'deep_tubewell',
      waterSource: 'groundwater',
      currentCrop: 'aman',
      previousCrop: 'jute',
      plannedNextCrop: 'mustard',
      growingSeason: 'rabi',
      isPrimary: fields.length === 0,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingField(newField);
    setFieldModalOpen(true);
  };

  const handleEditField = (f: FarmField) => {
    setEditingField({ ...f });
    setFieldModalOpen(true);
  };

  const handleSaveFieldModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingField) return;

    // Auto-update coordinates based on district if unchanged
    const districtAdmin = BD_DISTRICTS.find((d) => d.id === editingField.district);
    if (districtAdmin && editingField.latitude === 0) {
      editingField.latitude = districtAdmin.lat;
      editingField.longitude = districtAdmin.lng;
      editingField.division = districtAdmin.division;
    }

    const res = await saveFarmField(editingField, user?.id);
    if (!res.error) {
      const updatedList = fields.some((f) => f.id === res.field.id)
        ? fields.map((f) => (f.id === res.field.id ? res.field : f))
        : [...fields, res.field];

      if (res.field.isPrimary) {
        setFields(updatedList.map((f) => ({ ...f, isPrimary: f.id === res.field.id })));
      } else {
        setFields(updatedList);
      }
      setFieldModalOpen(false);
      setEditingField(null);
      showToast(isBn ? 'জমির তথ্য সংরক্ষিত হয়েছে!' : 'Field saved successfully!');
    } else {
      setErrorMessage(res.error);
    }
  };

  const handleSetPrimaryField = async (fieldId: string) => {
    const target = fields.find((f) => f.id === fieldId);
    if (!target) return;

    const updated = { ...target, isPrimary: true };
    await saveFarmField(updated, user?.id);

    setFields(fields.map((f) => ({ ...f, isPrimary: f.id === fieldId })));
    showToast(isBn ? 'প্রধান সক্রিয় জমি নির্বাচিত হয়েছে!' : 'Primary field updated!');
  };

  const handleDeleteFieldConfirmed = async () => {
    if (!deleteConfirmId) return;
    const res = await deleteFarmField(deleteConfirmId, user?.id);
    if (res.success) {
      const remaining = fields.filter((f) => f.id !== deleteConfirmId);
      if (remaining.length > 0 && !remaining.some((f) => f.isPrimary)) {
        remaining[0].isPrimary = true;
      }
      setFields(remaining);
      setDeleteConfirmId(null);
      showToast(isBn ? 'জমি সফলভাবে মুছে ফেলা হয়েছে।' : 'Field removed.');
    } else {
      setErrorMessage(res.error || 'Failed to delete');
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-[#050B14] text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#00E5FF] mb-3" />
        <span className="font-mono text-xs text-slate-400">
          {isBn ? 'কৃষক প্রোফাইল লোড হচ্ছে...' : 'Loading Farmer Profile...'}
        </span>
      </div>
    );
  }

  const completionPercent = calculateProfileCompletion(profile, fields);
  const emailConfirmed = Boolean(user?.email_confirmed_at || provider === 'google');

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col font-editorial selection:bg-[#B8FF3D]/30 selection:text-[#B8FF3D]">
      
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#050B14]/90 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="#/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span className="hidden sm:inline">{isBn ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard'}</span>
              <span className="sm:hidden">{isBn ? 'ড্যাশবোর্ড' : 'Back'}</span>
            </a>
            <BrandLogo />
          </div>

          <div className="flex items-center gap-3">
            {/* Completion Pill */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-mono">
              <span className="text-slate-400">{isBn ? 'প্রোফাইল পূর্ণতা:' : 'Profile:'}</span>
              <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#B8FF3D] rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <span className="font-bold text-[#B8FF3D]">{completionPercent}%</span>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => {
                const next = isBn ? 'en' : 'bn';
                setLang(next);
                setProfile({ ...profile, preferredLanguage: next });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>{isBn ? 'English' : 'বাংলা'}</span>
            </button>

            {/* Save Button */}
            <button
              onClick={() => handleSaveProfile()}
              disabled={saving}
              className="px-4 py-1.5 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black font-mono font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-[#B8FF3D]/20 cursor-pointer disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>{isBn ? 'সংরক্ষণ' : 'Save'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 bg-[#0B1626] border border-[#B8FF3D]/40 text-[#B8FF3D] px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-mono animate-fadeIn">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-4 w-full">
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-8">
        
        {/* Profile Hero Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#00E5FF]/5 via-[#B8FF3D]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            {/* Avatar & Farmer Details */}
            <div className="flex items-center gap-5">
              <div className="relative group">
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.fullName}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-[#B8FF3D]/40 shadow-xl"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-[#00E5FF]/20 to-[#B8FF3D]/20 border-2 border-[#B8FF3D]/40 flex items-center justify-center text-3xl font-bold font-mono text-[#B8FF3D] shadow-xl">
                    {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'F'}
                  </div>
                )}

                {/* Upload Action Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 rounded-3xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-mono text-white transition-opacity cursor-pointer border border-[#00E5FF]/40"
                  title="Upload profile photo"
                >
                  {uploadingAvatar ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[#00E5FF]" />
                  ) : (
                    <>
                      <Camera className="w-5 h-5 text-[#B8FF3D] mb-1" />
                      <span>{isBn ? 'ছবি পরিবর্তন' : 'Change'}</span>
                    </>
                  )}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
                    {profile.fullName || (isBn ? 'কৃষক প্রোফাইল' : 'Farmer Profile')}
                  </h1>
                </div>

                <div className="mt-1 flex items-center gap-3 text-xs font-mono text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#00E5FF]" />
                    <span>{profile.email || user?.email || (isGuest ? 'Guest Access' : '')}</span>
                  </span>
                  {profile.phone && (
                    <>
                      <span>·</span>
                      <span className="flex items-center gap-1 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-[#B8FF3D]" />
                        <span>{profile.phone}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Badges */}
                <div className="mt-3 flex items-center gap-2 flex-wrap text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[#00E5FF] uppercase">
                    {provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Email Auth' : 'Guest Mode'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-300">
                    {fields.length} {isBn ? 'টি জমি যুক্ত' : fields.length === 1 ? 'Field Registered' : 'Fields Registered'}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-purple-300">
                    {isBn ? 'সদস্য:' : 'Joined:'} {new Date(profile.createdAt).getFullYear()}
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile Completion progress */}
            <div className="w-full sm:w-auto p-4 rounded-2xl bg-[#050B14] border border-white/5 text-xs font-mono space-y-2">
              <div className="flex items-center justify-between gap-4">
                <span className="text-slate-400">{isBn ? 'প্রোফাইল পূর্ণতা' : 'Completeness'}</span>
                <span className="font-bold text-[#B8FF3D]">{completionPercent}%</span>
              </div>
              <div className="w-full sm:w-44 h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#00E5FF] to-[#B8FF3D] rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
              <p className="text-[10px] text-slate-400">
                {completionPercent === 100
                  ? isBn ? 'আপনার প্রোফাইল সম্পূর্ণ!' : 'Profile fully completed!'
                  : isBn ? 'সঠিক সুপারিশের জন্য বাকি তথ্য পূরণ করুন।' : 'Complete fields for optimal NASA match.'}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/10 pb-1 text-xs font-mono overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'info'
                ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-bold shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <User className="w-4 h-4" />
            <span>{isBn ? '১. ব্যক্তিগত তথ্য' : '1. Personal Info'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('fields')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'fields'
                ? 'bg-[#B8FF3D]/15 border-[#B8FF3D] text-[#B8FF3D] font-bold shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>{isBn ? `২. খামার ও জমি (${fields.length})` : `2. Farm Fields (${fields.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'preferences'
                ? 'bg-purple-500/15 border-purple-400 text-purple-300 font-bold shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className="w-4 h-4" />
            <span>{isBn ? '৩. কৃষি অগ্রাধিকার' : '3. Farming Priorities'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-500/15 border-amber-400 text-amber-300 font-bold shadow-sm'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{isBn ? '৪. দুর্যোগ ও অতীত ক্ষতি' : '4. Past Hazards'}</span>
          </button>
        </div>

        {/* TAB 1: PERSONAL INFORMATION */}
        {activeTab === 'info' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl space-y-6">
              <PersonalInfoSection
                fullName={profile.fullName}
                onFullNameChange={(val) => setProfile({ ...profile, fullName: val })}
                email={profile.email || user?.email || ''}
                phone={profile.phone}
                onPhoneChange={(val) => setProfile({ ...profile, phone: val })}
                communicationMethod={profile.communicationMethod}
                onCommunicationMethodChange={(val) => setProfile({ ...profile, communicationMethod: val })}
                avatarUrl={profile.avatarUrl}
                onAvatarSelect={(file) => {
                  const syntheticEvent = { target: { files: [file] } } as any;
                  handleAvatarSelect(syntheticEvent);
                }}
                uploadingAvatar={uploadingAvatar}
                isBn={isBn}
                showAvatarUpload={false}
              />

              {/* Save Button */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-[#B8FF3D]/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isBn ? 'ব্যক্তিগত তথ্য সংরক্ষণ করুন' : 'Save Personal Details'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: MULTI-FIELD FARM MANAGEMENT */}
        {activeTab === 'fields' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl">
              <div>
                <h2 className="font-display text-lg font-bold text-white">
                  {isBn ? 'খামার ও চাষের জমির তালিকা' : 'Registered Agricultural Fields'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isBn
                    ? 'আপনার একাধিক জমি যুক্ত করুন। যে জমিটি সক্রিয় রাখবেন, ড্যাশবোর্ডে সেই জমির নাসা স্যাটেলাইট উপাত্ত প্রদর্শিত হবে।'
                    : 'Manage multiple plots. The active field powers your dashboard field data and 3-season crop planner.'}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddField}
                className="px-4 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-black font-mono font-bold text-xs flex items-center gap-2 transition-all shadow-md shadow-[#00E5FF]/20 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'নতুন জমি যুক্ত করুন' : 'Add New Field'}</span>
              </button>
            </div>

            {/* Field Cards Grid */}
            <div className="grid md:grid-cols-2 gap-5">
              {fields.map((field) => {
                const districtObj = BD_DISTRICTS.find((d) => d.id === field.district);
                const districtName = districtObj ? (isBn ? districtObj.nameBn : districtObj.nameEn) : field.district;

                return (
                  <div
                    key={field.id}
                    className={`p-6 rounded-3xl border transition-all relative flex flex-col justify-between ${
                      field.isPrimary
                        ? 'bg-[#0B1626] border-[#B8FF3D]/50 shadow-xl shadow-[#B8FF3D]/5 ring-1 ring-[#B8FF3D]/30'
                        : 'bg-[#0B1626]/80 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-display font-bold text-base text-white">
                            {field.name}
                          </span>
                          {field.isPrimary && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30">
                              ★ {isBn ? 'সক্রিয় জমি' : 'Active Field'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditField(field)}
                            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
                            title="Edit Field"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {fields.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(field.id)}
                              className="w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                              title="Delete Field"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Location & Coordinates */}
                      <div className="p-3 rounded-2xl bg-[#050B14] border border-white/5 space-y-1.5 text-xs font-mono text-slate-300 mb-4">
                        <div className="flex items-center gap-1.5 text-white">
                          <MapPin className="w-3.5 h-3.5 text-[#00E5FF]" />
                          <span>
                            {field.village ? `${field.village}, ` : ''}
                            {field.upazila ? `${field.upazila}, ` : ''}
                            <strong className="text-[#00E5FF]">{districtName}</strong>
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center justify-between">
                          <span>
                            GPS: {field.latitude.toFixed(4)}° N, {field.longitude.toFixed(4)}° E
                          </span>
                          <span className="text-[#B8FF3D] font-bold">
                            {field.area} {field.unit}
                          </span>
                        </div>
                      </div>

                      {/* Agronomy Tags */}
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-4">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-slate-400 block mb-0.5">
                            {isBn ? 'বর্তমান ফসল:' : 'Current Crop:'}
                          </span>
                          <span className="text-white font-bold capitalize">
                            {CROPS.find((c) => c.id === field.currentCrop)?.[isBn ? 'nameBn' : 'nameEn'] || field.currentCrop}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-slate-400 block mb-0.5">
                            {isBn ? 'মাটির ধরন:' : 'Soil Type:'}
                          </span>
                          <span className="text-white capitalize">
                            {SOIL_TYPE_OPTIONS.find((s) => s.id === field.soilType)?.[isBn ? 'bn' : 'en'] || field.soilType}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-slate-400 block mb-0.5">
                            {isBn ? 'সেচ ব্যবস্থা:' : 'Irrigation:'}
                          </span>
                          <span className="text-slate-200">
                            {IRRIGATION_OPTIONS.find((i) => i.id === field.irrigation)?.[isBn ? 'bn' : 'en'] || field.irrigation}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/5">
                          <span className="text-[10px] text-slate-400 block mb-0.5">
                            {isBn ? 'পরবর্তী ফসল:' : 'Planned Next:'}
                          </span>
                          <span className="text-[#00E5FF] font-bold capitalize">
                            {CROPS.find((c) => c.id === field.plannedNextCrop)?.[isBn ? 'nameBn' : 'nameEn'] || field.plannedNextCrop}
                          </span>
                        </div>
                      </div>

                      {field.notes && (
                        <p className="text-xs text-slate-400 italic mb-4 line-clamp-2">
                          "{field.notes}"
                        </p>
                      )}
                    </div>

                    {/* Active toggle button */}
                    {!field.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryField(field.id)}
                        className="w-full py-2 rounded-xl bg-white/5 hover:bg-[#B8FF3D]/15 border border-white/10 hover:border-[#B8FF3D]/40 text-xs font-mono text-slate-300 hover:text-[#B8FF3D] transition-colors cursor-pointer mt-2"
                      >
                        {isBn ? 'এই জমিটিকে সক্রিয় করুন' : 'Make Active Field'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FARMING PRIORITIES & PREFERENCES */}
        {activeTab === 'preferences' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl space-y-6">
              <FarmingPrioritiesSection
                selectedPriorities={profile.priorities}
                onTogglePriority={handleTogglePriority}
                primaryPriority={profile.primaryPriority}
                onSetPrimaryPriority={(pId) => setProfile({ ...profile, primaryPriority: pId })}
                isBn={isBn}
                maxSelectable={7}
              />

              {/* Save Button */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-[#B8FF3D]/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isBn ? 'অগ্রাধিকার সংরক্ষণ করুন' : 'Save Priorities'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 4: PAST HAZARDS & HISTORICAL DAMAGE */}
        {activeTab === 'history' && (
          <form onSubmit={handleSaveProfile} className="space-y-6 animate-fadeIn">
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B1626] border border-white/10 shadow-xl space-y-6">
              <PastHazardsSection
                pastDamages={profile.pastDamages}
                onToggleDamage={(hazardId) => {
                  let next: string[];
                  if (hazardId === 'none') {
                    next = profile.pastDamages.includes('none') ? [] : ['none'];
                  } else {
                    const withoutNone = profile.pastDamages.filter((id) => id !== 'none');
                    next = withoutNone.includes(hazardId)
                      ? withoutNone.filter((id) => id !== hazardId)
                      : [...withoutNone, hazardId];
                    if (next.length === 0) next = ['none'];
                  }
                  setProfile({ ...profile, pastDamages: next });
                }}
                pastDamageNotes={profile.pastDamageNotes}
                onNotesChange={(notes) => setProfile({ ...profile, pastDamageNotes: notes })}
                isBn={isBn}
              />

              {/* Save Button */}
              <div className="pt-4 border-t border-white/10 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black text-xs font-mono font-bold flex items-center gap-2 transition-all shadow-md shadow-[#B8FF3D]/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{isBn ? 'দুর্যোগ বিবরণ সংরক্ষণ করুন' : 'Save Past Hazard Details'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

      </main>

      {/* 2. FIELD ADD / EDIT MODAL */}
      {fieldModalOpen && editingField && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-4 sm:p-6 flex min-h-full items-center justify-center animate-fadeIn font-editorial">
          <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-[#0B1626] border border-white/15 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 bg-[#07101D] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-[#00E5FF]" />
                <h3 className="font-display font-bold text-lg text-white">
                  {editingField.id.startsWith('field_') && !fields.some((f) => f.id === editingField.id)
                    ? isBn ? 'নতুন জমি যুক্ত করুন' : 'Register New Field'
                    : isBn ? 'জমির তথ্য সম্পাদনা' : 'Edit Field Specifications'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setFieldModalOpen(false);
                  setEditingField(null);
                }}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveFieldModal} className="flex-1 overflow-y-auto p-6 space-y-6">
              <FarmFieldSection
                field={editingField}
                onChange={(updated) => setEditingField({ ...editingField, ...updated })}
                isBn={isBn}
                isOnboarding={false}
              />

              <CropHistorySection
                currentCrop={editingField.currentCrop}
                onCurrentCropChange={(val) => setEditingField({ ...editingField, currentCrop: val })}
                previousCrop={editingField.previousCrop}
                onPreviousCropChange={(val) => setEditingField({ ...editingField, previousCrop: val })}
                plannedNextCrop={editingField.plannedNextCrop}
                onPlannedNextCropChange={(val) => setEditingField({ ...editingField, plannedNextCrop: val })}
                isBn={isBn}
                showPlannedNext={true}
              />

              {/* Field Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5 uppercase tracking-wider">
                  {isBn ? 'জমি সংক্রান্ত অতিরিক্ত মন্তব্য (ঐচ্ছিক)' : 'Field Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={editingField.notes}
                  onChange={(e) => setEditingField({ ...editingField, notes: e.target.value })}
                  placeholder={isBn ? 'যেমন: বৃষ্টির পানি জমে না, দোআঁশ মাটি...' : 'e.g. Well-drained plot, good DTW access...'}
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                />
              </div>

              {/* Modal Footer Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFieldModalOpen(false);
                    setEditingField(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00E5FF] hover:bg-[#00cce6] text-black text-xs font-mono font-bold flex items-center gap-1.5 shadow-md shadow-[#00E5FF]/20"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isBn ? 'জমি সংরক্ষণ করুন' : 'Save Field'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. DELETE FIELD CONFIRMATION DIALOG */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center animate-fadeIn font-editorial">
          <div className="bg-[#0B1626] border border-red-500/30 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 mx-auto flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-display font-bold text-lg text-white">
              {isBn ? 'জমি মুছে ফেলতে চান?' : 'Remove Field?'}
            </h4>
            <p className="text-xs text-slate-400">
              {isBn
                ? 'এই জমির সকল তথ্য এবং সংরক্ষিত ইতিহাস স্থায়ীভাবে মুছে যাবে।'
                : 'This action will permanently delete this field and its historical records.'}
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleDeleteFieldConfirmed}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-mono font-bold shadow-md shadow-red-500/20"
              >
                {isBn ? 'হ্যাঁ, মুছে ফেলুন' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
