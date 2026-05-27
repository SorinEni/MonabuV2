/**
 * useTags
 *
 * Owns all tag state and server interactions:
 *   - Initial load
 *   - Hide (user tags and default tags separately)
 *   - Edit (open modal + save)
 *   - Delete (open modal + confirm)
 *   - Add subtag inline
 *
 * Returns everything the Tracker and TagPicker need.
 */

import { useState } from "react";
import { api } from "@api/api";
import { normaliseTag } from "@utils/normalise";

export function useTags() {
  const [tags,        setTags]        = useState([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [editingTag,  setEditingTag]  = useState(null);
  const [deletingTag, setDeletingTag] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  async function loadTags() {
    try {
      const { tags: dbTags } = await api.get("/tags");
      setTags(dbTags.map(normaliseTag));
    } catch (err) {
      console.error("loadTags:", err.message);
    } finally {
      setTagsLoading(false);
    }
  }

  // Hide a user-created tag (soft-delete on server)
  async function handleHideTag(tag) {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    try {
      await api.patch(`/tags/${tag.id}`, { isHidden: true });
    } catch {
      setTags((prev) => [...prev, tag]); // rollback
    }
  }

  // Hide a default/suggested tag via the user-preference endpoint
  async function handleHideDefaultTag(tag) {
    setTags((prev) => prev.filter((t) => t.id !== tag.id));
    try {
      await api.patch(`/tags/defaults/${tag.id}/preference`, { isHidden: true });
    } catch {
      setTags((prev) => [...prev, tag]); // rollback
    }
  }

  // Called after EditTagModal saves successfully
  function handleSaveEditTag(updatedTag) {
    setTags((prev) => prev.map((t) => (t.id === updatedTag.id ? updatedTag : t)));
  }

  // Called after DeleteTagModal confirms deletion
  function handleConfirmDeleteTag(tagId) {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  }

  // Called after CreateTagModal creates a tag
  function handleTagCreated(newTag) {
    setTags((prev) => [...prev, newTag]);
  }

  // Add a subtag inline from the TagPicker
  async function handleAddSubTag(tagId, name) {
    const { subTag } = await api.post(`/tags/${tagId}/subtags`, { name });
    const normSt = {
      id: subTag._id,
      name: subTag.name,
      color:
        subTag.effectiveColor ??
        subTag.color ??
        tags.find((t) => t.id === tagId)?.color,
    };
    setTags((prev) =>
      prev.map((t) =>
        t.id === tagId ? { ...t, subTags: [...t.subTags, normSt] } : t,
      ),
    );
    return normSt;
  }

  return {
    tags,
    setTags,
    tagsLoading,
    loadTags,
    editingTag,
    setEditingTag,
    deletingTag,
    setDeletingTag,
    showCreateModal,
    setShowCreateModal,
    handleHideTag,
    handleHideDefaultTag,
    handleSaveEditTag,
    handleConfirmDeleteTag,
    handleTagCreated,
    handleAddSubTag,
  };
}
