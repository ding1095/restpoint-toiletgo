import React, { useState, useEffect } from 'react';
import { 
  Navigation, MapPin, Flag, Crosshair, ArrowRight, 
  Sparkles, Star, ShieldCheck, Clock, ExternalLink, RotateCcw
} from 'lucide-react';
import { RestroomPlace } from '../types';
import { LeafletMap } from './LeafletMap';
import { PooPooMascot, MascotMood } from './PooPooMascot';

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

// Popular Thai travel presets
const POPULAR_START_POINTS: LocationPoint[] = [
  { name: 'กรุงเทพฯ (สยาม / ใจกลางเมือง)', lat: 13.7466, lng: 100.5347 },
  { name: 'ฟิวเจอร์พาร์ค รังสิต (ประตูสู่ภาคเหนือ/อีสาน)', lat: 13.9892, lng: 100.6177 },
  { name: 'สนามบินสุวรรณภูมิ / ลาดกระบัง', lat: 13.6900, lng: 100.7501 },
  { name: 'พระราม 2 (จุดเริ่มลงสู่ภาคใต้)', lat: 13.6558, lng: 100.4356 },
];

const POPULAR_DEST_POINTS: LocationPoint[] = [
  { name: 'พัทยา (หาดจอมเทียน / ชลบุรี)', lat: 12.9276, lng: 100.8771 },
  { name: 'หัวหิน / ชะอำ (ประจวบฯ)', lat: 12.5684, lng: 99.9577 },
  { name: 'เขาใหญ่ / ปากช่อง (นครราชสีมา)', lat: 14.4392, lng: 101.3724 },
  { name: 'เชียงใหม่ (คูเมือง / นิมมาน)', lat: 18.7883, lng: 98.9853 },
  { name: 'ภูเก็ต (เมืองเก่า)', lat: 7.8844, lng: 98.3887 },
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

  // Map picking mode ('start' | 'dest' | null)
  const [mapPickingMode, setMapPickingMode] = useState<'start' | 'dest' | null>(null);

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

      if (data && data.code === 'Ok' && data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        // OSRM coordinates are [lng, lat], Leaflet needs [lat, lng]
        coords = route.geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
        totalDist = Math.round(route.distance / 1000);
        totalDur = Math.round(route.duration / 60);
      } else {
        // Fallback: simple interpolation between start & dest
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const ratio = i / steps;
          coords.push([
            start.lat + (dest.lat - start.lat) * ratio,
            start.lng + (dest.lng - start.lng) * ratio,
          ]);
        }
        totalDist = Math.round(getDistanceKm(start.lat, start.lng, dest.lat, dest.lat));
        totalDur = Math.round((totalDist / 80) * 60);
      }

      setRouteCoordinates(coords);
      setRouteDistanceKm(totalDist);
      setRouteDurationMin(totalDur);

      // Match restrooms along the route corridor (within 18 km of the route line)
      const matches: Array<{ restroom: RestroomPlace; distFromStartKm: number }> = [];

      restrooms.forEach((r) => {
        let minDistToRoute = Infinity;
        // Sample every few points to quickly test segment proximity
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

        // Also check direct distance from start/end
        const dStart = getDistanceKm(r.coordinates.lat, r.coordinates.lng, start.lat, start.lng);
        const dDest = getDistanceKm(r.coordinates.lat, r.coordinates.lng, dest.lat, dest.lng);
        const totalDirect = getDistanceKm(start.lat, start.lng, dest.lat, dest.lng);

        // If close to route corridor (<= 20 km) and within trip span
        if (minDistToRoute <= 20 || (dStart + dDest <= totalDirect * 1.3 && dStart <= totalDist)) {
          matches.push({
            restroom: r,
            distFromStartKm: Math.round(dStart),
          });
        }
      });

      // Sort restrooms along route from start to destination
      matches.sort((a, b) => a.distFromStartKm - b.distFromStartKm);

      setMatchedRestrooms(matches);
      setMascotMood('relieved');
      setMascotSpeech(`เย้! เจอน้องห้องน้ำสะอาด ${matches.length} จุดตลอดเส้นทาง 💩✨`);
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

  // Handle map click picking
  const handleMapClick = (coords: { lat: number; lng: number }) => {
    if (mapPickingMode === 'start') {
      const point: LocationPoint = {
        name: `พิกัดที่เลือก (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        lat: coords.lat,
        lng: coords.lng,
      };
      setStartPoint(point);
      setStartQuery(point.name);
      setMapPickingMode(null);
      handleCalculateRoute(point, destPoint);
    } else if (mapPickingMode === 'dest') {
      const point: LocationPoint = {
        name: `พิกัดที่เลือก (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`,
        lat: coords.lat,
        lng: coords.lng,
      };
      setDestPoint(point);
      setDestQuery(point.name);
      setMapPickingMode(null);
      handleCalculateRoute(startPoint, point);
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

  const highlightedIds = matchedRestrooms.map((m) => m.restroom.id);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      
      {/* Top Banner with Mascot */}
      <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-700 rounded-3xl p-4 sm:p-6 text-white shadow-md flex items-center justify-between gap-4">
        <div className="space-y-1 max-w-xl">
          <div className="inline-flex items-center gap-1.5 bg-black/20 px-2.5 py-0.5 rounded-full text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Poo Poo Route Navigator</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            ปักหมุดเส้นทาง ค้นหาห้องน้ำสะอาดตลอดทาง 💩✨
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 font-medium">
            พิมพ์หรือคลิกปักหมุดจุดเริ่มต้นและปลายทาง น้องปู้ปู้จะคำนวณและแสดงห้องน้ำทุกจุดบนเส้นทางให้ทันที!
          </p>
        </div>

        {/* Mascot Avatar in Banner */}
        <div className="shrink-0 hidden sm:block">
          <PooPooMascot mood={mascotMood} size={84} showSpeech speechText={mascotSpeech} />
        </div>
      </div>

      {/* Inputs Card */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-100 shadow-2xs space-y-4">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. START POINT */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                <span>🚩 1. จุดเริ่มต้น (Start Point)</span>
              </label>

              <div className="flex items-center gap-1">
                <button
                  onClick={handleUseMyLocationAsStart}
                  className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 px-2 py-0.5 rounded-lg flex items-center gap-1"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>ตำแหน่งฉัน</span>
                </button>

                <button
                  onClick={() => setMapPickingMode(mapPickingMode === 'start' ? null : 'start')}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
                    mapPickingMode === 'start'
                      ? 'bg-emerald-600 text-white animate-pulse'
                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>{mapPickingMode === 'start' ? 'กำลังปักหมุด...' : 'ปักหมุดบนแผนที่'}</span>
                </button>
              </div>
            </div>

            <div className="relative">
              <input 
                type="text"
                value={startQuery}
                onChange={(e) => setStartQuery(e.target.value)}
                placeholder="พิมพ์จุดเริ่มต้น เช่น กรุงเทพฯ, รังสิต..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-500"
              />
            </div>

            {/* Quick Presets for Start */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0">แนะนำ:</span>
              {POPULAR_START_POINTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setStartPoint(p);
                    setStartQuery(p.name);
                    handleCalculateRoute(p, destPoint);
                  }}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    startPoint?.name === p.name
                      ? 'bg-emerald-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* 2. DESTINATION */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                <span>🏁 2. จุดหมายปลายทาง (Destination)</span>
              </label>

              <button
                onClick={() => setMapPickingMode(mapPickingMode === 'dest' ? null : 'dest')}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all ${
                  mapPickingMode === 'dest'
                    ? 'bg-rose-600 text-white animate-pulse'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <Flag className="w-3 h-3" />
                <span>{mapPickingMode === 'dest' ? 'กำลังปักหมุด...' : 'ปักหมุดบนแผนที่'}</span>
              </button>
            </div>

            <div className="relative">
              <input 
                type="text"
                value={destQuery}
                onChange={(e) => setDestQuery(e.target.value)}
                placeholder="พิมพ์จุดหมาย เช่น พัทยา, หัวหิน, เชียงใหม่..."
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium focus:outline-emerald-500"
              />
            </div>

            {/* Quick Presets for Dest */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[10px] text-slate-400 shrink-0">ยอดนิยม:</span>
              {POPULAR_DEST_POINTS.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDestPoint(p);
                    setDestQuery(p.name);
                    handleCalculateRoute(startPoint, p);
                  }}
                  className={`whitespace-nowrap px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                    destPoint?.name === p.name
                      ? 'bg-rose-600 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {p.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Action Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <span>💡 คลิกปุ่ม <strong>"ปักหมุดบนแผนที่"</strong> แล้วแตะบนแผนที่เพื่อระบุจุดได้ตามใจชอบ</span>
          </div>

          <button
            onClick={() => handleCalculateRoute(startPoint, destPoint)}
            disabled={isLoadingRoute}
            className="w-full sm:w-auto px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isLoadingRoute ? (
              <span>กำลังคำนวณเส้นทาง...</span>
            ) : (
              <>
                <Navigation className="w-4 h-4 fill-white" />
                <span>คำนวณเส้นทาง & สแกนห้องน้ำ</span>
              </>
            )}
          </button>
        </div>

      </div>

      {/* Main Grid: Map & Restrooms Along Route */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Interactive Map with Route & Markers */}
        <div className="lg:col-span-7 h-[460px] sm:h-[600px] rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-2xs relative">
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
            highlightedRestroomIds={highlightedIds}
          />
        </div>

        {/* Right Column: Restrooms list along this route */}
        <div className="lg:col-span-5 flex flex-col h-[460px] sm:h-[600px] bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden">
          
          {/* Header Summary */}
          <div className="p-4 border-b border-slate-100 bg-slate-50/70 space-y-1">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <span>ห้องน้ำบนเส้นทางนี้</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  {matchedRestrooms.length} แห่ง
                </span>
              </span>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span>{routeDistanceKm} กม.</span>
                <span>•</span>
                <span>~{routeDurationMin} นาที</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              เรียงลำดับจากจุดเริ่มต้นไปหาจุดหมายปลายทาง แวะจุดไหนก็มั่นใจความสะอาด
            </p>
          </div>

          {/* Restroom Cards along route */}
          <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
            {matchedRestrooms.length === 0 ? (
              <div className="text-center py-16 px-4 space-y-3">
                <PooPooMascot mood="urgent" size={64} />
                <p className="text-sm font-bold text-slate-700">กำลังสแกนหาจุดห้องน้ำ...</p>
                <p className="text-xs text-slate-400">
                  ลองเลือกเส้นทางยอดนิยม เช่น กรุงเทพฯ - พัทยา หรือ หัวหิน
                </p>
              </div>
            ) : (
              matchedRestrooms.map(({ restroom, distFromStartKm }, idx) => {
                const isSelected = selectedPlace?.id === restroom.id;

                return (
                  <div
                    key={restroom.id}
                    onClick={() => onSelectRestroom(restroom)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20'
                        : 'border-slate-200/80 hover:border-emerald-300 bg-white'
                    }`}
                  >
                    {/* Top Row: Milestone & Rating */}
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span>จุดแวะที่ {idx + 1}</span>
                        <span>•</span>
                        <span>กม. ที่ {distFromStartKm}</span>
                      </span>

                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/40">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{restroom.overallRating.toFixed(1)}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({restroom.reviewCount})</span>
                      </div>
                    </div>

                    {/* Name & Address */}
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {lang === 'th' ? restroom.name : restroom.name_en}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-300 shrink-0" />
                      <span>{restroom.address}</span>
                    </p>

                    {/* Amenities Tag Row */}
                    <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600">
                      {restroom.facilities.bidetSprayer && (
                        <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded font-medium">
                          💦 สายฉีด
                        </span>
                      )}
                      {restroom.facilities.wheelchairAccessible && (
                        <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-medium">
                          ♿ วีลแชร์
                        </span>
                      )}
                      {restroom.facilities.diaperChangingTable && (
                        <span className="text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded font-medium">
                          👶 ผ้าอ้อม
                        </span>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const url = `https://www.google.com/maps/dir/?api=1&destination=${restroom.coordinates.lat},${restroom.coordinates.lng}`;
                          window.open(url, '_blank');
                        }}
                        className="ml-auto flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors"
                      >
                        <Navigation className="w-3 h-3" />
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
