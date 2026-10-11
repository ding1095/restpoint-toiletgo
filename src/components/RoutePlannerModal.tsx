import React, { useState } from 'react';
import { 
  Navigation, Clock, MapPin, AlertCircle, Bell, 
  CheckCircle, ChevronRight, Volume2, ShieldCheck, 
  ExternalLink, Sparkles
} from 'lucide-react';
import { HIGHWAY_ROUTES, INITIAL_RESTROOMS } from '../data/mockRestrooms';
import { RestroomPlace } from '../types';

interface RoutePlannerProps {
  lang: 'th' | 'en';
  onSelectRestroom: (place: RestroomPlace) => void;
}

export const RoutePlannerModal: React.FC<RoutePlannerProps> = ({
  lang,
  onSelectRestroom,
}) => {
  const [selectedRouteId, setSelectedRouteId] = useState(HIGHWAY_ROUTES[0].id);
  const [intervalMinutes, setIntervalMinutes] = useState(90);
  const [showSimulatedAlert, setShowSimulatedAlert] = useState(false);

  const currentRoute = HIGHWAY_ROUTES.find((r) => r.id === selectedRouteId) || HIGHWAY_ROUTES[0];

  const handleTestReminder = () => {
    setShowSimulatedAlert(true);
    setTimeout(() => {
      setShowSimulatedAlert(false);
    }, 6000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Hero Banner for Route Planner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 mb-3">
            <Navigation className="w-3.5 h-3.5" />
            <span>ฟังก์ชันหลัก PDF บทที่ 7.5: Route Rest Planner & Reminder</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            ระบบวางแผนจุดพักรถอัจฉริยะบนเส้นทาง
          </h2>
          <p className="text-sm text-emerald-100/90 mt-2 leading-relaxed">
            หมดกังวลเรื่องการกลั้นปัสสาวะหรือจุดพักไม่สะอาด วางแผนจุดแวะล่วงหน้าตามระยะทางและเวลาแจ้งเตือน 
            พร้อมระบบเตือนภัยความปลอดภัยที่ออกแบบไม่ให้รบกวนสมาธิผู้ขับขี่
          </p>
        </div>
      </div>

      {/* Route Selector and Customizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Column: Route selection & Interval settings */}
        <div className="md:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              เลือกเส้นทางเดินทางยอดนิยม
            </label>
            <div className="space-y-2">
              {HIGHWAY_ROUTES.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedRouteId === route.id
                      ? 'border-emerald-500 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {lang === 'th' ? route.name : route.name_en}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 ${selectedRouteId === route.id ? 'text-emerald-600' : ''}`} />
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>ระยะทาง: {route.distance}</span>
                    <span>•</span>
                    <span>เวลาประมาณ: {route.estimatedTime}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interval setting */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              กำหนดระยะเวลาเตือนพักรถ (Rest Interval)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 60, label: 'ทุก 60 นาที' },
                { min: 90, label: 'ทุก 90 นาที (แนะนำ)' },
                { min: 120, label: 'ทุก 120 นาที' },
              ].map((item) => (
                <button
                  key={item.min}
                  onClick={() => setIntervalMinutes(item.min)}
                  className={`p-2.5 rounded-xl border text-center text-xs font-bold transition-all ${
                    intervalMinutes === item.min
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              กรมทางหลวงแนะนำให้ผู้ขับขี่แวะพักทุก 2 ชั่วโมง หรือ 150-200 กม. เพื่อความปลอดภัยสูงสุด
            </p>
          </div>

          {/* Test Alert Simulation button */}
          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={handleTestReminder}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs sm:text-sm border border-amber-300 transition-all shadow-2xs"
            >
              <Bell className="w-4 h-4 text-amber-700" />
              <span>ทดสอบระบบแจ้งเตือนเตือนพัก (Simulate Alert)</span>
            </button>
          </div>

          {/* Safe driving notice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200/80 text-[11px] text-blue-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>ข้อควรปฏิบัติด้านความปลอดภัย (PDF 7.5):</strong> ออกแบบให้แจ้งเตือนด้วยเสียงล่วงหน้า 5-10 กม. และไม่สนับสนุนให้ผู้ขับขี่สัมผัสโทรศัพท์ขณะขับรถ แนะนำให้ผู้โดยสารเป็นผู้เปิดดู
            </p>
          </div>
        </div>

        {/* Right Column: Route checkpoints & Restroom highlights */}
        <div className="md:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs space-y-4">
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                จุดแวะพักที่แนะนำบนเส้นทาง ({currentRoute.distance})
              </h3>
              <p className="text-xs text-slate-500">คัดเลือกตามมาตรฐานความสะอาด สิ่งอำนวยความสะดวก และการเข้าถึง</p>
            </div>
          </div>

          {/* Timeline of Checkpoints */}
          <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {currentRoute.checkpoints.map((cp, idx) => {
              const matchedRestroom = cp.restroomId 
                ? INITIAL_RESTROOMS.find((r) => r.id === cp.restroomId)
                : null;

              return (
                <div key={idx} className="relative">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-[23px] top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                    matchedRestroom ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-400'
                  }`} />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                        กม. ที่ {cp.km}
                      </span>
                      {matchedRestroom && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-emerald-600" />
                          จุดแนะนำพิเศษ
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-800 text-sm">
                      {cp.name}
                    </h4>

                    {/* Matched Restroom Card details */}
                    {matchedRestroom && (
                      <div className="mt-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 hover:border-emerald-300 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800">
                            {matchedRestroom.name}
                          </span>
                          <span className="text-xs font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            ★ {matchedRestroom.overallRating}
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 truncate">
                          {matchedRestroom.address}
                        </p>

                        <div className="flex items-center gap-2 text-[11px] text-slate-600 pt-1">
                          {matchedRestroom.facilities.bidetSprayer && <span>💦 มีสายฉีด</span>}
                          {matchedRestroom.facilities.wheelchairAccessible && <span>♿ วีลแชร์เข้าได้</span>}
                          {matchedRestroom.facilities.diaperChangingTable && <span>👶 เปลี่ยนผ้าอ้อม</span>}
                          {matchedRestroom.facilities.showerRoom && <span>🚿 มีห้องอาบน้ำ</span>}
                        </div>

                        <button
                          onClick={() => onSelectRestroom(matchedRestroom)}
                          className="w-full mt-2 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100/70 hover:bg-emerald-200/70 rounded-xl transition-colors text-center"
                        >
                          ดูรายละเอียดจุดพักนี้ →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

      {/* Simulated Driving Alert Modal */}
      {showSimulatedAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-5 rounded-3xl shadow-2xl border border-emerald-500/50 animate-in slide-in-from-bottom duration-300">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-emerald-500 text-slate-950 rounded-2xl animate-bounce">
              <Volume2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                ToiletGo Smart Route Alert
              </span>
              <h4 className="font-extrabold text-sm sm:text-base">
                ถึงเวลาพักผ่อนแล้ว! อีก 3 กม. ถึงจุดพักรถมอเตอร์เวย์
              </h4>
              <p className="text-xs text-slate-300">
                จุดพักถัดไป: มีห้องน้ำสะอาดมาตรฐาน 4.8 ดาว, สายฉีดชำระ, และทางลาดสำหรับรถเข็น
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
