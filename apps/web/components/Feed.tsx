'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Post, SSEEvent } from '@simis/shared';
import PostCard from './PostCard';
import { useEventSourceFeed } from '../lib/sse';

interface FeedProps {
  initialPosts: Post[];
}

export default function Feed({ initialPosts }: FeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [visibleCount, setVisibleCount] = useState(5);

  const fetchFeed = async () => {
    const res = await fetch('/api/feed');
    const data = await res.json();
    setPosts(data.posts);
  };

  // Subscribe to real-time events via Hono SSE
  useEventSourceFeed((event: SSEEvent) => {
    if (event.type === 'post_updated') {
      const updatedPost = event.payload as Post;
      setPosts((prev) =>
        prev.map((p) => (p.id === updatedPost.id ? { ...p, ...updatedPost } : p))
      );
    } else if (event.type === 'like_updated') {
      const { id, likes } = event.payload as { id: string; likes: number };
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, likes } : p))
      );
    } else if (event.type === 'post_viewed') {
      const { id, views } = event.payload as { id: string; views: number };
      setPosts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, views } : p))
      );
    } else if (
      event.type === 'state_transition' ||
      event.type === 'editorial_state_changed' ||
      event.type === 'rpm_updated' ||
      event.type === 'feed_reranked'
    ) {
      fetchFeed();
    }
  });

  const handleLikeUpdate = (id: string, newLikes: number) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, likes: newLikes } : p))
    );
  };

  // Trending tags list
  const trendingTags = ['Engineering', 'Design', 'UX', 'Typography', 'Simplicity', 'Tech', 'Startups'];

  const displayedPosts = posts.slice(0, visibleCount);
  const hasMore = posts.length > visibleCount;

  return (
    <div style={styles.feedContainer}>
      {/* Trending Tags Section */}
      <div style={styles.trendingSection}>
        <span style={styles.trendingLabel}>Trending:</span>
        <div style={styles.tagsContainer}>
          {trendingTags.map((tag) => (
            <Link key={tag} href={`/tag/${tag}`} className="tag-pill">
              #{tag}
            </Link>
          ))}
        </div>
      </div>

      {/* Posts List */}
      <div style={styles.postsList}>
        {displayedPosts.map((post) => (
          <PostCard 
            key={post.id} 
            post={post} 
            onLikeUpdate={handleLikeUpdate} 
          />
        ))}

        {posts.length === 0 && (
          <div style={styles.emptyState}>
            <p>No stories found. Write the first story of SIMIS MediaFarm!</p>
            <Link href="/create" className="btn btn-outline" style={{ marginTop: '12px' }}>
              Write a story
            </Link>
          </div>
        )}
      </div>

      {/* Infinite Scroll/Load More Loader */}
      {hasMore && (
        <div style={styles.loaderContainer}>
          <button 
            onClick={() => setVisibleCount((prev) => prev + 5)} 
            className="btn btn-secondary"
          >
            Load more stories
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  feedContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  trendingSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 0',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  trendingLabel: {
    fontSize: '13px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: 'var(--text-secondary)',
  },
  tagsContainer: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  postsList: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px',
    color: 'var(--text-secondary)',
  },
  loaderContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '30px 0',
  },
};
