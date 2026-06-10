import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '../prisma';

export const newsletterRouter = new Hono();

const subscribeSchema = z.object({
  email: z.string().email('Invalid email address'),
});

// POST /api/newsletter/subscribe
newsletterRouter.post('/subscribe', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = subscribeSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: parsed.error.issues[0]?.message || 'Invalid email' }, 400);
    }

    const { email } = parsed.data;

    const existing = await prisma.subscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === 'unsubscribed') {
        await prisma.subscriber.update({ where: { email }, data: { status: 'active', subscribedAt: new Date() } });
        return c.json({ success: true, message: 'Resubscribed successfully' });
      }
      return c.json({ error: 'Already subscribed' }, 409);
    }

    await prisma.subscriber.create({ data: { email, source: 'web' } });
    return c.json({ success: true, message: 'Subscribed successfully' }, 201);
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});

// POST /api/newsletter/unsubscribe
newsletterRouter.post('/unsubscribe', async (c) => {
  try {
    const { email } = await c.req.json();
    if (!email) return c.json({ error: 'Email required' }, 400);
    await prisma.subscriber.updateMany({ where: { email }, data: { status: 'unsubscribed' } });
    return c.json({ success: true });
  } catch (err: any) {
    return c.json({ error: err.message }, 500);
  }
});
