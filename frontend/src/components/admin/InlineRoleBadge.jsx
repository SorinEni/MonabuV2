export function InlineRoleBadge({ user }) {
  if (user.isDeveloper)
    return <span className="inline-role-badge inline-role-badge--dev">DEV</span>;
  if (user.isAdmin)
    return <span className="inline-role-badge inline-role-badge--admin">ADMIN</span>;
  return null;
}
