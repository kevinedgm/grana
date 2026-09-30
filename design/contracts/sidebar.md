# Contrato · GSidebar

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/sidebar/r01/` (kiwi)
**Tag:** `g-sidebar` · **Categoría:** navegación

Navegación lateral (principal o secundaria) que **se transforma con un solo sistema**: **expandida** (etiquetas, grupos, submenús en línea), **riel** de iconos (submenús en un panel flotante) y, en móvil, **navbar inferior** con la «píldora activa» o **drawer**. Alcance decidido por el usuario (DECISIONS.md #67 a #70): navegación por arreglo `items` y slots, búsqueda que solo dispara un evento, adaptación por el ancho del contenedor con `mode` manual, navbar inferior con los primeros N items y «Más», estilo «píldora activa».

## Principios

- **Orientación primero.** El item activo (`aria-current="page"`) y su **rama** son reconocibles en los cuatro formatos; un solo estado de navegación (destino actual y ramas abiertas) se comparte entre ellos.
- **El nombre vive en el DOM.** Las etiquetas del riel y de los items inactivos de la píldora se ocultan **visualmente**, no se quitan; el tooltip es ayuda visual y `aria-hidden`, **nunca la única fuente del nombre**.
- **No depende del puntero.** Un panel flotante se abre con clic, Enter, Espacio o →; el foco solo no lo abre; Esc lo cierra y devuelve el foco.
- **Profundidad contenida:** grupos → items → **un nivel** de hijos.
- **Presenta y emite intención.** El destino actual es un prop (`modelValue`); el componente emite `navigate` (con el evento nativo, cancelable) y `update:modelValue`. La navegación real (router, `href`) es de la aplicación.
- **Sin textos por defecto** (Grana es internacional): todo texto de la interfaz va en `labels` y en los datos de `items`. Sin iconos propios: los pone la aplicación.

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | ver «Modelo de `items`» | `[]` | propia |
| `modelValue` | String \| Number \| null | `id` del destino actual | `null` | compartida |
| `label` | String | texto libre | sin valor | propia (nombre del `<nav>`) |
| `mode` | String | `auto` `expanded` `rail` `navbar` `drawer` | `auto` | propia |
| `mobile` | String | `navbar` `drawer` | `navbar` | propia (qué es «móvil» en `auto`) |
| `collapsed` | Boolean | | `false` | propia (con `update:collapsed`) |
| `open` | Boolean | | `false` | propia (drawer; con `update:open`) |
| `container` | String \| Element | selector CSS o elemento | el elemento padre | propia |
| `contained` | Boolean | | `false` | propia |
| `variant` | String | `fixed` `floating` | `fixed` | propia (no es la lista compartida) |
| `overlay` | Boolean | | `false` | propia |
| `barCount` | Number | 3, 4 o 5 | `4` | propia |
| `search` | Boolean | | `false` | propia |
| `closeOnNavigate` | Boolean | | `true` | propia (drawer) |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida (relleno de la píldora) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |

### Reglas de props

- **`items`:** ver «Modelo de `items`». Un elemento sin `id` o sin `label` se ignora y avisa una vez en desarrollo; `id` **único** en todo el arreglo (duplicados avisan).
- **`modelValue`:** el `id` del destino actual (item o hijo). Solo uno lleva `aria-current="page"`. Un padre cuyo hijo es el actual queda como **rama activa** (clase `is-branch`, peso y color), **sin** `aria-current`. Un `id` sin item se trata como ninguno.
- **`label`:** nombre accesible del `<nav>`. **Obligatorio**: sin `label` (ni `aria-label` en `$attrs`) avisa en desarrollo. Sin valor por defecto.
- **`mode`:** con `auto` decide la adaptación por el ancho (ver «Adaptación»); los demás lo fijan. `mode="navbar"` o `"drawer"` fijan el formato móvil aunque el contenedor sea ancho.
- **`mobile`:** en `auto`, por debajo del umbral del riel: `navbar` (barra inferior con «Más») o `drawer` (sin barra; el botón de menú lo pone la aplicación y abre con `open`).
- **`collapsed`:** el usuario contrae y expande con el botón de la cabecera; **esa elección se conserva mientras el ancho del contenedor no cambie de clase** (expandida / riel / móvil): al cambiar de clase se descarta y vuelve a decidir el ancho. Con `mode` distinto de `auto`, `collapsed` solo actúa en `expanded` y `rail` (`collapsed` = `rail`). Emite `update:collapsed`.
- **`open`:** abre y cierra el drawer (`<dialog>` modal): el del modo `drawer` y el «Más» del navbar. Emite `update:open`.
- **`container`:** el elemento cuyo **ancho** decide el modo `auto`; por defecto, el elemento padre de la raíz (el contenedor del diseño). Se observa con un observador de tamaño.
- **`contained`:** en `navbar` y en `drawer`, `false` fija la barra o el drawer al **visor**; `true` los posiciona dentro del contenedor (para demostraciones y paneles).
- **`variant`:** `fixed` = borde a borde con un borde interior; `floating` = margen, radio y sombra (superficie flotante). Aplica a expandida y riel; el navbar es siempre flotante (píldora).
- **`overlay`:** con `rail`, el usuario puede expandir **sobre** el contenido sin moverlo: la superficie expandida se posiciona encima del riel y **no** desplaza el diseño.
- **`barCount`:** cuántos items van en la barra (además de «Más»).
- **`search`:** muestra el disparador de búsqueda en la cabecera (campo compacto expandido, botón de icono en riel; en el navbar vive en el drawer). El texto y el atajo salen de `labels`. Solo emite `search`.
- **`closeOnNavigate`:** el drawer se cierra al elegir un destino (`navigate` no cancelado).
- **`color`:** relleno de la píldora activa del navbar y de los indicadores (`--g-color-{color}` y `on-`); **el estado activo del sidebar es neutro** (superficie elevada), no colorido.
- **`density`:** multiplica la altura del item (1×, 0.875×, 0.75×) con piso de 24px, como el resto; el navbar no la usa (objetivos táctiles).
- **Atributos:** `class`, `style`, `data-*` y `aria-*` (salvo `aria-label`, que es `label`) van a la **raíz**.

### Modelo de `items`

```js
[
  { label: 'Principal', items: [                       // grupo (label = título del grupo)
    { id: 'home', label: 'Inicio', href: '/', icon: 'home' },
    { id: 'inbox', label: 'Bandeja', href: '/inbox', icon: 'inbox', badge: 12, badgeLabel: '12 sin leer' }
  ]},
  { label: 'Espacio', items: [
    { id: 'proj', label: 'Proyectos', icon: 'folder', children: [
      { id: 'p1', label: 'Todos', href: '/p' }, { id: 'p2', label: 'Archivados', href: '/p/arch' }
    ]},
    { id: 'bill', label: 'Facturación', icon: 'card', disabled: true }
  ]},
  { id: 'set', label: 'Ajustes', href: '/settings', icon: 'cog' }   // item sin grupo
]
```

- **Grupo:** `{ label, items, id? }` (con `items`). Un elemento de primer nivel sin `items` es un **item sin grupo**. `label` del grupo es su nombre (`aria-labelledby`); en el riel el título se oculta visualmente y **sigue en el DOM**.
- **Item:** `{ id, label, href?, icon?, badge?, badgeLabel?, dot?, disabled?, primary?, children? }`. `icon` es un valor **de la aplicación** (nombre, componente…) que recibe el slot `icon`; Grana no trae iconos. `badge` es un número o texto corto (visible, `aria-hidden`); `dot` una marca sin número; **`badgeLabel` es el texto para lectores** (obligatorio si hay `badge` o `dot`: aviso en desarrollo). Cualquier otro campo se conserva y llega a los slots.
- **`href`:** un item con `href` es un `<a>`; sin `href` ni `children`, un item de solo acción (`<button>`) que emite `navigate` igualmente. Con un router, la aplicación cancela el evento nativo de `navigate` y navega ella.
- **`children`:** un **solo nivel**; un hijo `{ id, label, href?, badge?, badgeLabel?, disabled? }` no lleva `icon` propio ni `children` (los nietos se ignoran y avisan). Un padre es siempre un botón de submenú (no navega por sí mismo).
- **`disabled`:** `<a role="link" aria-disabled="true">` **sin `href`** (no recibe foco; se lee en modo de exploración), tachado y atenuado.
- **`primary`:** en el navbar, los items con `primary` van en la barra; sin ninguno, **los primeros `barCount`** no deshabilitados (padres incluidos). Más de `barCount` marcados: los primeros `barCount`.

## Textos (`labels`)

Ninguno tiene valor por defecto. Los requeridos avisan una vez en desarrollo.

| Clave | Uso | Requerido |
| --- | --- | --- |
| `collapse`, `expand` | Nombre del botón de contraer y de expandir | Sí (expandida y riel) |
| `more` | Etiqueta del botón «Más» del navbar | Sí (navbar) |
| `moreActive` | Texto oculto cuando la página actual está fuera de la barra («contiene la página actual») | Recomendado |
| `drawer` | Nombre accesible del drawer (`<dialog>`) | Sí (drawer y navbar) |
| `close` | Nombre del botón de cierre del drawer | Recomendado |
| `search` | Texto del disparador de búsqueda | Sí (con `search`) |
| `searchHint` | Atajo visible del disparador (p. ej. «⌘K»), decorativo | No |

## Adaptación (`mode="auto"`)

Se decide por el **ancho del contenedor** (`container`), medido con un observador de tamaño; **sin literales**: los umbrales derivan de `--g-space-1`:

| Ancho del contenedor | Formato |
| --- | --- |
| ≥ `--g-space-1 × 240` (960px con `space` 4) | **Expandida** |
| ≥ `--g-space-1 × 150` (600px) y menor que el anterior | **Riel** |
| menor que `--g-space-1 × 150` | **Móvil**: `navbar` o `drawer` según `mobile` |

- **No usa el número de items** (el scroll de la región central lo resuelve) ni el tipo de puntero: `pointer: coarse` solo sube los objetivos a 44px y en un riel táctil el panel se abre con toque.
- **La elección manual del usuario** (contraer o expandir) se conserva mientras la **clase de ancho** no cambie.
- El componente emite **`mode-change`** con `{ mode }` (`expanded` `rail` `navbar` `drawer`) cada vez que el formato resuelto cambia, **para que la aplicación reserve el espacio** (ver «Espacio en el diseño»).
- **Un solo estado de navegación:** el destino actual y las ramas abiertas se conservan al cambiar de formato.
- **Consulta de medios:** no hay ninguna; `pointer: coarse` y `prefers-reduced-motion` son preferencias del navegador, no umbrales de tema.

## Movimiento

El sidebar se anima con **transiciones** (no keyframes) allí donde el usuario puede interrumpir o revertir, y con tokens de duración y curva del sistema (`--g-duration-*`, `--g-ease-*`); **no hay curvas ni duraciones propias**. Todo lo anima coco (`GSidebar.css`); bruno solo alterna clases y atributos **sobre el mismo DOM** (no reconstruye el sidebar al contraer, expandir, navegar o abrir un submenú: se perderían las transiciones).

| Movimiento | Qué se anima | Notas |
| --- | --- | --- |
| Expandir y contraer | Ancho de la raíz; las etiquetas, títulos y atajo **entran** un instante después, ya con sitio | La raíz es la misma en `expanded` y `rail` (cambia solo la clase `--mode-*`); el icono del botón se voltea |
| Submenú en línea | Altura y opacidad (`is-open`) | `interpolate-size`; sin soporte, abre sin animar |
| Item activo | Fondo, contorno y peso pasan de un item al otro con un fundido corto | Sin re-render |
| Pulsación | Encogimiento mínimo (`scale`) de items y celdas del navbar | Suelta más rápido que aprieta |
| Panel flotante | Nace de la muesca (`transform-origin`), con opacidad, escala y un desplazamiento corto; **también se anima al cerrar** | Persistente; sin `scale(0)` |
| Pista | Solo un fundido; instantánea tras otra reciente | |
| Navbar | La barra **sube desde el borde** al pasar a este formato (`is-entering`); la celda actual **crece** y la etiqueta entra tras ella | La píldora se anima cambiando `is-current` en el mismo `<li>` |
| Drawer | El panel **se desliza desde su borde de origen** (su propio ancho, sin píxeles; espejado en RTL) con el fondo fundiéndose; **también se anima al cerrar**; los grupos entran escalonados (~30ms) | `<dialog>` con `allow-discrete` |
| Indicadores | Aparecen con un pequeño crecimiento | |

- **Duraciones:** de 120ms (color, pista) a 160ms (panel, chevrón, etiquetas) y 240ms (ancho, altura, píldora, drawer); ninguna supera los 300ms.
- **Movimiento reducido:** se conservan los **fundidos** y se quitan los desplazamientos, las escalas y los escalonados (menos y más suave, no cero).
- **Frecuencia:** el hover de un item es solo color (sin movimiento); nada anima al navegar con el teclado más allá del cambio de estado.

## Formatos

### Expandida

Cabecera (logo, botón de contraer, búsqueda opcional), región de navegación con scroll, pie (usuario). Los grupos muestran su título (menos peso que los items); un padre abre sus hijos **en línea** (`aria-expanded`, `aria-controls`), con sangría corta y una línea de conexión sutil. **El submenú cerrado no lleva `hidden`: lleva `inert` (sin foco ni lectura) y le falta la clase `is-open`**, para poder animar la altura; abrir y cerrar solo alterna `is-open`, `inert` y `aria-expanded` sobre el mismo elemento. Ancho: `--g-sidebar-width`.

### Riel

Ancho `--g-sidebar-rail`. Etiquetas y títulos de grupo ocultos visualmente (siguen en el DOM); iconos de **44px**; el estado activo se conserva; un contador o punto pasa a una marca sobre el icono. Un padre lleva `aria-haspopup="true"` y una marca de submenú.

- **Panel flotante** (`popover="manual"`, `role="group"`, `aria-label` = etiqueta del padre): título visible con el nombre del padre y sus hijos, **pegado al item** con un hueco de 4px y una muesca que lo conecta; se abre con **clic, Enter, Espacio o →** y con el **puntero encima** (retardo de **150ms**); **el foco solo no lo abre**. Al abrir con teclado, el foco va al hijo actual (o al primero); ↑ ↓ Inicio Fin se mueven; **Esc o ←** cierran y devuelven el foco al padre; Tab hacia fuera lo cierra; clic fuera lo cierra. Con el puntero, salir del item o del panel da **220ms de gracia** para llegar al otro.
- **Pista** (un solo elemento `popover`, `aria-hidden`): el nombre del item, junto a él; aparece con el puntero tras **350ms** y **sin retardo** con `:focus-visible`; **si ya se mostró otra hace menos de ~600ms, aparece al instante** (sin retardo ni fundido: clase `is-instant`); no aparece en padres (su panel ya lleva el nombre).
- **Superpuesto (`overlay`):** la expansión ocurre encima del contenido.

### Navbar inferior («píldora activa»)

`<nav aria-label>` flotante en el borde inferior: superficie de esquinas amplias con sombra suave y margen; contiene un `<ul>` con **`barCount` items** y un botón final **«Más»**.

- **Píldora activa:** el item actual (o la rama, o «Más» si la página actual no está en la barra) se **expande** en una píldora rellena con `--g-color-{color}` que muestra **icono y etiqueta**; los demás items muestran **solo el icono** (etiqueta oculta visualmente, **siempre en el DOM**). El ancho de la píldora se anima al cambiar de página (transición corta); con `prefers-reduced-motion: reduce` el cambio es inmediato.
- **Objetivos:** cada celda de al menos **44×48px**; la etiqueta visible de la píldora de al menos 12px y **corta** (el desborde se recorta con elipsis). Relleno inferior con el área segura (`env(safe-area-inset-bottom)`).
- **Items de la barra:** los `primary` o los primeros `barCount`. Un **padre** en la barra es un botón `aria-haspopup="dialog"` que **abre el drawer con su rama abierta**. **«Más»** (`aria-haspopup="dialog"`) abre el drawer completo (grupos, búsqueda, usuario).
- **Orientación:** si el destino actual **no** está en la barra, «Más» (o el padre) queda como **rama activa** con el texto oculto `labels.moreActive`; nunca lleva `aria-current`.
- **Teclado:** Tab recorre los items y «Más»; ← → (invertidas en RTL) Inicio y Fin mueven entre ellos.
- **Espacio:** la barra mide `--g-sidebar-bar` de alto (con su margen); la aplicación reserva ese espacio (ver más abajo).
- **Contadores y puntos:** una marca sobre el icono con su texto oculto (`badgeLabel`).

### Drawer

`<dialog>` modal (`showModal()`) desde el borde inicial, ancho `min(--g-space-1 × 80, 86vw)` (320px con `space` 4), con **el mismo contenido expandido** (cabecera, búsqueda, grupos, usuario). Es el «Más» del navbar o, con `mobile="drawer"`, el único formato móvil. Atrapa el foco; cierra con **Esc**, con el **fondo** y **al elegir un destino** (`closeOnNavigate`); **devuelve el foco** al botón que lo abrió («Más», el padre de la barra o el botón de la aplicación). Emite `update:open`.

## Estructura accesible

```html
<div class="g-sidebar g-sidebar--mode-expanded g-sidebar--variant-fixed g-sidebar--color-brand g-sidebar--density-default">
  <div class="g-sidebar__head">
    <div class="g-sidebar__top">
      <div class="g-sidebar__logo">…slot logo…</div>
      <button class="g-sidebar__toggle" type="button" aria-expanded="true" aria-label="Contraer la barra lateral">…</button>
    </div>
    <button class="g-sidebar__search" type="button" aria-haspopup="dialog"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label">Buscar</span><kbd class="g-sidebar__hint" aria-hidden="true">⌘K</kbd></button>
  </div>
  <nav class="g-sidebar__nav" aria-label="Principal">
    <ul class="g-sidebar__groups" role="list">
      <li class="g-sidebar__group" role="presentation">
        <span class="g-sidebar__group-title" id="ID-g0">Principal</span>
        <ul class="g-sidebar__list" aria-labelledby="ID-g0">
          <li class="g-sidebar__item">
            <a class="g-sidebar__link is-active" href="/" aria-current="page"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label">Inicio</span></a>
          </li>
          <li class="g-sidebar__item">
            <a class="g-sidebar__link" href="/inbox"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label">Bandeja</span><span class="g-sidebar__badge" aria-hidden="true">12</span><span class="g-sidebar__sr">, 12 sin leer</span></a>
          </li>
          <li class="g-sidebar__item">
            <button class="g-sidebar__link g-sidebar__parent is-branch" type="button" aria-expanded="true" aria-controls="ID-proj"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label">Proyectos</span><span class="g-sidebar__chevron" aria-hidden="true"></span></button>
            <ul class="g-sidebar__sub is-open" id="ID-proj"><li><a class="g-sidebar__link" href="/p">…</a></li></ul>   <!-- cerrado: sin is-open y con inert -->
          </li>
        </ul>
      </li>
    </ul>
  </nav>
  <div class="g-sidebar__foot">…slot user…</div>
