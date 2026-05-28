import PasswordStrengthMeter from "../shared/PasswordStrengthMeter";

export default function PasswordTab({
  hasPassword,
  // Change password
  currentPw,
  setCurrentPw,
  newPw,
  setNewPw,
  confirmPw,
  setConfirmPw,
  showCurrent,
  setShowCurrent,
  showNew,
  setShowNew,
  showConfirm,
  setShowConfirm,
  pwLoading,
  pwSaving,
  pwError,
  onPasswordSave,
  // Create password
  createPw,
  setCreatePw,
  createConfirmPw,
  setCreateConfirmPw,
  showCreatePw,
  setShowCreatePw,
  createPwLoading,
  createPwSaving,
  createPwError,
  onCreatePassword,
}) {
  if (!hasPassword) {
    return (
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Create password</div>
          <div className="settings-section__desc">
            Your account uses Google sign-in. Add a password so you can also log
            in with email.
          </div>
        </div>
        <div className="settings-section__body">
          <div className="settings-field">
            <label className="settings-label" htmlFor="s-create-pw">
              New password
            </label>
            <div className="settings-pw-wrap">
              <input
                id="s-create-pw"
                className="settings-input"
                type={showCreatePw ? "text" : "password"}
                value={createPw}
                onChange={(e) => setCreatePw(e.target.value)}
                autoComplete="new-password"
              />
              <button
                type="button"
                className="settings-pw-toggle"
                onClick={() => setShowCreatePw((v) => !v)}>
                {showCreatePw ? "Hide" : "Show"}
              </button>
            </div>
            <PasswordStrengthMeter password={createPw} />
          </div>
          <div className="settings-field">
            <label className="settings-label" htmlFor="s-create-conf-pw">
              Confirm password
            </label>
            <input
              id="s-create-conf-pw"
              className="settings-input"
              type="password"
              value={createConfirmPw}
              onChange={(e) => setCreateConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
          </div>
          {createPwError && <p className="settings-error">{createPwError}</p>}
        </div>
        <div className="settings-submit-row">
          <button
            type="button"
            className={`settings-save-btn${createPwLoading ? " settings-save-btn--loading" : ""}`}
            onClick={onCreatePassword}
            disabled={createPwLoading || createPwSaving}>
            {createPwLoading ? (
              <>
                <span className="settings-spinner" /> Saving…
              </>
            ) : (
              "Create password"
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <div className="settings-section__title">Change password</div>
        <div className="settings-section__desc">
          Choose a strong password with at least 12 characters.
        </div>
      </div>
      <div className="settings-section__body">
        <div className="settings-field">
          <label className="settings-label" htmlFor="s-cur-pw">
            Current password
          </label>
          <div className="settings-pw-wrap">
            <input
              id="s-cur-pw"
              className="settings-input"
              type={showCurrent ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="settings-pw-toggle"
              onClick={() => setShowCurrent((v) => !v)}>
              {showCurrent ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        <div
          style={{ borderTop: "1px solid var(--border)", margin: "12px 0 4px" }}
        />
        <div className="settings-field">
          <label className="settings-label" htmlFor="s-new-pw">
            New password
          </label>
          <div className="settings-pw-wrap">
            <input
              id="s-new-pw"
              className="settings-input"
              type={showNew ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="settings-pw-toggle"
              onClick={() => setShowNew((v) => !v)}>
              {showNew ? "Hide" : "Show"}
            </button>
          </div>
          <PasswordStrengthMeter password={newPw} />
        </div>
        <div className="settings-field">
          <label className="settings-label" htmlFor="s-conf-pw">
            Confirm new password
          </label>
          <div className="settings-pw-wrap">
            <input
              id="s-conf-pw"
              className="settings-input"
              type={showConfirm ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="settings-pw-toggle"
              onClick={() => setShowConfirm((v) => !v)}>
              {showConfirm ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        {pwError && <p className="settings-error">{pwError}</p>}
      </div>
      <div className="settings-submit-row">
        <button
          type="button"
          className={`settings-save-btn${pwLoading ? " settings-save-btn--loading" : ""}`}
          onClick={onPasswordSave}
          disabled={pwLoading || pwSaving}>
          {pwLoading ? (
            <>
              <span className="settings-spinner" /> Saving…
            </>
          ) : (
            "Update password"
          )}
        </button>
      </div>
    </div>
  );
}
