export interface CacheEntry {
  headers: Record<string, string>;
  body: string;
}

export interface CdnProviderPort {
  /**
   * Idempotent purge. Should not throw if the tag does not exist or has already been purged.
   * @param tag The Cache-Tag or Surrogate-Key to purge
   */
  purge(tag: string): Promise<void>;

  /**
   * Multi-region purge returning a detailed status receipt of success vs failed edges.
   */
  purgeWithReceipt?(tag: string, targetEdges: string[]): Promise<{ successEdges: string[], failedEdges: string[] }>;


  /**
   * Retrieves an item from the CDN proxy cache.
   * Return null if cache miss.
   * @param key The absolute URL or cache key
   */
  get(key: string): Promise<CacheEntry | null>;

  /**
   * Sets an item into the CDN proxy cache.
   */
  set(key: string, entry: CacheEntry, tags: string[]): Promise<void>;
}
