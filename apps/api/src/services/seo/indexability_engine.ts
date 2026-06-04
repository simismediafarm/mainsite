import { ContentBlockV2 } from '../block_builder';

export class IndexabilityEngine {
  /**
   * Validates if a content block has correct indexation declarations (meta robots, canonicals, schema data).
   */
  static validate(block: ContentBlockV2): { isIndexable: boolean; violations: string[]; schemaJsonLd: string } {
    const violations: string[] = [];
    let isIndexable = true;

    // 1. Meta Robots Audit (Ensure noindex policies aren't accidentally present)
    if (block.metadata.robots_noindex === true || String(block.metadata.robots || '').includes('noindex')) {
      violations.push('METADATA_WARNING: Block is explicitly set to noindex.');
      isIndexable = false;
    }

    // 2. Canonical Enforcement
    const canonical = block.metadata.canonical_url;
    if (!canonical) {
      violations.push('SEO_VIOLATION: Missing canonical URL definition.');
    } else if (!canonical.startsWith('/') && !canonical.startsWith('http')) {
      violations.push('SEO_VIOLATION: Canonical URL path is malformed.');
    }

    // 3. Schema DTS Verification (JSON-LD validation placeholder generator)
    const schemaType = block.seo.schema_type || 'Article';
    const schemaData: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": schemaType,
      "headline": block.title,
      "description": block.seo.meta_description || block.title,
      "datePublished": block.execution_lock.expires_at || new Date().toISOString(),
      "url": `https://simis.media/read/${block.slug}`
    };

    if (schemaType === 'Article') {
      schemaData["author"] = {
        "@type": "Person",
        "name": block.metadata.author_name || "SIMIS Editorial Team"
      };
      schemaData["publisher"] = {
        "@type": "Organization",
        "name": "SIMIS Media",
        "logo": {
          "@type": "ImageObject",
          "url": "https://simis.media/assets/logo.png"
        }
      };
    } else if (schemaType === 'Product') {
      schemaData["offers"] = {
        "@type": "AggregateOffer",
        "priceCurrency": "USD",
        "lowPrice": block.metadata.price_floor || 29.99,
        "offerCount": 1
      };
    }

    const schemaJsonLd = JSON.stringify(schemaData, null, 2);

    // 4. Ingestion Integrity check
    if (block.title.length < 10) {
      violations.push('COMPLIANCE_ERROR: Title too thin for search ranking (min 10 chars).');
      isIndexable = false;
    }

    return {
      isIndexable,
      violations,
      schemaJsonLd
    };
  }
}
