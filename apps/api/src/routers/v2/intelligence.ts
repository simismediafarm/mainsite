import { Hono } from 'hono';
import { AIOrchestrator } from '../../services/ai/ai_orchestrator';

export const intelligenceV2Router = new Hono();

const orchestrator = new AIOrchestrator();

// ── POST /analyze -> Content Semantic Analysis ─────────────────────────────
intelligenceV2Router.post('/analyze', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.text) {
      return c.json({ error: 'Text payload is required for analysis' }, 400);
    }

    const result = await orchestrator.enrichContent(body.text);

    return c.json({
      success: true,
      analysis: {
        result,
        model: 'simis-sik-fallback-hierarchy',
      },
    });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── POST /enrich -> alias used by llm-client in worker ────────────────────
intelligenceV2Router.post('/enrich', async (c) => {
  try {
    const body = await c.req.json();
    if (!body.text) return c.json({ error: 'text required' }, 400);
    const result = await orchestrator.enrichContent(body.text);
    return c.json({ result });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default intelligenceV2Router;
