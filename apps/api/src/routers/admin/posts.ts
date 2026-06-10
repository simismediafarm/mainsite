import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../../prisma';

export const adminPostsRouter = new Hono();

// GET /api/admin/posts/stats — overview counts by status + pending candidates
adminPostsRouter.get('/stats', async (c) => {
  try {
    const [byStatus, candidates] = await Promise.all([
      prisma.post.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.contentCandidate.count({ where: { status: 'queued' } }),
    ]);
    const counts: Record<string, number> = {};
    for (const row of byStatus) counts[row.status] = row._count._all;
    return c.json({ counts, pendingCandidates: candidates });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/admin/posts/candidates — queued content candidates pending review
adminPostsRouter.get('/candidates', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const candidates = await prisma.contentCandidate.findMany({
      where: { status: 'queued' },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return c.json({ candidates, total: candidates.length });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/posts/candidates/:id/approve — promote candidate to post
adminPostsRouter.post('/candidates/:id/approve', async (c) => {
  try {
    const id = c.req.param('id');
    const candidate = await prisma.contentCandidate.findUnique({ where: { id } });
    if (!candidate) return c.json({ error: 'Candidate not found' }, 404);

    const normalized = candidate.normalizedData ? JSON.parse(candidate.normalizedData) : {};
    const tags = candidate.extractedTags ? candidate.extractedTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
    const slug = candidate.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

    const authorId = normalized.authorId || 'seed-author-001';
    await prisma.profile.upsert({
      where: { id: authorId }, update: {},
      create: { id: authorId, name: 'Editorial', role: 'editor' },
    });

    const post = await prisma.post.create({
      data: {
        title: candidate.title,
        slug,
        content: candidate.rawContent,
        excerpt: normalized.excerpt || candidate.rawContent.slice(0, 160),
        authorId,
        status: 'pending_review',
        trustScore: 50,
        tags: { connectOrCreate: tags.map((name: string) => ({ where: { name }, create: { name } })) },
      },
      include: { author: true, tags: true },
    });

    await prisma.contentCandidate.update({ where: { id }, data: { status: 'approved' } });
    return c.json({ post }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/posts/candidates/:id/reject
adminPostsRouter.post('/candidates/:id/reject', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.contentCandidate.update({ where: { id }, data: { status: 'rejected' } });
    return c.json({ success: true });
  } catch (err: any) {
    if ((err as any).code === 'P2025') return c.json({ error: 'Candidate not found' }, 404);
    return c.json({ error: err.message }, 500);
  }
});

// GET /api/admin/posts — list all posts (any status)
adminPostsRouter.get('/', async (c) => {
  try {
    const status = c.req.query('status');
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: { author: true, tags: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where }),
    ]);
    return c.json({ posts, total, page, limit });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

const postSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  excerpt: z.string().optional(),
  authorId: z.string().min(1),
  status: z.string().optional().default('draft'),
  tags: z.array(z.string()).optional().default([]),
  trustScore: z.number().optional(),
});

// POST /api/admin/posts — create post
adminPostsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = postSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

    const { title, content, excerpt, authorId, status, tags, trustScore } = parsed.data;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now();

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        excerpt: excerpt || content.slice(0, 160),
        authorId,
        status,
        trustScore: trustScore ?? 50,
        tags: {
          connectOrCreate: tags.map(name => ({
            where: { name },
            create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
          })),
        },
      },
      include: { author: true, tags: true },
    });
    return c.json({ post }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  excerpt: z.string().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  trustScore: z.number().optional(),
});

// PUT /api/admin/posts/:id — update post
adminPostsRouter.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);

    const { tags, ...rest } = parsed.data;
    const post = await prisma.post.update({
      where: { id },
      data: {
        ...rest,
        ...(tags !== undefined && {
          tags: {
            set: [],
            connectOrCreate: tags.map(name => ({
              where: { name },
              create: { name, slug: name.toLowerCase().replace(/\s+/g, '-') },
            })),
          },
        }),
      },
      include: { author: true, tags: true },
    });
    return c.json({ post });
  } catch (err: any) {
    if ((err as any).code === 'P2025') return c.json({ error: 'Post not found' }, 404);
    return c.json({ error: err.message }, 500);
  }
});

// DELETE /api/admin/posts/:id — delete post
adminPostsRouter.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await prisma.post.delete({ where: { id } });
    return c.json({ success: true });
  } catch (err: any) {
    if ((err as any).code === 'P2025') return c.json({ error: 'Post not found' }, 404);
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/admin/posts/bulk — bulk status update
adminPostsRouter.post('/bulk', async (c) => {
  try {
    const { ids, status } = await c.req.json();
    if (!Array.isArray(ids) || !status) return c.json({ error: 'ids (array) and status required' }, 400);
    await prisma.post.updateMany({ where: { id: { in: ids } }, data: { status } });
    return c.json({ success: true, updated: ids.length });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
