import React from 'react';
import { Search, X, Crosshair, Filter, Check } from 'lucide-react';
import { PooPooMascot } from './PooPooMascot';

export interface FilterOptions {
  searchQuery: string;
  category: string;
  hasBidet: boolean;
  wheelchair: boolean;
  elderly: boolean;
  babyStation: boolean;
  open24h: boolean;
  isFree: boolean;
}

interface FloatingSearchBarProps {
  filters: FilterOptions;
  onUpdateFilters: (updates: Partial<FilterOptions>) => void;
  onRequestUserLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
  lang?: 'th' | 'en';
}

export const FloatingSearchBar: React.FC<FloatingSearchBarProps> = ({
  filters,
  onUpdateFilters,
  onRequestUserLocation,
  userLocation,
}) => {
  const activeCount = [
    filters.hasBidet,
    filters.wheelchair,
    filters.elderly,
    filters.babyStation,
    filters.open24h,
    filters.isFree,
    filters.category !== 'all',
  ].filter(Boolean).length;

  const resetAllFilters = () => {
    onUpdateFilters({
      category: 'all',
      hasBidet: false,
      wheelchair: false,
      elderly: false,
      babyStation: false,
      open24h: false,
      isFree: false,
    });
  };

  const categories = [
    { id: 'all', label: 'ทั้งหมด', icon: '📍' },
    { id: 'gas_station', label: 'ปั๊มน้ำมัน', icon: '⛽' },
    { id: 'shopping_mall', label: 'ห้างสรรพสินค้า', icon: '🏬' },
    { id: 'transit_hub', label: 'สถานี/สนามบิน', icon: '✈️' },
    { id: 'public_park', label: 'สวนสาธารณะ', icon: '🌳' },
    { id: 'camping_nature', label: 'แคมป์ปิ้ง', icon: '⛺' },
  ];

  return (
    <div className="space-y-2.5">
      {/* Floating Glassmorphism Search Bar */}
      <div className="flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg shadow-slate-200/40">
        
        {/* Subtle mascot avatar */}
        <div className="pl-1 shrink-0 hidden sm:block">
          <PooPooMascot size={32} mood="happy" />
        </div>

        {/* Input */}
        <div className="relative flex-1 flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input 
            type="text"
            value={filters.searchQuery}
            onChange={(e) => onUpdateFilters({ searchQuery: e.target.value })}
            placeholder="ค้นหาชื่อจุดพัก, ปั๊ม, ถนน, จังหวัด..."
            className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-xl bg-transparent text-slate-800 placeholder-slate-400 font-medium focus:outline-hidden"
          />
          {filters.searchQuery && (
            <button
              onClick={() => onUpdateFilters({ searchQuery: '' })}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* GPS Button */}
        <button
          onClick={onRequestUserLocation}
          className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
            userLocation
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="ใช้ตำแหน่งปัจจุบัน GPS"
        >
          <Crosshair className={`w-3.5 h-3.5 ${userLocation ? 'text-blue-600' : 'text-slate-500'}`} />
          <span className="hidden sm:inline">ใกล้ฉัน</span>
        </button>
      </div>

      {/* Horizontal Scrollable Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        
        {/* Reset button if any filter active */}
        {activeCount > 0 && (
          <button
            onClick={resetAllFilters}
            className="whitespace-nowrap px-2.5 py-1.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/60 transition-all flex items-center gap-1 shrink-0"
          >
            <X className="w-3 h-3" />
            <span>ล้าง ({activeCount})</span>
          </button>
        )}

        {/* Essential boolean feature pills */}
        {[
          { label: '💦 สายฉีดชำระ', key: 'hasBidet', active: filters.hasBidet },
          { label: '♿ วีลแชร์/ทางลาด', key: 'wheelchair', active: filters.wheelchair },
          { label: '🧓 ผู้สูงอายุ', key: 'elderly', active: filters.elderly },
          { label: '👶 โต๊ะเปลี่ยนผ้าอ้อม', key: 'babyStation', active: filters.babyStation },
          { label: '⏰ เปิด 24 ชม.', key: 'open24h', active: filters.open24h },
          { label: '💵 ฟรี', key: 'isFree', active: filters.isFree },
        ].map((pill) => (
          <button
            key={pill.key}
            onClick={() => onUpdateFilters({ [pill.key]: !pill.active })}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              pill.active
                ? 'bg-emerald-600 text-white shadow-xs font-bold'
                : 'bg-white/85 backdrop-blur-md text-slate-600 border border-slate-200/70 hover:bg-slate-100'
            }`}
          >
            <span>{pill.label}</span>
            {pill.active && <Check className="w-3 h-3 shrink-0" />}
          </button>
        ))}

        {/* Category Pills */}
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => onUpdateFilters({ category: filters.category === c.id ? 'all' : c.id })}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 flex items-center gap-1 ${
              filters.category === c.id
                ? 'bg-amber-500 text-white shadow-xs font-bold'
                : 'bg-white/85 backdrop-blur-md text-slate-600 border border-slate-200/70 hover:bg-slate-100'
            }`}
          >
            <span>{c.icon}</span>
            <span>{c.label}</span>
          </button>
        ))}

      </div>
    </div>
  );
};
