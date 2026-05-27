export function StatusDot({ active }) {
  return (
    <span className={`status-dot status-dot--${active ? "active" : "inactive"}`}>
      <span className="status-dot__circle" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}
