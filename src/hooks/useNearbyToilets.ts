import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured, DbToilet } from '../lib/supabase';
import { RestroomPlace } from '../types';
import { INITIAL_RESTROOMS } from '../data/mockRestrooms';

interface UseNearbyToiletsParams {
  lat?: number;
  lng?: number;
  radiusMeters?: number;
  filterBidet?: boolean;
  filterWheelchair?: boolean;
  filterBaby?: boolean;
  filterFree?: boolean;
  filter24h?: boolean;
}

export function useNearbyToilets(params: UseNearbyToiletsParams = {}) {
  const {
    lat = 13.7563,
    lng = 100.5018,
    radiusMeters = 25000,
    filterBidet = false,
    filterWheelchair = false,
    filterBaby = false,
    filterFree = false,
    filter24h = false,
  } = params;

  const [toilets, setToilets] = useState<RestroomPlace[]>(INITIAL_RESTROOMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNearby = useCallback(async () => {
    // If Supabase credentials are not set, gracefully use initial mock data
    if (!isSupabaseConfigured) {
      setToilets(INITIAL_RESTROOMS);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call PostGIS Stored Procedure (RPC)
      const { data, error: rpcError } = await supabase.rpc('get_nearby_toilets', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters,
        filter_bidet: filterBidet,
        filter_wheelchair: filterWheelchair,
        filter_baby: filterBaby,
        filter_free: filterFree,
        filter_24h: filter24h,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (data && Array.isArray(data)) {
        // Map database records to UI RestroomPlace format
        const mapped: RestroomPlace[] = data.map((t: any) => ({
          id: t.id,
          name: t.name,
          name_en: t.name_en || t.name,
          category: t.category,
          address: t.address || '',
          address_en: t.address || '',
          province: t.province || '',
          coordinates: { lat: t.lat, lng: t.lng },
          distanceKm: t.distance_meters ? Number((t.distance_meters / 1000).toFixed(1)) : undefined,
          access_status: t.verification_status || 'verified',
          opening_hours: t.open_24h ? 'เปิด 24 ชั่วโมง' : 'เปิดบริการตามปกติ',
          price_type: t.is_free ? 'free' : 'paid',
          price_amount: t.price_amount ? Number(t.price_amount) : 0,
          floor_zone: t.floor_zone || '',
          facilities: {
            bidetSprayer: Boolean(t.has_bidet),
            genderSeparated: true,
            familyRestroom: Boolean(t.baby_station),
            diaperChangingTable: Boolean(t.baby_station),
            nursingRoom: Boolean(t.baby_station),
            showerRoom: Boolean(t.has_shower),
            prayerRoom: Boolean(t.has_prayer_room),
            wheelchairAccessible: Boolean(t.wheelchair_accessible),
            elderlyFriendly: Boolean(t.elderly_support),
            wifi: true,
            parkingAvailable: true,
            campingSpot: t.category === 'camping_nature',
            waterRefill: true,
            soapAvailable: true,
            toiletPaperAvailable: true,
          },
          accessibility: {
            hasRamp: Boolean(t.wheelchair_accessible),
            hasElevator: false,
            hasGrabBars: Boolean(t.elderly_support),
            groundFloorOnly: true,
            accessibleParkingNearby: true,
            selfAccessible: true,
          },
          overallRating: Number(t.overall_rating || 5.0),
          reviewCount: Number(t.review_count || 1),
          ratingBreakdown: {
            cleanliness: Number(t.overall_rating || 5.0),
            facilities: 5,
            accessibility: 5,
            safety_privacy: 5,
            convenience: 5,
            value: 5,
          },
          photos: t.photos && t.photos.length > 0 ? t.photos : [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
          ],
          verified_at: 'เพิ่งอัปเดต',
          source_type: 'user',
          report_status: 'normal',
          badges: ['Cleanest', 'Verified'],
          reviews: [],
        }));

        setToilets(mapped);
      }
    } catch (err: any) {
      console.warn('Supabase query failed, falling back to local dataset:', err.message);
      setError(err.message);
      setToilets(INITIAL_RESTROOMS);
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radiusMeters, filterBidet, filterWheelchair, filterBaby, filterFree, filter24h]);

  useEffect(() => {
    fetchNearby();
  }, [fetchNearby]);

  return { toilets, loading, error, refetch: fetchNearby };
}
