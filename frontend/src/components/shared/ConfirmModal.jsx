// Generic confirmation dialog with backdrop.
// Extracted from Admin.jsx where it was defined as a private component.
// Used by Admin, Settings (delete account/data), and any future destructive action.

/**
 * Props:
 *   title         string   Modal heading
 *   body          string   Explanatory text
 *   confirmLabel  string   Confirm button text
 *   danger        bool     Use danger styling on confirm button
 *   onConfirm     fn
 *   onCancel      fn
 */
export default function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  onConfirm,
  onCancel,
}) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}>
        <div id="modal-title" className="modal__title">
          {title}
        </div>
        <div className="modal__body">{body}</div>
        <div className="modal__actions">
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn--sm ${danger ? "btn--danger" : "btn--primary"}`}
            onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
