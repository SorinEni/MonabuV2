// Master hook for the Tracker page.
// Wires together all sub-hooks and exposes a single clean API to the page shell.
// No rendering logic lives here — only state, effects, and handlers.

import { useState, useEffect, useRef } from "react";
import { api, getUser } from "@api/api";
import { getTheme, toggleTheme, initTheme } from "@utils/theme";
import { getTrackerTheme, saveClockTheme, loadClockTheme } from "@utils/TrackerTheme";
import { normaliseSession } from "@utils/normalise";
import { useTimerClock } from "@hooks/useTimerClock";
import { useTabLock } from "@hooks/useTabLock";
import { useTimerClockLogic } from "@hooks/useTimerClockLogic";
import { usePomodoroLogic } from "@hooks/usePomodoroLogic";
import { useTags } from "@hooks/useTags";
import { useSessions } from "@hooks/useSessions";

export function useTracker() {
  // Theme
  const [theme, setThemeState] = useState(() => {
    const user = getUser();
    initTheme(user?.themePreference ?? "dark");
    return getTheme();
  });
  const handleThemeToggle = () => setThemeState(toggleTheme());

  // Sidebar
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Clock skin
  const [clockThemeKey, setClockThemeKey] = useState(() => loadClockTheme());
  const clockTheme = getTrackerTheme(clockThemeKey);
  const handleSkinChange = (key) => {
    setClockThemeKey(key);
    saveClockTheme(key);
  };

  // Session form
  const [sessionName, setSessionName] = useState("");
  const [note, setNote] = useState("");
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedSubTag, setSelectedSubTag] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [pomoMode, setPomoMode] = useState(false);
  const [showAutoSavedBanner, setShowAutoSavedBanner] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);

  const activeSessionStartedAtRef = useRef(null);

  // Local time ticker for display
  const [localTime, setLocalTime] = useState("");
  useEffect(() => {
    const user = getUser();
    const tz = user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
    const fmt = () => {
      try {
        setLocalTime(
          new Date().toLocaleTimeString(undefined, {
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      } catch {
        setLocalTime(
          new Date().toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          }),
        );
      }
    };
    fmt();
    const iv = setInterval(fmt, 60000);
    return () => clearInterval(iv);
  }, []);

  // Sub-hooks
  const clock = useTimerClock();
  const lock = useTabLock();
  const {
    tags, tagsLoading, loadTags, handleTagCreated,
    handleHideTag, handleHideDefaultTag,
    handleSaveEditTag, handleConfirmDeleteTag, handleAddSubTag,
  } = useTags();
  const { sessions, setSessions, sessionsLoading, visibleSessions, loadSessions,
    handleClearLog: _clearLog } = useSessions();

  const timerLogic = useTimerClockLogic({
    elapsed: clock.elapsed,
    startClock: clock.startClock,
    pauseClock: clock.pauseClock,
    resumeClock: clock.resumeClock,
    resetClock: clock.resetClock,
    setElapsedBase: clock.setElapsedBase,
    claimLock: lock.claimLock,
    releaseLock: lock.releaseLock,
    takeOver: lock.takeOver,
    broadcastAction: lock.broadcastAction,
    onRemoteAction: lock.onRemoteAction,
    staleSession: lock.staleSession,
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
  });

  const pomo = usePomodoroLogic({
    running: clock.isRunning,
    startClock: clock.startClock,
    pauseClock: clock.pauseClock,
    resumeClock: clock.resumeClock,
    resetClock: clock.resetClock,
    broadcastAction: lock.broadcastAction,
    onRemoteAction: lock.onRemoteAction,
    sessionName,
    selectedTag,
    selectedSubTag,
    tags,
    setSessions,
    setSaveError,
    normaliseSession,
  });

  // Show auto-saved banner after stale session is resolved.
  useEffect(() => {
    if (lock.staleSession?.isOld) {
      const t = setTimeout(() => setShowAutoSavedBanner(true), 1200);
      return () => clearTimeout(t);
    }
  }, [lock.staleSession]);

  // On mount: load data and resume any running server session.
  useEffect(() => {
    async function ensureUser() {
      if (localStorage.getItem("token") && !getUser()) {
        try {
          const { user } = await api.get("/auth/me");
          if (user) {
            localStorage.setItem("user", JSON.stringify(user));
            window.dispatchEvent(new CustomEvent("userUpdated", { detail: user }));
          }
        } catch (err) {
          console.error(err.message);
        }
      }
    }

    async function resumeRunningSession() {
      if (lock.staleSession?.isOld) return;
      try {
        const { session } = await api.get("/sessions/running");
        if (!session) return;
        const elapsedSecs = Math.floor(
          (Date.now() - new Date(session.startedAt).getTime()) / 1000,
        );
        setActiveSessionId(session._id);
        activeSessionStartedAtRef.current = new Date(session.startedAt);
        clock.setElapsedBase(elapsedSecs, true);
        if (session.label) setSessionName(session.label);
        if (session.tag?._id) setSelectedTag(session.tag._id);
        if (session.subTag?._id) setSelectedSubTag(session.subTag._id);
        lock.claimLock(session.startedAt);
      } catch {
        // No running session — start fresh.
      }
    }

    ensureUser();
    loadTags();
    loadSessions();
    resumeRunningSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle between stopwatch and pomodoro modes.
  const handlePomoToggle = () => {
    if (clock.isRunning) return;
    setPomoMode((prev) => !prev);
    pomo.resetPomoState();
    if (activeSessionId) {
      api.post(`/sessions/${activeSessionId}/stop`, {}).catch(() => {});
      lock.releaseLock();
      setActiveSessionId(null);
    }
  };

  // Take over an orphaned session from a closed tab.
  const handleTakeOver = async () => {
    const startedAt = lock.takeOver();
    try {
      const { session } = await api.get("/sessions/running");
      if (session) {
        const elapsedSecs = Math.floor(
          (Date.now() - new Date(session.startedAt).getTime()) / 1000,
        );
        setActiveSessionId(session._id);
        activeSessionStartedAtRef.current = new Date(session.startedAt);
        if (session.label) setSessionName(session.label);
        if (session.tag?._id) setSelectedTag(session.tag._id);
        if (session.subTag?._id) setSelectedSubTag(session.subTag._id);
        clock.setElapsedBase(elapsedSecs, true);
      }
    } catch {
      if (startedAt) {
        clock.setElapsedBase(
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
          true,
        );
      }
    }
  };

  const handleSelectTag = (tagId) => {
    if (tagId !== selectedTag) setSelectedSubTag(null);
    setSelectedTag(tagId);
  };

  const handleEditTag = (tag) => setEditingTag(tag);
  const handleDeleteTag = (tag) => setDeletingTag(tag);

  const handleClearLog = () => {
    _clearLog(new Set(visibleSessions.map((s) => s.id)));
  };

  // Derived display values
  const activeTag = tags.find((t) => t.id === selectedTag);
  const tagColor = activeTag?.color || "var(--accent)";

  const totalToday = visibleSessions.reduce((sum, s) => sum + s.duration, 0);

  const statusLabel = clock.isRunning
    ? pomoMode
      ? pomo.pomoPhase === "work"
        ? "Focusing"
        : pomo.isLongBreak
          ? "Long Break"
          : "Short Break"
      : "Recording"
    : pomo.pomoDone
      ? "All sessions done!"
      : clock.elapsed > 0 && !pomoMode
        ? "Paused"
        : "Ready";

  const showingStaleHandling = lock.staleSession?.isOld && !lock.isLeader;

  return {
    // Theme & layout
    theme,
    handleThemeToggle,
    sidebarCollapsed,
    setSidebarCollapsed,

    // Clock skin
    clockThemeKey,
    clockTheme,
    handleSkinChange,

    // Session form
    sessionName,
    setSessionName,
    note,
    setNote,
    selectedTag,
    selectedSubTag,
    setSelectedSubTag,
    handleSelectTag,

    // Tags
    tags,
    tagsLoading,
    handleTagCreated,
    handleHideTag,
    handleHideDefaultTag,
    handleEditTag,
    handleDeleteTag,
    handleSaveEditTag,
    handleConfirmDeleteTag,
    handleAddSubTag,

    // Modals
    showModal: showCreateModal,
    setShowModal: setShowCreateModal,
    editingTag,
    setEditingTag,
    deletingTag,
    setDeletingTag,

    // Sessions
    sessions,
    sessionsLoading,
    visibleSessions,
    totalToday,
    handleClearLog,

    // Timer
    elapsed: clock.elapsed,
    running: clock.isRunning,
    timerLogic,
    tagColor,

    // Pomodoro
    pomoMode,
    handlePomoToggle,
    pomo,

    // Tab lock
    isLeader: lock.isLeader,
    isBlocked: lock.isBlocked,
    ghostSession: lock.ghostSession,
    staleSession: lock.staleSession,
    showingStaleHandling,
    handleTakeOver,

    // Misc
    localTime,
    saveError,
    statusLabel,
    showAutoSavedBanner,
    setShowAutoSavedBanner,
  };
}
