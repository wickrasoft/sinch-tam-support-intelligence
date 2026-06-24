export default function DrilldownFooter({
  onClose,
  onFilterPortfolio,
  onViewAccount,
  onViewTickets,
  filterLabel = 'Filter portfolio →',
  viewAccountLabel = 'View account →',
  viewTicketsLabel = 'View tickets →',
}) {
  return (
    <footer className="kpi-drill__footer kpi-drill__footer--nav">
      <button type="button" className="kpi-drill__close-btn" onClick={onClose}>
        Close
      </button>
      <div className="kpi-drill__footer-actions">
        {onFilterPortfolio && (
          <button type="button" className="panel__action" onClick={onFilterPortfolio}>
            {filterLabel}
          </button>
        )}
        {onViewAccount && (
          <button type="button" className="panel__action" onClick={onViewAccount}>
            {viewAccountLabel}
          </button>
        )}
        {onViewTickets && (
          <button type="button" className="panel__action" onClick={onViewTickets}>
            {viewTicketsLabel}
          </button>
        )}
      </div>
    </footer>
  );
}
