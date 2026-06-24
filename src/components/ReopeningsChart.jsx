import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function ReopenStat({ value, label, onDrilldown }) {
  return (
    <button
      type="button"
      className="reopen-highlight__stat reopen-highlight__stat--clickable"
      onClick={() => onDrilldown?.(KPI_KEYS.REOPENINGS)}
      title="Click to view reopened tickets"
    >
      <span className="reopen-highlight__value">{value}</span>
      <span className="reopen-highlight__label">{label}</span>
    </button>
  );
}

export default function ReopeningsChart({ timeSeries, summary, onDrilldown }) {
  const data = timeSeries.map((p) => ({
    label: p.label,
    reopenings: p.reopenings,
    tickets: p.ticketsWithReopens,
  }));

  return (
    <article className="panel">
      <header className="panel__header">
        <h2>Ticket Reopenings</h2>
      </header>

      <div className="reopen-highlight">
        <ReopenStat
          value={summary.reopenings}
          label="Reopen events in period"
          onDrilldown={onDrilldown}
        />
        <ReopenStat
          value={summary.ticketsWithReopens}
          label="Tickets with ≥1 reopen"
          onDrilldown={onDrilldown}
        />
      </div>

      <div className="panel__chart">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Bar
              dataKey="reopenings"
              fill="#be185d"
              name="Reopen Events"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
