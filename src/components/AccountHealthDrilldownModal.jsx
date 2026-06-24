import { useEffect } from 'react';
import { formatDurationHours } from '../utils/metrics';
import {
  computeDelta,
  formatDelta,
  getAccountRiskFlags,
  getHealthScoreFactors,
} from '../utils/health';
import DrilldownFooter from './DrilldownFooter';

function MetricTile({ label, value, sub, tone }) {
  return (
    <div className={`account-health-drill__metric account-health-drill__metric--${tone ?? 'neutral'}`}>
      <span className="account-health-drill__metric-value">{value}</span>
      <span className="account-health-drill__metric-label">{label}</span>
      {sub && <span className="account-health-drill__metric-sub">{sub}</span>}
    </div>
  );
}

export default function AccountHealthDrilldownModal({
  account,
  previousAccount,
  tickets = [],
  periodLabel,
  onClose,
  onFilterPortfolio,
  onViewAccount,
  onViewTickets,
  onOpenTicket,
}) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!account) return null;

  const { metrics, healthScore, health } = account;
  const previousScore = previousAccount?.healthScore ?? null;
  const scoreDelta = computeDelta(healthScore, previousScore, false);
  const scoreDeltaFmt = formatDelta(scoreDelta);
  const factors = getHealthScoreFactors(metrics);
  const riskFlags = getAccountRiskFlags(account);
  const accountTickets = tickets
    .filter((ticket) => ticket.account_id === account.account_id)
    .sort((a, b) => {
      const priority = { P1: 0, P2: 1, P3: 2, P4: 3, P5: 4 };
      const diff = (priority[a.priority] ?? 9) - (priority[b.priority] ?? 9);
      if (diff !== 0) return diff;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  return (
    <div className="kpi-drill-overlay" role="presentation" onClick={onClose}>
      <div
        className="kpi-drill-modal account-health-drill-modal"
        role="dialog"
        aria-labelledby="account-health-drill-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="kpi-drill__header">
          <div>
            <h2 id="account-health-drill-title">{account.account_name}</h2>
            <p>Account health breakdown for the selected period</p>
            <span className="kpi-drill__period">{periodLabel}</span>
            <span className="kpi-drill__scope">TAM: {account.tam_name}</span>
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="kpi-drill__body">
          <section className="kpi-drill__section account-health-drill__hero">
            <div className="account-health-drill__score-wrap">
              <span
                className="account-health-drill__score"
                style={{ color: health?.color ?? '#94a3b8' }}
              >
                {healthScore ?? '—'}
              </span>
              <span className="account-health-drill__score-label">
                {health?.label ?? 'No Data'}
              </span>
              {previousScore != null && (
                <span className="account-health-drill__score-prior">
                  Prior: {previousScore}/100
                </span>
              )}
              {scoreDeltaFmt.text !== '—' && (
                <span className={`account-health-drill__score-delta ${scoreDeltaFmt.className}`}>
                  {scoreDeltaFmt.text}
                </span>
              )}
            </div>
            <p className="account-health-drill__formula">
              Score starts at 100 and subtracts penalties for SLA breaches, low CSAT,
              reopenings, and P1/P2 volume.
            </p>
          </section>

          {riskFlags.length > 0 && (
            <section className="kpi-drill__section">
              <h3>Attention flags</h3>
              <ul className="account-health-drill__flags">
                {riskFlags.map((flag) => (
                  <li key={flag}>{flag}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="kpi-drill__section">
            <h3>Score contributors</h3>
            <div className="account-health-drill__factors">
              {factors.map((factor) => (
                <div
                  key={factor.label}
                  className={`account-health-drill__factor account-health-drill__factor--${factor.tone}`}
                >
                  <div className="account-health-drill__factor-head">
                    <span>{factor.label}</span>
                    <strong>-{factor.penalty.toFixed(1)} pts</strong>
                  </div>
                  <span className="account-health-drill__factor-detail">{factor.detail}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="kpi-drill__section">
            <h3>Period metrics</h3>
            <div className="kpi-drill__stat-grid">
              <MetricTile label="Tickets" value={metrics.totalTickets} />
              <MetricTile label="P1" value={metrics.p1Count} tone={metrics.p1Count > 0 ? 'bad' : 'good'} />
              <MetricTile label="P2" value={metrics.p2Count} tone={metrics.p2Count > 2 ? 'warn' : 'neutral'} />
              <MetricTile
                label="SLA breaches"
                value={metrics.slaBreaches}
                sub={`${metrics.slaBreachRate.toFixed(1)}%`}
                tone={metrics.slaBreachRate > 18 ? 'bad' : 'neutral'}
              />
              <MetricTile
                label="CSAT"
                value={metrics.avgCsat?.toFixed(1) ?? '—'}
                tone={metrics.avgCsat != null && metrics.avgCsat < 3.5 ? 'bad' : 'good'}
              />
              <MetricTile label="MTTR" value={formatDurationHours(metrics.avgMttr)} />
              <MetricTile label="Reopenings" value={metrics.reopenings} tone={metrics.reopenings > 2 ? 'warn' : 'neutral'} />
              <MetricTile label="Resolved" value={metrics.resolvedCount ?? 0} tone="good" />
            </div>
          </section>

          <section className="kpi-drill__section">
            <h3>Tickets ({accountTickets.length})</h3>
            {accountTickets.length === 0 ? (
              <p className="muted">No tickets for this account in the selected period.</p>
            ) : (
              <div className="table-wrap kpi-drill__table-wrap">
                <table className="data-table data-table--compact">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Priority</th>
                      <th>Subject</th>
                      <th>Disposition</th>
                      <th>SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accountTickets.slice(0, 12).map((ticket) => (
                      <tr
                        key={ticket.id}
                        className="data-table__row--clickable"
                        onClick={() => onOpenTicket?.(ticket)}
                        title="Click to view ticket details"
                      >
                        <td className="mono">#{ticket.zendesk_id}</td>
                        <td>
                          <span className={`priority priority--${ticket.priority.toLowerCase()}`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="data-table__subject" title={ticket.subject}>{ticket.subject}</td>
                        <td>
                          <span className="disp-badge">
                            {ticket.disposition?.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {ticket.sla.any_breach ? (
                            <span className="badge badge--breach">Breached</span>
                          ) : (
                            <span className="badge badge--ok">Met</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {accountTickets.length > 12 && (
                  <p className="kpi-drill__more">
                    + {accountTickets.length - 12} more — use View tickets → for the full list
                  </p>
                )}
              </div>
            )}
          </section>
        </div>

        <DrilldownFooter
          onClose={onClose}
          onFilterPortfolio={() => onFilterPortfolio?.(account.account_id)}
          onViewAccount={() => onViewAccount?.(account.account_id)}
          onViewTickets={() => onViewTickets?.(account.account_id)}
        />
      </div>
    </div>
  );
}
