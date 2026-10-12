-- ==============================================================================
-- 🚻 POO POO (ปู้ปู้) - ADMIN POLICIES & MANAGEMENT EXTENSIONS
-- ==============================================================================
-- Run this script in Supabase SQL Editor to enable Admin CRUD and Bulk Ingestion
-- ==============================================================================

-- 1. Enable UPDATE for toilets (allows admin to update amenities, verification, etc.)
DROP POLICY IF EXISTS "Public update toilets" ON public.toilets;
CREATE POLICY "Public update toilets" 
ON public.toilets FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 2. Enable DELETE for toilets (allows admin to remove spam or duplicate entries)
DROP POLICY IF EXISTS "Public delete toilets" ON public.toilets;
CREATE POLICY "Public delete toilets" 
ON public.toilets FOR DELETE 
USING (true);

-- 3. Enable UPDATE for reviews
DROP POLICY IF EXISTS "Public update reviews" ON public.reviews;
CREATE POLICY "Public update reviews" 
ON public.reviews FOR UPDATE 
USING (true)
WITH CHECK (true);

-- 4. Enable DELETE for reviews
DROP POLICY IF EXISTS "Public delete reviews" ON public.reviews;
CREATE POLICY "Public delete reviews" 
ON public.reviews FOR DELETE 
USING (true);

-- ==============================================================================
-- 5. RPC FUNCTION: UPSERT TOILET WITH DEDUPLICATION (50-meter corridor / name match)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.upsert_toilet(
    p_name TEXT,
    p_name_en TEXT DEFAULT NULL,
    p_category TEXT DEFAULT 'gas_station',
    p_address TEXT DEFAULT NULL,
    p_province TEXT DEFAULT NULL,
    p_lng FLOAT8 DEFAULT 100.5,
    p_lat FLOAT8 DEFAULT 13.7,
    p_has_bidet BOOLEAN DEFAULT true,
    p_wheelchair_accessible BOOLEAN DEFAULT true,
    p_elderly_support BOOLEAN DEFAULT true,
    p_baby_station BOOLEAN DEFAULT false,
    p_has_shower BOOLEAN DEFAULT false,
    p_has_prayer_room BOOLEAN DEFAULT false,
    p_open_24h BOOLEAN DEFAULT true,
    p_is_free BOOLEAN DEFAULT true,
    p_opening_hours TEXT DEFAULT '24 ชั่วโมง',
    p_overall_rating NUMERIC DEFAULT 4.8,
    p_review_count INTEGER DEFAULT 10,
    p_photos TEXT[] DEFAULT ARRAY[]::TEXT[],
    p_verification_status TEXT DEFAULT 'verified'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
    v_point GEOGRAPHY;
BEGIN
    v_point := ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography;
    
    -- Check if place already exists (matching name or within 70 meters)
    SELECT id INTO v_id 
    FROM public.toilets 
    WHERE name = p_name OR ST_DWithin(location, v_point, 70)
    LIMIT 1;
    
    IF v_id IS NOT NULL THEN
        UPDATE public.toilets
        SET 
            name = p_name,
            name_en = COALESCE(p_name_en, name_en),
            category = p_category,
            address = COALESCE(p_address, address),
            province = COALESCE(p_province, province),
            has_bidet = p_has_bidet,
            wheelchair_accessible = p_wheelchair_accessible,
            elderly_support = p_elderly_support,
            baby_station = p_baby_station,
            has_shower = p_has_shower,
            has_prayer_room = p_has_prayer_room,
            open_24h = p_open_24h,
            is_free = p_is_free,
            opening_hours = p_opening_hours,
            verification_status = p_verification_status,
            is_verified = (p_verification_status = 'verified'),
            updated_at = now()
        WHERE id = v_id;
    ELSE
        INSERT INTO public.toilets (
            name, name_en, category, address, province,
            location, has_bidet, wheelchair_accessible, elderly_support, baby_station,
            has_shower, has_prayer_room, open_24h, is_free, opening_hours,
            overall_rating, review_count, photos, is_verified, verification_status
        ) VALUES (
            p_name, p_name_en, p_category, p_address, p_province,
            v_point, p_has_bidet, p_wheelchair_accessible, p_elderly_support, p_baby_station,
            p_has_shower, p_has_prayer_room, p_open_24h, p_is_free, p_opening_hours,
            p_overall_rating, p_review_count, p_photos, (p_verification_status = 'verified'), p_verification_status
        ) RETURNING id INTO v_id;
    END IF;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
