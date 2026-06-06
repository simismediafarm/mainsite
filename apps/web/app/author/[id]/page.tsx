import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Eye, ThumbsUp } from 'lucide-react';
import { Profile, Post } from '@simis/shared';
import PostCard from '../../../components/PostCard';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AuthorPage({ params }: PageProps) {
  const { id } = await params;
  let author: Profile | null = null;
  let posts: Post[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_KERNEL_API_URL || (process.env.VERCEL_URL ? 'https://' + process.env.VERCEL_URL : 'http://127.0.0.1:4000')}/api/mvp/author/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      author = data.author || null;
      posts = data.posts || [];
    }
  } catch (err) {
    console.error('Error fetching author info:', err);
  }

  if (!author) {
    return (
      <div className="reader-container" style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h2>Author Not Found</h2>
        <p>This writer does not exist or has left SIMIS MediaFarm.</p>
        <Link href="/" className="btn btn-primary" style={{ marginTop: '16px' }}>
          Back to Feed
        </Link>
      </div>
    );
  }

  // Calculate metrics
  const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likes || 0), 0);
  const avgTrustScore = posts.length > 0 
    ? Math.round(posts.reduce((sum, p) => sum + (p.trustScore || 80), 0) / posts.length)
    : 80;

  // Segment posts based on V1.2 Architecture
  const pinnedPosts = posts.filter(p => p.status === 'featured').slice(0, 1);
  const latestPosts = posts.filter(p => p.status !== 'featured');

  if (pinnedPosts.length === 0 && posts.length > 0) {
    // If no featured, just pin the first one
    pinnedPosts.push(posts[0]);
    latestPosts.shift();
  }

  return (
    <div className="reader-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px' }}>
      
      {/* 1. Author Header & Bio */}
      <header style={styles.header}>
        <div style={styles.profileRow}>
          <img src={author.avatar || 'https://via.placeholder.com/120'} alt={author.name} style={styles.avatar} />
          <div style={styles.details}>
            <div style={styles.nameRow}>
              <h1 style={styles.name}>{author.name}</h1>
              {author.role === 'admin' || author.role === 'editor' ? (
                <span style={styles.verifiedBadge} title="Verified Editorial Staff">
                  <ShieldCheck size={18} /> Staff
                </span>
              ) : null}
            </div>
            <p style={styles.bio}>{author.bio}</p>
          </div>
        </div>
        
        {/* 2. Author Metrics & Trust Score */}
        <div className="glass-container" style={styles.metricsRow}>
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Trust Score</span>
            <div style={styles.metricValGroup}>
              <ShieldCheck size={20} color="var(--primary)" />
              <span style={{ ...styles.metricVal, color: 'var(--primary)' }}>{avgTrustScore}/100</span>
            </div>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Total Reach</span>
            <div style={styles.metricValGroup}>
              <Eye size={18} />
              <span style={styles.metricVal}>{totalViews.toLocaleString()}</span>
            </div>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Applause</span>
            <div style={styles.metricValGroup}>
              <ThumbsUp size={18} />
              <span style={styles.metricVal}>{totalLikes.toLocaleString()}</span>
            </div>
          </div>
          <div style={styles.metricDivider} />
          <div style={styles.metricItem}>
            <span style={styles.metricLabel}>Publications</span>
            <div style={styles.metricValGroup}>
              <span style={styles.metricVal}>{posts.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Pinned Content */}
      {pinnedPosts.length > 0 && (
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Pinned by {author.name.split(' ')[0]}</h2>
          </div>
          <div style={styles.pinnedGrid}>
            {pinnedPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}

      {/* 4. Latest Publications */}
      <section style={styles.section}>
        <div style={styles.sectionHeader}>
          <h2 style={styles.sectionTitle}>Latest Publications</h2>
        </div>
        <div style={styles.latestGrid}>
          {latestPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {latestPosts.length === 0 && posts.length <= 1 && (
            <p style={{ color: 'var(--text-secondary)' }}>No other publications yet.</p>
          )}
        </div>
      </section>

    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    padding: '60px 0 40px 0',
    marginBottom: '40px',
  },
  profileRow: {
    display: 'flex',
    gap: '32px',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: '40px',
  },
  avatar: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '4px solid var(--bg-secondary)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
  },
  details: {
    flex: 1,
    minWidth: '250px',
    paddingTop: '10px',
  },
  nameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  name: {
    fontSize: '36px',
    fontWeight: 800,
    color: 'var(--text-primary)',
    lineHeight: 1,
  },
  verifiedBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    backgroundColor: 'rgba(26, 137, 23, 0.1)',
    color: 'var(--primary)',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700,
  },
  bio: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    lineHeight: '1.6',
    maxWidth: '600px',
  },
  metricsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px',
    borderRadius: '16px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  metricItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  metricLabel: {
    fontSize: '12px',
    fontWeight: 600,
    textTransform: 'uppercase',
    color: 'var(--text-secondary)',
    letterSpacing: '0.05em',
  },
  metricValGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: 'var(--text-primary)',
  },
  metricVal: {
    fontSize: '24px',
    fontWeight: 800,
  },
  metricDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: 'var(--border-color)',
  },
  section: {
    marginBottom: '60px',
  },
  sectionHeader: {
    borderBottom: '1px solid var(--border-color)',
    paddingBottom: '12px',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: 700,
    color: 'var(--text-primary)',
  },
  pinnedGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px',
  },
  latestGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '32px',
  },
};
