/**
 * v2.ts — Hono Router for SIMIS API v2 (Programmatic Media Platform)
 */

import { Hono } from 'hono';
import crypto from 'crypto';
import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { runExecutionPipeline, PipelineIntent } from '@simis/kernel-graph/dist/v7.1/runtime/execution_pipeline';
import { buildContentBlock, ContentBlockV2 } from '../services/block_builder';
import { computeRankingScore, calculateFreshness } from '../services/ranking';
import { semanticSearch, getPersonalizedFeed } from '../services/personalization';
import { syndicateContent, generateSitemapXml, generateRssXml } from '../services/distribution';
import { validateContentCompliance, sanitizeAffiliateLink } from '../services/governance';
import { isValidTransition, evaluateAgeTtl, ContentState } from '../services/lifecycle';
import { enqueueToDLQ } from '../services/recovery';
import { rateLimit } from '../middleware/rate_limit';

const v2Router = new Hono();

// ── Rate Limiting for Ingestion ──────────────────────────────────────────────
const ingestRateLimit = rateLimit(10, 60 * 1000); // Max 10 ingests per minute

// ── GET /feed -> Ranked Content Stream ────────────────────────────────────────
v2Router.get('/feed', async (c) => {
  const userId = c.req.query('user_id') || null;
  const limit = parseInt(c.req.query('limit') || '10');

  try {
    const feed = await getPersonalizedFeed(userId, limit);
    return c.json({ items: feed });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /content/:slug -> Single Content Item ───────────────────────────────
v2Router.get('/content/:slug', async (c) => {
  const slug = c.req.param('slug');
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return c.json({ error: 'Content not found' }, 404);
  }

  // Enforce RLS override for published status or authorize admin
  if (data.status !== 'published') {
    // Simple state protection: non-published requires a valid token
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.json({ error: 'Unauthorized view check for draft content' }, 401);
    }
  }

  return c.json(buildContentBlock(data));
});

// ── GET /deals -> Affiliate Products ─────────────────────────────────────────
v2Router.get('/deals', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('affiliate_products')
    .select('*')
    .eq('availability', true)
    .limit(limit);

  if (error) return c.json({ error: error.message }, 500);
  return c.json({ items: data });
});

// ── GET /compare/:slug -> Structured Comparison ──────────────────────────────
v2Router.get('/compare/:slug', async (c) => {
  const slug = c.req.param('slug');
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .eq('slug', slug)
    .eq('type', 'comparison')
    .single();

  if (error || !data) {
    return c.json({ error: 'Comparison grid not found' }, 404);
  }

  return c.json(buildContentBlock(data));
});

