import { useState } from "react";
import { ChevronDownIcon } from "@components/shared/Icons";
import { TagRow } from "./TagRow";

export function ArchivedSubSection({ tags, onUpdate, onDelete, onSubTagsChange, isDefault, q }) {
  const [open, setOpen] = useState(false);
  const filtered = tags.filter(
    (t) => t.status === "archived" && (!q || t.name.toLowerCase().includes(q)),
  );
  if (filtered.length === 0) return null;

  return (
    <div className="tags-archived-sub">
      <button className="tags-archived-sub__toggle" onClick={() => setOpen((s) => !s)}>
        <span className="tags-archived-sub__label">
          Archived
          <span className="tags-section__count">{filtered.length}</span>
        </span>
        <ChevronDownIcon
          size={13}
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            color: "var(--text-faint)",
          }}
        />
      </button>
      {open && (
        <ul className="tag-list">
          {filtered.map((tag) => (
            <TagRow
              key={tag._id}
              tag={tag}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onSubTagsChange={onSubTagsChange}
              isDefault={isDefault}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
