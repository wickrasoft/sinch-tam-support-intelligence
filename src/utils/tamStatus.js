import {
  enrichTamsWithAvailability,
  normalizeTamRegion,
  resolveTamAvailability,
} from './tamAvailability';

/** Slack-style custom status emoji (same family as 🌴 vacation) */
export const TAM_STATUS_ICONS = {
  online: '🟢',
  away: '🕐',
  offline: '⚪',
  vacation: '🌴',
  sick: '🤒',
};

export const TAM_VACATION_ICON = TAM_STATUS_ICONS.vacation;
export const TAM_VACATION_TITLE = 'On vacation';

export const TAM_AVAILABILITY_STATUSES = [
  'online',
  'away',
  'offline',
  'vacation',
  'sick',
];

export const TAM_STATUS_CONFIG = {
  online: { label: 'Online', sort: 4, icon: TAM_STATUS_ICONS.online, detail: null },
  away: { label: 'Away', sort: 3, icon: TAM_STATUS_ICONS.away, detail: 'Limited availability' },
  offline: { label: 'Offline', sort: 2, icon: TAM_STATUS_ICONS.offline, detail: 'Unavailable' },
  vacation: { label: 'Vacation', sort: 0, icon: TAM_STATUS_ICONS.vacation, detail: null },
  sick: { label: 'Sick', sort: 1, icon: TAM_STATUS_ICONS.sick, detail: 'Out sick' },
};

export function getTamAvailabilityStatus(tam, referenceDate, liveNow = new Date()) {
  if (tam?.status) return tam.status;
  if (referenceDate || tam.availability) {
    return resolveTamAvailability(tam, referenceDate, liveNow).status;
  }
  if (tam?.availability_status) return tam.availability_status;
  if (tam?.on_vacation) return 'vacation';
  return 'online';
}

export function getTamAvailabilityLabel(tam, showIcon = true, referenceDate, liveNow = new Date()) {
  const status = getTamAvailabilityStatus(tam, referenceDate, liveNow);
  const config = TAM_STATUS_CONFIG[status];
  const icon = showIcon && config?.icon ? `${config.icon} ` : '';
  return `${icon}${config?.label ?? status}`;
}

export function tamStatusSuffix(tam, showLabel = true, referenceDate, liveNow = new Date()) {
  const status = getTamAvailabilityStatus(tam, referenceDate, liveNow);
  if (status === 'online') return '';
  const config = TAM_STATUS_CONFIG[status];
  if (!config) return '';
  if (!showLabel) return config.icon ? ` ${config.icon}` : '';
  return config.icon ? ` ${config.icon} ${config.label}` : ` ${config.label}`;
}

export function sortTamsByAvailability(tams, referenceDate, liveNow = new Date()) {
  return [...tams].sort((a, b) => {
    const sortA = TAM_STATUS_CONFIG[getTamAvailabilityStatus(a, referenceDate, liveNow)]?.sort ?? 9;
    const sortB = TAM_STATUS_CONFIG[getTamAvailabilityStatus(b, referenceDate, liveNow)]?.sort ?? 9;
    if (sortA !== sortB) return sortA - sortB;
    return a.name.localeCompare(b.name);
  });
}

export function vacationSuffix(showLabel = false) {
  return showLabel ? ` ${TAM_VACATION_ICON} On vacation` : ` ${TAM_VACATION_ICON}`;
}

export { enrichTamsWithAvailability, normalizeTamRegion, resolveTamAvailability };