</div>

<!-- Riel: el mismo marcado, con g-sidebar--mode-rail; el padre lleva aria-haspopup="true" y aria-expanded según su panel -->
<div class="g-sidebar__fly" popover="manual" role="group" aria-label="Proyectos"><div class="g-sidebar__fly-title">Proyectos</div><ul>…<li><a class="g-sidebar__link" href="/p" aria-current="page">…</a></li></ul></div>
<div class="g-sidebar__tip" popover="manual" aria-hidden="true">Inicio</div>

<!-- Navbar -->
<nav class="g-sidebar g-sidebar--mode-navbar" aria-label="Principal">
  <ul class="g-sidebar__bar" role="list">
    <li class="is-current"><a class="g-sidebar__tab" href="/" aria-current="page"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label">Inicio</span></a></li>
    <li><a class="g-sidebar__tab" href="/inbox"><span class="g-sidebar__icon" aria-hidden="true">…</span><span class="g-sidebar__label g-sidebar__label--hidden">Bandeja</span><span class="g-sidebar__badge" aria-hidden="true">12</span><span class="g-sidebar__sr">, 12 sin leer</span></a></li>
    <li><button class="g-sidebar__tab g-sidebar__more" type="button" aria-haspopup="dialog">…<span class="g-sidebar__label">Más</span></button></li>
  </ul>
