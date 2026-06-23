import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export const TAM_REGIONS = ['US', 'EMEA', 'APAC', 'LATAM'];

export const REGION_TIMEZONES = {
  US: 'America/New_York',
  EMEA: 'Europe/Paris',
  APAC: 'Asia/Singapore',
  LATAM: 'America/Sao_Paulo',
};

export const REGION_WORK_HOURS = {
  US: { start: 9, end: 18, lunchStart: 12, lunchEnd: 13 },
  EMEA: { start: 9, end: 18, lunchStart: 12, lunchEnd: 13 },
  APAC: { start: 9, end: 18, lunchStart: 12, lunchEnd: 13 },
  LATAM: { start: 9, end: 18, lunchStart: 12, lunchEnd: 13 },
};

function getLocalParts(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: 'numeric',
    hour12: false,
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  return { weekday, hour: hour === 24 ? 0 : hour };
}

function isWeekend(weekday) {
  return weekday === 'Sat' || weekday === 'Sun';
}

function isDateInRange(at, start, end) {
  if (!start || !end) return false;
  const day = startOfDay(typeof at === 'string' ? parseISO(at) : at);
  return isWithinInterval(day, {
    start: startOfDay(parseISO(start)),
    end: endOfDay(parseISO(end)),
  });
}

/** Pick snapshot time: live clock on today's reference date, fixed afternoon otherwise. */
export function resolveAvailabilityAt(referenceDate, liveNow = new Date()) {
  const ref = typeof referenceDate === 'string' ? parseISO(referenceDate) : referenceDate;
  const refDay = format(ref, 'yyyy-MM-dd');
  const today = format(liveNow, 'yyyy-MM-dd');
  if (refDay === today) return liveNow;
  return new Date(`${refDay}T14:00:00.000Z`);
}

function resolveBackupTam(tam, allTams, schedule) {
  const backupId = schedule?.backup_tam_id ?? tam.backup_tam_id;
  if (!backupId) return { backup_tam_id: null, backup_tam_name: null };
  const backup = allTams?.find((t) => t.id === backupId);
  return {
    backup_tam_id: backup?.id ?? backupId,
    backup_tam_name: backup?.name ?? null,
  };
}

function workHoursStatus(tam, at) {
  const region = TAM_REGIONS.includes(tam.region) ? tam.region : 'US';
  const hours = tam.work_hours ?? REGION_WORK_HOURS[region];
  const timezone = tam.timezone ?? REGION_TIMEZONES[region];
  const { weekday, hour } = getLocalParts(at, timezone);

  if (isWeekend(weekday)) return 'offline';
  if (hour < hours.start || hour >= hours.end) return 'offline';
  if (hour >= hours.lunchStart && hour < hours.lunchEnd) return 'away';
  return 'online';
}

export function resolveTamAvailability(tam, referenceDate, liveNow = new Date(), allTams = []) {
  const at = resolveAvailabilityAt(referenceDate, liveNow);
  const schedule = tam.availability ?? {};

  if (schedule.vacation && isDateInRange(at, schedule.vacation.start, schedule.vacation.end)) {
    const backup = resolveBackupTam(tam, allTams, schedule);
    return {
      status: 'vacation',
      availability_status: 'vacation',
      on_vacation: true,
      vacation_until: schedule.vacation.end,
      sick_until: null,
      ...backup,
    };
  }

  if (schedule.sick && isDateInRange(at, schedule.sick.start, schedule.sick.end)) {
    const backup = resolveBackupTam(tam, allTams, schedule);
    return {
      status: 'sick',
      availability_status: 'sick',
      on_vacation: false,
      vacation_until: null,
      sick_until: schedule.sick.end,
      ...backup,
    };
  }

  const status = workHoursStatus(tam, at);
  return {
    status,
    availability_status: status,
    on_vacation: false,
    vacation_until: null,
    sick_until: null,
    backup_tam_id: null,
    backup_tam_name: null,
  };
}

export function enrichTamsWithAvailability(tams, referenceDate, liveNow = new Date()) {
  return tams.map((tam) => ({
    ...tam,
    ...resolveTamAvailability(tam, referenceDate, liveNow, tams),
  }));
}

export function normalizeTamRegion(region) {
  const map = {
    US: 'US',
    EMEA: 'EMEA',
    APAC: 'APAC',
    LATAM: 'LATAM',
    EU: 'EMEA',
    'AMER East': 'US',
    'AMER West': 'US',
    'AMER Central': 'US',
    'EMEA Nordics': 'EMEA',
  };
  return map[region] ?? 'US';
}
