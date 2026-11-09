# GSidebar

Navegación lateral (principal o secundaria) que **se transforma con un solo sistema**: **expandida** (etiquetas, grupos, submenús en línea), **riel** de iconos (submenús en un panel flotante), y, en móvil, un **navbar inferior** con «píldora activa» o un **drawer**. Los items se definen con un arreglo (grupos, items y un nivel de hijos); el destino actual es un prop; la adaptación se decide por el ancho del contenedor. Con `filter` y la extensión `@grana/vue/sidebar-filter`, un campo en la cabecera **filtra el índice mientras escribes**; con `code`, cada item lleva un número estable dentro de su asiento. Con la extensión `@grana/vue/sidebar-index`, `appearance="index"` lo pinta como el índice de una documentación (texto, número al final, una marca que viaja) y los grupos pueden **plegarse**.

**Etiqueta:** `<g-sidebar>` · **Estado:** `stable` (auditoría de coco aprobada; ver [`design/lab/sidebar/auditoria.md`](../../../../../design/lab/sidebar/auditoria.md)) · **Desde:** 1.0.0

> `@grana/vue` está en la versión `1.0.0`; hasta que se publique en npm se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`. Usa `<dialog>`, `popover`, `@starting-style` e `interpolate-size` (sin estos dos últimos, las animaciones de cierre y del submenú desaparecen pero todo funciona).

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<!-- Fragmento: `abrirPaleta` es de tu aplicación -->
<script setup>
import { ref } from 'vue'
const actual = ref('home')
const items = [
  { label: 'Principal', items: [
    { id: 'home', label: 'Inicio', href: '/', icon: 'house' },   // icon: nombre de Lucide (sin slot icon, lo dibuja GIcon)
    { id: 'inbox', label: 'Bandeja', href: '/inbox', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' }
  ] },
  { label: 'Espacio', items: [
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
      { id: 'p1', label: 'Todos', href: '/p' }, { id: 'p2', label: 'Archivados', href: '/p/arch' }
    ] },
    { id: 'bill', label: 'Facturación', icon: 'credit-card', disabled: true }
  ] }
]
// Todo texto de la interfaz lo pones tú (Grana no trae textos). Los iconos que no están en la lista de la librería
// (house, inbox, folder, credit-card, panel-left, search, menu) los registra la aplicación con createIcons (ver GIcon)
const labels = { collapse: 'Contraer la barra lateral', expand: 'Expandir la barra lateral', more: 'Más', moreActive: 'contiene la página actual', drawer: 'Navegación', close: 'Cerrar', search: 'Buscar' }
</script>

<template>
  <div class="mi-diseno">
    <g-sidebar v-model="actual" :items="items" label="Principal" :labels="labels" search @search="abrirPaleta">
      <template #logo="{ collapsed }"><MiMarca /><span v-if="!collapsed">Grana</span></template>
      <template #toggle-icon><g-icon name="panel-left" flip-rtl></g-icon></template>
      <template #search-icon><g-icon name="search"></g-icon></template>
      <template #more-icon><g-icon name="menu"></g-icon></template>
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

- Se decide por el **ancho del contenedor** (`container`, por defecto el elemento padre), medido con un observador de tamaño. **No hay consultas de medios ni umbrales fijos por defecto**: derivan de `--g-space-1` (con `space` 5 son 1200 y 750px). No usa el número de items (la región central hace scroll).
- **`breakpoints` (#618):** `{ expanded?, rail? }` en píxeles del contenedor. Permite ajustar los umbrales a tu diseño. `null` o `{}` usa los valores por defecto. Una sola clave conserva la otra. Un valor no numérico, no finito o negativo se ignora con aviso; si `rail > expanded` se recorta (aviso si se dieron las dos). `rail = expanded = 0` desactiva el formato riel. Solo actúa con `mode="auto"` y su cambio se aplica de inmediato.
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
| `breakpoints` | Object | `{ expanded?, rail? }` (px del contenedor) — umbrales de `mode="auto"` | `null` (usa `space × 240` / `space × 150`) |
| `contained` | Boolean | el navbar se posiciona dentro del contenedor y no del visor | `false` |
| `variant` | String | `fixed` `floating` | `fixed` |
| `overlay` | Boolean | el riel se expande **sobre** el contenido | `false` |
| `barCount` | Number | `3` `4` `5` | `4` |
| `search` | Boolean | muestra el disparador de búsqueda (no actúa con `filter` y la extensión) | `false` |
| `appearance` | String | `default` `index` (necesita la extensión `@grana/vue/sidebar-index`; ver «Apariencia `index`»; sin ella se pinta `default`) | `default` |
| `closedGroups` | Array \| undefined | `id` de los grupos plegables cerrados (con `update:closedGroups`); necesita la extensión `@grana/vue/sidebar-index` | sin valor (estado interno) |
| `filter` | Boolean | filtro del índice en la cabecera; **necesita la extensión** `@grana/vue/sidebar-filter` (ver «Filtro del índice») | `false` |
| `query` | String | texto del filtro (con `v-model:query`) | `''` |
| `filterKeyshortcuts` | String | valor de `aria-keyshortcuts` del campo, p. ej. `'/ Control+K Meta+K'`; solo lo publica, no escucha atajos | `null` |
| `closeOnNavigate` | Boolean | el drawer se cierra al elegir un destino | `true` |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` (relleno de la píldora y de los indicadores) | `brand` |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `labels` | Object | ver «Textos» | `{}` |

Un valor de prop fuera de su lista avisa en desarrollo. **`class`, `style` y `data-*` van a la raíz** (en el navbar, al `<nav>`).

## Items

