import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Flame, Loader2, RefreshCw } from 'lucide-react';
import { Header } from '../../common/Header.tsx';
import { useLang } from '../../../lang.tsx';
import { useAuth } from '../../../contexts/AuthContext.tsx';
import {
  computeHotspots,
  loadMapDataset,
  type DistrictMetrics,
  type MapDataset,
  type MapLayerId,
} from '../../../lib/mapData.ts';
import { MapCanvas } from './MapCanvas.tsx';
import { MapLegend } from './MapLegend.tsx';
import { LayerPicker } from './LayerPicker.tsx';
import { TimeSlider } from './TimeSlider.tsx';
import { DistrictPanel } from './DistrictPanel.tsx';
import { HOTSPOT_DRY_COLOR, HOTSPOT_EROSION_COLOR } from './mapConfig.ts';

function initialDistrictFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash;
  const queryIndex = hash.indexOf('?');
  if (queryIndex < 0) return null;
  return new URLSearchParams(hash.slice(queryIndex + 1)).get('district');
}

export function MapPage() {
  const { t, num } = useLang();
  const { user, isGuest, setAsGuest } = useAuth();
  const [dataset, setDataset] = useState<MapDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [layer, setLayer] = useState<MapLayerId>('gpm');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string | null>(initialDistrictFromHash);
  const [showHotspots, setShowHotspots] = useState(false);
  const [graceMonth, setGraceMonth] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    loadMapDataset(reloadToken > 0)
      .then((next) => {
        if (!active) return;
        setDataset(next);
        setGraceMonth((prev) => prev || next.grace.latestMonth || '');
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const hotspots = useMemo(() => (dataset ? computeHotspots(dataset) : null), [dataset]);

  const selectedDistrict: DistrictMetrics | null =
    dataset && selectedDistrictId ? dataset.districtById[selectedDistrictId] ?? null : null;

  const selectedRegion =
    dataset && selectedDistrict?.graceRegionId
      ? dataset.grace.regionById[selectedDistrict.graceRegionId] ?? null
      : null;

  const gpmWindowStart = dataset ? String(dataset.meta.gpm.window_start ?? '') : '';
  const gpmWindowEnd = dataset ? String(dataset.meta.gpm.window_end ?? '') : '';
  const powerWindow = useMemo(() => {
    if (!dataset) return null;
    const first = Object.values(dataset.districtById).find((district) => district.gpmWindow);
    return first?.gpmWindow ?? null;
  }, [dataset]);
  const latestSmapDate = useMemo(() => {
    if (!dataset) return '';
    let latest = '';
    for (const district of Object.values(dataset.districtById)) {
      if (district.smap !== null && district.smapDate && district.smapDate > latest) {
        latest = district.smapDate;
      }
    }
    return latest;
  }, [dataset]);

  const sourceText = (() => {
    if (!dataset) return '';
    switch (layer) {
      case 'gpm':
        return t.map.source.gpm(gpmWindowStart, gpmWindowEnd);
      case 'gpmDiff':
        return t.map.source.gpmDiff(gpmWindowStart, powerWindow?.[1] ?? gpmWindowEnd);
      case 'erosion':
      case 'elevation':
        return t.map.source[layer];
      case 'grace':
        return t.map.source.grace;
      case 'soilMoisture':
        return t.map.source.soilMoisture(latestSmapDate || t.map.noData);
    }
  })();

  const handleAnalyze = (district: DistrictMetrics) => {
    if (!user && !isGuest) setAsGuest();
    const params = new URLSearchParams({
      mapDistrict: district.districtId,
      mapUpazila: 'district-wide',
      mapLat: String(district.lat),
      mapLng: String(district.lng),
    });
    window.location.hash = `#/dashboard?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <Header />
      <main className="mx-auto w-full max-w-[1500px] px-3 py-4 sm:px-5 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#22C55E]">
              {t.map.eyebrow}
            </p>
            <h1 className="mt-1 text-xl font-semibold tracking-tight text-[#FAFAFA] sm:text-2xl">
              {t.map.title}
            </h1>
            <p className="mt-1 max-w-2xl text-xs leading-relaxed text-[#A3A3A3] sm:text-sm">{t.map.sub}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHotspots((value) => !value)}
            aria-pressed={showHotspots}
            className={`inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium transition-colors cursor-pointer ${
              showHotspots
                ? 'border-[#F59E0B]/50 bg-[#F59E0B]/10 text-[#F59E0B]'
                : 'border-[#262626] bg-[#141414] text-[#A3A3A3] hover:border-[#404040] hover:text-[#FAFAFA]'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>{t.map.hotspots}</span>
            {hotspots && (
              <span className="rounded bg-[#0A0A0A]/60 px-1.5 py-0.5 font-mono text-[9px]">
                {num(hotspots.dry.length + hotspots.erosion.length, 0)}
              </span>
            )}
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-4 lg:flex-row">
          <aside className="order-1 space-y-3 lg:order-1 lg:w-[292px] lg:shrink-0 lg:max-h-[calc(100vh-8.5rem)] lg:overflow-y-auto lg:pr-1">
            <div className="rounded-lg border border-[#262626] bg-[#141414] p-3">
              <LayerPicker layer={layer} onChange={setLayer} />
            </div>

            {layer === 'grace' && dataset && (
              <TimeSlider
                months={dataset.grace.months}
                month={graceMonth || dataset.grace.latestMonth || ''}
                onChange={setGraceMonth}
                gapStartIndex={dataset.grace.gapStartIndex}
                gapEndIndex={dataset.grace.gapEndIndex}
                gapLabel={dataset.grace.gapLabel}
                regions={dataset.grace.regions}
              />
            )}

            <details className="rounded-lg border border-[#262626] bg-[#141414] p-3">
              <summary className="cursor-pointer select-none font-mono text-[10px] font-medium uppercase tracking-wider text-[#737373]">
                {t.map.sourcesTitle}
              </summary>
              <ul className="mt-2 space-y-1 text-[10px] leading-relaxed text-[#A3A3A3]">
                <li>{t.map.sourceGpm}</li>
                <li>{t.map.sourcePower}</li>
                <li>{t.map.sourceNasadem}</li>
                <li>{t.map.sourceGrace}</li>
                <li>{t.map.sourceSmap}</li>
                <li>{t.map.sourceBoundary}</li>
                <li>{t.map.sourceBasemap}</li>
              </ul>
              <p className="mt-2 border-t border-[#262626] pt-2 text-[10px] leading-relaxed text-[#737373]">
                {t.map.dataNote}
              </p>
            </details>

            <p className="hidden px-1 font-mono text-[9px] leading-relaxed text-[#525252] lg:block">
              {t.map.regionalNote}
            </p>
          </aside>

          <div className="order-2 min-w-0 flex-1 lg:order-2">
            <div className="relative isolate z-0 h-[58vh] min-h-[420px] overflow-hidden rounded-xl border border-[#262626] bg-[#0A0A0A] lg:h-[calc(100vh-8.5rem)]">
              {dataset ? (
                <>
                  <MapCanvas
                    dataset={dataset}
                    layer={layer}
                    selectedDistrictId={selectedDistrictId}
                    onSelectDistrict={setSelectedDistrictId}
                    hotspots={hotspots}
                    showHotspots={showHotspots}
                    graceMonth={graceMonth}
                  />

                  <div className="pointer-events-none absolute left-2 top-2 z-[500] sm:left-3 sm:top-3">
                    <MapLegend layer={layer} />
                  </div>

                  {showHotspots && hotspots && (
                    <div className="absolute right-2 top-2 z-[900] max-h-[58%] w-[232px] overflow-y-auto rounded-lg border border-[#262626] bg-[#0A0A0A]/95 p-3 shadow-xl backdrop-blur-sm sm:right-3 sm:top-3 sm:w-[262px]">
                      <div className="flex items-center gap-1.5">
                        <Flame className="h-3.5 w-3.5 text-[#F59E0B]" />
                        <h2 className="font-mono text-[10px] font-medium uppercase tracking-wider text-[#FAFAFA]">
                          {t.map.rulesTitle}
                        </h2>
                      </div>
                      <div className="mt-2 border-l-2 pl-2" style={{ borderColor: HOTSPOT_DRY_COLOR }}>
                        <div className="text-[11px] font-semibold text-[#FAFAFA]">{t.map.dryTitle}</div>
                        <p className="mt-0.5 text-[10px] leading-snug text-[#A3A3A3]">{t.map.dryRule}</p>
                        <p className="mt-1 font-mono text-[9px]" style={{ color: HOTSPOT_DRY_COLOR }}>
                          {hotspots.dry.length === 0
                            ? t.map.noMatch
                            : t.map.matchCount(num(hotspots.dry.length, 0))}
                        </p>
                      </div>
                      <div className="mt-2 border-l-2 pl-2" style={{ borderColor: HOTSPOT_EROSION_COLOR }}>
                        <div className="text-[11px] font-semibold text-[#FAFAFA]">{t.map.erosionTitle}</div>
                        <p className="mt-0.5 text-[10px] leading-snug text-[#A3A3A3]">{t.map.erosionRule}</p>
                        <p className="mt-1 font-mono text-[9px]" style={{ color: HOTSPOT_EROSION_COLOR }}>
                          {hotspots.erosion.length === 0
                            ? t.map.noMatch
                            : t.map.matchCount(num(hotspots.erosion.length, 0))}
                        </p>
                      </div>
                      <p className="mt-2 border-t border-[#262626] pt-2 text-[9px] leading-snug text-[#737373]">
                        {t.map.smapCoverage(
                          num(hotspots.smapValidCount, 0),
                          num(Object.keys(dataset.districtById).length, 0)
                        )}
                      </p>
                      <p className="mt-1 text-[9px] leading-snug text-[#525252]">{t.map.ruleNote}</p>
                    </div>
                  )}

                  {selectedDistrict && dataset && (
                    <DistrictPanel
                      district={selectedDistrict}
                      layer={layer}
                      graceMonth={graceMonth}
                      graceRegion={selectedRegion}
                      onClose={() => setSelectedDistrictId(null)}
                      onAnalyze={handleAnalyze}
                    />
                  )}

                  <div className="pointer-events-none absolute bottom-7 left-2 z-[500] max-w-[calc(100%-1rem)] sm:left-3 sm:max-w-[72%]">
                    <div className="inline-block rounded border border-[#262626] bg-[#0A0A0A]/90 px-2 py-1.5 backdrop-blur-sm">
                      <div className="font-mono text-[8px] uppercase tracking-wider text-[#525252]">
                        {t.map.sourceLabel}
                      </div>
                      <div className="mt-0.5 text-[9px] leading-snug text-[#A3A3A3] sm:text-[10px]">
                        {sourceText}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
                  {loading ? (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#262626] bg-[#141414] text-[#22C55E]">
                        <Loader2 className="h-5 w-5 animate-spin" />
                      </div>
                      <p className="font-mono text-xs text-[#737373]">{t.map.loading}</p>
                    </>
                  ) : (
                    <>
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#FAFAFA]">{t.map.loadError}</p>
                        {error && <p className="mt-1 max-w-md font-mono text-[10px] text-[#737373]">{error}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setReloadToken((token) => token + 1)}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#22C55E] px-4 py-2 text-xs font-semibold text-[#0A0A0A] transition-colors hover:bg-[#16A34A] cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        {t.map.retry}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
