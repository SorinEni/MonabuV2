export function SkeletonGroup() {
  return (
    <section className="ss-day">
      <div className="ss-day__header ss-day__header--skeleton">
        <span className="skeleton" style={{ width: 120, height: 14 }} />
        <span className="skeleton" style={{ width: 60, height: 12, marginLeft: "auto" }} />
      </div>
      <div className="ss-day__rows">
        {[80, 60, 90].map((w, i) => (
          <div key={i} className="ss-row ss-row--skeleton">
            <span className="skeleton" style={{ width: 80, height: 12 }} />
            <span className="skeleton" style={{ width: w, height: 20, borderRadius: 100 }} />
            <span className="skeleton" style={{ width: "40%", height: 12 }} />
            <span className="skeleton" style={{ width: 48, height: 12, marginLeft: "auto" }} />
          </div>
        ))}
      </div>
    </section>
  );
}
