import { useCallback, useState } from 'react';
import { getStoredTheme, persistTheme, THEME_OPTIONS } from '../utils/theme';

export function useTheme() {
  const [theme, setThemeState] = useState(() => getStoredTheme());

  const setTheme = useCallback((themeId) => {
    const next = persistTheme(themeId);
    setThemeState(next);
  }, []);

  return { theme, setTheme, themes: THEME_OPTIONS };
}
