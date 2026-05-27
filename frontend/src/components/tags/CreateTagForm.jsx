import { useState, useEffect, useRef } from "react";
import { api } from "@api/api";
import { PlusIcon, CheckIcon, CloseIcon } from "@components/shared/Icons";
import { ColorPicker } from "./ColorPicker";
import { PRESET_COLORS } from "@constants/tagColors";

export function CreateTagForm({ onCreated, atLimit }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.post("/tags", { name: name.trim(), color });
      onCreated(data.tag);
      setName("");
      setColor(PRESET_COLORS[0]);
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        className="create-tag-btn"
        onClick={() => setOpen(true)}
        disabled={atLimit}
        title={atLimit ? "Free plan limit reached" : undefined}>
        <PlusIcon size={13} />
        New tag
      </button>
    );
  }

  return (
    <form className="create-tag-form" onSubmit={handleSubmit}>
      <div className="create-tag-form__top">
        <div className="tag-name-preview" style={{ borderColor: color, color }}>
          <span className="tag-name-preview__dot" style={{ background: color }} />
          {name || "Tag name"}
        </div>
      </div>
      <ColorPicker value={color} onChange={setColor} />
      <div className="create-tag-form__row">
        <input
          ref={inputRef}
          className="tag-input"
          placeholder="Tag name…"
          value={name}
          maxLength={64}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="tag-action-btn tag-action-btn--primary"
          disabled={loading || !name.trim()}>
          <CheckIcon size={12} />
          {loading ? "Saving…" : "Create"}
        </button>
        <button
          type="button"
          className="tag-action-btn"
          onClick={() => {
            setOpen(false);
            setError("");
            setName("");
          }}>
          <CloseIcon size={12} />
        </button>
      </div>
      {error && <div className="tag-form-error">{error}</div>}
    </form>
  );
}
