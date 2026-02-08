'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Scale, ScrollText, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TemplateLetterDisplay } from '@/components/resources/template-letter';
import {
  mockRightsSummaries,
  mockTemplateLetters,
  mockArticles,
} from '@/lib/mock-data';
import type { Resource, TempleLetter } from '@vindicate/shared';

function renderMarkdown(content: string): React.ReactNode {
  // Simple markdown renderer for headings, bold, lists, and paragraphs
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let listStartIndex = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      const isOrdered = /^\d+\./.test(listItems[0]);
      const items = listItems.map((item, i) => {
        const text = item.replace(/^[-*]\s+|^\d+\.\s+/, '');
        return <li key={`${listStartIndex}-${i}`} className="text-sm text-foreground">{renderInline(text)}</li>;
      });

      if (isOrdered) {
        elements.push(
          <ol key={`ol-${listStartIndex}`} className="ml-4 list-decimal space-y-1 my-3">
            {items}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${listStartIndex}`} className="ml-4 list-disc space-y-1 my-3">
            {items}
          </ul>
        );
      }
      listItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for list items
    if (/^[-*]\s+/.test(line) || /^\d+\.\s+/.test(line)) {
      if (listItems.length === 0) listStartIndex = i;
      listItems.push(line);
      continue;
    }

    flushList();

    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-xl font-bold text-foreground mt-6 mb-3 first:mt-0">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold text-foreground mt-5 mb-2">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      elements.push(
        <h3 key={i} className="text-base font-semibold text-foreground mt-4 mb-1.5">
          {line.slice(4)}
        </h3>
      );
    } else if (line.trim() === '') {
      // Skip empty lines
    } else if (line.startsWith('*') && line.endsWith('*') && !line.startsWith('**')) {
      elements.push(
        <p key={i} className="text-xs italic text-muted-foreground my-3">
          {line.slice(1, -1)}
        </p>
      );
    } else if (line.startsWith('[') && line.includes(']')) {
      elements.push(
        <p key={i} className="text-sm text-primary font-medium my-2">
          {line}
        </p>
      );
    } else {
      elements.push(
        <p key={i} className="text-sm text-foreground leading-relaxed my-2">
          {renderInline(line)}
        </p>
      );
    }
  }

  flushList();
  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle **bold** text
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ResourceArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const resource = useMemo(() => {
    // Search all resource types
    const allResources: Resource[] = [...mockRightsSummaries, ...mockArticles];
    const found = allResources.find((r) => r.slug === params.slug);
    if (found) return { type: 'resource' as const, data: found };

    const template = mockTemplateLetters.find((t) => t.slug === params.slug);
    if (template) return { type: 'template' as const, data: template };

    return null;
  }, [params.slug]);

  if (!resource) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Resource Not Found"
          description="The resource you're looking for doesn't exist."
        />
        <Link href="/resources">
          <Button variant="outline" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </Link>
      </div>
    );
  }

  const isTemplate = resource.type === 'template';
  const data = resource.data;

  const categoryIcon = isTemplate ? ScrollText : (data as Resource).category === 'rights' ? Scale : BookOpen;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/resources">
          <Button variant="ghost" size="sm" className="gap-2 mb-3 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary" className="gap-1">
            {(() => {
              const IconComponent = categoryIcon;
              return <IconComponent className="h-3 w-3" aria-hidden="true" />;
            })()}
            {isTemplate
              ? 'Template Letter'
              : (data as Resource).category === 'rights'
                ? 'Know Your Rights'
                : 'Article'}
          </Badge>
        </div>

        <h1 className="text-2xl font-bold text-foreground">{data.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.description}</p>
      </div>

      {isTemplate ? (
        <TemplateLetterDisplay letter={data as TempleLetter} />
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          {renderMarkdown((data as Resource).content)}
        </div>
      )}

      {/* Related resources */}
      {!isTemplate && (data as Resource).relatedResourceIds.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">Related Resources</h3>
          <div className="flex flex-wrap gap-2">
            {(data as Resource).relatedResourceIds.map((id) => {
              const related = [...mockRightsSummaries, ...mockArticles].find((r) => r.id === id);
              const relatedTemplate = mockTemplateLetters.find((t) => t.id === id);
              const item = related || relatedTemplate;
              if (!item) return null;
              return (
                <Link key={id} href={`/resources/${item.slug}`}>
                  <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                    {item.title}
                  </Badge>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
