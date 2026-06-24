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

export default function AccountHealthChart({ accountMetrics, onAccountDrilldown }) {
  const data = [...accountMetrics]
    .sort((a, b) => (a.healthScore ?? 0) - (b.healthScore ?? 0))
    .map((a) => ({
      id: a.account_id,
      name: a.account_name.length > 16 ? a.account_name.slice(0, 14) + '…' : a.account_name,
      score: a.healthScore ?? 0,
      color: a.health?.color ?? '#94a3b8',
    }));

  return (
    <article className="panel panel--chart-drilldown">
      <header className="panel__header">
        <h2>Account Health Score - Composite score (0–100) from SLA, CSAT, reopenings, and P1/P2 volume</h2>
      </header>

      <div className="panel__chart">
        <ResponsiveContainer width="100%" height={Math.max(220, data.length * 36)}>
          <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={110} />
            <Tooltip content={<HealthTooltip />} cursor={{ fill: CHART_CURSOR_FILL }} />
            <Bar
              dataKey="score"
              name="Health Score"
              radius={[0, 4, 4, 0]}
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
