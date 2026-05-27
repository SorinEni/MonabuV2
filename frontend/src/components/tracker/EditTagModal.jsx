// Modal for editing a user tag's name and color.

import { useState } from "react";
import { api } from "@api/api";
import { TAG_COLORS } from "@constants/tagColors";
import { CloseIcon } from "@components/shared/Icons";

export default function EditTagModal({ tag, onClose, onSave }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.patch(`/tags/${tag.id}`, { name: name.trim(), color });
      onSave({ ...tag, name: name.trim(), color });
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
          <div className="modal__title">Edit Tag</div>
          <button className="modal__close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          {error && <div className="modal__error">{error}</div>}
          <div className="modal__field">
            <label className="modal__label">Tag name</label>
            <input
              className="modal__input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="modal__field">
            <label className="modal__label">Color</label>
            <div className="modal__colors">
              {TAG_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={`modal__color-btn${color === c ? " modal__color-btn--active" : ""}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
          </div>
          <div className="modal__actions">
            <button
              type="button"
              className="timer-btn timer-btn--discard"
              onClick={onClose}
              disabled={loading}>
              Cancel
            </button>
            <button
              type="submit"
              className="timer-btn timer-btn--start"
              style={{ flex: "none", padding: "9px 22px" }}
              disabled={loading}>
              {loading ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
