import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, Flame, Loader2, RefreshCw } from 'lucide-react';
import { useLang } from '../../lang.tsx';
import { SectionHeader } from '../ui/ui.tsx';
import { computeHotspots, loadMapDataset, type MapDataset } from '../../lib/mapData.ts';
import { MapCanvas } from '../map/interactive/MapCanvas.tsx';
import { MapLegend } from '../map/interactive/MapLegend.tsx';

export function MapSection() {
  const { t, num } = useLang();
  const sectionRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [dataset, setDataset] = useState<MapDataset | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let active = true;
    setError(null);
    loadMapDataset(attempt > 0)
      .then((next) => {
        if (active) setDataset(next);
      })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : String(err));
      });
    return () => {
      active = false;
    };
  }, [visible, attempt]);

  const hotspots = dataset ? computeHotspots(dataset) : null;
  const gpmStart = dataset ? String(dataset.meta.gpm.window_start ?? '') : '';
  const gpmEnd = dataset ? String(dataset.meta.gpm.window_end ?? '') : '';

  const openMap = () => {
    window.location.hash = '#/map';
  };

  return (
    <section
      id="map"
      ref={sectionRef}
      className="relative border-b border-[#262626] py-20 md:py-28 scroll-mt-16"
    >
      <div className="container-x">
        <SectionHeader eyebrow={t.map.eyebrow} title={t.map.title} sub={t.map.sub} />

        <div className="mt-10 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="flex flex-col rounded-xl border border-[#262626] bg-[#141414] p-5 sm:p-6">
            <div className="grid grid-cols-2 gap-2">
              {(['gpm', 'gpmDiff', 'erosion', 'elevation', 'grace', 'soilMoisture'] as const).map((id) => (
                <div
                  key={id}
                  className="flex items-center gap-2 rounded-lg border border-[#262626] bg-[#0A0A0A] px-2.5 py-2 text-[11px] font-medium text-[#A3A3A3]"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#22C55E]" />
                  <span className="min-w-0 leading-tight">{t.map.layers[id]}</span>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[#262626] bg-[#0A0A0A] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-wider text-[#737373]">
                  <Flame className="h-3 w-3 text-[#F59E0B]" />
                  {t.map.rulesTitle}
                </span>
                {hotspots && (
                  <span className="font-mono text-[9px] text-[#525252]">
                    {num(hotspots.dry.length + hotspots.erosion.length, 0)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-[10px] leading-snug text-[#A3A3A3]">
                <span className="font-semibold text-[#F59E0B]">{t.map.dryTitle}:</span> {t.map.dryRule}
              </p>
              <p className="mt-1 text-[10px] leading-snug text-[#A3A3A3]">
                <span className="font-semibold text-[#EF4444]">{t.map.erosionTitle}:</span>{' '}
                {t.map.erosionRule}
              </p>
              <p className="mt-1.5 text-[9px] leading-snug text-[#525252]">{t.map.ruleNote}</p>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={openMap}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-[#22C55E] px-5 py-2.5 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-[#16A34A] cursor-pointer"
              >
                {t.map.open}
                <ArrowRight className="h-4 w-4" />
              </button>
              <p className="font-mono text-[9px] leading-snug text-[#525252]">{t.map.ndviSoon}</p>
            </div>

            <p className="mt-auto pt-4 font-mono text-[9px] leading-relaxed text-[#525252]">
              {dataset
                ? t.map.source.gpm(gpmStart, gpmEnd)
                : t.map.sourceLabel}
              <span className="mt-1 block">{t.map.sourceBoundary}</span>
            </p>
          </div>

          <div className="relative isolate z-0 min-h-[360px] overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A] sm:min-h-[420px]">
            {dataset ? (
              <>
                <MapCanvas
                  dataset={dataset}
                  layer="gpm"
                  hotspots={hotspots}
                  showHotspots
                  onSelectDistrict={(districtId) => {
                    if (districtId) window.location.hash = `#/map?district=${districtId}`;
                  }}
                  compact
                />
                <div className="pointer-events-none absolute left-2 top-2 z-[500] sm:left-3 sm:top-3">
                  <MapLegend layer="gpm" />
                </div>
                <div className="absolute right-2 top-2 z-[500] rounded border border-[#262626] bg-[#0A0A0A]/90 px-2 py-1 font-mono text-[9px] text-[#A3A3A3] backdrop-blur-sm sm:right-3 sm:top-3">
                  {t.map.layers.gpm}
                </div>
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[500] bg-gradient-to-t from-[#0A0A0A] to-transparent p-3 pt-8">
                  <p className="text-[10px] leading-snug text-[#A3A3A3]">{t.map.selectSub}</p>
                </div>
              </>
            ) : error ? (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center sm:min-h-[420px]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <p className="text-sm font-medium text-[#FAFAFA]">{t.map.loadError}</p>
                <p className="max-w-sm font-mono text-[10px] text-[#737373]">{error}</p>
                <button
                  type="button"
                  onClick={() => setAttempt((value) => value + 1)}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-[#16A34A] cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  {t.map.retry}
                </button>
              </div>
            ) : (
              <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-3 p-6 text-center sm:min-h-[420px]">
                {visible ? (
                  <>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-[#22C55E]">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                    <p className="font-mono text-xs text-[#737373]">{t.map.loading}</p>
                  </>
                ) : (
                  <div className="h-full w-full animate-pulse rounded-lg bg-[#141414]" />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
