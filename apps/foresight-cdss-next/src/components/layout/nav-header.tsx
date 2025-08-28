'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'PA Queue', href: '/queue' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Bulk Operations', href: '/bulk-ops' },
  { name: 'Settings', href: '/settings' },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="3" width="7" height="7" rx="1.5" fill="#0066cc" />
              <rect x="14" y="3" width="7" height="7" rx="1.5" fill="#06b6d4" />
              <rect x="3" y="14" width="7" height="7" rx="1.5" fill="#06b6d4" />
              <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#0066cc" />
            </svg>
            <span className="text-xl font-semibold text-blue-600">
              Foresight PA Automation
            </span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href || 
                (item.href !== '/' && pathname.startsWith(item.href));
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium py-2 border-b-2 transition-colors',
                    isActive
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-500 border-transparent hover:text-blue-600'
                  )}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">PA Coordinator</span>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm">
              JD
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}