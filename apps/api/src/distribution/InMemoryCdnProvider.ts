import { CdnProviderPort, CacheEntry } from "./CdnProviderPort";

export class InMemoryCdnProvider implements CdnProviderPort {
  // Maps a key (like URL or route) to a CacheEntry
  private cache: Map<string, CacheEntry> = new Map();
  
  // Maps a tag to a set of keys
  private tagMap: Map<string, Set<string>> = new Map();

  async purge(tag: string): Promise<void> {
    const keys = this.tagMap.get(tag);
    if (!keys) {
      // Idempotent: safe to retry, if no keys exist for the tag, we do nothing.
      return;
    }

    for (const key of keys) {
      this.cache.delete(key);
    }
    
    // Clear the tag map
    this.tagMap.delete(tag);
  }

  async get(key: string): Promise<CacheEntry | null> {
    return this.cache.get(key) || null;
  }

  async set(key: string, entry: CacheEntry, tags: string[]): Promise<void> {
    this.cache.set(key, entry);

    for (const tag of tags) {
      if (!this.tagMap.has(tag)) {
        this.tagMap.set(tag, new Set());
      }
      this.tagMap.get(tag)!.add(key);
    }
  }

  // Helper for testing
  clear() {
    this.cache.clear();
    this.tagMap.clear();
  }
}
