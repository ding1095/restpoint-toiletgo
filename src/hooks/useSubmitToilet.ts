import { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { RestroomPlace } from '../types';

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

export function useSubmitToilet() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const submitToilet = async (payload: SubmitToiletPayload): Promise<RestroomPlace | null> => {
    setIsSubmitting(true);
    setError(null);
    setIsSuccess(false);

    try {
      if (!isSupabaseConfigured) {
        // Fallback for local demo when Supabase credentials are not connected
        const localCreated: RestroomPlace = {
          id: 'local-' + Date.now(),
          name: payload.name,
          name_en: payload.name,
          category: payload.category as any,
          address: payload.address || 'จุดพักริมทาง',
          address_en: payload.address || '',
          province: payload.province || '',
          coordinates: { lat: payload.lat, lng: payload.lng },
          access_status: 'user_reported',
          opening_hours: payload.open24h ? 'เปิด 24 ชั่วโมง' : 'เปิดบริการตามปกติ',
          price_type: payload.isFree ? 'free' : 'paid',
          price_amount: payload.priceAmount || 0,
          floor_zone: payload.floorZone || '',
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
            campingSpot: payload.category === 'camping_nature',
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
          photos: payload.photoUrl ? [payload.photoUrl] : [
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
          name: payload.name,
          category: payload.category,
          address: payload.address,
          province: payload.province,
          floor_zone: payload.floorZone || '',
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
          photos: payload.photoUrl ? [payload.photoUrl] : [],
          verification_status: 'user_reported',
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
