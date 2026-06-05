'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Post, SSEEvent } from '@simis/shared';
import MarkdownRenderer from './MarkdownRenderer';
import { useEventSourceFeed } from '../lib/sse';
import { ThumbsUp, Eye, Share2 } from 'lucide-react';

interface PostReaderClientProps {
  initialPost: Post;
  initialMonetization?: {
    allowedSlots: string[];
    reasoning: string[];
  };
}

export default function PostReaderClient({ initialPost, initialMonetization }: PostReaderClientProps) {
  const [post, setPost] = useState<Post>(initialPost);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [auctionResults, setAuctionResults] = useState<any[]>([]);

  // Scroll Progress logic
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        const percentage = (window.scrollY / totalScroll) * 100;
        setScrollProgress(percentage);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Record view on mount
  useEffect(() => {
    let viewed = false;
    if (!viewed) {
      viewed = true;
      fetch(`/api/mvp/post/${post.id}/view`, { method: 'POST' }).catch(console.error);
    }

    // Run V1.1 Ad Auction Simulation
    if (initialMonetization?.allowedSlots?.length) {
      fetch('/api/mvp/ads/auction/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId: post.id, slots: initialMonetization.allowedSlots })
      }).then(res => res.json())
        .then(data => {
          if (data.results) setAuctionResults(data.results);
        }).catch(console.error);
    }
  }, [post.id, initialMonetization]);

  const handleAdClick = async (slot: string) => {
    try {
      await fetch(`/api/mvp/ads/click/${post.id}`, { method: 'POST' });
      console.log(`[Simulation] Ad click recorded for slot: ${slot}`);
    } catch (err) {
      console.error(err);
    }
  };

  const getAdForSlot = (slotType: string) => {
    const res = auctionResults.find(r => r.slot === slotType);
    if (!res) return null;
    return (
      <div 
        onClick={() => handleAdClick(slotType)}
        style={{...styles.adSlot, cursor: 'pointer'}} 
        title="Click to simulate CTR boost"
      >
        <span style={{color: '#8b5cf6', fontSize: '12px', display: 'block'}}>SPONSORED BY {res.winningBidder.toUpperCase()}</span>
        <div>[ {slotType.replace('_', ' ').toUpperCase()} ]</div>
        <span style={{color: '#10b981', fontSize: '11px', display: 'block'}}>Bid: {(res.winningBidValue / 100).toFixed(4)} USD</span>
      </div>
    );
  };

  // Subscribe to real-time updates for likes or post deletes
  useEventSourceFeed((event: SSEEvent) => {
    if (event.type === 'like_updated') {
      const { id, likes } = event.payload as { id: string; likes: number };
      if (id === post.id) {
        setPost((prev) => ({ ...prev, likes }));
      }
    } else if (event.type === 'post_updated') {
      const updated = event.payload as Post;
      if (updated.id === post.id) {
        setPost((prev) => ({ ...prev, ...updated }));
      }
    } else if (event.type === 'post_viewed') {
      const { id, views } = event.payload as { id: string; views: number };
      if (id === post.id) {
        setPost((prev) => ({ ...prev, views }));
      }
    }
  });

  const handleLike = async () => {
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await fetch(`/api/mvp/post/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setPost((prev) => ({ ...prev, likes: data.post.likes }));
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="reader-container fade-in" style={{ marginTop: '20px' }}>
      {/* Scroll Progress Bar */}
      <div className="progress-bar-container">
        <div className="progress-bar" style={{ width: `${scrollProgress}%` }} />
      </div>

      {/* Article Header */}
      <header style={styles.header}>
        <div style={styles.tagsRow}>
          {post.tags.map((tag) => (
            <Link key={tag} href={`/tag/${tag}`} className="tag-pill">
              {tag}
            </Link>
          ))}
        </div>
        <h1 className="article-title">{post.title}</h1>
        <p style={styles.excerpt}>{post.excerpt}</p>

        {/* Author Block */}
        <div style={styles.authorBlock}>
          {post.author?.avatar && (
            <img 
              src={post.author.avatar} 
              alt={post.author.name} 
              style={styles.avatar} 
            />
          )}
          <div style={styles.authorMeta}>
            <Link href={`/author/${post.authorId}`} style={styles.authorName}>
              {post.author?.name || 'Writer'}
            </Link>
            <div style={styles.metaRow}>
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{post.readingTime} min read</span>
              <span>•</span>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}><Eye size={14} style={{ marginRight: 4 }} /> {post.views} views</span>
              {post.rpmReal !== undefined && post.rpmReal > 0 && (
                <>
                  <span>•</span>
                  <span style={styles.rpmBadge}>${post.rpmReal.toFixed(2)} RPM</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Top Banner Slot */}
      {initialMonetization?.allowedSlots.includes('top_banner') && (
        getAdForSlot('top_banner') || <div style={styles.adSlot}>[ LOADING AD: Top Banner ]</div>
      )}

      {/* Main Content */}
      <article style={{ margin: '30px 0' }}>
        {initialMonetization?.allowedSlots.includes('inline_native') && (
          getAdForSlot('inline_native') || <div style={styles.adSlotInline}>[ LOADING NATIVE AD ]</div>
        )}
        <MarkdownRenderer content={post.content} />
        {initialMonetization?.allowedSlots.includes('mid_article') && (
          getAdForSlot('mid_article') || <div style={styles.adSlot}>[ LOADING AD: Mid Article ]</div>
        )}
      </article>

      {/* End Card Slot */}
      {initialMonetization?.allowedSlots.includes('end_card') && (
        getAdForSlot('end_card') || <div style={styles.adSlot}>[ LOADING AD: End Card ]</div>
      )}

      {/* Interaction Footer */}
      <footer style={styles.interactionFooter}>
        <div style={styles.interactionRow}>
          <button 
            onClick={handleLike} 
            disabled={isLiking} 
            style={styles.actionBtn}
            title="Applause"
          >
            <ThumbsUp size={16} /> <span style={{ fontWeight: 600, marginLeft: '6px' }}>{post.likes}</span>
          </button>

          <button onClick={handleShare} style={styles.actionBtn}>
            <Share2 size={16} style={{ marginRight: 6 }} /> {copied ? 'Copied Link!' : 'Share Story'}
          </button>
        </div>
      </footer>

      {/* Author Bio Block */}
      {post.author && (
        <div style={styles.bioCard}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <img src={post.author.avatar} alt={post.author.name} style={styles.bioAvatar} />
            <div>
              <h4 style={{ margin: 0, fontSize: '16px' }}>Written by {post.author.name}</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {post.author.bio}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    marginBottom: '32px',
  },
  tagsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
    flexWrap: 'wrap',
  },
  excerpt: {
    fontSize: '18px',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
    marginBottom: '24px',
    fontStyle: 'italic',
  },
  authorBlock: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderTop: '1px solid var(--border-color)',
    borderBottom: '1px solid var(--border-color)',
    padding: '16px 0',
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  authorMeta: {
    display: 'flex',
    flexDirection: 'column',
  },
  authorName: {
    fontWeight: 600,
    fontSize: '15px',
    color: 'var(--text-primary)',
    textDecoration: 'none',
  },
  metaRow: {
    display: 'flex',
    gap: '8px',
    fontSize: '13px',
    color: 'var(--text-secondary)',
  },
  interactionFooter: {
    borderTop: '1px solid var(--border-color)',
    padding: '24px 0',
    marginTop: '40px',
  },
  interactionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '8px 16px',
    fontSize: '14px',
    cursor: 'pointer',
    color: 'var(--text-primary)',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.15s',
  },
  bioCard: {
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '20px',
    marginTop: '30px',
  },
  bioAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  adSlot: {
    padding: '24px',
    margin: '20px 0',
    backgroundColor: '#f8f9fa',
    border: '1px dashed #ced4da',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#6c757d',
    fontWeight: 'bold',
    fontSize: '14px',
    letterSpacing: '0.05em'
  },
  adSlotInline: {
    padding: '12px',
    margin: '0 0 20px 0',
    backgroundColor: '#e9ecef',
    borderRadius: '4px',
    textAlign: 'center',
    color: '#495057',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  rpmBadge: {
    backgroundColor: 'rgba(26, 137, 23, 0.1)',
    color: 'var(--primary-color)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  }
};
