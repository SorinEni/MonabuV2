import AppShell from "@components/layout/AppShell";
import {
  CreateTagForm,
  DraggableTagList,
  PlanBanner,
  ColHeaders,
  EmptyState,
  ArchivedSubSection,
  TagRow,
} from "@components/tags";
import { useTagsPage } from "@hooks/useTagsPage";
import PageHeader from "@components/shared/PageHeader";
import { SearchIcon } from "@components/shared/Icons";
import "@styles/Tags.css";

export default function TagsPage() {
  const {
    isLimited,
    activeTagLimit,
    loading,
    error,
    search,
    setSearch,
    activeUserCount,
    atLimit,
    activeUserList,
    activeDefaultList,
    userTags,
    defaultTags,
    q,
    fetchTags,
    handleCreated,
    handleUpdate,
    handleDelete,
    handleSubTagsChange,
    handleReorder,
  } = useTagsPage();

  return (
    <AppShell>
      <div className="page-shell page-shell--wide">
      <div className="tags-page">
        <div className="tags-header">
          <div className="tags-header__left">
            <PageHeader page="Tags" subtitle="Organise your sessions into subjects, projects, or skills." />
          </div>
          <div className="tags-header__right">
            <div className="tags-search-wrap">
              <span className="tags-search-icon">
                <SearchIcon size={14} />
              </span>
              <input
                className="tags-search"
                placeholder="Search tags…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {atLimit && <PlanBanner activeCount={activeUserCount} activeTagLimit={activeTagLimit} />}

        {error && (
          <div className="tags-error">
            {error} —{" "}
            <button onClick={fetchTags} className="tags-error__retry">
              Retry
            </button>
          </div>
        )}

        <section className="tags-section">
          <div className="tags-section__header">
            <div className="tags-section__meta">
              <span className="tags-section__title">My Tags</span>
              <span className="tags-section__count">{activeUserList.length}</span>
              {isLimited && <span className="tags-section__limit">/ {activeTagLimit}</span>}
            </div>
            <CreateTagForm onCreated={handleCreated} atLimit={atLimit} />
          </div>

          <ColHeaders />

          {loading ? (
            <div className="tags-skeleton">
              {[1, 2, 3].map((i) => (
                <div key={i} className="tags-skeleton__row skeleton" />
              ))}
            </div>
          ) : activeUserList.length === 0 ? (
            <EmptyState
              filtered={!!q}
              message="No custom tags yet. Create your first one above."
            />
          ) : (
            <DraggableTagList
              tags={activeUserList}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReorder={handleReorder}
              onSubTagsChange={handleSubTagsChange}
            />
          )}

          {!loading && (
            <ArchivedSubSection
              tags={userTags}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSubTagsChange={handleSubTagsChange}
              isDefault={false}
              q={q}
            />
          )}
        </section>

        <section className="tags-section tags-section--defaults">
          <div className="tags-section__header">
            <div className="tags-section__meta">
              <span className="tags-section__title">Default Tags</span>
              <span className="tags-section__count">{activeDefaultList.length}</span>
            </div>
            <span className="tags-section__hint">
              Provided by the platform · cannot be deleted
            </span>
          </div>

          <ColHeaders />

          {loading ? (
            <div className="tags-skeleton">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="tags-skeleton__row skeleton" />
              ))}
            </div>
          ) : activeDefaultList.length === 0 ? (
            <EmptyState filtered={!!q} message="All default tags are archived." />
          ) : (
            <ul className="tag-list">
              {activeDefaultList.map((tag) => (
                <TagRow
                  key={tag._id}
                  tag={tag}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                  onSubTagsChange={handleSubTagsChange}
                  isDefault
                />
              ))}
            </ul>
          )}

          {!loading && (
            <ArchivedSubSection
              tags={defaultTags}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onSubTagsChange={handleSubTagsChange}
              isDefault={true}
              q={q}
            />
          )}
        </section>
      </div>{/* /tags-page */}
      </div>{/* /page-shell */}
    </AppShell>
  );
}
