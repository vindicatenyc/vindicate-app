'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Activity,
  PiggyBank,
  MoreHorizontal,
  Briefcase,
  Bell,
  BookOpen,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface MobileNavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const primaryItems: MobileNavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Wallet, label: 'Accounts', href: '/accounts' },
  { icon: Activity, label: 'Activity', href: '/activity' },
  { icon: PiggyBank, label: 'Budget', href: '/budget' },
];

const moreItems: MobileNavItem[] = [
  { icon: Briefcase, label: 'Cases', href: '/cases' },
  { icon: Bell, label: 'Alerts', href: '/alerts' },
  { icon: BookOpen, label: 'Resources', href: '/resources' },
];

export function MobileNav() {
  const pathname = usePathname();
  const [showMore, setShowMore] = useState(false);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isMoreActive = moreItems.some((item) => isActive(item.href));

  return (
    <>
      {/* More dropdown overlay */}
      {showMore && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setShowMore(false)}
          aria-hidden="true"
        />
      )}

      {/* More dropdown */}
      {showMore && (
        <div className="lg:hidden fixed bottom-16 left-0 right-0 z-50 mx-4 mb-2 rounded-xl border border-border bg-surface p-2 shadow-large">
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              More
            </span>
            <button
              onClick={() => setShowMore(false)}
              className="inline-flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {moreItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setShowMore(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Bottom tab bar */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface/95 backdrop-blur-sm safe-area-bottom"
        aria-label="Mobile navigation"
      >
        <div className="flex items-center justify-around">
          {primaryItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors',
                  active
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setShowMore(!showMore)}
            className={cn(
              'flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-0.5 px-2 py-2 text-[10px] font-medium transition-colors',
              isMoreActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
            aria-label="More navigation options"
            aria-expanded={showMore}
          >
            <MoreHorizontal className="h-5 w-5" aria-hidden="true" />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
