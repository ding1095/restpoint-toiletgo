import React, { useState } from 'react';
import { X, MapPin, Navigation, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RestroomPlace, FacilityCategory } from '../types';
import { useSubmitToilet } from '../hooks/useSubmitToilet';
import { reverseGeocodeCoord } from '../lib/thailandRegions';

interface AddRestroomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newPlace: RestroomPlace) => void;
  lang: 'th' | 'en';
}

export const AddRestroomModal: React.FC<AddRestroomModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  lang,
}) => {
  const { submitToilet, isSubmitting, error: submitError } = useSubmitToilet();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<FacilityCategory>('gas_station');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [lat, setLat] = useState('13.7563');
  const [lng, setLng] = useState('100.5018');
  const [priceType, setPriceType] = useState<'free' | 'paid'>('free');
  const [floorZone, setFloorZone] = useState('');

  // Facilities
  const [bidetSprayer, setBidetSprayer] = useState(true);
  const [wheelchair, setWheelchair] = useState(true);
  const [diaperTable, setDiaperTable] = useState(false);
  const [shower, setShower] = useState(false);
  const [prayer, setPrayer] = useState(false);
  const [elderly, setElderly] = useState(true);

  // Privacy Agreement
  const [agreed, setAgreed] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const latVal = pos.coords.latitude;
          const lngVal = pos.coords.longitude;
          setLat(latVal.toFixed(6));
          setLng(lngVal.toFixed(6));
          try {
            const locName = await reverseGeocodeCoord(latVal, lngVal);
            if (locName) {
              setAddress((prev) => prev || locName);
              const parts = locName.split(',').map((s) => s.trim());
              if (parts.length > 1) {
                setProvince((prev) => prev || parts[parts.length - 1]);
              }
            }
          } catch {
            /* ignore */
          }
        },
        (err) => {
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + err.message);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !agreed || isSubmitting) return;

    const createdPlace = await submitToilet({
      name: name.trim(),
      category,
      address: address.trim() || 'ริมถนนสายหลัก',
      province: province.trim() || 'ไม่ระบุจังหวัด',
      lat: parseFloat(lat) || 13.7563,
      lng: parseFloat(lng) || 100.5018,
      floorZone: floorZone.trim(),
      hasBidet: bidetSprayer,
      wheelchairAccessible: wheelchair,
      elderlySupport: elderly,
      babyStation: diaperTable,
      hasShower: shower,
      hasPrayerRoom: prayer,
      open24h: true,
      isFree: priceType === 'free',
      priceAmount: 0,
    });

    if (createdPlace) {
      onAdd(createdPlace);

      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // ignore
      }

      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-2xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                {lang === 'th' ? 'ปักหมุดจุดห้องน้ำใหม่' : 'Add New Restroom'}
              </h3>
              <p className="text-xs text-slate-500">
                แบ่งปันจุดพักและห้องน้ำสะอาดให้กับเพื่อนร่วมทาง
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-3.5 flex-1 text-xs sm:text-sm">
          
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              ชื่อสถานที่ / ปั๊มน้ำมัน <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ปั๊ม ปตท. วังมะนาว เพชรบุรี ขาออก"
              className="w-full px-4 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">ประเภทสถานที่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FacilityCategory)}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="gas_station">⛽ ปั๊มน้ำมัน</option>
                <option value="shopping_mall">🏬 ห้างสรรพสินค้า</option>
                <option value="transit_hub">✈️ ศูนย์การเดินทาง</option>
                <option value="public_park">🌳 สวน / จุดชมวิว</option>
                <option value="camping_nature">⛺ แคมป์ปิ้ง</option>
                <option value="restaurant_cafe">☕ ร้านอาหาร/คาเฟ่</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">ค่าบริการ</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'free' | 'paid')}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              >
                <option value="free">เข้าใช้ฟรี</option>
                <option value="paid">มีค่าบริการ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">ถนน / ที่ตั้ง</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น ถนนพระราม 2 กม. 35"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">จังหวัด</label>
              <input 
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="เช่น เพชรบุรี"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700">พิกัด GPS</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-colors"
              >
                <Navigation className="w-3 h-3 fill-emerald-600" />
                <span>ใช้พิกัดปัจจุบัน</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs font-mono font-medium focus:bg-white focus:outline-emerald-500 transition-all"
                required
              />
              <input 
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs font-mono font-medium focus:bg-white focus:outline-emerald-500 transition-all"
                required
              />
            </div>
          </div>

          {/* Floor & Zone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">จุดสังเกตในสถานที่</label>
            <input 
              type="text"
              value={floorZone}
              onChange={(e) => setFloorZone(e.target.value)}
              placeholder="เช่น ด้านหลังร้านกาแฟ, โซนอาคารหลัก"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-50/70 border border-slate-200/80 text-slate-800 text-xs sm:text-sm font-medium focus:bg-white focus:outline-emerald-500 transition-all"
            />
          </div>

          {/* Facilities */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">สิ่งอำนวยความสะดวก</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: '💦 สายฉีดชำระ', state: bidetSprayer, set: setBidetSprayer },
                { label: '♿ รองรับรถเข็น', state: wheelchair, set: setWheelchair },
                { label: '🧓 ราวจับผู้สูงอายุ', state: elderly, set: setElderly },
                { label: '👶 ที่เปลี่ยนผ้าอ้อม', state: diaperTable, set: setDiaperTable },
                { label: '🚿 ห้องอาบน้ำ', state: shower, set: setShower },
                { label: '🕌 ห้องละหมาด', state: prayer, set: setPrayer },
              ].map((item, idx) => (
                <label 
                  key={idx} 
                  className={`p-2.5 rounded-2xl border cursor-pointer flex items-center gap-2 select-none text-xs transition-all ${
                    item.state 
                      ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-2xs' 
                      : 'bg-slate-50/70 border-slate-200/70 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={item.state} 
                    onChange={(e) => item.set(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agreement */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200/70 text-slate-700">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                required
              />
              <span className="text-xs leading-relaxed text-slate-600 font-medium">
                ยืนยันว่าข้อมูลเป็นความจริง และไม่มีการบันทึกภาพถ่ายที่ละเมิดความเป็นส่วนตัวในห้องน้ำ
              </span>
            </label>
          </div>

          {/* Error Banner if any */}
          {submitError && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-xs disabled:opacity-50"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!agreed || !name.trim() || isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>บันทึกจุดห้องน้ำ</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
