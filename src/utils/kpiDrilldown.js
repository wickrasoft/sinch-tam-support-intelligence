import {
  formatDuration,
  getReopenedTicketsInPeriod,
  getCsatRatedTicketsInPeriod,
  getCsatOfferedTicketsInPeriod,
  getResolvedTicketsInPeriod,
  getClosedTicketsInPeriod,
  countTicketReopenEventsInPeriod,
} from './metrics';

export const KPI_KEYS = {
  P1: 'p1',
  P2: 'p2',
  SLA: 'sla',
  CSAT: 'csat',
  MTTA: 'mtta',
  MTTR: 'mttr',
  REOPENINGS: 'reopenings',
  CSAT_RESPONSE: 'csat_response',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const KPI_CONFIG = {
  [KPI_KEYS.P1]: {
    title: 'P1 Tickets — Critical',
    description: 'All P1 (critical priority) tickets in the selected period.',
  },
  [KPI_KEYS.P2]: {
    title: 'P2 Tickets — High',
    description: 'All P2 (high priority) tickets in the selected period.',
  },
  [KPI_KEYS.SLA]: {
    title: 'SLA Breaches',
    description: 'Tickets that breached first-response and/or resolution SLA targets.',
  },
  [KPI_KEYS.CSAT]: {
    title: 'Customer Satisfaction (CSAT)',
    description: 'CSAT survey scores, comments, and rating distribution for responses received in the selected period.',
  },
  [KPI_KEYS.MTTA]: {
    title: 'Mean Time to Acknowledge (MTTA)',
    description: 'Time from ticket creation to first agent response, by ticket and account.',
  },
  [KPI_KEYS.MTTR]: {
    title: 'Mean Time to Resolve (MTTR)',
    description: 'Time from creation to resolution for solved/closed tickets.',
  },
  [KPI_KEYS.REOPENINGS]: {
    title: 'Ticket Reopenings',
    description: 'Tickets reopened after initial resolution within the selected period.',
  },
  [KPI_KEYS.CSAT_RESPONSE]: {
    title: 'CSAT Response Rate',
    description: 'Survey participation — rated vs offered vs no survey.',
  },
  [KPI_KEYS.RESOLVED]: {
    title: 'Tickets Resolved',
    description: 'Tickets created in the selected period that were marked solved during the same period.',
  },
  [KPI_KEYS.CLOSED]: {
    title: 'Tickets Closed',
    description: 'Tickets created in the selected period that were closed during the same period.',
  },
};

export function getTicketsForKpi(tickets, kpiKey, context = {}) {
  const { allTickets, filters } = context;

  switch (kpiKey) {
    case KPI_KEYS.P1:
      return tickets.filter((t) => t.priority === 'P1');
    case KPI_KEYS.P2:
      return tickets.filter((t) => t.priority === 'P2');
    case KPI_KEYS.SLA:
      return tickets.filter((t) => t.sla.any_breach);
    case KPI_KEYS.CSAT:
      if (allTickets && filters) {
        return getCsatRatedTicketsInPeriod(allTickets, filters);
      }
      return tickets.filter((t) => t.csat.rated);
    case KPI_KEYS.MTTA:
      return [...tickets].sort((a, b) => (b.mtta_minutes ?? 0) - (a.mtta_minutes ?? 0));
    case KPI_KEYS.MTTR:
      return tickets
        .filter((t) => t.mttr_minutes != null)
        .sort((a, b) => b.mttr_minutes - a.mttr_minutes);
    case KPI_KEYS.REOPENINGS:
      if (allTickets && filters) {
        return getReopenedTicketsInPeriod(allTickets, filters);
      }
      return tickets.filter((t) => t.reopen_count > 0);
    case KPI_KEYS.CSAT_RESPONSE:
      if (allTickets && filters) {
        return getCsatOfferedTicketsInPeriod(allTickets, filters);
      }
      return tickets.filter((t) => t.csat.offered);
    case KPI_KEYS.RESOLVED:
      if (filters) {
        return getResolvedTicketsInPeriod(tickets, filters);
      }
      return tickets.filter((t) => t.solved_at);
    case KPI_KEYS.CLOSED:
      if (filters) {
        return getClosedTicketsInPeriod(tickets, filters);
      }
      return tickets.filter((t) => t.closed_at);
    default:
      return tickets;
  }
}

export function getAccountBreakdown(tickets, kpiKey, filters) {
  const map = new Map();
  for (const t of tickets) {
    const key = t.account_id;
    if (!map.has(key)) {
      map.set(key, {
        account_id: t.account_id,
        account_name: t.account_name,
        tam_name: t.tam_name,
        count: 0,
        reopenEvents: 0,
        avgMtta: [],
        avgMttr: [],
        csatScores: [],
      });
    }
    const row = map.get(key);
    row.count += 1;
    if (kpiKey === KPI_KEYS.REOPENINGS && filters) {
      row.reopenEvents += countTicketReopenEventsInPeriod(t, filters);
    }
    if (t.mtta_minutes != null) row.avgMtta.push(t.mtta_minutes);
    if (t.mttr_minutes != null) row.avgMttr.push(t.mttr_minutes);
    if (t.csat.rated) row.csatScores.push(t.csat.score);
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      avgMttaVal: row.avgMtta.length
        ? row.avgMtta.reduce((s, v) => s + v, 0) / row.avgMtta.length
        : null,
      avgMttrVal: row.avgMttr.length
        ? row.avgMttr.reduce((s, v) => s + v, 0) / row.avgMttr.length
        : null,
      avgCsat: row.csatScores.length
        ? row.csatScores.reduce((s, v) => s + v, 0) / row.csatScores.length
        : null,
    }))
    .sort((a, b) => b.count - a.count);
}

