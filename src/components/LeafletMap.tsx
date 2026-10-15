import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RestroomPlace } from '../types';
import { getCategoryMeta } from '../lib/categories';
import { LocateFixed, Maximize2, X } from 'lucide-react';

export interface MapFlyTarget {
  center: [number, number];
  zoom: number;
  /** Change this value to re-trigger the same target */
  key: number;
  /** When true, fit the whole of Thailand instead of flying to center */
  fitThailand?: boolean;
}

interface LeafletMapProps {
  restrooms: RestroomPlace[];
  selectedPlace: RestroomPlace | null;
  onSelectPlace: (place: RestroomPlace) => void;
  userLocation: { lat: number; lng: number } | null;
  onLocate?: () => void;
  routeCoordinates?: [number, number][]; // [lat, lng]
  startPoint?: { lat: number; lng: number; name: string } | null;
  destPoint?: { lat: number; lng: number; name: string } | null;
  mapPickingMode?: 'start' | 'dest' | null;
  onMapClickCoord?: (coords: { lat: number; lng: number }) => void;
  onCancelPickingMode?: () => void;
  onMarkerDragEnd?: (type: 'start' | 'dest', coords: { lat: number; lng: number }) => void;
  highlightedRestroomIds?: string[];
  /** Fade markers that are not highlighted (used in route mode) */
  dimOthers?: boolean;
  flyTarget?: MapFlyTarget | null;
}

const THAILAND_BOUNDS = L.latLngBounds([5.6, 97.3], [20.5, 105.7]);

const isDesktop = () => window.innerWidth >= 1024;

/** Keep content clear of the floating side panel (desktop) or bottom sheet (mobile) */
function getFitPadding(): L.FitBoundsOptions {
  if (isDesktop()) {
    return { paddingTopLeft: [440, 60], paddingBottomRight: [60, 60] };
  }
  return { paddingTopLeft: [30, 70], paddingBottomRight: [30, Math.round(window.innerHeight * 0.42)] };
}

