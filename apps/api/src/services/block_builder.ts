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
  metadata: {
    tags: string[];
    category: string;
    language: string;
    author: string;
    source_type: string;
    created_at: string;
    updated_at: string;
  };
  ranking: {
    score: number;
    freshness: number;
    authority: number;
    engagement_prediction: number;
    monetization_weight: number;
  };
  monetization: {
    affiliate_links?: string[];
    sponsor_slots?: number;
  };
  trace: {
    poe_hash: string;
    io_buffer_id: string;
  };
}

/**
 * Builds ContentBlockV2 from raw database content_blocks_v2 row
 */
export function buildContentBlock(row: any): ContentBlockV2 {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    slug: row.slug,
    blocks: Array.isArray(row.blocks) ? row.blocks : [],
    metadata: {
      tags: row.metadata?.tags ?? [],
      category: row.metadata?.category ?? 'General',
      language: row.metadata?.language ?? 'en',
      author: row.metadata?.author ?? 'system',
      source_type: row.metadata?.source_type ?? 'kernel',
      created_at: row.created_at ?? new Date().toISOString(),
      updated_at: row.updated_at ?? new Date().toISOString()
    },
    ranking: {
      score: Number(row.ranking?.score ?? 0),
      freshness: Number(row.ranking?.freshness ?? 0),
      authority: Number(row.ranking?.authority ?? 0),
      engagement_prediction: Number(row.ranking?.engagement_prediction ?? 0),
      monetization_weight: Number(row.ranking?.monetization_weight ?? 0)
    },
    monetization: {
      affiliate_links: row.monetization?.affiliate_links ?? [],
      sponsor_slots: row.monetization?.sponsor_slots ?? 0
    },
    trace: {
      poe_hash: row.trace?.poe_hash ?? 'FROZEN_GENESIS_SEAL',
      io_buffer_id: row.trace?.io_buffer_id ?? row.id
    }
  };
}
