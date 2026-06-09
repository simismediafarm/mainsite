'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThumbsUp, Eye } from 'lucide-react';
import { Post } from '@simis/shared';
import { toast } from 'sonner';
import { apiClient } from '../lib/api-client';

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
      const data = await apiClient.likePost(post.id);
      setLikes(data.post.likes);
      onLikeUpdate?.(post.id, data.post.likes);
    } catch (err) {
      console.error('Failed to like post:', err);
      toast.error('Failed to like post');
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
        <span aria-hidden="true">•</span>
        <time dateTime={new Date(post.createdAt).toISOString()}>{formattedDate}</time>
      </div>

      {/* Title & Excerpt */}
      <Link href={`/post/${post.id}`} style={{ display: 'block' }}>
        <h2 className="post-card-title">{post.title}</h2>
        <p className="post-card-excerpt">{post.excerpt}</p>
      </Link>

      {/* Footer */}
      <div className="post-meta-row" style={{ justifyContent: 'space-between', marginTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={styles.readingTime}>{post.readingTime || 3} min read</span>
          <span aria-hidden="true">•</span>
          <span style={styles.readingTime}>
            <Eye size={14} aria-hidden="true" style={{ marginRight: 4, verticalAlign: 'text-bottom' }} />
            <span className="sr-only">Views: </span>{post.views}
          </span>
          {post.rpmReal !== undefined && post.rpmReal > 0 && (
            <>
              <span aria-hidden="true">•</span>
              <span style={styles.rpmBadge}>${post.rpmReal.toFixed(2)} RPM</span>
            </>
          )}
          {post.tags && post.tags.length > 0 && (post.tags as Array<string | { name: string }>).map((tag) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            return (
              <Link key={tagName} href={`/tag/${tagName}`} className="tag-pill">
                {tagName}
              </Link>
            );
          })}
        </div>

        <button
          onClick={handleLike}
          disabled={isLiking}
          style={styles.likeBtn}
          aria-label={`Like this post (${likes} likes)`}
          aria-pressed={false}
        >
          <ThumbsUp size={16} aria-hidden="true" />
          <span style={{ fontWeight: 600, marginLeft: '4px' }}>{likes}</span>
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
    color: 'var(--text-secondary)',
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