</nav>
<dialog class="g-sidebar__drawer" aria-label="Navegación">…el sidebar expandido…</dialog>
```

- **`<nav>` con solo enlaces y botones de submenú**: la cabecera y el pie van fuera de la región de navegación. En el navbar, el `<nav>` es la raíz.
- **Nombre accesible = texto real.** Las etiquetas ocultas visualmente usan el patrón estándar de texto oculto; **no** se sustituyen por `aria-label`. Los indicadores visibles son `aria-hidden` y el texto para lectores es `g-sidebar__sr` (`badgeLabel`).
- **Los grupos** son `<ul>` con `aria-labelledby` (título), también en el riel (título oculto visualmente, presente).
- **Panel y pista:** `popover="manual"`; **son elementos persistentes** (uno por sidebar; el panel cambia de contenido y de nombre al abrirse para otro padre; la pista es una sola instancia): se muestran con `showPopover()` y se ocultan con `hidePopover()`, **sin quitarlos del DOM**, para que su salida se anime.

## Teclado

| Tecla | Acción |
| --- | --- |
| Tab / Shift+Tab | Recorre los enlaces, botones de submenú, contraer, búsqueda y usuario en el orden del documento; los deshabilitados no reciben foco |
| ↑ / ↓ | Item anterior / siguiente **visible** y no deshabilitado de la región de navegación |
| Inicio / Fin | Primer / último item visible |
| Enter / Espacio | En un padre expandida: abre o cierra sus hijos. En un padre del riel: abre el panel. En un enlace: navega |
| → | En un padre del riel: abre el panel |
| ← / Esc | Dentro del panel: lo cierra y devuelve el foco al padre |
| ← → / Inicio / Fin | En el navbar: mueven entre los items (← → se invierten en RTL) |
| Esc | En el drawer: lo cierra y devuelve el foco |

## Slots

| Slot | Propósito | Alcance | Anatomía que debe conservar |
| --- | --- | --- | --- |
| `logo` | Identidad en la cabecera | `{ collapsed }` | Dentro de `g-sidebar__logo`; en el riel, la marca sola |
| `search` | Sustituye al disparador de búsqueda | `{ collapsed }` | La aplicación pone su propio botón con nombre; el evento `search` no se emite |
| `icon` | Icono del item | `{ item }` | Dentro de `g-sidebar__icon` (`aria-hidden`); decorativo |
| `item` | Contenido de un item (sustituye a icono + etiqueta) | `{ item, active, collapsed, level }` | Dentro del enlace o botón; sin interactivos; conserva el **texto de la etiqueta** (nombre accesible) |
| `user` | Área de usuario al pie | `{ collapsed }` | Dentro de `g-sidebar__foot`; en el riel, solo el avatar **con nombre accesible** que da la aplicación; el menú del usuario es de la aplicación |
| `header` | Contenido extra bajo el logo | `{ collapsed }` | Dentro de la cabecera |
| `toggle-icon` | Icono del botón de contraer y expandir (Grana no trae iconos) | `{ collapsed }` | Decorativo, dentro de `g-sidebar__toggle` (su nombre lo da `labels.collapse` o `labels.expand`) |
| `search-icon` | Icono del disparador de búsqueda | `{ collapsed }` | Decorativo, dentro de `g-sidebar__icon` |
| `more-icon` | Icono del botón «Más» del navbar | | Decorativo, dentro de `g-sidebar__icon` |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, event }` | El usuario elige un destino (clic o Enter en un enlace o botón sin hijos, o un hijo). `event` es el evento nativo: `event.preventDefault()` cancela la navegación del `href` (para un router) y también **impide** cerrar el drawer y emitir `update:modelValue` |
| `update:modelValue` | `id` del destino | Tras `navigate` no cancelado |
| `update:collapsed` | Boolean | El usuario contrae o expande con el botón |
| `update:open` | Boolean | El drawer se abre o se cierra |
| `mode-change` | `{ mode, overlay }` | El formato resuelto cambia (`expanded` `rail` `navbar` `drawer`); `overlay` es verdadero cuando el sidebar está **expandido encima del riel** (la aplicación reserva el ancho del riel) |
| `search` | | El usuario activa el disparador de búsqueda |

