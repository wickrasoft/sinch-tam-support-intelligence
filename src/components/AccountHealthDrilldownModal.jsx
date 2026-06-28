import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatDurationHours } from '../utils/metrics';
import {
  computeDelta,
  formatDelta,
  getAccountRiskFlags,
  getHealthScoreFactors,
} from '../utils/health';
import { resolveTamCoverage } from '../utils/tamAvailability';
import { TAM_STATUS_CONFIG } from '../utils/tamStatus';
import { formatTamDisplayName, countryFlag } from '../utils/text';
import TamStatusIcon from './TamStatusIcon';
import DrilldownFooter from './DrilldownFooter';

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return format(parseISO(iso), 'MMM d, yyyy');
  } catch {
    return '';
  }
}

// A TAM presence chip: status dial + name/region/flag + status line. When the
// TAM is out of office it surfaces the OOO type, return date, and assigned backup.
function TamChip({ tam, allTams, referenceDate, caption }) {
  if (!tam) return null;
  const coverage = resolveTamCoverage(tam, allTams, referenceDate) ?? {};
  const ooo = coverage.out_of_office;
  const iconStatus = ooo
    ? coverage.ooo_type === 'Sick'
      ? 'sick'
      : coverage.ooo_type === 'Vacation'
        ? 'vacation'
        : 'away'
    : coverage.status;
  const presenceLabel = TAM_STATUS_CONFIG[coverage.status]?.label ?? coverage.status ?? 'Online';
  const statusText = ooo
    ? `Out of office${coverage.ooo_type ? ` · ${coverage.ooo_type}` : ''}${
        coverage.ooo_until ? ` · Returns ${fmtDate(coverage.ooo_until)}` : ''
      }`
    : presenceLabel;
  const toneClass = ooo ? 'ooo' : coverage.status ?? 'online';

  const details = [];
  if (ooo && coverage.ooo_until) details.push(`Returns ${fmtDate(coverage.ooo_until)}`);
  if (ooo && coverage.backup_tam) details.push(`Backup ${coverage.backup_tam.name}`);

  return (
    <div className="account-health-drill__tam">
      <TamStatusIcon
        tam={tam}
        status={iconStatus}
        showTooltip
        details={details}
        className="account-health-drill__tam-dial"
      />
      <div className="account-health-drill__tam-info">
        {caption && <span className="account-health-drill__tam-caption">{caption}</span>}
        <span className="account-health-drill__tam-name">
          {formatTamDisplayName(tam.name, tam.region)}
          {tam.country && (
            <span className="account-health-drill__tam-flag" title={tam.country}>
              {' '}
              {countryFlag(tam.country)}
            </span>
          )}
        </span>
        <span className={`account-health-drill__tam-status account-health-drill__tam-status--${toneClass}`}>
          {statusText}
        </span>
      </div>
    </div>
  );
}

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
  tams = [],
  accounts = [],
  referenceDate,
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

  const primaryTam = useMemo(() => {
    if (!account) return null;
    const acc = accounts.find((a) => a.id === account.account_id);
    return tams.find((t) => t.id === acc?.tam_id) ?? null;
  }, [accounts, tams, account]);

  const coverage = useMemo(
    () => (primaryTam ? resolveTamCoverage(primaryTam, tams, referenceDate) : null),
    [primaryTam, tams, referenceDate],
  );

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
            <h2 id="account-health-drill-title">
              {account.account_name} - Account health breakdown for the selected period
            </h2>
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

          <section className="kpi-drill__section account-health-drill__tam-section">
            <h3>TAM coverage</h3>
            {primaryTam ? (
              <div className="account-health-drill__tam-grid">
                <TamChip
                  tam={primaryTam}
                  allTams={tams}
                  referenceDate={referenceDate}
                  caption="Primary TAM"
                />
                {coverage?.out_of_office &&
                  (coverage.backup_tam ? (
                    <TamChip
                      tam={coverage.backup_tam}
                      allTams={tams}
                      referenceDate={referenceDate}
                      caption="Covering TAM (backup)"
                    />
                  ) : (
                    <div className="account-health-drill__tam account-health-drill__tam--empty">
                      Primary TAM is out of office and no backup is assigned for this absence.
                    </div>
                  ))}
              </div>
            ) : (
              <p className="muted">TAM: {account.tam_name}</p>
            )}
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
              <p className="muted">No tickets for this Account in the selected period.</p>
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
