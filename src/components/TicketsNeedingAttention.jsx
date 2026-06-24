import AttentionTicketCard from './AttentionTicketCard';

export { DISPOSITION_LABELS } from './AttentionTicketCard';

export default function TicketsNeedingAttention({ tickets, onSelectTicket, onOpenDrilldown }) {
  if (!tickets.length) {
    return (
      <article className="panel alert-panel attention-panel attention-panel--clear">
        <header className="panel__header">
          <h2>Tickets Needing Attention</h2>
          <p>No open tickets flagged for immediate TAM action</p>
        </header>
        <div className="alert-panel__empty">
          <span className="alert-panel__empty-icon">✓</span>
          <p>All clear — no P1/P2, SLA breaches, escalations, or stale items in view.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="panel alert-panel attention-panel">
      <header className="panel__header">
        <div className="alert-panel__title-row">
          <h2>Tickets Needing Attention</h2>
          {onOpenDrilldown ? (
            <button
              type="button"
              className="alert-panel__count alert-panel__count--clickable alert-panel__count--attention"
              onClick={onOpenDrilldown}
              title="View all tickets needing attention"
              aria-label={`View all ${tickets.length} tickets needing attention`}
            >
              {tickets.length}
            </button>
          ) : (
            <span className="alert-panel__count">{tickets.length}</span>
          )}
        </div>
      </header>

      <div className="alert-panel__scroll alert-panel__scroll--full">
        {tickets.map((t) => (
          <AttentionTicketCard key={t.id} ticket={t} onClick={onSelectTicket} />
        ))}
      </div>
    </article>
  );
}
