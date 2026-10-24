import React, { useRef, useState } from 'react';
import { User, Mail, Phone, Bell, Camera, Loader2, Send, AlertTriangle } from 'lucide-react';
import { COMMUNICATION_METHODS } from '../../../lib/farmerProfileService';
import { sendTestAlert } from '../../../lib/testAlertClient';

export interface PersonalInfoSectionProps {
  fullName: string;
  onFullNameChange: (val: string) => void;
  email: string;
  phone: string;
  onPhoneChange: (val: string) => void;
  communicationMethod: 'in_app' | 'sms' | 'whatsapp' | 'voice';
  onCommunicationMethodChange: (val: 'in_app' | 'sms' | 'whatsapp' | 'voice') => void;
  emailAlerts?: boolean;
  onEmailAlertsChange?: (val: boolean) => void;
  smsAlerts?: boolean;
  onSmsAlertsChange?: (val: boolean) => void;
  avatarUrl?: string;
  onAvatarSelect?: (file: File) => void;
  uploadingAvatar?: boolean;
  errors?: { fullName?: string; phone?: string };
  isBn: boolean;
  showAvatarUpload?: boolean;
  isLoggedIn?: boolean;
}

export const PersonalInfoSection: React.FC<PersonalInfoSectionProps> = ({
  fullName,
  onFullNameChange,
  email,
  phone,
  onPhoneChange,
  communicationMethod,
  onCommunicationMethodChange,
  emailAlerts = false,
  onEmailAlertsChange,
  smsAlerts = false,
  onSmsAlertsChange,
  avatarUrl,
  onAvatarSelect,
  uploadingAvatar,
  errors,
  isBn,
  showAvatarUpload = false,
  isLoggedIn = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sendingTestAlert, setSendingTestAlert] = useState(false);
  const [testAlertFeedback, setTestAlertFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSendTestAlert = async () => {
    setSendingTestAlert(true);
    setTestAlertFeedback(null);
    try {
      const res = await sendTestAlert(isBn, email);
      setTestAlertFeedback({ ok: res.ok, message: res.message });
    } finally {
      setSendingTestAlert(false);
    }
  };

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
            ? 'আপনার পরিচিতি ও যোগাযোগের তথ্য হালনাগাদ রাখুন।'
            : 'Keep your identity and direct communication channels up to date.'}
        </p>
      </div>

      {/* Avatar Upload (If enabled) */}
      {showAvatarUpload && (
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Avatar'}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#B8FF3D]/50 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-[#00E5FF]/10 border-2 border-[#00E5FF]/40 flex items-center justify-center text-xl font-bold font-mono text-[#00E5FF]">
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:opacity-50"
              title={isBn ? 'ছবি পরিবর্তন করুন' : 'Change avatar'}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Camera className="w-5 h-5 text-white" />
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

        {/* Automated Alert Toggles */}
        <div className="sm:col-span-2 pt-4 border-t border-white/10 space-y-3">
          <label className="block text-xs font-mono font-semibold text-slate-300 uppercase tracking-wider">
            {isBn ? 'স্বয়ংক্রিয় কৃষি সতর্কতা সেটিংস' : 'Automated Field Alert Settings'}
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            {/* Email Alerts Toggle */}
            <label className="flex items-start gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(emailAlerts)}
                onChange={(e) => onEmailAlertsChange && onEmailAlertsChange(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#B8FF3D] focus:ring-[#B8FF3D] border-white/20 bg-black/40 cursor-pointer accent-[#B8FF3D]"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-semibold text-white block">
                  {isBn ? 'ইমেইলে সতর্কতা পাঠান' : 'Email me alerts'}
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed font-mono">
                  {isBn
                    ? 'চরম আবহাওয়া বা খরা সতর্কতায় প্রতিদিন সর্বোচ্চ ১টি ইমেইল'
                    : 'Max 1 email per day for heat stress or drought warnings'}
                </span>
              </div>
            </label>

            {/* SMS Alerts Toggle */}
            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
              phone?.trim()
                ? 'bg-white/5 border-white/10 hover:border-white/20'
                : 'bg-white/[0.03] border-amber-500/30 hover:border-amber-500/40'
            }`}>
              <input
                type="checkbox"
                checked={Boolean(smsAlerts)}
                onChange={(e) => onSmsAlertsChange && onSmsAlertsChange(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-[#B8FF3D] focus:ring-[#B8FF3D] border-white/20 bg-black/40 cursor-pointer accent-[#B8FF3D]"
              />
              <div className="space-y-1 flex-1">
                <span className="text-sm font-semibold text-white block">
                  {isBn ? 'এসএমএস সতর্কতা পাঠান' : 'SMS alerts'}
                </span>
                <span className="text-[11px] text-slate-400 block leading-relaxed font-mono">
                  {isBn
                    ? 'চরম আবহাওয়া বা দুর্যোগের তাৎক্ষণিক মোবাইল এসএমএস সতর্কতা'
                    : 'Urgent mobile SMS alerts for extreme heat, drought, or storm warnings'}
                </span>
                {!phone?.trim() && (
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-amber-300 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    {isBn ? 'এসএমএস সতর্কতা চালু করতে একটি মোবাইল নম্বর যোগ করুন' : 'Add a phone number to enable SMS alerts'}
                  </span>
                )}
              </div>
            </label>
          </div>

          {/* Test Alert Button for Logged-In Users */}
          {isLoggedIn && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={sendingTestAlert}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/10 hover:bg-[#00E5FF]/20 text-[#00E5FF] hover:text-cyan-200 text-xs font-mono font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
              >
                {sendingTestAlert ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{isBn ? 'আমাকে একটি পরীক্ষামূলক সতর্কতা পাঠান' : 'Send me a test alert'}</span>
              </button>

              {testAlertFeedback && (
                <div
                  className={`mt-2 p-2.5 rounded-xl border text-xs font-mono ${
                    testAlertFeedback.ok
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                  }`}
                >
                  {testAlertFeedback.message}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
