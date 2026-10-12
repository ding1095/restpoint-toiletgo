import React from 'react';
import { ExternalLink } from 'lucide-react';
import { PooPooMascot } from './PooPooMascot';

interface FooterProps {
  lang?: 'th' | 'en';
  onOpenAdmin?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenAdmin }) => {
  return (
    <footer className="mt-12 bg-white border-t border-slate-100 py-8 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <PooPooMascot size={32} mood="happy" />
          <span className="font-extrabold text-slate-900 text-sm">Poo Poo (ปู้ปู้)</span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-slate-400 hidden sm:inline">ปวดเมื่อไหร่บอกปู้ปู้! ค้นหาห้องน้ำสะอาดตลอดการเดินทาง 💩✨</span>
        </div>

        {/* GitHub & Admin link */}
        <div className="flex items-center gap-4">
          {onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-slate-400 hover:text-amber-700 transition-colors font-medium flex items-center gap-1"
            >
              <span>จัดการข้อมูล (Admin)</span>
            </button>
          )}
          {onOpenAdmin && <span>•</span>}
          <a
            href="https://github.com/ding1095/restpoint-toiletgo"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-emerald-700 transition-colors font-medium"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            <span>GitHub</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <span>•</span>
          <span className="text-slate-400">พร้อมใช้งานบน Vercel</span>
        </div>

      </div>
    </footer>
  );
};