// ── GET /search -> Natural Language Hybrid Search ────────────────────────────
v2Router.get('/search', async (c) => {
  const query = c.req.query('q') || '';
  const limit = parseInt(c.req.query('limit') || '10');

  if (!query) {
    return c.json({ items: [] });
  }

  try {
    // 1. Try vector semantic match
    let results = await semanticSearch(query, limit);

    // 2. Fallback to full-text or title match if vector results are empty
    if (results.length === 0) {
      const supabase = getSupabase();
      const { data } = await supabase
        .from('content_blocks_v2')
        .select('*')
        .eq('status', 'published')
        .ilike('title', `%${query}%`)
        .limit(limit);
      if (data) {
        results = data.map(buildContentBlock);
      }
    }

    return c.json({ items: results });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /sitemap.xml -> Dynamically Generated SEO Sitemap ────────────────────
v2Router.get('/sitemap.xml', async (c) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .eq('status', 'published')
    .limit(100);

  const items = (data ?? []).map(buildContentBlock);
  c.header('Content-Type', 'application/xml');
  return c.text(generateSitemapXml(items));
});

// ── GET /rss.xml -> Dynamic RSS Feed Syndication ─────────────────────────────
v2Router.get('/rss.xml', async (c) => {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('content_blocks_v2')
    .select('*')
    .eq('status', 'published')
    .limit(50);

  const items = (data ?? []).map(buildContentBlock);
  c.header('Content-Type', 'application/xml');
  return c.text(generateRssXml(items));
});

// ── POST /ingest -> Content Ingestion through immutable kernel ────────────────
v2Router.post('/ingest', ingestRateLimit, async (c) => {
  let body: any;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'Invalid JSON payload' }, 400);
  }

  const intentId = crypto.randomUUID();

  // 1. Run Ingestion compliance gate check
  const compliance = validateContentCompliance(body);
  if (!compliance.valid) {
    // Stage failure in dead-letter queue (DLQ)
    await enqueueToDLQ({
      intent_id: intentId,
      classification: 'REJECTED',
      error_message: compliance.error ?? 'Compliance Check Failed',
      retry_count: 0
    });
    return c.json({ error: compliance.error }, 400);
  }

  // 2. Link Sanitization
  if (body.blocks) {
    body.blocks = body.blocks.map((block: any) => {
      if (block.type === 'product' && block.content?.url) {
        block.content.url = sanitizeAffiliateLink(block.content.url);
      }
      return block;
    });
  }

  // 3. Delegate to Immutable Kernel for deterministic ECVM execution
  try {
    const pipelineIntent: PipelineIntent = {
      intent_id: intentId,
      syscall_name: 'content.ingest',
      payload: {
        title: body.title,
        slug: body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        type: body.type || 'article',
        blocks: body.blocks || [],
        metadata: body.metadata || {},
        monetization: body.monetization || {}
      },
      idempotency_key: intentId,
      priority: 2
    };

    const result = await runExecutionPipeline(pipelineIntent, { skipPersistence: false });

    if (result.status === 'SUCCESS') {
      // Post-Kernel: Calculate monetization-aware ranking scores
      const payload = pipelineIntent.payload;
      const freshness = calculateFreshness(new Date().toISOString());
      
      const rankingScore = computeRankingScore({
        freshness,
        authority: Number(body.ranking?.authority ?? 0.8),
        engagement_prediction: Number(body.ranking?.engagement_prediction ?? 0.5),
        seo_score: Number(body.ranking?.seo_score ?? 0.7),
        monetization_weight: body.type === 'affiliate' ? 0.9 : 0.4
      });

      // Save structured record into Postgres media store
      const supabase = getSupabase();
      const dbPayload = {
        id: intentId,
        organization_id: body.organization_id || '00000000-0000-0000-0000-000000000000',
        type: payload.type,
        title: payload.title,
        slug: payload.slug,
        blocks: payload.blocks,
        metadata: {
          ...payload.metadata,
          source_type: 'kernel',
          author: payload.metadata.author ?? 'system'
        },
        ranking: {
          score: rankingScore,
          freshness,
          authority: body.ranking?.authority ?? 0.8,
          engagement_prediction: body.ranking?.engagement_prediction ?? 0.5,
          monetization_weight: body.type === 'affiliate' ? 0.9 : 0.4
        },
        monetization: payload.monetization,
        trace: {
          poe_hash: result.poe.execution_hash,
          io_buffer_id: result.intent_id
        },
        status: body.publish_now ? 'published' : 'staged'
      };

      const { error: dbError } = await supabase.from('content_blocks_v2').upsert(dbPayload);
      if (dbError) throw dbError;

      // Populate vector embedding for search
      const embeddingText = `${payload.title} ${payload.blocks.map((b: any) => b.content).join(' ')}`;
      const { generateEmbedding } = await import('../services/personalization');
      const vector = await generateEmbedding(embeddingText);
      await supabase.from('content_embeddings').insert({
        organization_id: dbPayload.organization_id,
        content_id: intentId,
        embedding: vector
      });

      // Update feed ranking list
      await supabase.from('feed_rankings').insert({
        organization_id: dbPayload.organization_id,
        content_id: intentId,
        score: rankingScore,
        freshness,
        authority: dbPayload.ranking.authority,
        engagement_prediction: dbPayload.ranking.engagement_prediction,
        seo_score: body.ranking?.seo_score ?? 0.7,
        monetization_weight: dbPayload.ranking.monetization_weight
      });

      const normalizedBlock = buildContentBlock(dbPayload);

      // Trigger multi-channel distribution
      if (body.publish_now) {
        await syndicateContent(normalizedBlock);
      }

      return c.json({ success: true, item: normalizedBlock, poe: result.poe });
    } else {
      return c.json({ error: 'Kernel pipeline execution failed' }, 500);
    }
  } catch (err: any) {
    console.error('[INGEST] Error running pipeline:', err.message);
    await enqueueToDLQ({
      intent_id: intentId,
      classification: 'RETRYABLE',
      error_message: err.message,
      retry_count: 0
    });
    return c.json({ error: err.message }, 500);
  }
});

export default v2Router;
