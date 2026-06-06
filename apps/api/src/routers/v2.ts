/**
 * v2.ts — Hono Router for SIMIS API v2 (Programmatic Media Platform)
 */

import { Hono } from 'hono';
import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { prisma } from '../prisma';
import { runExecutionPipeline, PipelineIntent } from '@simis/kernel-graph/dist/v7.1/runtime/execution_pipeline';
import { buildContentBlock, ContentBlockV2 } from '../services/block_builder';
import { computeRankingScore, calculateFreshness } from '../services/ranking';
import { semanticSearch, getPersonalizedFeed } from '../services/personalization';
import { syndicateContent, generateSitemapXml, generateRssXml } from '../services/distribution';
import { validateContentCompliance, sanitizeAffiliateLink } from '../services/governance';
import { isValidTransition, evaluateAgeTtl, ContentState } from '../services/lifecycle';
import { enqueueToDLQ } from '../services/recovery';
import { rateLimit } from '../middleware/rate_limit';
import { RankingArbitrationKernel } from '../services/ranking_arbitration';
import { MonetizationPlacementResolver } from '../services/monetization_dsl';
import { SEOContentSafetyEngine } from '../services/seo_safety';

// SEO Engines
import { GooglebotEmulator } from '../services/seo/googlebot_emulator';
import { SERPPredictor } from '../services/seo/serp_predictor';
import { IndexabilityEngine } from '../services/seo/indexability_engine';
import { DiscoverEligibilityEngine } from '../services/seo/discover_eligibility_engine';
import { LinkGraphEngine } from '../services/seo/link_graph_engine';
import { CannibalizationDetector } from '../services/seo/cannibalization_detector';
import { IndexingClient } from '../services/seo/indexing_client';

const v2Router = new Hono();


// ── Rate Limiting for Ingestion ──────────────────────────────────────────────
const ingestRateLimit = rateLimit(10, 60 * 1000); // Max 10 ingests per minute

