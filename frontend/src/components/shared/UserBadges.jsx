// Small display-only components for the users table in Admin.

export function PlanChip({ plan }) {
  return <span className={`plan-chip plan-chip--${plan}`}>{plan}</span>;
}

export function StatusDot({ active }) {
  return (
    <span className={`status-dot status-dot--${active ? "active" : "inactive"}`}>
      <span className="status-dot__circle" />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

export function InlineRoleBadge({ user }) {
  if (user.isDeveloper) return <span className="inline-role-badge inline-role-badge--dev">DEV</span>;
  if (user.isAdmin) return <span className="inline-role-badge inline-role-badge--admin">ADMIN</span>;
  return null;
}
