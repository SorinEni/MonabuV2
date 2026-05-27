/**
 * useTimerClock
 *
 * Wall-clock stopwatch that stays accurate when the tab is throttled.
 * Derives elapsed = floor((now - wallStart) / 1000) instead of counting ticks.
 *
 * API:
 *   elapsed        — seconds, updates every 250 ms while running
 *   isRunning      — boolean
 *   startClock()   — start from 0
 *   pauseClock()   — freeze elapsed
 *   resumeClock()  — continue from freeze point
 *   resetClock()   — back to 0, stopped
 *   setElapsedBase(n, running?) — seed with n seconds (page-reload resume)
 */

import { useState, useRef, useEffect, useCallback } from "react";

export function useTimerClock() {
  const wallStartRef = useRef(null); // timestamp when current segment began
  const baseSecsRef = useRef(0);    // seconds accumulated in previous segments

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const tickRef = useRef(null);

  const computeElapsed = useCallback(() => {
    if (wallStartRef.current === null) return baseSecsRef.current;
    return (
      baseSecsRef.current +
      Math.floor((Date.now() - wallStartRef.current) / 1000)
    );
  }, []);

  const startTick = useCallback(() => {
    if (tickRef.current) return;
    tickRef.current = setInterval(() => setElapsed(computeElapsed()), 250);
  }, [computeElapsed]);

  const stopTick = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  useEffect(() => () => stopTick(), [stopTick]);

  // Catch up immediately when the user switches back to this tab
  useEffect(() => {
    const onVisible = () => {
      if (isRunning) setElapsed(computeElapsed());
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isRunning, computeElapsed]);

  const startClock = useCallback(() => {
    baseSecsRef.current = 0;
    wallStartRef.current = Date.now();
    setElapsed(0);
    setIsRunning(true);
    startTick();
  }, [startTick]);

  const pauseClock = useCallback(() => {
    if (!isRunning) return;
    baseSecsRef.current = computeElapsed();
    wallStartRef.current = null;
    stopTick();
    setElapsed(baseSecsRef.current);
    setIsRunning(false);
  }, [isRunning, computeElapsed, stopTick]);

  const resumeClock = useCallback(() => {
    if (isRunning) return;
    wallStartRef.current = Date.now();
    setIsRunning(true);
    startTick();
  }, [isRunning, startTick]);

  const resetClock = useCallback(() => {
    stopTick();
    wallStartRef.current = null;
    baseSecsRef.current = 0;
    setElapsed(0);
    setIsRunning(false);
  }, [stopTick]);

  /**
   * Seed the clock with an existing elapsed value.
   * Pass running=true to immediately begin ticking from that point.
   * Used when resuming a server-side session on page load.
   */
  const setElapsedBase = useCallback(
    (secs, running = false) => {
      baseSecsRef.current = secs;
      if (running) {
        wallStartRef.current = Date.now();
        setIsRunning(true);
        startTick();
      } else {
        wallStartRef.current = null;
        setIsRunning(false);
      }
      setElapsed(secs);
    },
    [startTick],
  );

  return {
    elapsed,
    isRunning,
    startClock,
    pauseClock,
    resumeClock,
    resetClock,
    setElapsedBase,
  };
}
