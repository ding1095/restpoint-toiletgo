import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { RouteRestFinder } from './components/RouteRestFinder';
import { MapRestroomFinder } from './components/MapRestroomFinder';
import { ToiletBottomSheet } from './components/ToiletBottomSheet';
import { AddRestroomModal } from './components/AddRestroomModal';
import { Footer } from './components/Footer';
import { INITIAL_RESTROOMS } from './data/mockRestrooms';
import { RestroomPlace, ReviewItem } from './types';
import { Heart, X, Check, Database } from 'lucide-react';
import { PooPooMascot } from './components/PooPooMascot';
import { useNearbyToilets } from './hooks/useNearbyToilets';
import { isSupabaseConfigured } from './lib/supabase';

export function App() {
  const [activeTab, setActiveTab] = useState<'route' | 'map'>('route');
  const [lang, setLang] = useState<'th' | 'en'>('th');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Supabase PostGIS Hook
  const { toilets: fetchedToilets, loading: isLoadingToilets, refetch: refetchToilets } = useNearbyToilets({
    lat: userLocation?.lat || 13.7563,
    lng: userLocation?.lng || 100.5018,
    radiusMeters: 60000,
  });

  const [restrooms, setRestrooms] = useState<RestroomPlace[]>(INITIAL_RESTROOMS);
  const [selectedPlace, setSelectedPlace] = useState<RestroomPlace | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  // Sync fetched database records whenever available
  useEffect(() => {
    if (fetchedToilets && fetchedToilets.length > 0) {
      setRestrooms(fetchedToilets);
    }
  }, [fetchedToilets]);
  
  // Favorites stored in state
  const [favorites, setFavorites] = useState<string[]>(['rest-001', 'rest-002']);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(id);
      if (exists) {
        showToast('ลบออกจากรายการโปรดแล้ว');
        return prev.filter((item) => item !== id);
      } else {
        showToast('บันทึกในรายการโปรดเรียบร้อย');
        return [...prev, id];
      }
    });
  };

  const handleAddRestroom = (newPlace: RestroomPlace) => {
    setRestrooms((prev) => [newPlace, ...prev]);
    setSelectedPlace(newPlace);
    showToast('เพิ่มจุดห้องน้ำเรียบร้อยแล้ว!');
    if (isSupabaseConfigured) {
      refetchToilets();
    }
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
    showToast('ขอบคุณสำหรับรีวิวของคุณ!');
  };

  const handleReportIssue = (placeId: string, reason: string) => {
    setRestrooms((prev) =>
      prev.map((p) => (p.id === placeId ? { ...p, report_status: 'reported_issue' } : p))
    );
    showToast(`ส่งรายงานปัญหาเรียบร้อย`);
  };

  const handleRequestUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          showToast('ระบุพิกัดตำแหน่งของคุณแล้ว');
        },
        () => {
          setUserLocation({ lat: 13.7563, lng: 100.5018 });
          showToast('ใช้พิกัดกรุงเทพฯ เป็นค่าเริ่มต้น');
        }
      );
    } else {
      setUserLocation({ lat: 13.7563, lng: 100.5018 });
    }
  };

  const favoritePlaces = restrooms.filter((r) => favorites.includes(r.id));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800 font-sans">
      
      {/* Toast Notification with Mascot */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs sm:text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150 border border-slate-700">
          <PooPooMascot size={24} mood="relieved" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Clean Navbar */}
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4">
        
        {/* Tab 1: Route Rest Finder (Start -> Destination -> Scan Restrooms) */}
        {activeTab === 'route' && (
          <RouteRestFinder
            restrooms={restrooms}
            onSelectRestroom={(p) => setSelectedPlace(p)}
            selectedPlace={selectedPlace}
            lang={lang}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestUserLocation}
          />
        )}

        {/* Tab 2: Free Exploration & Interactive Map */}
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

      </main>

      {/* Toilet Bottom Sheet (Mobile-First Detail Modal) */}
      <ToiletBottomSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        lang={lang}
        isFavorite={selectedPlace ? favorites.includes(selectedPlace.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onAddReview={handleAddReview}
      />

      {/* Add Restroom Modal */}
      <AddRestroomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRestroom}
        lang={lang}
      />

      {/* Favorites Modal */}
      {isFavoritesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div 
            className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 space-y-3.5 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                <span>จุดพักในรายการโปรด ({favoritePlaces.length})</span>
              </h3>
              <button 
                onClick={() => setIsFavoritesModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {favoritePlaces.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  ยังไม่มีจุดพักในรายการโปรด กดไอคอนหัวใจที่จุดพักเพื่อบันทึกไว้ดูได้ทันที
                </div>
              ) : (
                favoritePlaces.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPlace(p);
                      setIsFavoritesModalOpen(false);
                    }}
                    className="p-3 rounded-2xl border border-slate-200/80 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs sm:text-sm">{p.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{p.address}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span className="text-amber-500 font-bold">★ {p.overallRating}</span>
                        <span>•</span>
                        <span>{p.opening_hours}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleFavorite(p.id);
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700"
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
