import { useTheme } from '../hooks/useTheme';

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme();
  const active = themes.find((item) => item.id === theme);

  return (
    <div className="theme-switcher">
      <label className="theme-switcher__label" htmlFor="theme-select">
        Color scheme
      </label>
      <select
        id="theme-select"
        className="theme-switcher__select"
        value={theme}
        onChange={(event) => setTheme(event.target.value)}
        title={active?.description}
        aria-label="Color scheme"
      >
        {themes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
    </div>
  );
}
