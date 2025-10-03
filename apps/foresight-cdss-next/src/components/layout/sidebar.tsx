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
import { useAuth } from '@/components/providers/auth-provider';
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

export function Sidebar({ sidebarOpen, onToggleSidebar }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <aside
      className={cn(
        "flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ease-in-out h-screen",
        sidebarOpen ? "w-64" : "w-20"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center p-4 border-b border-gray-200",
        sidebarOpen ? "justify-between" : "justify-center"
      )}>
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
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all duration-200",
                isActive
                  ? "bg-primary/10 text-primary font-semibold shadow-sm"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              onClick={() => {
                // Scroll to top when switching tabs
                setTimeout(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }, 100);
              }}
            >
              <Icon className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive ? "text-primary" : "text-gray-500"
              )} />
              {sidebarOpen && (
                <span className="truncate">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile Section */}
      <div className={cn(
        "p-4 border-t border-gray-200",
        sidebarOpen ? "space-y-3" : "flex justify-center"
      )}>
        {sidebarOpen && (
          <div className="text-xs text-muted-foreground">
            PA Coordinator
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm hover:shadow-lg transition-shadow focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              sidebarOpen ? "w-full h-10 gap-3 pl-3 pr-3" : "w-9 h-9"
            )}>
              {sidebarOpen ? (
                <>
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">
                    {user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'}
                  </span>
                  <span className="flex-1 text-left truncate">
                    {user?.email?.split('@')[0] || 'User'}
                  </span>
                </>
              ) : (
                user?.email ? user.email.slice(0, 2).toUpperCase() : 'U'
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align={sidebarOpen ? "end" : "start"} forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'Loading...'}
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
              <Link href="/settings?section=notifications" className="cursor-pointer">
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
              <Link href="/settings?section=security" className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Security</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="mailto:support@have-foresight.com?subject=Foresight RCM Support Request" className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>Support</span>
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600 cursor-pointer"
              onClick={async () => {
                const { createClient } = await import('@/lib/supabase/client');
                const supabase = createClient();
                await supabase.auth.signOut();
                window.location.href = '/login';
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
