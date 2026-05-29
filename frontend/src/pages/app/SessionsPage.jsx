import AppShell from "@components/layout/AppShell";
import SessionCard from "@components/sessions/SessionCard";
import { SessionEditModal, SessionAddModal, SessionDeleteModal } from "@components/sessions/SessionEditModal";
import SessionFilters from "@components/sessions/SessionFilters";
import { DayGroup } from "@components/sessions/DayGroup";
import { DayView } from "@components/sessions/DayView";
import { SkeletonGroup } from "@components/sessions/SkeletonGroup";
import { useSessionsPage } from "@hooks/useSessionsPage";
import PageHeader from "@components/shared/PageHeader";
import "@styles/Sessions.css";

export default function SessionsPage() {
  const {
    view,
    setView,
    sessions,
    total,
    page,
    setPage,
    loading,
    loadingMore,
    error,
    search,
    setSearch,
    debouncedSearch,
    editTarget,
    setEditTarget,
    deleteTarget,
    setDeleteTarget,
    addOpen,
    setAddOpen,
    dayRefreshKey,
    allTags,
    tagFilter,
    handleTagFilterChange,
    groupMode,
    setGroupMode,
    groups,
    hasMore,
    handleEdit,
    handleDelete,
    handleSaved,
    handleDeleted,
    handleCreated,
  } = useSessionsPage();

  return (
    <AppShell>
      <div className="page-shell page-shell--wide">
      <div className="ss-header">
        <div className="ss-header__left">
          <PageHeader page="Sessions" subtitle="Your complete tracking history." />
        </div>
        <div className="ss-header__actions">
          <div className="ss-view-tabs">
            <button
              className={`ss-view-tab${view === "all" ? " ss-view-tab--active" : ""}`}
              onClick={() => setView("all")}>
              All sessions
            </button>
            <button
              className={`ss-view-tab${view === "day" ? " ss-view-tab--active" : ""}`}
              onClick={() => setView("day")}>
              Today
            </button>
          </div>
          <button className="ss-log-btn" onClick={() => setAddOpen(true)}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
            Log session
          </button>
        </div>
      </div>

      {view === "all" ? (
        <>
          <SessionFilters
            search={search}
            onSearch={setSearch}
            total={total}
            loading={loading}
            tags={allTags}
            tagFilter={tagFilter}
            onTagFilterChange={handleTagFilterChange}
            groupMode={groupMode}
            onGroupModeChange={setGroupMode}
          />
          {error && (
            <div className="ss-error">
              <span>⚠</span> {error}
            </div>
          )}
          {loading ? (
            <>
              <SkeletonGroup />
              <SkeletonGroup />
            </>
          ) : groups.length === 0 ? (
            <div className="ss-empty">
              <div className="ss-empty__icon">⏱</div>
              <div className="ss-empty__title">
                {debouncedSearch || tagFilter ? "No sessions match your filters" : "No sessions yet"}
              </div>
              <div className="ss-empty__sub">
                {debouncedSearch || tagFilter
                  ? "Try adjusting your filters."
                  : "Start tracking to see your sessions here."}
              </div>
            </div>
          ) : (
            <>
              {groups.map(([periodKey, daySessions]) => (
                <DayGroup
                  key={periodKey}
                  mode={groupMode}
                  periodKey={periodKey}
                  sessions={daySessions}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
              {hasMore && (
                <div className="ss-load-more">
                  <button
                    className="ss-load-more__btn"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={loadingMore}>
                    {loadingMore ? "Loading…" : `Load more (${total - sessions.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <DayView onEdit={handleEdit} onDelete={handleDelete} refreshKey={dayRefreshKey} tagFilter={tagFilter} />
      )}
      </div>{/* /page-shell */}

      {addOpen && <SessionAddModal onClose={() => setAddOpen(false)} onCreated={handleCreated} />}
      {editTarget && (
        <SessionEditModal
          session={editTarget}
          onClose={() => setEditTarget(null)}
          onSave={handleSaved}
        />
      )}
      {deleteTarget && (
        <SessionDeleteModal
          session={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </AppShell>
  );
}
