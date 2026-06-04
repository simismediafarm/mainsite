/**
 * governance.ts — Legal Compliance, Link Sanitization, and Role-Based Authorization
 */

export type Role =
  | "guest"
  | "reader"
  | "creator"
  | "editor"
  | "moderator"
  | "admin"
  | "system";

export type Action =
  | "view_feed"
  | "create_content"
  | "edit_content"
  | "publish_content"
  | "override_ranking"
  | "delete_content"
  | "monetization_config";

// Enforce strictly defined Role Access Matrix
const ROLE_ACCESS_MATRIX: Record<Role, Action[]> = {
  guest: ["view_feed"],
  reader: ["view_feed"],
  creator: ["view_feed", "create_content"],
  editor: ["view_feed", "create_content", "edit_content", "publish_content"],
  moderator: ["view_feed", "create_content", "edit_content", "publish_content", "override_ranking", "delete_content"],
  admin: ["view_feed", "create_content", "edit_content", "publish_content", "override_ranking", "delete_content", "monetization_config"],
  system: ["view_feed", "create_content", "edit_content", "publish_content", "override_ranking", "delete_content", "monetization_config"]
};

/**
 * Checks if a role has access to perform an action
 */
export function hasPermission(role: Role, action: Action): boolean {
  const allowedActions = ROLE_ACCESS_MATRIX[role] ?? [];
  return allowedActions.includes(action);
}

/**
 * Compliance check: Sanitizes external affiliate links
 */
export function sanitizeAffiliateLink(link: string): string {
  try {
    const url = new URL(link);
    
    // Amazon tag validation
    if (url.hostname.includes('amazon.')) {
      const tag = process.env.AFFILIATE_AMAZON_KEY ?? 'simismedia-20';
      url.searchParams.set('tag', tag);
    }
    
    // Shopee tag validation
    if (url.hostname.includes('shopee.')) {
      const shopeeId = process.env.AFFILIATE_SHOPEE_KEY ?? 'simis';
      url.searchParams.set('sub_id', shopeeId);
    }

    // Tokopedia affiliate mapping
    if (url.hostname.includes('tokopedia.')) {
      const tokoId = process.env.AFFILIATE_TOKOPEDIA_KEY ?? 'simis';
      url.searchParams.set('aff_id', tokoId);
    }

    return url.toString();
  } catch {
    // Return direct link if parsing fails
    return link;
  }
}

/**
 * Validates data ownership and legal attribution constraints prior to publishing
 */
export function validateContentCompliance(content: {
  title: string;
  metadata: { author?: string; source_type?: string };
  monetization?: { affiliate_links?: string[] };
}): { valid: boolean; error?: string } {
  // Hard gate check 1: Title completeness
  if (!content.title || content.title.trim().length < 5) {
    return { valid: false, error: 'COMPLIANCE VIOLATION: Title is missing or too short.' };
  }

  // Hard gate check 2: Author attribution
  if (!content.metadata?.author) {
    return { valid: false, error: 'COMPLIANCE VIOLATION: Author attribution metadata is mandatory.' };
  }

  // Hard gate check 3: Legality tag for scraping origin
  if (content.metadata?.source_type === 'scraped' && !content.metadata?.author) {
    return { valid: false, error: 'COMPLIANCE VIOLATION: Scraped content requires original publisher attribution.' };
  }

  return { valid: true };
}
