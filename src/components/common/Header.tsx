import { useEffect, useState, useRef } from 'react';
import { ArrowRight, Menu, X, ChevronDown, LogIn } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { Wordmark } from '../ui/ui.tsx';
import { UserMenu } from '../auth/UserMenu.tsx';

export interface HeaderProps {
  className?: string;
}

export function Header({ className = '' }: HeaderProps) {
  const { t, lang, setLang } = useLang();
  const { user, isGuest } = useAuth();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [activeId, setActiveId] = useState<string>('');
  const moreRef = useRef<HTMLLIElement>(null);

  const isAuthenticated = Boolean(user || isGuest);

  const links = [
    { id: 'field-shift', href: '#field-shift', label: t.nav.fieldShift },
    { id: 'crops', href: '#crops', label: t.nav.crops },
    { id: 'how', href: '#how', label: t.nav.how },
    { id: 'data', href: '#data', label: t.nav.data },
    { id: 'rotation', href: '#rotation', label: t.nav.rotation },
    { id: 'materials', href: '#materials', label: t.nav.materials },
  ];

  // Primary links for intermediate desktop (1024px-1279px) to prevent wrapping in Bengali
  const primaryLinks = links.slice(0, 4);
  const secondaryLinks = links.slice(4);

  // Active section tracking via scroll position
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleScroll = () => {
      // Only track section headers when on the landing view
      const hash = window.location.hash;
      if (hash && (hash.startsWith('#/dashboard') || hash.startsWith('#/analyze') || hash.startsWith('#/onboarding') || hash.startsWith('#/profile'))) {
        setActiveId('');
        return;
      }

      const scrollPos = window.scrollY + 100;
      let current = '';

      for (const link of links) {
        const el = document.getElementById(link.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            current = link.id;
          }
        }
      }

      setActiveId(current);
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [links]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Close mobile drawer if resized to desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close "More" dropdown when clicking outside
  useEffect(() => {
    if (!moreOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [moreOpen]);

  const handleLinkClick = (href: string, id: string) => {
    setOpen(false);
    setMoreOpen(false);

    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const isAppRoute = hash.startsWith('#/dashboard') || hash.startsWith('#/analyze') || hash.startsWith('#/profile') || hash.startsWith('#/onboarding') || hash.startsWith('#/login');

    if (isAppRoute) {
      // Navigate to landing page anchor
      window.location.hash = href;
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        // Update URL hash without jumping
        window.history.pushState(null, '', href);
      } else {
        window.location.hash = href;
      }
    }
  };

  const isMoreActive = secondaryLinks.some((l) => l.id === activeId);

  return (
    <header
      className={`sticky top-0 z-50 h-16 w-full bg-[#0A0A0A] border-b border-[#262626] transition-none ${className}`}
    >
      <nav
        aria-label="AgriOrbit Navigation"
        className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4"
      >
        {/* Left: Brand Logo Only */}
        <div className="shrink-0 flex items-center">
          <Wordmark />
        </div>

        {/* Center: Navigation Links (Desktop 1024px+) */}
        {/* At xl (>=1280px): Show all 6 links */}
        <ul className="hidden xl:flex items-center gap-6 2xl:gap-8 text-sm font-medium text-[#A3A3A3]">
          {links.map((l) => {
            const isActive = activeId === l.id;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => handleLinkClick(l.href, l.id)}
                  className={`transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                    isActive
                      ? 'text-[#FAFAFA] font-semibold after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#22C55E]'
                      : 'hover:text-[#FAFAFA]'
                  }`}
                >
                  {l.label}
                </button>
              </li>
            );
          })}
        </ul>

        {/* At lg (1024px-1279px): Show 4 links + "More / আরও" dropdown to prevent overlap */}
        <ul className="hidden lg:flex xl:hidden items-center gap-4 text-sm font-medium text-[#A3A3A3]">
          {primaryLinks.map((l) => {
            const isActive = activeId === l.id;
            return (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => handleLinkClick(l.href, l.id)}
                  className={`transition-colors whitespace-nowrap cursor-pointer py-1 relative ${
                    isActive
                      ? 'text-[#FAFAFA] font-semibold after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#22C55E]'
                      : 'hover:text-[#FAFAFA]'
                  }`}
                >
                  {l.label}
                </button>
              </li>
            );
          })}

          {/* "More / আরও" Dropdown */}
          <li className="relative" ref={moreRef}>
            <button
              type="button"
              onClick={() => setMoreOpen(!moreOpen)}
              className={`inline-flex items-center gap-1 py-1 transition-colors whitespace-nowrap cursor-pointer relative ${
                isMoreActive
                  ? 'text-[#FAFAFA] font-semibold after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:bg-[#22C55E]'
                  : 'hover:text-[#FAFAFA]'
              }`}
              aria-expanded={moreOpen}
            >
              <span>{t.nav.more}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
            </button>

            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 rounded-xl bg-[#141414] border border-[#262626] shadow-2xl p-1.5 z-50">
                {secondaryLinks.map((l) => {
                  const isActive = activeId === l.id;
                  return (
                    <button
                      key={l.id}
                      type="button"
                      onClick={() => handleLinkClick(l.href, l.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#262626] text-[#22C55E] font-semibold'
                          : 'text-[#A3A3A3] hover:text-[#FAFAFA] hover:bg-[#1A1A1A]'
                      }`}
                    >
                      {l.label}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        </ul>

        {/* Right Desktop Cluster: Language Toggle · Sign In · Primary Button */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {/* Single Segmented Language Toggle */}
          <div
            role="group"
            aria-label="Language selector"
            className="inline-flex items-center rounded-lg bg-[#141414] p-0.5 border border-[#262626]"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold shadow-xs'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                lang === 'bn'
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold shadow-xs'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              বাংলা
            </button>
          </div>

          {/* Sign In / Profile */}
          {isAuthenticated ? (
            <UserMenu compact={false} />
          ) : (
            <a
              href="#/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-[#FAFAFA] text-xs font-mono font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <LogIn className="w-3.5 h-3.5 text-[#22C55E]" />
              <span>{t.nav.signIn}</span>
            </a>
          )}

          {/* One Primary CTA Button */}
          <button
            type="button"
            onClick={goAnalyze}
            className="inline-flex items-center gap-2 rounded-lg bg-[#22C55E] text-[#0A0A0A] font-medium text-xs sm:text-sm px-4 py-2 hover:bg-[#16A34A] transition-colors cursor-pointer shrink-0 whitespace-nowrap shadow-xs"
          >
            <span>{t.nav.analyze}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {/* Mobile Header (below 1024px): Logo on Left, Language Toggle and Hamburger on Right */}
        <div className="flex lg:hidden items-center gap-2">
          {/* Small Segmented Language Toggle for Mobile */}
          <div
            role="group"
            aria-label="Language selector"
            className="inline-flex items-center rounded-lg bg-[#141414] p-0.5 border border-[#262626]"
          >
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2 py-1 text-[11px] font-mono rounded-md transition-colors cursor-pointer ${
                lang === 'en'
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2 py-1 text-[11px] rounded-md transition-colors cursor-pointer ${
                lang === 'bn'
                  ? 'bg-[#FAFAFA] text-[#0A0A0A] font-semibold'
                  : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
              }`}
            >
              বাং
            </button>
          </div>

          {/* Hamburger / Close Button */}
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg bg-[#141414] border border-[#262626] text-[#FAFAFA] hover:border-[#404040] cursor-pointer transition-colors"
            aria-label={open ? 'Close Menu' : 'Open Menu'}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Full-Height Mobile Drawer Menu */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 bg-[#0A0A0A] border-b border-[#262626] flex flex-col justify-between p-4 pb-8 overflow-y-auto lg:hidden">
          <div className="space-y-4">
            <ul className="flex flex-col gap-1 text-[#A3A3A3]">
              {links.map((l) => {
                const isActive = activeId === l.id;
                return (
                  <li key={l.id}>
                    <button
                      type="button"
                      onClick={() => handleLinkClick(l.href, l.id)}
                      className={`w-full text-left block rounded-lg px-4 py-3 min-h-[44px] text-base font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#141414] text-[#22C55E] font-semibold border border-[#262626]'
                          : 'hover:bg-[#141414] hover:text-[#FAFAFA]'
                      }`}
                    >
                      {l.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Drawer Footer Actions */}
          <div className="pt-4 border-t border-[#262626] mt-4 flex flex-col gap-3 shrink-0">
            {/* Sign in / Profile Row */}
            <div className="px-1">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-[#737373]">{t.nav.signIn}:</span>
                  <div onClick={() => setOpen(false)}>
                    <UserMenu />
                  </div>
                </div>
              ) : (
                <a
                  href="#/login"
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#141414] border border-[#262626] text-[#FAFAFA] min-h-[44px] text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
                >
                  <LogIn className="w-4 h-4 text-[#22C55E]" />
                  <span>{t.nav.signIn}</span>
                </a>
              )}
            </div>

            {/* Single Primary Action Button */}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                goAnalyze();
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#22C55E] text-[#0A0A0A] font-semibold min-h-[48px] py-3 text-base hover:bg-[#16A34A] transition-colors cursor-pointer shadow-xs"
            >
              <span>{t.nav.analyze}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
