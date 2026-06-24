import { useState, useEffect, useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import TamStatusIcon from './TamStatusIcon';
import { formatDurationHours, csatIndicator, getPortfolioActivityBreakdown, sumPortfolioActivityBreakdown } from '../utils/metrics';
import { computeHealthScore, healthIndicator } from '../utils/health';
import { KPI_KEYS } from '../utils/kpiDrilldown';
import { formatAccountCount, formatTamDisplayName } from '../utils/text';
import { TAM_REGIONS } from '../utils/regionMetrics';
import {
  enrichTamsWithAvailability,
  getTamAvailabilityStatus,
  normalizeTamRegion,
  TAM_STATUS_CONFIG,
} from '../utils/tamStatus';

function sortTamsByRegionAndName(tams, allTams) {
  const regionOrder = (tam) => {
    const meta = allTams.find((t) => t.id === tam.tam_id);
    const region = normalizeTamRegion(meta?.region);
    const index = TAM_REGIONS.indexOf(region);
    return index === -1 ? TAM_REGIONS.length : index;
  };

  return [...tams].sort((a, b) => {
    const regionDiff = regionOrder(a) - regionOrder(b);
    if (regionDiff !== 0) return regionDiff;
    return a.tam_name.localeCompare(b.tam_name);
  });
}

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

const PORTFOLIO_STAT_ITEMS = [
  { key: 'p1p2', label: 'P1/P2', tone: 'critical', title: 'P1 and P2 tickets created in period — click to drill down', kpiKey: KPI_KEYS.P1P2 },
  { key: 'p3p5', label: 'P3-P5', title: 'P3, P4, and P5 tickets created in period — click to drill down', kpiKey: KPI_KEYS.P3P5 },
  { key: 'created', label: 'Created', title: 'Tickets created in the selected period — click to drill down', kpiKey: KPI_KEYS.CREATED },
  { key: 'ip', label: 'IP', title: 'In progress (created in period) — click to drill down', kpiKey: KPI_KEYS.PORTFOLIO_IP },
  { key: 'esc', label: 'Esc', title: 'Escalated (created in period) — click to drill down', kpiKey: KPI_KEYS.PORTFOLIO_ESC },
  { key: 'wfr', label: 'WFR', title: 'Waiting for response (created in period) — click to drill down', kpiKey: KPI_KEYS.PORTFOLIO_WFR },
  {
    key: 'resolved',
    label: 'Resolved',
    tone: 'good',
    title: 'Created in period and resolved in period — click to drill down',
    kpiKey: KPI_KEYS.RESOLVED,
  },
  {
    key: 'closed',
    label: 'Closed',
    tone: 'closed',
    title: 'Created in period and closed in period — click to drill down',
    kpiKey: KPI_KEYS.CLOSED,
  },
];

const DISPOSITION_KPI_KEYS = {
  in_progress: KPI_KEYS.PORTFOLIO_IP,
  waiting_for_response: KPI_KEYS.PORTFOLIO_WFR,
  temp_resolution: null,
  escalated: KPI_KEYS.PORTFOLIO_ESC,
};

function getPortfolioStatValue(key, metrics) {
  const breakdown = metrics.activityBreakdown ?? getPortfolioActivityBreakdown(metrics);
  return breakdown[key] ?? 0;
}

function TamCardAccountsBadge({ count }) {
  const value = Number(count) || 0;

  return (
    <span
      className="tam-card__badge tam-card__badge--accounts"
      title={formatAccountCount(value)}
    >
      <span className="tam-card__badge-label">Accts</span>
      <span className="tam-card__badge-value">{value}</span>
    </span>
  );
}

function TamCardCsatBadge({ avgCsat, tamId, onDrilldown }) {
  const csat = csatIndicator(avgCsat);
  const value = avgCsat?.toFixed(1) ?? '—';

  const openDrilldown = (event) => {
    event.stopPropagation();
    onDrilldown?.(KPI_KEYS.CSAT, tamId ? { tamId } : undefined);
  };

  if (onDrilldown) {
    return (
      <button
        type="button"
        className="tam-card__badge tam-card__badge--csat tam-card__badge--clickable"
        title="Average CSAT for ratings in period — click to drill down"
        onClick={openDrilldown}
      >
        <span className="tam-card__badge-label">CSAT</span>
        <span className="tam-card__badge-value" style={{ color: csat.color }}>{value}</span>
      </button>
    );
  }

  return (
    <span className="tam-card__badge tam-card__badge--csat">
      <span className="tam-card__badge-label">CSAT</span>
      <span className="tam-card__badge-value" style={{ color: csat.color }}>{value}</span>
    </span>
  );
}

function PortfolioStatCells({ metrics, onDrilldown, tamId }) {
  const drillContext = tamId ? { tamId } : undefined;

  const openDrilldown = (kpiKey, event) => {
    event.stopPropagation();
    onDrilldown?.(kpiKey, drillContext);
  };

  const renderStat = ({ key, label, tone, title, kpiKey }) => (
    <TamStatCell
      key={key}
      label={label}
      value={getPortfolioStatValue(key, metrics)}
      title={title}
      tone={tone}
      onClick={kpiKey && onDrilldown ? (e) => openDrilldown(kpiKey, e) : undefined}
    />
  );

  return (
    <div className="tam-card__stats tam-card__stats--compact tam-card__stats--portfolio">
      {PORTFOLIO_STAT_ITEMS.map(renderStat)}
    </div>
  );
}

function PortfolioSummaryBar({ breakdown, total, portfolioCsat, portfolioCsatStyle, onDrilldown }) {
  const openDrilldown = (kpiKey) => {
    onDrilldown?.(kpiKey);
  };

  return (
    <div className="tam-overview-summary tam-overview-summary--compact tam-overview-summary--single-row">
      <button
        type="button"
        className="tam-overview-summary__item tam-overview-summary__item--total tam-overview-summary__item--clickable"
        title="All tickets created in period — click to drill down"
        onClick={() => openDrilldown(KPI_KEYS.CREATED)}
      >
        <span className="tam-overview-summary__label">Total</span>
        <span className="tam-overview-summary__value">{total}</span>
      </button>
      {PORTFOLIO_STAT_ITEMS.map(({ key, label, kpiKey, title }) => (
        <button
          key={key}
          type="button"
          className="tam-overview-summary__item tam-overview-summary__item--clickable"
          title={title}
          onClick={() => openDrilldown(kpiKey)}
        >
          <span className="tam-overview-summary__label">{label}</span>
          <span className="tam-overview-summary__value">{breakdown[key]}</span>
        </button>
      ))}
      <button
        type="button"
        className="tam-overview-summary__item tam-overview-summary__item--clickable"
        title="Average CSAT for ratings in period — click to drill down"
        onClick={() => openDrilldown(KPI_KEYS.CSAT)}
      >
        <span className="tam-overview-summary__label">CSAT</span>
        <span
          className="tam-overview-summary__value"
          style={{ color: portfolioCsatStyle.color }}
        >
          {portfolioCsat?.toFixed(1) ?? '—'}
        </span>
      </button>
    </div>
  );
}

function getAvailabilityDetails(tam, status) {
  const defaultDetail = TAM_STATUS_CONFIG[status]?.detail;
  const details = [];

  if (status === 'vacation' && tam.vacation_until) {
    details.push(`Returns ${format(parseISO(tam.vacation_until), 'MMM d, yyyy')}`);
  }
  if (status === 'sick') {
    details.push(
      tam.sick_until
        ? `Returns ${format(parseISO(tam.sick_until), 'MMM d, yyyy')}`
        : 'Out sick',
    );
  }
  if ((status === 'vacation' || status === 'sick') && tam.backup_tam_name) {
    details.push(`Backup ${tam.backup_tam_name}`);
  }
  if (defaultDetail && status !== 'vacation' && status !== 'sick') {
    details.push(defaultDetail);
  }

  return details;
}

function TamStatCell({ label, value, title, onClick, tone, valueStyle, className: extraClassName }) {
  const Tag = onClick ? 'button' : 'div';
  const className = [
    'tam-card__stat',
    extraClassName,
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

function TamDetail({ tam, tamMeta, availabilityStatus, availabilityDetails, onSelectAccount, onFilterTam, onDrilldown }) {
  const dc = tam.metrics.dispositionCounts ?? {};
  const health = healthIndicator(computeHealthScore(tam.metrics));
  const tamContext = { tamId: tam.tam_id };

  const openDrilldown = (kpiKey, event, extraContext = {}) => {
    event?.stopPropagation?.();
    onDrilldown?.(kpiKey, { ...tamContext, ...extraContext });
  };

  return (
    <div className="tam-detail">
      <div className="tam-detail__header">
        <div>
          {tamMeta && (
            <div className={`tam-detail__availability tam-detail__availability--${availabilityStatus}`}>
              <TamStatusIcon tam={tamMeta} status={availabilityStatus} className="tam-detail__status-icon" />
              <span className="tam-detail__region">{normalizeTamRegion(tamMeta.region)}</span>
              {availabilityDetails.map((detail) => (
                <span key={detail} className="tam-detail__availability-detail">{detail}</span>
              ))}
            </div>
          )}
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
          title="Tickets created in period and resolved during the period — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.RESOLVED, e)}
          tone="good"
        />
        <TamStatCell
          label="Closed"
          value={tam.metrics.closedInPeriodCount ?? 0}
          title="Tickets created in period and closed during the period — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.CLOSED, e)}
          tone="closed"
        />
        <TamStatCell
          label="MTTA"
          value={formatDurationHours(tam.metrics.avgMtta)}
          title="Mean time to acknowledge (hours, created in period) — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.MTTA, e)}
        />
        <TamStatCell
          label="MTTR"
          value={formatDurationHours(tam.metrics.avgMttr)}
          title="Mean time to resolve (hours, created in period) — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.MTTR, e)}
        />
        <TamStatCell
          label="Reopens"
          value={tam.metrics.reopenings ?? 0}
          title="Reopen events in the selected period — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.REOPENINGS, e)}
        />
      </div>

      <div className="tam-detail__dispositions">
        {Object.entries(OPEN_DISPOSITION_LABELS).map(([key, label]) => {
          const kpiKey = DISPOSITION_KPI_KEYS[key];
          return (
            <TamStatCell
              key={key}
              label={label}
              value={dc[key] ?? 0}
              title={kpiKey ? `${label} tickets — click to drill down` : undefined}
              onClick={kpiKey ? (e) => openDrilldown(kpiKey, e) : undefined}
              className="tam-detail__disp-stat"
            />
          );
        })}
        <TamStatCell
          label="Closed"
          value={tam.metrics.closedInPeriodCount ?? 0}
          title="Closed in period — click to drill down"
          onClick={(e) => openDrilldown(KPI_KEYS.CLOSED, e)}
          tone="closed"
          className="tam-detail__disp-stat tam-detail__disp-stat--closed"
        />
      </div>

      <h4 className="tam-detail__accounts-title">
        Dedicated Accounts ({tam.accounts?.length ?? 0})
      </h4>
      <div className="tam-detail__accounts">
        {(tam.accounts ?? []).map((acc) => (
          <div key={acc.id} className="tam-account-row">
            <button
              type="button"
              className="tam-account-row__main"
              onClick={() => onSelectAccount(acc.id)}
            >
              <span className="tam-account-row__name">{acc.name}</span>
              <span className="tam-account-row__tier">{acc.tier}</span>
            </button>
            <button
              type="button"
              className="tam-account-row__stat tam-account-row__stat--clickable"
              title="Tickets created in period — click to drill down"
              onClick={(e) => openDrilldown(KPI_KEYS.CREATED, e, { accountId: acc.id })}
            >
              {acc.ticketCount} created
            </button>
            <button
              type="button"
              className="tam-account-row__stat tam-account-row__stat--clickable"
              title="P1 tickets — click to drill down"
              onClick={(e) => openDrilldown(KPI_KEYS.P1, e, { accountId: acc.id })}
            >
              P1: {acc.metrics.p1Count}
            </button>
            <button
              type="button"
              className="tam-account-row__stat tam-account-row__stat--clickable tam-account-row__stat--resolved"
              title="Resolved in period — click to drill down"
              onClick={(e) => openDrilldown(KPI_KEYS.RESOLVED, e, { accountId: acc.id })}
            >
              Resolved: {acc.metrics.resolvedCount ?? 0}
            </button>
            <button
              type="button"
              className="tam-account-row__stat tam-account-row__stat--clickable tam-account-row__stat--closed"
              title="Closed in period — click to drill down"
              onClick={(e) => openDrilldown(KPI_KEYS.CLOSED, e, { accountId: acc.id })}
            >
              Closed: {acc.metrics.closedInPeriodCount ?? 0}
            </button>
            <button
              type="button"
              className="tam-account-row__stat tam-account-row__stat--clickable"
              title="SLA breaches — click to drill down"
              onClick={(e) => openDrilldown(KPI_KEYS.SLA, e, { accountId: acc.id })}
            >
              SLA: {acc.metrics.slaBreaches}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TamOverview({
  tamMetrics,
  allTams,
  referenceDate,
  selectedRegion,
  onSelectAccount,
  onFilterTam,
  onDrilldown,
}) {
  const [expandedId, setExpandedId] = useState(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const enrichedTamsById = useMemo(() => {
    const enriched = enrichTamsWithAvailability(allTams, referenceDate, now);
    return new Map(enriched.map((tam) => [tam.id, tam]));
  }, [allTams, referenceDate, now]);

  const onlineCount = useMemo(
    () => allTams.filter((tam) => {
      const resolved = enrichedTamsById.get(tam.id) ?? tam;
      return getTamAvailabilityStatus(resolved, referenceDate, now) === 'online';
    }).length,
    [allTams, enrichedTamsById, referenceDate, now],
  );

  const displayTams = useMemo(() => {
    const base = tamMetrics.length > 0
      ? tamMetrics
      : allTams.map((t) => ({
          tam_id: t.id,
          tam_name: t.name,
          tam_email: t.email,
          metrics: {
            totalTickets: 0,
            p1p2Count: 0,
            p3p5Count: 0,
            resolvedCount: 0,
            closedInPeriodCount: 0,
            handledCount: 0,
            activityTotal: 0,
            activityBreakdown: {
              p1p2: 0,
              p3p5: 0,
              created: 0,
              ip: 0,
              esc: 0,
              wfr: 0,
              resolved: 0,
              closed: 0,
            },
            dispositionCounts: {},
            avgCsat: null,
            avgMtta: null,
            reopenings: 0,
            slaBreaches: 0,
          },
          accounts: [],
        }));

    const filtered = !selectedRegion
      ? base
      : base.filter((tam) => {
          const meta = allTams.find((t) => t.id === tam.tam_id);
          return normalizeTamRegion(meta?.region) === selectedRegion;
        });

    return sortTamsByRegionAndName(filtered, allTams);
  }, [tamMetrics, allTams, selectedRegion]);

  const portfolioBreakdown = displayTams.reduce(
    (acc, tam) => {
      const breakdown = tam.metrics.activityBreakdown ?? getPortfolioActivityBreakdown(tam.metrics);
      return PORTFOLIO_STAT_ITEMS.reduce(
        (row, { key }) => ({ ...row, [key]: row[key] + (breakdown[key] ?? 0) }),
        acc,
      );
    },
    Object.fromEntries(PORTFOLIO_STAT_ITEMS.map(({ key }) => [key, 0])),
  );
  const portfolioTotal = sumPortfolioActivityBreakdown(portfolioBreakdown);
  const portfolioCsatValues = displayTams
    .map((tam) => tam.metrics.avgCsat)
    .filter((value) => value != null);
  const portfolioCsat = portfolioCsatValues.length
    ? portfolioCsatValues.reduce((sum, value) => sum + value, 0) / portfolioCsatValues.length
    : null;
  const portfolioCsatStyle = csatIndicator(portfolioCsat);

  return (
    <article className="panel tam-overview-panel">
      <header className="panel__header">
        <div className="ops-panel__title-row tam-overview-panel__title-row">
          <h2>TAM Portfolio &amp; Availability</h2>
          <div className="tam-overview-online" title="TAMs currently online">
            <span className="tam-overview-online__label">Online</span>
            <span className="ops-panel__count ops-panel__count--good">
              {onlineCount}/{allTams.length}
            </span>
          </div>
        </div>
        <PortfolioSummaryBar
          breakdown={portfolioBreakdown}
          total={portfolioTotal}
          portfolioCsat={portfolioCsat}
          portfolioCsatStyle={portfolioCsatStyle}
          onDrilldown={onDrilldown}
        />
      </header>

      <div className="tam-grid tam-grid--expandable">
        {displayTams.map((tam) => {
          const expanded = expandedId === tam.tam_id;
          const tamMeta = enrichedTamsById.get(tam.tam_id) ?? allTams.find((t) => t.id === tam.tam_id);
          const availabilityStatus = tamMeta
            ? getTamAvailabilityStatus(tamMeta, referenceDate, now)
            : 'online';
          const availabilityDetails = tamMeta ? getAvailabilityDetails(tamMeta, availabilityStatus) : [];
          const activityTotal = tam.metrics.activityTotal ?? sumPortfolioActivityBreakdown(getPortfolioActivityBreakdown(tam.metrics));

          return (
            <div key={tam.tam_id} className={`tam-card tam-card--expandable ${expanded ? 'tam-card--expanded' : ''}`}>
              <button
                type="button"
                className="tam-card__header-btn"
                onClick={() => setExpandedId(expanded ? null : tam.tam_id)}
                aria-expanded={expanded}
              >
                <div className="tam-card__head">
                  <div className="tam-card__title-row">
                    <h3>
                      {tamMeta && (
                        <span
                          className={`tam-card__online-badge tam-card__online-badge--${availabilityStatus}`}
                        >
                          <TamStatusIcon
                            tam={tamMeta}
                            status={availabilityStatus}
                            className="tam-card__online-icon"
                            showTooltip
                            details={availabilityDetails}
                          />
                        </span>
                      )}
                      <span className="tam-card__name">
                        {formatTamDisplayName(tam.tam_name, tamMeta?.region)}
                      </span>
                    </h3>
                    <div className="tam-card__corner">
                      <div className="tam-card__badge-group">
                        <TamCardAccountsBadge count={tam.accounts?.length ?? 0} />
                        <button
                          type="button"
                          className="tam-card__badge tam-card__badge--total tam-card__badge--clickable"
                          title="All tickets created in period — click to drill down"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDrilldown?.(KPI_KEYS.CREATED, { tamId: tam.tam_id });
                          }}
                        >
                          <span className="tam-card__badge-label">Total</span>
                          <span className="tam-card__badge-value">{activityTotal}</span>
                        </button>
                        <TamCardCsatBadge
                          avgCsat={tam.metrics.avgCsat}
                          tamId={tam.tam_id}
                          onDrilldown={onDrilldown}
                        />
                      </div>
                      <span className="tam-card__chevron" aria-hidden="true">{expanded ? '▲' : '▼'}</span>
                    </div>
                  </div>
                  {availabilityDetails.length > 0 && (
                    <div className="tam-card__meta-row">
                      <span className="tam-card__meta-text">
                        {availabilityDetails.join(' · ')}
                      </span>
                    </div>
                  )}
                </div>
                <PortfolioStatCells
                  metrics={tam.metrics}
                  tamId={tam.tam_id}
                  onDrilldown={onDrilldown}
                />
              </button>

              {expanded && (
                <TamDetail
                  tam={tam}
                  tamMeta={tamMeta}
                  availabilityStatus={availabilityStatus}
                  availabilityDetails={availabilityDetails}
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
