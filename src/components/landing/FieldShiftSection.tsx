import { ArrowRight, CloudRain, Info, Thermometer } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { goAnalyze } from '../../lib/nav.ts';
import { rainTimingShift, warmestShift, type FieldShift, type SeasonId } from '../../lib/fieldShift.ts';
import { SEASON_COLOR, SectionHeader } from '../ui/ui.tsx';

/** Reusable: shows the Field Shift for any district (landing uses Rangpur). */
export function FieldShiftPanel({ shift }: { shift: FieldShift }) {
  const { t, num } = useLang();
  const warm = warmestShift(shift);
  const rain = rainTimingShift(shift);

  return (
    <div className="space-y-6">
      {/* Two headline insights */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-amber-300/10 text-amber-300">
            <Thermometer className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-semibold leading-snug text-white">
            {warm.dTemp >= 0
              ? t.fs.headlineWarm(t.season[warm.season], num(warm.dTemp, 1))
              : t.fs.headlineCool(t.season[warm.season], num(Math.abs(warm.dTemp), 1))}
          </p>
        </div>
        <div className="glass flex items-center gap-4 p-5">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-300">
            <CloudRain className="h-6 w-6" />
          </div>
          <p className="font-display text-lg font-semibold leading-snug text-white">
            {t.fs.headlineRain(t.season[rain.season], num(rain.nowShare, 0), num(rain.thenShare, 0))}
          </p>
        </div>
      </div>

      {/* One card per season */}
      <div className="grid gap-4 md:grid-cols-3">
        {shift.seasons.map((s) => (
          <article key={s.season} className="glass relative overflow-hidden p-6">
            <div className="absolute inset-x-0 top-0 h-1" style={{ background: SEASON_COLOR[s.season] }} />
            <div className="flex items-baseline justify-between">
              <h3 className="font-display text-2xl font-semibold text-white">{t.season[s.season]}</h3>
              <span className="text-xs text-slate-400">{t.seasonMonths[s.season]}</span>
            </div>
            <p className="text-sm text-slate-500">{t.seasonHint[s.season]}</p>

            <dl className="mt-5 space-y-4">
              <Row label={t.fs.temp} then={`${num(s.thenTemp, 1)}°`} now={`${num(s.nowTemp, 1)}°`} delta={`${num(s.dTemp, 1, true)}°C`} warm={s.dTemp >= 0} />
              <Row label={t.fs.heat} then={`${num(s.thenHeat, 1)}°`} now={`${num(s.nowHeat, 1)}°`} delta={`${num(s.dHeat, 1, true)}°C`} warm={s.dHeat >= 0} />
              <Row label={t.fs.share} then={`${num(s.thenShare, 0)}%`} now={`${num(s.nowShare, 0)}%`} delta={`${num(s.dShare, 0, true)} pt`} neutral />
            </dl>
          </article>
        ))}
      </div>

      {/* When does the rain fall? — stacked bars, then vs now */}
      <div className="glass p-6">
        <h3 className="font-display text-lg font-semibold text-white">{t.fs.rainBarTitle}</h3>
        <div className="mt-5 space-y-4">
          <RainBar label={t.fs.then} shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.thenShare])) as Record<SeasonId, number>} />
          <RainBar label={t.fs.now} shares={Object.fromEntries(shift.seasons.map((s) => [s.season, s.nowShare])) as Record<SeasonId, number>} />
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs text-slate-400">
          {shift.seasons.map((s) => (
            <span key={s.season} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: SEASON_COLOR[s.season] }} />
              {t.season[s.season]}
            </span>
          ))}
        </div>
      </div>

      {/* Honest data note */}
      <div className="flex gap-3 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5 text-sm leading-relaxed text-slate-300">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />
        <p>
          <strong className="text-white">{t.fs.noteTitle}</strong> {t.fs.note}
        </p>
      </div>
    </div>
  );
}

function Row({ label, then, now, delta, warm, neutral }: { label: string; then: string; now: string; delta: string; warm?: boolean; neutral?: boolean }) {
  const { t } = useLang();
  const color = neutral ? 'text-cyan-200 bg-cyan-300/10' : warm ? 'text-amber-200 bg-amber-300/10' : 'text-sky-200 bg-sky-300/10';
  return (
    <div>
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-1 flex items-center justify-between gap-2">
        <span className="tabular-nums text-slate-300">
          <span className="text-slate-500">{t.fs.then}</span> {then}
          <span className="mx-1.5 text-slate-600">→</span>
          <span className="text-slate-500">{t.fs.now}</span> <span className="font-semibold text-white">{now}</span>
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${color}`}>{delta}</span>
      </dd>
    </div>
  );
}

function RainBar({ label, shares }: { label: string; shares: Record<SeasonId, number> }) {
  const { num } = useLang();
  return (
    <div className="grid grid-cols-[3.5rem_1fr] items-center gap-3">
      <span className="text-sm text-slate-400">{label}</span>
      <div className="flex h-8 overflow-hidden rounded-lg">
        {(['rabi', 'kharif1', 'kharif2'] as SeasonId[]).map((s) => (
          <div
            key={s}
            className="flex items-center justify-center text-xs font-semibold text-ink-950 transition-all duration-700"
            style={{ width: `${shares[s]}%`, background: SEASON_COLOR[s] }}
          >
            {shares[s] >= 8 && `${num(shares[s], 0)}%`}
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
        <button onClick={goAnalyze} className="btn btn-ghost mt-8">
          {t.fs.cta}
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
