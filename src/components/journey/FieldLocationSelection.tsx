import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Crosshair, MapPin, ArrowLeft, AlertCircle, Check, Globe } from 'lucide-react';
import type * as GeoJSON from 'geojson';
import { DistrictId, Language } from '../../types';
import { DISTRICTS } from '../../data/agriData';

interface FieldLocationSelectionProps {
  selectedDistrict: DistrictId;
  selectedUpazila: string;
  fieldLat: number;
  fieldLng: number;
  onUpdateCoordinates: (lat: number, lng: number) => void;
  language: Language;
  onConfirmFieldLocation: () => void;
  onBack: () => void;
}

// Bangladesh overview camera: recognizable country view on load.
const BANGLADESH_CENTER: [number, number] = [90.3563, 23.685];
const BANGLADESH_ZOOM = 6.2;
const FIELD_ZOOM = 12;
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

// Approx half-size of a ~9 km NASA SMAP context cell around the pin.
const CELL_HALF_DEG_LAT = 0.04;

function contextCell(lng: number, lat: number): GeoJSON.Feature {
  const halfLat = CELL_HALF_DEG_LAT;
  const halfLng = CELL_HALF_DEG_LAT / Math.max(0.3, Math.cos((lat * Math.PI) / 180));
  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [lng - halfLng, lat - halfLat],
          [lng + halfLng, lat - halfLat],
          [lng + halfLng, lat + halfLat],
          [lng - halfLng, lat + halfLat],
          [lng - halfLng, lat - halfLat],
        ],
      ],
    },
  };
}

