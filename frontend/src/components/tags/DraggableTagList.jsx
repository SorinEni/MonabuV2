import { useState } from "react";
import { TagRow } from "./TagRow";

export function DraggableTagList({ tags, onUpdate, onDelete, onReorder, onSubTagsChange }) {
  const [dragIndex, setDragIndex] = useState(null);
  const [overIndex, setOverIndex] = useState(null);

  function handleDragEnd() {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      const reordered = [...tags];
      const [moved] = reordered.splice(dragIndex, 1);
      reordered.splice(overIndex, 0, moved);
      const items = reordered.map((t, i) => ({ id: t._id, order: i }));
      onReorder(reordered, items);
    }
    setDragIndex(null);
    setOverIndex(null);
  }

  return (
    <ul className="tag-list">
      {tags.map((tag, i) => (
        <div
          key={tag._id}
          className={`tag-row-wrap${overIndex === i && dragIndex !== i ? " tag-row-wrap--over" : ""}`}
          draggable={tag.status === "active"}
          onDragStart={() => setDragIndex(i)}
          onDragEnter={() => setOverIndex(i)}
          onDragOver={(e) => e.preventDefault()}
          onDragEnd={handleDragEnd}>
          <TagRow
            tag={tag}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onSubTagsChange={onSubTagsChange}
            dragging={dragIndex === i}
            isDefault={false}
          />
        </div>
      ))}
    </ul>
  );
}
