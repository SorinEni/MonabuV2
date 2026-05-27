import { useState, useEffect } from "react";
import { api } from "@api/api";
import { TrashIcon } from "@components/shared/Icons";
import { ConfirmModal } from "./ConfirmModal";

export function CustomCommandsPanel({ showToast }) {
  const [domains, setDomains] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => {
    api
      .get("/admin/blocklist")
      .then(({ domains }) => setDomains(domains))
      .catch((err) => showToast(err.message || "Failed to load blocklist", "error"))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd() {
    const trimmed = input.trim().toLowerCase();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const { domain } = await api.post("/admin/blocklist", { domain: trimmed });
      setDomains((prev) => [...prev, domain]);
      setInput("");
      showToast(`Blocked: ${domain}`);
    } catch (err) {
      showToast(err.message || "Failed to add domain", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function handleRemove(domain) {
    setConfirm({
      title: "Remove from blocklist?",
      body: `"${domain}" will be unblocked. New registrations from this domain will be allowed again.`,
      confirmLabel: "Remove",
      danger: true,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await api.delete(`/admin/blocklist/${encodeURIComponent(domain)}`);
          setDomains((prev) => prev.filter((d) => d !== domain));
          showToast(`Unblocked: ${domain}`);
        } catch (err) {
          showToast(err.message || "Failed to remove domain", "error");
        }
      },
    });
  }

  return (
    <div>
      <div className="admin__section-header" style={{ marginBottom: 16 }}>
        <div>
          <div className="admin__section-title">Custom Commands</div>
          <p
            style={{
              fontSize: 12.5,
              color: "var(--text-faint)",
              marginTop: 4,
              marginBottom: 0,
            }}>
            Platform-level developer commands and configuration.
          </p>
        </div>
      </div>

      <div className="admin__table-wrap" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: "var(--text)",
              marginBottom: 4,
            }}>
            Email Domain Blocklist
          </div>
          <p style={{ fontSize: 12.5, color: "var(--text-faint)", margin: 0 }}>
            Domains listed here are rejected at registration. Changes take effect immediately.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <input
            className="edit-modal__input"
            style={{ flex: 1, maxWidth: 340 }}
            type="text"
            placeholder="e.g. spam.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitting && handleAdd()}
          />
          <button
            className="btn btn--primary btn--sm"
            onClick={handleAdd}
            disabled={submitting || !input.trim()}>
            {submitting ? "Adding…" : "Block domain"}
          </button>
        </div>

        {loading ? (
          <div className="admin__loading">
            <div className="admin__spinner" /> Loading blocklist…
          </div>
        ) : domains.length === 0 ? (
          <div className="admin__empty">No domains blocked.</div>
        ) : (
          <table className="admin__table">
            <thead>
              <tr>
                <th>Domain</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {domains.map((d) => (
                <tr key={d}>
                  <td>
                    <code
                      style={{
                        fontSize: 12.5,
                        padding: "2px 7px",
                        background: "var(--bg-3)",
                        borderRadius: 4,
                        color: "var(--color-error)",
                        border: "1px solid var(--border)",
                      }}>
                      {d}
                    </code>
                  </td>
                  <td>
                    <div className="admin__actions-cell">
                      <button
                        className="action-btn action-btn--danger"
                        onClick={() => handleRemove(d)}>
                        <TrashIcon size={11} /> Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
    </div>
  );
}
