'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useTimeTracking() {
  const startTimeRef = useRef<number>(Date.now());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    // Reset start time when component mounts
    startTimeRef.current = Date.now();

    // Update database every 30 seconds
    intervalRef.current = setInterval(async () => {
      const currentTime = Date.now();
      const sessionTime = Math.floor((currentTime - startTimeRef.current) / 1000); // in seconds
      accumulatedTimeRef.current += sessionTime;

      // Update database
      await updateTimeSpent(accumulatedTimeRef.current);

      // Reset for next interval
      startTimeRef.current = currentTime;
      accumulatedTimeRef.current = 0;
    }, 30000); // Update every 30 seconds

    // Cleanup function - save time when user leaves
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Calculate final session time
      const finalSessionTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const totalTime = accumulatedTimeRef.current + finalSessionTime;

      // Send final update (using sendBeacon for reliability on page unload)
      if (totalTime > 0) {
        updateTimeSpentBeacon(totalTime);
      }
    };
  }, []);

  const updateTimeSpent = async (additionalSeconds: number) => {
    if (additionalSeconds <= 0) return;

    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Get current timeSpent
      const { data: student } = await supabase
        .from('Students')
        .select('timeSpent')
        .eq('id', user.id)
        .single();

      const currentTime = student?.timeSpent || 0;
      const newTime = currentTime + additionalSeconds;

      // Update timeSpent
      await supabase
        .from('Students')
        .update({ timeSpent: newTime })
        .eq('id', user.id);

      console.log(`Updated time: +${additionalSeconds}s, Total: ${newTime}s`);
    } catch (error) {
      console.error('Error updating time:', error);
    }
  };

  const updateTimeSpentBeacon = (additionalSeconds: number) => {
    // Use sendBeacon for reliable updates on page unload
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob(
        [JSON.stringify({ seconds: additionalSeconds })],
        { type: 'application/json' }
      );
      navigator.sendBeacon('/api/student/update-time', blob);
    }
  };
}