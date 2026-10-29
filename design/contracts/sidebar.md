# Contrato · GSidebar

**Dueño:** lima · **Estado:** aprobado · **Basado en:** `design/lab/sidebar/r01/` (kiwi); el item actual, los cortes y el hueco del icono en `design/lab/sidebar/r02/` (§«Item actual: el asiento», §«Cortes de adaptación», DECISIONS.md #612 a #619)
**Tag:** `g-sidebar` · **Categoría:** navegación

Navegación lateral (principal o secundaria) que **se transforma con un solo sistema**: **expandida** (etiquetas, grupos, submenús en línea), **riel** de iconos (submenús en un panel flotante) y, en móvil, **navbar inferior** con la «píldora activa» o **drawer**. Alcance decidido por el usuario (DECISIONS.md #67 a #70): navegación por arreglo `items` y slots, búsqueda que solo dispara un evento, adaptación por el ancho del contenedor con `mode` manual, navbar inferior con los primeros N items y «Más», estilo «píldora activa».

## Principios

- **Orientación primero.** El item activo (`aria-current="page"`) y su **rama** son reconocibles en los cuatro formatos; un solo estado de navegación (destino actual y ramas abiertas) se comparte entre ellos.
- **El nombre vive en el DOM.** Las etiquetas del riel y de los items inactivos de la píldora se ocultan **visualmente**, no se quitan; el tooltip es ayuda visual y `aria-hidden`, **nunca la única fuente del nombre**. La pista del riel es el motor interno de `GTooltip` en modo visual (§«Pista del riel», #436; `tooltip.md` §«Modo visual»; sustituye a `g-sidebar__tip`).
- **No depende del puntero.** Un panel flotante se abre con clic, Enter, Espacio o →; el foco solo no lo abre; Esc lo cierra y devuelve el foco.
- **Profundidad contenida:** grupos → items → **un nivel** de hijos.
- **Presenta y emite intención.** El destino actual es un prop (`modelValue`); el componente emite `navigate` (con el evento nativo, cancelable) y `update:modelValue`. La navegación real (router, `href`) es de la aplicación.
- **Sin textos por defecto** (Grana es internacional): todo texto de la interfaz va en `labels` y en los datos de `items`. Sin iconos propios: los pone la aplicación (por nombre en `item.icon` o por slot; #202).

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
| `breakpoints` | Object \| null | `{ expanded?, rail? }` en px de ancho del contenedor | `null` (`space × 240` / `space × 150`) | propia (cortes de `auto`; #618) |
| `contained` | Boolean | | `false` | propia |
| `variant` | String | `fixed` `floating` | `fixed` | propia (no es la lista compartida) |
| `overlay` | Boolean | | `false` | propia |
| `barCount` | Number | 3, 4 o 5 | `4` | propia |
| `search` | Boolean | | `false` | propia |
| `closeOnNavigate` | Boolean | | `true` | propia (drawer) |
| `color` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `brand` | compartida (contadores y puntos; **ya no** la píldora, #615) |
| `density` | String | `default` `comfortable` `compact` | `default` | compartida |
| `labels` | Object | ver «Textos (`labels`)» | `{}` | propia |

### Reglas de props

- **`items`:** ver «Modelo de `items`». Un elemento sin `id` o sin `label` se ignora y avisa una vez en desarrollo; `id` **único** en todo el arreglo (duplicados avisan).
- **`modelValue`:** el `id` del destino actual (item o hijo). Solo uno lleva `aria-current="page"`. Un padre cuyo hijo es el actual queda como **rama activa** (clase `is-branch`, peso y color), **sin** `aria-current`. Un `id` sin item se trata como ninguno.
- **`label`:** nombre accesible del `<nav>`. **Obligatorio**: sin `label` (ni `aria-label` en `$attrs`) avisa en desarrollo. Sin valor por defecto.
- **`mode`:** con `auto` decide la adaptación por el ancho (ver «Adaptación»); los demás lo fijan. `mode="navbar"` o `"drawer"` fijan el formato móvil aunque el contenedor sea ancho.
- **`mobile`:** en `auto`, por debajo del umbral del riel: `navbar` (barra inferior con «Más») o `drawer` (sin barra; el botón de menú lo pone la aplicación y abre con `open`).
- **`breakpoints`:** ver «Cortes de adaptación». Solo actúa con `mode="auto"`.
- **`collapsed`:** el usuario contrae y expande con el botón de la cabecera; **esa elección se conserva mientras el ancho del contenedor no cambie de clase** (expandida / riel / móvil): al cambiar de clase se descarta y vuelve a decidir el ancho. Con `mode` distinto de `auto`, `collapsed` solo actúa en `expanded` y `rail` (`collapsed` = `rail`). Emite `update:collapsed`.
- **`open`:** abre y cierra el drawer (`<dialog>` modal): el del modo `drawer` y el «Más» del navbar. Emite `update:open`.
- **`container`:** el elemento cuyo **ancho** decide el modo `auto`; por defecto, el elemento padre de la raíz (el contenedor del diseño). Se observa con un observador de tamaño.
- **`contained`:** en `navbar` y en `drawer`, `false` fija la barra o el drawer al **visor**; `true` los posiciona dentro del contenedor (para demostraciones y paneles).
- **`variant`:** `fixed` = borde a borde con un borde interior; `floating` = margen, radio y sombra (superficie flotante). Aplica a expandida y riel; el navbar es siempre flotante (píldora).
- **`overlay`:** con `rail`, el usuario puede expandir **sobre** el contenido sin moverlo: la superficie expandida se posiciona encima del riel y **no** desplaza el diseño.
- **`barCount`:** cuántos items van en la barra (además de «Más»).
- **`search`:** muestra el disparador de búsqueda en la cabecera (campo compacto expandido, botón de icono en riel; en el navbar vive en el drawer). El texto y el atajo salen de `labels`. Solo emite `search`.
- **`closeOnNavigate`:** el drawer se cierra al elegir un destino (`navigate` no cancelado).
- **`color`:** relleno de los **contadores y puntos** (`--g-color-{color}` y `on-`) en todos los formatos. **No pinta el item actual ni la píldora del navbar**: los dos leen las ranuras del item actual (`--g-sidebar-current*`, §«Item actual: el asiento»; #615, cambia el uso de #68). Quien usaba `color` para teñir la píldora pasa a `--g-sidebar-current` en el tema.
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
- **Item:** `{ id, label, href?, icon?, badge?, badgeLabel?, dot?, disabled?, primary?, children? }`. `icon` es un valor **de la aplicación**: si es una **cadena** y no hay slot `icon`, el item dibuja `GIcon` con ese nombre en `g-sidebar__icon` (registro de la aplicación o lista de la librería; `icons.md` §5, `api.md` «Iconos en los componentes», #202); **con slot `icon`, manda el slot**; otro valor (componente, objeto) es un dato opaco que solo recibe el slot. `badge` es un número o texto corto (visible, `aria-hidden`); `dot` una marca sin número; **`badgeLabel` es el texto para lectores** (obligatorio si hay `badge` o `dot`: aviso en desarrollo). Cualquier otro campo se conserva y llega a los slots.
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

Se decide por el **ancho del contenedor** (`container`), medido con un observador de tamaño. Sin `breakpoints`, **sin literales**: los umbrales derivan de `--g-space-1`; con `breakpoints`, los pone la aplicación (§«Cortes de adaptación»):

| Ancho del contenedor | Formato |
| --- | --- |
| ≥ `breakpoints.expanded` (por defecto `--g-space-1 × 240`, 960px con `space` 4) | **Expandida** |
| ≥ `breakpoints.rail` (por defecto `--g-space-1 × 150`, 600px) y menor que el anterior | **Riel** |
| menor que `breakpoints.rail` | **Móvil**: `navbar` o `drawer` según `mobile` |

- **No usa el número de items** (el scroll de la región central lo resuelve) ni el tipo de puntero: `pointer: coarse` solo sube los objetivos a 44px y en un riel táctil el panel se abre con toque.
- **La elección manual del usuario** (contraer o expandir) se conserva mientras la **clase de ancho** no cambie.
- El componente emite **`mode-change`** con `{ mode }` (`expanded` `rail` `navbar` `drawer`) cada vez que el formato resuelto cambia, **para que la aplicación reserve el espacio** (ver «Espacio en el diseño»).
- **Un solo estado de navegación:** el destino actual y las ramas abiertas se conservan al cambiar de formato.
- **Consulta de medios:** no hay ninguna; `pointer: coarse` y `prefers-reduced-motion` son preferencias del navegador, no umbrales de tema.

### Cortes de adaptación (`breakpoints`; r02 hallazgo 10, elección del usuario 10-A; DECISIONS.md #618)

`breakpoints` es un objeto `{ expanded?, rail? }` con dos números en **px de ancho del contenedor** (el mismo ancho que ya mide `auto`, no el visor). Es configuración **de la instancia**, no del tema: cada sidebar puede tener los suyos (una navegación secundaria con cortes distintos de la principal).

| Regla | Comportamiento |
| --- | --- |
| Sin prop, `null` o `{}` | Los cortes de hoy: `expanded` = `--g-space-1 × 240`, `rail` = `--g-space-1 × 150` (siguen a `space`) |
| Una sola clave | La otra conserva su valor por defecto (`{ expanded: 1024 }` → riel desde 600px) |
| Valor no numérico, no finito o negativo | Esa clave se ignora (valor por defecto) y avisa una vez en desarrollo (aviso B1) |
| Clave desconocida | Se ignora y avisa una vez (aviso B1) |
| `rail` > `expanded` | `rail` **se recorta** a `expanded`. Avisa una vez (aviso B2) solo si la aplicación dio **las dos** claves; si `rail` es el valor por defecto (`{ expanded: 500 }`), se recorta sin aviso (no hay riel) |
| `rail` = `expanded` | **No hay riel** en `auto`: expandida desde el corte, móvil por debajo |
| `rail: 0` | Nunca móvil en `auto`: riel por debajo de `expanded` |
| `expanded: 0` | Siempre expandida en `auto` (el `rail` por defecto se recorta a 0 sin aviso) |
| `mode` distinto de `auto` | La prop no actúa (sin aviso) |
| Cambio de la prop | Se vuelve a decidir **al momento**, sin esperar a un cambio de tamaño; si la clase de ancho cambia, se descarta la elección manual de `collapsed` como en un cambio de tamaño y se emite `mode-change` |

- **Caso real del hallazgo** (drawer por debajo de 1024px, sin riel): `:breakpoints="{ expanded: 1024, rail: 1024 }" mobile="drawer"` (medido por kiwi en r02: 1000px → drawer, 1100px → expandida).
- **Límite asumido:** unos px de la aplicación **no siguen a `space`** si el integrador lo cambia; es el precio de que el corte sea explícito y por instancia (10-B, tokens leídos con `getComputedStyle`, y 10-C, `contentMin`, quedan descartados en #618).
- **Comparación:** `≥` en los dos cortes, como hoy; sin histéresis nueva.
- **Avisos** (`[Grana] GSidebar`, una vez por instancia y causa, con la guarda canónica de #653): **B1** `breakpoints.{clave}` no válido o desconocido, se usa el valor por defecto; **B2** `breakpoints.rail` (N) es mayor que `breakpoints.expanded` (M), se recorta a M.

## Movimiento

El sidebar se anima con **transiciones** (no keyframes) allí donde el usuario puede interrumpir o revertir, y con tokens de duración y curva del sistema (`--g-duration-*`, `--g-ease-*`); **no hay curvas ni duraciones propias**. Todo lo anima coco (`GSidebar.css`); bruno solo alterna clases y atributos **sobre el mismo DOM** (no reconstruye el sidebar al contraer, expandir, navegar o abrir un submenú: se perderían las transiciones).

| Movimiento | Qué se anima | Notas |
| --- | --- | --- |
| Expandir y contraer | Ancho de la raíz; las etiquetas, títulos y atajo **entran** un instante después, ya con sitio | La raíz es la misma en `expanded` y `rail` (cambia solo la clase `--mode-*`); el icono del botón se voltea |
| Submenú en línea | Altura y opacidad (`is-open`) | `interpolate-size`; sin soporte, abre sin animar |
| Item actual (asiento) | El asiento del destino **se llena desde el centro**; el del origen se vacía con un fundido; el aro, la ruta y el nodo con fundido (§«Item actual: el asiento», «Movimiento») | Sin re-render; con movimiento reducido, solo fundidos |
| Pulsación | Encogimiento mínimo (`scale`) de items y celdas del navbar | Suelta más rápido que aprieta |
| Panel flotante | Nace de la muesca (`transform-origin`), con opacidad, escala y un desplazamiento corto; **también se anima al cerrar** | Persistente; sin `scale(0)` |
| Pista | La de `GTooltip` (#436): fundido; relevo sin entrada tras otra reciente; **viaje** entre items de la navegación con `--g-duration-press` + `--g-ease-out` | Con movimiento reducido, el viaje salta |
| Luz de hover (#957) | **Una sola luz por lista** que se desliza al enlace bajo el puntero (posición y tamaño); aparece y se va con un fundido (§«Una sola luz») | Sigue al puntero, no al foco; con movimiento reducido, solo el fundido |
| Navbar | La barra **sube desde el borde** al pasar a este formato (`is-entering`); la celda actual **crece** y la etiqueta entra tras ella | La píldora se anima cambiando `is-current` en el mismo `<li>` |
| Drawer | El panel **se desliza desde su borde de origen** (su propio ancho, sin píxeles; espejado en RTL) con el fondo fundiéndose; **también se anima al cerrar**; los grupos entran escalonados (~30ms) | `<dialog>` con `allow-discrete` |
| Indicadores | Aparecen con un pequeño crecimiento | |

- **Duraciones:** de 120ms (color, pista) a 160ms (panel, chevrón, etiquetas) y 240ms (ancho, altura, píldora, drawer); ninguna supera los 300ms.
- **Movimiento reducido:** se conservan los **fundidos** y se quitan los desplazamientos, las escalas y los escalonados (menos y más suave, no cero).
- **Frecuencia:** el hover de un item **ya no pinta fondo propio**: lo marca la luz de su lista (§«Una sola luz», #957; enmienda de «el hover es solo color»), que viaja `--g-duration-press` sin muelle; la etiqueta sigue tomando `text` con `:hover` (solo color). Nada anima al navegar con el teclado más allá del cambio de estado: **el teclado no enciende la luz**.

## Item actual: el asiento (r02 hallazgos 2 y 11; DECISIONS.md #612 a #617 y #619)

**Elección del usuario: B · Asiento**, con relleno en el tema por defecto (no Δ0). **La fila no se rellena**: la marca es el **asiento del icono**, un círculo detrás del icono de un item de primer nivel. **Lleno = estás aquí. Hueco (solo aro) = la página actual está dentro (rama).** Es la **misma marca** en expandida, riel, drawer y navbar, donde el asiento **crece hasta la píldora**. Sustituye a la superficie `inset` + contorno `border-strong` + barra de acento del activo (#89 y #239 quedan enmendadas para `GSidebar` en #612).

### Ranuras (tokens de componente, `tokens.md` §43)

| Token | Pinta | Por defecto (claro y oscuro; los escribe coco) |
| --- | --- | --- |
| `--g-sidebar-current` | **Relleno**: el asiento lleno, el nodo del hijo actual y la píldora del navbar | `var(--g-color-primary)` |
| `--g-sidebar-on-current` | **Tinta sobre el relleno**: el icono dentro del asiento lleno; icono y etiqueta de la píldora | `var(--g-color-on-primary)` |
| `--g-sidebar-current-edge` | **Filo**: aro del asiento (lleno y hueco), aro del nodo, ruta encendida, trazo interior de la píldora | `var(--g-color-primary-text)` |

- Son **tokens de componente** (§17.6): ningún semántico expresa «relleno del item actual de la navegación» sin teñir con `primary` toda la interfaz, y la identidad del actual es **de tema**, no de instancia (por eso no es una prop). Precedente: `--g-card-selected` (#134).
- **Por qué esos valores:** el asiento lleno es un relleno de familia **marcado** (§7.1, #431): relleno `{familia}`, marca `on-{familia}`, contorno `{familia}-text`. En el tema por defecto `primary-text` = `primary` (claro y oscuro): el aro no se ve aparte; con una marca pálida, es el filo que da el 3:1.
- **La etiqueta de una fila no lee las ranuras:** queda en `--g-color-text` con `--g-text-action-weight` (actual, rama y representante). Solo en la píldora del navbar, donde está sobre el relleno, va en `--g-sidebar-on-current`.
- Se redeclaran en los bloques oscuros de `defaults.css` (un `var()` se resuelve donde se declara, §10; como `--g-surface-inset`). Un tema acotado a una clase (`.t-nisa`) debe redeclararlas igual que los alias de rol.

### Pares (regla del contrato; coco los mide, el CLI los diagnostica)

| # | Par | Mínimo | Por qué | En el tema por defecto |
| --- | --- | --- | --- | --- |
| P1 | `on-current` / `current` | **4.5:1** | La píldora del navbar lleva **texto** sobre el relleno (1.4.3). En el asiento bastaría 3:1 (icono, 1.4.11), pero una sola ranura sirve a los dos | Garantizado: `on-primary` / `primary` (§2) |
| P2 | `current-edge` / `--g-surface-shell` | **3:1** | El asiento hueco de la rama, el aro del nodo y la ruta **son solo filo** (1.4.11). Con el aro siempre dibujado, el asiento lleno también llega a 3:1 frente a la carcasa aunque su relleno no llegue | Garantizado: `primary-text` ≥ 4.5:1 sobre `surface` (§2); medido ≥ 4.21:1 sobre `surface-sunken` (§7.1) |
| P3 | `current-edge` / `--g-color-surface` | **3:1** | La píldora vive sobre la superficie del navbar; el nodo del hijo actual en el panel flotante, sobre la del panel | Garantizado (§2) |

- **Sin P4 relleno/carcasa:** no se exige (P2 es la señal). La identidad «marino relleno» del caso real pasa con su propio aro.
- **1.4.1:** además del color, la forma (lleno / hueco / nodo), el peso de la etiqueta y `aria-current` (o su ausencia en la rama).

### Anatomía (sin DOM nuevo)

- **Asiento:** la caja `g-sidebar__icon` de un **enlace o padre de primer nivel** de la navegación (`g-sidebar__link > .g-sidebar__icon`; ni la búsqueda, ni contraer, ni las celdas inactivas del navbar) crece al **asiento**: alias local `--_seat` = `--_ico + --g-space-1 × 3` (32px con `space` 4), con el glifo a `--_ico` en su centro. Relleno y aro en pseudo-elementos de la caja (`aria-hidden` ya). **El mismo tamaño en expandida, drawer y riel** (no cambia de forma al contraer; la celda del riel sigue siendo de 44px). Con `density` el asiento nunca desborda la fila: coco decide el valor de `compact` (fila 30px) midiendo; en `default`, el alto de la fila no cambia.
- **Item de primer nivel sin icono:** la caja `g-sidebar__icon` ya se dibuja vacía (`GSidebar.vue`); su asiento lleno es un disco (la marca no depende del icono).
- **Hijo actual:** **nodo** (círculo pequeño, relleno `current`, aro `current-edge`) sobre la línea de conexión, a la altura del hijo; la línea se **enciende** en `current-edge` desde el asiento del padre hasta el nodo (la ruta). Pseudo-elementos del enlace hijo y de `g-sidebar__sub` (clase nueva **`has-current`** en el `<ul>`, la pone bruno).
- **Panel flotante del riel:** el hijo actual lleva el **nodo** al inicio lógico de su fila, sin línea (el panel no la tiene).
- **Slot `item`:** sustituye icono y etiqueta, así que **no hay asiento**; el slot recibe `active` y la marca es de la aplicación (`aria-current` sigue). Límite documentado, sin aviso.

### Estados

| Estado | Expandida y drawer | Riel | Navbar |
| --- | --- | --- | --- |
| Actual (`aria-current="page"`, `is-active`) | Asiento **lleno** + aro; icono `on-current`; etiqueta `text` con peso | Asiento lleno + aro | Píldora (el asiento crecido) |
| Hijo actual | Nodo + ruta encendida; etiqueta `text` con peso | El hijo vive en el panel: nodo al abrirlo | — (el padre o «Más» es la píldora) |
| Rama (`is-branch`: padre con hijo actual) | Asiento **hueco** (solo aro); etiqueta `text` con peso; sin `aria-current` | El padre **representa** al actual: `is-branch` **+ `is-rep`** = asiento **lleno**, sin `aria-current` | Píldora en el padre o en «Más» (#68, como hoy) |
| Hover | **La luz de la lista pasa por todas las filas habilitadas, también el actual y su representante** (#959, enmienda de #564/#616): es una capa aparte bajo el contenido y el asiento no cambia. Ningún enlace pinta fondo de hover; la etiqueta toma `text` (solo color). Deshabilitado: apaga la luz | Igual, en celdas de 44px | Sin luz (reservado, #961): hover por celda con salida instantánea |
| Foco | Anillo `--g-color-focus` **fuera** de la fila, con `--g-focus-offset` de carcasa entre anillo y asiento (no depende del relleno) | Igual | Igual |
| Pulsado | El encogimiento de siempre | Igual | Igual |
| Deshabilitado | Nunca es actual ni rama | | |

- **`is-rep`** (nueva): la pone bruno en el **padre** cuyo hijo es el actual **solo mientras el formato resuelto es `rail`** (expandida y riel comparten DOM: se alterna al cambiar de formato, sin re-render). No añade `aria-*`: `aria-current` sigue solo en el hijo, dentro del panel (4.1.2).
- **Movimiento** (§29; #617): el asiento del destino **se llena desde el centro** (`clip-path` circular) con `--g-duration-slow` + **`--g-ease-spring`** (sexto uso; aprobado por el usuario en #635, que amplía #299 y #617; `tokens.md` §29.1); el del origen se vacía con un **fundido** `--g-duration-fast`; aro, nodo y ruta con fundido `--g-duration-fast`. **La tinta del destino cambia cuando el relleno ya la cubre** (retardo): nunca, ni un cuadro, `on-current` sobre la carcasa. La píldora del navbar conserva su crecimiento (240ms). **Con `prefers-reduced-motion: reduce`: solo fundidos** (`--g-duration-fast`), sin llenado, sin crecimiento de la píldora, sin dibujar la ruta. Nada se anima al montar.
- **`forced-colors`:** asiento lleno, nodo y píldora con `forced-color-adjust: none`: relleno **`Highlight`**, icono (y etiqueta de la píldora) **`HighlightText`**; aro del asiento (lleno y hueco), del nodo y trazo de la píldora en **`CanvasText`**; ruta encendida en `Highlight`; foco `Highlight`. La etiqueta de la fila sigue en `CanvasText` (sin ajuste).
- **RTL:** propiedades lógicas; el nodo y la ruta se espejan con el inicio lógico.

### Hueco del icono (hallazgo 11: 11-C, recomendación de kiwi; #619)

**El asiento resuelve el hueco:** el círculo de fondo lo pone el componente, así que la aplicación pasa **un icono normal** (1em, `currentColor`; `item.icon` por nombre o slot `icon`), no un icono con fondo propio. El hueco del glifo sigue en `--_ico` (privado, `space × 5`). Un hijo del slot `icon` mayor que `--_ico` no está soportado (límite documentado, sin aviso). **Reservado (11-A):** `--g-sidebar-icon-size` como token de tamaño del glifo, sin valor ni uso hasta que un caso real lo pida; 11-B (el hueco adopta su hijo) descartado.

### CLI

Diagnóstico informativo de P1 a P3 en claro y oscuro y **derivación del oscuro** cuando el tema declara las ranuras: `tokens.md` §43 y DECISIONS.md #614.

## Formatos

### Expandida

Cabecera (logo, botón de contraer, búsqueda opcional), región de navegación con scroll, pie (usuario). Los grupos muestran su título (menos peso que los items); un padre abre sus hijos **en línea** (`aria-expanded`, `aria-controls`), con sangría corta y una línea de conexión sutil. **El submenú cerrado no lleva `hidden`: lleva `inert` (sin foco ni lectura) y le falta la clase `is-open`**, para poder animar la altura; abrir y cerrar solo alterna `is-open`, `inert` y `aria-expanded` sobre el mismo elemento. Ancho: `--g-sidebar-width`.

### Riel

Ancho `--g-sidebar-rail`. Etiquetas y títulos de grupo ocultos visualmente (siguen en el DOM); iconos de **44px**; el estado activo se conserva con **el mismo asiento** que en expandida y, si el actual es un hijo, el **padre lo representa** (`is-rep`, asiento lleno; §«Item actual: el asiento»); un contador o punto pasa a una marca sobre el icono. Un padre lleva `aria-haspopup="true"` y una marca de submenú.

- **Panel flotante** (`popover="manual"`, `role="group"`, `aria-label` = etiqueta del padre): título visible con el nombre del padre y sus hijos, **pegado al item** con un hueco de 4px y una muesca que lo conecta; se abre con **clic, Enter, Espacio o →** y con el **puntero encima** (retardo de **150ms**); **el foco solo no lo abre**. Al abrir con teclado, el foco va al hijo actual (o al primero); ↑ ↓ Inicio Fin se mueven; **Esc o ←** cierran y devuelven el foco al padre; Tab hacia fuera lo cierra; clic fuera lo cierra. Con el puntero, salir del item o del panel da **220ms de gracia** para llegar al otro.
- **Pista**: el nombre del control, junto a él, con la forma y el comportamiento de `GTooltip` (§«Pista del riel», #436): con el puntero tras **350ms**, al instante con el foco **por navegación**, al instante y sin entrada si otra se vio hace menos de **600ms**; también en los **padres** hasta que se abre su panel.
- **Superpuesto (`overlay`):** la expansión ocurre encima del contenido.

### Navbar inferior («píldora activa»)

`<nav aria-label>` flotante en el borde inferior: superficie de esquinas amplias con sombra suave y margen; contiene un `<ul>` con **`barCount` items** y un botón final **«Más»**.

- **Píldora activa:** el item actual (o la rama, o «Más» si la página actual no está en la barra) se **expande** en una píldora que es **el asiento crecido** (§«Item actual: el asiento»): relleno `--g-sidebar-current`, icono y etiqueta en `--g-sidebar-on-current` y trazo interior `--g-sidebar-current-edge` (ya no `--g-color-{color}`, #615); muestra **icono y etiqueta**; los demás items muestran **solo el icono** (etiqueta oculta visualmente, **siempre en el DOM**). El ancho de la píldora se anima al cambiar de página (transición corta); con `prefers-reduced-motion: reduce` el cambio es inmediato.
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

<!-- Riel: el mismo marcado, con g-sidebar--mode-rail; el padre lleva aria-haspopup="true" y aria-expanded según su panel;
     si su hijo es el actual, is-branch + is-rep (asiento lleno, sin aria-current). Expandida: el <ul> de hijos con el actual lleva has-current -->
<div class="g-sidebar__fly" popover="manual" role="group" aria-label="Proyectos"><div class="g-sidebar__fly-title">Proyectos</div><ul>…<li><a class="g-sidebar__link" href="/p" aria-current="page">…</a></li></ul></div>
<div class="g-tooltip" popover="manual" aria-hidden="true">…<span class="g-tooltip__text" dir="auto">Inicio</span>…</div>   <!-- uno por control del riel, al final de la raíz (#436) -->

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
- **Panel y pistas:** `popover="manual"`; **son elementos persistentes** (el panel, uno por sidebar, cambia de contenido y de nombre al abrirse para otro padre; las pistas, **una por control del riel**, #436): se muestran con `showPopover()` y se ocultan con `hidePopover()`, **sin quitarlos del DOM**, para que su salida se anime.

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
| `icon` | Icono del item; **sustituye** al `GIcon` por nombre de `item.icon` | `{ item }` | Dentro de `g-sidebar__icon` (`aria-hidden`); decorativo |
| `item` | Contenido de un item (sustituye a icono + etiqueta) | `{ item, active, collapsed, level }` | Dentro del enlace o botón; sin interactivos; conserva el **texto de la etiqueta** (nombre accesible) |
| `user` | Área de usuario al pie | `{ collapsed }` | Dentro de `g-sidebar__foot`; en el riel, solo el avatar **con nombre accesible** que da la aplicación; el menú del usuario es de la aplicación |
| `header` | Contenido extra bajo el logo | `{ collapsed }` | Dentro de la cabecera |
| `toggle-icon` | Icono del botón de contraer y expandir (sin icono por defecto; normalmente un `GIcon`) | `{ collapsed }` | Decorativo, dentro de `g-sidebar__toggle` (su nombre lo da `labels.collapse` o `labels.expand`) |
| `search-icon` | Icono del disparador de búsqueda | `{ collapsed }` | Decorativo, dentro de `g-sidebar__icon` |
| `more-icon` | Icono del botón «Más» del navbar | | Decorativo, dentro de `g-sidebar__icon` |

**Ejemplo del slot `user`** (#295, `avatar.md`): el avatar es decorativo dentro del botón de la aplicación; el nombre es del botón (su texto al expandir, `aria-label` en el riel).

```html
<template #user="{ collapsed }">
  <button type="button" class="app-account" :aria-label="collapsed ? 'Cuenta de Ana García' : undefined">
    <GAvatar name="Ana García" :src="user.photo" size="md" />
    <span v-if="!collapsed">Ana García</span>
  </button>
</template>
```

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, event }` | El usuario elige un destino (clic primario sin modificadores o Enter en un enlace o botón sin hijos, o un hijo; con Ctrl/⌘/Mayús/Alt+clic o botón central no se emite: regla común de `api.md` «Enlaces y `navigate`», #505, enmienda de #70; pendiente en `GSidebar.vue`, bruno). `event` es el evento nativo: `event.preventDefault()` cancela la navegación del `href` (para un router) y también **impide** cerrar el drawer y emitir `update:modelValue` |
| `update:modelValue` | `id` del destino | Tras `navigate` no cancelado |
| `update:collapsed` | Boolean | El usuario contrae o expande con el botón |
| `update:open` | Boolean | El drawer se abre o se cierra |
| `mode-change` | `{ mode, overlay }` | El formato resuelto cambia (`expanded` `rail` `navbar` `drawer`); `overlay` es verdadero cuando el sidebar está **expandido encima del riel** (la aplicación reserva el ancho del riel) |
| `search` | | El usuario activa el disparador de búsqueda |

**Nota para bruno:** los demás eventos (`click`, `keydown`…) no se declaran; llegan a la raíz. Al elegir en el drawer, el foco vuelve al botón que lo abrió **antes** de emitir. Un item de solo acción (sin `href` ni `children`) emite `navigate` y no cambia `modelValue` si se cancela.

## Pista del riel (motor interno de `GTooltip`, modo visual; DECISIONS.md #436; cierra #113)

Regla común en `tooltip.md` §«Modo visual» (#433); aquí, lo propio de `GSidebar`. **Sustituye** la lógica de `g-sidebar__tip` (un solo nodo, `showTip`/`hideTip`, `is-instant`). **Estado:** aprobado por lima; pendiente de **bruno** y **coco**.

- **Cuándo aparece.** Solo con el formato resuelto **`rail`**, en los controles cuyo nombre se oculta visualmente en el riel: **cada item de la navegación** (enlaces, items de solo acción y **padres**), el disparador de **búsqueda** (`g-sidebar__search`) y el botón **contraer/expandir** (`g-sidebar__toggle`). **Padres** (cambia «no aparece en padres»): la pista los nombra hasta que su panel se abre; antes, quien llegaba con el teclado a un padre no veía su nombre (el foco no abre el panel). **No** en los hijos del panel flotante (tienen etiqueta visible), ni en `expanded`, `drawer` o `navbar`, ni en el slot `user` (es de la aplicación).
- **De dónde sale el texto.** Items: `item.label` (el texto de `g-sidebar__label`, oculto en el riel y nombre real; sin `badgeLabel`, cuya marca se ve sobre el icono). Búsqueda: el texto de su `g-sidebar__label`. Contraer/expandir: el de su `aria-label` (`labels.expand` en el riel). Con el slot `item`, sigue siendo `item.label`.
- **Nodos.** Uno por control de los anteriores, **al final de la raíz** (donde estaba `g-sidebar__tip`), en el orden del documento; existen en **`rail` y en `expanded`**, que comparten el mismo DOM (el sidebar no lo reconstruye al pasar de uno a otro): en `expanded` están presentes pero inactivos (`disabled()`, cerrados y sin mostrarse nunca) y solo se activan en `rail`. **`navbar` y `drawer` no llevan nodos** (dibujan otro árbol: 0 nodos; coherente con #437, la navbar no tiene pista). Al salir del riel, la pista abierta se cierra.
- **Elemento y ancla.** El enlace o botón es a la vez enfocable y caja visible (sin `data-g-tooltip-box`); lleva `data-g-tooltip` mientras tenga nodo.
- **Viaje en grupo.** Los items están dentro del `<nav>` (`g-sidebar__nav`), que es su grupo: la pista **viaja** de item en item, también entre grupos, con el puntero y con ↑ ↓ Inicio Fin. Búsqueda y contraer están en la cabecera, fuera del `<nav>`: su grupo es otro y entre ellos y los items no viaja (aparece al instante dentro de `SKIP`). **Lado:** `right` lógico (fin de línea; a la izquierda en RTL) pasado con `placement()`, sin añadir `aria-orientation` al `<nav>`; se voltea si no cabe (un riel en el borde final de la página).
- **Tiempos.** Los del motor: `OPEN` 350 ms y `SKIP` 600 ms (los de antes), más `CLOSE` 100 ms de gracia. El foco abre al instante solo si es **por navegación** (antes bastaba `:focus-visible`).
- **Con el panel flotante.** Un padre lleva `aria-expanded`: con el puntero, el panel abre a los 150 ms y la pista (350 ms) no llega a verse; si abrió al instante por `SKIP`, se cierra al abrirse el panel (`check()`). Con el teclado, Tab o ↑ ↓ hasta un padre muestran su pista; Intro, Espacio o → abren el panel y la cierran. Contraer/expandir lleva `aria-expanded="true"` en `expanded`, así que ahí nunca abre (y no hace falta: solo se activa en el riel).
- **Esc.** Con una pista abierta, el primero la cierra sin mover el foco (`preventDefault()`); el sidebar ignora un Esc con `defaultPrevented` fuera del panel (dentro del panel no hay pista abierta: su padre está expandido).
- **Táctil** (riel en una tableta). Pulsación larga sobre un item muestra el nombre y **no navega**: no se emiten `navigate` ni `update:modelValue`, el enlace no se sigue y el menú o la vista previa del enlace del sistema no aparecen (`-webkit-touch-callout: none` de `[data-g-tooltip]`); sobre un padre, no abre el panel. Un toque normal hace lo de siempre.
- **Sin duplicar el anuncio:** nombre real de cada enlace y botón sin cambio (etiqueta oculta o `aria-label`, `g-sidebar__sr`); ningún `aria-*` nuevo.
- **#383:** los nodos son hijos de la raíz: todo selector de `GSidebar.css` sobre los hijos de la raíz (`> *`, `:last-child`, `+`, `~`) lleva la exclusión `:where(.g-tooltip)`; ninguna medida del sidebar (umbrales del contenedor) los cuenta.
- **Fuera de este encargo, por decisión del usuario (2026-10-06, #437):** la **navbar** se queda como está. Sus items inactivos muestran solo el icono y **no** ganan la pista del motor con la pulsación larga: se respeta el comportamiento táctil elegido en #68. El nombre sigue en el DOM (texto oculto), así que nada se pierde para quien usa lector de pantalla.

### Encargo a bruno (Opus: se posiciona sobre otros) · `GSidebar.vue`, pruebas, `meta.json`

1. Quitar `g-sidebar__tip`, `showTip`, `hideTip`, `tipT`, `tipLast` e `is-instant`; nodos del modo visual con `attach(ctrl, node, { placement: () => 'right', disabled: () => format !== 'rail' })` para items, padres, búsqueda y contraer; `check()` al abrir y cerrar el panel; cerrar al cambiar de formato; `destroy` al quitar items y al desmontar.
2. Pulsación larga sin navegar ni abrir el panel.
3. Pruebas: las comunes de `tooltip.md` §«Modo visual» más: solo en `rail`; padres con pista por teclado que se cierra al abrir el panel; viaje con ↑ ↓ y entre grupos; RTL a la izquierda; ningún `navigate` tras la pulsación larga; Esc cierra la pista y no el panel ni el drawer. Las pruebas de la pista vieja (350/600, `is-instant`) se reescriben contra el motor. Playwright en los tres motores (puerto propio).
4. `GSidebar.meta.json`: la pista en la descripción del riel; peso medido.

### Encargo a coco (Opus) · `GSidebar.css` y medida

1. Quitar el estilo de `g-sidebar__tip` e `is-instant` (la pista usa `GTooltip.css`); #383 sobre los hijos de la raíz; Δ0 de rectángulos del sidebar en los cuatro formatos con y sin nodos.
2. **Medir la pestaña contra cada control del riel** (a la derecha: Δ < 1px del alto y del borde del item), items de 44px, padres con su marca de submenú, búsqueda y contraer; densidades; RTL; `variant` `fixed` y `floating`; claro, oscuro y un tema distinto; `forced-colors`; movimiento reducido (el viaje salta). Comprobar que la pista y el panel flotante no se ven a la vez sobre el mismo padre.
3. Táctil: `[data-g-tooltip]` con `pointer: coarse` en los enlaces del riel (sin vista previa del enlace ni selección).

## Espacio en el diseño

La aplicación reserva el espacio del sidebar en su diseño; el componente no empuja el contenido:

| Formato | Espacio a reservar |
| --- | --- |
| Expandida | Ancho `--g-sidebar-width` (más el margen, si es `floating`) |
| Riel | Ancho `--g-sidebar-rail` (con `overlay`, el mismo: la expansión no lo desplaza) |
| Navbar | Alto `--g-sidebar-bar` en el borde inferior (`padding-block-end`) |
| Drawer | Ninguno (se abre sobre el contenido) |

`mode-change` avisa cuándo cambia. Los tres son **tokens de estructura** (ver «Tokens nuevos»), derivados de `--g-space-1`.

## Una sola luz (DECISIONS.md #957 a #963; ronda `design/lab/hover-glide/r01/`)

Decisión del usuario del 2026-10-29: el resaltado de hover **se desliza de item en item** como en `GMenu` (M1, #305). Reglas comunes, utilidad y rúbrica de movimiento en `api.md` «Una sola luz». Aquí, lo propio de `GSidebar`. **Ninguna prop, slot, evento ni token del tema nuevo: `GSidebar.meta.json` no cambia.**

### Personalidad (#957)

- **La luz sigue al puntero y el puntero no mueve el foco** (a diferencia de `GMenu`, #305). El sidebar vive en la secuencia de Tab de la página: si el puntero moviera el foco, pasar el ratón por la navegación sacaría al usuario del campo en el que escribe (en móvil se cierra el teclado; en escritorio salta un `blur` con validación, #326), el lector anunciaría items que nadie eligió y en el riel se abrirían pistas por foco (#436). Choca con WCAG 3.2.1 y 2.4.3.
- **Dos canales:** la luz en el item del puntero, el anillo en el del teclado; si son distintos, se ven los dos. **El teclado no enciende la luz.** Solo `pointerType` `mouse` o `pen`; con el toque, nada.
- **«Dónde estás» y «adónde irías» conviven:** la luz pasa por detrás del asiento del actual sin apagarlo ni moverlo.

### Listas (anfitriones de la luz)

| Formato | Anfitrión (una luz cada uno) | Filas que forman parte | Qué la separa |
| --- | --- | --- | --- |
| Expandida y drawer | **cada** `ul.g-sidebar__list` (un grupo, o el de los items sin grupo) | sus `.g-sidebar__link` **y los de su `g-sidebar__sub` abierto** (los hijos son de la lista del padre) | título y margen del grupo |
| Riel | igual (mismo DOM, #138) | celdas de 44px | igual |
| Panel flotante del riel | su `ul`, que pasa a llevar la clase **`g-sidebar__fly-list`** | sus hijos | es otra superficie; la luz del riel se apaga al salir de su lista |
| Navbar | **sin luz** (reservado, #961) | — | — |

### Qué se registra (destinos de clic)

- **Sí:** todo `.g-sidebar__link` habilitado: enlace, botón de acción, padre (abierto o no), hijo, **actual (`aria-current`, `is-active`), representante (`is-rep`) y rama (`is-branch`)** (#959).
- **No:** `aria-disabled="true"` (el puntero encima **apaga** la luz, no la deja en el anterior); lo que está dentro de `[inert]` (submenú cerrado); búsqueda, contraer y pie (controles sueltos, no alternativas de una lista: conservan su hover propio).
- **La caja es la del enlace, no la de su `<li>`** (un submenú abierto daría al padre la altura de sus hijos). El hijo sangrado cambia x y ancho.

### Anatomía y datos (bruno escribe, coco pinta)

| Pieza | Quién | Qué es |
| --- | --- | --- |
| `li.g-sidebar__highlight[role="none"][aria-hidden="true"]` | bruno, en el vnode (como `g-menu__highlight`) | La capa, **primer hijo** de cada `g-sidebar__list` y de `g-sidebar__fly-list`. No cambia la cuenta de items que anuncia el lector |
| `--_highlight-x`, `--_highlight-y`, `--_highlight-w`, `--_highlight-h` | bruno (`utils/glide.js`, #962) | px **físicos**, **en la capa `g-sidebar__highlight`** (no en la lista: enmienda de #962 por rendimiento, `api.md`; coco las lee solo en la regla de la capa): izquierda y arriba de la caja del enlace respecto de la caja de relleno de la lista, más su scroll; ancho y alto del enlace. Físicos a propósito (la medida es `getBoundingClientRect`): la capa se ancla con `left`/`top` físicos también en RTL (medido por kiwi: con `inset-inline-start` caía 296px fuera) |
| `has-highlight` | bruno | En el anfitrión: hay destino bajo el puntero |
| `is-highlight-instant` | bruno | En el anfitrión: primera colocación de cada entrada del puntero y toda recolocación sin gesto (scroll, cambio de tamaño); se quita a los dos cuadros |
| Posición, color, radio, recorte, transición | coco | `GSidebar.css` |

- **Las filas se tocan** (#958): `gap` 0 en `.g-sidebar__list` y `.g-sidebar__sub`, y el submenú abierto **sin** margen de bloque entre el padre y su primer hijo; el área de clic de cada enlace crece la mitad del hueco anterior por cada lado y la luz se recorta otro tanto por dentro (se ve como el hover de hoy). Coco decide cómo recuperar el aire del submenú sin hueco y mide `compact` con el piso de 24px; la altura total de la lista puede crecer como mucho lo que sumaban esos huecos (lo mide coco).
- `g-sidebar__list` (y `g-sidebar__fly-list`) pasa a `position: relative`; los `.g-sidebar__item` ya lo son y pintan encima por orden del árbol.
- **Ningún `.g-sidebar__link` pinta fondo de hover** ni transiciona `background-color`; la etiqueta sigue tomando `text` con `:hover` (solo color). La exclusión de #564/#616 en el selector de hover queda **sin objeto** porque ese fondo desaparece; la regla general de #564 sigue para todo CSS nuevo.

### Token de la luz (#959)

**`--g-color-border`, el mismo que el hover de hoy.** Deriva de la coherencia con lo existente, no de identidad: la carcasa del sidebar es `--g-surface-shell`, que vale `surface-sunken` en el tema por defecto (`tokens.md`), así que una luz en `surface-sunken` como la de `GMenu` (que vive sobre `surface`) sería **Δ0, invisible**. El contrato fija el **rol** «el hover de hoy en su superficie»: `GMenu` y `GTable` (sobre `surface`) usan `surface-sunken`, `GSidebar` (sobre `shell`) usa `border`; el panel flotante, sobre `surface-inset`, usa el mismo `border` que hoy. Los contrastes **no cambian** respecto del hover actual (la etiqueta `text` y el icono `text-muted` ya se pintan sobre `border`); coco lo confirma en oscuro y en la zona de marca, que redeclara `--g-color-border` (#620), sin token nuevo.

### Estados

| Estado | Luz | Asiento / marca | Foco |
| --- | --- | --- | --- |
| Reposo | apagada | — | — |
| Puntero sobre un enlace | encendida en su caja | sin cambio | sin cambio |
| Actual, representante, rama | **encendida**; pasa por detrás | asiento intacto (lleno o hueco) | — |
| Padre con submenú abierto | encendida; baja a los hijos sin apagarse | — | — |
| Hijo | con la caja del hijo (sangría incluida) | nodo y ruta intactos | — |
| Submenú abriéndose o cerrándose, expandir y contraer | se recoloca **sin viajar** si cambia la caja | — | — |
| Deshabilitado, título de grupo, margen entre grupos, cabecera, pie | **apagada** | — | — |
| Foco de teclado en otro item | luz en el del puntero, anillo en el del foco | — | anillo de siempre, encima de la capa |
| Pulsado | se queda en lo pulsado hasta soltar | encogimiento de siempre | — |
| Riel | igual, en celdas de 44px; la pista (`visualTip`) viaja aparte (dos canales: nombre y destino) | asiento | — |
| Panel flotante | su propia luz | nodo del hijo actual | — |
| Drawer | igual que expandida, con ratón | — | — |
| Zona de marca | `--g-color-border` de la zona | — | — |
| `forced-colors` | capa oculta (como hoy, sin fondo de hover) | la de siempre | `Highlight` |
| Toque | nada | — | — |
| Navbar | sin luz (#961): hover por celda con entrada en fundido y **salida instantánea** | píldora | — |

### Movimiento

- El de M1 sin cambios: `translate`, `inline-size` y `block-size` con `--g-duration-press` + `--g-ease-out`; `opacity` con `--g-duration-fast` + `--g-ease-standard`. Con `is-highlight-instant`, solo la opacidad. **Sin `--g-ease-spring` ni `--g-ease-bounce`** (#299: una luz que se pasa de la fila diría que el destino es otro).
- **`prefers-reduced-motion: reduce`:** solo fundido (`--g-duration-fast`), sin viaje.
- Interrumpible (transición CSS que se retoma desde donde va); nunca bloquea un clic.
- Rúbrica completa y criterio de rendimiento: `api.md` «Una sola luz» y #963. Peso: tope de #963 (+1 280 B gzip de `grana.js`) superado en +152 B por decisión del usuario, #964; el lote midió +1 432 B. **Rendimiento (#965):** el criterio de #963 (0 tareas largas, p95) se exige en un entorno sin vecinos (integración continua de GitHub o máquina del usuario); en una VM compartida con `steal`, una tarea larga aislada en mitad del barrido, con p95 bajo y sin trabajo nuestro atribuible en el trace, se registra como ruido conocido, sin reintentos ni cambio de umbral.

### Verificación (criterio de hecho)

`tests/personalidad-sidebar-glide.spec.mjs` (bruno, tres motores), trasladado de `design/lab/hover-glide/r01/verificar.mjs`: barrido a 1px por una lista con submenú abierto y actual: **0** enlaces con fondo propio, **≤ 1** luz por lista y **0** muestras sin luz dentro de los enlaces; viaje entre items con ≥ 3 cuadros intermedios y final exacto (±1px); entrar desde fuera aparece en su sitio; deshabilitado y título de grupo apagan; el actual se ilumina y su asiento no cambia (Δ0 de caja y color); **el puntero no mueve el foco** (`document.activeElement` igual); pulsado se queda y al soltar va; scroll con el puntero quieto sigue al de debajo; `reduce` solo opacidad; `forced-colors` oculta; toque nada; RTL sobre su enlace; riel, panel flotante y drawer (no medidos por kiwi); consola limpia. Más la compuerta de rendimiento de #963.

## Tokens consumidos

| Token | Para qué |
| --- | --- |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus` | Superficie, borde y foco |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiquetas, iconos y títulos de grupo |
| `--g-color-{color}`, `--g-color-on-{color}` | Contadores y puntos (#615: ya no la píldora) |
| `--g-sidebar-current`, `--g-sidebar-on-current`, `--g-sidebar-current-edge` | Item actual: asiento, nodo, ruta y píldora (§«Item actual: el asiento») |
| `--g-surface-inset`, `--g-surface-radius`, `--g-surface-radius-inset`, `--g-surface-backdrop` | Superficie flotante, navbar y drawer (sistema §11) |
| `--g-shadow-2`, `--g-shadow-3` | Superficie flotante, panel, navbar |
| `--g-radius-*` | Radios de item, panel y píldora |
| `--g-space-1..6` | Alturas, sangrías y separaciones (`space × …`) |
| `--g-font-ui`, `--g-text-{caption|body-sm|body}-{size|line}`, `--g-text-action-weight` | Texto |
| `--g-border-width`, `--g-focus-width`, `--g-focus-offset` | Bordes y foco |
| `--g-duration-fast`, `--g-duration-press`, `--g-ease-standard`, `--g-ease-out` | Transiciones cortas (ancho, etiquetas, panel, píldora, drawer) |
| `--g-duration-slow`, `--g-ease-spring` | Llenado del asiento (#617) |
| `--g-color-border`, `--g-duration-press`, `--g-duration-fast`, `--g-ease-out`, `--g-ease-standard`, `--_radius` | La luz de cada lista (#959; ya listados: sin token nuevo) |
| `--g-glass-*` | **No** se usan |

**Tokens nuevos** (`tokens.md` §13): `--g-sidebar-width`, `--g-sidebar-rail`, `--g-sidebar-bar`; r02 (`tokens.md` §43): `--g-sidebar-current`, `--g-sidebar-on-current`, `--g-sidebar-current-edge`. **Reservado:** `--g-sidebar-icon-size` (sin valor ni uso, #619). **Dejan de leerse para el actual:** `--g-surface-inset`, `--g-color-border-strong` y `--g-color-accent-text` (barra de #89/#239) en `.g-sidebar__link[aria-current]`.

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
| `g-sidebar__link` (+ `is-active`, `is-branch`, **`is-rep`**), `__parent`, `__sub` (+ **`has-current`**), `__chevron` | Enlace y submenú | Según item. `is-rep`: padre de la rama **solo en `rail`**; `has-current`: el `<ul>` de hijos que contiene al actual (ruta encendida); r02 |
| `g-sidebar__icon`, `__label`, `__badge`, `__sr` | Partes del item | Según item |
| `g-sidebar__foot` | Pie | Con el slot `user` |
| `g-sidebar__fly`, `__fly-title`, **`__fly-list`** | Panel flotante | Solo riel (`__fly-list`: el `ul` de los hijos, anfitrión de su luz; #962) |
| **`g-sidebar__highlight`** (`li[role=none][aria-hidden]`, primer hijo de cada `g-sidebar__list` y de `g-sidebar__fly-list`) | Capa de la luz | Siempre en expandida, drawer y riel; no en navbar (#957, #962) |
| **`has-highlight`**, **`is-highlight-instant`** | `g-sidebar__list`, `g-sidebar__fly-list` | Hay destino bajo el puntero · primera colocación o recolocación sin gesto (dos cuadros) (#962) |
| `--_highlight-x/-y/-w/-h` | `g-sidebar__highlight` (la capa) | Geometría en px físicos (#962, enmendado) |
| `g-tooltip` (`aria-hidden`, modo visual; `tooltip.md` §«Modo visual») | Pista de cada control del riel | Siempre presentes; activas solo en riel (#436). **`g-sidebar__tip` desaparece** |
| `g-sidebar__bar`, `__tab` (+ `is-current` en el `li`), `__more`, `g-sidebar__label--hidden` | Navbar | Solo navbar |
| `g-sidebar__drawer` | `<dialog>` | Drawer |
| `is-open` | `g-sidebar__sub` | Submenú abierto (cerrado: sin la clase y con `inert`) |
| ~~`is-instant`~~ | — | Sustituida por `data-instant` del nodo de la pista (#436) |
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

## Resolución de hallazgos de r02 (`design/lab/sidebar/r02/declaracion.md`)

| # | Hallazgo | Resolución | Base |
| --- | --- | --- | --- |
| L1 | Ranuras del activo | `--g-sidebar-current`, `--g-sidebar-on-current`, `--g-sidebar-current-edge`; por defecto `primary` / `on-primary` / `primary-text` (con relleno, no Δ0: elección del usuario) | #613 |
| L2 | Pares | P1 4.5:1, P2 y P3 3:1 (§«Pares»); sin exigir relleno/carcasa | #613 |
| L3 | CLI | Diagnóstico informativo de P1 a P3 y derivación del oscuro con respaldo `on-primary-soft` (`tokens.md` §43) | #614 |
| L4 | Navbar y `color` | (a): la píldora lee las ranuras; `color` solo contadores y puntos | #615 |
| L5 | Rama en el riel | `is-rep`: el padre representa al actual con el asiento lleno | #616 |
| L6 | H10 | Prop `breakpoints` (10-A) | #618 |
| L7 | H11 | 11-C: el asiento; `--g-sidebar-icon-size` reservado | #619 |
| L8 | Personalidad | B · Asiento | #612 |
| L9 | Para coco | El hover excluye también `.is-rep` (#564 ampliada); C no se eligió: el filo de la raíz sigue en `border-inline-end` | #616 |

### Encargos de r02

**coco (`GSidebar.css`, `defaults.css`; Opus: se solapa con la píldora y el riel):**
1. Las tres ranuras en `defaults.css` (claro, consulta oscura y `[data-theme="dark"]`, como `--g-surface-inset`).
2. Retirar del actual la superficie `inset`, el contorno `border-strong`, la sombra y la barra `::before` en `accent-text`; asiento, nodo, ruta (`has-current`) y representante (`is-rep`) según «Item actual: el asiento»; píldora con las ranuras y trazo interior `current-edge`.
3. **Hover (#564 ampliada, L9):** el selector de hover excluye también `.is-rep`: `:not([aria-disabled="true"], [aria-current="page"], .is-active, .is-rep)`; no tocar la rama hueca.
4. Movimiento, movimiento reducido (solo fundidos) y `forced-colors` (`Highlight`/`HighlightText`, aros `CanvasText`).
5. Medir P1 a P3 en el tema por defecto, lustre, spotify, el tema del integrador (`design/lab/sidebar/r02/theme-nisa.css`) y uno con `primary` propia, claro y oscuro; tamaño del asiento en las tres densidades (sin desborde; `default` sin cambio de alto); foco frente a la carcasa; RTL; `fixed` y `floating`; tres motores.

**bruno (`GSidebar.vue`, pruebas, `meta.json`, `types/overrides.mjs`, `packages/cli/`):**
1. `breakpoints` (reglas y avisos B1, B2) en el cálculo de `auto` (hoy `unit × 240` / `unit × 150`); `meta.json`: `{ "name": "breakpoints", "type": "Object", "default": null }` y en `types/overrides.mjs` `'GSidebar.breakpoints': '{ expanded?: number; rail?: number } | null'`; descripción de `color` (contadores y puntos); los tres tokens en `tokens`.
2. `is-rep` en el padre de la rama solo con formato `rail` (se alterna al cambiar de formato, mismo DOM); `has-current` en el `g-sidebar__sub` que contiene al actual.
3. Pruebas: cortes (por defecto, una clave, `rail` = `expanded` sin riel, recorte con y sin aviso, `rail: 0`, valores no válidos, cambio de la prop sin redimensionar); `is-rep` y `has-current`; `aria-current` solo en el hijo.
4. CLI: las tres ranuras en `cli/src/defaults.js` regenerado con `node packages/cli/scripts/sync-defaults.mjs` tras el `defaults.css` de coco (claro y oscuro: sin ellas, `overrides` las marca como `unknown-token`); diagnóstico y derivación de `tokens.md` §43; pruebas con el caso real (`{"brand":"#24366B","accent":"#C1D324"}` + ranuras `primary`/`accent`) y con el tema por defecto.
5. `CHANGELOG.md`: cambio visible del actual (asiento con relleno) y de `color` (ya no la píldora).

**mora-docs (`GSidebar/README.md`, después de la auditoría de coco):** el asiento y sus tres estados; las ranuras con un ejemplo de identidad propia (y su oscuro); `color` solo para contadores; `breakpoints` con el caso real; el icono va sin fondo (11-C).

## Límites conocidos

- **Un solo nivel de hijos**; sin árboles profundos, arrastrar ni anclar favoritos.
- **Sin buscador propio** ni filtro de items: la aplicación decide qué abre `search`.
- **Sin menú contextual del usuario** (será `GMenu`): el slot `user` lo pone la aplicación.
- **Slot `item`:** sin asiento; la marca del actual es de la aplicación (r02). La luz sí lo cubre (es el `.g-sidebar__link`).
- **La luz no se apaga desde la aplicación:** no hay prop (#962); se oculta con `forced-colors` y no viaja con `reduce`. Navbar sin luz (#961).
- **`breakpoints` en px:** no siguen a `space` (r02, #618).
- **En la píldora activa, los items inactivos no muestran su nombre:** un usuario nuevo no lo ve (el nombre existe para lectores). Etiquetas de la píldora **cortas**.
- **La adaptación mide el contenedor**: si la aplicación no da un `container` razonable (el padre es del ancho del visor), decide por el ancho del padre.
- **Lector de pantalla:** cómo se anuncian el riel, las ramas, los contadores, el panel y la píldora está por verificar con lectores reales; Firefox, Safari, RTL con un idioma RTL real y táctil real por verificar.

## Abierto (no bloquea el paso siguiente)

- Valores estéticos (tamaño del asiento en `compact`, nodo, grosor del aro y de la ruta, proporciones de la píldora, sombra, muesca del panel): los decide coco con los tokens listados.
- **Fuera de v0.1:** estado persistido, atajos de teclado globales (⌘K lo gestiona la aplicación), reordenar.
