interface CacheEntry<T> {
  data: T
  timestamp: number
}

class StorageCache {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private ttlMs: number

  constructor(ttlMs: number = 5 * 60 * 1000) {
    this.ttlMs = ttlMs
  }

  get<T>(key: string): T | null {
    const memEntry = this.memoryCache.get(key)
    if (memEntry) {
      if (Date.now() - memEntry.timestamp < this.ttlMs) {
        return memEntry.data
      }
      this.memoryCache.delete(key)
    }

    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        const entry: CacheEntry<T> = JSON.parse(stored)
        if (Date.now() - entry.timestamp < this.ttlMs) {
          this.memoryCache.set(key, entry)
          return entry.data
        }
      }
    } catch (e) {
      console.warn('Storage cache read failed:', e)
    }

    return null
  }

  set<T>(key: string, data: T): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    }

    this.memoryCache.set(key, entry)
    try {
      localStorage.setItem(key, JSON.stringify(entry))
    } catch (e) {
      console.warn('Storage cache write failed:', e)
    }
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key)
    localStorage.removeItem(key)
  }

  clear(): void {
    this.memoryCache.clear()
  }
}

export const historyCache = new StorageCache(5 * 60 * 1000)
