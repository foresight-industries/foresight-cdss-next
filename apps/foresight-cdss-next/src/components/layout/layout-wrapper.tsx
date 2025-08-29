'use client';

import { usePathname } from 'next/navigation';
import { NavHeader } from './nav-header';
import { useAuth } from '@/components/providers/auth-provider';
import { Skeleton } from '@/components/ui/skeleton';

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  
  // Don't show nav on auth pages
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/reset-password' || pathname === '/confirm-email';
  
  if (loading) {
    return (
      <div className="min-h-screen bg-muted/40">
        {!isAuthPage && (
          <div className="bg-background border-b border-gray-200 shadow-sm sticky top-0 z-40">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-6 w-48" />
                </div>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="w-9 h-9 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {!isAuthPage && user && <NavHeader />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}