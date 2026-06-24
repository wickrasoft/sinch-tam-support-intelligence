import {
  startOfDay,
  startOfWeek,
  startOfMonth,
  startOfQuarter,
  startOfYear,
  endOfDay,
  endOfWeek,
  endOfMonth,
  endOfQuarter,
  endOfYear,
  isWithinInterval,
  parseISO,
  format,
  subDays,
  subMonths,
  subYears,
  differenceInMinutes,
} from 'date-fns';
import { normalizeTamRegion } from './tamAvailability';

export const PERIOD_OPTIONS = [
  { value: 'day', label: 'Daily' },
  { value: 'week', label: 'Weekly' },
  { value: 'month', label: 'Monthly' },
  { value: 'quarter', label: 'Quarterly' },
  { value: 'year', label: 'Yearly' },
];

export function getPeriodBounds(date, period) {
  const d = typeof date === 'string' ? parseISO(date) : date;
  switch (period) {
    case 'day':
      return { start: startOfDay(d), end: endOfDay(d) };
    case 'week':
      return { start: startOfWeek(d, { weekStartsOn: 1 }), end: endOfWeek(d, { weekStartsOn: 1 }) };
    case 'month':
      return { start: startOfMonth(d), end: endOfMonth(d) };
    case 'quarter':
      return { start: startOfQuarter(d), end: endOfQuarter(d) };
    case 'year':
      return { start: startOfYear(d), end: endOfYear(d) };
    default:
      return { start: startOfMonth(d), end: endOfMonth(d) };
  }
}

export function getPreviousPeriodDate(referenceDate, period) {
  const d = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  switch (period) {
    case 'day':
      return subDays(d, 1);
    case 'week':
      return subDays(d, 7);
    case 'month':
      return subMonths(d, 1);
    case 'quarter':
      return subMonths(d, 3);
    case 'year':
      return subYears(d, 1);
    default:
      return subMonths(d, 1);
  }
}

export function filterTickets(tickets, filters, options = {}) {
  const { tamId, accountId, priority, disposition, referenceDate, period, slaBreachOnly, region } = filters;
  const { start, end } = getPeriodBounds(referenceDate, period);
  const { tams = [] } = options;
  const tamRegionById = new Map(
    tams.map((tam) => [tam.id, normalizeTamRegion(tam.region)]),
  );

  return tickets.filter((ticket) => {
    if (tamId && ticket.tam_id !== tamId) return false;
    if (accountId && ticket.account_id !== accountId) return false;
    if (priority && ticket.priority !== priority) return false;
    if (disposition && ticket.disposition !== disposition) return false;
    if (slaBreachOnly && !ticket.sla.any_breach) return false;
    if (region && tamRegionById.get(ticket.tam_id) !== region) return false;

    const created = parseISO(ticket.created_at);
    return isWithinInterval(created, { start, end });
  });
}

export function countReopeningsInPeriod(tickets, filters) {
  const { tamId, accountId, disposition, referenceDate, period } = filters;
  const { start, end } = getPeriodBounds(referenceDate, period);

  let count = 0;
  for (const ticket of tickets) {
    if (tamId && ticket.tam_id !== tamId) continue;
    if (accountId && ticket.account_id !== accountId) continue;
    if (disposition && ticket.disposition !== disposition) continue;

    for (const event of ticket.reopen_events ?? []) {
      const reopenedAt = parseISO(event.reopened_at);
      if (isWithinInterval(reopenedAt, { start, end })) count++;
    }
  }
  return count;
}

export function countTicketReopenEventsInPeriod(ticket, filters) {
  const { referenceDate, period } = filters;
  const { start, end } = getPeriodBounds(referenceDate, period);

  return (ticket.reopen_events ?? []).filter((event) => {
    const reopenedAt = parseISO(event.reopened_at);
    return isWithinInterval(reopenedAt, { start, end });
  }).length;
}

