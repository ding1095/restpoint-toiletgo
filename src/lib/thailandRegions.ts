export interface ThailandRegion {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  center: [number, number]; // [lat, lng]
  zoom: number;
  provinces: string[];
}

export const THAILAND_REGIONS: ThailandRegion[] = [
  {
    id: 'all',
    name: 'ทั่วประเทศ (ทุกภาค)',
    shortName: 'ทั่วไทย 🇹🇭',
    icon: '🇹🇭',
    center: [13.2, 101.0],
    zoom: 6,
    provinces: [],
  },
  {
    id: 'north',
    name: 'ภาคเหนือ',
    shortName: 'ภาคเหนือ 🏔️',
    icon: '🏔️',
    center: [18.78, 99.1],
    zoom: 7.5,
    provinces: [
      'เชียงใหม่', 'เชียงราย', 'ลำปาง', 'ลำพูน', 'แม่ฮ่องสอน', 'น่าน', 
      'พะเยา', 'แพร่', 'พิษณุโลก', 'สุโขทัย', 'อุตรดิตถ์', 'ตาก', 
      'กำแพงเพชร', 'พิจิตร', 'นครสวรรค์', 'อุทัยธานี', 'เพชรบูรณ์'
    ],
  },
  {
    id: 'isan',
    name: 'ภาคอีสาน (ตะวันออกเฉียงเหนือ)',
    shortName: 'ภาคอีสาน 🌾',
    icon: '🌾',
    center: [16.25, 103.0],
    zoom: 7.2,
    provinces: [
      'ขอนแก่น', 'นครราชสีมา', 'อุดรธานี', 'อุบลราชธานี', 'บุรีรัมย์', 
      'สุรินทร์', 'ร้อยเอ็ด', 'สกลนคร', 'นครพนม', 'ชัยภูมิ', 'มุกดาหาร', 
      'มหาสารคาม', 'กาฬสินธุ์', 'หนองคาย', 'เลย', 'ยโสธร', 'ศรีสะเกษ', 
      'หนองบัวลำภู', 'อำนาจเจริญ', 'บึงกาฬ'
    ],
  },
  {
    id: 'central',
    name: 'ภาคกลาง & กทม.',
    shortName: 'ภาคกลาง/กทม. 🏛️',
    icon: '🏛️',
    center: [13.9, 100.5],
    zoom: 8.5,
    provinces: [
      'กรุงเทพมหานคร', 'นนทบุรี', 'ปทุมธานี', 'สมุทรปราการ', 'สมุทรสาคร', 
      'นครปฐม', 'พระนครศรีอยุธยา', 'สระบุรี', 'ลพบุรี', 'ชัยนาท', 
      'สิงห์บุรี', 'อ่างทอง', 'สุพรรณบุรี'
    ],
  },
  {
    id: 'south',
    name: 'ภาคใต้',
    shortName: 'ภาคใต้ 🌴',
    icon: '🌴',
    center: [8.5, 99.2],
    zoom: 7.2,
    provinces: [
      'ภูเก็ต', 'สุราษฎร์ธานี', 'สงขลา', 'นครศรีธรรมราช', 'กระบี่', 
      'พังงา', 'ตรัง', 'ชุมพร', 'ระนอง', 'พัทลุง', 'สตูล', 
      'ปัตตานี', 'ยะลา', 'นราธิวาส'
    ],
  },
  {
    id: 'east',
    name: 'ภาคตะวันออก',
    shortName: 'ภาคตะวันออก 🌊',
    icon: '🌊',
    center: [13.1, 101.5],
    zoom: 8.2,
    provinces: [
      'ชลบุรี', 'ระยอง', 'จันทบุรี', 'ตราด', 'ฉะเชิงเทรา', 'ปราจีนบุรี', 'สระแก้ว'
    ],
  },
  {
    id: 'west',
    name: 'ภาคตะวันตก',
    shortName: 'ภาคตะวันตก ⛰️',
    icon: '⛰️',
    center: [13.2, 99.6],
    zoom: 8.0,
    provinces: [
      'กาญจนบุรี', 'ราชบุรี', 'เพชรบุรี', 'ประจวบคีรีขันธ์', 'สมุทรสงคราม'
    ],
  },
];

