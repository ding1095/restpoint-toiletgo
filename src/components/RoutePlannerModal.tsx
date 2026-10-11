import React, { useState } from 'react';
import { 
  Navigation, Bell, ChevronRight, Volume2, ShieldCheck, Sparkles
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
    }, 5000);
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      
      {/* Route Selector and Customizer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Left Column: Route selection & Interval settings */}
        <div className="md:col-span-5 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div>
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              เลือกเส้นทางเดินทาง
            </span>
            <div className="space-y-2">
              {HIGHWAY_ROUTES.map((route) => (
                <button
                  key={route.id}
                  onClick={() => setSelectedRouteId(route.id)}
                  className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                    selectedRouteId === route.id
                      ? 'border-emerald-500 bg-emerald-50/40 shadow-xs ring-1 ring-emerald-500/20'
                      : 'border-slate-200/80 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm">
                      {lang === 'th' ? route.name : route.name_en}
                    </span>
                    <ChevronRight className={`w-4 h-4 text-slate-400 ${selectedRouteId === route.id ? 'text-emerald-600' : ''}`} />
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>{route.distance}</span>
                    <span>•</span>
                    <span>เวลาประมาณ {route.estimatedTime}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Interval setting */}
          <div className="pt-3 border-t border-slate-100">
            <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              เตือนพักรถทุกๆ
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 60, label: '60 นาที' },
                { min: 90, label: '90 นาที' },
                { min: 120, label: '120 นาที' },
              ].map((item) => (
                <button
                  key={item.min}
                  onClick={() => setIntervalMinutes(item.min)}
                  className={`p-2 rounded-xl border text-center text-xs font-bold transition-all ${
                    intervalMinutes === item.min
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Test Alert Button */}
          <div className="pt-3 border-t border-slate-100">
            <button
              onClick={handleTestReminder}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200/80 transition-all shadow-2xs"
            >
              <Bell className="w-3.5 h-3.5 text-amber-700" />
              <span>ทดสอบระบบแจ้งเตือนพักรถ</span>
            </button>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              แนะนำให้แวะพักทุก 2 ชั่วโมงเพื่อความปลอดภัย และไม่แนะนำให้ใช้งานโทรศัพท์ขณะขับขี่
            </p>
          </div>
        </div>

        {/* Right Column: Route checkpoints */}
        <div className="md:col-span-7 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">
              จุดแวะพักบนเส้นทาง ({currentRoute.distance})
            </h3>
            <p className="text-xs text-slate-400">จุดพักรถและปั๊มน้ำมันที่มีห้องน้ำสะอาดพร้อมให้บริการ</p>
          </div>

          {/* Timeline of Checkpoints */}
          <div className="relative pl-6 space-y-5 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {currentRoute.checkpoints.map((cp, idx) => {
              const matchedRestroom = cp.restroomId 
                ? INITIAL_RESTROOMS.find((r) => r.id === cp.restroomId)
                : null;

              return (
                <div key={idx} className="relative">
                  <div className={`absolute -left-[23px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${
                    matchedRestroom ? 'bg-emerald-600 ring-2 ring-emerald-200' : 'bg-slate-300'
                  }`} />

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      กม. ที่ {cp.km}
                    </span>

                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      {cp.name}
                    </h4>

                    {matchedRestroom && (
                      <div className="mt-2 p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-emerald-800">
                            {matchedRestroom.name}
                          </span>
                          <span className="text-xs font-bold text-amber-600">
                            ★ {matchedRestroom.overallRating}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          {matchedRestroom.facilities.bidetSprayer && <span>💦 มีสายฉีด</span>}
                          {matchedRestroom.facilities.wheelchairAccessible && <span>♿ วีลแชร์เข้าได้</span>}
                          {matchedRestroom.facilities.diaperChangingTable && <span>👶 เปลี่ยนผ้าอ้อม</span>}
                        </div>

                        <button
                          onClick={() => onSelectRestroom(matchedRestroom)}
                          className="w-full mt-1.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-100/60 hover:bg-emerald-100 rounded-xl transition-colors text-center"
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

      {/* Simulated Alert Notification */}
      {showSimulatedAlert && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-3xl shadow-xl border border-emerald-500/30 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-2xl">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-400 block uppercase">การแจ้งเตือนจุดพัก</span>
              <h4 className="font-bold text-xs sm:text-sm">อีก 3 กม. ถึงจุดพักรถมอเตอร์เวย์</h4>
              <p className="text-xs text-slate-300 mt-0.5">ห้องน้ำสะอาด 4.8 ดาว มีสายฉีดชำระและทางลาด</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
