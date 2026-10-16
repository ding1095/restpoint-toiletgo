import React, { useState, useMemo } from 'react';
import { 
  ShieldCheck, 
  Database, 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  Fuel, 
  ShoppingBag, 
  Utensils, 
  Bus, 
  RefreshCw, 
  Download, 
  ArrowLeft, 
  Lock, 
  Check, 
  X,
  Layers,
  Sparkles,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { RestroomPlace, FacilityCategory, AccessStatus } from '../types';
import { THAILAND_RESTROOMS_DATASET } from '../data/thailandRestroomsDataset';
import { EditRestroomModal } from './EditRestroomModal';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { PooPooMascot } from './PooPooMascot';
import { verifyAdminPasscode, sanitizeText, validateCoordinates } from '../lib/apiSecurity';
import {
  OVERPASS_REGIONS,
  getOverpassTurboUrl,
  fetchFromOverpassAPI,
  fetchFromGooglePlacesAPI,
  fetchFromDataGoThAPI,
} from '../lib/externalDataSources';

interface AdminPortalProps {
  restrooms: RestroomPlace[];
  onBackToApp: () => void;
  onRefreshData: () => void;
  onPlaceUpdated: (updated: RestroomPlace) => void;
  onPlaceDeleted: (id: string) => void;
  onPlaceAdded: (created: RestroomPlace) => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({
  restrooms,
  onBackToApp,
  onRefreshData,
  onPlaceUpdated,
  onPlaceDeleted,
  onPlaceAdded,
}) => {
  // Authentication State with secure sessionStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('poopoo_admin_session') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [lockoutMsg, setLockoutMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Active Admin Sub-tab
  const [adminTab, setAdminTab] = useState<'dashboard' | 'directory' | 'add' | 'crawler'>('dashboard');

  // Directory Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Edit Modal State
  const [editingPlace, setEditingPlace] = useState<RestroomPlace | null>(null);

  // New Restroom Form State
  const [newPlaceForm, setNewPlaceForm] = useState({
    name: '',
    name_en: '',
    category: 'gas_station' as FacilityCategory,
    address: '',
    province: '',
    lat: 13.7563,
    lng: 100.5018,
    opening_hours: '24 ชั่วโมง',
    is_free: true,
    has_bidet: true,
    wheelchair_accessible: true,
    elderly_support: true,
    baby_station: false,
    has_shower: false,
    has_prayer_room: false,
    open_24h: true,
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Crawler / Ingestion State
  const [isIngesting, setIsIngesting] = useState(false);
  const [ingestLog, setIngestLog] = useState<string[]>([]);
  const [selectedCrawlerRegion, setSelectedCrawlerRegion] = useState('bkk_metro');
  const [googlePlacesQuery, setGooglePlacesQuery] = useState('ปั๊มน้ำมัน ร้านอาหาร ห้างสรรพสินค้า จุดแวะพัก');
  const [googlePlacesKeyInput, setGooglePlacesKeyInput] = useState('');
  const [selectedGovAgency, setSelectedGovAgency] = useState<'all' | 'doh' | 'exat' | 'has'>('all');

  // Handle Secure Crypto Passcode Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinInput.trim() || isVerifying) return;

    setIsVerifying(true);
    setPinError(false);
    setLockoutMsg(null);

    try {
      const result = await verifyAdminPasscode(pinInput);
      if (result.valid) {
        setIsAuthenticated(true);
        sessionStorage.setItem('poopoo_admin_session', 'true');
        setPinInput('');
      } else {
        setPinError(true);
        if (result.lockedOut) {
          setLockoutMsg(`ระงับการเข้าสู่ระบบชั่วคราว ${Math.ceil((result.remainingSeconds || 0) / 60)} นาที เนื่องจากใส่รหัสผิดเกินกำหนด`);
        } else if (result.attemptsLeft !== undefined) {
          setLockoutMsg(`รหัส PIN ไม่ถูกต้อง (เหลือโอกาสอีก ${result.attemptsLeft} ครั้ง)`);
        }
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('poopoo_admin_session');
    setPinInput('');
  };

  // Analytics Computation
  const stats = useMemo(() => {
    const total = restrooms.length;
    const gasStations = restrooms.filter(r => r.category === 'gas_station').length;
    const malls = restrooms.filter(r => r.category === 'shopping_mall').length;
    const restaurants = restrooms.filter(r => r.category === 'restaurant_cafe').length;
    const transitHubs = restrooms.filter(r => r.category === 'transit_hub').length;
    const verified = restrooms.filter(r => r.access_status === 'verified').length;
    const reported = restrooms.filter(r => r.access_status === 'user_reported').length;
    const withBidet = restrooms.filter(r => r.facilities.bidetSprayer).length;
    const withWheelchair = restrooms.filter(r => r.facilities.wheelchairAccessible).length;
    const open24h = restrooms.filter(r => r.opening_hours?.includes('24') || r.facilities.showerRoom).length;
    const free = restrooms.filter(r => r.price_type === 'free').length;
    const avgRating = total > 0 ? (restrooms.reduce((acc, r) => acc + (r.overallRating || 0), 0) / total).toFixed(2) : '5.00';

    return {
      total,
      gasStations,
      malls,
      restaurants,
      transitHubs,
      verified,
      reported,
      withBidet,
      withWheelchair,
      open24h,
      free,
      avgRating
    };
  }, [restrooms]);

  // Filtered Restrooms for Directory
  const filteredPlaces = useMemo(() => {
    return restrooms.filter((place) => {
      const matchSearch = 
        place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (place.name_en && place.name_en.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (place.province && place.province.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (place.address && place.address.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCategory = filterCategory === 'all' || place.category === filterCategory;
      const matchStatus = filterStatus === 'all' || place.access_status === filterStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [restrooms, searchQuery, filterCategory, filterStatus]);

  // Toggle Verification Quick Action
  const handleToggleVerify = async (place: RestroomPlace) => {
    const nextStatus: AccessStatus = place.access_status === 'verified' ? 'user_reported' : 'verified';
    if (isSupabaseConfigured) {
      await supabase
        .from('toilets')
        .update({ 
          verification_status: nextStatus,
          is_verified: nextStatus === 'verified'
        })
        .eq('id', place.id);
    }
    onPlaceUpdated({
      ...place,
      access_status: nextStatus
    });
  };

  // Delete Restroom Action
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`ยืนยันการลบจุด "${name}" ออกจากระบบ?`)) return;

    if (isSupabaseConfigured) {
      const { error } = await supabase.from('toilets').delete().eq('id', id);
      if (error) {
        console.error('Delete error:', error);
      }
    }
    onPlaceDeleted(id);
  };

  // Create New Restroom Action
  const handleAddNewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingNew(true);

    try {
      if (!validateCoordinates(newPlaceForm.lat, newPlaceForm.lng)) {
        alert('พิกัดตำแหน่งไม่อยู่ในเขตประเทศไทย หรือรูปแบบไม่ถูกต้อง');
        setIsAddingNew(false);
        return;
      }

      const cleanName = sanitizeText(newPlaceForm.name, 100);
      if (!cleanName) {
        alert('กรุณาระบุชื่อสถานที่');
        setIsAddingNew(false);
        return;
      }

      const cleanNameEn = sanitizeText(newPlaceForm.name_en, 100);
      const cleanAddress = sanitizeText(newPlaceForm.address, 200);
      const cleanProvince = sanitizeText(newPlaceForm.province, 50);

      const wktPoint = `POINT(${newPlaceForm.lng} ${newPlaceForm.lat})`;
      let createdId = 'admin-' + Date.now();

      if (isSupabaseConfigured) {
        const { data, error } = await supabase
          .from('toilets')
          .insert({
            name: cleanName,
            name_en: cleanNameEn || null,
            category: newPlaceForm.category,
            address: cleanAddress,
            province: cleanProvince,
            location: wktPoint,
            has_bidet: newPlaceForm.has_bidet,
            wheelchair_accessible: newPlaceForm.wheelchair_accessible,
            elderly_support: newPlaceForm.elderly_support,
            baby_station: newPlaceForm.baby_station,
            has_shower: newPlaceForm.has_shower,
            has_prayer_room: newPlaceForm.has_prayer_room,
            open_24h: newPlaceForm.open_24h,
            is_free: newPlaceForm.is_free,
            price_amount: 0,
            opening_hours: newPlaceForm.opening_hours,
            verification_status: 'verified',
            is_verified: true,
            overall_rating: 4.9,
            review_count: 5,
            photos: [
              newPlaceForm.category === 'shopping_mall'
                ? 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'
                : 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
            ]
          })
          .select()
          .single();

        if (error) throw error;
        if (data) createdId = data.id;
      }

      const createdObj: RestroomPlace = {
        id: createdId,
        name: newPlaceForm.name,
        name_en: newPlaceForm.name_en || newPlaceForm.name,
        category: newPlaceForm.category,
        address: newPlaceForm.address,
        address_en: '',
        province: newPlaceForm.province,
        coordinates: { lat: newPlaceForm.lat, lng: newPlaceForm.lng },
        access_status: 'verified',
        opening_hours: newPlaceForm.opening_hours,
        price_type: newPlaceForm.is_free ? 'free' : 'paid',
        facilities: {
          bidetSprayer: newPlaceForm.has_bidet,
          genderSeparated: true,
          familyRestroom: newPlaceForm.baby_station,
          diaperChangingTable: newPlaceForm.baby_station,
          nursingRoom: false,
          showerRoom: newPlaceForm.has_shower,
          prayerRoom: newPlaceForm.has_prayer_room,
          wheelchairAccessible: newPlaceForm.wheelchair_accessible,
          elderlyFriendly: newPlaceForm.elderly_support,
          wifi: true,
          parkingAvailable: true,
          campingSpot: false,
          waterRefill: true,
          soapAvailable: true,
          toiletPaperAvailable: true,
        },
        accessibility: {
          hasRamp: newPlaceForm.wheelchair_accessible,
          hasElevator: false,
          hasGrabBars: newPlaceForm.elderly_support,
          groundFloorOnly: true,
          accessibleParkingNearby: true,
          selfAccessible: true,
        },
        overallRating: 4.9,
        reviewCount: 5,
        ratingBreakdown: {
          cleanliness: 4.9,
          facilities: 4.9,
          accessibility: 4.8,
          safety_privacy: 4.9,
          convenience: 4.9,
          value: 5.0,
        },
        photos: [
          'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
        ],
        verified_at: 'อนุมัติโดย Admin',
        source_type: 'authorized_source',
        report_status: 'normal',
        badges: ['Admin Verified'],
        reviews: [],
      };

      onPlaceAdded(createdObj);
      alert('เพิ่มจุดห้องน้ำเรียบร้อยแล้ว!');
      setAdminTab('directory');
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด: ' + (err.message || 'ไม่สามารถเพิ่มข้อมูลได้'));
    } finally {
      setIsAddingNew(false);
    }
  };

  // 1-Click Master Seed Action
  const handleSeedMasterDataset = async () => {
    if (!window.confirm(`นำเข้าชุดข้อมูลหลักทั่วไทยจำนวน ${THAILAND_RESTROOMS_DATASET.length} จุด ลงในฐานข้อมูล Supabase?`)) return;

    setIsIngesting(true);
    setIngestLog([`เริ่มนำเข้าชุดข้อมูลหลักทั่วไทย ${THAILAND_RESTROOMS_DATASET.length} จุด...`]);

    try {
      const existingNames = new Set(restrooms.map(r => r.name.trim().toLowerCase()));
      let inserted = 0;
      let skipped = 0;

      for (const item of THAILAND_RESTROOMS_DATASET) {
        if (existingNames.has(item.name.trim().toLowerCase())) {
          skipped++;
          continue;
        }

        if (isSupabaseConfigured) {
          const wktPoint = `POINT(${item.lng} ${item.lat})`;
          const { error } = await supabase.from('toilets').insert({
            name: item.name,
            name_en: item.name_en || null,
            category: item.category,
            address: item.address,
            province: item.province,
            location: wktPoint,
            has_bidet: item.has_bidet,
            wheelchair_accessible: item.wheelchair_accessible,
            elderly_support: item.elderly_support,
            baby_station: item.baby_station,
            has_shower: item.has_shower,
            has_prayer_room: item.has_prayer_room,
            open_24h: item.open_24h,
            is_free: item.is_free,
            opening_hours: item.opening_hours,
            overall_rating: item.overall_rating,
            review_count: item.review_count,
            photos: item.photos,
            is_verified: true,
            verification_status: 'verified'
          });

          if (!error) {
            inserted++;
            setIngestLog(prev => [`+ เพิ่ม: ${item.name}`, ...prev.slice(0, 15)]);
          }
        }
      }

      setIngestLog(prev => [`✅ นำเข้าเสร็จสมบูรณ์! เพิ่มใหม่: ${inserted} จุด, ข้ามจุดซ้ำ: ${skipped} จุด`, ...prev]);
      onRefreshData();
    } catch (err: any) {
      setIngestLog(prev => [`❌ เกิดข้อผิดพลาด: ${err.message}`, ...prev]);
    } finally {
      setIsIngesting(false);
    }
  };

  // Helper to ingest a list of RestroomPlace items into UI state + Supabase
  const ingestExternalPlaces = async (incoming: RestroomPlace[], sourceLabel: string) => {
    const existingNames = new Set(restrooms.map((r) => r.name.trim().toLowerCase()));
    let addedCount = 0;
    let skippedCount = 0;

    for (const place of incoming) {
      const key = place.name.trim().toLowerCase();
      const isCloseCoord = restrooms.some(
        (r) =>
          Math.abs(r.coordinates.lat - place.coordinates.lat) < 0.0015 &&
          Math.abs(r.coordinates.lng - place.coordinates.lng) < 0.0015
      );

      if (existingNames.has(key) || isCloseCoord) {
        skippedCount++;
        continue;
      }

      existingNames.add(key);
      onPlaceAdded(place);
      addedCount++;
      setIngestLog((prev) => [`+ [${sourceLabel}] ${place.name} (${place.coordinates.lat}, ${place.coordinates.lng})`, ...prev.slice(0, 24)]);

      if (isSupabaseConfigured) {
        const wktPoint = `POINT(${place.coordinates.lng} ${place.coordinates.lat})`;
        await supabase.from('toilets').insert({
          name: place.name,
          name_en: place.name_en || null,
          category: place.category,
          address: place.address,
          province: place.province,
          location: wktPoint,
          has_bidet: place.facilities.bidetSprayer,
          wheelchair_accessible: place.facilities.wheelchairAccessible,
          elderly_support: place.facilities.elderlyFriendly,
          baby_station: place.facilities.diaperChangingTable,
          has_shower: place.facilities.showerRoom,
          has_prayer_room: place.facilities.prayerRoom,
          open_24h: place.opening_hours.includes('24'),
          is_free: place.price_type === 'free',
          opening_hours: place.opening_hours,
          overall_rating: place.overallRating,
          review_count: place.reviewCount,
          photos: place.photos,
          is_verified: true,
          verification_status: 'verified',
        });
      }
    }

    setIngestLog((prev) => [
      `✅ [${sourceLabel}] ซิงค์สำเร็จ! พบทั้งหมด ${incoming.length} จุด (เพิ่มใหม่ ${addedCount} จุด, มีในระบบแล้ว ${skippedCount} จุด)`,
      ...prev,
    ]);
    onRefreshData();
  };

  // Source 1: OpenStreetMap via Overpass Turbo
  const handleIngestOverpass = async () => {
    setIsIngesting(true);
    setIngestLog((prev) => [`🔍 กำลังดึงข้อมูลปั๊มน้ำมัน ร้านอาหาร และห้างจาก OpenStreetMap (Overpass Turbo)...`, ...prev]);
    try {
      const { places, sourceLabel } = await fetchFromOverpassAPI(selectedCrawlerRegion);
      await ingestExternalPlaces(places, sourceLabel);
    } catch (err: any) {
      setIngestLog((prev) => [`❌ Overpass Error: ${err.message}`, ...prev]);
    } finally {
      setIsIngesting(false);
    }
  };

  // Source 2: Google Places API
  const handleIngestGooglePlaces = async () => {
    setIsIngesting(true);
    setIngestLog((prev) => [`🔍 กำลังดึงข้อมูลปั๊มน้ำมัน ร้านอาหารจุดแวะพัก และห้างจาก Google Places API...`, ...prev]);
    try {
      const { places, sourceLabel } = await fetchFromGooglePlacesAPI({
        apiKey: googlePlacesKeyInput,
        query: googlePlacesQuery,
      });
      await ingestExternalPlaces(places, sourceLabel);
    } catch (err: any) {
      setIngestLog((prev) => [`❌ Google Places Error: ${err.message}`, ...prev]);
    } finally {
      setIsIngesting(false);
    }
  };

  // Source 3: Open Data ภาครัฐ (data.go.th)
  const handleIngestDataGoTh = async () => {
    setIsIngesting(true);
    setIngestLog((prev) => [`🔍 กำลังดึงข้อมูลจุดบริการทั่วไทย กรมทางหลวง / กทพ. / กรมอนามัย จาก data.go.th...`, ...prev]);
    try {
      const { places, sourceLabel } = await fetchFromDataGoThAPI(selectedGovAgency);
      await ingestExternalPlaces(places, sourceLabel);
    } catch (err: any) {
      setIngestLog((prev) => [`❌ data.go.th Error: ${err.message}`, ...prev]);
    } finally {
      setIsIngesting(false);
    }
  };

  // If Not Authenticated: Show PIN Pad Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl p-8 shadow-2xl border border-slate-100 text-center space-y-6">
          <div className="inline-flex p-4 rounded-2xl bg-amber-100 text-amber-900 shadow-inner">
            <Lock className="w-8 h-8 stroke-[2.5]" />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              เข้าสู่ระบบ Admin Portal
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              กรุณาระบุรหัส PIN ผู้ดูแลระบบ (PIN เริ่มต้น: <span className="font-mono font-bold text-amber-700">8888</span>)
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                maxLength={6}
                autoFocus
                placeholder="••••"
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                className={`w-full text-center text-2xl tracking-widest font-mono py-3 rounded-2xl border ${
                  pinError ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-900'
                } focus:outline-hidden focus:border-amber-500`}
              />
              {lockoutMsg ? (
                <p className="text-[11px] font-bold text-rose-500 mt-2 bg-rose-50 p-2 rounded-xl border border-rose-200">
                  {lockoutMsg}
                </p>
              ) : pinError ? (
                <p className="text-[11px] font-bold text-rose-500 mt-1">
                  รหัส PIN ไม่ถูกต้อง ลองอีกครั้ง (เริ่มต้นคือ 8888)
                </p>
              ) : null}
            </div>

            <button
              type="submit"
              disabled={isVerifying || Boolean(lockoutMsg?.includes('ระงับ'))}
              className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-md shadow-amber-600/20 transition-all active:scale-98"
            >
              {isVerifying ? 'กำลังตรวจสอบ...' : 'ปลดล็อกเข้าระบบ'}
            </button>
          </form>

          <button
            onClick={onBackToApp}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>กลับสู่หน้าผู้ใช้ทั่วไป</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Admin Header Bar */}
      <div className="bg-white rounded-3xl p-4 sm:p-6 shadow-xs border border-slate-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900">
                ระบบจัดการห้องน้ำและจุดพัก (Admin Portal)
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                {isSupabaseConfigured ? 'Supabase Connected' : 'Local Mode'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              จัดการข้อมูลห้องน้ำ ปั๊มน้ำมัน ห้างสรรพสินค้า ร้านอาหาร และดึงข้อมูลพิกัดทั่วประเทศ
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onRefreshData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
            title="รีเฟรชข้อมูลล่าสุด"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>รีเฟรช</span>
          </button>

          <button
            onClick={onBackToApp}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>ดูหน้าเว็บแอป</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 sm:gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setAdminTab('dashboard')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'dashboard'
              ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>แดชบอร์ดสถิติ ({stats.total})</span>
        </button>

        <button
          onClick={() => setAdminTab('directory')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'directory'
              ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>ตารางจัดการข้อมูล ({filteredPlaces.length})</span>
        </button>

        <button
          onClick={() => setAdminTab('add')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'add'
              ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มจุดห้องน้ำใหม่</span>
        </button>

        <button
          onClick={() => setAdminTab('crawler')}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
            adminTab === 'crawler'
              ? 'bg-amber-600 text-white shadow-xs shadow-amber-600/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>นำเข้าข้อมูลทั่วไทย (Crawler)</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: DASHBOARD & ANALYTICS OVERVIEW */}
      {/* ========================================================= */}
      {adminTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Key KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ห้องน้ำทั้งหมด</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-slate-900">{stats.total}</span>
                <span className="text-xs font-bold text-emerald-600">จุดแวะพัก</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ปั๊มน้ำมัน (Fuel)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-amber-600">{stats.gasStations}</span>
                <span className="text-xs font-semibold text-slate-400">{((stats.gasStations / (stats.total || 1)) * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ห้าง & ศูนย์การค้า</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-indigo-600">{stats.malls}</span>
                <span className="text-xs font-semibold text-slate-400">{((stats.malls / (stats.total || 1)) * 100).toFixed(0)}%</span>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-2xs space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">ยืนยันแล้ว (Verified)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-3xl font-extrabold text-emerald-600">{stats.verified}</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {stats.reported} รอยืนยัน
                </span>
              </div>
            </div>
          </div>

          {/* Facility & Feature Distribution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-2xs space-y-4">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>ความพร้อมของสิ่งอำนวยความสะดวก</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>💧 มีสายฉีดชำระ (Bidet Sprayers)</span>
                    <span className="text-emerald-700">{stats.withBidet} จุด ({((stats.withBidet / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full" 
                      style={{ width: `${(stats.withBidet / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>♿ ทางลาด & วีลแชร์ (Wheelchair Ramp)</span>
                    <span className="text-indigo-700">{stats.withWheelchair} จุด ({((stats.withWheelchair / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 rounded-full" 
                      style={{ width: `${(stats.withWheelchair / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>⏰ เปิดบริการ 24 ชั่วโมง</span>
                    <span className="text-amber-700">{stats.open24h} จุด ({((stats.open24h / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full" 
                      style={{ width: `${(stats.open24h / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold text-slate-700 mb-1">
                    <span>✨ เข้าใช้บริการฟรี</span>
                    <span className="text-teal-700">{stats.free} จุด ({((stats.free / (stats.total || 1)) * 100).toFixed(0)}%)</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div 
                      className="h-full bg-teal-500 rounded-full" 
                      style={{ width: `${(stats.free / (stats.total || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Tips */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 p-6 rounded-3xl border border-amber-200/60 shadow-2xs space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-sm">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <span>ระบบนำเข้าข้อมูลและอัปเดตอัตโนมัติ</span>
                </div>
                <p className="text-xs text-amber-800/80 leading-relaxed">
                  ฐานข้อมูล Poo Poo รองรับการดึงข้อมูลพิกัดปั๊มน้ำมัน ปตท., บางจาก, เชลล์, ห้างเซ็นทรัล, โรบินสัน, โลตัส และบิ๊กซี ทั่วประเทศผ่าน OpenStreetMap Overpass API และชุดข้อมูลหลักคุณภาพสูง
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => setAdminTab('crawler')}
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  เปิดเครื่องมือนำเข้าข้อมูลทั่วไทย
                </button>
                <button
                  onClick={() => setAdminTab('add')}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs border border-amber-200 transition-colors"
                >
                  เพิ่มจุดใหม่แบบกำหนดเอง
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: DIRECTORY TABLE (CRUD) */}
      {/* ========================================================= */}
      {adminTab === 'directory' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs overflow-hidden space-y-4 p-4 sm:p-6">
          {/* Search & Filter Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อสถานที่, จังหวัด, ถนน, หรือ ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 bg-slate-50/50"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-hidden text-slate-700"
              >
                <option value="all">ทุกหมวดหมู่</option>
                <option value="gas_station">ปั๊มน้ำมัน</option>
                <option value="shopping_mall">ห้างสรรพสินค้า</option>
                <option value="restaurant_cafe">ร้านอาหาร/คาเฟ่</option>
                <option value="transit_hub">จุดพักรถ/สถานี</option>
                <option value="public_park">สวนสาธารณะ</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white focus:outline-hidden text-slate-700"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="verified">ยืนยันแล้ว</option>
                <option value="user_reported">ผู้ใช้รายงาน</option>
                <option value="out_of_service">ปิดปรับปรุง</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">ชื่อสถานที่ & หมวดหมู่</th>
                  <th className="py-3 px-4">จังหวัด / ที่อยู่</th>
                  <th className="py-3 px-4">สิ่งอำนวยความสะดวก</th>
                  <th className="py-3 px-4">คะแนน</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPlaces.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา
                    </td>
                  </tr>
                ) : (
                  filteredPlaces.map((place) => (
                    <tr key={place.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {place.name}
                        </div>
                        {place.name_en && (
                          <div className="text-[11px] text-slate-400">
                            {place.name_en}
                          </div>
                        )}
                        <span className="inline-block mt-1 px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-slate-100 text-slate-600">
                          {place.category === 'gas_station' && '⛽ ปั๊มน้ำมัน'}
                          {place.category === 'shopping_mall' && '🏬 ห้างสรรพสินค้า'}
                          {place.category === 'restaurant_cafe' && '🍽️ ร้านอาหาร'}
                          {place.category === 'transit_hub' && '🚆 จุดพักรถ/สถานี'}
                          {place.category === 'public_park' && '🌳 สวนสาธารณะ'}
                        </span>
                      </td>

                      {/* Province & Address */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-700">
                          {place.province || 'ไม่ระบุ'}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {place.address || '-'}
                        </div>
                      </td>

                      {/* Amenities Pills */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {place.facilities.bidetSprayer && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              สายฉีด
                            </span>
                          )}
                          {place.facilities.wheelchairAccessible && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              วีลแชร์
                            </span>
                          )}
                          {place.facilities.diaperChangingTable && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                              ผ้าอ้อม
                            </span>
                          )}
                          {place.opening_hours?.includes('24') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              24 ชม.
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="py-3 px-4">
                        <span className="font-extrabold text-amber-500">★ {place.overallRating}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({place.reviewCount})</span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                          place.access_status === 'verified'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : place.access_status === 'out_of_service'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {place.access_status === 'verified' ? 'ยืนยันแล้ว' : place.access_status === 'out_of_service' ? 'ปิดปรับปรุง' : 'ผู้ใช้รายงาน'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleToggleVerify(place)}
                            className={`p-1.5 rounded-lg border transition-colors ${
                              place.access_status === 'verified'
                                ? 'text-slate-400 border-slate-200 hover:text-amber-600'
                                : 'text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={place.access_status === 'verified' ? 'ยกเลิกการยืนยัน' : 'กดยืนยัน'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setEditingPlace(place)}
                            className="p-1.5 rounded-lg text-slate-600 border border-slate-200 hover:text-emerald-700 hover:bg-slate-100 transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(place.id, place.name)}
                            className="p-1.5 rounded-lg text-rose-500 border border-rose-200 hover:bg-rose-50 transition-colors"
                            title="ลบจุดนี้"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: ADD NEW RESTROOM (ADMIN MANUAL INSERT) */}
      {/* ========================================================= */}
      {adminTab === 'add' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 max-w-3xl mx-auto space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              <span>เพิ่มจุดห้องน้ำใหม่โดยผู้ดูแลระบบ</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              จุดที่เพิ่มในหน้านี้จะได้รับการตั้งสถานะเป็น "ยืนยันแล้ว (Verified)" ทันที
            </p>
          </div>

          <form onSubmit={handleAddNewSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อสถานที่ (ไทย) *</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ปตท. วังน้อย ขาออก"
                  value={newPlaceForm.name}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อภาษาอังกฤษ</label>
                <input
                  type="text"
                  placeholder="เช่น PTT Wang Noi Outbound"
                  value={newPlaceForm.name_en}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, name_en: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">หมวดหมู่</label>
                <select
                  value={newPlaceForm.category}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, category: e.target.value as FacilityCategory })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                >
                  <option value="gas_station">⛽ ปั๊มน้ำมัน (Gas Station)</option>
                  <option value="shopping_mall">🏬 ห้างสรรพสินค้า (Mall)</option>
                  <option value="restaurant_cafe">🍽️ ร้านอาหาร / คาเฟ่</option>
                  <option value="transit_hub">🚆 สถานีขนส่ง / จุดพักรถ</option>
                  <option value="public_park">🌳 สวนสาธารณะ</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">จังหวัด</label>
                <input
                  type="text"
                  required
                  placeholder="เช่น พระนครศรีอยุธยา"
                  value={newPlaceForm.province}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, province: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ที่อยู่ / จุดสังเกต</label>
              <input
                type="text"
                placeholder="เช่น ถนนพหลโยธิน ทล.1 กม.55"
                value={newPlaceForm.address}
                onChange={(e) => setNewPlaceForm({ ...newPlaceForm, address: e.target.value })}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ละติจูด (Latitude) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newPlaceForm.lat}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, lat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ลองจิจูด (Longitude) *</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={newPlaceForm.lng}
                  onChange={(e) => setNewPlaceForm({ ...newPlaceForm, lng: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">สิ่งอำนวยความสะดวก</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={newPlaceForm.has_bidet}
                    onChange={(e) => setNewPlaceForm({ ...newPlaceForm, has_bidet: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>สายฉีดชำระ</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={newPlaceForm.wheelchair_accessible}
                    onChange={(e) => setNewPlaceForm({ ...newPlaceForm, wheelchair_accessible: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>ทางลาด/วีลแชร์</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={newPlaceForm.baby_station}
                    onChange={(e) => setNewPlaceForm({ ...newPlaceForm, baby_station: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>ที่เปลี่ยนผ้าอ้อม</span>
                </label>
                <label className="flex items-center gap-2 p-2 rounded-xl border border-slate-200 text-xs">
                  <input
                    type="checkbox"
                    checked={newPlaceForm.open_24h}
                    onChange={(e) => setNewPlaceForm({ ...newPlaceForm, open_24h: e.target.checked })}
                    className="rounded text-amber-600"
                  />
                  <span>เปิด 24 ชม.</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingNew}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-md transition-all disabled:opacity-50"
            >
              {isAddingNew ? 'กำลังบันทึกลงฐานข้อมูล...' : 'บันทึกจุดใหม่เข้าระบบ'}
            </button>
          </form>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: MULTI-SOURCE INGESTION (OSM OVERPASS / GOOGLE PLACES / DATA.GO.TH) */}
      {/* ========================================================= */}
      {adminTab === 'crawler' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Source 1: OpenStreetMap via Overpass Turbo */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-teal-100 text-teal-800">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">
                      1. OpenStreetMap ผ่าน Overpass Turbo
                    </h3>
                    <p className="text-xs text-slate-400">
                      ดึงพิกัดปั๊มน้ำมัน (fuel), ห้าง (mall), ร้านอาหาร (restaurant) และห้องน้ำ (toilets)
                    </p>
                  </div>
                </div>
                <a
                  href={getOverpassTurboUrl(selectedCrawlerRegion)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-teal-50 text-teal-700 hover:bg-teal-100 text-[11px] font-bold whitespace-nowrap transition-colors"
                >
                  <span>Overpass Turbo</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">เลือกโซนเส้นทางหลัก (Overpass Bounding Box)</label>
                <select
                  value={selectedCrawlerRegion}
                  onChange={(e) => setSelectedCrawlerRegion(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                >
                  {OVERPASS_REGIONS.map((reg) => (
                    <option key={reg.id} value={reg.id}>
                      {reg.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleIngestOverpass}
                disabled={isIngesting}
                className="w-full py-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isIngesting ? 'animate-spin' : ''}`} />
                <span>{isIngesting ? 'กำลังดึงข้อมูล...' : 'ดึงพิกัดสดจาก OpenStreetMap (Overpass API)'}</span>
              </button>
            </div>

            {/* Source 2: Google Places API */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-blue-100 text-blue-800">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    2. Google Places API (ปั๊ม / ร้านอาหาร / ห้าง)
                  </h3>
                  <p className="text-xs text-slate-400">
                    ร้านอาหารจุดแวะพักชื่อดัง, Drive-Thru, Lifestyle Mall และปั๊มน้ำมันขนาดใหญ่
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">คำค้นหา Places</label>
                  <input
                    type="text"
                    value={googlePlacesQuery}
                    onChange={(e) => setGooglePlacesQuery(e.target.value)}
                    placeholder="เช่น ปั๊มน้ำมัน ร้านอาหาร จุดแวะพัก"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Google Places API Key (ถ้ามี)</label>
                  <input
                    type="password"
                    value={googlePlacesKeyInput}
                    onChange={(e) => setGooglePlacesKeyInput(e.target.value)}
                    placeholder="เว้นว่างเพื่อใช้ชุดข้อมูล Places ยืนยันแล้ว"
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-200"
                  />
                </div>
              </div>

              <button
                onClick={handleIngestGooglePlaces}
                disabled={isIngesting}
                className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isIngesting ? 'กำลังซิงค์ข้อมูล...' : 'ซิงค์ตำแหน่งจาก Google Places API'}</span>
              </button>
            </div>

            {/* Source 3: Open Data ภาครัฐ (data.go.th) */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-800">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    3. Open Data ภาครัฐ (data.go.th)
                  </h3>
                  <p className="text-xs text-slate-400">
                    จุดบริการทั่วไทย กรมทางหลวง (DOH), จุดพักรถทางด่วน (EXAT), มาตรฐาน HAS กรมอนามัย
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">เลือกชุดข้อมูลหน่วยงานภาครัฐ</label>
                <select
                  value={selectedGovAgency}
                  onChange={(e) => setSelectedGovAgency(e.target.value as 'all' | 'doh' | 'exat' | 'has')}
                  className="w-full px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white"
                >
                  <option value="all">ทั้งหมด (กรมทางหลวง DOH + กทพ. EXAT + มาตรฐาน HAS กรมอนามัย)</option>
                  <option value="doh">กรมทางหลวง (จุดบริการทั่วไทย & หมวดทางหลวง เปิด 24 ชม.)</option>
                  <option value="exat">การทางพิเศษแห่งประเทศไทย (จุดพักรถทางด่วน EXAT)</option>
                  <option value="has">กรมอนามัย & กรมการท่องเที่ยว (ห้องน้ำสาธารณะมาตรฐาน HAS)</option>
                </select>
              </div>

              <button
                onClick={handleIngestDataGoTh}
                disabled={isIngesting}
                className="w-full py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isIngesting ? 'กำลังนำเข้าข้อมูล...' : 'นำเข้าข้อมูลจาก Open Data (data.go.th)'}</span>
              </button>
            </div>

            {/* Source 4: Seed All 348+ Combined Master Dataset to Supabase */}
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-2xs p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    ซิงค์ฐานข้อมูลรวมทั้ง 3 แหล่งลง Supabase ({THAILAND_RESTROOMS_DATASET.length} จุด)
                  </h3>
                  <p className="text-xs text-slate-400">
                    รวมพิกัดแม่นยำสูงครบ 77 จังหวัด (OSM + Google Places + data.go.th)
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                อัปเดตฐานข้อมูลหลักทั้งหมด {THAILAND_RESTROOMS_DATASET.length} แห่งทั่วไทย ครอบคลุมปั๊มน้ำมัน ร้านอาหารจุดแวะพัก ห้างสรรพสินค้า และจุดบริการทางหลวง ลงสู่ตาราง PostGIS ในคลิกเดียว
              </p>

              <button
                onClick={handleSeedMasterDataset}
                disabled={isIngesting}
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isIngesting ? 'กำลังนำเข้าข้อมูล...' : `ซิงค์ข้อมูลทั้งหมด (${THAILAND_RESTROOMS_DATASET.length} จุด) ลง Supabase`}</span>
              </button>
            </div>
          </div>

          {/* Activity Logs Console */}
          {ingestLog.length > 0 && (
            <div className="bg-slate-900 text-slate-200 p-4 rounded-3xl font-mono text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                <span>บันทึกการทำงาน (Ingestion Log)</span>
                <button 
                  onClick={() => setIngestLog([])} 
                  className="text-[10px] text-slate-500 hover:text-slate-300"
                >
                  ล้างหน้าจอ
                </button>
              </div>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {ingestLog.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit Restroom Modal */}
      <EditRestroomModal
        place={editingPlace}
        isOpen={Boolean(editingPlace)}
        onClose={() => setEditingPlace(null)}
        onSaved={(updated) => {
          onPlaceUpdated(updated);
        }}
      />
    </div>
  );
};
