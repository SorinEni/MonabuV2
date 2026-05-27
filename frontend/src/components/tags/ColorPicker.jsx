import { PRESET_COLORS } from "@constants/tagColors";

function ColorDot({ color, selected, onClick }) {
  return (
    <button
      className={`color-dot${selected ? " color-dot--selected" : ""}`}
      style={{ background: color }}
      onClick={onClick}
      title={color}
    />
  );
}

export function ColorPicker({ value, onChange }) {
  return (
    <div className="color-picker">
      {PRESET_COLORS.map((c) => (
        <ColorDot key={c} color={c} selected={value === c} onClick={() => onChange(c)} />
      ))}
    </div>
  );
}
