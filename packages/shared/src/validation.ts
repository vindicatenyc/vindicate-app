import { z } from 'zod';

/**
 * Validate SSN format (not the actual number validity)
 */
export const SSN_REGEX = /^\d{3}-\d{2}-\d{4}$/;

export const ssnSchema = z.string().regex(SSN_REGEX, 'Invalid SSN format');

/**
 * Validate US state code
 */
export const stateCodeSchema = z.string().length(2).toUpperCase();

/**
 * Validate US phone number
 */
export const phoneSchema = z.string().regex(
  /^\+?1?\d{10,14}$/,
  'Invalid phone number format'
);

/**
 * Validate currency amount
 */
export const currencySchema = z.number()
  .nonnegative()
  .multipleOf(0.01)
  .transform((val) => Math.round(val * 100) / 100);

/**
 * Sanitize user input string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .slice(0, 10000); // Limit length
}
