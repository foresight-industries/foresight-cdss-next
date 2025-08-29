import './global.css';
import { Analytics } from "@vercel/analytics/next"
import type { ReactNode } from "react";
import { QueryProvider } from '@/components/providers/query-provider';
import { AuthProvider } from '@/components/providers/auth-provider';
import { LayoutWrapper } from '@/components/layout/layout-wrapper';
import { ThemeProvider } from "@/components/theme-provider";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <QueryProvider>
              <LayoutWrapper>
                {children}
              </LayoutWrapper>
            </QueryProvider>
          </AuthProvider>
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  );
}
