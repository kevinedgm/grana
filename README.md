# Grana

> *The only bug you'll want in your UI.*

Librería de componentes **Vue 3** con tema por tokens. Los componentes traen la **estructura**; tu tema les da el **color**.

El nombre viene de la **grana cochinilla**, el insecto oaxaqueño cuyo tinte coloreó medio mundo. Grana funciona igual: un armazón fijo y un color que pone cada proyecto.

- **Estructura fija, color tuyo.** Los componentes solo leen variables `--g-*`, sin valores de respaldo ni colores escritos en su CSS. Cambiar el tema no deja ningún valor fijo atrás.
- **Accesibilidad como restricción, no como extra.** Área táctil, tamaño de texto, contraste y foco tienen mínimos que no son tema: el generador de temas rechaza lo que los rompa.
- **64 componentes documentados**, todos en estado `candidate`: formularios completos, tablas y filtros, calendario, paneles, avisos, captura de voz.
- **Personalidad propia.** Movimiento y forma con identidad, siempre con tokens, `prefers-reduced-motion` y contraste intactos (ver [Personalidad](#personalidad)).

## Qué es Grana

Grana es un **sistema de interfaz para aplicaciones de producto hechas con Vue 3**: paneles de administración, sistemas internos, herramientas de captura de datos, flujos con formularios largos, tablas y filtros. Son dos piezas que trabajan juntas:

- **`@grana/vue`**, la librería de componentes: botones, campos, formularios completos, tablas con filtros y paginación, calendario, diálogos, menús, avisos, tooltips, captura de voz y más.
- **`@grana/cli`**, el motor de tema: a partir de unos pocos datos de tu marca (color principal, neutros, colores de categoría, modo oscuro) deriva en OKLCH todos los tokens que leen los componentes y **rechaza las combinaciones que no cumplen el contraste mínimo**.

### El problema que resuelve

Los frameworks de componentes suelen obligar a elegir entre dos extremos:

- **Traen su propia estética.** Funcionan desde el primer día, pero la aplicación acaba pareciéndose a todas las que usan el mismo framework, y cambiar su identidad significa pelear contra sus estilos.
- **No traen ninguna (headless).** Dan libertad total, pero cada equipo vuelve a resolver la estructura, el foco, el teclado, los estados y la accesibilidad de cada componente.

Grana separa las dos responsabilidades. **La librería decide la estructura**: anatomía, estados, teclado, semántica ARIA, foco y comportamiento en móvil. **Cada proyecto decide el color**: paleta, tipografía, radios, espaciado y densidad, todo con variables `--g-*`. Como los componentes no llevan ningún valor de tema escrito en su CSS, un tema nuevo los cambia por completo sin dejar restos del anterior.

### Cómo funciona

1. **Los componentes** solo leen variables `--g-*`, sin valores de respaldo.
2. **El tema por defecto** (neutro, sobrio, con Instrument Sans) vive en una capa CSS de baja prioridad, `grana.defaults`, así que la aplicación funciona y se ve bien sin configurar nada.
3. **Tu tema**, escrito a mano o generado con `@grana/cli`, va fuera de esa capa y **siempre gana**, sin `!important` ni selectores más específicos.

### Qué lo distingue

- **La accesibilidad no es opcional ni depende del tema.** Área táctil de al menos 24px (44px en pantallas táctiles), texto de al menos 12px, contraste de al menos 4.5:1 (3:1 en controles) y foco siempre visible. No se configuran desde el tema, y `@grana/cli` no genera un tema que baje de ellos.
- **Personalidad sin sacrificar lo anterior.** Cada componente explora un comportamiento, una forma o un movimiento propios en lugar de copiar el patrón común: el tooltip que viaja de control en control, la hora que se escribe como se dice, la selección múltiple que se lee como una frase. Siempre con `prefers-reduced-motion` respetado.
- **Formularios de verdad.** Filas que siempre llenan el ancho, campos fusionados, secciones plegables y agregables, campos condicionales que salen del envío al ocultarse, resumen de errores y validación integrada.
- **Sin red dentro de los componentes.** Grana no hace `fetch`: la aplicación pone los datos y, donde hace falta un servicio (subir archivos, transcribir voz), lo conecta con un adaptador propio.
- **Peso bajo control.** Cada componente está marcado como puro, así que importar uno no arrastra el resto, y los más pesados (voz, isla de estado, combobox, archivos, hora, deslizador, botón flotante) y los últimos en llegar viven en entradas propias.
- **Decisiones a la vista.** Cada componente tiene su contrato público y cada decisión de diseño está registrada con su porqué en [`DECISIONS.md`](DECISIONS.md), para que el sistema no cambie por capricho.

### Para quién es

Para equipos que construyen **aplicaciones de uso diario**, donde la gente trabaja horas capturando, revisando y decidiendo, y que quieren un sistema coherente y accesible **con su propia identidad**. No es un kit para páginas de marketing, y no incluye router ni capa de datos: se integra con los que ya uses (por ejemplo, `RouterLink` o `NuxtLink` en los enlaces).

## Estado: `0.1.0-beta`

Esta es una **beta**. Qué significa:

- **La API puede cambiar** entre betas. Las decisiones de diseño están registradas en [`DECISIONS.md`](DECISIONS.md) y los contratos en [`docs/contract/`](docs/contract/) y [`design/contracts/`](design/contracts/), pero ninguno está congelado como API estable.
- **`candidate`** es el estado de todos los componentes: tienen contrato, CSS, pruebas, `meta.json`, README y una auditoría del componente real con un tema distinto al por defecto, sin defectos bloqueantes, en Chromium, Firefox y WebKit.
- **Falta la verificación en entorno real:** lector de pantalla (VoiceOver, NVDA), Safari real, táctil y móvil reales, `forced-colors` real y zoom real al 200 y 400 %. Está listado en [`PENDIENTES.md`](PENDIENTES.md), sección 7. Si dependes de alguno de esos entornos, pruébalo antes de adoptar un componente.
- **Todavía no está publicada en npm.** Se publicará como `0.1.0-beta.0` (la versión que ya llevan `@grana/vue`, `@grana/cli` y el `package.json` raíz). Mientras tanto se usa desde este repositorio (ver [Probarlo en este repositorio](#probarlo-en-este-repositorio)). Las instrucciones de instalación de abajo son las de la publicación.

## Instalación

```bash
npm i @grana/vue
```

Requisitos: **Vue `^3.5.0`**. `lucide-static` (`^1.49.0`) es dependencia par **opcional**: solo hace falta si tu aplicación registra sus propios iconos con `createIcons` (ver [Iconos](#iconos)). Para generar el tema, [`@grana/cli`](packages/cli/README.md) exige Node ≥ 22.

### Uso con `app.use` (todo registrado)

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

`app.use(Grana)` registra los componentes del paquete principal en PascalCase (`GBtn`) y en kebab-case (`<g-btn>`). En plantillas dentro del HTML sin compilar, escribe las etiquetas con cierre explícito (`<g-btn></g-btn>`): Vue no admite etiquetas de componente autocerradas.

### Uso por componente

```vue
<script setup>
import { GBtn, GInput } from '@grana/vue'
</script>
```

```js
import '@grana/vue/style.css'
```

Los componentes se exportan por nombre. El JavaScript es un único módulo ES con exportaciones nombradas y `sideEffects` solo para CSS, y cada componente está marcado como puro (`packages/vue/scripts/pure-components.mjs`), de modo que tu empaquetador descarta lo que no importes. La **hoja de CSS es una sola** y no se parte por componente.

#### Tamaño e importación parcial

Importar un componente no arrastra el resto. Cifras medidas por bruno en la Fase B: es lo que **añade a tu aplicación** cada importación, con el JavaScript minificado por el empaquetador y comprimido con gzip, y con Vue como dependencia externa:

| Qué importas | JavaScript (gzip) |
| --- | --- |
| Solo `GBtn` | ≈ 10,9 KB (Rollup), ≈ 11,1 KB (esbuild) |
| Toda la librería (importar todo) | ≈ 155 KB |
| La hoja de CSS (`style.css`, siempre entera) | ≈ 69 KB |

Antes de marcar los componentes como puros, importar solo `GBtn` pesaba 66,4 KB (Rollup) y 137,8 KB (esbuild). El resultado en tu aplicación depende de tu empaquetador y de qué más importes; el CSS no se parte por componente, así que su coste es fijo.

### CSS y fuentes

| Archivo (`exports`) | En `dist/` | Qué es |
| --- | --- | --- |
| `@grana/vue/style.css` | `grana.css` | CSS de todos los componentes, el tema por defecto y las clases utilitarias, en capas (`grana.defaults`, `grana.components`, `grana.blocks`, `grana.utilities`). **Obligatorio.** |
| `@grana/vue/utilities.css` | `utilities.css` | Solo las **clases utilitarias** (`g-p-4`, `g-mt-2`, `g-gap-6`, `g-flex`, `g-items-center`, `g-text-muted`, `g-sr-only`…: 229 clases que leen la escala del tema, con ejes lógicos y sin breakpoints; [guía de utilidades](packages/vue/src/styles/README-utilities.md); `candidate`). **Opcional**: ya van dentro de `style.css`; esta hoja es para quien quiere únicamente las utilidades, y declara ella misma el orden de capas. ≈ 1,9 kB gzip. |
| `@grana/vue/fonts.css` | `fonts.css` + `fonts/*.woff2` | Instrument Sans variable (licencia SIL OFL), en dos subconjuntos (`latin` y `latin-ext`). **Opcional**: si tu tema define otra fuente, omítelo. La fuente **no** va incrustada en `grana.css`: el empaquetador la copia como archivo. |

**¿Ya tienes CSS propio (Bootstrap, hojas globales) o montas varias apps de Vue en la misma página, o no usas empaquetador?** Lee la [guía de integración](docs/integracion.md): la receta de capas (`@layer legado, grana, app;`), los globales UMD, `app.config.idPrefix` y un gestor compartido.

#### ESM y UMD para CDN

El paquete es **solo ESM** (`"type": "module"`; `exports` con `types`, `import` y `default` por entrada). No hay build CommonJS. Los archivos UMD existen solo para usar la librería con `<script>` desde una CDN (`unpkg` y `jsdelivr` apuntan a `dist/grana.umd.js`): el global es `Grana` y requiere `vue.global.js` antes. Cada entrada propia tiene su UMD y su global (`dist/speech.umd.js` con `GranaSpeech`, `status.umd.js` con `GranaStatus`, `combobox.umd.js` con `GranaCombobox`, `file-field.umd.js` con `GranaFileField`, `time-field.umd.js` con `GranaTimeField`, `slider.umd.js` con `GranaSlider`, `tag.umd.js` con `GranaTag`, `load-region.umd.js` con `GranaLoadRegion`, `card-group.umd.js` con `GranaCardGroup`, `page-header.umd.js` con `GranaPageHeader`, `fab.umd.js` con `GranaFab`, `form-fold.umd.js` con `GranaFormFold` y `testing.umd.js` con `GranaTesting`).

### Entradas propias

Diecisiete piezas **no viajan en el paquete principal**: cada una tiene su entrada y solo la paga quien la importa. Todas dependen de `@grana/vue` (que ya tienes instalado) y comparten con él las piezas comunes sin copiarlas; **su CSS sí está en la misma `style.css`** y es inerte sin el marcado.

| Entrada | Qué trae | Cuándo usarla | Global UMD | Tamaño (gzip) |
| --- | --- | --- | --- | --- |
| `@grana/vue/speech` | `createSpeech`, `useSpeech`, `GSpeechHost`, `GSpeechPill`, `GSpeechTrigger`, `GTranscript`, `createTranscript`, `useSpeechTarget` | Dictado y transcripción: si tu aplicación recoge voz | `GranaSpeech` | ≈ 56,0 kB |
| `@grana/vue/status` | `createStatus`, `useStatus`, `GStatusIsland`, `GStatusMark`, `GStatus` | Un aviso persistente de la aplicación (la isla de estado) | `GranaStatus` | ≈ 16,2 kB |
| `@grana/vue/combobox` | `GCombobox` | Elegir de un catálogo grande escribiendo (pacientes, diagnósticos, medicamentos) | `GranaCombobox` | ≈ 22,0 kB |
| `@grana/vue/file-field` | `GFileField`, `formatFileSize` | Adjuntar archivos a un formulario | `GranaFileField` | ≈ 12,6 kB |
| `@grana/vue/time-field` | `GTimeField` | Capturar una hora del reloj | `GranaTimeField` | ≈ 10,6 kB |
| `@grana/vue/slider` | `GSlider` | Elegir un valor acotado o un rango por posición (volumen, intensidad, precio) | `GranaSlider` | ≈ 11,7 kB |
| `@grana/vue/tag` | `GTag`, `GTagGroup` | Etiquetas de un conjunto (alergias, filtros aplicados, temas) con huella al quitar y racimos por faceta | `GranaTag` | ≈ 10,7 kB |
| `@grana/vue/load-region` | `GLoadRegion` | Una lista, un grupo de teselas o una ficha que esperan datos: la plantilla sin tinta mientras llega, lo de antes a la vista al refrescar, anuncios y foco (`GEmpty`, su vacío, sí va en el principal) | `GranaLoadRegion` | ≈ 4,4 kB |
| `@grana/vue/card-group` | `GCardGroup` | Una fila de tarjetas de métrica que filtran la región de debajo (resumen de una tabla o de un panel) | `GranaCardGroup` | ≈ 5,2 kB |
| `@grana/vue/page-header` | `GPageHeader` | El encabezado de una página con acciones y, al desplazar, un zócalo con pestañas | `GranaPageHeader` | ≈ 5,9 kB |
| `@grana/vue/fab` | `GFab` | Un botón flotante para crear o capturar desde cualquier sitio de la pantalla | `GranaFab` | ≈ 10,2 kB |
| `@grana/vue/form-fold` | `GFormFold` | Crear lo que falta (una categoría, un producto) en un pliegue bajo el campo que lo pide, sin salir del formulario | `GranaFormFold` | ≈ 4,6 kB |
| `@grana/vue/app-shell` | `GAppShell` | El chasis de la aplicación: cabecera, navegación (`GSidebar`), página y pie con sus puntos de referencia, y la cifra de la cabecera escrita una vez | `GranaAppShell` | ≈ 3,9 kB |
| `@grana/vue/hero` | `GHero` | La apertura de una página de un sitio: título, promesa, acción y la foto que vende, con el texto siempre fuera de la foto | `GranaHero` | ≈ 4,0 kB |
| `@grana/vue/gallery` | `GGallery`, `GGalleryViewer` | Las fotos de un lugar por espacios o en tira, con visor ampliable | `GranaGallery` | ≈ 9,3 kB |
| `@grana/vue/booking` | `GBookingBar`, `GPartyField` | La consulta de disponibilidad de un sitio (estancia, mesa o recorrido) y las personas por tipo | `GranaBooking` | ≈ 14,2 kB |
| `@grana/vue/price` | `GPrice`, `GPriceScope`, `formatPrice`, `currencyDigits` | Mostrar precios que dicen su moneda: la región que la declara una vez, la referencia nombrada y el total de lo pedido | `GranaPrice` | ≈ 6,0 kB |

**Por qué van aparte:** las primeras añadirían más de 8 kB gzip al paquete principal (criterio de [#328](DECISIONS.md)); desde que el margen del principal se agotó ([#550](DECISIONS.md)), todo componente nuevo con peso propio va en su entrada por defecto. No todas las aplicaciones las necesitan. Los tamaños de esta tabla son los del archivo de `dist/` de cada entrada, **sin minificar y comprimido con `gzip`** (medidos el 2026-10-18; kB = 1000 bytes): sirven para comparar entradas entre sí, no para predecir lo que sumará a tu aplicación. Por la misma razón, `dist/grana.js` entero pesa ≈ 179 kB gzip, mientras que importar toda la librería en una aplicación con el JavaScript minificado añade ≈ 155 KB (tabla de [Tamaño e importación parcial](#tamaño-e-importación-parcial)); ninguna de las dos cifras incluye la hoja de CSS (≈ 69 kB gzip). Para saber cuánto añade lo que usas, guíate por la tabla de importación parcial. Los servicios (`createSpeech`, `createStatus`) son además plugins de Vue: `app.use(speech)` registra sus componentes.

```js
import Grana from '@grana/vue'
import Combobox from '@grana/vue/combobox'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(Combobox).mount('#app')   // registra <g-combobox>
```

**`@grana/vue/testing`** reúne ayudas **para probar tu aplicación**, no es para producción: `createSimulatedSpeechAdapter` (adaptador de voz sin red, con hablantes por guion) y `createSimulatedUploader` (adaptador de subida de `GFileField` sin red). No importa Vue ni se incluye en el paquete principal (global UMD `GranaTesting`).

### TypeScript

Los tipos **vienen incluidos** en el paquete: no hay `@types/...` que instalar. Cada entrada tiene su propio `.d.ts` (`dist/grana.d.ts`, `speech.d.ts`, `status.d.ts`, `combobox.d.ts`, `file-field.d.ts`, `time-field.d.ts`, `slider.d.ts`, `tag.d.ts`, `load-region.d.ts`, `card-group.d.ts`, `page-header.d.ts`, `fab.d.ts`, `form-fold.d.ts` y `testing.d.ts`), generado desde los `*.meta.json` de los componentes (props con valores, por defecto y obligatoriedad; eventos con su payload; slots con alcance; lo expuesto por `ref`). Lo que un `meta.json` no puede expresar (la forma de las opciones, los elementos y los gestores como `createToaster`) está escrito a mano en `packages/vue/types/`.

Tras `app.use(...)`, las etiquetas de los componentes quedan tipadas en las plantillas sin importar nada, gracias a `GlobalComponents` de Vue (una declaración por entrada, en PascalCase y en kebab-case):

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

Los tipos de datos se importan de la entrada a la que pertenecen. El uso correcto y 15 usos erróneos se comprueban con `vue-tsc` en `packages/vue/src/types.test.js`; el paquete declara `types` en `exports` y también `typesVersions`, para `moduleResolution: "node"`.

**Límites:**

- Sin `strictTemplates` (opción `vueCompilerOptions` de `vue-tsc`) la comprobación de plantillas es laxa: no se avisa de una prop obligatoria ausente. Actívalo en tu proyecto si quieres ese aviso.
- Los tipos de opciones y elementos (`ComboboxOption`, grupos, entradas…) aceptan **campos propios** de tu aplicación (llevan una firma de índice) para que los conserves y los recibas en los slots; por eso un nombre de campo mal escrito no se marca como error.

### Iconos

Grana usa **solo [Lucide](https://lucide.dev)** (licencia ISC) y la lista que trae la librería es API pública. `GIcon` dibuja esa lista; si tu aplicación necesita otros iconos de Lucide, los registra **por aplicación** con `createIcons` y cadenas de `lucide-static` (validadas por forma, sin `DOMParser`). Lo que no es Lucide (logotipos, ilustraciones) va por slot. Contrato: [`docs/contract/icons.md`](docs/contract/icons.md).

## Tematización

El tema de tu proyecto se escribe en un archivo corto. Todas las claves son opcionales; sin tema, Grana usa su estilo por defecto (neutro: `brand` `#1F1F1F`, `accent` `#0B63CE`, Instrument Sans).

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

| Clave | Controla |
| --- | --- |
| `brand`, `accent` | Acción principal; foco, enlaces, selección y estados activos |
| `primary` | Color de la acción principal cuando es distinto de `brand` |
| `radius`, `shape` (`rounded` \| `pill`) | Escala de radios y forma de botones, chips e insignias |
| `space` | Unidad de espaciado (px) |
| `font`, `fontDisplay`, `fontSize`, `typeScale` | Tipografía |
| `neutrals` (`tinted` \| `pure`), `neutralsHue` | Neutros teñidos con el tono de la marca (o del acento) |
| `semanticCollision` (`warn` \| `adjust`) | Qué hacer si éxito, aviso, peligro o info se parecen a tu marca |
| `categories` (0 a 12) | Serie de colores de categoría `--g-color-cat-1` a `cat-N` |
| `dark` (`true` \| `false` \| objeto) | Tema oscuro (abajo) |
| `name` | Nombre del sistema en `tokens.json` |
| `overrides` | Cualquier token (`{ "--g-token": "valor" }`), incluidos los colores semánticos |

De `brand`, `accent` y `primary` el generador deriva por reglas en OKLCH `strong`, `soft`, `text` y `on` con contraste garantizado. Contrato completo: [`docs/contract/tokens.md`](docs/contract/tokens.md).

### `@grana/cli`

[`@grana/cli`](packages/cli/README.md) genera el `tokens.css` y **rechaza los temas que rompan los mínimos de accesibilidad**, explicando cuál y por qué. Sin dependencias; Node ≥ 22.

```bash
npx @grana/cli theme grana.config.json    # escribe tokens.css
npx @grana/cli check grana.config.json    # solo valida (--json para CI)
```

También hay un plugin de Vite que genera el tema en build y falla la compilación si el tema rompe un mínimo:

```js
// vite.config.js
import grana from '@grana/cli/vite'
export default { plugins: [grana({ config: 'grana.config.json' })] }

// main.js
import 'virtual:grana/tokens.css'
```

El `tokens.css` generado **no lleva capa y gana siempre**, sin importar el orden de carga. Si lo escribes a mano, no lo hagas solo con colores claros: pisaría el tema oscuro (ver abajo).

### Tema oscuro

Grana trae un tema oscuro por defecto (gris casi negro; lo elevado es más claro). **Sigue la preferencia del sistema** y se puede forzar con `data-theme` en cualquier elemento:

```html
<html>                                  <!-- automático: sigue al sistema -->
<html data-theme="dark">                <!-- oscuro siempre -->
<html data-theme="light">               <!-- claro siempre, aunque el sistema sea oscuro -->
<section data-theme="dark">…</section>  <!-- una sección oscura dentro de una página clara (o al revés) -->
```

- **Tus componentes no cambian:** el oscuro redeclara los mismos tokens de color.
- **Tu tema también tiene oscuro:** con `dark: true` (por defecto) el CLI deriva la variante oscura de tu `brand` y `accent` con el mismo contraste garantizado (4.5:1 para texto, 3:1 para controles) y **valida los dos esquemas**. Puedes fijar colores propios con `"dark": { "brand": "#8FACE5", "accent": "#5CC1B6" }`.
- **Sin oscuro:** `"dark": false` (el sistema oscuro no lo activa) o `data-theme="light"` en `<html>`.
- **Guardar la preferencia** (un interruptor de tema) es de tu aplicación: alterna el atributo y guárdalo donde prefieras. Las imágenes y los iconos de tu aplicación no se adaptan solos.

Reglas y límites: [`docs/contract/tokens.md` §15](docs/contract/tokens.md). Verificación: [`design/lab/tema-oscuro/auditoria.md`](design/lab/tema-oscuro/auditoria.md). Una opción de presencia del color en oscuro (Dark Color Presence) está investigada pero **no adoptada**.

### Densidad global y por región

La densidad aprieta o afloja **la altura, el relleno y la separación** de los controles en tres pasos: `default` (×1), `comfortable` (×0,875) y `compact` (×0,75). Con `space` 4, una caja `md` mide 36, 31,5 y 27 px. Los mínimos no bajan nunca: 24 px de área táctil, 44 px con puntero grueso, 12 px de texto y 16 px de texto editable con puntero grueso. **En `compact` el texto también baja** (pieza 3, [#986 a #995](DECISIONS.md)); mira «El texto en `compact`» más abajo.

Viaja por CSS: el atributo `data-g-density` en **cualquier elemento** crea una región y todo lo que hay dentro la sigue.

```html
<html data-g-density="comfortable">          <!-- preferencia de quien usa la app: «vista amplia / normal / compacta» -->
<section data-g-density="compact">…</section> <!-- una región: una barra de herramientas, una tabla densa -->
```

```vue
<!-- Fragmento: `abierto` e `items` son de tu aplicación -->
<section data-g-density="compact">
  <GBtn variant="outline">Filtrar</GBtn>
  <GMenu v-model="abierto" :items="items" label="Acciones de la lista">
    <template #trigger="{ attrs }"><GBtn v-bind="attrs" variant="outline">Acciones</GBtn></template>
  </GMenu>
</section>
```

**Por qué:** una barra apretada junto a un formulario holgado no obliga a pasar `density` a cada botón. El menú se abre en el sitio, hereda la región de su botón y sus filas miden lo mismo que él.

**Quién gana, de más a menos fuerte:**

1. La prop `density` del componente.
2. La región más cercana: el ancestro con `data-g-density` (`default` dentro de una región apretada vuelve al paso normal; para heredar no escribas nada).
3. `<html data-g-density>`.
4. La clave `density` de `grana.config.json` (`"default"`, `"comfortable"` o `"compact"`; otro valor, número incluido, es un error del CLI).
5. `default`.

**Reglas que conviene saber:**

- **La prop de un componente es su región.** `<GTable density="compact">` aprieta también los botones de su barra y el menú que abren; `GCard`, `GDialog`, `GForm`, `GStack`, `GSplit`, `GSurface` y `GSidebar` hacen lo mismo con lo que llevan dentro. Para salir de ella, `density` en el hijo (`<GBtn density="default">`) o un elemento tuyo con `data-g-density` alrededor.
- **En un campo, usa la prop, no el atributo.** `GInput`, `GSelect`, `GTextarea` y el resto de campos mandan los atributos al control nativo: un `data-g-density` en `<GInput>` acabaría en el `<input>` y no apretaría nada. En un componente que **no** tiene `density`, el atributo en su raíz sí vale.
- **Lo que se abre en su sitio hereda** la región de donde está escrito: menús, listas de `GSelect`, calendarios, ayudas y `GDialog`. Para que un diálogo no la siga, ponle `density`.
- **Avisos, isla de estado y captura de voz no la siguen**: se pintan siempre en `default`, para no cambiar de tamaño cuando se mudan a un diálogo compacto.
- **Con puntero grueso (táctil) ceden al dedo:** las regiones, `<html data-g-density>` y la clave del tema valen `default`. La prop explícita de un componente no cede: si pides `compact` en un botón, lo tendrás (con su área táctil de 44 px, pero la caja visible será la compacta).
- **El cambio no se anima.** Al cambiar el atributo en marcha, todo se recoloca en el siguiente cuadro y el foco no se pierde.
- **Sin JavaScript funciona:** es CSS; el servidor puede pintar `<html data-g-density="compact">` y la página llega ya apretada.
- **Se cambia con el atributo, no con el token.** `style.setProperty('--g-density', …)` o `--g-density` en tu `tokens.css` están fuera de contrato (el CLI lo rechaza en `overrides`).
- **`useFormField().density`** no ve la región: sigue resolviendo prop › formulario › `default`. Para medir o pintar, lee `var(--g-density)`.
- **`GCalendar`** conserva su escala propia (`compact` · `comfortable` · `spacious`) y no sigue la región; `GPagination`, `GTag`, `GBadge`, `GAccordion`, `GFilterBar` y `GBreadcrumbs` tampoco **en su caja**, hasta la pieza 4 ([#967](DECISIONS.md)): en una barra compacta quedan en su paso normal. Su **texto sí baja** con la región (13,13 px dentro de una caja de 36): es un desajuste transitorio y conocido (H3 de `density.md` §16.7).

#### El texto en `compact`

En una región `compact` (también con `<html data-g-density="compact">` o la clave `density: "compact"`) el texto baja **≈ 6,25 %** en todos los roles, con su interlineado y un piso de 12 px. Con el tema por defecto:

| Rol | `default` | `compact` |
| --- | --- | --- |
| `caption` | 12 / 16 | 12 / 16 |
| `body-sm` | 14 / 20 | 13,13 / 20 |
| `body` | 16 / 24 | 15 / 24 |
| `title-sm` | 20 / 28 | 18,75 / 28 |
| `title` | 25 / 36 | 23,44 / 32 |
| `title-lg` | 31,25 / 40 | 29,3 / 36 |
| `display` | 39,06 / 48 | 36,62 / 44 |

- **Qué baja:** todo lo que lee un rol `--g-text-*` dentro de la región: controles, etiquetas, ayudas, celdas, títulos de contenedor, `GText`, el valor de `GMetric` y **tu propia prosa si usa `var(--g-text-*)`**. El icono de `GBtn`, que se mide desde su texto, baja con él (15,1 px en `md`). Un texto tuyo con un tamaño fijo no baja.
- **Qué no:** `comfortable` conserva el texto del paso normal. Avisos, isla de estado y captura de voz tampoco bajan. Los títulos bajan conservando su peso.
- **El interlineado** sigue su regla: con el tema por defecto, `caption`, `body-sm`, `body` y `title-sm` mantienen su renglón en los tres pasos (un párrafo no cambia de ritmo vertical); `title`, `title-lg` y `display` bajan 4 px.
- **Táctil:** con puntero grueso el texto vuelve a `default`, salvo en un componente con `density="compact"` explícito. El texto editable mantiene `max(16px, rol)` aun así.
- **Los títulos nunca quedan por debajo del `body-sm` de su paso** ([`tokens.md` §23.4](docs/contract/tokens.md)): 14 px en `default` y `comfortable`, 13,13 px en `compact` con el tema por defecto.
- **Con tema generado por el CLI,** las reglas de región llevan los valores de tu tipografía (`fontSize`, `typeScale`, `overrides`); [cómo, en el README del CLI](packages/cli/README.md#densidad-y-texto).

**Límites que conviene saber:**

- **Tu `tokens.css` escrito a mano (H5).** Un `--g-text-*` que sobrescribes en `:root` solo vale **fuera** de los elementos con `data-g-density`, incluidas las raíces de componentes con `density` explícita (también `"default"`) y las de avisos, isla y voz: dentro, las reglas del tema lo reasignan. Genera el tema con el CLI para que lo cubra.
- **`--g-hero-title-max` no sigue la región (H4):** el héroe es de la página.
- **`GCalendar` y los controles que aún no siguen la densidad (H3):** su texto baja pero no su caja, hasta la pieza 4.
- **El ritmo compartido solo es exacto con el tema por defecto.** Con otras tipografías el redondeo a 4 px puede bajar un renglón (con `fontSize` 18 y `typeScale` 1,333, `body-sm` pasa de 24 a 20).

**Verificación** (estado: `candidate`; contrato [`design/contracts/density.md`](design/contracts/density.md), decisiones #974 a #985): **medido en Chromium** con la verificación propia de la auditoría de coco ([`design/lab/density/auditoria.md`](design/lab/density/auditoria.md), 142/142) y el spec `tests/density.spec.mjs` (17/17). **El texto** (pieza 3): la auditoría de coco ([`design/lab/density-text/auditoria.md`](design/lab/density-text/auditoria.md)) da 172/172 en Chromium y el spec `tests/density-text.spec.mjs` de bruno, 13/13 según su informe (no se volvió a ejecutar al documentar); el CLI, sus pruebas `packages/cli/test/density-text.test.js`. **Sin verificar:** Firefox y WebKit (solo hay Chromium; el texto de `compact` también está medido solo en Chromium), una aplicación con SSR real (se aproxima con `renderToString` y sin JavaScript), una tableta que cambia de puntero en caliente y lectores de pantalla (sin cambio semántico esperado). Con una tabla de 500 filas, cambiar la densidad de toda la página tarda ≈ 72–80 ms: es el reflujo del navegador, igual que cambiar un control, y no está verificado sin vecinos ([#965](DECISIONS.md)).

## Componentes

Todos están en **`candidate`**: ver [Estado](#estado-010-beta). «Propia» indica que se importa de su entrada propia ([Entradas propias](#entradas-propias)). El enlace lleva al README del componente, con su API completa, teclado, accesibilidad medida y límites.

### Estructura de página

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GAppShell`](packages/vue/src/components/GAppShell/README.md) | Chasis de aplicación: reparte el visor entre cabecera, navegación, página y pie con sus puntos de referencia y su enlace de salto; reserva el sitio de la navegación leyendo su forma por CSS y escribe una sola vez la cifra de la cabecera; con `header="relay"`, la cabecera cede el borde al zócalo de la página | **propia** (`app-shell`) |
| [`GContainer`](packages/vue/src/components/GContainer/README.md) | Columna de la página: ancho máximo, centrado y margen fluido sobre su caja y no sobre el visor; `g-bleed` lleva una banda al borde con el texto alineado | principal |
| [`GStack`](packages/vue/src/components/GStack/README.md) | Pila de un eje con la separación como relación (`sm`, `md`, `lg`): una sola fuente de aire, en línea siempre se parte | principal |
| [`GSection`](packages/vue/src/components/GSection/README.md) | Región de página con encabezado, descripción y acciones: el nivel (`h2` a `h4`) lo pone la anidación | principal |
| [`GText`](packages/vue/src/components/GText/README.md) | Texto suelto con la tipografía del tema (`body`, `body-sm`, `caption`; `default` o `muted`) y una pausa por tamaño entre sus bloques, sin aire hacia fuera: la cita y su pie, la garantía bajo una acción, el legal de un boletín; vacío no pinta | principal |
| [`GSplit`](packages/vue/src/components/GSplit/README.md) | Dos regiones lado a lado con una proporción cuando caben y una debajo de otra cuando no: el umbral lo fija el ancho mínimo del lado estrecho, que sigue al texto, sobre su caja y no sobre el visor; solo CSS, en el orden del DOM | principal |
| [`GPageHeader`](packages/vue/src/components/GPageHeader/README.md) | Encabezado de página pegado con zócalo: al desplazar, el encabezado se hunde hasta que asoma el zócalo con pestañas y acciones; en estrecho y pegado, las acciones bajan al muelle con `--g-ease-spring` | **propia** (`page-header`) |
| [`GHero`](packages/vue/src/components/GHero/README.md) | Apertura de una página de un sitio: título, promesa, acción y foto con el texto siempre fuera de ella (ventana, umbral con consulta o vistas a elegir) | **propia** (`hero`) |

### Acciones y navegación

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GBtn`](packages/vue/src/components/GBtn/README.md) | Botón de acción; se renderiza como enlace con `href` | principal |
| [`GMenu`](packages/vue/src/components/GMenu/README.md) | Menú de acciones anclado a un botón (acciones, grupos, casillas, opciones, submenús) | principal |
| [`GTabs`](packages/vue/src/components/GTabs/README.md) | Pestañas entre vistas del mismo nivel, con `GTabPanel` | principal |
| [`GSidebar`](packages/vue/src/components/GSidebar/README.md) | Navegación lateral: expandida, riel, navbar inferior y drawer | principal |
| [`GBreadcrumbs`](packages/vue/src/components/GBreadcrumbs/README.md) | Migas de pan: la ruta entera se aprieta por prioridad sin esconder niveles; al final, «Subir · página»; con `children`, puertas a los hermanos | principal |
| [`GPagination`](packages/vue/src/components/GPagination/README.md) | Paginación de una colección | principal |
| [`GStepper`](packages/vue/src/components/GStepper/README.md) | Avance por pasos discretos | principal |
| [`GFab`](packages/vue/src/components/GFab/README.md) | Botón flotante para crear o capturar desde cualquier sitio: la pila que crece (las que caben, la más usada pegada al botón) o, con `main`, la acción principal a un toque con una cola que filtra al escribir; confirmación en la misma fila y acuse en el propio botón | **propia** (`fab`) |
| [`GTooltip`](packages/vue/src/components/GTooltip/README.md) | Nombre visible, descripción y atajo de un control enfocable | principal |
| [`GHelper`](packages/vue/src/components/GHelper/README.md), [`GHelperScope`](packages/vue/src/components/GHelperScope/README.md) | Ayuda contextual anclada a una región | principal |

### Campos de entrada

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GInput`](packages/vue/src/components/GInput/README.md) | Campo de texto de una línea | principal |
| [`GTextarea`](packages/vue/src/components/GTextarea/README.md) | Texto de varias líneas, filas fijas o autosize | principal |
| [`GNumberField`](packages/vue/src/components/GNumberField/README.md) | Número que se escribe, en el formato del idioma | principal |
| [`GSelect`](packages/vue/src/components/GSelect/README.md) | Selector de una opción con lista propia | principal |
| [`GCombobox`](packages/vue/src/components/GCombobox/README.md) | Elegir de un catálogo grande escribiendo; con `multiple` | **propia** |
| [`GTimeField`](packages/vue/src/components/GTimeField/README.md) | Hora del reloj que se escribe como se dice | **propia** |
| [`GSlider`](packages/vue/src/components/GSlider/README.md) | Valor acotado o rango de dos extremos donde el asa es el valor | **propia** |
| [`GDatePicker`](packages/vue/src/components/GDatePicker/README.md) | Fecha o rango, con popover u hoja inferior en móvil | principal |
| [`GBookingBar`](packages/vue/src/components/GBookingBar/README.md), `GPartyField` | Consulta de disponibilidad de un sitio (estancia, mesa o recorrido) que entrega una intención sin reservar, y la pieza de personas por tipo que usa y que también sirve suelta | **propia** (`booking`) |
| [`GFileField`](packages/vue/src/components/GFileField/README.md) | Adjuntar archivos, con subida por adaptador de tu aplicación | **propia** |
| [`GCheckbox`](packages/vue/src/components/GCheckbox/README.md), [`GCheckboxGroup`](packages/vue/src/components/GCheckboxGroup/README.md) | Casilla y grupo de casillas con casilla maestra | principal |
| [`GRadioGroup`](packages/vue/src/components/GRadioGroup/README.md) | Una respuesta entre varias, en cinco apariencias | principal |
| [`GSwitch`](packages/vue/src/components/GSwitch/README.md) | Interruptor de efecto inmediato | principal |

### Estructura de formularios

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GForm`](packages/vue/src/components/GForm/README.md) | Formulario con contexto: cuándo se ven los errores, envío, resumen y estado sucio. No valida: lo hace tu aplicación | principal |
| [`GFormSection`](packages/vue/src/components/GFormSection/README.md) | Sección fija, plegable o agregable | principal |
| [`GFormLayout`](packages/vue/src/components/GFormLayout/README.md), [`GFormRow`](packages/vue/src/components/GFormRow/README.md) | Pila de filas y filas de campos que se reparten el ancho | principal |
| [`GFormReveal`](packages/vue/src/components/GFormReveal/README.md) | Campos condicionales con `when` | principal |
| [`GFormFold`](packages/vue/src/components/GFormFold/README.md) | Pliegue para crear lo que falta en su sitio: se abre debajo del campo que lo pide, con su propio confirmar; abierto, bloquea el envío del formulario exterior | **propia** (`form-fold`) |
| [`GInputGroup`](packages/vue/src/components/GInputGroup/README.md) | Campo fusionado: un dato en varias partes | principal |
| [`GFieldGroup`](packages/vue/src/components/GFieldGroup/README.md) | Una pregunta compuesta con partes etiquetadas | principal |
| [`GFormActions`](packages/vue/src/components/GFormActions/README.md) | Pie de acciones con jerarquía | principal |
| [`GErrorSummary`](packages/vue/src/components/GErrorSummary/README.md) | Resumen de errores con un enlace por pregunta | principal |

### Datos

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GTable`](packages/vue/src/components/GTable/README.md) | Tabla con columnas compuestas, celdas por slot y filtros | principal |
| [`GFilterBar`](packages/vue/src/components/GFilterBar/README.md) | Filtros no fijos al estilo Stripe | principal |
| [`GCardGroup`](packages/vue/src/components/GCardGroup/README.md) | Fila de tarjetas de métrica que filtran la región de debajo: pulsar una tarjeta filtra, pulsarla otra vez quita el filtro; la pulsada y el chip de la barra son la misma verdad | **propia** (`card-group`) |
| [`GDataList`](packages/vue/src/components/GDataList/README.md) | Lista compacta de pares etiqueta-valor | principal |
| [`GCalendar`](packages/vue/src/components/GCalendar/README.md) | Calendario y planificador de recursos: Día, Semana, Mes y Timeline | principal |
| [`GMetric`](packages/vue/src/components/GMetric/README.md), [`GProgress`](packages/vue/src/components/GProgress/README.md) | Valor con tendencia y barra de progreso | principal |
| [`GBadge`](packages/vue/src/components/GBadge/README.md) | Insignia no interactiva, anclable | principal |
| [`GPrice`](packages/vue/src/components/GPrice/README.md), `GPriceScope` | Precio que dice su moneda (el nombre en la lectura, el código solo si el símbolo es ambiguo), con región de moneda, referencia nombrada y total de lo pedido; `formatPrice` para texto llano | **propia** (`price`) |
| [`GSummary`](packages/vue/src/components/GSummary/README.md) | Ficha de resumen adaptable de una entidad | principal |
| [`GAvatar`](packages/vue/src/components/GAvatar/README.md), [`GAvatarMotion`](packages/vue/src/components/GAvatarMotion/README.md) | Cara de una persona o entidad; avatar ilustrado que responde a estados | principal |
| [`GTag`](packages/vue/src/components/GTag/README.md), `GTagGroup` | Etiquetas de un conjunto: estáticas, enlace, alternar o quitables; al quitar queda una huella con «Deshacer» en el sitio; racimos por faceta | **propia** (`tag`) |

### Superficies y composición

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GSurface`](packages/vue/src/components/GSurface/README.md) | Superficie visual genérica en cinco niveles | principal |
| [`GCard`](packages/vue/src/components/GCard/README.md) | Tarjeta con regiones opcionales (compone `GSurface`) | principal |
| [`GGallery`](packages/vue/src/components/GGallery/README.md), `GGalleryViewer` | Fotos de un lugar por espacios (índice que salta) o en tira, con visor ampliable, teclado y gestos | **propia** (`gallery`) |
| [`GAccordion`](packages/vue/src/components/GAccordion/README.md), `GAccordionItem` | Secciones plegables con avance de la primera línea; el encabezado que tocas no se mueve; lo plegado se busca, se enlaza y se imprime; `sticky` opcional | principal |
| [`GDialog`](packages/vue/src/components/GDialog/README.md) | Diálogo modal: simple, con pie, formulario, pantalla completa | principal |
| [`GDivider`](packages/vue/src/components/GDivider/README.md) | Línea de separación, horizontal o vertical | principal |
| [`GAdaptiveLayout`](packages/vue/src/components/GAdaptiveLayout/README.md) | Reparte a sus hijos según lo que necesitan, sin filas ni columnas | principal |
| [`GIcon`](packages/vue/src/components/GIcon/README.md) | Icono de Lucide: `1em`, `currentColor`, decorativo o con nombre | principal |

### Paneles

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GWidget`](packages/vue/src/components/GWidget/README.md) | Carcasa de un widget de panel con estados | principal |
| [`GWidgetGrid`](packages/vue/src/components/GWidgetGrid/README.md) | Rejilla de widgets, reordenable con puntero y teclado | principal |
| [`GWidgetGallery`](packages/vue/src/components/GWidgetGallery/README.md) | Galería para añadir widgets | principal |
| [`GWidgetConfig`](packages/vue/src/components/GWidgetConfig/README.md) | Panel de configuración de un widget con vista previa en vivo | principal |

### Avisos y estado

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GToast`](packages/vue/src/components/GToast/README.md) (`createToaster`, `useToast`, `GToaster`) | Avisos breves y no modales, como servicio | principal |
| [`GStatusIsland`](packages/vue/src/components/GStatusIsland/README.md), [`GStatusMark`](packages/vue/src/components/GStatusMark/README.md), [`GStatus`](packages/vue/src/components/GStatus/README.md) | Isla de estado: aviso persistente de la aplicación | **propia** (`status`) |
| [`GEmpty`](packages/vue/src/components/GEmpty/README.md) | El vacío con causa (`none`, `filtered`, `error`, `forbidden`): del tamaño de un elemento, dice por qué y cómo salir; por filtro, cuántas había y cuántas vuelven al quitar cada uno | principal |
| [`GLoadRegion`](packages/vue/src/components/GLoadRegion/README.md) | La región cuyo contenido llega tarde: tu plantilla sin tinta como molde que recibe la tinta en su sitio, lo último conocido al refrescar, nada antes de 200 ms, anuncios y foco que no se pierde | **propia** (`load-region`) |

### Captura de voz

| Componente | Qué es | Entrada |
| --- | --- | --- |
| [`GSpeechHost`](packages/vue/src/components/GSpeechHost/README.md) (`createSpeech`, `useSpeech`) | Captura y transcripción como servicio; el motor es un adaptador de tu aplicación, sin red en Grana | **propia** (`speech`) |
| [`GSpeechPill`](packages/vue/src/components/GSpeechPill/README.md), [`GSpeechTrigger`](packages/vue/src/components/GSpeechTrigger/README.md) | Pill colocable y disparador de dictado | **propia** (`speech`) |
| [`GTranscript`](packages/vue/src/components/GTranscript/README.md) | Vista de revisión del transcript: rejilla editable con hablantes | **propia** (`speech`) |

## Accesibilidad

Los mínimos **no son tema**: ningún tema puede bajarlos, y [`@grana/cli`](packages/cli/README.md) rechaza el que lo intente (en claro y en oscuro).

| Regla | Valor |
| --- | --- |
| Área táctil | ≥ 24 px; ≥ 44 px con `pointer: coarse`, sin importar la densidad |
| Texto | ≥ 12 px |
| Contraste de texto | ≥ 4.5:1 |
| Contraste de controles | ≥ 3:1 |
| Foco | Siempre visible (≥ 2 px) |
| Controles marcados con relleno de familia | Contorno `{familia}-text` para llegar a 3:1 contra la superficie (WCAG 1.4.11; mínimo medido 4,07:1) |

Además: avisos de desarrollo cuando falta un nombre accesible, movimiento con un patrón único de `prefers-reduced-motion`, textos sin valor por defecto (Grana es internacional: tú pones el idioma) y semántica nativa donde existe (`<dialog>`, radios y casillas nativos, `<hr>`). Detalle y cifras por componente en cada README; reglas en [`docs/contract/tokens.md` §7](docs/contract/tokens.md).

**Lo que no está verificado en entorno real:** lectores de pantalla (VoiceOver, NVDA y otros), Safari real (WebKit se prueba con el motor de Playwright, que no es Safari con su sistema), dispositivos táctiles y móviles reales, `forced-colors` real en Windows, zoom real al 200 y 400 %, IME y teclado virtual. Algunos componentes tienen **límites documentados** (por ejemplo, el tramo hecho de `GStepper` contra el pendiente no llega a 3:1, y `GTimeField` no puede hacer llegar la franja del día en palabras al lector en Chromium): están en su README y en [`PENDIENTES.md`](PENDIENTES.md).

## Navegadores y SSR

**Probado:** Chromium, Firefox y WebKit, con Playwright, en las auditorías de los componentes. Última pasada completa: **1380 pruebas de navegador pasan, 57 se omiten por diseño y ninguna falla** (tres motores), más **2792 pruebas unitarias** de `@grana/vue` y **141** de `@grana/cli`. Algunas pruebas largas de WebKit y Firefox son intermitentes con la máquina cargada y pasan solas (lista en [`PENDIENTES.md`](PENDIENTES.md)).

**Sin matriz de versiones mínimas todavía.** Los componentes usan APIs recientes (`popover`, `inert`, capas CSS `@layer`, `:has()`, `ResizeObserver`); no se ha fijado ni medido una versión mínima de cada navegador.

**SSR:** el paquete no toca `document` ni `window` al importarse ni al crear los servicios (`createToaster`, `createSpeech`, `createStatus`, `createIcons`), y los registros son por aplicación, sin globals de módulo. Una veintena de archivos de pruebas comprueban el HTML con `renderToString` (por ejemplo `inert` y `disabled` según props, y el diseño que se pinta antes de medir: los componentes que miden su ancho se renderizan en su variante base y se corrigen al montar). **No se ha probado con Nuxt ni con una hidratación real**; si te importa, pruébalo en tu aplicación.

## Personalidad

Grana no quiere ser «otro framework genérico». Cada componente debe aportar **comportamiento, movimiento o forma propios**, no copiar el patrón común, y esa idea se decide con el usuario antes de construirse. Algunos ejemplos que ya están hechos:

- `GTooltip`: la etiqueta cuelga del control por una pestaña de su ancho y, en un grupo, viaja de un control al siguiente.
- `GTimeField`: se escribe la hora como se dice («930», «9 noche») y vuelve escrita en palabras.
- `GCombobox` con `multiple`: lo elegido se lee como una frase en la línea del campo, sin que el campo crezca.
- `GDialog`: nace desde el botón que lo abrió. `GBtn`: rebote sutil al soltar. `GTabs`: la marca se estira, con el borde que avanza llegando primero.
- La isla de estado: un aviso persistente que cambia de forma en lugar de ser una caja.

Todo con tokens, `prefers-reduced-motion` y contraste intactos: **la innovación nunca sacrifica accesibilidad, rendimiento ni el contrato de tokens.** Las decisiones de cada una están en [`DECISIONS.md`](DECISIONS.md) y en la sección «Personalidad» de los README.

## Probarlo en este repositorio

```bash
npm install
npm run build          # vite build de cada entrada + fuentes
npm test               # vitest en @grana/vue y @grana/cli
python3 -m http.server 4173 -d packages/vue   # playground: http://localhost:4173/playground/
```

Requiere Node ≥ 22 (`.nvmrc`). Para las pruebas de navegador y el resto del flujo de trabajo, ver [`CONTRIBUTING.md`](CONTRIBUTING.md).

## Estructura

| Ruta | Contenido |
| --- | --- |
| `packages/vue/` | `@grana/vue`: componentes, capas CSS y plugin de Vue |
| `packages/cli/` | `@grana/cli`: genera `tokens.css` desde el tema (claro y oscuro), valida los mínimos de accesibilidad y trae el plugin de Vite |
| `docs/contract/` | Contrato de tokens, API compartida de props e iconos |
| `design/` | Entregas por componente: prototipos (`design/lab/`) y contratos (`design/contracts/`) |
| `plans/` | Planes de movimiento ejecutados |
| `AGENTS.md`, `CLAUDE.md` | Reparto de responsabilidades y contexto del proyecto |
| `DECISIONS.md` | Registro de decisiones y su porqué |
| `PENDIENTES.md` | Lo aplazado, con su origen y su dueño |

## Contribuir

Las contribuciones son bienvenidas: errores, propuestas de componente, documentación. Empieza por [`CONTRIBUTING.md`](CONTRIBUTING.md). Para reportar una vulnerabilidad, ver [`SECURITY.md`](SECURITY.md). Participar implica respetar el [Código de conducta](CODE_OF_CONDUCT.md). Los cambios entre versiones se registran en [`CHANGELOG.md`](CHANGELOG.md).

## Licencia

[MIT](LICENSE). Los iconos son de Lucide (licencia ISC; aviso en [`packages/vue/THIRD-PARTY-NOTICES.md`](packages/vue/THIRD-PARTY-NOTICES.md)). La fuente por defecto, Instrument Sans, es de licencia SIL OFL.
