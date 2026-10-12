import React, { useState } from 'react';
import { 
  X, Star, Navigation, Share2, Heart, ShieldCheck, 
  MapPin, Clock, MessageSquarePlus, CheckCircle2, 
  Sparkles, Flag, ChevronDown
} from 'lucide-react';
import { RestroomPlace, ReviewItem } from '../types';
import { PooPooMascot } from './PooPooMascot';

interface ToiletBottomSheetProps {
  place: RestroomPlace | null;
  onClose: () => void;
  lang: 'th' | 'en';
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddReview: (placeId: string, review: ReviewItem) => void;
}

export const ToiletBottomSheet: React.FC<ToiletBottomSheetProps> = ({
  place,
  onClose,
  lang,
  isFavorite,
  onToggleFavorite,
  onAddReview,
}) => {
  const [copied, setCopied] = useState(false);
  const [showReviewInput, setShowReviewInput] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [cleanlinessScore, setCleanlinessScore] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  if (!place) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim()) return;

    const newReview: ReviewItem = {
      id: 'rev-' + Date.now(),
      userName: reviewerName.trim(),
      date: new Date().toISOString().split('T')[0],
      overallRating: cleanlinessScore,
      ratings: {
        cleanliness: cleanlinessScore,
        facilities: 5,
        accessibility: 5,
        safety_privacy: 5,
        convenience: 5,
        value: 5,
      },
      comment: reviewComment.trim() || 'สะอาด สะดวก สบายใจ',
      isVerifiedVisit: true,
    };

    onAddReview(place.id, newReview);
    setShowReviewInput(false);
    setReviewerName('');
    setReviewComment('');
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Bottom Sheet Container */}
      <div 
        className="fixed inset-x-0 bottom-0 z-50 max-w-2xl mx-auto bg-white/95 backdrop-blur-xl rounded-t-[32px] shadow-2xl border-t border-white/60 max-h-[85vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Pull handle indicator */}
        <div className="w-full pt-3 pb-2 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-12 h-1.5 bg-slate-300 rounded-full hover:bg-slate-400 transition-colors" />
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto px-5 sm:px-7 pb-6 space-y-5 flex-1 scrollbar-none">
          
          {/* Header row: Name, Category, Close */}
          <div className="flex items-start justify-between gap-3 pt-1">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-200/60">
                  {place.category === 'gas_station' && '⛽ ปั๊มน้ำมัน / จุดพักรถ'}
                  {place.category === 'shopping_mall' && '🏬 ห้างสรรพสินค้า'}
                  {place.category === 'transit_hub' && '✈️ ศูนย์การเดินทาง'}
                  {place.category === 'public_park' && '🌳 สวนสาธารณะ'}
                  {place.category === 'camping_nature' && '⛺ แคมป์ปิ้ง'}
                </span>

                {place.access_status === 'verified' && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1 border border-emerald-200/50">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    ยืนยันความสะอาดแล้ว
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-snug">
                {lang === 'th' ? place.name : place.name_en}
              </h2>

              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{place.address}</span>
              </p>
            </div>

            {/* Quick Actions Header */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onToggleFavorite(place.id)}
                className={`p-2.5 rounded-2xl border transition-all ${
                  isFavorite 
                    ? 'bg-rose-50 border-rose-200 text-rose-500 shadow-xs' 
                    : 'bg-slate-50 border-slate-200/80 text-slate-400 hover:text-rose-500'
                }`}
                title="บันทึกรายการโปรด"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500' : ''}`} />
              </button>

              <button
                onClick={handleShare}
                className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors relative"
                title="แชร์จุดนี้"
              >
                <Share2 className="w-4 h-4" />
                {copied && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                    คัดลอกลิงก์แล้ว!
                  </span>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar: Cleanliness, Price, Hours */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-center">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ความสะอาด</span>
              <span className="text-sm font-extrabold text-amber-600 flex items-center justify-center gap-1 mt-0.5">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {place.overallRating.toFixed(1)}
              </span>
            </div>

            <div className="border-x border-slate-200/60">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ค่าบริการ</span>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                {place.price_type === 'free' ? 'ฟรี' : `${place.price_amount} ฿`}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">เวลาเปิด</span>
              <span className="text-xs font-bold text-slate-700 mt-1 block truncate">
                {place.opening_hours}
              </span>
            </div>
          </div>

          {/* Indoor Zone if exists */}
          {place.floor_zone && (
            <div className="p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80 flex items-center gap-2.5 text-xs text-emerald-950 font-medium">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>จุดสังเกต:</strong> {place.floor_zone}</span>
            </div>
          )}

          {/* Feature Highlights Grid */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              สิ่งอำนวยความสะดวกที่พร้อมใช้งาน
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                { label: 'สายฉีดชำระ', ok: place.facilities.bidetSprayer, icon: '💦' },
                { label: 'ทางลาด / วีลแชร์', ok: place.facilities.wheelchairAccessible, icon: '♿' },
                { label: 'ราวจับผู้สูงอายุ', ok: place.facilities.elderlyFriendly, icon: '🧓' },
                { label: 'โต๊ะเปลี่ยนผ้าอ้อม', ok: place.facilities.diaperChangingTable, icon: '👶' },
                { label: 'ห้องให้นมบุตร', ok: place.facilities.nursingRoom, icon: '🍼' },
                { label: 'ห้องอาบน้ำ', ok: place.facilities.showerRoom, icon: '🚿' },
                { label: 'ห้องละหมาด', ok: place.facilities.prayerRoom, icon: '🕌' },
                { label: 'สบู่ล้างมือ', ok: place.facilities.soapAvailable, icon: '🧼' },
                { label: 'กระดาษชำระ', ok: place.facilities.toiletPaperAvailable, icon: '🧻' },
              ].map((f, idx) => (
                <div 
                  key={idx}
                  className={`p-2.5 rounded-xl border flex items-center justify-between ${
                    f.ok 
                      ? 'bg-emerald-50/40 border-emerald-200/80 text-emerald-900 font-medium'
                      : 'bg-slate-50/40 border-slate-200/40 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    <span>{f.icon}</span>
                    <span className="truncate">{f.label}</span>
                  </span>
                  {f.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <span className="text-[10px] text-slate-400">ไม่มี</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Accessibility Specs if measured */}
          {(place.accessibility.doorWidthCm || place.accessibility.wheelchairTurningRadiusCm) && (
            <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 text-xs text-sky-950 space-y-1.5">
              <span className="font-bold block uppercase text-[11px] text-sky-800">
                สเปกกายภาพเพื่อคนใช้วีลแชร์ (Universal Design)
              </span>
              <div className="flex gap-4">
                {place.accessibility.doorWidthCm && (
                  <span>ความกว้างประตู: <strong>{place.accessibility.doorWidthCm} ซม.</strong></span>
                )}
                {place.accessibility.wheelchairTurningRadiusCm && (
                  <span>พื้นที่หมุนตัว: <strong>{place.accessibility.wheelchairTurningRadiusCm} ซม.</strong></span>
                )}
              </div>
            </div>
          )}

          {/* Community Reviews Section with Mascot */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                รีวิวจากผู้ใช้จริง ({place.reviews.length})
              </span>
              <button
                onClick={() => setShowReviewInput(!showReviewInput)}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                <span>เขียนรีวิว</span>
              </button>
            </div>

            {/* Quick Review Form */}
            {showReviewInput && (
              <form onSubmit={handleReviewSubmit} className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5 text-xs animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="ชื่อของคุณ..."
                    className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-800 focus:outline-emerald-500"
                    required
                  />
                  <select
                    value={cleanlinessScore}
                    onChange={(e) => setCleanlinessScore(Number(e.target.value))}
                    className="px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-800"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ ดีมาก สะอาดมาก</option>
                    <option value={4}>⭐⭐⭐⭐ สะอาดดี</option>
                    <option value={3}>⭐⭐⭐ พอใช้ได้</option>
                    <option value={2}>⭐⭐ ควรปรับปรุง</option>
                  </select>
                </div>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="บอกเล่าสภาพจริง เช่น น้ำไหลแรงไหม สายฉีดโอเคไหม..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-200 text-slate-800"
                />
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setShowReviewInput(false)} className="px-3 py-1 text-slate-500">ยกเลิก</button>
                  <button type="submit" className="px-4 py-1 font-bold rounded-xl bg-amber-500 text-white hover:bg-amber-600">ส่งรีวิว</button>
                </div>
              </form>
            )}

            {/* Review Items */}
            {place.reviews.length === 0 ? (
              <div className="text-center py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <PooPooMascot size={32} mood="happy" />
                <span>ยังไม่มีรีวิว มาร่วมเป็นคนแรกที่รีวิวกันเถอะ!</span>
              </div>
            ) : (
              <div className="space-y-2">
                {place.reviews.slice(0, 3).map((r) => (
                  <div key={r.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{r.userName}</span>
                      <span className="font-bold text-amber-500">★ {r.overallRating}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Floating Bottom Action Bar */}
        <div className="p-4 bg-white/95 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <PooPooMascot size={38} mood="relieved" />
            <div className="hidden sm:block">
              <span className="text-xs font-bold text-slate-800 block">น้องปู้ปู้แนะนำ</span>
              <span className="text-[11px] text-emerald-600">จุดนี้สะอาด พร้อมแวะพัก ✨</span>
            </div>
          </div>

          <button
            onClick={openGoogleMaps}
            className="flex-1 max-w-sm py-3 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>นำทางด้วย Google Maps</span>
          </button>
        </div>

      </div>
    </>
  );
};
