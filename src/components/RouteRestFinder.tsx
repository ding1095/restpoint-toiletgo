import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, MapPin, Flag, Crosshair, ArrowUpDown, X,
  Sparkles, Star, ShieldCheck, Clock, ExternalLink, RotateCcw, Database, Loader2, List, Compass
} from 'lucide-react';
import { RestroomPlace } from '../types';
import { LeafletMap } from './LeafletMap';
import { PooPooMascot, MascotMood } from './PooPooMascot';
import { useRouteToilets } from '../hooks/useRouteToilets';
import { isSupabaseConfigured } from '../lib/supabase';
import { reverseGeocodeCoord } from '../lib/thailandRegions';

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

// Popular Thai travel presets across ALL regions of Thailand
const POPULAR_START_POINTS: LocationPoint[] = [
  { name: 'กรุงเทพฯ (สยาม / ใจกลางเมือง)', lat: 13.7466, lng: 100.5347 },
  { name: 'ฟิวเจอร์พาร์ค รังสิต (ประตูสู่อีสาน/เหนือ)', lat: 13.9892, lng: 100.6177 },
  { name: 'พระราม 2 (ลงสู่ภาคใต้)', lat: 13.6558, lng: 100.4356 },
  { name: 'เชียงใหม่ (สนามบิน / คูเมือง)', lat: 18.7883, lng: 98.9853 },
  { name: 'ขอนแก่น (บึงแก่นนคร / อีสาน)', lat: 16.4322, lng: 102.8236 },
  { name: 'ภูเก็ต (เมืองเก่า / ภาคใต้)', lat: 7.8844, lng: 98.3887 },
];

const POPULAR_DEST_POINTS: LocationPoint[] = [
  { name: 'พัทยา (หาดจอมเทียน / ชลบุรี)', lat: 12.9276, lng: 100.8771 },
  { name: 'หัวหิน / ชะอำ (ประจวบฯ)', lat: 12.5684, lng: 99.9577 },
  { name: 'เขาใหญ่ / ปากช่อง (โคราช)', lat: 14.4392, lng: 101.3724 },
  { name: 'เชียงใหม่ (นิมมาน / ดอยสุเทพ)', lat: 18.7961, lng: 98.9664 },
  { name: 'ภูเก็ต (หาดป่าตอง)', lat: 7.8967, lng: 98.2968 },
  { name: 'ขอนแก่น (ใจกลางเมือง)', lat: 16.4419, lng: 102.8360 },
  { name: 'ระยอง (หาดแม่รำพึง)', lat: 12.6127, lng: 101.3503 },
  { name: 'หาดใหญ่ (สงขลา)', lat: 7.0084, lng: 100.4767 },
];

