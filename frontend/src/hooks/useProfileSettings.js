// Moved from @components/settings/hooks/useProfileSettings.js to @hooks/.
// Import path for avatarUtils updated: compressImage stays in @utils/avatar
// (resolveAvatarUrl already lives there; compressImage added alongside it).

import { useState, useRef, useEffect } from "react";
import { api, updateStoredUser } from "@api/api";
import { resolveAvatarUrl, compressImage } from "@utils/avatar";

export function useProfileSettings(user, setUser, showToast) {
  const avatarInputRef = useRef(null);
  const [avatarPreview, setAvatarPreview] = useState(resolveAvatarUrl(user?.avatar));
  const [avatarFile, setAvatarFile] = useState(null);

  const [name, setName]                         = useState(user?.name || "");
  const [username, setUsername]                 = useState(user?.username || "");
  const [usernameError, setUsernameError]       = useState("");
  const [timezone, setTimezone]                 = useState(user?.timezone || "UTC");
  const [goal, setGoal]                         = useState(user?.primaryGoal || "none");
  const [weeklyHours, setWeeklyHours]           = useState(user?.weeklyHourGoal || 10);
  const [leaderboardPublic, setLeaderboardPublic] = useState(user?.leaderboardPublic ?? true);
  const [language, setLanguage]                   = useState(user?.language || "en");
  const [profileLoading, setProfileLoading]     = useState(false);

  useEffect(() => {
    if (!user) return;
    setName(user.name || "");
    setUsername(user.username || "");
    setTimezone(user.timezone || "UTC");
    setGoal(user.primaryGoal || "none");
    setWeeklyHours(user.weeklyHourGoal || 10);
    setLeaderboardPublic(user.leaderboardPublic ?? true);
    setLanguage(user.language || "en");
    setAvatarPreview(resolveAvatarUrl(user.avatar));
  }, [user]);

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast("Error 69: That's not fitting in no matter how hard you push. 8 MB max.", "error");
      return;
    }
    try {
      const isGif = file.type === "image/gif";
      if (isGif && !user?.planFeatures?.includes("gif_avatar")) {
        showToast("Animated GIFs are a Pro feature — upgrade to use them", "error");
        e.target.value = "";
        return;
      }
      if (!isGif && file.size > 5 * 1024 * 1024) {
        showToast("Error 69: I swear this never happens.. but it's just too big, I can't handle it, 5 MB max.", "error");
        return;
      }
      if (isGif) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(file);
      } else {
        const compressed = await compressImage(file);
        setAvatarFile(compressed);
        const reader = new FileReader();
        reader.onload = (ev) => setAvatarPreview(ev.target.result);
        reader.readAsDataURL(compressed);
      }
    } catch {
      showToast("Failed to process image", "error");
    }
  }

  function handleRemoveAvatar() {
    setAvatarPreview(null);
    setAvatarFile(null);
  }

  async function handleProfileSave() {
    setProfileLoading(true);
    try {
      let newAvatarUrl = null;

      if (avatarFile) {
        const form = new FormData();
        const isGif = avatarFile.type === "image/gif";
        form.append("avatar", avatarFile, isGif ? "avatar.gif" : "avatar.jpg");
        const token = localStorage.getItem("token");
        const BASE = import.meta.env.VITE_API_URL || "/api";
        const res = await fetch(`${BASE}/auth/me/avatar`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        const data = await res.json();
        if (!res.ok) throw new Error("Avatar upload failed. We appreciate the impressive size, but it's stretching our limits.");
        newAvatarUrl = data.avatar;
        updateStoredUser(data.user);
        setAvatarPreview(resolveAvatarUrl(newAvatarUrl));
        setAvatarFile(null);
      }

      if (user?.tempUsername && username && username !== user?.username) {
        const cleaned = username.trim().toLowerCase();
        if (cleaned.length < 2 || cleaned.length > 32) {
          setUsernameError("Username must be between 2 and 32 characters.");
          setProfileLoading(false);
          return;
        }
        if (!/^[a-z0-9_.-]+$/.test(cleaned)) {
          setUsernameError("Only letters, numbers, and . _ - are allowed.");
          setProfileLoading(false);
          return;
        }
        setUsernameError("");
      }

      const nameCooldownLocked = (() => {
        if (!user?.nameLastChangedAt) return false;
        const next = new Date(user.nameLastChangedAt);
        next.setMonth(next.getMonth() + 1);
        return new Date() < next;
      })();

      const payload = {
        timezone,
        primaryGoal: goal,
        weeklyHourGoal: weeklyHours,
        leaderboardPublic,
        language,
      };
      if (!nameCooldownLocked) payload.name = name;
      if (user?.tempUsername && username && username !== user?.username) payload.username = username;
      if (!avatarPreview && !newAvatarUrl && user?.avatar) payload.avatar = null;

      const data = await api.patch("/auth/me", payload);
      const updated = data.user;
      updateStoredUser(updated);
      setUser(updated);
      setUsername(updated.username || "");
      setAvatarPreview(resolveAvatarUrl(updated.avatar));
      setLanguage(updated.language || "en");
      showToast("Profile updated");
    } catch (err) {
      showToast(err.message || "Failed to save profile", "error");
    } finally {
      setProfileLoading(false);
    }
  }

  return {
    avatarInputRef,
    avatarPreview,
    avatarFile,
    name, setName,
    username, setUsername,
    usernameError, setUsernameError,
    timezone, setTimezone,
    goal, setGoal,
    weeklyHours, setWeeklyHours,
    leaderboardPublic, setLeaderboardPublic,
    language, setLanguage,
    profileLoading,
    onAvatarChange: handleAvatarChange,
    onRemoveAvatar: handleRemoveAvatar,
    onSave: handleProfileSave,
  };
}