**Nota para bruno:** los demás eventos (`click`, `keydown`…) no se declaran; llegan a la raíz. Al elegir en el drawer, el foco vuelve al botón que lo abrió **antes** de emitir. Un item de solo acción (sin `href` ni `children`) emite `navigate` y no cambia `modelValue` si se cancela.

## Espacio en el diseño

La aplicación reserva el espacio del sidebar en su diseño; el componente no empuja el contenido:

| Formato | Espacio a reservar |
| --- | --- |
| Expandida | Ancho `--g-sidebar-width` (más el margen, si es `floating`) |
| Riel | Ancho `--g-sidebar-rail` (con `overlay`, el mismo: la expansión no lo desplaza) |
| Navbar | Alto `--g-sidebar-bar` en el borde inferior (`padding-block-end`) |
| Drawer | Ninguno (se abre sobre el contenido) |

`mode-change` avisa cuándo cambia. Los tres son **tokens de estructura** (ver «Tokens nuevos»), derivados de `--g-space-1`.

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus` | Superficie, borde y foco |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiquetas, iconos y títulos de grupo |
| `--g-color-{color}`, `--g-color-on-{color}` | Píldora activa y contadores del navbar |
| `--g-surface-inset`, `--g-surface-radius`, `--g-surface-radius-inset`, `--g-surface-backdrop` | Superficie flotante, navbar y drawer (sistema §11) |
| `--g-shadow-2`, `--g-shadow-3` | Superficie flotante, panel, navbar |
| `--g-radius-*` | Radios de item, panel y píldora |
| `--g-space-1..6` | Alturas, sangrías y separaciones (`space × …`) |
| `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight` | Texto |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out` | Transiciones cortas (ancho, etiquetas, panel, píldora, drawer) |
| `--g-glass-*` | **No** se usan |

