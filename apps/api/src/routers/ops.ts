import { Hono } from 'hono';
import { prisma } from '../prisma';

const app = new Hono();

// POST /api/v2/ops/scrape/run
app.post('/scrape/run', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, message: `Scraper executed for source ${body.sourceId}` });
});

// POST /api/v2/ops/feed/import
app.post('/feed/import', async (c) => {
  return c.json({ success: true, message: `Feed catalog imported` });
});

// GET /api/v2/ops/feed/export
app.get('/feed/export', (c) => {
  return c.json({ success: true, url: '/downloads/feed-export.csv' });
});

// POST /api/v2/ops/replay
app.post('/replay', async (c) => {
  const body = await c.req.json();
  return c.json({ success: true, replayed_id: body.intentId });
});

// POST /api/v2/ops/simulate-feed
app.post('/simulate-feed', async (c) => {
  return c.json({ success: true, output: [] });
});

// GET /api/v2/ops/debug-rank
app.get('/debug-rank', (c) => {
  return c.json({ success: true, math_breakdown: {} });
});

// GET /api/v2/ops/trace-poe
app.get('/trace-poe', (c) => {
  return c.json({ success: true, signatures: [] });
});

// POST /api/v2/ops/seed — seed registry + sample posts (ops key required)
app.post('/seed', async (c) => {
  const opsKey = c.req.header('X-SIMIS-OPS-KEY');
  if (!process.env.SIMIS_OPS_KEY || opsKey !== process.env.SIMIS_OPS_KEY) {
    return c.json({ error: 'Forbidden' }, 403);
  }

  try {
    // Registry seed
    await prisma.navigationRegistry.upsert({
      where: { key: 'main_menu' }, update: {},
      create: { key: 'main_menu', schema: JSON.stringify({ items: [
        { label: 'Home', href: '/', icon: 'home' },
        { label: 'Search', href: '/search', icon: 'search' },
        { label: 'Deals', href: '/deals', icon: 'local_offer' },
        { label: 'Trending', href: '/search?q=trending', icon: 'trending_up' },
      ]})},
    });

    await prisma.widgetRegistry.upsert({
      where: { key: 'home_sidebar' }, update: {},
      create: { key: 'home_sidebar', schema: JSON.stringify({ entities: [
        { name: 'Artificial Intelligence', score: 94, color: '#00E5FF' },
        { name: 'Financial Markets', score: 88, color: '#32D74B' },
        { name: 'Climate Technology', score: 82, color: '#FFD60A' },
        { name: 'Geopolitics', score: 79, color: '#FF6B35' },
        { name: 'Health & Longevity', score: 73, color: '#BF5AF2' },
      ]})},
    });

    await prisma.taxonomyRegistry.upsert({
      where: { key: 'trending_tags' }, update: {},
      create: { key: 'trending_tags', schema: JSON.stringify({ tags: [
        { name: 'AI', count: '2.4k' },
        { name: 'Finance', count: '1.8k' },
        { name: 'Climate', count: '1.2k' },
        { name: 'Tech', count: '980' },
        { name: 'Health', count: '760' },
        { name: 'Policy', count: '540' },
      ]})},
    });

    // Sample posts — skip if posts already exist
    const existingCount = await prisma.post.count();
    if (existingCount === 0) {
      const author = await prisma.profile.upsert({
        where: { id: 'seed-author-001' }, update: {},
        create: { id: 'seed-author-001', name: 'SIMIS Editorial', role: 'editor' },
      });

      const samplePosts = [
        { title: 'The AI Inflection Point: What Every Executive Needs to Know', excerpt: 'Artificial intelligence has crossed a threshold. The question is no longer whether to adopt AI, but how fast your organization can adapt.', tags: ['AI', 'Strategy'] },
        { title: 'Climate Tech Funding Hits Record $89B in 2026', excerpt: 'Venture capital continues to flow into clean energy, carbon capture, and sustainable infrastructure at an unprecedented rate.', tags: ['Climate', 'Finance'] },
        { title: 'Geopolitical Shifts Reshaping Global Supply Chains', excerpt: 'From semiconductor decoupling to rare earth restrictions, the era of frictionless global trade is over.', tags: ['Geopolitics', 'Policy'] },
        { title: 'Longevity Science Enters the Mainstream', excerpt: 'From GLP-1 drugs to senolytics, the science of healthy aging is moving from research labs into clinical practice at scale.', tags: ['Health', 'Science'] },
        { title: 'The New Architecture of Financial Markets', excerpt: 'Tokenization, real-time settlement, and AI-driven risk models are converging to remake global capital markets.', tags: ['Finance', 'Tech'] },
      ];

      for (const p of samplePosts) {
        const slug = p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        await prisma.post.create({
          data: {
            title: p.title,
            slug,
            content: p.excerpt + '\n\n' + 'This is a seed article. Replace with real content via the Content Studio.',
            excerpt: p.excerpt,
            authorId: author.id,
            status: 'published',
            trustScore: 85,
            tags: {
              connectOrCreate: p.tags.map(t => ({ where: { name: t }, create: { name: t } })),
            },
          },
        });
      }
    }

    return c.json({ success: true, message: 'Seed complete', postsSeeded: existingCount === 0 ? 5 : 0 });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

export default app;
