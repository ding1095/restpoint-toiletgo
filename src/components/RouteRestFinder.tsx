import React, { useEffect, useRef, useState } from 'react';
import { ArrowUpDown, MapPin, LocateFixed, Navigation, Loader2, Search, X } from 'lucide-react';
import { RestroomPlace } from '../types';
import { LeafletMap } from './LeafletMap';
import { SheetLayout, SheetSnap } from './SheetLayout';
import { PlaceRow } from './PlaceRow';
import { useRouteToilets } from '../hooks/useRouteToilets';
import { isSupabaseConfigured } from '../lib/supabase';
import { reverseGeocodeCoord, searchPlaces, PlaceSuggestion } from '../lib/thailandRegions';
import { distanceKm, formatDuration, openGoogleMapsDirections } from '../lib/categories';

interface RouteRestFinderProps {
  restrooms: RestroomPlace[];
  onSelectRestroom: (place: RestroomPlace) => void;
  selectedPlace: RestroomPlace | null;
  lang: 'th' | 'en';
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
}

interface LocationPoint {
  name: string;
  lat: number;
  lng: number;
}

type Field = 'start' | 'dest';

const POPULAR_PLACES: LocationPoint[] = [
  { name: 'กรุงเทพฯ (สยาม)', lat: 13.7466, lng: 100.5347 },
  { name: 'พัทยา', lat: 12.9276, lng: 100.8771 },
  { name: 'หัวหิน', lat: 12.5684, lng: 99.9577 },
  { name: 'เขาใหญ่', lat: 14.4392, lng: 101.3724 },
  { name: 'เชียงใหม่', lat: 18.7883, lng: 98.9853 },
  { name: 'ขอนแก่น', lat: 16.4322, lng: 102.8236 },
  { name: 'ภูเก็ต', lat: 7.8844, lng: 98.3887 },
  { name: 'หาดใหญ่', lat: 7.0084, lng: 100.4767 },
];

// Distance from a point to a line segment (km)
function distToSegment(pLat: number, pLng: number, vLat: number, vLng: number, wLat: number, wLng: number) {
  const l2 = (wLat - vLat) ** 2 + (wLng - vLng) ** 2;
  if (l2 === 0) return distanceKm(pLat, pLng, vLat, vLng);
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));
  return distanceKm(pLat, pLng, vLat + t * (wLat - vLat), vLng + t * (wLng - vLng));
}

