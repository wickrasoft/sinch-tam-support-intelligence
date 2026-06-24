import { format, parseISO } from 'date-fns';

export const DISPOSITION_LABELS = {
  in_progress: 'In Progress',
  waiting_for_response: 'WFR',
  temp_resolution: 'Temp Resolution',
  closed: 'Closed',
  escalated: 'Escalated',
};

export default function AttentionTicketCard({ ticket, onClick }) {
  return (
    <button
      type="button"
      className="alert-card alert-card--ticket"
      onClick={() => onClick?.(ticket)}
    >
      <div className="alert-card__head">
        <div className="alert-card__title-block">
          <div className="alert-card__ticket-top">
            <span className={`priority priority--${ticket.priority.toLowerCase()}`}>{ticket.priority}</span>
            <span className="alert-card__id mono">#{ticket.zendesk_id}</span>
          </div>
          <p className="alert-card__subject">{ticket.subject}</p>
        </div>
        <span className="alert-card__badge">
          {DISPOSITION_LABELS[ticket.disposition] ?? ticket.disposition}
        </span>
      </div>

      <div className="alert-card__meta">
        <span>{ticket.account_name}</span>
        <span className="alert-card__meta-sep">·</span>
        <span>{ticket.tam_name}</span>
        <span className="alert-card__meta-sep">·</span>
        <span>{format(parseISO(ticket.created_at), 'MMM d, yyyy')}</span>
      </div>

      <div className="alert-card__tags">
        {ticket.sinch?.product && <span className="badge badge--sinch">{ticket.sinch.product}</span>}
        {ticket.sla.any_breach && <span className="badge badge--breach">SLA</span>}
        {ticket.attention_reasons?.slice(0, 3).map((r) => (
          <span key={r} className="alert-card__tag">{r}</span>
        ))}
      </div>
    </button>
  );
}
