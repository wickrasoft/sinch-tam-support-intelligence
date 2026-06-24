import { differenceInHours, differenceInDays, parseISO } from 'date-fns';
import { getTamAvailabilityStatus } from './tamStatus';
import { resolveTamAvailability, normalizeTamRegion } from './tamAvailability';

export const STALE_THRESHOLDS = [
  { id: '48h', label: '48 hours', shortLabel: '48h', hours: 48, default: true },
  { id: '72h', label: '72 hours', shortLabel: '72h', hours: 72 },
  { id: '5d', label: '5 days', shortLabel: '5d', hours: 5 * 24 },
  { id: '7d', label: '7 days', shortLabel: '7d', hours: 7 * 24 },
  { id: '15d', label: '15 days', shortLabel: '15d', hours: 15 * 24 },
  { id: '15plus', label: '15+ days', shortLabel: '15+d', hours: 15 * 24 },
  { id: '30d', label: '30 days', shortLabel: '30d', hours: 30 * 24 },
  { id: '60d', label: '60 days', shortLabel: '60d', hours: 60 * 24 },
  { id: '90d', label: '90 days', shortLabel: '90d', hours: 90 * 24 },
  { id: '180d', label: '180 days', shortLabel: '180d', hours: 180 * 24 },
  { id: '360d', label: '360 days', shortLabel: '360d', hours: 360 * 24 },
  { id: '360plus', label: '360+ days', shortLabel: '360+d', hours: 360 * 24 },
];

export const AGING_THRESHOLDS = [
  { id: '7d', label: '7 days', shortLabel: '7d', days: 7, default: true },
  { id: '15d', label: '15 days', shortLabel: '15d', days: 15 },
  { id: '30d', label: '30 days', shortLabel: '30d', days: 30 },
  { id: '60d', label: '60 days', shortLabel: '60d', days: 60 },
  { id: '90d', label: '90 days', shortLabel: '90d', days: 90 },
  { id: '180d', label: '180 days', shortLabel: '180d', days: 180 },
  { id: '360d', label: '360 days', shortLabel: '360d', days: 360 },
  { id: '360plus', label: '360+ days', shortLabel: '360+d', days: 360 },
];

export const DEFAULT_STALE_THRESHOLD_ID = '48h';
export const DEFAULT_AGING_THRESHOLD_ID = '7d';

function findThreshold(thresholds, id, fallbackId) {
  return thresholds.find((t) => t.id === id)
    ?? thresholds.find((t) => t.default)
    ?? thresholds.find((t) => t.id === fallbackId)
    ?? thresholds[0];
}

export function getStaleThreshold(id = DEFAULT_STALE_THRESHOLD_ID) {
  return findThreshold(STALE_THRESHOLDS, id, DEFAULT_STALE_THRESHOLD_ID);
}

export function getAgingThreshold(id = DEFAULT_AGING_THRESHOLD_ID) {
  return findThreshold(AGING_THRESHOLDS, id, DEFAULT_AGING_THRESHOLD_ID);
}

export function getStaleThresholdLabel(id = DEFAULT_STALE_THRESHOLD_ID) {
  return getStaleThreshold(id).label;
}

export function getAgingThresholdLabel(id = DEFAULT_AGING_THRESHOLD_ID) {
  return getAgingThreshold(id).label;
}

export const TICKET_STATUS_OPTIONS = [
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_response', label: 'WFR' },
  { value: 'temp_resolution', label: 'Temp Resolution' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'closed', label: 'Closed' },
];

export function getTicketStatusLabel(disposition) {
  return TICKET_STATUS_OPTIONS.find((s) => s.value === disposition)?.label ?? disposition;
}

export function isOpenTicket(ticket) {
  return ticket.disposition !== 'closed' && ticket.disposition !== 'temp_resolution';
}

export function getOperationalScope(tickets, accounts, filters = {}, tams = []) {
  let scoped = tickets.filter(isOpenTicket);

  if (filters.accountId) {
    scoped = scoped.filter((t) => t.account_id === filters.accountId);
  } else if (filters.tamId) {
    const accountIds = new Set(
      accounts.filter((a) => a.tam_id === filters.tamId).map((a) => a.id),
    );
    scoped = scoped.filter((t) => accountIds.has(t.account_id));
  } else if (filters.region && tams.length) {
    const tamIds = new Set(
      tams
        .filter((tam) => normalizeTamRegion(tam.region) === filters.region)
        .map((tam) => tam.id),
    );
    scoped = scoped.filter((t) => tamIds.has(t.tam_id));
  }

  if (filters.priority) {
    scoped = scoped.filter((t) => t.priority === filters.priority);
  }

  if (filters.disposition) {
    scoped = scoped.filter((t) => t.disposition === filters.disposition);
  }

  return scoped;
}

export function hoursSinceLastUpdate(ticket, referenceDate) {
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  if (!ticket.last_updated_at) return null;
  return differenceInHours(ref, parseISO(ticket.last_updated_at));
}

export function daysSinceCreated(ticket, referenceDate) {
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  return ticket.aging_days ?? differenceInDays(ref, parseISO(ticket.created_at));
}

export function getStaleTickets(tickets, referenceDate, hours = getStaleThreshold().hours) {
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  return tickets
    .filter((t) => {
      if (!isOpenTicket(t)) return false;
      if (!t.last_updated_at) return false;
      return differenceInHours(ref, parseISO(t.last_updated_at)) >= hours;
    })
    .sort((a, b) => {
      const hA = differenceInHours(ref, parseISO(a.last_updated_at));
      const hB = differenceInHours(ref, parseISO(b.last_updated_at));
      return hB - hA;
    });
}

export function getStaleTicketsByThreshold(tickets, referenceDate, thresholdId) {
  return getStaleTickets(tickets, referenceDate, getStaleThreshold(thresholdId).hours);
}

export function getAgingTickets(tickets, referenceDate, minDays = 7) {
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  return tickets
    .filter((t) => {
      if (!isOpenTicket(t)) return false;
      const age = t.aging_days ?? differenceInDays(ref, parseISO(t.created_at));
      return age >= minDays;
    })
    .sort((a, b) => {
      const ageA = a.aging_days ?? differenceInDays(ref, parseISO(a.created_at));
      const ageB = b.aging_days ?? differenceInDays(ref, parseISO(b.created_at));
      return ageB - ageA;
    });
}

export function getAgingTicketsByThreshold(tickets, referenceDate, thresholdId) {
  return getAgingTickets(tickets, referenceDate, getAgingThreshold(thresholdId).days);
}

export function getVacationingTams(tams, referenceDate, liveNow = new Date()) {
  return tams.filter((t) => {
    const resolved = t.status
      ? t
      : { ...t, ...resolveTamAvailability(t, referenceDate, liveNow, tams) };
    return getTamAvailabilityStatus(resolved, referenceDate, liveNow) === 'vacation';
  });
}

export function formatStaleDuration(hours) {
  if (hours == null) return '—';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  const rem = hours % 24;
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`;
}
