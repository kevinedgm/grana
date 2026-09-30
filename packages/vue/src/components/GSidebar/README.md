# GSidebar

Navegación lateral (principal o secundaria) que **se transforma con un solo sistema**: **expandida** (etiquetas, grupos, submenús en línea), **riel** de iconos (submenús en un panel flotante), y, en móvil, un **navbar inferior** con «píldora activa» o un **drawer**. Los items se definen con un arreglo (grupos, items y un nivel de hijos); el destino actual es un prop; la adaptación se decide por el ancho del contenedor.

**Etiqueta:** `<g-sidebar>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/sidebar/auditoria.md`](../../../../../design/lab/sidebar/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `<dialog>`, `popover`, `@starting-style` e `interpolate-size` (sin estos dos últimos, las animaciones de cierre y del submenú desaparecen pero todo funciona).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<script setup>
import { ref } from 'vue'
const actual = ref('home')
const items = [
  { label: 'Principal', items: [
    { id: 'home', label: 'Inicio', href: '/', icon: 'home' },
    { id: 'inbox', label: 'Bandeja', href: '/inbox', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' }
  ] },
  { label: 'Espacio', items: [
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
      { id: 'p1', label: 'Todos', href: '/p' }, { id: 'p2', label: 'Archivados', href: '/p/arch' }
    ] },
    { id: 'bill', label: 'Facturación', icon: 'card', disabled: true }
  ] }
]
// Todo texto de la interfaz lo pones tú (Grana no trae textos ni iconos)
const labels = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar' }
</script>

<template>
  <div class="mi-diseno">
    <g-sidebar v-model="actual" :items="items" label="Principal" :labels="labels" search @search="abrirPaleta">
      <template #logo="{ collapsed }"><MiMarca /><span v-if="!collapsed">Grana</span></template>
      <template #icon="{ item }"><MiIcono :name="item.icon" /></template>
      <template #toggle-icon><PanelIcon /></template>
      <template #search-icon><SearchIcon /></template>
      <template #more-icon><MenuIcon /></template>
      <template #user="{ collapsed }"><MiUsuario :solo-avatar="collapsed" /></template>
    </g-sidebar>
    <main>…</main>
  </div>
</template>
```

> En plantillas dentro del HTML (sin compilar), escribe `<g-sidebar ...></g-sidebar>`: Vue no admite etiquetas de componente autocerradas.

## Los cuatro formatos

| Formato | Cuándo | Qué es |
| --- | --- | --- |
| **Expandida** | Contenedor ≥ `--g-space-1 × 240` (960px con `space` 4) | Cabecera (logo, contraer, búsqueda), grupos con título, submenús en línea, pie de usuario; ancho `--g-sidebar-width` |
| **Riel** | ≥ `--g-space-1 × 150` (600px) | Solo iconos de 44px; las etiquetas se ocultan visualmente **pero siguen en el DOM**; los padres abren un **panel flotante** |
| **Navbar** | Por debajo del riel, con `mobile="navbar"` (por defecto) | Barra flotante inferior con los primeros `barCount` items y «Más»; el actual es una **píldora** con icono y etiqueta |
| **Drawer** | Por debajo del riel con `mobile="drawer"`, o desde «Más» | `<dialog>` modal desde el borde inicial con la navegación completa |

Un **único estado de navegación** (destino actual y ramas abiertas) se comparte entre los cuatro: al cambiar de formato, el usuario conserva su orientación.

## Adaptación (`mode="auto"`)

- Se decide por el **ancho del contenedor** (`container`, por defecto el elemento padre), medido con un observador de tamaño. **No hay consultas de medios ni umbrales fijos**: derivan de `--g-space-1` (con `space` 5 son 1200 y 750px). No usa el número de items (la región central hace scroll).
- **Elección manual:** el botón de la cabecera contrae y expande; esa elección se conserva **mientras el ancho no cambie de clase** (expandida / riel / móvil). `mode` fija un formato; `collapsed` (con `v-model:collapsed`) lo controla.
- **`mode-change`** (`{ mode, overlay }`) avisa cada vez que el formato cambia (y al montar), **para que reserves el espacio** en tu diseño:

| Formato | Espacio a reservar |
| --- | --- |
| Expandida | Ancho `--g-sidebar-width` (más dos márgenes con `variant="floating"`) |
| Riel | Ancho `--g-sidebar-rail`; **con `overlay` el mismo**: al expandirlo (`overlay: true` en el evento) encima del contenido, el diseño no se desplaza |
| Navbar | Alto `--g-sidebar-bar` en el borde inferior (`padding-block-end`) |
| Drawer | Ninguno |

El componente no empuja tu contenido. Hasta que se mide el contenedor (el primer instante tras montar) se pinta expandido.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `items` | Array | ver «Items» | `[]` |
| `modelValue` | String \| Number \| null | `id` del destino actual | `null` |
| `label` | String | nombre accesible del `<nav>` (**obligatorio**) | sin valor |
| `mode` | String | `auto` `expanded` `rail` `navbar` `drawer` | `auto` |
| `mobile` | String | `navbar` `drawer` | `navbar` |
| `collapsed` | Boolean | (con `update:collapsed`) | `false` |
| `open` | Boolean | drawer (con `update:open`) | `false` |
| `container` | String \| Element | selector CSS o elemento | el padre |
| `contained` | Boolean | el navbar se posiciona dentro del contenedor y no del visor | `false` |
| `variant` | String | `fixed` `floating` | `fixed` |
| `overlay` | Boolean | el riel se expande **sobre** el contenido | `false` |
| `barCount` | Number | `3` `4` `5` | `4` |
| `search` | Boolean | muestra el disparador de búsqueda | `false` |
| `closeOnNavigate` | Boolean | el drawer se cierra al elegir un destino | `true` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` (relleno de la píldora y de los indicadores) | `brand` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `labels` | Object | ver «Textos» | `{}` |

