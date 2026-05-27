import { useState } from "react";
import { api } from "@api/api";

export function DefaultTagModal({ tag, onSave, onCancel }) {
  const isEdit = !!tag;
  const [key, setKey] = useState(tag?.key || "");
  const [labelEn, setLabelEn] = useState(tag?.labelEn || "");
  const [color, setColor] = useState(tag?.color || "#93c5fd");
  const [order, setOrder] = useState(tag?.order ?? 0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setError("");
    if (!isEdit && !key.trim()) {
      setError("Key is required");
      return;
    }
    if (!labelEn.trim()) {
      setError("English label is required");
      return;
    }
    setLoading(true);
    try {
      await onSave({
        key: key.trim(),
        labelEn: labelEn.trim(),
        color,
        order: Number(order),
      });
    } catch (err) {
      setError(err.message || "Save failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin__overlay" onClick={onCancel}>
      <div
        className="admin__modal"
        style={{ maxWidth: 440 }}
        onClick={(e) => e.stopPropagation()}>
        <div className="admin__modal-title">{isEdit ? "Edit default tag" : "New default tag"}</div>

        {error && (
          <div className="edit-modal__error" style={{ marginBottom: 16 }}>
            {error}
          </div>
        )}

        {!isEdit ? (
          <div className="edit-modal__field">
            <label className="edit-modal__label">
              Key
              <span className="edit-modal__badge edit-modal__badge--dev">
                lowercase, a-z 0-9 _ -
              </span>
            </label>
            <input
              className="edit-modal__input"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
              placeholder="e.g. chemistry"
            />
          </div>
        ) : (
          <div className="edit-modal__field">
            <label className="edit-modal__label">Key</label>
            <div
              style={{
                padding: "8px 12px",
                background: "var(--bg-3)",
                borderRadius: "var(--radius-sm)",
                fontSize: 13,
                color: "var(--text-muted)",
                fontFamily: "monospace",
              }}>
              {tag.key}
            </div>
          </div>
        )}

        <div className="edit-modal__field">
          <label className="edit-modal__label">English label</label>
          <input
            className="edit-modal__input"
            type="text"
            value={labelEn}
            onChange={(e) => setLabelEn(e.target.value)}
            placeholder="e.g. Chemistry"
          />
        </div>

        <div className="edit-modal__field">
          <label className="edit-modal__label">Color</label>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{
                width: 40,
                height: 32,
                padding: 2,
                border: "1px solid var(--border)",
                borderRadius: 6,
                background: "var(--bg-2)",
                cursor: "pointer",
              }}
            />
            <input
              className="edit-modal__input"
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              style={{ flex: 1, fontFamily: "monospace" }}
              placeholder="#93c5fd"
            />
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: color,
                border: "1px solid var(--border)",
                flexShrink: 0,
              }}
            />
          </div>
        </div>

        <div className="edit-modal__field">
          <label className="edit-modal__label">Sort order</label>
          <input
            className="edit-modal__input"
            type="number"
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            placeholder="0"
            style={{ width: 100 }}
          />
        </div>

        <div className="admin__modal-actions" style={{ marginTop: 24 }}>
          <button className="btn btn--ghost btn--sm" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button className="btn btn--primary btn--sm" onClick={handleSave} disabled={loading}>
            {loading ? "Saving…" : isEdit ? "Save changes" : "Create tag"}
          </button>
        </div>
      </div>
    </div>
  );
}
