import { formatDuration, csatIndicator } from '../utils/metrics';
import { formatDelta } from '../utils/health';
import { KPI_KEYS } from '../utils/kpiDrilldown';

function DeltaBadge({ delta }) {
  if (!delta) return null;
  const { text, className } = formatDelta(delta);
  if (text === '—') return null;

  return (
    <span className={`kpi-card__delta ${className}`}>
      {delta.improved ? '▲' : '▼'} {text}
    </span>
  );
}

export default function KPICards({ summary, comparison, onDrilldown }) {
  const csat = csatIndicator(summary.avgCsat, summary.csatPct);

  const cards = [
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
      sub: `${summary.totalTickets} tickets in period`,
      accent: 'high',
      delta: comparison?.p2Count,
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
      value: formatDuration(summary.avgMtta),
      sub: 'Mean time to acknowledge',
      accent: 'neutral',
      delta: comparison?.avgMtta,
    },
    {
      key: KPI_KEYS.MTTR,
      title: 'MTTR',
      value: formatDuration(summary.avgMttr),
      sub: 'Mean time to resolve',
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
          {card.delta && <DeltaBadge delta={card.delta} />}
          <span className="kpi-card__hint">Click for details</span>
        </button>
      ))}
    </section>
  );
}
