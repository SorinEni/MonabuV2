import Session from "#models/Session";

function escapeCsv(val) {
  if (val === null || val === undefined) return "";
  const str = String(val);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toRow(fields) {
  return fields.map(escapeCsv).join(",");
}

import Tag from "#models/Tag";

//   GET /api/export/csv
// Query: from, to, tagName
export async function exportCsv(req, res) {
  try {
    const { from, to, tagName } = req.query;
    const filter = { user: req.user._id, isRunning: false };

    if (tagName) {
      const tag = await Tag.findOne({
        user: req.user._id,
        name: { $regex: `^${tagName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
      }).lean();
      if (tag) filter.tag = tag._id;
    }
    if (from || to) {
      filter.startedAt = {};
      if (from) filter.startedAt.$gte = new Date(from);
      if (to) filter.startedAt.$lte = new Date(to);
    }

    const MAX_EXPORT_ROWS = 10000;
    const sessions = await Session.find(filter)
      .sort({ startedAt: -1 })
      .limit(MAX_EXPORT_ROWS)
      .populate("tag", "name color")
      .lean();

    const header = toRow([
      "Date",
      "Start Time",
      "End Time",
      "Tag",
      "Label",
      "Duration (min)",
      "Duration (h)",
      "Notes",
    ]);
    const rows = sessions.map((s) => {
      const start = new Date(s.startedAt);
      const end = s.endedAt ? new Date(s.endedAt) : null;
      const durMin = s.durationSeconds
        ? +(s.durationSeconds / 60).toFixed(2)
        : "";
      const durHours = s.durationSeconds
        ? +(s.durationSeconds / 3600).toFixed(4)
        : "";

      return toRow([
        start.toISOString().slice(0, 10),
        start.toISOString(),
        end?.toISOString() ?? "",
        s.tag?.name ?? "",
        s.label ?? "",
        durMin,
        durHours,
        s.notes ?? "",
      ]);
    });

    const csv = [header, ...rows].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="monabu-export-${Date.now()}.csv"`,
    );
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
