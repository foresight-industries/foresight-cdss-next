'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
  FileText,
  FolderOpen,
  Hamburger,
} from "lucide-react";
import { useUser, useClerk } from '@clerk/nextjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar as SidebarPrimitive,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface SidebarProps {
  sidebarOpen?: boolean;
  onToggleSidebar?: () => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Prior Auth', href: '/queue', icon: ClipboardList },
  { name: 'Claims', href: '/claims', icon: FileText },
  { name: 'Credentialing', href: '/credentialing', icon: FolderOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ sidebarOpen, onToggleSidebar }: Readonly<SidebarProps>) {
  const pathname = usePathname();
  const params = useParams();
  const { state: sidebarState } = useSidebar();

  const { signOut, redirectToSignIn } = useClerk();
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0].emailAddress ?? "";

  const isCollapsed = sidebarState === "collapsed";
  const teamSlug = params?.slug as string;

  return (
    <SidebarPrimitive
      collapsible="icon"
      className="transition-all duration-300 ease-in-out"
    >
      <SidebarHeader className={cn(
        "flex flex-row items-center border-b border-border w-full",
        isCollapsed ? "justify-center p-6" : "justify-between p-4"
      )}>
        {isCollapsed ? (
          <SidebarTrigger className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer shrink-0">
            <Hamburger className="size-10 shrink-0 text-muted-foreground" />
          </SidebarTrigger>
        ) : (
          <>
            <Link href="/" className="flex items-center gap-2.5 min-w-0 flex-1">
              <Image
                src="/android-chrome-192x192.png"
                alt="Foresight Logo"
                width={32}
                height={32}
                className="rounded-lg shrink-0"
              />
              <span className="text-xl font-semibold text-primary">
                Foresight RCM
              </span>
            </Link>
            <SidebarTrigger className="p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer shrink-0">
              <Hamburger className="size-10 shrink-0 text-muted-foreground" />
            </SidebarTrigger>
          </>
        )}
      </SidebarHeader>

      <SidebarContent className={cn(
        "flex flex-1 flex-col",
        isCollapsed ? "px-6 pt-2 pb-6" : "px-4 pt-2 pb-4"
      )}>
        <SidebarMenu className="space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = (() => {
              if (item.href === "/") {
                // For home page, check if we're at the root of the team or global root
                return (pathname === "/" || (teamSlug && pathname === `/team/${teamSlug}`));
              } else {
                // For other pages, check if pathname ends with the href or starts with it
                const pathSegments = pathname?.split('/') ?? [];
                const hrefSegments = item.href.split('/');
                const lastPathSegment = pathSegments[pathSegments.length - 1];
                const lastHrefSegment = hrefSegments[hrefSegments.length - 1];

                return Boolean(lastPathSegment === lastHrefSegment ||
                              pathname?.includes(item.href));
              }
            })();

            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={!!isActive}
                  tooltip={isCollapsed ? item.name : undefined}
                  className={cn(
                    "w-full p-6 rounded-lg transition-all duration-300 text-base",
                    isCollapsed ? "justify-center" : "gap-3 text-left",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold shadow-xs"
                      : "text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <Link
                    href={teamSlug ? `/team/${teamSlug}${item.href}` : item.href}
                    className={cn(
                      "flex items-center",
                      isCollapsed ? "justify-center" : "gap-3"
                    )}
                    onClick={() => {
                      setTimeout(() => {
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }, 100);
                    }}
                  >
                    <Icon
                      className={cn(
                        "size-10 shrink-0",
                        isActive ? "text-primary" : "text-foreground/70"
                      )}
                    />
                    {!isCollapsed && <span className="truncate text-base">{item.name}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter
        className={cn(
          "border-t border-border",
          isCollapsed ? "flex justify-center p-6" : "space-y-3 p-4"
        )}
      >
        {!isCollapsed && (
          <div className="text-xs text-muted-foreground">PA Coordinator</div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "cursor-pointer rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-shadow focus:outline-hidden focus:ring-2 focus:ring-primary focus:ring-offset-2",
                isCollapsed ? "w-9 h-9" : "w-full h-10 gap-3 pl-3 pr-3"
              )}
            >
              {!isCollapsed ? (
                <>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {(user?.firstName && user?.lastName) ? user?.firstName.slice(0, 1).concat(user.lastName.slice(0, 1)).toUpperCase() : "U"}
                  </span>
                  <span className="flex-1 text-left truncate">
                    {user?.firstName ? user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) : "User"}
                  </span>
                </>
              ) : (user?.firstName && user?.lastName) ? (
                user?.firstName.slice(0, 1).concat(user.lastName.slice(0, 1)).toUpperCase()
              ) : (
                "U"
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            align={!isCollapsed ? "end" : "start"}
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {(user?.firstName && user?.lastName) ? user?.firstName.slice(0, 1).concat(user.lastName.slice(0, 1)).toUpperCase()
                    : "User"}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail || "Loading..."}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={teamSlug ? `/team/${teamSlug}/profile` : "/profile"} className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={teamSlug ? `/team/${teamSlug}/settings` : "/settings"} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={teamSlug ? `/team/${teamSlug}/settings?section=notifications` : "/settings?section=notifications"}
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={teamSlug ? `/team/${teamSlug}/billing` : "/billing"} className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href={teamSlug ? `/team/${teamSlug}/settings?section=security` : "/settings?section=security"}
                className="cursor-pointer"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a
                href="mailto:support@have-foresight.com?subject=Foresight RCM Support Request"
                className="cursor-pointer"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={async () => {
                await signOut();
                await redirectToSignIn();
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
              <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
      <SidebarRail />
    </SidebarPrimitive>
  );
}
