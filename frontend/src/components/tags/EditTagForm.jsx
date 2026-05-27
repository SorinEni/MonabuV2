import { useState, useEffect, useRef } from "react";
import { api } from "@api/api";
import { CheckIcon, CloseIcon } from "@components/shared/Icons";
import { ColorPicker } from "./ColorPicker";

export function EditTagForm({ tag, onSaved, onCancel }) {
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.patch(`/tags/${tag._id}`, { name: name.trim(), color });
      onSaved(data.tag);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="edit-tag-form" onSubmit={handleSubmit}>
      <ColorPicker value={color} onChange={setColor} />
      <div className="create-tag-form__row">
        <input
          ref={inputRef}
          className="tag-input"
          value={name}
          maxLength={64}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          type="submit"
          className="tag-action-btn tag-action-btn--primary"
          disabled={loading || !name.trim()}>
          <CheckIcon size={12} />
          Save
        </button>
        <button type="button" className="tag-action-btn" onClick={onCancel}>
          <CloseIcon size={12} />
        </button>
      </div>
      {error && <div className="tag-form-error">{error}</div>}
    </form>
  );
}