export const FieldLocationSelection: React.FC<FieldLocationSelectionProps> = ({
  selectedDistrict,
  selectedUpazila,
  fieldLat,
  fieldLng,
  onUpdateCoordinates,
  language,
  onConfirmFieldLocation,
  onBack,
}) => {
  const district = DISTRICTS[selectedDistrict];
  const upazilaObj =
    district.upazilas.find((u) => u.id === selectedUpazila) || district.upazilas[0];

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const initialFieldRef = useRef({ lat: fieldLat, lng: fieldLng });
  const [tilesAvailable, setTilesAvailable] = useState(true);

  // Latest coordinate callback without re-creating the map.
  const updateRef = useRef(onUpdateCoordinates);
  updateRef.current = onUpdateCoordinates;

  // Preset farm plot options in the district (offsets from district center).
  const plotPresets = [
    { name: 'North Paddy Field #1', dLat: 0.008, dLng: 0.006 },
    { name: 'South Alluvial Basin #4', dLat: -0.012, dLng: 0.004 },
    { name: 'Riverbank Silt Plot #9', dLat: -0.004, dLng: -0.011 },
    { name: 'Village Uplands #14 (Default)', dLat: 0.0, dLng: 0.0 },
  ];

  const syncMarkerAndCell = (lng: number, lat: number) => {
    const map = mapRef.current;
    if (!map) return;
    markerRef.current?.setLngLat([lng, lat]);
    const source = map.getSource('nasa-context-cell') as maplibregl.GeoJSONSource | undefined;
    source?.setData(contextCell(lng, lat));
  };

  const placeField = (lat: number, lng: number, flyZoom?: number) => {
    const roundedLat = Number(lat.toFixed(4));
    const roundedLng = Number(lng.toFixed(4));
    updateRef.current(roundedLat, roundedLng);
    syncMarkerAndCell(roundedLng, roundedLat);
    if (flyZoom !== undefined) {
      mapRef.current?.flyTo({ center: [roundedLng, roundedLat], zoom: flyZoom, speed: 1.6 });
    }
  };

  // Initialize the real Bangladesh map once.
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: BANGLADESH_CENTER,
      zoom: BANGLADESH_ZOOM,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: false }), 'top-right');

    map.on('error', () => setTilesAvailable(false));

    map.on('load', () => {
      const { lat, lng } = initialFieldRef.current;

      map.addSource('nasa-context-cell', {
        type: 'geojson',
        data: contextCell(lng, lat),
      });
      map.addLayer({
        id: 'nasa-context-fill',
        type: 'fill',
        source: 'nasa-context-cell',
        paint: { 'fill-color': '#00E5FF', 'fill-opacity': 0.08 },
      });
      map.addLayer({
        id: 'nasa-context-line',
        type: 'line',
        source: 'nasa-context-cell',
        paint: { 'line-color': '#00E5FF', 'line-opacity': 0.55, 'line-width': 1.5 },
      });

      const el = document.createElement('div');
      el.className = 'agriorbit-field-marker';
      el.title = 'Selected field';
      const marker = new maplibregl.Marker({ element: el, draggable: true })
        .setLngLat([lng, lat])
        .addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        placeField(pos.lat, pos.lng);
      });
      markerRef.current = marker;

      map.on('click', (e) => placeField(e.lngLat.lat, e.lngLat.lng));
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fly to the district when it changes (e.g. user picked another district).
  const firstDistrictRef = useRef(selectedDistrict);
  useEffect(() => {
    if (selectedDistrict === firstDistrictRef.current) return;
    firstDistrictRef.current = selectedDistrict;
    const target = DISTRICTS[selectedDistrict];
    mapRef.current?.flyTo({ center: [target.lng, target.lat], zoom: 9, speed: 1.4 });
  }, [selectedDistrict]);

  // Keep marker + context cell in sync with external coordinate changes (presets).
  useEffect(() => {
    syncMarkerAndCell(fieldLng, fieldLat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldLat, fieldLng]);

  const handleSelectPreset = (preset: (typeof plotPresets)[number]) => {
    placeField(district.lat + preset.dLat, district.lng + preset.dLng, FIELD_ZOOM);
  };

  const handleResetView = () => {
    mapRef.current?.flyTo({ center: BANGLADESH_CENTER, zoom: BANGLADESH_ZOOM, speed: 1.4 });
  };

  return (
    <div className="min-h-screen bg-[#050B14] text-white flex flex-col justify-center items-center p-4 sm:p-6 selection:bg-[#B8FF3D] selection:text-[#050B14] relative">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-[#00E5FF]/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div className="w-full max-w-3xl bg-[#0B1626] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10">
        {/* Progress Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <button
            onClick={onBack}
            className="text-xs text-[#8FA3B8] hover:text-white flex items-center gap-1 cursor-pointer transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Back' : 'পূর্ববর্তী'}</span>
          </button>

          <div className="flex items-center gap-1.5 font-mono text-xs text-[#00E5FF]">
            <span className="font-bold text-[#050B14] bg-[#00E5FF] px-2 py-0.5 rounded text-[11px]">02</span>
            <span className="text-[#8FA3B8]">/ 04</span>
            <span className="font-sans font-semibold text-[#8FA3B8] ml-1">
              {language === 'en' ? 'Field Selection' : 'নির্দিষ্ট জমি চিহ্নিতকরণ'}
            </span>
          </div>
        </div>

        {/* Section Heading */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#B8FF3D]/10 border border-[#B8FF3D]/30 flex items-center justify-center mb-2 shadow-md">
            <Crosshair className="w-5 h-5 text-[#B8FF3D]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            {language === 'en' ? 'Select your field' : 'আপনার কৃষি জমি চিহ্নিত করুন'}
          </h2>
          <p className="text-xs sm:text-sm text-[#8FA3B8] mt-1">
            {language === 'en'
              ? `Pin your actual field plot in ${district.nameEn}. Click anywhere on the map or choose a farm plot below.`
              : `${district.nameBn}-এ আপনার নির্দিষ্ট জমি নির্ধারণ করুন। মানচিত্রে ক্লিক করুন অথবা নিচের প্লট নির্বাচন করুন।`}
          </p>
        </div>

        {/* Quick Search / Plot Presets */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B8FF3D]">
              {language === 'en' ? 'Quick Plot Presets:' : 'দ্রুত প্লট নির্বাচন:'}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {plotPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#8FA3B8] hover:text-white font-medium transition cursor-pointer"
              >
                📍 {preset.name}
              </button>
            ))}
          </div>
        </div>

        {/* Real Interactive Bangladesh Map */}
        <div className="relative h-80 sm:h-[440px] w-full rounded-2xl overflow-hidden border-2 border-white/10 shadow-inner mb-4">
          <div ref={mapContainerRef} className="absolute inset-0" />

          {/* NASA context chip (subtle data overlay, not a replacement for geography) */}
          <div className="absolute top-3 left-3 px-2.5 py-1 rounded bg-black/60 backdrop-blur-sm border border-[#00E5FF]/30 text-[10px] font-mono text-[#00E5FF] pointer-events-none">
            NASA context cell · ~9 km around pin
          </div>

          {!tilesAvailable && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 text-[11px] text-[#FF5C5C] border border-[#FF5C5C]/40 pointer-events-none">
              {language === 'en'
                ? 'Map tiles unavailable — check connection'
                : 'মানচিত্র লোড হচ্ছে না — ইন্টারনেট দেখুন'}
            </div>
          )}

          {/* Reset to Bangladesh overview */}
          <button
            type="button"
            onClick={handleResetView}
            className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-white border border-white/10 hover:border-[#00E5FF]/50 hover:text-[#00E5FF] transition flex items-center gap-1.5 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language === 'en' ? 'Bangladesh overview' : 'বাংলাদেশ মানচিত্র'}</span>
          </button>

          {/* Helper hint */}
          <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-[11px] text-[#8FA3B8] border border-white/10 pointer-events-none hidden sm:block">
            {language === 'en' ? 'Click anywhere on map to reposition field pin' : 'পিন পরিবর্তন করতে মানচিত্রে ক্লিক করুন'}
          </div>
        </div>

        {/* Selected Field Coordinates Bar */}
        <div className="p-3.5 rounded-xl bg-[#050B14] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-4">
          <div className="flex items-center gap-4 font-mono text-[#8FA3B8]">
            <div>
              <span className="text-[#8FA3B8] block text-[10px]">LATITUDE</span>
              <strong className="text-white text-sm">{fieldLat}° N</strong>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <span className="text-[#8FA3B8] block text-[10px]">LONGITUDE</span>
              <strong className="text-white text-sm">{fieldLng}° E</strong>
            </div>
          </div>

          <div className="text-[11px] text-[#8FA3B8] sm:text-right">
            <strong className="text-white flex items-center gap-1 sm:justify-end">
              <MapPin className="w-3.5 h-3.5 text-[#B8FF3D]" />
              <span>
                {language === 'en' ? district.nameEn : district.nameBn} ·{' '}
                {language === 'en' ? upazilaObj.nameEn : upazilaObj.nameBn} · Bangladesh
              </span>
            </strong>
            <span className="block mt-0.5">{district.defaultFieldTag}</span>
          </div>
        </div>

        {/* Scientific honesty notice: pin vs satellite resolution */}
        <div className="p-4 rounded-xl bg-[#00E5FF]/5 border border-[#00E5FF]/30 flex items-start gap-3 text-xs leading-relaxed text-[#8FA3B8] mb-6">
          <AlertCircle className="w-5 h-5 text-[#00E5FF] shrink-0 mt-0.5" />
          <div>
            <strong className="text-white block mb-0.5">
              {language === 'en' ? 'What this map means:' : 'উপগ্রহ তথ্যের পরিসর সংক্রান্ত ব্যাখ্যা:'}
            </strong>
            {language === 'en'
              ? 'The pin marks your exact field location. NASA observations (SMAP ~9 km, POWER ~50 km, MODIS 250 m) describe the surrounding grid cell, not individual field rows. Your pin anchors local soil profile and BARI crop calendar rules.'
              : 'পিনটি আপনার নির্দিষ্ট জমির অবস্থান চিহ্নিত করে। নাসার উপগ্রহ তথ্য (স্ম্যাপ ~৯ কিমি, পাওয়ার ~৫০ কিমি, মডিস ২৫০ মি) আশপাশের গ্রিড এলাকার পরিবেশ বোঝায়। আপনার পিন স্থানীয় মাটির ধরন ও বিএআরআই কৃষি ক্যালেন্ডারের সমন্বয় ঘটায়।'}
          </div>
        </div>

        {/* CTA Button */}
        <button
          onClick={onConfirmFieldLocation}
          className="w-full py-3.5 rounded-xl bg-[#B8FF3D] hover:bg-[#B8FF3D]/85 text-[#050B14] font-black text-sm shadow-lg shadow-black/40 transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{language === 'en' ? 'Confirm Field Location' : 'জমির অবস্থান নিশ্চিত করুন'}</span>
        </button>
      </div>
    </div>
  );
};
