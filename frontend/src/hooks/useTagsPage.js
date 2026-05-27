import { useState, useEffect, useCallback } from "react";
import { api, getUser } from "@api/api";

export function useTagsPage() {
  const [user, setUser] = useState(getUser());
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const handler = (e) => setUser(e.detail);
    window.addEventListener("userUpdated", handler);
    return () => window.removeEventListener("userUpdated", handler);
  }, []);

  const activeTagLimit = user?.planLimits?.activeTagLimit ?? 999;
  const isLimited = activeTagLimit < 900;

  const realTags = tags.filter((t) => t._id !== null);
  const userTags = realTags.filter((t) => !t.isDefault);
  const defaultTags = realTags.filter((t) => !!t.isDefault);

  const activeUserCount = userTags.filter((t) => t.status === "active").length;

  const fetchTags = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/tags?includeArchived=true&includeHidden=true");
      setTags(data.tags);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  function handleCreated(newTag) {
    setTags((prev) => [...prev, newTag]);
  }

  function handleUpdate(updated) {
    setTags((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
  }

  function handleDelete(id) {
    setTags((prev) => prev.filter((t) => t._id !== id));
  }

  function handleSubTagsChange(tagId, newSubTags) {
    setTags((prev) =>
      prev.map((t) =>
        t._id?.toString() === tagId?.toString() ? { ...t, subTags: newSubTags } : t,
      ),
    );
  }

  async function handleReorder(reordered, items) {
    setTags((prev) => {
      const others = prev.filter(
        (t) => t._id === null || !!t.isDefault || t.status !== "active",
      );
      return [...reordered, ...others];
    });
    try {
      await api.patch("/tags/reorder", { items });
    } catch {
      fetchTags();
    }
  }

  const q = search.trim().toLowerCase();

  const activeUserList = userTags.filter(
    (t) => t.status === "active" && (!q || t.name.toLowerCase().includes(q)),
  );
  const activeDefaultList = defaultTags.filter(
    (t) =>
      (t.status === "active" || t.status == null) &&
      (!q || t.name.toLowerCase().includes(q)),
  );

  return {
    user,
    tags,
    loading,
    error,
    search,
    setSearch,
    activeUserCount,
    activeTagLimit,
    isLimited,
    atLimit: isLimited && activeUserCount >= activeTagLimit,
    activeUserList,
    activeDefaultList,
    userTags,
    defaultTags,
    q,
    fetchTags,
    handleCreated,
    handleUpdate,
    handleDelete,
    handleSubTagsChange,
    handleReorder,
  };
}
