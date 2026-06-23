import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function PriorityChart({ data, accountData }) {
  const topAccounts = accountData.slice(0, 6).map((a) => ({
    name: a.account_name.split(' ')[0],
    P1: a.metrics.p1Count,
    P2: a.metrics.p2Count,
  }));

  return (
    <article className="panel">
      <header className="panel__header">
        <h2>P1 / P2 Tickets</h2>
        <p>Critical & high priority volume by account and over time</p>
      </header>

      <div className="panel__chart">
        <h3 className="panel__chart-title">By Account (Top 6)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={topAccounts} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="P1" fill="#dc2626" name="P1 Critical" radius={[4, 4, 0, 0]} />
            <Bar dataKey="P2" fill="#f97316" name="P2 High" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel__chart">
        <h3 className="panel__chart-title">Trend Over Time</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="p1Count" fill="#dc2626" name="P1" stackId="a" />
            <Bar dataKey="p2Count" fill="#f97316" name="P2" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
