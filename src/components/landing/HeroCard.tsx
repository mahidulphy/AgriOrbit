import { CloudRain, Droplets, MapPin, Sprout, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';

/** Real Rangpur numbers from the bundled NASA POWER snapshot, never invented. */
export function HeroCard({
  conditions: c,
  isLive = false,
}: {
  conditions: Conditions;
  shift: FieldShift;
  isLive?: boolean;
}) {
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
    { icon: CloudRain, label: t.heroCard.rain, value: num(c.rain30, 0), unit: lang === 'bn' ? 'মিমি' : 'mm', desc: t.heroCard.rainDesc },
    { icon: Thermometer, label: t.heroCard.heat, value: num(c.tMax30, 1), unit: lang === 'bn' ? '°সে' : '°C', desc: t.heroCard.heatDesc },
    { icon: Droplets, label: t.heroCard.humidity, value: num(c.rh, 0), unit: '%', desc: t.heroCard.humidityDesc },
    { icon: Sprout, label: t.heroCard.et0, value: num(c.et0, 1), unit: lang === 'bn' ? 'মিমি/দিন' : 'mm/d', desc: t.heroCard.et0Desc },
  ];

  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 shadow-none">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 font-display text-base sm:text-lg font-semibold text-[#FAFAFA] shrink-0">
          <MapPin className="h-4 w-4 text-[#22C55E]" />
          {t.heroCard.place}
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-[#262626] bg-[#0A0A0A] text-xs font-mono text-[#A3A3A3] whitespace-nowrap">
          {isLive && <span className="h-1.5 w-1.5 rounded-full bg-[#22C55E] shrink-0" />}
          {headerLabel}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {tiles.map(({ icon: Icon, label, value, unit, desc }) => (
          <div key={label} className="p-3.5 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="flex items-center gap-1.5 text-xs text-[#A3A3A3]">
              <Icon className="h-3.5 w-3.5 text-[#737373]" />
              {label}
            </div>
            <div className="mt-1.5 font-display text-xl sm:text-2xl font-semibold text-[#FAFAFA]">
              {value}
              <span className="ml-1 text-xs font-normal text-[#737373]">{unit}</span>
            </div>
            <div className="mt-0.5 text-[10px] text-[#737373] font-mono">
              {desc}
            </div>
          </div>
        ))}
      </div>

      {/* Small text link to #field-shift */}
      <div className="mt-4 pt-3.5 border-t border-[#262626] flex items-center justify-between text-xs">
        <span className="text-[#A3A3A3] font-medium">{t.heroCard.shiftTeaser}</span>
        <a
          href="#field-shift"
          className="inline-flex items-center gap-1 font-mono text-xs text-[#FAFAFA] hover:text-[#22C55E] transition-colors cursor-pointer"
        >
          <span>{t.heroCard.shiftLink}</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>

      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#737373] gap-1.5">
        <span className="truncate">{t.heroCard.source(date(c.from), date(c.to))}</span>
        <span className="font-mono text-[#A3A3A3] whitespace-nowrap shrink-0">
          {num(c.rain30, 0)} {lang === 'bn' ? 'মিমি বৃষ্টি' : 'mm Rain'} · {num(c.rh, 0)}% {lang === 'bn' ? 'আর্দ্রতা' : 'RH'}
        </span>
      </div>
    </div>
  );
}
