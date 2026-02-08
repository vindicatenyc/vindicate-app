'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CreditScoreEntry } from '@vindicate/shared';

interface ScoreTrendProps {
  history: CreditScoreEntry[];
  className?: string;
}

function getMonthLabel(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short' });
}

export function ScoreTrend({ history, className }: ScoreTrendProps) {
  // Use last 6 entries
  const entries = history.slice(-6);

  if (entries.length === 0) {
    return (
      <div className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}>
        <h3 className="text-sm font-medium text-muted-foreground">Score Trend</h3>
        <p className="mt-4 text-center text-sm text-muted-foreground">No history</p>
      </div>
    );
  }

  const scores = entries.map(e => e.score);
  const minScore = Math.min(...scores);
  const maxScore = Math.max(...scores);
  const range = maxScore - minScore || 1;

  // Calculate overall trend
  const firstScore = entries[0].score;
  const lastScore = entries[entries.length - 1].score;
  const totalChange = lastScore - firstScore;
  const trendDir = totalChange > 0 ? 'up' : totalChange < 0 ? 'down' : 'same';

  // Build SVG line path
  const chartWidth = 280;
  const chartHeight = 100;
  const padding = 10;
  const usableWidth = chartWidth - padding * 2;
  const usableHeight = chartHeight - padding * 2;

  const points = entries.map((entry, i) => {
    const x = padding + (i / Math.max(entries.length - 1, 1)) * usableWidth;
    const y = padding + usableHeight - ((entry.score - minScore) / range) * usableHeight;
    return { x, y, score: entry.score, date: entry.date };
  });

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ');

  return (
    <div
      className={cn('rounded-xl border border-border bg-card p-5 shadow-soft', className)}
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          Score Trend
        </h3>
        <div
          className={cn(
            'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
            trendDir === 'up'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : trendDir === 'down'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          )}
        >
          {trendDir === 'up' ? (
            <TrendingUp className="h-3 w-3" aria-hidden="true" />
          ) : trendDir === 'down' ? (
            <TrendingDown className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Minus className="h-3 w-3" aria-hidden="true" />
          )}
          <span>
            {totalChange > 0 ? '+' : ''}
            {totalChange} pts
          </span>
        </div>
      </div>

      {/* SVG Line Chart */}
      <div className="mt-4" role="img" aria-label={`Credit score trend: ${firstScore} to ${lastScore} over ${entries.length} months`}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Grid lines */}
          <line
            x1={padding} y1={padding}
            x2={chartWidth - padding} y2={padding}
            className="stroke-muted" strokeWidth="0.5" strokeDasharray="4 4"
          />
          <line
            x1={padding} y1={chartHeight / 2}
            x2={chartWidth - padding} y2={chartHeight / 2}
            className="stroke-muted" strokeWidth="0.5" strokeDasharray="4 4"
          />
          <line
            x1={padding} y1={chartHeight - padding}
            x2={chartWidth - padding} y2={chartHeight - padding}
            className="stroke-muted" strokeWidth="0.5" strokeDasharray="4 4"
          />

          {/* Line */}
          <path
            d={pathD}
            fill="none"
            className={cn(
              'transition-all duration-500',
              trendDir === 'up' ? 'stroke-green-500' : trendDir === 'down' ? 'stroke-red-500' : 'stroke-gray-400'
            )}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="4"
              className={cn(
                'transition-all duration-500',
                trendDir === 'up' ? 'fill-green-500' : trendDir === 'down' ? 'fill-red-500' : 'fill-gray-400'
              )}
            />
          ))}

          {/* Score labels on points */}
          {points.map((p, i) => (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              className="fill-muted-foreground text-[8px]"
            >
              {p.score}
            </text>
          ))}
        </svg>

        {/* Month labels */}
        <div className="flex justify-between px-2 text-[10px] text-muted-foreground">
          {entries.map(entry => (
            <span key={entry.date}>{getMonthLabel(entry.date)}</span>
          ))}
        </div>
      </div>

      {/* Screen reader accessible data */}
      <table className="sr-only">
        <caption>Credit score history</caption>
        <thead>
          <tr><th>Month</th><th>Score</th></tr>
        </thead>
        <tbody>
          {entries.map(entry => (
            <tr key={entry.date}>
              <td>{entry.date}</td>
              <td>{entry.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
