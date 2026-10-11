import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RestroomPlace } from '../types';

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
  highlightedRestroomIds?: string[];
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
  highlightedRestroomIds = [],
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018],
      zoom: 9,
      zoomControl: false,
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
            transform: translate(-50%, -100%) ${isSelected ? 'scale(1.25)' : isHighlightedOnRoute ? 'scale(1.1)' : 'scale(1)'};
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

  // Handle Start & Destination Markers
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

    // Start Marker (Green Flag)
    if (startPoint) {
      const startIcon = L.divIcon({
        className: 'start-point-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%);
            background: #10b981;
            color: white;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            <span>🚩 เริ่มต้น: ${startPoint.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      startMarkerRef.current = L.marker([startPoint.lat, startPoint.lng], { icon: startIcon }).addTo(map);
    }

    // Dest Marker (Checkered Flag)
    if (destPoint) {
      const destIcon = L.divIcon({
        className: 'dest-point-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%);
            background: #ef4444;
            color: white;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11px;
            font-weight: 800;
            display: flex;
            align-items: center;
            gap: 4px;
            border: 2px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            white-space: nowrap;
          ">
            <span>🏁 ปลายทาง: ${destPoint.name}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      destMarkerRef.current = L.marker([destPoint.lat, destPoint.lng], { icon: destIcon }).addTo(map);
    }
  }, [startPoint, destPoint]);

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
              width: 16px; 
              height: 16px; 
              background: #3b82f6; 
              border: 3px solid white; 
              border-radius: 50%; 
              box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.35);
            "></div>
          `,
          iconSize: [16, 16],
          iconAnchor: [8, 8],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>ตำแหน่งของคุณ</b>');
      }
    }
  }, [userLocation]);

  return (
    <div className={`relative w-full h-full min-h-[420px] rounded-3xl overflow-hidden border border-slate-200/80 shadow-inner ${
      mapPickingMode ? 'cursor-crosshair' : ''
    }`}>
      {/* Map picking banner */}
      {mapPickingMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-emerald-400 flex items-center gap-2 backdrop-blur-sm animate-pulse">
          <span>
            {mapPickingMode === 'start' ? '🚩 คลิกบนแผนที่เพื่อเลือกจุดเริ่มต้น' : '🏁 คลิกบนแผนที่เพื่อเลือกจุดหมายปลายทาง'}
          </span>
        </div>
      )}

      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
    </div>
  );
};
