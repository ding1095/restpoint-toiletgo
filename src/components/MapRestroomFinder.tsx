import React, { useMemo, useState } from 'react';
import { Search, X, ChevronDown, Check } from 'lucide-react';
import { RestroomPlace } from '../types';
import { LeafletMap, MapFlyTarget } from './LeafletMap';
import { SheetLayout, SheetSnap } from './SheetLayout';
import { PlaceRow } from './PlaceRow';
import { THAILAND_REGIONS, getRegionIdByProvince } from '../lib/thailandRegions';
import { distanceKm, formatDistance } from '../lib/categories';

interface MapRestroomFinderProps {
  restrooms: RestroomPlace[];
  selectedPlace: RestroomPlace | null;
  onSelectPlace: (place: RestroomPlace) => void;
  lang: 'th' | 'en';
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
}

const CATEGORY_CHIPS = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'gas_station', label: '⛽ ปั๊ม' },
  { id: 'shopping_mall', label: '🛍️ ห้าง' },
  { id: 'restaurant_cafe', label: '☕ ร้านอาหาร' },
];

const FEATURE_CHIPS = [
  { id: 'bidet', label: 'สายฉีด' },
  { id: 'wheelchair', label: 'วีลแชร์' },
  { id: 'open24h', label: '24 ชม.' },
  { id: 'free', label: 'ฟรี' },
] as const;

type FeatureId = (typeof FEATURE_CHIPS)[number]['id'];

const PAGE_SIZE = 60;

export const MapRestroomFinder: React.FC<MapRestroomFinderProps> = ({
  restrooms,
  selectedPlace,
  onSelectPlace,
  lang,
  userLocation,
  onRequestUserLocation,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [features, setFeatures] = useState<Set<FeatureId>>(new Set());
  const [region, setRegion] = useState('all');
  const [snap, setSnap] = useState<SheetSnap>('peek');
  const [flyTarget, setFlyTarget] = useState<MapFlyTarget | null>(null);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const toggleFeature = (id: FeatureId) => {
    setFeatures((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
    setLimit(PAGE_SIZE);
  };

  const handleRegion = (id: string) => {
    setRegion(id);
    setLimit(PAGE_SIZE);
    const r = THAILAND_REGIONS.find((x) => x.id === id);
    if (r) setFlyTarget({ center: r.center, zoom: r.zoom, key: Date.now(), fitThailand: id === 'all' });
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = restrooms
      .filter((p) => {
        if (region !== 'all' && getRegionIdByProvince(p.province) !== region) return false;
        if (category !== 'all' && p.category !== category) return false;
        if (features.has('bidet') && !p.facilities.bidetSprayer) return false;
        if (features.has('wheelchair') && !p.facilities.wheelchairAccessible) return false;
        if (features.has('open24h') && !p.opening_hours?.includes('24')) return false;
        if (features.has('free') && p.price_type !== 'free') return false;
        if (q) {
          const hay = `${p.name} ${p.name_en} ${p.address} ${p.province}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .map((p) => ({
        place: p,
        dist: userLocation ? distanceKm(userLocation.lat, userLocation.lng, p.coordinates.lat, p.coordinates.lng) : null,
      }));

    list.sort((a, b) =>
      a.dist !== null && b.dist !== null ? a.dist - b.dist : b.place.overallRating - a.place.overallRating
    );
    return list;
  }, [restrooms, query, category, features, region, userLocation]);

  const regionName = THAILAND_REGIONS.find((r) => r.id === region)?.name ?? 'ทั่วประเทศ';

  const chip = (active: boolean) =>
    `shrink-0 h-9 px-3.5 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap inline-flex items-center gap-1 ${
      active ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`;

  const header = (
    <div className="space-y-3">
      {/* Search */}
      <div className="flex items-center gap-2 h-12 px-4 rounded-2xl bg-slate-100 focus-within:bg-white focus-within:ring-2 focus-within:ring-emerald-500/40 transition">
        <Search className="w-5 h-5 text-slate-400 shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setLimit(PAGE_SIZE);
          }}
          onFocus={() => setSnap('full')}
          placeholder="ค้นหาห้องน้ำ ปั๊ม ห้าง หรือจังหวัด"
          className="flex-1 min-w-0 bg-transparent text-[15px] text-slate-900 placeholder-slate-400 outline-none"
        />
        {query && (
          <button type="button" onClick={() => setQuery('')} className="p-1 text-slate-400" aria-label="ล้าง">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filters: region + category + features in one row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 lg:-mx-5 lg:px-5">
        <label className={`${chip(region !== 'all')} relative pr-8`}>
          <span>📍 {region === 'all' ? 'ทั่วไทย' : regionName}</span>
          <ChevronDown className="w-4 h-4 absolute right-2.5 pointer-events-none" />
          <select
            value={region}
            onChange={(e) => handleRegion(e.target.value)}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label="เลือกภูมิภาค"
          >
            {THAILAND_REGIONS.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>

        <span className="w-px h-5 bg-slate-200 shrink-0" />

        {CATEGORY_CHIPS.map((c) => (
          <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={chip(category === c.id)}>
            {c.label}
          </button>
        ))}

        <span className="w-px h-5 bg-slate-200 shrink-0" />

        {FEATURE_CHIPS.map((f) => (
          <button key={f.id} type="button" onClick={() => toggleFeature(f.id)} className={chip(features.has(f.id))}>
            {features.has(f.id) && <Check className="w-3.5 h-3.5" />}
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <SheetLayout
      snap={snap}
      onSnapChange={setSnap}
      header={header}
      minContent={
        <div className="flex items-center justify-between w-full">
          <span className="text-[15px] font-semibold text-slate-900">{results.length} ห้องน้ำ</span>
          <span className="text-sm text-slate-500">{regionName}</span>
        </div>
      }
      map={
        <LeafletMap
          restrooms={results.map((r) => r.place)}
          selectedPlace={selectedPlace}
          onSelectPlace={(p) => {
            onSelectPlace(p);
            setSnap('min');
          }}
          userLocation={userLocation}
          onLocate={onRequestUserLocation}
          flyTarget={flyTarget}
        />
      }
    >
      <div className="px-2 pt-1 pb-2 flex items-center justify-between">
        <p className="text-[13px] text-slate-500">
          {userLocation ? 'เรียงตามระยะทาง' : 'เรียงตามคะแนน'} · <span className="text-slate-900 font-medium">{results.length} แห่ง</span>
        </p>
        {!userLocation && (
          <button type="button" onClick={onRequestUserLocation} className="text-[13px] font-medium text-emerald-700">
            ใช้ตำแหน่งฉัน
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <div className="text-center py-16 px-6">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-slate-900">ไม่พบห้องน้ำที่ตรงเงื่อนไข</p>
          <p className="text-sm text-slate-500 mt-1">ลองลดตัวกรองหรือเปลี่ยนภูมิภาค</p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {results.slice(0, limit).map(({ place, dist }) => (
            <PlaceRow
              key={place.id}
              place={place}
              lang={lang}
              selected={selectedPlace?.id === place.id}
              onClick={() => {
                onSelectPlace(place);
                setSnap('min');
              }}
              subtitle={dist !== null ? `${formatDistance(dist)} · ${place.province}` : place.province}
            />
          ))}
          {results.length > limit && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + PAGE_SIZE)}
              className="w-full h-12 my-2 rounded-2xl text-sm font-medium text-slate-700 bg-slate-50 hover:bg-slate-100"
            >
              แสดงเพิ่ม ({results.length - limit})
            </button>
          )}
        </div>
      )}
    </SheetLayout>
  );
};
