'use client';

import { useCallback, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, useOnboarding } from '@/stores/app-store';
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
  const onboarding = useOnboarding();
  const setOnboardingStep = useAppStore((s) => s.setOnboardingStep);
  const completeOnboarding = useAppStore((s) => s.completeOnboarding);
  const [mounted, setMounted] = useState(false);

  // Wait for hydration to avoid flash
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleNext = useCallback(() => {
    const next = onboarding.currentStep + 1;
    if (next >= TOTAL_STEPS) {
      completeOnboarding();
    } else {
      setOnboardingStep(next);
    }
  }, [onboarding.currentStep, setOnboardingStep, completeOnboarding]);

  const handleComplete = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  // Don't render until hydrated, or if already completed
  if (!mounted || onboarding.hasCompleted) return null;

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
                i === onboarding.currentStep
                  ? 'w-8 bg-primary'
                  : i < onboarding.currentStep
                    ? 'w-2 bg-primary/50'
                    : 'w-2 bg-muted'
              }`}
              aria-label={`Step ${i + 1} of ${TOTAL_STEPS}${
                i === onboarding.currentStep ? ' (current)' : ''
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={onboarding.currentStep}
              variants={prefersReducedMotion ? undefined : stepVariants}
              initial={prefersReducedMotion ? undefined : 'enter'}
              animate={prefersReducedMotion ? undefined : 'center'}
              exit={prefersReducedMotion ? undefined : 'exit'}
              transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {onboarding.currentStep === 0 && (
                <WelcomeStep onNext={handleNext} />
              )}
              {onboarding.currentStep === 1 && (
                <ProfileStep onNext={handleNext} />
              )}
              {onboarding.currentStep === 2 && (
                <ImportStep onComplete={handleComplete} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
