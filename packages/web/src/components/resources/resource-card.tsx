'use client';

import Link from 'next/link';
import { Clock, FileText, Scale, BookOpen, ScrollText } from 'lucide-react';
import type { Resource, TempleLetter } from '@vindicate/shared';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const CATEGORY_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string }> = {
  rights: { label: 'Know Your Rights', icon: Scale, color: 'bg-blue-100 text-blue-700' },
  templates: { label: 'Template', icon: ScrollText, color: 'bg-purple-100 text-purple-700' },
  articles: { label: 'Article', icon: BookOpen, color: 'bg-amber-100 text-amber-700' },
  validation: { label: 'Validation', icon: ScrollText, color: 'bg-purple-100 text-purple-700' },
  dispute: { label: 'Dispute', icon: ScrollText, color: 'bg-purple-100 text-purple-700' },
  'cease-desist': { label: 'Cease & Desist', icon: ScrollText, color: 'bg-red-100 text-red-700' },
  negotiation: { label: 'Negotiation', icon: ScrollText, color: 'bg-teal-100 text-teal-700' },
  goodwill: { label: 'Goodwill', icon: ScrollText, color: 'bg-green-100 text-green-700' },
};

function estimateReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

interface ResourceCardProps {
  resource: Resource | TempleLetter;
  isTemplate?: boolean;
}

export function ResourceCard({ resource, isTemplate = false }: ResourceCardProps) {
  const category = isTemplate
    ? (resource as TempleLetter).category
    : (resource as Resource).category;
  const config = CATEGORY_CONFIG[category] || {
    label: category,
    icon: FileText,
    color: 'bg-gray-100 text-gray-700',
  };
  const Icon = config.icon;
  const readTime = estimateReadTime(resource.content);

  return (
    <Link
      href={`/resources/${resource.slug}`}
      className={cn(
        'group block rounded-xl border border-border bg-card p-5 transition-all',
        'hover:border-primary/30 hover:shadow-sm'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="secondary" className={cn('text-[10px] font-medium', config.color)}>
              {config.label}
            </Badge>
          </div>
          <h3 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
            {resource.title}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
            {resource.description}
          </p>
          <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" aria-hidden="true" />
            <span>{readTime} min read</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
