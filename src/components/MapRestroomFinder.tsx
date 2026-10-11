import React, { useState } from 'react';
import { 
  Search, SlidersHorizontal, MapPin, Star, ShieldCheck, 
  Navigation, Crosshair, Sparkles, Filter, Check, X,
  Compass, ExternalLink, Heart
} from 'lucide-react';
import { RestroomPlace, FilterState } from '../types';
import { LeafletMap } from './LeafletMap';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'map' | 'list'>('split');

  // Filters state
  const [filterBidet, setFilterBidet] = useState(false);
  const [filterWheelchair, setFilterWheelchair] = useState(false);
  const [filterElderly, setFilterElderly] = useState(false);
  const [filterDiaper, setFilterDiaper] = useState(false);
  const [filterNursing, setFilterNursing] = useState(false);
  const [filterPrayer, setFilterPrayer] = useState(false);
  const [filterShower, setFilterShower] = useState(false);
  const [filterFree, setFilterFree] = useState(false);
  const [filterOpen24h, setFilterOpen24h] = useState(false);
  const [filterVerified, setFilterVerified] = useState(false);

  // Categories list
  const categories = [
    { id: 'all', label: 'ทั้งหมด', labelEn: 'All', icon: '📍' },
    { id: 'gas_station', label: 'ปั๊มน้ำมัน / จุดพักรถ', labelEn: 'Gas Stations', icon: '⛽' },
    { id: 'shopping_mall', label: 'ห้างสรรพสินค้า', labelEn: 'Malls', icon: '🏬' },
    { id: 'transit_hub', label: 'สถานี / สนามบิน', labelEn: 'Transit Hubs', icon: '✈️' },
    { id: 'public_park', label: 'สวนสาธารณะ / แหล่งท่องเที่ยว', labelEn: 'Parks & Sites', icon: '🌳' },
    { id: 'camping_nature', label: 'แคมป์ปิ้ง / ธรรมชาติ', labelEn: 'Camping & Nature', icon: '⛺' },
  ];

  // Filter restrooms
  const filteredRestrooms = restrooms.filter((place) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = place.name.toLowerCase().includes(q) || place.name_en.toLowerCase().includes(q);
      const matchAddr = place.address.toLowerCase().includes(q) || place.province.toLowerCase().includes(q);
      if (!matchName && !matchAddr) return false;
    }

    // Category
    if (selectedCategory !== 'all' && place.category !== selectedCategory) {
      return false;
    }

    // Specific facility filters
    if (filterBidet && !place.facilities.bidetSprayer) return false;
    if (filterWheelchair && !place.facilities.wheelchairAccessible) return false;
    if (filterElderly && !place.facilities.elderlyFriendly) return false;
    if (filterDiaper && !place.facilities.diaperChangingTable) return false;
    if (filterNursing && !place.facilities.nursingRoom) return false;
    if (filterPrayer && !place.facilities.prayerRoom) return false;
    if (filterShower && !place.facilities.showerRoom) return false;
    if (filterFree && place.price_type !== 'free') return false;
    if (filterOpen24h && !place.opening_hours.includes('24')) return false;
    if (filterVerified && place.access_status !== 'verified') return false;

    return true;
  });

  const activeFiltersCount = [
    filterBidet, filterWheelchair, filterElderly, filterDiaper,
    filterNursing, filterPrayer, filterShower, filterFree,
    filterOpen24h, filterVerified
  ].filter(Boolean).length;

  const resetFilters = () => {
    setFilterBidet(false);
    setFilterWheelchair(false);
    setFilterElderly(false);
    setFilterDiaper(false);
    setFilterNursing(false);
    setFilterPrayer(false);
    setFilterShower(false);
    setFilterFree(false);
    setFilterOpen24h(false);
    setFilterVerified(false);
  };

  return (
    <div className="flex flex-col gap-4">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3.5">
        
        {/* Search Input Row */}
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'th' ? "ค้นหาชื่อสถานที่, ปั๊มน้ำมัน, ถนน, จังหวัด เช่น 'มอเตอร์เวย์', 'ชลบุรี', 'ไอคอนสยาม'..." : "Search restroom, highway, mall, province..."}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-800 text-sm focus:outline-emerald-500 focus:bg-white transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Locate Me Button */}
            <button
              onClick={onRequestUserLocation}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border ${
                userLocation
                  ? 'bg-blue-50 text-blue-700 border-blue-200 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="ใช้ตำแหน่งปัจจุบัน GPS"
            >
              <Crosshair className={`w-4 h-4 ${userLocation ? 'text-blue-600 animate-spin-slow' : 'text-slate-500'}`} />
              <span className="whitespace-nowrap">{lang === 'th' ? 'ตำแหน่งฉัน' : 'Near Me'}</span>
            </button>

            {/* Filter Toggle Button */}
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`flex items-center gap-1.5 px-4 py-3 rounded-2xl text-xs sm:text-sm font-semibold transition-all border ${
                activeFiltersCount > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{lang === 'th' ? 'ตัวกรอง' : 'Filters'}</span>
              {activeFiltersCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`whitespace-nowrap px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs shadow-emerald-600/30'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70 border border-slate-200/50'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{lang === 'th' ? cat.label : cat.labelEn}</span>
            </button>
          ))}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-emerald-600" />
                <span>ตัวกรองความต้องการเฉพาะ (ตามเกณฑ์ PDF บทที่ 7.2 & 8)</span>
              </span>
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-xs text-rose-600 hover:underline font-semibold"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {[
                { label: '💦 มีสายฉีดชำระ', state: filterBidet, setter: setFilterBidet },
                { label: '♿ รองรับรถเข็น/วีลแชร์', state: filterWheelchair, setter: setFilterWheelchair },
                { label: '🧓 เหมาะกับผู้สูงอายุ', state: filterElderly, setter: setFilterElderly },
                { label: '👶 มีโต๊ะเปลี่ยนผ้าอ้อม', state: filterDiaper, setter: setFilterDiaper },
                { label: '🍼 มีห้องให้นมบุตร', state: filterNursing, setter: setFilterNursing },
                { label: '🕌 มีห้องละหมาด', state: filterPrayer, setter: setFilterPrayer },
                { label: '🚿 มีห้องอาบน้ำ', state: filterShower, setter: setFilterShower },
                { label: '💵 เข้าใช้ฟรี', state: filterFree, setter: setFilterFree },
                { label: '⏰ เปิด 24 ชั่วโมง', state: filterOpen24h, setter: setFilterOpen24h },
                { label: '🛡️ ยืนยันข้อมูลแล้ว', state: filterVerified, setter: setFilterVerified },
              ].map((f, idx) => (
                <button
                  key={idx}
                  onClick={() => f.setter(!f.state)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition-all flex items-center justify-between ${
                    f.state 
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs font-semibold' 
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="truncate">{f.label}</span>
                  {f.state && <Check className="w-3.5 h-3.5 shrink-0 ml-1" />}
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Main Area: Split View (Map + Restroom Cards List) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column: Interactive Map */}
        <div className="lg:col-span-7 h-[460px] sm:h-[580px] rounded-3xl overflow-hidden shadow-xs border border-slate-200/90 bg-white">
          <LeafletMap 
            restrooms={filteredRestrooms}
            selectedPlace={selectedPlace}
            onSelectPlace={onSelectPlace}
            userLocation={userLocation}
          />
        </div>

        {/* Right Column: Restroom Cards List */}
        <div className="lg:col-span-5 flex flex-col h-[460px] sm:h-[580px] bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
          
          {/* List Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <span>จุดพักและห้องน้ำที่พบ</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  {filteredRestrooms.length}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">คลิกที่การ์ดเพื่อดูผลการประเมิน 6 มิติและการเข้าถึงจริง</p>
            </div>
          </div>

          {/* Cards Scrollable Container */}
          <div className="p-3 sm:p-4 overflow-y-auto space-y-3 flex-1">
            {filteredRestrooms.length === 0 ? (
              <div className="text-center py-16 px-4 text-slate-400">
                <Compass className="w-12 h-12 mx-auto stroke-[1.2] text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-600">ไม่พบจุดห้องน้ำที่ตรงตามเงื่อนไข</p>
                <p className="text-xs text-slate-400 mt-1">ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น</p>
                <button
                  onClick={resetFilters}
                  className="mt-3 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200"
                >
                  รีเซ็ตตัวกรอง
                </button>
              </div>
            ) : (
              filteredRestrooms.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const isFav = favorites.includes(place.id);

                return (
                  <div
                    key={place.id}
                    onClick={() => onSelectPlace(place)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50/40 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 hover:border-emerald-300 hover:shadow-xs bg-white'
                    }`}
                  >
                    {/* Top Row: Category tag, rating, and favorite */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-700">
                          {place.category === 'gas_station' && '⛽ ปั๊มน้ำมัน'}
                          {place.category === 'shopping_mall' && '🏬 ห้างสรรพสินค้า'}
                          {place.category === 'transit_hub' && '✈️ ศูนย์การเดินทาง'}
                          {place.category === 'public_park' && '🌳 สวนสาธารณะ'}
                          {place.category === 'camping_nature' && '⛺ แคมป์ปิ้ง'}
                        </span>
                        {place.access_status === 'verified' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-0.5">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            ยืนยันแล้ว
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/50">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          {place.overallRating.toFixed(1)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(place.id);
                          }}
                          className={`p-1 rounded-md text-slate-400 hover:text-rose-500 ${isFav ? 'text-rose-500' : ''}`}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-rose-500' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Place Name & Address */}
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition-colors">
                      {lang === 'th' ? place.name : place.name_en}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 truncate flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{place.address}</span>
                    </p>

                    {/* Quick Facility Indicators */}
                    <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-600">
                      {place.facilities.bidetSprayer && (
                        <span className="inline-flex items-center gap-0.5 text-sky-700 bg-sky-50 px-2 py-0.5 rounded font-medium">
                          💦 สายฉีด
                        </span>
                      )}
                      {place.facilities.wheelchairAccessible && (
                        <span className="inline-flex items-center gap-0.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                          ♿ วีลแชร์
                        </span>
                      )}
                      {place.facilities.diaperChangingTable && (
                        <span className="inline-flex items-center gap-0.5 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">
                          👶 เปลี่ยนผ้าอ้อม
                        </span>
                      )}
                      <span className="ml-auto font-semibold text-slate-700">
                        {place.price_type === 'free' ? 'ฟรี' : `${place.price_amount} ฿`}
                      </span>
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
