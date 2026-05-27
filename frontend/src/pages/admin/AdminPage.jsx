import AppShell from "@components/layout/AppShell";
import { formatNum } from "@utils/formatters";
import { resolveAvatarUrl, getUserInitials } from "@utils/avatar";
import { useAdmin } from "@hooks/useAdmin";
import {
  ALL_PLANS,
  TABS,
  StatCard,
  PlanChip,
  Toast,
  ConfirmModal,
  EditUserPanel,
  DefaultTagsPanel,
  CustomCommandsPanel,
  CountryCell,
  InlineRoleBadge,
  StatusDot,
} from "@components/admin";
import {
  AdminSearchIcon,
  UserIcon,
  SessionIcon,
  HoursIcon,
  LiveIcon,
  AdminTagIcon,
  PencilIcon,
} from "@components/shared/Icons";
import "@styles/Admin.css";

export default function AdminPage() {
  const {
    currentUser,
    isDev,
    activeTab,
    setActiveTab,
    stats,
    statsLoading,
    users,
    total,
    pages,
    page,
    setPage,
    planFilter,
    setPlanFilter,
    tableLoading,
    toast,
    setToast,
    confirm,
    setConfirm,
    pendingRows,
    editTarget,
    setEditTarget,
    handleSearch,
    showToast,
    handleToggleActive,
    handleEditSave,
  } = useAdmin();

  if (!currentUser?.isAdmin && !currentUser?.isDeveloper) return null;

  const knownPlans = stats
    ? [...new Set([...ALL_PLANS, ...Object.keys(stats.users.plans)])]
    : ALL_PLANS;

  return (
    <AppShell>
      <div className="admin">
        <div className="admin__header">
          <div className="admin__breadcrumb">
            <span>Monabu</span>
            <span className="admin__breadcrumb-sep">/</span>
            <span>Admin</span>
            {editTarget && (
              <>
                <span className="admin__breadcrumb-sep">/</span>
                <span>Edit user</span>
              </>
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 4,
            }}>
            <h1 className="admin__title" style={{ marginBottom: 0 }}>
              Admin Dashboard
            </h1>
            {isDev ? (
              <span
                className="inline-role-badge inline-role-badge--dev"
                style={{ fontSize: 11, padding: "3px 10px" }}>
                DEV
              </span>
            ) : (
              <span
                className="inline-role-badge inline-role-badge--admin"
                style={{ fontSize: 11, padding: "3px 10px" }}>
                ADMIN
              </span>
            )}
          </div>
          <p className="admin__subtitle">
            {isDev
              ? "You have Developer access — full platform control including role management and default tags."
              : "Manage users, plans, and platform-wide settings."}
          </p>
        </div>

        {editTarget ? (
          <EditUserPanel
            targetUser={editTarget}
            currentUser={currentUser}
            currentUserIsDev={isDev}
            showToast={showToast}
            onSave={(updates, devRoleGrant, directOverride) =>
              handleEditSave(
                editTarget._id,
                updates,
                devRoleGrant,
                directOverride,
              )
            }
            onCancel={() => setEditTarget(null)}
          />
        ) : (
          <>
            {statsLoading ? (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(4,1fr)",
                  gap: 16,
                  marginBottom: 32,
                }}>
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 96, borderRadius: 12 }}
                  />
                ))}
              </div>
            ) : stats ? (
              <div className="admin__stats">
                <StatCard
                  label="Total Users"
                  value={formatNum(stats.users.total)}
                  sub={`+${formatNum(stats.users.new7d)} this week`}
                  accentColor="var(--accent)"
                  icon={<UserIcon size={11} />}
                />
                <StatCard
                  label="Active (30d)"
                  value={formatNum(stats.users.active30d)}
                  sub={`${formatNum(stats.users.active1d)} active today`}
                  accentColor="var(--color-success)"
                  icon={<LiveIcon size={11} />}
                />
                <StatCard
                  label="Sessions Total"
                  value={formatNum(stats.sessions.total)}
                  sub={`${formatNum(stats.sessions.runningNow)} running now`}
                  accentColor="#a5b4fc"
                  icon={<SessionIcon size={11} />}
                />
                <StatCard
                  label="Hours Logged"
                  value={`${formatNum(stats.sessions.totalHours)}h`}
                  sub={`${formatNum(stats.sessions.hours30d)}h in last 30d`}
                  accentColor="#f9a8d4"
                  icon={<HoursIcon size={11} />}
                />
              </div>
            ) : (
              <div className="admin__empty" style={{ marginBottom: 32 }}>
                Could not load stats.
              </div>
            )}

            {stats && (
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 32,
                  flexWrap: "wrap",
                }}>
                {knownPlans.map((key) => {
                  const val = stats.users.plans[key] ?? 0;
                  return (
                    <button
                      key={key}
                      className={`plan-filter-pill${planFilter === key ? " plan-filter-pill--active" : ""}`}
                      onClick={() => {
                        setPage(1);
                        setPlanFilter((prev) => (prev === key ? "" : key));
                        setActiveTab(TABS.USERS);
                      }}
                      title={`Filter by ${key} plan`}>
                      <PlanChip plan={key} />
                      <span className="plan-filter-pill__count">
                        {formatNum(val)}
                      </span>
                      <span className="plan-filter-pill__label">users</span>
                    </button>
                  );
                })}
                {planFilter && (
                  <button
                    className="plan-filter-pill plan-filter-pill--clear"
                    onClick={() => {
                      setPage(1);
                      setPlanFilter("");
                    }}>
                    ✕ Clear filter
                  </button>
                )}
              </div>
            )}

            <div className="admin__tabs">
              <button
                className={`admin__tab${activeTab === TABS.USERS ? " admin__tab--active" : ""}`}
                onClick={() => setActiveTab(TABS.USERS)}>
                <UserIcon size={12} /> Users
                <span className="admin__tab-count">{formatNum(total)}</span>
              </button>
              {isDev && (
                <>
                  <button
                    className={`admin__tab${activeTab === TABS.TAGS ? " admin__tab--active" : ""}`}
                    onClick={() => setActiveTab(TABS.TAGS)}>
                    <AdminTagIcon size={12} /> Default Tags
                  </button>
                  <button
                    className={`admin__tab${activeTab === TABS.COMMANDS ? " admin__tab--active" : ""}`}
                    onClick={() => setActiveTab(TABS.COMMANDS)}>
                    <span style={{ fontSize: 14, lineHeight: 1 }}>⌘</span>{" "}
                    Custom Commands
                    <span
                      className="admin__tab-count"
                      style={{
                        background: "rgba(251,191,36,0.1)",
                        borderColor: "rgba(251,191,36,0.2)",
                        color: "#fbbf24",
                      }}>
                      DEV
                    </span>
                  </button>
                </>
              )}
            </div>

            {activeTab === TABS.USERS && (
              <div>
                <div className="admin__toolbar">
                  <div className="admin__search-wrap">
                    <span className="admin__search-icon">
                      <AdminSearchIcon />
                    </span>
                    <input
                      className="admin__search"
                      placeholder="Search by name, email, or username…"
                      onChange={handleSearch}
                    />
                  </div>
                </div>

                <div className="admin__table-wrap">
                  {tableLoading ? (
                    <div className="admin__loading">
                      <div className="admin__spinner" />
                      Loading users…
                    </div>
                  ) : users.length === 0 ? (
                    <div className="admin__empty">No users found.</div>
                  ) : (
                    <table className="admin__table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Plan</th>
                          <th>Status</th>
                          <th>Joined</th>
                          <th>IP / Country</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u) => {
                          const isPending = !!pendingRows[u._id];
                          const isSelf = u._id === currentUser?._id;
                          const isTargetDev = u.isDeveloper;
                          const canEdit = isSelf || !isTargetDev || isDev;

                          return (
                            <tr
                              key={u._id}
                              className={isTargetDev ? "row--developer" : ""}>
                              <td>
                                <div className="user-cell">
                                  <div
                                    className={`user-cell__avatar${isTargetDev ? " user-cell__avatar--developer" : ""}`}>
                                    {resolveAvatarUrl(u.avatar) ? (
                                      <img
                                        src={resolveAvatarUrl(u.avatar)}
                                        alt=""
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                          borderRadius: "inherit",
                                          display: "block",
                                        }}
                                        onError={(e) => {
                                          e.currentTarget.style.display =
                                            "none";
                                        }}
                                      />
                                    ) : (
                                      getUserInitials(u)
                                    )}
                                  </div>
                                  <div>
                                    <div className="user-cell__name">
                                      {u.name || u.username || "—"}
                                      <InlineRoleBadge user={u} />
                                      {isSelf && (
                                        <span className="inline-role-badge inline-role-badge--self">
                                          you
                                        </span>
                                      )}
                                    </div>
                                    <div className="user-cell__email">
                                      {u.email}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td>
                                <PlanChip plan={u.plan} />
                              </td>

                              <td>
                                <StatusDot active={u.isActive} />
                              </td>

                              <td
                                style={{
                                  color: "var(--text-faint)",
                                  fontVariantNumeric: "tabular-nums",
                                  fontSize: 12.5,
                                }}>
                                {new Date(u.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>

                              <td>
                                <CountryCell
                                  ip={u.lastIp}
                                  countryCode={u.countryCode}
                                  countryName={u.countryName}
                                />
                              </td>

                              <td>
                                <div className="admin__actions-cell">
                                  {canEdit && (
                                    <button
                                      className="action-btn"
                                      disabled={isPending}
                                      title={
                                        isSelf
                                          ? "Edit your profile"
                                          : "Edit user"
                                      }
                                      onClick={() => setEditTarget(u)}>
                                      <PencilIcon size={11} /> Edit
                                    </button>
                                  )}

                                  {!isSelf && (!isTargetDev || isDev) && (
                                    <button
                                      className={`action-btn${u.isActive ? " action-btn--danger" : ""}`}
                                      disabled={isPending}
                                      title={
                                        u.isActive
                                          ? "Deactivate account"
                                          : "Reactivate account"
                                      }
                                      onClick={() => handleToggleActive(u)}>
                                      {u.isActive
                                        ? "Deactivate"
                                        : "Reactivate"}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}

                  {!tableLoading && pages > 1 && (
                    <div className="admin__pagination">
                      <span>
                        Page {page} of {pages} · {formatNum(total)} users
                      </span>
                      <div className="admin__pagination-btns">
                        <button
                          className="pagination-btn"
                          disabled={page <= 1}
                          onClick={() => setPage((p) => p - 1)}>
                          ← Prev
                        </button>
                        <button
                          className="pagination-btn"
                          disabled={page >= pages}
                          onClick={() => setPage((p) => p + 1)}>
                          Next →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === TABS.TAGS && isDev && (
              <DefaultTagsPanel showToast={showToast} />
            )}

            {activeTab === TABS.COMMANDS && isDev && (
              <CustomCommandsPanel showToast={showToast} />
            )}
          </>
        )}

        {confirm && (
          <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />
        )}

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onDone={() => setToast(null)}
          />
        )}
      </div>
    </AppShell>
  );
}
