import { CloudRain, Droplets, MapPin, Sprout, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';

/** Real Rangpur numbers from the bundled NASA POWER snapshot, never invented. */
export function HeroCard({ conditions: c, isLive = false }: { conditions: Conditions; shift: FieldShift; isLive?: boolean }) {
  const { t, num, date, lang } = useLang();

  const toYear = c?.to ? c.to.slice(0, 4) : '';
  const fromFormatted = c?.from ? date(c.from) : '';
  const toFormatted = c?.to
    ? `${date(c.to)}${toYear ? ` ${lang === 'bn' ? toYear.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]) : toYear}` : ''}`
    : '';
  const snapshotDateLabel =
    fromFormatted && toFormatted ? t.heroCard.now(fromFormatted, toFormatted) : t.heroCard.unavailable;
  const liveDateLabel =
    fromFormatted && toFormatted ? t.heroCard.live(fromFormatted, toFormatted) : 'NASA POWER';
  const headerLabel = isLive ? liveDateLabel : snapshotDateLabel;

  const tiles = [
    { icon: CloudRain, label: t.heroCard.rain, value: num(c.rain30, 0), unit: lang === 'bn' ? 'মিমি' : 'mm', desc: t.heroCard.rainDesc, tint: 'text-cyan-300' },
    { icon: Thermometer, label: t.heroCard.heat, value: num(c.tMax30, 1), unit: lang === 'bn' ? '°সে' : '°C', desc: t.heroCard.heatDesc, tint: 'text-amber-300' },
    { icon: Droplets, label: t.heroCard.humidity, value: num(c.rh, 0), unit: '%', desc: t.heroCard.humidityDesc, tint: 'text-sky-300' },
    { icon: Sprout, label: t.heroCard.et0, value: num(c.et0, 1), unit: lang === 'bn' ? 'মিমি/দিন' : 'mm/d', desc: t.heroCard.et0Desc, tint: 'text-lime-300' },
  ];

  return (
    <div className="glass p-4 sm:p-6 shadow-2xl border-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display text-lg font-semibold text-white shrink-0">
          <MapPin className="h-4 w-4 text-lime-300" />
          {t.heroCard.place}
        </div>
        <span
          className={`chip whitespace-nowrap transition-colors duration-300 ${
            isLive ? 'border-lime-300/40 bg-lime-300/10 text-lime-200' : 'text-slate-300'
          }`}
        >
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#B8FF3D] animate-pulse shrink-0" />}
          {headerLabel}
        </span>
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

      {/* Small text link to #field-shift (not looking like a button) */}
      <div className="mt-3.5 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <span className="text-slate-300 font-medium">{t.heroCard.shiftTeaser}</span>
        <a
          href="#field-shift"
          className="inline-flex items-center gap-1 font-mono text-xs text-[#00E5FF] hover:underline transition-colors cursor-pointer"
        >
          <span>{t.heroCard.shiftLink}</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-1.5 sm:gap-2">
        <span className="truncate">{t.heroCard.source(date(c.from), date(c.to))}</span>
        <span className="font-mono text-cyan-300/90 text-[11px] whitespace-nowrap shrink-0">{num(c.rain30, 0)} {lang === 'bn' ? 'মিমি বৃষ্টি' : 'mm Rain'} · {num(c.rh, 0)}% {lang === 'bn' ? 'আর্দ্রতা' : 'RH'}</span>
      </div>
    </div>
  );
}
