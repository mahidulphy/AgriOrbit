import { ArrowRight, ArrowDown, Check } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { HeroCard } from './HeroCard.tsx';
import { IMAGES } from '../../data/assets.ts';

const SOURCES = ['NASA POWER', 'SMAP', 'MODIS', 'Open-Meteo', 'BARI'];

export function Hero({ conditions, shift }: { conditions: Conditions; shift: FieldShift }) {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden min-h-[90vh] flex flex-col justify-center pt-28 pb-20 md:pt-36 md:pb-28 border-b border-white/10">
      {/* Full-bleed authentic documentary background image */}
      <div className="absolute inset-0 -z-20">
        <img
          src={IMAGES.heroAerial}
          alt="Bangladesh Riverine Agricultural Plains"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 scrim-hero -z-10" />
      </div>

      <div className="container-x grid items-center gap-12 lg:gap-16 lg:grid-cols-[1.3fr_0.9fr] relative z-10">
        <div className="animate-rise max-w-2xl">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 text-xs font-mono font-semibold tracking-wider text-[#00E5FF] uppercase mb-6">
            <span>NASA Earth Observations</span>
            <span aria-hidden="true" className="text-white/30">×</span>
            <span>Bangladesh Agriculture</span>
          </div>

          {/* Clean Modern Editorial Headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] text-balance">
            {t.hero.title1}
            <br />
            <span className="text-[#B8FF3D]">{t.hero.title2}</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-[#8FA3B8] font-normal">
            {t.hero.sub}
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={goAnalyze} className="btn btn-primary px-7! py-3.5! text-base! cursor-pointer shadow-xl shadow-[#B8FF3D]/20">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#story" className="btn btn-ghost px-6! py-3.5! text-sm! flex items-center gap-2 cursor-pointer">
              {t.hero.cta2}
              <ArrowDown className="h-4 w-4 text-[#00E5FF]" />
            </a>
          </div>

          {/* Trust points */}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs sm:text-sm text-[#8FA3B8] font-mono">
            {t.hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-[#B8FF3D]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Real Rangpur Snapshot Telemetry Card */}
        <div className="animate-rise [animation-delay:150ms]">
          <div className="animate-float">
            <HeroCard conditions={conditions} shift={shift} />
          </div>
        </div>
      </div>

      {/* Data source strip */}
      <div className="container-x mt-16 md:mt-20 flex justify-center relative z-10">
        <div className="glass flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full px-6 py-2.5 text-xs text-[#8FA3B8] font-mono border border-white/10">
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-6">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-white/20" />}
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
