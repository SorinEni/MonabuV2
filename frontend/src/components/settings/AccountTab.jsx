import Toggle from "./Toggle";

export default function AccountTab({
  user,
  hasPassword,
  leaderboardPublic,
  setLeaderboardPublic,
  logoutAllLoading,
  onLogoutAll,
  onOpenDeleteData,
  onOpenDeleteAccount,
}) {
  return (
    <>
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Account details</div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Email</div>
              <div className="settings-row__desc">{user?.email}</div>
            </div>
            <div className="settings-row__right">
              {user?.isVerified ? (
                <span className="settings-badge settings-badge--verified">
                  Verified
                </span>
              ) : (
                <span
                  className="settings-badge"
                  style={{
                    background: "var(--color-warning-dim)",
                    border: "1px solid var(--color-warning-border)",
                    color: "var(--color-warning)",
                  }}>
                  Unverified
                </span>
              )}
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Plan</div>
              <div className="settings-row__desc">
                Your current subscription tier.
              </div>
            </div>
            <div className="settings-row__right">
              <span className="settings-badge settings-badge--plan">
                {user?.plan ?? "free"}
              </span>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Sign-in method</div>
              <div className="settings-row__desc">
                {hasPassword && user?.googleId
                  ? "Google OAuth + email/password"
                  : user?.googleId
                    ? "Google OAuth"
                    : "Email & password"}
              </div>
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Member since</div>
              <div className="settings-row__desc">
                {user?.createdAt
                  ? new Date(user.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "—"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Leaderboard</div>
          <div className="settings-section__desc">
            Control whether your stats appear on public leaderboards visible to
            other users.
          </div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          <div className="settings-row" style={{ paddingTop: 0 }}>
            <div className="settings-row__left">
              <div className="settings-row__label">
                Participate in leaderboard
              </div>
              <div className="settings-row__desc">
                When enabled, your display name and session stats are visible to
                other users on the leaderboard. Disable to be excluded entirely.
              </div>
            </div>
            <div className="settings-row__right">
              <Toggle
                id="leaderboard-public"
                checked={leaderboardPublic}
                onChange={setLeaderboardPublic}
              />
            </div>
          </div>
          {!leaderboardPublic && (
            <div className="settings-leaderboard-notice">
              🔒 Your profile is hidden from leaderboards. Your stats are still
              tracked.
            </div>
          )}
        </div>
      </div>

      <div className="settings-section settings-danger">
        <div className="settings-section__header">
          <div className="settings-section__title">Danger zone</div>
          <div className="settings-section__desc">
            These actions are irreversible. Please be certain.
          </div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Log out everywhere</div>
              <div className="settings-row__desc">
                Invalidate all active sessions on all devices.
              </div>
            </div>
            <div className="settings-row__right">
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={onLogoutAll}
                disabled={logoutAllLoading}>
                {logoutAllLoading ? (
                  <>
                    <span className="settings-spinner" /> Working…
                  </>
                ) : (
                  "Log out all"
                )}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Delete all session data</div>
              <div className="settings-row__desc">
                Permanently deletes all your sessions, tags, and tracked
                history. Your account and settings are kept intact.
              </div>
            </div>
            <div className="settings-row__right">
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={onOpenDeleteData}>
                Delete all data
              </button>
            </div>
          </div>

          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Delete account</div>
              <div className="settings-row__desc">
                Deactivates your account immediately. All data is permanently
                deleted after 30 days.
              </div>
            </div>
            <div className="settings-row__right">
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={onOpenDeleteAccount}>
                Delete account
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
