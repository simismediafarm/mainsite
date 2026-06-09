import React from 'react';
import { Metadata, ResolvingMetadata } from 'next';
import Link from 'next/link';
import { API_BASE } from '../../../lib/kernel-api';
import PostReaderClient from '../../../components/PostReaderClient';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Note: use 127.0.0.1 for local node fetch
    const res = await fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000')}/api/mvp/content/${slug}`, { cache: 'no-store' });
    if (!res.ok) return { title: 'Article Not Found' };
    
    const post = await res.json();
    if (!post || post.error) return { title: 'Article Not Found' };

    const baseUrl = 'https://mediafarm.vercel.app';
    const postUrl = `${baseUrl}/read/${slug}`;

    return {
      title: post.title,
      description: post.excerpt || post.content?.substring(0, 160) || '',
      alternates: {
        canonical: postUrl,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt || post.content?.substring(0, 160) || '',
        url: postUrl,
        type: 'article',
        publishedTime: post.createdAt,
        authors: [post.author?.name || 'Editorial Team'],
      },
      twitter: {
        card: 'summary_large_image',
        title: post.title,
        description: post.excerpt || post.content?.substring(0, 160) || '',
      }
    };
  } catch (err) {
    return { title: 'SIMIS MediaFarm' };
  }
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  let content = null;
  let monetization = null;

  const apiBase = process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000');

  try {
    const [contentRes, monetizationRes] = await Promise.allSettled([
      fetch(`${apiBase}/api/mvp/content/${slug}`, { cache: 'no-store' }),
      fetch(`${apiBase}/api/mvp/monetization/policy/${slug}`, { cache: 'no-store' }),
    ]);

    if (contentRes.status === 'fulfilled' && contentRes.value.ok) {
      const data = await contentRes.value.json();
      if (!data.error) content = data;
    }

    if (monetizationRes.status === 'fulfilled' && monetizationRes.value.ok) {
      const data = await monetizationRes.value.json();
      if (!data.error) monetization = data;
    }
  } catch (err) {
    console.error('Failed to fetch article content', err);
  }

  if (!content) {
    return (
      <div style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>⚠️ Article Not Found</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>The page you are looking for does not exist or has been archived.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: '16px', color: 'var(--primary)', textDecoration: 'underline' }}>Back to home feed</Link>
      </div>
    );
  }

  const jsonLdArticle = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: content.title,
    datePublished: content.createdAt,
    dateModified: content.updatedAt,
    author: {
      '@type': 'Person',
      name: content.author?.name || 'Editorial Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIMIS Media',
      logo: {
        '@type': 'ImageObject',
        url: 'https://mediafarm.vercel.app/logo.png'
      }
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdArticle) }}
      />
      <PostReaderClient initialPost={content} initialMonetization={monetization ?? undefined} />
    </>
  );
}
