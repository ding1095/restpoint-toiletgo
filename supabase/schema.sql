-- ==============================================================================
-- 🚻 POO POO (ปู้ปู้) - SUPABASE POSTGRESQL & POSTGIS SCHEMA (IDEMPOTENT / RE-RUNNABLE)
-- ==============================================================================
-- Note: Safe to re-run multiple times without duplicate errors
-- ==============================================================================

-- 1. Enable PostGIS Extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2. Create Toilets / Rest Stops Table
CREATE TABLE IF NOT EXISTS public.toilets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_en TEXT,
    category TEXT NOT NULL CHECK (category IN (
        'gas_station', 
        'shopping_mall', 
        'transit_hub', 
        'public_park', 
        'camping_nature', 
        'restaurant_cafe', 
        'other'
    )),
    address TEXT,
    province TEXT,
    floor_zone TEXT,
    
    -- Geographic Location (WGS84 4326: Lon, Lat)
    location GEOGRAPHY(POINT, 4326) NOT NULL,
    
    -- Convenience Computed Columns (Fast client-side rendering)
    lat FLOAT8 GENERATED ALWAYS AS (ST_Y(location::geometry)) STORED,
    lng FLOAT8 GENERATED ALWAYS AS (ST_X(location::geometry)) STORED,
    
    -- Feature Flags
    has_bidet BOOLEAN NOT NULL DEFAULT false,
    wheelchair_accessible BOOLEAN NOT NULL DEFAULT false,
    elderly_support BOOLEAN NOT NULL DEFAULT false,
    baby_station BOOLEAN NOT NULL DEFAULT false,
    has_shower BOOLEAN NOT NULL DEFAULT false,
    has_prayer_room BOOLEAN NOT NULL DEFAULT false,
    open_24h BOOLEAN NOT NULL DEFAULT false,
    is_free BOOLEAN NOT NULL DEFAULT true,
    price_amount NUMERIC(8, 2) DEFAULT 0.00,
    
    -- Physical Specs for Accessibility
    door_width_cm INTEGER,
    wheelchair_turning_cm INTEGER,
    
    -- Operational & Verification
    opening_hours TEXT DEFAULT '24 ชั่วโมง',
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verification_status TEXT NOT NULL DEFAULT 'user_reported' CHECK (
        verification_status IN ('verified', 'user_reported', 'unknown', 'out_of_service')
    ),
    
    -- Denormalized Ratings Cache (updated automatically via trigger)
    overall_rating NUMERIC(3, 2) NOT NULL DEFAULT 5.00,
    review_count INTEGER NOT NULL DEFAULT 0,
    
    -- Photos array
    photos TEXT[] DEFAULT '{}',
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Create Reviews Table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    toilet_id UUID NOT NULL REFERENCES public.toilets(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL DEFAULT 'นักเดินทางนิรนาม',
    cleanliness_rating INTEGER NOT NULL CHECK (cleanliness_rating BETWEEN 1 AND 5),
    accessibility_rating INTEGER CHECK (accessibility_rating BETWEEN 1 AND 5),
    comment TEXT,
    photos TEXT[] DEFAULT '{}',
    is_verified_visit BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==============================================================================
-- 4. SPATIAL & PERFORMANCE INDEXING
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_toilets_location ON public.toilets USING GIST (location);
CREATE INDEX IF NOT EXISTS idx_toilets_category ON public.toilets(category);
CREATE INDEX IF NOT EXISTS idx_toilets_rating ON public.toilets(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_toilets_features ON public.toilets(has_bidet, wheelchair_accessible, baby_station, is_free);
CREATE INDEX IF NOT EXISTS idx_reviews_toilet_id ON public.reviews(toilet_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- ==============================================================================
-- 5. TRIGGER: คำนวณคะแนนเฉลี่ยอัตโนมัติ
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.update_toilet_rating_cache()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.toilets
    SET 
        overall_rating = COALESCE((
            SELECT ROUND(AVG(cleanliness_rating)::numeric, 2)
            FROM public.reviews
            WHERE toilet_id = COALESCE(NEW.toilet_id, OLD.toilet_id)
        ), 5.00),
        review_count = (
            SELECT COUNT(*)::int
            FROM public.reviews
            WHERE toilet_id = COALESCE(NEW.toilet_id, OLD.toilet_id)
        ),
        updated_at = now()
    WHERE id = COALESCE(NEW.toilet_id, OLD.toilet_id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_toilet_rating ON public.reviews;
CREATE TRIGGER trigger_update_toilet_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.update_toilet_rating_cache();

-- ==============================================================================
-- 6. RPC: GET NEARBY TOILETS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_nearby_toilets(
    user_lat FLOAT8,
    user_lng FLOAT8,
    radius_meters FLOAT8 DEFAULT 10000,
    filter_bidet BOOLEAN DEFAULT false,
    filter_wheelchair BOOLEAN DEFAULT false,
    filter_baby BOOLEAN DEFAULT false,
    filter_free BOOLEAN DEFAULT false,
    filter_24h BOOLEAN DEFAULT false
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    name_en TEXT,
    category TEXT,
    address TEXT,
    province TEXT,
    floor_zone TEXT,
    lat FLOAT8,
    lng FLOAT8,
    has_bidet BOOLEAN,
    wheelchair_accessible BOOLEAN,
    elderly_support BOOLEAN,
    baby_station BOOLEAN,
    has_shower BOOLEAN,
    has_prayer_room BOOLEAN,
    open_24h BOOLEAN,
    is_free BOOLEAN,
    price_amount NUMERIC,
    overall_rating NUMERIC,
    review_count INTEGER,
    photos TEXT[],
    verification_status TEXT,
    distance_meters FLOAT8
) AS $$
DECLARE
    user_point GEOGRAPHY;
BEGIN
    user_point := ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography;
    
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.name_en,
        t.category,
        t.address,
        t.province,
        t.floor_zone,
        t.lat,
        t.lng,
        t.has_bidet,
        t.wheelchair_accessible,
        t.elderly_support,
        t.baby_station,
        t.has_shower,
        t.has_prayer_room,
        t.open_24h,
        t.is_free,
        t.price_amount,
        t.overall_rating,
        t.review_count,
        t.photos,
        t.verification_status,
        ST_Distance(t.location, user_point) AS distance_meters
    FROM public.toilets t
    WHERE ST_DWithin(t.location, user_point, radius_meters)
      AND (NOT filter_bidet OR t.has_bidet = true)
      AND (NOT filter_wheelchair OR t.wheelchair_accessible = true)
      AND (NOT filter_baby OR t.baby_station = true)
      AND (NOT filter_free OR t.is_free = true)
      AND (NOT filter_24h OR t.open_24h = true)
    ORDER BY distance_meters ASC
    LIMIT 60;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 7. RPC: ROUTE CORRIDOR SCANNER
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_toilets_along_route(
    route_geojson JSONB,
    corridor_buffer_meters FLOAT8 DEFAULT 8000
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    name_en TEXT,
    category TEXT,
    address TEXT,
    lat FLOAT8,
    lng FLOAT8,
    has_bidet BOOLEAN,
    wheelchair_accessible BOOLEAN,
    baby_station BOOLEAN,
    is_free BOOLEAN,
    open_24h BOOLEAN,
    overall_rating NUMERIC,
    review_count INTEGER,
    photos TEXT[],
    distance_to_route_meters FLOAT8
) AS $$
DECLARE
    route_geom GEOMETRY;
BEGIN
    route_geom := ST_SetSRID(ST_GeomFromGeoJSON(route_geojson), 4326);
    
    RETURN QUERY
    SELECT 
        t.id,
        t.name,
        t.name_en,
        t.category,
        t.address,
        t.lat,
        t.lng,
        t.has_bidet,
        t.wheelchair_accessible,
        t.baby_station,
        t.is_free,
        t.open_24h,
        t.overall_rating,
        t.review_count,
        t.photos,
        ST_Distance(t.location, route_geom::geography) AS distance_to_route_meters
    FROM public.toilets t
    WHERE ST_DWithin(t.location, route_geom::geography, corridor_buffer_meters)
    ORDER BY distance_to_route_meters ASC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==============================================================================
-- 8. ROW LEVEL SECURITY (RLS) - SAFE IDEMPOTENT POLICIES
-- ==============================================================================

ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 8.1 TOILETS POLICIES (Drop first to avoid 42710 already exists error)
DROP POLICY IF EXISTS "Public read toilets" ON public.toilets;
CREATE POLICY "Public read toilets" 
ON public.toilets FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public insert toilets" ON public.toilets;
CREATE POLICY "Public insert toilets" 
ON public.toilets FOR INSERT 
WITH CHECK (
    name IS NOT NULL 
    AND length(name) >= 2 
    AND location IS NOT NULL
);

-- 8.2 REVIEWS POLICIES
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" 
ON public.reviews FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;
CREATE POLICY "Public insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (
    cleanliness_rating BETWEEN 1 AND 5 
    AND toilet_id IS NOT NULL
);

-- ==============================================================================
-- 9. INITIAL SEED DATA (SAFE INSERT WITHOUT DUPLICATES)
-- ==============================================================================

INSERT INTO public.toilets (
    name, name_en, category, address, province, floor_zone, 
    location, has_bidet, wheelchair_accessible, elderly_support, baby_station, 
    open_24h, is_free, overall_rating, review_count, photos, is_verified, verification_status
)
SELECT 
    'จุดพักรถมอเตอร์เวย์ ขาออก กม. 50 (ชลบุรี)',
    'Motorway Rest Area Km.50 Outbound (Chonburi)',
    'gas_station',
    'ทล.7 มอเตอร์เวย์ กรุงเทพ-ชลบุรี ต.เขาดิน อ.บางปะกง',
    'ฉะเชิงเทรา',
    'อาคารบริการกลาง ข้างศูนย์อาหาร',
    ST_SetSRID(ST_MakePoint(101.0042, 13.5684), 4326)::geography,
    true, true, true, true, true, true, 4.85, 142,
    ARRAY['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
    true, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM public.toilets WHERE name = 'จุดพักรถมอเตอร์เวย์ ขาออก กม. 50 (ชลบุรี)');

INSERT INTO public.toilets (
    name, name_en, category, address, province, floor_zone, 
    location, has_bidet, wheelchair_accessible, elderly_support, baby_station, 
    open_24h, is_free, overall_rating, review_count, photos, is_verified, verification_status
)
SELECT 
    'ICONSIAM (สุขพิมาน เลานจ์)',
    'ICONSIAM Restroom Lounge',
    'shopping_mall',
    '299 ถนนเจริญนคร คลองต้นไทร คลองสาน',
    'กรุงเทพมหานคร',
    'ชั้น G โซนสุขสยาม',
    ST_SetSRID(ST_MakePoint(100.5104, 13.7268), 4326)::geography,
    true, true, true, true, false, true, 4.95, 310,
    ARRAY['https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80'],
    true, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM public.toilets WHERE name = 'ICONSIAM (สุขพิมาน เลานจ์)');

INSERT INTO public.toilets (
    name, name_en, category, address, province, floor_zone, 
    location, has_bidet, wheelchair_accessible, elderly_support, baby_station, 
    open_24h, is_free, overall_rating, review_count, photos, is_verified, verification_status
)
SELECT 
    'ปั๊ม ปตท. พระราม 2 ขาออก กม. 35',
    'PTT Station Rama 2 Outbound Km.35',
    'gas_station',
    'ถนนพระราม 2 ต.บางกระเจ้า อ.เมือง',
    'สมุทรสาคร',
    'ด้านหลัง Cafe Amazon',
    ST_SetSRID(ST_MakePoint(100.2745, 13.5385), 4326)::geography,
    true, true, true, true, true, true, 4.60, 98,
    ARRAY['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
    true, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM public.toilets WHERE name = 'ปั๊ม ปตท. พระราม 2 ขาออก กม. 35');

INSERT INTO public.toilets (
    name, name_en, category, address, province, floor_zone, 
    location, has_bidet, wheelchair_accessible, elderly_support, baby_station, 
    open_24h, is_free, overall_rating, review_count, photos, is_verified, verification_status
)
SELECT 
    'จุดพักรถ ปตท. ท่ายาง-ชะอำ ขาลงใต้',
    'PTT Rest Area Tha Yang - Cha-am Southbound',
    'gas_station',
    'ถนนเพชรเกษม ทล.4 ต.ท่ายาง อ.ท่ายาง',
    'เพชรบุรี',
    'อาคารห้องน้ำหลักด้านหลังปั๊ม',
    ST_SetSRID(ST_MakePoint(99.9821, 12.9124), 4326)::geography,
    true, true, true, true, true, true, 4.70, 164,
    ARRAY['https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'],
    true, 'verified'
WHERE NOT EXISTS (SELECT 1 FROM public.toilets WHERE name = 'จุดพักรถ ปตท. ท่ายาง-ชะอำ ขาลงใต้');
