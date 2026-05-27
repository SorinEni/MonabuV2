import { useState, useEffect, useCallback } from "react";
import { api, getUser } from "@api/api";

function periodToFromParam(p, maxDays) {
  if (p === "all") return "";
  const days = p === "7d" ? 7 : p === "30d" ? 30 : 90;
  const clampedDays = maxDays != null ? Math.min(days, maxDays) : days;
  if (clampedDays <= 0) return "";
  const from = new Date();
  from.setDate(from.getDate() - clampedDays);
  return `?from=${from.toISOString()}`;
}

export function useAnalytics() {
  const [user, setUser] = useState(getUser());
  const analyticsDays = user?.planLimits?.analyticsDays ?? null;
  const hasHeatmap = user?.planFeatures?.includes("heatmap") ?? false;

  useEffect(() => {
    const handler = (e) => setUser(e.detail);
    window.addEventListener("userUpdated", handler);
    return () => window.removeEventListener("userUpdated", handler);
  }, []);

  const [period, setPeriod] = useState("30d");
  const [overview, setOverview] = useState(null);
  const [byTag, setByTag] = useState(null);
  const [streaks, setStreaks] = useState(null);
  const [weekly, setWeekly] = useState(null);
  const [heatmap, setHeatmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [drawerDate, setDrawerDate] = useState(null);
  const [advanced, setAdvanced] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const fromQ = periodToFromParam(period, analyticsDays);

    const requests = [
      api.get("/analytics/overview"),
      api.get(`/analytics/by-tag${fromQ}`),
      api.get("/analytics/streaks"),
      api.get("/analytics/weekly?weeks=12"),
    ];

    if (hasHeatmap) {
      requests.push(
        api
          .get("/analytics/heatmap?days=365")
          .then((hm) => hm?.data ?? [])
          .catch(() => []),
      );
    }

    Promise.all(requests)
      .then(([ov, bt, st, wk, hm]) => {
        setOverview(ov);
        setByTag(bt?.data ?? []);
        setStreaks(st);
        setWeekly(wk?.data ?? []);
        setHeatmap(hasHeatmap ? hm : null);
      })
      .catch((err) => setError(err?.message ?? "Failed to load analytics."))
      .finally(() => setLoading(false));
  }, [period, analyticsDays, hasHeatmap]);

  const handleDayClick = useCallback((date) => setDrawerDate(date), []);
  const handleDrawerClose = useCallback(() => setDrawerDate(null), []);

  return {
    period,
    setPeriod,
    overview,
    byTag,
    streaks,
    weekly,
    heatmap,
    hasHeatmap,
    loading,
    error,
    drawerDate,
    advanced,
    setAdvanced,
    handleDayClick,
    handleDrawerClose,
  };
}
