import './global.css';
import { Analytics } from "@vercel/analytics/next"
import type { ReactNode } from "react";
import { NavHeader } from '@/components/layout/nav-header';
import { QueryProvider } from '@/components/providers/query-provider';

export const metadata = {
  title: 'Foresight PA Automation Dashboard',
  description: 'Automated Prior Authorization Management System',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <QueryProvider>
          <NavHeader />
          <main className="min-h-screen">
            {children}
          </main>
        </QueryProvider>
        <Analytics />
      </body>
    </html>
  );
}
