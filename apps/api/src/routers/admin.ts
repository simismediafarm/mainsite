import { Hono } from 'hono';
import { ControlOrchestrator } from '../core/orchestrator';
import { ActionType } from '../core/permission_guard';

const app = new Hono();

// Centralized Action Gateway for ControlOrchestrator (used by CLI)
app.post('/action', async (c) => {
  try {
    const body = await c.req.json();
    const action = body.action as ActionType;
    const actorId = body.actorId || 'unknown';
    
    const handler = async () => {
      if (action === 'SCRAPE_MANUAL') {
        return { message: 'Scraping initiated manually.' };
      }
      return { message: `Action ${action} executed successfully.` };
    };

    const result = await ControlOrchestrator.executeAction(c, {
      action,
      actorId,
      resourceType: body.resourceType || 'system',
      payload: body.payload || {}
    }, handler);

    return c.json({ success: true, data: result });
  } catch (error: any) {
    if (error.message === 'Access Denied') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }
    return c.json({ success: false, error: error.message }, 500);
  }
});

// GET /api/v2/admin/content/queue
app.get('/content/queue', (c) => {
  return c.json({ success: true, items: [] });
});

// POST /api/v2/admin/content/approve
app.post('/content/approve', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, approved: body.ids || [] });
});

// POST /api/v2/admin/content/bulk-action
app.post('/content/bulk-action', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, modified: body.ids || [] });
});

// PUT /api/v2/admin/ranking/weights
app.put('/ranking/weights', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, weights: body });
});

// POST /api/v2/admin/revenue/simulate
app.post('/revenue/simulate', async (c) => {
  return c.json({ success: true, expected_rpm: 12.50 });
});

// GET /api/v2/admin/integrations/status
app.get('/integrations/status', (c) => {
  return c.json({ success: true, cj: 'ok', impact: 'ok', gemini: 'ok' });
});

export default app;
