import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { db } from '../store/mvp_db';
import { CreatePostDTO, SourceType } from '@simis/shared';
import { FeedEngine } from '../services/feed_engine';
import { MonetizationEngine } from '../services/monetization_engine';
import { IngestionEngine } from '../services/ingestion';
import { AdAuctionEngine, AdSlotType } from '../services/ad_auction_engine';
import { RevenueEngine } from '../services/revenue_engine';
import { EditorialEngine } from '../services/editorial_engine';

const app = new Hono();

// GET /feed - Retrieve ranked posts
app.get('/feed', async (c) => {
  const authorId = c.req.query('authorId');
  const tag = c.req.query('tag');
  const query = c.req.query('q');
  
  // V1 Ranking Feed Engine
  const posts = await FeedEngine.getRankedFeed(tag, authorId, query);
  return c.json({ posts });
});

// GET /post/:id - Retrieve a single post + monetization slots
app.get('/post/:id', async (c) => {
  const id = c.req.param('id');
  const post = await db.getPost(id);
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }

  // V1 Monetization Engine evaluation
  const monetization = MonetizationEngine.evaluate(post as any);

  return c.json({ post, monetization });
});

// GET /content/:slug - Retrieve a single post by slug for SSR read page
app.get('/content/:slug', async (c) => {
  const slug = c.req.param('slug');
  const post = await db.getPost(slug);
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json(post);
});

// POST /post - Create a new post
app.post('/post', async (c) => {
  try {
    const body = await c.req.json<CreatePostDTO>();
    if (!body.title || !body.content || !body.authorId) {
      return c.json({ error: 'Missing title, content, or authorId' }, 400);
    }
    const post = await db.createPost(body);
    return c.json({ post }, 201);
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// POST /post/:id/like - Like a post
app.post('/post/:id/like', async (c) => {
  const id = c.req.param('id');
  const post = await db.likePost(id);
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ post });
});

// POST /post/:id/view - Track a view
app.post('/post/:id/view', async (c) => {
  const id = c.req.param('id');
  const post = await db.viewPost(id);
  if (!post) {
    return c.json({ error: 'Post not found' }, 404);
  }
  return c.json({ post });
});

// POST /ingest/:source - Ingest content from external sources
app.post('/ingest/:source', async (c) => {
  try {
    const source = c.req.param('source') as SourceType;
    if (!['rss', 'api', 'webhook'].includes(source)) {
      return c.json({ error: 'Invalid source type' }, 400);
    }

    const payload = await c.req.json();
    if (!payload.title || !payload.content) {
      return c.json({ error: 'Missing title or content' }, 400);
    }

    const result = await IngestionEngine.ingest(source, payload);
    if (!result.success) {
      return c.json({ error: result.reason }, 409); // 409 Conflict for duplicates
    }

    // In V1.3, it goes to ContentCandidate queue. We don't auto-publish to Post here anymore.
    // The Curation Engine or UGC Engine will process the queue.
    return c.json({ success: true, candidate: result.candidate }, 201);
  } catch (error) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// GET /author/:id - Retrieve author details and their posts
app.get('/author/:id', async (c) => {
  const id = c.req.param('id');
  const author = await db.getProfile(id);
  if (!author) {
    return c.json({ error: 'Author/Profile not found' }, 404);
  }
  const posts = await db.getAllPosts(undefined, id);
  return c.json({ author, posts });
});

// GET /tag/:tag - Retrieve posts filtered by tag
app.get('/tag/:tag', async (c) => {
  const tag = c.req.param('tag');
  const posts = await FeedEngine.getRankedFeed(tag);
  return c.json({ tag, posts });
});

// GET /search - Search posts by query string q
app.get('/search', async (c) => {
  const query = c.req.query('q') || '';
  const posts = await FeedEngine.getRankedFeed(undefined, undefined, query);
  return c.json({ query, posts });
});

// DELETE /post/:id - Delete a post
app.delete('/post/:id', async (c) => {
  const id = c.req.param('id');
  const deleted = await db.deletePost(id);
  if (deleted) {
    return c.json({ success: true });
  }
  return c.json({ error: 'Post not found' }, 404);
});

// GET /stream - SSE streaming endpoint for live updates
app.get('/stream', async (c) => {
  return streamSSE(c, async (stream) => {
    let unsubscribe: (() => void) | null = null;

    // Send connection established confirmation
    await stream.writeSSE({
      event: 'message',
      data: JSON.stringify({ type: 'CONNECTED', payload: { message: 'Stream connected successfully' } }),
    });

    unsubscribe = db.subscribe(async (event) => {
      try {
        await stream.writeSSE({
          event: 'message',
          data: JSON.stringify(event),
        });
      } catch (err) {
        console.error('Failed to write to stream', err);
      }
    });

    // Cleanup when client disconnects
    c.req.raw.signal.addEventListener('abort', () => {
      if (unsubscribe) {
        unsubscribe();
      }
    });

    // Keep connection alive
    while (!c.req.raw.signal.aborted) {
      await stream.sleep(15000); // Send keepalive ping every 15s
      await stream.writeSSE({
        event: 'ping',
        data: 'keepalive',
      });
    }
  });
});

// --- V1.1 AD ENGINE ROUTES ---

// POST /ads/auction/run - Run auction for a post
app.post('/ads/auction/run', async (c) => {
  try {
    const { postId, slots } = await c.req.json<{ postId: string, slots: AdSlotType[] }>();
    if (!postId || !slots || !slots.length) return c.json({ error: 'Missing postId or slots' }, 400);

    const results = await AdAuctionEngine.executeAuctionsForPost(postId, slots);
    return c.json({ results });
  } catch (err) {
    return c.json({ error: 'Invalid request' }, 400);
  }
});

// POST /ads/click/:postId - Simulate clicking an ad
app.post('/ads/click/:postId', async (c) => {
  const postId = c.req.param('postId');
  const post = await RevenueEngine.recordClick(postId);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json({ post });
});

// GET /ads/rpm/:postId - Get revenue metrics
app.get('/ads/rpm/:postId', async (c) => {
  const postId = c.req.param('postId');
  const post = await db.getPost(postId);
  if (!post) return c.json({ error: 'Post not found' }, 404);
  return c.json({ rpmEstimate: post.rpmReal, totalRevenue: post.revenueTotal, ctr: post.ctr });
});

// --- V1.1 EDITORIAL ENGINE ROUTES ---

app.post('/editorial/submit/:postId', async (c) => {
  const postId = c.req.param('postId');
  const { authorId } = await c.req.json();
  const res = await EditorialEngine.submitForReview(postId, authorId);
  return c.json(res, res.success ? 200 : 403);
});

app.post('/editorial/approve/:postId', async (c) => {
  const postId = c.req.param('postId');
  const { authorId } = await c.req.json(); // Simulating logged-in user
  const res = await EditorialEngine.approvePost(postId, authorId);
  return c.json(res, res.success ? 200 : 403);
});

app.post('/editorial/reject/:postId', async (c) => {
  const postId = c.req.param('postId');
  const { authorId } = await c.req.json();
  const res = await EditorialEngine.rejectPost(postId, authorId);
  return c.json(res, res.success ? 200 : 403);
});

app.post('/editorial/feature/:postId', async (c) => {
  const postId = c.req.param('postId');
  const { authorId } = await c.req.json();
  const res = await EditorialEngine.featurePost(postId, authorId);
  return c.json(res, res.success ? 200 : 403);
});

export const mvpRouter = app;
