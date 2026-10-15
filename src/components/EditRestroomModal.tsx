import React, { useState, useEffect } from 'react';
import { RestroomPlace, FacilityCategory, AccessStatus } from '../types';
import { X, Save, MapPin, CheckCircle, AlertTriangle, ShieldCheck, Fuel, ShoppingBag, Utensils, Bus } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { sanitizeText, validateCoordinates } from '../lib/apiSecurity';

interface EditRestroomModalProps {
  place: RestroomPlace | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updated: RestroomPlace) => void;
}

export const EditRestroomModal: React.FC<EditRestroomModalProps> = ({
  place,
  isOpen,
  onClose,
  onSaved,
}) => {
  if (!isOpen || !place) return null;

  const [formData, setFormData] = useState({
    name: place.name,
    name_en: place.name_en || '',
    category: place.category as FacilityCategory,
    address: place.address || '',
    province: place.province || '',
    lat: place.coordinates.lat,
    lng: place.coordinates.lng,
    opening_hours: place.opening_hours || '24 ชั่วโมง',
    is_free: place.price_type === 'free',
    price_amount: place.price_amount || 0,
    has_bidet: place.facilities.bidetSprayer,
    wheelchair_accessible: place.facilities.wheelchairAccessible,
    elderly_support: place.facilities.elderlyFriendly,
    baby_station: place.facilities.diaperChangingTable,
    has_shower: place.facilities.showerRoom,
    has_prayer_room: place.facilities.prayerRoom,
    open_24h: place.opening_hours?.includes('24') || false,
    verification_status: place.access_status as AccessStatus,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (place) {
      setFormData({
        name: place.name,
        name_en: place.name_en || '',
        category: place.category,
        address: place.address || '',
        province: place.province || '',
        lat: place.coordinates.lat,
        lng: place.coordinates.lng,
        opening_hours: place.opening_hours || '24 ชั่วโมง',
        is_free: place.price_type === 'free',
        price_amount: place.price_amount || 0,
        has_bidet: place.facilities.bidetSprayer,
        wheelchair_accessible: place.facilities.wheelchairAccessible,
        elderly_support: place.facilities.elderlyFriendly,
        baby_station: place.facilities.diaperChangingTable,
        has_shower: place.facilities.showerRoom,
        has_prayer_room: place.facilities.prayerRoom,
        open_24h: place.opening_hours?.includes('24') || false,
        verification_status: place.access_status,
      });
      setSaveError(null);
    }
  }, [place]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    const latNum = Number(formData.lat);
    const lngNum = Number(formData.lng);
    if (!validateCoordinates(latNum, lngNum)) {
      setSaveError('พิกัดตำแหน่งไม่อยู่ในเขตประเทศไทย หรือรูปแบบไม่ถูกต้อง');
      return;
    }

    const cleanName = sanitizeText(formData.name, 100);
    if (!cleanName) {
      setSaveError('กรุณาระบุชื่อสถานที่');
      return;
    }

    const cleanNameEn = sanitizeText(formData.name_en, 100);
    const cleanAddress = sanitizeText(formData.address, 200);
    const cleanProvince = sanitizeText(formData.province, 50);

    setIsSaving(true);

    try {
      if (isSupabaseConfigured) {
        // Update in Supabase
        const wktPoint = `POINT(${lngNum} ${latNum})`;
        const { error } = await supabase
          .from('toilets')
          .update({
            name: cleanName,
            name_en: cleanNameEn || null,
            category: formData.category,
            address: cleanAddress,
            province: cleanProvince,
            location: wktPoint,
            has_bidet: formData.has_bidet,
            wheelchair_accessible: formData.wheelchair_accessible,
            elderly_support: formData.elderly_support,
            baby_station: formData.baby_station,
            has_shower: formData.has_shower,
            has_prayer_room: formData.has_prayer_room,
            open_24h: formData.open_24h,
            is_free: formData.is_free,
            price_amount: formData.price_amount,
            opening_hours: formData.opening_hours,
            verification_status: formData.verification_status,
            is_verified: formData.verification_status === 'verified',
            updated_at: new Date().toISOString(),
          })
          .eq('id', place.id);

        if (error) {
          console.error('Supabase update error:', error);
          // If RLS blocked, report friendly advice
          if (error.message.includes('row-level security') || error.code === '42501') {
            setSaveError('กรุณาอัปเดต RLS Policy ใน Supabase SQL Editor ตามไฟล์ admin_policies.sql เพื่อเปิดสิทธิ์แก้ไขข้อมูล');
          } else {
            setSaveError(error.message);
          }
        }
      }

      // Update local state representation
      const updated: RestroomPlace = {
        ...place,
        name: formData.name,
        name_en: formData.name_en,
        category: formData.category,
        address: formData.address,
        province: formData.province,
        coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) },
        opening_hours: formData.opening_hours,
        price_type: formData.is_free ? 'free' : 'paid',
        price_amount: formData.price_amount,
        access_status: formData.verification_status,
        facilities: {
          ...place.facilities,
          bidetSprayer: formData.has_bidet,
          wheelchairAccessible: formData.wheelchair_accessible,
          elderlyFriendly: formData.elderly_support,
          diaperChangingTable: formData.baby_station,
          showerRoom: formData.has_shower,
          prayerRoom: formData.has_prayer_room,
        },
      };

      onSaved(updated);
      onClose();
    } catch (err: any) {
      setSaveError(err.message || 'บันทึกไม่สำเร็จ');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 px-6 py-4.5 text-white flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-lg flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-200" />
              <span>แก้ไขข้อมูลจุดห้องน้ำ (Admin Edit)</span>
            </h3>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              ID: {place.id}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {saveError && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{saveError}</span>
            </div>
          )}

          {/* Name & Name EN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อสถานที่ (ไทย) *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ชื่อสถานที่ (อังกฤษ)
              </label>
              <input
                type="text"
                value={formData.name_en}
                onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
          </div>

          {/* Category & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมวดหมู่สถานที่
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as FacilityCategory })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 bg-white"
              >
                <option value="gas_station">⛽ ปั๊มน้ำมัน (Gas Station)</option>
                <option value="shopping_mall">🏬 ห้างสรรพสินค้า / ซูเปอร์ (Mall)</option>
                <option value="restaurant_cafe">🍽️ ร้านอาหาร / คาเฟ่ (Restaurant)</option>
                <option value="transit_hub">🚆 สถานีขนส่ง / จุดพักรถ (Transit Hub)</option>
                <option value="public_park">🌳 สวนสาธารณะ (Park)</option>
                <option value="camping_nature">🏕️ จุดกางเต็นท์ / ธรรมชาติ</option>
                <option value="other">📌 อื่นๆ</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                สถานะการตรวจสอบ (Verification Status)
              </label>
              <select
                value={formData.verification_status}
                onChange={(e) => setFormData({ ...formData, verification_status: e.target.value as AccessStatus })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500 bg-white"
              >
                <option value="verified">✅ ยืนยันแล้ว (Verified)</option>
                <option value="user_reported">👤 ผู้ใช้รายงาน (User Reported)</option>
                <option value="out_of_service">⚠️ ปิดปรับปรุง / ใช้งานไม่ได้ (Out of Service)</option>
                <option value="unknown">❓ ยังไม่ทราบ (Unknown)</option>
              </select>
            </div>
          </div>

          {/* Address & Province */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ที่อยู่ / ถนน / โซน
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                จังหวัด
              </label>
              <input
                type="text"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>ละติจูด (Latitude) *</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>ลองจิจูด (Longitude) *</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: parseFloat(e.target.value) || 0 })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Amenities & Toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              สิ่งอำนวยความสะดวก (Facilities & Features)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.has_bidet}
                  onChange={(e) => setFormData({ ...formData, has_bidet: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">สายฉีดชำระ</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.wheelchair_accessible}
                  onChange={(e) => setFormData({ ...formData, wheelchair_accessible: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">ทางลาด/วีลแชร์</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.elderly_support}
                  onChange={(e) => setFormData({ ...formData, elderly_support: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">ราวจับผู้สูงอายุ</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.baby_station}
                  onChange={(e) => setFormData({ ...formData, baby_station: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">ที่เปลี่ยนผ้าอ้อม</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.has_shower}
                  onChange={(e) => setFormData({ ...formData, has_shower: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">ห้องอาบน้ำ</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.has_prayer_room}
                  onChange={(e) => setFormData({ ...formData, has_prayer_room: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">ห้องละหมาด</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.open_24h}
                  onChange={(e) => setFormData({ ...formData, open_24h: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">เปิด 24 ชม.</span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={formData.is_free}
                  onChange={(e) => setFormData({ ...formData, is_free: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-semibold">เข้าใช้บริการฟรี</span>
              </label>
            </div>
          </div>

          {/* Footer action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
