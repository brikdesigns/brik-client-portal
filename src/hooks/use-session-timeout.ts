'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

/**
 * Session timeout configuration.
 *
 * HIPAA mode (15 min idle) can be enabled per-user or globally
 * when healthcare clients get portal access.
 */
interface SessionTimeoutConfig {
  /** Max idle time before logout (ms). Default: 30 min. HIPAA: 15 min. */
  idleTimeout: number;
  /** Absolute max session duration (ms). Default: 8 hours. */
  maxSession: number;
  /** How long to show warning before logout (ms). Default: 2 min. */
  warningBefore: number;
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  idleTimeout: 30 * 60 * 1000,       // 30 minutes
  maxSession: 8 * 60 * 60 * 1000,    // 8 hours
  warningBefore: 2 * 60 * 1000,      // 2 minutes
};

export const HIPAA_CONFIG: SessionTimeoutConfig = {
  idleTimeout: 15 * 60 * 1000,       // 15 minutes
  maxSession: 8 * 60 * 60 * 1000,    // 8 hours
  warningBefore: 2 * 60 * 1000,      // 2 minutes
};

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart'] as const;

export function useSessionTimeout(config: SessionTimeoutConfig = DEFAULT_CONFIG) {
  const router = useRouter();
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const logout = useCallback(async (reason: 'idle' | 'max_session') => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/login?session=${reason}`);
    router.refresh();
  }, [router]);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);
  }, []);

  const resetIdleTimer = useCallback(() => {
    // Clear existing idle timers
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    setShowWarning(false);

    // Set warning timer (fires before idle logout)
    warningTimerRef.current = setTimeout(() => {
      const secs = Math.ceil(config.warningBefore / 1000);
      setSecondsLeft(secs);
      setShowWarning(true);

      // Countdown
      countdownRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, config.idleTimeout - config.warningBefore);

    // Set idle logout timer
    idleTimerRef.current = setTimeout(() => {
      logout('idle');
    }, config.idleTimeout);
  }, [config.idleTimeout, config.warningBefore, logout]);

  // Dismiss warning and reset idle timer on "Stay signed in"
  const dismissWarning = useCallback(() => {
    resetIdleTimer();
  }, [resetIdleTimer]);

  useEffect(() => {
    // Start idle timer
    resetIdleTimer();

    // Start absolute max session timer
    maxTimerRef.current = setTimeout(() => {
      logout('max_session');
    }, config.maxSession);

    // Reset idle on user activity
    const handleActivity = () => resetIdleTimer();
    for (const event of ACTIVITY_EVENTS) {
      document.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      clearAllTimers();
      for (const event of ACTIVITY_EVENTS) {
        document.removeEventListener(event, handleActivity);
      }
    };
  }, [config.maxSession, resetIdleTimer, logout, clearAllTimers]);

  return { showWarning, secondsLeft, dismissWarning };
}
