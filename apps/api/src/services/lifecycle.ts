/**
 * lifecycle.ts — Content Lifecycle State Machine & Time-to-Live (TTL) Policies
 */

export type ContentState =
  | "draft"
  | "staged"
  | "ranked"
  | "published"
  | "archived";

// Strict state transition map
const VALID_TRANSITIONS: Record<ContentState, ContentState[]> = {
  draft: ["staged", "archived"],
  staged: ["ranked", "draft", "archived"],
  ranked: ["published", "staged", "archived"],
  published: ["archived", "ranked"],
  archived: ["draft"] // Can be restored to draft
};

/**
 * Validates if transition from current to target state is allowed
 */
export function isValidTransition(from: ContentState, to: ContentState): boolean {
  const allowed = VALID_TRANSITIONS[from] ?? [];
  return allowed.includes(to);
}

/**
 * Evaluates TTL age policies for published content.
 * Content decays and should be archived if its dynamic score falls below threshold
 * and it has been published longer than the max lifespan.
 */
export function evaluateAgeTtl(content: {
  status: string;
  created_at: string;
  score: number;
}): { shouldArchive: boolean; reason?: string } {
  if (content.status !== 'published') {
    return { shouldArchive: false };
  }

  const createdTime = new Date(content.created_at).getTime();
  const now = Date.now();
  const diffDays = (now - createdTime) / (1000 * 60 * 60 * 24);

  // Lifespan limits (e.g. 180 days default max for transient scraped news)
  if (diffDays > 180 && content.score < 0.2) {
    return { shouldArchive: true, reason: 'TTL EXPIRED: Content age exceeded 180 days with a low ranking score.' };
  }

  // Hard limit for outdated deals (hot deals decay in 14 days)
  if (diffDays > 14 && content.score < 0.1) {
    return { shouldArchive: true, reason: 'TTL EXPIRED: Affiliate deal active for over 14 days and score degraded.' };
  }

  return { shouldArchive: false };
}
