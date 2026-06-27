// Microsoft Teams "Shifts" first-party app id (stable across tenants).
const TEAMS_SHIFTS_APP_ID = '86fcd49b-61a2-4701-b771-54728cd291fb';

// `msteams:` protocol launches the installed desktop client; the https URL is
// the web fallback for when the desktop app isn't installed.
export const TEAMS_SHIFTS_DEEPLINK = `msteams:/l/entity/${TEAMS_SHIFTS_APP_ID}/shifts`;
export const TEAMS_SHIFTS_WEB_URL = `https://teams.microsoft.com/l/entity/${TEAMS_SHIFTS_APP_ID}/shifts`;

/**
 * Open Microsoft Teams Shifts in the local desktop app via the `msteams:`
 * protocol handler. Falls back to opening Teams on the web if the desktop
 * client doesn't take over the page shortly after.
 */
export function openTeamsShifts() {
  let launched = false;
  const markLaunched = () => { launched = true; };
  // When the protocol handler hands off to the desktop app, the tab is hidden.
  document.addEventListener('visibilitychange', markLaunched, { once: true });
  window.addEventListener('blur', markLaunched, { once: true });

  window.location.href = TEAMS_SHIFTS_DEEPLINK;

  window.setTimeout(() => {
    document.removeEventListener('visibilitychange', markLaunched);
    window.removeEventListener('blur', markLaunched);
    if (!launched && !document.hidden) {
      window.open(TEAMS_SHIFTS_WEB_URL, '_blank', 'noopener');
    }
  }, 1500);
}
