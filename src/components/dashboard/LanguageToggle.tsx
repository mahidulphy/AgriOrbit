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
 * Clean, subtle toggle switch.
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
      className={`relative inline-flex items-center rounded-lg bg-[#141414] p-1 border border-[#262626] transition-colors ${className}`}
    >
      {showIcon && (
        <span className="pl-1.5 pr-1 text-[#737373] hidden sm:inline-flex items-center">
          <Globe className="w-3.5 h-3.5" />
        </span>
      )}

      {/* English Toggle Button */}
      <button
        type="button"
        onClick={() => handleToggle('en')}
        aria-pressed={isEnglish}
        className={`relative z-10 rounded-md transition-colors font-mono text-xs cursor-pointer ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${
          isEnglish
            ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium'
            : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
        }`}
      >
        English
      </button>

      {/* Bengali Toggle Button */}
      <button
        type="button"
        onClick={() => handleToggle('bn')}
        aria-pressed={!isEnglish}
        className={`relative z-10 rounded-md transition-colors text-xs cursor-pointer ${
          isSmall ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
        } ${
          !isEnglish
            ? 'bg-[#FAFAFA] text-[#0A0A0A] font-medium'
            : 'text-[#A3A3A3] hover:text-[#FAFAFA]'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
