import { useLang } from '../../lang.tsx';
import type { SeasonId } from '../../lib/fieldShift.ts';

/** Planet + orbit ring + leaf. Same artwork as public/favicon.svg. */
export function Logo({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <defs>
        <linearGradient id="logo-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d9f99d" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <ellipse cx="16" cy="16" rx="14" ry="5.6" transform="rotate(-28 16 16)" fill="none" stroke="url(#logo-g)" strokeWidth="1.6" />
      <circle cx="16" cy="16" r="7" fill="url(#logo-g)" />
      <path d="M16 20.8c-.2-3.8 1.4-6.8 4.7-8.4-.2 3.7-1.8 6.5-4.7 8.4Z" fill="#050913" />
      <path d="M15.6 20.5c-2.6-1-4-2.9-4.1-5.6 2.4.6 3.8 2.6 4.1 5.6Z" fill="#050913" opacity=".7" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <a href="#" className="flex items-center gap-2.5" aria-label="AgriOrbit home">
      <Logo />
      <span className="font-display text-lg font-semibold tracking-tight text-white">
        Agri<span className="text-lime-300">Orbit</span>
      </span>
    </a>
  );
}

export function LangToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-1 text-xs font-semibold" role="group" aria-label="Language">
      {(['en', 'bn'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`rounded-full px-3 py-1.5 transition ${lang === l ? 'bg-white text-ink-950' : 'text-slate-300 hover:text-white'}`}
        >
          {l === 'en' ? 'EN' : 'বাংলা'}
        </button>
      ))}
    </div>
  );
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
