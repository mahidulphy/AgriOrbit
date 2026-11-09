import { useLang } from '../../../lang.tsx';
import type { GraceRegion } from '../../../lib/mapData.ts';
import { getGraceValue } from '../../../lib/mapData.ts';
import { LAYER_STYLE, colorForValue, formatMonthLabel } from './mapConfig.ts';

export function TimeSlider({
  months,
  month,
  onChange,
  gapStartIndex,
  gapEndIndex,
  gapLabel,
  regions,
}: {
  months: string[];
  month: string;
  onChange: (month: string) => void;
  gapStartIndex: number;
  gapEndIndex: number;
  gapLabel: string;
  regions: GraceRegion[];
}) {
  const { t, lang, num } = useLang();
  if (months.length === 0) return null;

  const index = Math.max(0, months.indexOf(month));
  const maxIndex = Math.max(1, months.length - 1);
  const pct = (index / maxIndex) * 100;
  const gapStartPct = gapStartIndex >= 0 ? (gapStartIndex / maxIndex) * 100 : 0;
  const gapWidthPct =
    gapStartIndex >= 0 && gapEndIndex >= gapStartIndex
      ? ((gapEndIndex - gapStartIndex + 1) / months.length) * 100
      : 0;
  const firstYear = months[0]?.slice(0, 4) ?? '';
  const lastYear = months[months.length - 1]?.slice(0, 4) ?? '';
  const isMissing = regions[0]?.series.find((point) => point.month === month)?.missing ?? false;
  const sortedRegions = [...regions].sort((a, b) => a.masconId - b.masconId);

  return (
    <div className="rounded-lg border border-[#262626] bg-[#141414] p-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]">
          {t.map.timeTitle}
        </h3>
        <span className="font-mono text-[10px] text-[#FAFAFA]">
          {formatMonthLabel(month, lang, num)}
        </span>
      </div>

      <div className="relative mt-3 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-[#262626]">
          <div className="h-full bg-[#22C55E]/60" style={{ width: `${pct}%` }} />
          {gapStartIndex >= 0 && gapWidthPct > 0 && (
            <div
              className="absolute inset-y-0 border-x border-[#0A0A0A]"
              style={{
                left: `${gapStartPct}%`,
                width: `${gapWidthPct}%`,
                backgroundImage:
                  'repeating-linear-gradient(135deg, #52525B 0, #52525B 2px, #27272A 2px, #27272A 4px)',
              }}
              title={`${gapLabel} · ${t.map.noData}`}
            />
          )}
        </div>
        <input
          type="range"
          min={0}
          max={months.length - 1}
          step={1}
          value={index}
          onChange={(event) => onChange(months[Number(event.target.value)])}
          aria-label={t.map.timeTitle}
          className="agriorbit-slider absolute inset-0 h-6 w-full cursor-pointer appearance-none bg-transparent"
        />
      </div>

      <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-[#737373]">
        <span>{firstYear}</span>
        <span>{lastYear}</span>
      </div>

      {isMissing ? (
        <p className="mt-2 rounded border border-[#F59E0B]/25 bg-[#F59E0B]/10 px-2 py-1.5 font-mono text-[10px] text-[#F59E0B]">
          {t.map.gapNoData}
        </p>
      ) : (
        <p className="mt-2 text-[10px] leading-relaxed text-[#737373]">{t.map.timeHint}</p>
      )}

      <div className="mt-3 space-y-1.5 border-t border-[#262626] pt-3">
        {sortedRegions.map((region) => {
          const value = getGraceValue(region, month);
          return (
            <div key={region.id} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="flex min-w-0 items-center gap-1.5 text-[#A3A3A3]">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ background: colorForValue(LAYER_STYLE.grace.stops, value) }}
                />
                <span className="truncate">{t.map.regionLabel(String(region.masconId))}</span>
              </span>
              <span
                className={`shrink-0 font-mono text-[10px] ${
                  value === null ? 'text-[#525252]' : 'text-[#FAFAFA]'
                }`}
              >
                {value === null ? t.map.noData : `${num(value, 1, true)} ${t.map.units.cm}`}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-2 border-t border-[#262626] pt-2 font-mono text-[9px] leading-relaxed text-[#525252]">
        {t.map.gapNote}
      </p>
    </div>
  );
}
