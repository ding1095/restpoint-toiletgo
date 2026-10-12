import { createClient } from '@supabase/supabase-js';

// Retrieve credentials from Vite environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-project')
);

// Fallback dummy URL to prevent client initialization crash if .env is missing during local dev
const fallbackUrl = 'https://placeholder.supabase.co';
const fallbackKey = 'placeholder-key';

export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : fallbackUrl,
  isSupabaseConfigured ? supabaseAnonKey : fallbackKey
);

/**
 * Database Toilet Record Interface (Matches Step 1 SQL Schema)
 */
export interface DbToilet {
  id: string;
  name: string;
  name_en?: string | null;
  category: 'gas_station' | 'shopping_mall' | 'transit_hub' | 'public_park' | 'camping_nature' | 'restaurant_cafe' | 'other';
  address?: string | null;
  province?: string | null;
  floor_zone?: string | null;
  lat: number;
  lng: number;
  has_bidet: boolean;
  wheelchair_accessible: boolean;
  elderly_support: boolean;
  baby_station: boolean;
  has_shower: boolean;
  has_prayer_room: boolean;
  open_24h: boolean;
  is_free: boolean;
  price_amount?: number | null;
  door_width_cm?: number | null;
  wheelchair_turning_cm?: number | null;
  opening_hours?: string | null;
  is_verified: boolean;
  verification_status: 'verified' | 'user_reported' | 'unknown' | 'out_of_service';
  overall_rating: number;
  review_count: number;
  photos: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Database Review Record Interface
 */
export interface DbReview {
  id: string;
  toilet_id: string;
  user_name: string;
  cleanliness_rating: number;
  accessibility_rating?: number | null;
  comment?: string | null;
  photos?: string[];
  is_verified_visit?: boolean;
  created_at?: string;
}
