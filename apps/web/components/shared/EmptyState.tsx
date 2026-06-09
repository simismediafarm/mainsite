import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-3" role="status">
      <p className="text-[#e5e2e1] font-semibold">{title}</p>
      {description && <p className="text-sm text-[#bac9cc]">{description}</p>}
      {action}
    </div>
  );
}
