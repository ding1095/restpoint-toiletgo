import React, { useState } from 'react';
import { 
  X, Star, Navigation, Share2, Heart, ShieldCheck, 
  MapPin, Clock, AlertTriangle, MessageSquarePlus, 
  User, CheckCircle2, ChevronRight, Eye, Flag, Sparkles
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
  const [accessRating, setAccessRating] = useState(5);

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
      overallRating: Math.round((cleanRating + accessRating) / 2),
      ratings: {
        cleanliness: cleanRating,
        facilities: 5,
        accessibility: accessRating,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with image banner */}
        <div className="relative h-48 sm:h-56 bg-slate-900 overflow-hidden shrink-0">
          <img 
            src={place.photos[0] || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'} 
            alt={place.name}
            className="w-full h-full object-cover opacity-80"
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
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500 text-white shadow-md flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {place.access_status === 'verified' ? 'ยืนยันข้อมูลแล้ว' : 'ผู้ใช้รายงาน'}
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-white/90 text-slate-800 backdrop-blur-sm shadow-sm">
              {place.price_type === 'free' ? 'เข้าใช้ฟรี' : `มีค่าบริการ ${place.price_amount || 5} ฿`}
            </span>
          </div>

          {/* Title & Rating in Banner */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 flex items-center text-sm font-bold bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                <Star className="w-4 h-4 fill-amber-400 mr-1" />
                {place.overallRating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-300">({place.reviewCount} รีวิวจากชุมชน)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white leading-tight">
              {lang === 'th' ? place.name : place.name_en}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>{place.address}</span>
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50/80 px-6 pt-2 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {lang === 'th' ? 'สิ่งอำนวยความสะดวก' : 'Overview & Facilities'}
          </button>
          <button
            onClick={() => setActiveTab('accessibility')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'accessibility'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            ♿ {lang === 'th' ? 'มาตรฐานการเข้าถึง (Universal Design)' : 'Accessibility Specs'}
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
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
            <div className="space-y-6">
              {/* Badges bar */}
              <div className="flex flex-wrap gap-1.5">
                {place.badges.map((b, idx) => (
                  <span 
                    key={idx}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60 flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" />
                    {b}
                  </span>
                ))}
              </div>

              {/* Location Inside Venue */}
              {place.floor_zone && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-2xl flex items-start gap-3">
                  <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
                    <Navigation className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      {lang === 'th' ? 'ตำแหน่งภายในอาคาร / จุดสังเกต' : 'Indoor Location / Landmark'}
                    </h4>
                    <p className="text-sm text-blue-800 font-medium mt-0.5">
                      {place.floor_zone}
                    </p>
                  </div>
                </div>
              )}

              {/* Opening Hours & Verification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">เวลาทำการ</span>
                    <span className="font-semibold text-slate-800">{place.opening_hours}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">ตรวจสอบล่าสุด</span>
                    <span className="font-semibold text-slate-800">{place.verified_at}</span>
                  </div>
                </div>
              </div>

              {/* Facilities Grid */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <span>สิ่งอำนวยความสะดวกที่ตรวจสอบแล้ว</span>
                  <span className="text-xs text-slate-400 font-normal">(ตามมาตรฐาน PDF บทที่ 7.2)</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs sm:text-sm">
                  {[
                    { label: 'สายฉีดชำระ', ok: place.facilities.bidetSprayer, icon: '💦' },
                    { label: 'แยกห้องน้ำชาย/หญิง', ok: place.facilities.genderSeparated, icon: '🚻' },
                    { label: 'ห้องน้ำครอบครัว', ok: place.facilities.familyRestroom, icon: '👨‍👩‍👧' },
                    { label: 'โต๊ะเปลี่ยนผ้าอ้อม', ok: place.facilities.diaperChangingTable, icon: '👶' },
                    { label: 'ห้องให้นมบุตร', ok: place.facilities.nursingRoom, icon: '🍼' },
                    { label: 'ห้องละหมาด', ok: place.facilities.prayerRoom, icon: '🕌' },
                    { label: 'ห้องอาบน้ำ', ok: place.facilities.showerRoom, icon: '🚿' },
                    { label: 'รองรับรถเข็น/วีลแชร์', ok: place.facilities.wheelchairAccessible, icon: '♿' },
                    { label: 'เหมาะกับผู้สูงอายุ', ok: place.facilities.elderlyFriendly, icon: '🧓' },
                    { label: 'สบู่ล้างมือ', ok: place.facilities.soapAvailable, icon: '🧼' },
                    { label: 'กระดาษชำระ', ok: place.facilities.toiletPaperAvailable, icon: '🧻' },
                    { label: 'จุดเติมน้ำดื่ม', ok: place.facilities.waterRefill, icon: '💧' },
                  ].map((fac, idx) => (
                    <div 
                      key={idx}
                      className={`p-2.5 rounded-xl border flex items-center justify-between transition-colors ${
                        fac.ok 
                          ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-950 font-medium' 
                          : 'bg-slate-50 border-slate-200/50 text-slate-400'
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

              {/* 6-Dimension Ratings Breakdown */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
                <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center justify-between">
                  <span>คะแนนประเมิน 6 มิติ (ตามมาตรฐาน PDF บทที่ 9)</span>
                  <span className="text-emerald-700 font-bold">{place.overallRating.toFixed(1)} / 5.0</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { label: 'ความสะอาด', val: place.ratingBreakdown.cleanliness },
                    { label: 'อุปกรณ์ครบครัน', val: place.ratingBreakdown.facilities },
                    { label: 'การเข้าถึง', val: place.ratingBreakdown.accessibility },
                    { label: 'ความปลอดภัย/ส่วนตัว', val: place.ratingBreakdown.safety_privacy },
                    { label: 'ความสะดวกในการหา', val: place.ratingBreakdown.convenience },
                    { label: 'ความคุ้มค่า', val: place.ratingBreakdown.value },
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-slate-600 font-medium">
                        <span>{item.label}</span>
                        <span className="font-bold text-slate-900">{item.val.toFixed(1)}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-500 h-full rounded-full" 
                          style={{ width: `${(item.val / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACCESSIBILITY DEEP-DIVE */}
          {activeTab === 'accessibility' && (
            <div className="space-y-5 text-sm">
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <h4 className="font-bold text-emerald-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>เกณฑ์ตรวจสอบการใช้งานจริง (Universal Design Audit)</span>
                </h4>
                <p className="text-xs text-emerald-800 mt-1">
                  ระบบแยกการมีป้ายสัญลักษณ์ออกจากการใช้งานได้จริง ตรวจวัดความกว้างประตู ทางลาด และพื้นที่หมุนรถเข็น
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <span className="text-xs text-slate-400 block font-medium">ความกว้างประตูห้องน้ำ</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.doorWidthCm ? `${place.accessibility.doorWidthCm} ซม.` : 'ไม่ระบุ'}
                  </span>
                  <span className="text-xs text-emerald-600 block mt-0.5">✓ กว้างกว่าเกณฑ์มาตรฐาน 80 ซม.</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <span className="text-xs text-slate-400 block font-medium">รัศมีพื้นที่หมุนรถเข็น (Turning Space)</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.wheelchairTurningRadiusCm ? `${place.accessibility.wheelchairTurningRadiusCm} ซม.` : 'ไม่ระบุ'}
                  </span>
                  <span className="text-xs text-emerald-600 block mt-0.5">✓ หมุนตัวได้ 360 องศา สะดวก</span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <span className="text-xs text-slate-400 block font-medium">การเข้าถึงด้วยตนเอง</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.selfAccessible ? 'เข้าได้ด้วยตนเอง' : 'ต้องมีผู้ช่วย'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
                  <span className="text-xs text-slate-400 block font-medium">ที่จอดรถคนพิการใกล้เคียง</span>
                  <span className="text-base font-bold text-slate-800">
                    {place.accessibility.accessibleParkingNearby ? 'มีที่จอดใกล้ทางเข้า' : 'ไม่มีที่จอดเฉพาะ'}
                  </span>
                </div>
              </div>

              {place.accessibility.detailedNotes && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-1">
                    บันทึกจากทีมสำรวจภาคสนาม
                  </h5>
                  <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                    {place.accessibility.detailedNotes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEWS & COMMUNITY */}
          {activeTab === 'reviews' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">รีวิวและความคิดเห็นจากชุมชน</h3>
                  <p className="text-xs text-slate-500">ข้อมูลจริงจากผู้ใช้ที่แวะพัก</p>
                </div>

                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex items-center gap-1.5 shadow-2xs"
                >
                  <MessageSquarePlus className="w-3.5 h-3.5" />
                  <span>เขียนรีวิว</span>
                </button>
              </div>

              {/* Review form */}
              {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-3">
                  <h4 className="font-bold text-emerald-900 text-sm">แบ่งปันประสบการณ์การใช้ห้องน้ำ</h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">ชื่อหรือนามแฝงของคุณ</label>
                      <input 
                        type="text"
                        value={reviewName}
                        onChange={(e) => setReviewName(e.target.value)}
                        placeholder="เช่น สมศักดิ์ คนชอบเที่ยว"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">คะแนนความสะอาด (1-5)</label>
                      <select
                        value={cleanRating}
                        onChange={(e) => setCleanRating(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500"
                      >
                        <option value={5}>⭐⭐⭐⭐⭐ ดีเยี่ยม (5)</option>
                        <option value={4}>⭐⭐⭐⭐ สะอาดดี (4)</option>
                        <option value={3}>⭐⭐⭐ พอใช้ (3)</option>
                        <option value={2}>⭐⭐ ควรปรับปรุง (2)</option>
                        <option value={1}>⭐ สกปรกมาก (1)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1 text-xs">ข้อความรีวิว / สภาพจริง</label>
                    <textarea 
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="บอกเล่าสภาพความสะอาด น้ำไหลแรงหรือไม่ สายฉีดชำระ หรือความสะดวก..."
                      rows={3}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-emerald-500 text-xs"
                      required
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-800 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>PDPA Privacy Reminder:</strong> ตามข้อกำหนดโครงการ ห้ามถ่ายติดบุคคลหรือละเมิดความเป็นส่วนตัวในห้องน้ำโดยเด็ดขาด
                    </span>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowReviewForm(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                    >
                      ยกเลิก
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs"
                    >
                      ส่งรีวิว
                    </button>
                  </div>
                </form>
              )}

              {/* Reviews List */}
              <div className="space-y-3">
                {place.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl border border-slate-200/80 bg-white shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                          {rev.userName[0]}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 text-xs sm:text-sm block">{rev.userName}</span>
                          <span className="text-[11px] text-slate-400">{rev.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200/50">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{rev.overallRating} / 5</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                      {rev.comment}
                    </p>

                    {rev.isVerifiedVisit && (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>ผู้ใช้งานจริงที่ได้รับการยืนยัน</span>
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report Issue Box */}
          {showReportForm && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs space-y-3">
              <h4 className="font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>แจ้งข้อมูลผิดพลาด / อุปกรณ์ชำรุด (PDF บทที่ 7.4)</span>
              </h4>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-rose-300 bg-white text-slate-800 focus:outline-rose-500"
              >
                <option value="อุปกรณ์ชำรุด / ไม่มีน้ำ / ไม่มีสบู่">อุปกรณ์ชำรุด / ไม่มีน้ำ / ไม่มีสบู่</option>
                <option value="ห้องน้ำปิดปรับปรุงชั่วคราว">ห้องน้ำปิดปรับปรุงชั่วคราว</option>
                <option value="ข้อมูลการเข้าถึงไม่ตรงความจริง (ไม่มีทางลาด/ประตูปิดล็อก)">ข้อมูลการเข้าถึงไม่ตรงความจริง (ไม่มีทางลาด/ประตูปิดล็อก)</option>
                <option value="พิกัดบนแผนที่คลาดเคลื่อน">พิกัดบนแผนที่คลาดเคลื่อน</option>
                <option value="มีค่าบริการ แต่ระบุว่าฟรี">มีค่าบริการ แต่ระบุว่าฟรี</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowReportForm(false)}
                  className="px-3 py-1.5 text-slate-600 hover:text-slate-800"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-4 py-1.5 font-bold rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow-2xs"
                >
                  ส่งรายงานปัญหา
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            {/* Favorite toggle */}
            <button
              onClick={() => onToggleFavorite(place.id)}
              className={`p-2.5 rounded-xl border transition-colors ${
                isFavorite 
                  ? 'bg-rose-50 border-rose-200 text-rose-600' 
                  : 'bg-white border-slate-200 text-slate-600 hover:text-rose-600 hover:border-rose-100'
              }`}
              title="บันทึกรายการโปรด"
            >
              <Heart className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>

            {/* Share link */}
            <button
              onClick={handleShare}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-slate-900 transition-colors relative"
              title="แชร์จุดพักนี้"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-md whitespace-nowrap">
                  คัดลอกลิงก์แล้ว!
                </span>
              )}
            </button>

            {/* Report issue */}
            <button
              onClick={() => setShowReportForm(!showReportForm)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-rose-600 transition-colors"
              title="แจ้งข้อมูลผิดหรือชำรุด"
            >
              <Flag className="w-5 h-5" />
            </button>
          </div>

          {/* Open Google Maps Direction CTA */}
          <button
            onClick={openGoogleMaps}
            className="flex-1 max-w-xs flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/30 transition-all active:scale-98"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>{lang === 'th' ? 'นำทางด้วย Google Maps' : 'Open Directions'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
