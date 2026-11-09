# Grana

> *The only bug you'll want in your UI.*

A **Vue 3** component library with a token-based theme. The components bring the **structure**; your theme gives them the **color**.

The name comes from **grana cochinilla**, the Oaxacan cochineal insect whose dye colored half the world. Grana works the same way: a fixed frame and a color each project brings.

- **A new theme leaves no remnants.** Components read only `--g-*` variables, with no fallback values and no colors written in their CSS: no fixed value is left behind.
- **Accessibility as a constraint, not an extra.** Touch target, text size, contrast and focus have minimums that are not theme: the theme generator rejects anything that breaks them.
- **80 documented components** (75 in `candidate` status and 5 in `draft`, waiting for their audit): complete forms, tables and filters, calendar, panels, notices, voice capture.
- **Its own personality.** Motion and form with identity, always with tokens, `prefers-reduced-motion` and contrast intact (see [Personality](#personality)).

## What Grana is

Grana is an **interface system for product applications built with Vue 3**: admin panels, internal systems, data capture tools, long form flows, tables and filters. It is two pieces that work together:

- **`@grana/vue`**, the component library: buttons, fields, complete forms, tables with filters and pagination, calendar, dialogs, menus, notices, tooltips, voice capture and more.
- **`@grana/cli`**, the theme engine: from a few facts about your brand (primary color, neutrals, category colors, dark mode) it derives in OKLCH every token the components read and **rejects the combinations that do not meet the minimum contrast**.

### The problem it solves

Component frameworks usually force a choice between two extremes:

- **They bring their own look.** They work from day one, but your application ends up looking like every other one that uses the same framework, and changing its identity means fighting their styles.
- **They bring none (headless).** They give total freedom, but every team solves again the structure, focus, keyboard, states and accessibility of each component.

Grana separates the two responsibilities. **The library decides the structure**: anatomy, states, keyboard, ARIA semantics, focus and behavior on mobile. **Each project decides the color**: palette, typography, radii, spacing and density, all with `--g-*` variables. Because the components carry no theme value written in their CSS, a new theme changes them completely and leaves no remnants of the previous one.

### How it works

1. **The components** read only `--g-*` variables, with no fallback values.
2. **The default theme** (neutral, sober, with Instrument Sans) lives in a low-priority CSS layer, `grana.defaults`, so the application works and looks good without configuring anything.
3. **Your theme**, written by hand or generated with `@grana/cli`, goes outside that layer and **always wins**, with no `!important` and no more specific selectors.

### What sets it apart

- **Accessibility is neither optional nor dependent on the theme.** Touch target of at least 24px (44px on touch screens), text of at least 12px, contrast of at least 4.5:1 (3:1 for controls) and focus always visible. They cannot be configured from the theme, and `@grana/cli` does not generate a theme that goes below them.
- **Personality without sacrificing the above.** Each component explores its own behavior, form or motion instead of copying the common pattern: the tooltip that travels from control to control, the time you type the way you say it, the multiple selection that reads as a sentence. Always with `prefers-reduced-motion` respected.
- **Real forms.** Rows that always fill the width, merged fields, collapsible and addable sections, conditional fields that leave the submission when hidden, error summary and built-in validation.
- **No network inside the components.** Grana does not call `fetch`: the application supplies the data and, where a service is needed (uploading files, transcribing voice), connects it with its own adapter.
- **Weight under control.** Each component is marked as pure, so importing one does not drag in the rest, and the heaviest ones (voice, status island, combobox, files, time, slider, floating button) and the latest to arrive live in their own entries.
- **Decisions in plain sight.** Each component has its public contract and every design decision is recorded with its reasoning in [`DECISIONS.md`](DECISIONS.md), so the system does not change on a whim.

### Who it is for

For teams that build **everyday-use applications**, where people spend hours capturing, reviewing and deciding, and who want a coherent, accessible system **with their own identity**. It is not a kit for marketing pages, and it does not include a router or a data layer: it integrates with the ones you already use (for example, `RouterLink` or `NuxtLink` in links).

## Status: `0.1.0-beta`

This is a **beta**. What that means:

- **The API may change** between betas. Design decisions are recorded in [`DECISIONS.md`](DECISIONS.md) and contracts in [`docs/contract/`](docs/contract/) and [`design/contracts/`](design/contracts/), but none is frozen as a stable API.
- **`candidate`** is the status of 75 of the 80 components (the other five, `GStatus`, `GStatusIsland`, `GStatusMark`, `GPageIndex` and `GNavBar`, remain in `draft`: built, without a coco audit): they have a contract, CSS, tests, `meta.json`, README and an audit of the real component with a theme different from the default, with no blocking defects, in Chromium, Firefox and WebKit.
- **Real-environment verification is missing:** screen reader (VoiceOver, NVDA), real Safari, real touch and mobile devices, real `forced-colors` and real zoom at 200 and 400%. It is listed in [`PENDIENTES.md`](PENDIENTES.md), section 7. If you depend on any of those environments, test it before adopting a component.
- **It is not published on npm yet.** It will be published as `0.1.0-beta.0` (the version `@grana/vue`, `@grana/cli` and the root `package.json` already carry). Meanwhile it is used from this repository (see [Try it in this repository](#try-it-in-this-repository)). The installation instructions below are those of the release.

## Installation

```bash
npm i @grana/vue
```

Requirements: **Vue `^3.5.0`**. `lucide-static` (`^1.49.0`) is an **optional** peer dependency: you only need it if your application registers its own icons with `createIcons` (see [Icons](#icons)). To generate the theme, [`@grana/cli`](packages/cli/README.md) requires Node ≥ 22.

### Using `app.use` (everything registered)

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'     // componentes y tema por defecto (una sola hoja)
import '@grana/vue/fonts.css'     // fuente por defecto, Instrument Sans (opcional)

createApp(App).use(Grana).mount('#app')
```

```vue
<template>
  <g-btn variant="soft">Guardar</g-btn>
</template>
```

`app.use(Grana)` registers the components of the main package in PascalCase (`GBtn`) and in kebab-case (`<g-btn>`). In templates inside uncompiled HTML, write the tags with an explicit closing tag (`<g-btn></g-btn>`): Vue does not support self-closing component tags there.

### Using it per component

```vue
<script setup>
import { GBtn, GInput } from '@grana/vue'
</script>
```

```js
import '@grana/vue/style.css'
```

Components are exported by name. The JavaScript is a single ES module with named exports and `sideEffects` only for CSS, and each component is marked as pure (`packages/vue/scripts/pure-components.mjs`), so your bundler discards whatever you do not import. The **CSS sheet is a single one** and is not split per component.

#### Size and partial import

Importing a component does not drag in the rest. Figures measured by bruno in Phase B: this is what each import **adds to your application**, with the JavaScript minified by the bundler and compressed with gzip, and with Vue as an external dependency:

| What you import | JavaScript (gzip) |
| --- | --- |
| Only `GBtn` | ≈ 10.9 KB (Rollup), ≈ 11.1 KB (esbuild) |
| The whole library (import everything) | ≈ 155 KB |
| The CSS sheet (`style.css`, always whole) | ≈ 69 KB |

Before the components were marked as pure, importing only `GBtn` weighed 66.4 KB (Rollup) and 137.8 KB (esbuild). The result in your application depends on your bundler and on what else you import; the CSS is not split per component, so its cost is fixed.

### CSS and fonts

| File (`exports`) | In `dist/` | What it is |
| --- | --- | --- |
| `@grana/vue/style.css` | `grana.css` | CSS of all the components, the default theme and the utility classes, in layers (`grana.defaults`, `grana.components`, `grana.blocks`, `grana.utilities`). **Required.** |
| `@grana/vue/utilities.css` | `utilities.css` | Only the **utility classes** (`g-p-4`, `g-mt-2`, `g-gap-6`, `g-flex`, `g-items-center`, `g-text-muted`, `g-sr-only`…: 229 classes that read the theme scale, with logical axes and no breakpoints; [utilities guide](packages/vue/src/styles/README-utilities.md); `candidate`). **Optional**: they are already inside `style.css`; this sheet is for those who want only the utilities, and it declares the layer order itself. ≈ 1.9 kB gzip. |
| `@grana/vue/fonts.css` | `fonts.css` + `fonts/*.woff2` | Instrument Sans variable (SIL OFL license), in two subsets (`latin` and `latin-ext`). **Optional**: if your theme defines another font, leave it out. The font is **not** embedded in `grana.css`: the bundler copies it as a file. |

**Do you already have your own CSS (Bootstrap, global sheets), mount several Vue apps on the same page, or not use a bundler?** Read the [integration guide](docs/integracion.md): the layer recipe (`@layer legado, grana, app;`), the UMD globals, `app.config.idPrefix` and a shared manager.

#### ESM and UMD for CDN

The package is **ESM only** (`"type": "module"`; `exports` with `types`, `import` and `default` per entry). There is no CommonJS build. The UMD files exist only to use the library with `<script>` from a CDN (`unpkg` and `jsdelivr` point to `dist/grana.umd.js`): the global is `Grana` and it requires `vue.global.js` first. Each own entry has its UMD and its global (`dist/speech.umd.js` with `GranaSpeech`, `status.umd.js` with `GranaStatus`, `combobox.umd.js` with `GranaCombobox`, `file-field.umd.js` with `GranaFileField`, `time-field.umd.js` with `GranaTimeField`, `slider.umd.js` with `GranaSlider`, `tag.umd.js` with `GranaTag`, `load-region.umd.js` with `GranaLoadRegion`, `card-group.umd.js` with `GranaCardGroup`, `page-header.umd.js` with `GranaPageHeader`, `fab.umd.js` with `GranaFab`, `form-fold.umd.js` with `GranaFormFold` and `testing.umd.js` with `GranaTesting`).

### Own entries

Nineteen pieces **do not travel in the main package**: each has its own entry and only whoever imports it pays for it. They all depend on `@grana/vue` (which you already have installed) and share the common pieces with it without copying them; **their CSS is in the same `style.css`** and is inert without the markup.

| Entry | What it brings | When to use it | UMD global | Size (gzip) |
| --- | --- | --- | --- | --- |
| `@grana/vue/speech` | `createSpeech`, `useSpeech`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`, `GTranscript`, `createTranscript`, `useSpeechTarget` | Dictation and transcription: if your application captures voice | `GranaSpeech` | ≈ 56.0 kB |
| `@grana/vue/status` | `createStatus`, `useStatus`, `GStatusIsland`, `GStatusMark`, `GStatus` | A persistent application notice (the status island) | `GranaStatus` | ≈ 16.2 kB |
| `@grana/vue/combobox` | `GCombobox` | Choosing from a large catalog by typing (patients, diagnoses, medications) | `GranaCombobox` | ≈ 22.0 kB |
| `@grana/vue/file-field` | `GFileField`, `formatFileSize` | Attaching files to a form | `GranaFileField` | ≈ 12.6 kB |
| `@grana/vue/time-field` | `GTimeField` | Capturing a clock time | `GranaTimeField` | ≈ 10.6 kB |
| `@grana/vue/slider` | `GSlider` | Choosing a bounded value or a range by position (volume, intensity, price) | `GranaSlider` | ≈ 11.7 kB |
| `@grana/vue/tag` | `GTag`, `GTagGroup` | Tags of a set (allergies, applied filters, topics) with a footprint on removal and clusters by facet | `GranaTag` | ≈ 10.7 kB |
| `@grana/vue/load-region` | `GLoadRegion` | A list, a group of tiles or a record waiting for data: the template without ink while it arrives, the previous content in view when refreshing, announcements and focus (`GEmpty`, its empty state, does ship in the main package) | `GranaLoadRegion` | ≈ 4.4 kB |
| `@grana/vue/card-group` | `GCardGroup` | A row of metric cards that filter the region below (summary of a table or a panel) | `GranaCardGroup` | ≈ 5.2 kB |
| `@grana/vue/page-header` | `GPageHeader` | The header of a page with actions and, on scrolling, a plinth with tabs | `GranaPageHeader` | ≈ 5.9 kB |
| `@grana/vue/fab` | `GFab` | A floating button to create or capture from anywhere on the screen | `GranaFab` | ≈ 10.2 kB |
| `@grana/vue/form-fold` | `GFormFold` | Creating what is missing (a category, a product) in a fold under the field that asks for it, without leaving the form | `GranaFormFold` | ≈ 4.6 kB |
| `@grana/vue/app-shell` | `GAppShell` | The application chassis: header, navigation (`GSidebar`), page and footer with their landmarks, and the header height written once | `GranaAppShell` | ≈ 3.9 kB |
| `@grana/vue/hero` | `GHero` | The opening of a site page: title, promise, action and the photo that sells, with the text always outside the photo | `GranaHero` | ≈ 4.0 kB |
| `@grana/vue/gallery` | `GGallery`, `GGalleryViewer` | The photos of a place by spaces or in a strip, with an enlargeable viewer | `GranaGallery` | ≈ 9.3 kB |
| `@grana/vue/booking` | `GBookingBar`, `GPartyField` | A site's availability query (stay, table or tour) and the people by type | `GranaBooking` | ≈ 14.2 kB |
| `@grana/vue/price` | `GPrice`, `GPriceScope`, `formatPrice`, `currencyDigits` | Showing prices that state their currency: the region that declares it once, the named reference and the total of what was ordered | `GranaPrice` | ≈ 6.0 kB |
| `@grana/vue/page-index` | `GPageIndex` | The index of the sections of the page being read, with the current one following the reading (documentation, records and long forms) | `GranaPageIndex` | ≈ 2.9 kB |
| `@grana/vue/nav-bar` | `GNavBar` | A site's top bar: links to its sections, the current one by route and the global actions | `GranaNavBar` | ≈ 3.0 kB |
| `@grana/vue/sidebar-filter` | extension of `GSidebar` (connected with `app.use`) | The index filter of `GSidebar` (`filter`): without it, `GSidebar` renders without a filter and warns | `GranaSidebarFilter` | ≈ 2.7 kB |
| `@grana/vue/sidebar-index` | extension of `GSidebar` (connected with `app.use`) | The `index` appearance, the collapsible groups and the current mark (documentation indexes) | `GranaSidebarIndex` | ≈ 3.7 kB |
| `@grana/vue/page-index-list` | extension of `GPageIndex` (connected with `app.use`) | The `list` form of `GPageIndex`: the “On this page” column and its collapsed version | `GranaPageIndexList` | ≈ 2.2 kB |

**Why they are separate:** the first ones would add more than 8 kB gzip to the main package (criterion of [#328](DECISIONS.md)); since the margin of the main package ran out ([#550](DECISIONS.md)), every new component with its own weight goes in its own entry by default. Not every application needs them. The sizes in this table are those of each entry's `dist/` file, **unminified and compressed with `gzip`** (measured on 2026-10-18; kB = 1000 bytes): they are for comparing entries with each other, not for predicting what will add to your application. For the same reason, the whole `dist/grana.js` weighs ≈ 179 kB gzip, while importing the whole library in an application with minified JavaScript adds ≈ 155 KB (table in [Size and partial import](#size-and-partial-import)); neither figure includes the CSS sheet (≈ 69 kB gzip). To know how much what you use adds, go by the partial import table. The services (`createSpeech`, `createStatus`) are also Vue plugins: `app.use(speech)` registers their components.

```js
import Grana from '@grana/vue'
import Combobox from '@grana/vue/combobox'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(Combobox).mount('#app')   // registra <g-combobox>
```

**`@grana/vue/testing`** gathers helpers **for testing your application**, it is not for production: `createSimulatedSpeechAdapter` (a network-free voice adapter, with scripted speakers) and `createSimulatedUploader` (a network-free upload adapter for `GFileField`). It does not import Vue and is not included in the main package (UMD global `GranaTesting`).

### TypeScript

The types **come included** in the package: there is no `@types/...` to install. Each entry has its own `.d.ts` (`dist/grana.d.ts`, `speech.d.ts`, `status.d.ts`, `combobox.d.ts`, `file-field.d.ts`, `time-field.d.ts`, `slider.d.ts`, `tag.d.ts`, `load-region.d.ts`, `card-group.d.ts`, `page-header.d.ts`, `fab.d.ts`, `form-fold.d.ts` and `testing.d.ts`), generated from the components' `*.meta.json` (props with values, default and whether required; events with their payload; slots with scope; what is exposed by `ref`). What a `meta.json` cannot express (the shape of options, items and managers such as `createToaster`) is written by hand in `packages/vue/types/`.

After `app.use(...)`, the component tags are typed in templates without importing anything, thanks to Vue's `GlobalComponents` (one declaration per entry, in PascalCase and in kebab-case):

```vue
<script setup lang="ts">
import { ref } from 'vue'
import type { ComboboxOption } from '@grana/vue/combobox'

const value = ref<string | number | null>(null)
const options: ComboboxOption[] = [{ value: 'p1', label: 'María' }]
</script>

<template>
  <g-btn variant="soft" size="lg">Guardar</g-btn>
  <g-combobox v-model="value" :options="options" label="Paciente" />
</template>
```

Data types are imported from the entry they belong to. The correct usage and 15 wrong usages are checked with `vue-tsc` in `packages/vue/src/types.test.js`; the package declares `types` in `exports` and also `typesVersions`, for `moduleResolution: "node"`.

**Limits:**

- Without `strictTemplates` (a `vueCompilerOptions` option of `vue-tsc`) template checking is lax: a missing required prop is not reported. Enable it in your project if you want that warning.
- The option and item types (`ComboboxOption`, groups, entries…) accept **your application's own fields** (they carry an index signature) so you keep them and receive them in slots; for that reason a misspelled field name is not flagged as an error.

### Icons

Grana uses **only [Lucide](https://lucide.dev)** (ISC license) and the list the library ships is public API. `GIcon` draws that list; if your application needs other Lucide icons, it registers them **per application** with `createIcons` and `lucide-static` strings (validated by shape, without `DOMParser`). What is not Lucide (logos, illustrations) goes through a slot. Contract: [`docs/contract/icons.md`](docs/contract/icons.md).

## Theming

Your project's theme is written in a short file. All keys are optional; without a theme, Grana uses its default style (neutral: `brand` `#1F1F1F`, `accent` `#0B63CE`, Instrument Sans).

```json
{
  "brand": "#F5B940",
  "accent": "#5B3FE0",
  "radius": 20,
  "shape": "pill",
  "space": 4,
  "font": "Instrument Sans",
  "fontDisplay": "Instrument Serif",
  "fontSize": 16,
  "typeScale": 1.4,
  "dark": true
}
```

| Key | Controls |
| --- | --- |
| `brand`, `accent` | Primary action; focus, links, selection and active states |
| `primary` | Color of the primary action when it differs from `brand` |
| `radius`, `shape` (`rounded` \| `pill`) | Radius scale and the shape of buttons, chips and badges |
| `space` | Spacing unit (px) |
| `font`, `fontDisplay`, `fontSize`, `typeScale` | Typography |
| `neutrals` (`tinted` \| `pure`), `neutralsHue` | Neutrals tinted with the hue of the brand (or of the accent) |
| `semanticCollision` (`warn` \| `adjust`) | What to do if success, warning, danger or info look like your brand |
| `categories` (0 to 12) | Series of category colors `--g-color-cat-1` to `cat-N` |
| `dark` (`true` \| `false` \| object) | Dark theme (below) |
| `name` | Name of the system in `tokens.json` |
| `overrides` | Any token (`{ "--g-token": "value" }`), including the semantic colors |

From `brand`, `accent` and `primary` the generator derives by rules in OKLCH `strong`, `soft`, `text` and `on` with guaranteed contrast. Full contract: [`docs/contract/tokens.md`](docs/contract/tokens.md).

### `@grana/cli`

[`@grana/cli`](packages/cli/README.md) generates the `tokens.css` and **rejects themes that break the accessibility minimums**, explaining which one and why. No dependencies; Node ≥ 22.

```bash
npx @grana/cli theme grana.config.json    # escribe tokens.css
npx @grana/cli check grana.config.json    # solo valida (--json para CI)
```

There is also a Vite plugin that generates the theme at build time and fails the build if the theme breaks a minimum:

```js
// vite.config.js
import grana from '@grana/cli/vite'
export default { plugins: [grana({ config: 'grana.config.json' })] }

// main.js
import 'virtual:grana/tokens.css'
```

The generated `tokens.css` **has no layer and always wins**, regardless of load order. If you write it by hand, do not do it with light colors only: it would override the dark theme (see below).

### Dark theme

Grana ships a default dark theme (near-black gray; what is elevated is lighter). It **follows the system preference** and can be forced with `data-theme` on any element:

```html
<html>                                  <!-- automático: sigue al sistema -->
<html data-theme="dark">                <!-- oscuro siempre -->
<html data-theme="light">               <!-- claro siempre, aunque el sistema sea oscuro -->
<section data-theme="dark">…</section>  <!-- una sección oscura dentro de una página clara (o al revés) -->
```

- **Your components do not change:** the dark theme redeclares the same color tokens.
- **Your theme has a dark mode too:** with `dark: true` (the default) the CLI derives the dark variant of your `brand` and `accent` with the same guaranteed contrast (4.5:1 for text, 3:1 for controls) and **validates both schemes**. You can set your own colors with `"dark": { "brand": "#8FACE5", "accent": "#5CC1B6" }`.
- **No dark mode:** `"dark": false` (a dark system does not activate it) or `data-theme="light"` on `<html>`.
- **Saving the preference** (a theme switch) is up to your application: toggle the attribute and store it wherever you prefer. Your application's images and icons do not adapt on their own.

Rules and limits: [`docs/contract/tokens.md` §15](docs/contract/tokens.md). Verification: [`design/lab/tema-oscuro/auditoria.md`](design/lab/tema-oscuro/auditoria.md). An option for color presence in dark mode (Dark Color Presence) has been investigated but is **not adopted**.

## Components

Except five in **`draft`** (`GStatus`, `GStatusIsland`, `GStatusMark`, `GPageIndex` and `GNavBar`), all are in **`candidate`**: see [Status](#status-010-beta). “Own” indicates that it is imported from its own entry ([Own entries](#own-entries)). The link goes to the component's README, with its full API, keyboard, measured accessibility and limits.

### Page structure

| Component | What it is | Entry |
| --- | --- | --- |
| [`GAppShell`](packages/vue/src/components/GAppShell/README.md) | Application chassis: splits the viewport between header, navigation, page and footer with their landmarks and skip link; reserves the navigation's room by reading its shape from CSS and writes the header height once; with `header="relay"`, the header yields the edge to the page plinth | **own** (`app-shell`) |
| [`GContainer`](packages/vue/src/components/GContainer/README.md) | Page column: maximum width, centered, with a fluid margin based on its box rather than the viewport; `g-bleed` takes a band to the edge with the text aligned | main |
| [`GStack`](packages/vue/src/components/GStack/README.md) | One-axis stack with spacing as a relation (`sm`, `md`, `lg`): a single source of air, inline it always wraps | main |
| [`GSection`](packages/vue/src/components/GSection/README.md) | Page region with heading, description and actions: the level (`h2` to `h4`) comes from nesting | main |
| [`GText`](packages/vue/src/components/GText/README.md) | Loose text with the theme's typography (`body`, `body-sm`, `caption`; `default` or `muted`) and a pause by size between its blocks, with no outward air: the quote and its footer, the guarantee under an action, the legal text of a newsletter; empty renders nothing | main |
| [`GSplit`](packages/vue/src/components/GSplit/README.md) | Two regions side by side with a proportion when they fit and one below the other when they do not: the threshold is set by the minimum width of the narrow side, which follows the text, based on its box rather than the viewport; CSS only, in DOM order | main |
| [`GPageHeader`](packages/vue/src/components/GPageHeader/README.md) | Sticky page header with plinth: on scrolling, the header sinks until the plinth with tabs and actions peeks out; when narrow and stuck, the actions drop to the dock with `--g-ease-spring` | **own** (`page-header`) |
| [`GHero`](packages/vue/src/components/GHero/README.md) | Opening of a site page: title, promise, action and photo with the text always outside it (window, threshold with query or views to choose from) | **own** (`hero`) |

### Actions and navigation

| Component | What it is | Entry |
| --- | --- | --- |
| [`GBtn`](packages/vue/src/components/GBtn/README.md) | Action button; renders as a link with `href` | main |
| [`GMenu`](packages/vue/src/components/GMenu/README.md) | Action menu anchored to a button (actions, groups, checkboxes, options, submenus) | main |
| [`GTabs`](packages/vue/src/components/GTabs/README.md) | Tabs between views of the same level, with `GTabPanel` | main |
| [`GSidebar`](packages/vue/src/components/GSidebar/README.md) | Side navigation: expanded, rail, bottom navbar and drawer | main |
| [`GBreadcrumbs`](packages/vue/src/components/GBreadcrumbs/README.md) | Breadcrumbs: the whole path tightens by priority without hiding levels; at the end, “Up · page”; with `children`, doors to the siblings | main |
| [`GPagination`](packages/vue/src/components/GPagination/README.md) | Pagination of a collection | main |
| [`GStepper`](packages/vue/src/components/GStepper/README.md) | Progress by discrete steps | main |
| [`GFab`](packages/vue/src/components/GFab/README.md) | Floating button to create or capture from anywhere: the stack that grows (those that fit, the most used one next to the button) or, with `main`, the main action one tap away with a tail that filters as you type; confirmation in the same row and acknowledgment on the button itself | **own** (`fab`) |
| [`GTooltip`](packages/vue/src/components/GTooltip/README.md) | Visible name, description and shortcut of a focusable control | main |
| [`GHelper`](packages/vue/src/components/GHelper/README.md), [`GHelperScope`](packages/vue/src/components/GHelperScope/README.md) | Contextual help anchored to a region | main |
| [`GPageIndex`](packages/vue/src/components/GPageIndex/README.md) | Index of the sections of the page being read: a menu button that says where you are and follows the reading, or the “On this page” column with the `list` extension | **own** |
| [`GNavBar`](packages/vue/src/components/GNavBar/README.md) | A site's top bar: links to its sections with the current one by route and room for search, language and theme | **own** |

### Input fields

| Component | What it is | Entry |
| --- | --- | --- |
| [`GInput`](packages/vue/src/components/GInput/README.md) | Single-line text field | main |
| [`GTextarea`](packages/vue/src/components/GTextarea/README.md) | Multi-line text, fixed rows or autosize | main |
| [`GNumberField`](packages/vue/src/components/GNumberField/README.md) | A number you type, in the language's format | main |
| [`GSelect`](packages/vue/src/components/GSelect/README.md) | Single-option selector with its own list | main |
| [`GCombobox`](packages/vue/src/components/GCombobox/README.md) | Choosing from a large catalog by typing; with `multiple` | **own** |
| [`GTimeField`](packages/vue/src/components/GTimeField/README.md) | Clock time you type the way you say it | **own** |
| [`GSlider`](packages/vue/src/components/GSlider/README.md) | Bounded value or two-ended range where the handle is the value | **own** |
| [`GDatePicker`](packages/vue/src/components/GDatePicker/README.md) | Date or range, with a popover or a bottom sheet on mobile | main |
| [`GBookingBar`](packages/vue/src/components/GBookingBar/README.md), `GPartyField` | A site's availability query (stay, table or tour) that delivers an intent without booking, and the people-by-type piece it uses, which also works on its own | **own** (`booking`) |
| [`GFileField`](packages/vue/src/components/GFileField/README.md) | Attaching files, with upload through your application's adapter | **own** |
| [`GCheckbox`](packages/vue/src/components/GCheckbox/README.md), [`GCheckboxGroup`](packages/vue/src/components/GCheckboxGroup/README.md) | Checkbox and checkbox group with a master checkbox | main |
| [`GRadioGroup`](packages/vue/src/components/GRadioGroup/README.md) | One answer among several, in five appearances | main |
| [`GSwitch`](packages/vue/src/components/GSwitch/README.md) | Switch with immediate effect | main |

### Form structure

| Component | What it is | Entry |
| --- | --- | --- |
| [`GForm`](packages/vue/src/components/GForm/README.md) | Form with context: when errors show, submission, summary and dirty state. It does not validate: your application does | main |
| [`GFormSection`](packages/vue/src/components/GFormSection/README.md) | Fixed, collapsible or addable section | main |
| [`GFormLayout`](packages/vue/src/components/GFormLayout/README.md), [`GFormRow`](packages/vue/src/components/GFormRow/README.md) | Stack of rows and rows of fields that share the width | main |
| [`GFormReveal`](packages/vue/src/components/GFormReveal/README.md) | Conditional fields with `when` | main |
| [`GFormFold`](packages/vue/src/components/GFormFold/README.md) | Fold to create what is missing in place: it opens below the field that asks for it, with its own confirm; while open, it blocks the outer form's submission | **own** (`form-fold`) |
| [`GInputGroup`](packages/vue/src/components/GInputGroup/README.md) | Merged field: one piece of data in several parts | main |
| [`GFieldGroup`](packages/vue/src/components/GFieldGroup/README.md) | A compound question with labeled parts | main |
| [`GFormActions`](packages/vue/src/components/GFormActions/README.md) | Action footer with hierarchy | main |
| [`GErrorSummary`](packages/vue/src/components/GErrorSummary/README.md) | Error summary with one link per question | main |

### Data

| Component | What it is | Entry |
| --- | --- | --- |
| [`GTable`](packages/vue/src/components/GTable/README.md) | Table with compound columns, slot cells and filters | main |
| [`GFilterBar`](packages/vue/src/components/GFilterBar/README.md) | Non-fixed filters in the Stripe style | main |
| [`GCardGroup`](packages/vue/src/components/GCardGroup/README.md) | Row of metric cards that filter the region below: pressing a card filters, pressing it again removes the filter; the pressed card and the bar's chip are the same truth | **own** (`card-group`) |
| [`GDataList`](packages/vue/src/components/GDataList/README.md) | Compact list of label-value pairs | main |
| [`GCalendar`](packages/vue/src/components/GCalendar/README.md) | Calendar and resource planner: Day, Week, Month and Timeline | main |
| [`GMetric`](packages/vue/src/components/GMetric/README.md), [`GProgress`](packages/vue/src/components/GProgress/README.md) | Value with trend and progress bar | main |
| [`GBadge`](packages/vue/src/components/GBadge/README.md) | Non-interactive badge, anchorable | main |
| [`GPrice`](packages/vue/src/components/GPrice/README.md), `GPriceScope` | Price that states its currency (the name in the reading, the code only if the symbol is ambiguous), with currency region, named reference and total of what was ordered; `formatPrice` for plain text | **own** (`price`) |
| [`GSummary`](packages/vue/src/components/GSummary/README.md) | Adaptable summary card of an entity | main |
| [`GAvatar`](packages/vue/src/components/GAvatar/README.md), [`GAvatarMotion`](packages/vue/src/components/GAvatarMotion/README.md) | Face of a person or entity; illustrated avatar that responds to states | main |
| [`GTag`](packages/vue/src/components/GTag/README.md), `GTagGroup` | Tags of a set: static, link, toggle or removable; on removal a footprint with “Undo” stays in place; clusters by facet | **own** (`tag`) |

### Surfaces and composition

| Component | What it is | Entry |
| --- | --- | --- |
| [`GSurface`](packages/vue/src/components/GSurface/README.md) | Generic visual surface in five levels | main |
| [`GCard`](packages/vue/src/components/GCard/README.md) | Card with optional regions (composes `GSurface`) | main |
| [`GGallery`](packages/vue/src/components/GGallery/README.md), `GGalleryViewer` | Photos of a place by spaces (index that jumps) or in a strip, with an enlargeable viewer, keyboard and gestures | **own** (`gallery`) |
| [`GAccordion`](packages/vue/src/components/GAccordion/README.md), `GAccordionItem` | Collapsible sections with a preview of the first line; the heading you touch does not move; what is collapsed can be searched, linked and printed; optional `sticky` | main |
| [`GDialog`](packages/vue/src/components/GDialog/README.md) | Modal dialog: simple, with footer, form, full screen | main |
| [`GDivider`](packages/vue/src/components/GDivider/README.md) | Separator line, horizontal or vertical | main |
| [`GAdaptiveLayout`](packages/vue/src/components/GAdaptiveLayout/README.md) | Lays out its children according to what they need, without rows or columns | main |
| [`GIcon`](packages/vue/src/components/GIcon/README.md) | Lucide icon: `1em`, `currentColor`, decorative or named | main |

### Panels

| Component | What it is | Entry |
| --- | --- | --- |
| [`GWidget`](packages/vue/src/components/GWidget/README.md) | Shell of a panel widget with states | main |
| [`GWidgetGrid`](packages/vue/src/components/GWidgetGrid/README.md) | Widget grid, reorderable with pointer and keyboard | main |
| [`GWidgetGallery`](packages/vue/src/components/GWidgetGallery/README.md) | Gallery for adding widgets | main |
| [`GWidgetConfig`](packages/vue/src/components/GWidgetConfig/README.md) | Configuration panel of a widget with live preview | main |

### Notices and status

| Component | What it is | Entry |
| --- | --- | --- |
| [`GToast`](packages/vue/src/components/GToast/README.md) (`createToaster`, `useToast`, `GToaster`) | Brief, non-modal notices, as a service | main |
| [`GStatusIsland`](packages/vue/src/components/GStatusIsland/README.md), [`GStatusMark`](packages/vue/src/components/GStatusMark/README.md), [`GStatus`](packages/vue/src/components/GStatus/README.md) | Status island: persistent application notice | **own** (`status`) |
| [`GEmpty`](packages/vue/src/components/GEmpty/README.md) | The empty state with a cause (`none`, `filtered`, `error`, `forbidden`): the size of an element, it says why and how to get out; by filter, how many there were and how many return when each is removed | main |
| [`GLoadRegion`](packages/vue/src/components/GLoadRegion/README.md) | The region whose content arrives late: your template without ink as a mold that receives the ink in place, the last known content when refreshing, nothing before 200 ms, announcements and focus that is not lost | **own** (`load-region`) |

### Voice capture

| Component | What it is | Entry |
| --- | --- | --- |
| [`GSpeechHost`](packages/vue/src/components/GSpeechHost/README.md) (`createSpeech`, `useSpeech`) | Capture and transcription as a service; the engine is an adapter of your application, with no network in Grana | **own** (`speech`) |
| [`GSpeechPill`](packages/vue/src/components/GSpeechPill/README.md), [`GSpeechTrigger`](packages/vue/src/components/GSpeechTrigger/README.md) | Placeable pill and dictation trigger | **own** (`speech`) |
| [`GTranscript`](packages/vue/src/components/GTranscript/README.md) | Transcript review view: editable grid with speakers | **own** (`speech`) |

## Accessibility

The minimums are **not theme**: no theme can lower them, and [`@grana/cli`](packages/cli/README.md) rejects the one that tries (in light and in dark).

| Rule | Value |
| --- | --- |
| Touch target | ≥ 24 px; ≥ 44 px with `pointer: coarse`, regardless of density |
| Text | ≥ 12 px |
| Text contrast | ≥ 4.5:1 |
| Control contrast | ≥ 3:1 |
| Focus | Always visible (≥ 2 px) |
| Controls marked with a family fill | `{family}-text` outline to reach 3:1 against the surface (WCAG 1.4.11; measured minimum 4.07:1) |

Also: development warnings when an accessible name is missing, motion with a single `prefers-reduced-motion` pattern, texts without a default value (Grana is international: you provide the language) and native semantics where they exist (`<dialog>`, native radios and checkboxes, `<hr>`). Details and figures per component in each README; rules in [`docs/contract/tokens.md` §7](docs/contract/tokens.md).

**What is not verified in a real environment:** screen readers (VoiceOver, NVDA and others), real Safari (WebKit is tested with Playwright's engine, which is not Safari with its system), real touch and mobile devices, real `forced-colors` on Windows, real zoom at 200 and 400%, IME and virtual keyboard. Some components have **documented limits** (for example, the completed stretch of `GStepper` against the pending one does not reach 3:1, and `GTimeField` cannot get the day-period wording to the screen reader in Chromium): they are in their README and in [`PENDIENTES.md`](PENDIENTES.md).

## Browsers and SSR

**Tested:** Chromium, Firefox and WebKit, with Playwright, in the component audits. Last full run: **1380 browser tests pass, 57 are skipped by design and none fail** (three engines), plus **2792 unit tests** of `@grana/vue` and **141** of `@grana/cli`. Some long WebKit and Firefox tests are intermittent when the machine is loaded and pass on their own (list in [`PENDIENTES.md`](PENDIENTES.md)).

**No minimum-version matrix yet.** The components use recent APIs (`popover`, `inert`, CSS `@layer`, `:has()`, `ResizeObserver`); a minimum version of each browser has not been set or measured.

**SSR:** the package does not touch `document` or `window` when imported or when creating the services (`createToaster`, `createSpeech`, `createStatus`, `createIcons`), and registrations are per application, with no module globals. About twenty test files check the HTML with `renderToString` (for example `inert` and `disabled` according to props, and the layout painted before measuring: components that measure their width render in their base variant and correct themselves on mount). **It has not been tested with Nuxt or with a real hydration**; if it matters to you, test it in your application.

## Personality

Grana does not want to be “just another generic framework”. Each component must bring **its own behavior, motion or form**, not copy the common pattern, and that idea is decided with the user before it is built. Some examples already done:

- `GTooltip`: the label hangs from the control by a tab of its width and, in a group, travels from one control to the next.
- `GTimeField`: you type the time the way you say it (“930”, “9 noche”) and it comes back written in words.
- `GCombobox` with `multiple`: what is chosen reads as a sentence on the field's line, without the field growing.
- `GDialog`: it is born from the button that opened it. `GBtn`: a subtle bounce on release. `GTabs`: the mark stretches, with the advancing edge arriving first.
- The status island: a persistent notice that changes shape instead of being a box.

All with tokens, `prefers-reduced-motion` and contrast intact: **innovation never sacrifices accessibility, performance or the token contract.** The decisions behind each one are in [`DECISIONS.md`](DECISIONS.md) and in the “Personalidad” section of the READMEs.

## Try it in this repository

```bash
npm install
npm run build          # vite build de cada entrada + fuentes
npm test               # vitest en @grana/vue y @grana/cli
python3 -m http.server 4173 -d packages/vue   # playground: http://localhost:4173/playground/
```

Requires Node ≥ 22 (`.nvmrc`). For the browser tests and the rest of the workflow, see [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Structure

| Path | Contents |
| --- | --- |
| `packages/vue/` | `@grana/vue`: components, CSS layers and Vue plugin |
| `packages/cli/` | `@grana/cli`: generates `tokens.css` from the theme (light and dark), validates the accessibility minimums and ships the Vite plugin |
| `docs/contract/` | Token contract, shared props API and icons |
| `design/` | Deliverables per component: prototypes (`design/lab/`) and contracts (`design/contracts/`) |
| `plans/` | Executed motion plans |
| `AGENTS.md`, `CLAUDE.md` | Division of responsibilities and project context |
| `DECISIONS.md` | Record of decisions and their reasoning |
| `PENDIENTES.md` | What was deferred, with its origin and its owner |

## Contributing

Contributions are welcome: bugs, component proposals, documentation. Start with [`CONTRIBUTING.md`](CONTRIBUTING.md). To report a vulnerability, see [`SECURITY.md`](SECURITY.md). Taking part means respecting the [Code of Conduct](CODE_OF_CONDUCT.md). Changes between versions are recorded in [`CHANGELOG.md`](CHANGELOG.md).

## License

[MIT](LICENSE). The icons are from Lucide (ISC license; notice in [`packages/vue/THIRD-PARTY-NOTICES.md`](packages/vue/THIRD-PARTY-NOTICES.md)). The default font, Instrument Sans, is under the SIL OFL license.