export function getReopenedTicketsInPeriod(tickets, filters) {
  const { tamId, accountId, disposition, referenceDate, period } = filters;
  const { start, end } = getPeriodBounds(referenceDate, period);

  return tickets
    .filter((ticket) => {
      if (tamId && ticket.tam_id !== tamId) return false;
      if (accountId && ticket.account_id !== accountId) return false;
      if (disposition && ticket.disposition !== disposition) return false;

      return (ticket.reopen_events ?? []).some((event) => {
        const reopenedAt = parseISO(event.reopened_at);
        return isWithinInterval(reopenedAt, { start, end });
      });
    })
    .sort((a, b) => {
      const diff = countTicketReopenEventsInPeriod(b, filters) - countTicketReopenEventsInPeriod(a, filters);
      if (diff !== 0) return diff;
      return b.reopen_count - a.reopen_count;
    });
}

export function getTicketMttaMinutes(ticket) {
  const fromMetrics = ticket.zendesk?.metrics?.reply_time_in_minutes?.calendar;
  if (fromMetrics != null) return fromMetrics;
  if (!ticket.first_response_at) return null;
  return differenceInMinutes(parseISO(ticket.first_response_at), parseISO(ticket.created_at));
}

export function getTicketMttrMinutes(ticket) {
  const fromMetrics = ticket.zendesk?.metrics?.full_resolution_time_in_minutes?.calendar;
  if (fromMetrics != null) return fromMetrics;
  if (!ticket.solved_at) return null;
  return differenceInMinutes(parseISO(ticket.solved_at), parseISO(ticket.created_at));
}

export function getCsatRatedAt(ticket) {
  if (!ticket.csat?.rated || ticket.csat.score == null) return null;
  if (ticket.csat.rated_at) return parseISO(ticket.csat.rated_at);
  if (ticket.closed_at) return parseISO(ticket.closed_at);
  if (ticket.solved_at) return parseISO(ticket.solved_at);
  return null;
}

function matchesOperationalFilters(ticket, filters) {
  const { tamId, accountId, disposition } = filters;
  if (tamId && ticket.tam_id !== tamId) return false;
  if (accountId && ticket.account_id !== accountId) return false;
  if (disposition && ticket.disposition !== disposition) return false;
  return true;
}

export function isCsatRatedInPeriod(ticket, filters) {
  if (!matchesOperationalFilters(ticket, filters)) return false;
  const ratedAt = getCsatRatedAt(ticket);
  if (!ratedAt) return false;
  const { start, end } = getPeriodBounds(filters.referenceDate, filters.period);
  return isWithinInterval(ratedAt, { start, end });
}

