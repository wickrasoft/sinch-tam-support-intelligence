import { useEffect, useMemo, useState } from 'react';
import AttentionTicketCard from './AttentionTicketCard';
import DrilldownFooter from './DrilldownFooter';

const ATTENTION_FILTERS = {
  all: {
    key: 'all',
    label: 'Flagged tickets',
    listTitle: 'All tickets',
    match: () => true,
  },
  p1: {
    key: 'p1',
    label: 'P1',
    listTitle: 'P1 tickets',
    match: (t) => t.priority === 'P1',
  },
  p2: {
    key: 'p2',
    label: 'P2',
    listTitle: 'P2 tickets',
    match: (t) => t.priority === 'P2',
  },
  sla: {
    key: 'sla',
    label: 'SLA breaches',
    listTitle: 'SLA breach tickets',
    match: (t) => t.sla?.any_breach,
  },
  escalated: {
    key: 'escalated',
    label: 'Escalated',
    listTitle: 'Escalated tickets',
    match: (t) => t.disposition === 'escalated',
  },
};

export default function AttentionTicketsDrilldownModal({
  tickets,
  periodLabel,
  portfolioScoped = false,
  onClose,
  onSelectTicket,
  onFilterPortfolio,
  onViewAllTickets,
}) {
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const stats = useMemo(() => ({
    all: tickets.length,
    p1: tickets.filter((t) => t.priority === 'P1').length,
    p2: tickets.filter((t) => t.priority === 'P2').length,
    sla: tickets.filter((t) => t.sla?.any_breach).length,
    escalated: tickets.filter((t) => t.disposition === 'escalated').length,
  }), [tickets]);

  const filterConfig = ATTENTION_FILTERS[activeFilter] ?? ATTENTION_FILTERS.all;
  const filteredTickets = useMemo(
    () => tickets.filter(filterConfig.match),
    [tickets, filterConfig],
  );

  if (!tickets?.length) return null;

  return (
    <div className="kpi-drill-overlay" role="presentation" onClick={onClose}>
      <div
        className="kpi-drill-modal attention-drill-modal"
        role="dialog"
        aria-labelledby="attention-drill-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="kpi-drill__header">
          <div>
            <h2 id="attention-drill-title">
              Tickets Needing Attention
              <span className="attention-drill-modal__count">{tickets.length}</span>
            </h2>
            <p>P1/P2, SLA breach, escalated, WFR, temp resolution, reopened · click a stat or row for details</p>
            <span className="kpi-drill__period">{periodLabel}</span>
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="kpi-drill__body">
          <section className="kpi-drill__section">
            <div className="kpi-drill__stat-grid">
              {Object.values(ATTENTION_FILTERS).map((filter) => (
                <button
                  key={filter.key}
                  type="button"
                  className={`kpi-drill__mini-stat kpi-drill__mini-stat--clickable attention-drill-modal__stat ${
                    activeFilter === filter.key ? 'attention-drill-modal__stat--active' : ''
                  }`}
                  onClick={() => setActiveFilter(filter.key)}
                  aria-pressed={activeFilter === filter.key}
                >
                  <span className="kpi-drill__mini-value">{stats[filter.key]}</span>
                  <span className="kpi-drill__mini-label">{filter.label}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="kpi-drill__section attention-drill-modal__list-section">
            <div className="attention-drill-modal__list-header">
              <h3>{filterConfig.listTitle} ({filteredTickets.length})</h3>
              {activeFilter !== 'all' && (
                <button
                  type="button"
                  className="attention-drill-modal__clear-filter"
                  onClick={() => setActiveFilter('all')}
                >
                  Show all flagged
                </button>
              )}
            </div>
            <div className="attention-drill-modal__list">
              {filteredTickets.length === 0 ? (
                <p className="muted attention-drill-modal__empty">
                  No tickets match this filter in the current attention set.
                </p>
              ) : (
                filteredTickets.map((ticket) => (
                  <AttentionTicketCard
                    key={ticket.id}
                    ticket={ticket}
                    onClick={onSelectTicket}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        <DrilldownFooter
          onClose={onClose}
          onFilterPortfolio={portfolioScoped ? onFilterPortfolio : undefined}
          onViewTickets={onViewAllTickets}
          viewTicketsLabel="View all in Tickets →"
        />
      </div>
    </div>
  );
}
