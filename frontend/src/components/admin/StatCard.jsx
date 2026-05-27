export function StatCard({ label, value, sub, accentColor, icon }) {
  return (
    <div className="admin-stat">
      <div className="admin-stat__accent-line" style={{ background: accentColor }} />
      <div className="admin-stat__label">
        {icon} {label}
      </div>
      <div className="admin-stat__value">{value ?? "—"}</div>
      {sub && <div className="admin-stat__sub">{sub}</div>}
    </div>
  );
}
