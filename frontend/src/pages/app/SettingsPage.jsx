// Settings page.
// Refactored: AppShell replaces manual Sidebar + theme setup.
// Toast is now the shared component instead of the private settings one.

import { useState, useEffect } from "react";
import { getUser, api, updateStoredUser } from "@api/api";
import AppShell from "@components/layout/AppShell";
import Toast from "@components/shared/Toast";

import ProfileTab from "@components/settings/ProfileTab";
import PasswordTab from "@components/settings/PasswordTab";
import PomodoroTab from "@components/settings/PomodoroTab";
import ImportTab from "@components/settings/ImportTab";
import AccountTab from "@components/settings/AccountTab";
import DeleteModals from "@components/settings/DeleteModals";

import { useProfileSettings } from "@hooks/useProfileSettings";
import { usePasswordSettings } from "@hooks/usePasswordSettings";
import { usePomodoroSettings } from "@hooks/usePomodoroSettings";
import { useAccountActions } from "@hooks/useAccountActions";

import "@styles/Settings.css";

const TABS = [
  { id: "profile",  label: "Profile" },
  { id: "password", label: "Password" },
  { id: "pomodoro", label: "Pomodoro" },
  { id: "import",   label: "Import / Export" },
  { id: "account",  label: "Account" },
];

export default function SettingsPage() {
  const [user, setUser]       = useState(getUser());
  const [activeTab, setActiveTab] = useState("profile");
  const [toast, setToast]     = useState(null);

  // Refresh user on mount so hasPassword and other fields are current
  useEffect(() => {
    api.get("/auth/me")
      .then((res) => {
        if (res?.user) {
          updateStoredUser(res.user);
          setUser(res.user);
        }
      })
      .catch(() => {});
  }, []);

  function showToast(message, type = "ok") {
    setToast({ message, type });
  }

  const profile  = useProfileSettings(user, setUser, showToast);
  const password = usePasswordSettings(setUser, showToast);
  const pomodoro = usePomodoroSettings(user, setUser, showToast);
  const account  = useAccountActions(showToast);

  return (
    <AppShell className="settings-root" userThemePreference={user?.themePreference}>
      <div className="settings-header">
        <h1 className="settings-header__title">Settings</h1>
        <p className="settings-header__sub">
          Manage your account, preferences, and productivity settings.
        </p>
        <div className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`settings-tab${activeTab === t.id ? " settings-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-body" key={activeTab}>
        {activeTab === "profile" && <ProfileTab {...profile} user={user} />}
        {activeTab === "password" && <PasswordTab {...password} hasPassword={user?.hasPassword} />}
        {activeTab === "pomodoro" && <PomodoroTab {...pomodoro} />}
        {activeTab === "import" && <ImportTab onToast={showToast} user={user} />}
        {activeTab === "account" && (
          <AccountTab
            {...account}
            user={user}
            hasPassword={user?.hasPassword}
            leaderboardPublic={profile.leaderboardPublic}
            setLeaderboardPublic={profile.setLeaderboardPublic}
          />
        )}
      </div>

      <DeleteModals {...account} />

      {toast && (
        <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />
      )}
    </AppShell>
  );
}
