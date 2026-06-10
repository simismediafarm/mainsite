import { Hono } from 'hono';
import { prisma } from '../../prisma';
import { RSSEngine } from '../../services/rss_engine';

export const adminRssRouter = new Hono();

// GET /api/admin/rss/sources — list all RSS sources
adminRssRouter.get('/sources', async (c) => {
  try {
    const sources = await prisma.rssSource.findMany({ orderBy: { createdAt: 'desc' } });
    return c.json({ sources });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/rss/fetch — trigger manual RSS aggregation (all active sources)
adminRssRouter.post('/fetch', async (c) => {
  try {
    const result = await RSSEngine.aggregate();
    return c.json(result);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/rss/fetch/:id — trigger fetch for a specific source
adminRssRouter.post('/fetch/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const source = await prisma.rssSource.findUnique({ where: { id } });
    if (!source) return c.json({ error: 'RSS source not found' }, 404);

    // Temporarily mark only this source as active for targeted fetch
    const Parser = (await import('rss-parser')).default;
    const { IngestionEngine } = await import('../../services/ingestion');
    const parser = new Parser();
    const feed = await parser.parseURL(source.url);
    let ingestedCount = 0;

    for (const item of feed.items) {
      if (!item.title || !item.link) continue;
      const res = await IngestionEngine.ingest('rss', {
        title: item.title,
        content: item.content || item.contentSnippet || '',
        sourceUrl: item.link,
        tags: item.categories,
      });
      if (res.success) ingestedCount++;
    }

    await prisma.rssSource.update({ where: { id }, data: { lastFetched: new Date() } });
    return c.json({ success: true, ingestedCount, source: source.name });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/rss/sources — add new RSS source
adminRssRouter.post('/sources', async (c) => {
  try {
    const { name, url, category } = await c.req.json();
    if (!name || !url) return c.json({ error: 'name and url required' }, 400);
    const source = await prisma.rssSource.create({
      data: { name, url, category: category || 'general', status: 'active' },
    });
    return c.json({ source }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// PUT /api/admin/rss/sources/:id/status — toggle active/paused
adminRssRouter.put('/sources/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const { status } = await c.req.json();
    const source = await prisma.rssSource.update({ where: { id }, data: { status } });
    return c.json({ source });
  } catch (err: any) {
    if ((err as any).code === 'P2025') return c.json({ error: 'Source not found' }, 404);
    return c.json({ error: err.message }, 500);
  }
});
