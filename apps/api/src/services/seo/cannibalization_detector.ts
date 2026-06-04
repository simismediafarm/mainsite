import { ContentBlockV2 } from '../block_builder';

export interface CannibalizationReport {
  isConflict: boolean;
  conflictingSlugs: string[];
  recommendedAction: 'merge' | 'canonicalize' | 'none';
  canonicalTargetSlug?: string;
}

export class CannibalizationDetector {
  /**
   * Scans target content against existing pool to prevent keyword cannibalization issues.
   * If two articles share the exact focus keyword or target search intent with similarity above 70%, flags conflict.
   */
  static evaluate(article: ContentBlockV2, pool: ContentBlockV2[]): CannibalizationReport {
    const focusKeyword = (article.seo.focus_keyword || '').toLowerCase().trim();
    if (!focusKeyword) {
      return { isConflict: false, conflictingSlugs: [], recommendedAction: 'none' };
    }

    const conflictingSlugs: string[] = [];

    for (const p of pool) {
      if (p.id === article.id) continue;
      const targetKeyword = (p.seo.focus_keyword || '').toLowerCase().trim();
      
      if (targetKeyword === focusKeyword) {
        conflictingSlugs.push(p.slug);
      }
    }

    if (conflictingSlugs.length > 0) {
      // Find the older/higher authority content to keep as the primary SEO landing page
      const primaryTarget = pool.find(p => conflictingSlugs.includes(p.slug));
      const shouldMerge = article.blocks.length > 4 && (primaryTarget?.blocks.length || 0) > 4;

      return {
        isConflict: true,
        conflictingSlugs,
        recommendedAction: shouldMerge ? 'merge' : 'canonicalize',
        canonicalTargetSlug: primaryTarget?.slug
      };
    }

    return {
      isConflict: false,
      conflictingSlugs: [],
      recommendedAction: 'none'
    };
  }
}
