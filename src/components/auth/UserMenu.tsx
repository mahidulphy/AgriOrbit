import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [coords, setCoords] = useState<{ top: number; left?: number; right?: number; width: number }>({
    top: 0,
    width: 240,
  });

  const profile = getFarmerProfile(user?.id);
  const farmerName = isGuest
    ? (isBn ? 'অতিথি' : 'Guest')
    : (displayName || profile.fullName || (isBn ? 'খামারী' : 'Farmer'));

  const districtObj = BD_DISTRICTS.find((d) => d.id === profile.districtId);
  const districtName = districtObj ? (isBn ? districtObj.nameBn : districtObj.nameEn) : null;

  // Calculate coordinates for portal placement under trigger button
  const updatePosition = () => {
    if (!triggerButtonRef.current) return;
    const rect = triggerButtonRef.current.getBoundingClientRect();
    const dropdownWidth = 240;
    const margin = 8;
    const top = rect.bottom + margin;

    const viewportWidth = window.innerWidth;
    const rightEdge = viewportWidth - rect.right;

    let left: number | undefined;
    let right: number | undefined = Math.max(8, rightEdge);

    if (viewportWidth < 280) {
      left = 8;
      right = 8;
    } else if (rect.right - dropdownWidth < 8) {
      left = 8;
      right = undefined;
    }

    setCoords({
      top,
      left,
      right,
      width: Math.min(dropdownWidth, viewportWidth - 16),
    });
  };

  // Recalculate on open, resize, scroll
  useEffect(() => {
    if (dropdownOpen) {
      updatePosition();
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition, true);
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition, true);
      };
    }
  }, [dropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!dropdownOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        triggerButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dropdownOpen]);

  // Close on route change
  useEffect(() => {
    const handleRouteChange = () => {
      setDropdownOpen(false);
    };
    window.addEventListener('hashchange', handleRouteChange);
    window.addEventListener('popstate', handleRouteChange);
    return () => {
      window.removeEventListener('hashchange', handleRouteChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);

  const isAuthenticated = Boolean(user || isGuest);

  if (!isAuthenticated) {
    return (
      <a
        href="#/login"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#0B1626]/90 hover:bg-[#0B1626] border border-white/20 text-white text-xs font-mono font-semibold backdrop-blur-md shadow-sm transition-all cursor-pointer hover:border-[#00E5FF]/50"
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
    <div className="relative inline-block">
      {/* Trigger Button */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className={`flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border transition-all cursor-pointer ${
          dropdownOpen
            ? 'bg-[#0B1626] border-[#B8FF3D]/50 text-white shadow-md shadow-black/30'
            : 'bg-[#0B1626]/90 hover:bg-[#0B1626] border-white/20 text-slate-100 hover:text-white backdrop-blur-md shadow-sm'
        }`}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={farmerName}
            className="w-7 h-7 rounded-lg object-cover border border-[#B8FF3D]/40"
            loading="lazy"
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

      {/* Dropdown Menu attached to document.body via Portal (z-9999 ensures it floats above all page content) */}
      {dropdownOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={dropdownRef}
          style={{
            position: 'fixed',
            top: `${coords.top}px`,
            ...(coords.left !== undefined ? { left: `${coords.left}px` } : {}),
            ...(coords.right !== undefined ? { right: `${coords.right}px` } : {}),
            width: `${coords.width}px`,
            zIndex: 9999,
          }}
          className="rounded-2xl bg-[#0B1626] border border-white/20 shadow-2xl p-2 text-xs animate-fadeIn backdrop-blur-2xl ring-1 ring-black/50"
          role="menu"
          aria-orientation="vertical"
        >
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
              role="menuitem"
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
              role="menuitem"
            >
              <ShieldCheck className="w-4 h-4 text-[#00E5FF]" />
              <span>{isBn ? 'দ্রুত ওভারভিউ (Modal)' : 'Quick Overview Modal'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-300 hover:text-red-200 hover:bg-red-500/10 transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <LogOut className="w-4 h-4" />
              <span>{isBn ? 'লগআউট' : 'Sign Out'}</span>
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* Profile Modal */}
      <UserProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
    </div>
  );
};
