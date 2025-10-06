'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  ClipboardList,
  BarChart3,
  Settings,
  Menu,
  LogOut,
  UserCircle,
  Bell,
  CreditCard,
  Shield,
  HelpCircle,
  FileText,
  FolderOpen
} from 'lucide-react';
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

interface SidebarProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const navigationItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'ePA Queue', href: '/queue', icon: ClipboardList },
  { name: 'Claims (99213)', href: '/claims', icon: FileText },
  { name: 'Credentialing', href: '/credentialing', icon: FolderOpen },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ sidebarOpen, onToggleSidebar }: Readonly<SidebarProps>) {
  const pathname = usePathname();

  const { signOut, redirectToSignIn } = useClerk();
  const { user } = useUser();
  const userEmail = user?.emailAddresses?.[0].emailAddress ?? "";

  return (
    <aside
      className={cn(
        "flex flex-col bg-background border-r border-border transition-all duration-300 ease-in-out h-screen",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center p-4 border-b border-border",
          sidebarOpen ? "justify-between" : "justify-center"
        )}
      >
        {sidebarOpen && (
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/android-chrome-192x192.png"
              alt="Foresight Logo"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-xl font-semibold text-primary">
              Foresight RCM
            </span>
          </Link>
        )}
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <Menu className="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
              onClick={() => {
                // Scroll to top when switching tabs
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }, 100);
              }}
            >
              <Icon
                className={cn(
                  "h-5 w-5 flex-shrink-0",
                  isActive ? "text-primary" : "text-muted-foreground"
                )}
              />
              {sidebarOpen && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div
        className={cn(
          "p-4 border-t border-border",
          sidebarOpen ? "space-y-3" : "flex justify-center"
        )}
      >
        {sidebarOpen && (
          <div className="text-xs text-muted-foreground">PA Coordinator</div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                sidebarOpen ? "w-full h-10 gap-3 pl-3 pr-3" : "w-9 h-9"
              )}
            >
              {sidebarOpen ? (
                <>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {(user?.firstName && user?.lastName) ? user?.firstName.slice(0, 1).concat(user.lastName.slice(0, 1)).toUpperCase() : "U"}
                  </span>
                  <span className="flex-1 text-left truncate">
                    {userEmail?.split("@")[0] || "User"}
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
            align={sidebarOpen ? "end" : "start"}
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
              <Link href="/profile" className="cursor-pointer">
                <UserCircle className="mr-2 h-4 w-4" />
                <span>Profile</span>
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings?section=notifications"
                className="cursor-pointer"
              >
                <Bell className="mr-2 h-4 w-4" />
                <span>Notifications</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/billing" className="cursor-pointer">
                <CreditCard className="mr-2 h-4 w-4" />
                <span>Billing</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings?section=security"
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
      </div>
    </aside>
  );
}
