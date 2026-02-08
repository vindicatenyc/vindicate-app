'use client';

import { useState, useMemo } from 'react';
import { Search, Scale, ScrollText, BookOpen, Bot } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { ResourceCard } from '@/components/resources/resource-card';
import {
  mockRightsSummaries,
  mockTemplateLetters,
  mockArticles,
} from '@/lib/mock-data';
import { cn } from '@/lib/utils';

type CategoryFilter = 'all' | 'rights' | 'templates' | 'articles';

const CATEGORY_TABS: { id: CategoryFilter; label: string; icon: typeof Scale }[] = [
  { id: 'all', label: 'All', icon: BookOpen },
  { id: 'rights', label: 'Know Your Rights', icon: Scale },
  { id: 'templates', label: 'Template Letters', icon: ScrollText },
  { id: 'articles', label: 'Articles', icon: BookOpen },
];

export default function ResourcesPage() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredResources = useMemo(() => {
    const lowerQuery = searchQuery.toLowerCase();

    const rights = mockRightsSummaries.filter(
      (r) =>
        !lowerQuery ||
        r.title.toLowerCase().includes(lowerQuery) ||
        r.description.toLowerCase().includes(lowerQuery) ||
        r.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );

    const templates = mockTemplateLetters.filter(
      (t) =>
        !lowerQuery ||
        t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery)
    );

    const articles = mockArticles.filter(
      (a) =>
        !lowerQuery ||
        a.title.toLowerCase().includes(lowerQuery) ||
        a.description.toLowerCase().includes(lowerQuery) ||
        a.tags.some((t) => t.toLowerCase().includes(lowerQuery))
    );

    return { rights, templates, articles };
  }, [searchQuery]);

  const showRights = categoryFilter === 'all' || categoryFilter === 'rights';
  const showTemplates = categoryFilter === 'all' || categoryFilter === 'templates';
  const showArticles = categoryFilter === 'all' || categoryFilter === 'articles';

  // Vinny recommends: the FDCPA guide and debt validation letter
  const vinnyRecommends = useMemo(() => {
    return [
      mockRightsSummaries.find((r) => r.slug === 'fdcpa-rights'),
      mockTemplateLetters.find((t) => t.slug === 'debt-validation-letter'),
      mockArticles.find((a) => a.slug === 'what-happens-collections'),
    ].filter(Boolean);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resource Center"
        description="Know your rights. Access guides, templates, and educational content."
      />

      {/* Search */}
      <div className="relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-9 w-full rounded-lg border border-input bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          aria-label="Search resources"
        />
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setCategoryFilter(tab.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              categoryFilter === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-3.5 w-3.5" aria-hidden="true" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vinny recommends */}
      {categoryFilter === 'all' && !searchQuery && vinnyRecommends.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15">
              <Bot className="h-3.5 w-3.5 text-[hsl(var(--accent))]" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-foreground">Vinny Recommends</h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {vinnyRecommends.map((resource) => {
              if (!resource) return null;
              const isTemplate = 'placeholders' in resource;
              return (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  isTemplate={isTemplate}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Know Your Rights */}
      {showRights && filteredResources.rights.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Scale className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Know Your Rights</h2>
            <Badge variant="secondary" className="text-[10px]">
              {filteredResources.rights.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredResources.rights.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        </section>
      )}

      {/* Template Letters */}
      {showTemplates && filteredResources.templates.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <ScrollText className="h-4 w-4 text-purple-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Template Letters</h2>
            <Badge variant="secondary" className="text-[10px]">
              {filteredResources.templates.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredResources.templates.map((template) => (
              <ResourceCard key={template.id} resource={template} isTemplate />
            ))}
          </div>
        </section>
      )}

      {/* Articles */}
      {showArticles && filteredResources.articles.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-600" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-foreground">Educational Articles</h2>
            <Badge variant="secondary" className="text-[10px]">
              {filteredResources.articles.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredResources.articles.map((article) => (
              <ResourceCard key={article.id} resource={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
