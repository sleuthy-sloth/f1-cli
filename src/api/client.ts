const BASE_URL = 'https://api.openf1.org/v1';

// Simple in-memory cache with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_CACHE_TTL_MS = 30_000; // 30 seconds

// Rate limiting: max ~7 requests per second to stay well under any limits
const requestTimestamps: number[] = [];

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlMs: number = DEFAULT_CACHE_TTL_MS): void {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function rateLimit(): Promise<void> {
  const now = Date.now();
  // Remove timestamps older than 1 second
  while (requestTimestamps.length > 0 && requestTimestamps[0] < now - 1000) {
    requestTimestamps.shift();
  }

  if (requestTimestamps.length >= 8) {
    // Wait until we can send another request
    const waitMs = requestTimestamps[0] + 1000 - now + 50;
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }

  requestTimestamps.push(Date.now());
}

async function fetchJson<T>(url: string, cacheKey: string, cacheTtlMs?: number): Promise<T> {
  const cached = getCached<T>(cacheKey);
  if (cached !== null) return cached;

  await rateLimit();

  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('No data found for the requested parameters.');
    }
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as T;
  setCache(cacheKey, data, cacheTtlMs);
  return data;
}

// Build query string from params, skipping undefined values
function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ''
  );
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&');
}

export interface MeetingsParams {
  year?: number;
  meeting_key?: number | 'latest';
}

export interface SessionsParams {
  meeting_key?: number | 'latest';
  session_key?: number | 'latest';
  year?: number;
  session_type?: string;
}

export interface SessionResultParams {
  session_key?: number | 'latest';
  meeting_key?: number | 'latest';
}

export interface DriversParams {
  session_key?: number | 'latest';
  meeting_key?: number | 'latest';
}

export const api = {
  getMeetings(params: MeetingsParams = {}) {
    const qs = buildQuery({
      year: params.year,
      meeting_key: params.meeting_key,
    });
    const url = `${BASE_URL}/meetings${qs}`;
    return fetchJson<import('./types.js').Meeting[]>(url, url, 60_000); // cache meetings for 60s
  },

  getSessions(params: SessionsParams = {}) {
    const qs = buildQuery({
      meeting_key: params.meeting_key,
      session_key: params.session_key,
      year: params.year,
      session_type: params.session_type,
    });
    const url = `${BASE_URL}/sessions${qs}`;
    return fetchJson<import('./types.js').Session[]>(url, url, 30_000);
  },

  getSessionResults(params: SessionResultParams = {}) {
    const qs = buildQuery({
      session_key: params.session_key,
      meeting_key: params.meeting_key,
    });
    const url = `${BASE_URL}/session_result${qs}`;
    return fetchJson<import('./types.js').SessionResult[]>(url, url, 30_000);
  },

  getDrivers(params: DriversParams = {}) {
    const qs = buildQuery({
      session_key: params.session_key,
      meeting_key: params.meeting_key,
    });
    const url = `${BASE_URL}/drivers${qs}`;
    return fetchJson<import('./types.js').Driver[]>(url, url, 60_000);
  },

  getChampionshipDrivers(params: { session_key?: number | 'latest'; meeting_key?: number | 'latest' } = {}) {
    const qs = buildQuery({
      session_key: params.session_key,
      meeting_key: params.meeting_key,
    });
    const url = `${BASE_URL}/championship_drivers${qs}`;
    return fetchJson<import('./types.js').ChampionshipDriver[]>(url, url, 30_000);
  },

  getChampionshipTeams(params: { session_key?: number | 'latest'; meeting_key?: number | 'latest' } = {}) {
    const qs = buildQuery({
      session_key: params.session_key,
      meeting_key: params.meeting_key,
    });
    const url = `${BASE_URL}/championship_teams${qs}`;
    return fetchJson<import('./types.js').ChampionshipTeam[]>(url, url, 30_000);
  },
};

// Clear cache (useful in testing)
export function clearCache(): void {
  cache.clear();
}
