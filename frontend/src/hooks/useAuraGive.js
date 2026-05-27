import { useState, useEffect } from "react";
import { api } from "@api/api";
import { invalidateAuraCache } from "@utils/leaderboardCache";

export function useAuraGive(initialCount, auraToGive, onGive) {
  const [count, setCount] = useState(initialCount ?? 0);
  const [remaining, setRemaining] = useState(auraToGive ?? 0);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);

  useEffect(() => { setCount(initialCount ?? 0); }, [initialCount]);
  useEffect(() => { setRemaining(auraToGive ?? 0); }, [auraToGive]);

  const canGive = remaining > 0 && !busy;

  async function give(userId) {
    if (!canGive) return;
    setBusy(true);
    setCount((c) => c + 1);
    setRemaining((r) => r - 1);
    setBurst(true);
    try {
      const res = await api.post(`/aura/${userId}/give`);
      setRemaining(res.auraToGive ?? 0);
      setCount((c) => c - 1 + (res.pointsGiven ?? 1));
      onGive?.(userId, res.pointsGiven ?? 1, res.auraToGive ?? 0);
      invalidateAuraCache();
    } catch {
      setCount((c) => c - 1);
      setRemaining((r) => r + 1);
    } finally {
      setBusy(false);
      setTimeout(() => setBurst(false), 600);
    }
  }

  return { count, remaining, busy, burst, canGive, give };
}
