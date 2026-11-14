# @grana/vue

**Vue 3** components themed through tokens. The components bring the **structure**; your theme gives them the **color**.

> *The only bug you'll want in your UI.*

**Status: `1.0.0`.** 83 of the 86 pieces are `stable` and covered by semver; `GStatus`, `GStatusIsland` and `GStatusMark` are still `draft`, with no promise (see “Status” in the repository README). Every piece has a contract, CSS, tests and an audit in Chromium, Firefox and WebKit; verification in a real environment (screen readers, real Safari, real mobile) is still missing. Full documentation, component catalog, theming and contributing: [repository README](https://github.com/kevinedgm/grana/blob/main/README.en.md) and the site https://kevinedgm.github.io/grana/en/.

*Español: [README.md](https://github.com/kevinedgm/grana/blob/main/packages/vue/README.md).*

## Installation

```bash
npm i @grana/vue
```

Requires **Vue `^3.5.0`**. `lucide-static` (`^1.49.0`) is an optional peer dependency: you only need it if you register your own icons with `createIcons`.

## Usage

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'     // components and default theme (required)
import '@grana/vue/fonts.css'     // Instrument Sans (optional)

createApp(App).use(Grana).mount('#app')
```

```vue
<template>
  <g-btn variant="soft">Save</g-btn>
</template>
```

Also per component: `import { GBtn } from '@grana/vue'`. In templates inside uncompiled HTML, write the tags with an explicit closing tag (`<g-btn></g-btn>`).

## Size and partial import

Importing one component does not pull in the rest: components are marked as pure and the package only declares `sideEffects` for CSS. Measured on 2026-11-14 with esbuild, gzip and Vue external: `GBtn` alone ≈ 12.6 kB and the whole main entry ≈ 175 kB. There is a single CSS sheet (`@grana/vue/style.css`, ≈ 111 kB gzip) and it is not split per component. The result in your application depends on your bundler.

## ESM and CDN

The package is **ESM only** (no CommonJS). To use it with `<script>` from a CDN, `unpkg` and `jsdelivr` serve `dist/grana.umd.js` (global `Grana`, with `vue.global.js` loaded first). Each own entry has its UMD and its global (`GranaSpeech`, `GranaCombobox`, `GranaSlider`…); the full list is in “Own entries” of the [repository README](https://github.com/kevinedgm/grana/blob/main/README.en.md#own-entries).

## TypeScript

Types are included: there is no `@types` package to install. Each entry has its `.d.ts`, generated from the components' `meta.json` files. After `app.use(Grana)` (and for each own entry you register), `<g-btn>` and the other tags are typed in templates through `GlobalComponents`. Data types are imported from their entry:

```ts
import type { ComboboxOption } from '@grana/vue/combobox'

const options: ComboboxOption[] = [{ value: 'p1', label: 'María' }]
```

Limits: without `strictTemplates` (from `vue-tsc`) a missing required prop is not reported, and option types accept fields of your own application (a misspelled field name is not flagged). Details in the [repository README](https://github.com/kevinedgm/grana/blob/main/README.en.md#typescript).

## Package entries

| Entry | Content |
| --- | --- |
| `@grana/vue` | The main components, `createToaster`, `useToast`, `createIcons`, `useFormField` |
| `@grana/vue/style.css` | The single CSS sheet (all components, the own entries, the default theme and the utility classes). **Required** |
| `@grana/vue/fonts.css` | Default font (optional) |
| `@grana/vue/utilities.css` | Only the utility classes (optional: they are already in `style.css`) |
| `@grana/vue/testing` | Simulated adapters to test your application (voice and file upload); not for production |
| 22 own entries | Components only paid for by whoever imports them: `speech`, `status`, `combobox`, `file-field`, `time-field`, `slider`, `tag`, `load-region`, `form-fold`, `card-group`, `page-header`, `fab`, `app-shell`, `hero`, `gallery`, `booking`, `price`, `page-index`, `nav-bar` and the extensions `sidebar-filter`, `sidebar-index` and `page-index-list`. What each one brings and its size: [Own entries](https://github.com/kevinedgm/grana/blob/main/README.en.md#own-entries) |

Own entries do not travel in the main package. They are registered with `app.use`:

```js
import Combobox from '@grana/vue/combobox'
createApp(App).use(Grana).use(Combobox)
```

To generate your theme (and reject the ones that break the accessibility minimums) use [`@grana/cli`](https://github.com/kevinedgm/grana/blob/main/packages/cli/README.en.md).

## License

MIT. Lucide icons (ISC), see `THIRD-PARTY-NOTICES.md`. Default font: Instrument Sans (SIL OFL).
