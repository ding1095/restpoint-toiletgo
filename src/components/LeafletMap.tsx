import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { RestroomPlace } from '../types';
import { THAILAND_REGIONS, ThailandRegion } from '../lib/thailandRegions';
import { Crosshair, Globe, Compass, X } from 'lucide-react';

interface LeafletMapProps {
  restrooms: RestroomPlace[];
  selectedPlace: RestroomPlace | null;
  onSelectPlace: (place: RestroomPlace) => void;
  userLocation: { lat: number; lng: number } | null;
  routeCoordinates?: [number, number][]; // [lat, lng] array
  startPoint?: { lat: number; lng: number; name: string } | null;
  destPoint?: { lat: number; lng: number; name: string } | null;
  mapPickingMode?: 'start' | 'dest' | null;
  onMapClickCoord?: (coords: { lat: number; lng: number }) => void;
  onCancelPickingMode?: () => void;
  onMarkerDragEnd?: (type: 'start' | 'dest', coords: { lat: number; lng: number }) => void;
  highlightedRestroomIds?: string[];
  activeRegion?: string;
  onSelectRegion?: (regionId: string) => void;
  showRegionBar?: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  restrooms,
  selectedPlace,
  onSelectPlace,
  userLocation,
  routeCoordinates,
  startPoint,
  destPoint,
  mapPickingMode,
  onMapClickCoord,
  onCancelPickingMode,
  onMarkerDragEnd,
  highlightedRestroomIds = [],
  activeRegion = 'all',
  onSelectRegion,
  showRegionBar = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const initialFitDoneRef = useRef<boolean>(false);

  const [currentRegion, setCurrentRegion] = useState<string>(activeRegion);

  // Sync internal state with prop
  useEffect(() => {
    setCurrentRegion(activeRegion);
  }, [activeRegion]);

