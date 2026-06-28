import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { STATUS_PAGE_URL, HISTORY_URL, isActiveIncident } from '../utils/sinchIncidents';

// Statuspage impact → colour. Yellow = "minor" on status.sinch.com.
const IMPACT_META = {
  minor: { label: 'Minor', color: '#f59e0b' },
  major: { label: 'Major', color: '#f97316' },
  critical: { label: 'Critical', color: '#ef4444' },
  none: { label: 'Maintenance', color: '#64748b' },
};

const STATUS_LABELS = {
  investigating: 'Investigating',
  identified: 'Identified',
  monitoring: 'Monitoring',
  resolved: 'Resolved',
  postmortem: 'Postmortem',
  scheduled: 'Scheduled',
  in_progress: 'In progress',
  verifying: 'Verifying',
  completed: 'Completed',
};

const MAX_VISIBLE = 8;

function relativeTime(iso) {
  if (!iso) return '';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return '';
  }
}

function absoluteTime(iso) {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d, HH:mm');
  } catch {
    return '';
  }
}

export default function SinchIncidentsPanel({ incidents = [], status = 'loading', updatedAt = null, activeCount = 0, onRetry }) {
  // Active incidents always come first (and are never truncated away) so the
  // visible list always matches the active count in the subtitle.
  const activeIncidents = incidents.filter(isActiveIncident);
  const resolvedIncidents = incidents.filter((i) => !isActiveIncident(i));
  const visible = [
    ...activeIncidents,
    ...resolvedIncidents.slice(0, Math.max(0, MAX_VISIBLE - activeIncidents.length)),
  ];

  return (
    <article className="panel sinc-inc">
      <header className="panel__header sinc-inc__header">
        <div className="sinc-inc__title-row">
          <h2 className="sinc-inc__title">
            <span className="sinc-inc__swatch" aria-hidden="true" />
            Ongoing/Recent Incidents
          </h2>
          <span className="sinc-inc__source" title="Live from status.sinch.com">
            status.sinch.com
          </span>
        </div>
        <p className="sinc-inc__subtitle">
          Incidents · {activeCount} Active
          {updatedAt ? ` · updated ${format(updatedAt, 'HH:mm')}` : ''}
          {' · '}
          <a href={STATUS_PAGE_URL} target="_blank" rel="noopener noreferrer" className="sinc-inc__link">
            Status Page ↗
          </a>
        </p>
      </header>

      {status === 'loading' && (
        <p className="sinc-inc__empty">Loading incidents from status.sinch.com…</p>
      )}

      {status === 'error' && (
        <p className="sinc-inc__empty sinc-inc__empty--error">
          Couldn’t reach status.sinch.com.{' '}
          <button type="button" className="sinc-inc__retry" onClick={onRetry}>Retry</button>
          {' · '}
          <a href={HISTORY_URL} target="_blank" rel="noopener noreferrer" className="sinc-inc__link">
            Open status page ↗
          </a>
        </p>
      )}

      {status === 'ready' && visible.length === 0 && (
        <p className="sinc-inc__empty">No minor-impact incidents reported. 🎉</p>
      )}

      {status === 'ready' && visible.length > 0 && (
        <ul className="sinc-inc__list">
          {visible.map((inc) => {
            const impact = IMPACT_META[inc.impact] ?? IMPACT_META.minor;
            const isResolved = !isActiveIncident(inc);
            const components = (inc.components ?? []).map((c) => c.name).filter(Boolean);
            const startedIso = inc.started_at ?? inc.created_at;
            const endedIso = inc.resolved_at;
            return (
              <li key={inc.id} className="sinc-inc__item">
                <span
                  className="sinc-inc__dot"
                  style={{ background: impact.color }}
                  title={`${impact.label} impact`}
                  aria-hidden="true"
                />
                <div className="sinc-inc__body">
                  <a
                    href={inc.shortlink ?? HISTORY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sinc-inc__name"
                  >
                    {inc.name}
                  </a>
                  {components.length > 0 && (
                    <span className="sinc-inc__components" title={components.join(', ')}>
                      {components.slice(0, 3).join(', ')}
                      {components.length > 3 ? ` +${components.length - 3}` : ''}
                    </span>
                  )}
                  <span className="sinc-inc__times">
                    <span className="sinc-inc__times-item">
                      <span className="sinc-inc__times-label">Start:</span>{' '}
                      {absoluteTime(startedIso)}
                    </span>
                    {isResolved && endedIso && (
                      <span className="sinc-inc__times-item">
                        <span className="sinc-inc__times-label">End:</span>{' '}
                        {absoluteTime(endedIso)}
                      </span>
                    )}
                  </span>
                </div>
                <div className="sinc-inc__meta">
                  <span
                    className={`sinc-inc__status sinc-inc__status--${isResolved ? 'resolved' : 'active'}`}
                  >
                    {STATUS_LABELS[inc.status] ?? inc.status}
                  </span>
                  <span className="sinc-inc__time" title={startedIso}>
                    {relativeTime(startedIso)}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
