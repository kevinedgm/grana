# @grana/vue

Componentes **Vue 3** con tema por tokens. Los componentes traen la **estructura**; tu tema les da el **color**.

> *The only bug you'll want in your UI.*

**Estado: `0.1.0-beta`** (se publicará como `0.1.0-beta.0`). La API puede cambiar entre betas y falta la verificación en entorno real (lectores de pantalla, Safari real, móvil real). Todos los componentes están en `candidate`: con contrato, CSS, pruebas y auditoría en Chromium, Firefox y WebKit. Documentación completa, catálogo de componentes, tematización y contribución: [README del repositorio](https://github.com/kevinedgm/grana#readme).

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

Importar un componente no arrastra el resto (los componentes están marcados como puros y el paquete solo declara `sideEffects` para CSS). Cifras medidas por bruno en la Fase B, gzip y con Vue externo: `GBtn` solo ≈ 10,9 KB (Rollup) o ≈ 11,1 KB (esbuild); toda la librería ≈ 155 KB. La hoja de CSS es una sola (`@grana/vue/style.css`, ≈ 69 KB gzip) y no se parte por componente. El resultado en tu aplicación depende de tu empaquetador.

## ESM y CDN

El paquete es **solo ESM** (sin CommonJS). Para usarlo con `<script>` desde una CDN, `unpkg` y `jsdelivr` sirven `dist/grana.umd.js` (global `Grana`, con `vue.global.js` antes); cada entrada propia tiene su UMD y su global: `GranaSpeech`, `GranaStatus`, `GranaCombobox`, `GranaFileField`, `GranaTimeField` y `GranaTesting`.

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
| `@grana/vue/style.css` | La hoja de CSS única (todos los componentes, las entradas propias y el tema por defecto) |
| `@grana/vue/fonts.css` | Fuente por defecto (opcional) |
| `@grana/vue/speech` | Captura de voz: `createSpeech`, `GSpeechHost`, `GTranscript`… |
| `@grana/vue/status` | Isla de estado: `createStatus`, `GStatusIsland`… |
| `@grana/vue/combobox` | `GCombobox` |
| `@grana/vue/file-field` | `GFileField` |
| `@grana/vue/time-field` | `GTimeField` |
| `@grana/vue/testing` | Adaptadores simulados para probar tu aplicación (voz y subida de archivos); no para producción |

Las cinco entradas propias no viajan en el paquete principal: solo las paga quien las importa. Se registran con `app.use`:

```js
import Combobox from '@grana/vue/combobox'
createApp(App).use(Grana).use(Combobox)
```

Para generar tu tema (y rechazar los que rompan los mínimos de accesibilidad) usa [`@grana/cli`](https://github.com/kevinedgm/grana/blob/main/packages/cli/README.md).

## Licencia

MIT. Iconos de Lucide (ISC), ver `THIRD-PARTY-NOTICES.md`. Fuente por defecto: Instrument Sans (SIL OFL).
