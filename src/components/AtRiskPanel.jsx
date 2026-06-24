import AtRiskAccountCard from './AtRiskAccountCard';

export default function AtRiskPanel({ atRiskAccounts, onAccountDrilldown, onOpenDrilldown }) {
  if (!atRiskAccounts.length) {
    return (
      <article className="panel alert-panel at-risk-panel at-risk-panel--clear">
        <header className="panel__header">
          <h2>Accounts Requiring Attention</h2>
          <p>No accounts flagged at-risk for the current filters</p>
        </header>
        <div className="alert-panel__empty">
          <span className="alert-panel__empty-icon">✓</span>
          <p>All accounts within acceptable SLA, CSAT, and priority thresholds.</p>
        </div>
      </article>
    );
  }

  return (
    <article className="panel alert-panel at-risk-panel">
      <header className="panel__header">
        <div className="alert-panel__title-row">
          <h2>Accounts Requiring Attention</h2>
          {onOpenDrilldown ? (
            <button
              type="button"
              className="alert-panel__count alert-panel__count--clickable"
              onClick={onOpenDrilldown}
              title="View all at-risk accounts"
              aria-label={`View all ${atRiskAccounts.length} at-risk accounts`}
            >
              {atRiskAccounts.length}
            </button>
          ) : (
            <span className="alert-panel__count">{atRiskAccounts.length}</span>
          )}
        </div>
      </header>

      <div className="alert-panel__scroll alert-panel__scroll--full">
        {atRiskAccounts.map((account, index) => (
          <AtRiskAccountCard
            key={account.account_id}
            account={account}
            rank={index + 1}
            onClick={onAccountDrilldown}
          />
        ))}
      </div>
    </article>
  );
}
