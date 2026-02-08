'use client';

import { Bot, User } from 'lucide-react';
import type { VinnyMessage as VinnyMessageType } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface VinnyMessageProps {
  message: VinnyMessageType;
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

export function VinnyMessage({ message }: VinnyMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex gap-2.5',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
          <Bot className="h-4 w-4 text-[hsl(var(--accent))]" aria-hidden="true" />
        </div>
      )}
      {isUser && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15">
          <User className="h-4 w-4 text-primary" aria-hidden="true" />
        </div>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[80%] rounded-2xl px-3.5 py-2.5',
          isUser
            ? 'rounded-tr-sm bg-primary text-primary-foreground'
            : 'rounded-tl-sm bg-muted text-foreground'
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>

        {/* Resource link */}
        {message.resourceLink && (
          <Link
            href={message.resourceLink.url}
            className={cn(
              'mt-2 block text-xs font-medium underline underline-offset-2',
              isUser ? 'text-primary-foreground/80' : 'text-primary'
            )}
          >
            {message.resourceLink.title}
          </Link>
        )}

        {/* Timestamp */}
        <p
          className={cn(
            'mt-1 text-[10px]',
            isUser ? 'text-primary-foreground/60 text-right' : 'text-muted-foreground'
          )}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
