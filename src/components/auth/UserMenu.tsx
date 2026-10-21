import React, { useState, useRef, useEffect } from 'react';
import { User, LogIn, LogOut, ChevronDown, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../lang';
import { UserProfileModal } from './UserProfileModal';
import { getFarmerProfile } from '../../data/farmerProfile';
import { BD_DISTRICTS } from '../../data/districts';

interface UserMenuProps {
  compact?: boolean;
}

function getInitials(name: string): string {
  if (!name) return 'F';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
}

export const UserMenu: React.FC<UserMenuProps> = ({ compact = false }) => {
  const { user, isGuest, displayName, avatarUrl, provider, signOut } = useAuth();
  const { lang } = useLang();
  const isBn = lang === 'bn';

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const profile = getFarmerProfile(user?.id);
  const farmerName = isGuest
    ? (isBn ? 'অতিথি' : 'Guest')
    : (displayName || profile.fullName || (isBn ? 'খামারী' : 'Farmer'));

  const districtObj = BD_DISTRICTS.find((d) => d.id === profile.districtId);
  const districtName = districtObj ? (isBn ? districtObj.nameBn : districtObj.nameEn) : null;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAuthenticated = Boolean(user || isGuest);

  if (!isAuthenticated) {
    return (
      <a
        href="#/login"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-100 hover:text-white text-xs font-mono font-medium transition-colors cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5 text-[#00E5FF]" />
        <span>{lang === 'en' ? 'Sign In' : 'লগইন'}</span>
      </a>
    );
  }

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
  };

  return (
    <div className="relative inline-block" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
          dropdownOpen
            ? 'bg-white/10 border-[#B8FF3D]/40 text-white shadow-md shadow-black/30'
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
        }`}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={farmerName}
            className="w-7 h-7 rounded-lg object-cover border border-[#B8FF3D]/40"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00E5FF]/20 to-[#B8FF3D]/20 border border-[#B8FF3D]/40 flex items-center justify-center text-xs font-bold font-mono text-[#B8FF3D]">
            {getInitials(farmerName)}
          </div>
        )}

        {!compact && (
          <span className="text-xs font-medium text-slate-200 max-w-[120px] truncate hidden sm:inline">
            {farmerName}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180 text-[#B8FF3D]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0B1626] border border-white/15 shadow-2xl p-2 z-50 text-xs animate-fadeIn backdrop-blur-xl">
          {/* User info banner */}
          <div className="p-2.5 pb-3 border-b border-white/10">
            <span className="font-display font-bold text-white block truncate text-sm">
              {farmerName}
            </span>
            <span className="text-[11px] font-mono text-slate-400 block truncate mt-0.5">
              {user?.email || (isGuest ? (isBn ? 'গেস্ট মোড' : 'Guest Mode') : '')}
            </span>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[#00E5FF]">
                {provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Email Auth' : 'Guest'}
              </span>
              {districtName && (
                <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#B8FF3D]/10 border border-[#B8FF3D]/25 text-[#B8FF3D]">
                  📍 {districtName}
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="py-1 space-y-0.5">
            <a
              href="#/profile"
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#B8FF3D] hover:text-white hover:bg-[#B8FF3D]/10 font-bold transition-colors text-left cursor-pointer"
            >
              <User className="w-4 h-4 text-[#B8FF3D]" />
              <span>{isBn ? 'সম্পূর্ণ প্রোফাইল ও জমি' : 'Farmer Profile & Fields'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors text-left cursor-pointer text-xs"
            >
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              <span>{isBn ? 'দ্রুত ওভারভিউ (Modal)' : 'Quick Overview Modal'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
