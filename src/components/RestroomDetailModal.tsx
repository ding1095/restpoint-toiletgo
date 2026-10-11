import React, { useState } from 'react';
import { 
  X, Star, Navigation, Share2, Heart, ShieldCheck, 
  MapPin, Clock, AlertTriangle, MessageSquarePlus, 
  CheckCircle2, Sparkles, Flag
} from 'lucide-react';
import { RestroomPlace, ReviewItem } from '../types';

interface RestroomDetailModalProps {
  place: RestroomPlace | null;
  onClose: () => void;
  lang: 'th' | 'en';
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onAddReview: (placeId: string, review: ReviewItem) => void;
  onReportIssue: (placeId: string, reason: string) => void;
}

export const RestroomDetailModal: React.FC<RestroomDetailModalProps> = ({
  place,
  onClose,
  lang,
  isFavorite,
  onToggleFavorite,
  onAddReview,
  onReportIssue,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'accessibility' | 'reviews'>('overview');
  const [copied, setCopied] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [cleanRating, setCleanRating] = useState(5);

  // Issue report form state
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState('อุปกรณ์ชำรุด / ไม่มีน้ำ');

  if (!place) return null;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${place.coordinates.lat},${place.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName.trim() || !reviewComment.trim()) return;

    const newRev: ReviewItem = {
      id: 'rev-' + Date.now(),
      userName: reviewName.trim(),
      date: new Date().toISOString().split('T')[0],
      overallRating: cleanRating,
      ratings: {
        cleanliness: cleanRating,
        facilities: 5,
        accessibility: 5,
        safety_privacy: 5,
        convenience: 5,
        value: 5,
      },
      comment: reviewComment.trim(),
      isVerifiedVisit: true,
    };

    onAddReview(place.id, newRev);
    setShowReviewForm(false);
    setReviewName('');
    setReviewComment('');
  };

  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    onReportIssue(place.id, reportReason);
    setShowReportForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/50 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="relative h-44 sm:h-52 bg-slate-900 overflow-hidden shrink-0">
          <img 
            src={place.photos[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'} 
            alt={place.name}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {place.access_status === 'verified' ? 'มีทีมงานยืนยันแล้ว' : 'ผู้ใช้แนะนำ'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-xs">
              {place.price_type === 'free' ? 'เข้าใช้ฟรี' : `มีค่าบริการ ${place.price_amount || 5} ฿`}
            </span>
          </div>

          {/* Title & Info */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 flex items-center text-xs font-bold bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                {place.overallRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-300">({place.reviewCount} รีวิว)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {lang === 'th' ? place.name : place.name_en}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{place.address}</span>
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Facilities'}
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'accessibility'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ♿ {lang === 'th' ? 'ความสะดวกสำหรับรถเข็น/ผู้สูงอายุ' : 'Accessibility'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'reviews'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ⭐ {lang === 'th' ? `รีวิว (${place.reviews.length})` : `Reviews (${place.reviews.length})`}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Feature Tags */}
              <div className="flex flex-wrap gap-1.5">
                {place.badges.map((b, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {b}
                  </span>
                ))}
              </div>

              {/* Location inside Venue */}
              {place.floor_zone && (
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block uppercase">จุดสังเกต / บริเวณที่ตั้ง</span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-800">{place.floor_zone}</span>
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70 text-xs sm:text-sm">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">เวลาเปิดให้บริการ:</span>
                  <span className="font-bold text-slate-800">{place.opening_hours}</span>
                </div>
              </div>

              {/* Facilities Checklist */}
              <div>
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  สิ่งอำนวยความสะดวก
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
                  {[
                    { label: 'สายฉีดชำระ', ok: place.facilities.bidetSprayer, icon: '💦' },
                    { label: 'แยกห้องน้ำชาย/หญิง', ok: place.facilities.genderSeparated, icon: '🚻' },
                    { label: 'ห้องน้ำครอบครัว', ok: place.facilities.familyRestroom, icon: '👨‍👩‍👧' },
                    { label: 'โต๊ะเปลี่ยนผ้าอ้อม', ok: place.facilities.diaperChangingTable, icon: '👶' },
                    { label: 'ห้องให้นมบุตร', ok: place.facilities.nursingRoom, icon: '🍼' },
                    { label: 'ห้องละหมาด', ok: place.facilities.prayerRoom, icon: '🕌' },
                    { label: 'ห้องอาบน้ำ', ok: place.facilities.showerRoom, icon: '🚿' },
                    { label: 'รองรับรถเข็น/วีลแชร์', ok: place.facilities.wheelchairAccessible, icon: '♿' },
                    { label: 'ราวจับผู้สูงอายุ', ok: place.facilities.elderlyFriendly, icon: '🧓' },
                    { label: 'สบู่ล้างมือ', ok: place.facilities.soapAvailable, icon: '🧼' },
                    { label: 'กระดาษชำระ', ok: place.facilities.toiletPaperAvailable, icon: '🧻' },
                    { label: 'จุดเติมน้ำดื่ม', ok: place.facilities.waterRefill, icon: '💧' },
                  ].map((fac, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between ${
                        fac.ok 
                          ? 'bg-emerald-50/40 border-emerald-200 text-emerald-950 font-medium' 
                          : 'bg-slate-50/50 border-slate-200/60 text-slate-400'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <span>{fac.icon}</span>
                        <span className="truncate">{fac.label}</span>
                      </span>
                      {fac.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="text-[11px] text-slate-400">ไม่มี</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Cleanliness Rating Summary */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-bold text-slate-700">คะแนนความสะอาดเฉลี่ย</span>
                  <span className="font-extrabold text-emerald-700">{place.ratingBreakdown.cleanliness.toFixed(1)} / 5.0 ดาว</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full" 
                    style={{ width: `${(place.ratingBreakdown.cleanliness / 5) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCESSIBILITY */}
          {activeTab === 'accessibility' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-400 block font-medium">ความกว้างประตู</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.doorWidthCm ? `${place.accessibility.doorWidthCm} ซม.` : 'ขนาดมาตรฐาน'}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">✓ รถเข็นเข้า-ออกสะดวก</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-400 block font-medium">พื้นที่หมุนตัวในห้องน้ำ</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.wheelchairTurningRadiusCm ? `${place.accessibility.wheelchairTurningRadiusCm} ซม.` : 'กว้างขวาง'}
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">✓ หมุนรถเข็น 360 องศาได้</span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-400 block font-medium">ทางลาด & ลิฟต์</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.hasRamp ? 'มีทางลาดขึ้นสะดวก' : 'ไม่มีทางลาด'}
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl border border-slate-200 bg-white">
                  <span className="text-xs text-slate-400 block font-medium">ราวจับช่วยพยุงตัว</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.hasGrabBars ? 'มีราวจับข้างโถชักโครก' : 'ไม่มีราวจับ'}
                  </span>
                </div>
              </div>

              {place.accessibility.detailedNotes && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <span className="font-bold text-slate-700 text-xs block mb-1">ข้อมูลเพิ่มเติม</span>
                  <p className="text-slate-600 text-xs leading-relaxed">
                    {place.accessibility.detailedNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS */}
          {activeTab === 'reviews' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase">รีวิวจากผู้ใช้จริง</span>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1 shadow-2xs"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>เขียนรีวิว</span>
                </button>
              </div>

              {/* Review form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">ชื่อของคุณ</label>
                      <input 
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="เช่น สมชาย"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">ความสะอาด</label>
                      <select
                        value={cleanRating}
                        onChange={(e) => setCleanRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ ดีมาก สะอาดมาก</option>
                        <option value={4}>⭐⭐⭐⭐ สะอาดดี</option>
                        <option value={3}>⭐⭐⭐ พอใช้ได้</option>
                        <option value={2}>⭐⭐ ควรปรับปรุง</option>
                        <option value={1}>⭐ สกปรก</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1 text-xs">บอกเล่าสภาพจริง</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="น้ำไหลแรงไหม มีสบู่ไหม หรือห้องน้ำกลิ่นเป็นอย่างไร..."
                      rows={2}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      โพสต์รีวิว
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-2.5">
                {place.reviews.map((rev) => (
                  <div key={rev.id} className="p-3.5 rounded-2xl border border-slate-200/80 bg-white space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-xs">{rev.userName}</span>
                      <span className="text-amber-500 font-bold text-xs">★ {rev.overallRating}</span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report issue box */}
          {showReportForm && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-2.5">
              <span className="font-bold text-rose-900 block flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>แจ้งข้อมูลผิดพลาดหรืออุปกรณ์ชำรุด</span>
              </span>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-slate-800"
              >
                <option value="อุปกรณ์ชำรุด / ไม่มีน้ำ / ไม่มีสบู่">อุปกรณ์ชำรุด / ไม่มีน้ำ / ไม่มีสบู่</option>
                <option value="ห้องน้ำปิดปรับปรุงชั่วคราว">ห้องน้ำปิดปรับปรุงชั่วคราว</option>
                <option value="พิกัดบนแผนที่คลาดเคลื่อน">พิกัดบนแผนที่คลาดเคลื่อน</option>
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowReportForm(false)} className="px-3 py-1 text-slate-500">ยกเลิก</button>
                <button onClick={handleSubmitReport} className="px-3 py-1 font-bold rounded-lg bg-rose-600 text-white">ส่งรายงาน</button>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(place.id)}
              className={`p-2.5 rounded-2xl border transition-colors ${
                isFavorite ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600'
              }`}
              title="บันทึกรายการโปรด"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors relative"
              title="แชร์จุดพัก"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                  คัดลอกลิงก์แล้ว!
                </span>
              )}
            </button>

            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="p-2.5 rounded-2xl border border-slate-200 bg-white text-slate-400 hover:text-rose-600 transition-colors"
              title="แจ้งปัญหา"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={openGoogleMaps}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition-all active:scale-98"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>{lang === 'th' ? 'นำทางทันที (Google Maps)' : 'Open in Maps'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
