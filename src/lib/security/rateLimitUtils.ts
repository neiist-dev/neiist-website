interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

const store = new Map<string, number[]>();

const CLEANUP_THRESHOLD = 5000;
const STALE_AFTER_MS = 60 * 60 * 1000;

function maybeCleanup(now: number) {
  if (store.size < CLEANUP_THRESHOLD) return;
  for (const [key, timestamps] of store.entries()) {
    if (timestamps.length === 0 || now - timestamps[timestamps.length - 1] > STALE_AFTER_MS) {
      store.delete(key);
    }
  }
}

export function rateLimit(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  maybeCleanup(now);

  const timestamps = (store.get(identifier) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= limit) {
    return { success: false, remaining: 0, reset: timestamps[0] + windowMs };
  }

  timestamps.push(now);
  store.set(identifier, timestamps);

  return { success: true, remaining: limit - timestamps.length, reset: timestamps[0] + windowMs };
}
