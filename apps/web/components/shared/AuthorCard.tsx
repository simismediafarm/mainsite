import React from 'react';
import Link from 'next/link';

interface AuthorCardProps {
  authorId: string;
  name?: string | null;
  avatar?: string | null;
  role?: string | null;
  size?: 'sm' | 'md';
}

export function AuthorCard({ authorId, name, avatar, role, size = 'md' }: AuthorCardProps) {
  const imgClass = size === 'sm' ? 'w-5 h-5' : 'w-6 h-6';
  const textClass = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="flex items-center gap-2">
      {avatar && (
        <img src={avatar} alt={name ?? 'Author'} className={`${imgClass} rounded-full object-cover`} />
      )}
      <div>
        <Link href={`/author/${authorId}`} className={`${textClass} font-bold text-[#e5e2e1] hover:text-[#00E5FF] transition-colors`}>
          {name ?? 'Writer'}
        </Link>
        {role && <p className="text-xs text-[#bac9cc]">{role}</p>}
      </div>
    </div>
  );
}
