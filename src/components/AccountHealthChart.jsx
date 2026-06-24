import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

function HealthTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{row.name}</p>
      <p className="chart-tooltip__row">
        <span>Health Score</span>
        <strong>{row.score}/100</strong>
      </p>
    </div>
  );
}

const CHART_CURSOR_FILL = 'rgba(51, 65, 85, 0.45)';
const ROW_HEIGHT = 34;
const BAR_SIZE = 16;
const CHART_VERTICAL_PADDING = 38;

function getChartHeight(rowCount, rowHeight = ROW_HEIGHT) {
  return Math.max(240, rowCount * rowHeight + CHART_VERTICAL_PADDING);
}

function getYAxisWidth(names) {
  const longest = names.reduce((max, name) => Math.max(max, name.length), 0);
  return Math.min(220, Math.max(132, Math.ceil(longest * 6.5) + 16));
}

function AccountYAxisTick({ x, y, payload }) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill="currentColor"
      fontSize={12}
      className="account-health-chart__y-tick"
    >
      {payload.value}
    </text>
  );
}

export default function AccountHealthChart({ accountMetrics, onAccountDrilldown }) {
  const data = [...accountMetrics]
    .sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))
    .map((a) => ({
      id: a.account_id,
      name: a.account_name,
      score: a.healthScore ?? 0,
      color: a.health?.color ?? '#94a3b8',
    }));

  const yAxisWidth = getYAxisWidth(data.map((row) => row.name));
  const chartHeight = getChartHeight(data.length);

  return (
    <article className="panel panel--chart-drilldown account-health-chart">
      <header className="panel__header">
        <h2>Account Health Score - SLA, CSAT, Reopenings and P1/P2 Volume</h2>
      </header>

      <div className="panel__chart account-health-chart__canvas">
        <h3 className="panel__chart-title account-health-chart__title">
          All Accounts
          <span className="account-health-chart__note">{data.length} accounts</span>
        </h3>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
            barCategoryGap="28%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis
              type="category"
              dataKey="name"
              width={yAxisWidth}
              tick={AccountYAxisTick}
              interval={0}
            />
            <Tooltip content={<HealthTooltip />} cursor={{ fill: CHART_CURSOR_FILL }} />
            <Bar
              dataKey="score"
              name="Health Score"
              radius={[0, 4, 4, 0]}
              barSize={BAR_SIZE}
              cursor="pointer"
              onClick={(entry) => onAccountDrilldown?.(entry?.payload?.id ?? entry?.id)}
            >
              {data.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="health-legend">
        <span><i style={{ background: '#059669' }} /> 80+ Healthy</span>
        <span><i style={{ background: '#10b981' }} /> 65–79 Stable</span>
        <span><i style={{ background: '#f59e0b' }} /> 50–64 Watch</span>
        <span><i style={{ background: '#ef4444' }} /> &lt;50 At Risk</span>
      </div>
    </article>
  );
}
