import { BookOpen, CloudRain, CloudSun, Droplets, History, Leaf } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

const ICONS = [CloudRain, History, Droplets, Leaf, CloudSun, BookOpen];

export function DataSection() {
  const { t } = useLang();

  const status = {
    live: { label: t.data.live, cls: 'border-lime-300/30 bg-lime-300/10 text-lime-200', dot: <span className="live-dot" /> },
    snapshot: { label: t.data.snapshot, cls: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200', dot: <span className="h-2 w-2 rounded-full bg-cyan-300" /> },
    guidance: { label: t.data.guidance, cls: 'border-white/15 bg-white/5 text-slate-300', dot: <span className="h-2 w-2 rounded-full bg-slate-400" /> },
  };

  return (
    <section id="data" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeader eyebrow={t.data.eyebrow} title={t.data.title} sub={t.data.sub} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.data.items.map((item, i) => {
            const Icon = ICONS[i];
            const s = status[item.status];
            return (
              <article key={item.name} className="glass group p-6 transition hover:border-white/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06] text-cyan-300 transition group-hover:text-lime-300">
                    <Icon className="h-5 w-5" strokeWidth={1.7} />
                  </div>
                  <span className={`chip ${s.cls}`}>
                    {s.dot}
                    {s.label}
                  </span>
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{item.name}</h3>
                <p className="mt-1 text-sm font-medium text-slate-200">{item.what}</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.how}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
