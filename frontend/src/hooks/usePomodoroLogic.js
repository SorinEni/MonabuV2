/**
 * usePomodoroLogic
 *
 * All state and handlers for the Pomodoro timer.
 *
 *  Work-time accuracy
 * Only time spent in "work" phases counts toward the saved session duration.
 * Break time is never included.
 *
 * Work time is tracked in two parts:
 *   pomoAccumulatedWorkSecsRef  — fully elapsed work slices (from previous
 *                                 work phases or before the last pause)
 *   pomoCurrentPhaseStartRef    — Date.now() ms when the current active work
 *                                 slice began (null during breaks or paused)
 *
 * Live work seconds = accumulated + floor((Date.now() - currentPhaseStart) / 1000)
 *
 * Phase end times are always derived from pomoPhaseEndRef (set once when the
 * phase starts) rather than Date.now() at completion, so no drift accumulates
 * across many sessions.
 *
 *  Stale-closure safety
 * All mutable counters (session index, phase, accumulated secs, completed count)
 * are mirrored in refs so that async callbacks (setTimeout, setInterval) always
 * read the latest value without depending on React state timing.
 *
 *  Session labeling
 * Full cycle completed  → "Pomodoro session" or "Pomodoro (N sessions)"
 * Partial (1 block)     → "Pomodoro – 1 session completed"
 * Partial (N blocks)    → "Pomodoro – N/Total sessions completed"
 * User provided a name  → that name is always used instead
 *
 *  Cross-tab sync
 * The leader tab broadcasts phase changes, pause, resume, skip, end, discard.
 * Other tabs update their display to match without touching the server.
 *
 *  Pause / resume during breaks
 * The user can pause and resume during a break. The break countdown freezes
 * and resumes correctly. Work-time accumulation is unaffected (breaks don't
 * add to it anyway).
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { api } from "@api/api";
import { DEFAULT_POMO } from "@constants/pomodoroSettings";
import { getUser } from "@api/api";

export function usePomodoroLogic({
  // clock primitives from useTimerClock (running = isRunning)
  running,
  startClock,
  pauseClock,
  resumeClock,
  resetClock,

  // tab-lock primitives
  broadcastAction,
  onRemoteAction,

  // shared session state
  sessionName,
  selectedTag,
  selectedSubTag,
  tags,

  // session log
  setSessions,
  setSaveError,

  // normalise helper
  normaliseSession,
}) {
  //  Settings
  const [pomoSettings, setPomoSettings] = useState(() => {
    const user = getUser();
    return user?.pomoSettings ?? DEFAULT_POMO;
  });

  // Keep a ref mirror so async callbacks always see the latest settings
  // without needing to be re-registered.
  const pomoSettingsRef = useRef(pomoSettings);
  useEffect(() => {
    pomoSettingsRef.current = pomoSettings;
  }, [pomoSettings]);

  //  Phase state (React state for rendering)
  const [pomoPhase, setPomoPhase] = useState("work");
  const [pomoSession, setPomoSession] = useState(1);
  const [pomoCountdown, setPomoCountdown] = useState(null); // null = not started
  const [pomoDone, setPomoDone] = useState(false);

  //  Ref mirrors of the above (always fresh in callbacks)
  const pomoPhaseRef = useRef("work");
  const pomoSessionRef = useRef(1);

  const setPomoPhaseSync = (p) => {
    pomoPhaseRef.current = p;
    setPomoPhase(p);
  };
  const setPomoSessionSync = (s) => {
    pomoSessionRef.current = s;
    setPomoSession(s);
  };

  //  Timing refs
  //
  // pomoPhaseEndRef            – abs ms when the current phase timer expires
  //                              (set once at phase-start; used as authoritative
  //                               end-of-slice time to prevent drift)
  // pomoCurrentPhaseStartRef   – Date.now() ms when this work slice began
  //                              (null when paused or in a break)
  // pomoAccumulatedWorkSecsRef – total work seconds from completed/paused slices
  // pomoCompletedRef           – number of fully completed work blocks
  const pomoPhaseEndRef = useRef(null);
  const pomoCurrentPhaseStartRef = useRef(null);
  const pomoAccumulatedWorkSecsRef = useRef(0);
  const pomoCompletedRef = useRef(0);

  // Break-pause support: when the user pauses during a break we store the
  // remaining break seconds so resume can reconstruct the end time correctly.
  const pomoBreakRemainingRef = useRef(null);

  const intervalRef = useRef(null);
  const pomoSaveTimerRef = useRef(null);

  //  Imperative interval control
  //
  // The countdown loop is managed directly (not via a useEffect on `running`)
  // so auto-phase-transitions can stop the old interval and immediately start
  // a new one without depending on React re-rendering in between.

  const _startInterval = useCallback(() => {
    if (intervalRef.current) return; // already running
    intervalRef.current = setInterval(() => {
      if (pomoPhaseEndRef.current === null) return;
      const remaining = Math.max(
        0,
        Math.round((pomoPhaseEndRef.current - Date.now()) / 1000),
      );
      setPomoCountdown(remaining);
      if (remaining <= 0) {
        _stopInterval();
        // Small delay so React state settles before the phase transition.
        setTimeout(() => phaseCompleteRef.current?.(), 50);
      }
    }, 250);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const _stopInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Ref that always holds the latest sessionName so async save closures
  // don't capture a stale value.
  const sessionNameRef = useRef(sessionName);
  useEffect(() => {
    sessionNameRef.current = sessionName;
  }, [sessionName]);

  //  Helpers

  const getPhaseSeconds = useCallback((phase, session) => {
    const { workMins, shortBreakMins, longBreakMins, longBreakEvery } =
      pomoSettingsRef.current;
    if (phase === "work") return workMins * 60;
    const isLong = longBreakEvery > 0 && session % longBreakEvery === 0;
    return (isLong ? longBreakMins : shortBreakMins) * 60;
  }, []); // reads from ref, never stale

  /**
   * Seconds of work logged so far, including any currently-running slice.
   * Uses pomoPhaseEndRef as the end-of-slice anchor when the phase has
   * naturally ended, so we don't accumulate drift from setTimeout/setInterval
   * firing slightly late.
   *
   * @param {boolean} [phaseJustEnded=false]
   *   Pass true when calling from inside phase-completion to use the exact
   *   phase-end timestamp rather than Date.now().
   */
  const liveWorkSecs = useCallback((phaseJustEnded = false) => {
    let total = pomoAccumulatedWorkSecsRef.current;
    if (pomoCurrentPhaseStartRef.current !== null) {
      const endMs =
        phaseJustEnded && pomoPhaseEndRef.current !== null
          ? pomoPhaseEndRef.current
          : Date.now();
      total += Math.round((endMs - pomoCurrentPhaseStartRef.current) / 1000);
    }
    return total;
  }, []);

  function playBeep(type) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value =
        type === "done" ? 880 : type === "work_done" ? 660 : 440;
      g.gain.setValueAtTime(0.15, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      o.start(ctx.currentTime);
      o.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  }

  function buildLabel(completedBlocks, totalSessions) {
    const name = sessionNameRef.current.trim();
    if (name) return name;
    if (completedBlocks >= totalSessions) {
      return totalSessions === 1
        ? "Pomodoro session"
        : `Pomodoro (${totalSessions} sessions)`;
    }
    return completedBlocks === 1
      ? "Pomodoro – 1 session completed"
      : `Pomodoro – ${completedBlocks}/${totalSessions} sessions completed`;
  }

  async function savePomoSession(workSecs, completedBlocks) {
    if (workSecs < 5) return; // discard near-zero accidentals
    const { totalSessions } = pomoSettingsRef.current;
    const tag = tags.find((t) => t.id === selectedTag);
    const label = buildLabel(completedBlocks, totalSessions);
    const endedAt = new Date();
    const startedAt = new Date(endedAt.getTime() - workSecs * 1000);

    try {
      const { session } = await api.post("/sessions", {
        tagId: tag?.id ?? undefined,
        subTagId: selectedSubTag ?? undefined,
        label,
        startedAt: startedAt.toISOString(),
        endedAt: endedAt.toISOString(),
      });
      setSessions((prev) => [
        normaliseSession(session, { pomo: true }),
        ...prev,
      ]);
    } catch (err) {
      setSaveError("Could not save pomodoro session: " + err.message);
    }
  }

  //  Phase completion
  //
  // phaseCompleteRef is updated after every render (no dep array) so the
  // interval always calls the freshest closure. All mutable counters are
  // read from refs — never from React state — to avoid stale captures.
  const phaseCompleteRef = useRef(null);

  useEffect(() => {
    phaseCompleteRef.current = () => {
      const { totalSessions, autoStartBreak, autoStartWork } =
        pomoSettingsRef.current;
      const currentPhase = pomoPhaseRef.current;
      const currentSession = pomoSessionRef.current;

      if (currentPhase === "work") {
        //  End of a work block
        //
        // Finalise this work slice using the scheduled phase-end time as the
        // anchor (not Date.now()) so there's no drift from timer imprecision.
        if (pomoCurrentPhaseStartRef.current !== null) {
          const endMs = pomoPhaseEndRef.current ?? Date.now();
          const sliceSecs = Math.max(
            0,
            Math.round((endMs - pomoCurrentPhaseStartRef.current) / 1000),
          );
          pomoAccumulatedWorkSecsRef.current += sliceSecs;
          pomoCurrentPhaseStartRef.current = null;
        }

        const completedNow = pomoCompletedRef.current + 1;
        pomoCompletedRef.current = completedNow;

        if (completedNow >= totalSessions) {
          //  Full cycle done
          // Snapshot the accumulated work before resetting so the async
          // savePomoSession call gets the right value even if the ref
          // is cleared before the promise resolves.
          const workSecsSnapshot = pomoAccumulatedWorkSecsRef.current;

          pauseClock();
          setPomoDone(true);
          setPomoPhaseSync("work");
          setPomoSessionSync(1);
          setPomoCountdown(getPhaseSeconds("work", 1));
          pomoPhaseEndRef.current = null;
          pomoBreakRemainingRef.current = null;
          pomoAccumulatedWorkSecsRef.current = 0;
          pomoCompletedRef.current = 0;
          playBeep("done");

          // Save after resetting state so the UI feels instant.
          savePomoSession(workSecsSnapshot, completedNow);

          broadcastAction("pomo_done", {
            completedBlocks: completedNow,
            totalSessions,
          });
          return;
        }

        //  Move to break
        const breakSecs = getPhaseSeconds("break", currentSession);
        pomoBreakRemainingRef.current = breakSecs;
        setPomoPhaseSync("break");
        // session index stays the same — it identifies which work block
        // just completed (used for long-break calculation).
        setPomoCountdown(breakSecs);
        playBeep("work_done");

        if (autoStartBreak) {
          pomoPhaseEndRef.current = Date.now() + breakSecs * 1000;
          // Keep isRunning true and restart the interval for the new phase.
          _stopInterval();
          _startInterval();
          broadcastAction("pomo_phase_change", {
            phase: "break",
            session: currentSession,
            countdown: breakSecs,
            autoStarted: true,
          });
        } else {
          _stopInterval();
          pauseClock();
          pomoPhaseEndRef.current = null;
          broadcastAction("pomo_phase_change", {
            phase: "break",
            session: currentSession,
            countdown: breakSecs,
            autoStarted: false,
          });
        }
      } else {
        //  End of a break — move to next work block
        const nextSess = currentSession + 1;
        setPomoSessionSync(nextSess);
        setPomoPhaseSync("work");
        const workSecs = getPhaseSeconds("work", nextSess);
        setPomoCountdown(workSecs);
        pomoBreakRemainingRef.current = null;
        playBeep("break_done");

        if (autoStartWork) {
          pomoCurrentPhaseStartRef.current = Date.now();
          pomoPhaseEndRef.current = Date.now() + workSecs * 1000;
          // Keep isRunning true and restart the interval for the new phase.
          _stopInterval();
          _startInterval();
          broadcastAction("pomo_phase_change", {
            phase: "work",
            session: nextSess,
            countdown: workSecs,
            autoStarted: true,
          });
        } else {
          pomoCurrentPhaseStartRef.current = null;
          pomoPhaseEndRef.current = null;
          _stopInterval();
          pauseClock();
          broadcastAction("pomo_phase_change", {
            phase: "work",
            session: nextSess,
            countdown: workSecs,
            autoStarted: false,
          });
        }
      }
    };
  }); // no dep array — reassigns every render for a fresh closure

  // Re-sync countdown when the user returns to the tab.
  useEffect(() => {
    const onVisible = () => {
      if (intervalRef.current && pomoPhaseEndRef.current !== null) {
        const remaining = Math.max(
          0,
          Math.round((pomoPhaseEndRef.current - Date.now()) / 1000),
        );
        setPomoCountdown(remaining);
      }
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  // Clean up interval on unmount.
  useEffect(() => () => _stopInterval(), [_stopInterval]);

  //  Cross-tab remote action listener

  useEffect(() => {
    const unsub = onRemoteAction((type, payload) => {
      switch (type) {
        case "pomo_started":
          setPomoPhaseSync("work");
          setPomoSessionSync(1);
          setPomoDone(false);
          setPomoCountdown(payload.countdown ?? null);
          break;

        case "pomo_paused":
          pauseClock();
          if (payload.countdown !== undefined) {
            setPomoCountdown(payload.countdown);
          }
          break;

        case "pomo_resumed":
          resumeClock();
          break;

        case "pomo_phase_change":
          setPomoPhaseSync(payload.phase);
          setPomoSessionSync(payload.session);
          setPomoCountdown(payload.countdown);
          if (payload.autoStarted) {
            resumeClock();
          } else {
            pauseClock();
          }
          break;

        case "pomo_done":
          pauseClock();
          setPomoDone(true);
          setPomoPhaseSync("work");
          setPomoSessionSync(1);
          break;

        case "pomo_end":
        case "pomo_discarded":
          _resetPomoState();
          break;

        default:
          break;
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRemoteAction]);

  //  Action handlers

  const handleStart = () => {
    if (pomoCountdown === null) {
      //  Fresh start
      const workSecs = getPhaseSeconds("work", 1);
      setPomoCountdown(workSecs);
      setPomoPhaseSync("work");
      setPomoSessionSync(1);
      setPomoDone(false);
      pomoCompletedRef.current = 0;
      pomoAccumulatedWorkSecsRef.current = 0;
      pomoBreakRemainingRef.current = null;
      pomoCurrentPhaseStartRef.current = Date.now();
      pomoPhaseEndRef.current = Date.now() + workSecs * 1000;
      startClock();
      _startInterval();
      broadcastAction("pomo_started", { countdown: workSecs });
    } else {
      //  Resume from pause
      if (pomoPhaseRef.current === "work") {
        if (pomoPhaseEndRef.current === null && pomoCountdown !== null) {
          pomoPhaseEndRef.current = Date.now() + pomoCountdown * 1000;
        }
        pomoCurrentPhaseStartRef.current = Date.now();
      } else {
        const remaining = pomoBreakRemainingRef.current ?? pomoCountdown ?? 0;
        pomoPhaseEndRef.current = Date.now() + remaining * 1000;
      }
      resumeClock();
      _startInterval();
      broadcastAction("pomo_resumed", {});
    }
  };

  const handlePause = () => {
    if (
      pomoPhaseRef.current === "work" &&
      pomoCurrentPhaseStartRef.current !== null
    ) {
      // Freeze current work-slice: add elapsed to accumulator.
      const sliceSecs = Math.round(
        (Date.now() - pomoCurrentPhaseStartRef.current) / 1000,
      );
      pomoAccumulatedWorkSecsRef.current += sliceSecs;
      pomoCurrentPhaseStartRef.current = null;
    }

    if (pomoPhaseRef.current === "break" && pomoPhaseEndRef.current !== null) {
      // Freeze break countdown so resume can reconstruct the end time.
      pomoBreakRemainingRef.current = Math.max(
        0,
        Math.round((pomoPhaseEndRef.current - Date.now()) / 1000),
      );
    }

    pomoPhaseEndRef.current = null;
    _stopInterval();
    pauseClock();
    broadcastAction("pomo_paused", { countdown: pomoCountdown });
  };

  /**
   * Skip the current phase — treat it as if the timer just expired.
   * For a work phase: elapsed time is credited (not the full scheduled duration),
   * consistent with how phase-complete works normally.
   * For a break phase: just advance to the next phase, no work time added.
   */
  const handleSkip = () => {
    _stopInterval();

    if (pomoPhaseRef.current === "work") {
      if (pomoCurrentPhaseStartRef.current !== null) {
        const elapsedSecs = Math.round(
          (Date.now() - pomoCurrentPhaseStartRef.current) / 1000,
        );
        pomoAccumulatedWorkSecsRef.current += elapsedSecs;
        pomoCurrentPhaseStartRef.current = null;
      }
      pomoPhaseEndRef.current = Date.now();
    } else {
      pomoPhaseEndRef.current = Date.now();
    }

    phaseCompleteRef.current?.();
  };

  /**
   * End early — save whatever work has been done and reset.
   * Called by the "End Pomodoro" / "Save & Finish" button.
   */
  const handleEnd = async () => {
    pauseClock();
    setSaveError("");

    // Capture any in-progress work slice before resetting.
    const workSecs = liveWorkSecs(false);
    const completedSoFar = pomoCompletedRef.current;

    broadcastAction("pomo_end", {});
    _resetPomoState();

    // Save after reset so the UI clears instantly.
    if (workSecs >= 5) {
      await savePomoSession(workSecs, completedSoFar);
    }
  };

  const handleDiscard = () => {
    broadcastAction("pomo_discarded", {});
    _resetPomoState();
  };

  //  Settings persistence

  const savePomoSettings = useCallback((settings) => {
    clearTimeout(pomoSaveTimerRef.current);
    pomoSaveTimerRef.current = setTimeout(async () => {
      try {
        await api.patch("/auth/me", { pomoSettings: settings });
        const user = getUser();
        if (user) {
          localStorage.setItem(
            "user",
            JSON.stringify({ ...user, pomoSettings: settings }),
          );
        }
      } catch (err) {
        console.error("Failed to save Pomodoro settings:", err.message);
      }
    }, 1500);
  }, []);

  const handleSettingsChange = (next) => {
    setPomoSettings(next);
    savePomoSettings(next);
  };

  //  Internal reset

  function _resetPomoState() {
    _stopInterval();
    resetClock();
    setPomoPhaseSync("work");
    setPomoSessionSync(1);
    setPomoCountdown(null);
    setPomoDone(false);
    pomoCompletedRef.current = 0;
    pomoAccumulatedWorkSecsRef.current = 0;
    pomoCurrentPhaseStartRef.current = null;
    pomoPhaseEndRef.current = null;
    pomoBreakRemainingRef.current = null;
  }

  //  Derived display values

  const isLongBreak =
    pomoPhase === "break" &&
    pomoSettings.longBreakEvery > 0 &&
    pomoSession % pomoSettings.longBreakEvery === 0;

  // Read directly from pomoSettings state (not the ref) so these derived
  // values re-compute on every render and stay in sync with the settings UI.
  const _workSecsFromState = pomoSettings.workMins * 60;
  const _phaseSecsFromState = (() => {
    const { shortBreakMins, longBreakMins, longBreakEvery } = pomoSettings;
    const isLongPhase =
      longBreakEvery > 0 && pomoSession % longBreakEvery === 0;
    return pomoPhase === "work"
      ? _workSecsFromState
      : (isLongPhase ? longBreakMins : shortBreakMins) * 60;
  })();

  const displaySeconds =
    pomoCountdown !== null ? pomoCountdown : _workSecsFromState;

  const progress = (() => {
    if (pomoCountdown === null) return 1;
    return _phaseSecsFromState > 0 ? pomoCountdown / _phaseSecsFromState : 1;
  })();

  //  Public surface

  return {
    // state
    pomoSettings,
    pomoPhase,
    pomoSession,
    pomoCountdown,
    pomoDone,
    isLongBreak,
    displaySeconds,
    progress,
    // actions
    handleStart,
    handlePause,
    handleSkip,
    handleEnd,
    handleDiscard,
    handleSettingsChange,
    // exported so Tracker can call on mode-toggle
    resetPomoState: _resetPomoState,
    getPhaseSeconds,
  };
}
