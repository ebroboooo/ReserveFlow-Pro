import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
      <Icon className="h-7 w-7 text-slate-400" />
    </div>
    <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
    {description && <p className="text-sm text-slate-500 max-w-sm mb-4">{description}</p>}
    {action}
  </div>
);
