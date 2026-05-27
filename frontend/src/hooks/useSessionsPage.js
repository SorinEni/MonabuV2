import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@api/api";
import { groupByPeriod } from "@components/sessions/utils";

const PAGE_SIZE = 50;

export function useSessionsPage() {
  const [view, setView] = useState("all");
  const [sessions, setSessions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fetchKey, setFetchKey] = useState(0);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [dayRefreshKey, setDayRefreshKey] = useState(0);
  const searchTimer = useRef(null);

  const [allTags, setAllTags] = useState([]);
  const [tagFilter, setTagFilter] = useState("");
  const [groupMode, setGroupMode] = useState("day");

  useEffect(() => {
    api
      .get("/tags")
      .then((res) => {
        const arr = Array.isArray(res) ? res : res?.tags || [];
        setAllTags(arr);
      })
      .catch(() => setAllTags([]));
  }, []);

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
      setSessions([]);
      setFetchKey((k) => k + 1);
    }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  useEffect(() => {
    if (view !== "all") return;
    let cancelled = false;
    const isFirstPage = page === 1;
    if (isFirstPage) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
    });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (tagFilter) params.set("tagId", tagFilter);

    api
      .get(`/sessions?${params.toString()}`)
      .then((res) => {
        if (cancelled) return;
        setSessions((prev) => (isFirstPage ? res.sessions : [...prev, ...res.sessions]));
        setTotal(res.total);
        setError(null);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setLoadingMore(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [view, page, debouncedSearch, fetchKey, tagFilter]);

  useEffect(() => {
    if (view === "all") {
      setSessions([]);
      setPage(1);
      setFetchKey((k) => k + 1);
    }
  }, [view]);

  const handleEdit = useCallback((s) => setEditTarget(s), []);
  const handleDelete = useCallback((s) => setDeleteTarget(s), []);

  function handleSaved(updated) {
    setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditTarget(null);
  }
  function handleDeleted(id) {
    setSessions((prev) => prev.filter((s) => s._id !== id));
    setTotal((t) => t - 1);
    setDeleteTarget(null);
  }
  function handleCreated(s) {
    setSessions((prev) => [s, ...prev]);
    setTotal((t) => t + 1);
    setDayRefreshKey((k) => k + 1);
    setAddOpen(false);
  }

  function handleTagFilterChange(id) {
    setTagFilter(id);
    setPage(1);
    setSessions([]);
    setFetchKey((k) => k + 1);
  }

  const groups = groupByPeriod(groupMode, sessions);
  const hasMore = sessions.length < total;

  return {
    view,
    setView,
    sessions,
    total,
    page,
    setPage,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    debouncedSearch,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    addOpen,
    setAddOpen,
    dayRefreshKey,
    allTags,
    tagFilter,
    handleTagFilterChange,
    groupMode,
    setGroupMode,
    groups,
    hasMore,
    handleEdit,
    handleDelete,
    handleSaved,
    handleDeleted,
    handleCreated,
  };
}
