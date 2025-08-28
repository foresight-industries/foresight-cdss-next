import React from 'react';
import { cn } from '@/lib/utils';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'warning' | 'error' | 'info';
  children: React.ReactNode;
}

const variantStyles = {
  success: 'bg-green-50 text-green-900 border-l-4 border-green-500',
  warning: 'bg-amber-50 text-amber-900 border-l-4 border-amber-500',
  error: 'bg-red-50 text-red-900 border-l-4 border-red-500',
  info: 'bg-blue-50 text-blue-900 border-l-4 border-blue-500',
};

const iconMap = {
  success: '✓',
  warning: '⚠️',
  error: '✕',
  info: 'ℹ️',
};

export function Alert({ variant = 'info', className, children, ...props }: AlertProps) {
  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg mb-4 flex items-center gap-2 text-sm',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      <span className="text-base">{iconMap[variant]}</span>
      <div className="flex-1">{children}</div>
    </div>
  );
}