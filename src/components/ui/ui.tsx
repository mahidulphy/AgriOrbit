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
  rabi: '#93c5fd', // cool winter blue
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
    <div className="relative h-2 w-full rounded-full bg-white/[0.06]">
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-white/25" />
      <div
        className={`absolute inset-y-0 rounded-full ${warm ? 'bg-linear-to-r from-amber-300/70 to-amber-400' : 'bg-linear-to-l from-sky-300/70 to-sky-400'}`}
        style={warm ? { left: '50%', width: `${pct}%` } : { right: '50%', width: `${pct}%` }}
      />
    </div>
  );
}

export function SectionHeader({ eyebrow, title, sub, center = false }: { eyebrow: string; title: string; sub?: string; center?: boolean }) {
  return (
    <div className={center ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl'}>
      <span className="eyebrow">
        <span className="h-px w-6 bg-lime-300/60" />
        {eyebrow}
      </span>
      <h2 className="section-title mt-4">{title}</h2>
      {sub && <p className={`section-sub mt-4 ${center ? 'mx-auto' : ''}`}>{sub}</p>}
    </div>
  );
}
