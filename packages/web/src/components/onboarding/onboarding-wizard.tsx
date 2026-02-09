'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/components/auth/auth-provider';
import { createBrowserClient } from '@/lib/supabase/client';
import { WelcomeStep } from './welcome-step';
import { ProfileStep } from './profile-step';
import { ImportStep } from './import-step';

const TOTAL_STEPS = 3;

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

export function OnboardingWizard() {
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);

  // Check profile from DB on mount
  useEffect(() => {
    setMounted(true);
    if (!user) return;
    const supabase = createBrowserClient();
    supabase
      .from('profiles')
      .select('onboarding_complete')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }: { data: { onboarding_complete?: boolean } | null }) => {
        setOnboardingComplete(data?.onboarding_complete ?? false);
      });
  }, [user]);

  const handleNext = useCallback(() => {
    const next = currentStep + 1;
    if (next >= TOTAL_STEPS) {
      // Mark onboarding complete in DB
      if (user) {
        const supabase = createBrowserClient();
        supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id).then(() => {
          setOnboardingComplete(true);
          completeOnboarding();
        });
      }
    } else {
      setCurrentStep(next);
    }
  }, [currentStep, user, completeOnboarding]);

  const handleComplete = useCallback(() => {
    if (user) {
      const supabase = createBrowserClient();
      supabase.from('profiles').update({ onboarding_complete: true }).eq('id', user.id).then(() => {
        setOnboardingComplete(true);
        completeOnboarding();
      });
    }
  }, [user, completeOnboarding]);

  // Don't render until hydrated, or if already completed, or still loading
  if (!mounted || onboardingComplete === null || onboardingComplete) return null;

  // Check for reduced motion
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Welcome to Vindicate"
    >
      <div className="w-full max-w-lg mx-4">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-6" role="group" aria-label="Onboarding progress">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-primary'
                  : i < currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
              aria-label={`Step ${i + 1} of ${TOTAL_STEPS}${
                i === currentStep ? ' (current)' : ''
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              variants={prefersReducedMotion ? undefined : stepVariants}
              initial={prefersReducedMotion ? undefined : 'enter'}
              animate={prefersReducedMotion ? undefined : 'center'}
              exit={prefersReducedMotion ? undefined : 'exit'}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {currentStep === 0 && (
                <WelcomeStep onNext={handleNext} />
              )}
              {currentStep === 1 && (
                <ProfileStep onNext={handleNext} />
              )}
              {currentStep === 2 && (
                <ImportStep onComplete={handleComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
