# Utility classes

229 `g-*` classes for the **last adjustment** of your page: a margin, a row, the size of a text. They are not a pixel scale: **they speak the theme's language**. `g-p-4` is `padding: var(--g-space-4)`, `g-text-caption` is the theme's `caption` role, `g-radius-lg` is the `lg` radius. No `!important`, no breakpoints and no colors of their own: the theme sets the color.

**Tag:** `class="g-…"` (no component) · **Status:** `stable` (the classes in `utilities.json` are part of the 1.0 semver promise, [`docs/contract/api.md`](../../../../docs/contract/api.md) “Estabilidad y versiones”; audited by coco with no blocking defect, [`design/lab/utilities/auditoria.md`](../../../../design/lab/utilities/auditoria.md)) · **Since:** `1.0.0` ([`CHANGELOG.md`](../../../../CHANGELOG.md))

```js
import '@grana/vue/style.css'      // already includes the utilities
```

```js
import '@grana/vue/utilities.css'  // only the utilities; needs the tokens (see “Usage”)
```

> **They are a one-off adjustment, not composition.** To stack blocks use `GStack`; for the fields of a form, `GFormLayout` + `GFormRow`; for a box with a surface, `GSurface`. If you repeat the same adjustment across a screen, what is missing is one of those pieces, not more classes. See “When to use them”.

## On this page

