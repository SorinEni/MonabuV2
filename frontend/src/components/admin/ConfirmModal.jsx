export function ConfirmModal({ title, body, confirmLabel, danger, onConfirm, onCancel }) {
  return (
    <div className="admin__overlay" onClick={onCancel}>
      <div className="admin__modal" onClick={(e) => e.stopPropagation()}>
        <div className="admin__modal-title">{title}</div>
        <div className="admin__modal-body">{body}</div>
        <div className="admin__modal-actions">
          <button className="btn btn--ghost btn--sm" onClick={onCancel}>
            Cancel
          </button>
          <button
            className={`btn btn--sm ${danger ? "btn--danger-solid" : "btn--primary"}`}
            style={
              danger
                ? {
                    background: "var(--color-error-dim)",
                    color: "var(--color-error)",
                    border: "1px solid var(--color-error-border)",
                  }
                : {}
            }
            onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
