'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/stores/app-store';
import { navItems, settingsItem } from './nav-items';

export function Sidebar() {
  const pathname = usePathname();
  const sidebar = useAppStore((s) => s.sidebar);
  const toggleSidebarCollapse = useAppStore((s) => s.toggleSidebarCollapse);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        'hidden lg:flex flex-col border-r border-border bg-surface h-screen sticky top-0 transition-[width] duration-200',
        sidebar.isCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-border px-4">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            V
          </span>
          {!sidebar.isCollapsed && (
            <span className="text-heading-3 font-semibold text-primary whitespace-nowrap">
              Vindicate
            </span>
          )}
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Main navigation">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                    sidebar.isCollapsed && 'justify-center px-2'
                  )}
                  title={sidebar.isCollapsed ? item.label : undefined}
                  aria-current={active ? 'page' : undefined}
                >
                  <item.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {!sidebar.isCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="border-t border-border p-2 space-y-1">
        {/* Settings */}
        <Link
          href={settingsItem.href}
          className={cn(
            'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
            isActive(settingsItem.href)
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            sidebar.isCollapsed && 'justify-center px-2'
          )}
          title={sidebar.isCollapsed ? settingsItem.label : undefined}
          aria-current={isActive(settingsItem.href) ? 'page' : undefined}
        >
          <settingsItem.icon className="h-5 w-5 shrink-0" aria-hidden="true" />
          {!sidebar.isCollapsed && <span>{settingsItem.label}</span>}
        </Link>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebarCollapse}
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
            sidebar.isCollapsed && 'justify-center px-2'
          )}
          aria-label={sidebar.isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebar.isCollapsed ? (
            <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <>
              <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
