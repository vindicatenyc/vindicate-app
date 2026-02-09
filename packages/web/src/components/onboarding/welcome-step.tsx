'use client';

import { Bot, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WelcomeStepProps {
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      {/* Vinny avatar */}
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[hsl(var(--accent))]/15 mb-6">
        <Bot className="h-10 w-10 text-[hsl(var(--accent))]" aria-hidden="true" />
      </div>

      <h2 className="text-2xl font-semibold text-foreground mb-3">
        Welcome to Vindicate!
      </h2>

      <p className="text-base text-muted-foreground leading-relaxed max-w-md mb-2">
        I am Vinny, your financial recovery companion.
      </p>

      <p className="text-sm text-muted-foreground leading-relaxed max-w-md mb-8">
        Vindicate helps you track, manage, and recover from debt. Know your rights,
        dispute errors, and build a path toward financial freedom — all in one calming,
        accessible platform.
      </p>

      <Button onClick={onNext} size="lg" className="gap-2">
        Get Started
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
