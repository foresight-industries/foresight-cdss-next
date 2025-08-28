'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'PA Queue', href: '/queue' },
  { name: 'Analytics', href: '/analytics' },
  { name: 'Settings', href: '/settings' },
];

export function NavHeader() {
  const pathname = usePathname();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
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
                  onClick={() => {
                    // Scroll to top when switching tabs
                    setTimeout(() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }, 100);
                  }}
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