export const STATUS_PAGE_URL = 'https://status.sinch.com';
export const HISTORY_URL = `${STATUS_PAGE_URL}/history`;
export const INCIDENTS_API = `${STATUS_PAGE_URL}/api/v2/incidents.json`;

// An incident is resolved only when the status page says so — either the
// official status is resolved/postmortem, or the latest update body carries the
// "This incident has been resolved." wording shown on status.sinch.com.
const RESOLVED_TEXT = 'this incident has been resolved';

export function isResolvedIncident(inc) {
  if (inc.status === 'resolved' || inc.status === 'postmortem') return true;
  const latest = (inc.incident_updates ?? [])[0];
  return Boolean(latest && (latest.body ?? '').toLowerCase().includes(RESOLVED_TEXT));
}

export const isActiveIncident = (inc) => !isResolvedIncident(inc);
