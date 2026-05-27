/**
 * usePomodoroSettings
 * State and server interactions for the Pomodoro settings tab.
 */

import { useState } from "react";
import { api } from "@api/api";

export function usePomodoroSettings(user, setUser, showToast) {
  const [pomoSettings, setPomoSettings] = useState({
    workMins:       user?.pomoSettings?.workMins       ?? 25,
    shortBreakMins: user?.pomoSettings?.shortBreakMins ?? 5,
    longBreakMins:  user?.pomoSettings?.longBreakMins  ?? 15,
    totalSessions:  user?.pomoSettings?.totalSessions  ?? 4,
    longBreakEvery: user?.pomoSettings?.longBreakEvery ?? 4,
    autoStartBreak: user?.pomoSettings?.autoStartBreak ?? true,
    autoStartWork:  user?.pomoSettings?.autoStartWork  ?? false,
  });
  const [pomoLoading, setPomoLoading] = useState(false);

  async function handlePomoSave() {
    setPomoLoading(true);
    try {
      const data    = await api.patch("/auth/me", { pomoSettings });
      const updated = data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      showToast("Pomodoro settings saved");
    } catch (err) {
      showToast(err.message || "Failed to save settings", "error");
    } finally {
      setPomoLoading(false);
    }
  }

  return { pomoSettings, setPomoSettings, pomoLoading, onSave: handlePomoSave };
}
