/**
 * useTimerClockLogic
 *
 * All side-effect logic for the regular (non-pomodoro) stopwatch:
 *   - Start / pause / resume / stop / discard a server session
 *   - Tab-lock claim / release
 *   - Cross-tab action sync (pause in Tab A → Tab B mirrors it)
 *   - Stale session auto-save (tab closed > 2 min → save up to heartbeat)
 *   - beforeunload cleanup with accurate elapsed time
 *
 * This hook is intentionally render-free — returns action handlers only.
 * All display is handled by TimerClock.
 */

import { useEffect, useRef } from "react";
import { api } from "@api/api";

export function useTimerClockLogic({
  elapsed,
  startClock,
  pauseClock,
  resumeClock,
  resetClock,
  setElapsedBase,
  claimLock,
  releaseLock,
  takeOver,
  broadcastAction,
  onRemoteAction,
  staleSession,
  activeSessionId,
  setActiveSessionId,
  activeSessionStartedAtRef,
  sessionName,
  setSessionName,
  note,
  setNote,
  selectedTag,
  selectedSubTag,
  setSelectedSubTag,
  tags,
  setSessions,
  setSaveError,
  normaliseSession,
}) {
  // Stale session auto-save — runs once on mount when staleSession is set
  const staleHandledRef = useRef(false);

  useEffect(() => {
    if (!staleSession || staleHandledRef.current) return;
    if (!staleSession.isOld) return; // fresh orphan → show take-over UI instead

    staleHandledRef.current = true;

    async function autoSaveStale() {
      const { startedAt, lastHeartbeat } = staleSession;
      if (!startedAt) { releaseLock(); return; }

      const start  = new Date(startedAt);
      const end    = lastHeartbeat ? new Date(lastHeartbeat) : new Date();
      const durSec = Math.max(0, Math.round((end - start) / 1000));

      if (durSec < 5) { releaseLock(); return; }

      try {
        const { session: running } = await api.get("/sessions/running");
        if (running) {
          await api.post(`/sessions/${running._id}/stop`, {
            endedAt: end.toISOString(),
            durationSeconds: durSec,
            label: running.label || undefined,
            notes: running.notes || undefined,
          });
          const { session: saved } = await api
            .get(`/sessions/${running._id}`)
            .catch(() => ({ session: null }));
          if (saved) setSessions((prev) => [normaliseSession(saved), ...prev]);
        } else {
          const { session } = await api.post("/sessions", {
            startedAt: start.toISOString(),
            endedAt: end.toISOString(),
            label: "Resumed session (auto-saved)",
          });
          setSessions((prev) => [normaliseSession(session), ...prev]);
        }
      } catch (err) {
        setSaveError("Auto-save of previous session failed: " + err.message);
      } finally {
        releaseLock();
      }
    }

    autoSaveStale();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staleSession]);

  // Cross-tab remote action listener
  useEffect(() => {
    const unsub = onRemoteAction((type, payload) => {
      switch (type) {
        case "session_started":
          if (payload.sessionId) {
            setActiveSessionId(payload.sessionId);
            if (payload.startedAt)
              activeSessionStartedAtRef.current = new Date(payload.startedAt);
            setElapsedBase(
              Math.floor((Date.now() - new Date(payload.startedAt).getTime()) / 1000),
              true,
            );
          }
          break;

        case "session_paused":
          pauseClock();
          if (payload.elapsed !== undefined) setElapsedBase(payload.elapsed, false);
          break;

        case "session_resumed":
          if (payload.startedAt) {
            setElapsedBase(
              Math.floor((Date.now() - new Date(payload.startedAt).getTime()) / 1000),
              true,
            );
          } else {
            resumeClock();
          }
          break;

        case "session_stopped":
        case "session_discarded":
          resetClock();
          setActiveSessionId(null);
          activeSessionStartedAtRef.current = null;
          setSessionName("");
          setNote("");
          setSelectedSubTag(null);
          if (type === "session_stopped" && payload.session)
            setSessions((prev) => [normaliseSession(payload.session), ...prev]);
          break;

        default:
          break;
      }
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onRemoteAction]);

  // beforeunload — fire-and-forget keepalive fetch so request survives tab close
  useEffect(() => {
    const handleUnload = () => {
      if (!activeSessionId) return;
      const token   = localStorage.getItem("token");
      const endedAt = activeSessionStartedAtRef.current
        ? new Date(activeSessionStartedAtRef.current.getTime() + elapsed * 1000).toISOString()
        : new Date().toISOString();
      localStorage.setItem("sessionHeartbeat", Date.now().toString());
      fetch(`/api/sessions/${activeSessionId}/stop`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ endedAt, durationSeconds: elapsed }),
      });
      releaseLock();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSessionId, elapsed]);

  // Start (or resume a paused session)
  const handleStart = async () => {
    setSaveError("");
    if (activeSessionId) {
      resumeClock();
      broadcastAction("session_resumed", {
        startedAt: activeSessionStartedAtRef.current?.toISOString(),
      });
      return;
    }
    try {
      const tag = tags.find((t) => t.id === selectedTag);
      const { session } = await api.post("/sessions/start", {
        tagId: tag?.id,
        subTagId: selectedSubTag ?? undefined,
        label: sessionName.trim() || undefined,
      });
      setActiveSessionId(session._id);
      activeSessionStartedAtRef.current = new Date(session.startedAt);
      claimLock(session.startedAt);
      startClock();
      broadcastAction("session_started", {
        sessionId: session._id,
        startedAt: session.startedAt,
      });
    } catch (err) {
      setSaveError("Could not start session: " + err.message);
    }
  };

  const handlePause = () => {
    pauseClock();
    broadcastAction("session_paused", { elapsed });
  };

  const handleStop = async () => {
    if (elapsed === 0) return;
    pauseClock();
    setSaveError("");

    let savedSession = null;
    if (activeSessionId) {
      try {
        const endedAt = activeSessionStartedAtRef.current
          ? new Date(activeSessionStartedAtRef.current.getTime() + elapsed * 1000).toISOString()
          : undefined;
        const { session } = await api.post(`/sessions/${activeSessionId}/stop`, {
          endedAt,
          durationSeconds: elapsed,
          notes: note.trim() || undefined,
          label: sessionName.trim() || undefined,
        });
        savedSession = normaliseSession(session);
        setSessions((prev) => [savedSession, ...prev]);
      } catch (err) {
        const is404 =
          err.status === 404 ||
          String(err.message).toLowerCase().includes("not found") ||
          String(err.message).includes("404");
        if (is404) {
          broadcastAction("session_stopped", { session: null });
          _resetTimerState();
          return;
        }
        setSaveError("Could not save session: " + err.message);
      }
    }

    broadcastAction("session_stopped", { session: savedSession });
    _resetTimerState();
  };

  const handleDiscard = async () => {
    pauseClock();
    setSaveError("");
    if (activeSessionId) {
      try {
        await api.post(`/sessions/${activeSessionId}/stop`, {});
        await api.delete(`/sessions/${activeSessionId}`);
      } catch { /* best-effort cleanup */ }
    }
    broadcastAction("session_discarded", {});
    _resetTimerState();
  };

  function _resetTimerState() {
    releaseLock();
    resetClock();
    setActiveSessionId(null);
    activeSessionStartedAtRef.current = null;
    setSessionName("");
    setNote("");
    setSelectedSubTag(null);
  }

  return { handleStart, handlePause, handleStop, handleDiscard };
}
