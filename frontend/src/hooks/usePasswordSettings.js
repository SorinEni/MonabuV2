/**
 * usePasswordSettings
 * State and server interactions for the Password settings tab.
 * Handles both change-password (existing) and create-password (OAuth-only accounts).
 */

import { useState } from "react";
import { api, updateStoredUser } from "@api/api";

export function usePasswordSettings(setUser, showToast) {
  // Change password (for accounts that already have one)
  const [currentPw,   setCurrentPw]   = useState("");
  const [newPw,       setNewPw]       = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading,   setPwLoading]   = useState(false);
  const [pwSaving,    setPwSaving]    = useState(false);
  const [pwError,     setPwError]     = useState("");

  // Create password (for OAuth-only accounts)
  const [createPw,        setCreatePw]        = useState("");
  const [createConfirmPw, setCreateConfirmPw] = useState("");
  const [showCreatePw,    setShowCreatePw]    = useState(false);
  const [createPwLoading, setCreatePwLoading] = useState(false);
  const [createPwSaving,  setCreatePwSaving]  = useState(false);
  const [createPwError,   setCreatePwError]   = useState("");

  async function handlePasswordSave() {
    if (pwSaving) return;
    setPwError("");
    if (!currentPw || !newPw || !confirmPw) { setPwError("All fields are required."); return; }
    if (newPw !== confirmPw) { setPwError("New passwords don't match."); return; }
    if (newPw.length < 8) { setPwError("Password must be at least 8 characters."); return; }
    setPwSaving(true);
    setPwLoading(true);
    try {
      const data = await api.post("/auth/change-password", {
        currentPassword: currentPw,
        newPassword: newPw,
      });
      if (data.user) { updateStoredUser(data.user); setUser(data.user); }
      setCurrentPw(""); setNewPw(""); setConfirmPw("");
      showToast("Password changed successfully");
    } catch (err) {
      setPwError(err.message || "Failed to change password");
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwSaving(false), 500);
    }
  }

  async function handleCreatePassword() {
    if (createPwSaving) return;
    setCreatePwError("");
    if (!createPw || !createConfirmPw) { setCreatePwError("All fields are required."); return; }
    if (createPw !== createConfirmPw) { setCreatePwError("Passwords don't match."); return; }
    if (createPw.length < 8) { setCreatePwError("Password must be at least 8 characters."); return; }
    setCreatePwSaving(true);
    setCreatePwLoading(true);
    try {
      const data = await api.post("/auth/create-password", { password: createPw });
      updateStoredUser(data.user);
      setUser(data.user);
      setCreatePw(""); setCreateConfirmPw("");
      showToast("Password created successfully");
    } catch (err) {
      setCreatePwError(err.message || "Failed to create password");
    } finally {
      setCreatePwLoading(false);
      setTimeout(() => setCreatePwSaving(false), 500);
    }
  }

  return {
    currentPw, setCurrentPw,
    newPw, setNewPw,
    confirmPw, setConfirmPw,
    showCurrent, setShowCurrent,
    showNew, setShowNew,
    showConfirm, setShowConfirm,
    pwLoading, pwSaving, pwError,
    onPasswordSave: handlePasswordSave,
    createPw, setCreatePw,
    createConfirmPw, setCreateConfirmPw,
    showCreatePw, setShowCreatePw,
    createPwLoading, createPwSaving, createPwError,
    onCreatePassword: handleCreatePassword,
  };
}
