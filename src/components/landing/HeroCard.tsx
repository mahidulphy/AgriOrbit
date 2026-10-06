import { CloudRain, Droplets, MapPin, Sprout, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';
import { DeltaBar, SEASON_COLOR } from '../ui/ui.tsx';

/** Real Rangpur numbers from the bundled NASA POWER snapshot, never invented. */
export function HeroCard({ conditions: c, shift }: { conditions: Conditions; shift: FieldShift }) {
  const { t, num, range, date } = useLang();

  const tiles = [
    { icon: CloudRain, label: t.heroCard.rain, value: num(c.rain30, 0), unit: 'mm', tint: 'text-cyan-300' },
    { icon: Thermometer, label: t.heroCard.heat, value: num(c.tMax30, 1), unit: '°C', tint: 'text-amber-300' },
    { icon: Droplets, label: t.heroCard.humidity, value: num(c.rh, 0), unit: '%', tint: 'text-sky-300' },
    { icon: Sprout, label: t.heroCard.et0, value: num(c.et0, 1), unit: 'mm/d', tint: 'text-lime-300' },
  ];

  return (
    <div className="glass p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-white">
          <MapPin className="h-4 w-4 text-lime-300" />
          {t.heroCard.place}
        </div>
        <span className="chip text-slate-300">{t.heroCard.now}</span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tiles.map(({ icon: Icon, label, value, unit, tint }) => (
          <div key={label} className="tile p-3.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Icon className={`h-3.5 w-3.5 ${tint}`} />
              {label}
            </div>
            <div className="mt-1.5 font-display text-2xl font-semibold text-white">
              {value}
              <span className="ml-1 text-sm font-medium text-slate-400">{unit}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="tile mt-3 p-4">
        <div className="text-xs font-medium text-slate-400">{t.heroCard.shift(range(shift.thenRange), range(shift.nowRange))}</div>
        <div className="mt-3 space-y-3">
          {shift.seasons.map((s) => (
            <div key={s.season} className="grid grid-cols-[4.5rem_1fr_3.75rem] items-center gap-3 text-sm">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="h-2 w-2 rounded-full" style={{ background: SEASON_COLOR[s.season] }} />
                {t.season[s.season]}
              </span>
              <DeltaBar value={s.dTemp} max={1} />
              <span className={`text-right font-semibold tabular-nums ${s.dTemp >= 0 ? 'text-amber-300' : 'text-sky-300'}`}>
                {num(s.dTemp, 1, true)}°
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-[11px] text-slate-500">{t.heroCard.source(date(c.to))}</p>
    </div>
  );
}
