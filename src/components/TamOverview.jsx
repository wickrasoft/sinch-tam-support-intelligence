import { useState } from 'react';
import VacationIndicator from './VacationIndicator';
import { formatDuration, csatIndicator, getPortfolioActivityBreakdown, sumPortfolioActivityBreakdown } from '../utils/metrics';
import { computeHealthScore, healthIndicator } from '../utils/health';
import { KPI_KEYS } from '../utils/kpiDrilldown';

const OPEN_DISPOSITION_LABELS = {
  in_progress: 'IP',
  waiting_for_response: 'WFR',
  temp_resolution: 'Temp Res',
  escalated: 'Escalated',
};

const DISPOSITION_BAR_COLORS = {
  in_progress: '#0284c7',
  waiting_for_response: '#f59e0b',
  temp_resolution: '#a78bfa',
  escalated: '#ef4444',
};

function DispositionBar({ counts }) {
  const openKeys = Object.keys(OPEN_DISPOSITION_LABELS);
  const total = openKeys.reduce((sum, key) => sum + (counts[key] ?? 0), 0) || 1;

  return (
    <div className="disp-bar" title="Open ticket disposition breakdown (created in period)">
      {openKeys.map((key) => {
        const pct = ((counts[key] ?? 0) / total) * 100;
        if (pct < 1) return null;
        return (
          <div
            key={key}
            className="disp-bar__seg"
            style={{ width: `${pct}%`, background: DISPOSITION_BAR_COLORS[key] }}
            title={`${OPEN_DISPOSITION_LABELS[key]}: ${counts[key]}`}
          />
        );
      })}
    </div>
  );
}

function TamStatCell({ label, value, title, onClick, tone, valueStyle }) {
  const Tag = onClick ? 'button' : 'div';
  const className = [
    'tam-card__stat',
    onClick ? 'tam-card__stat--clickable' : '',
    tone ? `tam-card__stat--${tone}` : '',
  ].filter(Boolean).join(' ');

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={className}
      onClick={onClick}
      title={title}
    >
      <span className="tam-card__label">{label}</span>
      <span className="tam-card__value" style={valueStyle}>{value}</span>
    </Tag>
  );
}

