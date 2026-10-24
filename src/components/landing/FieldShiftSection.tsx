import { CloudRain, Info, Lightbulb, Sun, SunSnow, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { rainTimingShift, warmestShift, type FieldShift, type SeasonId, type SeasonShift } from '../../lib/fieldShift.ts';
import { SEASON_COLOR, SectionHeader } from '../ui/ui.tsx';

const SEASON_ICONS: Record<SeasonId, typeof SunSnow> = {
  rabi: SunSnow,
  kharif1: Sun,
  kharif2: CloudRain,
};

const SEASON_STYLES: Record<
  SeasonId,
  {
    badgeBg: string;
    badgeBorder: string;
    badgeText: string;
    cardGradient: string;
    hoverBorder: string;
    hoverShadow: string;
  }
> = {
  rabi: {
    badgeBg: 'bg-sky-400/15',
    badgeBorder: 'border-sky-400/30',
    badgeText: 'text-sky-300',
    cardGradient: 'from-sky-950/25 via-[#081220]/95 to-[#050B14]',
    hoverBorder: 'hover:border-sky-400/40',
    hoverShadow: 'hover:shadow-sky-500/10',
  },
  kharif1: {
    badgeBg: 'bg-amber-400/15',
    badgeBorder: 'border-amber-400/30',
    badgeText: 'text-amber-300',
    cardGradient: 'from-amber-950/25 via-[#081220]/95 to-[#050B14]',
    hoverBorder: 'hover:border-amber-400/40',
    hoverShadow: 'hover:shadow-amber-500/10',
  },
  kharif2: {
    badgeBg: 'bg-cyan-400/15',
    badgeBorder: 'border-cyan-400/30',
    badgeText: 'text-cyan-300',
    cardGradient: 'from-cyan-950/25 via-[#081220]/95 to-[#050B14]',
    hoverBorder: 'hover:border-cyan-400/40',
    hoverShadow: 'hover:shadow-cyan-500/10',
  },
};

function getBiggestMetric(s: SeasonShift): 'temp' | 'heat' | 'share' {
  const rainWeight = Math.abs(s.dShare) * 0.08;
  const tempWeight = Math.abs(s.dTemp);
  const heatWeight = Math.abs(s.dHeat);
  if (rainWeight >= tempWeight && rainWeight >= heatWeight) return 'share';
  if (tempWeight >= heatWeight) return 'temp';
  return 'heat';
}

function MiniBar({
  type,
  thenVal,
  nowVal,
  delta,
}: {
  type: 'temp' | 'heat' | 'share';
  thenVal: number;
  nowVal: number;
  delta: number;
}) {
  let thenPct = 0;
  let nowPct = 0;

  if (type === 'share') {
    thenPct = Math.max(3, Math.min(97, thenVal));
    nowPct = Math.max(3, Math.min(97, nowVal));
  } else {
    const min = 12;
    const max = 36;
    thenPct = Math.max(4, Math.min(96, ((thenVal - min) / (max - min)) * 100));
    nowPct = Math.max(4, Math.min(96, ((nowVal - min) / (max - min)) * 100));
  }

  const isUp = delta >= 0;
  const leftPct = Math.min(thenPct, nowPct);
  const widthPct = Math.max(2, Math.abs(nowPct - thenPct));

  let deltaColor = '';
  if (type === 'share') {
    deltaColor = isUp
      ? 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
      : 'bg-amber-600/80 shadow-[0_0_8px_rgba(217,119,6,0.5)]';
  } else {
    deltaColor = isUp
      ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]'
      : 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.8)]';
  }

  return (
    <div className="mt-2.5 h-1.5 w-full rounded-full bg-white/10 relative overflow-hidden">
      {/* Baseline (Then) bar */}
      <div
        className="absolute top-0 bottom-0 left-0 bg-white/20 rounded-l-full"
        style={{ width: `${Math.min(thenPct, nowPct)}%` }}
      />
      {/* Shift / Delta bar */}
      <div
        className={`absolute top-0 bottom-0 rounded-full transition-all duration-500 ${deltaColor}`}
        style={{
          left: `${leftPct}%`,
          width: `${widthPct}%`,
        }}
      />
    </div>
  );
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
      pillColor = 'bg-blue-500/15 text-blue-300 border border-blue-500/30';
      pillText = `▲ +${num(delta, 0)} ${isBn ? 'পয়েন্ট' : 'pt'}`;
    } else if (delta < 0) {
      pillColor = 'bg-amber-950/40 text-amber-200 border border-amber-600/40';
      pillText = `▼ ${num(delta, 0)} ${isBn ? 'পয়েন্ট' : 'pt'}`;
    } else {
      pillColor = 'bg-white/5 text-slate-300 border border-white/10';
      pillText = `0 ${isBn ? 'পয়েন্ট' : 'pt'}`;
    }
  } else {
    if (delta > 0) {
      pillColor = 'bg-orange-500/15 text-orange-300 border border-orange-500/30';
      pillText = `▲ +${num(delta, 1)}${isBn ? '°সে' : '°C'}`;
    } else if (delta < 0) {
      pillColor = 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
      pillText = `▼ ${num(delta, 1)}${isBn ? '°সে' : '°C'}`;
    } else {
      pillColor = 'bg-white/5 text-slate-300 border border-white/10';
      pillText = `0.0${isBn ? '°সে' : '°C'}`;
    }
  }

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 sm:p-3.5 transition-colors hover:border-white/15">
      {/* Top: Metric Label + Biggest change tag */}
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-xs font-medium text-slate-300 truncate">{label}</span>
        {isBiggest && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#B8FF3D]/15 text-[#B8FF3D] border border-[#B8FF3D]/30 shrink-0">
            ★ {biggestTag}
          </span>
        )}
      </div>

      {/* Middle: Then -> Now and Change Pill */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-baseline gap-1.5 font-mono">
          <span className="text-xs text-slate-400 tabular-nums">{thenFormatted}</span>
          <span className="text-slate-500 text-xs font-mono">→</span>
          <span className="text-lg sm:text-xl font-bold font-display text-white tabular-nums tracking-tight">
            {nowFormatted}
          </span>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-semibold tabular-nums shrink-0 ${pillColor}`}>
          {pillText}
        </span>
      </div>

      {/* Bottom: Visual Mini-Bar */}
      <MiniBar type={type} thenVal={thenVal} nowVal={nowVal} delta={delta} />
    </div>
  );
}

/** Reusable: shows the Field Shift for any district (landing uses Rangpur). */
export function FieldShiftPanel({ shift }: { shift: FieldShift }) {
  const { t, num, range, lang } = useLang();
  const isBn = lang === 'bn';
  const warm = warmestShift(shift);
  const rain = rainTimingShift(shift);

  const thenRangeShort = `${shift.thenRange[0]}–${String(shift.thenRange[1]).slice(2)}`;
  const nowRangeShort = `${shift.nowRange[0]}–${String(shift.nowRange[1]).slice(2)}`;
  const periodShort = `${range([shift.thenRange[0], Number(String(shift.thenRange[1]).slice(2))])} → ${range([
    shift.nowRange[0],
    Number(String(shift.nowRange[1]).slice(2)),
  ])}`;

  const thenLabel = `${t.fs.then} (${range(shift.thenRange)})`;
  const nowLabel = `${t.fs.now} (${range(shift.nowRange)})`;

  return (
    <div className="space-y-8">
      {/* 1. Two headline insights matching card design */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Warmth Shift Insight */}
        <div className="group relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 via-[#0B1626]/95 to-[#070D18] p-5 sm:p-6 shadow-xl shadow-black/40 transition-all duration-300 hover:border-amber-400/40 hover:-translate-y-0.5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 to-amber-500/40" />
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 shadow-inner">
              <Thermometer className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-amber-400 block mb-1">
                {isBn ? 'সর্বোচ্চ তাপমাত্রার পরিবর্তন' : 'WARMEST SEASONAL SHIFT'}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold leading-snug text-white text-balance">
                {warm.dTemp >= 0
                  ? t.fs.headlineWarm(t.season[warm.season], num(warm.dTemp, 1))
                  : t.fs.headlineCool(t.season[warm.season], num(Math.abs(warm.dTemp), 1))}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                {isBn
                  ? `আগের দশক (${range(shift.thenRange)}) বনাম বর্তমান দশক (${range(shift.nowRange)})`
                  : `${range(shift.thenRange)} baseline vs ${range(shift.nowRange)} latest NASA observations`}
              </p>
            </div>
          </div>
        </div>

        {/* Rain Timing Shift Insight */}
        <div className="group relative overflow-hidden rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-[#0B1626]/95 to-[#070D18] p-5 sm:p-6 shadow-xl shadow-black/40 transition-all duration-300 hover:border-cyan-400/40 hover:-translate-y-0.5">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 to-cyan-500/40" />
          <div className="flex items-start gap-4">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 shadow-inner">
              <CloudRain className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 block mb-1">
                {isBn ? 'বৃষ্টিপাতের সময়ের পরিবর্তন' : 'PRECIPITATION TIMING SHIFT'}
              </span>
              <h3 className="font-display text-lg sm:text-xl font-bold leading-snug text-white text-balance">
                {t.fs.headlineRain(t.season[rain.season], num(rain.nowShare, 0), num(rain.thenShare, 0))}
              </h3>
              <p className="mt-1 text-xs text-slate-400 font-mono">
                {isBn
                  ? `আগের দশক (${range(shift.thenRange)}) বনাম বর্তমান দশক (${range(shift.nowRange)})`
                  : `${range(shift.thenRange)} baseline vs ${range(shift.nowRange)} latest NASA observations`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Compact Change Pill Legend */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-2 text-xs font-mono text-slate-400 px-1">
        <span className="text-slate-500 uppercase tracking-wider text-[10px] font-semibold">
          {t.fs.legendTitle}:
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-300 border border-orange-500/30 text-[10px] font-bold">▲</span>
          <span>{t.fs.legendTempUp}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30 text-[10px] font-bold">▼</span>
          <span>{t.fs.legendTempDown}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[10px] font-bold">▲</span>
          <span>{t.fs.legendRainUp}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 text-amber-200 border border-amber-600/40 text-[10px] font-bold">▼</span>
          <span>{t.fs.legendRainDown}</span>
        </span>
      </div>

      {/* 3. The 3 Season Cards (Rabi, Kharif-1, Kharif-2) */}
      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {shift.seasons.map((s) => {
          const Icon = SEASON_ICONS[s.season];
          const style = SEASON_STYLES[s.season];
          const biggest = getBiggestMetric(s);

          return (
            <article
              key={s.season}
              className={`group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-b ${style.cardGradient} p-5 sm:p-6 shadow-xl shadow-black/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${style.hoverBorder} ${style.hoverShadow} overflow-hidden h-full`}
            >
              {/* Top Accent Line */}
              <div
                className="absolute inset-x-0 top-0 h-1.5"
                style={{
                  background: `linear-gradient(90deg, ${SEASON_COLOR[s.season]} 0%, ${SEASON_COLOR[s.season]}80 100%)`,
                }}
              />

              <div className="space-y-5">
                {/* Header: Icon + Season Name + Months/Hint */}
                <div className="flex items-start gap-3.5">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl border ${style.badgeBg} ${style.badgeBorder} ${style.badgeText} transition-transform duration-300 group-hover:scale-105 shadow-inner`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-display text-2xl font-bold tracking-tight text-white truncate">
                        {t.season[s.season]}
                      </h3>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 shrink-0">
                        {periodShort}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400 font-medium truncate">
                      {t.seasonMonths[s.season]} · {t.seasonHint[s.season]}
                    </p>
                  </div>
                </div>

                {/* 3 Metric Rows */}
                <div className="space-y-2.5">
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

              {/* Bottom Plain-Language Takeaway */}
              <div className="mt-5 pt-3.5 border-t border-white/10 flex items-start gap-2.5 text-xs leading-relaxed text-slate-300/90">
                <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                <p className="font-sans">
                  {t.fs.takeaways[s.season]}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {/* 4. When does the rain fall? — Stacked bars matching season colors */}
      <div className="rounded-2xl border border-white/10 bg-[#070E1A]/90 p-5 sm:p-6 shadow-xl shadow-black/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
            <CloudRain className="w-5 h-5 text-cyan-400" />
            <span>{t.fs.rainBarTitle}</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {isBn ? 'মোট বার্ষিক বৃষ্টির মৌসুমি বণ্টন' : 'Seasonal distribution of annual rainfall'}
          </span>
        </div>

        <div className="space-y-3.5">
          <RainBar
            label={thenLabel}
            shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.thenShare])) as Record<SeasonId, number>}
          />
          <RainBar
            label={nowLabel}
            shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.nowShare])) as Record<SeasonId, number>}
          />
        </div>

        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-wrap gap-4 text-xs text-slate-300">
          {shift.seasons.map((s) => (
            <span key={s.season} className="flex items-center gap-2 font-mono">
              <span className="h-3 w-3 rounded-full" style={{ background: SEASON_COLOR[s.season] }} />
              <span className="font-medium text-white">{t.season[s.season]}</span>
              <span className="text-slate-400">({t.seasonMonths[s.season]})</span>
            </span>
          ))}
        </div>
      </div>

      {/* 5. Honest data note */}
      <div className="flex gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 text-sm leading-relaxed text-slate-300">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
        <p>
          <strong className="text-white">{t.fs.noteTitle}</strong> {t.fs.note}
        </p>
      </div>
    </div>
  );
}

function RainBar({ label, shares }: { label: string; shares: Record<SeasonId, number> }) {
  const { num } = useLang();
  return (
    <div className="flex flex-col sm:grid sm:grid-cols-[10rem_1fr] items-start sm:items-center gap-1.5 sm:gap-3">
      <span className="text-xs sm:text-sm font-mono text-slate-400 shrink-0">{label}</span>
      <div className="flex h-8 w-full overflow-hidden rounded-lg bg-black/30">
        {(['rabi', 'kharif1', 'kharif2'] as SeasonId[]).map((s) => (
          <div
            key={s}
            className="flex items-center justify-center text-[11px] sm:text-xs font-semibold text-ink-950 transition-all duration-700 min-w-0"
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
    <section id="field-shift" className="relative py-20 md:py-28">
      <div className="container-x">
        <SectionHeader eyebrow={t.fs.eyebrow} title={t.fs.title} sub={t.fs.sub(range(shift.thenRange), range(shift.nowRange))} />
        <div className="mt-12">
          <FieldShiftPanel shift={shift} />
        </div>
      </div>
    </section>
  );
}
