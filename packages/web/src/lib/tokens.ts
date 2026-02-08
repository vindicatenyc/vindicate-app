/**
 * Vindicate NYC Design Tokens
 *
 * Exported constants for spacing, shadows, border-radius, and animation durations.
 * These complement the Tailwind/CSS tokens for use in JavaScript/TypeScript.
 */

// ============================================================================
// Spacing Scale (matches Tailwind's default scale + custom additions)
// ============================================================================
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  1.5: '0.375rem',  // 6px
  2: '0.5rem',      // 8px
  2.5: '0.625rem',  // 10px
  3: '0.75rem',     // 12px
  3.5: '0.875rem',  // 14px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  7: '1.75rem',     // 28px
  8: '2rem',        // 32px
  9: '2.25rem',     // 36px
  10: '2.5rem',     // 40px
  11: '2.75rem',    // 44px - minimum touch target
  12: '3rem',       // 48px
  14: '3.5rem',     // 56px
  16: '4rem',       // 64px
  18: '4.5rem',     // 72px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
  28: '7rem',       // 112px
  32: '8rem',       // 128px
  36: '9rem',       // 144px
  40: '10rem',      // 160px
  44: '11rem',      // 176px
  48: '12rem',      // 192px
  52: '13rem',      // 208px
  56: '14rem',      // 224px
  60: '15rem',      // 240px
  64: '16rem',      // 256px
  72: '18rem',      // 288px
  80: '20rem',      // 320px
  96: '24rem',      // 384px
} as const;

// ============================================================================
// Shadows
// ============================================================================
export const shadows = {
  none: 'none',
  soft: '0 2px 8px -2px rgba(0, 0, 0, 0.08)',
  medium: '0 4px 16px -4px rgba(0, 0, 0, 0.12)',
  large: '0 8px 32px -8px rgba(0, 0, 0, 0.16)',
  innerSoft: 'inset 0 1px 2px rgba(0, 0, 0, 0.06)',
  // Dark mode variants (apply these when in dark mode)
  softDark: '0 2px 8px -2px rgba(0, 0, 0, 0.32)',
  mediumDark: '0 4px 16px -4px rgba(0, 0, 0, 0.40)',
  largeDark: '0 8px 32px -8px rgba(0, 0, 0, 0.48)',
} as const;

// ============================================================================
// Border Radius
// ============================================================================
export const borderRadius = {
  none: '0px',
  sm: 'calc(0.5rem - 4px)',  // ~4px
  DEFAULT: 'calc(0.5rem - 2px)',  // ~6px
  md: '0.5rem',              // 8px - base radius
  lg: '0.75rem',             // 12px
  xl: '1rem',                // 16px
  '2xl': '1.5rem',           // 24px
  '3xl': '2rem',             // 32px
  full: '9999px',            // Pill shape
} as const;

// ============================================================================
// Animation Durations
// ============================================================================
export const duration = {
  instant: '0ms',
  fast: '150ms',
  normal: '200ms',
  slow: '300ms',
  slower: '400ms',
  slowest: '500ms',
} as const;

// ============================================================================
// Animation Easings
// ============================================================================
export const easing = {
  linear: 'linear',
  easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
  easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  // Special easings for specific animations
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// ============================================================================
// Breakpoints (matches Tailwind)
// ============================================================================
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// ============================================================================
// Z-Index Scale
// ============================================================================
export const zIndex = {
  behind: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modalBackdrop: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
  toast: 80,
  max: 9999,
} as const;

// ============================================================================
// Accessibility
// ============================================================================
export const a11y = {
  // Minimum touch target size (44x44px as per WCAG)
  minTouchTarget: '44px',
  // Focus ring offset
  focusRingOffset: '2px',
  // Focus ring width
  focusRingWidth: '2px',
} as const;

// ============================================================================
// Typography Scale (matches Tailwind config)
// ============================================================================
export const typography = {
  h1: {
    fontSize: '1.75rem',    // 28px
    lineHeight: '1.2',
    fontWeight: '600',
  },
  h2: {
    fontSize: '1.375rem',   // 22px
    lineHeight: '1.3',
    fontWeight: '600',
  },
  h3: {
    fontSize: '1.125rem',   // 18px
    lineHeight: '1.4',
    fontWeight: '600',
  },
  body: {
    fontSize: '1rem',       // 16px
    lineHeight: '1.6',
    fontWeight: '400',
  },
  bodySmall: {
    fontSize: '0.875rem',   // 14px
    lineHeight: '1.5',
    fontWeight: '400',
  },
  caption: {
    fontSize: '0.75rem',    // 12px
    lineHeight: '1.4',
    fontWeight: '400',
  },
} as const;

// ============================================================================
// Semantic Color Tokens (for use in JS - reference CSS vars for actual values)
// ============================================================================
export const colorTokens = {
  light: {
    background: '#FAFAF8',
    surface: '#FFFFFF',
    primary: '#4A7C6F',
    primaryHover: '#3D6A5E',
    secondary: '#6B8FA3',
    accent: '#8B6FB0',
    textPrimary: '#2D2D2D',
    textSecondary: '#6B6B6B',
    textMuted: '#9B9B9B',
    border: '#E8E5E0',
    success: '#5B9A6F',
    warning: '#C4943D',
    danger: '#C45B5B',
    info: '#5B84C4',
  },
  dark: {
    background: '#1A1D21',
    surface: '#242830',
    primary: '#6BA894',
    secondary: '#7DA3B8',
    textPrimary: '#E8E5E0',
    textSecondary: '#A0A0A0',
    textMuted: '#6B6B6B',
    border: '#353A42',
  },
} as const;
