import { useState, useEffect } from 'react';
import { Navbar, AppTab } from './components/Navbar';
import { RouteRestFinder } from './components/RouteRestFinder';
import { MapRestroomFinder } from './components/MapRestroomFinder';
import { ToiletBottomSheet } from './components/ToiletBottomSheet';
import { AddRestroomModal } from './components/AddRestroomModal';
import { AdminPortal } from './components/AdminPortal';
import { PlaceRow } from './components/PlaceRow';
import { INITIAL_RESTROOMS } from './data/mockRestrooms';
import { RestroomPlace, ReviewItem } from './types';
import { X } from 'lucide-react';
import { useNearbyToilets } from './hooks/useNearbyToilets';
import { isSupabaseConfigured } from './lib/supabase';

const FAVORITES_KEY = 'poopoo:favorites';

export function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('route');
  const lang: 'th' | 'en' = 'th';
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Supabase nationwide hook (loads all rest stops across 77 provinces)
  const { toilets: fetchedToilets, refetch: refetchToilets } = useNearbyToilets({
    lat: userLocation?.lat || 13.7563,
    lng: userLocation?.lng || 100.5018,
    radiusMeters: 1000000,
  });

  const [restrooms, setRestrooms] = useState<RestroomPlace[]>(INITIAL_RESTROOMS);
  const [selectedPlace, setSelectedPlace] = useState<RestroomPlace | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);

  useEffect(() => {
    if (fetchedToilets && fetchedToilets.length > 0) {
      setRestrooms(fetchedToilets);
    }
  }, [fetchedToilets]);

  // Favorites persisted locally
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  const handleToggleFavorite = (id: string) => {
    setFavorites((prev) => {
      if (prev.includes(id)) {
        showToast('ลบออกจากรายการโปรดแล้ว');
        return prev.filter((item) => item !== id);
      }
      showToast('บันทึกในรายการโปรดแล้ว');
      return [...prev, id];
    });
  };

  const handleAddRestroom = (newPlace: RestroomPlace) => {
    setRestrooms((prev) => [newPlace, ...prev]);
    setSelectedPlace(newPlace);
    showToast('เพิ่มห้องน้ำเรียบร้อยแล้ว');
    if (isSupabaseConfigured) refetchToilets();
  };

  const handleAddReview = (placeId: string, review: ReviewItem) => {
    setRestrooms((prev) =>
      prev.map((place) => {
        if (place.id !== placeId) return place;
        const reviews = [review, ...place.reviews];
        const avg = reviews.reduce((acc, r) => acc + r.ratings.cleanliness, 0) / reviews.length;
        return { ...place, reviews, reviewCount: reviews.length, overallRating: Number(avg.toFixed(1)) };
      })
    );
    showToast('ขอบคุณสำหรับรีวิว!');
  };

  const handleRequestUserLocation = () => {
    if (!navigator.geolocation) {
      showToast('อุปกรณ์นี้ไม่รองรับการระบุตำแหน่ง');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => showToast('ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่ง'),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const favoritePlaces = restrooms.filter((r) => favorites.includes(r.id));
  const isMapView = activeTab !== 'admin';

  return (
    <div className="h-[100dvh] flex flex-col bg-white text-slate-800 overflow-hidden">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] fade-up">
          <div className="bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-full shadow-xl whitespace-nowrap">
            {toastMessage}
          </div>
        </div>
      )}

      <Navbar
        activeTab={activeTab}
        setActiveTab={(t) => {
          setSelectedPlace(null);
          setActiveTab(t);
        }}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        favoritesCount={favorites.length}
        onOpenFavorites={() => setIsFavoritesModalOpen(true)}
      />

      <main className={`flex-1 min-h-0 relative ${isMapView ? 'overflow-hidden' : 'overflow-y-auto bg-slate-50'}`}>
        {activeTab === 'route' && (
          <RouteRestFinder
            restrooms={restrooms}
            onSelectRestroom={setSelectedPlace}
            selectedPlace={selectedPlace}
            lang={lang}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestUserLocation}
          />
        )}

        {activeTab === 'map' && (
          <MapRestroomFinder
            restrooms={restrooms}
            selectedPlace={selectedPlace}
            onSelectPlace={setSelectedPlace}
            lang={lang}
            userLocation={userLocation}
            onRequestUserLocation={handleRequestUserLocation}
          />
        )}

        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
            <AdminPortal
              restrooms={restrooms}
              onBackToApp={() => setActiveTab('route')}
              onRefreshData={refetchToilets}
              onPlaceUpdated={(updated) => {
                setRestrooms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                showToast('อัปเดตข้อมูลสำเร็จ');
              }}
              onPlaceDeleted={(id) => {
                setRestrooms((prev) => prev.filter((p) => p.id !== id));
                showToast('ลบเรียบร้อย');
              }}
              onPlaceAdded={(created) => {
                setRestrooms((prev) => [created, ...prev]);
                showToast('เพิ่มห้องน้ำใหม่เรียบร้อย');
              }}
            />
          </div>
        )}
      </main>

      {/* Place detail */}
      <ToiletBottomSheet
        place={selectedPlace}
        onClose={() => setSelectedPlace(null)}
        lang={lang}
        isFavorite={selectedPlace ? favorites.includes(selectedPlace.id) : false}
        onToggleFavorite={handleToggleFavorite}
        onAddReview={handleAddReview}
      />

      <AddRestroomModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRestroom}
        lang={lang}
      />

      {/* Favorites */}
      {isFavoritesModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 fade-in"
          onClick={() => setIsFavoritesModalOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-[28px] sm:rounded-[28px] shadow-2xl max-h-[80dvh] flex flex-col fade-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="text-lg font-semibold text-slate-900">รายการโปรด</h3>
              <button
                type="button"
                onClick={() => setIsFavoritesModalOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100"
                aria-label="ปิด"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto px-2 pb-safe">
              {favoritePlaces.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <p className="text-4xl mb-3">🤍</p>
                  <p className="text-sm text-slate-500">ยังไม่มีรายการโปรด กดหัวใจในหน้ารายละเอียดเพื่อบันทึก</p>
                </div>
              ) : (
                favoritePlaces.map((p) => (
                  <PlaceRow
                    key={p.id}
                    place={p}
                    lang={lang}
                    subtitle={p.province}
                    onClick={() => {
                      setSelectedPlace(p);
                      setIsFavoritesModalOpen(false);
                    }}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
