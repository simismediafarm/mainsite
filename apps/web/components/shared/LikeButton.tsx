'use client';

import React, { useState } from 'react';
import { ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '../../lib/api-client';

interface LikeButtonProps {
  postId: string;
  initialLikes: number;
  onUpdate?: (postId: string, newLikes: number) => void;
}

export function LikeButton({ postId, initialLikes, onUpdate }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [loading, setLoading] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      const data = await apiClient.likePost(postId);
      const newLikes = Number(data.post.likes);
      setLikes(newLikes);
      onUpdate?.(postId, newLikes);
    } catch {
      toast.error('Failed to like post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={loading}
      aria-label={`Like this post (${likes} likes)`}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm text-[#bac9cc] hover:text-[#e5e2e1] disabled:opacity-50 transition-colors"
    >
      <ThumbsUp size={14} aria-hidden="true" />
      <span className="font-semibold">{likes}</span>
    </button>
  );
}
