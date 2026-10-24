import React, { type ReactNode } from 'react';
import { useLang } from '../../lang.tsx';
import type { SeasonId } from '../../lib/fieldShift.ts';
import { LanguageToggle } from '../dashboard/LanguageToggle.tsx';

/** AgriOrbit brand logo image */
export function Logo({ className = 'h-8 sm:h-9 md:h-10 w-auto' }: { className?: string }) {
  return (
    <picture className="shrink-0 flex items-center">
      <source srcSet="/logo.webp" type="image/webp" />
      <source srcSet="/agriorbit-logo.webp" type="image/webp" />
      <img
        src="/logo.png"
        alt="AgriOrbit"
        className={`${className} object-contain mix-blend-screen shrink-0`}
        draggable={false}
      />
    </picture>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <a
      href="#"
      className={`inline-flex items-center shrink-0 group ${className || ''}`}
      aria-label="AgriOrbit"
    >
      <Logo />
    </a>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return <LanguageToggle language={lang} onLanguageChange={setLang} size="sm" showIcon={false} />;
}

/** One color per season, used consistently in every chart. */
export const SEASON_COLOR: Record<SeasonId, string> = {
  rabi: '#38bdf8', // cool winter teal/blue
  kharif1: '#fbbf24', // hot pre-monsoon amber
  kharif2: '#22d3ee', // monsoon cyan
};

/**
 * Diverging bar around a center line: warmer grows right (amber),
 * cooler grows left (blue). `max` is the value that fills half the track.
 */
export function DeltaBar({ value, max = 1 }: { value: number; max?: number }) {
  const pct = Math.min(1, Math.abs(value) / max) * 50;
  const warm = value >= 0;
  return (
    <div className="relative h-2 w-full rounded-full bg-[#262626]">
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-white/20" />
      <div
        className={`absolute inset-y-0 rounded-full ${warm ? 'bg-[#F59E0B]' : 'bg-[#38BDF8]'}`}
        style={warm ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  sub,
  center = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className="text-xs font-mono font-medium uppercase tracking-wider text-[#A3A3A3]">
        {eyebrow}
      </span>
      <h2 className="section-title mt-3">{title}</h2>
      {sub && <p className={`section-sub mt-3 ${center ? 'mx-auto' : ''}`}>{sub}</p>}
    </div>
  );
}

/** Standard clean card container: #141414 surface, 1px #262626 border, 12px rounded-xl */
export function Card({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 transition-colors duration-150 ${className}`}
    >
      {children}
    </div>
  );
}

/** Standard clean badge / chip: max 1 per card, subtle styling */
export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'warning' | 'danger';
  className?: string;
}) {
  const variantStyles = {
    default: 'border-[#262626] bg-white/5 text-[#A3A3A3]',
    accent: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
    warning: 'border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#F59E0B]',
    danger: 'border-[#EF4444]/30 bg-[#EF4444]/10 text-[#EF4444]',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono font-medium ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
