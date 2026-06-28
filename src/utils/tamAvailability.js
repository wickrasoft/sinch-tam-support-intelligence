import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';

export const TAM_REGIONS = ['US', 'EMEA', 'APAC', 'LATAM'];

export const REGION_TIMEZONES = {
  US: 'America/New_York',
  EMEA: 'Europe/Paris',
  APAC: 'Asia/Singapore',
  LATAM: 'America/Sao_Paulo',
};

// Country-specific timezones (preferred over region when a TAM's country is known).
export const COUNTRY_TIMEZONES = {
  'United States': 'America/New_York',
  Canada: 'America/Toronto',
  Mexico: 'America/Mexico_City',
  Brazil: 'America/Sao_Paulo',
  India: 'Asia/Kolkata',
  Singapore: 'Asia/Singapore',
  China: 'Asia/Shanghai',
  Australia: 'Australia/Sydney',
  Sweden: 'Europe/Stockholm',
  'United Kingdom': 'Europe/London',
  'United Arab Emirates': 'Asia/Dubai',
};

/** Resolve the IANA timezone for a TAM: explicit > country > region > UTC. */
export function getTamTimezone(tam) {
  if (!tam) return 'UTC';
  if (tam.timezone) return tam.timezone;
  if (tam.country && COUNTRY_TIMEZONES[tam.country]) return COUNTRY_TIMEZONES[tam.country];
  const region = TAM_REGIONS.includes(tam.region) ? tam.region : 'US';
  return REGION_TIMEZONES[region] ?? 'UTC';
}

/** Current wall-clock time (HH:MM, 24h) for a TAM's local timezone. */
export function getTamLocalTime(tam, at = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: getTamTimezone(tam),
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(at);
  } catch {
    return '';
  }
}

/** Current local hour/minute for a TAM's timezone (for an analog clock dial). */
export function getTamLocalTimeParts(tam, at = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: getTamTimezone(tam),
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(at);
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10) % 24;
    const minute = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
    return { hour: hour === 24 ? 0 : hour, minute };
  } catch {
    return null;
  }
}

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

  // Presence (online/away/offline) always uses the live clock so the
  // TAM Portfolio & Availability panel reflects real-time working hours.
  const status = workHoursStatus(tam, liveNow);
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
