'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  className?: string;
  size?: 'sm' | 'lg' | 'default';
  variant?: 'outline' | 'default' | 'destructive' | 'secondary' | 'ghost' | 'link';
}

export function BackButton({ className, size = 'lg', variant = 'outline' }: BackButtonProps) {
  return (
    <Button
      variant={variant}
      onClick={() => window.history.back()}
      size={size}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <ArrowLeft className="h-4 w-4" />
      Go Back
    </Button>
  );
}