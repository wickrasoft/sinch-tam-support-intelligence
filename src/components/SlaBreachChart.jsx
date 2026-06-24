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
import { KPI_KEYS } from '../utils/kpiDrilldown';

function getBarPayload(event) {
  return event?.payload ?? event;
}

export default function SlaBreachChart({ accountData, timeSeries, onDrilldown, embedded = false }) {
  const breachByAccount = accountData
    .map((a) => ({
      name: a.account_name.length > 14 ? a.account_name.slice(0, 12) + '…' : a.account_name,
      accountId: a.account_id,
      accountName: a.account_name,
      breaches: a.metrics.slaBreaches,
      rate: Number(a.metrics.slaBreachRate.toFixed(1)),
    }))
    .sort((a, b) => b.breaches - a.breaches);

  const trend = timeSeries.map((p) => ({
    label: p.label,
    date: p.date,
    breaches: p.slaBreaches,
    rate: Number(p.slaBreachRate.toFixed(1)),
  }));

  const openAccountDrilldown = (event) => {
    const row = getBarPayload(event);
    if (!row?.accountId || !onDrilldown) return;
    onDrilldown(KPI_KEYS.SLA, { accountId: row.accountId });
  };

  const openTrendDrilldown = (event) => {
    const row = getBarPayload(event);
    if (!row?.date || !onDrilldown || !row.breaches) return;
    onDrilldown(KPI_KEYS.SLA, { bucketDate: row.date, bucketLabel: row.label });
  };

  const barHeight = embedded ? 100 : 220;
  const trendHeight = embedded ? 72 : 180;
  const Tag = embedded ? 'div' : 'article';
  const rootClass = embedded ? 'sla-breach-section' : 'panel panel--chart-drilldown';

  return (
    <Tag className={rootClass}>
      <header className={embedded ? 'sla-breach-section__header' : 'panel__header'}>
        <h2>SLA Breaches</h2>
        {!embedded && <p>First-response and resolution SLA violations · click to drill down</p>}
      </header>

      <div className={`panel__chart ${embedded ? 'panel__chart--compact' : ''}`}>
        <h3 className="panel__chart-title">Breaches by Account</h3>
        <ResponsiveContainer width="100%" height={barHeight}>
          <BarChart data={breachByAccount} layout="vertical" margin={{ top: 8, right: 24, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
            <Tooltip
              formatter={(v, name) => [v, name === 'rate' ? 'Breach %' : 'Breaches']}
              labelFormatter={(_, payload) => payload?.[0]?.payload?.accountName ?? ''}
            />
            <Bar
              dataKey="breaches"
              fill="#7c3aed"
              name="SLA Breaches"
              radius={[0, 4, 4, 0]}
              cursor={onDrilldown ? 'pointer' : 'default'}
              onClick={openAccountDrilldown}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={`panel__chart ${embedded ? 'panel__chart--compact' : ''}`}>
        <h3 className="panel__chart-title">Breach Rate Trend (%)</h3>
        <ResponsiveContainer width="100%" height={trendHeight}>
          <LineChart data={trend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 12 }} unit="%" />
            <Tooltip formatter={(v) => [`${v}%`, 'Breach Rate']} />
            <Line
              type="monotone"
              dataKey="rate"
              stroke="#7c3aed"
              strokeWidth={2}
              dot={{ r: 3, cursor: onDrilldown ? 'pointer' : 'default' }}
              activeDot={{ r: 5, cursor: onDrilldown ? 'pointer' : 'default', onClick: openTrendDrilldown }}
              onClick={openTrendDrilldown}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Tag>
  );
}
