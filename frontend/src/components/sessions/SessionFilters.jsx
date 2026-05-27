// Search/filter bar for the Sessions list.
// Now includes tag filter and group-by period controls.

/**
 * Props:
 *   search           string
 *   onSearch         fn(value)
 *   total            number    Total result count shown beside the input
 *   loading          bool      Hides the count while loading
 *   tags             { _id, name, color }[]
 *   tagFilter        string    Selected tag _id or ""
 *   onTagFilterChange fn(id)
 *   groupMode        "day" | "week" | "month" | "year"
 *   onGroupModeChange fn(mode)
 */
export default function SessionFilters({
  search,
  onSearch,
  total,
  loading,
  tags = [],
  tagFilter,
  onTagFilterChange,
  groupMode,
  onGroupModeChange,
}) {
  const modes = [
    { key: "day", label: "Day" },
    { key: "week", label: "Week" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
  ];

  return (
    <div className="ss-filter">
      <div className="ss-filter__search-wrap">
        <span className="ss-filter__search-icon">⌕</span>
        <input
          className="ss-filter__search"
          type="search"
          placeholder="Search sessions…"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>

      {tags.length > 0 && (
        <select
          className="ss-filter__tag"
          value={tagFilter}
          onChange={(e) => onTagFilterChange(e.target.value)}
          title="Filter by tag"
        >
          <option value="">All tags</option>
          <option value="none">Untagged</option>
          {tags
            .filter((t) => t.name?.toLowerCase() !== "untagged")
            .map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
        </select>
      )}

      <div className="ss-filter__group">
        {modes.map((m) => (
          <button
            key={m.key}
            className={`ss-filter__group-btn${groupMode === m.key ? " ss-filter__group-btn--active" : ""}`}
            onClick={() => onGroupModeChange(m.key)}
            title={`Group by ${m.label}`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {!loading && (
        <span className="ss-filter__count">
          {total} session{total !== 1 ? "s" : ""}
        </span>
      )}
    </div>
  );
}
