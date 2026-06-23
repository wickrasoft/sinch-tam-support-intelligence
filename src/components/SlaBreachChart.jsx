import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

export default function SlaBreachChart({ accountData, timeSeries }) {
  const breachByAccount = accountData
    .map((a) => ({
      name: a.account_name.length > 14 ? a.account_name.slice(0, 12) + '…' : a.account_name,
      breaches: a.metrics.slaBreaches,
      rate: Number(a.metrics.slaBreachRate.toFixed(1)),
    }))
    .sort((a, b) => b.breaches - a.breaches);

  const trend = timeSeries.map((p) => ({
    label: p.label,
    breaches: p.slaBreaches,
    rate: Number(p.slaBreachRate.toFixed(1)),
  }));

  return (
    <article className="panel">
      <header className="panel__header">
        <h2>SLA Breaches</h2>
        <p>First-response and resolution SLA violations per account</p>
      </header>

      <div className="panel__chart">
        <h3 className="panel__chart-title">Breaches by Account</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={breachByAccount} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip formatter={(v, name) => [v, name === 'rate' ? 'Breach %' : 'Breaches']} />
            <Bar dataKey="breaches" fill="#7c3aed" name="SLA Breaches" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="panel__chart">
        <h3 className="panel__chart-title">Breach Rate Trend (%)</h3>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Breach Rate']} />
            <Line type="monotone" dataKey="rate" stroke="#7c3aed" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
