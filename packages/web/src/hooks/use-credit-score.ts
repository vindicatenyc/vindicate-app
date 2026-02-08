'use client';

/**
 * Custom hook for managing credit score data
 * Provides access to credit score, history, and factors
 */

import { useState, useCallback, useMemo } from 'react';
import type { CreditScore, CreditFactor, CreditScoreEntry, CreditRating } from '@vindicate/shared';
import {
  mockCreditScore as initialCreditScore,
  mockCreditScoreHistory,
  getCreditRating as getRating,
} from '@/lib/mock-data';

export function useCreditScore() {
  const [creditScore, setCreditScore] = useState<CreditScore>(initialCreditScore);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Update the current score (for simulation/testing)
  const updateScore = useCallback((newScore: number): void => {
    setCreditScore(prev => ({
      ...prev,
      score: newScore,
      rating: getRating(newScore),
      date: new Date().toISOString().split('T')[0],
      history: [
        ...prev.history,
        { score: newScore, date: new Date().toISOString().split('T')[0] },
      ],
    }));
  }, []);

  // Simulate adding a new score entry (as if refreshed from a credit bureau)
  const refreshScore = useCallback((newScore?: number): void => {
    const score = newScore || creditScore.score + Math.floor(Math.random() * 10) - 3;
    const clampedScore = Math.max(300, Math.min(850, score));

    setCreditScore(prev => ({
      ...prev,
      score: clampedScore,
      rating: getRating(clampedScore),
      date: new Date().toISOString().split('T')[0],
      history: [
        ...prev.history.slice(-11), // Keep last 12 entries
        { score: clampedScore, date: new Date().toISOString().split('T')[0] },
      ],
    }));
  }, [creditScore.score]);

  // Get score change from last entry
  const getScoreChange = useCallback((): { change: number; direction: 'up' | 'down' | 'same' } => {
    const history = creditScore.history;
    if (history.length < 2) return { change: 0, direction: 'same' };

    const current = history[history.length - 1].score;
    const previous = history[history.length - 2].score;
    const change = current - previous;

    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same',
    };
  }, [creditScore.history]);

  // Get total improvement from first to last entry
  const getTotalImprovement = useCallback((): number => {
    const history = creditScore.history;
    if (history.length < 2) return 0;
    return history[history.length - 1].score - history[0].score;
  }, [creditScore.history]);

  // Get positive factors
  const getPositiveFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.status === 'positive');
  }, [creditScore.factors]);

  // Get negative factors
  const getNegativeFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.status === 'negative');
  }, [creditScore.factors]);

  // Get high-impact factors
  const getHighImpactFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.impact === 'high');
  }, [creditScore.factors]);

  // Predict score impact for an action
  const predictScoreImpact = useCallback((
    action: 'payoff_account' | 'dispute_resolved' | 'payment_plan_completion'
  ): { minImpact: number; maxImpact: number; average: number } => {
    switch (action) {
      case 'payoff_account':
        return { minImpact: 10, maxImpact: 25, average: 17 };
      case 'dispute_resolved':
        return { minImpact: 15, maxImpact: 40, average: 27 };
      case 'payment_plan_completion':
        return { minImpact: 20, maxImpact: 40, average: 30 };
      default:
        return { minImpact: 0, maxImpact: 0, average: 0 };
    }
  }, []);

  // Get credit rating label and colors
  const getRatingInfo = useCallback((score: number): {
    rating: CreditRating;
    label: string;
    color: string;
    description: string;
  } => {
    if (score >= 800) {
      return {
        rating: 'excellent',
        label: 'Excellent',
        color: 'text-green-700',
        description: 'Exceptional credit',
      };
    }
    if (score >= 740) {
      return {
        rating: 'very-good',
        label: 'Very Good',
        color: 'text-green-600',
        description: 'Above average credit',
      };
    }
    if (score >= 670) {
      return {
        rating: 'good',
        label: 'Good',
        color: 'text-amber-700',
        description: 'Average credit',
      };
    }
    if (score >= 580) {
      return {
        rating: 'fair',
        label: 'Fair',
        color: 'text-orange-700',
        description: 'Below average credit',
      };
    }
    return {
      rating: 'poor',
      label: 'Poor',
      color: 'text-red-700',
      description: 'Significant credit issues',
    };
  }, []);

  // Computed stats
  const stats = useMemo(() => {
    const change = getScoreChange();
    const totalImprovement = getTotalImprovement();
    const positiveCount = creditScore.factors.filter(f => f.status === 'positive').length;
    const negativeCount = creditScore.factors.filter(f => f.status === 'negative').length;
    const highImpactNegative = creditScore.factors.filter(
      f => f.status === 'negative' && f.impact === 'high'
    ).length;

    return {
      currentScore: creditScore.score,
      currentRating: creditScore.rating,
      lastChange: change,
      totalImprovement,
      positiveFactorsCount: positiveCount,
      negativeFactorsCount: negativeCount,
      highImpactNegativeCount: highImpactNegative,
      historyLength: creditScore.history.length,
      oldestEntry: creditScore.history[0]?.date,
      newestEntry: creditScore.history[creditScore.history.length - 1]?.date,
    };
  }, [creditScore, getScoreChange, getTotalImprovement]);

  return {
    creditScore,
    isLoading,
    error,
    stats,
    updateScore,
    refreshScore,
    getScoreChange,
    getTotalImprovement,
    getPositiveFactors,
    getNegativeFactors,
    getHighImpactFactors,
    predictScoreImpact,
    getRatingInfo,
  };
}
