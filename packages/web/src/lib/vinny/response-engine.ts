/**
 * Vinny response engine
 * Keyword-matching engine that returns response text + suggestion chips
 */

import { findVinnyResponse } from '@/lib/mock-data/vinny-responses';

export interface VinnyEngineResponse {
  text: string;
  suggestedReplies: string[];
  resourceLink?: { title: string; url: string };
  category: string;
}

/**
 * Process a user message and return Vinny's response.
 * Uses keyword matching across categories:
 * rights, credit, disputes, payments, budgeting, encouragement, greetings, farewell
 */
export function getVinnyResponse(userMessage: string): VinnyEngineResponse {
  const match = findVinnyResponse(userMessage);

  return {
    text: match.response,
    suggestedReplies: match.suggestedReplies || [],
    resourceLink: match.resourceLink,
    category: match.category,
  };
}

/**
 * Get Vinny's welcome message for a new session
 */
export function getWelcomeMessage(): VinnyEngineResponse {
  return {
    text: "Hey there! I'm Vinny, your financial recovery companion. I'm here to help you understand your options and take control of your debt situation. What's on your mind today?",
    suggestedReplies: [
      'What can you help me with?',
      'Tell me about my rights',
      "I'm stressed about debt",
    ],
    category: 'greetings',
  };
}