export const RouteRestFinder: React.FC<RouteRestFinderProps> = ({
  restrooms,
  onSelectRestroom,
  selectedPlace,
  lang,
  userLocation,
  onRequestUserLocation,
}) => {
  const [startPoint, setStartPoint] = useState<LocationPoint | null>(POPULAR_PLACES[0]);
  const [destPoint, setDestPoint] = useState<LocationPoint | null>(POPULAR_PLACES[1]);
  const [startQuery, setStartQuery] = useState(POPULAR_PLACES[0].name);
  const [destQuery, setDestQuery] = useState(POPULAR_PLACES[1].name);

  const [activeField, setActiveField] = useState<Field | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [mapPickingMode, setMapPickingMode] = useState<Field | null>(null);
  const [snap, setSnap] = useState<SheetSnap>('peek');

  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState(0);
  const [routeDurationMin, setRouteDurationMin] = useState(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [stops, setStops] = useState<Array<{ restroom: RestroomPlace; km: number }>>([]);

  const { scanRouteToilets } = useRouteToilets();
  const requestIdRef = useRef(0);
  const pendingGpsRef = useRef<Field | null>(null);

  // ---------- Route calculation ----------
  const calculateRoute = async (start: LocationPoint | null, dest: LocationPoint | null) => {
    if (!start || !dest) return;
    const reqId = ++requestIdRef.current;
    setIsLoadingRoute(true);

    try {
      let coords: [number, number][] = [];
      let totalDist = 0;
      let totalDur = 0;
      let routeGeo: any = null;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
        const data = await (await fetch(url)).json();
        if (data?.code === 'Ok' && data.routes?.length) {
          const route = data.routes[0];
          routeGeo = route.geometry;
          coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          totalDist = Math.round(route.distance / 1000);
          totalDur = Math.round(route.duration / 60);
        }
      } catch {
        /* fall through to straight line */
      }

      if (coords.length === 0) {
        for (let i = 0; i <= 25; i++) {
          const r = i / 25;
          coords.push([start.lat + (dest.lat - start.lat) * r, start.lng + (dest.lng - start.lng) * r]);
        }
        totalDist = Math.round(distanceKm(start.lat, start.lng, dest.lat, dest.lng));
        totalDur = Math.round((totalDist / 80) * 60);
      }

      if (reqId !== requestIdRef.current) return;
      setRouteCoordinates(coords);
      setRouteDistanceKm(totalDist);
      setRouteDurationMin(totalDur);

      let candidates: RestroomPlace[] = restrooms;
      let usedPostgis = false;
      if (isSupabaseConfigured && routeGeo) {
        try {
          const pg = await scanRouteToilets({ routeGeoJson: routeGeo, corridorBufferMeters: 18000, localFallbackToilets: restrooms });
          if (pg?.length) {
            candidates = pg;
            usedPostgis = true;
          }
        } catch {
          /* local fallback */
        }
      }

      const directKm = distanceKm(start.lat, start.lng, dest.lat, dest.lng);
      const matches: Array<{ restroom: RestroomPlace; km: number }> = [];

      candidates.forEach((r) => {
        const dStart = distanceKm(r.coordinates.lat, r.coordinates.lng, start.lat, start.lng);
        if (!usedPostgis) {
          let minD = Infinity;
          for (let i = 0; i < coords.length - 1; i += 2) {
            const d = distToSegment(r.coordinates.lat, r.coordinates.lng, coords[i][0], coords[i][1], coords[i + 1][0], coords[i + 1][1]);
            if (d < minD) minD = d;
          }
          const dDest = distanceKm(r.coordinates.lat, r.coordinates.lng, dest.lat, dest.lng);
          const onCorridor = minD <= 20 || (dStart + dDest <= directKm * 1.3 && dStart <= totalDist);
          if (!onCorridor) return;
        }
        matches.push({ restroom: r, km: Math.round(dStart) });
      });

      matches.sort((a, b) => a.km - b.km);
      if (reqId === requestIdRef.current) setStops(matches);
    } finally {
      if (reqId === requestIdRef.current) setIsLoadingRoute(false);
    }
  };

  useEffect(() => {
    calculateRoute(startPoint, destPoint);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---------- Setting points ----------
  const applyPoint = (field: Field, point: LocationPoint) => {
    if (field === 'start') {
      setStartPoint(point);
      setStartQuery(point.name);
      calculateRoute(point, destPoint);
    } else {
      setDestPoint(point);
      setDestQuery(point.name);
      calculateRoute(startPoint, point);
    }
    setActiveField(null);
    setSuggestions([]);
    setSnap('peek');
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const applyCoordWithName = async (field: Field, coords: { lat: number; lng: number }) => {
    const temp = `พิกัด ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
    applyPoint(field, { name: temp, ...coords });
    const name = await reverseGeocodeCoord(coords.lat, coords.lng);
    if (name && name !== temp) {
      if (field === 'start') {
        setStartPoint((p) => (p && p.lat === coords.lat ? { ...p, name } : p));
        setStartQuery((q) => (q === temp ? name : q));
      } else {
        setDestPoint((p) => (p && p.lat === coords.lat ? { ...p, name } : p));
        setDestQuery((q) => (q === temp ? name : q));
      }
    }
  };

  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (!mapPickingMode) return;
    const field = mapPickingMode;
    setMapPickingMode(null);
    applyCoordWithName(field, coords);
  };

  const startPicking = (field: Field) => {
    setActiveField(null);
    setMapPickingMode(field);
    setSnap('min');
    (document.activeElement as HTMLElement | null)?.blur?.();
  };

  const useMyLocation = (field: Field) => {
    if (userLocation) {
      applyPoint(field, { name: 'ตำแหน่งของฉัน', ...userLocation });
    } else {
      pendingGpsRef.current = field;
      onRequestUserLocation();
      setActiveField(null);
    }
  };

  // Apply GPS once it becomes available after a request
  useEffect(() => {
    if (userLocation && pendingGpsRef.current) {
      const field = pendingGpsRef.current;
      pendingGpsRef.current = null;
      applyPoint(field, { name: 'ตำแหน่งของฉัน', ...userLocation });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation]);

  const swap = () => {
    setStartPoint(destPoint);
    setDestPoint(startPoint);
    setStartQuery(destQuery);
    setDestQuery(startQuery);
    calculateRoute(destPoint, startPoint);
  };

  // ---------- Search suggestions (debounced) ----------
  const activeQuery = activeField === 'start' ? startQuery : activeField === 'dest' ? destQuery : '';
  const activePointName = activeField === 'start' ? startPoint?.name : destPoint?.name;

  useEffect(() => {
    if (!activeField || activeQuery.trim().length < 2 || activeQuery === activePointName) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    const ctrl = new AbortController();
    setIsSearching(true);
    const t = setTimeout(async () => {
      const res = await searchPlaces(activeQuery, ctrl.signal);
      if (!ctrl.signal.aborted) {
        setSuggestions(res);
        setIsSearching(false);
      }
    }, 350);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [activeField, activeQuery, activePointName]);

  const closeSearch = () => {
    setStartQuery(startPoint?.name ?? '');
    setDestQuery(destPoint?.name ?? '');
    setActiveField(null);
    setSuggestions([]);
  };

  // ---------- UI ----------
  const fieldRow = (field: Field) => {
    const isStart = field === 'start';
    const value = isStart ? startQuery : destQuery;
    const setValue = isStart ? setStartQuery : setDestQuery;
    return (
      <div className="flex items-center gap-3 h-12 pl-4 pr-1.5">
        {isStart ? (
          <span className="w-3 h-3 rounded-full border-[3px] border-emerald-500 shrink-0" />
        ) : (
          <MapPin className="w-4 h-4 -mx-0.5 text-red-500 fill-red-500/20 shrink-0" />
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={(e) => {
            setActiveField(field);
            setSnap('full');
            e.target.select();
          }}
          placeholder={isStart ? 'จุดเริ่มต้น' : 'ไปที่ไหน?'}
          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder-slate-400 outline-none"
        />
        <button
          type="button"
          onClick={() => startPicking(field)}
          className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center transition-colors ${
            mapPickingMode === field ? 'bg-slate-900 text-white' : 'text-slate-500 hover:bg-slate-200'
          }`}
          aria-label="เลือกบนแผนที่"
          title="เลือกบนแผนที่"
        >
          <MapPin className="w-[18px] h-[18px]" />
        </button>
      </div>
    );
  };

  const header = (
    <div className="flex items-center gap-2">
      <div className="flex-1 min-w-0 rounded-2xl bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 transition">
        {fieldRow('start')}
        <div className="ml-11 mr-3 h-px bg-slate-200" />
        {fieldRow('dest')}
      </div>
      {activeField ? (
        <button type="button" onClick={closeSearch} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="ปิด">
          <X className="w-5 h-5" />
        </button>
      ) : (
        <button type="button" onClick={swap} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100" aria-label="สลับ">
          <ArrowUpDown className="w-5 h-5" />
        </button>
      )}
    </div>
  );

  const suggestionItem = (key: string, icon: React.ReactNode, title: string, detail: string | undefined, onPick: () => void) => (
    <button
      key={key}
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onPick}
      className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl text-left hover:bg-slate-50 active:bg-slate-100"
    >
      <span className="w-10 h-10 shrink-0 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[15px] font-medium text-slate-900 truncate">{title}</span>
        {detail && <span className="block text-[13px] text-slate-500 truncate">{detail}</span>}
      </span>
    </button>
  );

  const suggestionsPanel = activeField && (
    <div className="space-y-0.5 pt-1">
      {suggestionItem('gps', <LocateFixed className="w-5 h-5 text-blue-600" />, 'ตำแหน่งของฉัน', undefined, () => useMyLocation(activeField))}
      {suggestionItem('map', <MapPin className="w-5 h-5" />, 'เลือกบนแผนที่', 'แตะตำแหน่งที่ต้องการบนแผนที่', () => startPicking(activeField))}

      {isSearching && (
        <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> กำลังค้นหา…
        </div>
      )}

      {suggestions.map((s, i) =>
        suggestionItem(`s${i}`, <Search className="w-[18px] h-[18px]" />, s.name, s.detail, () =>
          applyPoint(activeField, { name: s.name, lat: s.lat, lng: s.lng })
        )
      )}

      {suggestions.length === 0 && !isSearching && (
        <>
          <p className="px-3 pt-4 pb-1 text-[13px] font-medium text-slate-500">ยอดนิยม</p>
          {POPULAR_PLACES.map((p) =>
            suggestionItem(p.name, <span className="text-base">📍</span>, p.name, undefined, () => applyPoint(activeField, p))
          )}
        </>
      )}
    </div>
  );

  const summary = (
    <div className="px-2 pt-1 pb-3">
      {isLoadingRoute ? (
        <div className="flex items-center gap-2 py-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span className="text-[15px]">กำลังค้นหาเส้นทางและห้องน้ำ…</span>
        </div>
      ) : routeDistanceKm > 0 ? (
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-2xl font-semibold text-slate-900 leading-tight">{formatDuration(routeDurationMin)}</p>
            <p className="text-[13px] text-slate-500 mt-0.5">
              {routeDistanceKm} กม. · ห้องน้ำระหว่างทาง <span className="text-emerald-700 font-medium">{stops.length} แห่ง</span>
            </p>
          </div>
          {destPoint && (
            <button
              type="button"
              onClick={() => openGoogleMapsDirections(destPoint.lat, destPoint.lng)}
              className="h-10 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium inline-flex items-center gap-1.5 shrink-0"
            >
              <Navigation className="w-4 h-4 fill-white" /> เริ่มนำทาง
            </button>
          )}
        </div>
      ) : null}
    </div>
  );

  const stopsList =
    stops.length === 0 && !isLoadingRoute ? (
      <div className="text-center py-12 px-6">
        <p className="text-4xl mb-3">🛣️</p>
        <p className="font-semibold text-slate-900">ยังไม่พบห้องน้ำบนเส้นทางนี้</p>
        <p className="text-sm text-slate-500 mt-1">ลองเปลี่ยนจุดหมาย หรือเลือกจุดบนแผนที่</p>
      </div>
    ) : (
      <div>
        <div className="space-y-0.5">
          {stops.map(({ restroom, km }) => (
            <PlaceRow
              key={restroom.id}
              place={restroom}
              lang={lang}
              selected={selectedPlace?.id === restroom.id}
              onClick={() => {
                onSelectRestroom(restroom);
                setSnap('min');
              }}
              subtitle={`กม. ${km} · ${restroom.province}`}
              trailing={
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openGoogleMapsDirections(restroom.coordinates.lat, restroom.coordinates.lng);
                  }}
                  className="w-10 h-10 shrink-0 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center"
                  aria-label="นำทาง"
                >
                  <Navigation className="w-4 h-4" />
                </button>
              }
            />
          ))}
        </div>
      </div>
    );

  const mapRestrooms = stops.length > 0 ? stops.map((s) => s.restroom) : restrooms;

  return (
    <SheetLayout
      snap={snap}
      onSnapChange={setSnap}
      header={header}
      minContent={
        <div className="flex items-center justify-between w-full gap-3">
          <span className="text-[15px] font-semibold text-slate-900 truncate">
            {isLoadingRoute ? 'กำลังคำนวณ…' : `${formatDuration(routeDurationMin)} · ${routeDistanceKm} กม.`}
          </span>
          <span className="text-sm text-emerald-700 font-medium shrink-0">{stops.length} จุดแวะ</span>
        </div>
      }
      map={
        <LeafletMap
          restrooms={mapRestrooms}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => {
            onSelectRestroom(p);
            setSnap('min');
          }}
          userLocation={userLocation}
          onLocate={onRequestUserLocation}
          routeCoordinates={routeCoordinates}
          startPoint={startPoint}
          destPoint={destPoint}
          mapPickingMode={mapPickingMode}
          onMapClickCoord={handleMapClick}
          onCancelPickingMode={() => {
            setMapPickingMode(null);
            setSnap('peek');
          }}
          onMarkerDragEnd={(type, coords) => applyCoordWithName(type, coords)}
          highlightedRestroomIds={stops.map((s) => s.restroom.id)}
        />
      }
    >
      {activeField ? (
        suggestionsPanel
      ) : (
        <>
          {summary}
          {stopsList}
        </>
      )}
    </SheetLayout>
  );
};
