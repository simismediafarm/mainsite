/**
 * distribution.ts — Content Syndication & Social Media Auto-Poster
 */

import { ContentBlockV2 } from './block_builder';

/**
 * Dispatch auto-posting alerts to configured Telegram and Discord channels
 */
export async function syndicateContent(content: ContentBlockV2): Promise<void> {
  const domain = process.env.AFFILIATE_CUSTOM_TRACKING_DOMAIN ?? 'https://simis-media.com';
  const url = `${domain}/read/${content.slug}`;
  const message = `📢 *New Article Published!* \n\n*${content.title}*\nCategory: ${content.metadata.category}\nTags: ${content.metadata.tags.map((t: string) => `#${t}`).join(' ')}\n\nRead here: ${url}`;

  // 1. Telegram Ingestion
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const tgChatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && tgChatId) {
    try {
      const response = await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: tgChatId,
          text: message,
          parse_mode: 'Markdown'
        })
      });
      if (!response.ok) console.warn('[DISTRIBUTION] Telegram syndication failed:', response.statusText);
    } catch (e: any) {
      console.error('[DISTRIBUTION] Telegram error:', e.message);
    }
  }

  // 2. Discord Ingestion
  const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
  if (discordWebhook) {
    try {
      const response = await fetch(discordWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🚀 **New Content Live!**\n**${content.title}**\nExplore: ${url}`
        })
      });
      if (!response.ok) console.warn('[DISTRIBUTION] Discord syndication failed:', response.statusText);
    } catch (e: any) {
      console.error('[DISTRIBUTION] Discord error:', e.message);
    }
  }

  // 3. Webhook Fan-out
  const webhooksStr = process.env.CMS_WEBHOOK_ENDPOINT;
  if (webhooksStr) {
    const endpoints = webhooksStr.split(',').map(e => e.trim());
    for (const endpoint of endpoints) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'content.published', payload: content })
        });
      } catch (e: any) {
        console.error(`[DISTRIBUTION] Fan-out failure for ${endpoint}:`, e.message);
      }
    }
  }
}

/**
 * Generates sitemap.xml dynamic markup string
 */
export function generateSitemapXml(items: ContentBlockV2[]): string {
  const domain = process.env.AFFILIATE_CUSTOM_TRACKING_DOMAIN ?? 'https://simis-media.com';
  const urls = items.map(item => `
  <url>
    <loc>${domain}/read/${item.slug}</loc>
    <lastmod>${new Date(item.metadata.updated_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}</loc>
    <changefreq>always</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`;
}

/**
 * Generates rss.xml RSS 2.0 dynamic feed string
 */
export function generateRssXml(items: ContentBlockV2[]): string {
  const domain = process.env.AFFILIATE_CUSTOM_TRACKING_DOMAIN ?? 'https://simis-media.com';
  const articles = items.map(item => `
    <item>
      <title><![CDATA[${item.title}]]></title>
      <link>${domain}/read/${item.slug}</link>
      <guid>${item.id}</guid>
      <pubDate>${new Date(item.metadata.created_at).toUTCString()}</pubDate>
      <description><![CDATA[${item.blocks.find(b => b.type === 'paragraph')?.content ?? item.title}]]></description>
    </item>`).join('');

  return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>SIMIS Programmatic Media Feed</title>
  <link>${domain}</link>
  <description>Automated articles and affiliate deals feed</description>
  <language>en</language>
  <atom:link href="${domain}/rss.xml" rel="self" type="application/rss+xml" />
  ${articles}
</channel>
</rss>`;
}
