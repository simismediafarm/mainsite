import React from 'react';
import Link from 'next/link';

interface TagPillProps {
  tag: string | { name: string };
  onClick?: () => void;
}

export function TagPill({ tag, onClick }: TagPillProps) {
  const name = typeof tag === 'string' ? tag : tag.name;

  if (onClick) {
    return (
      <button onClick={onClick} className="tag-pill">#{name}</button>
    );
  }
  return (
    <Link href={`/tag/${name}`} className="tag-pill">#{name}</Link>
  );
}
