import React, { useState } from 'react';
import { X, MapPin, Navigation, Sparkles } from 'lucide-react';
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
    if (!name.trim() || !agreed) return;

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
      opening_hours: 'เปิดบริการตามปกติ',
      price_type: priceType,
      floor_zone: floorZone || 'บริเวณอาคารหลัก',
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
        hasRamp: wheelchair,
        hasElevator: false,
        hasGrabBars: elderly,
        doorWidthCm: 90,
        wheelchairTurningRadiusCm: 150,
        groundFloorOnly: true,
        accessibleParkingNearby: true,
        selfAccessible: true,
        detailedNotes: 'ข้อมูลบันทึกจากผู้ใช้งาน',
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
      badges: ['Recently Added'],
      reviews: [
        {
          id: 'rev-init-' + Date.now(),
          userName: 'ผู้ปักหมุด',
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
          comment: 'เพิ่มจุดห้องน้ำนี้เพื่อประโยชน์ในการเดินทาง',
          isVerifiedVisit: true,
        }
      ],
    };

    onAdd(newPlace);

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
            <label className="block font-bold text-slate-700 mb-1">
              ชื่อสถานที่ / ปั๊มน้ำมัน <span className="text-rose-500">*</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ประเภท</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as FacilityCategory)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
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
              <label className="block font-bold text-slate-700 mb-1">ค่าบริการ</label>
              <select
                value={priceType}
                onChange={(e) => setPriceType(e.target.value as 'free' | 'paid')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
              >
                <option value="free">ฟรี</option>
                <option value="paid">มีค่าบริการ</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">ถนน / ที่ตั้ง</label>
              <input 
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="เช่น ถนนพระราม 2"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">จังหวัด</label>
              <input 
                type="text"
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                placeholder="เช่น เพชรบุรี"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
              />
            </div>
          </div>

          {/* GPS Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-bold text-slate-700">พิกัด GPS</label>
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                className="text-xs text-emerald-600 font-semibold hover:underline flex items-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                <span>ใช้พิกัดปัจจุบัน</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input 
                type="text"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                placeholder="Latitude"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs"
                required
              />
              <input 
                type="text"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                placeholder="Longitude"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800 text-xs"
                required
              />
            </div>
          </div>

          {/* Floor & Zone */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">จุดสังเกตในสถานที่</label>
            <input 
              type="text"
              value={floorZone}
              onChange={(e) => setFloorZone(e.target.value)}
              placeholder="เช่น ด้านหลังร้านกาแฟ, ฝั่งตรงข้ามร้านสะดวกซื้อ"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-800"
            />
          </div>

          {/* Facilities */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">สิ่งอำนวยความสะดวก</label>
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
                  className={`p-2 rounded-xl border cursor-pointer flex items-center gap-2 select-none text-xs transition-all ${
                    item.state ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold' : 'bg-slate-50 border-slate-200 text-slate-600'
                  }`}
                >
                  <input 
                    type="checkbox" 
                    checked={item.state} 
                    onChange={(e) => item.set(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Agreement */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-700">
            <label className="flex items-start gap-2 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="mt-0.5 rounded text-emerald-600"
                required
              />
              <span className="text-xs leading-relaxed">
                ยืนยันว่าข้อมูลเป็นความจริง และไม่มีการบันทึกภาพถ่ายที่ละเมิดความเป็นส่วนตัวในห้องน้ำ
              </span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-500 hover:text-slate-700 font-semibold text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={!agreed || !name.trim()}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>บันทึกจุดห้องน้ำ</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
