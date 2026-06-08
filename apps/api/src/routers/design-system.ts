import { Hono } from 'hono';
import { prisma } from '../prisma';

export const designSystemRouter = new Hono();

const DS_TYPE = 'design_system';

// List all published design system definitions
designSystemRouter.get('/', async (c) => {
  const items = await prisma.registryDefinition.findMany({
    where: { type: DS_TYPE, status: 'Published' },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  return c.json(items);
});

// Get a single design system by id
designSystemRouter.get('/:id', async (c) => {
  const item = await prisma.registryDefinition.findFirst({
    where: { id: c.req.param('id'), type: DS_TYPE },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  if (!item) return c.json({ error: 'Not found' }, 404);
  return c.json(item);
});

// Get CSS artifact for a design system version
designSystemRouter.get('/:id/css', async (c) => {
  const item = await prisma.registryDefinition.findFirst({
    where: { id: c.req.param('id'), type: DS_TYPE, status: 'Published' },
    include: { versions: { orderBy: { versionNumber: 'desc' }, take: 1 } },
  });
  if (!item || !item.versions[0]) return c.json({ error: 'Not found' }, 404);

  const payload = item.versions[0].definition as any;
  const css = payload?.css || payload?.artifact?.css || '';
  return new Response(css, { headers: { 'Content-Type': 'text/css' } });
});
