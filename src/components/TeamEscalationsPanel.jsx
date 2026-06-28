import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import {
  PARTNER_TEAM_COLORS,
  getTeamLinkDistribution,
  getTeamLinkTotals,
} from '../utils/teamLinks';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const total = row.__total ?? 0;
  const pct = total > 0 ? ((row.value / total) * 100).toFixed(1) : '0';

  return (
    <div className="region-chart__tooltip">
      <strong>{row.team}</strong>
      <span>{row.value} ticket{row.value !== 1 ? 's' : ''} ({pct}%)</span>
      <span>JIRA project: {row.project}</span>
    </div>
  );
}

export default function TeamEscalationsPanel({ tickets, onDrilldown }) {
  const distribution = useMemo(() => getTeamLinkDistribution(tickets), [tickets]);
  const sliceTotal = useMemo(
    () => distribution.reduce((sum, row) => sum + row.value, 0),
    [distribution],
  );
  const { ticketsWithLinks } = useMemo(() => getTeamLinkTotals(tickets), [tickets]);
  const chartData = useMemo(
    () => distribution.map((row) => ({ ...row, __total: sliceTotal })),
    [distribution, sliceTotal],
  );

  const handleDrilldown = (team) => {
    if (!team || !onDrilldown) return;
    onDrilldown(KPI_KEYS.TEAM_LINKS, { team });
  };

  const handlePieClick = (entry) => {
    handleDrilldown(entry?.team ?? entry?.payload?.team);
  };

  return (
    <article className="panel region-panel panel--chart-drilldown">
      <header className="panel__header">
        <h2>Escalations (JIRA)</h2>
        <span className="panel__subtitle" style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
          Escalations matching the current filters
        </span>
      </header>

      {sliceTotal === 0 ? (
        <p className="region-panel__filter-note" style={{ padding: '1rem 1.1rem' }}>
          No tickets in this view are linked to other teams.
        </p>
      ) : (
        <div className="region-panel__body region-panel__body--vertical">
          <div className="region-panel__chart">
            <div className={`region-chart ${onDrilldown ? 'region-chart--drilldown' : ''}`}>
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="team"
                    cx="50%"
                    cy="50%"
                    innerRadius={78}
                    outerRadius={134}
                    paddingAngle={2}
                    stroke="none"
                    isAnimationActive={false}
                    cursor={onDrilldown ? 'pointer' : 'default'}
                    onClick={handlePieClick}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.team}
                        fill={PARTNER_TEAM_COLORS[entry.team] ?? '#64748b'}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="region-chart__center" style={{ width: 156, height: 156 }}>
                <span className="region-chart__center-value">{ticketsWithLinks}</span>
                <span className="region-chart__center-label">Linked tickets</span>
              </div>
            </div>
          </div>

          <ul className="tam-region-legend tam-region-legend--stacked">
            {distribution.slice(0, 6).map((row) => {
              const pct = sliceTotal
                ? ((row.value / sliceTotal) * 100).toFixed(0)
                : '0';
              return (
                <li key={row.team}>
                  <button
                    type="button"
                    className="tam-region-legend__item"
                    onClick={() => handleDrilldown(row.team)}
                    title={`View tickets linked to ${row.team}`}
                  >
                    <span
                      className="tam-region-legend__swatch"
                      style={{ background: PARTNER_TEAM_COLORS[row.team] ?? '#64748b' }}
                    />
                    <span className="tam-region-legend__label">{row.team}</span>
                    <span className="tam-region-legend__meta">{row.project}</span>
                    <span className="tam-region-legend__connector" aria-hidden="true" />
                    <span className="tam-region-legend__value">{row.value}</span>
                    <span className="tam-region-legend__pct">{pct}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </article>
  );
}
