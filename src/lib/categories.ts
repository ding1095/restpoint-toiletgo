import { FacilityCategory } from '../types';

export interface CategoryMeta {
  label: string;
  emoji: string;
  color: string;
}

const META: Partial<Record<FacilityCategory, CategoryMeta>> = {
  gas_station: { label: 'ปั๊มน้ำมัน', emoji: '⛽', color: '#0284c7' },
  shopping_mall: { label: 'ห้างสรรพสินค้า', emoji: '🛍️', color: '#7c3aed' },
  restaurant_cafe: { label: 'ร้านอาหาร/คาเฟ่', emoji: '☕', color: '#d97706' },
  transit_hub: { label: 'สถานี/สนามบิน', emoji: '🚉', color: '#ea580c' },
  public_park: { label: 'สวนสาธารณะ', emoji: '🌳', color: '#16a34a' },
  camping_nature: { label: 'แคมป์ปิ้ง', emoji: '⛺', color: '#16a34a' },
};

const DEFAULT_META: CategoryMeta = { label: 'ห้องน้ำ', emoji: '🚻', color: '#059669' };

export function getCategoryMeta(category: FacilityCategory | string): CategoryMeta {
  return META[category as FacilityCategory] || DEFAULT_META;
}

/** Haversine distance in km */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} ม.`;
  if (km < 10) return `${km.toFixed(1)} กม.`;
  return `${Math.round(km)} กม.`;
}

export function formatDuration(min: number) {
  if (min < 60) return `${min} นาที`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} ชม. ${m} นาที` : `${h} ชม.`;
}

export function openGoogleMapsDirections(lat: number, lng: number) {
  window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
}
