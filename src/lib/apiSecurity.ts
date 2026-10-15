/**
 * API Security & Hardening Utilities
 * - Input sanitization (XSS prevention)
 * - Coordinate boundary validation
 * - In-memory LRU caching for third-party APIs (Nominatim, OSRM)
 * - Request throttling / rate limiting
 * - Cryptographic SHA-256 admin passcode verification
 * - Brute-force login protection
 */

// Bounding box for Thailand geographic coordinates
const THAILAND_BBOX = {
  minLat: 5.5,
  maxLat: 20.6,
  minLng: 97.2,
  maxLng: 105.8,
};

/**
 * Sanitize text input: strip dangerous HTML tags, scripts, and control characters
 */
export function sanitizeText(input: string | null | undefined, maxLength = 200): string {
  if (!input) return '';
  return String(input)
    // Strip HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Strip control characters except newline & tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize URL: only allow secure https:// or http:// protocols
 */
export function sanitizeUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
  } catch {
    // invalid URL format
  }
  return null;
}

/**
 * Validate coordinates: ensure lat/lng are finite numbers within Thailand bounding box
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return (
    lat >= THAILAND_BBOX.minLat &&
    lat <= THAILAND_BBOX.maxLat &&
    lng >= THAILAND_BBOX.minLng &&
    lng <= THAILAND_BBOX.maxLng
  );
}

/**
 * Simple in-memory LRU cache with Time-To-Live (TTL)
 */
class SimpleLruCache<T> {
  private cache = new Map<string, { value: T; expiresAt: number }>();
  private maxItems: number;
  private ttlMs: number;

  constructor(maxItems = 100, ttlMs = 10 * 60 * 1000) {
    this.maxItems = maxItems;
    this.ttlMs = ttlMs;
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    // Refresh position for LRU
    this.cache.delete(key);
    this.cache.set(key, item);
    return item.value;
  }

  set(key: string, value: T): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxItems) {
      // Evict oldest item
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttlMs });
  }
}

// Global caches for Geocoding and Routing API queries
export const geocodeCache = new SimpleLruCache<any>(150, 15 * 60 * 1000); // 15 mins TTL
export const routeCache = new SimpleLruCache<any>(50, 10 * 60 * 1000); // 10 mins TTL

/**
 * Client-side Rate Limiter (Token bucket / timestamp tracking)
 * Prevents spamming and API quota exhaustion
 */
class RateLimiter {
  private timestamps: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  tryAcquire(): boolean {
    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.windowMs);
    if (this.timestamps.length >= this.maxRequests) {
      return false;
    }
    this.timestamps.push(now);
    return true;
  }

  getTimeUntilNextSlot(): number {
    if (this.timestamps.length < this.maxRequests) return 0;
    const oldest = this.timestamps[0];
    const wait = this.windowMs - (Date.now() - oldest);
    return Math.max(0, wait);
  }
}

// Rate limiters for critical actions
export const reviewRateLimiter = new RateLimiter(1, 15 * 1000); // 1 review every 15s
export const toiletRateLimiter = new RateLimiter(1, 20 * 1000); // 1 toilet creation every 20s
export const geocodeRateLimiter = new RateLimiter(2, 1000); // Max 2 nominatim requests / sec

/**
 * Cryptographic SHA-256 Hash using Web Crypto API
 */
export async function sha256(plainText: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Default fallback admin passcode hash (SHA-256 for '8888')
const DEFAULT_PASSCODE_HASH = '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731';

/**
 * Brute-force protected Admin Passcode Verification
 */
const ATTEMPTS_KEY = 'poopoo_admin_failed_attempts';
const LOCKOUT_KEY = 'poopoo_admin_lockout_until';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

export interface VerificationResult {
  valid: boolean;
  lockedOut?: boolean;
  remainingSeconds?: number;
  attemptsLeft?: number;
}

export async function verifyAdminPasscode(passcode: string): Promise<VerificationResult> {
  const now = Date.now();
  const lockoutUntil = Number(localStorage.getItem(LOCKOUT_KEY) || 0);

  if (now < lockoutUntil) {
    const remainingSeconds = Math.ceil((lockoutUntil - now) / 1000);
    return { valid: false, lockedOut: true, remainingSeconds };
  }

  const expectedHash = (import.meta.env.VITE_ADMIN_PASSCODE_HASH || DEFAULT_PASSCODE_HASH).toLowerCase();
  const computedHash = await sha256(passcode.trim());

  if (computedHash === expectedHash) {
    // Reset failed counter on success
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
    return { valid: true };
  }

  // Handle failure
  const attempts = Number(localStorage.getItem(ATTEMPTS_KEY) || 0) + 1;
  localStorage.setItem(ATTEMPTS_KEY, String(attempts));

  if (attempts >= MAX_ATTEMPTS) {
    const lockoutTime = now + LOCKOUT_DURATION_MS;
    localStorage.setItem(LOCKOUT_KEY, String(lockoutTime));
    return { valid: false, lockedOut: true, remainingSeconds: Math.ceil(LOCKOUT_DURATION_MS / 1000) };
  }

  return { valid: false, attemptsLeft: MAX_ATTEMPTS - attempts };
}
