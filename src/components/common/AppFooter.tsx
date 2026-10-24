import React from 'react';
import type { Language } from '../../types';

interface AppFooterProps {
  language: Language;
  userName?: string;
  onOpenHowItWorks?: () => void;
  onOpenLogin?: () => void;
}

export const AGRIORBIT_TAGLINE = 'NASA observes. AgriOrbit explains. Farmers decide.';

export const AppFooter: React.FC<AppFooterProps> = ({
  language,
  userName,
}) => (
  <footer className="mt-auto border-t border-[#262626] bg-[#0A0A0A] py-8 px-4 sm:px-6 lg:px-8 text-xs text-[#737373] font-sans">
    <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
        <a href="#" aria-label="AgriOrbit" className="inline-flex items-center shrink-0">
          <picture className="shrink-0 flex items-center">
            <source srcSet="/logo.webp" type="image/webp" />
            <source srcSet="/agriorbit-logo.webp" type="image/webp" />
            <img
              src="/logo.png"
              alt="AgriOrbit"
              className="h-7 w-auto object-contain mix-blend-screen shrink-0"
              draggable={false}
            />
          </picture>
        </a>
        <span className="text-[#404040] hidden sm:inline">|</span>
        <span className="text-[11px] font-mono text-[#737373]">
          NASA Earth Observations for Bangladesh Agriculture
        </span>
        <span className="text-[#404040] hidden sm:inline">|</span>
        <span className="text-[11px] text-[#737373]">Team: Bay of Orbits</span>
      </div>

      <div className="flex items-center gap-4 text-xs font-mono">
        {userName && (
          <span className="text-[#737373] hidden lg:inline mr-2">
            {language === 'en' ? 'Farmer:' : 'কৃষক:'} <strong className="text-[#FAFAFA] font-medium">{userName}</strong> ·
          </span>
        )}
        <a href="#/privacy" className="hover:text-[#FAFAFA] transition-colors">
          {language === 'en' ? 'Privacy Policy' : 'গোপনীয়তা নীতি'}
        </a>
        <span className="text-[#404040]">·</span>
        <a href="#/terms" className="hover:text-[#FAFAFA] transition-colors">
          {language === 'en' ? 'Terms & Conditions' : 'শর্তাবলী'}
        </a>
      </div>
    </div>
  </footer>
);
