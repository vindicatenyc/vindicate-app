'use client';

/**
 * Shared Framer Motion variants for consistent animations across the app.
 * All variants respect prefers-reduced-motion via the `reducedMotion` config.
 */

import type { Variants, Transition } from 'framer-motion';

// =============================================================================
// TRANSITIONS
// =============================================================================

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const smoothTransition: Transition = {
  duration: 0.3,
  ease: [0.25, 0.1, 0.25, 1],
};

// =============================================================================
// VARIANTS
// =============================================================================

/** Fade in from transparent */
export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

/** Slide up from below with fade */
export const slideUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** Slide in from the left with fade */
export const slideIn: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** Scale in from smaller */
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },
};

/** Container that staggers its children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

/** Individual stagger item (slide up) */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },
};

// =============================================================================
// CARD HOVER (for interactive card elements)
// =============================================================================

export const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    transition: smoothTransition,
  },
  hover: {
    y: -2,
    boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.12)',
    transition: smoothTransition,
  },
};

// =============================================================================
// PAGE TRANSITION WRAPPER PROPS
// =============================================================================

/** Standard props for wrapping page content in motion.div */
export const pageTransitionProps = {
  initial: 'hidden' as const,
  animate: 'visible' as const,
  variants: fadeIn,
};

/** Standard props for stagger containers */
export const staggerProps = {
  initial: 'hidden' as const,
  animate: 'visible' as const,
  variants: staggerContainer,
};
