import { Satellite, ScrollText, UserCheck } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

const ICONS = [Satellite, ScrollText, UserCheck];

/** 01 NASA observes · 02 AgriOrbit explains · 03 The farmer decides */
export function WhySection() {
  const { t } = useLang();
  return (
    <section id="how" className="relative py-20 md:py-28">
      <div className="absolute inset-x-0 top-0 -z-10 h-full bg-linear-to-b from-transparent via-ink-900/60 to-transparent" />
      <div className="container-x">
        <SectionHeader eyebrow={t.why.eyebrow} title={t.why.title} center />
        <div className="mt-14 grid gap-5 md:grid-cols-3">
          {t.why.cards.map((c, i) => {
            const Icon = ICONS[i];
            const middle = i === 1;
            return (
              <article
                key={c.n}
                className={`glass relative flex flex-col p-7 ${middle ? 'border-lime-300/25 md:-translate-y-4 shadow-[0_30px_80px_-30px_rgb(163_230_53/0.35)]' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className={`grid h-12 w-12 place-items-center rounded-2xl ${middle ? 'bg-lime-300 text-ink-950' : 'bg-white/[0.06] text-lime-300'}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.7} />
                  </div>
                  <span className="font-display text-4xl font-bold text-white/10">{c.n}</span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-semibold text-white">{c.t}</h3>
                <p className="mt-3 leading-relaxed text-slate-400">{c.d}</p>
                {middle && (
                  <div className="mt-5 rounded-xl border border-white/10 bg-ink-950/80 p-4">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-lime-300">{t.why.exampleLabel}</div>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-[12.5px] leading-relaxed text-cyan-100">{t.why.example}</pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
