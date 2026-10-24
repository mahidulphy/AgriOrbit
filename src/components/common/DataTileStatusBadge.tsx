import React from 'react';
import type { Language } from '../../types';

export type TelemetryDataMode = 'live' | 'cached' | 'snapshot' | 'simulated' | 'unavailable';

export interface DataTileStatusBadgeProps {
  sourceName: string; // e.g. "NASA GPM", "NASA SMAP", "NASA POWER"
  status: TelemetryDataMode;
  date?: string | Date; // ISO string, date object, or formatted date string
  customLabel?: string;
  language?: Language;
  className?: string;
}

/**
 * Formats a date into "06 Oct 2026" (English) or "০৬ অক্টো ২০২৬" (Bangla).
 */
export function formatBadgeDate(dateVal?: string | Date, language: Language = 'en'): string {
  if (!dateVal) return language === 'en' ? 'Data unavailable' : 'তথ্য পাওয়া যায়নি';
  try {
    const d = typeof dateVal === 'string' ? new Date(dateVal) : dateVal;
    if (isNaN(d.getTime())) {
      // In case a preformatted date was passed in
      return String(dateVal);
    }
    return d.toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return language === 'en' ? 'Data unavailable' : 'তথ্য পাওয়া যায়নি';
  }
}

/**
 * Data Tile Status Badge:
 * Prominently and honestly shows whether data is LIVE, CACHED, or a static SNAPSHOT,
 * accompanied by the last-updated date (e.g. "NASA GPM · Cached · 06 Oct 2026").
 * Never labels cached or snapshot data as live.
 */
export const DataTileStatusBadge: React.FC<DataTileStatusBadgeProps> = ({
  sourceName,
  status,
  date,
  customLabel,
  language = 'en',
  className = '',
}) => {
  const isEn = language === 'en';
  const formattedDate = formatBadgeDate(date, language);

  const statusLabel = {
    live: isEn ? 'LIVE' : 'সরাসরি',
    cached: isEn ? 'CACHED' : 'সংরক্ষিত',
    snapshot: isEn ? 'SNAPSHOT' : 'সাম্প্রতিক',
    simulated: isEn ? 'SIMULATED' : 'সিমুলেশন',
    unavailable: isEn ? 'UNAVAILABLE' : 'তথ্য নেই',
  }[status];

  const statusStyles = {
    live: {
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      dot: 'bg-emerald-400 animate-pulse',
    },
    cached: {
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
      dot: 'bg-cyan-400',
    },
    snapshot: {
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      dot: 'bg-amber-400',
    },
    simulated: {
      badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
      dot: 'bg-purple-400 animate-pulse',
    },
    unavailable: {
      badge: 'bg-slate-500/15 text-slate-400 border-slate-500/30',
      dot: 'bg-slate-400',
    },
  }[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border font-mono text-[10px] font-semibold tracking-wide ${statusStyles.badge} ${className}`}
      title={customLabel ?? `${sourceName} · ${status.toUpperCase()} · ${formattedDate}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusStyles.dot}`} />
      {customLabel ? (
        <span className="font-semibold">{customLabel}</span>
      ) : (
        <>
          <span className="font-bold">{sourceName}</span>
          <span className="opacity-40">·</span>
          <span className="uppercase">{statusLabel}</span>
          <span className="opacity-40">·</span>
          <span className="text-white/80 tabular-nums">{formattedDate}</span>
        </>
      )}
    </div>
  );
};
