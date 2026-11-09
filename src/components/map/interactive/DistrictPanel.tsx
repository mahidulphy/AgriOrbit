import { ArrowRight, X } from 'lucide-react';
import { useLang } from '../../../lang.tsx';
import type { DistrictMetrics, MapLayerId } from '../../../lib/mapData.ts';
import { LAYER_STYLE, colorForValue, formatMonthLabel } from './mapConfig.ts';
import { getGraceValue } from '../../../lib/mapData.ts';
import type { GraceRegion } from '../../../lib/mapData.ts';

function ValueRow({
  label,
  value,
  source,
  muted = false,
  note,
}: {
  label: string;
  value: string;
  source?: string;
  muted?: boolean;
  note?: string;
}) {
  return (
    <div className="col-span-2 flex items-start justify-between gap-3 border-b border-[#1A1A1A] py-1.5 last:border-0">
      <div className="min-w-0">
        <div className="text-[11px] leading-snug text-[#A3A3A3]">{label}</div>
        {note && <div className="mt-0.5 text-[9px] leading-snug text-[#F59E0B]">{note}</div>}
      </div>
      <div className="shrink-0 text-right">
        <div className={`font-mono text-[11px] ${muted ? 'text-[#525252]' : 'text-[#FAFAFA]'}`}>{value}</div>
        {source && <div className="font-mono text-[8px] uppercase tracking-wider text-[#525252]">{source}</div>}
      </div>
    </div>
  );
}

