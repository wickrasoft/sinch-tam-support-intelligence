import { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatDurationHours } from '../utils/metrics';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function MinutesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatDurationHours(p.value)}
        </p>
      ))}
    </div>
  );
}

const SERIES = [
  { key: 'MTTA', label: 'MTTA', color: '#0284c7' },
  { key: 'MTTR', label: 'MTTR', color: '#0d9488' },
];

export default function ResponseTimeChart({ timeSeries, summary, onDrilldown }) {
  const [visible, setVisible] = useState({ MTTA: true, MTTR: true });

  const toggle = (key) => {
    setVisible((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      if (!next.MTTA && !next.MTTR) return prev;
      return next;
    });
  };

  const data = timeSeries.map((p) => ({
    label: p.label,
    date: p.date,
    MTTA: Math.round(p.avgMtta ?? 0),
    MTTR: Math.round(p.avgMttr ?? 0),
  }));

  const openDrilldown = (kpiKey, bucket) => {
    if (!onDrilldown) return;
    if (bucket?.date) {
      onDrilldown(kpiKey, { bucketDate: bucket.date, bucketLabel: bucket.label });
      return;
    }
    onDrilldown(kpiKey);
  };

  return (
    <article className="panel panel--chart-drilldown">
      <header className="panel__header">
        <h2>MTTA &amp; MTTR - Response and resolution times</h2>
      </header>

      <div className="series-toggles">
        {SERIES.map((s) => (
          <button
            key={s.key}
            type="button"
            className={`series-toggle ${visible[s.key] ? 'series-toggle--active' : 'series-toggle--off'}`}
            style={{ '--series-color': s.color }}
            onClick={() => toggle(s.key)}
          >
            <span className="series-toggle__dot" />
            {s.label}
            {visible[s.key] ? ' ✓' : ' (hidden)'}
          </button>
        ))}
      </div>

      <div className="response-summary">
        {visible.MTTA && (
          <button
            type="button"
            className="response-stat response-stat--clickable"
            onClick={() => openDrilldown(KPI_KEYS.MTTA)}
          >
            <span className="response-stat__label">Current MTTA</span>
            <span className="response-stat__value">{formatDurationHours(summary.avgMtta)}</span>
          </button>
        )}
        {visible.MTTR && (
          <button
            type="button"
            className="response-stat response-stat--clickable"
            onClick={() => openDrilldown(KPI_KEYS.MTTR)}
          >
            <span className="response-stat__label">Current MTTR</span>
            <span className="response-stat__value">{formatDurationHours(summary.avgMttr)}</span>
          </button>
        )}
      </div>

      <div className="panel__chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => formatDurationHours(v)} />
            <Tooltip content={<MinutesTooltip />} />
            {visible.MTTA && (
              <Line
                type="monotone"
                dataKey="MTTA"
                name="MTTA"
                stroke="#0284c7"
                strokeWidth={2}
                dot={{ r: 3, cursor: onDrilldown ? 'pointer' : 'default' }}
                activeDot={{
                  r: 5,
                  cursor: onDrilldown ? 'pointer' : 'default',
                  onClick: (_, index) => openDrilldown(KPI_KEYS.MTTA, data[index]),
                }}
              />
            )}
            {visible.MTTR && (
              <Line
                type="monotone"
                dataKey="MTTR"
                name="MTTR"
                stroke="#0d9488"
                strokeWidth={2}
                dot={{ r: 3, cursor: onDrilldown ? 'pointer' : 'default' }}
                activeDot={{
                  r: 5,
                  cursor: onDrilldown ? 'pointer' : 'default',
                  onClick: (_, index) => openDrilldown(KPI_KEYS.MTTR, data[index]),
                }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