function getCenterOffset(): [number, number] {
  return isDesktop() ? [-200, 0] : [0, Math.round(window.innerHeight * 0.18)];
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  restrooms,
  selectedPlace,
  onSelectPlace,
  userLocation,
  onLocate,
  routeCoordinates,
  startPoint,
  destPoint,
  mapPickingMode,
  onMapClickCoord,
  onCancelPickingMode,
  onMarkerDragEnd,
  highlightedRestroomIds = [],
  dimOthers = false,
  flyTarget,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const flagsLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Keep latest callbacks in refs so Leaflet handlers never go stale
  const clickRef = useRef(onMapClickCoord);
  const dragRef = useRef(onMarkerDragEnd);
  const selectRef = useRef(onSelectPlace);
  clickRef.current = onMapClickCoord;
  dragRef.current = onMarkerDragEnd;
  selectRef.current = onSelectPlace;

  const flyToOffset = (lat: number, lng: number, zoom: number) => {
    const map = mapRef.current;
    if (!map) return;
    const [ox, oy] = getCenterOffset();
    const pt = map.project([lat, lng], zoom).add([ox, oy]);
    map.flyTo(map.unproject(pt, zoom), zoom, { duration: 0.8 });
  };

  const fitThailand = (animate = true) => {
    mapRef.current?.fitBounds(THAILAND_BOUNDS, { ...getFitPadding(), animate });
  };

  // Init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: true,
      preferCanvas: true,
      minZoom: 5,
    });

    // OpenStreetMap standard tiles (no API key required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);
    flagsLayerRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      clickRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    });

    mapRef.current = map;
    map.fitBounds(THAILAND_BOUNDS, { ...getFitPadding(), animate: false });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Restroom pins
  useEffect(() => {
    const layer = markersLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const highlighted = new Set(highlightedRestroomIds);

    restrooms.forEach((place) => {
      const meta = getCategoryMeta(place.category);
      const isSelected = selectedPlace?.id === place.id;
      const isFaded = dimOthers && !highlighted.has(place.id) && !isSelected;
      const size = isSelected ? 42 : isFaded ? 20 : 30;

      const icon = L.divIcon({
        className: 'poo-pin',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        html: `<div style="
          width:${size}px;height:${size}px;border-radius:9999px;
          background:${isSelected ? meta.color : '#fff'};
          border:${isFaded ? 1.5 : 2.5}px solid ${meta.color};
          display:flex;align-items:center;justify-content:center;
          font-size:${isSelected ? 20 : isFaded ? 10 : 15}px;
          box-shadow:0 2px 8px rgba(15,23,42,${isFaded ? 0.08 : 0.22});
          opacity:${isFaded ? 0.55 : 1};
          transition:all .2s ease;">${meta.emoji}</div>`,
      });

      L.marker([place.coordinates.lat, place.coordinates.lng], {
        icon,
        zIndexOffset: isSelected ? 1000 : isFaded ? -100 : 0,
        keyboard: false,
      })
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          selectRef.current(place);
        })
        .addTo(layer);
    });
  }, [restrooms, selectedPlace, highlightedRestroomIds, dimOthers]);

  // Fly to selected place
  useEffect(() => {
    if (!selectedPlace) return;
    flyToOffset(selectedPlace.coordinates.lat, selectedPlace.coordinates.lng, 14);
  }, [selectedPlace]);

  // External fly target (regions etc.)
  useEffect(() => {
    if (!flyTarget || !mapRef.current) return;
    if (flyTarget.fitThailand) {
      fitThailand();
    } else {
      flyToOffset(flyTarget.center[0], flyTarget.center[1], flyTarget.zoom);
    }
  }, [flyTarget?.key]);

  // Route polyline (white casing + green line)
  useEffect(() => {
    const layer = routeLayerRef.current;
    const map = mapRef.current;
    if (!layer || !map) return;
    layer.clearLayers();

    if (routeCoordinates && routeCoordinates.length > 1) {
      L.polyline(routeCoordinates, { color: '#ffffff', weight: 9, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
      const line = L.polyline(routeCoordinates, { color: '#059669', weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' }).addTo(layer);
      map.fitBounds(line.getBounds(), { ...getFitPadding(), animate: true });
    }
  }, [routeCoordinates]);

  // Start / destination (draggable)
  useEffect(() => {
    const layer = flagsLayerRef.current;
    if (!layer) return;
    layer.clearLayers();

    const addFlag = (type: 'start' | 'dest', p: { lat: number; lng: number }) => {
      const html =
        type === 'start'
          ? `<div style="width:22px;height:22px;border-radius:9999px;background:#fff;border:6px solid #10b981;box-shadow:0 2px 10px rgba(16,185,129,.5)"></div>`
          : `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#ef4444;border:3px solid #fff;box-shadow:0 3px 10px rgba(239,68,68,.45);display:flex;align-items:center;justify-content:center"><div style="width:8px;height:8px;background:#fff;border-radius:9999px"></div></div>`;

      const icon = L.divIcon({
        className: 'poo-flag',
        html,
        iconSize: type === 'start' ? [22, 22] : [30, 30],
        iconAnchor: type === 'start' ? [11, 11] : [15, 34],
      });

      L.marker([p.lat, p.lng], { icon, draggable: true, zIndexOffset: 2000 })
        .on('dragend', (e) => {
          const ll = (e.target as L.Marker).getLatLng();
          dragRef.current?.(type, { lat: ll.lat, lng: ll.lng });
        })
        .addTo(layer);
    };

    if (startPoint) addFlag('start', startPoint);
    if (destPoint) addFlag('dest', destPoint);
  }, [startPoint?.lat, startPoint?.lng, destPoint?.lat, destPoint?.lng]);

  // User location
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: 'poo-pin',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          html: `<div style="width:18px;height:18px;background:#3b82f6;border:3px solid #fff;border-radius:9999px;box-shadow:0 0 0 7px rgba(59,130,246,.22)"></div>`,
        }),
        interactive: false,
      }).addTo(map);
    }
  }, [userLocation]);

  const handleLocate = () => {
    if (userLocation) {
      flyToOffset(userLocation.lat, userLocation.lng, 13);
    }
    onLocate?.();
  };

  const roundBtn =
    'w-11 h-11 rounded-full bg-white/95 backdrop-blur shadow-lg shadow-slate-900/10 ring-1 ring-slate-900/5 flex items-center justify-center text-slate-700 hover:bg-white active:scale-95 transition';

  return (
    <div className={`absolute inset-0 z-0 ${mapPickingMode ? 'cursor-crosshair' : ''}`}>
      <div ref={containerRef} className="absolute inset-0" />

      {/* Map controls */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col gap-2">
        {onLocate && (
          <button type="button" onClick={handleLocate} className={roundBtn} aria-label="ตำแหน่งของฉัน">
            <LocateFixed className="w-5 h-5 text-blue-600" />
          </button>
        )}
        <button type="button" onClick={() => fitThailand()} className={roundBtn} aria-label="ดูทั้งประเทศ">
          <Maximize2 className="w-[18px] h-[18px]" />
        </button>
      </div>

      {/* Picking banner */}
      {mapPickingMode && (
        <div className="absolute top-3 left-3 right-16 lg:left-[440px] lg:right-auto z-[400] fade-up">
          <div className="inline-flex items-center gap-3 bg-slate-900 text-white text-sm font-medium pl-4 pr-1.5 py-1.5 rounded-full shadow-xl">
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${mapPickingMode === 'start' ? 'bg-emerald-400' : 'bg-red-400'}`}
            />
            <span>แตะแผนที่เพื่อเลือก{mapPickingMode === 'start' ? 'จุดเริ่มต้น' : 'ปลายทาง'}</span>
            {onCancelPickingMode && (
              <button
                type="button"
                onClick={onCancelPickingMode}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                aria-label="ยกเลิก"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
