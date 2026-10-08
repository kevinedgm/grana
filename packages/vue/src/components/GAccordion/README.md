# GAccordion

Secciones plegables de contenido: preguntas frecuentes, paneles de detalles, ajustes que se aplican al momento. `GAccordion` es el **grupo** y `GAccordionItem` su **elemento**; el elemento también se usa **suelto**, sin grupo, como una sección plegable de una pieza («Ver condiciones»). No tiene cajas: el encabezado cerrado **enseña la primera línea de la respuesta** y, al abrir, esa línea no se mueve y el resto se desenrolla debajo. Lo plegado **se encuentra** con Ctrl+F, **se enlaza** con `#id` y **se imprime** abierto. El componente no tiene textos propios (no hay `labels`): título, dato corto y avance son tuyos.

**Etiquetas:** `<g-accordion>` y `<g-accordion-item>` · **Estado:** `candidate` (auditoría de coco aprobada, sin defectos bloqueantes; ver [`design/lab/accordion/auditoria.md`](../../../../../design/lab/accordion/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** principal, `@grana/vue`

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GAccordion`, `#sec-accordion`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual.

## Instalación: paquete principal

Los dos componentes viajan en `@grana/vue`: los exporta y los registra su `install`. Importados solos (`import { GAccordion, GAccordionItem } from '@grana/vue'`), están marcados como puros y quien no los usa no los carga.

```js
import { createApp } from 'vue'
import Grana, { GAccordion, GAccordionItem } from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')    // registra <g-accordion> y <g-accordion-item>
// o, sin plugin: components: { GAccordion, GAccordionItem }
```

Sin empaquetador, quedan registrados al cargar `dist/grana.umd.js` (global `Grana`) y hacer `app.use(Grana)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-accordion-item ...></g-accordion-item>`.

**Peso (DECISIONS #476).** El tope para ir en el principal era de 8 KB gzip. bruno anotó el 2026-10-08 en `GAccordion.meta.json` **+5,7 KB gzip** en `grana.js` (184 424 → 190 270 B), +5,0 KB en `grana.umd.js` y +1,5 KB en `grana.css`, medido en el mismo árbol, con el motor de plegado compartido (`utils/collapse.js`, interno, sacado de `GFormSection`) incluido. No se remidió al documentar.

## Qué lo hace distinto

Forma **A «Avance»**, elegida por el usuario el 2026-10-07 mirando los prototipos de kiwi (`design/lab/accordion/r01/`, DECISIONS #475), con el **encabezado pegado** de B como opción (`sticky`). B «Hilo» y C «Índice» quedan reservados.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Avance: la línea que no se mueve** | Con `peek`, debajo de la pregunta cerrada va una línea de la respuesta, en `text-muted`. Al abrir, la primera línea del contenido nace **exactamente sobre el avance** (mismo texto, mismo sitio) y el resto se desenrolla debajo; el contenido pasa de `text-muted` a `text` mientras se abre. **Al plegar, la línea no desaparece**: el avance vuelve en el acto, por debajo del contenido que se funde | Se empieza a leer la respuesta cerrada y se sigue leyendo sin que el ojo busque otra vez. En ajustes, el estado se ve sin abrir nada |
| **El encabezado que tocas no se mueve (Δ0)** | Al abrir o plegar con el usuario, el componente compensa el desplazamiento del contenedor (y, si este llega a su tope, del siguiente hacia fuera, hasta el documento) para que el encabezado tocado se quede donde estaba, también en `exclusive` | El segundo toque cae donde miraba. Es un rasgo de la pieza, no una opción |
| **Lo plegado se encuentra, se enlaza y se imprime** | El contenido plegado es `hidden="until-found"`: Ctrl+F, `#:~:text=` y un `#id` de dentro lo abren; un `#id` del elemento lo abre al cargar y en `hashchange`; la impresión lo saca todo abierto | Un acordeón que esconde el contenido de la búsqueda de la página y de la impresión es una trampa |
| **`sticky`** (opcional) | El encabezado del elemento abierto se queda pegado arriba mientras se lee su contenido, con el fondo opaco de la superficie en que está; la línea fina y la sombra mínima aparecen **solo mientras está pegado de verdad**. Cerrar desde el encabezado pegado es instantáneo y no te manda al final de lo que leías | Se sabe en qué sección se está en una respuesta larga |
| **El chevron se asoma** | Con puntero fino, el chevron baja (cerrado) o sube (abierto) media unidad hacia donde irá, también al pasar por el avance. Con movimiento reducido, solo cambia el color | Anticipa la dirección sin pintar una caja de «hover» |

Sin muelle ni rebote (es un panel, DECISIONS #299). **Con `prefers-reduced-motion: reduce`** no hay altura que se mueva ni giro: solo fundido del contenido y del avance; el panel asienta plegado igual. Nada se anima al montar.

## Uso

### Preguntas frecuentes: `v-model` y avance

```vue
<script setup>
import { ref } from 'vue'
const abiertos = ref([])   // arreglo de los `value` abiertos
</script>

<template>
  <g-accordion v-model="abiertos">
    <g-accordion-item
      id="faq-pago" value="pago" title="¿Cómo puedo pagar?"
      peek="Aceptamos tarjeta, transferencia y pago en la primera cita.">
      <p>Aceptamos tarjeta, transferencia y pago en la primera cita.</p>
      <p>Si prefieres otra forma de pago, escríbenos antes de reservar.</p>
    </g-accordion-item>

    <g-accordion-item
      id="faq-cancelar" value="cancelar" title="¿Puedo cancelar?"
      meta="Hasta 24 h antes"
      peek="Sí, sin costo hasta 24 horas antes de la cita.">
      <p>Sí, sin costo hasta 24 horas antes de la cita.</p>
    </g-accordion-item>
  </g-accordion>
</template>
```

**Receta del avance:** escribe en `peek` **el mismo texto que el primer párrafo de la respuesta**; así, al abrir, la línea no cambia de contenido, solo se le quitan los puntos suspensivos. El avance lo escribe tu aplicación (no hay `peek="auto"`) y debe ser una línea con sentido; no admite nada interactivo (aviso 7). El `id` del elemento es el ancla: `<a href="#faq-pago">` lo abre y lo trae a la vista.

### Uno a la vez: `exclusive`

```vue
<g-accordion v-model="abierto" exclusive>
  <g-accordion-item value="envio" title="Envío">…</g-accordion-item>
  <g-accordion-item value="devolucion" title="Devoluciones">…</g-accordion-item>
</g-accordion>
```

Con `exclusive` el modelo tiene 0 o 1 valores y **todo cerrado es válido** (el abierto se puede cerrar). Abrir otro cierra el que estaba. El encabezado que tocas se queda quieto aunque el de arriba se pliegue (Δ0).

### Ajustes: el avance sigue al estado, acciones fuera del botón

```vue
<g-accordion>
  <g-accordion-item id="set-notif" value="notif" title="Notificaciones" :meta="`${activas} activas`" :peek="resumen">
    <template #actions>
      <g-btn size="sm" variant="ghost" color="neutral" @click="restablecer">Restablecer</g-btn>
    </template>
    <g-switch v-model="correo" label="Correo"></g-switch>
    <g-switch v-model="push" label="Notificaciones push"></g-switch>
  </g-accordion-item>
</g-accordion>
```

`resumen` y `activas` los recalcula tu aplicación al tocar los interruptores de dentro. El slot `actions` va **fuera del encabezado** `hN` (nunca dentro del botón), en la misma fila que el título.

### Un elemento suelto: `v-model:open`

```vue
<g-accordion-item v-model:open="verCondiciones" title="Ver condiciones">
  <p>La reserva se confirma con el primer pago…</p>
</g-accordion-item>
```

Suelto, el elemento es una sección plegable de una pieza: sin separador de grupo, sin flechas, con `role="region"` siempre. `open` solo vale suelto; dentro de un grupo se ignora (aviso 5).

### Contenido costoso: `lazy`

```vue
<g-accordion-item value="historial" title="Historial" lazy>
  <MiTablaPesada />
</g-accordion-item>
```

El contenido se monta al abrir por primera vez (por cualquier vía) y **no se desmonta al cerrar**. Sin abrir, no se encuentra con Ctrl+F, no se imprime, un `#id` de dentro no existe y no recibe la petición de abrir de `GForm`.

### Título y avance con contenido propio

```vue
<g-accordion-item value="plan" peek="Plan Pro · 3 usuarios">
  <template #title="{ open }">Plan <strong>Pro</strong></template>
  <template #meta>Renueva el 1 de marzo</template>
  …
</g-accordion-item>
```

`title`, `meta` y `peek` tienen slot con `{ open }`. Los slots `title` y `meta` van **dentro del botón**: sin controles ni enlaces (aviso 6). El nombre accesible del botón es `title` + `meta`.

### Encabezado pegado: `sticky`

```vue
<g-accordion v-model="abiertos" sticky>…</g-accordion>
```

El encabezado de un elemento abierto se queda arriba mientras se lee. Si tu página tiene una **cabecera fija**, hace falta la receta de la sección siguiente.

## Receta de la cabecera fija (DECISIONS #515, receta b)

La cabecera fija de tu aplicación es **de tu aplicación**: Tab, un `#id`, `scrollIntoView` y la búsqueda de la página respetan el `scroll-padding-block-start` del contenedor de desplazamiento. El componente **no** pone `scroll-margin-block-start` ni en el botón ni en la raíz del elemento (si lo hiciera, la cabecera se contaría dos veces: medido, un `#id` llegaba a 96 px bajo una cabecera de 48). Pon la **misma altura una sola vez** en las dos propiedades:

```css
:root {
  --app-header: 56px;                                /* el alto de tu cabecera fija */
  --g-accordion-sticky-top: var(--app-header);       /* dónde se pega el encabezado del acordeón sticky */
  scroll-padding-block-start: var(--app-header);     /* dónde llegan los #id, el foco y Ctrl+F */
}
```

- `--g-accordion-sticky-top` es una **propiedad pública de entrada**, no un token del tema: solo la distancia de pegado. Se registra con `@property` (longitud, hereda, `0px`), así que vale ponerla una vez en `:root`, en un contenedor o en el grupo.
- Sin `sticky`, basta el `scroll-padding` (como para cualquier ancla de tu aplicación).
- **Sin esta receta**, un `#id` o el foco pueden quedar **bajo tu cabecera**: es su cabecera. Medido sin ella: el botón de un `#id` queda a 0 px del borde; con la receta, a 48 px de una cabecera de 48.
- Dentro de un contenedor propio con desplazamiento, pon las dos propiedades en ese contenedor.
- **Dentro de un `GDialog`** (`.g-dialog__body`), `--g-accordion-sticky-top` vale `0` (el cuerpo es otro contenedor de desplazamiento y tu cabecera no lo tapa). Si tu diálogo tiene su propia cabecera dentro del cuerpo, vuelve a ponerla en el grupo.
- Si el encabezado pegado queda dentro de un contenedor tuyo con fondo propio, pon el `background` de `.g-accordion-item__heading` **y** de `.g-accordion-item__actions` (el fondo opaco por defecto es el de las anfitrionas de Grana: `GCard`, `GSurface`, `GDialog`, panel de `GTabs contained`, o `--g-color-bg`).

## Receta de capas (DECISIONS #516)

El CSS de Grana va en la capa `grana.components`; el tuyo, sin capa, **gana siempre**. Eso incluye un estilo de **elemento** tuyo: con `h3 { margin: 28px 0 }` sin capa, el encabezado del acordeón (que es un `<h3>`) **baja 28 px dentro de su elemento y se pega 28 px más abajo** (medido en los tres motores). Grana no lo arregla con `!important` ni con `display: contents` (rompería `sticky` y la semántica del encabezado). Declara los estilos de elemento, también un reinicio de terceros, **en una capa anterior a las de Grana**:

```css
@layer base, grana.defaults, grana.components;
@layer base { h1, h2, h3, h4, h5, h6 { margin-block: 1.5em 0.5em; } }
/* un reinicio de terceros: @import url("reset.css") layer(base); */
```

Así tu estilo de elemento pierde frente a `grana.components` y el encabezado conserva su `margin: 0`; tus reglas con clase siguen sin capa y ganando. Alternativa sin capas: `h3:not([class*="g-"])`. Es la regla general de todo componente con su propio `hN` (`GCard`, `GDialog`, `GFormSection`, `GWidget`); [`docs/contract/api.md`](../../../../../docs/contract/api.md) la recoge. **No es un defecto** de un componente.

## Qué es y qué no (fronteras)

| Necesidad | Usar | No usar |
| --- | --- | --- |
| Preguntas frecuentes, detalles secundarios, ajustes agrupados que se aplican al momento | **`GAccordion`** con `GAccordionItem` | `<details>` a mano |
| Una sola sección plegable suelta | **`GAccordionItem`** sin grupo, con `v-model:open` | `GCard` `expandable` (divulga una parte de una tarjeta, sin encabezado propio) |
| Plegar **preguntas de un formulario** | **[`GFormSection`](../GFormSection/README.md) `mode="collapsible"`** | `GAccordion` dentro de `GForm` con campos |
| Campos que dependen de una respuesta | [`GFormReveal`](../GFormReveal/README.md) | `GAccordion` |
| Cambiar entre vistas hermanas donde solo se ve una | [`GTabs`](../GTabs/README.md) | `GAccordion exclusive` como pestañas verticales |
| Submenú de navegación | [`GSidebar`](../GSidebar/README.md) | `GAccordion` en una barra lateral |

**Dentro de `GForm`:** un acordeón funciona (`GForm` pide abrir lo que haga falta antes de enfocar un error), pero si su contenido tiene controles de formulario (`input` que no es `hidden`, `select`, `textarea`), el elemento avisa una vez al montar (**aviso 8**): para plegar campos de un formulario es `GFormSection mode="collapsible"`; aquí los campos no cuentan en el estado de errores por sección.

**Lo que no hace:** no lee ni escribe el fragmento de la URL (para tener el estado en la URL, usa `v-model`), no mueve el foco al abrir, no genera el avance por su cuenta y no lleva textos propios.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Tab / Mayús + Tab | Todo | Pasa por **todos** los encabezados y por lo enfocable de los abiertos (no es *roving*). Lo plegado y asentado no está en el orden (`hidden`); lo que se está cerrando, tampoco (`inert`) |
| Intro / Espacio | Botón del encabezado | Abre o cierra |
| ↓ / ↑ | Botón de un elemento **de este grupo** (`arrows`) | Al encabezado siguiente / anterior, **sin vuelta** al otro extremo; incluye los deshabilitados |
| Inicio / Fin | Ídem | Primer / último encabezado del grupo |

Las flechas solo actúan con el foco **en un botón de un elemento de este grupo** (nunca dentro de un panel ni en un grupo anidado, que resuelve el grupo más cercano) y sin Alt, Ctrl ni ⌘. No cambian en RTL (es el eje de bloque). Un elemento suelto no tiene flechas. `arrows: false` las quita.

**Abrir no mueve el foco.** Plegar con el foco dentro (solo puede pasar por programa) lo lleva antes al botón del elemento, con `preventScroll`; nunca al `body`.

**Deshabilitado:** `aria-disabled="true"` (nunca `disabled` nativo): sigue enfocable y las flechas lo alcanzan (se puede leer el `meta` que explica por qué), pero no abre ni cierra por clic, teclado ni avance. La búsqueda de la página, un `#id` y la petición de abrir de `GForm` **sí** lo abren: quien llega de fuera debe ver el contenido.

## Lo plegado se encuentra, se enlaza y se imprime

| Qué | Comportamiento |
| --- | --- |
| **Ctrl+F, `#:~:text=`** | El contenido plegado y asentado es `hidden="until-found"`; al encontrar texto, el elemento se abre en el acto, sin animar y sin compensación Δ0, y emite. En `exclusive` los otros se cierran también sin animar. Medido con `#:~:text=acta de nacimiento` en los tres motores |
| **`#id` del elemento** | Al montar y en `hashchange`: lo abre sin animar y lo trae a la vista con el encabezado arriba (`scrollIntoView({ block: 'start' })`, que respeta tu `scroll-padding`). **No mueve el foco** ni escribe el fragmento. Si el elemento se montó durante la carga, se trae a la vista otra vez en `load` y, si las fuentes aún no han cargado, tras `document.fonts.ready` si la persona no ha desplazado. Una sola escucha de `hashchange` para todos los elementos |
| **`#id` de dentro** | Lo resuelve el navegador por `beforematch`; el elemento se abre |
| **Impresión** | Todo abierto: sin chevron, avance ni acciones, sin pegar, con el encabezado `break-after: avoid`; el estado y el modelo no cambian. Lo `lazy` sin abrir no sale |
| **Sin `until-found`** | En un navegador que no lo conozca, el atributo cae en `hidden` normal: lo plegado no se encuentra, el resto funciona igual |

## Estados del panel

| Estado | Marcado |
| --- | --- |
| Abierto (y abriéndose) | `is-open`, sin `inert`, contenido sin `hidden` (sale en el mismo parche que entra `is-open`) |
| Cerrándose | `is-animating`, panel `inert` (no se enfoca lo que se va), contenido sin `hidden` |
| Plegado y asentado | contenido `hidden="until-found"`, sin `inert` |

Sin `visibility: hidden` en el panel: con un antepasado así, la búsqueda de la página no encontraría el texto. `is-ready` se pone tras el primer pintado (dos cuadros): lo que ya viene abierto no se anima. `is-instant` (dos cuadros) acompaña a la apertura por búsqueda, `#id` y petición de abrir, y al cierre desde el encabezado pegado.

## Props

### `GAccordion` (grupo)

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `modelValue` | Array | arreglo de los `value` (String \| Number) abiertos | `null` (sin `v-model`, parte de `[]`) |
| `exclusive` | Boolean | | `false` |
| `headingLevel` | Number | `2` `3` `4` `5` `6` | `3` |
| `arrows` | Boolean | | `true` |
| `sticky` | Boolean | | `false` |

- **`modelValue`:** arreglo de los `value` abiertos **en orden del documento**, no de apertura (abrir 3 y luego 1 da `[1, 3]`). **Controlado y no controlado:** estado local que parte de la prop y la sigue; sin `v-model`, el grupo funciona solo. `null`/`undefined` cuentan como `[]` sin aviso; otro valor que no es arreglo, como `[v]` con aviso 1. Los valores sin elemento montado (una lista asíncrona, un `v-if`) se conservan al final, en su orden; abrir con `exclusive` los quita. Para abrir algo al principio sin escuchar: `:model-value="['envio']"`.
- **`exclusive`:** 0 o 1 valores. Si el modelo llega con más de uno (o `exclusive` pasa a `true` con varios abiertos), se abre **solo el primero en orden del documento, sin emitir** (aviso 2; corregir tu modelo es cosa tuya).
- **`headingLevel`:** nivel por defecto de los encabezados de sus elementos; el del elemento gana.
- **Anidar grupos:** un `GAccordion` dentro del contenido de un elemento es otro grupo, con su modelo, sus flechas y su `exclusive`. Un `GAccordionItem` pertenece al grupo más cercano sin otro elemento entre medias: un elemento suelto dentro del contenido de otro no se une al grupo exterior.
- **Atributos** (`class`, `style`, `id`, `data-*`, `aria-*` y escuchas no declaradas) van a la raíz `div`, que **no tiene rol** (APG no lo pone al conjunto).

**No existen en v0.1:** `layout`, `labels`, `disabled` de grupo, `density`, `variant`, `color`, `multiple` (lo contrario de `exclusive`, ya es el defecto).

### `GAccordionItem` (elemento)

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `value` | String \| Number | | `null` (= el `id` efectivo) |
| `id` | String | | `null` (generado con `useId()`) |
| `title` | String | | `null` |
| `meta` | String | | `null` |
| `peek` | String | | `null` |
| `disabled` | Boolean | | `false` |
| `lazy` | Boolean | | `false` |
| `headingLevel` | Number | `2` `3` `4` `5` `6` | `null` (el del grupo; suelto, `3`) |
| `open` | Boolean | | `false` |

- **`value`:** identidad en el modelo del grupo. Sin ella, se usa el `id` efectivo; en un grupo con `v-model`, un elemento sin `value` ni `id` usa un id generado que tu aplicación no conoce (aviso 10). Dos elementos con el mismo `value` se abren y cierran juntos (aviso 3).
- **`id`:** el de la raíz del elemento (el ancla `#id`) y la base de los internos: `{id}-toggle`, `{id}-content`, `{id}-peek`. Repetido en el documento: aviso 9.
- **`title` / `meta`:** el texto del botón. `meta` es un dato corto **no interactivo** dentro del botón, parte del nombre accesible («3 activas», «Disponible tras tu primera cita»); sirve para explicar por qué un elemento está deshabilitado. Sin ninguno de los dos ni sus slots, el botón no tiene nombre (aviso 4).
- **`peek`:** el avance de A. Es `aria-describedby` del botón **solo cerrado**; el clic en él (cerrado, y no si termina una selección de texto) abre como el botón; abierto no se ve ni recibe clics; deshabilitado no abre. Sin rol ni `tabindex`.
- **`lazy`:** ver arriba.
- **`open`:** solo suelto, `v-model:open`, controlado y no controlado. Dentro de un grupo se ignora (aviso 5). Un elemento `disabled` y abierto a la vez se pinta abierto y no se puede cerrar desde el botón; tu aplicación lo cierra con el modelo.

**No existen en v0.1:** `icon` ni slot `lead` (reservados), `variant`, `color`, `size`, `density`, `summary` (es `peek`), `description`.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:modelValue` (grupo) | `Array`: copia nueva, en orden del documento | Cada vez que cambia lo abierto por el usuario (clic, Intro, Espacio, clic en el avance), por la búsqueda de la página (`beforematch`), por un `#id` y por la petición de abrir de `GForm`. **No** cuando el cambio llega desde `modelValue` |
| `update:open` (elemento) | `Boolean` | **Solo suelto**, en los mismos casos. Dentro de un grupo no se emite: el origen es uno solo, el modelo del grupo |

**Métodos expuestos:** ninguno.

## Slots

### `GAccordion`

| Slot | Propósito |
| --- | --- |
| por defecto | Los `GAccordionItem`, directos o dentro de `v-for`/`<template>`. Un envoltorio de tu aplicación entre medias funciona, pero el CSS de los separadores puede no alcanzarlo |

### `GAccordionItem`

| Slot | Alcance | Dónde | Propósito |
| --- | --- | --- | --- |
| `title` | `{ open }` | Dentro del botón | Título (sin interactivos, aviso 6) |
| `meta` | `{ open }` | Dentro del botón | Dato corto (sin interactivos, aviso 6) |
| `peek` | `{ open }` | Debajo del encabezado, fuera del botón | Avance: texto en línea; con slot, tú garantizas una línea con sentido (sin interactivos, aviso 7) |
| `actions` | `{ open }` | En la fila del encabezado, **fuera** del `hN` | Acciones («Restablecer»): `GBtn` u otros controles |
| por defecto | — | Contenido | Lo que se pliega |

## Idioma y dirección

- `dir="auto"` en el título, el `meta` y el avance.
- **RTL:** propiedades lógicas; el chevron se espeja y abierto gira −90°; el chevron queda al final lógico; título y avance al inicio. Medido en `ar`: ↓ va al siguiente encabezado.
- **Sin textos propios** (DECISIONS #226): todo es tuyo.

## Accesibilidad

```html
<div class="g-accordion-item is-ready has-peek" id="faq-pago">   <!-- cerrado, con avance -->
  <h3 class="g-accordion-item__heading">
    <button type="button" class="g-accordion-item__toggle" id="faq-pago-toggle"
            aria-expanded="false" aria-controls="faq-pago-content" aria-describedby="faq-pago-peek">
      <span class="g-accordion-item__title" dir="auto">¿Cómo puedo pagar?</span>
      <span class="g-accordion-item__chevron" aria-hidden="true">…</span>
    </button>
  </h3>
  <div class="g-accordion-item__peek" id="faq-pago-peek" dir="auto">Aceptamos tarjeta…</div>
  <div class="g-accordion-item__panel">
    <div class="g-accordion-item__content" id="faq-pago-content"
         role="region" aria-labelledby="faq-pago-toggle" hidden="until-found">
      <div class="g-accordion-item__body">…</div>
    </div>
  </div>
</div>
```

- **APG *Accordion*:** `hN > button[aria-expanded][aria-controls]` por elemento (suelto, APG *Disclosure* con encabezado). Sin `<details>`. **Sin rol en el grupo.** Nada interactivo dentro del botón: sus hijos son presentacionales.
- **`role="region"` con `aria-labelledby` → botón**, en el contenido (no en el panel animado), **automático**: con `exclusive` o con **6 o menos** elementos; con **7 o más** que pueden estar abiertos a la vez, sin rol (para no proliferar regiones, APG). Suelto: siempre región. No hay prop para forzarlo. Se cuenta en el render del grupo, así que sale igual en el servidor y en el cliente.
- **`aria-describedby` del botón → avance, solo cerrado y con avance.** El lector recibe el texto entero (el recorte a una línea es solo de pintura).
- **`aria-disabled`**, nunca `disabled`: el botón sigue en el orden de Tab.
- **Encabezado visible en el árbol:** el nivel (`headingLevel`) permite la navegación por encabezados; elige el que corresponde a tu página.
- **Chevron decorativo** (`aria-hidden`), `chevron-right` de Lucide, gira a abajo abierto.
- **Foco:** anillo `--g-color-focus` **hacia dentro** (no lo recorta un contenedor y no pisa la letra; sangría de 4 px con el tema por defecto).
- **Áreas:** el botón mide **≥ 44 px de alto** con cualquier puntero (medido 48 con el tema por defecto, 57 con el de la auditoría y 44 con `space` 3, también a 320 px). Texto ≥ 12 px (mínimo medido 14 px).
- **Foco no tapado (2.4.11) con `sticky`:** lo enfocable del contenido y un `#id` de dentro llevan un margen de desplazamiento igual al alto del encabezado pegado; en WebKit, que no desplaza un control que ya asoma bajo el pegado, el componente lo trae a la vista en `focusin`.
- **Reflujo:** a 320 px, sin desplazamiento horizontal; el `meta` no parte palabras; las acciones ocupan como mucho un tercio de la fila (salvo su botón más ancho).

**Contraste medido** (auditoría, 28 configuraciones por motor: tema por defecto, el de la auditoría, el propio del estilo y los once de Dark Color Presence, claro y oscuro; mismas cifras en los tres motores):

| Pieza | Mínimo en las 28 | Exigido |
| --- | --- | --- |
| Título y contenido (`text`) | **16,43:1** | 4,5 |
| Título sobre las anfitrionas (`GCard`, `GSurface` sunken / inset / flat, panel de `GTabs`) | **15,19:1** | 4,5 |
| `meta`, avance (`text-muted`) | **7,38:1** | 4,5 |
| Título deshabilitado (`text-subtle`) | **5,05:1** | 4,5 |
| Chevron | **7,38:1** | 3 |
| Anillo de foco | **4,52:1** | 3 |

El separador es decorativo (la estructura la dan el encabezado y el botón).

**`forced-colors`** (emulado en Chromium; tema por defecto y el de la auditoría oscuro): chevron en `ButtonText`, deshabilitado en `GrayText`, separador y fondo pegado opacos, anillo sólido.

## Cifras medidas

Sobre el componente real publicado (`dist/grana.umd.js` + `dist/grana.css` + `dist/fonts.css`), con un tema generado por `@grana/cli` distinto al por defecto (texto de 19 px, `space` 5, Georgia, `radius` 12), en Chromium, Firefox y WebKit:

| Qué | Resultado |
| --- | --- |
| **La línea que no se mueve (A2)** | Δ **0,00 px** entre la línea del avance y la primera del contenido al abrir y al plegar, en los tres; primera línea entera antes de la mitad del fundido; presencia mínima de la línea **0,92** (Chromium, WebKit) y **0,97** (Firefox) |
| **Δ0, encabezado tocado** | 0,00 px al abrir y plegar |
| **Δ0 en `exclusive`** (se cierra el de arriba) | 0,38 / 0,47 / 0,95 px (Chromium / Firefox / WebKit); hacia arriba 0,00 px |
| **Δ0 en cadena** (el contenedor está arriba del todo y el documento compensa 360 px) | 0,47 / 0,40 / 0,92 px; el contenedor sigue en 0 |
| **Δ0 y rueda** | Una rueda durante el movimiento cancela la compensación |
| **`#id` al cargar**, con la receta (`scroll-padding` de 48 px) | Botón a 48 px (Chromium 47,7 · Firefox 47,7 · WebKit 48,0); sin receta, 0 px |
| **`#id` reaplicado en `load`** (imagen de 200 px que llega 700 ms tarde) | Con receta, 47,7 / 47,7 / 48,3 px |
| **Encabezado pegado** | A 48 px bajo una cabecera de 48, con el mismo alto y el fondo opaco de la página en la anfitriona; sin `scroll-margin` en el botón; `#p2-deep` justo bajo el pegado (hueco −0,3 / −0,3 / 0,0 px) |
| **Cerrar desde el pegado** | Instantáneo, Δ 0,00 px, asienta `until-found` |
| **Mayús + Tab bajo el pegado** | Un control que asomaba a 83,7 / 84 px queda a 95,7 / 96 px, con el encabezado acabando en 96; entero a la vista en los tres |
| **`GDialog` / `GDialog inset` con `sticky`** | Pegado al borde del cuerpo (Δ ≤ 1 px); `--g-accordion-sticky-top` a 0; `--_scroll-pad` = relleno del cuerpo; fondo `surface-shell` / `surface-inset` |
| **Impresión** (emulada) | 0 contenidos de alto 0; todo en `text` |
| **Tras la extracción del motor** | `GFormSection` plegable, en el banco, abre y pliega animando y asienta; `GFormSection.css` y sus pruebas, sin cambios |

## Movimiento

| Qué | Sin preferencia | Con `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| Altura (rejilla `0fr → 1fr` del panel) | `--g-duration-slow` + `--g-ease-out` | Sin movimiento: abrir pone el alto final en el primer cuadro; plegar conserva el alto mientras se funde y luego desaparece de una vez |
| Contenido | — | Fundido del panel en `--g-duration-fast` lineal |
| Color del contenido con avance | `text-muted → text` en `slow` lineal | Igual, en `fast` |
| Avance al abrir | Opacidad en `fast` lineal con retraso de `fast / 3` | Fundido en `fast` |
| Avance al plegar | Vuelve en el acto, debajo de la primera línea del contenido | Fundido en `fast`, debajo del panel que se funde |
| Chevron | Giro en `fast` + `ease-out` | Sin transición |
| Chevron al pasar | Color e inclinación `±space-1 × 0,5` | Solo el color |
| Línea de la fila al pasar | `fast` + `ease-standard` | Igual |
| Línea que se despega | Opacidad en `fast` | Igual |

Nada supera 240 ms. `:hover` solo bajo `(hover: hover)`.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_*`). **No define tokens nuevos** (DECISIONS #485), no usa valores de respaldo ni colores literales. Según la auditoría, en `GAccordion.css` solo hay literales de `44px` y el `0px` de `@property`; ninguna `@layer`, `!important`, curva propia, muelle ni `@keyframes`; y ningún selector toma hijos de tu aplicación por estructura sin ignorar `.g-tooltip` (DECISIONS #383).

| Token | Para qué |
| --- | --- |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Título y contenido; avance, `meta` y chevron; título deshabilitado |
| `--g-color-border`, `--g-color-border-strong`, `--g-border-width` | Separador entre elementos (al pasar, `border-strong`) |
| `--g-color-bg`, `--g-color-surface`, `--g-color-surface-sunken`, `--g-surface-shell`, `--g-surface-inset`, `--g-tabs-panel` | Fondo opaco del encabezado pegado: el de la anfitriona más cercana o `--g-color-bg` |
| `--g-shadow-1` | Sombra mínima del encabezado pegado |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-radius-xs` | Anillo de foco |
| `--g-space-1` a `--g-space-4` | Rellenos, separaciones y la inclinación del chevron |
| `--g-font-title`, `--g-text-title-sm-{size,line,weight,tracking}` | Título |
| `--g-font-ui`, `--g-text-body-{size,line,weight,tracking}`, `--g-text-body-sm-{size,line,weight,tracking}` | Avance y contenido; `meta` |
| `--g-duration-fast`, `--g-duration-slow`, `--g-ease-out`, `--g-ease-standard` | Movimiento |

**Propiedad pública de entrada (no es del tema): `--g-accordion-sticky-top`** — ver la receta de la cabecera fija.

**Medidas del componente** (de tokens; constantes de diseño, no tokens): sangría de lectura = `--g-focus-width` + `--g-focus-offset` (4 px con el tema por defecto); inclinación del chevron `--g-space-1 × 0,5`; botón mínimo `44px`.

## SSR

Se pinta según el modelo: plegado con `hidden="until-found"` desde el primer HTML (la búsqueda funciona antes de hidratar), abierto sin él; sin `inert`, sin `is-ready`, sin leer el fragmento, sin acceder a `window` ni a `document` fuera de `onMounted`. `GAccordion.ssr.test.js` lo comprueba con `renderToString` (5 pruebas). **Límite:** si tu servidor serializara `hidden` como booleano, lo plegado no se encontraría hasta hidratar (el componente lo corrige al montar).

## Avisos de desarrollo

Prefijos `[Grana GAccordion]` y `[Grana GAccordionItem]`; una vez por instancia y motivo; solo fuera de producción. Ninguno cambia el comportamiento.

| # | Dónde | Causa |
| --- | --- | --- |
| 1 | Grupo | `modelValue` que no es arreglo (ni `null`/`undefined`): se trata como `[v]` |
| 2 | Grupo | `exclusive` con más de un valor abierto: solo se abre el primero en orden del documento (sin emitir) |
| 3 | Grupo | Dos elementos del grupo con el mismo `value` |
| 4 | Elemento | Sin `title`, slot `title`, `meta` ni slot `meta`: el botón no tiene nombre |
| 5 | Elemento | `open` u `onUpdate:open` dentro de un grupo: se ignora |
| 6 | Elemento | Algo interactivo en `title` o `meta` (al pintarse) |
| 7 | Elemento | Algo interactivo en el avance |
| 8 | Elemento | Dentro de un `GForm`, con controles de formulario en su contenido (al montar y al montarse un `lazy`) |
| 9 | Elemento | Su `id` está repetido en el documento |
| 10 | Elemento | En un grupo con `v-model`, sin `value` ni `id` |

## Clases

- **Grupo:** `g-accordion`, `g-accordion--exclusive`, `g-accordion--sticky`. En un grupo `sticky` dentro de un contenedor de desplazamiento con relleno de inicio, el único estilo en línea es `--_scroll-pad`.
- **Elemento (raíz):** `g-accordion-item`, `is-open`, `is-animating`, `is-instant`, `is-ready`, `is-disabled`, `is-standalone`, `has-peek`, `has-actions`.
- **Partes:** `__heading`, `__toggle`, `__title`, `__meta`, `__chevron`, `__actions`, `__peek`, `__panel`, `__content`, `__body`.
- **Dato en línea:** `--_head-size` (px) en la raíz de un elemento abierto de un grupo `sticky`: el alto de maquetación del encabezado, que el CSS usa para el margen de desplazamiento del contenido.
- **Interno:** los datos del `.vue` al CSS no son API.

## Limitaciones conocidas

- **`sticky` anidado no está cubierto.** Un grupo `sticky` dentro del contenido de otro `sticky` se pega a la misma distancia y el de dentro tapa al de fuera. No anides grupos `sticky`.
- **Las acciones no bajan de línea en estrecho.** Se quedan en la línea del título también a 320 px (caben dos acciones y un título de palabras normales). Si necesitas que bajen, es una ronda futura (una clase medida por el `.vue`, como en `GFormSection`); no hay API hoy.
- **Un control de acciones más alto que la línea del título queda bajo el centro.** Con el tema de la auditoría, un `GBtn sm` de 35 px frente a una línea de 32 px queda **1,5 px** por debajo (la mitad del exceso), en los tres motores.
- **Δ0 deshace, durante ≈ 320 ms, un desplazamiento que no llegue por rueda, toque ni teclas de desplazamiento** (DECISIONS #519): arrastrar la barra de desplazamiento (no emite `wheel`) o un `scrollTo` de tu aplicación justo después del clic. Es corto y raro; no se corrige en v0.1.
- **Sin página debajo, cerrar al final recorta el desplazamiento:** Δ0 no puede conservar lo que el navegador ya recortó.
- **La línea que se despega del encabezado pegado solo se ve en Chromium** (consultas `scroll-state`). En Firefox y WebKit el encabezado pegado es opaco y sin línea.
- **Encabezado pegado en un contenedor tuyo con fondo propio:** pon tú el `background` del encabezado y de las acciones.
- **Ajustes con un avance distinto del contenido** (estado frente a interruptores): al abrir, el avance y el primer renglón coinciden en el sitio durante el fundido (≤ 160 ms) y, al plegar, el avance asoma por debajo del contenido que se va. Con el mismo texto (preguntas frecuentes) no se nota.
- **`lazy` sin abrir:** no se encuentra, no se imprime, un `#id` de dentro no existe y no recibe la petición de abrir.
- **El avance puede leerse dos veces en modo exploración** (como descripción del botón y como texto), igual que el resumen de `GFormSection`; sin verificar con lector real.
- **Navegadores sin `hidden="until-found"`:** lo plegado no se encuentra (cae en `hidden`).
- **Dentro de un `GDialog`, `--_head-size` ya no sale corto** (hallazgo 1 de la auditoría). El encabezado pegado medía 1–2 px de menos porque la medida incluía la escala de entrada del diálogo; bruno lo cerró en el commit `4343069` (2026-10-08, DECISIONS #517) midiendo el alto de maquetación, con un caso nuevo en `accordion.spec.mjs` que, según el commit, falla antes y pasa después. **No lo remedí yo** y `design/lab/accordion/auditoria.md` todavía lo lista como abierto: la auditoría es anterior al arreglo.
- **Navegadores:** usa `:has()`, capas CSS, `hidden="until-found"`, `inert` y `ResizeObserver`. No se midió ningún navegador anterior a los tres motores de Playwright (Chromium, Firefox, WebKit).

## Reservado (fuera de v0.1)

- **B «Hilo»** como `layout="thread"` y **C «Índice»** como `layout="index"`.
- Slot **`lead`** del elemento (icono al inicio del título, como `GFormSection`).
- `GSummary` dentro del avance (ajustes).
- Un avance automático (`peek="auto"`): leer el primer párrafo del slot rompería el SSR.

## Verificación

- **Pruebas** (vitest con jsdom): `GAccordion.test.js` y `GAccordion.ssr.test.js`, **73 de 73 en verde al documentar** (ejecutadas de nuevo: 68 + 5 de SSR). Además `src/types.test.js` (los tipos se generan del `meta.json`, DECISIONS #443), que no se ejecutó al documentar.
- **Auditoría de coco** con el componente real y un tema distinto al por defecto (`node design/lab/accordion/auditoria-verificar.mjs`): **1618 de 1618** comprobaciones (estático 27/27, Chromium 533/533, Firefox 529/529, WebKit 529/529), tras el ajuste a la receta (b) de #515 (commit `d042735`; antes del ajuste, 1602/1602). **No se repitió al documentar.** Resultado: sin defecto bloqueante, `candidate`. Hallazgos: 1 (`--_head-size` en `GDialog`; cerrado por bruno después), 2 y 5 (resueltos por #515), 3 (capas, límite general), 4 (acciones más altas que la línea), 6 (Δ0 y desplazamiento ajeno), 7 (registros para lima).
- **Specs de bruno** (`accordion.spec.mjs`, `personalidad-accordion.spec.mjs`): según la auditoría, 27/27 en Chromium con el CSS corregido; en Firefox y WebKit 51/52 con dos workers (el que falló, «cerrar desde el encabezado pegado» en WebKit, pasa 3/3 solo: cuenta de cuadros con carga). **No se corrieron al documentar.**
- **Empaquetado:** según `GAccordion.meta.json`, el componente va en el principal (+5,7 KB gzip); la auditoría comprobó que `dist/grana.css` lleva `GAccordion.css` dentro de `grana.components` y el `@property`, y que `dist/grana.js` lleva el componente. No se repitió al documentar.

## No verificado

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): `region` y su regla, el avance por `aria-describedby` en modo exploración, la navegación por encabezados y `aria-disabled`. Solo se comprobó el marcado y el árbol de accesibilidad.
- **Ctrl+F real:** se midió con `#:~:text=` y anclas, que siguen el mismo algoritmo de revelado.
- **Impresión en papel:** se midió con `emulateMedia('print')`.
- **Táctil real:** `sticky` con la barra del navegador móvil, Δ0 con el dedo y su cancelación con `touchstart`.
- **Safari real.**
- **Texto y página al 200 %.**
- **`forced-colors` real** (Windows): emulado solo en Chromium; no en Firefox ni WebKit.
- **Los specs de formularios** (`form-section`, `form-reveal`, `form-distribution`) en Firefox y WebKit tras la extracción del motor: solo en Chromium (el verificador propio de la auditoría sí cubre `GFormSection` plegable en los tres).
- **Cifras de este README tomadas de otros informes** (peso de bruno, auditoría y estilo de coco) y no remedidas al documentar, salvo las marcadas como «ejecutadas de nuevo» o «al documentar».

## Fuentes

- API: [`GAccordion.meta.json`](./GAccordion.meta.json) y [`GAccordionItem.meta.json`](./GAccordionItem.meta.json) · Contrato: [`design/contracts/accordion.md`](../../../../../design/contracts/accordion.md) (DECISIONS #475 a #488 y remates #515 a #519) · Ronda de kiwi: [`design/lab/accordion/r01/`](../../../../../design/lab/accordion/r01/) · Estilo: [`design/lab/accordion/estilo.md`](../../../../../design/lab/accordion/estilo.md) · Auditoría: [`design/lab/accordion/auditoria.md`](../../../../../design/lab/accordion/auditoria.md) · Estilos de elemento de la aplicación: [`docs/contract/api.md`](../../../../../docs/contract/api.md) (#516) · Frontera: [`GFormSection`](../GFormSection/README.md), [`GFormReveal`](../GFormReveal/README.md), [`GTabs`](../GTabs/README.md), [`GSidebar`](../GSidebar/README.md)
