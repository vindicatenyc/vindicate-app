'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
  label?: string;
  showValue?: boolean;
  className?: string;
}

const variantStrokes: Record<string, string> = {
  default: 'stroke-primary',
  success: 'stroke-success',
  warning: 'stroke-warning',
  danger: 'stroke-danger',
};

export function ProgressRing({
  value,
  max = 100,
  size = 80,
  strokeWidth = 6,
  variant = 'default',
  label,
  showValue = true,
  className,
}: ProgressRingProps) {
  const [animated, setAnimated] = useState(false);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const targetOffset = circumference - (percentage / 100) * circumference;

  // Start from 0 and animate to target on mount
  useEffect(() => {
    const timer = requestAnimationFrame(() => setAnimated(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  const offset = animated ? targetOffset : circumference;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label || 'Progress'}
    >
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          className={cn(variantStrokes[variant], 'transition-all duration-700 ease-out')}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-sm font-semibold text-foreground">
            {Math.round(percentage)}%
          </span>
          {label && (
            <span className="text-[10px] text-muted-foreground">{label}</span>
          )}
        </div>
      )}
    </div>
  );
}
