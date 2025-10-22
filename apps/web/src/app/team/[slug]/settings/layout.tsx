'use client';

import { useEffect, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  useEffect(() => {
    // Smooth scroll to top when navigating between settings tabs
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }, [pathname]);

  return <>{children}</>;
}
