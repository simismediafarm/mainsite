import type { MetadataRoute } from 'next';
import { API_BASE } from '../lib/kernel-api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://mediafarm.vercel.app';
  
  // Base static routes
  const routes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/deals`,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    }
  ];

  try {
    // Fetch dynamic content slugs
    // We use 127.0.0.1 to avoid IPv6 DNS issues in Node fetch
    const res = await fetch(`http://127.0.0.1:4000/api/mvp/feed`, { cache: 'no-store' });
    const data = await res.json();
    
    if (data.posts) {
      data.posts.forEach((item: any) => {
        routes.push({
          url: `${baseUrl}/read/${item.slug || item.id}`,
          lastModified: new Date(item.updatedAt || item.createdAt || Date.now()),
          changeFrequency: 'weekly',
          priority: 0.7,
        });
      });
    }
  } catch (error) {
    console.error('Failed to generate dynamic sitemap:', error);
  }

  return routes;
}
