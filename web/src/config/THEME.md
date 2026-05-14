# Web Theme

The active web theme is defined in [theme.js](theme.js).

## Where to change colors

- Update token values in [theme.js](theme.js).
- Keep component files using CSS variables instead of raw hex or rgba values.
- [index.css](../index.css) mirrors the same tokens as fallback values and exposes legacy aliases while older component names are still in use.

## Current setup

- `applyTheme()` in [index.js](../index.js) loads the default `slate` theme.
- Future themes can be added by creating another token map in [theme.js](theme.js) and passing its name to `applyTheme()`.

## Recommended token groups

- Surface and text: `--color-bg-*`, `--color-surface-*`, `--color-text-*`
- Actions and focus: `--color-accent*`, `--shadow-focus`, `--transition-*`
- Status states: `--color-success*`, `--color-warning*`, `--color-danger*`, `--color-info*`
- Layout and elevation: `--layout-*`, `--radius-*`, `--shadow-*`