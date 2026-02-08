'use client';

import Link from 'next/link';
import { Search, MessageCircle, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/theme-toggle';
import { useAppStore } from '@/stores/app-store';
import { NotificationBell } from '@/components/notifications/notification-bell';

export function Header() {
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const toggleVinnyChat = useAppStore((s) => s.toggleVinnyChat);

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-border bg-surface/80 backdrop-blur-sm px-4 lg:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Logo (mobile only) */}
      <Link href="/" className="lg:hidden flex items-center gap-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
          V
        </span>
        <span className="text-sm font-semibold text-primary">Vindicate</span>
      </Link>

      {/* Search */}
      <div className="hidden sm:flex flex-1 max-w-md">
        <div className="relative w-full">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            placeholder="Search accounts, cases..."
            className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1 sm:hidden" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Mobile search */}
        <button
          className="sm:hidden inline-flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Search"
        >
          <Search className="h-5 w-5" aria-hidden="true" />
        </button>

        {/* Notifications */}
        <NotificationBell />

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Vinny chat button */}
        <button
          onClick={toggleVinnyChat}
          className={cn(
            'inline-flex h-10 w-10 items-center justify-center rounded-md transition-colors',
            'text-accent hover:bg-accent/10'
          )}
          aria-label="Chat with Vinny"
        >
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
