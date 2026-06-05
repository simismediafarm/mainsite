import React from 'react';
import Link from 'next/link';
import { Post } from '@simis/shared';
import PostCard from '../components/PostCard';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  let initialPosts: Post[] = [];
  let trendingTags: string[] = ['Technology', 'AI', 'Startups', 'Future', 'Engineering'];

  try {
    // We use 127.0.0.1 instead of localhost to prevent IPv6 DNS resolution issues in Node
    const res = await fetch(`http://127.0.0.1:4000/api/mvp/feed`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      initialPosts = data.posts || [];
    }
  } catch (err: any) {
    if (err.code === 'ECONNREFUSED' || err.message?.includes('fetch failed')) {
      console.warn('Backend API is not available yet. Using empty feed.');
    } else {
      console.error('Failed to fetch initial feed', err);
    }
  }

  // Segment posts based on V1.2 Architecture
  const heroPost = initialPosts[0];
  const featuredPosts = initialPosts.slice(1, 4);
  const latestPosts = initialPosts.slice(4);

  return (
    <div className="reader-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
      <header style={styles.header}>
        <h1 style={styles.title}>The Future Belongs to Publishers Who Understand Attention</h1>
        <p style={styles.subtitle}>Curated intelligence, programmatic insights, and deep technical editorials.</p>
      </header>

      {/* 1. Hero Story */}
      {heroPost && (
        <section style={styles.section}>
          <Link href={`/post/${heroPost.id}`} style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.featuredBadge}>FEATURED STORY</span>
              <h2 style={styles.heroTitle}>{heroPost.title}</h2>
              <p style={styles.heroExcerpt}>{heroPost.excerpt}</p>
              <div style={styles.heroMeta}>
                By {heroPost.author?.name || 'Editorial Team'} • {new Date(heroPost.createdAt).toLocaleDateString()}
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* 2. Trending Topics */}
      <section style={styles.section}>
        <h3 style={styles.sectionTitle}>Explore Trending Topics</h3>
        <div style={styles.topicPills}>
          {trendingTags.map(tag => (
            <Link key={tag} href={`/tag/${tag}`} style={styles.topicPill}>
              {tag}
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Stories Grid */}
      {featuredPosts.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Curated Intelligence</h3>
          <div style={styles.featuredGrid}>
            {featuredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Latest Publications */}
      {latestPosts.length > 0 && (
        <section style={styles.section}>
          <h3 style={styles.sectionTitle}>Latest Publications</h3>
          <div style={styles.latestGrid}>
            {latestPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Newsletter CTA */}
      <section style={styles.newsletterSection}>
        <h3 style={styles.newsletterTitle}>Never Miss a Great Story</h3>
        <p style={styles.newsletterDesc}>Receive carefully selected articles directly in your inbox.</p>
        <div style={styles.newsletterForm}>
          <input type="email" placeholder="Enter your email" style={styles.newsletterInput} />
          <button type="button" style={styles.newsletterBtn}>Subscribe</button>
        </div>
      </section>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '60px 0 40px 0',
    textAlign: 'center',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '48px',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    lineHeight: '1.1',
    marginBottom: '16px',
    color: 'var(--text-primary)',
  },
  subtitle: {
    fontSize: '20px',
    color: 'var(--text-secondary)',
    lineHeight: '1.5',
  },
  section: {
    marginBottom: '60px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  heroCard: {
    display: 'block',
    textDecoration: 'none',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: '12px',
    padding: '40px',
    border: '1px solid var(--border-color)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  },
  heroContent: {
    maxWidth: '700px',
  },
  featuredBadge: {
    fontSize: '12px',
    fontWeight: 700,
    color: 'var(--primary)',
    letterSpacing: '0.1em',
    marginBottom: '12px',
    display: 'block',
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    marginBottom: '16px',
    lineHeight: '1.2',
  },
  heroExcerpt: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  heroMeta: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
    fontWeight: 500,
  },
  topicPills: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  topicPill: {
    padding: '8px 16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'border-color 0.2s ease',
  },
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px',
  },
  latestGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px',
  },
  newsletterSection: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '60px 40px',
    borderRadius: '16px',
    textAlign: 'center',
    marginBottom: '80px',
    border: '1px solid var(--border-color)',
  },
  newsletterTitle: {
    fontSize: '28px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '12px',
  },
  newsletterDesc: {
    fontSize: '16px',
    color: 'var(--text-secondary)',
    marginBottom: '32px',
  },
  newsletterForm: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    maxWidth: '500px',
    margin: '0 auto',
  },
  newsletterInput: {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid var(--border-color)',
    fontSize: '16px',
    backgroundColor: 'var(--background)',
    color: 'var(--text-primary)',
  },
  newsletterBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
