import React from 'react';
import type { Language } from '../../types';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onLanguageChange,
}) => (
  <div className="flex items-center bg-[#3B0764] rounded-lg p-0.5 border border-[#6D28D9]/50">
    <button
      type="button"
      onClick={() => onLanguageChange('en')}
      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
        language === 'en' ? 'bg-[#A855F7] text-white shadow-sm' : 'text-[#E9D5FF]/70 hover:text-white'
      }`}
    >
      EN
    </button>
    <button
      type="button"
      onClick={() => onLanguageChange('bn')}
      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
        language === 'bn' ? 'bg-[#A855F7] text-white shadow-sm' : 'text-[#E9D5FF]/70 hover:text-white'
      }`}
    >
      বাংলা
    </button>
  </div>
);
