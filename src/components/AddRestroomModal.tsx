import React, { useState } from 'react';
import { X, MapPin, CheckCircle2, ShieldCheck, Sparkles, Navigation } from 'lucide-react';
import confetti from 'canvas-confetti';
import { RestroomPlace, FacilityCategory } from '../types';

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
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FacilityCategory>('gas_station');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('กรุงเทพมหานคร');
  const [lat, setLat] = useState('13.7563');
  const [lng, setLng] = useState('100.5018');
  const [openingHours, setOpeningHours] = useState('เปิด 24 ชั่วโมง');
  const [priceType, setPriceType] = useState<'free' | 'paid'>('free');
  const [floorZone, setFloorZone] = useState('');

  // Facilities
  const [bidetSprayer, setBidetSprayer] = useState(true);
  const [wheelchair, setWheelchair] = useState(true);
  const [diaperTable, setDiaperTable] = useState(false);
  const [shower, setShower] = useState(false);
  const [prayer, setPrayer] = useState(false);
  const [elderly, setElderly] = useState(true);

  // Accessibility specs
  const [hasRamp, setHasRamp] = useState(true);
  const [hasGrabBars, setHasGrabBars] = useState(true);

  // PDPA Consent
  const [agreedPdpa, setAgreedPdpa] = useState(false);

  if (!isOpen) return null;

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude.toFixed(6));
          setLng(pos.coords.longitude.toFixed(6));
        },
        (err) => {
          alert('ไม่สามารถดึงตำแหน่งปัจจุบันได้: ' + err.message);
        }
      );
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !agreedPdpa) return;

    const newPlace: RestroomPlace = {
      id: 'user-rest-' + Date.now(),
      name: name.trim(),
      name_en: name.trim(),
      category,
      address: address.trim() || 'ริมถนนสายหลัก',
      address_en: address.trim() || 'Main Highway Route',
      province,
      coordinates: {
        lat: parseFloat(lat) || 13.7563,
        lng: parseFloat(lng) || 100.5018,
      },
      access_status: 'user_reported',
      opening_hours: openingHours,
      price_type: priceType,
      floor_zone: floorZone || 'อาคารบริการหลัก',
      facilities: {
        bidetSprayer,
        genderSeparated: true,
        familyRestroom: diaperTable,
        diaperChangingTable: diaperTable,
        nursingRoom: false,
        showerRoom: shower,
        prayerRoom: prayer,
        wheelchairAccessible: wheelchair,
        elderlyFriendly: elderly,
        wifi: true,
        parkingAvailable: true,
        campingSpot: false,
        waterRefill: true,
        soapAvailable: true,
        toiletPaperAvailable: true,
      },
      accessibility: {
        hasRamp,
        hasElevator: false,
        hasGrabBars,
        doorWidthCm: 90,
        wheelchairTurningRadiusCm: 150,
        groundFloorOnly: true,
        accessibleParkingNearby: true,
        selfAccessible: true,
        detailedNotes: 'ข้อมูลบันทึกจากสมาชิกชุมชน รอทีมงานสุ่มตรวจยืนยัน',
      },
      overallRating: 5.0,
      reviewCount: 1,
      ratingBreakdown: {
        cleanliness: 5.0,
        facilities: 5.0,
        accessibility: 4.8,
        safety_privacy: 5.0,
        convenience: 5.0,
        value: 5.0,
      },
      photos: [
        'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      ],
      verified_at: new Date().toISOString().replace('T', ' ').substring(0, 16),
      source_type: 'user',
      report_status: 'normal',
      badges: ['Recently Verified', 'Cleanest'],
      reviews: [
        {
          id: 'rev-init-' + Date.now(),
          userName: 'ผู้ปักหมุดเริ่มต้น',
          date: new Date().toISOString().split('T')[0],
          overallRating: 5,
          ratings: {
            cleanliness: 5,
            facilities: 5,
            accessibility: 5,
            safety_privacy: 5,
            convenience: 5,
            value: 5,
          },
          comment: 'เพิ่มจุดห้องน้ำนี้เพื่อให้เพื่อนร่วมทางใช้งานได้สะดวกครับ',
          isVerifiedVisit: true,
        }
      ],
    };

    onAdd(newPlace);

    // Launch confetti!
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // ignore
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg sm:text-xl">
                {lang === 'th' ? 'เพิ่มจุดห้องน้ำและจุดพักใหม่' : 'Add New Restroom'}
              </h3>
              <p className="text-xs text-slate-500">
                ตามโครงสร้างข้อมูลภาคผนวก ก (Data Schema Specification)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1 text-xs sm:text-sm">
          
          {/* Place Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อสถานที่ / ปั๊มน้ำมัน / จุดพัก <span className="text-rose-500">*</span>
            </label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น ปั๊ม ปตท. วังมะนาว เพชรบุรี ขาออก"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
              required
            />
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประเภทสถานที่</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FacilityCategory)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
              >
                <option value="gas_station">⛽ ปั๊มน้ำมัน / จุดพักรถ</option>
                <option value="shopping_mall">🏬 ห้างสรรพสินค้า</option>
                <option value="transit_hub">✈️ สถานีขนส่ง / สนามบิน</option>
                <option value="public_park">🌳 สวนสาธารณะ / แหล่งท่องเที่ยว</option>
                <option value="camping_nature">⛺ แคมป์ปิ้ง / จุดพักธรรมชาติ</option>
                <option value="restaurant_cafe">☕ ร้านอาหาร / คาเฟ่</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">ค่าบริการ</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'free' | 'paid')}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
              >
                <option value="free">ฟรี (ไม่มีค่าใช้จ่าย)</option>
                <option value="paid">มีค่าบริการ (ประมาณ 3-10 บาท)</option>
              </select>
            </div>
          </div>

          {/* Address & Province */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ถนน / ที่ตั้ง</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น ถนนพระราม 2 ต.บางเค็ม"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">จังหวัด</label>
              <input 
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="เช่น เพชรบุรี, ชลบุรี, กรุงเทพฯ"
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
              />
            </div>
          </div>

          {/* GPS Coordinates & Locate me */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">พิกัดภูมิศาสตร์ (GPS Lat/Lng)</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>ดึงพิกัดตำแหน่งปัจจุบัน</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude (เช่น 13.5684)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono text-xs focus:outline-emerald-500"
                required
              />
              <input 
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude (เช่น 101.0042)"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 font-mono text-xs focus:outline-emerald-500"
                required
              />
            </div>
          </div>

          {/* Floor & Zone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">ตำแหน่งภายในอาคาร / จุดสังเกต</label>
            <input 
              type="text"
              value={floorZone}
              onChange={(e) => setFloorZone(e.target.value)}
              placeholder="เช่น ด้านหลังร้านกาแฟ, ชั้น 1 ใกล้ทางออกทิศเหนือ"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 focus:outline-emerald-500"
            />
          </div>

          {/* Facilities Checkboxes */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">สิ่งอำนวยความสะดวกที่มีจริง</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { label: '💦 สายฉีดชำระ', state: bidetSprayer, set: setBidetSprayer },
                { label: '♿ ทางลาด/รถเข็น', state: wheelchair, set: setWheelchair },
                { label: '🧓 ราวจับผู้สูงอายุ', state: elderly, set: setElderly },
                { label: '👶 โต๊ะเปลี่ยนผ้าอ้อม', state: diaperTable, set: setDiaperTable },
                { label: '🚿 ห้องอาบน้ำ', state: shower, set: setShower },
                { label: '🕌 ห้องละหมาด', state: prayer, set: setPrayer },
              ].map((item, idx) => (
                <label 
                  key={idx} 
                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center gap-2 select-none transition-all ${
                    item.state ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
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

          {/* PDPA & Guidelines Compliance */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 space-y-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={agreedPdpa}
                onChange={(e) => setAgreedPdpa(e.target.checked)}
                className="mt-1 rounded text-emerald-600 focus:ring-emerald-500"
                required
              />
              <span className="text-xs leading-relaxed">
                <strong>รับทราบนโยบาย PDPA และจริยธรรมข้อมูล (PDF บทที่ 13):</strong> ข้าพเจ้ายืนยันว่าข้อมูลเป็นความจริง ไม่มีการถ่ายภาพหรือบันทึกข้อมูลที่ละเมิดสิทธิส่วนบุคคลในห้องน้ำ และยินยอมให้ระบบเผยแพร่เพื่อประโยชน์สาธารณะ
              </span>
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-slate-600 hover:text-slate-800 font-semibold"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!agreedPdpa || !name.trim()}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold shadow-md shadow-emerald-600/30 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>บันทึกและส่งข้อมูล</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
