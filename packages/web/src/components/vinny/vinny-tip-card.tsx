'use client';

import { useState } from 'react';
import { Bot, X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useVinnyChatActions } from '@/stores/app-store';
import type { VinnyTip } from '@/lib/vinny/tip-generator';

interface VinnyTipCardProps {
  tip: VinnyTip;
}

export function VinnyTipCard({ tip }: VinnyTipCardProps) {
  const [dismissed, setDismissed] = useState(false);
  const { openVinnyChat, sendMessageToVinny } = useVinnyChatActions();

  if (dismissed) return null;

  const handleChatAboutThis = () => {
    openVinnyChat();
    // Small delay to let the chat panel initialize
    setTimeout(() => {
      sendMessageToVinny(tip.chatPrompt);
    }, 100);
  };

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-[hsl(var(--accent))]/20 bg-card p-4',
        'bg-gradient-to-r from-[hsl(var(--accent))]/5 to-transparent'
      )}
      role="complementary"
      aria-label="Vinny tip"
    >
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label="Dismiss tip"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>

      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
          <Bot className="h-4 w-4 text-[hsl(var(--accent))]" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1 pr-4">
          <p className="text-xs font-medium text-[hsl(var(--accent))] mb-1">Vinny says</p>
          <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 gap-1.5 px-2 text-xs text-[hsl(var(--accent))] hover:text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10"
            onClick={handleChatAboutThis}
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Chat with Vinny about this
          </Button>
        </div>
      </div>
    </div>
  );
}
