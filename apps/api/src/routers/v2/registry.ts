import { Hono } from 'hono';
import { getSupabase } from '@simis/kernel-graph/dist/executor/kernelExecutor';
import { prisma } from '../../prisma';

export const registryV2Router = new Hono();

// ── GET /assets -> Asset Registry ───────────────────────────────────────
registryV2Router.get('/assets', async (c) => {
  const limit = parseInt(c.req.query('limit') || '50');
  
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('content_blocks_v2')
      .select('id, title, slug, status, type, metadata, ranking')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    
    return c.json({ items: data, count: data.length });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// ── GET /markets -> Opportunity Market Data ────────────────────────────────
registryV2Router.get('/markets', async (c) => {
  try {
    // In V2, markets fetch real-time trends or affiliate product availability
    const supabase = getSupabase();
    
    // Example: fetch top performing affiliate products to suggest opportunities
    const { data, error } = await supabase
      .from('affiliate_products')
      .select('id, name, merchant, availability, created_at')
      .eq('availability', true)
      .limit(20);

    if (error) throw error;
    return c.json({ opportunities: data });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default registryV2Router;