export function getCsatRatedTicketsInPeriod(tickets, filters) {
  return tickets
    .filter((ticket) => isCsatRatedInPeriod(ticket, filters))
    .sort((a, b) => {
      const aDate = getCsatRatedAt(a)?.getTime() ?? 0;
      const bDate = getCsatRatedAt(b)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

export function getTicketResolvedAt(ticket) {
  if (!ticket.solved_at) return null;
  return parseISO(ticket.solved_at);
}

export function getTicketClosedAt(ticket) {
  if (!ticket.closed_at) return null;
  return parseISO(ticket.closed_at);
}

export function isTicketResolvedInPeriod(ticket, filters) {
  if (!matchesOperationalFilters(ticket, filters)) return false;
  const resolvedAt = getTicketResolvedAt(ticket);
  if (!resolvedAt) return false;
  const { start, end } = getPeriodBounds(filters.referenceDate, filters.period);
  return isWithinInterval(resolvedAt, { start, end });
}

export function isTicketClosedInPeriod(ticket, filters) {
  if (!matchesOperationalFilters(ticket, filters)) return false;
  const closedAt = getTicketClosedAt(ticket);
  if (!closedAt) return false;
  const { start, end } = getPeriodBounds(filters.referenceDate, filters.period);
  return isWithinInterval(closedAt, { start, end });
}

export function getResolvedTicketsInPeriod(tickets, filters) {
  return tickets
    .filter((ticket) => isTicketResolvedInPeriod(ticket, filters))
    .sort((a, b) => {
      const aDate = getTicketResolvedAt(a)?.getTime() ?? 0;
      const bDate = getTicketResolvedAt(b)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

export function getClosedTicketsInPeriod(tickets, filters) {
  return tickets
    .filter((ticket) => isTicketClosedInPeriod(ticket, filters))
    .sort((a, b) => {
      const aDate = getTicketClosedAt(a)?.getTime() ?? 0;
      const bDate = getTicketClosedAt(b)?.getTime() ?? 0;
      return bDate - aDate;
    });
}

function getTicketScope(allTickets, filters) {
  const { tamId, accountId } = filters;
  return allTickets.filter((ticket) => {
    if (tamId && ticket.tam_id !== tamId) return false;
    if (accountId && ticket.account_id !== accountId) return false;
    return true;
  });
}

export function getTicketsHandledBreakdown(allTickets, filters) {
  const scope = getTicketScope(allTickets, filters);
  const createdTickets = filterTickets(allTickets, filters);
  const createdIds = new Set(createdTickets.map((ticket) => ticket.id));
  const otherIds = new Set();

  for (const ticket of getResolvedTicketsInPeriod(scope, filters)) {
    if (!createdIds.has(ticket.id)) otherIds.add(ticket.id);
  }
  for (const ticket of getClosedTicketsInPeriod(scope, filters)) {
    if (!createdIds.has(ticket.id)) otherIds.add(ticket.id);
  }
  for (const ticket of getReopenedTicketsInPeriod(scope, filters)) {
    if (!createdIds.has(ticket.id)) otherIds.add(ticket.id);
  }

  const createdCount = createdTickets.length;
  const otherCount = otherIds.size;

  return {
    createdCount,
    otherCount,
    totalCount: createdCount + otherCount,
  };
}

export function getTicketsHandledInPeriod(allTickets, filters) {
  return getTicketsHandledBreakdown(allTickets, filters).totalCount;
}

export function getCsatOfferedTicketsInPeriod(tickets, filters) {
  const { start, end } = getPeriodBounds(filters.referenceDate, filters.period);

  return tickets.filter((ticket) => {
    if (!matchesOperationalFilters(ticket, filters)) return false;
    if (!ticket.csat?.offered) return false;
    const closedAt = ticket.closed_at ? parseISO(ticket.closed_at) : null;
    if (!closedAt) return false;
    return isWithinInterval(closedAt, { start, end });
  });
}

export function groupCsatByAccount(ratedTickets) {
  const map = new Map();

  for (const ticket of ratedTickets) {
    if (!map.has(ticket.account_id)) {
      map.set(ticket.account_id, {
        account_id: ticket.account_id,
        account_name: ticket.account_name,
        tam_name: ticket.tam_name,
        scores: [],
      });
    }
    map.get(ticket.account_id).scores.push(ticket.csat.score);
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      avgCsat: row.scores.reduce((sum, score) => sum + score, 0) / row.scores.length,
      responseCount: row.scores.length,
    }))
    .sort((a, b) => b.avgCsat - a.avgCsat);
}

export function getPortfolioActivityBreakdown(metrics) {
  const dc = metrics.dispositionCounts ?? {};
  return {
    p1p2: metrics.p1p2Count ?? 0,
    p3p5: metrics.p3p5Count ?? 0,
    created: metrics.totalTickets ?? 0,
    ip: dc.in_progress ?? 0,
    esc: dc.escalated ?? 0,
    wfr: dc.waiting_for_response ?? 0,
    resolved: metrics.resolvedCount ?? 0,
    closed: metrics.closedInPeriodCount ?? 0,
  };
}

export function sumPortfolioActivityBreakdown(breakdown) {
  return (
    breakdown.p1p2
    + breakdown.p3p5
    + breakdown.created
    + breakdown.ip
    + breakdown.esc
    + breakdown.wfr
    + breakdown.resolved
    + breakdown.closed
  );
}

export function getPortfolioActivityTotal(metrics) {
  return sumPortfolioActivityBreakdown(getPortfolioActivityBreakdown(metrics));
}

export function computeSummary(tickets, allTickets, filters) {
  const p1Count = tickets.filter((t) => t.priority === 'P1').length;
  const p2Count = tickets.filter((t) => t.priority === 'P2').length;
  const p3Count = tickets.filter((t) => t.priority === 'P3').length;
  const p4Count = tickets.filter((t) => t.priority === 'P4').length;
  const p5Count = tickets.filter((t) => t.priority === 'P5').length;
  const p3p5Count = p3Count + p4Count + p5Count;
  const slaBreaches = tickets.filter((t) => t.sla.any_breach).length;
  const firstResponseBreaches = tickets.filter((t) => t.sla.first_response_breached).length;
  const resolutionBreaches = tickets.filter((t) => t.sla.resolution_breached).length;

  const ratedInPeriod = getCsatRatedTicketsInPeriod(allTickets, filters);
  const avgCsat = ratedInPeriod.length
    ? ratedInPeriod.reduce((sum, t) => sum + t.csat.score, 0) / ratedInPeriod.length
    : null;
  const csatGood = ratedInPeriod.filter((t) => t.csat.score >= 4).length;
  const csatPct = ratedInPeriod.length ? (csatGood / ratedInPeriod.length) * 100 : null;

  const withMtta = tickets.map((t) => getTicketMttaMinutes(t)).filter((v) => v != null);
  const avgMtta = withMtta.length
    ? withMtta.reduce((sum, v) => sum + v, 0) / withMtta.length
    : null;

  const withMttr = tickets.map((t) => getTicketMttrMinutes(t)).filter((v) => v != null);
  const avgMttr = withMttr.length
    ? withMttr.reduce((sum, v) => sum + v, 0) / withMttr.length
    : null;

  const reopenings = countReopeningsInPeriod(allTickets, filters);
  const ticketsWithReopens = getReopenedTicketsInPeriod(allTickets, filters).length;
  const resolvedCount = getResolvedTicketsInPeriod(tickets, filters).length;
  const closedInPeriodCount = getClosedTicketsInPeriod(tickets, filters).length;
  const handledBreakdown = getTicketsHandledBreakdown(allTickets, filters);
  const handledCount = handledBreakdown.totalCount;
  const otherHandledCount = handledBreakdown.otherCount;

  const dispositionCounts = {
    in_progress: tickets.filter((t) => t.disposition === 'in_progress').length,
    waiting_for_response: tickets.filter((t) => t.disposition === 'waiting_for_response').length,
    temp_resolution: tickets.filter((t) => t.disposition === 'temp_resolution').length,
    closed: tickets.filter((t) => t.disposition === 'closed').length,
    escalated: tickets.filter((t) => t.disposition === 'escalated').length,
  };

  const needsAttention = tickets.filter((t) => t.needs_attention).length;

  const activityBreakdown = getPortfolioActivityBreakdown({
    totalTickets: tickets.length,
    p1p2Count: p1Count + p2Count,
    p3p5Count,
    resolvedCount,
    closedInPeriodCount,
    dispositionCounts,
  });
  const activityTotal = sumPortfolioActivityBreakdown(activityBreakdown);

  return {
    totalTickets: tickets.length,
    p1Count,
    p2Count,
    p1p2Count: p1Count + p2Count,
    p3Count,
    p4Count,
    p5Count,
    p3p5Count,
    slaBreaches,
    firstResponseBreaches,
    resolutionBreaches,
    slaBreachRate: tickets.length ? (slaBreaches / tickets.length) * 100 : 0,
    avgCsat,
    csatPct,
    csatRatedCount: ratedInPeriod.length,
    avgMtta,
    avgMttr,
    reopenings,
    ticketsWithReopens,
    resolvedCount,
    closedInPeriodCount,
    handledCount,
    otherHandledCount,
    activityBreakdown,
    activityTotal,
    dispositionCounts,
    needsAttention,
  };
}

export function groupByAccount(tickets, allTickets, filters) {
  const accountMap = new Map();

  for (const ticket of tickets) {
    if (!accountMap.has(ticket.account_id)) {
      accountMap.set(ticket.account_id, {
        account_id: ticket.account_id,
        account_name: ticket.account_name,
        tam_name: ticket.tam_name,
        tickets: [],
      });
    }
    accountMap.get(ticket.account_id).tickets.push(ticket);
  }

  return Array.from(accountMap.values())
    .map((group) => ({
      ...group,
      metrics: computeSummary(group.tickets, allTickets, {
        ...filters,
        accountId: group.account_id,
      }),
    }))
    .sort((a, b) => b.metrics.p1p2Count - a.metrics.p1p2Count);
}

export function groupByTam(tickets, allTickets, filters, allAccounts = [], allTams = []) {
  const tamMap = new Map();

  for (const tam of allTams) {
    tamMap.set(tam.id, {
      tam_id: tam.id,
      tam_name: tam.name,
      tam_email: tam.email,
      tickets: [],
    });
  }

  for (const ticket of tickets) {
    if (!tamMap.has(ticket.tam_id)) {
      tamMap.set(ticket.tam_id, {
        tam_id: ticket.tam_id,
        tam_name: ticket.tam_name,
        tam_email: ticket.tam_email,
        tickets: [],
      });
    }
    tamMap.get(ticket.tam_id).tickets.push(ticket);
  }

  return Array.from(tamMap.values()).map((group) => {
    const tamAccounts = allAccounts.filter((a) => a.tam_id === group.tam_id);
    const accountBreakdown = tamAccounts.map((acc) => {
      const accTickets = group.tickets.filter((t) => t.account_id === acc.id);
      return {
        ...acc,
        metrics: computeSummary(accTickets, allTickets, {
          ...filters,
          tamId: group.tam_id,
          accountId: acc.id,
        }),
        ticketCount: accTickets.length,
      };
    });

    return {
      ...group,
      accounts: accountBreakdown,
      metrics: computeSummary(group.tickets, allTickets, {
        ...filters,
        tamId: group.tam_id,
      }),
    };
  }).sort((a, b) => b.metrics.activityTotal - a.metrics.activityTotal);
}

export function getTicketsNeedingAttention(tickets, limit) {
  const sorted = tickets
    .filter((t) => t.needs_attention)
    .sort((a, b) => {
      const pri = { P1: 0, P2: 1, P3: 2, P4: 3 };
      const pd = (pri[a.priority] ?? 9) - (pri[b.priority] ?? 9);
      if (pd !== 0) return pd;
      return new Date(b.created_at) - new Date(a.created_at);
    });

  if (typeof limit === 'number') return sorted.slice(0, limit);
  return sorted;
}

export function buildTimeSeries(allTickets, filters, bucketCount = 12) {
  const { period, tamId, accountId } = filters;
  const ref = parseISO(filters.referenceDate);
  const points = [];

  for (let i = bucketCount - 1; i >= 0; i--) {
    let bucketDate;
    switch (period) {
      case 'day':
        bucketDate = subDays(ref, i);
        break;
      case 'week':
        bucketDate = subDays(ref, i * 7);
        break;
      case 'month':
        bucketDate = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
        break;
      case 'quarter':
        bucketDate = new Date(ref.getFullYear(), ref.getMonth() - i * 3, 1);
        break;
      case 'year':
        bucketDate = new Date(ref.getFullYear() - i, 0, 1);
        break;
      default:
        bucketDate = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    }

    const bucketFilters = { ...filters, referenceDate: bucketDate.toISOString() };
    const bucketTickets = filterTickets(allTickets, bucketFilters);
    const summary = computeSummary(bucketTickets, allTickets, bucketFilters);

    let label;
    switch (period) {
      case 'day':
        label = format(bucketDate, 'MMM d');
        break;
      case 'week':
        label = format(getPeriodBounds(bucketDate, 'week').start, "'W'w MMM");
        break;
      case 'quarter':
        label = format(bucketDate, 'QQQ yyyy');
        break;
      case 'year':
        label = format(bucketDate, 'yyyy');
        break;
      default:
        label = format(bucketDate, 'MMM yyyy');
    }

    points.push({
      label,
      date: bucketDate.toISOString(),
      ...summary,
    });
  }

  return points;
}

export function formatDuration(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

/** MTTA / MTTR display — always shown in hours. */
export function formatDurationHours(minutes) {
  if (minutes == null || Number.isNaN(minutes)) return '—';
  const hours = minutes / 60;
  if (hours < 10) return `${hours.toFixed(1)} hr`;
  if (hours < 100) return `${hours.toFixed(1)} hr`;
  return `${Math.round(hours)} hr`;
}

export function csatIndicator(score, pct) {
  if (score == null) return { label: 'No Data', level: 'neutral', color: '#94a3b8' };
  if (score >= 4.5) return { label: 'Excellent', level: 'excellent', color: '#059669' };
  if (score >= 4.0) return { label: 'Good', level: 'good', color: '#10b981' };
  if (score >= 3.0) return { label: 'Fair', level: 'fair', color: '#f59e0b' };
  return { label: 'At Risk', level: 'poor', color: '#ef4444' };
}
