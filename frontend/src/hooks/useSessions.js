/**
 * useSessions
 *
 * Owns today's session list:
 *   - Initial load (completed, today only)
 *   - Clear-log (hides from view, keeps in DB via localStorage set)
 *   - Derived: visibleSessions, totalToday
 */

import { useState } from "react";
import { api } from "@api/api";
import { normaliseSession } from "@utils/normalise";
import { isToday } from "@utils/formatters";

export function useSessions() {
  const [sessions,        setSessions]        = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [hiddenSessionIds, setHiddenSessionIds] = useState(() => {
    try {
      return new Set(JSON.parse(localStorage.getItem("hiddenSessionIds") || "[]"));
    } catch {
      return new Set();
    }
  });

  async function loadSessions() {
    try {
      const { sessions: dbSessions } = await api.get("/sessions?limit=100");
      setSessions(
        dbSessions
          .filter((s) => !s.isRunning && isToday(s.startedAt))
          .map(normaliseSession),
      );
    } catch (err) {
      console.error("loadSessions:", err.message);
    } finally {
      setSessionsLoading(false);
    }
  }

  // Hides all current sessions from the log view without deleting them
  function handleClearLog(currentSessions) {
    const ids = new Set(currentSessions.map((s) => s.id));
    setHiddenSessionIds((prev) => {
      const next = new Set([...prev, ...ids]);
      localStorage.setItem("hiddenSessionIds", JSON.stringify([...next]));
      return next;
    });
  }

  const visibleSessions = sessions.filter(
    (s) => isToday(s.timestamp) && !hiddenSessionIds.has(s.id),
  );

  const totalToday = visibleSessions.reduce((sum, s) => sum + s.duration, 0);

  return {
    sessions,
    setSessions,
    sessionsLoading,
    loadSessions,
    visibleSessions,
    totalToday,
    handleClearLog,
  };
}
