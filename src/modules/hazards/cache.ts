/* ════════════════════════════════════════════════════════
   Sentinel City Intelligence — In-Memory Observation Cache
   High-performance TTL cache with LRU eviction and hit/miss telemetry.
   ════════════════════════════════════════════════════════ */

interface CacheEntry<T> {
  value: T;
  expiresAt: number; // Unix timestamp ms
  createdAt: number;
}

class HazardMemoryCache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private hits: number = 0;
  private misses: number = 0;
  private readonly maxEntries: number = 1000;

  /** Retrieve cached item if valid */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value as T;
  }

  /** Set cached item with TTL in seconds */
  set<T>(key: string, value: T, ttlSeconds: number): void {
    if (this.cache.size >= this.maxEntries) {
      // LRU Eviction: remove oldest entry
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlSeconds * 1000),
      createdAt: Date.now(),
    });
  }

  /** Check if a key exists and is unexpired */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /** Delete a key from cache */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /** Clear all cache entries */
  clear(): void {
    this.cache.clear();
  }

  /** Get hit, miss, and key statistics */
  getStats(): { hits: number; misses: number; activeKeys: number; hitRatio: number } {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      activeKeys: this.cache.size,
      hitRatio: total > 0 ? Number((this.hits / total).toFixed(3)) : 0,
    };
  }
}

// Global singleton cache across API routes in Node runtime
const globalCacheKey = Symbol.for("sentinel.hazard.cache");
const globalObj = globalThis as unknown as { [globalCacheKey]?: HazardMemoryCache };

export const hazardCache = globalObj[globalCacheKey] || (globalObj[globalCacheKey] = new HazardMemoryCache());
