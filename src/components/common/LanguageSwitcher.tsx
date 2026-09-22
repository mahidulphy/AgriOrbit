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
  <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/10">
    <button
      type="button"
      onClick={() => onLanguageChange('en')}
      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
        language === 'en' ? 'bg-[#B8FF3D] text-[#050B14] shadow-sm' : 'text-[#8FA3B8] hover:text-white'
      }`}
    >
      EN
    </button>
    <button
      type="button"
      onClick={() => onLanguageChange('bn')}
      className={`px-2.5 py-1 text-xs font-bold rounded-md transition ${
        language === 'bn' ? 'bg-[#B8FF3D] text-[#050B14] shadow-sm' : 'text-[#8FA3B8] hover:text-white'
      }`}
    >
      বাংলা
    </button>
  </div>
);
