import { useState, useEffect } from "react";
import { api } from "@api/api";
import { dayRange } from "@components/sessions/utils";

export function useDayView(refreshKey, tagFilter) {
  const [offset, setOffset] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { date, from, to } = dayRange(offset);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ from, to, limit: "200" });
    if (tagFilter) params.set("tagId", tagFilter);
    api
      .get(`/sessions?${params.toString()}`)
      .then((res) => {
        if (!cancelled) setSessions(res.sessions);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [offset, from, to, refreshKey, tagFilter]);

  return { offset, setOffset, date, sessions, loading, error };
}
