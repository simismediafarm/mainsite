'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Eye } from 'lucide-react';
import { Post } from '@simis/shared';

interface PostCardProps {
  post: Post;
  onLikeUpdate?: (id: string, newLikes: number) => void;
}

export default function PostCard({ post, onLikeUpdate }: PostCardProps) {
  const [likes, setLikes] = useState(post.likes);
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLiking) return;

    setIsLiking(true);
    try {
      const res = await fetch(`/api/mvp/post/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLikes(data.post.likes);
        if (onLikeUpdate) {
          onLikeUpdate(post.id, data.post.likes);
        }
      }
    } catch (err) {
      console.error('Failed to like post:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <article className="post-card fade-in">
      {/* Author Row */}
      <div className="post-meta-row" style={{ marginBottom: '4px' }}>
        {post.author?.avatar && (
          <img 
            src={post.author.avatar} 
            alt={post.author.name} 
            style={styles.avatar} 
          />
        )}
        <Link href={`/author/${post.authorId}`} className="author-name">
          {post.author?.name || 'Writer'}
        </Link>
        <span>•</span>
        <span>{formattedDate}</span>
      </div>

      {/* Title & Excerpt */}
      <Link href={`/post/${post.id}`} style={{ display: 'block' }}>
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
      </Link>

      {/* Footer / Interaction Row */}
      <div className="post-meta-row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={styles.readingTime}>{post.readingTime || 3} min read</span>
          <span>•</span>
          <span style={styles.readingTime}><Eye size={14} style={{ marginRight: 4, verticalAlign: 'text-bottom' }} /> {post.views} views</span>
          <span>•</span>
          {post.rpmReal !== undefined && post.rpmReal > 0 && (
            <span style={styles.rpmBadge}>${post.rpmReal.toFixed(2)} RPM</span>
          )}
          {post.tags && post.tags.length > 0 && post.tags.map((tag: any) => (
            <Link key={tag.name || tag} href={`/tag/${tag.name || tag}`} className="tag-pill">
              {tag.name || tag}
            </Link>
          ))}
        </div>

        <button 
          onClick={handleLike} 
          disabled={isLiking} 
          style={{
            ...styles.likeBtn,
            color: likes > post.likes ? 'var(--primary-color)' : 'var(--text-secondary)'
          }}
          title="Like this post"
        >
          <ThumbsUp size={16} /> <span style={{ fontWeight: 600, marginLeft: '4px' }}>{likes}</span>
        </button>
      </div>
    </article>
  );
}

const styles: Record<string, React.CSSProperties> = {
  avatar: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    objectFit: 'cover',
  },
  readingTime: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
  },
  likeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '12px',
    transition: 'background-color 0.15s',
  },
  rpmBadge: {
    backgroundColor: 'rgba(26, 137, 23, 0.1)',
    color: 'var(--primary-color)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 600,
  },
};
