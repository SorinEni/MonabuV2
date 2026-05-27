export function PeriodPicker({ value, onChange }) {
  const options = ["7d", "30d", "90d", "all"];
  const labels = { "7d": "7 days", "30d": "30 days", "90d": "90 days", all: "All time" };
  return (
    <div className="period-picker">
      {options.map((o) => (
        <button
          key={o}
          className={`period-picker__btn${value === o ? " period-picker__btn--active" : ""}`}
          onClick={() => onChange(o)}>
          {labels[o]}
        </button>
      ))}
    </div>
  );
}