**Tokens nuevos** (`tokens.md` §13): `--g-sidebar-width`, `--g-sidebar-rail`, `--g-sidebar-bar`.

## Clases (contrato entre bruno y coco)

Bruno las emite; coco las estiliza. Ninguno usa otras.

| Clase | Elemento | Cuándo |
| --- | --- | --- |
| `g-sidebar` | Raíz | Siempre |
| `g-sidebar--mode-{expanded\|rail\|navbar\|drawer}` | Raíz | Siempre (el formato resuelto; en `drawer`, el contenido del `<dialog>` es `expanded`) |
| `g-sidebar--variant-{fixed\|floating}`, `--color-*`, `--density-*`, `--overlay`, `--contained` | Raíz | Según props |
| `g-sidebar__head`, `__top`, `__logo`, `__toggle` | Cabecera | Expandida, riel y drawer |
| `g-sidebar__search`, `__hint` | Disparador de búsqueda | Con `search` |
| `g-sidebar__nav`, `__groups`, `__group`, `__group-title`, `__list`, `__item` | Región de navegación | Siempre |
| `g-sidebar__link` (+ `is-active`, `is-branch`), `__parent`, `__sub`, `__chevron` | Enlace y submenú | Según item |
| `g-sidebar__icon`, `__label`, `__badge`, `__sr` | Partes del item | Según item |
| `g-sidebar__foot` | Pie | Con el slot `user` |
| `g-sidebar__fly`, `__fly-title`, `g-sidebar__tip` | Panel flotante y pista | Solo riel |
| `g-sidebar__bar`, `__tab` (+ `is-current` en el `li`), `__more`, `g-sidebar__label--hidden` | Navbar | Solo navbar |
| `g-sidebar__drawer` | `<dialog>` | Drawer |
| `is-open` | `g-sidebar__sub` | Submenú abierto (cerrado: sin la clase y con `inert`) |
| `is-instant` | `g-sidebar__tip` | La pista aparece sin fundido (otra se mostró hace un momento) |
| `is-entering` | Raíz en `navbar` | Solo mientras la barra entra al pasar a este formato (bruno la pone y la quita al terminar la animación) |

