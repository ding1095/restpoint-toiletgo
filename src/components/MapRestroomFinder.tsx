import React, { useState } from 'react';
import { 
  MapPin, Star, ShieldCheck, Heart, Navigation
} from 'lucide-react';
import { RestroomPlace } from '../types';
import { LeafletMap } from './LeafletMap';
import { FloatingSearchBar, FilterOptions } from './FloatingSearchBar';
import { PooPooMascot } from './PooPooMascot';

interface MapRestroomFinderProps {
  restrooms: RestroomPlace[];
  selectedPlace: RestroomPlace | null;
  onSelectPlace: (place: RestroomPlace) => void;
  lang: 'th' | 'en';
  userLocation: { lat: number; lng: number } | null;
  onRequestUserLocation: () => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

export const MapRestroomFinder: React.FC<MapRestroomFinderProps> = ({
  restrooms,
  selectedPlace,
  onSelectPlace,
  lang,
  userLocation,
  onRequestUserLocation,
  favorites,
  onToggleFavorite,
}) => {
  const [filters, setFilters] = useState<FilterOptions>({
    searchQuery: '',
    category: 'all',
    hasBidet: false,
    wheelchair: false,
    elderly: false,
    babyStation: false,
    open24h: false,
    isFree: false,
  });

  const handleUpdateFilters = (updates: Partial<FilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  // Filter restrooms
  const filteredRestrooms = restrooms.filter((place) => {
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      const matchName = place.name.toLowerCase().includes(q) || place.name_en.toLowerCase().includes(q);
      const matchAddr = place.address.toLowerCase().includes(q) || place.province.toLowerCase().includes(q);
      if (!matchName && !matchAddr) return false;
    }

    if (filters.category !== 'all' && place.category !== filters.category) {
      return false;
    }

    if (filters.hasBidet && !place.facilities.bidetSprayer) return false;
    if (filters.wheelchair && !place.facilities.wheelchairAccessible) return false;
    if (filters.elderly && !place.facilities.elderlyFriendly) return false;
    if (filters.babyStation && !place.facilities.diaperChangingTable) return false;
    if (filters.open24h && !place.opening_hours.includes('24')) return false;
    if (filters.isFree && place.price_type !== 'free') return false;

    return true;
  });

  return (
    <div className="flex flex-col gap-4">
      
      {/* Floating Minimalist Search & Horizontal Filter Pills */}
      <FloatingSearchBar
        filters={filters}
        onUpdateFilters={handleUpdateFilters}
        onRequestUserLocation={onRequestUserLocation}
        userLocation={userLocation}
        lang={lang}
      />

      {/* Main Area: Map + Restroom Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 h-[460px] sm:h-[620px] rounded-3xl overflow-hidden border border-slate-200/80 bg-white shadow-xs relative">
          <LeafletMap 
            restrooms={filteredRestrooms}
            selectedPlace={selectedPlace}
            onSelectPlace={onSelectPlace}
            userLocation={userLocation}
          />
        </div>

        {/* Right Column: Restroom Cards List */}
        <div className="lg:col-span-5 flex flex-col h-[460px] sm:h-[620px] bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          
          {/* List Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <span className="font-extrabold text-slate-800 text-xs sm:text-sm flex items-center gap-1.5">
              <span>สถานที่ใกล้เคียง</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100/80 text-emerald-800 text-xs font-bold">
                {filteredRestrooms.length} แห่ง
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-medium">แตะการ์ดเพื่อดูรายละเอียด</span>
          </div>

          {/* Cards Scrollable Container */}
          <div className="p-3.5 overflow-y-auto space-y-2.5 flex-1 scrollbar-none">
            {filteredRestrooms.length === 0 ? (
              <div className="text-center py-20 px-4 space-y-2.5">
                <PooPooMascot size={60} mood="urgent" />
                <p className="text-sm font-bold text-slate-700">ไม่พบจุดห้องน้ำที่ตรงตามเงื่อนไข</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">ลองล้างตัวกรองหรือค้นหาด้วยคำอื่นดูนะครับ</p>
              </div>
            ) : (
              filteredRestrooms.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const isFav = favorites.includes(place.id);

                return (
                  <div
                    key={place.id}
                    onClick={() => onSelectPlace(place)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/30 shadow-xs ring-2 ring-emerald-500/20'
                        : 'border-slate-200/70 hover:border-emerald-300 bg-white hover:shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-600">
                          {place.category === 'gas_station' && '⛽ ปั๊มน้ำมัน'}
                          {place.category === 'shopping_mall' && '🏬 ห้างสรรพสินค้า'}
                          {place.category === 'transit_hub' && '✈️ ศูนย์การเดินทาง'}
                          {place.category === 'public_park' && '🌳 สวนสาธารณะ'}
                          {place.category === 'camping_nature' && '⛺ แคมป์ปิ้ง'}
                        </span>
                        {place.access_status === 'verified' && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ยืนยันแล้ว
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          {place.overallRating.toFixed(1)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(place.id);
                          }}
                          className={`p-1.5 rounded-xl border border-transparent transition-colors ${
                            isFav 
                              ? 'text-rose-500 bg-rose-50 border-rose-100' 
                              : 'text-slate-300 hover:text-rose-500 hover:bg-slate-50'
                          }`}
                          title="บันทึกรายการโปรด"
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm tracking-tight leading-snug">
                      {lang === 'th' ? place.name : place.name_en}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 truncate flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                      <span>{place.address}</span>
                    </p>

                    {/* Quick Facility Indicators */}
                    <div className="flex items-center gap-1.5 mt-3 pt-2.5 border-t border-slate-100 text-[10px]">
                      {place.facilities.bidetSprayer && (
                        <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md font-semibold">
                          💦 สายฉีด
                        </span>
                      )}
                      {place.facilities.wheelchairAccessible && (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold">
                          ♿ วีลแชร์
                        </span>
                      )}
                      {place.facilities.diaperChangingTable && (
                        <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md font-semibold">
                          👶 ผ้าอ้อม
                        </span>
                      )}

                      <div className="ml-auto flex items-center gap-2">
                        <span className="font-bold text-slate-600 text-[11px]">
                          {place.price_type === 'free' ? 'ฟรี' : `${place.price_amount} ฿`}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
                            window.open(url, '_blank');
                          }}
                          className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg transition-colors active:scale-95"
                          title="นำทางด้วย Google Maps"
                        >
                          <Navigation className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>นำทาง</span>
                        </button>
                      </div>
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
