import { useState } from 'react';
import { useSinchMonitor, MONITOR_RANGES } from '../hooks/useSinchMonitor';

const MONITOR_URL = 'https://monitor.sinch.com/';

const OVERALL_LABEL = {
  operational: 'All systems operational',
  degraded: 'Degraded performance',
  down: 'Service disruption',
  unknown: 'Status unavailable',
};

function fmtTime(date) {
  if (!date) return '—';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function fmtAvailability(value) {
  if (value == null) return '—';
  const rounded = Math.round(value * 100) / 100;
  return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(2);
}

function fmtAgo(iso) {
  if (!iso) return null;
  const diffMs = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(diffMs)) return null;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'less than a minute ago';
  if (mins === 1) return '1 minute ago';
  if (mins < 60) return `${mins} minutes ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs === 1) return '1 hour ago';
  if (hrs < 24) return `${hrs} hours ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

const STATE_GLYPH = { operational: '✓', degraded: '!', down: '✕', unknown: '?' };

function fmtAxis(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function HistoryBars({ bins }) {
  if (!bins || bins.length === 0) return null;
  const maxAvg = Math.max(1, ...bins.map((b) => b.avg || 0));
  // Axis ticks at the first bin, ~6h/12h/18h marks, then "now".
  const tickCount = 4;
  const ticks = [];
  for (let i = 0; i < tickCount; i += 1) {
    const idx = Math.round((i / tickCount) * (bins.length - 1));
    ticks.push(fmtAxis(bins[idx].start));
  }

  return (
    <div className="sinc-mon__hist">
      <div className="sinc-mon__bars">
        {bins.map((b, i) => {
          const h = b.state === 'empty' ? 8 : Math.max(8, Math.round((b.avg / maxAvg) * 100));
          return (
            <span
              key={i}
              className={`sinc-mon__hbar sinc-mon__hbar--${b.state}`}
              style={{ height: `${h}%` }}
              title={`${fmtAxis(b.start)} · ${Math.round(b.avg)} ms`}
            />
          );
        })}
      </div>
      <div className="sinc-mon__axis">
        {ticks.map((t, i) => <span key={i}>{t}</span>)}
        <span>now</span>
      </div>
    </div>
  );
}

function CheckCard({ check }) {
  const ago = fmtAgo(check.updatedAt);
  return (
    <li className={`sinc-mon__card sinc-mon__card--${check.state}`}>
      <div className="sinc-mon__card-top">
        <div className="sinc-mon__card-id">
          <span className={`sinc-mon__icon sinc-mon__icon--${check.state}`} aria-hidden="true">
            {STATE_GLYPH[check.state] ?? '?'}
          </span>
          <div className="sinc-mon__card-titles">
            <span className="sinc-mon__card-name" title={check.name}>{check.name}</span>
            <span className="sinc-mon__card-meta">
              <span className="sinc-mon__type-badge">{check.type}</span>
              {ago && <span className="sinc-mon__ago">{ago}</span>}
            </span>
          </div>
        </div>
        <div className="sinc-mon__avail">
          <span className="sinc-mon__avail-label">Availability</span>
          <span className="sinc-mon__avail-value">
            {fmtAvailability(check.availability30d)}<span className="sinc-mon__avail-pct"> %</span>
          </span>
        </div>
      </div>

      {check.bins?.length > 0 ? (
        <HistoryBars bins={check.bins} />
      ) : (
        <div className="sinc-mon__bar" title={`30-day availability ${fmtAvailability(check.availability30d)}%`}>
          <span
            className={`sinc-mon__bar-fill sinc-mon__bar-fill--${check.state}`}
            style={{ width: `${Math.min(100, check.availability30d ?? 0)}%` }}
          />
        </div>
      )}
    </li>
  );
}

// Native rendering of Sinch's external uptime checks. Data comes from the same
// public Checkly API that powers monitor.sinch.com, so we keep the dashboard's
// own styling instead of embedding the branded third-party page.
export default function SinchMonitorPanel() {
  const [range, setRange] = useState('24h');
  const { checks, summary, overall, status, updatedAt } = useSinchMonitor(range);

  const passing = summary?.totalPassing ?? checks.filter((c) => c.state === 'operational').length;
  const total = summary?.total ?? checks.length;

  return (
    <article className="panel sinc-mon">
      <header className="panel__header sinc-mon__header">
        <div className="sinc-mon__title-row">
          <h2 className="sinc-mon__title">
            <span className={`sinc-mon__swatch sinc-mon__swatch--${overall}`} aria-hidden="true" />
            Uptime Monitoring
          </h2>
          <span className="sinc-mon__source" title="Live from monitor.sinch.com">
            monitor.sinch.com
          </span>
        </div>
        <p className="sinc-mon__subtitle">
          {status === 'ready'
            ? `${OVERALL_LABEL[overall]} · ${passing}/${total} checks · updated ${fmtTime(updatedAt)}`
            : status === 'error'
              ? 'Unable to reach monitor.sinch.com'
              : 'Loading external uptime checks…'}
          {' · '}
          <a href={MONITOR_URL} target="_blank" rel="noopener noreferrer" className="sinc-mon__link">
            Open monitor ↗
          </a>
        </p>
        <div className="sinc-mon__ranges" role="group" aria-label="History range">
          {MONITOR_RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              className={`sinc-mon__range${range === r.key ? ' sinc-mon__range--active' : ''}`}
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </header>

      <div className="sinc-mon__body">
        <div className="sinc-mon__scroll">
          {status === 'error' && (
            <p className="sinc-mon__empty">
              Couldn’t load uptime data right now. <a href={MONITOR_URL} target="_blank" rel="noopener noreferrer" className="sinc-mon__link">View on monitor.sinch.com ↗</a>
            </p>
          )}
          {status === 'loading' && (
            <p className="sinc-mon__empty">Loading external uptime checks…</p>
          )}
          {status === 'ready' && (
            <ul className="sinc-mon__list">
              {checks.map((check) => <CheckCard key={check.id} check={check} />)}
            </ul>
          )}
        </div>
      </div>
    </article>
  );
}
