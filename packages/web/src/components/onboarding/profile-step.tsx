'use client';

import { useState } from 'react';
import { ArrowRight, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/stores/app-store';
import { useAuth } from '@/components/auth/auth-provider';
import { createBrowserClient } from '@/lib/supabase/client';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
] as const;

interface ProfileStepProps {
  onNext: () => void;
}

export function ProfileStep({ onNext }: ProfileStepProps) {
  const setUserState = useAppStore((s) => s.setUserState);
  const currentState = useAppStore((s) => s.userState);
  const { user } = useAuth();
  const [selectedState, setSelectedState] = useState(currentState || 'NY');

  const handleContinue = () => {
    // Save to Zustand for immediate UI use
    setUserState(selectedState);
    // Save to profiles table in Supabase
    if (user) {
      const supabase = createBrowserClient();
      supabase.from('profiles').update({ state: selectedState }).eq('id', user.id).then();
    }
    onNext();
  };

  return (
    <div className="flex flex-col items-center text-center px-6 py-8">
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        A Little About You
      </h2>
      <p className="text-sm text-muted-foreground mb-8 max-w-md">
        This helps us tailor statute-of-limitations info and state-specific rights to you.
        You can always change this in Settings.
      </p>

      <div className="w-full max-w-sm space-y-4 text-left mb-8">
        {/* State dropdown */}
        <div>
          <label
            htmlFor="onboarding-state"
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            Your state
          </label>
          <select
            id="onboarding-state"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {US_STATES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="ghost" onClick={onNext} className="gap-2">
          <SkipForward className="h-4 w-4" aria-hidden="true" />
          Skip
        </Button>
        <Button onClick={handleContinue} className="gap-2">
          Continue
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
