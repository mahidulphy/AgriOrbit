import { useLang } from '../../lang.tsx';
import type { Conditions } from '../../lib/conditions.ts';
import type { FieldShift } from '../../lib/fieldShift.ts';

const SOURCES = ['NASA POWER', 'SMAP', 'MODIS', 'Open-Meteo', 'BARI & BRRI'];

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
  const dateRange = fromFormatted && toFormatted ? `${fromFormatted} – ${toFormatted}` : '';

  const tiles = [
    { label: t.heroCard.rain, value: num(c.rain30, 0), unit: lang === 'bn' ? 'মিমি' : 'mm' },
    { label: t.heroCard.heat, value: num(c.tMax30, 1), unit: lang === 'bn' ? '°সে' : '°C' },
    { label: t.heroCard.humidity, value: num(c.rh, 0), unit: '%' },
    { label: t.heroCard.et0, value: num(c.et0, 1), unit: lang === 'bn' ? 'মিমি/দিন' : 'mm/d' },
  ];

  return (
    <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 shadow-none">
      {/* Header: "রংপুর · নাসা পাওয়ার" and date range */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-[#262626]">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="h-2 w-2 rounded-full bg-[#22C55E] shrink-0" title="Live" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-[#737373] shrink-0" />
          )}
          <span className="font-display text-base sm:text-lg font-semibold text-[#FAFAFA]">
            {t.heroCard.place} · {lang === 'bn' ? 'নাসা পাওয়ার' : 'NASA POWER'}
          </span>
        </div>
        {dateRange && (
          <span className="text-xs sm:text-sm font-mono text-[#A3A3A3] whitespace-nowrap">
            {dateRange}
          </span>
        )}
      </div>

      {/* 2×2 grid: 30-Day Rain, Max Day Temp, Relative Humidity, Crop Water Need (Big number, small label, nothing else) */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4">
        {tiles.map(({ label, value, unit }) => (
          <div key={label} className="p-3.5 sm:p-4 rounded-lg bg-[#0A0A0A] border border-[#262626]">
            <div className="text-sm font-medium text-[#A3A3A3]">
              {label}
            </div>
            <div className="mt-2 font-display text-2xl sm:text-3xl font-semibold text-[#FAFAFA] tracking-tight">
              {value}
              <span className="ml-1 text-xs sm:text-sm font-normal text-[#A3A3A3] font-sans">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: "দুই দশকের আবহাওয়া বদল দেখুন →" link to #field-shift + separate outline chips for sources with gaps */}
      <div className="mt-5 pt-4 border-t border-[#262626] flex flex-col gap-3">
        <a
          href="#field-shift"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#A3A3A3] hover:text-[#FAFAFA] transition-colors cursor-pointer"
        >
          <span>{t.heroCard.shiftLink}</span>
          <span aria-hidden="true">&rarr;</span>
        </a>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <a
            href="#data"
            className="text-xs text-[#737373] hover:text-[#A3A3A3] mr-1 transition-colors cursor-pointer"
            title={lang === 'bn' ? 'তথ্যসূত্র দেখুন' : 'View Data Sources'}
          >
            {lang === 'bn' ? 'উৎস:' : 'Sources:'}
          </a>
          {SOURCES.map((s) => (
            <a
              key={s}
              href="#data"
              className="px-2 py-0.5 rounded text-xs font-mono text-[#A3A3A3] bg-[#0A0A0A] border border-[#262626] hover:border-[#404040] hover:text-[#FAFAFA] transition-colors cursor-pointer"
            >
              {s}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
