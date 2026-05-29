import AppShell from "@components/layout/AppShell";
import DayDrawer from "@components/analytics/DayDrawer";
import HeatmapGrid from "@components/analytics/HeatmapGrid";
import BarChart from "@components/analytics/BarChart";
import { StatCard } from "@components/analytics/StatCard";
import { StreakCard } from "@components/analytics/StreakCard";
import { InsightRow } from "@components/analytics/InsightRow";
import { TagBreakdown } from "@components/analytics/TagBreakdown";
import { GoalRing } from "@components/analytics/GoalRing";
import { CalendarCard } from "@components/analytics/CalendarCard";
import { PeriodPicker } from "@components/analytics/PeriodPicker";
import { Skeleton } from "@components/analytics/Skeleton";
import { useAnalytics } from "@hooks/useAnalytics";
import { formatHoursFull, formatDuration } from "@utils/formatters";
import PageHeader from "@components/shared/PageHeader";
import "@styles/Analytics.css";

export default function AnalyticsPage() {
  const {
    period,
    setPeriod,
    overview,
    byTag,
    streaks,
    weekly,
    heatmap,
    hasHeatmap,
    loading,
    error,
    drawerDate,
    advanced,
    setAdvanced,
    handleDayClick,
    handleDrawerClose,
  } = useAnalytics();

  return (
    <AppShell>
      <div className="page-shell page-shell--wide">
      <div className="analytics-header">
        <div className="analytics-header__left">
          <PageHeader page="Analytics" subtitle="Your learning at a glance" />
        </div>
        <div className="analytics-header__right">
          <button
            className={`analytics-mode-toggle${advanced ? " analytics-mode-toggle--on" : ""}`}
            onClick={() => setAdvanced((v) => !v)}
            title={advanced ? "Switch to simple view" : "Switch to advanced view"}>
            {advanced ? "Simple" : "Advanced"}
          </button>
        </div>
      </div>

      {!loading && overview && streaks && <InsightRow overview={overview} streaks={streaks} />}

      {error && <div className="analytics-error">{error}</div>}

      <div className="analytics-body">
        <div className="analytics-top-row">
          <div className="analytics-left-panel">
            <div className="analytics-stats-row">
              {loading
                ? [0, 1, 2, 3].map((i) => (
                    <div key={i} className="stat-card">
                      <Skeleton h={68} />
                    </div>
                  ))
                : overview && (
                    <>
                      <StatCard
                        label="Today"
                        value={formatHoursFull(overview.today?.hours)}
                        sub={`${overview.today?.sessions ?? 0} sessions`}
                      />
                      <StatCard
                        label="This Week"
                        value={formatHoursFull(overview.thisWeek?.hours)}
                      />
                      <StatCard
                        label="This Month"
                        value={formatHoursFull(overview.thisMonth?.hours)}
                      />
                      <StatCard
                        label="This Year"
                        value={formatHoursFull(overview.thisYear?.hours)}
                      />
                    </>
                  )}
            </div>

            <div className="analytics-mid-row">
              <div className="analytics-card analytics-card--goal">
                <div className="analytics-card__header">
                  <div className="analytics-card__title">Weekly Goal</div>
                </div>
                {loading || !overview ? (
                  <div className="analytics-card__body">
                    <Skeleton h={100} />
                  </div>
                ) : (
                  <GoalRing
                    progressPct={overview.weekGoal?.progressPct}
                    targetHours={overview.weekGoal?.targetHours}
                    currentHours={overview.thisWeek?.hours}
                  />
                )}
              </div>

              <div className="analytics-card analytics-card--streak">
                <div className="analytics-card__header">
                  <div className="analytics-card__title">Streaks</div>
                </div>
                {loading || !streaks ? (
                  <div className="analytics-card__body">
                    <Skeleton h={60} />
                  </div>
                ) : (
                  <StreakCard streaks={streaks} avgSession={overview?.avgSession} />
                )}
              </div>
            </div>

            <div className="analytics-card analytics-card--weekly">
              <div className="analytics-card__header">
                <div className="analytics-card__title">Weekly Hours</div>
                <div className="analytics-card__sub">Last 12 weeks</div>
              </div>
              {loading || !weekly ? (
                <div className="analytics-card__body">
                  <Skeleton h={90} />
                </div>
              ) : (
                <BarChart weeks={weekly} goalHours={overview?.weekGoal?.targetHours} />
              )}
            </div>
          </div>

          <div className="analytics-card analytics-card--calendar">
            <div className="analytics-card__header">
              <div className="analytics-card__title">Monthly Calendar</div>
              <div className="analytics-card__sub">Click a day to explore</div>
            </div>
            {loading ? (
              <div className="analytics-card__body">
                <Skeleton h={280} />
              </div>
            ) : !hasHeatmap ? (
              <div className="heatmap-locked">
                <CalendarCard heatmapData={[]} onDayClick={handleDayClick} />
                <div className="heatmap-locked-overlay">
                  <span>🔒 Upgrade to unlock the activity calendar</span>
                </div>
              </div>
            ) : (
              <CalendarCard heatmapData={heatmap} onDayClick={handleDayClick} />
            )}
          </div>
        </div>

        {advanced && !loading && overview && (
          <>
            <div className="analytics-card analytics-card--heatmap">
              <div className="analytics-card__header">
                <div className="analytics-card__title">Activity Heatmap</div>
                <div className="analytics-card__sub">Last 365 days · click any active cell</div>
              </div>
              {loading ? (
                <div className="analytics-card__body">
                  <Skeleton h={96} />
                </div>
              ) : !hasHeatmap ? (
                <div className="heatmap-locked">
                  <HeatmapGrid data={[]} onDayClick={handleDayClick} />
                  <div className="heatmap-locked-overlay">
                    <span>🔒 Upgrade to unlock the full activity heatmap</span>
                  </div>
                </div>
              ) : (
                <HeatmapGrid data={heatmap} onDayClick={handleDayClick} />
              )}
            </div>

            <div className="analytics-stats-row analytics-stats-row--advanced">
              <StatCard
                label="Best Day"
                value={overview.bestDay ? formatHoursFull(overview.bestDay.hours) : "—"}
                sub={overview.bestDay ? overview.bestDay.date : "No sessions yet"}
              />
              <StatCard
                label="Worst Day"
                value={overview.worstDay ? formatHoursFull(overview.worstDay.hours) : "—"}
                sub={overview.worstDay ? overview.worstDay.date : "No sessions yet"}
              />
              <StatCard
                label="Best Week"
                value={overview.bestWeek ? formatHoursFull(overview.bestWeek.hours) : "—"}
                sub={
                  overview.bestWeek
                    ? `Week ${overview.bestWeek.week}, ${overview.bestWeek.year}`
                    : "No sessions yet"
                }
              />
              <StatCard
                label="Worst Week"
                value={overview.worstWeek ? formatHoursFull(overview.worstWeek.hours) : "—"}
                sub={
                  overview.worstWeek
                    ? `Week ${overview.worstWeek.week}, ${overview.worstWeek.year}`
                    : "No sessions yet"
                }
              />
              <StatCard
                label="Best Month"
                value={overview.bestMonth ? formatHoursFull(overview.bestMonth.hours) : "—"}
                sub={
                  overview.bestMonth
                    ? `${new Date(overview.bestMonth.year, overview.bestMonth.month - 1).toLocaleString("default", { month: "long" })} ${overview.bestMonth.year}`
                    : "No sessions yet"
                }
              />
              <StatCard
                label="Worst Month"
                value={overview.worstMonth ? formatHoursFull(overview.worstMonth.hours) : "—"}
                sub={
                  overview.worstMonth
                    ? `${new Date(overview.worstMonth.year, overview.worstMonth.month - 1).toLocaleString("default", { month: "long" })} ${overview.worstMonth.year}`
                    : "No sessions yet"
                }
              />
              <StatCard
                label="All-Time"
                value={formatHoursFull(overview.allTime?.hours)}
                sub={`${overview.allTime?.sessions ?? 0} sessions`}
                accent
              />
            </div>

            <div className="analytics-stats-row analytics-stats-row--advanced analytics-stats-row--extra">
              <StatCard
                label="Avg Session"
                value={
                  overview.avgSession?.minutes ? `${overview.avgSession.minutes} min` : "—"
                }
                sub={
                  overview.avgSession?.seconds
                    ? formatDuration(overview.avgSession.seconds)
                    : "No sessions yet"
                }
              />
              <StatCard
                label="Total Sessions"
                value={overview.allTime?.sessions ?? 0}
                sub={
                  overview.allTime?.hours
                    ? `${formatHoursFull(overview.allTime.hours)} total`
                    : "No sessions yet"
                }
              />
              <StatCard
                label="Best Streak"
                value={
                  streaks?.longest
                    ? `${streaks.longest} day${streaks.longest !== 1 ? "s" : ""}`
                    : "—"
                }
                sub={streaks?.todayDone ? "Keep it going" : "Log today to start a streak"}
              />
            </div>

            <div className="analytics-card analytics-card--tags">
              <div className="analytics-card__header">
                <div className="analytics-card__title">Time by Tag</div>
                <PeriodPicker value={period} onChange={setPeriod} />
              </div>
              {loading || !byTag ? (
                <div className="analytics-card__body">
                  <Skeleton h={120} />
                </div>
              ) : byTag.length === 0 ? (
                <div className="analytics-empty">No sessions logged for this period yet.</div>
              ) : (
                <TagBreakdown data={byTag} />
              )}
            </div>
          </>
        )}
      </div>
      </div>{/* /page-shell */}

      {drawerDate && <DayDrawer date={drawerDate} onClose={handleDrawerClose} />}
    </AppShell>
  );
}
