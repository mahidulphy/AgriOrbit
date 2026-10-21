import { CloudRain, Droplets, MapPin, Sprout, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';

/** Real Rangpur numbers from the bundled NASA POWER snapshot, never invented. */
export function HeroCard({ conditions: c }: { conditions: Conditions; shift: FieldShift }) {
  const { t, num, date } = useLang();

  const tiles = [
    { icon: CloudRain, label: t.heroCard.rain, value: num(c.rain30, 0), unit: 'mm', desc: t.heroCard.rainDesc, tint: 'text-cyan-300' },
    { icon: Thermometer, label: t.heroCard.heat, value: num(c.tMax30, 1), unit: '°C', desc: t.heroCard.heatDesc, tint: 'text-amber-300' },
    { icon: Droplets, label: t.heroCard.humidity, value: num(c.rh, 0), unit: '%', desc: t.heroCard.humidityDesc, tint: 'text-sky-300' },
    { icon: Sprout, label: t.heroCard.et0, value: num(c.et0, 1), unit: 'mm/d', desc: t.heroCard.et0Desc, tint: 'text-lime-300' },
  ];

  return (
    <div className="glass p-5 sm:p-6 shadow-2xl border-white/10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <MapPin className="h-4 w-4 text-lime-300" />
          {t.heroCard.place}
        </div>
        <span className="chip text-slate-300">{t.heroCard.now}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tiles.map(({ icon: Icon, label, value, unit, desc, tint }) => (
          <div key={label} className="tile p-3.5 bg-[#050B14]/90 border-white/10">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <Icon className={`h-3.5 w-3.5 ${tint}`} />
              {label}
            </div>
            <div className="mt-1.5 font-display text-2xl font-bold text-white">
              {value}
              <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400 font-mono">
              {desc}
            </div>
          </div>
        ))}
      </div>

      {/* Concise teaser link to #field-shift per requirement B.12 */}
      <a
        href="#field-shift"
        className="tile mt-3 p-3.5 bg-[#050B14]/90 border-white/10 flex items-center justify-between text-xs text-slate-300 hover:text-white hover:border-[#00E5FF]/40 transition-colors group cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#00E5FF] group-hover:scale-125 transition-transform" />
          <span className="font-medium text-slate-200">{t.heroCard.shiftTeaser}</span>
        </div>
        <span className="font-mono text-[#00E5FF] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
          {t.heroCard.shiftLink} &rarr;
        </span>
      </a>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>{t.heroCard.source(date(c.from), date(c.to))}</span>
        <span className="font-mono text-cyan-300/90 text-[11px]">{num(c.rain30, 0)} mm Rain · {num(c.rh, 0)}% RH</span>
      </div>
    </div>
  );
}
