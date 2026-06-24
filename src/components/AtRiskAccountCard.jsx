import { formatDurationHours } from '../utils/metrics';
import { healthIndicator } from '../utils/health';

export default function AtRiskAccountCard({ account, rank, onClick }) {
  const health = account.health ?? healthIndicator(account.healthScore);
  const borderColor = health.color;

  return (
    <button
      type="button"
      className="alert-card alert-card--account"
      style={{ '--alert-accent': borderColor }}
      onClick={() => onClick?.(account.account_id)}
    >
      <div className="alert-card__head">
        <div className="alert-card__title-block">
          <div className="alert-card__name-row">
            {rank != null && <span className="alert-card__rank">#{rank}</span>}
            <span className="alert-card__name">{account.account_name}</span>
          </div>
          <span className="alert-card__sub">{account.tam_name}</span>
        </div>
        <div className="alert-card__score" style={{ color: health.color }}>
          <span className="alert-card__score-value">{account.riskScore ?? 0}</span>
          <span className="alert-card__score-label">Risk score</span>
        </div>
      </div>

      <div className="alert-card__stats">
        <span className="alert-card__stat">
          <span className="alert-card__stat-label">Health</span>
          <span className="alert-card__stat-value">{account.healthScore}/100</span>
        </span>
        <span className="alert-card__stat">
          <span className="alert-card__stat-label">SLA</span>
          <span className="alert-card__stat-value">{account.metrics.slaBreachRate.toFixed(0)}%</span>
        </span>
        <span className="alert-card__stat">
          <span className="alert-card__stat-label">CSAT</span>
          <span className="alert-card__stat-value">
            {account.metrics.avgCsat?.toFixed(1) ?? '—'}
          </span>
        </span>
        <span className="alert-card__stat">
          <span className="alert-card__stat-label">P1</span>
          <span className={`alert-card__stat-value ${account.metrics.p1Count > 0 ? 'alert-card__stat-value--bad' : ''}`}>
            {account.metrics.p1Count}
          </span>
        </span>
      </div>

      <div className="alert-card__footer">
        <span>P1/P2: {account.metrics.p1p2Count}</span>
        <span>Reopens: {account.metrics.reopenings}</span>
        <span>MTTR: {formatDurationHours(account.metrics.avgMttr)}</span>
      </div>
    </button>
  );
}