// Helper: Haversine distance in km
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: Distance from a point to a line segment
function distToSegment(
  pLat: number,
  pLng: number,
  vLat: number,
  vLng: number,
  wLat: number,
  wLng: number
) {
  const l2 = Math.pow(wLat - vLat, 2) + Math.pow(wLng - vLng, 2);
  if (l2 === 0) return getDistanceKm(pLat, pLng, vLat, vLng);
  let t = ((pLat - vLat) * (wLat - vLat) + (pLng - vLng) * (wLng - vLng)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projLat = vLat + t * (wLat - vLat);
  const projLng = vLng + t * (wLng - vLng);
  return getDistanceKm(pLat, pLng, projLat, projLng);
}

export const RouteRestFinder: React.FC<RouteRestFinderProps> = ({
  restrooms,
  onSelectRestroom,
  selectedPlace,
  lang,
  userLocation,
  onRequestUserLocation,
}) => {
  // Start and Dest states
  const [startQuery, setStartQuery] = useState(POPULAR_START_POINTS[0].name);
  const [startPoint, setStartPoint] = useState<LocationPoint | null>(POPULAR_START_POINTS[0]);

  const [destQuery, setDestQuery] = useState(POPULAR_DEST_POINTS[0].name);
  const [destPoint, setDestPoint] = useState<LocationPoint | null>(POPULAR_DEST_POINTS[0]);

  // PostGIS route scanner hook
  const { scanRouteToilets, loading: isScanningRouteToilets } = useRouteToilets();
  const [activeScanEngine, setActiveScanEngine] = useState<'postgis' | 'local'>('local');

  // Map picking mode ('start' | 'dest' | null)
  const [mapPickingMode, setMapPickingMode] = useState<'start' | 'dest' | null>(null);

  // Mobile View Switcher: 'map' or 'list' (on small screens)
  const [mobileView, setMobileView] = useState<'map' | 'list'>('map');

  // Route state
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<number>(0);
  const [routeDurationMin, setRouteDurationMin] = useState<number>(0);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [matchedRestrooms, setMatchedRestrooms] = useState<
    Array<{ restroom: RestroomPlace; distFromStartKm: number }>
  >([]);

  // Mascot state
  const [mascotMood, setMascotMood] = useState<MascotMood>('driving');
  const [mascotSpeech, setMascotSpeech] = useState<string>('พร้อมออกเดินทางแล้วจ้า!');

  const mapSectionRef = useRef<HTMLDivElement>(null);

  // Calculate route and scan restrooms along path
  const handleCalculateRoute = async (start = startPoint, dest = destPoint) => {
    if (!start || !dest) return;

    setIsLoadingRoute(true);
    setMascotMood('urgent');
    setMascotSpeech('น้องปู้ปู้กำลังสแกนหาห้องน้ำตลอดเส้นทาง...');

    try {
      // Call OSRM public API
      const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();

      let coords: [number, number][] = [];
      let totalDist = 0;
      let totalDur = 0;
      let routeGeo: any = null;

      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        routeGeo = route.geometry;
        // OSRM coordinates are [lng, lat], Leaflet needs [lat, lng]
        coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        totalDist = Math.round(route.distance / 1000);
        totalDur = Math.round(route.duration / 60);
      } else {
        // Fallback: simple interpolation between start & dest
        const steps = 25;
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          coords.push([
            start.lat + (dest.lat - start.lat) * ratio,
            start.lng + (dest.lng - start.lng) * ratio,
          ]);
        }
        totalDist = Math.round(getDistanceKm(start.lat, start.lng, dest.lat, dest.lng));
        totalDur = Math.round((totalDist / 80) * 60);
      }

      setRouteCoordinates(coords);
      setRouteDistanceKm(totalDist);
      setRouteDurationMin(totalDur);

      let candidateToilets: RestroomPlace[] = restrooms;
      let usedPostgis = false;

      // Try PostGIS Route Corridor RPC if Supabase credentials exist
      if (isSupabaseConfigured && routeGeo) {
        try {
          const pgResults = await scanRouteToilets({
            routeGeoJson: routeGeo,
            corridorBufferMeters: 18000,
            localFallbackToilets: restrooms,
          });

          if (pgResults && pgResults.length > 0) {
            candidateToilets = pgResults;
            usedPostgis = true;
          }
        } catch (e) {
          console.warn('PostGIS corridor scan error, using local fallback:', e);
        }
      }

      setActiveScanEngine(usedPostgis ? 'postgis' : 'local');

      // Match and order restrooms along the route from start to destination
      const matches: Array<{ restroom: RestroomPlace; distFromStartKm: number }> = [];

      if (usedPostgis) {
        candidateToilets.forEach((r) => {
          const dStart = getDistanceKm(r.coordinates.lat, r.coordinates.lng, start.lat, start.lng);
          matches.push({
            restroom: r,
            distFromStartKm: Math.round(dStart),
          });
        });
      } else {
        candidateToilets.forEach((r) => {
          let minDistToRoute = Infinity;
          for (let i = 0; i < coords.length - 1; i += 2) {
            const d = distToSegment(
              r.coordinates.lat,
              r.coordinates.lng,
              coords[i][0],
              coords[i][1],
              coords[i + 1][0],
              coords[i + 1][1]
            );
            if (d < minDistToRoute) minDistToRoute = d;
          }

          const dStart = getDistanceKm(r.coordinates.lat, r.coordinates.lng, start.lat, start.lng);
          const dDest = getDistanceKm(r.coordinates.lat, r.coordinates.lng, dest.lat, dest.lng);
          const totalDirect = getDistanceKm(start.lat, start.lng, dest.lat, dest.lng);

          if (minDistToRoute <= 20 || (dStart + dDest <= totalDirect * 1.3 && dStart <= totalDist)) {
            matches.push({
              restroom: r,
              distFromStartKm: Math.round(dStart),
            });
          }
        });
      }

      // Sort restrooms along route from start to destination
      matches.sort((a, b) => a.distFromStartKm - b.distFromStartKm);

      setMatchedRestrooms(matches);
      setMascotMood('relieved');
      setMascotSpeech(
        usedPostgis
          ? `เย้! สแกนผ่าน PostGIS พบห้องน้ำ ${matches.length} จุดตลอดแนวเส้นทาง ⚡💩`
          : `เย้! เจอน้องห้องน้ำสะอาด ${matches.length} จุดตลอดเส้นทาง 💩✨`
      );
    } catch (err) {
      console.error(err);
      setMascotMood('happy');
      setMascotSpeech('เดินทางปลอดภัยนะ มีอะไรเรียกปู้ปู้ได้เลย!');
    } finally {
      setIsLoadingRoute(false);
    }
  };

  // Initial calculation on mount
  useEffect(() => {
    handleCalculateRoute();
  }, []);

  // Activate picking mode and smoothly scroll to map on mobile
  const handleStartPickingMode = (mode: 'start' | 'dest') => {
    setMapPickingMode(mode);
    setMobileView('map');
    if (mapSectionRef.current) {
      mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Handle map click picking with reverse geocoding
  const handleMapClick = async (coords: { lat: number; lng: number }) => {
    if (!mapPickingMode) return;

    const currentMode = mapPickingMode;
    setMapPickingMode(null);

    // Immediate optimistic point
    const tempName = `พิกัด (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    const newPoint: LocationPoint = {
      name: tempName,
      lat: coords.lat,
      lng: coords.lng,
    };

    if (currentMode === 'start') {
      setStartPoint(newPoint);
      setStartQuery(tempName);
      handleCalculateRoute(newPoint, destPoint);
    } else {
      setDestPoint(newPoint);
      setDestQuery(tempName);
      handleCalculateRoute(startPoint, newPoint);
    }

    // Async reverse geocode to get friendly Thai location name
    try {
      const friendlyName = await reverseGeocodeCoord(coords.lat, coords.lng);
      if (friendlyName && friendlyName !== tempName) {
        const enrichedPoint = { ...newPoint, name: friendlyName };
        if (currentMode === 'start') {
          setStartPoint(enrichedPoint);
          setStartQuery(friendlyName);
        } else {
          setDestPoint(enrichedPoint);
          setDestQuery(friendlyName);
        }
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    }
  };

  // Handle marker drag end on map
  const handleMarkerDragEnd = async (type: 'start' | 'dest', coords: { lat: number; lng: number }) => {
    const tempName = `พิกัด (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
    const point: LocationPoint = {
      name: tempName,
      lat: coords.lat,
      lng: coords.lng,
    };

    if (type === 'start') {
      setStartPoint(point);
      setStartQuery(tempName);
      handleCalculateRoute(point, destPoint);
    } else {
      setDestPoint(point);
      setDestQuery(tempName);
      handleCalculateRoute(startPoint, point);
    }

    try {
      const friendlyName = await reverseGeocodeCoord(coords.lat, coords.lng);
      if (friendlyName && friendlyName !== tempName) {
        const enriched = { ...point, name: friendlyName };
        if (type === 'start') {
          setStartPoint(enriched);
          setStartQuery(friendlyName);
        } else {
          setDestPoint(enriched);
          setDestQuery(friendlyName);
        }
      }
    } catch (e) {
      console.error('Reverse geocode error:', e);
    }
  };

  // Handle GPS location as Start
  const handleUseMyLocationAsStart = () => {
    if (userLocation) {
      const point: LocationPoint = {
        name: 'ตำแหน่งปัจจุบันของฉัน',
        lat: userLocation.lat,
        lng: userLocation.lng,
      };
      setStartPoint(point);
      setStartQuery(point.name);
      handleCalculateRoute(point, destPoint);
    } else {
      onRequestUserLocation();
    }
  };

  // Swap start & destination points
  const handleSwapPoints = () => {
    if (!startPoint || !destPoint) return;
    const oldStart = startPoint;
    const oldStartQuery = startQuery;
    setStartPoint(destPoint);
    setStartQuery(destQuery);
    setDestPoint(oldStart);
    setDestQuery(oldStartQuery);
    handleCalculateRoute(destPoint, oldStart);
  };

  const highlightedIds = matchedRestrooms.map((m) => m.restroom.id);

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      
      {/* 🌟 1. Hero Mascot Banner */}
      <div className="relative overflow-hidden bg-white/95 rounded-3xl p-4 sm:p-6 border border-slate-200/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-52 h-52 bg-emerald-100/50 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-52 h-52 bg-amber-100/50 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-1.5 text-center sm:text-left max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200/60 px-3 py-1 rounded-full text-xs font-bold shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Poo Poo Navigator • ค้นหาห้องน้ำสะอาดตลอดเส้นทางทั่วไทย</span>
          </div>
          
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
            ปวดเมื่อไหร่บอก <span className="text-amber-500">ปู้ปู้</span> สบายใจตลอดทาง 💩✨
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-500 font-medium leading-relaxed">
            ปักหมุดจุดเริ่มต้นและปลายทางบนแผนที่ได้อิสระ หรือเลือกจุดหมายยอดนิยม น้องปู้ปู้จะสแกนจุดแวะพัก ปั๊ม และห้องน้ำสะอาดพร้อมสายฉีดชำระให้ทันที
          </p>
        </div>

        <div className="relative z-10 shrink-0">
          <PooPooMascot mood={mascotMood} size={84} showSpeech speechText={mascotSpeech} />
        </div>
      </div>

      {/* 🧭 2. Route Planner Inputs Card (Clean & Touch-Optimized for Mobile) */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/70 shadow-xs space-y-4">
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto,1fr] gap-3 items-center">
          
          {/* Start Point Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
                <span>🚩 1. จุดเริ่มต้น</span>
              </label>

              {/* Dedicated Pin & GPS buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseMyLocationAsStart}
                  className="min-h-[34px] px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl flex items-center gap-1 transition-colors active:scale-95"
                  title="ใช้ตำแหน่งปัจจุบัน GPS"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>ตำแหน่งฉัน</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleStartPickingMode(mapPickingMode === 'start' ? null as any : 'start')}
                  className={`min-h-[34px] px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                    mapPickingMode === 'start'
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 animate-pulse'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200/60'
                  }`}
                  title="แตะเลือกจุดเริ่มต้นบนแผนที่"
                >
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>{mapPickingMode === 'start' ? 'กำลังปักหมุด...' : '📍 แตะปักหมุด'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input 
                type="text"
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                placeholder="พิมพ์ชื่อจุดเริ่มต้น หรือกดแตะปักหมุดบนแผนที่..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Quick Presets for Start */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">จุดเริ่มแนะนำ:</span>
              {POPULAR_START_POINTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setStartPoint(p);
                    setStartQuery(p.name);
                    handleCalculateRoute(p, destPoint);
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    startPoint?.name === p.name
                      ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Swap Button (Middle) */}
          <div className="flex justify-center py-1 lg:py-0">
            <button
              type="button"
              onClick={handleSwapPoints}
              className="p-3 rounded-2xl bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border border-slate-200 hover:border-emerald-200 transition-all active:scale-90"
              title="สลับจุดเริ่มต้นและจุดหมาย"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>

          {/* Destination Point Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block shadow-xs"></span>
                <span>🏁 2. จุดหมายปลายทาง</span>
              </label>

              {/* Dedicated Pin button for Destination */}
              <button
                type="button"
                onClick={() => handleStartPickingMode(mapPickingMode === 'dest' ? null as any : 'dest')}
                className={`min-h-[34px] px-3 py-1 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all active:scale-95 shadow-2xs ${
                  mapPickingMode === 'dest'
                    ? 'bg-rose-600 text-white ring-2 ring-rose-400 animate-pulse'
                    : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200/60'
                }`}
                title="แตะเลือกจุดหมายบนแผนที่"
              >
                <Flag className="w-3.5 h-3.5 shrink-0" />
                <span>{mapPickingMode === 'dest' ? 'กำลังปักหมุด...' : '🏁 แตะปักหมุด'}</span>
              </button>
            </div>

            <div className="relative">
              <input 
                type="text"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="พิมพ์จุดหมาย เช่น พัทยา, เชียงใหม่, ภูเก็ต..."
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-semibold focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Quick Presets for Dest across regions */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0 font-medium">ยอดนิยม:</span>
              {POPULAR_DEST_POINTS.map((p, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setDestPoint(p);
                    setDestQuery(p.name);
                    handleCalculateRoute(startPoint, p);
                  }}
                  className={`whitespace-nowrap px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    destPoint?.name === p.name
                      ? 'bg-rose-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button Row */}
        <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>💡 กด <strong>"แตะปักหมุด"</strong> เพื่อคลิกบนแผนที่ หรือลากหมุดบนแผนที่ได้โดยตรง</span>
          </div>

          <button
            type="button"
            onClick={() => handleCalculateRoute(startPoint, destPoint)}
            disabled={isLoadingRoute}
            className="w-full sm:w-auto px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
          >
            {isLoadingRoute ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังคำนวณเส้นทาง...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-white" />
                <span>คำนวณเส้นทาง & สแกนห้องน้ำ</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* 📱 3. Mobile Segmented Tab Switcher (Visible only on screens < lg) */}
      <div className="flex lg:hidden bg-slate-200/80 p-1 rounded-2xl border border-slate-200 select-none">
        <button
          type="button"
          onClick={() => setMobileView('map')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === 'map'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4 text-emerald-600" />
          <span>แผนที่เดินทาง ({matchedRestrooms.length} จุด)</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileView('list')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            mobileView === 'list'
              ? 'bg-white text-emerald-800 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <List className="w-4 h-4 text-emerald-600" />
          <span>รายการห้องน้ำ ({matchedRestrooms.length} แห่ง)</span>
        </button>
      </div>

      {/* 🗺️ 4. Main Responsive Section (Map & Restrooms Along Route) */}
      <div ref={mapSectionRef} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Leaflet Map */}
        <div className={`lg:col-span-7 h-[500px] sm:h-[620px] rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-xs relative ${
          mobileView === 'map' ? 'block' : 'hidden lg:block'
        }`}>
          <LeafletMap 
            restrooms={restrooms}
            selectedPlace={selectedPlace}
            onSelectPlace={onSelectRestroom}
            userLocation={userLocation}
            routeCoordinates={routeCoordinates}
            startPoint={startPoint}
            destPoint={destPoint}
            mapPickingMode={mapPickingMode}
            onMapClickCoord={handleMapClick}
            onCancelPickingMode={() => setMapPickingMode(null)}
            onMarkerDragEnd={handleMarkerDragEnd}
            highlightedRestroomIds={highlightedIds}
            showRegionBar={true}
          />

          {/* Mobile Bottom Floating Card (If place is selected or nearest restroom available) */}
          {selectedPlace && (
            <div className="absolute bottom-4 inset-x-4 z-[400] lg:hidden bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-slate-200 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    {selectedPlace.category === 'gas_station' ? '⛽ ปั๊ม' : '🏬 ห้าง'}
                  </span>
                  <span className="text-amber-500 font-bold text-xs">★ {selectedPlace.overallRating}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate mt-0.5">
                  {selectedPlace.name}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{selectedPlace.address}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.coordinates.lat},${selectedPlace.coordinates.lng}`;
                    window.open(url, '_blank');
                  }}
                  className="px-3 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1 shadow-xs"
                >
                  <Navigation className="w-3.5 h-3.5 fill-white" />
                  <span>นำทาง</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectRestroom(null as any)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Restrooms list along this route */}
        <div className={`lg:col-span-5 flex flex-col h-[500px] sm:h-[620px] bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden ${
          mobileView === 'list' ? 'block' : 'hidden lg:flex'
        }`}>
          
          {/* Header Summary */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>ห้องน้ำบนเส้นทางนี้</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold">
                  {matchedRestrooms.length} แห่ง
                </span>
                {activeScanEngine === 'postgis' ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5 text-teal-600" />
                    <span>PostGIS ⚡</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-200/70 text-slate-700">
                    Offline
                  </span>
                )}
              </span>

              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl border border-slate-200/60 shadow-2xs">
                <span>{routeDistanceKm} กม.</span>
                <span className="text-slate-300">•</span>
                <span>~{routeDurationMin} นาที</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-medium">
              เรียงลำดับจากจุดเริ่มต้นไปหาจุดหมาย แตะการ์ดเพื่อดูรายละเอียดหรือกดนำทาง
            </p>
          </div>

          {/* Restroom Cards along route */}
          <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
            {matchedRestrooms.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-3">
                <PooPooMascot mood="urgent" size={68} />
                <p className="text-sm font-bold text-slate-700">กำลังสแกนหาจุดห้องน้ำตลอดเส้นทาง...</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  ลองเลือกจุดหมายยอดนิยม เช่น พัทยา, หัวหิน หรือเขาใหญ่ เพื่อดูจุดแวะพักแนะนำ
                </p>
              </div>
            ) : (
              matchedRestrooms.map(({ restroom, distFromStartKm }, idx) => {
                const isSelected = selectedPlace?.id === restroom.id;

                return (
                  <div
                    key={restroom.id}
                    onClick={() => {
                      onSelectRestroom(restroom);
                      setMobileView('map');
                    }}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200/70 hover:border-emerald-300 bg-white hover:shadow-2xs'
                    }`}
                  >
                    {/* Top Row: Milestone & Rating */}
                    <div className="flex items-center justify-between mb-2">
                      <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold bg-emerald-100/90 text-emerald-800 flex items-center gap-1">
                        <span>จุดแวะที่ {idx + 1}</span>
                        <span className="opacity-40">•</span>
                        <span>กม. ที่ {distFromStartKm}</span>
                      </span>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{restroom.overallRating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({restroom.reviewCount})</span>
                      </div>
                    </div>

                    {/* Name & Address */}
                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                      {lang === 'th' ? restroom.name : restroom.name_en}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{restroom.address}</span>
                    </p>

                    {/* Amenities Tag Row */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                      {restroom.facilities.bidetSprayer && (
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold">
                          💦 สายฉีด
                        </span>
                      )}
                      {restroom.facilities.wheelchairAccessible && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                          ♿ วีลแชร์
                        </span>
                      )}
                      {restroom.facilities.diaperChangingTable && (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                          👶 ผ้าอ้อม
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${restroom.coordinates.lat},${restroom.coordinates.lng}`;
                          window.open(url, '_blank');
                        }}
                        className="ml-auto flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-xl transition-colors active:scale-95 shadow-2xs"
                      >
                        <Navigation className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                        <span>นำทาง</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
