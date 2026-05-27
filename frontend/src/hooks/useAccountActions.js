/**
 * useAccountActions
 * State and server interactions for the Account settings tab:
 *   - Log out all devices
 *   - Delete all session data
 *   - Delete account
 */

import { useState } from "react";
import { api, clearAuth } from "@api/api";

export function useAccountActions(showToast) {
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);

  const [showDeleteDataModal,    setShowDeleteDataModal]    = useState(false);
  const [deleteDataConfirmText,  setDeleteDataConfirmText]  = useState("");
  const [deleteDataLoading,      setDeleteDataLoading]      = useState(false);
  const [deleteDataError,        setDeleteDataError]        = useState("");

  const [showDeleteModal,  setShowDeleteModal]  = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading,    setDeleteLoading]    = useState(false);
  const [deleteError,      setDeleteError]      = useState("");

  async function handleLogoutAll() {
    setLogoutAllLoading(true);
    try {
      await api.post("/auth/logout-all");
      clearAuth();
      window.location.href = "/login";
    } catch (err) {
      showToast(err.message || "Failed to log out all devices", "error");
      setLogoutAllLoading(false);
    }
  }

  async function handleDeleteAllData() {
    setDeleteDataError("");
    if (deleteDataConfirmText !== "DELETE") {
      setDeleteDataError("Please type DELETE to confirm.");
      return;
    }
    setDeleteDataLoading(true);
    try {
      await api.post("/sessions/delete-all", { confirm: "DELETE" });
      showToast("All session data deleted successfully");
      setShowDeleteDataModal(false);
      setDeleteDataConfirmText("");
    } catch (err) {
      setDeleteDataError(err.message || "Failed to delete data");
    } finally {
      setDeleteDataLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleteError("");
    if (deleteConfirmText !== "DELETE") {
      setDeleteError("Please type DELETE to confirm.");
      return;
    }
    setDeleteLoading(true);
    try {
      await api.post("/auth/delete-account", { confirm: "DELETE" });
      clearAuth();
      window.location.href = "/login?deleted=1";
    } catch (err) {
      setDeleteError(err.message || "Failed to delete account");
      setDeleteLoading(false);
    }
  }

  function openDeleteData() {
    setDeleteDataConfirmText("");
    setDeleteDataError("");
    setShowDeleteDataModal(true);
  }

  function openDeleteAccount() {
    setDeleteConfirmText("");
    setDeleteError("");
    setShowDeleteModal(true);
  }

  return {
    logoutAllLoading,
    handleLogoutAll,
    showDeleteDataModal,
    deleteDataConfirmText, setDeleteDataConfirmText,
    deleteDataLoading,
    deleteDataError,
    handleDeleteAllData,
    openDeleteData,
    onCloseDeleteData: () => setShowDeleteDataModal(false),
    showDeleteModal,
    deleteConfirmText, setDeleteConfirmText,
    deleteLoading,
    deleteError,
    handleDeleteAccount,
    openDeleteAccount,
    onCloseDeleteAccount: () => setShowDeleteModal(false),
  };
}
