import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = { sm: 'h-5 w-5', md: 'h-8 w-8', lg: 'h-12 w-12' };

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  label,
}) => (
  <div className={`flex flex-col items-center justify-center gap-3 ${className}`} role="status" aria-label={label || 'Loading'}>
    <div className={`animate-spin rounded-full border-2 border-slate-200 border-t-brand-600 ${sizeMap[size]}`} />
    {label && <p className="text-sm text-slate-500">{label}</p>}
  </div>
);

export const PageLoader: React.FC = () => (
  <div className="min-h-screen bg-slate-50 flex items-center justify-center">
    <LoadingSpinner size="lg" label="Loading..." />
  </div>
);
