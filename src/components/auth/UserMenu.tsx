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
      width: dropdownWidth,
    });
  };

  useEffect(() => {
    if (!dropdownOpen) return;

    updatePosition();
    const handleScrollOrResize = () => updatePosition();
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        triggerButtonRef.current &&
        !triggerButtonRef.current.contains(target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  // Close dropdown on route change
  useEffect(() => {
    const handleRouteChange = () => setDropdownOpen(false);
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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#FAFAFA] text-xs font-mono font-medium transition-colors cursor-pointer"
      >
        <LogIn className="w-3.5 h-3.5" />
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
        className={`flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border transition-colors cursor-pointer ${
          dropdownOpen
            ? 'bg-[#1A1A1A] border-[#404040] text-[#FAFAFA]'
            : 'bg-[#141414] hover:bg-[#1A1A1A] border-[#262626] text-[#FAFAFA]'
        }`}
        aria-expanded={dropdownOpen}
        aria-haspopup="true"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={farmerName}
            className="w-6 h-6 rounded-md object-cover border border-[#262626]"
            loading="lazy"
          />
        ) : (
          <div className="w-6 h-6 rounded-md bg-[#0A0A0A] border border-[#262626] flex items-center justify-center text-[11px] font-mono font-medium text-[#FAFAFA]">
            {getInitials(farmerName)}
          </div>
        )}

        {!compact && (
          <span className="text-xs font-medium text-[#FAFAFA] max-w-[120px] truncate hidden sm:inline">
            {farmerName}
          </span>
        )}

        <ChevronDown
          className={`w-3.5 h-3.5 text-[#737373] transition-transform duration-200 ${
            dropdownOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu attached to document.body via Portal */}
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
          className="rounded-xl bg-[#141414] border border-[#262626] shadow-xl p-1.5 text-xs animate-fadeIn"
          role="menu"
          aria-orientation="vertical"
        >
          {/* User info banner */}
          <div className="p-2.5 pb-3 border-b border-[#262626]">
            <span className="font-display font-semibold text-[#FAFAFA] block truncate text-sm">
              {farmerName}
            </span>
            <span className="text-[11px] font-mono text-[#737373] block truncate mt-0.5">
              {user?.email || (isGuest ? (isBn ? 'গেস্ট মোড' : 'Guest Mode') : '')}
            </span>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap">
              <span className="inline-block text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#262626] text-[#737373]">
                {provider === 'google' ? 'Google OAuth' : provider === 'email' ? 'Email Auth' : 'Guest'}
              </span>
              {districtName && (
                <span className="inline-block text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0A0A0A] border border-[#262626] text-[#A3A3A3]">
                  {districtName}
                </span>
              )}
            </div>
          </div>

          {/* Options */}
          <div className="py-1 space-y-0.5">
            <a
              href="#/profile"
              onClick={() => setDropdownOpen(false)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors text-left cursor-pointer"
              role="menuitem"
            >
              <User className="w-4 h-4 text-[#A3A3A3]" />
              <span>{isBn ? 'সম্পূর্ণ প্রোফাইল ও জমি' : 'Farmer Profile & Fields'}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setDropdownOpen(false);
                setProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#1A1A1A] transition-colors text-left cursor-pointer text-xs"
              role="menuitem"
            >
              <ShieldCheck className="w-4 h-4 text-[#737373]" />
              <span>{isBn ? 'দ্রুত ওভারভিউ (Modal)' : 'Quick Overview Modal'}</span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors text-left cursor-pointer"
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
