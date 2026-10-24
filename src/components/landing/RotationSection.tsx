import { ArrowRight, Flower2, Repeat, Sprout, SlidersHorizontal, Wheat } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SEASONS } from '../../lib/fieldShift.ts';
import { SectionHeader } from '../ui/ui.tsx';

const CROP_ICONS = { rabi: Flower2, kharif1: Sprout, kharif2: Wheat };
const RULE_ICONS = [Repeat, Sprout, SlidersHorizontal];

export function RotationSection() {
  const { t, lang } = useLang();
  return (
    <section id="rotation" className="relative py-20 md:py-28 border-b border-[#262626]">
      <div className="container-x grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader eyebrow={t.rot.eyebrow} title={t.rot.title} sub={t.rot.sub} />
          <ul className="mt-8 space-y-4">
            {t.rot.rules.map((r, i) => {
              const Icon = RULE_ICONS[i];
              return (
                <li key={r.t} className="flex gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#141414] border border-[#262626] text-[#22C55E]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-semibold text-[#FAFAFA] text-sm">{r.t}</div>
                    <p className="mt-1 text-xs leading-relaxed text-[#A3A3A3]">{r.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-7">
          <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-[#262626] bg-[#0A0A0A] text-xs font-mono text-[#A3A3A3]">
            {t.rot.example}
          </span>
          <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch list-none p-0 m-0">
            {SEASONS.map((s, i) => {
              const Icon = CROP_ICONS[s];
              return (
                <li key={s} className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1 rounded-lg border border-[#262626] bg-[#0A0A0A] p-5">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-mono font-medium uppercase tracking-wider text-[#A3A3A3]">
                        {t.season[s]}
                      </div>
                      <span className="font-mono text-xs font-semibold text-[#737373]">
                        {lang === 'bn' ? `০${i + 1}`.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]) : `0${i + 1}`}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#737373] mt-0.5">{t.seasonMonths[s]}</div>
                    <Icon className="mt-5 h-8 w-8 text-[#FAFAFA]" strokeWidth={1.5} />
                    <div className="mt-3 font-display text-base font-semibold text-[#FAFAFA]">{t.rot.crops[s]}</div>
                    <div className={`mt-1.5 text-xs font-mono ${s === 'kharif1' ? 'text-[#22C55E]' : 'text-[#737373]'}`}>
                      {t.rot.families[s]}
                    </div>
                  </div>
                  {i < 2 && <ArrowRight className="mx-auto h-4 w-4 shrink-0 rotate-90 text-[#737373] sm:rotate-0" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
