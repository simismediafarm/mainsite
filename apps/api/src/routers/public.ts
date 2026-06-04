import { Hono } from 'hono';

const app = new Hono();

// POST /api/v2/public/bookmark
app.post('/bookmark', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, message: `Bookmarked content ${body.contentId}` });
});

// GET /api/v2/public/bookmarks
app.get('/bookmarks', (c) => {
  return c.json({ success: true, bookmarks: [] });
});

// POST /api/v2/public/lead
app.post('/lead', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, lead_id: 'new_lead_id' });
});

// GET /api/v2/public/redirect
app.get('/redirect', (c) => {
  const target = c.req.query('target');
  if (target) {
    return c.redirect(target, 302);
  }
  return c.json({ success: false, error: 'Target missing' }, 400);
});

// POST /api/v2/public/analytics/event
app.post('/analytics/event', async (c) => {
  try {
    const body = await c.req.json();
    const { EngagementIntegrityFilter } = await import('../services/engagement_integrity');
    
    const event = {
      session_id: body.session_id,
      content_id: body.content_id,
      event_type: body.event_type,
      dwell_time_ms: body.dwell_time_ms,
      timestamp: Date.now()
    };
    
    // Pass incoming signals through EngagementIntegrityFilter
    const geo = c.req.header('x-forwarded-for-geo') || 'US';
    if (!EngagementIntegrityFilter.isLegitimateSignal(event, geo)) {
      // Return 200 to not leak bot detection mechanism to client
      return c.json({ success: true, ignored: true });
    }
    
    const { getSupabase } = await import('@simis/kernel-graph/dist/executor/kernelExecutor');
    const supabase = getSupabase();
    
    const geo = c.req.header('x-forwarded-for-geo') || 'US';
    
    await supabase.from('analytics_events').insert({
      session_id: event.session_id,
      content_id: event.content_id,
      event_type: event.event_type,
      details: { dwell_time_ms: event.dwell_time_ms },
      geo: geo
    });
    
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/v2/public/telemetry (RT-RML v2 Bandit Feedback Loop)
app.post('/telemetry', async (c) => {
  try {
    const { RTMMTelemetryEvent } = await import('../services/rt-rml/types');
    const { FraudFilter } = await import('../services/rt-rml/fraud-filter');
    const { BanditEngine } = await import('../services/rt-rml/bandit_engine');
    
    const body = await c.req.json();
    
    // 1. Validation & Fraud Check
    const validationFactor = FraudFilter.validateTelemetry({
      clicksPerMinute: body.engagement?.ctr > 0 ? 1 : 0, // Placeholder for actual velocity
      avgDwellMs: body.engagement?.dwell_ms || 0,
      scrollEntropy: body.engagement?.scroll_pct || 0,
      clicked: body.engagement?.ctr > 0
    });

    if (validationFactor === FraudFilter.BLACKHOLE_SESSION) {
      return c.json({ success: true, ignored: true }); // Silent drop
    }

    // Apply penalty to reward if detected
    const reward = {
      ctr: body.engagement?.ctr || 0,
      dwell_time: body.engagement?.dwell_ms || 0,
      scroll_depth: body.engagement?.scroll_pct || 0,
      conversion: body.engagement?.conversion || false,
      rpm: body.revenue?.usd || 0
    };

    if (validationFactor === FraudFilter.PENALTY || validationFactor === FraudFilter.REWARD_ZERO) {
      reward.rpm = 0;
      reward.conversion = false;
      reward.ctr = 0;
    }

    // 2. Reconstruct Context & Action
    const context = body.context;
    // We assume the client sends back the action type it observed, or we deduce it
    const action = body.action || { type: "CONTENT_ONLY", position: "inline" };

    // 3. Update Bandit
    await BanditEngine.update(context, action, reward);

    return c.json({ success: true });
  } catch (err: any) {
    console.error("[TELEMETRY] Bandit update failed", err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
