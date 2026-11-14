# @grana/cli

Generates your project's `tokens.css` from a short configuration and **rejects themes that break the accessibility minimums**, explaining which one and why. No dependencies; Node ≥ 22.

**Status: `1.0.0`** (semver: the `theme` and `check` commands, the exit codes, the configuration keys, the names of the emitted tokens and the `code` of the diagnostics are public API; see `api.md` “Estabilidad y versiones”). The `docs/contract/…` and `§n` references in this document point to the repository's [token contract](https://github.com/kevinedgm/grana/blob/main/docs/contract/tokens.md) (in Spanish); the overview of Grana is in the [main README](https://github.com/kevinedgm/grana/blob/main/README.en.md).

*Español: [README.md](https://github.com/kevinedgm/grana/blob/main/packages/cli/README.md).*

```bash
npx @grana/cli theme grana.config.json    # writes tokens.css
npx @grana/cli check grana.config.json    # validates only
```

## Configuration

Every key is optional (contract in `docs/contract/tokens.md` §1); an unknown key is an error.

```json
{
  "brand": "#7A1F5C",
  "accent": "#0F766E",
  "radius": 12,
  "shape": "pill",
  "space": 4,
  "font": "Inter",
  "fontDisplay": "Instrument Serif",
  "fontSize": 16,
  "typeScale": 1.25,
  "primary": "#7D1230",
  "neutrals": "tinted",
  "neutralsHue": "brand",
  "semanticCollision": "warn",
  "categories": 6,
  "dark": true,
  "overrides": { "--g-glass-opacity": "0.7" }
}
```

`primary` (optional) is the color of the main action when it is not the brand: without it, `primary` is an alias of `brand`. From `brand`, `accent` and `primary` the CLI derives (in OKLCH) `strong`, `soft`, `on`, `text` and `on-soft` with guaranteed contrast. Semantic colors and any other token are adjusted with `overrides`.

## Palette derivation

Besides `strong`, `soft`, `text` and `on` of `brand` and `accent`, the CLI computes **by rules in OKLCH** (contract `docs/contract/tokens.md` §16):

| What | Rule | How to control it |
| --- | --- | --- |
| **Semantic colors without clashes** | If `success`, `warning`, `danger` or `info` end up at an OKLab distance < 0.12 from `brand`/`accent` (in light or dark), the CLI **warns and proposes the alternative** (the minimum separation: hue ±45°, lightness ±0.15). With `"semanticCollision": "adjust"` it applies it on its own | `semanticCollision` (`warn` by default, `adjust`) and the token's `overrides` (wins) |
| **Tinted neutrals** | Text, borders, sunken surface and `neutral` take the brand hue at a very low chroma, with guaranteed contrast (text ≥ 4.5:1, control ≥ 3:1) | `"neutrals": "pure"`; `"neutralsHue": "accent"` takes the accent hue instead of the brand's (only the hue; it is not inferred) |
| **Categories** | `--g-color-cat-1` to `cat-N`: same L and C, hues every 360°/N | `"categories": 6` (0 to 12) |
| **Hover** | `strong` always moves away from the background of its text | (fixed rule) |

```bash
npx @grana/cli theme grana.config.json --doc     # writes tokens.json as well as tokens.css
```

`tokens.json` documents each token: **level** (`reference` or `semantic`), **origin**, light and dark value, **usage**, measured contrast and **state** (`default`, `derived`, `adjusted`, `override`); unapplied collisions carry `recommended`, and the root brings `diagnostics` (`{ "name": "on-brand", "value": { "light": "#FFFFFF", "dark": "#17151A" }, "usage": "…", "contrast": { "against": "--g-color-brand", "light": 8.08, "dark": 7.1 } }`). `buildTheme` also returns it as `doc`.

## Dark theme (`dark`)

By default (`dark: true`) the CLI derives **the dark variant of what you change** and emits it next to the light one (contract `docs/contract/tokens.md` §15): the theme follows the system (`prefers-color-scheme`) and can be forced with `data-theme="dark"` or `"light"` on any element.

```json
{ "brand": "#0B1F4D", "dark": { "brand": "#8FACE5", "overrides": { "--g-color-text": "#ECECEC" } } }
```

| Value | Effect |
| --- | --- |
| `true` (default) | Derives the dark theme from `brand` and `accent` (in OKLCH: the light base is kept or mirrored and raised up to 4.5:1 over the dark surface) |
| `{ brand, accent, primary, overrides }` | `brand`, `accent` and `primary` are explicit dark colors (derived with the same rules); `overrides` only applies to dark |
| `false` | No dark theme: the full light theme is restored inside the dark query (a dark system does not turn on the dark defaults). It warns: a forced `data-theme="dark"` would mix the dark defaults with your light colors |

Every color token you change in light (for example `overrides` of `--g-color-surface`) also gets its dark value (the default one, or the one you set in `dark.overrides`): `tokens.css` has no layer and, without that, it would win in dark. **Both schemes are validated** (dark messages start with `[oscuro]`). Dark does not change `radius`, `space`, `font`, `fontSize` or `typeScale`.

```css
/* generated tokens.css (summary) */
:root { /* what is not color */ }
:root, [data-theme="light"] { /* light colors */ }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { color-scheme: dark; /* dark colors */ } }
[data-theme="dark"] { color-scheme: dark; /* dark colors */ }
```

## Commands

| Command | What it does |
| --- | --- |
| `grana theme <config> [--out file] [--stdout] [--doc[=file]]` | Validates and writes `tokens.css` (no layer, always wins). If something fails, it writes nothing. |
| `grana check <config> [--json]` | Validates only; with `--json`, a report for CI. |
| `--help`, `--version` | Help and version. |

**Exit codes:** `0` correct (warnings do not count) · `1` the theme breaks a minimum · `2` invalid usage or configuration.

## What it validates (contract §7 and §12)

**In both schemes (light and dark):** focus ≥ 2px · text contrast ≥ 4.5:1 and control borders ≥ 3:1 · text ≥ 12px · `on-*`/`*-text` pairs ≥ 4.5:1 · glass: opacity ≥ 0.55 and veil ≥ 4.5:1 over black. It warns (without blocking) about unknown tokens, colors it cannot measure and `space` < 4.

## Vite plugin

Generates the theme **at build time**, with no intermediate file: it is imported as a virtual module.

```js
// vite.config.js
import grana from '@grana/cli/vite'
export default { plugins: [grana({ config: 'grana.config.json' })] }   // the path is relative to the root; it also accepts the object
```

```js
// main.js
import 'virtual:grana/tokens.css'
```

It applies the same rules as the command line: if the configuration is invalid or the theme breaks an accessibility minimum, **the build fails** with the reason (warnings are shown without blocking). The configuration file is watched: in development, saving it regenerates the theme and reloads the page; if it becomes invalid, the server answers with the error and recovers once it is fixed. No dependencies (it does not import `vite`).

## Programmatic use

```js
import { buildTheme } from '@grana/cli'
const { ok, css, issues } = buildTheme({ brand: '#7A1F5C' })
```

## Maintenance

`src/defaults.js` is a copy of `packages/vue/src/styles/defaults.css` (`DEFAULTS`: the light theme; `DARK`: the color group of the `[data-theme="dark"]` block). After changing the defaults: `node packages/cli/scripts/sync-defaults.mjs` (a test fails if they drift apart).
