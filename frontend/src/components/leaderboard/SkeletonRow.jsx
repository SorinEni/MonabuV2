export function SkeletonRow({ index }) {
  return (
    <div className="lb-row lb-row--skeleton" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="lb-row__rank">
        <div className="skeleton" style={{ width: 20, height: 16 }} />
      </div>
      <div className="lb-row__avatar-wrap">
        <div className="lb-row__avatar skeleton" style={{ border: "none" }} />
      </div>
      <div className="lb-row__info">
        <div className="lb-row__name-line">
          <div className="skeleton" style={{ width: `${55 + (index % 3) * 12}%`, height: 14 }} />
        </div>
        <div className="skeleton" style={{ width: "40%", height: 11, marginTop: 5 }} />
      </div>
      <div className="lb-row__bar-wrap">
        <div className="skeleton" style={{ width: `${25 + (index % 5) * 12}%`, height: 4, borderRadius: 4 }} />
      </div>
      <div className="lb-row__hours">
        <div className="skeleton" style={{ width: 42, height: 16 }} />
      </div>
      <div className="skeleton" style={{ width: 54, height: 28, borderRadius: 20 }} />
    </div>
  );
}
