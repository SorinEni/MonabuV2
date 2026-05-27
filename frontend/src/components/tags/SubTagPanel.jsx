import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@api/api";
import { PlusIcon, CheckIcon, CloseIcon, PencilIcon, TrashIcon } from "@components/shared/Icons";
import { formatHours } from "./formatHours";

function CreateSubTagForm({ tagId, parentColor, onCreated, onClose }) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.post(`/tags/${tagId}/subtags`, { name: name.trim() });
      onCreated(data.subTag);
      setName("");
      inputRef.current?.focus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="subtag-create-form" onSubmit={handleSubmit}>
      <span className="subtag-create-form__dot" style={{ background: parentColor }} />
      <input
        ref={inputRef}
        className="subtag-input"
        placeholder="Subtag name…"
        value={name}
        maxLength={64}
        onChange={(e) => setName(e.target.value)}
      />
      <button
        type="submit"
        className="subtag-action-btn subtag-action-btn--primary"
        disabled={loading || !name.trim()}>
        <CheckIcon size={11} />
        {loading ? "Adding…" : "Add"}
      </button>
      <button type="button" className="subtag-action-btn" onClick={onClose} title="Cancel">
        <CloseIcon size={11} />
      </button>
      {error && <div className="tag-form-error subtag-form-error">{error}</div>}
    </form>
  );
}

function SubTagRow({ subTag, tagId, parentColor, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(subTag.name);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  async function handleSave(e) {
    e.preventDefault();
    if (!editName.trim()) return;
    setLoading(true);
    try {
      const data = await api.patch(`/tags/${tagId}/subtags/${subTag._id}`, { name: editName.trim() });
      onUpdate(data.subTag);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/tags/${tagId}/subtags/${subTag._id}`);
      onDelete(subTag._id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  const effectiveColor = subTag.effectiveColor ?? subTag.color ?? parentColor;

  if (editing) {
    return (
      <li className="subtag-row subtag-row--editing">
        <form className="subtag-edit-form" onSubmit={handleSave}>
          <span className="subtag-row__dot" style={{ background: effectiveColor }} />
          <input
            ref={inputRef}
            className="subtag-input"
            value={editName}
            maxLength={64}
            onChange={(e) => setEditName(e.target.value)}
          />
          <button
            type="submit"
            className="subtag-action-btn subtag-action-btn--primary"
            disabled={loading || !editName.trim()}>
            <CheckIcon size={11} />
          </button>
          <button
            type="button"
            className="subtag-action-btn"
            onClick={() => {
              setEditing(false);
              setEditName(subTag.name);
            }}>
            <CloseIcon size={11} />
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className={`subtag-row${subTag.status === "archived" ? " subtag-row--archived" : ""}`}>
      <span className="subtag-row__indent" />
      <span className="subtag-row__dot" style={{ background: effectiveColor }} />
      <span className="subtag-row__name">{subTag.name}</span>
      <span className="subtag-row__stat">
        {subTag.sessionCount != null ? subTag.sessionCount : "—"}
      </span>
      <span className="subtag-row__stat subtag-row__stat--hours">
        {subTag.sessionCount > 0 ? formatHours(subTag.totalSeconds) : "—"}
      </span>
      {subTag.status === "archived" ? <span className="subtag-row__badge">Archived</span> : <span />}
      <div className="subtag-row__actions">
        {confirmDelete ? (
          <>
            <button
              className="subtag-action-btn subtag-action-btn--danger"
              disabled={loading}
              onClick={handleDelete}
              title="Confirm delete">
              <CheckIcon size={10} />
            </button>
            <button
              className="subtag-action-btn"
              onClick={() => setConfirmDelete(false)}
              title="Cancel">
              <CloseIcon size={10} />
            </button>
          </>
        ) : (
          <>
            <button className="subtag-action-btn" title="Rename" onClick={() => setEditing(true)}>
              <PencilIcon size={10} />
            </button>
            <button
              className="subtag-action-btn subtag-action-btn--danger"
              title="Delete subtag"
              onClick={() => setConfirmDelete(true)}>
              <TrashIcon size={10} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

export function SubTagPanel({ tag, onTagSubTagsChange }) {
  const [subTags, setSubTags] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchSubTags = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.get(
        `/tags/${tag._id}/subtags?includeArchived=true&includeHidden=true`,
      );
      setSubTags(data.subTags);
      setLoaded(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tag._id]);

  useEffect(() => {
    if (!loaded) fetchSubTags();
  }, [loaded, fetchSubTags]);

  function handleCreated(newSubTag) {
    const updated = [...subTags, newSubTag];
    setSubTags(updated);
    setCreating(false);
    onTagSubTagsChange(tag._id, updated);
  }

  function handleUpdate(updatedSubTag) {
    const updated = subTags.map((st) => (st._id === updatedSubTag._id ? updatedSubTag : st));
    setSubTags(updated);
    onTagSubTagsChange(tag._id, updated);
  }

  function handleDelete(id) {
    const updated = subTags.filter((st) => st._id !== id);
    setSubTags(updated);
    onTagSubTagsChange(tag._id, updated);
  }

  return (
    <div className="subtag-panel">
      {loading && (
        <div className="subtag-panel__loading">
          <div className="subtag-panel__skeleton skeleton" />
          <div className="subtag-panel__skeleton skeleton" />
        </div>
      )}
      {error && (
        <div className="subtag-panel__error">
          {error} —{" "}
          <button className="tags-error__retry" onClick={fetchSubTags}>
            Retry
          </button>
        </div>
      )}
      {!loading && subTags.length > 0 && (
        <ul className="subtag-list">
          {subTags.map((st) => (
            <SubTagRow
              key={st._id}
              subTag={st}
              tagId={tag._id}
              parentColor={tag.color}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </ul>
      )}
      {!loading && subTags.length === 0 && !creating && (
        <p className="subtag-panel__empty">No subtags yet — add one below.</p>
      )}
      {creating ? (
        <CreateSubTagForm
          tagId={tag._id}
          parentColor={tag.color}
          onCreated={handleCreated}
          onClose={() => setCreating(false)}
        />
      ) : (
        <button className="subtag-add-btn" onClick={() => setCreating(true)}>
          <PlusIcon size={11} />
          Add subtag
        </button>
      )}
    </div>
  );
}
