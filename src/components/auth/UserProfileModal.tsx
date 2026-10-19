import React from 'react';
import { X, User, Mail, Shield, Calendar, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, displayName, avatarUrl, provider, isGuest, signOut } = useAuth();
  const { lang } = useLang();

  if (!isOpen) return null;

  const handleSignOut = async () => {
    await signOut();
    onClose();
    window.location.hash = '';
  };

  const createdAt = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : null;

  const emailConfirmed = Boolean(user?.email_confirmed_at || provider === 'google');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-editorial">
      <div className="bg-[#0B1626] border border-white/15 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl text-white relative">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-[#B8FF3D]" />
            <h3 className="font-display font-bold text-lg text-white">
              {lang === 'en' ? 'Farmer Profile' : 'কৃষক প্রোফাইল'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Card Body */}
        <div className="p-6 space-y-6">
          {/* Avatar & Main Identity */}
          <div className="flex items-center gap-4">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#B8FF3D]/50 shadow-md"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#00E5FF]/20 to-[#B8FF3D]/20 border border-[#B8FF3D]/40 flex items-center justify-center text-xl font-bold font-mono text-[#B8FF3D]">
                {displayName ? displayName.charAt(0).toUpperCase() : 'F'}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="font-display text-lg font-bold text-white truncate">
                {displayName || (lang === 'en' ? 'AgriOrbit Farmer' : 'এগ্রিঅরবিট কৃষক')}
              </h4>
              <p className="text-xs text-slate-400 truncate">
                {user?.email || (isGuest ? (lang === 'en' ? 'Guest Evaluation Mode' : 'গেস্ট মোড') : '')}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-white/5 border border-white/10 text-[#00E5FF]">
                  {provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Email Auth' : 'Guest Mode'}
                </span>
                {emailConfirmed && !isGuest && (
                  <span className="flex items-center gap-1 text-[10px] font-mono text-[#B8FF3D]">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{lang === 'en' ? 'Verified' : 'যাচাইকৃত'}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="p-4 rounded-2xl bg-[#050B14] border border-white/5 space-y-3 text-xs font-mono">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#00E5FF]" />
                <span className="text-slate-400">{lang === 'en' ? 'Auth Provider' : 'অথেনটিকেশন'}:</span>
              </div>
              <span className="text-white font-bold capitalize">{provider || 'Local'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#B8FF3D]" />
                <span className="text-slate-400">{lang === 'en' ? 'Account Status' : 'অ্যাকাউন্ট স্ট্যাটাস'}:</span>
              </div>
              <span className="text-[#B8FF3D] font-bold">
                {isGuest
                  ? lang === 'en'
                    ? 'Guest Access'
                    : 'গেস্ট এক্সেস'
                  : emailConfirmed
                  ? lang === 'en'
                    ? 'Active & Confirmed'
                    : 'সক্রিয় ও নিশ্চিতকৃত'
                  : lang === 'en'
                  ? 'Pending Verification'
                  : 'যাচাই পেন্ডিং'}
              </span>
            </div>

            {createdAt && (
              <div className="flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span className="text-slate-400">{lang === 'en' ? 'Member Since' : 'যুক্ত হয়েছেন'}:</span>
                </div>
                <span className="text-white font-bold">{createdAt}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-6 bg-[#050B14]/80 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 cursor-pointer"
          >
            {lang === 'en' ? 'Close' : 'বন্ধ করুন'}
          </button>

          <button
            onClick={handleSignOut}
            className="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{lang === 'en' ? 'Sign Out' : 'লগআউট'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
