import Stepper from "./Stepper";
import Toggle from "./Toggle";
import { POMO_FIELDS } from "@constants/pomodoroSettings";

const CYCLE_FIELDS = [
  {
    label: "Sessions per cycle",
    desc: "Number of work sessions before a long break.",
    key: "totalSessions",
    min: 1,
    max: 20,
  },
  {
    label: "Long break every",
    desc: "Take a long break after this many sessions.",
    key: "longBreakEvery",
    min: 0,
    max: 10,
    unit: "sessions",
  },
];

export default function PomodoroTab({
  pomoSettings,
  setPomoSettings,
  pomoLoading,
  onSave,
}) {
  return (
    <>
      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Timer durations</div>
          <div className="settings-section__desc">
            Customise the length of each Pomodoro phase.
          </div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          {POMO_FIELDS.map(({ label, desc, key, min, max, unit }) => (
            <div className="settings-row" key={key}>
              <div className="settings-row__left">
                <div className="settings-row__label">{label}</div>
                <div className="settings-row__desc">{desc}</div>
              </div>
              <div className="settings-row__right">
                <Stepper
                  value={pomoSettings[key]}
                  onChange={(v) => setPomoSettings((p) => ({ ...p, [key]: v }))}
                  min={min}
                  max={max}
                  unit={unit}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Cycle settings</div>
          <div className="settings-section__desc">
            Configure how many sessions make a full cycle.
          </div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          {CYCLE_FIELDS.map(({ label, desc, key, min, max, unit }) => (
            <div className="settings-row" key={key}>
              <div className="settings-row__left">
                <div className="settings-row__label">{label}</div>
                <div className="settings-row__desc">{desc}</div>
              </div>
              <div className="settings-row__right">
                <Stepper
                  value={pomoSettings[key]}
                  onChange={(v) => setPomoSettings((p) => ({ ...p, [key]: v }))}
                  min={min}
                  max={max}
                  unit={unit}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="settings-section">
        <div className="settings-section__header">
          <div className="settings-section__title">Auto-start</div>
          <div className="settings-section__desc">
            Automatically begin the next phase without clicking Start.
          </div>
        </div>
        <div className="settings-section__body" style={{ gap: 0 }}>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Auto-start breaks</div>
              <div className="settings-row__desc">
                Start break timer automatically when work ends.
              </div>
            </div>
            <div className="settings-row__right">
              <Toggle
                id="auto-break"
                checked={pomoSettings.autoStartBreak}
                onChange={(v) =>
                  setPomoSettings((p) => ({ ...p, autoStartBreak: v }))
                }
              />
            </div>
          </div>
          <div className="settings-row">
            <div className="settings-row__left">
              <div className="settings-row__label">Auto-start work</div>
              <div className="settings-row__desc">
                Resume work timer automatically after a break.
              </div>
            </div>
            <div className="settings-row__right">
              <Toggle
                id="auto-work"
                checked={pomoSettings.autoStartWork}
                onChange={(v) =>
                  setPomoSettings((p) => ({ ...p, autoStartWork: v }))
                }
              />
            </div>
          </div>
        </div>
      </div>

      <div className="settings-submit-row">
        <button
          type="button"
          className={`settings-save-btn${pomoLoading ? " settings-save-btn--loading" : ""}`}
          onClick={onSave}
          disabled={pomoLoading}>
          {pomoLoading ? (
            <>
              <span className="settings-spinner" /> Saving…
            </>
          ) : (
            "Save Pomodoro settings"
          )}
        </button>
      </div>
    </>
  );
}
