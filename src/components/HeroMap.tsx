import React, { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { getDistrictAdmin } from '../data/bdAdmin';

interface HeroMapProps {
  children?: React.ReactNode;
}

const FIELD = { lat: 25.7439, lng: 89.2752 };
const SECONDARY_DOTS = ['dhaka', 'rajshahi', 'khulna', 'chattogram'] as const;

if (!maplibregl.getWorkerUrl()) {
  maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs');
}

/**
 * Dark stylized Bangladesh overview for the hero. Real tiles, a glowing
 * lime field pin on Rangpur, quiet cyan dots on a few other districts,
 * and a subtle orbit-to-field arc. Decorative, not a data instrument.
 */
export const HeroMap: React.FC<HeroMapProps> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://tiles.openfreemap.org/styles/dark',
      center: [90.4, 23.9],
      zoom: 5,
      interactive: false,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.on('styleimagemissing', (e) => {
      const id = e?.id;
      if (!id || typeof id !== 'string') return;
      if (!map.hasImage(id)) {
        try {
          map.addImage(id, {
            width: 1,
            height: 1,
            data: new Uint8Array([0, 0, 0, 0]),
          });
        } catch {
          // ignore duplicate or race condition addition
        }
      }
    });

    map.on('error', (event) => {
      const msg = event?.error?.message || String(event?.error || '');
      if (msg.includes('width') || msg.includes('404') || msg.includes('abort')) {
        return;
      }
      console.warn('HeroMap event:', event.error);
    });

    map.on('load', () => {
      map.resize();
      const pin = document.createElement('div');
      pin.className = 'agriorbit-field-marker';
      new maplibregl.Marker({ element: pin }).setLngLat([FIELD.lng, FIELD.lat]).addTo(map);

      for (const id of SECONDARY_DOTS) {
        const admin = getDistrictAdmin(id);
        if (!admin) continue;
        const dot = document.createElement('div');
        dot.className = 'agriorbit-hero-dot';
        new maplibregl.Marker({ element: dot }).setLngLat([admin.lng, admin.lat]).addTo(map);
      }
    });

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
    <div className="agriorbit-hero-map relative overflow-hidden rounded-xl border border-white/10">
      <div ref={containerRef} className="absolute inset-0" />
      {/* Orbit-to-field arc: satellite pass suggestion, top-center to Rangpur */}
      <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full border border-[#00E5FF]/50 bg-[#050B14]/80">
          <div className="h-2 w-2 rounded-full bg-[#00E5FF]" />
        </div>
      </div>
      <svg
        className="agriorbit-orbit-arc pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          d="M 50 8 C 46 18, 40 27, 31 37"
          fill="none"
          className="orbit-path"
          strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {children}
    </div>
  );
};
