# Poo Poo (ปู้ปู้) 💩✨

> **ปวดเมื่อไหร่บอกปู้ปู้! ค้นหาห้องน้ำสะอาดและจุดแวะพักระหว่างเดินทาง**  
> *Map-First Clean Restroom & Rest Stop Navigator for Thailand*

[![Version](https://img.shields.io/badge/version-v1.2.0-emerald)](https://github.com/ding1095/restpoint-toiletgo/releases)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostGIS-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌟 ฟังก์ชันหลัก (Core Features)

### 1. 🚗 โหมดเส้นทางเดินทาง (Trip Route Scanner)
- **ระบบค้นหาสถานที่อัจฉริยะ (Place Autocomplete):** พิมพ์ค้นหาจุดเริ่มต้นและจุดหมายปลายทางได้จริง ครอบคลุมสถานที่สำคัญในไทย เช่น กรุงเทพฯ, พัทยา, หัวหิน, เขาใหญ่, เชียงใหม่, ขอนแก่น, ภูเก็ต
- **ปักหมุดและลากหมุดบนแผนที่ได้อิสระ (Interactive & Draggable Pins):** 
  - กดปุ่ม **"เลือกบนแผนที่"** เพื่อแตะเลือกพิกัด พร้อมระบบ Reverse Geocoding แปลงพิกัดเป็นชื่อสถานที่ภาษาไทยอัตโนมัติ
  - สามารถคลิกหรือใช้นิ้วลากหมุดธงเขียว (จุดเริ่ม) และธงแดง (ปลายทาง) บนแผนที่เพื่อปรับตำแหน่งได้แบบ Real-time
- **สแกนห้องน้ำตลอดแนวเส้นทาง (Route Corridor Buffer):** คำนวณเส้นทางขับขี่จริง (OSRM Engine) พร้อมดึงข้อมูลห้องน้ำตลอดแนวถนนผ่าน Supabase PostGIS (`ST_DWithin`) เรียงลำดับตามระยะทางกิโลเมตรจากจุดเริ่มต้น
- **สรุปเวลาและระยะทาง:** คำนวณระยะทางรวม (กม.) เวลาเดินทางโดยประมาณ (~นาที) และปุ่มกดเปิดนำทางด้วย Google Maps ได้ทันที

### 2. 🗺️ โหมดสำรวจจุดพัก (Explore & Regional Filter)
- **แผนที่เต็มจอ (Map-First Experience):** ใช้แผนที่มาตรฐาน OpenStreetMap สว่าง สบายตา ไม่ต้องใช้ API Key
- **ตัวกรองภูมิภาคทั่วไทย (Regional Jump):** คัดกรองและบินไปยังแต่ละภาคได้ในคลิกเดียว:
  - 🇹🇭 ทั่วประเทศ
  - 🏔️ ภาคเหนือ
  - 🌾 ภาคอีสาน (ตะวันออกเฉียงเหนือ)
  - 🏛️ ภาคกลาง & กทม.
  - 🌴 ภาคใต้
  - 🌊 ภาคตะวันออก
  - ⛰️ ภาคตะวันตก
- **ตัวกรองสิ่งอำนวยความสะดวกสำคัญ:** 
  - 💦 มีสายฉีดชำระ
  - ♿ ทางลาด & วีลแชร์
  - ⏰ เปิดตลอด 24 ชั่วโมง
  - 💵 เข้าใช้บริการฟรี
- **จัดเรียงตามระยะทางจริง (GPS Proximity):** เมื่อเปิด GPS ระบบจะคำนวณและเรียงลำดับจากจุดที่ใกล้ตัวที่สุดให้ทันที

### 3. 📱 UX/UI ดีไซน์ใหม่ สไตล์ปี 2026
- **คอมพิวเตอร์ (Desktop):** แผงควบคุมลอยด้านซ้าย (Floating Side Panel 400px) ไม่บดบังแผนที่
- **โทรศัพท์มือถือ (Mobile):** แผงสไลด์ด้านล่าง (3-Snap Swipeable Bottom Sheet) ปัดขึ้นลงได้ 3 ระดับ (ย่อ / ครึ่งจอ / เต็มจอ) แตะจุดพักแล้วแผงจะย่อลงอัตโนมัติเพื่อให้เห็นแผนที่ชัดเจน
- **มินิมอล ไม่รกสายตา:** จัดระเบียบเมนูให้ใช้งานง่าย ลดทอนองค์ประกอบที่ไม่จำเป็น เข้าถึงข้อมูลที่ต้องการได้ใน 1-2 สัมผัส

### 4. 🔒 ระบบผู้ดูแลและจัดการข้อมูล (Admin Portal)
- ระบบล็อกอินด้วยรหัสผ่าน (Passcode PIN) ป้องกันการแก้ไขโดยไม่ได้รับอนุญาต
- ตารางบริหารจัดการห้องน้ำ ค้นหา กรองสถานะ และดำเนินการ CRUD (เพิ่ม/แก้ไข/ลบ)
- ระบบดึงข้อมูลพิกัดห้องน้ำ ปั๊มน้ำมัน และห้างสรรพสินค้าอัตโนมัติจาก OpenStreetMap Overpass API
- สถิติและ KPI ภาพรวม: จำนวนจุดทั้งหมด, จุดที่มีสายฉีดชำระ, จุดที่รองรับวีลแชร์ และคะแนนความสะอาดเฉลี่ย

### 5. 🛡️ ความปลอดภัยและการป้องกัน API (Security & API Hardening)
- **Input Sanitization & Anti-XSS:** กรองอักขระพิเศษและตัดแท็ก HTML เพื่อป้องกัน Cross-Site Scripting (XSS) ในชื่อ, ที่อยู่ และข้อความรีวิว
- **Coordinate Boundary Validation:** ตรวจสอบพิกัดละติจูด/ลองจิจูดให้อยู่ในกรอบภูมิศาสตร์ประเทศไทย (5.5°-20.6°N, 97.2°-105.8°E) ป้องกันการส่งค่าพิกัดหลุดขอบเขตหรือค่าตัวเลขผิดพลาด
- **Rate Limiting & Throttling:** ระบบจำกัดความถี่เพื่อป้องกันการสแปมรีวิวและการเพิ่มจุดซ้ำซ้อน
- **In-Memory LRU Caching:** ลดการเรียกซ้ำซ้อนไปยัง OpenStreetMap Nominatim และ OSRM Routing เพื่อรักษาโควตา API ฟรี
- **Cryptographic Admin Auth:** ป้องกันการดักจับรหัสผ่านแอดมินด้วย SHA-256 Web Crypto พร้อมระบบตัดสิทธิ์ชั่วคราว (Lockout) เมื่อใส่รหัสผ่านผิดเกิน 5 ครั้ง
- **Supabase Database Hardening:** สคริปต์ `supabase/security_hardening.sql` ปิดช่องโหว่นโยบาย RLS แบบเปิดกว้าง และบังคับตรวจสอบความถูกต้องของข้อมูลก่อนบันทึก
- **HTTP Security Headers:** รองรับ `X-Frame-Options` (DENY), `X-Content-Type-Options` (nosniff), `Referrer-Policy`, และ `Permissions-Policy` ผ่าน `vercel.json`

---

## 🛠️ สถาปัตยกรรมและเทคโนโลยี (Tech Stack)

| ส่วนประกอบ | เทคโนโลยีที่ใช้ |
|---|---|
| **Frontend Framework** | React 19, TypeScript, Vite 8 |
| **Styling** | Tailwind CSS 3.4, Lucide Icons, Prompt & Inter Fonts |
| **Map & Tiles** | Leaflet.js, OpenStreetMap Standard Tiles (No API Key Required) |
| **Routing & Geocoding** | OSRM Routing API, OpenStreetMap Nominatim Reverse & Forward Geocoding |
| **Backend & Database** | Supabase (PostgreSQL 15 + PostGIS Extension) |
| **State & Storage** | LocalStorage (บันทึกรายการโปรดออฟไลน์), React Hooks |
| **Deployment** | Vercel (Single-Page Application rewrite rules) |

---

## 📂 โครงสร้างโปรเจกต์ (Project Structure)

```text
poo-poo/
├── public/                 # Static assets & icons
├── src/
│   ├── components/         # React UI Components
│   │   ├── LeafletMap.tsx         # แผนที่ Interactive Leaflet + OpenStreetMap
│   │   ├── RouteRestFinder.tsx    # หน้าวางแผนเส้นทางและสแกนห้องน้ำ
│   │   ├── MapRestroomFinder.tsx  # หน้าสำรวจ ค้นหา และตัวกรองภูมิภาค
│   │   ├── SheetLayout.tsx        # Responsive Floating Panel / Swipeable Sheet
│   │   ├── PlaceRow.tsx           # การ์ดแสดงรายการจุดพักแบบมินิมอล
│   │   ├── Navbar.tsx             # แถบเมนูด้านบนพร้อมสโลแกนและเมนูรวม
│   │   ├── ToiletBottomSheet.tsx  # แผ่นแสดงรายละเอียดห้องน้ำและรีวิว
│   │   ├── AdminPortal.tsx        # ระบบจัดการข้อมูลห้องน้ำสำหรับผู้ดูแล
│   │   └── PooPooMascot.tsx       # มาสคอตน้องปู้ปู้ 💩
│   ├── hooks/              # Custom Data Fetching Hooks (useNearbyToilets, useRouteToilets)
│   ├── lib/                # Utilities (categories, thailandRegions, supabase client)
│   ├── types/              # TypeScript Interfaces & Definitions
│   ├── App.tsx             # Main App Shell & State
│   └── main.tsx            # Entry Point
├── supabase/               # SQL Migrations, PostGIS RPCs & Admin Policies
├── CHANGELOG.md            # บันทึกประวัติการพัฒนาและเวอร์ชันทั้งหมด
└── package.json
```

---

## 🚀 การติดตั้งและรันในเครื่อง (Getting Started)

### 1. โคลนและติดตั้ง Dependencies
```bash
git clone https://github.com/ding1095/restpoint-toiletgo.git
cd restpoint-toiletgo
npm install
```

### 2. ตั้งค่า Environment Variables (Optional สำหรับ Supabase)
สร้างไฟล์ `.env.local` ที่ Root Directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
*(หากไม่ใส่ค่าระบบจะทำงานในโหมด Local Fallback พร้อมฐานข้อมูลตัวอย่าง 400+ แห่งโดยอัตโนมัติ)*

### 3. รันโปรเจกต์สำหรับ Development
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่ `http://localhost:5173`

### 4. Build เพื่อใช้งานจริง (Production Build)
```bash
npm run build
```

---

## 🏷️ การติดตามเวอร์ชัน (Git Versioning)

โปรเจกต์ใช้รูปแบบ **Semantic Versioning** (`vMAJOR.MINOR.PATCH`) โดยทุกเวอร์ชันจะมีการสร้าง **Git Tag** กำกับไว้เสมอ:
- รายละเอียดประวัติการเปลี่ยนแปลงทั้งหมดสามารถดูได้ที่ [CHANGELOG.md](./CHANGELOG.md)
- ดู Releases ทั้งหมดบน GitHub: [Releases](https://github.com/ding1095/restpoint-toiletgo/releases)

---

## 📄 ลิขสิทธิ์ (License)
MIT License © 2026 Poo Poo Team
