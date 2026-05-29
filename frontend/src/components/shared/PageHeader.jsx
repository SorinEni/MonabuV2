/**
 * PageHeader — consistent breadcrumb + title + subtitle across all app pages.
 *
 *   <PageHeader page="Tags" subtitle="Organise your sessions into subjects." />
 *
 * Renders:
 *   MONABU / TAGS        ← breadcrumb (page portion tinted accent)
 *   Tags                 ← serif title
 *   Organise your …      ← muted subtitle
 */
export default function PageHeader({ page, title, subtitle, children }) {
  return (
    <div className="page-header">
      <div className="page-header__breadcrumb">
        <span>Monabu</span>
        <span className="page-header__breadcrumb-sep">/</span>
        <span className="page-header__breadcrumb-page">{page}</span>
      </div>
      <h1 className="page-header__title">{title ?? page}</h1>
      {subtitle && <p className="page-header__sub">{subtitle}</p>}
      {children}
    </div>
  );
}
