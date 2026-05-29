import { useState } from "react";
import { api } from "@api/api";
import { PencilIcon, TrashIcon, CheckIcon, CloseIcon, ChevronDownIcon, DragHandleIcon, ArchiveIcon, RestoreIcon, EyeOpenIcon, EyeClosedIcon } from "@components/shared/Icons";
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
            <DragHandleIcon />
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
                  <ArchiveIcon />
                </button>
              )}
              {tag.status === "archived" && (
                <button className="tag-row__action-btn" title="Restore to active" disabled={loading} onClick={handleRestore}>
                  <RestoreIcon />
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
                  <EyeOpenIcon size={11} />
                ) : (
                  <EyeClosedIcon size={11} />
                )}
              </button>
              {tag.status === "active" && (
                <button className="tag-row__action-btn" title="Archive" disabled={loading} onClick={handleArchive}>
                  <ArchiveIcon />
                </button>
              )}
              {tag.status === "archived" && (
                <button className="tag-row__action-btn" title="Restore to active" disabled={loading} onClick={handleRestore}>
                  <RestoreIcon />
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
