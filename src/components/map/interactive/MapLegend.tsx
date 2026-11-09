import { useLang } from '../../../lang.tsx';
import type { MapLayerId } from '../../../lib/mapData.ts';
import { LAYER_STYLE, MISSING_COLOR, gradientCss, legendTicks } from './mapConfig.ts';

export function MapLegend({ layer }: { layer: MapLayerId }) {
  const { t, num } = useLang();
  const style = LAYER_STYLE[layer];
  const ticks = legendTicks(style.stops, 4);

  return (
    <div className="pointer-events-none w-[210px] rounded-lg border border-[#262626] bg-[#0A0A0A]/92 p-3 shadow-lg backdrop-blur-sm sm:w-[240px]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#A3A3A3]">
          {t.map.legend}
        </span>
        <span className="font-mono text-[10px] text-[#737373]">{t.map.units[style.unit]}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full border border-white/5" style={{ background: gradientCss(style.stops) }} />
      <div className="mt-1 flex justify-between font-mono text-[9px] text-[#A3A3A3]">
        {ticks.map((tick, i) => (
          <span key={i}>{num(tick, style.unit === 'm3m3' ? 2 : 0)}</span>
        ))}
      </div>
      <div className="mt-2.5 flex items-center gap-1.5 border-t border-[#262626] pt-2">
        <span
          className="h-2.5 w-4 rounded-sm border border-[#52525B]"
          style={{ background: MISSING_COLOR }}
        />
        <span className="text-[10px] text-[#A3A3A3]">{t.map.noData}</span>
      </div>
    </div>
  );
}
