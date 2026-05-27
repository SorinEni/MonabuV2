import { useState } from "react";
import { api } from "@api/api";
import { PencilIcon, TrashIcon, CheckIcon, CloseIcon, ChevronDownIcon } from "@components/shared/Icons";
import { EditTagForm } from "./EditTagForm";
import { SubTagPanel } from "./SubTagPanel";
import { formatHours } from "./formatHours";

export function TagRow({ tag, onUpdate, onDelete, onSubTagsChange, dragging, isDefault }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const subTagCount = tag.subTags?.length ?? 0;
  const canExpand = !isDefault && tag.status === "active";

  async function handleArchive() {
    setLoading(true);
    try {
      const data = await api.patch(`/tags/${tag._id}`, { status: "archived" });
      onUpdate(data.tag);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore() {
    setLoading(true);
    try {
      const data = await api.patch(`/tags/${tag._id}`, { status: "active" });
      onUpdate(data.tag);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleHide() {
    setLoading(true);
    try {
      const newHidden = !tag.isHidden;
      if (isDefault) {
        await api.patch(`/tags/defaults/${tag._id}/preference`, { isHidden: newHidden });
        onUpdate({ ...tag, isHidden: newHidden });
      } else {
        const data = await api.patch(`/tags/${tag._id}`, { isHidden: newHidden });
        onUpdate(data.tag);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    try {
      await api.delete(`/tags/${tag._id}`);
      onDelete(tag._id);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  if (editing) {
    return (
      <li className="tag-row tag-row--editing">
        <EditTagForm
          tag={tag}
          onSaved={(updated) => {
            onUpdate(updated);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </li>
    );
  }

  const rowClass = [
    "tag-row",
    tag.status === "archived" ? "tag-row--archived" : "",
    dragging ? "tag-row--dragging" : "",
    tag.isHidden ? "tag-row--hidden" : "",
    expanded ? "tag-row--expanded" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <li className={rowClass}>
        {!isDefault && tag.status === "active" ? (
          <span className="tag-row__drag-handle" title="Drag to reorder">
            <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
              <circle cx="3" cy="3" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="3" cy="13" r="1.5" />
              <circle cx="7" cy="3" r="1.5" />
              <circle cx="7" cy="8" r="1.5" />
              <circle cx="7" cy="13" r="1.5" />
            </svg>
          </span>
        ) : (
          <span className="tag-row__drag-handle tag-row__drag-handle--placeholder" />
        )}

        <span className="tag-row__swatch" style={{ background: tag.color }} />

        <span className="tag-row__name">
          {canExpand ? (
            <button
              className="tag-row__expand-btn"
              onClick={() => setExpanded((s) => !s)}
              title={expanded ? "Collapse subtags" : "Expand subtags"}
              aria-expanded={expanded}>
              <ChevronDownIcon
                size={11}
                style={{
                  transform: expanded ? "rotate(180deg)" : "rotate(-90deg)",
                  transition: "transform 0.18s",
                  color: "var(--text-faint)",
                  flexShrink: 0,
                }}
              />
              {tag.name}
              {subTagCount > 0 && <span className="tag-row__subtag-count">{subTagCount}</span>}
            </button>
          ) : (
            <>
              {tag.name}
              {tag.isHidden && <span className="tag-row__hidden-label">hidden</span>}
            </>
          )}
        </span>

        <span className="tag-row__stat">{tag.sessionCount != null ? tag.sessionCount : "—"}</span>
        <span className="tag-row__stat tag-row__stat--hours">
          {tag.totalSeconds != null ? formatHours(tag.totalSeconds) : "—"}
        </span>

        {tag.status === "archived" ? (
          <span className="tag-row__badge tag-row__badge--archived">Archived</span>
        ) : isDefault ? (
          <span className="tag-row__badge tag-row__badge--default">Default</span>
        ) : (
          <span />
        )}

        <div className="tag-row__actions">
          {!isDefault && (
            <>
              {tag.status === "active" && (
                <button className="tag-row__action-btn" title="Edit" onClick={() => setEditing(true)}>
                  <PencilIcon size={11} />
                </button>
              )}
              {tag.status === "active" && (
                <button className="tag-row__action-btn" title="Archive" disabled={loading} onClick={handleArchive}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
              )}
              {tag.status === "archived" && (
                <button className="tag-row__action-btn" title="Restore to active" disabled={loading} onClick={handleRestore}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.86" />
                  </svg>
                </button>
              )}
              {confirmDelete ? (
                <>
                  <button
                    className="tag-row__action-btn tag-row__action-btn--danger"
                    disabled={loading}
                    onClick={handleDelete}
                    title="Confirm delete">
                    <CheckIcon size={11} />
                  </button>
                  <button className="tag-row__action-btn" onClick={() => setConfirmDelete(false)} title="Cancel">
                    <CloseIcon size={11} />
                  </button>
                </>
              ) : (
                <button className="tag-row__action-btn tag-row__action-btn--danger" title="Delete" onClick={() => setConfirmDelete(true)}>
                  <TrashIcon size={11} />
                </button>
              )}
            </>
          )}

          {isDefault && (
            <>
              <button
                className="tag-row__action-btn"
                title={tag.isHidden ? "Show in picker" : "Hide from picker"}
                disabled={loading}
                onClick={handleToggleHide}>
                {tag.isHidden ? (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
              {tag.status === "active" && (
                <button className="tag-row__action-btn" title="Archive" disabled={loading} onClick={handleArchive}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                </button>
              )}
              {tag.status === "archived" && (
                <button className="tag-row__action-btn" title="Restore to active" disabled={loading} onClick={handleRestore}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 .49-3.86" />
                  </svg>
                </button>
              )}
            </>
          )}
        </div>
      </li>

      {canExpand && expanded && (
        <li className="subtag-panel-row">
          <SubTagPanel tag={tag} onTagSubTagsChange={onSubTagsChange} />
        </li>
      )}
    </>
  );
}
