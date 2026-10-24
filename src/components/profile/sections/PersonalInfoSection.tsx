import { EmailAlertsToggle } from '../../common/EmailAlertsToggle';
import React, { useRef, useState } from 'react';
import { User, Mail, Phone, Bell, Camera, Loader2, Send } from 'lucide-react';
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
      <div>
        <h3 className="font-display font-semibold text-lg text-[#FAFAFA]">
          {isBn ? 'ব্যক্তিগত তথ্য ও যোগাযোগের মাধ্যম' : 'Personal & Contact Information'}
        </h3>
        <p className="text-xs text-[#737373] mt-1">
          {isBn
            ? 'আপনার পরিচিতি ও সরাসরি যোগাযোগের মাধ্যমগুলো হালনাগাদ রাখুন।'
            : 'Keep your identity and direct communication channels up to date.'}
        </p>
      </div>

      {/* Avatar Upload (If enabled) */}
      {showAvatarUpload && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-[#0A0A0A] border border-[#262626]">
          <div className="relative group">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={fullName || 'Avatar'}
                className="w-14 h-14 rounded-lg object-cover border border-[#262626]"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-[#141414] border border-[#262626] flex items-center justify-center text-lg font-bold font-mono text-[#FAFAFA]">
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer disabled:opacity-50"
              title={isBn ? 'ছবি পরিবর্তন করুন' : 'Change avatar'}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Camera className="w-4 h-4 text-white" />
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
            <span className="text-sm font-semibold text-[#FAFAFA] block">
              {isBn ? 'প্রোফাইল ছবি' : 'Profile Photo'}
            </span>
            <span className="text-xs text-[#737373] block mt-0.5">
              {isBn ? 'ছবি পরিবর্তন করতে ট্যাপ করুন' : 'Click the avatar to upload a new photo'}
            </span>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'কৃষকের পূর্ণ নাম' : 'Full Name'} <span className="text-[#22C55E]">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              placeholder={isBn ? 'যেমন: মোহাম্মদ শহিদুল ইসলাম' : 'e.g. Mohammad Shahidul Islam'}
              className={`w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none transition-colors ${
                errors?.fullName ? 'border-[#EF4444] bg-[#EF4444]/5' : 'border-[#262626]'
              }`}
              required
            />
          </div>
          {errors?.fullName && (
            <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.fullName}</p>
          )}
        </div>

        {/* Account Email (Read-only) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider">
              {isBn ? 'ইমেইল ঠিকানা' : 'Account Email'}
            </label>
            <span className="text-[10px] font-mono text-[#737373]">
              {isBn ? 'নিবন্ধিত অ্যাকাউন্ট' : 'Verified'}
            </span>
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <input
              type="email"
              value={email || (isBn ? 'গেস্ট হিসেবে সক্রিয়' : 'active_guest@agriorbit.local')}
              readOnly
              className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#737373] text-sm cursor-not-allowed font-mono"
            />
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="01XXXXXXXXX"
              className={`w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border text-[#FAFAFA] text-sm font-mono focus:border-[#22C55E] focus:outline-none transition-colors ${
                errors?.phone ? 'border-[#EF4444] bg-[#EF4444]/5' : 'border-[#262626]'
              }`}
            />
          </div>
          {errors?.phone ? (
            <p className="text-xs text-[#EF4444] mt-1 font-mono">{errors.phone}</p>
          ) : (
            <p className="text-[11px] text-[#737373] mt-1 font-mono">
              {isBn ? 'জরুরি আবহাওয়া সতর্কতার জন্য' : 'Used for urgent weather broadcast alerts'}
            </p>
          )}
        </div>

        {/* Preferred Communication Method */}
        <div>
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] mb-1.5 uppercase tracking-wider">
            {isBn ? 'আবহাওয়া সতর্কতার মাধ্যম' : 'Preferred Alert Channel'}
          </label>
          <div className="relative">
            <Bell className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#737373] pointer-events-none" />
            <select
              value={communicationMethod}
              onChange={(e) => onCommunicationMethodChange(e.target.value as any)}
              className="w-full min-h-[44px] pl-9 pr-3.5 py-2.5 rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#FAFAFA] text-sm focus:border-[#22C55E] focus:outline-none cursor-pointer"
            >
              {COMMUNICATION_METHODS.map((method) => (
                <option key={method.id} value={method.id} className="bg-[#141414] text-[#FAFAFA]">
                  {isBn ? method.bn : method.en}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[11px] text-[#737373] mt-1 font-mono">
            {isBn ? 'কীভাবে কৃষি সতর্কতা পেতে চান' : 'How you prefer receiving farming updates'}
          </p>
        </div>

        {/* Automated Alert Toggles */}
        <div className="sm:col-span-2 pt-4 border-t border-[#262626] space-y-3">
          <label className="block text-xs font-mono font-medium text-[#A3A3A3] uppercase tracking-wider">
            {isBn ? 'স্বয়ংক্রিয় কৃষি সতর্কতা সেটিংস' : 'Automated Field Alert Settings'}
          </label>

          {/* Email Alerts Toggle (SMS coming soon) */}
          <EmailAlertsToggle
            id="personal-info-alerts-toggle"
            checked={Boolean(emailAlerts || smsAlerts)}
            onChange={(val) => {
              onEmailAlertsChange?.(val);
              onSmsAlertsChange?.(val);
            }}
            isBn={isBn}
          />

          {/* Test Alert Button for Logged-In Users */}
          {isLoggedIn && (
            <div className="pt-2">
              <button
                type="button"
                onClick={handleSendTestAlert}
                disabled={sendingTestAlert}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-[#262626] bg-[#0A0A0A] hover:bg-[#1A1A1A] text-[#FAFAFA] text-xs font-mono font-medium transition-colors disabled:opacity-50 cursor-pointer"
              >
                {sendingTestAlert ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#FAFAFA]" />
                ) : (
                  <Send className="w-3.5 h-3.5 text-[#22C55E]" />
                )}
                <span>{isBn ? 'আমাকে একটি পরীক্ষামূলক সতর্কতা পাঠান' : 'Send me a test alert'}</span>
              </button>

              {testAlertFeedback && (
                <div
                  className={`mt-2 p-2.5 rounded-lg border text-xs font-mono ${
                    testAlertFeedback.ok
                      ? 'bg-[#22C55E]/10 border-[#22C55E]/30 text-[#22C55E]'
                      : 'bg-[#F59E0B]/10 border-[#F59E0B]/30 text-[#F59E0B]'
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
