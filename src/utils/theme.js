export const DEFAULT_THEME = 'dark';

export const THEME_OPTIONS = [
  { id: 'dark', label: 'Dark', description: 'Midnight blue dashboard' },
  { id: 'light', label: 'Light', description: 'Bright daytime view' },
  { id: 'sinch', label: 'Sinch', description: 'Dark with Sinch yellow accents' },
];

const STORAGE_KEY = 'tam-dashboard-theme';

export function isValidTheme(themeId) {
  return THEME_OPTIONS.some((theme) => theme.id === themeId);
}

export function getStoredTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isValidTheme(stored)) return stored;
  } catch {
    // ignore storage errors
  }
  return DEFAULT_THEME;
}

export function applyTheme(themeId) {
  const theme = isValidTheme(themeId) ? themeId : DEFAULT_THEME;
  document.documentElement.setAttribute('data-theme', theme);
  return theme;
}

export function persistTheme(themeId) {
  const theme = applyTheme(themeId);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore storage errors
  }
  return theme;
}

export function initTheme() {
  return applyTheme(getStoredTheme());
}
