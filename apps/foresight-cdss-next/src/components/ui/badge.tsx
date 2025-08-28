import React from 'react';
import { cn } from '@/lib/utils';
import type { PAStatus } from '@/types/pa.types';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PAStatus | 'default';
  children: React.ReactNode;
}

const variantStyles = {
  'needs-review': 'bg-amber-100 text-amber-900',
  'auto-processing': 'bg-blue-100 text-blue-900',
  'auto-approved': 'bg-green-100 text-green-900',
  'auto-denied': 'bg-red-100 text-red-900',
  'denied': 'bg-red-100 text-red-900',
  'error': 'bg-red-100 text-red-900',
  'default': 'bg-gray-100 text-gray-900',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium',
          variantStyles[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';