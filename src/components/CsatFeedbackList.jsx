import { format, parseISO } from 'date-fns';
import { csatIndicator, getCsatRatedAt } from '../utils/metrics';

export function getCsatRatedTickets(tickets) {
  return tickets
    .filter((t) => t.csat?.rated && t.csat?.score != null)
    .sort((a, b) => {
      const aDate = getCsatRatedAt(a)?.getTime() ?? 0;
      const bDate = getCsatRatedAt(b)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

export default function CsatFeedbackList({
  tickets,
  onOpenTicket,
  limit,
  emptyMessage = 'No CSAT responses in the selected period.',
}) {
  const rated = getCsatRatedTickets(tickets);
  const shown = limit != null ? rated.slice(0, limit) : rated;

  if (shown.length === 0) {
    return <p className="csat-feedback-list__empty muted">{emptyMessage}</p>;
  }

  return (
    <div className="csat-feedback-list">
      {shown.map((ticket) => {
        const ind = csatIndicator(ticket.csat.score);
        const ratedAt = getCsatRatedAt(ticket);

        return (
          <button
            key={ticket.id}
            type="button"
            className="csat-feedback-item"
            onClick={() => onOpenTicket?.(ticket)}
            title="Click to view ticket"
          >
            <span
              className={`csat-feedback-item__score csat-feedback-item__score--${ind.level}`}
              style={{ color: ind.color }}
            >
              {ticket.csat.score}/5
            </span>
            <div className="csat-feedback-item__body">
              <span className="csat-feedback-item__meta">
                #{ticket.zendesk_id} · {ticket.account_name} · {ticket.tam_name}
                {ratedAt ? ` · ${format(ratedAt, 'MMM d, yyyy')}` : ''}
              </span>
              <p className="csat-feedback-item__comment">
                {ticket.csat.comment
                  ? `"${ticket.csat.comment}"`
                  : 'No comment provided'}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
