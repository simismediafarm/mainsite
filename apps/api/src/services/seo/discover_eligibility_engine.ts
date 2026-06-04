import { ContentBlockV2 } from '../block_builder';

export interface DiscoverEligibilityReport {
  isEligible: boolean;
  discoverProbability: number;
  imageQuality: number;
  freshness: number;
  entityStrength: number;
  suggestions: string[];
}

export class DiscoverEligibilityEngine {
  /**
   * Assesses a ContentBlockV2 for Google Discover placement suitability.
   * Checks key Discover compliance parameters: high-res image, emotional CTR hook, entity diversity, age decay.
   */
  static evaluate(block: ContentBlockV2): DiscoverEligibilityReport {
    const suggestions: string[] = [];
    let isEligible = true;

    // 1. Image Quality (Discover requires high-res images, minimum width > 1200px or specific CDN anchors)
    const images = block.blocks.filter(b => b.type === 'image');
    let imageQuality = 0.0;
    if (images.length > 0) {
      const mainImage = images[0].content;
      const url = mainImage?.url || '';
      // Simulate validation (look for quality indicator or fallback)
      if (url.includes('quality=') || url.includes('w=1200') || url.includes('width=1200')) {
        imageQuality = 0.95;
      } else {
        imageQuality = 0.65; // Image present but could be low-res
        suggestions.push('DISCOVER: Ensure the primary hero image is high-resolution (min 1200px wide).');
      }
    } else {
      imageQuality = 0.0;
      isEligible = false; // Hard blocked for Discover if no image is present
      suggestions.push('DISCOVER: Google Discover absolutely requires at least one rich image representation.');
    }

    // 2. Freshness Decay (Discover feeds prioritize fresh updates <= 72 hours)
    const publishedAt = block.execution_lock.expires_at ? new Date(block.execution_lock.expires_at) : new Date();
    const hoursSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
    const freshness = Math.max(0.0, Math.exp(-0.015 * hoursSincePublished)); // Steep freshness decay for Discover

    if (hoursSincePublished > 72) {
      suggestions.push('DISCOVER_WARNING: Content age exceeds 72 hours, reducing Discover propagation probability.');
    }

    // 3. Entity Strength (Density of proper noun entities in content tags)
    const tagCount = block.taxonomy.tags.length;
    const entityStrength = tagCount >= 5 ? 0.90 : (tagCount >= 2 ? 0.60 : 0.30);
    if (tagCount < 3) {
      suggestions.push('DISCOVER: Add more specific entity tags (e.g. brand names, locations, specific technologies) to align with Google Knowledge Graph.');
    }

    // 4. Emotional CTR Title Hook
    const title = block.title.toLowerCase();
    const clickHooks = ['why', 'how to', 'revealed', 'best', 'hacks', 'secrets', 'ultimate', 'warning', 'don\'t miss'];
    const hasHook = clickHooks.some(hook => title.includes(hook));
    const titleScore = hasHook ? 0.90 : 0.50;
    if (!hasHook) {
      suggestions.push('DISCOVER: Consider adding informational/emotional hooks (Why, How to, Best) to improve organic CTR.');
    }

    // Overall Discover Entry Probability Formula
    const discoverProbability = isEligible 
      ? Number(((imageQuality * 0.35) + (freshness * 0.35) + (entityStrength * 0.15) + (titleScore * 0.15)).toFixed(4))
      : 0.0;

    return {
      isEligible,
      discoverProbability,
      imageQuality,
      freshness,
      entityStrength,
      suggestions
    };
  }
}
