export default function DeleteModals({
  // Delete all data
  showDeleteDataModal,
  deleteDataConfirmText,
  setDeleteDataConfirmText,
  deleteDataLoading,
  deleteDataError,
  onDeleteAllData,
  onCloseDeleteData,
  // Delete account
  showDeleteModal,
  deleteConfirmText,
  setDeleteConfirmText,
  deleteLoading,
  deleteError,
  onDeleteAccount,
  onCloseDeleteAccount,
}) {
  return (
    <>
      {showDeleteDataModal && (
        <div
          className="settings-modal-backdrop"
          onClick={() => !deleteDataLoading && onCloseDeleteData()}>
          <div
            className="settings-modal settings-modal--data"
            onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal__icon">🗑️</div>
            <div className="settings-modal__title">
              Delete all session data?
            </div>
            <p className="settings-modal__body">
              This will <strong>permanently delete</strong> all of your:
            </p>
            <ul className="settings-modal__list">
              <li>📅 Session history (all tracked time)</li>
              <li>🏷️ Tags and categories</li>
              <li>📊 Analytics and streaks</li>
            </ul>
            <p className="settings-modal__body" style={{ marginTop: 8 }}>
              Your <strong>account, settings, and plan</strong> will be
              preserved. This action <strong>cannot be undone</strong>.
            </p>
            <p className="settings-modal__body" style={{ marginTop: 8 }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              className="settings-input"
              type="text"
              value={deleteDataConfirmText}
              onChange={(e) => {
                setDeleteDataConfirmText(e.target.value);
              }}
              placeholder="DELETE"
              autoFocus
              disabled={deleteDataLoading}
            />
            {deleteDataError && (
              <p className="settings-error" style={{ marginTop: 8 }}>
                {deleteDataError}
              </p>
            )}
            <div className="settings-modal__actions">
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={onCloseDeleteData}
                disabled={deleteDataLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={onDeleteAllData}
                disabled={
                  deleteDataLoading || deleteDataConfirmText !== "DELETE"
                }>
                {deleteDataLoading ? (
                  <>
                    <span className="settings-spinner" /> Deleting…
                  </>
                ) : (
                  "Delete all data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div
          className="settings-modal-backdrop"
          onClick={() => !deleteLoading && onCloseDeleteAccount()}>
          <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="settings-modal__icon">⚠️</div>
            <div className="settings-modal__title">Delete your account?</div>
            <p className="settings-modal__body">
              Your account will be <strong>deactivated immediately</strong> and
              permanently deleted after <strong>30 days</strong>. This cannot be
              undone.
            </p>
            <p className="settings-modal__body" style={{ marginTop: 8 }}>
              Type <strong>DELETE</strong> to confirm:
            </p>
            <input
              className="settings-input"
              type="text"
              value={deleteConfirmText}
              onChange={(e) => {
                setDeleteConfirmText(e.target.value);
              }}
              placeholder="DELETE"
              autoFocus
              disabled={deleteLoading}
            />
            {deleteError && (
              <p className="settings-error" style={{ marginTop: 8 }}>
                {deleteError}
              </p>
            )}
            <div className="settings-modal__actions">
              <button
                type="button"
                className="settings-btn settings-btn--ghost"
                onClick={onCloseDeleteAccount}
                disabled={deleteLoading}>
                Cancel
              </button>
              <button
                type="button"
                className="settings-btn settings-btn--danger"
                onClick={onDeleteAccount}
                disabled={deleteLoading || deleteConfirmText !== "DELETE"}>
                {deleteLoading ? (
                  <>
                    <span className="settings-spinner" /> Deleting…
                  </>
                ) : (
                  "Delete my account"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