## Resolución de hallazgos de r01

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| 1 | Nombre y modelo | `GSidebar`; `items` (grupos, items, un nivel de hijos), `modelValue` (`id` actual), `label` obligatorio | DECISIONS.md #67 |
| 2 | Estado | `mode`, `mobile`, `collapsed`, `open`, `variant`, `overlay`, `contained`, `container`, `barCount` | DECISIONS.md #67 y #69 |
| 3 | Umbrales | `space × 240` y `space × 150` medidos sobre el contenedor; sin literales ni consultas de medios | DECISIONS.md #69 |
| 4 | Textos | `labels` sin valores por defecto; `badgeLabel` de la aplicación | DECISIONS.md #70 |
| 5 | Búsqueda | `search` (Boolean) o slot `search`; texto y atajo en `labels`; evento `search` | Decisión del usuario |
| 6 | Usuario | Slot `user` con `{ collapsed }`; el menú es de la aplicación (un futuro `GMenu`) | Alcance |
| 7 | Slots | `logo`, `search`, `icon`, `item`, `user`, `header` | — |
| 8 | Eventos | `navigate` (con el evento nativo), `update:modelValue`, `update:collapsed`, `update:open`, `mode-change`, `search` | DECISIONS.md #70 |
| 9 | Router | Sin dependencia: `href` + `navigate` cancelable; un item de solo acción sin `href` | DECISIONS.md #70 |
| 10 | Panel y pista | `popover` propios; retardos de 150, 220 y 350ms (comportamiento, no tema); superficies y sombras vigentes | — |
| 11 | Persistencia | De la aplicación; el componente no toca `localStorage` | — |
| 12 | Cantidad de items y densidad | `auto` no usa el número de items; `density` altera la altura del item | DECISIONS.md #69 |
| 13 | Drawer | `closeOnNavigate` (verdadero); `<dialog>` nativo; el foco vuelve al botón que lo abrió | Kiwi 16 y 25 |
| 14 | Navbar móvil | `mode="navbar"`, `mobile`, `barCount`, `primary`; textos `more` y `moreActive` en `labels` | DECISIONS.md #68 |
| 15 | Espacio del navbar | Tokens `--g-sidebar-width`, `--g-sidebar-rail`, `--g-sidebar-bar` y evento `mode-change` | DECISIONS.md #69 |
| 16 | Padres en el navbar | Un padre en la barra abre el drawer con su rama abierta; sin submenús en la barra | Kiwi 24 |
| 17 | Estilos del navbar | **Solo «píldora activa»** (decisión del usuario); indicador deslizante y acción central descartados | DECISIONS.md #68 |

## Límites conocidos

- **Un solo nivel de hijos**; sin árboles profundos, arrastrar ni anclar favoritos.
- **Sin buscador propio** ni filtro de items: la aplicación decide qué abre `search`.
- **Sin menú contextual del usuario** (será `GMenu`): el slot `user` lo pone la aplicación.
- **Sin tema oscuro** todavía.
- **En la píldora activa, los items inactivos no muestran su nombre:** un usuario nuevo no lo ve (el nombre existe para lectores). Etiquetas de la píldora **cortas**.
- **La adaptación mide el contenedor**: si la aplicación no da un `container` razonable (el padre es del ancho del visor), decide por el ancho del padre.
- **Lector de pantalla:** cómo se anuncian el riel, las ramas, los contadores, el panel y la píldora está por verificar con lectores reales; Firefox, Safari, RTL con un idioma RTL real y táctil real por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (superficie elevada del activo, proporciones de la píldora, sombra, muesca del panel): los decide coco con los tokens listados.
- **Fuera de v0.1:** estado persistido, atajos de teclado globales (⌘K lo gestiona la aplicación), reordenar.
