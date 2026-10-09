import React from 'react';
import type { Language } from '../../types';
import { LanguageToggle } from '../dashboard/LanguageToggle';

interface LanguageSwitcherProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  language,
  onLanguageChange,
  className = '',
  size = 'sm',
}) => (
  <LanguageToggle
    language={language}
    onLanguageChange={onLanguageChange}
    className={className}
    size={size}
    showIcon={true}
  />
);

