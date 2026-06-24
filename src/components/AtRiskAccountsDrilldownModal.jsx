import { useEffect } from 'react';
import AtRiskAccountCard from './AtRiskAccountCard';
import DrilldownFooter from './DrilldownFooter';

export default function AtRiskAccountsDrilldownModal({
  atRiskAccounts,
  periodLabel,
  portfolioScoped = false,
  onClose,
  onAccountDrilldown,
  onFilterPortfolio,
  onViewAccountMatrix,
  onViewTickets,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!atRiskAccounts?.length) return null;

  const avgHealth = Math.round(
    atRiskAccounts.reduce((sum, a) => sum + (a.healthScore ?? 0), 0) / atRiskAccounts.length,
  );
  const totalP1 = atRiskAccounts.reduce((sum, a) => sum + (a.metrics.p1Count ?? 0), 0);
  const totalP1P2 = atRiskAccounts.reduce((sum, a) => sum + (a.metrics.p1p2Count ?? 0), 0);

  return (
    <div className="kpi-drill-overlay" role="presentation" onClick={onClose}>
      <div
        className="kpi-drill-modal at-risk-drill-modal"
        role="dialog"
        aria-labelledby="at-risk-drill-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="kpi-drill__header">
          <div>
            <h2 id="at-risk-drill-title">
              Accounts Requiring Attention
              <span className="at-risk-drill-modal__count">{atRiskAccounts.length}</span>
            </h2>
            <p>All flagged accounts sorted by highest risk first · click a row for account health</p>
            <span className="kpi-drill__period">{periodLabel}</span>
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="kpi-drill__body">
          <section className="kpi-drill__section">
            <div className="kpi-drill__stat-grid">
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{atRiskAccounts.length}</span>
                <span className="kpi-drill__mini-label">At-risk accounts</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{avgHealth}</span>
                <span className="kpi-drill__mini-label">Avg health score</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{totalP1}</span>
                <span className="kpi-drill__mini-label">Total P1</span>
              </div>
              <div className="kpi-drill__mini-stat">
                <span className="kpi-drill__mini-value">{totalP1P2}</span>
                <span className="kpi-drill__mini-label">Total P1/P2</span>
              </div>
            </div>
          </section>

          <section className="kpi-drill__section at-risk-drill-modal__list-section">
            <h3>All accounts ({atRiskAccounts.length})</h3>
            <div className="at-risk-drill-modal__list">
              {atRiskAccounts.map((account, index) => (
                <AtRiskAccountCard
                  key={account.account_id}
                  account={account}
                  rank={index + 1}
                  onClick={onAccountDrilldown}
                />
              ))}
            </div>
          </section>
        </div>

        <DrilldownFooter
          onClose={onClose}
          onFilterPortfolio={portfolioScoped ? onFilterPortfolio : undefined}
          onViewAccount={onViewAccountMatrix}
          onViewTickets={onViewTickets}
          viewAccountLabel="Account matrix →"
          viewTicketsLabel="Attention tickets →"
        />
      </div>
    </div>
  );
}
