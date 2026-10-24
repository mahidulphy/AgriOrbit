import { Satellite, ScrollText, UserCheck } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

const ICONS = [Satellite, ScrollText, UserCheck];

/** 01 NASA observes · 02 AgriOrbit explains · 03 The farmer decides */
export function WhySection() {
  const { t } = useLang();
  return (
    <section id="how" className="relative py-20 md:py-28 border-b border-[#262626] scroll-mt-16">
      <div className="container-x">
        <SectionHeader eyebrow={t.why.eyebrow} title={t.why.title} center />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {t.why.cards.map((c, i) => {
            const Icon = ICONS[i];
            const middle = i === 1;
            return (
              <article
                key={c.n}
                className="flex flex-col justify-between rounded-xl border border-[#262626] bg-[#141414] p-6 sm:p-7 transition-colors duration-150 hover:border-[#404040]"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#22C55E]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <span className="font-mono text-xl font-semibold text-[#737373]">{c.n}</span>
                  </div>
                  <h3 className="mt-5 font-display text-xl font-semibold text-[#FAFAFA]">{c.t}</h3>
                  <p className="mt-2.5 leading-relaxed text-sm text-[#A3A3A3]">{c.d}</p>
                </div>
                {middle && (
                  <div className="mt-6 rounded-lg border border-[#262626] bg-[#0A0A0A] p-3.5">
                    <div className="text-[10px] font-mono font-medium uppercase tracking-wider text-[#737373]">{t.why.exampleLabel}</div>
                    <pre className="mt-2 whitespace-pre-wrap font-mono text-xs leading-relaxed text-[#A3A3A3]">{t.why.example}</pre>
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
