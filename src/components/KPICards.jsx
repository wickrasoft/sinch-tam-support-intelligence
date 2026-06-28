import { useEffect, useMemo, useState } from 'react';
import { formatDurationHours, csatIndicator } from '../utils/metrics';
import { formatDelta, formatDurationDelta } from '../utils/health';
import { KPI_KEYS } from '../utils/kpiDrilldown';
import { enrichTamsWithAvailability, getTamAvailabilityStatus } from '../utils/tamStatus';
import { STATUS_PAGE_URL } from '../utils/sinchIncidents';

function DeltaBadge({ delta, deltaInHours = false }) {
  if (!delta) return null;
  const { text, className } = deltaInHours
    ? formatDurationDelta(delta)
    : formatDelta(delta);
  if (text === '—') return null;

  return (
    <span className={`kpi-card__delta ${className}`}>
      {delta.improved ? '▲' : '▼'} {text}
    </span>
  );
}

export default function KPICards({
  summary,
  comparison,
  onDrilldown,
  tams = [],
  referenceDate,
  incidentCount = 0,
  incidentStatus = 'loading',
}) {
  const csat = csatIndicator(summary.avgCsat, summary.csatPct);
  const escalatedCount = summary.dispositionCounts?.escalated ?? 0;
  const resolvedPct = summary.totalTickets
    ? Math.round((summary.resolvedCount / summary.totalTickets) * 100)
    : 0;

  // Live, real-time available TAM count (refreshes every 30s like the portfolio panel).
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const availableTamCount = useMemo(() => {
    if (!tams.length) return 0;
    const enriched = enrichTamsWithAvailability(tams, referenceDate, now);
    return enriched.filter((t) => getTamAvailabilityStatus(t, referenceDate, now) === 'online').length;
  }, [tams, referenceDate, now]);

  const fcrPctLabel = summary.fcrPct != null ? `${summary.fcrPct.toFixed(0)}%` : '—';
  const reopenRate = summary.reopenRate ?? 0;
  const reopenRateLabel = `${reopenRate.toFixed(1)}%`;
  const incidentSub = incidentStatus === 'loading'
    ? 'Loading from status.sinch.com…'
    : incidentStatus === 'error'
      ? 'status.sinch.com unavailable'
      : 'Minor incidents on status.sinch.com';

  const cards = [
    {
      key: KPI_KEYS.CREATED,
      title: 'Tickets Created',
      value: summary.totalTickets,
      sub: 'Opened by clients in period',
      accent: 'neutral',
      delta: comparison?.totalTickets,
    },
    {
      key: KPI_KEYS.P1,
      title: 'P1 Tickets',
      value: summary.p1Count,
      sub: `${summary.p1p2Count} P1+P2 total`,
      accent: 'critical',
      delta: comparison?.p1Count,
    },
    {
      key: KPI_KEYS.P2,
      title: 'P2 Tickets',
      value: summary.p2Count,
      sub: 'High priority in period',
      accent: 'high',
      delta: comparison?.p2Count,
    },
    {
      key: KPI_KEYS.NEEDS_ATTENTION,
      title: 'Needs Attention',
      value: summary.needsAttention,
      sub: 'Flagged for TAM review',
      accent: summary.needsAttention > 0 ? 'warn' : 'good',
      delta: comparison?.needsAttention,
    },
    {
      key: KPI_KEYS.PORTFOLIO_ESC,
      title: 'Escalated',
      value: escalatedCount,
      sub: 'Active escalations in period',
      accent: escalatedCount > 0 ? 'critical' : 'neutral',
      delta: comparison?.escalated,
    },
    {
      key: KPI_KEYS.ESC_SERVICEOPS,
      title: 'ServiceOps Esc',
      value: summary.ongoingServiceOpsEsc ?? 0,
      sub: 'Unresolved Service Ops (TOR) escalations',
      accent: (summary.ongoingServiceOpsEsc ?? 0) > 0 ? 'warn' : 'good',
    },
    {
      key: KPI_KEYS.ESC_SUPPLIER,
      title: 'Supplier Esc',
      value: summary.ongoingSupplierEsc ?? 0,
      sub: 'Unresolved Supplier (SINCHSUP) escalations',
      accent: (summary.ongoingSupplierEsc ?? 0) > 0 ? 'warn' : 'good',
    },
    {
      key: KPI_KEYS.SLA,
      title: 'SLA Breaches',
      value: summary.slaBreaches,
      sub: `${summary.slaBreachRate.toFixed(1)}% breach rate · FR: ${summary.firstResponseBreaches} / Res: ${summary.resolutionBreaches}`,
      accent: summary.slaBreachRate > 15 ? 'critical' : 'warn',
      delta: comparison?.slaBreaches,
    },
    {
      key: KPI_KEYS.RESOLVED,
      title: 'Resolved',
      value: summary.resolvedCount,
      sub: `${resolvedPct}% of created resolved in period`,
      accent: 'good',
      delta: comparison?.resolvedCount,
    },
    {
      key: KPI_KEYS.FCR,
      title: 'First Contact Resolution',
      value: summary.fcrCount ?? 0,
      sub: `${fcrPctLabel} resolved without reopen`,
      accent: 'good',
    },
    {
      key: KPI_KEYS.CSAT,
      title: 'CSAT Score',
      value: summary.avgCsat != null ? summary.avgCsat.toFixed(1) : '—',
      sub: csat.label,
      accent: csat.level,
      color: csat.color,
      delta: comparison?.avgCsat,
    },
    {
      key: KPI_KEYS.MTTA,
      title: 'MTTA',
      value: formatDurationHours(summary.avgMtta),
      sub: 'Mean time to acknowledge (hours)',
      accent: 'neutral',
      delta: comparison?.avgMtta,
    },
    {
      key: KPI_KEYS.MTTR,
      title: 'MTTR',
      value: formatDurationHours(summary.avgMttr),
      sub: 'Mean time to resolve (hours)',
      accent: 'neutral',
      delta: comparison?.avgMttr,
    },
    {
      key: KPI_KEYS.REOPENINGS,
      title: 'Reopenings',
      value: summary.reopenings,
      sub: `${summary.ticketsWithReopens} tickets reopened`,
      accent: summary.reopenings > 10 ? 'warn' : 'neutral',
      delta: comparison?.reopenings,
    },
    {
      key: KPI_KEYS.REOPEN_RATE,
      title: 'Reopen Rate',
      value: reopenRateLabel,
      sub: `${summary.ticketsWithReopens} of ${summary.resolvedCount} resolved reopened`,
      accent: reopenRate > 10 ? 'warn' : reopenRate > 0 ? 'neutral' : 'good',
    },
    {
      key: KPI_KEYS.CSAT_RESPONSE,
      title: 'CSAT Response',
      value: summary.csatPct != null ? `${summary.csatPct.toFixed(0)}%` : '—',
      sub: `${summary.csatRatedCount} ratings`,
      accent: 'good',
    },
    {
      key: 'available_tams',
      title: 'Available TAMs',
      value: `${availableTamCount}/${tams.length}`,
      sub: 'Online right now',
      accent: availableTamCount > 0 ? 'good' : 'warn',
      live: true,
      static: true,
    },
    {
      key: 'ongoing_incidents',
      title: 'Ongoing Incidents',
      value: incidentCount,
      sub: incidentSub,
      accent: incidentCount > 0 ? 'warn' : 'good',
      live: true,
      href: STATUS_PAGE_URL,
    },
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => {
        const titleNode = (
          <span className="kpi-card__title">
            {card.live && <span className="kpi-card__live-dot" aria-hidden="true" />}
            {card.title}
          </span>
        );
        const innerNodes = (
          <>
            {titleNode}
            <span className="kpi-card__value">{card.value}</span>
            <span className="kpi-card__sub">{card.sub}</span>
            {card.delta && (
              <DeltaBadge
                delta={card.delta}
                deltaInHours={card.key === KPI_KEYS.MTTA || card.key === KPI_KEYS.MTTR}
              />
            )}
          </>
        );
        const className = `kpi-card kpi-card--${card.accent}`;
        const accentStyle = card.color ? { '--kpi-accent': card.color } : undefined;

        // Live link card (e.g. Ongoing Incidents → status page).
        if (card.href) {
          return (
            <a
              key={card.key}
              href={card.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`${className} kpi-card--clickable`}
              style={accentStyle}
              title="Open status.sinch.com"
            >
              {innerNodes}
              <span className="kpi-card__hint">Open status page ↗</span>
            </a>
          );
        }

        // Live informational card (e.g. Available TAMs) — not a drilldown.
        if (card.static) {
          return (
            <div key={card.key} className={className} style={accentStyle}>
              {innerNodes}
              <span className="kpi-card__hint kpi-card__hint--live">Live · real time</span>
            </div>
          );
        }

        return (
          <button
            key={card.key}
            type="button"
            className={`${className} kpi-card--clickable`}
            style={accentStyle}
            onClick={() => onDrilldown?.(card.key)}
            title={`Click to drill down into ${card.title}`}
          >
            {innerNodes}
            <span className="kpi-card__hint">Click for details</span>
          </button>
        );
      })}
    </section>
  );
}
