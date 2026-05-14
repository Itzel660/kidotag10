const slateTheme = Object.freeze({
  "--font-family-base":
    '"Aptos", "Segoe UI Variable", "Segoe UI", "Trebuchet MS", sans-serif',
  "--font-family-mono":
    '"Cascadia Code", "Fira Code", Consolas, "Courier New", monospace',
  "--color-bg-canvas": "#edf2f7",
  "--color-bg-subtle": "#dde6f0",
  "--color-surface": "#ffffff",
  "--color-surface-muted": "#f6f8fb",
  "--color-surface-raised": "#fbfcfe",
  "--color-surface-contrast": "#e8eef5",
  "--color-surface-glass": "rgba(255, 255, 255, 0.86)",
  "--color-text-primary": "#35151f",
  "--color-text-secondary": "#536174",
  "--color-text-muted": "#748295",
  "--color-text-inverse": "#f8fafc",
  "--color-border": "#d7e0ea",
  "--color-border-strong": "#bcc9d8",
  "--color-accent": "#2556a5",
  "--color-accent-hover": "#203d60",
  "--color-accent-active": "#182f4a",
  "--color-accent-soft": "rgba(39, 76, 119, 0.08)",
  "--color-accent-soft-hover": "rgba(39, 76, 119, 0.12)",
  "--color-accent-soft-strong": "rgba(39, 76, 119, 0.18)",
  "--color-accent-glow": "rgba(39, 76, 119, 0.24)",
  "--color-success": "#2f6b53",
  "--color-success-soft": "rgba(47, 107, 83, 0.14)",
  "--color-success-glow": "rgba(47, 107, 83, 0.24)",
  "--color-warning": "#9b6a1f",
  "--color-warning-soft": "rgba(155, 106, 31, 0.16)",
  "--color-danger": "#9c4141",
  "--color-danger-soft": "rgba(156, 65, 65, 0.16)",
  "--color-danger-glow": "rgba(156, 65, 65, 0.24)",
  "--color-info": "#3a6288",
  "--color-info-soft": "rgba(58, 98, 136, 0.16)",
  "--color-neutral": "#64748b",
  "--color-neutral-soft": "rgba(100, 116, 139, 0.14)",
  "--color-overlay": "rgba(15, 23, 42, 0.48)",
  "--color-overlay-strong": "rgba(15, 23, 42, 0.64)",
  "--color-white-soft": "rgba(255, 255, 255, 0.18)",
  "--color-white-medium": "rgba(255, 255, 255, 0.28)",
  "--color-white-strong": "rgba(255, 255, 255, 0.42)",
  "--color-field": "#f3f6fa",
  "--color-field-active": "#edf2f7",
  "--color-focus-ring": "rgba(39, 76, 119, 0.16)",
  "--gradient-page": "var(--color-bg-canvas)",
  "--gradient-accent": "var(--color-accent)",
  "--gradient-hero": "var(--color-accent-hover)",
  "--gradient-illustration-1": "var(--color-surface-raised)",
  "--gradient-illustration-2": "var(--color-surface-contrast)",
  "--gradient-illustration-3": "var(--color-bg-subtle)",
  "--radius-xs": "3px",
  "--radius-sm": "5px",
  "--radius-md": "8px",
  "--radius-lg": "10px",
  "--radius-xl": "12px",
  "--layout-sidebar-width": "240px",
  "--layout-sidebar-collapsed-width": "60px",
  "--shadow-sm": "0 8px 18px rgba(15, 23, 42, 0.06)",
  "--shadow-md": "0 16px 32px rgba(15, 23, 42, 0.08)",
  "--shadow-lg": "0 24px 48px rgba(15, 23, 42, 0.14)",
  "--shadow-focus": "0 0 0 3px rgba(39, 76, 119, 0.16)",
  "--transition-fast": "0.15s ease",
  "--transition-normal": "0.22s ease",
});

export const themes = Object.freeze({
  slate: slateTheme,
});

export const DEFAULT_THEME = "slate";

export function applyTheme(
  themeName = DEFAULT_THEME,
  target = document.documentElement,
) {
  const nextThemeName = Object.prototype.hasOwnProperty.call(themes, themeName)
    ? themeName
    : DEFAULT_THEME;
  const theme = themes[nextThemeName];

  target.dataset.theme = nextThemeName;

  for (const [token, value] of Object.entries(theme)) {
    target.style.setProperty(token, value);
  }

  return theme;
}
