import { PLAN_BADGE } from "./constants";

export function RoleBadge({ entry }) {
  if (entry.isDeveloper) return <span className="lb-role-badge lb-role-badge--dev">DEV</span>;
  if (entry.isAdmin) return <span className="lb-role-badge lb-role-badge--admin">ADMIN</span>;
  const plan = PLAN_BADGE[entry.plan];
  if (plan) return <span className={`lb-role-badge ${plan.cls}`}>{plan.label}</span>;
  return null;
}
