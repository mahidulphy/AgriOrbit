import { ArrowRight, Flower2, Repeat, Sprout, SlidersHorizontal, Wheat } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SEASONS } from '../../lib/fieldShift.ts';
import { SEASON_COLOR, SectionHeader } from '../ui/ui.tsx';

const CROP_ICONS = { rabi: Flower2, kharif1: Sprout, kharif2: Wheat };
const RULE_ICONS = [Repeat, Sprout, SlidersHorizontal];

export function RotationSection() {
  const { t } = useLang();
  return (
    <section id="rotation" className="relative py-20 md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <SectionHeader eyebrow={t.rot.eyebrow} title={t.rot.title} sub={t.rot.sub} />
          <ul className="mt-8 space-y-4">
            {t.rot.rules.map((r, i) => {
              const Icon = RULE_ICONS[i];
              return (
                <li key={r.t} className="flex gap-4">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-lime-300/10 text-lime-300">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{r.t}</div>
                    <p className="text-sm leading-relaxed text-slate-400">{r.d}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="glass p-5 sm:p-7">
          <span className="chip text-slate-300">{t.rot.example}</span>
          <ol className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-stretch">
            {SEASONS.map((s, i) => {
              const Icon = CROP_ICONS[s];
              return (
                <li key={s} className="flex flex-1 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                  <div className="tile relative flex-1 overflow-hidden p-5">
                    <div className="absolute inset-x-0 top-0 h-1" style={{ background: SEASON_COLOR[s] }} />
                    <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: SEASON_COLOR[s] }}>
                      {t.season[s]}
                    </div>
                    <div className="text-xs text-slate-500">{t.seasonMonths[s]}</div>
                    <Icon className="mt-5 h-9 w-9 text-white" strokeWidth={1.4} />
                    <div className="mt-3 font-display text-lg font-semibold leading-tight text-white">{t.rot.crops[s]}</div>
                    <div className={`mt-2 text-xs ${s === 'kharif1' ? 'text-lime-300' : 'text-slate-400'}`}>{t.rot.families[s]}</div>
                  </div>
                  {i < 2 && <ArrowRight className="mx-auto h-5 w-5 shrink-0 rotate-90 text-slate-500 sm:rotate-0" />}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
