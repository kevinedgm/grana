# GNavBar

Barra superior de navegación de un sitio: los enlaces a sus secciones con la actual marcada por la ruta, y un sitio para las acciones globales de la aplicación (búsqueda, idioma, tema). En estrecho recoge las acciones en «…» y, en un teléfono, todo en una pantalla de menú. **No busca, no cambia el idioma ni el tema, no lee `location` y no trae color propio**: aloja los controles de tu aplicación y la ruta actual te la das tú.

**Etiqueta:** `<g-nav-bar>` · **Estado:** `candidate` (auditado por coco sobre el sitio construido, ver «Verificación») · **Entrada propia:** `@grana/vue/nav-bar` (global UMD `GranaNavBar`) · **Desde:** 0.1.0

```js
import GranaNavBar from '@grana/vue/nav-bar'   // plugin; también: import { GNavBar } from '@grana/vue/nav-bar'
```

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio. Exige Vue `^3.5.0`.

> **Barra superior de un sitio, no barra inferior de una aplicación.** La barra inferior del teléfono con píldora activa es [`GSidebar`](../GSidebar/README.md) con `mode="navbar"`. En una misma página no se recomiendan las dos: serían dos navegaciones globales.

## En esta página

[§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Teclado y foco](#teclado-y-foco) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import GranaAppShell from '@grana/vue/app-shell'
import GranaNavBar from '@grana/vue/nav-bar'
import '@grana/vue/style.css'

createApp(App).use(Grana).use(GranaAppShell).use(GranaNavBar).mount('#app')
```

Sin empaquetador, `dist/nav-bar.umd.js` (global `GranaNavBar`) se carga después de `grana.umd.js` y se hace `app.use(GranaNavBar.default)`. Su sitio natural es el slot `header` de [`GAppShell`](../GAppShell/README.md): ocupa la banda entera y el alto lo pone `--g-app-shell-header`.

```vue
<!-- Fragmento: `secciones`, `ruta`, `alNavegar` y los controles de `search` y `actions` son de tu aplicación -->
<GAppShell :labels="{ skip: 'Saltar al contenido' }" header="pinned-wide">
  <template #header>
    <GNavBar
      :items="secciones"
      :current="ruta"
      label="Secciones"
      :labels="{ more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña' }"
      @navigate="alNavegar"
    >
      <template #brand><a href="/">Grana</a></template>
      <template #search><!-- tu disparador de búsqueda --></template>
      <template #actions="{ place }"><!-- idioma y tema; `place` dice dónde se pinta --></template>
    </GNavBar>
  </template>
  <template #nav><GSidebar … /></template>
  …
</GAppShell>
```

> **Todos los textos los pones tú** en `label` y `labels`: sin `more` o `menu` los dos botones existen en el HTML sin nombre (aviso 6).

## Ejemplos

### e1 · Las secciones del sitio, con la actual por ruta

**Por qué:** la sección actual sale de `current`, no de `location`. Así el HTML del servidor ya trae `aria-current="page"` y nada cambia al hidratar. `activeMatch` es una cadena de expresión regular sin banderas: la sección «Componentes» sigue actual en cada página de `/components/…`. Sin `activeMatch`, la actual es la que tiene `href === current`.

```vue demo
<script setup>
import { ref } from 'vue'

const ruta = ref('/components/btn')
const secciones = [
  { id: 'guide', label: 'Guía', href: '/getting-started', activeMatch: '^/(getting-started|theming|utilities|accessibility)' },
  { id: 'components', label: 'Componentes', href: '/components/btn', activeMatch: '^/components/' },
  { id: 'playground', label: 'Playground', href: '/theme-playground' }
]
const textos = { more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña' }

function alNavegar({ item, event }) {
  event.preventDefault()   // el ejemplo no sale de la página: solo cambia la ruta actual
  ruta.value = item.href
}
</script>
<template>
  <GNavBar :items="secciones" :current="ruta" label="Secciones" :labels="textos" @navigate="alNavegar" />
</template>
```

Solo un enlace lleva `aria-current="page"`: el primero que casa. Un enlace externo (`external: true`, como el de GitHub en la receta de arriba) nunca es actual, abre en otra pestaña con `rel="noreferrer"` y se anuncia con `labels.newTab`.

### e2 · Con un router

**Por qué:** `navigate` llega con `{ item, event }` y es cancelable de forma síncrona, como en `GMenu` y `GSidebar`. Si llamas a `event.preventDefault()`, el navegador no sigue el `href` y navegas tú. Solo se emite con clic primario sin modificadores o Intro, y nunca desde un externo ni con un `target` de otro contexto. Elegir un destino cierra «…» y la pantalla aunque cancelues.

```vue
<!-- Fragmento: `secciones`, `ruta` y `router` son de tu aplicación -->
<GNavBar
  :items="secciones"
  :current="ruta"
  label="Secciones"
  :labels="{ more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña' }"
  @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }"
/>
```

### e3 · Búsqueda, idioma y tema en el slot `actions`

**Por qué:** el slot `actions` se pinta **tres veces** (`place` vale `bar`, `more` o `screen`) y el CSS enseña la que toca según el ancho de la ventana. Lo habitual es poner controles compactos en la barra y filas con texto visible en «…» y en la pantalla. En `bar`, `GNavBar` pone un separador decorativo antes de cada nodo de primer nivel: tú no dibujas rayas.

```vue
<!-- Fragmento: `abrirBusqueda`, `idiomas`, `oscuro` y `alElegirIdioma` son de tu aplicación -->
<GNavBar :items="secciones" :current="ruta" label="Secciones" :labels="textos">
  <template #search>
    <button type="button" aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K" @click="abrirBusqueda">
      Buscar en la documentación
    </button>
  </template>
  <template #actions="{ place }">
    <template v-if="place === 'bar'">
      <GMenu :items="idiomas" label="Cambiar idioma" @select="alElegirIdioma" />
      <GSwitch v-model="oscuro" aria-label="Tema oscuro" />
    </template>
    <template v-else>
      <ul><li v-for="i in idiomas" :key="i.id"><a :href="i.href" :lang="i.lang" :hreflang="i.lang">{{ i.label }}</a></li></ul>
      <GSwitch v-model="oscuro" label="Apariencia" />
    </template>
  </template>
</GNavBar>
```

El disparador de búsqueda lo escribes tú: Grana no escucha `/` ni ⌘K. Para la búsqueda modal usa [`GCombobox`](../GCombobox/README.md) con `appearance="command"` y llama a su `open()` desde el botón. Un `GSwitch` sin etiqueta visible lleva `aria-label`; en `more` y `screen` hay sitio para su etiqueta.

## Props

| Prop | Tipo | Valores | Por defecto | Descripción |
| --- | --- | --- | --- | --- |
| `items` | Array | `{ id, label, href, activeMatch?, external?, target?, rel?, lang?, hreflang? }` | `[]` | Enlaces en el orden de la barra. Sin `id`, `label` o `href` se ignora y avisa; con `id` repetido, gana el primero. `activeMatch` es una cadena de `RegExp` sin banderas que se prueba contra `current` (si no compila, avisa y se usa `href === current`). Cualquier otro campo llega a `navigate` |
| `current` | String \| null | la ruta actual | `null` | La actual es el primer item que casa; sin `current`, ninguno. Al cambiar se cierran «…» y la pantalla |
| `label` | String | texto | sin valor (**obligatoria**) | Nombre del `<nav>` y del de la pantalla |
| `labels` | Object | `more`, `menu`, `newTab` | `{}` | Textos, sin valores por defecto: `more` (botón «…»), `menu` (hamburguesa), `newTab` (texto oculto de un enlace externo) |
| `id` | String | | generado (SSR-seguro) | `id` de la raíz y prefijo de `{id}-more-btn`, `{id}-more`, `{id}-toggle` y `{id}-screen` |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, event }` | Clic primario o Intro en un enlace interno de la barra o de la pantalla, sin modificadores, sin `defaultPrevented` y sin `target` de otro contexto. Cancelable de forma síncrona. Un externo no lo emite |

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `brand` | | Marca de la aplicación (enlace a la portada). Se oculta por CSS con un `GSidebar` expandido o en riel dentro del chasis |
| `search` | | Disparador de búsqueda de tu aplicación; sigue en la barra en estrecho |
| `actions` | `{ place: 'bar' \| 'more' \| 'screen' }` | Acciones globales (idioma, tema). Se pinta tres veces; separadores solo en `bar` |

## Teclado y foco

Es una **lista de enlaces**, no un menú: se recorre con Tab, sin flechas.

| Tecla | Dónde | Efecto |
| --- | --- | --- |
| Tab / Mayús+Tab | Barra | Marca → búsqueda → enlaces → acciones (o «…») → hamburguesa |
| Intro | Enlace | Navega (y emite `navigate` si es interno) |
| Intro / Espacio | «…» y hamburguesa | Abre o cierra |
| Esc | «…» o pantalla abiertos | Cierra y devuelve el foco a su botón |
| Tab | Pantalla abierta | Queda en bucle hamburguesa ↔ pantalla (con chasis, lo de fuera es `inert`) |

Al abrir la pantalla, el foco va al primer enlace. `/` y ⌘K no son de este componente: los registra tu aplicación. **El puntero no mueve el foco.**

## Accesibilidad

a. **Un `<nav>` con nombre** (`label`) y una lista de enlaces. La raíz no es un punto de referencia: el `banner` es la banda de `GAppShell`. La pantalla repite los enlaces en su propio `<nav>` con el mismo nombre, pero nunca se ven los dos a la vez. Nivel `prueba` (`GNavBar.test.js`, 15 pruebas).

b. **`aria-current="page"` en un solo enlace**, nunca en un externo. Nivel `prueba`.

c. **«…» y la hamburguesa** llevan `aria-expanded` sincronizado con el estado real (en «…», con el evento `toggle` del `popover`) y `aria-controls`. Nivel `prueba`.

d. **Los enlaces externos** se anuncian «GitHub se abre en otra pestaña» con `labels.newTab`; el icono es decorativo. Nivel `prueba`.

e. **La actual solo cambia de color**, sin peso, fondo ni subrayado. Frente a los enlaces en reposo mide **3,06:1 en claro y 3,32:1 en oscuro** con el tema por defecto: pasa 3:1 por poco y un tema con otro acento puede no llegar. Nivel `medido` en claro (3,06, banco de coco, 2026-11-08; el de oscuro viene de kiwi). En `forced-colors` la actual lleva subrayado. Límite aceptado por decisión del usuario (#1053).

f. **Texto y objetivo táctil:** enlaces y actual ≥ 4,5:1 sobre la banda (17,40 y 5,69 en claro; 16,46 y 4,95 en oscuro, cifras de kiwi sobre su prototipo, `manual`). Con `pointer: coarse`, enlaces, «…», hamburguesa y filas de la pantalla ≥ 44 px (contrato).

g. **Lector de pantalla** con dos `nav` y la pantalla abierta: `sin verificar`.

> **Peligro.** Sin `current`, ningún enlace queda marcado y quien usa lector no sabe en qué sección está; si lo calculas con `location` en el primer render, el servidor y el cliente no coinciden. Y sin `labels.more` o `labels.menu` los botones «…» y hamburguesa se anuncian sin nombre.

## Personalidad

**Una sola luz (P1, #1053).** Una capa del alto de la fila de texto se desliza de enlace en enlace bajo el puntero (160 ms, `--g-ease-out`), la misma luz que `GMenu`, `GSidebar` y `GTable`. Con ella, **pasar el puntero deja de pintar el texto en acento**: el puntero tiene su señal (la luz) y la actual la suya (el color), así que no se confunden. Entrar desde fuera aparece sin viajar, y la luz no mueve el foco. Con `prefers-reduced-motion: reduce` solo queda el fundido. Nada cambia de medida con ella (Δ 0 medido en el banco de coco). Solo la lista de la barra la lleva, no «…» ni la pantalla.

**Límites:** la personalidad es de comportamiento; en reposo es una barra de enlaces. La comodidad de la luz con trackpad inercial no se ha comprobado. La segunda propuesta de kiwi (una línea bajo la actual que viaja, `mark`) está **reservada** (#1053).

## Tema

No tiene tokens nuevos. Lee `--g-color-bg`, `--g-color-text`, `--g-color-text-subtle`, `--g-color-accent-text`, `--g-color-border`, `--g-color-surface`, `--g-shadow-2`, `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-1`, el foco (`--g-color-focus`, `--g-focus-width`, `--g-focus-offset`), `--g-border-width`, `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow` y `--g-ease-out`. El alto de la banda lo pone la entrada pública `--g-app-shell-header` de `GAppShell`. Los cortes del visor (`48rem` y `80rem`) son constantes de contrato, no tokens.

**Cortes del visor** (en `rem`: crecen con el texto del navegador):

| Visor | Barra | «…» | Hamburguesa y pantalla |
| --- | --- | --- | --- |
| ≥ `80rem` | marca, búsqueda, enlaces y `actions` en `bar` | oculto | oculta |
| `48rem` a `80rem` | marca, búsqueda y enlaces | visible, con `actions` en `more` | oculta |
| < `48rem` | marca y búsqueda | oculto | visible, con los enlaces y `actions` en `screen` |

Los tres sitios están en el HTML del servidor y el CSS elige: no se mide nada en el primer render.

## Clases

`g-nav-bar` (raíz, con `is-open` si la pantalla está abierta), `__brand`, `__search`, `__nav`, `__list`, `__highlight`, `__link` (`--external`), `__ext`, `__sr`, `__actions`, `__sep`, `__more`, `__more-btn`, `__more-panel`, `__toggle`, `__screen`, `__screen-nav`, `__screen-list`, `__screen-link` y `__screen-actions`. La lista lleva `has-highlight` e `is-highlight-instant` mientras actúa la luz.

## Alcance

- **No busca, no cambia el idioma ni el tema:** aloja los controles de tu aplicación en los slots.
- **No lee `location`:** la actual es `current` (#1033).
- **«…» y la pantalla son *disclosure*, no menú ni `<dialog>`:** sin flechas ni roles de menú. Los abre y cierra el usuario, no hay `open` ni `update:open`.
- **Reservado:** `mark` (la línea de la actual que viaja), `contained` (cortes por la caja, para demos y paneles), `children` (desplegables por sección) y un `nav` secundario. Ninguno está construido.
- **Cortes del visor, no de la caja:** la banda mide distinto con o sin columna izquierda, así que se corta por el ancho de la ventana.
- **Cuando la pantalla está abierta**, el enlace de salto de `GAppShell` sigue pudiendo enfocarse (límite aceptado de `cover`).
- **Peso:** `dist/nav-bar.js` mide **3 011 B gzip** frente a un tope de 3 584 B, anotado por bruno en `GNavBar.meta.json` el 2026-11-08 (`gzip -9`; no se remidió al documentar; #1059).

## Verificación

- **`prueba`:** `GNavBar.test.js`, 15 pruebas en verde el 2026-11-08 (modelo y avisos, actual por `activeMatch` o `href`, externos, `navigate`, «…», pantalla).
- **`medido` en banco, tres motores:** `design/lab/sitio/calco-estilo/verificar.mjs` (puerto 4240) sobre `dist/` y el marcado de contrato, **2080/2080** (694 Chromium, 693 Firefox, 693 WebKit), de ellas 94 de barra, luz y barra local; incluye la actual frente a reposo (3,06:1) y el Δ 0 de los enlaces con y sin la luz. Es el banco de paridad; la auditoría del componente real está en la viñeta siguiente.
- **`medido` en el prototipo de kiwi:** `design/lab/navbar/r01/verificar.mjs`, 772/772 en los tres motores (prototipo, no el componente).
- **`medido` en la auditoría de coco, sobre el sitio construido real** ([`design/lab/sitio/auditoria.md`](../../../../../design/lab/sitio/auditoria.md), 2026-11-09): `design/lab/sitio/auditoria-verificar.mjs` (puerto 4246), **472/472** en total (estático 16/16, Chromium 166/166, Firefox 129/129, WebKit 161/161; Firefox sin táctil ni `forced-colors`, WebKit sin `forced-colors`), con el tema por defecto y `caracol-purpura`, los dos en claro y en oscuro. Contraste de los enlaces: el menor (la actual) 5,69 / 4,95 / 4,94 / 4,98 : 1 según tema y modo, frente a 4,5; el enlace bajo la luz P1 se mantiene ≥ 4,5 : 1. Rúbrica de movimiento sin «No cumple»: la luz P1 no mueve la barra de medida, reducido = fundido, sin capa en `forced-colors`. Spec `nav-bar` sin tareas largas (Chromium). Estado promovido a `candidate`.
- **Sin verificar:** lector de pantalla real con dos `nav` y la pantalla abierta; trackpad inercial; Safari, táctil y `forced-colors` reales.
- **Pendientes abiertos:** [`PENDIENTES.md`](../../../../../PENDIENTES.md) §5 y §6. Afecta a este componente la comprobación del par `accent-text` / `text` ≥ 3:1 en el motor de tema.

## Fuentes

- API: [`GNavBar.meta.json`](./GNavBar.meta.json)
- Contrato: [`design/contracts/nav-bar.md`](../../../../../design/contracts/nav-bar.md) · Marco del sitio: [`design/contracts/sitio-marco.md`](../../../../../design/contracts/sitio-marco.md)
- Prototipo: [`design/lab/navbar/r01/`](../../../../../design/lab/navbar/r01/)
- Decisiones: #1052, #1053, #1055, #1057 y #1059 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- Pruebas: [`GNavBar.test.js`](./GNavBar.test.js) (nivel `prueba`); banco [`design/lab/sitio/calco-estilo/`](../../../../../design/lab/sitio/calco-estilo/) (nivel `medido`)