  // Initialize Leaflet Map centered across Thailand
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Thailand nationwide (lat: 13.5, lng: 100.9, zoom: 6)
    const map = L.map(mapContainerRef.current, {
      center: [13.2, 101.0],
      zoom: 6,
      zoomControl: false,
      preferCanvas: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Click handler for map picking mode
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickCoord) {
        onMapClickCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update onMapClickCoord listener
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    map.off('click');
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (onMapClickCoord) {
        onMapClickCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    });
  }, [onMapClickCoord]);

  // Jump to region helper
  const handleJumpToRegion = (region: ThailandRegion) => {
    setCurrentRegion(region.id);
    if (onSelectRegion) {
      onSelectRegion(region.id);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    if (region.id === 'all') {
      // Fit all restrooms if available
      if (restrooms.length > 0) {
        const bounds = L.latLngBounds(restrooms.map((r) => [r.coordinates.lat, r.coordinates.lng]));
        map.fitBounds(bounds.pad(0.1), { animate: true, duration: 1.0 });
      } else {
        map.flyTo(region.center, region.zoom, { duration: 1.0 });
      }
    } else {
      map.flyTo(region.center, region.zoom, { duration: 1.0 });
    }
  };

  // Fit bounds when restrooms load initially (if not on a specific route)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || restrooms.length === 0 || initialFitDoneRef.current) return;

    // Only auto-fit once on mount if no route exists
    if (!routeCoordinates || routeCoordinates.length === 0) {
      initialFitDoneRef.current = true;
      // Fit to all Thailand with nationwide view
      map.setView([13.2, 101.0], 6);
    }
  }, [restrooms, routeCoordinates]);

  // Update restroom markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    restrooms.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isHighlightedOnRoute = highlightedRestroomIds.includes(place.id);

      let badgeColor = isHighlightedOnRoute ? '#10b981' : '#059669';
      let label = '💩';

      if (place.category === 'gas_station') {
        badgeColor = isHighlightedOnRoute ? '#0ea5e9' : '#0284c7';
        label = '⛽';
      } else if (place.category === 'shopping_mall') {
        badgeColor = '#8b5cf6';
        label = '🏬';
      } else if (place.category === 'transit_hub') {
        badgeColor = '#f97316';
        label = '✈️';
      } else if (place.category === 'camping_nature') {
        badgeColor = '#16a34a';
        label = '⛺';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%) ${isSelected ? 'scale(1.28)' : isHighlightedOnRoute ? 'scale(1.12)' : 'scale(1)'};
            transition: transform 0.2s ease;
            cursor: pointer;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));
          ">
            <div style="
              background: ${isSelected ? '#f59e0b' : badgeColor};
              color: white;
              border-radius: 9999px;
              padding: 5px 9px;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 4px;
              border: ${isHighlightedOnRoute ? '2.5px solid #fbbf24' : '2px solid white'};
              white-space: nowrap;
            ">
              <span>${label}</span>
              <span>${place.overallRating.toFixed(1)} ★</span>
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-top: 7px solid ${isSelected ? '#f59e0b' : badgeColor};
              margin: 0 auto;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: customIcon })
        .addTo(map)
        .on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          onSelectPlace(place);
        });

      markersRef.current[place.id] = marker;
    });
  }, [restrooms, selectedPlace, onSelectPlace, highlightedRestroomIds]);

  // Center on selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 14, {
      duration: 1.0,
    });
  }, [selectedPlace]);

  // Handle Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }

    if (routeCoordinates && routeCoordinates.length > 0) {
      const polyline = L.polyline(routeCoordinates, {
        color: '#059669',
        weight: 6,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);

      routePolylineRef.current = polyline;

      // Fit map bounds to show entire route with padding
      map.fitBounds(polyline.getBounds().pad(0.15), {
        animate: true,
        duration: 1.2,
      });
    }
  }, [routeCoordinates]);

  // Handle Start & Destination Markers (Draggable!)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (startMarkerRef.current) {
      startMarkerRef.current.remove();
      startMarkerRef.current = null;
    }
    if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }

    // Start Marker (Green Flag - Draggable)
    if (startPoint) {
      const startIcon = L.divIcon({
        className: 'start-point-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%);
            background: #10b981;
            color: white;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 5px;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);
            white-space: nowrap;
            cursor: grab;
          ">
            <span>🚩 เริ่มต้น: ${startPoint.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([startPoint.lat, startPoint.lng], { 
        icon: startIcon,
        draggable: true,
        title: 'ลากหมุดเพื่อเปลี่ยนจุดเริ่มต้น',
      }).addTo(map);

      marker.on('dragend', (e) => {
        const latlng = e.target.getLatLng();
        if (onMarkerDragEnd) {
          onMarkerDragEnd('start', { lat: latlng.lat, lng: latlng.lng });
        }
      });

      startMarkerRef.current = marker;
    }

    // Dest Marker (Red Flag - Draggable)
    if (destPoint) {
      const destIcon = L.divIcon({
        className: 'dest-point-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%);
            background: #ef4444;
            color: white;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 5px;
            border: 2px solid white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.45);
            white-space: nowrap;
            cursor: grab;
          ">
            <span>🏁 ปลายทาง: ${destPoint.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([destPoint.lat, destPoint.lng], { 
        icon: destIcon,
        draggable: true,
        title: 'ลากหมุดเพื่อเปลี่ยนจุดหมาย',
      }).addTo(map);

      marker.on('dragend', (e) => {
        const latlng = e.target.getLatLng();
        if (onMarkerDragEnd) {
          onMarkerDragEnd('dest', { lat: latlng.lat, lng: latlng.lng });
        }
      });

      destMarkerRef.current = marker;
    }
  }, [startPoint, destPoint, onMarkerDragEnd]);

  // Handle user location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
      } else {
        const userIcon = L.divIcon({
          className: 'user-location-marker',
          html: `
            <div style="
              width: 18px; 
              height: 18px; 
              background: #3b82f6; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.35);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>ตำแหน่งของคุณ</b>');
      }
    }
  }, [userLocation]);

  return (
    <div className={`relative w-full h-full min-h-[440px] sm:min-h-[520px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-inner select-none ${
      mapPickingMode ? 'cursor-crosshair' : ''
    }`}>
      
      {/* 🧭 Top Region Jump Bar (Instant navigation to North, Isan, South, Central, East, West) */}
      {showRegionBar && (
        <div className="absolute top-3 left-3 right-3 sm:right-auto z-[400] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none max-w-[calc(100%-24px)] pointer-events-auto">
          {THAILAND_REGIONS.map((region) => {
            const isActive = currentRegion === region.id;
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => handleJumpToRegion(region)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold transition-all backdrop-blur-md shadow-md border shrink-0 flex items-center gap-1 cursor-pointer active:scale-95 ${
                  isActive
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-700/30 ring-2 ring-emerald-400/40'
                    : 'bg-white/90 text-slate-700 border-white/80 hover:bg-white hover:text-slate-900'
                }`}
                title={`กระโดดไปดูห้องน้ำใน ${region.name}`}
              >
                <span>{region.icon}</span>
                <span>{region.shortName}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 📍 Map Picking Mode Banner (Prominent interactive feedback) */}
      {mapPickingMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[400] w-[90%] sm:w-auto max-w-md bg-slate-950/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl shadow-2xl border border-emerald-400 flex items-center justify-between gap-3 backdrop-blur-md animate-bounce">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>
              {mapPickingMode === 'start' 
                ? '🚩 แตะตำแหน่งบนแผนที่ เพื่อปักหมุดจุดเริ่มต้น' 
                : '🏁 แตะตำแหน่งบนแผนที่ เพื่อปักหมุดจุดหมายปลายทาง'}
            </span>
          </div>
          {onCancelPickingMode && (
            <button
              type="button"
              onClick={onCancelPickingMode}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="ยกเลิกการปักหมุด"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Floating Action Buttons (Fit Thailand & GPS) */}
      <div className="absolute bottom-5 left-4 z-[400] flex flex-col gap-2">
        {/* Whole Thailand Button */}
        <button
          type="button"
          onClick={() => {
            const map = mapInstanceRef.current;
            if (!map) return;
            setCurrentRegion('all');
            if (onSelectRegion) onSelectRegion('all');
            map.flyTo([13.2, 101.0], 6, { duration: 1.0 });
          }}
          className="p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-lg border border-slate-200/80 backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          title="ดูทั่วประเทศไทย"
        >
          <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="hidden sm:inline">ดูทั่วไทย 🇹🇭</span>
        </button>

        {/* Fly to User GPS */}
        {userLocation && (
          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.0 });
            }}
            className="p-2.5 sm:px-3 sm:py-2 rounded-2xl bg-white/90 hover:bg-white text-slate-800 text-xs font-bold shadow-lg border border-slate-200/80 backdrop-blur-md flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            title="พิกัดของฉัน"
          >
            <Crosshair className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="hidden sm:inline">ตำแหน่งฉัน</span>
          </button>
        )}
      </div>

      {/* Underlying Leaflet Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[440px] sm:min-h-[520px]" />
    </div>
  );
};
