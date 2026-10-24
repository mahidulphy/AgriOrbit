import { ArrowRight, ArrowDown, Check } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { HeroCard } from './HeroCard.tsx';
import { IMAGES } from '../../data/assets.ts';

const SOURCES = ['NASA POWER', 'SMAP', 'MODIS', 'Open-Meteo', 'BARI & BRRI'];

export function Hero({
  conditions,
  shift,
  isLive = false,
}: {
  conditions: Conditions;
  shift: FieldShift;
  isLive?: boolean;
}) {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden min-h-[85vh] flex flex-col justify-center pt-24 pb-14 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24 border-b border-[#262626]">
      {/* Authentic documentary background image with dark scrim */}
      <div className="absolute inset-0 -z-20">
        <img
          src={IMAGES.heroAerial}
          alt="Agricultural fields"
          className="w-full h-full object-cover object-center"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 scrim-hero -z-10" />
      </div>

      <div className="container-x grid items-center gap-10 lg:gap-14 lg:grid-cols-[1.25fr_0.95fr] relative z-10">
        <div className="max-w-2xl">
          {/* Clean Headline */}
          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-[#FAFAFA] leading-[1.16]">
            {t.hero.title1}
            <br />
            <span className="text-[#22C55E]">{t.hero.title2}</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 text-base sm:text-lg leading-relaxed text-[#A3A3A3] max-w-xl">
            {t.hero.sub}
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={goAnalyze}
              className="btn btn-primary w-full sm:w-auto justify-center min-h-[44px] px-6 py-3 text-sm cursor-pointer"
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] text-sm font-medium text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors cursor-pointer px-4 py-2"
            >
              {t.hero.cta2}
              <ArrowDown className="h-4 w-4" />
            </a>
          </div>

          {/* Trust points */}
          <ul className="mt-8 flex flex-wrap gap-2.5 sm:gap-3 text-xs sm:text-sm font-mono text-[#A3A3A3]">
            {t.hero.trust.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#141414] border border-[#262626]"
              >
                <Check className="h-3.5 w-3.5 text-[#22C55E] stroke-[2.5] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Real Rangpur Snapshot Telemetry Card */}
        <div>
          <HeroCard conditions={conditions} shift={shift} isLive={isLive} />
        </div>
      </div>

      {/* Data source strip */}
      <div className="container-x mt-10 sm:mt-14 flex justify-center relative z-10">
        <a
          href="#data"
          className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full px-5 py-2 text-xs text-[#737373] hover:text-[#A3A3A3] font-mono border border-[#262626] bg-[#141414]/80 transition-colors cursor-pointer"
        >
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-6">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-[#404040]" />}
              <span>{s}</span>
            </span>
          ))}
        </a>
      </div>
    </section>
  );
}
