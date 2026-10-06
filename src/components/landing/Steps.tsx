import { Map, Satellite, Sprout } from 'lucide-react';
import { useLang } from '../../lang.tsx';

const ICONS = [Satellite, Map, Sprout];

/** Orbit → Region → Field */
export function Steps() {
  const { t } = useLang();
  return (
    <section className="relative py-16 md:py-20">
      <div className="container-x">
        <ol className="relative grid gap-4 md:grid-cols-3 md:gap-6">
          {/* connecting line (desktop) */}
          <div className="absolute left-[16%] right-[16%] top-9 hidden h-px bg-linear-to-r from-lime-300/0 via-lime-300/40 to-cyan-300/0 md:block" />
          {t.steps.map((s, i) => {
            const Icon = ICONS[i];
            return (
              <li key={s.k} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                <div className="relative grid h-[4.5rem] w-[4.5rem] shrink-0 place-items-center rounded-2xl border border-white/10 bg-ink-900 shadow-[0_0_40px_-10px_rgb(163_230_53/0.5)]">
                  <Icon className="h-7 w-7 text-lime-300" strokeWidth={1.6} />
                  <span className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-lime-300 text-xs font-bold text-ink-950">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">{s.k}</div>
                  <h3 className="mt-1 font-display text-xl font-semibold text-white">{s.t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 md:mx-auto md:max-w-xs">{s.d}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