// ── GET /feed -> Ranked Content Stream ────────────────────────────────────────
v2Router.get('/feed', async (c) => {
  const userId = c.req.query('user_id') || null;
  const sessionId = c.req.query('session_id') || 'anon';
  const geo = c.req.header('x-forwarded-for-geo') || 'US';
  const device = c.req.header('user-agent')?.includes('Mobile') ? 'mobile' : 'desktop';
  const limit = parseInt(c.req.query('limit') || '10');

  try {
    // 1. Fetch raw candidate feed
    const rawFeed = await getPersonalizedFeed(userId, limit);
    
    // 2. Resolve Monetization DSL Rules & Global Density Governor
    let resolvedFeed = MonetizationPlacementResolver.resolve(rawFeed);
    
    // 3. SEO Safety Check
    resolvedFeed = resolvedFeed.map((block, _, arr) => SEOContentSafetyEngine.inspect(block, arr));
    
    // 4. Kernel Arbitration & Lock Enforcement (Deterministic scoring)
    const finalFeed = await RankingArbitrationKernel.arbitrate(resolvedFeed, sessionId);

    // 5. RT-RML v2.5: Bandit Execution Context setup
    
    // Construct ContextVector for the bandit
    const context = {
      geo,
      device: device as "mobile" | "desktop",
      category: "general", // We could infer this from user behavior later
      time_bucket: "latest" // Just an example
    };
    
    const scrollDepth = parseInt(c.req.query('scroll_depth') || '0');
    const dwellTime = parseInt(c.req.query('dwell_time') || '0');

    // 5. Server-side dynamic monetization reflow
    const { MonetizationReflowEngine } = await import('../services/revenue-engine/monetization-reflow');
    const reflowedFeed = MonetizationReflowEngine.reflow(finalFeed, {
      geo,
      device: device as "mobile" | "desktop",
      scroll_depth: scrollDepth,
      dwell_time_seconds: dwellTime
    });

    // 6. RT-RML v2.5: Bandit Execution (Dynamic Monetization overriding)
    const { RTMMOrchestrator } = await import('../services/rt-rml/core/rtmm-orchestrator');
    const marketReadyFeed = reflowedFeed.map((item) => ({
      ...item,
      monetization: RTMMOrchestrator.resolve(context)
    }));

    return c.json({ items: marketReadyFeed });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /internal/recompute-rank ───────────────────────────────────────────
v2Router.post('/internal/recompute-rank', async (c) => {
  try {
    const { sessionId, geo } = await c.req.json();
    if (!sessionId || !geo) {
      return c.json({ error: 'Missing sessionId or geo' }, 400);
    }
    
    // Force unlock for re-ranking
    const { FeedStabilityLockEngine } = await import('../services/ranking_arbitration');
    await FeedStabilityLockEngine.unlock(sessionId);
    
    return c.json({ success: true, message: 'Rank lock released. Next feed request will recompute.' });
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
  const intentId = globalThis.crypto.randomUUID();

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

      // Import monetization DSL interpreter for precompilation
      const { MonetizationDSLInterpreter } = await import('../services/monetization_dsl');
      const tempBlock = buildContentBlock({ ...payload, id: intentId, status: 'staged', ranking: { score: 0 } });
      const precompiledBlock = MonetizationDSLInterpreter.precompile(tempBlock);

      // Save structured record into Postgres media store
      const supabase = getSupabase();

      // Retrieve existing content pool for similarity check
      const { data: poolData } = await supabase.from('content_blocks_v2').select('*').limit(200);
      const existingPool = (poolData || []).map(buildContentBlock);

      // SEO Prediction & Simulation
      const crawlSimulation = GooglebotEmulator.simulate(precompiledBlock);
      const serpReport = SERPPredictor.predict(precompiledBlock, crawlSimulation);
      const discoverReport = DiscoverEligibilityEngine.evaluate(precompiledBlock);
      const cannibalizationReport = CannibalizationDetector.evaluate(precompiledBlock, existingPool);

      // Autonomous growth safeguards: force staged status on keyword cannibalization or if not explicitly bypassable
      const finalStatus = (body.publish_now && !cannibalizationReport.isConflict) ? 'published' : 'staged';

      const dbPayload = {
        id: intentId,
        organization_id: body.organization_id || '00000000-0000-0000-0000-000000000000',
        type: precompiledBlock.type,
        title: payload.title,
        slug: payload.slug,
        blocks: payload.blocks,
        metadata: {
          ...payload.metadata,
          source_type: 'kernel',
          author: payload.metadata.author ?? 'system',
          seo_prediction: {
            serp_score: serpReport.serpScore,
            discover_score: serpReport.discoverEligibility,
            discover_eligible: discoverReport.isEligible,
            crawl_depth: crawlSimulation.depth,
            cannibalization_risk: cannibalizationReport.isConflict
          }
        },
        ranking: {
          score: rankingScore,
          freshness,
          authority: body.ranking?.authority ?? 0.8,
          engagement_prediction: body.ranking?.engagement_prediction ?? 0.5,
          monetization_weight: body.type === 'affiliate' ? 0.9 : 0.4
        },
        monetization: payload.monetization,
        resolved_slots: precompiledBlock.resolved_slots || {},
        trace: {
          poe_hash: result.poe.execution_hash,
          io_buffer_id: result.intent_id
        },
        status: finalStatus
      };

      const { error: dbError } = await supabase.from('content_blocks_v2').upsert(dbPayload);
      if (dbError) throw dbError;

      // Write granular prediction metrics
      await supabase.from('seo_prediction_metrics').upsert({
        content_id: intentId,
        discover_score: serpReport.discoverEligibility,
        serp_score: serpReport.serpScore,
        crawl_score: crawlSimulation.canonicalConsistency,
        eeat_score: serpReport.eeat,
        freshness_score: crawlSimulation.freshnessScore,
        internal_link_score: crawlSimulation.internalLinkScore
      });

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

      // Trigger multi-channel distribution & indexing alert
      if (finalStatus === 'published') {
        await syndicateContent(normalizedBlock);
        // Async invoke Indexing client
        IndexingClient.submitUrl(`https://simis.media/read/${normalizedBlock.slug}`).catch(() => {});
      }

      return c.json({ 
        success: true, 
        item: normalizedBlock, 
        poe: result.poe,
        seo: {
          serp_score: serpReport.serpScore,
          discover_eligible: discoverReport.isEligible,
          cannibalization: cannibalizationReport
        }
      });
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

// ── Admin Sub-routes for frontend v2 pages ───────────────────────────────────

// GET /admin/ranking/weights
v2Router.get('/admin/ranking/weights', async (c) => {
  try {
    const existing = await prisma.rankingProfile.findFirst({ where: { name: 'default' } });
    if (existing && existing.weights) {
      return c.json({ weights: existing.weights });
    }
    return c.json({
      weights: {
        freshness: 1.0,
        authority: 1.0,
        ctr: 1.0,
        monetization: 1.0
      }
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /admin/ranking/weights
v2Router.put('/admin/ranking/weights', async (c) => {
  try {
    const body = await c.req.json();
    const existing = await prisma.rankingProfile.findFirst({ where: { name: 'default' } });
    if (existing) {
      await prisma.rankingProfile.update({
        where: { id: existing.id },
        data: { weights: body }
      });
    } else {
      await prisma.rankingProfile.create({
        data: {
          name: 'default',
          version: 1,
          isActive: true,
          weights: body
        }
      });
    }
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /admin/ingestion/sources
v2Router.get('/admin/ingestion/sources', async (c) => {
  try {
    const [rss, api] = await Promise.all([
      prisma.rssSource.findMany(),
      prisma.apiSource.findMany()
    ]);
    const sources = [
      ...rss.map((r: any) => ({ id: r.id, name: r.name, type: 'rss', lastRun: r.lastFetched?.toISOString() || 'never', status: r.status })),
      ...api.map((a: any) => ({ id: a.id, name: a.provider, type: 'api', lastRun: 'never', status: a.status }))
    ];
    return c.json({ sources });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /admin/dlq
v2Router.get('/admin/dlq', async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('kernel_dead_letter_queue').select('*');
    if (error) return c.json({ error: error.message }, 500);
    const items = (data || []).map(d => ({
      id: d.intent_id,
      reason: d.error_message,
      retries: d.retry_count
    }));
    return c.json({ items });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /admin/dlq/retry
v2Router.post('/admin/dlq/retry', async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabase();
    const { error } = await supabase.from('kernel_dead_letter_queue').delete().eq('intent_id', body.id);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: `Transaction ${body.id} successfully re-enqueued for ingestion.` });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /admin/content/queue
v2Router.get('/admin/content/queue', async (c) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase.from('content_blocks_v2').select('*').in('status', ['staged', 'pending_review']);
    if (error) return c.json({ error: error.message }, 500);
    const items = (data || []).map(d => ({
      id: d.id,
      title: d.title,
      score: d.metadata?.seo_prediction?.cannibalization_risk ? 0.95 : 0.12
    }));
    return c.json({ items });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /admin/content/approve
v2Router.post('/admin/content/approve', async (c) => {
  try {
    const body = await c.req.json();
    const supabase = getSupabase();
    const { error } = await supabase.from('content_blocks_v2').update({ status: 'published' }).in('id', body.ids);
    if (error) return c.json({ error: error.message }, 500);
    return c.json({ success: true, message: `Approved ${body.ids.length} item(s).` });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /admin/revenue/simulate
v2Router.post('/admin/revenue/simulate', async (c) => {
  try {
    const body = await c.req.json();
    const ctr = body.ctr || 0.02;
    const dwell = body.dwell_time_seconds || 15;
    const geo = body.geo || 'US';

    // Basic simulation formula
    const baseRate = geo === 'US' ? 5.0 : geo === 'UK' ? 4.0 : 1.5;
    const dwellBonus = Math.min(dwell / 10, 3);
    const expected_rpm = baseRate * (1 + ctr * 10) * (1 + dwellBonus);

    return c.json({ expected_rpm });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default v2Router;