export function getCsatDistribution(tickets) {
  const rated = tickets.filter((t) => t.csat.rated);
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const t of rated) {
    if (dist[t.csat.score] != null) dist[t.csat.score] += 1;
  }
  return { dist, rated: rated.length, offered: tickets.filter((t) => t.csat.offered).length, total: tickets.length };
}

export function getSlaBreakdown(tickets) {
  const breached = tickets.filter((t) => t.sla.any_breach);
  return {
    total: breached.length,
    firstResponseOnly: breached.filter((t) => t.sla.first_response_breached && !t.sla.resolution_breached).length,
    resolutionOnly: breached.filter((t) => !t.sla.first_response_breached && t.sla.resolution_breached).length,
    both: breached.filter((t) => t.sla.first_response_breached && t.sla.resolution_breached).length,
  };
}

export function getKpiFilterPatch(kpiKey) {
  switch (kpiKey) {
    case KPI_KEYS.P1:
      return { priority: 'P1', disposition: '', slaBreachOnly: false, kpiFilter: null };
    case KPI_KEYS.P2:
      return { priority: 'P2', disposition: '', slaBreachOnly: false, kpiFilter: null };
    case KPI_KEYS.SLA:
      return { priority: '', disposition: '', slaBreachOnly: true, kpiFilter: null };
    case KPI_KEYS.REOPENINGS:
      return { priority: '', disposition: '', slaBreachOnly: false, kpiFilter: 'reopenings' };
    case KPI_KEYS.RESOLVED:
    case KPI_KEYS.CLOSED:
    case KPI_KEYS.CSAT:
    case KPI_KEYS.CSAT_RESPONSE:
      return { priority: '', disposition: '', slaBreachOnly: false, kpiFilter: kpiKey };
    default:
      return { priority: '', disposition: '', slaBreachOnly: false, kpiFilter: kpiKey };
  }
}

export function formatKpiComparison(kpiKey, summary, comparison, previousSummary) {
  const rows = [];
  switch (kpiKey) {
    case KPI_KEYS.P1:
      rows.push({ label: 'P1 count', current: summary.p1Count, prior: previousSummary?.p1Count, delta: comparison?.p1Count });
      rows.push({ label: 'P1+P2 total', current: summary.p1p2Count, prior: previousSummary?.p1p2Count });
      break;
    case KPI_KEYS.P2:
      rows.push({ label: 'P2 count', current: summary.p2Count, prior: previousSummary?.p2Count, delta: comparison?.p2Count });
      break;
    case KPI_KEYS.SLA:
      rows.push({ label: 'Total breaches', current: summary.slaBreaches, prior: previousSummary?.slaBreaches, delta: comparison?.slaBreaches });
      rows.push({ label: 'Breach rate', current: `${summary.slaBreachRate.toFixed(1)}%`, prior: previousSummary ? `${previousSummary.slaBreachRate.toFixed(1)}%` : '—' });
      rows.push({ label: 'First response', current: summary.firstResponseBreaches, prior: previousSummary?.firstResponseBreaches });
      rows.push({ label: 'Resolution', current: summary.resolutionBreaches, prior: previousSummary?.resolutionBreaches });
      break;
    case KPI_KEYS.CSAT:
      rows.push({ label: 'Average score', current: summary.avgCsat?.toFixed(1) ?? '—', prior: previousSummary?.avgCsat?.toFixed(1) ?? '—', delta: comparison?.avgCsat });
      rows.push({ label: 'Good/Excellent (4+)', current: summary.csatPct != null ? `${summary.csatPct.toFixed(0)}%` : '—', prior: previousSummary?.csatPct != null ? `${previousSummary.csatPct.toFixed(0)}%` : '—' });
      rows.push({ label: 'Responses', current: summary.csatRatedCount, prior: previousSummary?.csatRatedCount });
      break;
    case KPI_KEYS.MTTA:
      rows.push({ label: 'Average MTTA', current: formatDuration(summary.avgMtta), prior: formatDuration(previousSummary?.avgMtta), delta: comparison?.avgMtta });
      break;
    case KPI_KEYS.MTTR:
      rows.push({ label: 'Average MTTR', current: formatDuration(summary.avgMttr), prior: formatDuration(previousSummary?.avgMttr), delta: comparison?.avgMttr });
      break;
    case KPI_KEYS.REOPENINGS:
      rows.push({ label: 'Reopen events', current: summary.reopenings, prior: previousSummary?.reopenings, delta: comparison?.reopenings });
      rows.push({ label: 'Tickets reopened', current: summary.ticketsWithReopens, prior: previousSummary?.ticketsWithReopens });
      break;
    case KPI_KEYS.CSAT_RESPONSE:
      rows.push({ label: 'Response rate', current: summary.csatPct != null ? `${summary.csatPct.toFixed(0)}%` : '—', prior: previousSummary?.csatPct != null ? `${previousSummary.csatPct.toFixed(0)}%` : '—' });
      rows.push({ label: 'Ratings received', current: summary.csatRatedCount, prior: previousSummary?.csatRatedCount });
      break;
    case KPI_KEYS.RESOLVED:
      rows.push({ label: 'Tickets resolved', current: summary.resolvedCount, prior: previousSummary?.resolvedCount, delta: comparison?.resolvedCount });
      break;
    case KPI_KEYS.CLOSED:
      rows.push({ label: 'Tickets closed', current: summary.closedInPeriodCount, prior: previousSummary?.closedInPeriodCount, delta: comparison?.closedInPeriodCount });
      break;
    default:
      break;
  }
  return rows;
}
