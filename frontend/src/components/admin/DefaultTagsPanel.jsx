import { useState, useEffect } from "react";
import { api } from "@api/api";
import { AdminPlusIcon, PencilIcon, TrashIcon } from "@components/shared/Icons";
import { DefaultTagModal } from "./DefaultTagModal";
import { ConfirmModal } from "./ConfirmModal";
import { StatusDot } from "./StatusDot";

export function DefaultTagsPanel({ showToast }) {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editTarget, setEditTarget] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const { tags } = await api.get("/admin/default-tags");
      setTags(tags);
    } catch (err) {
      showToast(err.message || "Failed to load default tags", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSave(data) {
    if (editTarget) {
      const { tag } = await api.patch(`/admin/default-tags/${editTarget._id}`, data);
      setTags((prev) => prev.map((t) => (t._id === tag._id ? tag : t)));
      showToast("Default tag updated");
    } else {
      const { tag } = await api.post("/admin/default-tags", data);
      setTags((prev) => [...prev, tag].sort((a, b) => a.order - b.order));
      showToast("Default tag created");
    }
    setShowModal(false);
    setEditTarget(null);
  }

  function handleDelete(tag) {
    setConfirm({
      title: "Delete default tag?",
      body: `"${tag.labelEn}" will be removed from the platform defaults. Existing user tags are not affected.`,
      confirmLabel: "Delete",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/admin/default-tags/${tag._id}`);
          setTags((prev) => prev.filter((t) => t._id !== tag._id));
          showToast("Default tag deleted");
        } catch (err) {
          showToast(err.message || "Delete failed", "error");
        }
      },
    });
  }

  async function handleToggleActive(tag) {
    try {
      const { tag: updated } = await api.patch(`/admin/default-tags/${tag._id}`, {
        isActive: !tag.isActive,
      });
      setTags((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
      showToast(updated.isActive ? "Tag activated" : "Tag deactivated");
    } catch (err) {
      showToast(err.message || "Update failed", "error");
    }
  }

  return (
    <div>
      <div className="admin__section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin__section-title">Default Tags</div>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--text-faint)",
              marginTop: 4,
              marginBottom: 0,
            }}>
            Platform-wide tags seeded for every new user. Changes affect new accounts only —
            existing user tags are never modified automatically.
          </p>
        </div>
        <button
          className="btn btn--primary btn--sm"
          onClick={() => {
            setEditTarget(null);
            setShowModal(true);
          }}
          style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AdminPlusIcon size={11} /> New tag
        </button>
      </div>

      {loading ? (
        <div className="admin__loading">
          <div className="admin__spinner" />
          Loading tags…
        </div>
      ) : tags.length === 0 ? (
        <div className="admin__empty">No default tags yet.</div>
      ) : (
        <div className="admin__table-wrap">
          <table className="admin__table">
            <thead>
              <tr>
                <th>Tag</th>
                <th>Key</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag._id} style={{ opacity: tag.isActive ? 1 : 0.55 }}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div
                        style={{
                          width: 14,
                          height: 14,
                          borderRadius: 4,
                          background: tag.color,
                          flexShrink: 0,
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                      />
                      <span style={{ fontWeight: 500, fontSize: 13.5 }}>{tag.labelEn}</span>
                    </div>
                  </td>
                  <td>
                    <code
                      style={{
                        fontSize: 12,
                        padding: "2px 7px",
                        background: "var(--bg-3)",
                        borderRadius: 4,
                        color: "var(--accent)",
                        border: "1px solid var(--border)",
                      }}>
                      {tag.key}
                    </code>
                  </td>
                  <td
                    style={{
                      color: "var(--text-faint)",
                      fontVariantNumeric: "tabular-nums",
                      fontSize: 13,
                    }}>
                    {tag.order}
                  </td>
                  <td>
                    <StatusDot active={tag.isActive} />
                  </td>
                  <td>
                    <div className="admin__actions-cell">
                      <button
                        className="action-btn"
                        title="Edit tag"
                        onClick={() => {
                          setEditTarget(tag);
                          setShowModal(true);
                        }}>
                        <PencilIcon size={11} /> Edit
                      </button>
                      <button
                        className={`action-btn${tag.isActive ? "" : " action-btn--warning"}`}
                        onClick={() => handleToggleActive(tag)}>
                        {tag.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        className="action-btn action-btn--danger"
                        onClick={() => handleDelete(tag)}>
                        <TrashIcon size={11} /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <DefaultTagModal
          tag={editTarget}
          onSave={handleSave}
          onCancel={() => {
            setShowModal(false);
            setEditTarget(null);
          }}
        />
      )}
      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
