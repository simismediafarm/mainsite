import { Hono } from 'hono';
import { prisma } from '../prisma';

export const registryRouter = new Hono();

// 1. Navigation Registry
registryRouter.get('/navigation', async (c) => {
  const data = await prisma.navigationRegistry.findMany();
  return c.json(data);
});

registryRouter.get('/navigation/:key', async (c) => {
  const data = await prisma.navigationRegistry.findUnique({ where: { key: c.req.param('key') } });
  return c.json(data || {});
});

// 2. Taxonomy Registry
registryRouter.get('/taxonomy', async (c) => {
  const data = await prisma.taxonomyRegistry.findMany();
  return c.json(data);
});

// 3. Widget Registry
registryRouter.get('/widgets', async (c) => {
  const data = await prisma.widgetRegistry.findMany();
  return c.json(data);
});

registryRouter.get('/widgets/:key', async (c) => {
  const data = await prisma.widgetRegistry.findUnique({ where: { key: c.req.param('key') } });
  return c.json(data || {});
});

// 4. Page Registry
registryRouter.get('/pages', async (c) => {
  const data = await prisma.pageRegistry.findMany();
  return c.json(data);
});

registryRouter.get('/pages/:slug', async (c) => {
  const data = await prisma.pageRegistry.findUnique({ where: { slug: c.req.param('slug') } });
  return c.json(data || {});
});

// 5. Route Registry
registryRouter.get('/routes', async (c) => {
  const data = await prisma.routeRegistry.findMany();
  return c.json(data);
});

registryRouter.get('/routes/:path', async (c) => {
  const data = await prisma.routeRegistry.findUnique({ where: { path: c.req.param('path') } });
  return c.json(data || {});
});

// 6. Feature Flags
registryRouter.get('/features', async (c) => {
  const data = await prisma.featureFlag.findMany();
  return c.json(data);
});
