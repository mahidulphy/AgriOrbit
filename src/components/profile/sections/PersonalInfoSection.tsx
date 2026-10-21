import React, { useRef } from 'react';
import { User, Mail, Phone, Bell, Camera, Loader2 } from 'lucide-react';
import { COMMUNICATION_METHODS } from '../../../lib/farmerProfileService';

export interface PersonalInfoSectionProps {
  fullName: string;
  onFullNameChange: (val: string) => void;
  email: string;
  phone: string;
  onPhoneChange: (val: string) => void;
  communicationMethod: 'in_app' | 'sms' | 'whatsapp' | 'voice';
  onCommunicationMethodChange: (val: 'in_app' | 'sms' | 'whatsapp' | 'voice') => void;
  avatarUrl?: string;
  onAvatarSelect?: (file: File) => void;
  uploadingAvatar?: boolean;
  errors?: { fullName?: string; phone?: string };
  isBn: boolean;
  showAvatarUpload?: boolean;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  fullName,
  onFullNameChange,
  email,
  phone,
  onPhoneChange,
  communicationMethod,
  onCommunicationMethodChange,
  avatarUrl,
  onAvatarSelect,
  uploadingAvatar,
  errors,
  isBn,
  showAvatarUpload = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarSelect) {
      onAvatarSelect(file);
    }
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-white/10 pb-4">
        <h2 className="font-display text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-[#00E5FF]" />
          <span>{isBn ? 'ব্যক্তিগত ও যোগাযোগ তথ্য' : 'Personal & Contact Information'}</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          {isBn
            ? 'আপনার সঠিক নাম এবং যোগাযোগের তথ্য দিন যাতে আবহাওয়া ও ফসল সতর্কতা সহজে পৌঁছাতে পারে।'
            : 'Enter your personal details to receive accurate localized satellite advisories.'}
        </p>
      </div>

      {showAvatarUpload && onAvatarSelect && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="relative group flex-shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Farmer'}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-[#B8FF3D]/40 shadow-lg"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#B8FF3D]/20 border-2 border-[#B8FF3D]/40 flex items-center justify-center text-2xl font-bold font-mono text-[#B8FF3D]">
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[10px] font-mono text-white transition-opacity cursor-pointer border border-[#00E5FF]/40"
              title={isBn ? 'ছবি পরিবর্তন' : 'Change avatar'}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" />
              ) : (
                <>
                  <Camera className="w-4 h-4 text-[#B8FF3D] mb-0.5" />
                  <span>{isBn ? 'ছবি' : 'Change'}</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <span className="text-sm font-semibold text-white block">
              {isBn ? 'প্রোফাইল ছবি' : 'Profile Photo'}
            </span>
            <span className="text-xs text-slate-400 block mt-0.5">
              {isBn ? 'ছবি পরিবর্তন করতে ট্যাপ করুন' : 'Click the avatar to upload a new photo'}
            </span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5 sm:gap-6">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'কৃষকের পূর্ণ নাম' : 'Full Name'} <span className="text-[#00E5FF]">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder={isBn ? 'যেমন: মোহাম্মদ শহিদুল ইসলাম' : 'e.g. Mohammad Shahidul Islam'}
              className={`w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-white/5 border text-white text-base focus:border-[#B8FF3D] focus:outline-none transition-colors ${
                errors?.fullName ? 'border-red-400 bg-red-500/5' : 'border-white/15'
              }`}
              required
            />
          </div>
          {errors?.fullName && (
            <p className="text-xs text-red-400 mt-1.5 font-mono">{errors.fullName}</p>
          )}
        </div>

        {/* Account Email (Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
              {isBn ? 'ইমেইল ঠিকানা' : 'Account Email'}
            </label>
            <span className="text-[10px] font-mono text-[#00E5FF] bg-[#00E5FF]/10 px-2 py-0.5 rounded border border-[#00E5FF]/20">
              {isBn ? 'সুরক্ষিত' : 'Locked'}
            </span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="email"
              value={email}
              readOnly
              disabled
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-slate-400 text-base cursor-not-allowed"
              placeholder="farmer@example.com"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {isBn ? 'গুগল বা অথ অ্যাকাউন্টের সাথে যুক্ত' : 'Linked to your Google / Auth account'}
          </p>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'মোবাইল নম্বর (ঐচ্ছিক)' : 'Contact Phone (Optional)'}
          </label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="017XX-XXXXXX"
              className={`w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-white/5 border text-white text-base focus:border-[#B8FF3D] focus:outline-none transition-colors ${
                errors?.phone ? 'border-red-400 bg-red-500/5' : 'border-white/15'
              }`}
            />
          </div>
          {errors?.phone ? (
            <p className="text-xs text-red-400 mt-1.5 font-mono">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-slate-500 mt-1 font-mono">
              {isBn ? 'জরুরি আবহাওয়া সতর্কতার জন্য' : 'Used for urgent weather broadcast alerts'}
            </p>
          )}
        </div>

        {/* Preferred Communication Method */}
        <div>
          <label className="block text-xs font-mono font-semibold text-slate-300 mb-2 uppercase tracking-wider">
            {isBn ? 'আবহাওয়া সতর্কতার মাধ্যম' : 'Preferred Alert Channel'}
          </label>
          <div className="relative">
            <Bell className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <select
              value={communicationMethod}
              onChange={(e) => onCommunicationMethodChange(e.target.value as any)}
              className="w-full min-h-[48px] pl-11 pr-4 py-3 rounded-xl bg-[#0B1626] border border-white/15 text-white text-base focus:border-[#B8FF3D] focus:outline-none cursor-pointer"
            >
              {COMMUNICATION_METHODS.map((method) => (
                <option key={method.id} value={method.id}>
                  {isBn ? method.bn : method.en}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-mono">
            {isBn ? 'কীভাবে কৃষি সতর্কতা পেতে চান' : 'How you prefer receiving farming updates'}
          </p>
        </div>
      </div>
    </div>
  );
};
