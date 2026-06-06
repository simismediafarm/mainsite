import React from 'react';
import NextLink from 'next/link';
import { Post } from '@simis/shared';
import PostReaderClient from '../../../components/PostReaderClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PostReaderPage({ params }: PageProps) {
  const { id } = await params;
  let post: Post | null = null;
  let relatedPosts: Post[] = [];
  let monetization: any = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || 'http://127.0.0.1:4000'}/api/mvp/post/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      post = data.post || null;
      monetization = data.monetization || null;
    }

    // Fetch feed to calculate related posts on server
    const feedRes = await fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || 'http://127.0.0.1:4000'}/api/mvp/feed`, { cache: 'no-store' });
    if (feedRes.ok && post) {
      const feedData = await feedRes.json();
      const allPosts: Post[] = feedData.posts || [];
      
      const currentPost = post; // helper reference
      // Filter related posts: must share a tag or have same author, and not be the same post
      relatedPosts = allPosts
        .filter((p) => p.id !== currentPost.id)
        .filter((p) => 
          p.authorId === currentPost.authorId || 
          p.tags.some((t) => currentPost.tags.includes(t))
        )
        .slice(0, 3);
    }
  } catch (err) {
    console.error('Error fetching post data:', err);
  }

  if (!post) {
    return (
      <div className="reader-container" style={styles.errorContainer}>
        <h2>Post Not Found</h2>
        <p>The story you are looking for does not exist or has been deleted.</p>
        <NextLink href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Feed
        </NextLink>
      </div>
    );
  }

  return (
    <div className="reader-container">
      {/* Dynamic Client Shell */}
      <PostReaderClient initialPost={post} initialMonetization={monetization} />

      {/* Related Posts Section */}
      {relatedPosts.length > 0 && (
        <section style={styles.relatedSection}>
          <h3 style={styles.relatedHeading}>Recommended from SIMIS MediaFarm</h3>
          <div style={styles.relatedGrid}>
            {relatedPosts.map((rp) => (
              <div key={rp.id} style={styles.relatedCard} className="glass-container">
                <NextLink href={`/post/${rp.id}`} style={{ textDecoration: 'none' }}>
                  <h4 style={styles.relatedTitle}>{rp.title}</h4>
                  <p style={styles.relatedExcerpt}>{rp.excerpt}</p>
                </NextLink>
                <div style={styles.relatedMeta}>
                  <NextLink href={`/author/${rp.authorId}`} style={{ fontWeight: 600 }}>
                    {rp.author?.name || 'Writer'}
                  </NextLink>
                  <span>• {rp.readingTime} min read</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  errorContainer: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  relatedSection: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '40px',
    marginTop: '60px',
  },
  relatedHeading: {
    fontSize: '20px',
    fontWeight: 700,
    marginBottom: '20px',
  },
  relatedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
  },
  relatedCard: {
    padding: '16px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '160px',
  },
  relatedTitle: {
    fontSize: '15px',
    fontWeight: 700,
    lineHeight: '1.3',
    marginBottom: '6px',
    color: 'var(--text-primary)',
  },
  relatedExcerpt: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  relatedMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--text-secondary)',
    borderTop: '1px solid var(--border-color)',
    paddingTop: '8px',
    marginTop: 'auto',
  },
};
