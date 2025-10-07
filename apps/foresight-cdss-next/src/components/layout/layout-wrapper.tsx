'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { useUser } from '@clerk/nextjs';
import { Skeleton } from '@/components/ui/skeleton';
import { InvitationBanner } from '@/components/invitation/invitation-banner';

export function LayoutWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { isLoaded } = useUser();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Don't show nav on auth pages or invitation page
  const isAuthPage =
    pathname === "/login" ||
    pathname === "/signup" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/confirm-email" ||
    pathname === "/error" ||
    pathname === '/onboard' ||
    pathname === '/accept-invitation';

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-muted/40">
        {!isAuthPage ? (
          <div className="flex h-screen">
            {/* Sidebar Skeleton */}
            <div className="w-64 bg-white border-r border-gray-200 p-4">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <Skeleton className="w-8 h-8 rounded-lg" />
                  <Skeleton className="h-6 w-32" />
                </div>
                <Skeleton className="w-6 h-6" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-3">
                    <Skeleton className="w-5 h-5" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6">
                <Skeleton className="w-full h-10 rounded-full" />
              </div>
            </div>
            {/* Main Content Skeleton */}
            <div className="flex-1 p-6">
              <Skeleton className="h-8 w-48 mb-6" />
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </div>
        ) : (
          <main className="flex-1">{children}</main>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {!isAuthPage ? (
        <div className="flex h-screen">
          <Sidebar
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          />
          <div className="flex-1 flex flex-col overflow-hidden">
            <InvitationBanner />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      ) : (
        <main className="flex-1">{children}</main>
      )}
    </div>
  );
}