/**
 * Determine which region a province belongs to
 */
export function getRegionIdByProvince(province: string): string {
  if (!province) return 'all';
  const cleanProv = province.trim();
  for (const reg of THAILAND_REGIONS) {
    if (reg.id === 'all') continue;
    if (reg.provinces.some(p => cleanProv.includes(p) || p.includes(cleanProv))) {
      return reg.id;
    }
  }
  return 'central'; // Default fallback
}

import { 
  sanitizeText, 
  validateCoordinates, 
  geocodeCache, 
  geocodeRateLimiter 
} from './apiSecurity';

/**
 * Reverse Geocoding with OpenStreetMap Nominatim with caching, validation & rate limiting
 */
export async function reverseGeocodeCoord(lat: number, lng: number): Promise<string> {
  const fallback = `พิกัด (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  
  if (!validateCoordinates(lat, lng)) {
    return fallback;
  }

  const cacheKey = `rev:${lat.toFixed(4)},${lng.toFixed(4)}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  if (!geocodeRateLimiter.tryAcquire()) {
    return fallback;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2200);

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&addressdetails=1&accept-language=th`;
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return fallback;

    const data = await res.json();
    if (data && data.address) {
      const addr = data.address;
      const parts: string[] = [];

      // Building / amenity name
      if (data.name && !data.name.includes('Road') && !data.name.includes('Street')) {
        parts.push(sanitizeText(data.name, 50));
      }
      
      // District / Suburb
      const subdistrict = addr.suburb || addr.neighbourhood || addr.village;
      const district = addr.city_district || addr.district || addr.county || addr.town;
      const city = addr.city || addr.state || addr.province;

      if (subdistrict) parts.push(sanitizeText(subdistrict, 30));
      if (district && district !== subdistrict) parts.push(sanitizeText(district, 30));
      if (city && city !== district) parts.push(sanitizeText(city, 30));

      let result = fallback;
      if (parts.length > 0) {
        result = parts.slice(0, 2).join(' ') + (city && !parts.includes(city) ? ` (${city})` : '');
      } else if (data.display_name) {
        result = sanitizeText(data.display_name.split(',').slice(0, 2).join(','), 60);
      }

      geocodeCache.set(cacheKey, result);
      return result;
    }

    return fallback;
  } catch {
    return fallback;
  }
}

export interface PlaceSuggestion {
  name: string;
  detail: string;
  lat: number;
  lng: number;
}

/**
 * Forward geocoding (place search) restricted to Thailand with caching & sanitization
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> {
  const cleanQ = sanitizeText(query, 80);
  if (cleanQ.length < 2) return [];

  const cacheKey = `search:${cleanQ.toLowerCase()}`;
  const cached = geocodeCache.get(cacheKey);
  if (cached) return cached;

  if (!geocodeRateLimiter.tryAcquire()) {
    return [];
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQ)}&countrycodes=th&limit=6&accept-language=th`;
    const res = await fetch(url, { signal, headers: { Accept: 'application/json' } });
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const suggestions: PlaceSuggestion[] = [];
    for (const d of data) {
      const lat = parseFloat(d.lat);
      const lng = parseFloat(d.lon);
      if (!validateCoordinates(lat, lng)) continue;

      const parts = String(d.display_name || '').split(',').map((s: string) => sanitizeText(s, 40));
      suggestions.push({
        name: sanitizeText(d.name || parts[0] || cleanQ, 50),
        detail: parts.slice(1, 4).join(', '),
        lat,
        lng,
      });
    }

    geocodeCache.set(cacheKey, suggestions);
    return suggestions;
  } catch {
    return [];
  }
}
