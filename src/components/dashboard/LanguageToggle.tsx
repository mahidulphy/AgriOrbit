import React from 'react';
import { Globe } from 'lucide-react';
import type { Language } from '../../types';

export interface LanguageToggleProps {
  language: Language;
  onLanguageChange?: (lang: Language) => void;
  className?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

/**
 * 1. Language Toggle (EN / BN)
 * A sleek, modern toggle switch for the top Navbar.
 * Smoothly switches between 'English' and 'বাংলা' with glowing neon accents.
 */
export const LanguageToggle: React.FC<LanguageToggleProps> = ({
  language,
  onLanguageChange,
  className = '',
  size = 'md',
  showIcon = true,
}) => {
  const isEnglish = language === 'en';

  const handleToggle = (targetLang: Language) => {
    if (onLanguageChange && targetLang !== language) {
      onLanguageChange(targetLang);
    }
  };

  const isSmall = size === 'sm';

  return (
    <div
      role="group"
      aria-label="Language selector"
      className={`relative inline-flex items-center rounded-xl bg-[#0B1626]/90 p-1 border border-white/10 backdrop-blur-md shadow-inner transition-all duration-300 ${className}`}
    >
      {showIcon && (
        <span className="pl-2 pr-1 text-[#8FA3B8] hidden sm:inline-flex items-center">
          <Globe className="w-3.5 h-3.5 text-[#00E5FF]/80" />
        </span>
      )}

      {/* English Toggle Button */}
      <button
        type="button"
        onClick={() => handleToggle('en')}
        aria-pressed={isEnglish}
        className={`relative z-10 rounded-lg transition-all duration-300 font-mono font-bold tracking-tight cursor-pointer ${
          isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          isEnglish
            ? 'bg-[#B8FF3D] text-[#050B14] shadow-[0_0_12px_rgba(184,255,61,0.35)] font-bold'
            : 'text-[#8FA3B8] hover:text-white hover:bg-white/5'
        }`}
      >
        English
      </button>

      {/* Bengali Toggle Button */}
      <button
        type="button"
        onClick={() => handleToggle('bn')}
        aria-pressed={!isEnglish}
        className={`relative z-10 rounded-lg transition-all duration-300 font-semibold cursor-pointer ${
          isSmall ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
        } ${
          !isEnglish
            ? 'bg-[#B8FF3D] text-[#050B14] shadow-[0_0_12px_rgba(184,255,61,0.35)] font-bold'
            : 'text-[#8FA3B8] hover:text-white hover:bg-white/5'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