[§ Usage](#usage) · [§ When to use them](#when-to-use-them) · [§ Examples](#examples) · [§ Classes](#classes) · [§ On the root of a component](#on-the-root-of-a-component) · [§ Layers and specificity](#layers-and-specificity) · [§ Accessibility](#accessibility) · [§ Personality](#personality) · [§ Theme](#theme) · [§ Scope](#scope) · [§ Verification](#verification)

## Usage

With `@grana/vue/style.css` there is nothing else to do: the utilities already come inside it, in the `grana.utilities` layer.

```vue
<GStack gap="md">
  <p>Hematology result: no abnormalities.</p>
  <p class="g-text-body-sm g-text-muted g-mt-2">Updated 5 min ago</p>
</GStack>

<GBtn class="g-ms-auto">Save</GBtn>
<span class="g-sr-only">(opens in a new tab)</span>
```

**Only the utilities.** If you use Grana's tokens without the components, load `@grana/vue/utilities.css` (1,878 B gzip). The sheet declares the layer order itself, so it does not matter whether you load it before or after another Grana sheet. **It needs the tokens**: a full theme from `@grana/cli` or `@grana/vue/style.css`. With `style.css` you do not need to load it as well.

**If you have element styles of your own** (an `h3 { margin: … }` or a third-party reset), declare Grana's layers after yours so they do not beat the components. The full recipe, with the five layers, is the one in [`docs/contract/api.md`](../../../../docs/contract/api.md) “Estilos de elemento de la aplicación”:

```css
@layer base, grana.defaults, grana.components, grana.blocks, grana.utilities;
@layer base { h1, h2, h3, h4, h5, h6 { margin-block: 1.5em 0.5em; } }
```

The previous recipe, `@layer base, grana.defaults, grana.components;`, **is still correct**: `grana.css` declares the full order and appends the two missing layers after it.

## When to use them

| I need | Use | Not |
| --- | --- | --- |
| Stack the blocks of a page or panel with rhythm | `GStack` | `g-flex g-flex-col g-gap-6` repeated in every section |
| Separate **one** piece more or less than usual inside a stack | `g-mt-*` / `g-mb-*` on the child (it beats the reset to 0 of `GStack` and **adds** to its `gap`; it is an explicit intention of your application, with no warning) | Changing the `gap` of the whole stack |
| The fields of a form | `GFormLayout` + `GFormRow` | Width, margin or alignment utilities on fields inside a row: they break the mandatory distribution and fall outside the contract |
| Hide a field depending on another | `GFormReveal` | `g-hidden` on a `GForm` field: it stays registered, validates and can block submission with an error nobody sees |
| Spread children over lines by their size | `GAdaptiveLayout` with the `g-adapt-*` hints | `g-grow` or `g-w-full` on its children |
| Padding, background, border and radius of a box with a surface | `GSurface` or `GCard` | `g-p-4 g-radius-lg` plus a background of your own: a half surface, with no zone or theme contrast |
| Padding or radius of an element of your own **without** a surface (a cell, a slot gap) | `g-p-*`, `g-radius-*` | — |
| The page column and the bleed | `GContainer` (`g-bleed`, `g-bleed-raw`) | Negative margins (they do not exist) |
| A heading whose level comes from nesting | `GSection` | `<h2 class="g-text-title">` when the hierarchy belongs to the page |
| A text of yours with the size of a theme role | `g-text-{role}` | A hand-written `font-size` |
| A row of pieces that wraps | `GStack orientation="horizontal"` | `g-flex` without `g-flex-wrap` (it does not wrap: reflow at 320 px is up to you) |
| Distribute with `between`, `around` or `evenly` | `g-justify-*` (`GStack` does not have it) | — |
| Text only for screen readers | `g-sr-only` | `g-hidden`: it also removes it from the accessibility tree |

## Examples

### e1 · Separate one piece more than usual inside a stack

```vue demo
<GStack gap="sm">
  <p>Hematology result: no abnormalities.</p>
  <p>Blood chemistry result: pending validation.</p>
  <p class="g-text-body-sm g-text-muted g-mt-4">Updated 5 min ago by the central laboratory.</p>
</GStack>
```

**Why:** the stack already spreads the space between its children; the update note belongs to the whole set, not to one result, and asks for a bit more distance. `g-mt-4` on **that child** beats the reset to 0 of `GStack` and adds to the `gap`, without touching the rhythm of the rest. If every child needs more space, change the stack's `gap`; do not put the class on each one.

### e2 · A row with the action at the end

```vue demo
<div class="g-flex g-flex-wrap g-items-center g-gap-2">
  <span class="g-text-body-sm">Result pending validation</span>
  <GBtn class="g-ms-auto" variant="outline" color="neutral" size="sm">Reject</GBtn>
  <GBtn size="sm">Validate</GBtn>
</div>
```

**Why:** a line of text with two actions that go at the end is the typical case where `GStack` falls short (it does not distribute). `g-ms-auto` pushes the buttons to the end of the line and, being a logical axis, also in `dir="rtl"`. `g-flex-wrap` lets them move to another line in a narrow container instead of overflowing. Margins on the root of a component are the **outer**, stable part; see “On the root of a component”.

### e3 · Supporting text with the theme's size and color

```vue demo
<div>
  <p class="g-text-title-sm g-font-title">Laboratory report</p>
  <p class="g-text-body">Sample received on October 21, without incidents.</p>
  <p class="g-text-caption g-text-subtle">Folio 4821 · morning shift</p>
</div>
```

**Why:** size, line height, tracking and weight come from the theme role, and the color from the `muted`/`subtle` pair, which the theme guarantees with enough contrast and redeclares in dark. If you change `fontSize` in `grana.config.json`, these lines follow the body text of the components. `g-text-title-sm` does not set the family: `g-font-title` adds it. If what you need is a **section heading** with a level, use `GSection`.

### e4 · An accessible name longer than what is shown

```vue demo
<GBtn variant="ghost" color="danger" size="sm">
  <span class="g-sr-only">Delete record 4821</span>
  <span aria-hidden="true">Delete</span>
</GBtn>
```

**Why:** in a list with several “Delete” buttons, a screen reader user needs to know **which one**. The text with `g-sr-only` takes no space, is not shown and stays in the accessibility tree: the button measures the same as without it and its name is “Delete record 4821”. The `aria-hidden` keeps the reader from saying “Delete” twice. `g-hidden` does not work here: it removes it from the tree.

## Classes

The full list and its exact order is [`design/contracts/utilities.json`](../../../../design/contracts/utilities.json); here are the families and their formula. Each class is **a single declaration** (the text ones, the four of the role; `g-sr-only`, those of the hidden text pattern).

**Space steps `{step}`:** `0` and `1 2 3 4 5 6 8 12 16`, which read `var(--g-space-{step})`. With the default theme they are 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64 px. Ten steps, no negatives.

**Axes `{axis}`:** no axis = all four sides · `x` = inline · `y` = block · `t` = block start · `b` = block end · `s` = inline start · `e` = inline end. **There is no `l` or `r`.**

### Space (177)

| Pattern | Declaration | Classes |
| --- | --- | --- |
| `g-m-{step}` · `g-mx-` · `g-my-` · `g-mt-` · `g-mb-` · `g-ms-` · `g-me-` | `margin`, `margin-inline`, `margin-block`, `margin-block-start`, `margin-block-end`, `margin-inline-start`, `margin-inline-end` | 70 |
| `g-m-auto` · `g-mx-auto` · `g-my-auto` · `g-mt-auto` · `g-mb-auto` · `g-ms-auto` · `g-me-auto` | the property of its axis with `auto` (margins only) | 7 |
| `g-p-{step}` · `g-px-` · `g-py-` · `g-pt-` · `g-pb-` · `g-ps-` · `g-pe-` | `padding` and its logical axes | 70 |
| `g-gap-{step}` · `g-gap-x-{step}` · `g-gap-y-{step}` | `gap` · `column-gap` · `row-gap` | 30 |

### Layout (30)

| Class | Declaration |
| --- | --- |
| `g-block` `g-inline` `g-inline-block` `g-flex` `g-inline-flex` `g-grid` | `display`. They respect the `hidden` attribute (see “Rules worth knowing”) |
| `g-hidden` | `display: none`; it beats the six above |
| `g-flex-row` `g-flex-col` `g-flex-wrap` | `flex-direction: row` · `column` · `flex-wrap: wrap` |
| `g-items-{start\|center\|end\|stretch\|baseline}` | `align-items` |
| `g-justify-{start\|center\|end\|between\|around\|evenly}` | `justify-content` (`between` = `space-between`…) |
| `g-self-{start\|center\|end\|stretch}` | `align-self` |
| `g-grow` · `g-shrink-0` | `flex-grow: 1` · `flex-shrink: 0` |
| `g-w-full` · `g-h-full` · `g-min-w-0` | `inline-size: 100%` · `block-size: 100%` · `min-inline-size: 0` |

`start` and `end` (not `flex-start` or `flex-end`) mean the same in flex and in grid and follow the text direction.

### Text and shape (21)

| Class | Declaration |
| --- | --- |
| `g-text-{caption\|body-sm\|body\|title-sm\|title\|title-lg}` | `font-size`, `line-height`, `letter-spacing` and `font-weight` of the role (not the family) |
| `g-text-muted` · `g-text-subtle` | `color: var(--g-color-text-muted)` · `var(--g-color-text-subtle)` |
| `g-text-start` · `g-text-center` · `g-text-end` | `text-align` |
| `g-truncate` | `overflow: hidden`, `text-overflow: ellipsis`, `white-space: nowrap` |
| `g-font-ui` · `g-font-title` | `font-family: var(--g-font-ui)` · `var(--g-font-title)` |
| `g-radius-{none\|xs\|sm\|md\|lg\|xl\|pill}` | `border-radius: var(--g-radius-{step})` |

### Accessibility (1)

| Class | Declaration |
| --- | --- |
| `g-sr-only` | The accessible hidden text pattern: `position: absolute`, 1 × 1 px, `margin: -1px`, `overflow: hidden`, `clip-path: inset(50%)`, `white-space: nowrap`, no border or padding |

### Rules worth knowing

- **The order in the `class` attribute does not matter; the order of the sheet does.** In each family the four sides come first, then the axes (`x`, `y`) and then the sides (`t`, `b`, `s`, `e`): `g-p-4 g-pt-0` and `g-pt-0 g-p-4` both leave 0 at the top, and `g-mx-auto g-ms-0` leaves `auto` only at the end.
- **`hidden` wins over `g-flex`.** The six `display` utilities do not show an element with the `hidden` attribute (also `hidden="until-found"`): `class="g-flex" hidden` stays hidden. `g-hidden`, on the other hand, beats any of them.
- **No density.** A utility reads the token as is: `g-p-4` measures `--g-space-4` also inside a `GDialog density="compact"`.
- **They follow the scheme and the zone.** The dark theme and the brand zone redeclare `--g-color-text-muted` and `--g-color-text-subtle`; `g-text-muted` inside `zone="brand"` reads the zone's value.
- **`g-truncate` cuts the view, not the content.** It needs a width that limits it: in a flex row, with `g-min-w-0`.
- **`GStack divided`** treats a child with `g-hidden` or `g-sr-only` as hidden (it draws no line for it). A class of your own that hides with `display: none` is not detected.

## On the root of a component

Utilities work on your elements and **inside the slots** of any component. On the **root** of a Grana component there are two kinds of utility:

| Class | On the root of a component |
| --- | --- |
| Margins (`g-m*`), `g-self-*`, `g-grow`, `g-shrink-0`, `g-w-full`, `g-min-w-0`, `g-hidden` | **Outer, stable:** they place the component among its neighbors. If the component has a prop for the same thing, use the prop (`GBtn block` rather than `g-w-full`) |
| Padding (`g-p*`), `display`, `g-flex-*`, `g-items-*`, `g-justify-*`, `gap`, text (`g-text-*`, `g-font-*`, `g-truncate`), `g-radius-*`, `g-h-full`, `g-sr-only` | **Inner, outside the contract:** they win by layer and can therefore break a contract height, a grid, the touch target or the typography of the component. Defects are not filed for their effect: to change the inside, use the prop, the theme or a rule of your own on the component |

**The evidence (U-A6, `measured`, real `GBtn`, Chromium, Firefox and WebKit):**

| Class on the root of a `GBtn` | Measured effect | Kind |
| --- | --- | --- |
| `g-ms-auto` | Moves the button away from the start of the row; the same distance in LTR and in RTL | Outer |
| `g-w-full` | Widens it to the whole line | Outer |
| `g-hidden` | Leaves it at `display: none` | Outer |
| `g-p-8` | Its box goes from **87.3 × 36 px to 119.3 × 86 px**: it loses the contract height | Inner |

This is the contracted limit of the table, not a defect: the class wins by layer and the component changes size. To take the whole line, `GBtn` has its own prop: `block` applies `display: flex` and `inline-size: 100%` (`GBtn.css`), while `g-w-full` only sets the width. Use the prop and keep `g-w-full` for your own elements and for components that have no prop.

## Layers and specificity

Utilities live in the **`grana.utilities`** layer, the last one of Grana. The full order, from weakest to strongest, is `grana.defaults`, `grana.components`, `grana.blocks`, `grana.utilities`, and your CSS **without a layer** beats everything. Two consequences:

1. **A utility beats any Grana rule without `!important`**: `g-mt-4` on a child of `GStack` beats its 0 margin, and beats a `grana.components` rule even if that rule is more specific.
2. **A rule of yours without a layer beats the utility**: there is never a case where a utility overrides your application. If `.note { margin-block-start: 3px }` and `class="note g-mt-4"` meet, it measures 3 px.

All rules have the same specificity (one class; the `hidden` guard goes in `:where()` and adds nothing), so within the layer only the order of the sheet decides. Each Grana sheet (`style.css`, the standalone `utilities.css` and the `components.css` of `@grana/blocks`) declares the full order at its start: the layer order is set by the first time each name appears, so utilities never end up as the weakest layer, whichever sheet you load first.

## Accessibility

a. **Text no smaller than 12 px.** `caption` (0.75 rem) is the smallest role and **measures 12 px: it is the minimum**; no text utility goes below it in the default theme or in a CLI theme with `fontSize` 14, where `caption` measures 12.25 px (`measured`, `design/lab/utilities/verificar.mjs`, 1767/1767, and coco's audit). Do not combine `g-text-caption` with a smaller `font-size` of your own.

b. **Contrast of `g-text-muted` and `g-text-subtle`** on the page: 7.46:1 and 5.10:1 in light, 9.29:1 and 6.71:1 in dark (`measured`, `design/lab/utilities/estilo.md`). In the `g-text-caption g-text-muted` example of the real playground: 7.46:1 in light and 8.59:1 in dark. The tightest case is `g-text-subtle` over `surface-sunken` in light: 4.72:1 with the default theme and 4.70:1 in the worst of 12 themes (`lustre`). The 168 checks of `contraste-temas.mjs` (12 themes, light and dark, three surfaces) are ≥ 4.5:1 (`measured`, 168/168). The 0.2 margin is narrow: it is set by the theme engine's derivation, not by the utility (U-A5). **Over a background of your own application, the contrast is yours**.

c. **`g-sr-only` stays in the accessibility tree and takes no space:** a button with `g-sr-only` text keeps its accessible name (“Save changes”) and measures the same as its twin without it (`measured` with the name the engines compute; not with a real screen reader). `g-hidden`, on the other hand, takes it out of the tree.

d. **Text direction:** being logical axes, `g-ms-4` falls on the left in `ltr` and on the right in `dir="rtl"`, and `g-text-start`, `g-text-end`, `g-items-*` and `g-justify-*` follow the direction (`measured`, in LTR and RTL, in the three engines).

e. **Focus:** no utility touches the focus outline; there are no state variants (`focus:`, `hover:`) that could remove it.

f. **`forced-colors`:** with `forced-colors: active` emulated in Chromium, Firefox and WebKit, `g-sr-only` stays at 1 × 1 px, absolute and with its accessible name, `g-hidden` stays at `display: none` and `g-truncate` clips with an ellipsis (`measured`, coco's audit; they are the only three the mode affects). With real Windows, not verified.

g. **Reflow:** `g-flex` does not wrap on its own. For a row not to overflow at 320 px (WCAG 1.4.10), add `g-flex-wrap` or use `GStack orientation="horizontal"`, which always wraps.

> **Danger.** `g-sr-only` never goes on a focusable element or on an ancestor of one: focus would land on something invisible and keyboard users would lose their bearings (WCAG 2.4.7, focus visible). For a skip link that appears on focus, the `g-sr-only-focusable` class is **reserved** (#809); it does not exist yet. `g-truncate` clips what is seen, not the text, and **in a flex row it needs `g-min-w-0`** on the clipped element: without it the row grows with the text and nothing is cut (a flex child does not shrink below its content by default). If the content matters, sighted users need another way to read it in full (`GTooltip`, a detail view).

## Personality

What makes them different from other utility sheets:

- **The scale is the theme's, not a pixel scale.** The class suffix is the token suffix: with `space` 5 in `grana.config.json`, `g-p-4` goes from 16 to 20 px **across the whole page at once**, together with the components (`measured`: `g-p-4` measures 16 px with the default theme and 20 px with `space` 5, both in the “Tema de prueba” and in a CLI theme). Text roles too: `g-text-title` measures what the theme's `title` role measures in every theme (`measured`, against a probe with the four variables of the role). A utility never puts a screen out of step with the rest of Grana.
- **Logical axes by construction.** A screen written with utilities flips in `dir="rtl"` without touching a class.
- **No breakpoints or state variants.** Grana composes by intrinsic size and container queries, not by screen width; an `md:` utility would bring back what the components avoid. Responding to width is the job of `GAdaptiveLayout`, `GStack` and `GContainer`.
- **It wins without `!important` and loses to your application:** your way out is never closed.

No motion: no utility animates, transitions or changes shape, so `prefers-reduced-motion` does not come into play.

## Theme

They add no token. They read exactly:

| Token | What it controls |
| --- | --- |
| `--g-space-{1\|2\|3\|4\|5\|6\|8\|12\|16}` | Margins, paddings and gaps. They are read **per step**, not as `--g-space-1 × n` |
| `--g-text-{caption\|body-sm\|body\|title-sm\|title\|title-lg}-{size\|line\|tracking\|weight}` | The four values of each `g-text-*` role |
| `--g-font-ui`, `--g-font-title` | `g-font-ui`, `g-font-title` |
| `--g-color-text-muted`, `--g-color-text-subtle` | `g-text-muted`, `g-text-subtle` (redeclared by dark and by the brand zone) |
| `--g-radius-{none\|xs\|sm\|md\|lg\|xl\|pill}` | `g-radius-*`. Not `--g-radius-shape`: that is the shape of the controls |

## Scope

- **Limit of a hand-written theme.** A hand-written `tokens.css` that only changes `--g-space-1` moves the components (which compute `space × n`) but **not** the utilities (which read `--g-space-{n}`). Redeclare the nine steps; the CLI already emits them all. It is a consequence of the chosen scale (the suffix is the token), not a defect.
- **Inline styles:** a property a component writes in its `style` (positions, `--_*` aliases) beats any layer; a utility does not change it.
- **Boundary with `GStack`:** margin utilities on the children of a stack beat its reset to 0 on purpose (e1).
- **Reserved (#809):**
  - negative steps (`g-mt-n4`…): to bring something out to the edge, `g-bleed` from `GContainer`;
  - width variants (`md:`) and state variants (`hover:`, `focus:`, `dark:`);
  - `g-ml-*`, `g-pr-*` (logical axes only);
  - `g-text-display` and `g-font-display`;
  - `g-radius-shape`;
  - `g-sr-only-focusable`;
  - `g-flex-row-reverse`, `g-flex-col-reverse` and `g-order-*` (visual order different from the DOM);
  - `g-flex-nowrap`, `g-inline-grid`, grid columns (`g-cols-*`) and fractional widths;
  - background, border and shadow (`g-bg-*`, `g-border-*`, `g-shadow-*`): they are the surface, `GSurface`;
  - position, stacking and overflow (`g-relative`, `g-z-*`, `g-overflow-*`, `g-sticky`);
  - `!important` or a “strong” variant.
- **Reserved names:** the utility prefixes (`g-m-`, `g-p-`, `g-gap-`, `g-text-`, `g-items-`, `g-justify-`, `g-self-`, `g-radius-`, `g-font-`, `g-w-`, `g-h-`, `g-min-w-`) and the names `g-grid`, `g-flex`, `g-block`, `g-inline` and `g-hidden` are reserved: no future component will use them as a tag or as a class.
- **No JS and no development warnings:** they are pure CSS; uses outside the contract of the outer/inner table are not detected.
- **Weight** (cap of 3 KiB gzip -9, #810, `measured`): standalone `dist/utilities.css`, 9,953 B uncompressed and **1,878 B gzip -9** (through standard input; `gzip -9 file` adds the name to the header and gives 1,892 B, the figure in [`CHANGELOG.md`](../../../../CHANGELOG.md)). Inside `dist/grana.css`: **+1,544 B** for the utilities alone (coco) and **+1,561 B** with the layer order declaration, +17 B (bruno, 100,163 → 101,724 B), half of the cap. They do not affect `grana.js` or the UMD.

## Verification

- **bruno's tests** (`test`): [`utilities.test.js`](utilities.test.js), 13 tests passing (mora-docs, 2026-10-22). They check that the set **and the order** of selectors match `utilities.json` (229), that each declaration is the JSON's, that every value is `var(--g-…)` with no fallback or an allowed literal, that there is no `!important`, that every token read exists in `defaults.css`, that the six `display` classes (and only they) carry the `hidden` guard, and that `dist/utilities.css` starts with the full layer order declaration and wraps its rules in `@layer grana.utilities`.
- **coco's audit** (`measured`, 2026-10-22, on the real `dist/`): [`design/lab/utilities/auditoria.md`](../../../../design/lab/utilities/auditoria.md), no blocking defect. Three verifications of its own:

| Verification | What it measures | Result |
| --- | --- | --- |
| [`verificar.mjs`](../../../../design/lab/utilities/verificar.mjs) | The 229 classes against their declaration, scale with `space` 5 and `fontSize` 14, logical axes and RTL, order within the family, layers (beats `grana.components`, loses to the application), `hidden`, flex and grid, text, `g-truncate`, `g-sr-only` versus `g-hidden`, `GStack divided`, the standalone `dist/utilities.css` sheet, layer order without help from the bench, and `forced-colors` | **589/589** in each of Chromium, Firefox and WebKit (**1767/1767**) |
| [`auditoria-playground.mjs`](../../../../design/lab/utilities/auditoria-playground.mjs) | The real playground's `#sec-utilities` in light and dark, and the box, `display`, margin, padding, font size and `gap` of ≈ 16,800 elements with and without the layer | **42/42** per engine (**126/126**); no component changes size |
| [`contraste-temas.mjs`](../../../../design/lab/utilities/contraste-temas.mjs) | `g-text-muted` and `g-text-subtle` over `bg`, `surface` and `surface-sunken`, light and dark, in 12 themes | **168/168** ≥ 4.5:1 |

  Audit findings: U-A1 to U-A4 were about the bench and the verifier (fixed, `utilities.css` did not change); U-A5 is the 0.2 margin of `text-subtle` over `surface-sunken`; U-A6 is the outer/inner limit.
- **Not verified:** (1) with a real screen reader, only the accessible name the engines compute; (2) real Safari, touch and Windows `forced-colors` (emulated, not real); (3) with `fontSize` 14 as the CLI minimum, a theme with `body-sm` below 12 px is not measured (the engine rejects it on purpose); (4) the “with and without the layer” comparison is against the same `dist/` without the utilities block, **not** against an earlier `grana.css`; (5) a hand-written theme that only changes `--g-space-1` was not measured (see “Scope”).
- **Open items:** none of its own; the general ones, in [`PENDIENTES.md`](../../../../PENDIENTES.md) §6.

## Sources

- Contract: [`design/contracts/utilities.md`](../../../../design/contracts/utilities.md) and the canonical list [`design/contracts/utilities.json`](../../../../design/contracts/utilities.json) (229 classes; if they differ, the JSON wins)
- Decisions: #804 to #811 in [`DECISIONS.md`](../../../../DECISIONS.md)
- API and tokens: [`docs/contract/api.md`](../../../../docs/contract/api.md) “Clases utilitarias” and [`docs/contract/tokens.md`](../../../../docs/contract/tokens.md) §8 and §55
- Sheet: [`utilities.css`](utilities.css) (coco) and its standalone generation in `dist/utilities.css` (bruno)
- Audit: [`design/lab/utilities/auditoria.md`](../../../../design/lab/utilities/auditoria.md)
- Style and measurements: [`design/lab/utilities/estilo.md`](../../../../design/lab/utilities/estilo.md); own verification [`design/lab/utilities/verificar.mjs`](../../../../design/lab/utilities/verificar.mjs); bench [`design/lab/utilities/estilo-banco.html`](../../../../design/lab/utilities/estilo-banco.html)
- Tests: [`utilities.test.js`](utilities.test.js)
- Bench: `#sec-utilities` of [`packages/vue/playground/index.html`](../../playground/index.html)
