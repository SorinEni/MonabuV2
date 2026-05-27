import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api, getUser } from "@api/api";
import { TABS } from "@components/admin";

export function useAdmin() {
  const navigate = useNavigate();
  const currentUser = getUser();

  const [activeTab, setActiveTab] = useState(TABS.USERS);

  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("");
  const [tableLoading, setTableLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [pendingRows, setPendingRows] = useState({});

  const [editTarget, setEditTarget] = useState(null);

  const searchTimeout = useRef(null);

  const isDev = currentUser?.isDeveloper;

  useEffect(() => {
    if (!currentUser?.isAdmin && !currentUser?.isDeveloper) {
      navigate("/tracker", { replace: true });
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    setStatsLoading(true);
    api
      .get("/admin/stats")
      .then((data) => setStats(data))
      .catch(() => setStats(null))
      .finally(() => setStatsLoading(false));
  }, []);

  const loadUsers = useCallback(() => {
    setTableLoading(true);
    const params = new URLSearchParams({ page, limit: 50 });
    if (search) params.set("search", search);
    if (planFilter) params.set("plan", planFilter);
    api
      .get(`/admin/users?${params}`)
      .then(({ users, total, pages }) => {
        setUsers(users);
        setTotal(total);
        setPages(pages);
      })
      .catch(() => {})
      .finally(() => setTableLoading(false));
  }, [page, search, planFilter]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  function handleSearch(e) {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      setSearch(e.target.value);
    }, 350);
  }

  function showToast(message, type = "success") {
    setToast({ message, type });
  }

  function setPending(id, val) {
    setPendingRows((p) => ({ ...p, [id]: val }));
  }

  async function updateUser(id, updates) {
    setPending(id, true);
    try {
      const { user } = await api.patch(`/admin/users/${id}`, updates);
      setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
      showToast("User updated");
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    } finally {
      setPending(id, false);
    }
  }

  function handleToggleActive(u) {
    if (u.isActive) {
      setConfirm({
        title: "Deactivate account?",
        body: `${u.email} will be unable to log in until reactivated.`,
        confirmLabel: "Deactivate",
        danger: true,
        onConfirm: () => {
          setConfirm(null);
          updateUser(u._id, { isActive: false });
        },
      });
    } else {
      updateUser(u._id, { isActive: true });
    }
  }

  async function handleEditSave(id, updates, devRoleGrant, directUserOverride) {
    if (directUserOverride) {
      setUsers((prev) => prev.map((u) => (u._id === id ? directUserOverride : u)));
      return;
    }

    setPending(id, true);
    try {
      const { isDeveloper: _ignored, ...rest } = updates;

      if (Object.keys(rest).length) {
        const { user } = await api.patch(`/admin/users/${id}`, rest);
        setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
      }

      if (devRoleGrant !== null && devRoleGrant !== undefined) {
        const { user } = await api.patch(`/admin/users/${id}/developer`, {
          isDeveloper: devRoleGrant,
        });
        setUsers((prev) => prev.map((u) => (u._id === id ? user : u)));
      }

      setEditTarget(null);
      showToast(
        rest.email && !isDev
          ? "Confirmation email sent — address will change once confirmed."
          : "User updated",
      );
    } catch (err) {
      throw err;
    } finally {
      setPending(id, false);
    }
  }

  return {
    currentUser,
    isDev,
    activeTab,
    setActiveTab,
    stats,
    statsLoading,
    users,
    total,
    pages,
    page,
    setPage,
    search,
    setSearch,
    planFilter,
    setPlanFilter,
    tableLoading,
    toast,
    setToast,
    confirm,
    setConfirm,
    pendingRows,
    setPendingRows,
    editTarget,
    setEditTarget,
    handleSearch,
    showToast,
    handleToggleActive,
    handleEditSave,
  };
}
