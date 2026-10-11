import React from 'react';
import { MapPin, ShieldCheck, ExternalLink } from 'lucide-react';

interface FooterProps {
  lang?: 'th' | 'en';
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer className="mt-16 bg-slate-900 text-slate-400 text-xs sm:text-sm border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2 text-white">
              <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white">
                <MapPin className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="font-extrabold text-lg tracking-tight">RESTPOINT / ToiletGo</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-md">
              โครงการพัฒนาแพลตฟอร์มค้นหา รีวิว และแบ่งปันข้อมูลห้องน้ำและสิ่งอำนวยความสะดวกระหว่างเดินทาง ครอบคลุมประเทศไทยและต่างประเทศ 
              (Find • Review • Share • Everywhere)
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold pt-1">
              <ShieldCheck className="w-4 h-4" />
              <span>คุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. PDPA และหลัก Universal Design</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">เอกสารโครงการ</h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>1. บทสรุปผู้บริหาร (Executive Summary)</li>
              <li>7. ฟังก์ชันหลักของแพลตฟอร์ม 6 ด้าน</li>
              <li>8. มาตรฐานการเข้าถึงสำหรับผู้พิการและสูงอายุ</li>
              <li>12. สถาปัตยกรรมระบบและ API</li>
              <li>17. ตัวชี้วัดความสำเร็จ (KPIs 8 มิติ)</li>
            </ul>
          </div>

          {/* Deploy & GitHub */}
          <div className="space-y-3">
            <h4 className="text-white font-bold text-xs uppercase tracking-wider">การเชื่อมต่อระบบ & Vercel</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              ซอร์สโค้ดถูกซิงก์ขึ้น GitHub อัตโนมัติ พร้อมสำหรับการเชื่อมต่อ Deploy บน Vercel ในคลิกเดียว
            </p>
            <a
              href="https://github.com/ding1095/restpoint-toiletgo"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 transition-colors shadow-2xs"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              <span>GitHub: ding1095/restpoint-toiletgo</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © 2026 RESTPOINT / ToiletGo • โครงการนวัตกรรมดิจิทัลฉบับสมบูรณ์ (ร่างเพื่อพิจารณา)
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Your Journey. Your Comfort. Your Rest Stop.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