export function DistrictPanel({
  district,
  layer,
  graceMonth,
  graceRegion,
  onClose,
  onAnalyze,
}: {
  district: DistrictMetrics;
  layer: MapLayerId;
  graceMonth: string;
  graceRegion: GraceRegion | null;
  onClose: () => void;
  onAnalyze: (district: DistrictMetrics) => void;
}) {
  const { t, lang, num, date } = useLang();
  const name = lang === 'bn' ? district.nameBn : district.nameEn;
  const division = lang === 'bn' ? district.divisionBn : district.division;
  const style = LAYER_STYLE[layer];
  const graceValue = graceRegion ? getGraceValue(graceRegion, graceMonth) : null;

  const activeValue =
    layer === 'grace'
      ? graceValue
      : layer === 'gpm'
        ? district.gpm30d
        : layer === 'gpmDiff'
          ? district.gpmPowerDiff
          : layer === 'erosion'
            ? district.slopeGt5Pct
            : layer === 'elevation'
              ? district.elevationM
              : district.smap;

  const activeText =
    activeValue === null
      ? t.map.noData
      : `${num(activeValue, style.decimals, layer === 'gpmDiff')} ${t.map.units[style.unit]}`;

  const windowText = district.gpmWindow
    ? t.map.window(date(district.gpmWindow[0]), date(district.gpmWindow[1]))
    : null;

  return (
    <aside
      aria-label={name}
      className="absolute inset-x-0 bottom-0 z-[1100] flex max-h-[74%] flex-col overflow-hidden rounded-t-xl border-t border-[#262626] bg-[#0A0A0A]/98 shadow-[0_-12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[360px] sm:rounded-none sm:border-l sm:border-t-0"
    >
      <div className="flex items-start justify-between gap-3 border-b border-[#262626] bg-[#0A0A0A]/98 px-4 py-3">
        <div className="min-w-0">
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#737373]">{t.map.district}</div>
          <h2 className="truncate text-base font-semibold text-[#FAFAFA]">{name}</h2>
          <p className="mt-0.5 text-[11px] text-[#A3A3A3]">
            {t.map.division}: {division}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-[#A3A3A3] transition-colors hover:border-[#404040] hover:text-[#FAFAFA] cursor-pointer"
          aria-label={lang === 'bn' ? 'বন্ধ করুন' : 'Close panel'}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
        <div className="rounded-lg border border-[#262626] bg-[#141414] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-[#737373]">
              {t.map.activeLayer}
            </span>
            <span className="truncate text-[10px] font-medium text-[#A3A3A3]">{t.map.layers[layer]}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-sm border border-white/10"
              style={{
                background: colorForValue(
                  layer === 'grace' ? LAYER_STYLE.grace.stops : style.stops,
                  activeValue
                ),
              }}
            />
            <span
              className={`font-mono text-xl font-medium ${
                activeValue === null ? 'text-[#525252]' : 'text-[#FAFAFA]'
              }`}
            >
              {activeText}
            </span>
          </div>
          {layer === 'grace' && (
            <div className="mt-1 font-mono text-[9px] text-[#737373]">
              {formatMonthLabel(graceMonth, lang, num)} · {t.map.regional}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => onAnalyze(district)}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2.5 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-[#16A34A] cursor-pointer"
        >
          {t.map.analyze}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>

        <div className="mt-4">
          <h3 className="font-mono text-[9px] font-medium uppercase tracking-wider text-[#737373]">
            {t.map.valuesTitle}
          </h3>
          <div className="mt-1">
            <ValueRow
              label={t.map.values.gpm30d}
              value={district.gpm30d === null ? t.map.noData : `${num(district.gpm30d, 1)} ${t.map.units.mm}`}
              source="GPM"
              muted={district.gpm30d === null}
            />
            <ValueRow
              label={t.map.values.power30d}
              value={
                district.power30d === null ? t.map.noData : `${num(district.power30d, 1)} ${t.map.units.mm}`
              }
              source="POWER"
              muted={district.power30d === null}
            />
            <ValueRow
              label={t.map.values.difference}
              value={
                district.gpmPowerDiff === null
                  ? t.map.noData
                  : `${num(district.gpmPowerDiff, 1, true)} ${t.map.units.mm}`
              }
              source="GPM − POWER"
              muted={district.gpmPowerDiff === null}
            />
            <ValueRow
              label={t.map.values.extremeDays}
              value={
                district.extremeRainDays === null ? t.map.noData : num(district.extremeRainDays, 0)
              }
              source="GPM"
              muted={district.extremeRainDays === null}
            />
            <ValueRow
              label={t.map.values.smap}
              value={district.smap === null ? t.map.noData : `${num(district.smap, 3)} ${t.map.units.m3m3}`}
              source="SMAP"
              muted={district.smap === null}
              note={district.smapFlagged ? t.map.smapFlagged : undefined}
            />
            <ValueRow
              label={t.map.values.smapDate}
              value={district.smapDate ? date(district.smapDate) : t.map.noData}
              source={district.smapPass ? `SMAP · ${district.smapPass}` : 'SMAP'}
              muted={!district.smapDate || district.smap === null}
            />
            <ValueRow
              label={t.map.values.elevation}
              value={
                district.elevationM === null ? t.map.noData : `${num(district.elevationM, 1)} ${t.map.units.m}`
              }
              source="NASADEM"
              muted={district.elevationM === null}
            />
            <ValueRow
              label={t.map.values.slope}
              value={
                district.slopeGt5Pct === null ? t.map.noData : `${num(district.slopeGt5Pct, 1)} ${t.map.units.pct}`
              }
              source="NASADEM"
              muted={district.slopeGt5Pct === null}
            />
            <ValueRow
              label={t.map.values.meanSlope}
              value={
                district.meanSlopeDeg === null ? t.map.noData : `${num(district.meanSlopeDeg, 1)} ${t.map.units.deg}`
              }
              source="NASADEM"
              muted={district.meanSlopeDeg === null}
            />
            <ValueRow
              label={t.map.values.graceRegion}
              value={graceRegion ? t.map.regionLabel(String(graceRegion.masconId)) : t.map.noData}
              source="GRACE"
              muted={!graceRegion}
            />
            <ValueRow
              label={t.map.values.graceValue}
              value={graceValue === null ? t.map.noData : `${num(graceValue, 1, true)} ${t.map.units.cm}`}
              source={formatMonthLabel(graceMonth, lang, num)}
              muted={graceValue === null}
            />
            <ValueRow
              label={t.map.values.graceTrend}
              value={
                graceRegion?.trend2016 === null || graceRegion?.trend2016 === undefined
                  ? t.map.noData
                  : `${num(graceRegion.trend2016, 2, true)} ${t.map.units.cmPerYear}`
              }
              source="GRACE 2016–present"
              muted={graceRegion?.trend2016 === null || graceRegion?.trend2016 === undefined}
            />
          </div>
          {windowText && <p className="mt-2 font-mono text-[9px] text-[#525252]">{windowText}</p>}
        </div>

        <div className="mt-4 border-t border-[#262626] pt-2">
          <div className="font-mono text-[9px] uppercase tracking-wider text-[#525252]">{t.map.sourcesTitle}</div>
          <ul className="mt-1 space-y-0.5 text-[9px] leading-relaxed text-[#737373]">
            <li>GPM · {t.map.sourceGpm}</li>
            <li>POWER · {t.map.sourcePower}</li>
            <li>NASADEM · {t.map.sourceNasadem}</li>
            <li>SMAP · {t.map.sourceSmap}</li>
            <li>GRACE · {t.map.sourceGrace}</li>
            <li>{t.map.sourceBoundary}</li>
          </ul>
        </div>
      </div>
    </aside>
  );
}
