# @grana/vue

Componentes **Vue 3** con tema por tokens. Los componentes traen la **estructura**; tu tema les da el **color**.

> *The only bug you'll want in your UI.*

**Estado: `1.0.0`.** 83 de las 86 piezas están en `stable` y las cubre semver; `GStatus`, `GStatusIsland` y `GStatusMark` siguen en `draft`, sin promesa (ver «Estado» en el README del repositorio). Cada pieza tiene contrato, CSS, pruebas y auditoría en Chromium, Firefox y WebKit; falta la verificación en entorno real (lectores de pantalla, Safari real, móvil real). Documentación completa, catálogo de componentes, tematización y contribución: [README del repositorio](https://github.com/kevinedgm/grana#readme) y el sitio https://kevinedgm.github.io/grana/.

*English: [README.en.md](https://github.com/kevinedgm/grana/blob/main/packages/vue/README.en.md).*

## Instalación

```bash
npm i @grana/vue
```

Requiere **Vue `^3.5.0`**. `lucide-static` (`^1.49.0`) es dependencia par opcional: solo hace falta si registras iconos propios con `createIcons`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'     // componentes y tema por defecto (obligatorio)
import '@grana/vue/fonts.css'     // Instrument Sans (opcional)

createApp(App).use(Grana).mount('#app')
```

```vue
<template>
  <g-btn variant="soft">Guardar</g-btn>
</template>
```

También por componente: `import { GBtn } from '@grana/vue'`. En plantillas dentro del HTML sin compilar, escribe las etiquetas con cierre explícito (`<g-btn></g-btn>`).

## Tamaño e importación parcial

Importar un componente no arrastra el resto: los componentes están marcados como puros y el paquete solo declara `sideEffects` para CSS. Medido el 2026-11-14 con esbuild, gzip y Vue externo: `GBtn` solo ≈ 12,6 kB y toda la entrada principal ≈ 175 kB. La hoja de CSS es una sola (`@grana/vue/style.css`, ≈ 111 kB gzip) y no se parte por componente. El resultado en tu aplicación depende de tu empaquetador.

## ESM y CDN

El paquete es **solo ESM** (sin CommonJS). Para usarlo con `<script>` desde una CDN, `unpkg` y `jsdelivr` sirven `dist/grana.umd.js` (global `Grana`, con `vue.global.js` antes). Cada entrada propia tiene su UMD y su global (`GranaSpeech`, `GranaCombobox`, `GranaSlider`…); la lista completa está en «Entradas propias» del [README del repositorio](https://github.com/kevinedgm/grana#entradas-propias).

## TypeScript

Los tipos vienen incluidos: no hay `@types` que instalar. Cada entrada tiene su `.d.ts`, generado desde los `meta.json` de los componentes. Tras `app.use(Grana)` (y de cada entrada propia que registres), `<g-btn>` y el resto de etiquetas quedan tipadas en las plantillas por `GlobalComponents`. Los tipos de datos se importan de su entrada:

```ts
import type { ComboboxOption } from '@grana/vue/combobox'

const options: ComboboxOption[] = [{ value: 'p1', label: 'María' }]
```

Límites: sin `strictTemplates` (de `vue-tsc`) no se avisa de una prop obligatoria ausente, y los tipos de opciones aceptan campos propios de tu aplicación (no se marca un nombre de campo mal escrito). Detalle en el [README del repositorio](https://github.com/kevinedgm/grana#typescript).

## Entradas del paquete

| Entrada | Contenido |
| --- | --- |
| `@grana/vue` | Los componentes principales, `createToaster`, `useToast`, `createIcons`, `useFormField` |
| `@grana/vue/style.css` | La hoja de CSS única (todos los componentes, las entradas propias, el tema por defecto y las clases utilitarias). **Obligatoria** |
| `@grana/vue/fonts.css` | Fuente por defecto (opcional) |
| `@grana/vue/utilities.css` | Solo las clases utilitarias (opcional: ya van en `style.css`) |
| `@grana/vue/testing` | Adaptadores simulados para probar tu aplicación (voz y subida de archivos); no para producción |
| 22 entradas propias | Componentes que solo paga quien los importa: `speech`, `status`, `combobox`, `file-field`, `time-field`, `slider`, `tag`, `load-region`, `form-fold`, `card-group`, `page-header`, `fab`, `app-shell`, `hero`, `gallery`, `booking`, `price`, `page-index`, `nav-bar` y las extensiones `sidebar-filter`, `sidebar-index` y `page-index-list`. Qué trae cada una y su tamaño: [Entradas propias](https://github.com/kevinedgm/grana#entradas-propias) |

Las entradas propias no viajan en el paquete principal. Se registran con `app.use`:

```js
import Combobox from '@grana/vue/combobox'
createApp(App).use(Grana).use(Combobox)
```

Para generar tu tema (y rechazar los que rompan los mínimos de accesibilidad) usa [`@grana/cli`](https://github.com/kevinedgm/grana/blob/main/packages/cli/README.md).

## Licencia

MIT. Iconos de Lucide (ISC), ver `THIRD-PARTY-NOTICES.md`. Fuente por defecto: Instrument Sans (SIL OFL).