Un valor de prop fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van a la raíz** (en el navbar, al `<nav>`).

## Items

```js
[
  { label: 'Principal', items: [ /* grupo */ { id, label, href?, icon?, badge?, badgeLabel?, dot?, disabled?, primary?, children? } ] },
  { id: 'set', label: 'Ajustes', href: '/settings' }   // item sin grupo
]
```

- **`id`** único y **`label`** son obligatorios (un item sin ellos se ignora y avisa en desarrollo).
- **`href`**: un `<a>`. **Sin `href` ni `children`**: un `<button>` de solo acción (también emite `navigate`). **`disabled`**: `<a role="link" aria-disabled="true">` **sin `href`** (no recibe foco), tachado y atenuado.
- **`children`**: **un solo nivel** (los nietos se ignoran y avisan); un padre es un botón de submenú, nunca navega por sí mismo.
- **`icon`** es un valor **de tu aplicación** que llega al slot `icon` (Grana no trae iconos). **`badge`** (número o texto corto) y **`dot`** (marca sin número) son decorativos: **`badgeLabel`** es el texto para lectores y es **obligatorio** si hay `badge` o `dot`.
- **`primary`**: en el navbar, los items marcados van en la barra; sin ninguno, los primeros `barCount` no deshabilitados (padres incluidos).

## Textos (`labels`)

Ninguno tiene valor por defecto (Grana es internacional). Los requeridos avisan en desarrollo, una vez:

| Clave | Uso | Requerido |
| --- | --- | --- |
| `collapse`, `expand` | Nombre del botón de contraer y de expandir | Sí |
| `more` | Etiqueta del botón «Más» del navbar | Sí |
| `drawer` | Nombre accesible del drawer | Sí |
| `moreActive` | Texto oculto cuando la página actual está fuera de la barra («contiene la página actual») | Recomendado |
| `close` | Nombre del botón de cierre del drawer (sin él no hay botón) | Recomendado |
| `search`, `searchHint` | Texto y atajo visible (decorativo) del buscador | `search`, con `search` |

## Navegar

```vue
<g-sidebar v-model="actual" :items="items" label="Principal" :labels="labels"
  @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }" />
```

- **`navigate`** (`{ item, event }`) se emite al elegir un destino (clic o Enter en un enlace o botón sin hijos, o un hijo), con el **evento nativo**. Después, `update:modelValue`.
- **`event.preventDefault()`** cancela la navegación del `href` (para un router) y **también** impide `update:modelValue` y el cierre del drawer.
- El valor es el prop: si no actualizas `modelValue`, el destino actual no cambia. Un padre con un hijo actual queda como **rama activa** (peso y color), **sin** `aria-current`.

## Riel

- **Panel flotante** de un padre: se abre con **clic, Enter, Espacio o →** y con el **puntero encima** (150ms); **el foco solo no lo abre**. Al abrir con teclado el foco va al hijo actual o al primero; ↑ ↓ Inicio Fin se mueven; **Esc o ←** lo cierran y devuelven el foco al padre; Tab hacia fuera lo cierra. Está pegado al item, con el nombre del padre y una muesca que lo conecta.
- **Pista** (`aria-hidden`) con el nombre del item: con el puntero tras 350ms y **sin retardo con foco visible**; si ya se mostró otra hace menos de ~600ms, aparece al instante. **Nunca es la única fuente del nombre**: las etiquetas siguen en el DOM.
- **`overlay`:** el usuario puede expandir el riel encima del contenido (el evento `mode-change` trae `overlay: true`).

