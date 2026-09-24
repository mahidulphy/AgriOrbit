import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

/**
 * Small non-interactive Bangladesh overview for editorial contexts
 * (landing hero). Real tiles, lime dot at the demo field.
 */
export const MiniMap: React.FC<{ lat?: number; lng?: number }> = ({
  lat = 25.7439,
  lng = 89.2752,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    if (!maplibregl.getWorkerUrl()) {
      maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
    }
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [90.4, 23.9],
      zoom: 5,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;
    map.on('load', () => {
      const el = document.createElement('div');
      el.className = 'agriorbit-field-marker';
      new maplibregl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
    });

    // Re-sync canvas size whenever layout settles (fonts, images, HMR).
    map.on('load', () => map.resize());
    const ro = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="agriorbit-map-container relative overflow-hidden rounded-lg border border-white/10">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
};
