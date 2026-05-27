// Tag picker used inside the Tracker timer card.
// User tags show edit, hide, and delete actions.
// Default/suggested tags show a hide action only.
// Subtag creation is inline inside the subtag dropdown.

import { useState, useEffect, useRef } from "react";
import {
  TagIcon,
  ChevronDownIcon,
  SearchIcon,
  CheckIcon,
  PlusIcon,
  EyeClosedIcon,
  PencilIcon,
  TrashIcon,
} from "@components/shared/Icons";

export function TagPicker({
  tags = [],
  selected,
  selectedSubTag,
  onSelect,
  onSelectSubTag,
  onCreateTag,
  onHideTag,
  onHideDefaultTag,
  onEditTag,
  onDeleteTag,
  onAddSubTag,
  disabled = false,
}) {
  const [open, setOpen] = useState(false);
  const [subTagOpen, setSubTagOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addSubMode, setAddSubMode] = useState(false);
  const [newSubName, setNewSubName] = useState("");
  const [collapsed, setCollapsed] = useState({
    yours: false,
    defaults: true, // Default tags start collapsed to reduce noise.
  });

  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSubTagOpen(false);
        setAddSubMode(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggleSection = (key) =>
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const realTags = tags.filter((t) => t.id !== null);
  const yours = realTags.filter((t) => !t.isDefault && !t.isHidden);
  const defaults = realTags.filter((t) => t.isDefault && !t.isHidden);
  const q = search.toLowerCase();
  const filteredYours = yours.filter((t) => t.name.toLowerCase().includes(q));
  const filteredDefaults = defaults.filter((t) =>
    t.name.toLowerCase().includes(q),
  );

  const selectedTag = tags.find((t) => t.id === selected);
  const selectedSubObj =
    selectedTag?.subTags?.find((st) => st.id === selectedSubTag) ?? null;
  const availableSubs = selectedTag?.subTags ?? [];

  const handleSelect = (id) => {
    onSelect(id);
    onSelectSubTag(null);
    setOpen(false);
    setSearch("");
    if (tags.find((t) => t.id === id)?.subTags?.length > 0) setSubTagOpen(true);
  };

  const handleHide = (e, tag) => {
    e.stopPropagation();
    onHideTag(tag);
    if (tag.id === selected) onSelect(null);
  };

  const handleHideDefault = (e, tag) => {
    e.stopPropagation();
    onHideDefaultTag(tag);
    if (tag.id === selected) onSelect(null);
  };

  const handleEdit = (e, tag) => {
    e.stopPropagation();
    setOpen(false);
    onEditTag(tag);
  };

  const handleDelete = (e, tag) => {
    e.stopPropagation();
    setOpen(false);
    onDeleteTag(tag);
  };

  const handleClearTag = () => {
    onSelect(null);
    onSelectSubTag(null);
  };

  const handleAddSubTag = async () => {
    if (!newSubName.trim() || !selected) return;
    try {
      const st = await onAddSubTag(selected, newSubName.trim());
      onSelectSubTag(st.id);
    } catch {
      // Ignore — error surfaced in the TagPicker UI would be noisy here.
    }
    setNewSubName("");
    setAddSubMode(false);
    setSubTagOpen(false);
  };

  const SectionHeader = ({ label, sectionKey, count }) => (
    <button
      className="tag-picker__section-header"
      onClick={() => toggleSection(sectionKey)}>
      <span className="tag-picker__section-label">{label}</span>
      <span className="tag-picker__section-count">{count}</span>
      <ChevronDownIcon
        size={11}
        className={`tag-picker__section-chevron${collapsed[sectionKey] ? " tag-picker__section-chevron--collapsed" : ""}`}
      />
    </button>
  );

  const renderYourItem = (tag) => (
    <div key={tag.id} className="tag-picker__item-wrap">
      <button
        className={`tag-picker__item${tag.id === selected ? " tag-picker__item--active" : ""}`}
        onClick={() => handleSelect(tag.id)}>
        <span className="tag-picker__dot" style={{ background: tag.color }} />
        {tag.name}
        {tag.id === selected && <CheckIcon className="tag-picker__check" />}
        {tag.subTags?.length > 0 && (
          <span className="tag-picker__subtag-count">{tag.subTags.length}</span>
        )}
      </button>
      <div className="tag-picker__item-actions">
        <button
          className="tag-picker__action-btn tag-picker__action-btn--edit"
          title="Edit tag"
          onClick={(e) => handleEdit(e, tag)}>
          <PencilIcon size={11} />
        </button>
        <button
          className="tag-picker__action-btn tag-picker__action-btn--hide"
          title="Hide tag"
          onClick={(e) => handleHide(e, tag)}>
          <EyeClosedIcon size={11} strokeWidth="1.8" />
        </button>
        <button
          className="tag-picker__action-btn tag-picker__action-btn--delete"
          title="Delete tag"
          onClick={(e) => handleDelete(e, tag)}>
          <TrashIcon size={11} />
        </button>
      </div>
    </div>
  );

  const renderDefaultItem = (tag) => (
    <div key={tag.id} className="tag-picker__item-wrap">
      <button
        className={`tag-picker__item${tag.id === selected ? " tag-picker__item--active" : ""}`}
        onClick={() => handleSelect(tag.id)}>
        <span className="tag-picker__dot" style={{ background: tag.color }} />
        {tag.name}
        {tag.id === selected && <CheckIcon className="tag-picker__check" />}
      </button>
      <div className="tag-picker__item-actions">
        <button
          className="tag-picker__action-btn tag-picker__action-btn--hide"
          title="Hide this default tag"
          onClick={(e) => handleHideDefault(e, tag)}>
          <EyeClosedIcon size={11} strokeWidth="1.8" />
        </button>
      </div>
    </div>
  );

  const Dropdown = () => (
    <div className="tag-picker__dropdown">
      <div className="tag-picker__search-wrap">
        <SearchIcon size={13} className="tag-picker__search-icon" />
        <input
          className="tag-picker__search"
          placeholder="Search tags…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>
      <div className="tag-picker__list">
        {filteredYours.length > 0 && (
          <>
            <SectionHeader
              label="Your Tags"
              sectionKey="yours"
              count={filteredYours.length}
            />
            {!collapsed.yours && (
              <div className="tag-picker__section-items">
                {filteredYours.map(renderYourItem)}
              </div>
            )}
          </>
        )}
        {filteredDefaults.length > 0 && (
          <>
            <SectionHeader
              label="Default Tags"
              sectionKey="defaults"
              count={filteredDefaults.length}
            />
            {!collapsed.defaults && (
              <div className="tag-picker__section-items">
                {filteredDefaults.map(renderDefaultItem)}
              </div>
            )}
          </>
        )}
        {filteredYours.length === 0 && filteredDefaults.length === 0 && (
          <div className="tag-picker__empty">No tags found</div>
        )}
      </div>
      <button
        className="tag-picker__create"
        onClick={() => {
          onCreateTag();
          setOpen(false);
        }}>
        <PlusIcon />
        Create new tag
      </button>
    </div>
  );

  // Split trigger when a tag is selected — left half opens tag picker,
  // right half (when subtags exist) opens subtag picker.
  if (selected && selectedTag) {
    return (
      <div
        className="tag-picker"
        ref={ref}
        style={{ position: "relative", flex: 1 }}>
        <div
          className={`tag-picker__split${disabled ? " tag-picker__split--disabled" : ""}`}>
          <button
            className="tag-picker__split-main"
            onClick={() => {
              if (!disabled) {
                setOpen((v) => !v);
                setSubTagOpen(false);
              }
            }}
            disabled={disabled}>
            <span
              className="tag-picker__dot"
              style={{ background: selectedTag.color }}
            />
            <span className="tag-picker__name">{selectedTag.name}</span>
            <ChevronDownIcon size={11} className="tag-picker__chevron" />
          </button>

          {availableSubs.length > 0 && (
            <div className="tag-picker__split-divider" />
          )}

          {availableSubs.length > 0 && (
            <button
              className="tag-picker__split-sub"
              onClick={() => {
                if (!disabled) {
                  setSubTagOpen((v) => !v);
                  setOpen(false);
                }
              }}
              disabled={disabled}>
              {selectedSubObj ? (
                <>
                  <span
                    className="tag-picker__dot tag-picker__dot--sm"
                    style={{ background: selectedSubObj.color }}
                  />
                  <span className="tag-picker__name tag-picker__name--sub">
                    {selectedSubObj.name}
                  </span>
                </>
              ) : (
                <span className="tag-picker__no-sub-hint">+ subtag</span>
              )}
              <ChevronDownIcon size={10} className="tag-picker__chevron" />
            </button>
          )}

          {!disabled && (
            <button
              className="tag-picker__split-clear"
              onClick={handleClearTag}
              title="Remove tag">
              ×
            </button>
          )}
        </div>

        {open && <Dropdown />}

        {subTagOpen && availableSubs.length > 0 && (
          <div
            className="tag-picker__dropdown tag-picker__dropdown--sub"
            style={{ top: "calc(100% + 6px)" }}>
            <div className="tag-picker__list">
              <div className="tag-picker__item-wrap">
                <button
                  className={`tag-picker__item${selectedSubTag === null ? " tag-picker__item--active" : ""}`}
                  onClick={() => {
                    onSelectSubTag(null);
                    setSubTagOpen(false);
                  }}>
                  <span
                    className="tag-picker__dot"
                    style={{ background: "var(--border-2)" }}
                  />
                  No subtag
                  {selectedSubTag === null && (
                    <CheckIcon className="tag-picker__check" />
                  )}
                </button>
              </div>
              {availableSubs.map((st) => (
                <div key={st.id} className="tag-picker__item-wrap">
                  <button
                    className={`tag-picker__item${st.id === selectedSubTag ? " tag-picker__item--active" : ""}`}
                    onClick={() => {
                      onSelectSubTag(st.id);
                      setSubTagOpen(false);
                    }}>
                    <span
                      className="tag-picker__dot"
                      style={{ background: st.color }}
                    />
                    {st.name}
                    {st.id === selectedSubTag && (
                      <CheckIcon className="tag-picker__check" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="tag-picker__add-sub">
              {addSubMode ? (
                <>
                  <input
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      borderBottom: "1px solid var(--border-2)",
                      outline: "none",
                      fontFamily: "var(--font-sans)",
                      fontSize: 12,
                      color: "var(--text)",
                      caretColor: "var(--accent)",
                      padding: "2px 0",
                    }}
                    placeholder="Subtag name…"
                    value={newSubName}
                    onChange={(e) => setNewSubName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubTag();
                      if (e.key === "Escape") {
                        setAddSubMode(false);
                        setNewSubName("");
                      }
                    }}
                    autoFocus
                  />
                  <button
                    style={{
                      background: "var(--accent)",
                      color: "var(--color-on-accent)",
                      border: "none",
                      borderRadius: 5,
                      padding: "3px 9px",
                      fontSize: 11,
                      fontFamily: "var(--font-sans)",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                    onClick={handleAddSubTag}>
                    Add
                  </button>
                  <button
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--text-faint)",
                      cursor: "pointer",
                      fontSize: 13,
                    }}
                    onClick={() => {
                      setAddSubMode(false);
                      setNewSubName("");
                    }}>
                    ✕
                  </button>
                </>
              ) : (
                <button
                  className="tag-picker__create"
                  style={{ borderTop: "none", padding: "4px 6px", fontSize: 11.5 }}
                  onClick={() => setAddSubMode(true)}>
                  <PlusIcon size={11} />
                  Add subtag
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Default trigger — no tag selected.
  return (
    <div
      className="tag-picker"
      ref={ref}
      style={{ position: "relative", flex: 1 }}>
      <button
        className="tag-picker__trigger"
        onClick={() => {
          setOpen((o) => !o);
          setSubTagOpen(false);
        }}
        disabled={disabled}>
        <TagIcon className="tag-picker__icon" size={14} />
        <span className="tag-picker__placeholder">Add tag</span>
        <ChevronDownIcon className="tag-picker__chevron" size={12} />
      </button>
      {open && <Dropdown />}
    </div>
  );
}
