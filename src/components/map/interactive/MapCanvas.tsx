import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L, { type LeafletMouseEvent, type PathOptions } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Feature, Geometry } from 'geojson';
import type {
  DistrictMapProps,
  DistrictMetrics,
  GraceCellProps,
  GraceRegion,
  HotspotResult,
  MapDataset,
  MapLayerId,
} from '../../../lib/mapData.ts';
import { getDistrictLayerValue, getGraceValue } from '../../../lib/mapData.ts';
import {
  DISTRICT_BORDER,
  HOTSPOT_DRY_COLOR,
  HOTSPOT_EROSION_COLOR,
  LAYER_STYLE,
  MISSING_COLOR,
  colorForValue,
} from './mapConfig.ts';
import { useLang } from '../../../lang.tsx';

const BD_CENTER: [number, number] = [23.72, 90.36];
const BD_BOUNDS: [[number, number], [number, number]] = [
  [20.4, 87.7],
  [26.9, 93.1],
];

export interface MapCanvasProps {
  dataset: MapDataset;
  layer: MapLayerId;
  selectedDistrictId?: string | null;
  onSelectDistrict?: (districtId: string | null) => void;
  hotspots?: HotspotResult | null;
  showHotspots?: boolean;
  graceMonth?: string;
  compact?: boolean;
  className?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function MapResize() {
  const map = useMap();
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => observer.disconnect();
  }, [map]);
  return null;
}

function MapClickToClear({ onClear }: { onClear?: () => void }) {
  useMapEvents({
    click: () => onClear?.(),
  });
  return null;
}

function FlyToSelection({ district }: { district: DistrictMetrics | null }) {
  const map = useMap();
  const lat = district?.lat ?? null;
  const lng = district?.lng ?? null;
  useEffect(() => {
    if (lat === null || lng === null) return;
    map.flyTo([lat, lng], Math.max(map.getZoom(), 7.4), { duration: 0.7 });
  }, [lat, lng, map]);
  return null;
}

