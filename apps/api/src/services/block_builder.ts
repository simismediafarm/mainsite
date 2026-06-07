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
  status: string; // "draft" | "staged" | "ranked" | "published" | "archived"
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
  metadata: Record<string, any>;
  monetization: {
    rules: {
       when: string;
       type: "affiliate" | "ad" | "sponsored_block";
       params: any;
    }[];
  };
  ranking: {
    score: number;
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
  const metadata = row.metadata ?? {};
  const ranking = row.ranking ?? {};
  const monetization = row.monetization ?? {};
  
  // Extract fields from JSONB columns
  const tags = row.taxonomy?.tags ?? metadata.tags ?? metadata.taxonomy?.tags ?? [];
  const category = row.taxonomy?.category ?? metadata.category ?? metadata.taxonomy?.category ?? 'General';
  const topic = row.taxonomy?.topic ?? metadata.topic ?? metadata.taxonomy?.topic ?? 'General';
  const language = row.taxonomy?.language ?? metadata.language ?? metadata.taxonomy?.language ?? 'en';

  const seo = row.seo ?? metadata.seo ?? {};
  const focus_keyword = seo.focus_keyword ?? metadata.focus_keyword ?? '';
  const meta_description = seo.meta_description ?? metadata.meta_description ?? '';
  const schema_type = seo.schema_type ?? metadata.schema_type ?? 'Article';
  
  const economy = ContentEconomyClassifier.evaluate(row.title, tags);
  const search_intent = seo.search_intent ?? metadata.search_intent ?? economy.intent;

  const telemetry = row.telemetry ?? metadata.telemetry ?? {};
  const views = telemetry.views ?? metadata.views ?? 0;
  const clicks = telemetry.clicks ?? metadata.clicks ?? 0;
  const avg_dwell_time = telemetry.avg_dwell_time ?? metadata.avg_dwell_time ?? 0;

  const governance = row.governance ?? metadata.governance ?? {};
  const is_safe = governance.is_safe ?? metadata.is_safe ?? true;
  const fraud_score = governance.fraud_score ?? metadata.fraud_score ?? 0;
  const policy_violations = governance.policy_violations ?? metadata.policy_violations ?? [];

  const delivery = row.delivery ?? metadata.delivery ?? {};
  const format = delivery.format ?? metadata.format ?? economy.format;
  const layout_variant = delivery.layout_variant ?? metadata.layout_variant ?? "standard";
  const render_priority = delivery.render_priority ?? metadata.render_priority ?? 1;

  const execution_lock = row.execution_lock ?? metadata.execution_lock ?? {};
  const is_pinned = execution_lock.is_pinned ?? metadata.is_pinned ?? false;
  const expires_at = execution_lock.expires_at ?? metadata.expires_at ?? null;
  const overridden_by = execution_lock.overridden_by ?? metadata.overridden_by ?? null;

  return {
    id: row.id,
    type: row.type || "article",
    status: row.status || "draft",
    title: row.title,
    slug: row.slug,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    taxonomy: {
      tags,
      category,
      topic,
      language
    },
    seo: {
      focus_keyword,
      search_intent,
      meta_description,
      schema_type
    },
    metadata,
    monetization: {
      rules: monetization.rules ?? []
    },
    ranking: {
      score: Number(ranking.score ?? 0),
      base_score: Number(ranking.base_score ?? 0),
      engagement_score: Number(ranking.engagement_score ?? 0),
      seo_score: Number(ranking.seo_score ?? 0),
      affiliate_score: Number(ranking.affiliate_score ?? 0),
      rpm_score: Number(ranking.rpm_score ?? 0),
      geo_multiplier: Number(ranking.geo_multiplier ?? 1)
    },
    telemetry: {
      views: Number(views),
      clicks: Number(clicks),
      avg_dwell_time: Number(avg_dwell_time)
    },
    governance: {
      is_safe: !!is_safe,
      fraud_score: Number(fraud_score),
      policy_violations
    },
    delivery: {
      format,
      layout_variant,
      render_priority: Number(render_priority)
    },
    execution_lock: {
      is_pinned: !!is_pinned,
      expires_at,
      overridden_by
    },
    trace: {
      poe_hash: row.trace?.poe_hash ?? 'FROZEN_GENESIS_SEAL',
      io_buffer_id: row.trace?.io_buffer_id ?? row.id
    }
  };
}
