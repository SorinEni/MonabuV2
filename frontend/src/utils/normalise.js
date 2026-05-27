// Shape DB documents into flat objects the UI expects.
// Keeps all data transformations in one place so components stay clean.

export function normaliseSession(s, overrides = {}) {
  return {
    id: s._id,
    label: s.label || "Untitled session",
    tag: s.tag ? { id: s.tag._id, name: s.tag.name, color: s.tag.color } : null,
    subTag: s.subTag
      ? { id: s.subTag._id, name: s.subTag.name, color: s.subTag.color }
      : null,
    note: s.notes || "",
    duration: s.durationSeconds || 0,
    timestamp: s.startedAt,
    pomo: false,
    ...overrides,
  };
}

export function normaliseTag(t) {
  return {
    id: t._id,
    name: t.name,
    color: t.color,
    // Default tags have a `key` field; user tags have `defaultKey` (always null).
    defaultKey: t.defaultKey ?? t.key ?? null,
    isDefault: t.isDefault ?? false,
    isHidden: t.isHidden ?? false,
    subTags: (t.subTags ?? []).map((st) => ({
      id: st._id,
      name: st.name,
      color: st.effectiveColor ?? st.color ?? t.color,
    })),
  };
}
