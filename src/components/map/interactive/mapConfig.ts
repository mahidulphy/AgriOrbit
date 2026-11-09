import type { MapLayerId } from '../../../lib/mapData.ts';

export interface ScaleStop {
  value: number;
  color: string;
}

export type UnitKey = 'mm' | 'm' | 'deg' | 'pct' | 'cm' | 'cmPerYear' | 'm3m3' | 'days';

export interface LayerStyle {
  stops: ScaleStop[];
  decimals: number;
  unit: UnitKey;
}

export const LAYER_STYLE: Record<MapLayerId, LayerStyle> = {
  gpm: {
    decimals: 1,
    unit: 'mm',
    stops: [
      { value: 0, color: '#0C2A3A' },
      { value: 25, color: '#0E7490' },
      { value: 50, color: '#06B6D4' },
      { value: 100, color: '#22D3EE' },
      { value: 150, color: '#67E8F9' },
      { value: 200, color: '#CFFAFE' },
    ],
  },
  gpmDiff: {
    decimals: 1,
    unit: 'mm',
    stops: [
      { value: -100, color: '#1D4ED8' },
      { value: -50, color: '#3B82F6' },
      { value: -10, color: '#93C5FD' },
      { value: 0, color: '#4B5563' },
      { value: 10, color: '#FDE68A' },
      { value: 50, color: '#F59E0B' },
      { value: 150, color: '#DC2626' },
    ],
  },
  erosion: {
    decimals: 1,
    unit: 'pct',
    stops: [
      { value: 0, color: '#1F2937' },
      { value: 5, color: '#854D0E' },
      { value: 10, color: '#CA8A04' },
      { value: 25, color: '#F59E0B' },
      { value: 50, color: '#EA580C' },
      { value: 100, color: '#DC2626' },
    ],
  },
  elevation: {
    decimals: 1,
    unit: 'm',
    stops: [
      { value: 0, color: '#0F3D2E' },
      { value: 10, color: '#166534' },
      { value: 25, color: '#65A30D' },
      { value: 50, color: '#CA8A04' },
      { value: 100, color: '#A16207' },
      { value: 200, color: '#78350F' },
    ],
  },
  grace: {
    decimals: 1,
    unit: 'cm',
    stops: [
      { value: -80, color: '#7C2D12' },
      { value: -40, color: '#B45309' },
      { value: -15, color: '#D97706' },
      { value: 0, color: '#4B5563' },
      { value: 15, color: '#0EA5E9' },
      { value: 40, color: '#0284C7' },
      { value: 60, color: '#0C4A6E' },
    ],
  },
  soilMoisture: {
    decimals: 3,
    unit: 'm3m3',
    stops: [
      { value: 0.05, color: '#78350F' },
      { value: 0.15, color: '#A16207' },
      { value: 0.25, color: '#65A30D' },
      { value: 0.35, color: '#22C55E' },
      { value: 0.45, color: '#06B6D4' },
    ],
  },
};

export const MISSING_COLOR = '#27272A';
export const DISTRICT_BORDER = '#52525B';
export const HOTSPOT_DRY_COLOR = '#F59E0B';
export const HOTSPOT_EROSION_COLOR = '#EF4444';

const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_MONTHS = [
  'জানু',
  'ফেব্রু',
  'মার্চ',
  'এপ্রিল',
  'মে',
  'জুন',
  'জুলাই',
  'আগস্ট',
  'সেপ্টে',
  'অক্টো',
  'নভে',
  'ডিসে',
];

export function formatMonthLabel(
  month: string,
  lang: 'en' | 'bn',
  num: (value: number, digits?: number) => string
): string {
  const [yearRaw, monthRaw] = month.split('-');
  const year = Number(yearRaw);
  const monthIndex = Number(monthRaw) - 1;
  if (!Number.isFinite(year) || monthIndex < 0 || monthIndex > 11) return month;
  const name = lang === 'bn' ? BN_MONTHS[monthIndex] : EN_MONTHS[monthIndex];
  return `${name} ${num(year, 0)}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const n = parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const part = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${part(r)}${part(g)}${part(b)}`;
}

export function colorForValue(stops: ScaleStop[], value: number | null): string {
  if (value === null || !Number.isFinite(value)) return MISSING_COLOR;
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  if (value <= sorted[0].value) return sorted[0].color;
  if (value >= sorted[sorted.length - 1].value) return sorted[sorted.length - 1].color;
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (value >= a.value && value <= b.value) {
      const span = b.value - a.value || 1;
      const t = (value - a.value) / span;
      const ca = hexToRgb(a.color);
      const cb = hexToRgb(b.color);
      return rgbToHex([
        ca[0] + (cb[0] - ca[0]) * t,
        ca[1] + (cb[1] - ca[1]) * t,
        ca[2] + (cb[2] - ca[2]) * t,
      ]);
    }
  }
  return sorted[sorted.length - 1].color;
}

export function gradientCss(stops: ScaleStop[]): string {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  const span = max - min || 1;
  const parts = sorted.map((s) => `${s.color} ${(((s.value - min) / span) * 100).toFixed(1)}%`);
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

export function legendTicks(stops: ScaleStop[], count = 4): number[] {
  const sorted = [...stops].sort((a, b) => a.value - b.value);
  const min = sorted[0].value;
  const max = sorted[sorted.length - 1].value;
  return Array.from({ length: count }, (_, i) => min + ((max - min) * i) / (count - 1));
}