## Navbar («píldora activa»)

- Una barra flotante con `barCount` items y **«Más»**. El **item actual** (o la rama, o «Más» si la página actual no está en la barra) se **expande en una píldora** con icono y etiqueta; los demás muestran **solo el icono** (su etiqueta queda oculta visualmente, siempre en el DOM). Cada celda mide al menos **44×48px**.
- **«Más»** abre el drawer completo (grupos, búsqueda, usuario); un **padre** en la barra abre el drawer con **su rama abierta**. Elegir un destino lo cierra y el foco vuelve al botón que lo abrió.
- Con la página actual fuera de la barra, «Más» queda como rama activa y `labels.moreActive` se lee; **nunca** lleva `aria-current`.
- **Etiquetas de una palabra:** con 5 celdas en ~340px, las largas se recortan con elipsis.
- **Espacio:** reserva `--g-sidebar-bar` de alto abajo. Con `contained`, la barra se posiciona dentro del contenedor (útil en paneles y demostraciones).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, event }` | El usuario elige un destino |
| `update:modelValue` | `id` | Tras `navigate` no cancelado |
| `update:collapsed` | Boolean | El usuario contrae o expande |
| `update:open` | Boolean | El drawer se abre o cierra |
| `mode-change` | `{ mode, overlay }` | El formato resuelto cambia (y al montar) |
| `search` | | Se activa el disparador de búsqueda |

Métodos expuestos: `open()`, `close()` (drawer), `toggle()` (contraer/expandir) y `focus()`.

## Slots

| Slot | Contenido |
| --- | --- |
| `logo` | Identidad en la cabecera. Alcance `{ collapsed }` (en el riel, la marca sola) |
| `header` | Contenido extra bajo el logo. Alcance `{ collapsed }` |
| `search` | Sustituye al disparador de búsqueda (no se emite `search`). Alcance `{ collapsed }` |
| `icon` | Icono de un item (decorativo). Alcance `{ item }` |
| `item` | Contenido de un item, en lugar de icono y etiqueta. Alcance `{ item, active, collapsed, level }`; **conserva el texto de la etiqueta** (es el nombre accesible) |
| `user` | Área de usuario al pie. Alcance `{ collapsed }`; **en el riel, solo el avatar con nombre accesible que das tú**; el menú del usuario es tuyo |
| `toggle-icon`, `search-icon`, `more-icon` | Iconos de los botones de contraer, de búsqueda y de «Más» |

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre enlaces, botones de submenú, contraer, búsqueda y usuario (los deshabilitados no reciben foco) |
| ↑ / ↓ / Inicio / Fin | Item anterior, siguiente, primero o último **visible** y habilitado de la región de navegación |
| Enter / Espacio | En un padre expandido: abre o cierra sus hijos; en un padre del riel: abre el panel; en un enlace: navega |
| → | En un padre del riel: abre el panel |
| ← / Esc | En el panel: lo cierra y devuelve el foco. **Esc no llega a un `GDialog` que lo contenga** |
| ← → / Inicio / Fin | En el navbar: mueven entre los items (← → se invierten en RTL) |
| Esc | En el drawer: lo cierra y devuelve el foco |

## Accesibilidad

- **`<nav aria-label>` con solo enlaces y botones de submenú**; cabecera y pie van fuera de la región. Cada grupo es una lista con su título como nombre (también en el riel: el título se oculta visualmente y queda en el DOM).
- **El nombre accesible es texto real**, no `aria-label` ni tooltip: las etiquetas del riel y de los items inactivos de la píldora se ocultan visualmente y siguen ahí; los indicadores visibles son `aria-hidden` y su texto es `badgeLabel`.
- **`aria-current="page"`** solo en el destino real; `aria-expanded`/`aria-controls` en los padres (`aria-haspopup` en el riel); el submenú cerrado es `inert` (sin foco ni lectura).
- **El movimiento no transmite nada que el estado no tenga** y con `prefers-reduced-motion` quedan los fundidos (se quitan desplazamientos y escalas).
- **Objetivos:** item de 40px (`space × 10`) y **44px** con `pointer: coarse`; botones del riel de 44px; celdas del navbar de al menos 44×48px.
- **Contraste** (auditoría): por defecto, item 6.9:1, título de grupo 4.72:1, contador 16.48:1 y borde del buscador 3.45:1; con otro tema (espacio 5, foco de 3px), 4.48:1 o más. Con **`forced-colors`**, el item activo pasa a un contorno de `CanvasText` y la píldora usa `Highlight`.

## Movimiento

Solo transiciones (se interrumpen y se revierten) con `--g-duration-*` y `--g-ease-*`, todas por debajo de los 300ms: el ancho al contraer y expandir (las etiquetas entran un instante después), el submenú (altura y opacidad), el fundido del item activo, la pulsación, el panel flotante y el drawer (**también al cerrar**), la pista (instantánea tras otra reciente), la entrada del navbar y el crecimiento de la píldora. **El sidebar no se reconstruye** al contraer, expandir, navegar o abrir un submenú: es la misma raíz por formato (así corren las transiciones). El hover de un item es solo color.

## Tema

El componente solo lee tokens `--g-*`. La **carcasa** es `--g-surface-shell` y el item actual, la **inset** del mismo sistema (`--g-surface-inset` con contorno `--g-color-border-strong`); el panel y el navbar usan `--g-color-surface`, `--g-shadow-2/3` y `--g-radius-*`; el drawer, `--g-surface-*`. `color` reasigna la píldora y los indicadores; el foco es `--g-color-focus`. Define **tokens de estructura** que usa tu diseño para reservar espacio:

```css
:root {
  --g-sidebar-width: calc(var(--g-space-1) * 66);  /* 264px con space 4 */
  --g-sidebar-rail: calc(var(--g-space-1) * 16);   /* 64px */
  --g-sidebar-bar: calc(var(--g-space-1) * 17);    /* 68px */
}
```

## Clases

Las emite el componente y las estiliza `GSidebar.css`: `g-sidebar` (con `--mode-{expanded|rail|navbar}`, `--variant-*`, `--color-*`, `--density-*`, `--overlay`, `--contained`, `is-entering`), `__head`, `__top`, `__logo`, `__toggle`, `__search`, `__hint`, `__nav`, `__groups`, `__group`, `__group-title`, `__list`, `__item`, `__link` (con `is-active`, `is-branch`), `__parent`, `__sub` (con `is-open`), `__chevron`, `__icon`, `__label`, `__badge` (y `__badge--dot`), `__sr`, `__foot`, `__fly`, `__fly-title`, `__tip` (con `is-instant`), `__bar`, `__tab`, `__more`, `__label--hidden` y `__drawer`.

## Limitaciones conocidas

- **Un solo nivel de hijos**; sin árboles profundos, arrastrar ni favoritos. **Sin buscador propio** ni filtro: `search` solo dispara el evento. **Sin menú contextual del usuario** (será `GMenu`): el slot `user` lo pones tú.
- **Grana no trae iconos ni textos**: `icon`, `toggle-icon`, `search-icon`, `more-icon` y `labels` son de la aplicación.
- **En la píldora activa, los items inactivos no muestran su nombre** (existe para lectores): un usuario nuevo no lo ve. Las etiquetas del navbar deben ser cortas.
- **El item activo se distingue poco por superficie** (1.08:1 frente a la carcasa con el tema por defecto): lo sostienen su contorno, el peso, el texto pleno y `aria-current`. Está pendiente decidir si se refuerza.
- **Si tu contenedor tiene el ancho del visor**, la adaptación decide por él: da un `container` razonable. El primer instante tras montar se pinta expandido.
- **El espacio lo reservas tú** (tokens y `mode-change`): el componente no empuja el contenido.
- Sin `@starting-style` ni `interpolate-size` (navegadores antiguos), el submenú y las salidas del panel y del drawer no se animan. No hay tema oscuro todavía.
- **Sin verificar:** un lector de pantalla real (riel, ramas, contadores, panel, píldora, drawer), Firefox y Safari (`popover`, `<dialog>`, `@starting-style`, `interpolate-size`), el navbar y el drawer en un dispositivo táctil real y con el teclado virtual, RTL con un idioma RTL real, cientos de items, y `forced-colors` y `prefers-reduced-motion` reales (los bloques se comprobaron aplicados sin condición).

## Fuentes

- API: [`GSidebar.meta.json`](./GSidebar.meta.json) · Contrato: [`design/contracts/sidebar.md`](../../../../../design/contracts/sidebar.md) · Prototipo: [`design/lab/sidebar/r01/`](../../../../../design/lab/sidebar/r01/) · Auditoría: [`design/lab/sidebar/auditoria.md`](../../../../../design/lab/sidebar/auditoria.md)
