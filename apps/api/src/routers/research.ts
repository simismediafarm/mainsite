import { Hono } from 'hono';
// @ts-ignore
import { dispatchResearchIntent } from '@simis/reasoning-graph/dist/kernel_integration.js';

const researchRouter = new Hono();

researchRouter.post('/trigger', async (c) => {
  try {
    const body = await c.req.json();
    const { query } = body;

    if (!query) {
      return c.json({ success: false, error: 'Query is required' }, 400);
    }

    const result = await dispatchResearchIntent(query);

    return c.json({
      success: true,
      intent_id: result.intent_id,
      execution_hash: result.execution_hash,
      status: result.status
    });
  } catch (error: any) {
    console.error('[API] Research dispatch failed:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default researchRouter;
