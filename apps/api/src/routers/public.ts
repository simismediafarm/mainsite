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

// POST /api/v2/public/telemetry (RT-RML v2.5 Bandit Feedback Loop via Queue)
app.post('/telemetry', async (c) => {
  try {
    const { TelemetryProducer } = await import('../services/rt-rml/queue/telemetry-producer');
    const body = await c.req.json();
    
    // Convert incoming request to TelemetryEvent format
    const event = {
      session_id: body.session_id || 'anon',
      content_id: body.content_id || 'unknown',
      context: body.context,
      action: body.action || { type: "CONTENT_ONLY", position: "inline" },
      reward: {
        ctr: body.engagement?.ctr || 0,
        dwell_time: body.engagement?.dwell_ms || 0,
        scroll_depth: body.engagement?.scroll_pct || 0,
        conversion: body.engagement?.conversion || false,
        rpm: body.revenue?.usd || 0
      }
    };

    // Publish to Redis Stream for async worker processing
    await TelemetryProducer.emit(event);

    return c.json({ success: true, queued: true });
  } catch (err: any) {
    console.error("[TELEMETRY] Bandit stream publish failed", err);
    return c.json({ error: err.message }, 500);
  }
});

export default app;
