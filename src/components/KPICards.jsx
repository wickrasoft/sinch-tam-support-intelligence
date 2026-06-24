import { formatDurationHours, csatIndicator } from '../utils/metrics';
import { formatDelta, formatDurationDelta } from '../utils/health';
import { KPI_KEYS } from '../utils/kpiDrilldown';

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

export default function KPICards({ summary, comparison, onDrilldown }) {
  const csat = csatIndicator(summary.avgCsat, summary.csatPct);
  const escalatedCount = summary.dispositionCounts?.escalated ?? 0;
  const resolvedPct = summary.totalTickets
    ? Math.round((summary.resolvedCount / summary.totalTickets) * 100)
    : 0;

  const cards = [
    {
      key: KPI_KEYS.CREATED,
      title: 'Tickets Created',
      value: summary.totalTickets,
      sub: 'New tickets in period',
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
      key: KPI_KEYS.CSAT_RESPONSE,
      title: 'CSAT Response',
      value: summary.csatPct != null ? `${summary.csatPct.toFixed(0)}%` : '—',
      sub: `${summary.csatRatedCount} ratings`,
      accent: 'good',
    },
  ];

  return (
    <section className="kpi-grid">
      {cards.map((card) => (
        <button
          key={card.key}
          type="button"
          className={`kpi-card kpi-card--clickable kpi-card--${card.accent}`}
          style={card.color ? { '--kpi-accent': card.color } : undefined}
          onClick={() => onDrilldown?.(card.key)}
          title={`Click to drill down into ${card.title}`}
        >
          <span className="kpi-card__title">{card.title}</span>
          <span className="kpi-card__value">{card.value}</span>
          <span className="kpi-card__sub">{card.sub}</span>
          {card.delta && (
            <DeltaBadge
              delta={card.delta}
              deltaInHours={card.key === KPI_KEYS.MTTA || card.key === KPI_KEYS.MTTR}
            />
          )}
          <span className="kpi-card__hint">Click for details</span>
        </button>
      ))}
    </section>
  );
}
