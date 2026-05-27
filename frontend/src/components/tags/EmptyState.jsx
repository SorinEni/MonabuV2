import { SearchIcon, TagIcon } from "@components/shared/Icons";

export function EmptyState({ filtered, message }) {
  if (filtered) {
    return (
      <div className="tags-empty">
        <span className="tags-empty__icon">
          <SearchIcon size={18} />
        </span>
        <p>No tags match your search.</p>
      </div>
    );
  }
  return (
    <div className="tags-empty">
      <span className="tags-empty__icon">
        <TagIcon size={18} />
      </span>
      <p>{message || "No tags yet. Create your first one above."}</p>
    </div>
  );
}
