import React from 'react';
import { MapPin, Plus, Navigation, Globe, Heart } from 'lucide-react';

interface NavbarProps {
  activeTab: 'map' | 'route';
  setActiveTab: (tab: 'map' | 'route') => void;
  lang: 'th' | 'en';
  setLang: (lang: 'th' | 'en') => void;
  onOpenAddModal: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  onOpenAddModal,
  favoritesCount,
  onOpenFavorites,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveTab('map')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-600/30 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5 stroke-[2.4]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900">
                  RESTPOINT
                </span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                  ToiletGo
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                {lang === 'th' ? 'ค้นหาจุดพักและห้องน้ำสะอาดระหว่างเดินทาง' : 'Find Clean Restrooms on Your Journey'}
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher: Just Explore vs Route Planner */}
          <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl border border-slate-200/50">
            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{lang === 'th' ? 'ค้นหาจุดพัก' : 'Explore'}</span>
            </button>

            <button
              onClick={() => setActiveTab('route')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'route'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-4 h-4" />
              <span>{lang === 'th' ? 'วางแผนบนเส้นทาง' : 'Trip Routes'}</span>
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2">
            {/* Favorites Button */}
            <button
              onClick={onOpenFavorites}
              className="relative p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl border border-slate-200/70 hover:border-rose-200 transition-colors"
              title={lang === 'th' ? 'รายการโปรด' : 'Favorites'}
            >
              <Heart className="w-4 h-4" />
              {favoritesCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {favoritesCount}
                </span>
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={() => setLang(lang === 'th' ? 'en' : 'th')}
              className="flex items-center gap-1 px-2.5 py-2 text-xs font-semibold rounded-2xl border border-slate-200/70 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <span>{lang === 'th' ? 'TH' : 'EN'}</span>
            </button>

            {/* Add Restroom Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/30 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{lang === 'th' ? 'ปักหมุดจุดใหม่' : 'Add Stop'}</span>
              <span className="sm:hidden">{lang === 'th' ? 'ปักหมุด' : 'Add'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
