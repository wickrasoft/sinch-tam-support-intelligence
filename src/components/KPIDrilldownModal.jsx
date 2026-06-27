import { useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatDurationHours, countTicketReopenEventsInPeriod, csatIndicator, computeSummary, filterTickets, getPreviousPeriodDate, getTicketMttaMinutes, getTicketMttrMinutes } from '../utils/metrics';
import { formatDelta, formatDurationDelta, buildComparisonSummary } from '../utils/health';
import {
  KPI_CONFIG,
  getTicketsForKpi,
  getAccountBreakdown,
  getCsatDistribution,
  getSlaBreakdown,
  formatKpiComparison,
  KPI_KEYS,
} from '../utils/kpiDrilldown';
import { formatAccountCount } from '../utils/text';
import CsatFeedbackList from './CsatFeedbackList';
import DrilldownFooter from './DrilldownFooter';

function ComparisonRows({ rows }) {
  return (
    <div className="kpi-drill__comparison">
      {rows.map((row) => {
        const deltaFmt = row.delta
          ? (row.deltaInHours ? formatDurationDelta(row.delta) : formatDelta(row.delta))
          : null;
        return (
          <div key={row.label} className="kpi-drill__comp-row">
            <span className="kpi-drill__comp-label">{row.label}</span>
            <span className="kpi-drill__comp-current">{row.current}</span>
            {row.prior != null && (
              <span className="kpi-drill__comp-prior">Prior: {row.prior}</span>
            )}
            {deltaFmt && deltaFmt.text !== '—' && (
              <span className={`kpi-drill__comp-delta ${deltaFmt.className}`}>{deltaFmt.text}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function TicketMiniTable({ tickets, kpiKey, onOpenTicket, filters }) {
  const isCsat = kpiKey === KPI_KEYS.CSAT || kpiKey === KPI_KEYS.CSAT_RESPONSE;
  const isResolved = kpiKey === KPI_KEYS.RESOLVED;
  const isClosed = kpiKey === KPI_KEYS.CLOSED;
  const cols = kpiKey === KPI_KEYS.MTTA || kpiKey === KPI_KEYS.MTTR
    ? ['ID', 'Account', 'Priority', 'Subject', kpiKey === KPI_KEYS.MTTA ? 'MTTA' : 'MTTR']
    : kpiKey === KPI_KEYS.REOPENINGS
      ? ['ID', 'Account', 'Priority', 'Subject', 'Reopens', 'In period']
      : isResolved
        ? ['ID', 'Account', 'Priority', 'Subject', 'Resolved']
        : isClosed
          ? ['ID', 'Account', 'Priority', 'Subject', 'Closed']
          : isCsat
            ? ['ID', 'Account', 'Score', 'Customer comment', 'Subject']
            : ['ID', 'Account', 'Priority', 'Subject', 'Disposition', 'SLA'];

  return (
    <div className="table-wrap kpi-drill__table-wrap">
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            {cols.map((c) => <th key={c}>{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {tickets.slice(0, 15).map((t) => (
            <tr
              key={t.id}
              className="data-table__row--clickable"
              onClick={() => onOpenTicket?.(t)}
              title="Click to view ticket details"
            >
              <td className="mono">#{t.zendesk_id}</td>
              <td>{t.account_name}</td>
              {!isCsat && (
                <td>
                  <span className={`priority priority--${t.priority.toLowerCase()}`}>{t.priority}</span>
                </td>
              )}
              {isCsat && (
                <>
                  <td>
                    <span
                      className="csat-score-pill"
                      style={{ color: csatIndicator(t.csat.score).color }}
                    >
                      {t.csat.score}/5
                    </span>
                  </td>
                  <td className="csat-comment-cell" title={t.csat.comment ?? undefined}>
                    {t.csat.comment ?? '—'}
                  </td>
                </>
              )}
              <td className="data-table__subject" title={t.subject}>{t.subject}</td>
              {kpiKey === KPI_KEYS.MTTA && <td>{formatDurationHours(getTicketMttaMinutes(t))}</td>}
              {kpiKey === KPI_KEYS.MTTR && <td>{formatDurationHours(getTicketMttrMinutes(t))}</td>}
              {kpiKey === KPI_KEYS.REOPENINGS && (
                <>
                  <td>{t.reopen_count > 0 ? t.reopen_count : '—'}</td>
                  <td>{filters ? countTicketReopenEventsInPeriod(t, filters) : '—'}</td>
                </>
              )}
              {isResolved && (
                <td>{t.solved_at ? format(parseISO(t.solved_at), 'MMM d, yyyy') : '—'}</td>
              )}
              {isClosed && (
                <td>{t.closed_at ? format(parseISO(t.closed_at), 'MMM d, yyyy') : '—'}</td>
              )}
              {kpiKey !== KPI_KEYS.MTTA && kpiKey !== KPI_KEYS.MTTR && kpiKey !== KPI_KEYS.REOPENINGS && !isCsat && !isResolved && !isClosed && (
                <>
                  <td><span className="disp-badge">{t.disposition?.replace(/_/g, ' ')}</span></td>
                  <td>
                    {t.sla.any_breach ? (
                      <span className="badge badge--breach">Breached</span>
                    ) : (
                      <span className="badge badge--ok">Met</span>
                    )}
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {tickets.length > 15 && (
        <p className="kpi-drill__more">+ {tickets.length - 15} more — click a row for details or use &quot;View all tickets&quot;</p>
      )}
    </div>
  );
}

function AccountBreakdownTable({ breakdown, kpiKey }) {
  return (
    <div className="table-wrap">
      <table className="data-table data-table--compact">
        <thead>
          <tr>
            <th>Account</th>
            <th>TAM</th>
            <th>Count</th>
            {(kpiKey === KPI_KEYS.MTTA) && <th>Avg MTTA</th>}
            {(kpiKey === KPI_KEYS.MTTR) && <th>Avg MTTR</th>}
            {(kpiKey === KPI_KEYS.CSAT || kpiKey === KPI_KEYS.CSAT_RESPONSE) && <th>Avg CSAT</th>}
            {kpiKey === KPI_KEYS.REOPENINGS && <th>Reopen events</th>}
          </tr>
        </thead>
        <tbody>
          {breakdown.slice(0, 10).map((row) => (
            <tr key={row.account_id}>
              <td className="data-table__account">{row.account_name}</td>
              <td>{row.tam_name}</td>
              <td>{row.count}</td>
              {kpiKey === KPI_KEYS.MTTA && <td>{formatDurationHours(row.avgMttaVal)}</td>}
              {kpiKey === KPI_KEYS.MTTR && <td>{formatDurationHours(row.avgMttrVal)}</td>}
              {(kpiKey === KPI_KEYS.CSAT || kpiKey === KPI_KEYS.CSAT_RESPONSE) && (
                <td>{row.avgCsat?.toFixed(1) ?? '—'}</td>
              )}
              {kpiKey === KPI_KEYS.REOPENINGS && <td>{row.reopenEvents ?? row.count}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function KPIDrilldownModal({
  kpiKey,
  tickets,
  allTickets,
  filters,
  drilldownContext,
  tams = [],
  previousFilters,
  summary,
  comparison,
  previousSummary,
  periodLabel,
  onClose,
  onViewAll,
  onFilterPortfolio,
  onViewAccount,
  onOpenTicket,
  accounts = [],
}) {
  useEffect(() => {
    if (!kpiKey) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [kpiKey, onClose]);

  const effectiveFilters = useMemo(() => {
    const next = { ...filters };
    if (drilldownContext?.tamId) next.tamId = drilldownContext.tamId;
    if (drilldownContext?.accountId) next.accountId = drilldownContext.accountId;
    if (drilldownContext?.region) next.region = drilldownContext.region;
    if (drilldownContext?.bucketDate) next.referenceDate = drilldownContext.bucketDate;
    return next;
  }, [filters, drilldownContext]);

  const hasScopedContext = Boolean(
    drilldownContext?.tamId
      || drilldownContext?.accountId
      || drilldownContext?.region
      || drilldownContext?.bucketDate
      || drilldownContext?.team,
  );

  const scopedSummary = useMemo(() => {
    if (!hasScopedContext) return summary;
    const scopedTicketSet = filterTickets(allTickets, effectiveFilters, { tams });
    return computeSummary(scopedTicketSet, allTickets, effectiveFilters);
  }, [hasScopedContext, summary, allTickets, effectiveFilters, tams]);

  const scopedPreviousSummary = useMemo(() => {
    if (!hasScopedContext || !previousFilters) return previousSummary;
    const prevFilters = { ...effectiveFilters };
    prevFilters.referenceDate = getPreviousPeriodDate(
      effectiveFilters.referenceDate,
      effectiveFilters.period,
    ).toISOString();
    const scopedTicketSet = filterTickets(allTickets, prevFilters, { tams });
    return computeSummary(scopedTicketSet, allTickets, prevFilters);
  }, [hasScopedContext, previousSummary, allTickets, previousFilters, effectiveFilters, tams]);

  const scopedComparison = useMemo(() => {
    if (!hasScopedContext) return comparison;
    return buildComparisonSummary(scopedSummary, scopedPreviousSummary);
  }, [hasScopedContext, comparison, scopedSummary, scopedPreviousSummary]);

  const scopedTickets = useMemo(() => {
    if (hasScopedContext) {
      return filterTickets(allTickets, effectiveFilters, { tams });
    }
    return tickets;
  }, [hasScopedContext, allTickets, effectiveFilters, tams, tickets]);

  const kpiTickets = useMemo(() => {
    if (!kpiKey) return [];
    const context = { allTickets, filters: effectiveFilters, team: drilldownContext?.team };
    let list = getTicketsForKpi(scopedTickets, kpiKey, context);
    if (drilldownContext?.disposition) {
      list = list.filter((t) => t.disposition === drilldownContext.disposition);
    }
    return list;
  }, [kpiKey, scopedTickets, allTickets, effectiveFilters, drilldownContext?.disposition, drilldownContext?.team]);

  if (!kpiKey) return null;

  const config = KPI_CONFIG[kpiKey];
  const context = { allTickets, filters: effectiveFilters };
  const breakdown = getAccountBreakdown(kpiTickets, kpiKey, effectiveFilters);
  const compRows = formatKpiComparison(
    kpiKey,
    scopedSummary,
    scopedComparison,
    scopedPreviousSummary ?? previousSummary,
  );
  const tamName = drilldownContext?.tamId
    ? tams.find((t) => t.id === drilldownContext.tamId)?.name
    : null;
  const accountName = drilldownContext?.accountId
    ? accounts.find((a) => a.id === drilldownContext.accountId)?.name
    : null;
  const dispositionScope = drilldownContext?.disposition
    ? {
        in_progress: 'Open',
        waiting_for_response: 'WFR',
        escalated: 'Escalated',
        temp_resolution: 'Temp Resolution',
        closed: 'Closed',
      }[drilldownContext.disposition] ?? drilldownContext.disposition
    : null;
  const displayPeriod = drilldownContext?.bucketLabel ?? periodLabel;
  const hasPortfolioScope = Boolean(
    drilldownContext?.tamId || drilldownContext?.accountId || drilldownContext?.region,
  );
  const regionScope = drilldownContext?.region ?? null;

  return (
    <div className="kpi-drill-overlay" onClick={onClose} role="presentation">
      <div
        className="kpi-drill-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="kpi-drill-title"
      >
        <header className="kpi-drill__header">
          <div>
            <h2 id="kpi-drill-title">{config.title}</h2>
            <p>{config.description}</p>
            <span className="kpi-drill__period">{displayPeriod}</span>
            {tamName && (
              <span className="kpi-drill__scope">TAM: {tamName}</span>
            )}
            {accountName && (
              <span className="kpi-drill__scope">Account: {accountName}</span>
            )}
            {regionScope && (
              <span className="kpi-drill__scope">Region: {regionScope}</span>
            )}
            {dispositionScope && (
              <span className="kpi-drill__scope">Status: {dispositionScope}</span>
            )}
            {drilldownContext?.team && (
              <span className="kpi-drill__scope">Team: {drilldownContext.team}</span>
            )}
          </div>
          <button type="button" className="kpi-drill__close" onClick={onClose} aria-label="Close">×</button>
        </header>

        <div className="kpi-drill__body">
          {compRows.length > 0 && (
            <section className="kpi-drill__section">
              <h3>Period comparison</h3>
              <ComparisonRows rows={compRows} />
            </section>
          )}

          {kpiKey === KPI_KEYS.SLA && (
            <section className="kpi-drill__section">
              <h3>Breach type breakdown</h3>
              <div className="kpi-drill__stat-grid">
                {Object.entries(getSlaBreakdown(tickets)).map(([key, val]) => (
                  <div key={key} className="kpi-drill__mini-stat">
                    <span className="kpi-drill__mini-value">{val}</span>
                    <span className="kpi-drill__mini-label">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {(kpiKey === KPI_KEYS.CSAT || kpiKey === KPI_KEYS.CSAT_RESPONSE) && (
            <section className="kpi-drill__section">
              <h3>Rating distribution</h3>
              <div className="csat-dist">
                {Object.entries(getCsatDistribution(kpiTickets).dist).map(([score, count]) => (
                  <div key={score} className="csat-dist__row">
                    <span>{score} ★</span>
                    <div className="csat-dist__bar-wrap">
                      <div
                        className="csat-dist__bar"
                        style={{
                          width: `${getCsatDistribution(kpiTickets).rated ? (count / getCsatDistribution(kpiTickets).rated) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {kpiKey === KPI_KEYS.CSAT && (
            <section className="kpi-drill__section">
              <h3>
                Customer comments (
                {kpiTickets.filter((t) => t.csat?.comment).length}
                {' '}
                with feedback)
              </h3>
              <CsatFeedbackList
                tickets={kpiTickets}
                onOpenTicket={onOpenTicket}
                limit={12}
              />
            </section>
          )}

          <section className="kpi-drill__section">
            <h3>By Account ({formatAccountCount(breakdown.length)})</h3>
            <AccountBreakdownTable breakdown={breakdown} kpiKey={kpiKey} />
          </section>

          <section className="kpi-drill__section">
            <h3>
              {kpiKey === KPI_KEYS.CSAT ? 'Survey responses' : 'Tickets'} ({kpiTickets.length})
            </h3>
            {kpiTickets.length === 0 ? (
              <p className="muted">No tickets match this metric in the selected period.</p>
            ) : (
              <TicketMiniTable
                tickets={kpiTickets}
                kpiKey={kpiKey}
                onOpenTicket={onOpenTicket}
                filters={effectiveFilters}
              />
            )}
          </section>
        </div>

        <DrilldownFooter
          onClose={onClose}
          onFilterPortfolio={
            hasPortfolioScope && onFilterPortfolio
              ? () => onFilterPortfolio(drilldownContext)
              : undefined
          }
          onViewAccount={
            drilldownContext?.accountId && onViewAccount
              ? () => onViewAccount(drilldownContext.accountId)
              : undefined
          }
          onViewTickets={() => onViewAll(kpiKey)}
        />
      </div>
    </div>
  );
}
