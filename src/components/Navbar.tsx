import React, { useEffect, useRef, useState } from 'react';
import { Menu, Heart, Plus, ShieldCheck, ArrowLeft } from 'lucide-react';
import { PooPooMascot } from './PooPooMascot';

export type AppTab = 'route' | 'map' | 'admin';

interface NavbarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  onOpenAddModal: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenAddModal,
  favoritesCount,
  onOpenFavorites,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menuOpen]);

  const tabBtn = (tab: AppTab, label: string) => (
    <button
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`h-9 px-4 sm:px-5 rounded-full text-sm font-medium transition-all ${
        activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {label}
    </button>
  );

  const menuItem = (icon: React.ReactNode, label: string, onClick: () => void, badge?: number) => (
    <button
      type="button"
      onClick={() => {
        setMenuOpen(false);
        onClick();
      }}
      className="w-full flex items-center gap-3 px-3 h-11 rounded-xl text-[15px] text-slate-700 hover:bg-slate-50"
    >
      <span className="text-slate-500">{icon}</span>
      <span className="flex-1 text-left">{label}</span>
      {badge ? <span className="text-xs font-medium text-slate-400">{badge}</span> : null}
    </button>
  );

  return (
    <header className="relative z-30 h-14 shrink-0 bg-white border-b border-slate-100">
      <div className="h-full px-3 sm:px-4 flex items-center justify-between gap-2">
        {/* Brand */}
        <button type="button" onClick={() => setActiveTab('route')} className="flex items-center gap-2 shrink-0">
          <PooPooMascot size={30} mood="happy" />
          <span className="hidden sm:inline text-[17px] font-semibold tracking-tight text-slate-900">Poo Poo</span>
        </button>

        {/* Mode switch */}
        {activeTab === 'admin' ? (
          <button
            type="button"
            onClick={() => setActiveTab('route')}
            className="h-9 px-4 rounded-full bg-slate-100 text-sm font-medium text-slate-700 inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> กลับสู่แผนที่
          </button>
        ) : (
          <nav className="flex items-center p-1 rounded-full bg-slate-100">
            {tabBtn('route', 'เส้นทาง')}
            {tabBtn('map', 'สำรวจ')}
          </nav>
        )}

        {/* Menu */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="relative w-10 h-10 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-100"
            aria-label="เมนู"
          >
            <Menu className="w-5 h-5" />
            {favoritesCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500" />}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-60 p-1.5 bg-white rounded-2xl shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 fade-up">
              {menuItem(<Plus className="w-5 h-5" />, 'เพิ่มห้องน้ำ', onOpenAddModal)}
              {menuItem(<Heart className="w-5 h-5" />, 'รายการโปรด', onOpenFavorites, favoritesCount)}
              <div className="my-1 h-px bg-slate-100" />
              {menuItem(<ShieldCheck className="w-5 h-5" />, 'ผู้ดูแลระบบ', () => setActiveTab('admin'))}
              <p className="px-3 pt-1 pb-1.5 text-[11px] text-slate-400">เวอร์ชัน v{__APP_VERSION__}</p>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
