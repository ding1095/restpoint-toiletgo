import { MapPin, Plus, Navigation, Globe, Heart, ShieldCheck } from 'lucide-react';
import { PooPooMascot } from './PooPooMascot';

interface NavbarProps {
  activeTab: 'route' | 'map' | 'admin';
  setActiveTab: (tab: 'route' | 'map' | 'admin') => void;
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
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo with Cute Poo Poo Mascot */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer group"
            onClick={() => setActiveTab('route')}
          >
            <div className="transition-transform group-hover:scale-105 duration-200">
              <PooPooMascot size={40} mood="waving" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-amber-950 font-sans">
                  Poo Poo
                </span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-full bg-amber-100 text-amber-900 border border-amber-200/70 shadow-2xs">
                  ปู้ปู้ 💩✨
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block">
                {lang === 'th' ? 'ปวดเมื่อไหร่บอกปู้ปู้! ค้นหาห้องน้ำสะอาดตลอดเส้นทาง' : 'Find Clean Restrooms on Your Journey'}
              </p>
            </div>
          </div>

          {/* Navigation Mode Switcher: Route First! */}
          <nav className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-full border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setActiveTab('route')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'route'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'เส้นทางเดินทาง' : 'Trip Routes'}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'map'
                  ? 'bg-white text-emerald-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{lang === 'th' ? 'สำรวจใกล้ฉัน' : 'Nearby'}</span>
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

            {/* Admin Portal Button */}
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-bold rounded-2xl border transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/70 hover:bg-amber-50 hover:text-amber-800 hover:border-amber-200'
              }`}
              title={lang === 'th' ? 'ระบบผู้ดูแล (Admin Portal)' : 'Admin Portal'}
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'admin' ? 'text-white' : 'text-amber-600'}`} />
              <span className="hidden sm:inline">{lang === 'th' ? 'จัดการ' : 'Admin'}</span>
            </button>

            {/* Add Restroom Button */}
            <button
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs shadow-emerald-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">{lang === 'th' ? 'ปักหมุดจุดใหม่' : 'Add Stop'}</span>
              <span className="sm:hidden">{lang === 'th' ? 'เพิ่ม' : 'Add'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
