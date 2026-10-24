import { ArrowRight, ArrowDown, Check } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { HeroCard } from './HeroCard.tsx';
import { IMAGES } from '../../data/assets.ts';

const SOURCES = ['NASA POWER', 'SMAP', 'MODIS', 'Open-Meteo', 'BARI & BRRI'];

export function Hero({ conditions, shift, isLive = false }: { conditions: Conditions; shift: FieldShift; isLive?: boolean }) {
  const { t, lang } = useLang();

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
          {/* Eyebrow badge with subtle translucent glass */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#050B14]/85 border border-white/15 backdrop-blur-md shadow-sm mb-6 text-xs font-mono font-semibold tracking-wider text-[#00E5FF] uppercase">
            <span>{lang === 'bn' ? 'নাসার স্যাটেলাইট পর্যবেক্ষণ' : 'NASA Earth Observations'}</span>
            <span aria-hidden="true" className="text-white/40">×</span>
            <span>{lang === 'bn' ? 'বাংলাদেশ কৃষি' : 'Bangladesh Agriculture'}</span>
          </div>

          {/* Clean Modern Editorial Headline with enhanced text shadow */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] text-balance drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
            {t.hero.title1}
            <br />
            <span className="text-[#B8FF3D] drop-shadow-[0_0_20px_rgba(184,255,61,0.25)]">{t.hero.title2}</span>
          </h1>

          {/* Supporting Copy with subtle localized backdrop gradient */}
          <div className="mt-6 max-w-xl rounded-2xl bg-gradient-to-r from-[#050B14]/85 via-[#050B14]/50 to-transparent p-3.5 sm:p-4 -ml-3.5 sm:-ml-4 border-l-2 border-l-[#B8FF3D]/70 backdrop-blur-[2px]">
            <p className="text-base sm:text-lg leading-relaxed text-slate-100 font-normal drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]">
              {t.hero.sub}
            </p>
          </div>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <button onClick={goAnalyze} className="btn btn-primary px-7! py-3.5! text-base! cursor-pointer shadow-xl shadow-[#B8FF3D]/20">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] transition-colors cursor-pointer px-2 py-2"
            >
              {t.hero.cta2}
              <ArrowDown className="h-4 w-4 text-[#00E5FF]" />
            </a>
          </div>

          {/* Trust points with individual high-contrast translucent pills */}
          <ul className="mt-8 flex flex-wrap gap-2.5 sm:gap-3 text-xs sm:text-sm font-mono">
            {t.hero.trust.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#050B14]/85 border border-white/15 text-slate-100 font-medium backdrop-blur-md shadow-sm shadow-black/40 hover:border-white/30 transition-colors"
              >
                <span className="flex items-center justify-center w-4 h-4 rounded-full bg-[#B8FF3D]/20 border border-[#B8FF3D]/50 shrink-0">
                  <Check className="h-2.5 w-2.5 text-[#B8FF3D] stroke-[3]" />
                </span>
                <span className="drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Real Rangpur Snapshot Telemetry Card */}
        <div className="animate-rise [animation-delay:150ms]">
          <div className="animate-float">
            <HeroCard conditions={conditions} shift={shift} isLive={isLive} />
          </div>
        </div>
      </div>

      {/* Interactive data source strip linking to #data per requirement B.16 */}
      <div className="container-x mt-16 md:mt-20 flex justify-center relative z-10">
        <a
          href="#data"
          className="glass flex flex-wrap items-center justify-center gap-x-6 gap-y-2 rounded-full px-6 py-2.5 text-xs text-slate-300 font-mono border border-white/15 hover:text-white hover:border-[#00E5FF]/40 transition-colors group cursor-pointer shadow-lg shadow-black/40"
        >
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-6">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-white/30" />}
              <span className="drop-shadow-sm">{s}</span>
            </span>
          ))}
        </a>
      </div>
    </section>
  );
}
