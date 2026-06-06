export type ValidationMode = "strict" | "observed" | "off";

export function assertFeedV2(data: any, mode: ValidationMode = "observed") {
  if (mode === "off") return true;

  try {
    if (!data?.items || !Array.isArray(data.items)) {
      throw new Error("Invalid FeedV2: missing items[]");
    }

    if (data.items.length > 0) {
      const item = data.items[0];

      if (!item.blocks) {
        throw new Error("Invalid FeedV2: missing blocks");
      }
    }
    
    return true;
  } catch (err) {
    if (mode === "strict") {
      throw err;
    }
    // observed mode
    console.warn("[CONTRACT DRIFT OBSERVED] FeedV2:", err instanceof Error ? err.message : err);
    return false; // Still return false so ATIL can track schema health
  }
}
