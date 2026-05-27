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
  const [pomoSaving,  setPomoSaving]  = useState(false);

  // Per-toggle debounce flags
  const [autoBreakToggling, setAutoBreakToggling] = useState(false);
  const [autoWorkToggling,  setAutoWorkToggling]  = useState(false);

  async function handlePomoSave() {
    if (pomoSaving) return;
    setPomoSaving(true);
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
      setTimeout(() => setPomoSaving(false), 500);
    }
  }

  async function handleAutoBreakToggle(value) {
    if (autoBreakToggling) return;
    setAutoBreakToggling(true);
    const prev = pomoSettings.autoStartBreak;
    setPomoSettings((p) => ({ ...p, autoStartBreak: value }));
    try {
      const next = { ...pomoSettings, autoStartBreak: value };
      const data = await api.patch("/auth/me", { pomoSettings: next });
      const updated = data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } catch (err) {
      setPomoSettings((p) => ({ ...p, autoStartBreak: prev }));
      showToast(err.message || "Failed to update auto-start breaks", "error");
    } finally {
      setTimeout(() => setAutoBreakToggling(false), 500);
    }
  }

  async function handleAutoWorkToggle(value) {
    if (autoWorkToggling) return;
    setAutoWorkToggling(true);
    const prev = pomoSettings.autoStartWork;
    setPomoSettings((p) => ({ ...p, autoStartWork: value }));
    try {
      const next = { ...pomoSettings, autoStartWork: value };
      const data = await api.patch("/auth/me", { pomoSettings: next });
      const updated = data.user;
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
    } catch (err) {
      setPomoSettings((p) => ({ ...p, autoStartWork: prev }));
      showToast(err.message || "Failed to update auto-start work", "error");
    } finally {
      setTimeout(() => setAutoWorkToggling(false), 500);
    }
  }

  return {
    pomoSettings, setPomoSettings,
    pomoLoading, pomoSaving,
    autoBreakToggling, autoWorkToggling,
    onSave: handlePomoSave,
    onAutoBreakToggle: handleAutoBreakToggle,
    onAutoWorkToggle:  handleAutoWorkToggle,
  };
}
