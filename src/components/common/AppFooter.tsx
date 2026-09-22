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
  <footer className="mt-auto border-t border-white/10 bg-[#050B14] py-8 px-4 sm:px-6 text-xs text-[#8FA3B8]">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div className="flex flex-wrap items-center justify-center gap-2">
        <span className="font-extrabold text-white text-sm">AGRIORBIT</span>
        <span>• NASA Space Apps Challenge Project</span>
        <span>• Team: Bay of Orbits</span>
      </div>
      {userName ? (
        <div className="flex items-center gap-2 text-[11px]">
          <span>
            {language === 'en' ? 'Active Farmer:' : 'সক্রিয় কৃষক:'} {userName}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          {onOpenHowItWorks && (
            <button onClick={onOpenHowItWorks} className="hover:text-white transition cursor-pointer">
              {language === 'en' ? 'How It Works' : 'এটি কীভাবে কাজ করে'}
            </button>
          )}
          {onOpenLogin && (
            <button onClick={onOpenLogin} className="hover:text-white transition cursor-pointer">
              {language === 'en' ? 'Login' : 'লগইন'}
            </button>
          )}
        </div>
      )}
    </div>
  </footer>
);
