'use client';

import { Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVinnyChat, useVinnyChatActions } from '@/stores/app-store';

export function VinnyFab() {
  const vinnyChat = useVinnyChat();
  const { openVinnyChat } = useVinnyChatActions();

  // Don't show FAB when chat is already open
  if (vinnyChat.isOpen) return null;

  return (
    <button
      onClick={openVinnyChat}
      className={cn(
        'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all',
        'bg-[hsl(var(--accent))] text-white hover:bg-[hsl(var(--accent))]/90',
        'hover:scale-105 active:scale-95',
        // Position: bottom-right, above mobile nav but not conflicting with quick-actions FAB
        // Quick-actions FAB is at bottom-20 right-4 on mobile, so Vinny goes slightly left
        'bottom-6 right-4 lg:bottom-6 lg:right-6'
      )}
      aria-label="Chat with Vinny"
    >
      <Bot className="h-6 w-6" aria-hidden="true" />

      {/* Pulse animation ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-[hsl(var(--accent))]/20 pointer-events-none" />
    </button>
  );
}
