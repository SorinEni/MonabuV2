import { useState, useRef } from "react";
import { api } from "@api/api";

export function ImportSessionsPanel({ targetUser, showToast }) {
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  function parseFile(f) {
    if (!f) return;
    setFile(f);
    setParsed(null);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (!Array.isArray(data)) {
          setParsed({ rows: null, parseError: "JSON must be an array of session objects." });
          return;
        }
        setParsed({ rows: data, parseError: null });
      } catch {
        setParsed({ rows: null, parseError: "Invalid JSON — could not parse file." });
      }
    };
    reader.readAsText(f);
  }

  function handleFileChange(e) {
    parseFile(e.target.files[0] ?? null);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith(".json")) {
      parseFile(f);
    } else {
      showToast("Please drop a .json file", "error");
    }
  }

  async function handleImport() {
    if (!parsed?.rows?.length) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post(`/admin/sessions/import/${targetUser._id}`, {
        sessions: parsed.rows,
      });
      setResult(res);
      showToast(
        res.imported > 0
          ? `Imported ${res.imported} session${res.imported !== 1 ? "s" : ""}` +
              (res.errors?.length ? ` (${res.errors.length} errors)` : "")
          : "No sessions were imported.",
        res.imported > 0 ? "success" : "error",
      );
    } catch (err) {
      showToast(err.message || "Import failed", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setParsed(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const rowCount = parsed?.rows?.length ?? 0;
  const hasParseError = !!parsed?.parseError;
  const readyToImport = !hasParseError && rowCount > 0 && !result;

  return (
    <div style={{ marginTop: 8 }}>
      <div className="edit-modal__section-label" style={{ marginBottom: 12 }}>
        Import Sessions
        <span className="edit-modal__badge edit-modal__badge--admin" style={{ marginLeft: 8 }}>
          admin
        </span>
      </div>

      <p
        style={{
          fontSize: 12.5,
          color: "var(--text-faint)",
          marginBottom: 16,
          lineHeight: 1.6,
          margin: "0 0 16px",
        }}>
        Upload a <code style={{ fontSize: 11 }}>.json</code> file — an array of session objects.
        Each entry needs <code style={{ fontSize: 11 }}>startedAt</code> and{" "}
        <code style={{ fontSize: 11 }}>endedAt</code> (ISO strings). Tags are created automatically.
        All imported sessions are excluded from the leaderboard.
      </p>

      {!file && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: `2px dashed ${dragOver ? "var(--accent)" : "var(--border)"}`,
            borderRadius: 10,
            padding: "28px 20px",
            textAlign: "center",
            cursor: "pointer",
            transition: "border-color 0.15s",
            background: dragOver ? "rgba(99,102,241,0.05)" : "var(--bg-2)",
            marginBottom: 16,
          }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📂</div>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 500,
              color: "var(--text)",
              marginBottom: 4,
            }}>
            Drop a .json file here
          </div>
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>or click to browse</div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {file && !result && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "10px 14px",
            background: "var(--bg-2)",
            borderRadius: 8,
            border: "1px solid var(--border)",
            marginBottom: 14,
          }}>
          <span style={{ fontSize: 20 }}>📄</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--text)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}>
              {file.name}
            </div>
            <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>
              {(file.size / 1024).toFixed(1)} KB
              {parsed && !hasParseError && ` · ${rowCount} row${rowCount !== 1 ? "s" : ""} detected`}
            </div>
          </div>
          <button className="action-btn" onClick={handleReset} disabled={loading}>
            ✕ Remove
          </button>
        </div>
      )}

      {hasParseError && (
        <div className="edit-modal__error" style={{ marginBottom: 14 }}>
          {parsed.parseError}
        </div>
      )}

      {result && (
        <div
          style={{
            padding: "14px 16px",
            background: "var(--bg-2)",
            borderRadius: 10,
            border: "1px solid var(--border)",
            marginBottom: 16,
          }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12,
              marginBottom: result.errors?.length ? 14 : 0,
            }}>
            {[
              {
                label: "Imported",
                value: result.imported,
                color: "var(--color-success, #4ade80)",
              },
              {
                label: "Skipped",
                value: result.skipped,
                color: "var(--text-faint)",
              },
              {
                label: "Errors",
                value: result.errors?.length ?? 0,
                color: result.errors?.length ? "var(--color-error, #f87171)" : "var(--text-faint)",
              },
            ].map(({ label, value, color }) => (
              <div
                key={label}
                style={{
                  textAlign: "center",
                  padding: "10px 8px",
                  background: "var(--bg-3)",
                  borderRadius: 8,
                }}>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                  {value}
                </div>
                <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginTop: 2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
          {result.errors?.length > 0 && (
            <details style={{ marginTop: 2 }}>
              <summary
                style={{
                  cursor: "pointer",
                  fontSize: 12.5,
                  color: "var(--color-error, #f87171)",
                  userSelect: "none",
                }}>
                {result.errors.length} error{result.errors.length !== 1 ? "s" : ""} — click to
                expand
              </summary>
              <div
                style={{
                  marginTop: 10,
                  maxHeight: 200,
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}>
                {result.errors.map((e, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      padding: "6px 10px",
                      background: "var(--bg-3)",
                      borderRadius: 6,
                      borderLeft: "3px solid var(--color-error, #f87171)",
                      color: "var(--text-muted)",
                    }}>
                    <span style={{ fontWeight: 600, color: "var(--color-error, #f87171)" }}>
                      Row {e.row}
                    </span>{" "}
                    — {e.reason}
                  </div>
                ))}
              </div>
            </details>
          )}
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 14 }} onClick={handleReset}>
            Import another file
          </button>
        </div>
      )}

      {readyToImport && (
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            className="btn btn--primary btn--sm"
            onClick={handleImport}
            disabled={loading}>
            {loading
              ? `Importing ${rowCount} sessions…`
              : `Import ${rowCount} session${rowCount !== 1 ? "s" : ""}`}
          </button>
          <button className="btn btn--ghost btn--sm" onClick={handleReset} disabled={loading}>
            Cancel
          </button>
          {loading && (
            <div className="admin__spinner" style={{ width: 16, height: 16 }} />
          )}
        </div>
      )}

      <details style={{ marginTop: 20 }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: 12,
            color: "var(--text-faint)",
            userSelect: "none",
          }}>
          Expected JSON schema
        </summary>
        <pre
          style={{
            marginTop: 10,
            padding: "12px 14px",
            background: "var(--bg-3)",
            borderRadius: 8,
            fontSize: 11.5,
            color: "var(--text-muted)",
            overflowX: "auto",
            lineHeight: 1.6,
            border: "1px solid var(--border)",
          }}>
          {`[\n  {\n    "startedAt":       "2024-01-15T09:00:00Z",  // required\n    "endedAt":         "2024-01-15T10:30:00Z",  // required\n    "category":        "Mathematics",            // optional\n    "label":           "Chapter 5 review",       // optional\n    "notes":           "Focused well today",     // optional\n    "keywords":        ["algebra", "limits"],    // optional\n    "durationSeconds": 5400,                     // optional\n    "isEdited":        true                      // optional, default true\n  }\n]`}
        </pre>
      </details>
    </div>
  );
}
