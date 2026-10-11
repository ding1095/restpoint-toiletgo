import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { MapRestroomFinder } from './components/MapRestroomFinder';
import { RoutePlannerModal } from './components/RoutePlannerModal';
import { ProposalViewer } from './components/ProposalViewer';
import { ArchitectureKpiDashboard } from './components/ArchitectureKpiDashboard';
import { RestroomDetailModal } from './components/RestroomDetailModal';
import { AddRestroomModal } from './components/AddRestroomModal';
import { Footer } from './components/Footer';
import { INITIAL_RESTROOMS } from './data/mockRestrooms';
import { RestroomPlace, ReviewItem } from './types';
import { ShieldCheck, Sparkles, MapPin, Navigation, Heart, X, Check } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'route' | 'proposal' | 'architecture'>('map');
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [restrooms, setRestrooms] = useState<RestroomPlace[]>(INITIAL_RESTROOMS);
  const [selectedPlace, setSelectedPlace] = useState<RestroomPlace | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  // Favorites stored in state
  const [favorites, setFavorites] = useState<string[]>(['rest-001', 'rest-002']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('ลบออกจากรายการโปรดแล้ว');
        return prev.filter((item) => item !== id);
      } else {
        showToast('เพิ่มในรายการโปรดเรียบร้อย');
        return [...prev, id];
      }
    });
  };

  const handleAddRestroom = (newPlace: RestroomPlace) => {
    setRestrooms((prev) => [newPlace, ...prev]);
    setSelectedPlace(newPlace);
    showToast('เพิ่มจุดห้องน้ำใหม่เรียบร้อยแล้ว!');
  };

  const handleAddReview = (placeId: string, review: ReviewItem) => {
    setRestrooms((prev) =>
      prev.map((place) => {
        if (place.id === placeId) {
          const updatedReviews = [review, ...place.reviews];
          const updatedReviewCount = updatedReviews.length;
          const avgClean = updatedReviews.reduce((acc, r) => acc + r.ratings.cleanliness, 0) / updatedReviewCount;
          return {
            ...place,
            reviews: updatedReviews,
            reviewCount: updatedReviewCount,
            overallRating: Number(avgClean.toFixed(1)),
          };
        }
        return place;
      })
    );
    showToast('ขอบคุณสำหรับความคิดเห็นและการมีส่วนร่วม!');
  };

  const handleReportIssue = (placeId: string, reason: string) => {
    setRestrooms((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, report_status: 'reported_issue' } : p))
    );
    showToast(`ได้รับรายงาน "${reason}" แล้ว ทีมงานจะตรวจสอบอย่างเร่งด่วน`);
  };

  const handleRequestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          showToast('ระบุพิกัดตำแหน่งของคุณเรียบร้อย');
        },
        (err) => {
          // Default to central Bangkok if permission denied
          setUserLocation({ lat: 13.7563, lng: 100.5018 });
          showToast('ใช้พิกัดใจกลางกรุงเทพฯ เป็นค่าเริ่มต้น');
        }
      );
    } else {
      setUserLocation({ lat: 13.7563, lng: 100.5018 });
    }
  };

  const favoritePlaces = restrooms.filter((r) => favorites.includes(r.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lang={lang}
        setLang={setLang}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        
        {/* Top Highlight Banner */}
        {activeTab === 'map' && (
          <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 sm:p-7 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold backdrop-blur-xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>RESTPOINT / ToiletGo • โครงการนวัตกรรมดิจิทัล</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                {lang === 'th' ? 'ค้นหาจุดแวะพักและห้องน้ำที่ตอบโจทย์คุณจริง' : 'Find Restrooms That Truly Match Your Needs'}
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                ตอบคำถามสำคัญ: <strong className="text-white">"ห้องน้ำนี้เหมาะกับฉันหรือไม่"</strong> มีสายฉีดชำระ โต๊ะเปลี่ยนผ้าอ้อม ทางลาดสำหรับรถเข็น หรือราวจับสำหรับผู้สูงอายุ ตรวจสอบความสะอาดจริงก่อนแวะ
              </p>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('route')}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-white text-emerald-800 hover:bg-emerald-50 text-xs sm:text-sm font-bold shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Navigation className="w-4 h-4 text-emerald-700" />
                <span>วางแผนจุดพักบนเส้นทาง</span>
              </button>

              <button
                onClick={() => setActiveTab('proposal')}
                className="flex-1 md:flex-initial px-4 py-2.5 rounded-2xl bg-emerald-800/80 hover:bg-emerald-900 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 border border-emerald-500/50"
              >
                <span>อ่านข้อเสนอ 21 บท</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 1: Finder & Interactive Map */}
        {activeTab === 'map' && (
          <MapRestroomFinder
            restrooms={restrooms}
            selectedPlace={selectedPlace}
            onSelectPlace={(p) => setSelectedPlace(p)}
            lang={lang}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestUserLocation}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {/* Tab 2: Route Rest Planner */}
        {activeTab === 'route' && (
          <RoutePlannerModal
            lang={lang}
            onSelectRestroom={(p) => {
              setSelectedPlace(p);
            }}
          />
        )}

        {/* Tab 3: Complete 21-Chapter Proposal Viewer */}
        {activeTab === 'proposal' && (
          <ProposalViewer lang={lang} />
        )}

        {/* Tab 4: Architecture & KPIs */}
        {activeTab === 'architecture' && (
          <ArchitectureKpiDashboard />
        )}

      </main>

      {/* Restroom Detail Drawer / Modal */}
      <RestroomDetailModal
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        lang={lang}
        isFavorite={selectedPlace ? favorites.includes(selectedPlace.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onAddReview={handleAddReview}
        onReportIssue={handleReportIssue}
      />

      {/* Add Restroom Modal (Appendix A Crowdsourcing) */}
      <AddRestroomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRestroom}
        lang={lang}
      />

      {/* Favorites Modal */}
      {isFavoritesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div 
            className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>จุดพักในรายการโปรด ({favoritePlaces.length})</span>
              </h3>
              <button 
                onClick={() => setIsFavoritesModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1">
              {favoritePlaces.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-sm">
                  ยังไม่มีจุดพักในรายการโปรด สามารถกดไอคอนหัวใจที่จุดพักเพื่อบันทึกไว้ดูออฟไลน์ได้ครับ
                </div>
              ) : (
                favoritePlaces.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlace(p);
                      setIsFavoritesModalOpen(false);
                    }}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/30 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{p.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{p.address}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-600 mt-1">
                        <span>★ {p.overallRating}</span>
                        <span>•</span>
                        <span>{p.opening_hours}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(p.id);
                      }}
                      className="p-2 text-rose-500 hover:text-rose-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <Footer lang={lang} />

    </div>
  );
}

export default App;