function TamDetail({ tam, onSelectAccount, onFilterTam, onDrilldown }) {
  const dc = tam.metrics.dispositionCounts ?? {};
  const health = healthIndicator(computeHealthScore(tam.metrics));
  const tamContext = { tamId: tam.tam_id };

  const openDrilldown = (kpiKey, event) => {
    event.stopPropagation();
    onDrilldown?.(kpiKey, tamContext);
  };

  return (
    <div className="tam-detail">
      <div className="tam-detail__header">
        <div>
          <span className="tam-detail__health" style={{ color: health.color }}>
            Health {computeHealthScore(tam.metrics)}/100 · {health.label}
          </span>
          <DispositionBar counts={dc} />
        </div>
        <button type="button" className="panel__action" onClick={() => onFilterTam(tam.tam_id)}>
          Filter dashboard →
        </button>
      </div>

      <div className="tam-detail__metrics">
        <TamStatCell
          label="Resolved"
          value={tam.metrics.resolvedCount ?? 0}
          title="Tickets created in period and resolved during the period"
          onClick={(e) => openDrilldown(KPI_KEYS.RESOLVED, e)}
          tone="good"
        />
        <TamStatCell
          label="Closed"
          value={tam.metrics.closedInPeriodCount ?? 0}
          title="Tickets created in period and closed during the period"
          onClick={(e) => openDrilldown(KPI_KEYS.CLOSED, e)}
          tone="closed"
        />
        <TamStatCell
          label="MTTA"
          value={formatDuration(tam.metrics.avgMtta)}
          title="Mean time to acknowledge (created in period)"
        />
        <TamStatCell
          label="MTTR"
          value={formatDuration(tam.metrics.avgMttr)}
          title="Mean time to resolve (created in period)"
        />
        <TamStatCell
          label="Reopens"
          value={tam.metrics.reopenings ?? 0}
          title="Reopen events in the selected period"
          onClick={(e) => openDrilldown(KPI_KEYS.REOPENINGS, e)}
        />
      </div>

      <div className="tam-detail__dispositions">
        {Object.entries(OPEN_DISPOSITION_LABELS).map(([key, label]) => (
          <div key={key} className="tam-detail__disp-stat">
            <span className="tam-detail__disp-label">{label}</span>
            <span className="tam-detail__disp-value">{dc[key] ?? 0}</span>
          </div>
        ))}
        <div className="tam-detail__disp-stat tam-detail__disp-stat--closed">
          <span className="tam-detail__disp-label">Closed</span>
          <span className="tam-detail__disp-value">{tam.metrics.closedInPeriodCount ?? 0}</span>
        </div>
      </div>

      <h4 className="tam-detail__accounts-title">
        Dedicated Accounts ({tam.accounts?.length ?? 0})
      </h4>
      <div className="tam-detail__accounts">
        {(tam.accounts ?? []).map((acc) => (
          <button
            key={acc.id}
            type="button"
            className="tam-account-row"
            onClick={() => onSelectAccount(acc.id)}
          >
            <span className="tam-account-row__name">{acc.name}</span>
            <span className="tam-account-row__tier">{acc.tier}</span>
            <span className="tam-account-row__stat">{acc.ticketCount} created</span>
            <span className="tam-account-row__stat">P1: {acc.metrics.p1Count}</span>
            <span className="tam-account-row__stat tam-account-row__stat--resolved">
              Resolved: {acc.metrics.resolvedCount ?? 0}
            </span>
            <span className="tam-account-row__stat tam-account-row__stat--closed">
              Closed: {acc.metrics.closedInPeriodCount ?? 0}
            </span>
            <span className="tam-account-row__stat">SLA: {acc.metrics.slaBreaches}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TamOverview({ tamMetrics, allTams, onSelectAccount, onFilterTam, onDrilldown }) {
  const [expandedId, setExpandedId] = useState(null);

  const displayTams = tamMetrics.length > 0
    ? tamMetrics
    : allTams.map((t) => ({
        tam_id: t.id,
        tam_name: t.name,
        tam_email: t.email,
        metrics: {
          totalTickets: 0,
          p1p2Count: 0,
          resolvedCount: 0,
          closedInPeriodCount: 0,
          handledCount: 0,
          otherHandledCount: 0,
          activityTotal: 0,
          activityBreakdown: {
            created: 0,
            other: 0,
            p1p2: 0,
            resolved: 0,
            closed: 0,
            ip: 0,
            wfr: 0,
            esc: 0,
          },
          dispositionCounts: {},
          avgCsat: null,
          avgMtta: null,
          reopenings: 0,
          slaBreaches: 0,
        },
        accounts: [],
      }));

  const openTamDrilldown = (kpiKey, tamId, event) => {
    event.stopPropagation();
    onDrilldown?.(kpiKey, { tamId });
  };

  const portfolioBreakdown = displayTams.reduce(
    (acc, tam) => {
      const breakdown = getPortfolioActivityBreakdown(tam.metrics);
      return {
        created: acc.created + breakdown.created,
        other: acc.other + breakdown.other,
        p1p2: acc.p1p2 + breakdown.p1p2,
        resolved: acc.resolved + breakdown.resolved,
        closed: acc.closed + breakdown.closed,
        ip: acc.ip + breakdown.ip,
        wfr: acc.wfr + breakdown.wfr,
        esc: acc.esc + breakdown.esc,
      };
    },
    { created: 0, other: 0, p1p2: 0, resolved: 0, closed: 0, ip: 0, wfr: 0, esc: 0 },
  );
  const portfolioTotal = sumPortfolioActivityBreakdown(portfolioBreakdown);

  const PORTFOLIO_SUMMARY_ITEMS = [
    { key: 'created', label: 'Created' },
    { key: 'other', label: 'Other' },
    { key: 'p1p2', label: 'P1/P2' },
    { key: 'resolved', label: 'Resolved' },
    { key: 'closed', label: 'Closed' },
    { key: 'ip', label: 'IP' },
    { key: 'wfr', label: 'WFR' },
    { key: 'esc', label: 'Esc' },
  ];

  return (
    <article className="panel tam-overview-panel">
      <header className="panel__header">
        <h2>TAM Portfolio Overview</h2>
        <p>
          Total = Created + Other + P1/P2 + Resolved + Closed + IP + WFR + Esc within the
          selected period. Expand a card for account detail.
        </p>
        <div className="tam-overview-summary">
          <span className="tam-overview-summary__item tam-overview-summary__item--total">
            <span className="tam-overview-summary__label">Total</span>
            <span className="tam-overview-summary__value">{portfolioTotal}</span>
          </span>
          {PORTFOLIO_SUMMARY_ITEMS.map(({ key, label }) => (
            <span key={key} className="tam-overview-summary__item">
              <span className="tam-overview-summary__label">{label}</span>
              <span className="tam-overview-summary__value">{portfolioBreakdown[key]}</span>
            </span>
          ))}
        </div>
      </header>

      <div className="tam-grid tam-grid--expandable">
        {displayTams.map((tam) => {
          const csat = csatIndicator(tam.metrics.avgCsat);
          const expanded = expandedId === tam.tam_id;
          const dc = tam.metrics.dispositionCounts ?? {};
          const tamMeta = allTams.find((t) => t.id === tam.tam_id);
          const activityTotal = tam.metrics.activityTotal ?? sumPortfolioActivityBreakdown(getPortfolioActivityBreakdown(tam.metrics));

          return (
            <div key={tam.tam_id} className={`tam-card tam-card--expandable ${expanded ? 'tam-card--expanded' : ''}`}>
              <button
                type="button"
                className="tam-card__header-btn"
                onClick={() => setExpandedId(expanded ? null : tam.tam_id)}
                aria-expanded={expanded}
              >
                <div className="tam-card__title-row">
                  <h3>
                    <span className="tam-card__total">
                      <span className="tam-card__total-label">Total</span>
                      <span className="tam-card__total-handled">{activityTotal}</span>
                    </span>
                    <span className="tam-card__name">{tam.tam_name}</span>
                    {tamMeta?.on_vacation && <VacationIndicator showLabel />}
                  </h3>
                  <span className="tam-card__chevron">{expanded ? '▲' : '▼'}</span>
                </div>
                <span className="tam-card__accounts-count">
                  {tam.accounts?.length ?? 0} account{(tam.accounts?.length ?? 0) !== 1 ? 's' : ''}
                </span>
                <DispositionBar counts={dc} />
                <div className="tam-card__stats">
                  <TamStatCell
                    label="Created"
                    value={tam.metrics.totalTickets}
                    title="Tickets created in the selected period"
                  />
                  <TamStatCell
                    label="Other"
                    value={tam.metrics.otherHandledCount ?? 0}
                    title="Resolved, closed, or reopened in period on tickets not created in this period"
                  />
                  <TamStatCell
                    label="P1/P2"
                    value={tam.metrics.p1p2Count}
                    tone="critical"
                  />
                  <TamStatCell
                    label="Resolved"
                    value={tam.metrics.resolvedCount ?? 0}
                    title="Created in period and resolved in period — click to drill down"
                    onClick={(e) => openTamDrilldown(KPI_KEYS.RESOLVED, tam.tam_id, e)}
                    tone="good"
                  />
                  <TamStatCell
                    label="Closed"
                    value={tam.metrics.closedInPeriodCount ?? 0}
                    title="Created in period and closed in period — click to drill down"
                    onClick={(e) => openTamDrilldown(KPI_KEYS.CLOSED, tam.tam_id, e)}
                    tone="closed"
                  />
                  <TamStatCell label="IP" value={dc.in_progress ?? 0} />
                  <TamStatCell label="WFR" value={dc.waiting_for_response ?? 0} />
                  <TamStatCell label="Esc" value={dc.escalated ?? 0} />
                  <TamStatCell
                    label="CSAT"
                    value={tam.metrics.avgCsat?.toFixed(1) ?? '—'}
                    valueStyle={{ color: csat.color }}
                  />
                </div>
              </button>

              {expanded && (
                <TamDetail
                  tam={tam}
                  onSelectAccount={onSelectAccount}
                  onFilterTam={onFilterTam}
                  onDrilldown={onDrilldown}
                />
              )}
            </div>
          );
        })}
      </div>
    </article>
  );
}
