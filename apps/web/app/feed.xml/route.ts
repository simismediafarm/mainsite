import { NextResponse } from 'next/server';

export async function GET() {
  let posts: any[] = [];
  const baseUrl = 'https://mediafarm.vercel.app';

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000')}/api/mvp/feed`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      posts = data.posts || [];
    }
  } catch (error) {
    console.error('Failed to fetch posts for RSS:', error);
  }

  const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SIMIS MediaFarm</title>
    <link>${baseUrl}</link>
    <description>A content-first, distraction-free media platform for writing and reading articles.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/read/${post.slug || post.id}</link>
      <guid isPermaLink="true">${baseUrl}/read/${post.slug || post.id}</guid>
      <pubDate>${new Date(post.createdAt).toUTCString()}</pubDate>
      <description><![CDATA[${post.excerpt || post.content.substring(0, 150)}...]]></description>
      ${post.author?.name ? `<author><![CDATA[${post.author.name}]]></author>` : ''}
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new NextResponse(rssFeed, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate',
    },
  });
}
