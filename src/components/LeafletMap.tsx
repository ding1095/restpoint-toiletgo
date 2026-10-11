import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RestroomPlace } from '../types';

interface LeafletMapProps {
  restrooms: RestroomPlace[];
  selectedPlace: RestroomPlace | null;
  onSelectPlace: (place: RestroomPlace) => void;
  userLocation: { lat: number; lng: number } | null;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  restrooms,
  selectedPlace,
  onSelectPlace,
  userLocation,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [id: string]: L.Marker }>({});
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Bangkok by default
    const map = L.map(mapContainerRef.current, {
      center: [13.7563, 100.5018],
      zoom: 9,
      zoomControl: false,
    });

    // Add zoom controls to bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update restroom markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear old markers
    Object.values(markersRef.current).forEach((marker) => marker.remove());
    markersRef.current = {};

    restrooms.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;

      // Color scheme based on category
      let badgeColor = '#059669'; // Emerald
      let label = 'WC';
      if (place.category === 'gas_station') {
        badgeColor = '#0284c7'; // Sky
        label = '⛽';
      } else if (place.category === 'shopping_mall') {
        badgeColor = '#7c3aed'; // Purple
        label = '🏬';
      } else if (place.category === 'transit_hub') {
        badgeColor = '#ea580c'; // Orange
        label = '✈️';
      } else if (place.category === 'camping_nature') {
        badgeColor = '#16a34a'; // Green
        label = '⛺';
      }

      const customIcon = L.divIcon({
        className: 'custom-map-marker',
        html: `
          <div style="
            transform: translate(-50%, -100%) ${isSelected ? 'scale(1.2)' : 'scale(1)'};
            transition: transform 0.2s ease;
            cursor: pointer;
            filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
          ">
            <div style="
              background: ${isSelected ? '#f59e0b' : badgeColor};
              color: white;
              border-radius: 9999px;
              padding: 6px 10px;
              font-size: 12px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 4px;
              border: 2px solid white;
              white-space: nowrap;
            ">
              <span>${label}</span>
              <span>${place.overallRating.toFixed(1)} ★</span>
            </div>
            <div style="
              width: 0; 
              height: 0; 
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 8px solid ${isSelected ? '#f59e0b' : badgeColor};
              margin: 0 auto;
            "></div>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker([place.coordinates.lat, place.coordinates.lng], { icon: customIcon })
        .addTo(map)
        .on('click', () => {
          onSelectPlace(place);
        });

      markersRef.current[place.id] = marker;
    });

    // Fit bounds if there are restrooms
    if (restrooms.length > 0 && !selectedPlace) {
      const group = L.featureGroup(Object.values(markersRef.current));
      map.fitBounds(group.getBounds().pad(0.15), { maxZoom: 13 });
    }
  }, [restrooms, selectedPlace, onSelectPlace]);

  // Center on selected place
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedPlace) return;

    map.flyTo([selectedPlace.coordinates.lat, selectedPlace.coordinates.lng], 14, {
      duration: 1.2,
    });
  }, [selectedPlace]);

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
              box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.3);
            "></div>
          `,
          iconSize: [18, 18],
          iconAnchor: [9, 9],
        });

        userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
          .addTo(map)
          .bindPopup('<b>ตำแหน่งของคุณ</b><br/>กำลังใช้งานพิกัดปัจจุบัน');
      }

      map.flyTo([userLocation.lat, userLocation.lng], 12, { duration: 1.0 });
    }
  }, [userLocation]);

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden shadow-inner border border-slate-200">
      <div ref={mapContainerRef} className="w-full h-full min-h-[420px]" />
    </div>
  );
};