```js
[
  { label: 'Principal', id?, collapsible?, collapsed?, items: [ /* grupo */ { id, label, href?, icon?, code?, keywords?, filterable?, badge?, badgeLabel?, dot?, disabled?, primary?, children? } ] },
  { id: 'set', label: 'Ajustes', href: '/settings' }   // item sin grupo
]
```

- **Grupo:** `label` y `items`; con `collapsible: true`, el título se vuelve un botón y el grupo se pliega, y entonces **`id` es obligatorio** (clave del estado; sin él, avisa y el grupo no se pliega). `collapsed: true` es el estado inicial sin `closedGroups`. Necesita la extensión `@grana/vue/sidebar-index`.
- **`id`** único y **`label`** son obligatorios (un item sin ellos se ignora y avisa en desarrollo).
- **`href`**: un `<a>`. **Sin `href` ni `children`**: un `<button>` de solo acción (también emite `navigate`). **`disabled`**: `<a role="link" aria-disabled="true">` **sin `href`** (no recibe foco), tachado y atenuado.
- **`children`**: **un solo nivel** (los nietos se ignoran y avisan); un padre es un botón de submenú, nunca navega por sí mismo.
- **`icon`** (#202): una **cadena** es un nombre de Lucide que el sidebar dibuja con [`GIcon`](../GIcon/README.md) en el hueco del item de primer nivel (decorativo, 20px en expandido, riel y navbar) si no hay slot `icon`; se busca en el registro de tu aplicación (`createIcons`) y luego en la lista de la librería. Con slot `icon`, manda el slot; otro valor solo llega al slot. Los hijos no llevan icono. **`badge`** (número o texto corto) y **`dot`** (marca sin número) son decorativos: **`badgeLabel`** es el texto para lectores y es **obligatorio** si hay `badge` o `dot`.
- **`code`** (1 a 3 caracteres, solo en items de primer nivel): un identificador corto que se pinta **dentro del asiento** en lugar del icono y va al principio del nombre accesible («24 GCombobox»). Es de tu aplicación: Grana no numera, y su estabilidad es cosa tuya. Con `code` e `icon` se pinta el `code` (avisa); con más de 3 caracteres se pinta igual y avisa; en un hijo se ignora y avisa. **`keywords`** (arreglo de cadenas: alias, otro idioma, el `slug`) amplía lo que encuentra el filtro; **`filterable: false`**, en un grupo o un item, lo deja siempre visible y fuera de la cuenta (para lo que tu aplicación ya filtró con la misma consulta).
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
| `filter` | Nombre del campo del filtro (`<label>` oculto) y del botón del filtro en el riel | Sí, con `filter` |
| `filterCount` | Función `(mostrados, total) => texto`: el recuento, visible y anunciado | Sí, con `filter` |
| `filterNone` | Función `(consulta) => texto`: sin coincidencias | Sí, con `filter` |
| `filterClear` | Nombre del botón de vaciar el filtro | Sí, con `filter` |
| `filterPlaceholder`, `filterHint` | Texto de ejemplo del campo y atajo visible (decorativo; se oculta con texto) | No |
| `groupCurrent` | Texto oculto en el botón de un grupo **plegado con la página actual dentro** («contiene la página actual») | Recomendado, con grupos `collapsible` |

## Navegar

```vue
<!-- Fragmento: `actual`, `items`, `labels` y `router` son de tu aplicación -->
<g-sidebar v-model="actual" :items="items" label="Principal" :labels="labels"
  @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }" />
```

- **`navigate`** (`{ item, event }`) se emite al elegir un destino (clic o Enter en un enlace o botón sin hijos, o un hijo), con el **evento nativo**. Después, `update:modelValue`.
- **`event.preventDefault()`** cancela la navegación del `href` (para un router) y **también** impide `update:modelValue` y el cierre del drawer.
- El valor es el prop: si no actualizas `modelValue`, el destino actual no cambia. Un padre con un hijo actual queda como **rama activa** (peso y color), **sin** `aria-current`.

## Filtro del índice

Un campo en la cabecera filtra la lista **en su sitio** mientras escribes: lo que no coincide se oculta, el recuento se anuncia y un número lleva a su entrada. Sirve igual a un sitio de documentación que a un administrador con decenas de módulos.

El filtro **no viaja en `@grana/vue`**: su motor va en una entrada propia (`@grana/vue/sidebar-filter`, global UMD `GranaSidebarFilter`, 2 742 B gzip frente a un tope de 3 072 B, anotado por bruno en `GSidebar.meta.json` el 2026-11-08) y se conecta una vez por aplicación. Quien no lo usa no lo paga (DECISIONS #1050).

```js
import SidebarFilter from '@grana/vue/sidebar-filter'

app.use(SidebarFilter)   // conecta el motor con todos los GSidebar de la aplicación
```

**Sin la extensión**, `GSidebar` con `filter` se pinta como si `filter` fuera `false`: sin campo, con el índice entero, y el disparador de `search` vuelve a actuar. `query` se ignora, `update:query` no se emite y `focusFilter()` no hace nada. Nunca es un error: avisa una vez (F5) en desarrollo.

```vue
<!-- Fragmento: `actual`, `items`, `router` y `textos` son de tu aplicación -->
<script setup>
import { ref } from 'vue'
const consulta = ref('')
const textos = {
  collapse: 'Contraer el índice', expand: 'Expandir el índice', more: 'Más', moreActive: 'contiene la página actual',
  drawer: 'Índice', close: 'Cerrar el índice',
  filter: 'Filtrar el índice',
  filterPlaceholder: 'Nombre o número',
  filterClear: 'Vaciar el filtro',
  filterCount: (mostrados, total) => `${mostrados} de ${total} páginas`,
  filterNone: (q) => `Ningún título con «${q}»`
}
</script>

<template>
  <g-sidebar v-model="actual" v-model:query="consulta" :items="items" label="Documentación" :labels="textos"
    filter filter-keyshortcuts="/ Control+K Meta+K"
    @navigate="({ item, event }) => { event.preventDefault(); router.push(item.href) }" />
</template>
```

- **Qué coincide.** Sin distinguir mayúsculas ni acentos, la consulta debe estar **contenida** en la `label` o en alguna `keyword` del item. Una consulta **solo de dígitos** (1 a 3) coincide con el `code` que empieza por ella o con su valor numérico («2» encuentra `02` y `20` a `29`; «24», solo `24`). El título de un grupo no cuenta: un grupo sin items visibles se oculta entero.
- **Padres e hijos.** Un padre se ve si él o alguno de sus hijos coincide; si coincide el padre, se ven todos sus hijos. Mientras hay consulta, todo padre visible está abierto; al vaciar, cada uno vuelve a su estado.
- **Se oculta con `hidden`, sin desmontar.** El item actual conserva su `aria-current` aunque no coincida; al vaciar el filtro se trae a la vista. Cada cambio de consulta lleva la lista al principio.
- **Recuento y anuncio.** El recuento (`filterCount`, o `filterNone` sin coincidencias) está siempre a la vista y unido al campo; se anuncia de forma cortés 600 ms después del último cambio. Cuenta destinos: items con `href` o de solo acción y los hijos; no los padres, ni los deshabilitados, ni lo marcado con `filterable: false`.
- **Por formato.** Expandida y drawer: el campo en la cabecera. Riel: un botón de filtro que expande y enfoca el campo; la consulta se conserva entre formatos. Navbar: la barra no se filtra, el campo vive en el drawer de «Más».
- **Atajo global.** Lo registra tu aplicación (`/` fuera de un campo editable, ⌘K o Ctrl+K) y llama a `focusFilter()`; `GSidebar` no escucha el documento. `filterKeyshortcuts` solo lo publica.
- **Sin movimiento propio:** filtrar oculta y muestra al instante.

Avisos de desarrollo del filtro: **F1** `filter` con `search` (no actúa `search`); **F2** `filter` con el slot `search` (manda el slot); **F3** `filter` sin `filter`, `filterCount`, `filterNone` o `filterClear` en `labels`; **F4** `keywords` que no es un arreglo de cadenas (se ignora); **F5** `filter` sin la extensión. Y del `code`: **C1** con `icon`, **C2** de más de 3 caracteres, **C3** en un hijo.

## Apariencia `index` y grupos plegables

`appearance="index"` es la piel del **índice de una documentación**: texto sin iconos ni asiento, el número de cada página al final de la fila, y una **marca de 2 px** que señala la actual. No es otro componente, es la misma navegación con otra piel y un plegado de grupo. Nace de calcar el índice de un sitio de documentación con piezas de Grana (#1052, #1060 a #1065).

**Va en una extensión.** La apariencia, el plegado de grupos, la marca y el cajón que se abre en el actual no viajan en `@grana/vue`: van en `@grana/vue/sidebar-index` (global UMD `GranaSidebarIndex`, **3 762 B gzip** frente a un tope de 3 840 B, anotado por bruno en `GSidebar.meta.json` el 2026-11-08; `gzip -9`, no se remidió al documentar; #1069). Se conecta una vez por aplicación, y es independiente de `sidebar-filter`: el orden de `app.use` no importa.

```js
import SidebarIndex from '@grana/vue/sidebar-index'

app.use(SidebarIndex)   // conecta la piel index, el plegado de grupos y la marca con todos los GSidebar
```

En SSR instala el plugin en la aplicación del servidor **y** en la del cliente: si solo está en una, el HTML no coincide al hidratar.

**Sin la extensión, nunca es un error** y avisa una vez (A5): `appearance="index"` se pinta como `default` entero (con iconos, asiento y botón de contraer); un grupo `collapsible` se pinta **fijo y abierto**, sin botón ni flecha, y **`collapsed: true` se ignora** (no se esconde navegación sin un control que la devuelva); `closedGroups` se acepta y se ignora, y `update:closedGroups` no se emite.

### Qué cambia con `index`

| | `default` | `index` |
| --- | --- | --- |
| Formatos | expandida, riel, navbar, drawer | **expandida y drawer**: `auto` es expandida desde `breakpoints.expanded` y drawer por debajo; `rail` se pinta expandida y `navbar` drawer (aviso A1) |
| Item | asiento con icono o `code` | **sin icono ni asiento** (`icon` y el slot `icon` se ignoran, aviso A2); texto en `text-muted` |
| `code` | dentro del asiento | **al final de la fila**, decorativo, cifras tabulares; el nombre accesible lo lleva después de la etiqueta («GCombobox, 24») |
| Actual | asiento lleno | color de acento y **la marca** |
| Hover | luz y `text` | la luz se ensancha un poco y no pisa a la actual |
| Cabecera | logo, contraer, filtro | **la banda**: el alto de la banda de `GAppShell`, con su línea; el filtro a la derecha de la marca, que crece al pedirlo |
| `collapsed`, `overlay`, `variant`, `barCount`, `search` | actúan | **no actúan** |

El filtro (`filter`) funciona igual que antes: en reposo ocupa poco, y con el foco o con texto crece y tapa la marca. Con el campo vacío el recuento queda oculto a la vista y sigue anunciándose.

### Grupos plegables

Un grupo con `collapsible: true` e `id` pinta su título como un botón (patrón *Disclosure* de APG: `aria-expanded` y `aria-controls`), en `default` y en `index`; **en el riel se ignora** (todo abierto). Reglas:

1. **Estado.** Sin `closedGroups`, vive en la instancia y nace del `collapsed` de cada grupo; no se guarda entre recargas. Con `closedGroups` manda el arreglo: úsalo con `v-model:closedGroups` para controlarlo o guardarlo (en `sessionStorage`, por ejemplo). Un `id` que no es de un grupo plegable válido se ignora.
2. **La ruta abre.** Al montar y cada vez que cambia `modelValue`, el grupo del actual se abre. El primer render ya lo pinta abierto.
3. **El filtro abre sin tocar el estado.** Con consulta, todo grupo con coincidencias se ve abierto sin animar y sin emitir; el botón lleva `aria-disabled="true"` mientras hay consulta. Al vaciar, cada grupo vuelve a su estado.
4. **Ctrl+F encuentra una entrada plegada:** el cuerpo cerrado lleva `hidden="until-found"` y `beforematch` lo abre.
5. **Teclado.** Tab recorre botones y enlaces; los enlaces de un grupo plegado no reciben foco; Intro y Espacio pliegan y despliegan; ↑ ↓ Inicio Fin incluyen los botones de grupo visibles.
6. **`labels.groupCurrent`** (recomendado): texto oculto en el botón de un grupo plegado que contiene la actual.

### La marca del actual

El actual solo cambia de color frente a sus vecinos, y eso no basta (WCAG 1.4.1): por eso la marca es obligatoria en `index`. Una barra de 2 px en `--g-color-accent-text` (5,27:1 en claro y 5,12:1 en oscuro frente a la columna, cifras del contrato, `manual`) **viaja** de una fila a otra con `--g-duration-slow`. Si el actual está en un grupo plegado, la marca queda **hueca** sobre el botón del grupo. En un viaje corto (hasta 1,5 filas) usa `--g-ease-spring`; en uno largo la clase `is-far` cambia a `--g-ease-out` para que **no rebase** y se pare un instante sobre la fila vecina (#1071). Con `prefers-reduced-motion: reduce` salta y solo se funde. Hasta que se coloca la capa, un indicador estático de CSS ya señala al actual, así que el HTML del servidor trae la señal.

En el drawer de `index`, al abrir, la fila del actual (o el botón de su grupo) queda **centrada** si cabe; con la extensión, esto también vale en `default`.

Avisos de desarrollo: **A1** `mode` `rail` o `navbar` con `index`; **A2** `icon` con `index`; **A3** grupo `collapsible` sin `id`; **A4** `appearance` fuera de la lista (se pinta `default`); **A5** `index`, `collapsible` o `closedGroups` sin la extensión.

## Riel

- **Panel flotante** de un padre: se abre con **clic, Enter, Espacio o →** y con el **puntero encima** (150ms); **el foco solo no lo abre**. Al abrir con teclado el foco va al hijo actual o al primero; ↑ ↓ Inicio Fin se mueven; **Esc o ←** lo cierran y devuelven el foco al padre; Tab hacia fuera lo cierra. Está pegado al item, con el nombre del padre y una muesca que lo conecta.
- **Pista** con el nombre del control (DECISIONS #433 y #436; es el motor interno de [`GTooltip`](../GTooltip/README.md#modo-visual-clientes-internos) en modo visual y sustituye a la pista propia de antes): solo con el formato resuelto `rail`, en cada item de la navegación (enlaces, items solo acción y **padres**), en la búsqueda y en contraer/expandir. Dice `item.label` (en la búsqueda y en contraer, el nombre del propio botón), sin insignia ni contador. **Nunca es la única fuente del nombre:** la pista es un nodo `aria-hidden`, sin `role` ni `id`, y las etiquetas siguen en el DOM.
  - **Cuándo se abre:** con el puntero tras 350 ms; con el foco, al instante, solo si llegó por navegación; y al instante si otra se vio hace menos de 600 ms. Solo hay una abierta en todo el documento.
  - **Viaje:** dentro del `<nav>` la pista viaja de item en item, también entre grupos, con el puntero y con ↑ ↓ Inicio Fin. La búsqueda y contraer están en la cabecera: son otro grupo, y entre ellos y los items aparece al instante. Va a la derecha lógica (a la izquierda en RTL) y se voltea si no cabe.
  - **Padres:** la pista los nombra hasta que se abre su panel. Con el puntero, el panel abre a los 150 ms y la pista no llega a verse; si abrió al instante, se cierra cuando el panel abre. Con el teclado, Tab o ↑ ↓ hasta un padre muestran su pista, y Intro, Espacio o → abren el panel y la cierran. Pista y panel no se ven a la vez sobre el mismo padre (medido: 0 cuadros, en los tres motores).
  - **Esc:** el primero cierra la pista sin mover el foco.
  - **Pulsación larga (táctil):** muestra el nombre y **no navega** (ni `navigate` ni `update:modelValue`) ni abre el panel de un padre; sin menú ni vista previa del enlace del sistema. Un toque normal hace lo de siempre.
  - **Dónde existen los nodos:** al final de la raíz, en `rail` y en `expanded` (mismo DOM; en `expanded` están presentes pero inactivos); **`navbar` y `drawer` no llevan nodos**. La pista abierta se cierra al salir del riel.
  - **Navbar:** no lleva pista (DECISIONS #437). Sus items inactivos siguen mostrando solo el icono y la pulsación larga no los nombra; el nombre vive en el DOM como texto oculto.
  - **Medido** (coco, [`design/lab/tooltip/auditoria-pista.md`](../../../../../design/lab/tooltip/auditoria-pista.md); Chromium, Firefox y WebKit; densidades, `fixed` y `floating`, RTL): la pestaña coincide con el control con un máximo de 0,25 px; el nombre contra la página, 15,20:1 como mínimo; los nodos no cambian ninguna medida del sidebar (Δ0, también con una pista abierta). Resultado de la auditoría completa de las tres pistas: 31 347/31 347. **Peso:** −5 B gzip en `grana.js` y −40 B en `grana.umd.js` (sustituye la pista propia; `GSidebar.meta.json`, medido por bruno el 2026-10-06).
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
| `update:query` | String | El texto del filtro cambia (escribir, vaciar con Esc o con el botón) |
| `update:closedGroups` | Array de `id` | El usuario pliega o despliega un grupo (clic, Intro o Espacio), `beforematch` abre uno (Ctrl+F) o la ruta abre el del actual. El filtro no lo emite. Sin la extensión `@grana/vue/sidebar-index`, nunca |

Métodos expuestos: `open()`, `close()` (drawer), `toggle()` (contraer/expandir), `focus()` (primer item) y `focusFilter()`: con la extensión, enfoca el campo y selecciona su texto (en el riel lo expande, en el drawer o el navbar emite `update:open` con `true`); sin ella, o sin `filter`, no hace nada.

## Slots

| Slot | Contenido |
| --- | --- |
| `logo` | Identidad en la cabecera. Alcance `{ collapsed }` (en el riel, la marca sola) |
| `header` | Contenido extra bajo el logo. Alcance `{ collapsed }` |
| `search` | Sustituye al disparador de búsqueda (no se emite `search`) **o al filtro**: con `filter` y este slot, manda el slot y el filtro no se pinta. Alcance `{ collapsed }` |
| `icon` | Icono de un item (decorativo). Alcance `{ item }` |
| `item` | Contenido de un item, en lugar de icono y etiqueta. Alcance `{ item, active, collapsed, level }`; **conserva el texto de la etiqueta** (es el nombre accesible) |
| `user` | Área de usuario al pie. Alcance `{ collapsed }`; **en el riel, solo el avatar con nombre accesible que das tú**; el menú del usuario es tuyo |
| `toggle-icon`, `search-icon`, `more-icon` | Iconos de los botones de contraer, de búsqueda y de «Más» (normalmente un `GIcon`). En el riel, el icono de `toggle-icon` se voltea; con `flip-rtl`, en RTL los dos espejos se anulan (verificado) |

### Pie de usuario (slot `user`)

El slot no trae marcado propio: tú pones **un botón de ancho completo** con el [`GAvatar`](../GAvatar/README.md), el nombre y el rol. En el riel (`collapsed`) queda solo el avatar y el botón recibe el nombre accesible con `aria-label`; en la barra expandida el nombre ya está escrito, así que el avatar es decorativo y no lleva `label`. Es el patrón del playground (`packages/vue/playground/index.html`, sección de `GSidebar`, `data-test="sb-user-av"`):

```vue
<!-- Fragmento: `actual`, `items` y `labels` son de tu aplicación -->
<g-sidebar v-model="actual" :items="items" label="Principal" :labels="labels">
  <template #user="{ collapsed }">
    <button type="button" class="pie-usuario"
            :aria-label="collapsed ? 'Ana García, Administradora' : undefined">
      <g-avatar name="Ana García" size="md" :categories="8"></g-avatar>
      <span v-if="!collapsed" class="pie-usuario__texto"><b>Ana García</b><small>Administradora</small></span>
    </button>
  </template>
</g-sidebar>
```

```css
/* CSS de tu aplicación (en el playground va en línea) */
.pie-usuario { display: flex; align-items: center; gap: 10px; inline-size: 100%; min-block-size: 44px;
  padding: 4px 8px; border: 0; border-radius: 10px; background: transparent; color: inherit; font: inherit; cursor: pointer; }
.pie-usuario__texto { display: flex; flex-direction: column; text-align: start; line-height: 1.25; }
```

- **Fragmento:** `actual`, `items` y `labels` son los de tu aplicación (ver «Uso»). `:categories="8"` supone que tu tema declara `categories: 8`; sin eso el avatar se queda neutro y avisa en desarrollo (ver [`GAvatar`](../GAvatar/README.md)).
- **El área táctil la pones tú:** el ejemplo usa `min-block-size: 44px`. `GAvatar` no es interactivo, el CSS de la barra no estiliza el botón del slot (solo el contenedor `g-sidebar__foot`) y el menú de la cuenta (por ejemplo un `GMenu`) también es tuyo; cuida tú su foco visible.
- Verificado solo en el playground; no medí aquí el contraste del nombre y el rol sobre la barra ni el comportamiento con lector de pantalla.

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
| Escribir en el filtro | Filtra en cada cambio |
| Intro en el filtro | Activa el primer destino visible y habilitado, como un clic (pasa por `navigate`); sin consulta o sin coincidencias, nada |
| ↓ en el filtro | Lleva el foco al primer item visible; desde ahí, el teclado de siempre |
| ↑ en el primer item visible | Vuelve al campo |
| Esc en el filtro con texto | Vacía el filtro, el foco se queda y **no se propaga** (no cierra el drawer); con el campo vacío, se propaga |

## Accesibilidad

- **Luz de hover** (coco, [`design/lab/hover-glide/auditoria.md`](../../../../../design/lab/hover-glide/auditoria.md)): la capa es `aria-hidden` y no cambia la cuenta de items que anuncia el lector; el puntero no mueve el foco. Contraste del texto sobre la luz **13,43:1** (etiqueta, claro), **13,17:1** (oscuro) y **8,59:1** (zona de marca); `medido` en Chromium (115/115 y 268/268).
- **Filtro** (`medido` en Chromium, `sidebar-filter.spec.mjs` 9/9): campo nativo `type="search"` con `<label>` oculto, no un `combobox` (filtra una lista que sigue siendo la navegación), recuento unido por `aria-describedby`, anuncio cortés a los 600 ms. Con `code`, el asiento sigue `aria-hidden` y el nombre accesible del enlace lleva antes el código («24 GCombobox, enlace»), para que lo que se ve y lo que se dice coincidan (WCAG 2.5.3). **No verificado:** el recuento y el anuncio con un lector de pantalla real.
- **`<nav aria-label>` con solo enlaces y botones de submenú**; cabecera y pie van fuera de la región. Cada grupo es una lista con su título como nombre (también en el riel: el título se oculta visualmente y queda en el DOM).
- **El nombre accesible es texto real**, no `aria-label` ni tooltip: las etiquetas del riel y de los items inactivos de la píldora se ocultan visualmente y siguen ahí; los indicadores visibles son `aria-hidden` y su texto es `badgeLabel`.
- **`aria-current="page"`** solo en el destino real; `aria-expanded`/`aria-controls` en los padres (`aria-haspopup` en el riel); el submenú cerrado es `inert` (sin foco ni lectura).
- **El movimiento no transmite nada que el estado no tenga** y con `prefers-reduced-motion` quedan los fundidos (se quitan desplazamientos y escalas).
- **Objetivos:** item de 40px (`space × 10`) y **44px** con `pointer: coarse`; botones del riel de 44px; celdas del navbar de al menos 44×48px.
- **Contraste** (auditoría): por defecto, item 6.9:1, título de grupo 4.72:1, contador 16.48:1 y borde del buscador 3.45:1; con otro tema (espacio 5, foco de 3px), 4.48:1 o más. Con **`forced-colors`**, el item activo pasa a un contorno de `CanvasText` y la píldora usa `Highlight`.
- **Punto (`dot`) con cualquier tema** (DECISIONS #673): el punto no lleva nada encima, así que se pinta en `--g-color-{color}-text`. Con los temas pálidos del CLI y dentro de `data-g-zone="brand"` llega a **4.15:1 o más** (antes, entre 1.32:1 y 2.99:1). **Sobre la píldora actual del navbar** el punto va sin fondo y en `--g-sidebar-on-current` (10.78:1 o más). Antes de esta corrección se veía como un cuadrado blanco. El **contador** lleva un trazo interior `--g-color-{color}-text` (DECISIONS #674). Con el tema por defecto no se ve; con una marca pálida la caja llega a **4.15:1 o más** (antes, 1.32:1 con `primary` `#FFD400`). Sobre la píldora actual del navbar se invierte y va sin trazo. Medido en Chromium, Firefox y WebKit ([`design/lab/relleno-familia/medida.md`](../../../../../design/lab/relleno-familia/medida.md)).

## Movimiento

Solo transiciones (se interrumpen y se revierten) con `--g-duration-*` y `--g-ease-*`, todas por debajo de los 300ms: el ancho al contraer y expandir (las etiquetas entran un instante después), el submenú (altura y opacidad), el fundido del item activo, la pulsación, el panel flotante y el drawer (**también al cerrar**), la pista (instantánea tras otra reciente), la entrada del navbar y el crecimiento de la píldora. **El sidebar no se reconstruye** al contraer, expandir, navegar o abrir un submenú: es la misma raíz por formato (así corren las transiciones). El hover de un item ya no es un fondo propio: lo pinta la luz de su lista (ver más abajo).

### Una sola luz

El resaltado de hover es **un único fondo por lista** que se desliza de enlace en enlace bajo el puntero, como en [`GMenu`](../GMenu/README.md), en vez de que cada enlace funda su propio fondo (DECISIONS #957 a #964; contrato [`sidebar.md`](../../../../../design/contracts/sidebar.md) «Una sola luz» y [`api.md`](../../../../../docs/contract/api.md) «Una sola luz»). **No hay props, slots ni eventos nuevos.**

- **La luz es del puntero y el anillo es del teclado.** El puntero **no mueve el foco**: pasar el ratón por la navegación no te saca del campo en el que escribes (WCAG 3.2.1 y 2.4.3). Si el puntero y el teclado están en enlaces distintos, se ven los dos a la vez. El teclado no enciende la luz.
- **Solo ratón y lápiz.** Con el toque no se enciende nada.
- **Pasa también por el item actual:** la luz va por detrás de su asiento (relleno, tinta y filo) y no lo cambia.
- **Solo ilumina lo que recibe un clic.** Un item deshabilitado, el título de un grupo, el margen entre grupos y el pie la apagan; la búsqueda, contraer y el usuario conservan su propio hover.
- **Cada lista tiene su luz:** cada grupo de la expandida y del drawer (los hijos de un submenú abierto son de la lista de su padre), el riel y el **panel flotante** del riel, que lleva la suya (la del riel se apaga al pasar a él). El **navbar no lleva capa**: su hover por celda entra con un fundido y sale al instante, para que nunca haya dos a la vez.
- **Cambios de medida que verás al actualizar:** los enlaces miden **2 px más** (40 → 42 en `default`, 30 → 32 en `compact`, 44 → 46 en el riel): la junta de antes entre items pasa a ser área de clic, la luz se recorta por dentro y se ve del tamaño de siempre; el paso entre filas no cambia. El **submenú abierto ya no lleva margen** entre el padre y sus hijos y mide **8 px menos**.
- **Movimiento:** posición y tamaño con `--g-duration-press` y `--g-ease-out`, aparición con `--g-duration-fast`; sin muelle. La primera colocación al entrar y las recolocaciones sin gesto (desplazamiento, expandir, abrir un submenú) no viajan, solo se funden.
- **`prefers-reduced-motion: reduce`:** la luz aparece en su sitio sin viajar (solo fundido). **`forced-colors`:** la luz se oculta y manda el foco del sistema.
- **Tema:** sin tokens nuevos; la luz usa `--g-color-border` (el hover de siempre sobre la carcasa; dentro de una zona de marca, el de la zona).

## Tema

El componente solo lee tokens `--g-*`. La **carcasa** es `--g-surface-shell` y el item actual, la **inset** del mismo sistema (`--g-surface-inset` con contorno `--g-color-border-strong`); el panel y el navbar usan `--g-color-surface`, `--g-shadow-2/3` y `--g-radius-*`; el drawer, `--g-surface-*`. `color` reasigna la píldora y los indicadores; el foco es `--g-color-focus`. Define **tokens de estructura** que usa tu diseño para reservar espacio:

```css
:root {
  --g-sidebar-width: calc(var(--g-space-1) * 66);  /* 264px con space 4 */
  --g-sidebar-rail: calc(var(--g-space-1) * 16);   /* 64px */
  --g-sidebar-bar: calc(var(--g-space-1) * 17);    /* 68px */
}
```

**Tokens del item actual (#612–#619):** el fondo del «asiento» animado y la píldora del navbar responden a tres ranuras:

```css
:root {
  --g-sidebar-current: ;          /* color del asiento (relleno del item actual en expanded/rail) */
  --g-sidebar-on-current: ;       /* color del texto y el icono sobre el asiento */
  --g-sidebar-current-edge: ;     /* borde lateral del asiento (el filo que lo recorta) */
}
```

Sin definir, el tema por defecto usa `--g-surface-inset` con contorno `--g-color-border-strong` y texto `--g-color-text`. El asiento entra con `--g-ease-spring` (decisión #299 y #635): al navegar de un item a otro la píldora se asienta con el resorte.

**`aria-current="page"`** solo va en el destino actual (el enlace o botón con `id = modelValue`); las ramas activas reciben peso y color pero no `aria-current`.

## Clases

Las emite el componente y las estiliza `GSidebar.css`: `g-sidebar` (con `--mode-{expanded|rail|navbar}`, `--variant-*`, `--color-*`, `--density-*`, `--overlay`, `--contained`, `is-entering`), `__head`, `__top`, `__logo`, `__toggle`, `__search`, `__hint`, `__nav`, `__groups`, `__group`, `__group-title`, `__list`, `__item`, `__link` (con `is-active`, `is-branch`), `__parent`, `__sub` (con `is-open`), `__chevron`, `__icon`, `__label`, `__badge` (y `__badge--dot`), `__sr`, `__foot`, `__fly`, `__fly-title`, `__bar`, `__tab`, `__more`, `__label--hidden`, `__drawer`, `__filter`, `__filter-box`, `__filter-icon`, `__filter-input`, `__filter-hint`, `__filter-clear`, `__filter-count` (con `is-empty`; la raíz y el botón del riel llevan `is-filtering` con consulta), `data-code` en `__icon` (item con `code`), `__highlight` (la luz, `li[role="none"][aria-hidden="true"]`, primer hijo de cada lista) y `__fly-list` (la lista del panel flotante). Con la extensión `sidebar-index`: `g-sidebar--appearance-index` (en la raíz y en la raíz interna del drawer), `is-collapsible`, `is-closed`, `has-current`, `is-animating` e `is-instant` en `__group`, `__group-body`, `__code` (el número al final) y `__mark` (la marca, con `is-full`, `is-hollow` e `is-far`; `has-mark` en `__nav`). Los nodos de la pista del riel son `g-tooltip` (con `aria-hidden`), hijos de la raíz; `__tip` e `is-instant` ya no existen.

## Alcance

- **`index` y el plegado de grupos viven en la extensión** `@grana/vue/sidebar-index`: sin `app.use`, se pinta `default` con los grupos fijos y abiertos (A5). Los padres con `children` dentro de `index` **no están prototipados** (comparten el submenú en línea, sin icono ni asiento). **La marca no es opcional en `index`:** sin ella el actual solo se distinguiría por color (WCAG 1.4.1).
- **Un solo nivel de hijos**; sin árboles profundos, arrastrar ni favoritos. **Sin buscador propio:** `search` solo dispara el evento; el filtro del índice es una extensión que conectas tú (ver «Filtro del índice»). **El filtro no busca en el texto de las páginas:** si tu aplicación lo hace, mete sus resultados en un grupo `filterable: false`. **Sin menú contextual del usuario:** el slot `user` lo pones tú (por ejemplo con [`GMenu`](../GMenu/README.md)).

- **Grana no trae textos ni los iconos de tu navegación**: `labels` y los iconos de `icon`, `toggle-icon`, `search-icon` y `more-icon` son de la aplicación (por nombre de Lucide o con `GIcon` en el slot; los que no están en la lista de la librería, con `createIcons`).

- **En la píldora activa, los items inactivos no muestran su nombre** (existe para lectores) y la navbar no lleva pista (#437): un usuario nuevo no lo ve. Las etiquetas del navbar deben ser cortas.

- **El item actual no rellena la fila: la marca es el asiento del icono** (DECISIONS #612 a #619; la superficie sola medía 1,08:1 frente a la carcasa y por eso la marca no es un tono de fila). Relleno `--g-sidebar-current`, tinta `--g-sidebar-on-current` y filo `--g-sidebar-current-edge` (por defecto `primary` / `on-primary` / `primary-text`, §7.1); en el riel el padre del actual lo representa con `is-rep`. Verificado en `design/lab/sidebar/auditoria.md` (addendum) con `sidebar-asiento.spec.mjs` y `sidebar-activo.spec.mjs`.

- **Si tu contenedor tiene el ancho del visor**, la adaptación decide por él: da un `container` razonable. El primer instante tras montar se pinta expandido.

- **El espacio lo reservas tú** (tokens y `mode-change`): el componente no empuja el contenido.

## Verificación

- Sin `@starting-style` ni `interpolate-size` (navegadores antiguos), el submenú y las salidas del panel y del drawer no se animan.

- **Tema oscuro:** `grana.css` ya trae el esquema oscuro por defecto (`defaults.css`): sigue `prefers-color-scheme` y se fuerza con `data-theme="dark"` o `data-theme="light"` en cualquier elemento (ver [«Tema oscuro» del README raíz](../../../../../README.md#tema-oscuro)). Al documentar no se repitieron en oscuro las cifras de contraste de este README.

- **Luz de hover (Una sola luz), solo Chromium:** `node design/lab/hover-glide/auditoria-verificar.mjs chromium` 115/115 (sidebar, riel, panel flotante, drawer, navbar, RTL, claro, oscuro y zona de marca), `estilo-verificar.mjs chromium` 268/268 y `personalidad-sidebar-glide.spec.mjs` con la de la tabla 24/24. **Sin verificar en Firefox, WebKit, con lector de pantalla real ni con `forced-colors` real** (emulado en Chromium). **Rendimiento (`medido` en Chromium, con reserva):** con un sidebar de 60 items el p95 de la luz es de 0,3 a 0,9 ms tras ff20a8c; una pasada dio 2,2 ms y no se trazó. Las tareas largas del barrido son ruido de la VM compartida (H1b); por DECISIONS #965 el criterio «0 tareas largas» se exige en un entorno sin vecinos (integración continua o la máquina del usuario), donde aún no se ha comprobado. Firefox y WebKit sin medir (fila G de [`auditoria.md`](../../../../../design/lab/hover-glide/auditoria.md)).

- **Filtro del índice y `code` (`medido` en Chromium, 2026-11-08):** `design/lab/theme-playground/tests/sidebar-filter.spec.mjs` 9/9 (atajo y número, código en el asiento y en el nombre accesible, sin acentos y grupos vacíos, caja estable, padres, drawer, riel, sin la extensión, 500 destinos con 5 a 14 ms por tecla de JavaScript y parche; el estilo y la disposición del navegador llegaron a 50 ms en alguna tecla) y `GSidebar.filter.test.js` (19 pruebas, nivel `prueba`). **Sin verificar:** Firefox y WebKit del filtro; el recuento con un lector de pantalla real; el IME real con Intro. El filtro está construido por bruno y **sin auditoría de coco** (`GSidebar` conserva `candidate` por su auditoría anterior; el filtro no está cubierto por ella).

- **`index`, grupos y marca (`prueba`, 2026-11-08):** `GSidebar.index.test.js`, 29 pruebas en verde; junto con `GSidebar.test.js` (87) y `GSidebar.filter.test.js` (19), toda la suite de `GSidebar` pasa.
- **`index` en navegador:** el prototipo de kiwi (`design/lab/sidebar/r03/verificar.mjs`) declara 743/743 en los tres motores (`manual`: cifra de su contrato, no se reejecutó) y `design/lab/sitio/calco-estilo/verificar.mjs` mide la paridad del marco con `dist/`, 2080/2080 en los tres motores (`medido`, `resultados.json`). `design/lab/theme-playground/tests/sidebar-index.spec.mjs` (9 casos) existe y **no se ejecutó al documentar**: `sin verificar`. **La auditoría de coco sobre el componente real con un tema distinto del de por defecto sigue pendiente** (`GSidebar.meta.json`, `pending`): lector de pantalla con el botón de grupo y «GCombobox, 24», Ctrl+F real, táctil real, `forced-colors` real y RTL.
- **Sin verificar:** un lector de pantalla real (riel, ramas, contadores, panel, píldora, drawer), Safari real, el navbar y el drawer en un dispositivo táctil real y con el teclado virtual, RTL con un idioma RTL real, cientos de items y `forced-colors` real de Windows (solo emulado en Chromium). Los cortes de adaptación, el asiento, `is-rep` y la pista del riel están medidos en Chromium, Firefox y WebKit (`tests/sidebar-asiento.spec.mjs`, `sidebar-activo.spec.mjs`, `sidebar-pista.spec.mjs`); `prefers-reduced-motion` está medido con la preferencia emulada en Chromium, Firefox y WebKit (`design/lab/theme-playground/tests/limitaciones.spec.mjs`, 18/18 el 2026-10-18: con `reduce` ningún elemento conserva transiciones ni animaciones de movimiento).

- **Pendientes abiertos:** la auditoría de coco de `index` (arriba) y, en [`PENDIENTES.md`](../../../../../PENDIENTES.md), la comprobación de `accent-text` sobre `surface-sunken` en el motor de tema (#1072). Los generales, en `PENDIENTES.md`.

## Fuentes

- API: [`GSidebar.meta.json`](./GSidebar.meta.json) · Contrato: [`design/contracts/sidebar.md`](../../../../../design/contracts/sidebar.md) · Prototipo: [`design/lab/sidebar/r01/`](../../../../../design/lab/sidebar/r01/) · Auditoría: [`design/lab/sidebar/auditoria.md`](../../../../../design/lab/sidebar/auditoria.md) · Apariencia `index`, grupos y marca (DECISIONS #1060 a #1065, #1069, #1071) · Filtro y código del item (DECISIONS #1035, #1036, #1050): [`sidebar.md`](../../../../../design/contracts/sidebar.md) «Filtro del índice» · Una sola luz (DECISIONS #957 a #964): [`api.md`](../../../../../docs/contract/api.md), [`estilo.md`](../../../../../design/lab/hover-glide/estilo.md), [`auditoria.md`](../../../../../design/lab/hover-glide/auditoria.md)
