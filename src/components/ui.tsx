import React from 'react';
import type { Language } from '../types';

/** Small caps section label. Cyan = data/tech, lime = agriculture/decision. */
export const Eyebrow: React.FC<{
  children: React.ReactNode;
  tone?: 'cyan' | 'lime';
  className?: string;
}> = ({ children, tone = 'cyan', className = '' }) => (
  <p
    className={`text-xs font-semibold uppercase tracking-[0.14em] ${
      tone === 'cyan' ? 'text-[#00E5FF]' : 'text-[#B8FF3D]'
    } ${className}`}
  >
    {children}
  </p>
);

/** Hairline separator between sections. */
export const Rule: React.FC<{ className?: string }> = ({ className = '' }) => (
  <hr className={`border-white/10 ${className}`} />
);

/** Restrained suitability tier label. Words first, numbers secondary. */
export function tierLabel(
  tier: 'high' | 'moderate' | 'marginal',
  language: Language,
): string {
  if (tier === 'high') return language === 'en' ? 'High' : 'উচ্চ';
  if (tier === 'moderate') return language === 'en' ? 'Moderate' : 'মাঝারি';
  return language === 'en' ? 'Low' : 'কম';
}

export const TierBadge: React.FC<{
  tier: 'high' | 'moderate' | 'marginal';
  language: Language;
}> = ({ tier, language }) => {
  const tone =
    tier === 'high'
      ? 'bg-[#B8FF3D]/10 text-[#B8FF3D] border-[#B8FF3D]/30'
      : tier === 'moderate'
        ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'
        : 'bg-white/5 text-[#8FA3B8] border-white/10';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${tone}`}
    >
      {tierLabel(tier, language)}
    </span>
  );
};

/** Thin bar for scores and levels. */
export const Meter: React.FC<{
  value: number; // 0-100
  tone?: 'lime' | 'cyan';
  className?: string;
}> = ({ value, tone = 'lime', className = '' }) => (
  <div className={`h-1.5 rounded-full bg-white/10 overflow-hidden ${className}`}>
    <div
      className={`h-full rounded-full ${tone === 'lime' ? 'bg-[#B8FF3D]' : 'bg-[#00E5FF]'}`}
      style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
    />
  </div>
);

/** Label/value definition row for metadata panels. */
export const KV: React.FC<{ label: string; children: React.ReactNode }> = ({
  label,
  children,
}) => (
  <div className="flex items-baseline justify-between gap-4 py-1.5">
    <dt className="text-[11px] uppercase tracking-wider text-[#8FA3B8] shrink-0">{label}</dt>
    <dd className="text-sm text-white text-right">{children}</dd>
  </div>
);

/** Primary (lime) and secondary (outline) actions with restrained radius. */
export const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-bold text-sm transition cursor-pointer ${className}`}
    {...rest}
  />
);

export const GhostButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  className = '',
  ...rest
}) => (
  <button
    className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm transition cursor-pointer ${className}`}
    {...rest}
  />
);
