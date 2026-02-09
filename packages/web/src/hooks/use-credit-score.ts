'use client';

/**
 * Custom hook for managing credit score data — backed by Supabase
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { CreditScore, CreditFactor, CreditRating } from '@vindicate/shared';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { creditScoreFromRow } from '@/lib/supabase/mappers';

// Default empty credit score for when no data exists
const emptyCreditScore: CreditScore = {
  score: 0,
  rating: 'poor',
  date: new Date().toISOString().split('T')[0],
  source: 'None',
  factors: [],
  history: [],
};

function getCreditRating(score: number): CreditRating {
  if (score >= 800) return 'excellent';
  if (score >= 740) return 'very-good';
  if (score >= 670) return 'good';
  if (score >= 580) return 'fair';
  return 'poor';
}

export function useCreditScore() {
  const supabase = createBrowserClient();
  const { user } = useAuth();
  const [creditScore, setCreditScore] = useState<CreditScore>(emptyCreditScore);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditScore = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('credit_scores')
      .select('*')
      .order('date', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fetchError) {
      setError(fetchError.message);
    } else if (data) {
      setCreditScore(creditScoreFromRow(data));
    }
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    fetchCreditScore();
  }, [fetchCreditScore]);

  const updateScore = useCallback(async (newScore: number): Promise<void> => {
    if (!user) return;
    const rating = getCreditRating(newScore);
    const date = new Date().toISOString().split('T')[0];
    const newHistory = [...creditScore.history, { score: newScore, date }];
    const change = creditScore.score > 0 ? newScore - creditScore.score : 0;

    const { data, error: insertError } = await supabase
      .from('credit_scores')
      .insert({
        user_id: user.id, score: newScore, rating, date, source: 'Manual',
        change, factors: creditScore.factors, history: newHistory,
      })
      .select()
      .single();
    if (insertError) { setError(insertError.message); return; }
    setCreditScore(creditScoreFromRow(data));
  }, [user, supabase, creditScore]);

  const refreshScore = useCallback(async (newScore?: number): Promise<void> => {
    const score = newScore || creditScore.score + Math.floor(Math.random() * 10) - 3;
    const clampedScore = Math.max(300, Math.min(850, score));
    await updateScore(clampedScore);
  }, [creditScore.score, updateScore]);

  const getScoreChange = useCallback((): { change: number; direction: 'up' | 'down' | 'same' } => {
    const history = creditScore.history;
    if (history.length < 2) return { change: 0, direction: 'same' };
    const current = history[history.length - 1].score;
    const previous = history[history.length - 2].score;
    const change = current - previous;
    return { change: Math.abs(change), direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same' };
  }, [creditScore.history]);

  const getTotalImprovement = useCallback((): number => {
    const history = creditScore.history;
    if (history.length < 2) return 0;
    return history[history.length - 1].score - history[0].score;
  }, [creditScore.history]);

  const getPositiveFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.status === 'positive');
  }, [creditScore.factors]);

  const getNegativeFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.status === 'negative');
  }, [creditScore.factors]);

  const getHighImpactFactors = useCallback((): CreditFactor[] => {
    return creditScore.factors.filter(f => f.impact === 'high');
  }, [creditScore.factors]);

  const predictScoreImpact = useCallback((
    action: 'payoff_account' | 'dispute_resolved' | 'payment_plan_completion'
  ): { minImpact: number; maxImpact: number; average: number } => {
    switch (action) {
      case 'payoff_account': return { minImpact: 10, maxImpact: 25, average: 17 };
      case 'dispute_resolved': return { minImpact: 15, maxImpact: 40, average: 27 };
      case 'payment_plan_completion': return { minImpact: 20, maxImpact: 40, average: 30 };
      default: return { minImpact: 0, maxImpact: 0, average: 0 };
    }
  }, []);

  const getRatingInfo = useCallback((score: number): { rating: CreditRating; label: string; color: string; description: string } => {
    if (score >= 800) return { rating: 'excellent', label: 'Excellent', color: 'text-green-700', description: 'Exceptional credit' };
    if (score >= 740) return { rating: 'very-good', label: 'Very Good', color: 'text-green-600', description: 'Above average credit' };
    if (score >= 670) return { rating: 'good', label: 'Good', color: 'text-amber-700', description: 'Average credit' };
    if (score >= 580) return { rating: 'fair', label: 'Fair', color: 'text-orange-700', description: 'Below average credit' };
    return { rating: 'poor', label: 'Poor', color: 'text-red-700', description: 'Significant credit issues' };
  }, []);

  const stats = useMemo(() => {
    const change = getScoreChange();
    const totalImprovement = getTotalImprovement();
    const positiveCount = creditScore.factors.filter(f => f.status === 'positive').length;
    const negativeCount = creditScore.factors.filter(f => f.status === 'negative').length;
    const highImpactNegative = creditScore.factors.filter(f => f.status === 'negative' && f.impact === 'high').length;
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
    creditScore, isLoading, error, stats,
    updateScore, refreshScore, getScoreChange, getTotalImprovement,
    getPositiveFactors, getNegativeFactors, getHighImpactFactors,
    predictScoreImpact, getRatingInfo,
  };
}
