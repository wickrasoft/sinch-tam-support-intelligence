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
import { formatDuration } from '../utils/metrics';

function MinutesTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {formatDuration(p.value)}
        </p>
      ))}
    </div>
  );
}

const SERIES = [
  { key: 'MTTA', label: 'MTTA', color: '#0284c7' },
  { key: 'MTTR', label: 'MTTR', color: '#0d9488' },
];

export default function ResponseTimeChart({ timeSeries, summary }) {
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
    MTTA: Math.round(p.avgMtta ?? 0),
    MTTR: Math.round(p.avgMttr ?? 0),
  }));

  return (
    <article className="panel">
      <header className="panel__header">
        <h2>MTTA & MTTR</h2>
        <p>Click legend toggles to show/hide series</p>
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
          <div className="response-stat">
            <span className="response-stat__label">Current MTTA</span>
            <span className="response-stat__value">{formatDuration(summary.avgMtta)}</span>
          </div>
        )}
        {visible.MTTR && (
          <div className="response-stat">
            <span className="response-stat__label">Current MTTR</span>
            <span className="response-stat__value">{formatDuration(summary.avgMttr)}</span>
          </div>
        )}
      </div>

      <div className="panel__chart">
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => formatDuration(v)} />
            <Tooltip content={<MinutesTooltip />} />
            {visible.MTTA && (
              <Line type="monotone" dataKey="MTTA" name="MTTA" stroke="#0284c7" strokeWidth={2} dot={{ r: 3 }} />
            )}
            {visible.MTTR && (
              <Line type="monotone" dataKey="MTTR" name="MTTR" stroke="#0d9488" strokeWidth={2} dot={{ r: 3 }} />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </article>
  );
}
