// Confirmation modal before permanently deleting a user tag.

import { useState } from "react";
import { api } from "@api/api";
import { CloseIcon } from "@components/shared/Icons";

export default function DeleteTagModal({ tag, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    setLoading(true);
    setError("");
    try {
      await api.delete(`/tags/${tag.id}`);
      onConfirm(tag.id);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <div className="modal__title">Delete Tag</div>
          <button className="modal__close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <div className="modal__form">
          {error && <div className="modal__error">{error}</div>}
          <p style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
            Are you sure you want to delete{" "}
            <strong style={{ color: tag.color }}>{tag.name}</strong>? This will
            permanently delete the tag, all its subtags, and all sessions
            associated with it.
          </p>
          <div className="modal__actions">
            <button
              type="button"
              className="timer-btn timer-btn--discard"
              onClick={onClose}
              disabled={loading}>
              Cancel
            </button>
            <button
              type="button"
              className="timer-btn"
              style={{
                flex: "none",
                padding: "9px 22px",
                background: "var(--color-error-dim)",
                color: "var(--color-error)",
                border: "1px solid var(--color-error-border)",
              }}
              onClick={handleDelete}
              disabled={loading}>
              {loading ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
