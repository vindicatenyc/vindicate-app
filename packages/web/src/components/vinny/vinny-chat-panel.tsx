'use client';

import { useEffect, useRef } from 'react';
import { Bot, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAppStore, useVinnyChat, useVinnyChatActions } from '@/stores/app-store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { VinnyMessage } from './vinny-message';
import { VinnyInput } from './vinny-input';
import { SuggestionChips } from './suggestion-chips';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
        <Bot className="h-4 w-4 text-[hsl(var(--accent))]" aria-hidden="true" />
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-muted px-4 py-3">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
      </div>
    </div>
  );
}

export function VinnyChatPanel() {
  const vinnyChat = useVinnyChat();
  const { closeVinnyChat, openVinnyChat, sendMessageToVinny, clearVinnySession } =
    useVinnyChatActions();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (vinnyChat.isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [vinnyChat.session?.messages.length, vinnyChat.isTyping, vinnyChat.isOpen]);

  // Ensure session is created when panel opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      openVinnyChat();
    } else {
      closeVinnyChat();
    }
  };

  const messages = vinnyChat.session?.messages || [];
  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === 'assistant');

  return (
    <Sheet open={vinnyChat.isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col p-0 sm:max-w-md"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
              <Bot className="h-5 w-5 text-[hsl(var(--accent))]" aria-hidden="true" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold">Vinny</SheetTitle>
              <SheetDescription className="text-xs">
                Your financial companion
              </SheetDescription>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={clearVinnySession}
                aria-label="Clear chat"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 px-3">
          <div
            className="space-y-4 py-4"
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((message) => (
              <VinnyMessage key={message.id} message={message} />
            ))}
            {vinnyChat.isTyping && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggestion chips — from last assistant message */}
        {lastAssistantMessage?.suggestedReplies &&
          lastAssistantMessage.suggestedReplies.length > 0 &&
          !vinnyChat.isTyping && (
            <SuggestionChips
              suggestions={lastAssistantMessage.suggestedReplies}
              onSelect={sendMessageToVinny}
            />
          )}

        {/* Input */}
        <VinnyInput
          onSend={sendMessageToVinny}
          disabled={vinnyChat.isTyping}
        />

        {/* Legal disclaimer */}
        <div className="border-t border-border px-3 py-1.5">
          <p className="text-center text-[10px] text-muted-foreground">
            I am not a lawyer — this is general information only.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
