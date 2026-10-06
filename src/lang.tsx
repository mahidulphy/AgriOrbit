// Language state shared by every component: `const { t, num } = useLang();`

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { STRINGS, type Dict, type Lang } from './i18n.ts';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  /** Format a number: num(0.55, 1, true) -> "+0.6" (Bangla digits in বাংলা mode). */
  num: (value: number, digits?: number, signed?: boolean) => string;
  /** [2001, 2010] -> "2001–2010" */
  range: (r: [number, number]) => string;
  /** "2026-10-02" -> "2 Oct" / "২ অক্টো" */
  date: (iso: string) => string;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  // `?lang=bn` in the URL wins (handy for sharing a Bangla demo link), then the saved choice.
  const [lang, setLang] = useState<Lang>(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('lang');
    if (fromUrl === 'en' || fromUrl === 'bn') return fromUrl;
    return (localStorage.getItem('lang') as Lang) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const digits = (s: string) => (lang === 'bn' ? s.replace(/\d/g, (d) => BN_DIGITS[Number(d)]) : s);

  const num = (value: number, places = 0, signed = false) => {
    const rounded = Number(value.toFixed(places));
    let s = Math.abs(rounded).toFixed(places);
    if (rounded < 0) s = `−${s}`;
    else if (signed && rounded > 0) s = `+${s}`;
    return digits(s);
  };

  const value: LangValue = {
    lang,
    setLang,
    t: STRINGS[lang],
    num,
    range: ([a, b]) => digits(`${a}–${b}`),
    date: (iso) => new Date(iso).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-GB', { day: 'numeric', month: 'short' }),
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}
