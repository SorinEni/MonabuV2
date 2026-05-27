import { useState, useRef, useCallback } from "react";
import { api } from "@api/api";

const REQUIRED_FIELDS = ["startedAt", "endedAt"];
const OPTIONAL_FIELDS = [
  "tag",
  "category",
  "label",
  "notes",
  "keywords",
];
const ALL_IMPORT_FIELDS = [...REQUIRED_FIELDS, ...OPTIONAL_FIELDS];

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows = lines.slice(1).map((line) => {
    const cols = [];
    let cur = "",
      inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cols.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cols[i] ?? ""]));
  });
  return { headers, rows };
}

function parseJSON(text) {
  try {
    const data = JSON.parse(text);
    const rows = Array.isArray(data) ? data : (data.sessions ?? []);
    if (!rows.length) return { headers: [], rows: [] };
    return { headers: Object.keys(rows[0]), rows };
  } catch {
    return null;
  }
}

function buildAutoMap(headers) {
  const map = {};
  for (const field of ALL_IMPORT_FIELDS) {
    const match = headers.find(
      (h) =>
        h.toLowerCase() === field.toLowerCase() ||
        h.toLowerCase().replace(/[_\- ]/g, "") === field.toLowerCase(),
    );
    if (match) map[field] = match;
  }
  return map;
}

