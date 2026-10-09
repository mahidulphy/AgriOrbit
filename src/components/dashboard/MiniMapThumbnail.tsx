import React, { useState } from 'react';
import { MapPin, Maximize2, Satellite, Compass, Layers } from 'lucide-react';
import type { Language } from '../../types';

export interface MiniMapThumbnailProps {
  district?: string;
  upazila?: string;
  lat?: number;
  lng?: number;
  language?: Language;
  onExpand?: () => void;
  className?: string;
}

/**
 * 3. Mini Map Thumbnail Layer
 * A compact, elegant map placeholder card ready for Leaflet/MapLibre integration.
 * Sits beside the "Field Analysis: Mithapukur, Rangpur" header with a subtle glowing border.
 */
export const MiniMapThumbnail: React.FC<MiniMapThumbnailProps> = ({
  district = 'Rangpur',
  upazila = 'Mithapukur',
  lat = 25.58,
  lng = 89.27,
  language = 'en',
  onExpand,
  className = '',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const isEn = language === 'en';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative overflow-hidden rounded-2xl border border-[#00E5FF]/30 bg-[#0B1626]/85 backdrop-blur-md transition-all duration-300 hover:border-[#00E5FF]/70 shadow-[0_0_25px_rgba(0,229,255,0.12)] hover:shadow-[0_0_35px_rgba(0,229,255,0.22)] ${className}`}
      style={{ minWidth: '220px', maxWidth: '340px' }}
    >
      {/* MAP ENGINE MOUNT TARGET CONTAINER */}
      <div
        id="agriorbit-mini-map-container"
        data-lat={lat}
        data-lng={lng}
        data-upazila={upazila}
        data-district={district}
        className="relative h-28 sm:h-32 w-full overflow-hidden bg-[#050B14]"
      >
        {/* Subtle SVG Grid & Contour Layer (Mock Leaflet/MapLibre vector terrain preview) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="mini-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#00E5FF" strokeWidth="0.5" strokeOpacity="0.2" />
            </pattern>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mini-map-grid)" />

          {/* Topographic Bangladesh River / Contour abstract lines */}
          <path
            d="M -10 20 Q 80 50 140 30 T 280 80 T 360 40"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
          <path
            d="M 10 90 Q 90 70 170 100 T 320 110"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />
        </svg>

        {/* 5 km Satellite Context Field Circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Radar scan ring */}
            <div className="h-20 w-20 rounded-full border border-[#00E5FF]/40 bg-[#00E5FF]/5 animate-pulse" />
            <div className="absolute h-10 w-10 rounded-full border border-[#B8FF3D]/40 bg-[#B8FF3D]/5" />

            {/* Target Crosshairs */}
            <div className="absolute h-24 w-[1px] bg-[#00E5FF]/20" />
            <div className="absolute w-24 h-[1px] bg-[#00E5FF]/20" />

            {/* Field Marker Pin */}
            <div className="relative flex items-center justify-center">
              <span className="absolute h-3 w-3 rounded-full bg-[#B8FF3D] opacity-75 animate-ping" />
              <div className="relative h-2.5 w-2.5 rounded-full bg-[#B8FF3D] border border-[#050B14] shadow-md shadow-[#B8FF3D]" />
            </div>
          </div>
        </div>

        {/* Top telemetry badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-[#050B14]/80 backdrop-blur-sm px-2 py-0.5 rounded-md text-[#00E5FF] border border-white/10">
            <Satellite className="w-2.5 h-2.5" />
            <span>SMAP 9km Grid</span>
          </span>
          <span className="bg-[#050B14]/80 backdrop-blur-sm px-1.5 py-0.5 rounded-md text-[#B8FF3D] border border-white/10 font-bold">
            5km Radius
          </span>
        </div>

        {/* Bottom coordinates HUD */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#8FA3B8] pointer-events-none">
          <span className="bg-[#050B14]/90 px-1.5 py-0.5 rounded text-white font-medium">
            {lat.toFixed(2)}°N, {lng.toFixed(2)}°E
          </span>
          <span className="text-[9px] text-[#00E5FF]">WGS84</span>
        </div>
      </div>

      {/* FOOTER BAR OF THE MINI MAP */}
      <div className="p-2.5 px-3 bg-[#0B1626]/95 border-t border-white/10 flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-[#B8FF3D] shrink-0" />
          <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
            {upazila}, {district}
          </span>
        </div>

        <button
          type="button"
          onClick={onExpand}
          aria-label={isEn ? 'Expand map' : 'মানচিত্র বড় করুন'}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-[#00E5FF]/20 text-[#00E5FF] hover:text-white border border-[#00E5FF]/30 text-[10px] font-mono font-bold transition-colors cursor-pointer shrink-0"
        >
          <span>{isEn ? 'Map' : 'মানচিত্র'}</span>
          <Maximize2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
