export type FacilityCategory = 
  | 'gas_station'
  | 'shopping_mall'
  | 'transit_hub'
  | 'restaurant_cafe'
  | 'hotel'
  | 'public_park'
  | 'government_hospital'
  | 'camping_nature'
  | 'religious'
  | 'other';

export type AccessStatus = 
  | 'verified'      // ยืนยันแล้ว
  | 'user_reported' // ผู้ใช้รายงาน
  | 'unknown'       // ยังไม่ทราบ
  | 'out_of_service'; // ไม่สามารถใช้งานได้ในขณะนี้

export type SourceType = 
  | 'place_owner'   // เจ้าของสถานที่
  | 'user'          // ผู้ใช้
  | 'agency'        // หน่วยงาน
  | 'authorized_source'; // แหล่งที่ได้รับอนุญาต

export type PriceType = 'free' | 'paid' | 'unknown';

export interface RatingBreakdown {
  cleanliness: number;     // ความสะอาด (1-5)
  facilities: number;      // อุปกรณ์ครบครัน (1-5)
  accessibility: number;   // การเข้าถึง (1-5)
  safety_privacy: number;  // ความปลอดภัย/เป็นส่วนตัว (1-5)
  convenience: number;     // ความสะดวก (1-5)
  value: number;           // ความคุ้มค่า (1-5)
}

export interface ReviewItem {
  id: string;
  userName: string;
  userAvatar?: string;
  date: string;
  overallRating: number;
  ratings: RatingBreakdown;
  comment: string;
  tags?: string[];
  photos?: string[];
  isVerifiedVisit?: boolean;
}

export interface PhysicalAccessibility {
  hasRamp: boolean;
  hasElevator: boolean;
  hasGrabBars: boolean;
  doorWidthCm?: number;
  wheelchairTurningRadiusCm?: number;
  groundFloorOnly: boolean;
  accessibleParkingNearby: boolean;
  selfAccessible: boolean; // เข้าถึงได้ด้วยตนเอง หรือต้องมีผู้ช่วย
  detailedNotes?: string;
}

export interface RestroomFacility {
  bidetSprayer: boolean;       // สายฉีดชำระ
  genderSeparated: boolean;    // แยกห้องน้ำชาย/หญิง
  familyRestroom: boolean;     // ห้องน้ำครอบครัว
  diaperChangingTable: boolean;// โต๊ะเปลี่ยนผ้าอ้อม
  nursingRoom: boolean;        // ห้องให้นมบุตร
  showerRoom: boolean;         // ห้องอาบน้ำ
  prayerRoom: boolean;         // ห้องละหมาด
  wheelchairAccessible: boolean;// รองรับรถเข็น
  elderlyFriendly: boolean;    // เหมาะสำหรับผู้สูงอายุ (พื้นไม่ลื่น ราวจับ)
  wifi: boolean;               // Wi-Fi
  parkingAvailable: boolean;   // ที่จอดรถ
  campingSpot: boolean;        // จุดกางเต็นท์ / รถบ้าน
  waterRefill: boolean;        // จุดเติมน้ำ
  soapAvailable: boolean;      // สบู่ล้างมือ
  toiletPaperAvailable: boolean;// กระดาษชำระ
}

export interface RestroomPlace {
  id: string;
  name: string;
  name_en: string;
  category: FacilityCategory;
  address: string;
  address_en: string;
  province: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  distanceKm?: number;
  access_status: AccessStatus;
  opening_hours: string;
  price_type: PriceType;
  price_amount?: number;
  floor_zone?: string;
  
  facilities: RestroomFacility;
  accessibility: PhysicalAccessibility;
  
  overallRating: number;
  reviewCount: number;
  ratingBreakdown: RatingBreakdown;
  
  photos: string[];
  verified_at: string;
  source_type: SourceType;
  report_status: 'normal' | 'reported_issue' | 'under_review';
  
  badges: string[]; // e.g. "Top Rated", "Cleanest", "Wheelchair Accessible"
  reviews: ReviewItem[];
}

export interface FilterState {
  searchQuery: string;
  category: string;
  radiusKm: number;
  bidetSprayer: boolean;
  wheelchair: boolean;
  elderly: boolean;
  diaperTable: boolean;
  nursingRoom: boolean;
  prayerRoom: boolean;
  showerRoom: boolean;
  familyRoom: boolean;
  freeOnly: boolean;
  open24h: boolean;
  verifiedOnly: boolean;
}
