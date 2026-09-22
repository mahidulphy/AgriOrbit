import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import circle from '@turf/circle';
import type * as GeoJSON from 'geojson';

export interface MapFlyTarget {
  lng: number;
  lat: number;
  zoom: number;
  nonce: number;
}

interface BangladeshMapProps {
  latitude: number;
  longitude: number;
  onSelect: (lat: number, lng: number) => void;
  flyTarget: MapFlyTarget | null;
  children?: React.ReactNode;
  onReady?: () => void;
}

export const BANGLADESH_CENTER: [number, number] = [90.3563, 23.685];
export const BANGLADESH_ZOOM = 5.5;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// 5 km analysis context around the field pin. Turf computes a true
// geographic circle (longitude corrected for latitude), 64 steps.
export const CONTEXT_RADIUS_KM = 5;

function contextCircle(lng: number, lat: number): GeoJSON.Feature {
  return circle([lng, lat], CONTEXT_RADIUS_KM, { units: 'kilometers', steps: 64 });
}

if (!maplibregl.getWorkerUrl()) {
  maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
}

export const BangladeshMap: React.FC<BangladeshMapProps> = ({
  latitude,
  longitude,
  onSelect,
  flyTarget,
  children,
  onReady,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const initialRef = useRef({ lat: latitude, lng: longitude });
  const readyRef = useRef(onReady);
  readyRef.current = onReady;

  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;

  const syncMarkerAndContext = (lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([lng, lat]);
    const source = map.getSource('nasa-context') as maplibregl.GeoJSONSource | undefined;
    source?.setData(contextCircle(lng, lat));
  };

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: BANGLADESH_CENTER,
      zoom: BANGLADESH_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('error', (event) => {
      console.error('MapLibre error:', event.error);
    });

    const handleResize = () => map.resize();
    window.addEventListener('resize', handleResize);

    map.on('load', () => {
      map.resize();
      if (import.meta.env.DEV) {
        (window as unknown as { __agriorbitMap?: maplibregl.Map }).__agriorbitMap = map;
      }
      const { lat, lng } = initialRef.current;
      map.addSource('nasa-context', { type: 'geojson', data: contextCircle(lng, lat) });
      map.addLayer({
        id: 'nasa-context-fill',
        type: 'fill',
        source: 'nasa-context',
        paint: { 'fill-color': '#B8FF3D', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: 'nasa-context-line',
        type: 'line',
        source: 'nasa-context',
        paint: { 'line-color': '#B8FF3D', 'line-opacity': 0.8, 'line-width': 2 },
      });

      const el = document.createElement('div');
      el.className = 'agriorbit-field-marker';
      el.title = 'Selected field';
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        selectRef.current(Number(pos.lat.toFixed(4)), Number(pos.lng.toFixed(4)));
      });
      markerRef.current = marker;

      map.on('click', (e: maplibregl.MapMouseEvent) => {
        selectRef.current(Number(e.lngLat.lat.toFixed(4)), Number(e.lngLat.lng.toFixed(4)));
      });
      readyRef.current?.();
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Parent-driven pin position (dropdowns, presets, external updates).
  useEffect(() => {
    syncMarkerAndContext(longitude, latitude);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // Parent-driven camera moves.
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [flyTarget.lng, flyTarget.lat],
      zoom: flyTarget.zoom,
      speed: 1.5,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [flyTarget?.nonce]);

  return (
    <div className="agriorbit-map-container relative w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-inner">
      <div ref={containerRef} className="absolute inset-0" />
      {children}
    </div>
  );
};
