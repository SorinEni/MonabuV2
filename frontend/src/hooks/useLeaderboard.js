import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@api/api";
import { getCached, setCached } from "@utils/leaderboardCache";

export function useLeaderboard() {
  const [tab, setTab] = useState("study");
  const [period, setPeriod] = useState("week");
  const [offset, setOffset] = useState(0);

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [myRank, setMyRank] = useState(null);

  const [auraMap, setAuraMap] = useState({});
  const [auraToGive, setAuraToGive] = useState(0);
  const [myAuraReceived, setMyAuraReceived] = useState(0);

  const prevKey = useRef(null);

  useEffect(() => {
    api
      .get("/aura/me")
      .then((res) => {
        setAuraToGive(res.auraToGive ?? 0);
        setMyAuraReceived(res.auraReceived ?? 0);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const activePeriod = tab === "aura" ? "allTime" : period;
    const activeOffset = tab === "aura" ? 0 : offset;
    const cacheKey = `${tab}:${activePeriod}:${activeOffset}`;

    let cancelled = false;

    async function fetchData() {
      const cached = getCached(cacheKey);
      if (cached) {
        setData(cached.entries);
        setMyRank(cached.myRank ?? null);
        if (cached.auraMap) setAuraMap(cached.auraMap);
        setLoading(false);
        setError(null);
        return;
      }

      if (prevKey.current !== cacheKey) {
        setLoading(true);
        setError(null);
      }
      prevKey.current = cacheKey;

      try {
        if (tab === "aura") {
          const res = await api.get(`/leaderboard/aura?period=allTime`);
          if (cancelled) return;
          const entries = res.entries || [];
          setData(entries);
          setMyRank(res.myRank ?? null);
          setCached(cacheKey, { entries, myRank: res.myRank ?? null });
        } else {
          const res = await api.get(
            `/leaderboard?period=${activePeriod}&offset=${activeOffset}`,
          );
          if (cancelled) return;
          const entries = res.entries || [];
          setData(entries);
          setMyRank(res.myRank ?? null);

          let auraMapResult = {};
          if (entries.length > 0) {
            const results = await Promise.allSettled(
              entries.map((e) =>
                api.get(`/aura/${e.userId}`).then((r) => ({
                  userId: e.userId,
                  auraReceived: r.auraReceived ?? 0,
                })),
              ),
            );
            if (!cancelled) {
              results.forEach((r) => {
                if (r.status === "fulfilled")
                  auraMapResult[r.value.userId] = r.value.auraReceived;
              });
              setAuraMap(auraMapResult);
            }
          }

          setCached(cacheKey, {
            entries,
            myRank: res.myRank ?? null,
            auraMap: auraMapResult,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [tab, period, offset]);

  const handleAuraGive = useCallback((userId, pointsGiven, newAuraToGive) => {
    setAuraToGive(newAuraToGive);
    setAuraMap((prev) => ({
      ...prev,
      [userId]: (prev[userId] ?? 0) + pointsGiven,
    }));
    setData((prev) =>
      prev.map((e) =>
        e.userId === userId
          ? { ...e, auraReceived: (e.auraReceived ?? 0) + pointsGiven }
          : e,
      ),
    );
  }, []);

  const handleTabChange = useCallback((newTab) => {
    setTab(newTab);
    if (newTab === "study") setPeriod("week");
    setOffset(0);
  }, []);

  const maxSeconds = data[0]?.seconds ?? 0;
  const maxAura = data[0]?.auraReceived ?? 0;
  const restRows = data.slice(3);

  return {
    tab,
    setTab,
    period,
    setPeriod,
    offset,
    setOffset,
    data,
    loading,
    error,
    myRank,
    auraMap,
    auraToGive,
    myAuraReceived,
    handleAuraGive,
    handleTabChange,
    maxSeconds,
    maxAura,
    restRows,
  };
}
