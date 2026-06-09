import { prisma } from './prisma';

async function main() {
  await prisma.navigationRegistry.upsert({
    where: { key: 'main_menu' },
    update: {},
    create: {
      key: 'main_menu',
      schema: JSON.stringify({ items: [
        { label: 'Home', href: '/', icon: 'home' },
        { label: 'Search', href: '/search', icon: 'search' },
        { label: 'Deals', href: '/deals', icon: 'local_offer' },
        { label: 'Trending', href: '/search?q=trending', icon: 'trending_up' },
      ]})
    }
  });

  await prisma.widgetRegistry.upsert({
    where: { key: 'footer_config' },
    update: {},
    create: { key: 'footer_config', schema: JSON.stringify({ copy: '© 2026 SIMIS MediaFarm. All rights reserved.' }) }
  });

  await prisma.widgetRegistry.upsert({
    where: { key: 'home_sidebar' },
    update: {},
    create: {
      key: 'home_sidebar',
      schema: JSON.stringify({ entities: [
        { name: 'Artificial Intelligence', score: 94, color: '#00E5FF' },
        { name: 'Financial Markets', score: 88, color: '#32D74B' },
        { name: 'Climate Technology', score: 82, color: '#FFD60A' },
        { name: 'Geopolitics', score: 79, color: '#FF6B35' },
        { name: 'Health & Longevity', score: 73, color: '#BF5AF2' },
      ]})
    }
  });

  await prisma.taxonomyRegistry.upsert({
    where: { key: 'trending_tags' },
    update: {},
    create: {
      key: 'trending_tags',
      schema: JSON.stringify({ tags: [
        { name: 'AI', count: '2.4k' },
        { name: 'Finance', count: '1.8k' },
        { name: 'Climate', count: '1.2k' },
        { name: 'Tech', count: '980' },
        { name: 'Health', count: '760' },
        { name: 'Policy', count: '540' },
      ]})
    }
  });

  console.log('✅ Registry seed complete');
}

main().catch(console.error).finally(() => prisma.$disconnect());