export default function ImportTab({ onToast, user }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  const [parsed, setParsed] = useState(null);
  const [fieldMap, setFieldMap] = useState({});
  const [parseError, setParseError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  // Export state
  const [exportFrom, setExportFrom] = useState("");
  const [exportTo, setExportTo] = useState("");
  const [exportTag, setExportTag] = useState("");
  const [exporting, setExporting] = useState(false);

  async function doExport(url) {
    setExporting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Export failed — check your filters and try again.");
      const blob = await res.blob();
      const filename = res.headers.get("Content-Disposition")?.match(/filename="?([^"]+)"?/)?.[1] || "monabu-export.csv";
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(a.href);
      onToast("Export downloaded");
    } catch (err) {
      onToast(err.message || "Export failed", "error");
    } finally {
      setExporting(false);
    }
  }

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (exportFrom) params.set("from", exportFrom);
    if (exportTo) params.set("to", exportTo);
    if (exportTag.trim()) params.set("tagName", exportTag.trim());
    const BASE = import.meta.env.VITE_API_URL || "/api";
    const url = `${BASE}/export/csv?${params.toString()}`;
    await doExport(url);
  };

  const handleExportAll = async () => {
    const BASE = import.meta.env.VITE_API_URL || "/api";
    await doExport(`${BASE}/export/csv`);
  };

  const resetAll = () => {
    setFile(null);
    setParsed(null);
    setParseError("");
    setFieldMap({});
    setImportResult(null);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const processFile = useCallback((f) => {
    if (!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if (!["csv", "json"].includes(ext)) {
      setParseError("Only .csv and .json files are supported.");
      return;
    }
    setFile(f);
    setParseError("");
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      let result = ext === "csv" ? parseCSV(text) : parseJSON(text);
      if (!result) {
        setParseError(
          "Could not parse JSON. Expected an array or { sessions: [...] }.",
        );
        return;
      }
      if (!result.headers.length || !result.rows.length) {
        setParseError("File appears to be empty or malformed.");
        return;
      }
      setParsed(result);
      setFieldMap(buildAutoMap(result.headers));
    };
    reader.readAsText(f);
  }, []);

  const handleFileDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (f) processFile(f);
    },
    [processFile],
  );

  const handleImport = async () => {
    if (!parsed) return;
    const sessions = parsed.rows.map((row) => {
      const session = {};
      for (const field of ALL_IMPORT_FIELDS) {
        const col = fieldMap[field];
        if (col && row[col] !== undefined && row[col] !== "") {
          if (field === "keywords") {
            const raw = row[col];
            session[field] =
              typeof raw === "string"
                ? raw
                    .split(/[,;|]/)
                    .map((k) => k.trim())
                    .filter(Boolean)
                : raw;
          } else if (field === "durationSeconds") {
            const n = Number(row[col]);
            if (!isNaN(n)) session[field] = n;
          } else {
            session[field] = row[col];
          }
        }
      }
      return session;
    });

    setImporting(true);
    try {
      const result = await api.post(`/sessions/import/${user._id}`, {
        sessions,
      });
      setImportResult(result);
      if (result.imported > 0) {
        onToast(
          `Imported ${result.imported} session${result.imported !== 1 ? "s" : ""} successfully`,
        );
      }
    } catch (err) {
      onToast(err.message || "Import failed", "error");
    } finally {
      setImporting(false);
    }
  };

  const mappedCount = ALL_IMPORT_FIELDS.filter((f) => fieldMap[f]).length;
  const canImport =
    parsed && REQUIRED_FIELDS.every((f) => fieldMap[f]) && !importing;

  return (
    <>
      {/* Export */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Export session history</div>
          <div className="settings-section__desc">
            Download your sessions as a CSV file. Optionally filter by date range
            or tag.
          </div>
        </div>
        <div className="settings-section__body">
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <div className="settings-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="settings-label">From</label>
              <input
                type="date"
                className="settings-input"
                value={exportFrom}
                onChange={(e) => setExportFrom(e.target.value)}
              />
            </div>
            <div className="settings-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="settings-label">To</label>
              <input
                type="date"
                className="settings-input"
                value={exportTo}
                onChange={(e) => setExportTo(e.target.value)}
              />
            </div>
            <div className="settings-field" style={{ flex: 1, minWidth: 140 }}>
              <label className="settings-label">Tag name (optional)</label>
              <input
                type="text"
                className="settings-input"
                placeholder="e.g. Coding"
                value={exportTag}
                onChange={(e) => setExportTag(e.target.value)}
              />
            </div>
          </div>
          <div className="settings-submit-row" style={{ marginTop: 16, paddingTop: 0, gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`settings-btn settings-btn--primary${exporting ? " settings-save-btn--loading" : ""}`}
              onClick={handleExport}
              disabled={exporting}>
              {exporting ? (
                <>
                  <span className="settings-spinner" /> Exporting…
                </>
              ) : (
                "Download CSV"
              )}
            </button>
            <button
              type="button"
              className={`settings-btn settings-btn--ghost${exporting ? " settings-save-btn--loading" : ""}`}
              onClick={handleExportAll}
              disabled={exporting}>
              Export everything
            </button>
          </div>
        </div>
      </div>

      {/* Drop zone / file card */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Import session history</div>
          <div className="settings-section__desc">
            Upload a <strong style={{ color: "var(--text)" }}>.csv</strong> or{" "}
            <strong style={{ color: "var(--text)" }}>.json</strong> file
            containing your past sessions. Up to 1,000 rows per import.
          </div>
        </div>
        <div className="settings-section__body">
          {!parsed ? (
            <div
              className={`import-dropzone${dragOver ? " import-dropzone--over" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }>
              <div className="import-dropzone__icon">📂</div>
              <div className="import-dropzone__text">
                Drop your file here, or{" "}
                <span className="import-dropzone__link">browse</span>
              </div>
              <div className="import-dropzone__hint">
                .csv or .json · max 1,000 rows
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json"
                style={{ display: "none" }}
                onChange={(e) => processFile(e.target.files?.[0])}
              />
            </div>
          ) : (
            <div className="import-file-card">
              <div className="import-file-card__icon">
                <span className="import-file-card__ext">
                  {file?.name.split(".").pop().toUpperCase()}
                </span>
              </div>
              <div className="import-file-card__meta">
                <div className="import-file-card__name">{file?.name}</div>
                <div className="import-file-card__sub">
                  {parsed.rows.length.toLocaleString()} rows
                  {" · "}auto-mapped {mappedCount} of {ALL_IMPORT_FIELDS.length}{" "}
                  fields
                </div>
              </div>
              <button
                type="button"
                className="import-file-card__remove"
                onClick={resetAll}
                title="Remove file">
                ✕
              </button>
            </div>
          )}
          {parseError && <p className="settings-error">{parseError}</p>}
        </div>

        {parsed && !importResult && (
          <div className="settings-submit-row">
            <button
              type="button"
              className={`settings-save-btn${importing ? " settings-save-btn--loading" : ""}`}
              onClick={handleImport}
              disabled={!canImport}>
              {importing ? (
                <>
                  <span className="settings-spinner" /> Importing…
                </>
              ) : (
                `Import ${parsed.rows.length.toLocaleString()} sessions`
              )}
            </button>
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={resetAll}
              disabled={importing}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {importResult && (
        <div className="settings-section">
          <div className="settings-section__header">
            <div className="settings-section__title">Import complete</div>
          </div>
          <div className="settings-section__body">
            <div className="import-result-grid">
              <div className="import-result-card import-result-card--ok">
                <div className="import-result-card__num">
                  {importResult.imported.toLocaleString()}
                </div>
                <div className="import-result-card__label">Imported</div>
              </div>
              <div className="import-result-card import-result-card--warn">
                <div className="import-result-card__num">
                  {(importResult.skipped ?? 0).toLocaleString()}
                </div>
                <div className="import-result-card__label">Skipped</div>
              </div>
              <div className="import-result-card import-result-card--err">
                <div className="import-result-card__num">
                  {(importResult.errors?.length ?? 0).toLocaleString()}
                </div>
                <div className="import-result-card__label">Errors</div>
              </div>
            </div>
            {importResult.errors?.length > 0 && (
              <div className="import-errors">
                <div className="import-errors__label">
                  Error details (first {importResult.errors.length})
                </div>
                <ul className="import-errors__list">
                  {importResult.errors.map((e, i) => (
                    <li key={i}>
                      <span className="import-errors__row">
                        Row {e.row + 1}
                      </span>
                      <span className="import-errors__reason">{e.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="settings-submit-row">
            <button
              type="button"
              className="settings-btn settings-btn--ghost"
              onClick={resetAll}>
              Import another file
            </button>
          </div>
        </div>
      )}

      {/* Format reference */}
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Expected format</div>
          <div className="settings-section__desc">
            Reference for building your import file.
          </div>
        </div>
        <div className="settings-section__body">
          <div className="import-format-table-wrap">
            <table className="import-format-table">
              <thead>
                <tr>
                  <th>Field</th>
                  <th>Required</th>
                  <th>Type</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {[
                  [
                    "startedAt",
                    true,
                    "ISO string",
                    "e.g. 2024-01-15T09:00:00Z",
                  ],
                  ["endedAt", true, "ISO string", "Must be after startedAt"],
                  [
                    "tag",
                    false,
                    "string",
                    "Tag name, creates automatically",
                  ],
                  ["category", false, "string", "Alias for tag"],
                  ["label", false, "string", "Short session label"],
                  ["notes", false, "string", "Free-form notes"],
                  ["keywords", false, "string", "Comma-separated in CSV"],
                ].map(([field, req, type, notes]) => (
                  <tr key={field}>
                    <td>
                      <code className="import-code">{field}</code>
                    </td>
                    <td>
                      {req ? (
                        <span style={{ color: "var(--color-error)" }}>
                          Required
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-faint)" }}>
                          Optional
                        </span>
                      )}
                    </td>
                    <td style={{ color: "var(--text-muted)" }}>{type}</td>
                    <td style={{ color: "var(--text-faint)", fontSize: 12 }}>
                      {notes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
