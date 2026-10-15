-- ==============================================================================
-- 🛡️ POO POO (ปู้ปู้) - SUPABASE SECURITY HARDENING SCRIPT
-- ==============================================================================
-- รันสคริปต์นี้ใน Supabase SQL Editor เพื่อปิดช่องโหว่ความปลอดภัยทั้งหมด
-- และเปิดใช้งานระบบป้องกัน API ฐานข้อมูลอย่างรัดกุม
-- ==============================================================================

-- 1. ลบนโยบาย (Policies) ที่เปิดสิทธิ์กว้างเกินไปและเสี่ยงต่อการถูกลบข้อมูล
DROP POLICY IF EXISTS "Public update toilets" ON public.toilets;
DROP POLICY IF EXISTS "Public delete toilets" ON public.toilets;
DROP POLICY IF EXISTS "Public update reviews" ON public.reviews;
DROP POLICY IF EXISTS "Public delete reviews" ON public.reviews;

-- 2. ยืนยันการเปิด Row Level Security (RLS)
ALTER TABLE public.toilets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 3. นโยบายความปลอดภัยตารางห้องน้ำ (TOILETS RLS POLICIES)
-- ==============================================================================

-- 3.1 สิทธิ์การอ่าน (SELECT): เปิดให้สาธารณะอ่านข้อมูลได้
DROP POLICY IF EXISTS "Public read toilets" ON public.toilets;
CREATE POLICY "Public read toilets" 
ON public.toilets FOR SELECT 
USING (true);

-- 3.2 สิทธิ์การเพิ่มจุดใหม่ (INSERT): อนุญาตให้ผู้ใช้ทั่วไปส่งข้อมูลได้ แต่ล็อกเงื่อนไขเข้มงวด
-- - ป้องกันไม่ให้ตั้งค่าเป็น 'verified' ด้วยตนเอง (ต้องผ่านการตรวจสอบก่อนเสมอ)
-- - กำหนดความยาวชื่อไม่เกิน 100 ตัวอักษร
-- - พิกัดต้องอยู่ในกรอบประเทศไทยเท่านั้น (Lat: 5-21, Lng: 97-106)
DROP POLICY IF EXISTS "Public insert toilets" ON public.toilets;
CREATE POLICY "Public insert toilets" 
ON public.toilets FOR INSERT 
WITH CHECK (
    name IS NOT NULL 
    AND length(trim(name)) >= 2 
    AND length(name) <= 100
    AND location IS NOT NULL
    AND is_verified = false
    AND verification_status = 'user_reported'
    AND ST_Y(location::geometry) >= 5.0 
    AND ST_Y(location::geometry) <= 21.0
    AND ST_X(location::geometry) >= 97.0 
    AND ST_X(location::geometry) <= 106.0
);

-- ==============================================================================
-- 4. นโยบายความปลอดภัยตารางรีวิว (REVIEWS RLS POLICIES)
-- ==============================================================================

-- 4.1 สิทธิ์การอ่าน (SELECT): เปิดให้สาธารณะอ่านรีวิวได้
DROP POLICY IF EXISTS "Public read reviews" ON public.reviews;
CREATE POLICY "Public read reviews" 
ON public.reviews FOR SELECT 
USING (true);

-- 4.2 สิทธิ์การส่งรีวิว (INSERT): บังคับคะแนน 1-5 และจำกัดความยาวข้อความป้องกัน Spam / DoS
DROP POLICY IF EXISTS "Public insert reviews" ON public.reviews;
CREATE POLICY "Public insert reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (
    cleanliness_rating BETWEEN 1 AND 5 
    AND toilet_id IS NOT NULL
    AND (user_name IS NULL OR length(user_name) <= 50)
    AND (comment IS NULL OR length(comment) <= 500)
);

-- ==============================================================================
-- 5. ฟังก์ชันผู้ดูแลระบบความปลอดภัยสูง (SECURE ADMIN RPC FUNCTIONS)
-- มีการตรวจเช็กรหัส Admin Passcode หรือ Secret Token ภายใน PostgreSQL
-- ==============================================================================

-- 5.1 ฟังก์ชันลบห้องน้ำโดยผู้ดูแลระบบ (ต้องระบุรหัส Admin PIN ที่ถูกต้อง)
-- Default PIN hash คือ SHA-256 ของ '8888'
CREATE OR REPLACE FUNCTION public.admin_delete_toilet(
    p_admin_passcode TEXT,
    p_toilet_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_expected_hash TEXT := '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731';
    v_input_hash TEXT;
BEGIN
    v_input_hash := encode(digest(p_admin_passcode, 'sha256'), 'hex');
    
    IF v_input_hash <> v_expected_hash THEN
        RAISE EXCEPTION 'สิทธิ์ไม่ถูกต้อง: รหัส PIN ผู้ดูแลระบบไม่ถูกต้อง';
    END IF;

    DELETE FROM public.toilets WHERE id = p_toilet_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5.2 ฟังก์ชันอัปเดตสถานะการยืนยันโดยผู้ดูแลระบบ
CREATE OR REPLACE FUNCTION public.admin_set_verification(
    p_admin_passcode TEXT,
    p_toilet_id UUID,
    p_status TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_expected_hash TEXT := '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731';
    v_input_hash TEXT;
BEGIN
    v_input_hash := encode(digest(p_admin_passcode, 'sha256'), 'hex');
    
    IF v_input_hash <> v_expected_hash THEN
        RAISE EXCEPTION 'สิทธิ์ไม่ถูกต้อง: รหัส PIN ผู้ดูแลระบบไม่ถูกต้อง';
    END IF;

    UPDATE public.toilets
    SET 
        verification_status = p_status,
        is_verified = (p_status = 'verified'),
        updated_at = now()
    WHERE id = p_toilet_id;

    RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
