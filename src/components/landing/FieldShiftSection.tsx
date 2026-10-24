import { CloudRain, Info, Lightbulb, Sun, SunSnow, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { rainTimingShift, warmestShift, type FieldShift, type SeasonId, type SeasonShift } from '../../lib/fieldShift.ts';
import { SEASON_COLOR, SectionHeader } from '../ui/ui.tsx';

const SEASON_ICONS: Record<SeasonId, typeof SunSnow> = {
  rabi: SunSnow,
  kharif1: Sun,
  kharif2: CloudRain,
};

function getBiggestMetric(s: SeasonShift): 'temp' | 'heat' | 'share' {
  const rainWeight = Math.abs(s.dShare) * 0.08;
  const tempWeight = Math.abs(s.dTemp);
  const heatWeight = Math.abs(s.dHeat);
  if (rainWeight >= tempWeight && rainWeight >= heatWeight) return 'share';
  if (tempWeight >= heatWeight) return 'temp';
  return 'heat';
}

function MetricRow({
  label,
  thenVal,
  nowVal,
  delta,
  type,
  isBiggest,
  lang,
  num,
  biggestTag,
}: {
  label: string;
  thenVal: number;
  nowVal: number;
  delta: number;
  type: 'temp' | 'heat' | 'share';
  isBiggest: boolean;
  lang: 'en' | 'bn';
  num: (val: number, d?: number, signed?: boolean) => string;
  biggestTag: string;
}) {
  const isBn = lang === 'bn';

  const thenFormatted = type === 'share' ? `${num(thenVal, 0)}%` : `${num(thenVal, 1)}°`;
  const nowFormatted = type === 'share' ? `${num(nowVal, 0)}%` : `${num(nowVal, 1)}°`;

  let pillColor = '';
  let pillText = '';

  if (type === 'share') {
    if (delta > 0) {
      pillColor = 'text-[#38BDF8]';
      pillText = `+${num(delta, 0)} ${isBn ? 'পয়েন্ট' : 'pt'}`;
    } else if (delta < 0) {
      pillColor = 'text-[#F59E0B]';
      pillText = `${num(delta, 0)} ${isBn ? 'পয়েন্ট' : 'pt'}`;
    } else {
      pillColor = 'text-[#737373]';
      pillText = `0 ${isBn ? 'পয়েন্ট' : 'pt'}`;
    }
  } else {
    if (delta > 0) {
      pillColor = 'text-[#F59E0B]';
      pillText = `+${num(delta, 1)}${isBn ? '°সে' : '°C'}`;
    } else if (delta < 0) {
      pillColor = 'text-[#38BDF8]';
      pillText = `${num(delta, 1)}${isBn ? '°সে' : '°C'}`;
    } else {
      pillColor = 'text-[#737373]';
      pillText = `0.0${isBn ? '°সে' : '°C'}`;
    }
  }

  return (
    <div className="py-2.5 first:pt-0 last:pb-0 border-b border-[#262626] last:border-b-0">
      {/* Top: Metric Label + Small, calm biggest change tag */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[#737373] truncate">{label}</span>
        {isBiggest && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-[#A3A3A3] border border-[#262626] bg-[#0A0A0A] shrink-0">
            {biggestTag}
          </span>
        )}
      </div>

      {/* Below: Old value small grey → New value bold white, with change aligned right */}
      <div className="flex items-center justify-between gap-2 mt-1">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xs text-[#737373] tabular-nums">{thenFormatted}</span>
          <span className="text-[#404040] text-xs">→</span>
          <span className="text-base font-semibold font-display text-[#FAFAFA] tabular-nums">
            {nowFormatted}
          </span>
        </div>
        <span className={`text-xs font-mono font-medium tabular-nums shrink-0 ${pillColor}`}>
          {pillText}
        </span>
      </div>
    </div>
  );
}

/** Reusable: shows the Field Shift for any district (landing uses Rangpur). */
export function FieldShiftPanel({ shift }: { shift: FieldShift }) {
  const { t, num, range, lang } = useLang();
  const isBn = lang === 'bn';
  const warm = warmestShift(shift);
  const rain = rainTimingShift(shift);

  const periodShort = `${range([shift.thenRange[0], Number(String(shift.thenRange[1]).slice(2))])} → ${range([
    shift.nowRange[0],
    Number(String(shift.nowRange[1]).slice(2)),
  ])}`;

  const thenLabel = `${t.fs.then} (${range(shift.thenRange)})`;
  const nowLabel = `${t.fs.now} (${range(shift.nowRange)})`;

  return (
    <div className="space-y-6">
      {/* 1. Two headline summary boxes */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Warmth Shift Insight */}
        <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 transition-colors duration-150 hover:border-[#404040]">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-[#0A0A0A] text-[#F59E0B] border border-[#262626]">
              <Thermometer className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#737373] block mb-1">
                {isBn ? 'সর্বোচ্চ তাপমাত্রার পরিবর্তন' : 'WARMEST SEASONAL SHIFT'}
              </span>
              <h3 className="font-display text-base font-semibold text-[#FAFAFA]">
                {warm.dTemp >= 0
                  ? t.fs.headlineWarm(t.season[warm.season], num(warm.dTemp, 1))
                  : t.fs.headlineCool(t.season[warm.season], num(Math.abs(warm.dTemp), 1))}
              </h3>
              <p className="mt-1 text-xs text-[#737373] font-mono">
                {isBn
                  ? `আগের দশক (${range(shift.thenRange)}) বনাম বর্তমান দশক (${range(shift.nowRange)})`
                  : `${range(shift.thenRange)} baseline vs ${range(shift.nowRange)} latest NASA observations`}
              </p>
            </div>
          </div>
        </div>

        {/* Rain Timing Shift Insight */}
        <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 transition-colors duration-150 hover:border-[#404040]">
          <div className="flex items-start gap-3.5">
            <div className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-[#0A0A0A] text-[#38BDF8] border border-[#262626]">
              <CloudRain className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-semibold text-[#737373] block mb-1">
                {isBn ? 'বৃষ্টিপাতের সময়ের পরিবর্তন' : 'PRECIPITATION TIMING SHIFT'}
              </span>
              <h3 className="font-display text-base font-semibold text-[#FAFAFA]">
                {t.fs.headlineRain(t.season[rain.season], num(rain.nowShare, 0), num(rain.thenShare, 0))}
              </h3>
              <p className="mt-1 text-xs text-[#737373] font-mono">
                {isBn
                  ? `আগের দশক (${range(shift.thenRange)}) বনাম বর্তমান দশক (${range(shift.nowRange)})`
                  : `${range(shift.thenRange)} baseline vs ${range(shift.nowRange)} latest NASA observations`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Calm Legend Row */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs font-mono text-[#737373]">
        <span className="text-[#A3A3A3] uppercase tracking-wider text-[10px] font-semibold">
          {t.fs.legendTitle}:
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[#F59E0B] font-bold">▲</span>
          <span>{t.fs.legendTempUp}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[#38BDF8] font-bold">▼</span>
          <span>{t.fs.legendTempDown}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[#38BDF8] font-bold">▲</span>
          <span>{t.fs.legendRainUp}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="text-[#F59E0B] font-bold">▼</span>
          <span>{t.fs.legendRainDown}</span>
        </span>
      </div>

      {/* 3. The 3 Season Cards (Rabi, Kharif-1, Kharif-2) */}
      <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shift.seasons.map((s) => {
          const Icon = SEASON_ICONS[s.season];
          const biggest = getBiggestMetric(s);
          const seasonColor = SEASON_COLOR[s.season];

          return (
            <article
              key={s.season}
              className="relative flex flex-col justify-between rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6 transition-colors duration-150 hover:border-[#404040] h-full"
            >
              <div className="space-y-4 sm:space-y-5">
                {/* Header: Icon Circle + Season Name + Months + Period */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center bg-[#0A0A0A] border border-[#262626]"
                      style={{ color: seasonColor }}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA] truncate">
                        {t.season[s.season]}
                      </h3>
                      <p className="text-xs text-[#737373] truncate">
                        {t.seasonMonths[s.season]} · {t.seasonHint[s.season]}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-[#737373] shrink-0 self-start mt-0.5">
                    {periodShort}
                  </span>
                </div>

                {/* 3 Metric Rows with thin dividers */}
                <div className="space-y-0 border-t border-[#262626] pt-1">
                  <MetricRow
                    label={t.fs.temp}
                    thenVal={s.thenTemp}
                    nowVal={s.nowTemp}
                    delta={s.dTemp}
                    type="temp"
                    isBiggest={biggest === 'temp'}
                    lang={lang}
                    num={num}
                    biggestTag={t.fs.biggestChange}
                  />

                  <MetricRow
                    label={t.fs.heat}
                    thenVal={s.thenHeat}
                    nowVal={s.nowHeat}
                    delta={s.dHeat}
                    type="heat"
                    isBiggest={biggest === 'heat'}
                    lang={lang}
                    num={num}
                    biggestTag={t.fs.biggestChange}
                  />

                  <MetricRow
                    label={t.fs.share}
                    thenVal={s.thenShare}
                    nowVal={s.nowShare}
                    delta={s.dShare}
                    type="share"
                    isBiggest={biggest === 'share'}
                    lang={lang}
                    num={num}
                    biggestTag={t.fs.biggestChange}
                  />
                </div>
              </div>

              {/* Bottom Takeaway */}
              <div className="mt-4 p-3 rounded-lg bg-[#0A0A0A] border border-[#262626] flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
                <p className="text-xs leading-relaxed text-[#A3A3A3]">
                  {t.fs.takeaways[s.season]}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. When does the rain fall? — Stacked bars */}
      <div className="rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-display text-base font-semibold text-[#FAFAFA] flex items-center gap-2">
            <CloudRain className="w-4 h-4 text-[#38BDF8]" />
            <span>{t.fs.rainBarTitle}</span>
          </h3>
          <span className="text-xs font-mono text-[#737373]">
            {isBn ? 'মোট বার্ষিক বৃষ্টির মৌসুমি বণ্টন' : 'Seasonal distribution of annual rainfall'}
          </span>
        </div>

        <div className="space-y-3">
          <RainBar
            label={thenLabel}
            shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.thenShare])) as Record<SeasonId, number>}
          />
          <RainBar
            label={nowLabel}
            shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.nowShare])) as Record<SeasonId, number>}
          />
        </div>

        <div className="mt-4 pt-3 border-t border-[#262626] flex flex-wrap gap-4 text-xs text-[#A3A3A3]">
          {shift.seasons.map((s) => (
            <span key={s.season} className="flex items-center gap-2 font-mono">
              <span className="h-2 w-2 rounded-full" style={{ background: SEASON_COLOR[s.season] }} />
              <span className="font-medium text-[#FAFAFA]">{t.season[s.season]}</span>
              <span className="text-[#737373]">({t.seasonMonths[s.season]})</span>
            </span>
          ))}
        </div>
      </div>

      {/* 5. Honest data note */}
      <div className="flex gap-3 rounded-xl border border-[#262626] bg-[#141414] p-4 sm:p-5 text-xs sm:text-sm leading-relaxed text-[#A3A3A3]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#22C55E]" />
        <p>
          <strong className="text-[#FAFAFA] font-medium">{t.fs.noteTitle}</strong> {t.fs.note}
        </p>
      </div>
    </div>
  );
}

function RainBar({ label, shares }: { label: string; shares: Record<SeasonId, number> }) {
  const { num } = useLang();
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[10rem_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <span className="text-xs font-mono text-[#737373] shrink-0">{label}</span>
      <div className="flex h-7 w-full overflow-hidden rounded-md bg-[#0A0A0A] border border-[#262626]">
        {(['rabi', 'kharif1', 'kharif2'] as SeasonId[]).map((s) => (
          <div
            key={s}
            className="flex items-center justify-center text-[10px] sm:text-xs font-semibold text-black transition-all duration-500 min-w-0"
            style={{ width: `${shares[s]}%`, background: SEASON_COLOR[s] }}
          >
            {shares[s] >= 12 && `${num(shares[s], 0)}%`}
          </div>
        ))}
      </div>
    </div>
  );
}

export function FieldShiftSection({ shift }: { shift: FieldShift }) {
  const { t, range } = useLang();
  return (
    <section id="field-shift" className="relative py-20 md:py-28 border-b border-[#262626]">
      <div className="container-x">
        <SectionHeader eyebrow={t.fs.eyebrow} title={t.fs.title} sub={t.fs.sub(range(shift.thenRange), range(shift.nowRange))} />
        <div className="mt-12">
          <FieldShiftPanel shift={shift} />
        </div>
      </div>
    </section>
  );
}
