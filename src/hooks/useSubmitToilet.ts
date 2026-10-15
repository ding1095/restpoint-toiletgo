import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RestroomPlace } from '../types';
import { 
  sanitizeText, 
  sanitizeUrl, 
  validateCoordinates, 
  toiletRateLimiter 
} from '../lib/apiSecurity';

export interface SubmitToiletPayload {
  name: string;
  category: string;
  address: string;
  province: string;
  lat: number;
  lng: number;
  floorZone?: string;
  hasBidet: boolean;
  wheelchairAccessible: boolean;
  elderlySupport: boolean;
  babyStation: boolean;
  hasShower: boolean;
  hasPrayerRoom: boolean;
  open24h: boolean;
  isFree: boolean;
  priceAmount?: number;
  photoUrl?: string;
}

const ALLOWED_CATEGORIES = new Set([
  'gas_station',
  'shopping_mall',
  'transit_hub',
  'restaurant_cafe',
  'public_park',
  'camping_nature',
  'other',
]);

export function useSubmitToilet() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitToilet = async (payload: SubmitToiletPayload): Promise<RestroomPlace | null> => {
    // 1. Rate limiting check
    if (!toiletRateLimiter.tryAcquire()) {
      const waitSec = Math.ceil(toiletRateLimiter.getTimeUntilNextSlot() / 1000);
      const errMsg = `ส่งข้อมูลถี่เกินไป กรุณารอ ${waitSec} วินาทีก่อนส่งอีกครั้ง`;
      setError(errMsg);
      return null;
    }

    // 2. Coordinate validation
    if (!validateCoordinates(payload.lat, payload.lng)) {
      setError('พิกัดตำแหน่งไม่อยู่ในเขตประเทศไทย หรือรูปแบบไม่ถูกต้อง');
      return null;
    }

    // 3. Input sanitization
    const cleanName = sanitizeText(payload.name, 100);
    if (!cleanName || cleanName.length < 2) {
      setError('กรุณาระบุชื่อสถานที่ให้ถูกต้อง (อย่างน้อย 2 ตัวอักษร)');
      return null;
    }

    const cleanCategory = ALLOWED_CATEGORIES.has(payload.category) ? payload.category : 'other';
    const cleanAddress = sanitizeText(payload.address, 200) || 'จุดพักริมทาง';
    const cleanProvince = sanitizeText(payload.province, 50) || '';
    const cleanFloorZone = sanitizeText(payload.floorZone, 50);
    const cleanPhotoUrl = sanitizeUrl(payload.photoUrl);

    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (!isSupabaseConfigured) {
        // Fallback for local demo when Supabase credentials are not connected
        const localCreated: RestroomPlace = {
          id: 'local-' + Date.now(),
          name: cleanName,
          name_en: cleanName,
          category: cleanCategory as any,
          address: cleanAddress,
          address_en: cleanAddress,
          province: cleanProvince,
          coordinates: { lat: payload.lat, lng: payload.lng },
          access_status: 'user_reported',
          opening_hours: payload.open24h ? 'เปิด 24 ชั่วโมง' : 'เปิดบริการตามปกติ',
          price_type: payload.isFree ? 'free' : 'paid',
          price_amount: payload.priceAmount || 0,
          floor_zone: cleanFloorZone,
          facilities: {
            bidetSprayer: payload.hasBidet,
            genderSeparated: true,
            familyRestroom: payload.babyStation,
            diaperChangingTable: payload.babyStation,
            nursingRoom: false,
            showerRoom: payload.hasShower,
            prayerRoom: payload.hasPrayerRoom,
            wheelchairAccessible: payload.wheelchairAccessible,
            elderlyFriendly: payload.elderlySupport,
            wifi: true,
            parkingAvailable: true,
            campingSpot: cleanCategory === 'camping_nature',
            waterRefill: true,
            soapAvailable: true,
            toiletPaperAvailable: true,
          },
          accessibility: {
            hasRamp: payload.wheelchairAccessible,
            hasElevator: false,
            hasGrabBars: payload.elderlySupport,
            groundFloorOnly: true,
            accessibleParkingNearby: true,
            selfAccessible: true,
          },
          overallRating: 5.0,
          reviewCount: 1,
          ratingBreakdown: {
            cleanliness: 5.0,
            facilities: 5.0,
            accessibility: 5.0,
            safety_privacy: 5.0,
            convenience: 5.0,
            value: 5.0,
          },
          photos: cleanPhotoUrl ? [cleanPhotoUrl] : [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
          ],
          verified_at: 'เพิ่งเพิ่ม',
          source_type: 'user',
          report_status: 'normal',
          badges: ['Recently Added'],
          reviews: [],
        };

        setIsSuccess(true);
        return localCreated;
      }

      // WKT PostGIS point format: POINT(lng lat)
      const wktPoint = `POINT(${payload.lng} ${payload.lat})`;

      const { data, error: insertError } = await supabase
        .from('toilets')
        .insert({
          name: cleanName,
          category: cleanCategory,
          address: cleanAddress,
          province: cleanProvince,
          floor_zone: cleanFloorZone,
          location: wktPoint,
          has_bidet: payload.hasBidet,
          wheelchair_accessible: payload.wheelchairAccessible,
          elderly_support: payload.elderlySupport,
          baby_station: payload.babyStation,
          has_shower: payload.hasShower,
          has_prayer_room: payload.hasPrayerRoom,
          open_24h: payload.open24h,
          is_free: payload.isFree,
          price_amount: payload.priceAmount || 0,
          photos: cleanPhotoUrl ? [cleanPhotoUrl] : [],
          verification_status: 'user_reported',
          is_verified: false, // Enforce false for crowdsourced submissions
          overall_rating: 5.0,
          review_count: 1,
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setIsSuccess(true);

      const created: RestroomPlace = {
        id: data.id,
        name: data.name,
        name_en: data.name,
        category: data.category,
        address: data.address || '',
        address_en: '',
        province: data.province || '',
        coordinates: { lat: data.lat, lng: data.lng },
        access_status: 'user_reported',
        opening_hours: data.open_24h ? 'เปิด 24 ชั่วโมง' : 'เปิดบริการตามปกติ',
        price_type: data.is_free ? 'free' : 'paid',
        floor_zone: data.floor_zone,
        facilities: {
          bidetSprayer: data.has_bidet,
          genderSeparated: true,
          familyRestroom: data.baby_station,
          diaperChangingTable: data.baby_station,
          nursingRoom: false,
          showerRoom: data.has_shower,
          prayerRoom: data.has_prayer_room,
          wheelchairAccessible: data.wheelchair_accessible,
          elderlyFriendly: data.elderly_support,
          wifi: true,
          parkingAvailable: true,
          campingSpot: false,
          waterRefill: true,
          soapAvailable: true,
          toiletPaperAvailable: true,
        },
        accessibility: {
          hasRamp: data.wheelchair_accessible,
          hasElevator: false,
          hasGrabBars: data.elderly_support,
          groundFloorOnly: true,
          accessibleParkingNearby: true,
          selfAccessible: true,
        },
        overallRating: 5.0,
        reviewCount: 1,
        ratingBreakdown: {
          cleanliness: 5.0,
          facilities: 5.0,
          accessibility: 5.0,
          safety_privacy: 5.0,
          convenience: 5.0,
          value: 5.0,
        },
        photos: data.photos || [],
        verified_at: 'เพิ่งเพิ่ม',
        source_type: 'user',
        report_status: 'normal',
        badges: ['Recently Added'],
        reviews: [],
      };

      return created;
    } catch (err: any) {
      console.error('Failed to insert toilet to Supabase:', err);
      setError(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { submitToilet, isSubmitting, error, isSuccess };
}
