// In-memory cache for leaderboard responses. Keyed by request string, TTL 2 min.
// Shared across all leaderboard types so switching tabs never re-hits the API
// within the window.

const TTL_MS = 2 * 60 * 1000;
const cache = new Map();

export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCached(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

export function invalidateAuraCache() {
  for (const key of cache.keys()) {
    if (key.startsWith("aura:")) cache.delete(key);
  }
}
