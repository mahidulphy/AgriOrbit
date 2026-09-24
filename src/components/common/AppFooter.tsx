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
  onOpenHowItWorks,
  onOpenLogin,
}) => (
  <footer className="border-t border-white/10 py-6 px-4 sm:px-6 text-xs text-[#8FA3B8]">
    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
      <p className="leading-relaxed max-w-xl">
        <strong className="text-white font-bold">AgriOrbit</strong>
        <span> · {AGRIORBIT_TAGLINE}</span>
        <span className="block sm:inline"> · Team Bay of Orbits, NASA Space Apps Challenge</span>
      </p>
      {userName ? (
        <p className="text-[11px] whitespace-nowrap">
          {language === 'en' ? 'Signed in as' : 'লগইনকৃত'} {userName}
        </p>
      ) : (
        <div className="flex items-center gap-5 shrink-0">
          {onOpenHowItWorks && (
            <button onClick={onOpenHowItWorks} className="hover:text-white transition cursor-pointer whitespace-nowrap">
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
          )}
          {onOpenLogin && (
            <button onClick={onOpenLogin} className="hover:text-white transition cursor-pointer whitespace-nowrap">
              {language === 'en' ? 'Login' : 'লগইন'}
            </button>
          )}
        </div>
      )}
    </div>
  </footer>
);
