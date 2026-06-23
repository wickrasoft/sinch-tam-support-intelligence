import { formatDuration } from '../utils/metrics';
import { format, parseISO } from 'date-fns';

const DISPOSITION_LABELS = {
  in_progress: 'In Progress',
  waiting_for_response: 'WFR',
  temp_resolution: 'Temp Resolution',
  closed: 'Closed',
  escalated: 'Escalated',
};

export default function TicketsNeedingAttention({ tickets, onSelectTicket, onViewAll }) {
  if (!tickets.length) {
    return (
      <article className="panel attention-panel attention-panel--clear">
        <header className="panel__header">
          <h2>Tickets Needing Attention</h2>
          <p>No open tickets flagged for immediate TAM action</p>
        </header>
        <div className="at-risk-empty">
          <span className="at-risk-empty__icon">✓</span>
          <p>All clear — no P1/P2, SLA breaches, escalations, or stale items in view.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="panel attention-panel">
      <header className="panel__header panel__header--row">
        <div>
          <h2>Tickets Needing Attention</h2>
          <p>{tickets.length} ticket{tickets.length !== 1 ? 's' : ''} flagged · P1/P2, SLA breach, escalated, WFR, temp resolution, reopened</p>
        </div>
        <button type="button" className="panel__action" onClick={onViewAll}>
          View all in Tickets →
        </button>
      </header>

      <div className="attention-list">
        {tickets.slice(0, 12).map((t) => (
          <button
            key={t.id}
            type="button"
            className="attention-item"
            onClick={() => onSelectTicket?.(t)}
          >
            <div className="attention-item__top">
              <span className={`priority priority--${t.priority.toLowerCase()}`}>{t.priority}</span>
              <span className="attention-item__id mono">#{t.zendesk_id}</span>
              <span className="attention-item__disp">{DISPOSITION_LABELS[t.disposition] ?? t.disposition}</span>
            </div>
            <p className="attention-item__subject">{t.subject}</p>
            <div className="attention-item__meta">
              <span>{t.account_name}</span>
              <span>{t.tam_name}</span>
              <span>{format(parseISO(t.created_at), 'MMM d, yyyy')}</span>
              {t.sinch?.product && <span className="badge badge--sinch">{t.sinch.product}</span>}
              {t.sla.any_breach && <span className="badge badge--breach">SLA</span>}
            </div>
            <div className="attention-item__reasons">
              {t.attention_reasons?.slice(0, 3).map((r) => (
                <span key={r} className="attention-item__tag">{r}</span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </article>
  );
}

export { DISPOSITION_LABELS };
