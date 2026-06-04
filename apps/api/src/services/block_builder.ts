/**
 * block_builder.ts — Normalizes database records into the unified ContentBlockV2 schema.
 */

export interface Block {
  type: "paragraph" | "image" | "quote" | "product" | "embed" | "divider";
  content: any;
}

export interface AffiliateBlock {
  title: string;
  url: string;
  price: number;
  original_price?: number;
  discount_percentage?: number;
  image_url?: string;
  provider: string;
}

export interface ContentBlockV2 {
  id: string;
  type: "article" | "affiliate" | "scraped" | "ai_generated" | "comparison";
  title: string;
  slug: string;
  blocks: Block[];
  taxonomy: {
    tags: string[];
    category: string;
    topic: string;
    language: string;
  };
  seo: {
    focus_keyword: string;
    search_intent: "informational" | "commercial" | "transactional" | "navigational";
    meta_description: string;
    schema_type: "Article" | "Product" | "Review" | "ItemPage";
  };
  monetization: {
    rules: {
       when: string;
       type: "affiliate" | "ad" | "sponsored_block";
       params: any;
    }[];
  };
  ranking: {
    base_score: number;
    engagement_score: number;
    seo_score: number;
    affiliate_score: number;
    rpm_score: number;
    geo_multiplier?: number;
  };
  resolved_slots?: Record<string, string>; // Pre-compiled monetization placements
  telemetry: {
    views: number;
    clicks: number;
    avg_dwell_time: number;
  };
  governance: {
    is_safe: boolean;
    fraud_score: number;
    policy_violations: string[];
  };
  delivery: {
    format: "article" | "deal" | "comparison" | "feed_card";
    layout_variant: "standard" | "seo_boosted" | "affiliate_heavy" | "minimal";
    render_priority: number;
  };
  execution_lock: {
    is_pinned: boolean;
    expires_at: string | null;
    overridden_by: string | null;
  };
  trace: {
    poe_hash: string;
    io_buffer_id: string;
  };
}

/**
 * Heuristic classifier to determine intent and default properties
 */
export class ContentEconomyClassifier {
  static evaluate(title: string, tags: string[] = []): { intent: ContentBlockV2["seo"]["search_intent"], format: ContentBlockV2["delivery"]["format"] } {
    const txt = `${title} ${tags.join(" ")}`.toLowerCase();
    
    if (txt.includes("best") || txt.includes("vs") || txt.includes("review") || txt.includes("compare")) {
      return { intent: "commercial", format: "comparison" };
    }
    if (txt.includes("deal") || txt.includes("discount") || txt.includes("promo") || txt.includes("price")) {
      return { intent: "transactional", format: "deal" };
    }
    return { intent: "informational", format: "article" };
  }
}

/**
 * Builds ContentBlockV2 from raw database content_blocks_v2 row
 */
export function buildContentBlock(row: any): ContentBlockV2 {
  const economy = ContentEconomyClassifier.evaluate(row.title, row.taxonomy?.tags);
  
  return {
    id: row.id,
    type: row.type || "article",
    title: row.title,
    slug: row.slug,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    taxonomy: {
      tags: row.taxonomy?.tags ?? [],
      category: row.taxonomy?.category ?? 'General',
      topic: row.taxonomy?.topic ?? 'General',
      language: row.taxonomy?.language ?? 'en'
    },
    seo: {
      focus_keyword: row.seo?.focus_keyword ?? '',
      search_intent: row.seo?.search_intent ?? economy.intent,
      meta_description: row.seo?.meta_description ?? '',
      schema_type: row.seo?.schema_type ?? 'Article'
    },
    monetization: {
      rules: row.monetization?.rules ?? []
    },
    ranking: {
      base_score: Number(row.ranking?.base_score ?? 0),
      engagement_score: Number(row.ranking?.engagement_score ?? 0),
      seo_score: Number(row.ranking?.seo_score ?? 0),
      affiliate_score: Number(row.ranking?.affiliate_score ?? 0),
      rpm_score: Number(row.ranking?.rpm_score ?? 0),
      geo_multiplier: Number(row.ranking?.geo_multiplier ?? 1)
    },
    telemetry: {
      views: Number(row.telemetry?.views ?? 0),
      clicks: Number(row.telemetry?.clicks ?? 0),
      avg_dwell_time: Number(row.telemetry?.avg_dwell_time ?? 0)
    },
    governance: {
      is_safe: row.governance?.is_safe ?? true,
      fraud_score: Number(row.governance?.fraud_score ?? 0),
      policy_violations: row.governance?.policy_violations ?? []
    },
    delivery: {
      format: row.delivery?.format ?? economy.format,
      layout_variant: row.delivery?.layout_variant ?? "standard",
      render_priority: Number(row.delivery?.render_priority ?? 1)
    },
    execution_lock: {
      is_pinned: row.execution_lock?.is_pinned ?? false,
      expires_at: row.execution_lock?.expires_at ?? null,
      overridden_by: row.execution_lock?.overridden_by ?? null
    },
    trace: {
      poe_hash: row.trace?.poe_hash ?? 'FROZEN_GENESIS_SEAL',
      io_buffer_id: row.trace?.io_buffer_id ?? row.id
    }
  };
}
