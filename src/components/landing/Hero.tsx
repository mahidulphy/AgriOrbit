import { ArrowRight, Check } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { HeroCard } from './HeroCard.tsx';

const SOURCES = ['NASA POWER', 'SMAP', 'MODIS', 'Open-Meteo', 'BARI'];

export function Hero({ conditions, shift }: { conditions: Conditions; shift: FieldShift }) {
  const { t } = useLang();

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
      {/* Space backdrop */}
      <div className="stars absolute inset-0 -z-10 opacity-70" />
      <div className="grid-fade absolute inset-0 -z-10" />
      <div className="horizon absolute inset-x-0 bottom-0 -z-10 h-[70%]" />
      {/* Glowing Earth rim */}
      <div
        className="absolute left-1/2 top-[88%] -z-10 aspect-square w-[180%] -translate-x-1/2 rounded-full bg-ink-950 md:w-[140%]"
        style={{ boxShadow: '0 -1px 0 rgb(186 230 253 / 0.55), 0 -40px 140px rgb(34 211 238 / 0.35), inset 0 40px 120px rgb(34 211 238 / 0.12)' }}
      />

      <div className="container-x grid items-center gap-14 lg:grid-cols-[1.35fr_0.9fr]">
        <div className="animate-rise">
          <span className="chip border-lime-300/30 bg-lime-300/10 text-lime-200">
            <span className="live-dot" />
            {t.hero.badge}
          </span>

          <h1 className="mt-6 font-display text-[2.6rem] font-bold leading-[1.04] tracking-[-0.035em] text-white sm:text-6xl lg:text-[3.9rem] xl:text-[4.3rem]">
            {t.hero.title1}
            <br />
            <span className="text-gradient">{t.hero.title2}</span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">{t.hero.sub}</p>

          <div className="mt-9 flex flex-wrap gap-3">
            <button onClick={goAnalyze} className="btn btn-primary">
              {t.hero.cta}
              <ArrowRight className="h-4 w-4" />
            </button>
            <a href="#field-shift" className="btn btn-ghost">
              {t.hero.cta2}
            </a>
          </div>

          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
            {t.hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-lime-300" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise [animation-delay:150ms]">
          <div className="animate-float">
            <HeroCard conditions={conditions} shift={shift} />
          </div>
        </div>
      </div>

      {/* Data source strip */}
      <div className="container-x mt-20 flex justify-center md:mt-24">
        <div className="glass flex flex-wrap items-center justify-center gap-x-5 gap-y-2 rounded-full! px-6 py-3 text-sm text-slate-300">
          {SOURCES.map((s, i) => (
            <span key={s} className="flex items-center gap-5">
              {i > 0 && <span className="h-1 w-1 rounded-full bg-slate-600" />}
              {s}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
