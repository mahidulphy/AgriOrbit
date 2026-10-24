import { ArrowRight, Check } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { HeroCard } from './HeroCard.tsx';
import { IMAGES } from '../../data/assets.ts';

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
    <section className="relative isolate overflow-hidden min-h-[80vh] flex flex-col justify-center py-12 sm:py-16 lg:py-20 bg-[#0A0A0A] border-b border-[#262626]">
      {/* Background photography: dropped on mobile to maintain 100% solid #0A0A0A contrast; desktop has solid fade on left 55% */}
      <div className="hidden sm:block absolute inset-0 -z-20 pointer-events-none select-none">
        <img
          src={IMAGES.heroAerial}
          alt="Agricultural fields"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-right"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A] via-55% to-[#0A0A0A]/40 -z-10" />
      </div>

      <div className="container-x grid items-center gap-10 lg:gap-12 lg:grid-cols-[1.2fr_1fr] relative z-10">
        {/* Left Column (~55%) */}
        <div className="max-w-2xl">
          {/* Eyebrow: "NASA Space Apps 2026 · Bangladesh" (one line, muted) */}
          <div className="text-xs sm:text-sm font-mono text-[#A3A3A3] tracking-wider uppercase mb-3 sm:mb-4">
            {t.hero.eyebrow}
          </div>

          {/* Heading: 40–48px semibold white, max 2 lines (28–32px on mobile) */}
          <h1 className="font-display text-[28px] sm:text-[38px] lg:text-[44px] font-semibold tracking-tight text-[#FAFAFA] leading-[1.2] sm:leading-[1.25]">
            {t.hero.title1}
            <br className="hidden sm:inline" />{' '}
            {t.hero.title2}
          </h1>

          {/* Subtitle: 2 lines max in #A3A3A3 */}
          <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-[#A3A3A3] max-w-xl">
            {t.hero.sub}
          </p>

          {/* Buttons: Primary "আমার জমি যাচাই করুন" (solid green #22C55E) + text link "কীভাবে কাজ করে দেখুন →" */}
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-5">
            <button
              onClick={goAnalyze}
              className="btn btn-primary w-full sm:w-auto justify-center min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#22C55E] text-black hover:bg-[#16a34a] transition-colors cursor-pointer"
            >
              {t.hero.cta}
              <ArrowRight className="h-4 w-4 ml-1" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-1.5 min-h-[44px] text-sm font-medium text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors cursor-pointer px-2 py-2"
            >
              <span>{t.hero.cta2}</span>
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Bullets: 3 trust points as a horizontal row of checkmarks (#A3A3A3, min 14px/16px) */}
          <ul className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm sm:text-base text-[#A3A3A3]">
            {t.hero.trust.map((item) => (
              <li key={item} className="inline-flex items-center gap-2">
                <Check className="h-4 w-4 text-[#22C55E] stroke-[2.5] shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right Column (~45%): One clean "live data" card */}
        <div className="w-full">
          <HeroCard conditions={conditions} shift={shift} isLive={isLive} />
        </div>
      </div>
    </section>
  );
}
