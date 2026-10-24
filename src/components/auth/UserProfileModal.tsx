import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Mail,
  Shield,
  Calendar,
  LogOut,
  CheckCircle2,
  MapPin,
  Sprout,
  AlertTriangle,
  Layers,
  Droplets,
  Save,
  Phone,
  Home,
  Target,
  FileText,
  Loader2,
  Send,
} from 'lucide-react';
import { sendTestAlert } from '../../lib/testAlertClient';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { BD_DISTRICTS } from '../../data/districts';
import { CROPS } from '../../data/crops';
import { CROP_CATEGORIES } from '../../data/cropCategories';
import {
  FarmerProfile,
  getFarmerProfile,
  saveFarmerProfile,
  PAST_DAMAGE_OPTIONS,
  LAND_ELEVATION_OPTIONS,
  SOIL_TYPE_OPTIONS,
  IRRIGATION_OPTIONS,
  FARMING_GOALS,
} from '../../data/farmerProfile';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, displayName, avatarUrl, provider, isGuest, signOut } = useAuth();
  const { lang } = useLang();
  const isBn = lang === 'bn';

  const [activeTab, setActiveTab] = useState<'profile' | 'history' | 'account'>('profile');
  const [profile, setProfile] = useState<FarmerProfile>(() => getFarmerProfile(user?.id));
  const [savedToast, setSavedToast] = useState(false);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSendTestAlert = async () => {
    setSendingTestAlert(true);
    setTestAlertFeedback(null);
    try {
      const res = await sendTestAlert(isBn, user?.email);
      setTestAlertFeedback({ ok: res.ok, message: res.message });
    } finally {
      setSendingTestAlert(false);
    }
  };

  // Sync profile when opened or user changes
  useEffect(() => {
    if (isOpen) {
      const current = getFarmerProfile(user?.id);
      if (displayName && !current.fullName) {
        current.fullName = displayName;
      }
      setProfile(current);

      if (user?.id && !isGuest) {
        (async () => {
          try {
            const { data, error } = await supabase
              .from('profiles')
              .select('email_alerts, sms_alerts, phone, full_name')
              .eq('id', user.id)
              .maybeSingle();

            if (!error && data) {
              setProfile((prev) => ({
                ...prev,
                emailAlerts: data.email_alerts ?? prev.emailAlerts,
                smsAlerts: data.sms_alerts ?? prev.smsAlerts,
                phone: data.phone || prev.phone,
                fullName: data.full_name || prev.fullName,
              }));
            }
          } catch (err) {
            console.error('Error syncing profile from Supabase:', err);
          }
        })();
      }
    }
  }, [isOpen, user?.id, displayName, isGuest]);

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
    window.location.hash = '';
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    saveFarmerProfile(profile, user?.id);

    if (user?.id && !isGuest) {
      const { error: sbErr } = await supabase
        .from('profiles')
        .update({
          full_name: profile.fullName || null,
          phone: profile.phone || null,
          email_alerts: Boolean(profile.emailAlerts),
          sms_alerts: Boolean(profile.smsAlerts),
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (sbErr) {
        console.error('Failed to update profile alerts in Supabase:', sbErr.message);
      }
    }

    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const toggleCrop = (cropId: string) => {
    setProfile((prev) => {
      const exists = prev.previousCrops.includes(cropId);
      const nextCrops = exists
        ? prev.previousCrops.filter((id) => id !== cropId)
        : [...prev.previousCrops, cropId];
      return { ...prev, previousCrops: nextCrops };
    });
  };

  const toggleDamage = (damageId: string) => {
    setProfile((prev) => {
      if (damageId === 'none') {
        const hasNone = prev.pastDamages.includes('none');
        return { ...prev, pastDamages: hasNone ? [] : ['none'] };
      }
      const filtered = prev.pastDamages.filter((id) => id !== 'none');
      const exists = filtered.includes(damageId);
      const nextDamages = exists
        ? filtered.filter((id) => id !== damageId)
        : [...filtered, damageId];
      return { ...prev, pastDamages: nextDamages.length === 0 ? ['none'] : nextDamages };
    });
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(isBn ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const emailConfirmed = Boolean(user?.email_confirmed_at || provider === 'google');

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex min-h-full items-center justify-center animate-fadeIn font-editorial">
      <div className="relative w-full max-w-2xl my-auto rounded-3xl bg-[#0B1626] border border-white/15 shadow-2xl text-white overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Sticky Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#07101D] flex-shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.fullName || displayName}
                className="w-10 h-10 rounded-xl object-cover border border-[#B8FF3D]/50 shadow-sm flex-shrink-0"
                loading="lazy"
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00E5FF]/20 to-[#B8FF3D]/20 border border-[#B8FF3D]/40 flex items-center justify-center text-sm font-bold font-mono text-[#B8FF3D] flex-shrink-0">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base sm:text-lg text-white truncate">
                  {profile.fullName || displayName || (isBn ? 'কৃষক প্রোফাইল' : 'Farmer Profile')}
                </h3>
                {emailConfirmed && !isGuest && (
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/20">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>{isBn ? 'ইমেইল নিশ্চিত' : 'Email Verified'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 truncate">
                {user?.email || (isGuest ? (isBn ? 'গেস্ট মোড' : 'Guest Mode') : '')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 bg-[#050B14]/70 px-4 pt-2 gap-2 flex-shrink-0 text-xs font-mono overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#B8FF3D] text-[#B8FF3D]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>{isBn ? '১. কৃষক ও খামার' : '1. Farm & Location'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'history'
                ? 'border-[#00E5FF] text-[#00E5FF]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sprout className="w-3.5 h-3.5" />
            <span>{isBn ? '২. অতীত ফসল ও দুর্যোগ' : '2. Past Crops & Loss'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`pb-2.5 px-3 border-b-2 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'account'
                ? 'border-purple-400 text-purple-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isBn ? '৩. অ্যাকাউন্ট ও সেটিংস' : '3. Account & Sync'}</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {/* TAB 1: FARMER & LAND PROFILE */}
          {activeTab === 'profile' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Farmer Name */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'কৃষকের পূর্ণ নাম' : 'Farmer Full Name'} *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                      placeholder={isBn ? 'নাম লিখুন' : 'Enter full name'}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none transition-colors"
                      required
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'মোবাইল নম্বর' : 'Phone Number'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="017XX-XXXXXX"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Location: District, Upazila, Village */}
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#00E5FF] font-bold">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isBn ? 'খামারের ভৌগোলিক অবস্থান' : 'Farm Geographic Location'}</span>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  {/* District Dropdown */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'জেলা' : 'District'} *
                    </label>
                    <select
                      value={profile.districtId}
                      onChange={(e) => setProfile({ ...profile, districtId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none cursor-pointer"
                    >
                      {BD_DISTRICTS.map((d) => (
                        <option key={d.id} value={d.id} className="bg-[#0B1626] text-white">
                          {isBn ? d.nameBn : d.nameEn} ({isBn ? d.divisionBn : d.division})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upazila */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'উপজেলা' : 'Upazila'}
                    </label>
                    <input
                      type="text"
                      value={profile.upazila}
                      onChange={(e) => setProfile({ ...profile, upazila: e.target.value })}
                      placeholder={isBn ? 'যেমন: কাহারোল / বীরগঞ্জ' : 'e.g. Sadar'}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>

                  {/* Village / Area */}
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">
                      {isBn ? 'গ্রাম / মৌজা' : 'Village / Area'}
                    </label>
                    <input
                      type="text"
                      value={profile.village}
                      onChange={(e) => setProfile({ ...profile, village: e.target.value })}
                      placeholder={isBn ? 'গ্রামের নাম' : 'Village name'}
                      className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#00E5FF] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Land Specifications: Size, Elevation, Soil, Irrigation */}
              <div className="grid sm:grid-cols-2 gap-4">
                {/* Land Size & Unit */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'জমির পরিমাণ' : 'Land Size & Unit'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={profile.landSize}
                      onChange={(e) => setProfile({ ...profile, landSize: parseFloat(e.target.value) || 0 })}
                      className="w-2/3 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:border-[#B8FF3D] focus:outline-none"
                    />
                    <select
                      value={profile.landUnit}
                      onChange={(e) => setProfile({ ...profile, landUnit: e.target.value as any })}
                      className="w-1/3 px-2 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
                    >
                      <option value="bigha">{isBn ? 'বিঘা' : 'Bigha'}</option>
                      <option value="acre">{isBn ? 'একর' : 'Acre'}</option>
                      <option value="decimal">{isBn ? 'শতক' : 'Decimal'}</option>
                    </select>
                  </div>
                </div>

                {/* Land Elevation */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'জমির উচ্চতা ও প্লাবন ধরন' : 'Land Elevation / Inundation'}
                  </label>
                  <select
                    value={profile.landElevation}
                    onChange={(e) => setProfile({ ...profile, landElevation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
                  >
                    {LAND_ELEVATION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {isBn ? opt.bn : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Soil Type */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'মাটির ধরন' : 'Soil Classification'}
                  </label>
                  <select
                    value={profile.soilType}
                    onChange={(e) => setProfile({ ...profile, soilType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
                  >
                    {SOIL_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {isBn ? opt.bn : opt.en}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Irrigation Source */}
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1.5">
                    {isBn ? 'প্রধান সেচ ব্যবস্থা' : 'Primary Irrigation Source'}
                  </label>
                  <select
                    value={profile.irrigation}
                    onChange={(e) => setProfile({ ...profile, irrigation: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-[#0B1626] border border-white/15 text-white text-xs focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
                  >
                    {IRRIGATION_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {isBn ? opt.bn : opt.en}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAST CROPS & DISASTER LOSSES */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Previous Crops Cultivated */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sprout className="w-4 h-4 text-[#B8FF3D]" />
                  <label className="text-xs font-mono text-white font-bold">
                    {isBn ? 'অতীতে আপনি কি কি ফসল চাষ করেছেন?' : 'What crops have you cultivated earlier?'}
                  </label>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {isBn
                    ? 'আপনার পূর্ববর্তী ফসল নির্বাচন করুন। এটি পরবর্তী ৩-মৌসুমী আবর্তন তৈরিতে সাহায্য করবে:'
                    : 'Select previously cultivated crops. This helps AgriOrbit prevent soil nutrient exhaustion:'}
                </p>

                <div className="space-y-4">
                  {CROP_CATEGORIES.map((cat) => {
                    const catCrops = CROPS.filter((c) => c.category_id === cat.id);
                    if (catCrops.length === 0) return null;
                    return (
                      <div key={cat.id} className="p-3 rounded-xl bg-[#050B14] border border-white/5">
                        <div className="text-[11px] font-mono font-bold text-[#00E5FF] mb-2 uppercase tracking-wider">
                          {isBn ? cat.name_bn : cat.name_en}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {catCrops.map((crop) => {
                            const selected = profile.previousCrops.includes(crop.id);
                            return (
                              <button
                                type="button"
                                key={crop.id}
                                onClick={() => toggleCrop(crop.id)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer border ${
                                  selected
                                    ? 'bg-[#B8FF3D]/15 border-[#B8FF3D] text-[#B8FF3D] font-bold shadow-sm'
                                    : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                }`}
                              >
                                {selected ? '✓ ' : '+ '}
                                {isBn ? crop.name_bn : crop.name_en}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Past Disasters / Damages Experienced */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <label className="text-xs font-mono text-white font-bold">
                    {isBn
                      ? 'অতীতে আপনার জমিতে কোনো প্রাকৃতিক দুর্যোগ বা ক্ষতি হয়েছে কি?'
                      : 'Have you experienced any past crop losses or natural disasters?'}
                  </label>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {isBn
                    ? 'যেসব দুর্যোগ আপনার ফসল নষ্ট করেছে তা সিলেক্ট করুন (একাধিক নির্বাচনযোগ্য):'
                    : 'Select the environmental challenges your land has faced:'}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PAST_DAMAGE_OPTIONS.map((opt) => {
                    const selected = profile.pastDamages.includes(opt.id);
                    return (
                      <button
                        type="button"
                        key={opt.id}
                        onClick={() => toggleDamage(opt.id)}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-mono text-left transition-all cursor-pointer border ${
                          selected
                            ? opt.id === 'none'
                              ? 'bg-emerald-500/15 border-emerald-400 text-emerald-300 font-bold'
                              : 'bg-amber-500/15 border-amber-400 text-amber-200 font-bold'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] border ${
                          selected
                            ? opt.id === 'none' ? 'bg-emerald-400 text-black border-emerald-400' : 'bg-amber-400 text-black border-amber-400'
                            : 'border-white/30'
                        }`}>
                          {selected ? '✓' : ''}
                        </span>
                        <span className="truncate">{isBn ? opt.bn : opt.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Past Damage Notes */}
              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1.5">
                  {isBn ? 'অতিরিক্ত বিবরণ বা অতীতের অভিজ্ঞতা (ঐচ্ছিক)' : 'Past Experience Notes (Optional)'}
                </label>
                <textarea
                  rows={2}
                  value={profile.pastDamageNotes}
                  onChange={(e) => setProfile({ ...profile, pastDamageNotes: e.target.value })}
                  placeholder={
                    isBn
                      ? 'যেমন: গত বছর খরার কারণে ফলন কম হয়েছিল, বা বৃষ্টির অভাবে সেচ খরচ বেড়েছিল...'
                      : 'e.g. Drought lowered mustard yields last winter, or excessive monsoon delayed sowing...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs focus:border-[#00E5FF] focus:outline-none transition-colors"
                />
              </div>

              {/* Primary Farming Goal */}
              <div className="pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-[#00E5FF]" />
                  <label className="text-xs font-mono text-white font-bold">
                    {isBn ? 'চাষে আপনার প্রধান চাহিদা কী?' : 'Your Primary Farming Goal'}
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {FARMING_GOALS.map((goal) => {
                    const selected = profile.primaryGoal === goal.id;
                    return (
                      <button
                        type="button"
                        key={goal.id}
                        onClick={() => setProfile({ ...profile, primaryGoal: goal.id as any })}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-mono text-left transition-all cursor-pointer border ${
                          selected
                            ? 'bg-[#00E5FF]/15 border-[#00E5FF] text-[#00E5FF] font-bold shadow-sm'
                            : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                          selected ? 'bg-[#00E5FF] border-[#00E5FF]' : 'border-white/30'
                        }`}>
                          {selected && <span className="w-1.5 h-1.5 rounded-full bg-black" />}
                        </span>
                        <span className="truncate">{isBn ? goal.bn : goal.en}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ACCOUNT & SESSION */}
          {activeTab === 'account' && (
            <div className="space-y-4 animate-fadeIn">
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3 text-xs font-mono">
                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#00E5FF]" />
                    <span className="text-slate-400">{isBn ? 'অথেনটিকেশন প্রদানকারী' : 'Auth Provider'}:</span>
                  </div>
                  <span className="text-white font-bold capitalize">
                    {provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Email Auth' : 'Guest'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-300">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#B8FF3D]" />
                    <span className="text-slate-400">{isBn ? 'অ্যাকাউন্ট স্ট্যাটাস' : 'Account Status'}:</span>
                  </div>
                  <span className="text-[#B8FF3D] font-bold">
                    {isGuest
                      ? isBn ? 'গেস্ট এক্সেস' : 'Guest Access'
                      : emailConfirmed
                      ? isBn ? 'সক্রিয় ও নিশ্চিতকৃত' : 'Active & Confirmed'
                      : isBn ? 'যাচাই পেন্ডিং' : 'Pending Verification'}
                  </span>
                </div>

                {createdAt && (
                  <div className="flex items-center justify-between text-slate-300">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-purple-400" />
                      <span className="text-slate-400">{isBn ? 'সদস্য হয়েছেন' : 'Member Since'}:</span>
                    </div>
                    <span className="text-white font-bold">{createdAt}</span>
                  </div>
                )}
              </div>

              {/* Automated Alert Toggles */}
              <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3">
                <span className="text-xs font-mono font-bold text-white uppercase tracking-wider block">
                  {isBn ? 'স্বয়ংক্রিয় কৃষি সতর্কতা সেটিংস' : 'Field Alert Notifications'}
                </span>

                <div className="space-y-2">
                  <label className="flex items-start gap-3 p-3.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(profile.emailAlerts || profile.smsAlerts)}
                      onChange={(e) => {
                        const val = e.target.checked;
                        setProfile({ ...profile, emailAlerts: val, smsAlerts: val });
                      }}
                      className="mt-1 w-4 h-4 rounded text-[#B8FF3D] focus:ring-[#B8FF3D] border-white/20 bg-black/40 cursor-pointer accent-[#B8FF3D]"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white block">
                          {isBn ? 'ইমেইল সতর্কতা (এসএমএস শীঘ্রই আসছে)' : 'Email alerts (SMS coming soon)'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#B8FF3D]/10 text-[#B8FF3D] border border-[#B8FF3D]/20">
                          EMAIL
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400 block font-mono leading-relaxed">
                        {isBn
                          ? 'চরম আবহাওয়া বা খরায় সরাসরি আপনার নিবন্ধিত ইমেইলে সতর্কবার্তা পৌঁছাবে।'
                          : 'Extreme weather, drought, and rain warnings sent directly to your email.'}
                      </span>
                    </div>
                  </label>

                  {/* Test Alert Button for Logged-In Users */}
                  {!isGuest && user && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleSendTestAlert}
                        disabled={sendingTestAlert}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] hover:text-cyan-200 text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                      >
                        {sendingTestAlert ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{isBn ? 'আমাকে একটি পরীক্ষামূলক সতর্কতা পাঠান' : 'Send me a test alert'}</span>
                      </button>

                      {testAlertFeedback && (
                        <div
                          className={`mt-2 p-2.5 rounded-xl border text-xs font-mono ${testAlertFeedback.ok ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300" : "bg-amber-950/40 border-amber-500/40 text-amber-300"}`}
                        >
                          {testAlertFeedback.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data Safety & Explanatory Banner */}
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-400 flex items-start gap-2.5">
                <FileText className="w-4 h-4 text-[#B8FF3D] flex-shrink-0 mt-0.5" />
                <p>
                  {isBn
                    ? 'আপনার খামারের তথ্য, অতীত ফসল ও দুর্যোগের অভিজ্ঞতা আপনার ডিভাইসে ও সেশনে নিরাপদে সংরক্ষিত থাকে। এটি সরাসরি নাসা আর্থ অবজারভেশন ও মৃত্তিকা ডেটার সাথে যুক্ত হয়ে সর্বোত্তম ফসল সুপারিশে ব্যবহৃত হয়।'
                    : 'Your farm profile, crop history, and disaster experience are securely stored. AgriOrbit uses this context alongside NASA data to personalize recommendations for your exact land.'}
                </p>
              </div>

              {/* Sign out section */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-white block">
                    {isBn ? 'অ্যাকাউন্ট সেশন বন্ধ' : 'Session Management'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {isBn ? 'আপনার প্রোফাইল থেকে নিরাপদে প্রস্থান করুন' : 'Safely sign out from this device'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Sticky Form Save Footer */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between bg-[#0B1626]">
            <div className="flex items-center gap-2">
              {savedToast && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-[#B8FF3D] animate-fadeIn">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isBn ? 'প্রোফাইল সফলভাবে সংরক্ষিত!' : 'Profile saved successfully!'}</span>
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a
                href="#/profile"
                onClick={onClose}
                className="px-3 py-2 rounded-xl bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-xs font-mono text-[#00E5FF] transition-colors border border-[#00E5FF]/30 hidden sm:inline-flex items-center gap-1"
              >
                <span>{isBn ? 'সম্পূর্ণ পৃষ্ঠা ↗' : 'Full Page ↗'}</span>
              </a>

              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 transition-colors cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>

              <button
                type="submit"
                className="px-4 sm:px-5 py-2 rounded-xl bg-[#B8FF3D] hover:bg-[#a6ec2f] text-black text-xs font-mono font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#B8FF3D]/20 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isBn ? 'সংরক্ষণ' : 'Save'}</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
