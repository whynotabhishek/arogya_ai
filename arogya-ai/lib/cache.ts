// ──────────────────────────────────────────────────────────
// In-memory response cache for common symptom queries
// ──────────────────────────────────────────────────────────

import crypto from "crypto";

interface CachedResponse {
    data: Record<string, unknown>;
    expiresAt: number;
}

const cache = new Map<string, CachedResponse>();
const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Create a deterministic cache key from symptom + language.
 */
export function cacheKey(message: string, language: string): string {
    const normalized = message.toLowerCase().trim().replace(/\s+/g, " ");
    return crypto.createHash("md5").update(`${language}::${normalized}`).digest("hex");
}

/**
 * Get a cached response if it exists and hasn't expired.
 */
export function getCached(key: string): Record<string, unknown> | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

/**
 * Store a response in the cache.
 */
export function setCache(key: string, data: Record<string, unknown>, ttlMs = DEFAULT_TTL_MS): void {
    // Cap cache at 200 entries to prevent memory leaks
    if (cache.size > 200) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * Wrap a promise with a timeout. Returns fallback if it times out.
 */
export async function withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    fallback?: T,
): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => {
                if (fallback !== undefined) {
                    // Resolve with fallback instead of rejecting
                    ((_ as unknown) as (v: T) => void)?.(fallback);
                }
                reject(new Error(`Timeout after ${ms}ms`));
            }, ms),
        ),
    ]);
}

/**
 * Retry a function with exponential backoff.
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    retries = 2,
    baseDelayMs = 500,
): Promise<T> {
    let lastError: Error | null = null;
    for (let i = 0; i <= retries; i++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e instanceof Error ? e : new Error(String(e));
            if (i < retries) {
                await new Promise((r) => setTimeout(r, baseDelayMs * (i + 1)));
            }
        }
    }
    throw lastError ?? new Error("Max retries reached");
}
