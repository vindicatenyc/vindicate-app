'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Plus, ClipboardList, UserPlus, MessageCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useVinnyChatActions } from '@/stores/app-store';

export function QuickActions() {
  const [fabOpen, setFabOpen] = useState(false);
  const { openVinnyChat } = useVinnyChatActions();

  const toggleFab = useCallback(() => {
    setFabOpen(prev => !prev);
  }, []);

  const actions = [
    {
      label: 'Log Activity',
      href: '/activity/log',
      icon: ClipboardList,
    },
    {
      label: 'Add Account',
      href: '/accounts/new',
      icon: UserPlus,
    },
    {
      label: 'Ask Vinny',
      icon: MessageCircle,
      onClick: openVinnyChat,
    },
  ];

  return (
    <>
      {/* Desktop: horizontal button group */}
      <div
        className="hidden items-center gap-3 lg:flex"
        role="group"
        aria-label="Quick actions"
      >
        {actions.map(action => {
          const Icon = action.icon;
          if (action.href) {
            return (
              <Link key={action.label} href={action.href}>
                <Button variant="outline" size="sm" className="gap-2">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Button>
              </Link>
            );
          }
          return (
            <Button
              key={action.label}
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={action.onClick}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {action.label}
            </Button>
          );
        })}
      </div>

      {/* Mobile: Floating Action Button */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        {/* Expanded action items */}
        <div
          className={cn(
            'mb-3 flex flex-col items-end gap-2 transition-all duration-200 ease-out',
            fabOpen
              ? 'pointer-events-auto translate-y-0 opacity-100'
              : 'pointer-events-none translate-y-4 opacity-0'
          )}
          role={fabOpen ? 'menu' : undefined}
          aria-label="Quick actions"
        >
          {actions.map(action => {
            const Icon = action.icon;
            if (action.href) {
              return (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2"
                  role="menuitem"
                  onClick={() => setFabOpen(false)}
                >
                  <span className="rounded-lg bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-md border border-border">
                    {action.label}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </div>
                </Link>
              );
            }
            return (
              <button
                key={action.label}
                className="flex items-center gap-2"
                role="menuitem"
                onClick={() => {
                  action.onClick?.();
                  setFabOpen(false);
                }}
              >
                <span className="rounded-lg bg-card px-3 py-1.5 text-sm font-medium text-foreground shadow-md border border-border">
                  {action.label}
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
              </button>
            );
          })}
        </div>

        {/* FAB trigger */}
        <button
          onClick={toggleFab}
          className={cn(
            'flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-200',
            fabOpen && 'rotate-45'
          )}
          aria-label={fabOpen ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={fabOpen}
        >
          {fabOpen ? (
            <X className="h-6 w-6" aria-hidden="true" />
          ) : (
            <Plus className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
