import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimelineItem {
  id: string;
  icon?: LucideIcon;
  iconColor?: string;
  date: string;
  title: string;
  description?: string;
  content?: React.ReactNode;
}

export interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className }: TimelineProps) {
  return (
    <div className={cn('relative', className)} role="list">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <div key={item.id} className="relative flex gap-4 pb-6" role="listitem">
            {/* Connector line */}
            {!isLast && (
              <div
                className="absolute left-[15px] top-8 bottom-0 w-px bg-border"
                aria-hidden="true"
              />
            )}

            {/* Icon */}
            <div
              className={cn(
                'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-card',
                item.iconColor
              )}
            >
              {item.icon ? (
                <item.icon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <div className="h-2 w-2 rounded-full bg-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-foreground">
                  {item.title}
                </p>
                <time className="shrink-0 text-xs text-muted-foreground">
                  {item.date}
                </time>
              </div>
              {item.description && (
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}
              {item.content && <div className="mt-2">{item.content}</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
