import React from 'react';

export function PostCardSkeleton() {
  return (
    <div className="py-6 border-b border-[#222222]/40 space-y-3 animate-pulse">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-[#2a2a2a]" />
        <div className="h-3 w-24 bg-[#2a2a2a] rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-4 w-3/4 bg-[#2a2a2a] rounded" />
        <div className="h-3 w-full bg-[#2a2a2a] rounded" />
        <div className="h-3 w-5/6 bg-[#2a2a2a] rounded" />
      </div>
      <div className="flex gap-3">
        <div className="h-3 w-16 bg-[#2a2a2a] rounded" />
        <div className="h-3 w-12 bg-[#2a2a2a] rounded" />
      </div>
    </div>
  );
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </>
  );
}
