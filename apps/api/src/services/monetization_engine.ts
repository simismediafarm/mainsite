import { Post } from '@simis/shared';

export type MonetizationSlot = 'top_banner' | 'inline_native' | 'mid_article' | 'end_card';

export interface MonetizationDecision {
  allowedSlots: MonetizationSlot[];
  reasoning: string[];
}

export class MonetizationEngine {
  /**
   * Rule-based decision system for monetization slots.
   */
  public static evaluate(post: Post): MonetizationDecision {
    const slots: Set<MonetizationSlot> = new Set();
    const reasoning: string[] = [];

    // Rule 1: Trust Gate (Unified to 0-100 scale)
    const trust = post.trustScore ?? 50;
    if (trust < 40) {
      reasoning.push(`Trust score ${trust} < 40: Monetization disabled.`);
      return { allowedSlots: [], reasoning };
    }

    if (trust >= 40 && trust < 70) {
      reasoning.push(`Trust score ${trust} between 40 and 70: Limited slots (end_card only).`);
      slots.add('end_card');
    }

    if (trust >= 70) {
      reasoning.push(`Trust score ${trust} >= 70: Full slot eligibility.`);
      slots.add('top_banner');
      slots.add('end_card');
      slots.add('mid_article');
    }

    // Rule 2: Content Category / Source match
    if (post.sourceType === 'rss') {
      reasoning.push('Source is RSS: Restricting mid_article to preserve reading experience.');
      slots.delete('mid_article');
    }

    // Rule 3: Engagement Threshold
    if (post.views > 100 || post.likes > 10) {
      reasoning.push('High engagement detected: Adding inline_native slot.');
      slots.add('inline_native');
    }

    // Rule 4: Content Length constraints (mock: length > 500 chars for mid_article)
    if (post.content.length < 500) {
      reasoning.push('Content too short (< 500 chars): Removing mid_article slot.');
      slots.delete('mid_article');
    }

    return {
      allowedSlots: Array.from(slots),
      reasoning
    };
  }
}
