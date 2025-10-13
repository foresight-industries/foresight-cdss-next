import "./global.css";

import { Analytics } from "@vercel/analytics/next";
import type { ReactNode } from "react";
import { QueryProvider } from "@/components/providers/query-provider";
import { LayoutWrapper } from "@/components/layout/layout-wrapper";
import { ThemeProvider } from "@/components/theme-provider";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Foresight RCM Dashboard",
  description: "Automated RCM System",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <ClerkProvider dynamic>
      <html lang="en" suppressHydrationWarning>
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              <LayoutWrapper>
                {children}
                <SpeedInsights />
              </LayoutWrapper>
            </QueryProvider>
            <Analytics />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
