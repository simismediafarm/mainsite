import React from 'react';
import Link from 'next/link';
import { Post } from '@simis/shared';
import PostCard from '../../../components/PostCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ tag: string }>;
}

export default async function TagPage({ params }: PageProps) {
  const { tag } = await params;
  const decodedTag = decodeURIComponent(tag);
  
  let posts: Post[] = [];
  let relatedTopics: string[] = [];

  try {
    const res = await fetch(`http://127.0.0.1:4000/api/mvp/tag/${tag}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      posts = data.posts || [];
    }
    
    // In a real app, related topics would be fetched from the Topic Cluster Engine
    // For V1.2 Frontend mock, we'll generate some static related topics based on the tag
    relatedTopics = [`${decodedTag} Trends`, `Future of ${decodedTag}`, `Applied ${decodedTag}`];
  } catch (err) {
    console.error(`Error fetching posts for tag ${tag}:`, err);
  }

  // Segment posts based on V1.2 Architecture
  const featuredPosts = posts.filter(p => p.status === 'featured').slice(0, 2);
  const latestPosts = posts.filter(p => p.status !== 'featured');

  // Fallback if no featured explicitly
  if (featuredPosts.length === 0 && posts.length > 2) {
    featuredPosts.push(...posts.slice(0, 2));
    latestPosts.splice(0, 2);
  }

  return (
    <div className="reader-container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
      
      {/* 1. Topic Header */}
      <header style={styles.header}>
        <div style={styles.topicBreadcrumb}>Topic Cluster</div>
        <h1 style={styles.title}>{decodedTag}</h1>
        <p style={styles.subtitle}>
          Deep dives, programmatic insights, and curated intelligence around {decodedTag}.
        </p>
        <div style={styles.statsRow}>
          <span>{posts.length} articles</span>
          <span>•</span>
          <span>{posts.reduce((acc, p) => acc + (p.views || 0), 0).toLocaleString()} views</span>
        </div>
      </header>

      {/* Main Grid Layout for Topic Hub */}
      <div style={styles.hubLayout}>
        <div style={styles.mainContent}>
          
          {/* 2. Featured Content */}
          {featuredPosts.length > 0 && (
            <section style={styles.section}>
              <h2 style={styles.sectionTitle}>Featured Intelligence</h2>
              <div style={styles.featuredGrid}>
                {featuredPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          )}

          {/* 3. Latest Content */}
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Latest in {decodedTag}</h2>
            {latestPosts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {latestPosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--text-secondary)' }}>No other articles published in this cluster yet.</p>
            )}
          </section>
        </div>

        {/* Sidebar */}
        <aside style={styles.sidebar}>
          {/* 4. Related Topics */}
          <div className="glass-container" style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Related Clusters</h3>
            <ul style={styles.relatedList}>
              {relatedTopics.map(topic => (
                <li key={topic} style={styles.relatedItem}>
                  <Link href={`/tag/${encodeURIComponent(topic)}`} style={styles.relatedLink}>
                    {topic}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="glass-container" style={styles.sidebarCard}>
            <h3 style={styles.sidebarTitle}>Follow {decodedTag}</h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Get updates when new intelligence is published in this topic cluster.
            </p>
            <button style={styles.followBtn}>Follow Topic</button>
          </div>
        </aside>
      </div>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '60px 0 40px 0',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '40px',
  },
  topicBreadcrumb: {
    fontSize: '13px',
    fontWeight: 700,
    textTransform: 'uppercase',
    color: 'var(--primary)',
    letterSpacing: '0.1em',
    marginBottom: '12px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 800,
    letterSpacing: '-0.04em',
    marginBottom: '16px',
    color: 'var(--text-primary)',
    textTransform: 'capitalize',
  },
  subtitle: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    maxWidth: '600px',
    lineHeight: '1.5',
    marginBottom: '20px',
  },
  statsRow: {
    display: 'flex',
    gap: '12px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
    fontWeight: 500,
  },
  hubLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 320px',
    gap: '40px',
    alignItems: 'start',
  },
  mainContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '60px',
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '24px',
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
  },
  featuredGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px',
  },
  sidebar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    position: 'sticky',
    top: '100px',
  },
  sidebarCard: {
    padding: '24px',
    borderRadius: '12px',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginBottom: '16px',
  },
  relatedList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  relatedItem: {
    borderBottom: '1px solid var(--surface-border)',
    paddingBottom: '8px',
  },
  relatedLink: {
    textDecoration: 'none',
    color: 'var(--text-primary)',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  followBtn: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--text-primary)',
    color: 'var(--background)',
    fontWeight: 600,
    cursor: 'pointer',
  }
};
