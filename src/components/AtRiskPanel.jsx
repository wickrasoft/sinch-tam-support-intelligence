import { formatDuration } from '../utils/metrics';

export default function AtRiskPanel({ atRiskAccounts, onSelectAccount }) {
  if (!atRiskAccounts.length) {
    return (
      <article className="panel at-risk-panel at-risk-panel--clear">
        <header className="panel__header">
          <h2>Account Alerts</h2>
          <p>No accounts flagged at-risk for the current filters</p>
        </header>
        <div className="at-risk-empty">
          <span className="at-risk-empty__icon">✓</span>
          <p>All accounts within acceptable SLA, CSAT, and priority thresholds.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="panel at-risk-panel">
      <header className="panel__header">
        <h2>Accounts Requiring Attention</h2>
        <p>
          {atRiskAccounts.length} account{atRiskAccounts.length !== 1 ? 's' : ''} flagged
          for elevated P1 volume, SLA breaches, low CSAT, or health score below 60
        </p>
      </header>

      <div className="at-risk-list">
        {atRiskAccounts.map((account) => {
          const reasons = [];
          if (account.healthScore < 60) reasons.push(`Health ${account.healthScore}/100`);
          if (account.metrics.slaBreachRate > 18) reasons.push(`SLA ${account.metrics.slaBreachRate.toFixed(0)}%`);
          if (account.metrics.avgCsat != null && account.metrics.avgCsat < 3.5) {
            reasons.push(`CSAT ${account.metrics.avgCsat.toFixed(1)}`);
          }
          if (account.metrics.p1Count > 0) reasons.push(`${account.metrics.p1Count} P1`);

          return (
            <button
              key={account.account_id}
              type="button"
              className="at-risk-card"
              onClick={() => onSelectAccount(account.account_id)}
            >
              <div className="at-risk-card__top">
                <span className="at-risk-card__name">{account.account_name}</span>
                <span
                  className="at-risk-card__score"
                  style={{ color: account.health?.color }}
                >
                  {account.healthScore}
                </span>
              </div>
              <span className="at-risk-card__tam">{account.tam_name}</span>
              <div className="at-risk-card__reasons">
                {reasons.map((r) => (
                  <span key={r} className="at-risk-card__tag">{r}</span>
                ))}
              </div>
              <div className="at-risk-card__metrics">
                <span>P1/P2: {account.metrics.p1p2Count}</span>
                <span>Reopens: {account.metrics.reopenings}</span>
                <span>MTTR: {formatDuration(account.metrics.avgMttr)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </article>
  );
}
