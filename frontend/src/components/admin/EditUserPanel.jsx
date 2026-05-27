import { useState } from "react";
import { api } from "@api/api";
import { TrashIcon } from "@components/shared/Icons";
import { resolveAvatarUrl, getUserInitials } from "@utils/avatar";
import { PillToggle } from "./PillToggle";
import { PlanChip } from "./PlanChip";
import { ImportSessionsPanel } from "./ImportSessionsPanel";
import { ALL_PLANS } from "./constants";

export function EditUserPanel({ targetUser, currentUser, currentUserIsDev, onSave, onCancel, showToast }) {
  const isSelf = targetUser._id === currentUser?._id;
  const isDev = currentUserIsDev;

  const [name, setName] = useState(targetUser.name || "");
  const [username, setUsername] = useState(targetUser.username || "");
  const [email, setEmail] = useState(targetUser.email || "");
  const [plan, setPlan] = useState(targetUser.plan || "free");
  const [isActive, setIsActive] = useState(targetUser.isActive ?? true);
  const [isAdmin, setIsAdmin] = useState(targetUser.isAdmin ?? false);
  const [isDeveloper, setIsDeveloper] = useState(targetUser.isDeveloper ?? false);
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deleteAvatarPending, setDeleteAvatarPending] = useState(false);

  const emailChanged = email.trim().toLowerCase() !== targetUser.email;

  const originalAvatar = targetUser.avatar || "";
  const isUploadedAvatar = originalAvatar && !originalAvatar.startsWith("http");
  const [avatarUrl, setAvatarUrl] = useState(
    originalAvatar.startsWith("http") ? originalAvatar : "",
  );
  const [avatarCleared, setAvatarCleared] = useState(false);

  const canToggleAdmin = isDev && !(isSelf && targetUser.isAdmin);
  const canToggleDev = isDev && !(isSelf && targetUser.isDeveloper);

  async function handleDeleteAvatar() {
    setDeleteAvatarPending(true);
    try {
      const { user } = await api.patch(`/admin/users/${targetUser._id}`, {
        avatar: null,
      });
      showToast("Avatar removed");
      setAvatarCleared(true);
      onSave({}, null, user);
    } catch (err) {
      showToast(err.message || "Failed to remove avatar", "error");
    } finally {
      setDeleteAvatarPending(false);
    }
  }

  async function handleSave() {
    setError("");
    const updates = {};

    const trimmedName = name.trim();
    if (trimmedName !== (targetUser.name || "")) updates.name = trimmedName;

    const trimmedUsername = username.trim().toLowerCase();
    if (trimmedUsername !== (targetUser.username || ""))
      updates.username = trimmedUsername;

    const trimmedEmail = email.trim().toLowerCase();
    if (trimmedEmail !== targetUser.email) updates.email = trimmedEmail;

    if (plan !== targetUser.plan) updates.plan = plan;

    if (!isSelf && isActive !== targetUser.isActive) updates.isActive = isActive;

    if (isDev && isAdmin !== (targetUser.isAdmin ?? false) && canToggleAdmin)
      updates.isAdmin = isAdmin;

    const devChanged =
      isDev &&
      isDeveloper !== (targetUser.isDeveloper ?? false) &&
      canToggleDev;

    if (!isUploadedAvatar && !avatarCleared) {
      const trimmedAvatar = avatarUrl.trim();
      if (trimmedAvatar !== originalAvatar) {
        updates.avatar = trimmedAvatar || null;
      }
    }

    if (isDev && password) {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      updates.password = password;
    }

    if (!Object.keys(updates).length && !devChanged) {
      onCancel();
      return;
    }

    setLoading(true);
    try {
      await onSave(updates, devChanged ? isDeveloper : null);
    } catch (err) {
      setError(err.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  }

  const currentAvatarUrl = resolveAvatarUrl(avatarCleared ? null : targetUser.avatar);

  return (
    <div className="edit-panel">
      <div className="edit-panel__header">
        <div className="edit-panel__title-row">
          <h2 className="edit-panel__title">
            Edit user
            {isSelf && (
              <span
                className="inline-role-badge inline-role-badge--self"
                style={{ fontSize: 10, verticalAlign: "middle", marginLeft: 8 }}>
                you
              </span>
            )}
          </h2>
          <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={loading}>
            ← Back to users
          </button>
        </div>
        <span style={{ color: "var(--text-faint)", fontSize: 12.5 }}>
          {targetUser.email}
        </span>
      </div>

      {error && <div className="edit-modal__error">{error}</div>}

      <div className="edit-panel__body">
        <div className="edit-panel__avatar-row">
          <div className="edit-panel__avatar-preview">
            {currentAvatarUrl ? (
              <img
                src={currentAvatarUrl}
                alt="Avatar"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  borderRadius: "inherit",
                  display: "block",
                }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span className="edit-panel__avatar-initials">
                {getUserInitials(targetUser)}
              </span>
            )}
          </div>
          <div className="edit-panel__avatar-info">
            <div
              className="edit-modal__label"
              style={{ marginBottom: 6, display: "flex", gap: 8 }}>
              Avatar
              {isUploadedAvatar && !avatarCleared && (
                <span className="edit-modal__badge edit-modal__badge--pending">
                  uploaded file
                </span>
              )}
            </div>
            {isUploadedAvatar && !avatarCleared ? (
              <>
                <p className="edit-modal__hint" style={{ margin: "0 0 10px" }}>
                  Custom uploaded file:{" "}
                  <code style={{ fontSize: 11, color: "var(--text-faint)" }}>
                    {originalAvatar}
                  </code>
                </p>
                <button
                  type="button"
                  className="action-btn action-btn--danger"
                  style={{ width: "auto", padding: "5px 14px" }}
                  disabled={deleteAvatarPending}
                  onClick={handleDeleteAvatar}>
                  <TrashIcon size={11} />
                  {deleteAvatarPending ? "Removing…" : "Delete avatar"}
                </button>
              </>
            ) : (
              <input
                className="edit-modal__input"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://… (leave blank to remove)"
              />
            )}
          </div>
        </div>

        <div className="edit-modal__section-label">Identity</div>

        <div className="edit-modal__row-2">
          <div className="edit-modal__field">
            <label className="edit-modal__label">Display name</label>
            <input
              className="edit-modal__input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display name"
            />
          </div>
          <div className="edit-modal__field">
            <label className="edit-modal__label">Username</label>
            <input
              className="edit-modal__input"
              type="text"
              value={username}
              onChange={(e) =>
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ""))
              }
              placeholder="username"
            />
          </div>
        </div>

        <div className="edit-modal__field">
          <label className="edit-modal__label">
            Email
            {emailChanged && !isDev && (
              <span className="edit-modal__badge edit-modal__badge--pending">
                pending confirmation
              </span>
            )}
            {emailChanged && isDev && (
              <span className="edit-modal__badge edit-modal__badge--immediate">
                applied immediately
              </span>
            )}
          </label>
          <input
            className="edit-modal__input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
          />
          {emailChanged && !isDev && (
            <p className="edit-modal__hint">
              The user will receive a confirmation email before the address is changed.
            </p>
          )}
        </div>

        <div className="edit-modal__section-label">Plan</div>
        <div className="edit-modal__field">
          <div className="pill-toggle-group">
            {ALL_PLANS.map((p) => (
              <PillToggle key={p} active={plan === p} onClick={() => setPlan(p)} variant="plan">
                <PlanChip plan={p} />
              </PillToggle>
            ))}
          </div>
        </div>

        {!isSelf && (
          <>
            <div className="edit-modal__section-label">Status</div>
            <div className="edit-modal__field">
              <div className="pill-toggle-group">
                <PillToggle active={isActive} onClick={() => setIsActive(true)} variant="success">
                  Active
                </PillToggle>
                <PillToggle active={!isActive} onClick={() => setIsActive(false)} variant="danger">
                  Inactive (banned)
                </PillToggle>
              </div>
            </div>
          </>
        )}

        {isDev && (
          <>
            <div className="edit-modal__section-label">
              Roles
              <span className="edit-modal__badge edit-modal__badge--dev" style={{ marginLeft: 8 }}>
                developer only
              </span>
            </div>
            <div className="edit-modal__field">
              <div className="pill-toggle-group">
                <PillToggle
                  active={isAdmin}
                  onClick={() => canToggleAdmin && setIsAdmin((v) => !v)}
                  disabled={!canToggleAdmin}
                  variant="admin"
                  title={!canToggleAdmin ? "Cannot remove your own Admin role" : undefined}>
                  Admin
                  {!canToggleAdmin && (
                    <span style={{ fontSize: 9, marginLeft: 5, opacity: 0.6 }}>locked</span>
                  )}
                </PillToggle>
                <PillToggle
                  active={isDeveloper}
                  onClick={() => canToggleDev && setIsDeveloper((v) => !v)}
                  disabled={!canToggleDev}
                  variant="dev"
                  title={!canToggleDev ? "Cannot remove your own Developer role" : undefined}>
                  Developer
                  {!canToggleDev && (
                    <span style={{ fontSize: 9, marginLeft: 5, opacity: 0.6 }}>locked</span>
                  )}
                </PillToggle>
              </div>
            </div>
          </>
        )}

        {isDev && (
          <>
            <div className="edit-modal__section-label">
              Security
              <span className="edit-modal__badge edit-modal__badge--dev" style={{ marginLeft: 8 }}>
                developer only
              </span>
            </div>
            <div className="edit-modal__field">
              <label className="edit-modal__label">New password</label>
              <div className="edit-modal__input-wrap">
                <input
                  className="edit-modal__input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
                <button
                  type="button"
                  className="edit-modal__eye"
                  onClick={() => setShowPass((v) => !v)}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </>
        )}

        <div className="admin__modal-actions" style={{ marginTop: 24 }}>
          <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : "Save changes"}
          </button>
        </div>

        {!isSelf && (
          <>
            <div
              style={{
                height: 1,
                background: "var(--border)",
                margin: "28px 0 24px",
              }}
            />
            <ImportSessionsPanel targetUser={targetUser} showToast={showToast} />
          </>
        )}
      </div>
    </div>
  );
}