export function MapCanvas({
  dataset,
  layer,
  selectedDistrictId = null,
  onSelectDistrict,
  hotspots = null,
  showHotspots = false,
  graceMonth,
  compact = false,
}: MapCanvasProps) {
  const { t, num, lang } = useLang();
  const activeStyle = LAYER_STYLE[layer];
  const activeMonth = graceMonth ?? dataset.grace.latestMonth ?? '';
  const selectedDistrict = selectedDistrictId
    ? dataset.districtById[selectedDistrictId] ?? null
    : null;

  const formatValue = (value: number | null): string => {
    if (value === null || !Number.isFinite(value)) return t.map.noData;
    return `${num(value, activeStyle.decimals, layer === 'gpmDiff')} ${t.map.units[activeStyle.unit]}`;
  };

  const districtValue = (district: DistrictMetrics): number | null => {
    if (layer === 'grace') {
      const region = district.graceRegionId ? dataset.grace.regionById[district.graceRegionId] : null;
      return region ? getGraceValue(region, activeMonth) : null;
    }
    return getDistrictLayerValue(district, layer);
  };

  const districtName = (district: DistrictMetrics) => (lang === 'bn' ? district.nameBn : district.nameEn);

  const districtStyle = (feature?: Feature<Geometry, DistrictMapProps>): PathOptions => {
    const id = feature?.properties?.districtId ?? '';
    const district = dataset.districtById[id];
    const value = district ? districtValue(district) : null;
    const selected = id === selectedDistrictId;

    if (layer === 'grace') {
      return {
        color: selected ? '#FAFAFA' : DISTRICT_BORDER,
        weight: selected ? 2.4 : 0.7,
        fillColor: MISSING_COLOR,
        fillOpacity: 0.01,
        opacity: 0.85,
        bubblingMouseEvents: false,
      };
    }

    return {
      color: selected ? '#FAFAFA' : DISTRICT_BORDER,
      weight: selected ? 2.4 : 0.75,
      fillColor: colorForValue(activeStyle.stops, value),
      fillOpacity: value === null ? 0.55 : 0.82,
      opacity: 1,
      bubblingMouseEvents: false,
    };
  };

  const onEachDistrict = (feature: Feature<Geometry, DistrictMapProps>, leafletLayer: L.Layer) => {
    const id = feature.properties?.districtId;
    if (!id) return;
    const district = dataset.districtById[id];
    if (!district) return;
    const path = leafletLayer as L.Path;
    const value = districtValue(district);
    const tooltip = `
      <div class="agriorbit-tooltip-title">${escapeHtml(districtName(district))}</div>
      <div class="agriorbit-tooltip-row">
        <span>${escapeHtml(t.map.layerShort[layer === 'grace' ? 'grace' : layer])}</span>
        <span class="agriorbit-tooltip-value">${escapeHtml(formatValue(value))}</span>
      </div>
    `;
    path.bindTooltip(tooltip, {
      className: 'agriorbit-map-tooltip',
      direction: 'top',
      sticky: true,
      opacity: 1,
    });
    path.on('click', (event: LeafletMouseEvent) => {
      L.DomEvent.stopPropagation(event);
      onSelectDistrict?.(id);
    });
    path.on('mouseover', () => {
      path.setStyle({ weight: 2, color: '#E5E7EB' });
      path.bringToFront();
    });
    path.on('mouseout', () => {
      path.setStyle(districtStyle(feature));
    });
  };

  const graceCellStyle = (feature?: Feature<Geometry, GraceCellProps>): PathOptions => {
    if (!feature) return {};
    const region = dataset.grace.regionById[feature.properties.regionId];
    const value = region ? getGraceValue(region, activeMonth) : null;
    return {
      color: '#3F3F46',
      weight: 0.5,
      fillColor: colorForValue(LAYER_STYLE.grace.stops, value),
      fillOpacity: value === null ? 0.3 : 0.58,
      opacity: 0.9,
      bubblingMouseEvents: false,
    };
  };

  const onEachGraceCell = (feature: Feature<Geometry, GraceCellProps>, leafletLayer: L.Layer) => {
    const region = dataset.grace.regionById[feature.properties.regionId];
    if (!region) return;
    const value = getGraceValue(region, activeMonth);
    const path = leafletLayer as L.Path;
    path.bindTooltip(
      `
      <div class="agriorbit-tooltip-title">${escapeHtml(t.map.regionLabel(String(region.masconId)))}</div>
      <div class="agriorbit-tooltip-row">
        <span>${escapeHtml(t.map.regional)}</span>
        <span class="agriorbit-tooltip-value">${
          value === null
            ? escapeHtml(t.map.noData)
            : escapeHtml(`${num(value, 1, true)} ${t.map.units.cm}`)
        }</span>
      </div>
      <div class="agriorbit-tooltip-note">${escapeHtml(t.map.regionalNote)}</div>
    `,
      { className: 'agriorbit-map-tooltip', direction: 'top', sticky: true, opacity: 1 }
    );
  };

  const selectedFeature = useMemo(() => {
    if (!selectedDistrictId) return null;
    const feature = dataset.districts.features.find(
      (f) => f.properties?.districtId === selectedDistrictId
    );
    return feature ? { type: 'Feature' as const, properties: feature.properties, geometry: feature.geometry } : null;
  }, [dataset.districts.features, selectedDistrictId]);

  const hotspotFeatures = useMemo(() => {
    if (!showHotspots || !hotspots) return null;
    const ids = new Set<string>([...hotspots.dry, ...hotspots.erosion]);
    if (ids.size === 0) return null;
    return {
      type: 'FeatureCollection' as const,
      features: dataset.districts.features.filter((f) => ids.has(f.properties?.districtId ?? '')),
    };
  }, [dataset.districts.features, hotspots, showHotspots]);

  const hotspotStyle = (feature?: Feature<Geometry, DistrictMapProps>): PathOptions => {
    const id = feature?.properties?.districtId ?? '';
    const isErosion = hotspots?.erosion.includes(id) ?? false;
    return {
      color: isErosion ? HOTSPOT_EROSION_COLOR : HOTSPOT_DRY_COLOR,
      weight: 2.6,
      dashArray: '5 3',
      fill: false,
      opacity: 0.95,
      bubblingMouseEvents: false,
    };
  };

  return (
    <div className={`relative isolate z-0 h-full w-full ${compact ? 'agriorbit-map-preview' : ''}`}>
      <MapContainer
        center={BD_CENTER}
        zoom={compact ? 6.4 : 6.9}
        zoomSnap={0.2}
        minZoom={5}
        maxZoom={12}
        maxBounds={BD_BOUNDS}
        maxBoundsViscosity={0.65}
        zoomControl={false}
        scrollWheelZoom={!compact}
        dragging
        className="h-full w-full bg-[#0A0A0A]"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions" target="_blank" rel="noreferrer">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        <MapResize />
        <MapClickToClear onClear={() => onSelectDistrict?.(null)} />
        {!compact && <ZoomControl position="topright" />}
        {!compact && <FlyToSelection district={selectedDistrict} />}

        {layer === 'grace' && (
          <GeoJSON
            key={`grace-cells-${activeMonth}-${lang}`}
            data={dataset.grace.cells}
            style={graceCellStyle}
            onEachFeature={onEachGraceCell}
          />
        )}

        <GeoJSON
          key={`districts-${layer}-${activeMonth}-${selectedDistrictId ?? 'none'}-${lang}`}
          data={dataset.districts}
          style={districtStyle}
          onEachFeature={onEachDistrict}
        />

        {hotspotFeatures && (
          <GeoJSON
            key={`hotspots-${layer}-${hotspots?.dry.join(',')}-${hotspots?.erosion.join(',')}`}
            data={hotspotFeatures}
            style={hotspotStyle}
            interactive={false}
          />
        )}

        {selectedFeature && (
          <GeoJSON
            key={`selected-${selectedDistrictId}-${layer}`}
            data={selectedFeature}
            style={{
              color: '#FAFAFA',
              weight: 2.8,
              fill: false,
              opacity: 1,
              bubblingMouseEvents: false,
            }}
            interactive={false}
          />
        )}

        {layer === 'grace' &&
          dataset.grace.regions.map((region) => (
            <GraceRegionLabel
              key={`${region.id}-${activeMonth}-${lang}`}
              region={region}
              month={activeMonth}
            />
          ))}
      </MapContainer>
    </div>
  );
}

function GraceRegionLabel({ region, month }: { region: GraceRegion; month: string }) {
  const { t, num, lang } = useLang();
  const value = getGraceValue(region, month);
  const icon = L.divIcon({
    className: 'agriorbit-grace-label-wrap',
    html: `
      <div class="agriorbit-grace-label">
        <div class="agriorbit-grace-label-name">${escapeHtml(
          lang === 'bn' ? `মাসকন ${region.masconId}` : `Mascon ${region.masconId}`
        )}</div>
        <div class="agriorbit-grace-label-value">${
          value === null
            ? escapeHtml(t.map.noData)
            : escapeHtml(`${num(value, 1, true)} ${t.map.units.cm}`)
        }</div>
        <div class="agriorbit-grace-label-note">${escapeHtml(t.map.regional)}</div>
      </div>
    `,
    iconSize: [120, 40],
    iconAnchor: [60, 20],
  });
  return <Marker position={[region.lat, region.lng]} icon={icon} interactive={false} keyboard={false} alt={t.map.regionLabel(String(region.masconId))} />;
}
