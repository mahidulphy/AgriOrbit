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
      {/* Background photography: responsive layered gradient overlays for optimal contrast and landscape visibility */}
      <div className="absolute inset-0 -z-20 pointer-events-none select-none overflow-hidden">
        <img
          src={IMAGES.heroAerial}
          alt="Agricultural fields"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-center lg:object-right"
        />
        {/* Layer 1: Ambient darkening across entire hero to soften bright sky and sunlight glare */}
        <div className="absolute inset-0 bg-[#0A0A0A]/40" />

        {/* Layer 2: Mobile & Tablet vertical gradient (< lg): heavily protects stacked text on top (90-95%) */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/95 via-[#0A0A0A]/85 to-[#0A0A0A]/90 lg:hidden" />

        {/* Layer 3: Desktop directional horizontal gradient (>= lg): deep solid charcoal behind text (left 50%), transitioning to ~35% on right so fields stay vibrant */}
        <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-[#0A0A0A] via-[#0A0A0A] via-50% to-[#0A0A0A]/35" />

        {/* Layer 4: Top/bottom edge vignettes for seamless blending with navigation and section dividers */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A0A]/70 via-transparent via-20% to-[#0A0A0A]" />
      </div>

      <div className="container-x grid items-center gap-10 lg:gap-12 lg:grid-cols-[1.2fr_1fr] relative z-10">
        {/* Left Column (~55%) */}
        <div className="max-w-2xl">
          {/* Eyebrow: "NASA Space Apps 2026 · Bangladesh" (readable, distinct badge without competing with heading) */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#141414]/90 border border-[#2E2E2E] text-xs sm:text-sm font-mono font-medium text-[#E5E7EB] tracking-wider uppercase mb-3 sm:mb-4 shadow-xs backdrop-blur-xs">
            <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />
            <span>{t.hero.eyebrow}</span>
          </div>

          {/* Heading: high-contrast white text with subtle shadow */}
          <h1 className="font-display text-[28px] sm:text-[38px] lg:text-[44px] font-semibold tracking-tight text-white leading-[1.2] sm:leading-[1.25] drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
            {t.hero.title1}
            <br className="hidden sm:inline" />{' '}
            {t.hero.title2}
          </h1>

          {/* Subtitle: high-contrast #F3F4F6 text with subtle shadow */}
          <p className="mt-4 sm:mt-5 text-base sm:text-lg leading-relaxed text-[#F3F4F6] max-w-xl font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
            {t.hero.sub}
          </p>

          {/* Buttons: Primary "আমার জমি যাচাই করুন" (solid green #22C55E) + secondary CTA "কীভাবে কাজ করে দেখুন →" with accessible translucent treatment */}
          <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <button
              onClick={goAnalyze}
              className="btn btn-primary w-full sm:w-auto justify-center min-h-[44px] px-6 py-2.5 text-sm font-semibold rounded-lg bg-[#22C55E] text-black hover:bg-[#16a34a] active:bg-[#15803d] transition-all cursor-pointer shadow-md shadow-[#22C55E]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            >
              <span>{t.hero.cta}</span>
              <ArrowRight className="h-4 w-4 ml-1.5" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold rounded-lg text-[#F3F4F6] bg-[#1C1C1C]/85 hover:bg-[#262626] active:bg-[#333333] border border-[#383838] hover:border-[#525252] transition-all backdrop-blur-sm cursor-pointer shadow-sm group hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#22C55E] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0A0A]"
            >
              <span>{t.hero.cta2}</span>
              <ArrowRight className="h-4 w-4 text-[#F3F4F6] group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {/* Bullets: 3 trust points with green check pill badges and high-contrast #E5E7EB text */}
          <ul className="mt-8 sm:mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm sm:text-base text-[#E5E7EB] font-medium">
            {t.hero.trust.map((item) => (
              <li key={item} className="inline-flex items-center gap-2.5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#22C55E]/15 border border-[#22C55E]/30 shrink-0">
                  <Check className="h-3 w-3 text-[#22C55E] stroke-[3]" />
                </span>
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
