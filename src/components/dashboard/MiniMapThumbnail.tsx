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
      className={`group relative overflow-hidden rounded-xl border border-[#262626] bg-[#141414] transition-colors hover:border-[#404040] ${className}`}
      style={{ minWidth: '220px', maxWidth: '340px' }}
    >
      {/* MAP ENGINE MOUNT TARGET CONTAINER */}
      <div
        id="agriorbit-mini-map-container"
        data-lat={lat}
        data-lng={lng}
        data-upazila={upazila}
        data-district={district}
        className="relative h-28 sm:h-32 w-full overflow-hidden bg-[#0A0A0A]"
      >
        {/* Subtle SVG Grid & Contour Layer (Mock Leaflet/MapLibre vector terrain preview) */}
        <svg
          className="absolute inset-0 h-full w-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="mini-map-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#262626" strokeWidth="0.5" strokeOpacity="0.2" />
            </pattern>
            <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#404040" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#404040" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#mini-map-grid)" />

          {/* Topographic Bangladesh River / Contour abstract lines */}
          <path
            d="M -10 20 Q 80 50 140 30 T 280 80 T 360 40"
            fill="none"
            stroke="#404040"
            strokeWidth="1.2"
            strokeOpacity="0.3"
          />
          <path
            d="M 10 90 Q 90 70 170 100 T 320 110"
            fill="none"
            stroke="#333333"
            strokeWidth="0.8"
            strokeOpacity="0.25"
          />
        </svg>

        {/* 5 km Satellite Context Field Circle */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative flex items-center justify-center">
            {/* Radar scan ring */}
            <div className="h-20 w-20 rounded-full border border-[#262626]" />
            

            {/* Target Crosshairs */}
            <div className="absolute h-24 w-[1px] bg-[#404040]" />
            <div className="absolute w-24 h-[1px] bg-[#404040]" />

            {/* Field Marker Pin */}
            <div className="relative flex items-center justify-center">
              
              <div className="relative h-2.5 w-2.5 rounded-full bg-[#22C55E] border border-[#0A0A0A]" />
            </div>
          </div>
        </div>

        {/* Top telemetry badges */}
        <div className="absolute top-2 left-2 right-2 flex items-center justify-between text-[10px] font-mono pointer-events-none">
          <span className="inline-flex items-center gap-1 bg-[#141414] px-2 py-0.5 rounded text-[#A3A3A3] border border-[#262626]">
            <Satellite className="w-2.5 h-2.5" />
            <span>SMAP 9km Grid</span>
          </span>
          <span className="bg-[#141414] px-1.5 py-0.5 rounded text-[#22C55E] border border-[#262626] font-semibold">
            5km Radius
          </span>
        </div>

        {/* Bottom coordinates HUD */}
        <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between text-[10px] font-mono text-[#737373] pointer-events-none">
          <span className="bg-[#141414] px-1.5 py-0.5 rounded text-[#FAFAFA] font-medium border border-[#262626]">
            {lat.toFixed(2)}°N, {lng.toFixed(2)}°E
          </span>
          <span className="text-[9px] text-[#A3A3A3]">WGS84</span>
        </div>
      </div>

      {/* FOOTER BAR OF THE MINI MAP */}
      <div className="p-2.5 px-3 bg-[#141414] border-t border-[#262626] flex items-center justify-between gap-2">
        <div className="min-w-0 flex items-center gap-1.5 text-xs">
          <MapPin className="w-3.5 h-3.5 text-[#22C55E] shrink-0" />
          <span className="font-semibold text-white truncate text-[11px] sm:text-xs">
            {upazila}, {district}
          </span>
        </div>

        <button
          type="button"
          onClick={onExpand}
          aria-label={isEn ? 'Expand map' : 'মানচিত্র বড় করুন'}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 hover:bg-[#404040] text-[#A3A3A3] hover:text-white border border-[#262626] text-[10px] font-mono font-bold transition-colors cursor-pointer shrink-0"
        >
          <span>{isEn ? 'Map' : 'মানচিত্র'}</span>
          <Maximize2 className="w-2.5 h-2.5" />
        </button>
      </div>
    </div>
  );
};
