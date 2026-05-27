import { useRef, useState, useEffect } from "react";
import TimezoneCombobox from "./TimezoneCombobox";
import LanguageSelect from "./LanguageSelect";
import { GOALS } from "@constants/goals";

const GOALS_WITH_NONE = (() => {
  const hasNone = GOALS.some((g) => g.value === "none");
  if (hasNone) return GOALS;
  return [{ value: "none", icon: "—", label: "No goal" }, ...GOALS];
})();

function getInitials(user) {
  return (user?.name || user?.username || user?.email || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getNameCooldownInfo(user) {
  if (!user?.nameLastChangedAt) return { locked: false, daysLeft: 0 };
  const last = new Date(user.nameLastChangedAt);
  const nextAllowed = new Date(last);
  nextAllowed.setMonth(nextAllowed.getMonth() + 1);
  const now = new Date();
  if (now >= nextAllowed) return { locked: false, daysLeft: 0 };
  const daysLeft = Math.ceil((nextAllowed - now) / (1000 * 60 * 60 * 24));
  return { locked: true, daysLeft };
}

export default function ProfileTab({
  user,
  avatarPreview,
  onAvatarChange,
  onRemoveAvatar,
  avatarInputRef,
  name,
  setName,
  username,
  setUsername,
  usernameError,
  setUsernameError,
  timezone,
  setTimezone,
  language,
  setLanguage,
  goal,
  setGoal,
  weeklyHours,
  setWeeklyHours,
  profileLoading,
  onSave,
}) {
  const nameCooldown = getNameCooldownInfo(user);
  const [imgError, setImgError] = useState(false);
  useEffect(() => setImgError(false), [avatarPreview]);

  return (
    <>
      {/* Avatar */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Profile picture</div>
          <div className="settings-section__desc">
            Upload a photo or we'll use your initials.
          </div>
        </div>
        <div className="settings-section__body">
          <div className="settings-avatar-row">
            <div className="settings-avatar">
              {avatarPreview && !imgError ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  onError={() => setImgError(true)}
                />
              ) : (
                getInitials(user)
              )}
              <div
                className="settings-avatar__overlay"
                onClick={() => avatarInputRef.current?.click()}>
                <span className="settings-avatar__overlay-icon">📷</span>
              </div>
            </div>
            <div className="settings-avatar__actions">
              <div className="settings-avatar__name">
                {user?.name || user?.username || "Your name"}
              </div>
              <div className="settings-avatar__meta">
                {user?.email}
                {user?.isVerified && (
                  <span
                    className="settings-badge settings-badge--verified"
                    style={{ marginLeft: 8 }}>
                    Verified
                  </span>
                )}
              </div>
              <div className="settings-btn-row">
                <button
                  type="button"
                  className="settings-btn settings-btn--ghost"
                  onClick={() => avatarInputRef.current?.click()}>
                  Upload photo
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    className="settings-btn settings-btn--danger"
                    onClick={onRemoveAvatar}>
                    Remove
                  </button>
                )}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: "var(--text-faint)",
                  marginTop: 6,
                }}>
                JPEG, PNG, WebP or AVIF · max 8 MB
                {user?.planFeatures?.includes("gif_avatar")
                  ? " · GIF supported"
                  : " · GIF requires Pro"}
              </div>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                style={{ display: "none" }}
                onChange={onAvatarChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Identity */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Identity</div>
          <div className="settings-section__desc">
            Your display name and unique username.
          </div>
        </div>
        <div className="settings-section__body">
          <div className="settings-field">
            <label className="settings-label" htmlFor="s-name">
              Display name
              {nameCooldown.locked ? (
                <span
                  className="settings-label-hint"
                  style={{ color: "var(--color-warning)" }}>
                  {" "}
                  · can be changed in {nameCooldown.daysLeft} day
                  {nameCooldown.daysLeft !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className="settings-label-hint">
                  {" "}
                  · can be changed once a month
                </span>
              )}
            </label>
            <input
              id="s-name"
              className="settings-input"
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={nameCooldown.locked}
              style={
                nameCooldown.locked
                  ? { opacity: 0.5, cursor: "not-allowed" }
                  : undefined
              }
            />
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="s-username">
              Username
              {user?.tempUsername ? (
                <span className="settings-label-hint">
                  {" "}
                  · set once, becomes permanent
                </span>
              ) : (
                <span className="settings-label-hint">
                  {" "}
                  · permanent, cannot be changed
                </span>
              )}
            </label>
            {user?.tempUsername ? (
              <>
                <div className="settings-pw-wrap">
                  <span
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "var(--text-faint)",
                      pointerEvents: "none",
                      fontSize: 14,
                    }}>
                    @
                  </span>
                  <input
                    id="s-username"
                    className="settings-input"
                    style={{ paddingLeft: 28 }}
                    type="text"
                    placeholder="choose a username"
                    value={username}
                    onChange={(e) => {
                      setUsername(
                        e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9_.-]/g, ""),
                      );
                      setUsernameError("");
                    }}
                  />
                </div>
                {usernameError && (
                  <p
                    style={{
                      color: "var(--color-error)",
                      fontSize: 12,
                      marginTop: 4,
                    }}>
                    {usernameError}
                  </p>
                )}
              </>
            ) : (
              <div
                className="settings-input settings-input--readonly"
                id="s-username">
                <span style={{ color: "var(--text-faint)" }}>@</span>
                {user?.username || (
                  <span style={{ color: "var(--text-faint)" }}>not set</span>
                )}
              </div>
            )}
          </div>

          <div className="settings-field">
            <label className="settings-label" htmlFor="s-tz">
              Timezone
            </label>
            <TimezoneCombobox value={timezone} onChange={setTimezone} />
          </div>

          <div className="settings-field">
            <label className="settings-label">
              Language
            </label>
            <LanguageSelect value={language} onChange={setLanguage} />
            <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 4 }}>
              Affects default tag names and app language
            </div>
          </div>
        </div>
      </div>

      {/* Goals */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Learning goal</div>
          <div className="settings-section__desc">
            Helps us tailor insights and analytics to your focus area.
          </div>
        </div>
        <div className="settings-section__body">
          <div className="settings-goal-grid">
            {GOALS_WITH_NONE.map((g) => (
              <button
                key={g.value}
                type="button"
                className={`settings-goal-card${goal === g.value ? " settings-goal-card--selected" : ""}`}
                onClick={() => setGoal(g.value)}>
                <span className="settings-goal-icon">{g.icon}</span>
                {g.label}
              </button>
            ))}
          </div>

          <div className="settings-field" style={{ marginTop: 4 }}>
            <label className="settings-label">Weekly hour goal</label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div className="settings-hours-control">
                <button
                  type="button"
                  className="settings-hours-btn"
                  onClick={() => setWeeklyHours((v) => Math.max(1, v - 1))}
                  disabled={weeklyHours <= 1}>
                  −
                </button>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="settings-hours-input"
                  value={weeklyHours}
                  onChange={(e) => {
                    const v = e.target.value.replace(/[^0-9]/g, "");
                    if (v === "") return;
                    setWeeklyHours(Math.min(80, Math.max(1, parseInt(v, 10))));
                  }}
                  onBlur={(e) => {
                    const n = parseInt(e.target.value, 10);
                    setWeeklyHours(
                      isNaN(n) ? 10 : Math.min(80, Math.max(1, n)),
                    );
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.currentTarget.blur();
                  }}
                />
                <span className="settings-hours-unit"> hrs</span>
                <button
                  type="button"
                  className="settings-hours-btn"
                  onClick={() => setWeeklyHours((v) => Math.min(80, v + 1))}
                  disabled={weeklyHours >= 80}>
                  +
                </button>
              </div>
              <span style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
                per week
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="settings-submit-row">
        <button
          type="button"
          className={`settings-save-btn${profileLoading ? " settings-save-btn--loading" : ""}`}
          onClick={onSave}
          disabled={profileLoading}>
          {profileLoading ? (
            <>
              <span className="settings-spinner" /> Saving…
            </>
          ) : (
            "Save profile"
          )}
        </button>
      </div>
    </>
  );
}
