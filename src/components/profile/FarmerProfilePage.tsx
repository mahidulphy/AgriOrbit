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
          if (displayName && (!loadedProfile.fullName || loadedProfile.fullName === 'Mahidul Islam')) {
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
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#050B14]/90 backdrop-blur-xl">
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
                  {emailConfirmed && !isGuest && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/30">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{isBn ? 'যাচাইকৃত কৃষক' : 'Verified Farmer'}</span>
                    </span>
                  )}
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
              <div className="border-b border-white/10 pb-4">
                <h2 className="font-display text-lg font-bold text-white">
                  {isBn ? 'ব্যক্তিগত ও যোগাযোগ তথ্য' : 'Personal & Contact Information'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isBn
                    ? 'আপনার সঠিক নাম এবং যোগাযোগের তথ্য দিন যাতে আবহাওয়া সতর্কতা সহজে পৌঁছাতে পারে।'
                    : 'Manage your name, contact phone, and communication preferences.'}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    {isBn ? 'কৃষকের পূর্ণ নাম' : 'Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder={isBn ? 'যেমন: মোহাম্মদ শহিদুল ইসলাম' : 'Enter your name'}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Email Address (Strictly Read-Only with explanation) */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-mono text-slate-300">
                      {isBn ? 'ইমেইল ঠিকানা (যাচাইকৃত)' : 'Account Email'}
                    </label>
                    <span className="text-[10px] font-mono text-[#00E5FF]">
                      {isBn ? 'সুরক্ষিত' : 'Locked for Security'}
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      value={profile.email || user?.email || ''}
                      readOnly
                      disabled
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    {isBn ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Contact Phone Number (Optional)'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="017XX-XXXXXX"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                {/* Preferred Communication Method */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-2">
                    {isBn ? 'আবহাওয়া সতর্কতার মাধ্যম' : 'Preferred Alert Channel'}
                  </label>
                  <div className="relative">
                    <Bell className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <select
                      value={profile.communicationMethod}
                      onChange={(e) => setProfile({ ...profile, communicationMethod: e.target.value as any })}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#07101D] border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
                    >
                      {COMMUNICATION_METHODS.map((method) => (
                        <option key={method.id} value={method.id} className="bg-[#0B1626] text-white">
                          {isBn ? method.bn : method.en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

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
                    : 'Manage multiple plots. The active field powers your dashboard telemetry and 3-season crop planner.'}
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
              <div className="border-b border-white/10 pb-4">
                <h2 className="font-display text-lg font-bold text-white">
                  {isBn ? 'কৃষক অগ্রাধিকার ও সিদ্ধান্ত মডেল' : 'Farming Preferences & Priority Weights'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isBn
                    ? 'আপনার পছন্দের অগ্রাধিকার নির্বাচন করুন। নাসা উপাত্তের সাথে মিলিয়ে এগ্রিঅরবিট সুপারিশ ইঞ্জিন স্বয়ংক্রিয়ভাবে পয়েন্ট সমন্বয় করবে।'
                    : 'Select multiple priorities. The mathematical rule engine balances points based on water, soil health, cost, and climate resilience.'}
                </p>
              </div>

              {/* Priority Cards */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(Object.keys(PRIORITY_META) as FarmerPriorityId[]).map((pId) => {
                  const meta = PRIORITY_META[pId];
                  const influence = PRIORITY_INFLUENCE[pId];
                  const isSelected = profile.priorities.includes(pId);
                  const isPrimary = profile.primaryPriority === pId;

                  return (
                    <div
                      key={pId}
                      onClick={() => handleTogglePriority(pId)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isPrimary
                          ? 'bg-[#B8FF3D]/10 border-[#B8FF3D] shadow-lg shadow-[#B8FF3D]/5'
                          : isSelected
                          ? 'bg-[#00E5FF]/10 border-[#00E5FF]/60 text-white'
                          : 'bg-[#050B14] border-white/10 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-bold font-display ${isPrimary ? 'text-[#B8FF3D]' : isSelected ? 'text-[#00E5FF]' : 'text-slate-200'}`}>
                            {isBn ? meta.titleBn : meta.titleEn}
                          </span>
                          <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] border ${
                            isPrimary
                              ? 'bg-[#B8FF3D] text-black font-bold border-[#B8FF3D]'
                              : isSelected
                              ? 'bg-[#00E5FF] text-black font-bold border-[#00E5FF]'
                              : 'border-white/20'
                          }`}>
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>

                        <p className="text-xs text-slate-400 leading-relaxed mb-3">
                          {isBn ? influence.bn : influence.en}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-mono">
                          <span className={isPrimary ? 'text-[#B8FF3D] font-bold' : 'text-slate-400'}>
                            {isPrimary ? (isBn ? '★ প্রধান অগ্রাধিকার' : '★ Primary Focus') : (isBn ? 'সহায়ক অগ্রাধিকার' : 'Secondary')}
                          </span>
                          {!isPrimary && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProfile({ ...profile, primaryPriority: pId });
                              }}
                              className="text-xs text-[#00E5FF] hover:underline cursor-pointer"
                            >
                              {isBn ? 'প্রধান করুন' : 'Make Primary'}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

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
              <div className="border-b border-white/10 pb-4">
                <h2 className="font-display text-lg font-bold text-white">
                  {isBn ? 'অতীত দুর্যোগ ও ফসলের ক্ষতির অভিজ্ঞতা' : 'Historical Hazard Exposure & Past Crop Losses'}
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  {isBn
                    ? 'অতীতে আপনার এলাকায় যেসব প্রাকৃতিক দুর্যোগের শিকার হয়েছেন তা চিহ্নিত করুন। আমাদের ঝুঁকি অ্যালগরিদম এই অভিজ্ঞতা ব্যবহার করবে।'
                    : 'Select environmental hazards that previously damaged your yields so AgriOrbit factors vulnerability into rotation recommendations.'}
                </p>
              </div>

              {/* Hazard Options Grid */}
              <div className="grid sm:grid-cols-2 gap-3">
                {PAST_DAMAGE_OPTIONS.map((opt) => {
                  const selected = profile.pastDamages.includes(opt.id);
                  return (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => {
                        let next: string[];
                        if (opt.id === 'none') {
                          next = selected ? [] : ['none'];
                        } else {
                          const withoutNone = profile.pastDamages.filter((id) => id !== 'none');
                          next = withoutNone.includes(opt.id)
                            ? withoutNone.filter((id) => id !== opt.id)
                            : [...withoutNone, opt.id];
                          if (next.length === 0) next = ['none'];
                        }
                        setProfile({ ...profile, pastDamages: next });
                      }}
                      className={`flex items-center gap-3 p-3.5 rounded-2xl text-xs font-mono text-left transition-all cursor-pointer border ${
                        selected
                          ? opt.id === 'none'
                            ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-bold'
                            : 'bg-amber-500/15 border-amber-400 text-amber-200 font-bold'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                        selected
                          ? opt.id === 'none' ? 'bg-emerald-400 text-black border-emerald-400' : 'bg-amber-400 text-black border-amber-400'
                          : 'border-white/30'
                      }`}>
                        {selected ? '✓' : ''}
                      </span>
                      <span>{isBn ? opt.bn : opt.en}</span>
                    </button>
                  );
                })}
              </div>

              {/* Past Damage Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-2">
                  {isBn ? 'ক্ষতির বিস্তারিত বিবরণ বা স্মৃতিকথা (ঐচ্ছিক)' : 'Past Experience & Notes (Optional)'}
                </label>
                <textarea
                  rows={3}
                  value={profile.pastDamageNotes}
                  onChange={(e) => setProfile({ ...profile, pastDamageNotes: e.target.value })}
                  placeholder={
                    isBn
                      ? 'যেমন: গত বছর খরার কারণে বোরো মৌসুমে সেচ খরচ বেড়েছিল, অথবা আগাম বন্যায় আমনের বীজতলা নষ্ট হয়েছিল...'
                      : 'e.g. In 2024, unexpected drought reduced mustard yields by 25%...'
                  }
                  className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#00E5FF] focus:outline-none transition-colors"
                />
              </div>

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
            <form onSubmit={handleSaveFieldModal} className="flex-1 overflow-y-auto p-6 space-y-5">
              
              {/* Field Name & Primary Checkbox */}
              <div className="grid sm:grid-cols-3 gap-4 items-end">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'জমির নাম / প্লট নম্বর' : 'Field Name / Plot Label'} *
                  </label>
                  <input
                    type="text"
                    value={editingField.name}
                    onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                    placeholder={isBn ? 'যেমন: উত্তর বিলের ধানি জমি' : 'e.g. North Basin Plot 1'}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#00E5FF] focus:outline-none"
                    required
                  />
                </div>

                <div className="pb-1">
                  <label className="flex items-center gap-2 text-xs font-mono text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingField.isPrimary}
                      onChange={(e) => setEditingField({ ...editingField, isPrimary: e.target.checked })}
                      className="w-4 h-4 rounded bg-[#07101D] border-white/20 text-[#B8FF3D] focus:ring-0 cursor-pointer"
                    />
                    <span>{isBn ? 'প্রধান সক্রিয় জমি' : 'Set as Primary'}</span>
                  </label>
                </div>
              </div>

              {/* District, Upazila, Village */}
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3">
                <span className="text-xs font-mono text-[#00E5FF] font-bold block">
                  {isBn ? 'ভৌগোলিক অবস্থান (Location)' : 'Geographic Location'}
                </span>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'জেলা' : 'District'} *
                    </label>
                    <select
                      value={editingField.district}
                      onChange={(e) => {
                        const dAdmin = BD_DISTRICTS.find((d) => d.id === e.target.value);
                        setEditingField({
                          ...editingField,
                          district: e.target.value,
                          division: dAdmin ? dAdmin.division : editingField.division,
                          latitude: dAdmin ? dAdmin.lat : editingField.latitude,
                          longitude: dAdmin ? dAdmin.lng : editingField.longitude,
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none cursor-pointer"
                    >
                      {BD_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#0B1626] text-white">
                          {isBn ? d.nameBn : d.nameEn} ({isBn ? d.divisionBn : d.division})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'উপজেলা' : 'Upazila'}
                    </label>
                    <input
                      type="text"
                      value={editingField.upazila}
                      onChange={(e) => setEditingField({ ...editingField, upazila: e.target.value })}
                      placeholder={isBn ? 'যেমন: কাহারোল' : 'e.g. Kaharole'}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'গ্রাম / মৌজা' : 'Village / Area'}
                    </label>
                    <input
                      type="text"
                      value={editingField.village}
                      onChange={(e) => setEditingField({ ...editingField, village: e.target.value })}
                      placeholder={isBn ? 'গ্রামের নাম' : 'Village name'}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>
                </div>

                {/* Coordinates */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      {isBn ? 'অক্ষাংশ (Latitude)' : 'Latitude (°N)'}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingField.latitude}
                      onChange={(e) => setEditingField({ ...editingField, latitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400 mb-1">
                      {isBn ? 'দ্রাঘিমাংশ (Longitude)' : 'Longitude (°E)'}
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={editingField.longitude}
                      onChange={(e) => setEditingField({ ...editingField, longitude: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Land Specifications */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Area & Unit */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'জমির পরিমাপ' : 'Land Area'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={editingField.area}
                      onChange={(e) => setEditingField({ ...editingField, area: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs"
                    />
                    <select
                      value={editingField.unit}
                      onChange={(e) => setEditingField({ ...editingField, unit: e.target.value as any })}
                      className="w-1/3 px-2 py-2 rounded-xl bg-[#07101D] border border-white/15 text-white text-xs"
                    >
                      <option value="bigha">{isBn ? 'বিঘা' : 'Bigha'}</option>
                      <option value="acre">{isBn ? 'একর' : 'Acre'}</option>
                      <option value="decimal">{isBn ? 'শতক' : 'Decimal'}</option>
                      <option value="hectare">{isBn ? 'হেক্টর' : 'Hectare'}</option>
                    </select>
                  </div>
                </div>

                {/* Elevation */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'জমির উচ্চতা ও প্লাবন ধরন' : 'Elevation / Flood Regime'}
                  </label>
                  <select
                    value={editingField.elevation}
                    onChange={(e) => setEditingField({ ...editingField, elevation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#07101D] border border-white/15 text-white text-xs"
                  >
                    {LAND_ELEVATION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{isBn ? opt.bn : opt.en}</option>
                    ))}
                  </select>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'মাটির ধরন' : 'Soil Classification'}
                  </label>
                  <select
                    value={editingField.soilType}
                    onChange={(e) => setEditingField({ ...editingField, soilType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#07101D] border border-white/15 text-white text-xs"
                  >
                    {SOIL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{isBn ? opt.bn : opt.en}</option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Source */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'প্রধান সেচ সুবিধা' : 'Irrigation Infrastructure'}
                  </label>
                  <select
                    value={editingField.irrigation}
                    onChange={(e) => setEditingField({ ...editingField, irrigation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#07101D] border border-white/15 text-white text-xs"
                  >
                    {IRRIGATION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{isBn ? opt.bn : opt.en}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Crop History: Current, Previous, Planned Next */}
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3">
                <span className="text-xs font-mono text-[#B8FF3D] font-bold block">
                  {isBn ? 'ফসল আবর্তন তথ্য (Crop Rotation)' : 'Crop Sequence & Rotation'}
                </span>
                <div className="grid sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'বর্তমান ফসল' : 'Current Crop'}
                    </label>
                    <select
                      value={editingField.currentCrop}
                      onChange={(e) => setEditingField({ ...editingField, currentCrop: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs"
                    >
                      {CROPS.map((c) => (
                        <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'অতীত ফসল' : 'Previous Crop'}
                    </label>
                    <select
                      value={editingField.previousCrop}
                      onChange={(e) => setEditingField({ ...editingField, previousCrop: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs"
                    >
                      {CROPS.map((c) => (
                        <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.nameEn}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'পরবর্তী সম্ভাব্য ফসল' : 'Planned Next Crop'}
                    </label>
                    <select
                      value={editingField.plannedNextCrop}
                      onChange={(e) => setEditingField({ ...editingField, plannedNextCrop: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs"
                    >
                      {CROPS.map((c) => (
                        <option key={c.id} value={c.id}>{isBn ? c.nameBn : c.nameEn}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
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
