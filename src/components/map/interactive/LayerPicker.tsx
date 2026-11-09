import { ArrowLeftRight, CloudRain, Droplets, Mountain, Sprout, TrendingUp, Waves } from 'lucide-react';
import { useLang } from '../../../lang.tsx';
import type { MapLayerId } from '../../../lib/mapData.ts';

const LAYERS: { id: MapLayerId; Icon: typeof CloudRain }[] = [
  { id: 'gpm', Icon: CloudRain },
  { id: 'gpmDiff', Icon: ArrowLeftRight },
  { id: 'erosion', Icon: Mountain },
  { id: 'elevation', Icon: TrendingUp },
  { id: 'grace', Icon: Waves },
  { id: 'soilMoisture', Icon: Droplets },
];

export function LayerPicker({
  layer,
  onChange,
}: {
  layer: MapLayerId;
  onChange: (layer: MapLayerId) => void;
}) {
  const { t } = useLang();

  return (
    <div>
      <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]">
        {t.map.layersTitle}
      </h2>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1">
        {LAYERS.map(({ id, Icon }) => {
          const active = layer === id;
          return (
            <button
              key={id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(id)}
              className={`flex min-h-[44px] items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs font-medium transition-colors cursor-pointer ${
                active
                  ? 'border-[#22C55E]/50 bg-[#22C55E]/10 text-[#FAFAFA]'
                  : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#404040] hover:text-[#FAFAFA]'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-[#22C55E]' : 'text-[#737373]'}`} />
              <span className="min-w-0 flex-1 leading-tight">{t.map.layers[id]}</span>
              {id === 'grace' && (
                <span className="hidden shrink-0 font-mono text-[9px] text-[#737373] xl:inline">2002–26</span>
              )}
            </button>
          );
        })}

        <button
          type="button"
          disabled
          aria-disabled="true"
          title={t.map.ndviNote}
          className="flex min-h-[44px] cursor-not-allowed items-center gap-2 rounded-lg border border-dashed border-[#262626] bg-[#0A0A0A] px-3 py-2 text-left text-xs font-medium text-[#525252]"
        >
          <Sprout className="h-3.5 w-3.5 shrink-0" />
          <span className="min-w-0 flex-1 leading-tight">
            {t.map.layers.ndvi}
            <span className="mt-0.5 block font-mono text-[9px] font-normal text-[#525252]">
              {t.map.ndviSoon}
            </span>
          </span>
        </button>
      </div>
      <p className="mt-3 hidden text-[11px] leading-relaxed text-[#737373] lg:block">
        {t.map.layerDesc[layer]}
      </p>
    </div>
  );
}
