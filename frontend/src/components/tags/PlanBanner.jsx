import { TagIcon } from "@components/shared/Icons";

export function PlanBanner({ activeCount, activeTagLimit }) {
  return (
    <div className="plan-banner">
      <div className="plan-banner__icon">
        <TagIcon size={14} />
      </div>
      <div className="plan-banner__text">
        <strong>
          Your plan allows {activeCount}/{activeTagLimit} active tags.
        </strong>{" "}
        Upgrade for unlimited tags, archiving, and custom nested groups.
      </div>
      <a href="/pricing" className="plan-banner__cta">
        Upgrade →
      </a>
    </div>
  );
}
