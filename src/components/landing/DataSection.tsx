import { BookOpen, CloudRain, CloudSun, Droplets, History, Leaf, Radar } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';

const ICONS = [CloudRain, History, Droplets, Leaf, Radar, CloudSun, BookOpen];

export function DataSection() {
  const { t } = useLang();

  const status = {
    live: {
      label: t.data.live,
      cls: 'border-[#22C55E]/30 bg-[#22C55E]/10 text-[#22C55E]',
      dot: <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />,
    },
    snapshot: {
      label: t.data.snapshot,
      cls: 'border-[#262626] bg-[#0A0A0A] text-[#A3A3A3]',
      dot: <span className="h-1.5 w-1.5 rounded-full bg-[#A3A3A3]" />,
    },
    guidance: {
      label: t.data.guidance,
      cls: 'border-[#262626] bg-[#0A0A0A] text-[#737373]',
      dot: <span className="h-1.5 w-1.5 rounded-full bg-[#737373]" />,
    },
  };

  return (
    <section id="data" className="relative py-20 md:py-28 border-b border-[#262626]">
      <div className="container-x">
        <SectionHeader eyebrow={t.data.eyebrow} title={t.data.title} sub={t.data.sub} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.data.items.map((item, i) => {
            const Icon = ICONS[i];
            const s = status[item.status];
            return (
              <article
                key={item.name}
                className="rounded-xl border border-[#262626] bg-[#141414] p-6 transition-colors duration-150 hover:border-[#404040] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-[#0A0A0A] border border-[#262626] text-[#A3A3A3]">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono font-medium border ${s.cls}`}>
                      {s.dot}
                      {s.label}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-base font-semibold text-[#FAFAFA]">{item.name}</h3>
                  <p className="mt-1 text-sm font-medium text-[#A3A3A3]">{item.what}</p>
                </div>
                <p className="mt-3 text-xs leading-relaxed text-[#737373]">{item.how}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
