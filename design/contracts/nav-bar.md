# Contrato · GNavBar (barra superior de navegación de un sitio)

**Dueño:** lima · **Estado:** aprobado (contrato; pendiente de coco y bruno) · **Basado en:** `design/lab/navbar/r01/` (kiwi, 16272793: `brief.md`, `declaracion.md` con N-L1 a N-L11 y N-H1 a N-H5, prototipo `index.html`, `paridad.json`, `verificar.mjs` 772/772 en los tres motores) y la referencia medida del sitio anterior `design/lab/sitio/referencia/medidas.md` §1 a §3 y §6 a §7 · **Decisiones del usuario (2026-11-08):** diseño idéntico al anterior hecho con componentes reales (#1052), `GNavBar` como componente real de la librería (#1053), personalidad **solo P1** (#1053), la barra se desplaza con la página en teléfono (#1055) · **Decisiones:** #1052, #1053, #1055, #1057, #1059
**Tag:** `g-nav-bar` · **Categoría:** navegación · **Entrada:** `@grana/vue/nav-bar` (global UMD `GranaNavBar`)

**Componente complejo** (se posiciona sobre otros elementos —pantalla de menú y «…»—, se solapa con `GAppShell` y con `GSidebar mode="navbar"`): **coco y bruno en Opus** (regla de `CLAUDE.md`).

La barra **de primer nivel de un sitio**: los enlaces a sus secciones (Guía · Componentes · Blocks · Playground · Cambios · GitHub) con la sección actual marcada por la ruta, y el sitio para las acciones globales de la aplicación (búsqueda, idioma, tema). En estrecho recoge las acciones en «…» y, en un teléfono, todo en una pantalla de menú. Vive **dentro de la banda** de `GAppShell` (slot `header`).

## Principios

- **La forma es la del sitio anterior** (calco medido, `referencia/medidas.md` §2): 64 px de banda, marca, búsqueda, seis enlaces de 14/500 en `text`, la actual en `accent-text`, separadores de 1 × 24, idioma y tema. La personalidad es de **comportamiento** (P1), sin cambiar el aspecto en reposo.
- **Lista de enlaces, no menú.** Es la navegación de un sitio (APG *Disclosure Navigation*): se recorre con Tab, sin flechas ni roles de menú.
- **Nada medido en el primer render (#1033).** La actual sale de una prop (`current`), no de `location`; enlaces, «…» y pantalla están en el HTML del servidor y el CSS enseña lo que toca según el visor.
- **Aloja, no hace.** No busca, no cambia el idioma ni el tema: aloja los controles de la aplicación (slots). No registra atajos globales.
- **Sin textos ni iconos por defecto** (#226): los textos van en `label` y `labels`; los iconos propios son de la lista de la librería.

## Cuándo usarlo (fronteras)

| Necesidad | Pieza |
| --- | --- |
| Enlaces persistentes a las **secciones de un sitio**, arriba, con la actual por ruta | `GNavBar` |
| Páginas de una sección o de una aplicación (índice lateral, cajón) | `GSidebar` |
| Barra **inferior** de una aplicación en el teléfono (píldora activa, «Más») | `GSidebar mode="navbar"` |
| Paneles que se intercambian en la misma página | `GTabs` (una `tablist` de enlaces es un antipatrón de APG) |
| Encabezado de la página (título, acciones, zócalo) | `GPageHeader` |
| Destinos que se abren y se cierran (temporales) | `GMenu` con elementos-enlace |
| Dónde estoy en el árbol | `GBreadcrumbs` |

**Nombre (N-L1, #1053):** se mantiene **`GNavBar`** aunque exista `g-sidebar--mode-navbar`: es lo que se busca en la documentación de cualquier librería. Las dos fichas (README de `GNavBar` y de `GSidebar`) llevan la frontera de arriba en una línea: «barra superior de un sitio» frente a «barra inferior de una aplicación». En una misma página **no se recomiendan las dos** (dos navegaciones globales); sin aviso.

## Uso

```vue
<GAppShell :labels="{ skip: 'Saltar al contenido' }" header="pinned-wide">
  <template #header>
    <GNavBar
      :items="sections"
      :current="route.path"
      label="Secciones"
      :labels="{ more: 'Más opciones', menu: 'Menú', newTab: 'se abre en otra pestaña' }"
      @navigate="onNavigate"
    >
      <template #brand><a href="/" class="site-brand"><img src="/logo.svg" alt="" width="24" height="24">Grana</a></template>
      <template #search><!-- receta «Disparador de búsqueda» --></template>
      <template #actions="{ place }">
        <template v-if="place === 'bar'"><GMenu …idioma… /><GSwitch …tema… /></template>
        <template v-else><!-- lista de idiomas y fila «Apariencia» --></template>
      </template>
    </GNavBar>
  </template>
  <template #nav><GSidebar … /></template>
  …
</GAppShell>
```

```js
const sections = [
  { id: 'guide', label: 'Guía', href: '/getting-started', activeMatch: '^/(getting-started|theming|cli|utilities|accessibility|personality|project|changelog|theme-playground)' },
  { id: 'components', label: 'Componentes', href: '/components/btn', activeMatch: '^/components/' },
  { id: 'blocks', label: 'Blocks', href: '/blocks/', activeMatch: '^/blocks/' },
  { id: 'playground', label: 'Playground', href: '/theme-playground' },
  { id: 'changelog', label: 'Cambios', href: '/changelog' },
  { id: 'github', label: 'GitHub', href: 'https://github.com/kevinedgm/grana', external: true }
]
```

## Props

| Prop | Tipo | Valores | Default | Origen |
| --- | --- | --- | --- | --- |
| `items` | Array | `{ id, label, href, activeMatch?, external?, target?, rel?, lang?, hreflang? }` (ver «Modelo») | `[]` | propia |
| `current` | String \| null | la ruta actual de la aplicación (sin `base` o con ella, igual que los `href`) | `null` | propia |
| `label` | String | texto | sin valor (**obligatoria**) | propia (nombre del `<nav>`) |
| `labels` | Object | `more`, `menu`, `newTab` | `{}` | compartida (sin valores por defecto, #226) |
| `id` | String | | generado (SSR-seguro) | propia |

**No existen** (y por qué): `glide` (P1 es la personalidad del componente y va siempre, como la luz de `GSidebar` y `GTable`, #958: sin props); `mark` (P2, **reservada con este nombre**, #1053); `contained` (cortes por la caja: reservado, §«Cortes»); `children` en los items (desplegables de sección: reservado); `open`/`update:open` (la pantalla y «…» se cierran solos al navegar y al cambiar `current`; nadie más los abre); `density` (la barra mide la banda); `zone` (la zona de marca es de la banda, `headerZone` de `GAppShell`).

### Modelo de `items`

| Campo | Tipo | Qué |
| --- | --- | --- |
| `id` | String (obligatorio) | Identidad, única |
| `label` | String (obligatorio) | Texto del enlace y su nombre accesible |
| `href` | String (obligatorio) | Destino. Grana no le añade `base`: la aplicación lo da resuelto (`withBase`) |
| `activeMatch` | String | Expresión regular (cadena de `RegExp`, sin banderas) que se prueba contra `current`. Sin ella, la actual es `href === current` |
| `external` | Boolean | Otro sitio: `target="_blank"`, `rel="noreferrer"`, icono y texto oculto (§«Externos») |
| `target`, `rel` | String | Se pasan tal cual al `<a>` (con `external`, los de arriba si no se dan) |
| `lang`, `hreflang` | String | Se pasan tal cual al `<a>` |

- **Reglas:** un elemento sin `id`, `label` o `href` (vacíos o solo espacios) se ignora y avisa (aviso 1); `id` repetido avisa (aviso 2) y gana el primero. El orden de `items` es el de la barra. Cualquier otro campo se conserva y llega a `navigate`.
- **`activeMatch` inválido** (la cadena no compila): se ignora para ese elemento, se usa `href === current` y avisa (aviso 3). Se compila **una vez por cambio de `items`**, no en cada render.

### La actual (`aria-current="page"`)

- **Un solo enlace** lleva `aria-current="page"` (`api.md` «Lugar actual», #1039): el **primero** de `items` cuya `activeMatch` casa con `current` o, sin `activeMatch`, cuyo `href` es igual a `current`. **Un externo nunca es actual.** Sin `current`, ninguno.
- **No lee `location`** (SSR, #1033): el HTML del servidor ya trae la actual. Al cambiar `current` cambia la marca y se cierran «…» y la pantalla.
- **Aspecto (calco):** la actual solo cambia de **color** (`--g-color-accent-text`), sin peso, fondo ni subrayado. **Límite aceptado (1.4.1, decisión del usuario «solo P1», #1053):** frente a los enlaces en reposo la diferencia es 3,06:1 en claro y 3,32:1 en oscuro con el tema por defecto (medido por kiwi): pasa el 3:1 por poco y un tema con otro acento puede no llegar. Con P1 el hover ya no pinta igual que la actual (tiene su luz), así que pasar el puntero no la confunde; la señal de forma (P2) queda reservada. Lo documenta el README; la comprobación del par `accent-text`/`text` ≥ 3:1 en el motor de tema queda en `PENDIENTES.md` §5. **En `forced-colors`** (donde el color no existe) la actual lleva **subrayado** del sistema.

## Anatomía

```html
<div class="g-nav-bar" id="ID">                                         <!-- dentro de header.g-app-shell__header -->
  <div class="g-nav-bar__brand">[slot brand]</div>
  <div class="g-nav-bar__search">[slot search]</div>
  <nav class="g-nav-bar__nav" aria-label="{label}">
    <ul class="g-nav-bar__list">
      <li class="g-nav-bar__highlight" aria-hidden="true" role="none"></li>          <!-- P1, primer hijo -->
      <li><a class="g-nav-bar__link" href="/getting-started">Guía</a></li>
      <li><a class="g-nav-bar__link" href="/components/btn" aria-current="page">Componentes</a></li>
      <li><a class="g-nav-bar__link g-nav-bar__link--external" href="https://…" target="_blank" rel="noreferrer">GitHub<span class="g-nav-bar__ext" aria-hidden="true">[GLibIcon arrow-up-right flip-rtl]</span><span class="g-nav-bar__sr">{labels.newTab}</span></a></li>
    </ul>
  </nav>
  <div class="g-nav-bar__actions">                                      <!-- slot actions { place: 'bar' } -->
    <span class="g-nav-bar__sep" aria-hidden="true"></span>[nodo 1]<span class="g-nav-bar__sep" aria-hidden="true"></span>[nodo 2]
  </div>
  <div class="g-nav-bar__more">
    <button class="g-nav-bar__more-btn" type="button" id="ID-more-btn" aria-expanded="false" aria-controls="ID-more" aria-label="{labels.more}" popovertarget="ID-more">[GLibIcon ellipsis]</button>
    <div class="g-nav-bar__more-panel" id="ID-more" popover="auto">[slot actions { place: 'more' }]</div>
  </div>
  <button class="g-nav-bar__toggle" type="button" id="ID-toggle" aria-expanded="false" aria-controls="ID-screen" aria-label="{labels.menu}">[GLibIcon menu | x]</button>
  <div class="g-nav-bar__screen" id="ID-screen" hidden>
    <nav class="g-nav-bar__screen-nav" aria-label="{label}">
      <ul class="g-nav-bar__screen-list"><li><a class="g-nav-bar__screen-link" href … [aria-current="page"]>…</a></li>…</ul>
    </nav>
    <div class="g-nav-bar__screen-actions">[slot actions { place: 'screen' }]</div>
  </div>
</div>
```

1. **La raíz no es un landmark:** el banner es la banda de `GAppShell` (fuera del chasis, la aplicación pone `<header>`). Dentro hay **un `nav` con nombre** (`label`): con el índice de páginas (`GSidebar`, «Documentación») son dos navegaciones distinguibles por su nombre. La pantalla repite los enlaces en **su propio `nav`** con el mismo nombre; nunca se ven los dos a la vez (el de la barra está oculto por debajo de `48rem`, la pantalla está `hidden` cerrada), así que el árbol de accesibilidad solo tiene uno en cada momento.
2. **El texto oculto** (`g-nav-bar__sr`) usa el patrón accesible de texto oculto (literal permitido). El nombre del externo es «GitHub se abre en otra pestaña» (la misma regla y los mismos textos que los elementos-enlace de `GMenu`, #575).
3. **Separadores (§1.8 de kiwi):** `GNavBar` pone un `g-nav-bar__sep` decorativo **antes de cada nodo de primer nivel** del slot `actions` con `place: 'bar'` (aplanando fragmentos y descartando comentarios y textos vacíos). La aplicación no dibuja rayas ni usa `GDivider` vertical (que estiraría a la banda entera). Solo en `bar`.
4. **Los tres sitios del slot `actions`** se pintan en el HTML; el CSS enseña uno según el visor (§«Cortes»). Si la aplicación pone un `GMenu` en más de un sitio, cada uno genera su `id` (SSR-seguro): sin duplicados. Recomendación (receta del README): en `bar` el `GMenu` de idioma y el `GSwitch` de tema; en `more` y `screen` una lista de enlaces de idioma (con `lang`, `hreflang` y `aria-current="page"` en el actual) y una fila «Apariencia» con el `GSwitch` y su etiqueta visible.
5. **`id`:** la raíz lleva `{id}`; los demás `{id}-more-btn`, `{id}-more`, `{id}-toggle`, `{id}-screen`.

## La marca y la columna izquierda (N-L5)

- **Con un `GSidebar` expandido o en riel en el chasis, la marca de la barra no se pinta** (calco: la marca pertenece a la columna). Es **CSS**, con las clases públicas de `GSidebar` que ya son contrato entre componentes (`app-shell.md` «Reserva», #712): `.g-app-shell:has(> .g-sidebar--mode-expanded, > .g-sidebar--mode-rail) .g-nav-bar__brand { display: none }` (en `GNavBar.css`). Sin JS ni desajuste al hidratar. La aplicación pone la misma marca en el slot `logo` de `GSidebar`.
- La cabecera de `GSidebar` con el alto de la banda y su línea (N-L10) es de la ronda de kiwi sobre el índice calcado (`sitio-marco.md` §4, hueco), no de este contrato.

## Cortes, desbordamiento y estrecho (N-L6; SSR sin CLS)

**Cortes del visor, constantes de contrato** (`rem`: crecen con el texto del navegador, 1.4.4):

| Visor | Barra | «…» | Hamburguesa y pantalla |
| --- | --- | --- | --- |
| **≥ `80rem`** | marca · búsqueda · enlaces · acciones (`bar`) | oculto | oculta |
| **`48rem` – `80rem`** | marca · búsqueda · enlaces | visible, con `actions` `more` | oculta |
| **< `48rem`** | marca · búsqueda | oculto | visible, pantalla con enlaces y `actions` `screen` |

- **Del visor, no de la caja:** la banda solo convive con la columna izquierda cuando esta existe, así que su caja mide distinto en la portada y en una ficha; con consultas a la caja no se pueden calcar las dos. `@container` sobre `GAppShell` no sirve (la contención haría a la raíz bloque contenedor de lo fijo). **`contained`** (cortes por la propia caja, para demos y paneles) queda **reservado**.
- **Todo en el HTML, el CSS elige:** nada se mide en el primer render; los cerrados con `hidden` o `popover`. Cruzar un corte con «…» o la pantalla abiertos los cierra (bruno, con `matchMedia` **tras montar**).
- **Sin desplazamiento horizontal** a 320 (claro y oscuro, tres motores).
- **Táctil:** con `pointer: coarse`, enlaces, «…», hamburguesa y filas de la pantalla ≥ 44 px.

### «…» (*disclosure*, no menú; N-L2)

- Botón con `aria-expanded`, `aria-controls` y nombre de `labels.more`; panel con **`popover="auto"`** (capa superior sin recortes, cierre por fuera y Esc nativos). Su contenido es de la aplicación (una lista de enlaces y un interruptor, como en el original): no es un `menu` y no tiene flechas.
- **Esc** cierra y devuelve el foco al botón; **elegir un enlace** de dentro lo cierra (bruno escucha `click` en enlaces del panel); al cambiar `current`, se cierra. `aria-expanded` se sincroniza con el evento `toggle` del popover (corrige el defecto 2 del original: decía «extra navigation» en inglés y `aria-expanded="false"` abierto).
- Posición: bajo el botón, alineado a su borde final, dentro del visor (coco). **Con anclaje CSS** (`@supports (position-area: block-end)`), el ancla implícita del popover (`popovertarget`) y sin JS. **Sin anclaje** (H2 de coco, #1066): antes de abrir (evento `beforetoggle` con `newState === 'open'`, para que el primer cuadro ya salga en su sitio), bruno escribe en `__more-panel` **`--_more-top`** = borde inferior del botón y **`--_more-end`** = distancia del borde final del botón al borde final del visor (px lógicos: en RTL, al izquierdo), las dos en px del visor y ≥ 0; **siempre** (una lectura de caja por apertura, sin coste aunque el motor tenga anclaje: el CSS solo las usa fuera de `@supports`). Los valores son la medida en bruto: el solape de `space × 3` con la banda lo pone el CSS (coco). Sin abrir, valen lo que declare `GNavBar.css` (bajo la banda, al final del visor).

### Pantalla de menú (< `48rem`)

- **Hamburguesa:** botón con `aria-expanded`, `aria-controls` y nombre `labels.menu`; el icono pasa de `menu` a `x` (el nombre no cambia: `aria-expanded` dice el estado).
- **La pantalla** ocupa el visor **bajo el borde inferior de la banda** (medido al abrir y escrito como `--_screen-top` en la pantalla: con la banda que se desplaza, `header="pinned-wide"`, puede estar parcialmente fuera), `position: fixed` hasta abajo, fondo `--g-color-bg`, enlaces en filas de 48 (≥ 44 táctil) con línea inferior (calco), la actual con `aria-current="page"` y su color, y debajo `actions` `screen`. Se desplaza por dentro si no cabe (`overscroll-behavior: contain`).
- **Lo de detrás no recibe foco ni lectura (N-L7):** con chasis, `GNavBar` lo pide por el canal interno (`appShellKey.cover(true)`, `app-shell.md` «Canal interno»): el chasis pone `inert` en su marco y en `GSidebar`, y bloquea el desplazamiento del documento; al cerrar, `cover(false)`. **Sin chasis**, `GNavBar` mantiene el foco en bucle **hamburguesa ↔ pantalla** (Tab y Mayús+Tab no salen) y bloquea el desplazamiento del documento él mismo.
- **Al abrir**, el foco va al primer enlace; **Esc** cierra y devuelve el foco a la hamburguesa; **elegir un enlace** cierra (también si la aplicación cancela `navigate`); al cruzar `48rem` o cambiar `current`, se cierra.
- **Es una *disclosure*, no un `<dialog>`** (kiwi §1.13): son los mismos enlaces de la barra y dos acciones, y el sitio ya tiene un cajón (`GSidebar drawer`); dos diálogos de navegación serían dos navegaciones superpuestas. La pantalla no lleva `role` ni `aria-modal`.

## Externos y `navigate`

- **Externos (`external`):** `target="_blank"` y `rel="noreferrer"` (si el item no trae los suyos), icono **`arrow-up-right`** de la librería con **`flip-rtl`**, decorativo (calco: 11 px en `--g-color-text-subtle`; coco), y el texto oculto `labels.newTab`. Sin `labels.newTab` con algún externo, aviso 5. **Por qué `arrow-up-right` y no `external-link`** (que usa `GMenu`, #575): es el del sitio anterior y el usuario pidió el diseño idéntico (#1057); son dos componentes con dos contextos (barra de un sitio frente a lista de comandos).
- **`navigate` `{ item, event }`** con la guarda común (`api.md` «Enlaces y `navigate`», #505 con #574): solo clic primario sin modificadores, con `defaultPrevented` falso y sin `target` de otro contexto (`utils/link.js`, `otherContext`), o Intro. Cancelable de forma síncrona (`event.preventDefault()`) para el router. **Un externo no lo emite.** Lo emiten los enlaces de la barra y los de la pantalla (el mismo item). Elegir un destino **cierra** «…» y la pantalla, también si la aplicación cancela.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ item, event }` | Clic primario o Intro en un enlace interno (barra o pantalla), con la guarda de #505; cancelable |

Declarado en `emits`. Ningún otro: abrir y cerrar «…» o la pantalla no son sucesos de la aplicación.

## Slots

| Slot | Alcance | Qué va | Regla |
| --- | --- | --- | --- |
| `brand` | — | Marca de la aplicación (enlace a la portada con logo y nombre) | Se oculta con un `GSidebar` expandido o en riel en el chasis (§«La marca») |
| `search` | — | El disparador de búsqueda de la aplicación (receta abajo) | Ocupa el hueco entre la marca y los enlaces; en `< 48rem` sigue en la barra |
| `actions` | `{ place: 'bar' \| 'more' \| 'screen' }` | Acciones globales: idioma, tema | Se pinta tres veces; separadores solo en `bar` |

## Teclado y foco

| Tecla | Dónde | Qué hace |
| --- | --- | --- |
| Tab / Mayús+Tab | Barra | Marca (si se pinta) → `search` → enlaces → acciones (o «…») → hamburguesa. Sin flechas |
| Intro | Enlace | Navega (y `navigate`, si es interno) |
| Intro / Espacio | «…», hamburguesa | Abre o cierra |
| Esc | «…» o pantalla abiertos | Cierra y devuelve el foco a su botón |
| Tab | Pantalla abierta | En bucle dentro de botón ↔ pantalla (sin chasis; con chasis, lo de fuera es `inert`) |

- **`/` y ⌘K no son de `GNavBar`:** los registra la aplicación (Grana no escucha el documento, regla de #1035). `GNavBar` no tiene métodos de foco.
- **Foco visible** de Grana (`--g-focus-width` en `--g-color-focus`) **por dentro** de los enlaces de 64, para que el borde de la banda no lo corte.
- **El puntero no mueve el foco** (P1, `api.md` «Una sola luz» regla 1).
- **Sin regiones vivas:** cambiar de página lo anuncia la aplicación (foco al `h1`).

## Personalidad: P1 · Una sola luz (decisión del usuario, #1053)

- **La luz de #957** (`api.md` «Una sola luz», tercer caso de la tabla de la regla 1: lista en la secuencia de Tab que **sigue al puntero**): una capa `g-nav-bar__highlight` bajo los enlaces que se desliza de enlace en enlace bajo el puntero, sobre la **fila de texto** (no los 64 de la banda: altura de coco). Utilidad común `utils/glide.js` (`createPointerGlide`, `placeHighlight`, `flashInstant`) por `__shared`; `--_highlight-x/-y/-w/-h` en la capa, `has-highlight` e `is-highlight-instant` en la lista (regla de CSS de #964).
- **Con la luz, el hover deja de pintar el texto en `accent`** (el original pintaba hover y actual igual, `referencia/medidas.md` §7): el puntero tiene su señal (la luz) y la actual la suya (el color). Lee el mismo token que la luz de `GSidebar` (coco lo confirma en `GNavBar.css`).
- Reglas 2 a 9 de «Una sola luz» sin excepciones: solo ratón y lápiz; los enlaces se tocan (relleno `0 12`, sin separación: regla 5); entrar desde fuera aparece sin viajar; `forced-colors` sin capa.
- Solo en la lista de la barra; la pantalla y «…» no llevan luz (filas con hover propio, regla 9).
- **P2 · La marca que viaja: reservada** con el nombre `mark` (línea de 2 px bajo la actual que se desliza al cambiar de sección con `--g-ease-spring`). Si el usuario la pide, se contrata sin ronda nueva (kiwi la midió).

## Movimiento (rúbrica `docs/documentacion/rubrica-movimiento.md`)

| Qué | Cómo | Movimiento reducido |
| --- | --- | --- |
| Color del enlace (actual) y del icono externo | `--g-duration-slow` + `--g-ease-out` (el calco usaba 0,25 s) | Igual (solo color) |
| P1 · luz | Posición y tamaño con **`--g-duration-press`** + `--g-ease-out`, aparición con fundido `--g-duration-fast` (regla 7 común; kiwi proponía `slow`: manda la regla común) | Solo fundido, sin viaje |
| «…» y pantalla | Entrada y salida comunes de los paneles de Grana (#1002; las de `GMenu`), sin personalidad propia | Las de #1002 |
| Icono de la hamburguesa (`menu` ↔ `x`) | Cambio al instante | — |

| Dimensión | Estado al contratar | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | P1 dice dónde está el puntero y deja el color a la actual | Movimiento en un gesto frecuente | 160 ms sin muelle (regla 7) |
| B · Comodidad visual | Cumple | Una sola capa, sin rebote | — | — |
| C · Estabilidad | Cumple | Capas absolutas; la barra no cambia de medida en ningún estado | — | coco mide Δ0 de los enlaces con la luz |
| D · Interrumpible | Cumple | Transiciones, no `@keyframes` | — | — |
| E · Control | Cumple | Todo lo provoca el usuario | — | — |
| F · Accesibilidad | Cumple | Reducido = fundido; `forced-colors` sin capa | — | — |
| G · Rendimiento | A medir (bruno) | Una lectura de dos cajas por cambio de destino (`glide.js`), ninguna si no | — | Tarea < 50 ms en un cruce rápido de los seis enlaces |
| H · Coherencia | Cumple | La misma luz que `GMenu`, `GSidebar`, `GTable` | — | — |

**No verificable aquí:** comodidad con trackpad inercial.

## Relación con `GAppShell` (N-L7, N-L8)

- **Va en el slot `header`** de `GAppShell` y ocupa la banda entera (`block-size: 100%`). El alto de la banda lo pone el tema de la aplicación con la entrada pública `--g-app-shell-header` (el sitio: `calc(var(--g-space-1) * 16)`, 64 px; #713). Relleno lateral de la barra: `space × 8` (32) y `space × 6` (24) bajo `48rem` (coco, por tokens).
- **Sin borde propio en el registro** (`EDGE_ORDER`): vive en la banda, que ya está (`appShell = 5`, #714).
- **Teléfono:** con `header="pinned-wide"` (`app-shell.md`, #1055) la banda, y con ella la barra, se va con la página por debajo de `60rem` como en el sitio anterior.
- **Pantalla abierta:** canal interno `appShellKey.cover(on)` (§«Pantalla de menú»).
- **Fuera del chasis** funciona: la aplicación pone `<header>` y su receta de cabecera fija; la pantalla usa el bucle de foco propio.

## Clases y datos (contrato bruno ↔ coco)

| Clase / dato | Dónde | Quién / cuándo |
| --- | --- | --- |
| `g-nav-bar` | raíz | bruno, siempre |
| `g-nav-bar__brand`, `__search`, `__nav`, `__list`, `__link`, `__link--external`, `__ext`, `__sr` | barra | bruno |
| `g-nav-bar__highlight`; `has-highlight`, `is-highlight-instant` en `__list`; `--_highlight-x/-y/-w/-h` en la capa | P1 | bruno (`glide.js`) |
| `g-nav-bar__actions`, `__sep` | acciones `bar` | bruno |
| `g-nav-bar__more`, `__more-btn`, `__more-panel` | «…» | bruno |
| `g-nav-bar__toggle`, `__screen`, `__screen-nav`, `__screen-list`, `__screen-link`, `__screen-actions` | pantalla | bruno |
| `is-open` | raíz, con la pantalla abierta | bruno |
| `--_screen-top` | `__screen` | bruno, al abrir (borde inferior de la banda, ≥ 0) |
| `--_more-top`, `--_more-end` | `__more-panel` | bruno, al abrir el «…» (borde inferior del botón; distancia de su borde final al del visor; px, ≥ 0; #1066) |
| `aria-current="page"` | el enlace actual (barra y pantalla) | bruno |

**Selectores sobre contenido de la aplicación** (`__actions > *`, slots): con la exclusión de `.g-tooltip` de #383 (`:not(:where(.g-tooltip))`).

## Tokens

**Ninguno nuevo** (`tokens.md` §60). Consume `--g-color-bg`, `--g-color-text`, `--g-color-text-subtle`, `--g-color-accent-text`, `--g-color-border`, `--g-color-surface`, `--g-shadow-2`, `--g-radius-*`, `--g-text-body-sm-*`, `--g-text-action-weight`, `--g-font-ui`, `--g-space-*`, foco (`--g-color-focus`, `--g-focus-width`, `--g-focus-offset`), `--g-border-width`, `--g-duration-fast`/`press`/`slow`, `--g-ease-out` y el token de la luz de `GSidebar`. **Constantes de contrato (no tokens):** cortes `48rem` y `80rem`. Medidas de coco por `space` (separadores `space × 6` de alto, relleno de los enlaces `space × 3`).

## Avisos de desarrollo (`[Grana GNavBar]`, guarda canónica de #653, una vez por instancia y motivo)

1. Elemento de `items` sin `id`, `label` o `href`: se ignora.
2. `id` repetido: gana el primero.
3. `activeMatch` que no compila: se usa `href === current`.
4. Sin `label`.
5. Algún `external` sin `labels.newTab`.
6. Sin `labels.more` o sin `labels.menu` (los dos botones existen siempre en el HTML).

Ninguno en el manejador del puntero ni en `resize`.

## Accesibilidad y mínimos

| Criterio | Cómo |
| --- | --- |
| 1.3.1 / 1.3.2 | Un `nav` con nombre; lista de enlaces; orden del DOM = lectura = Tab |
| 1.4.1 | Actual por color con 3,06:1 / 3,32:1 frente al reposo (límite aceptado, §«La actual»); hover con luz, no con color; subrayado en `forced-colors` |
| 1.4.3 / 1.4.11 | Enlaces y actual ≥ 4,5:1 sobre la banda (17,40 y 5,69 en claro; 16,46 y 4,95 en oscuro); luz y separadores decorativos |
| 1.4.4 / 1.4.10 | Cortes en `rem`; sin desplazamiento horizontal a 320 |
| 2.1.1 / 2.4.3 | Todo por Tab; bucle de la pantalla; Esc devuelve el foco |
| 2.4.7 / 2.4.11 | Anillo por dentro; la banda resta su `scroll-margin` (S1 de `GAppShell`) |
| 2.5.8 | ≥ 24 px siempre; ≥ 44 con `pointer: coarse` |
| 3.2.1 | El puntero no mueve el foco |
| 4.1.2 | `aria-expanded` real en «…» y hamburguesa; `aria-current="page"` en uno |

## RTL, `forced-colors`, SSR

- **RTL:** todo lógico; `arrow-up-right` con `flip-rtl`; «…» se alinea al borde final.
- **`forced-colors`:** la luz se oculta; la actual con subrayado; botones con borde del sistema; foco del sistema.
- **SSR:** ids SSR-seguros; el HTML del servidor trae enlaces, actual, «…» y pantalla cerrados; `matchMedia`, `glide.js` y el canal del chasis empiezan al montar. Prueba de hidratación (`GNavBar.hydration.test.js`).

## Paquete y peso (N-L11, #1059)

- **Entrada propia `@grana/vue/nav-bar`** (global UMD `GranaNavBar`): exporta `GNavBar` y un plugin que lo registra (`app.use(NavBar)`); `@grana/vue` no lo exporta. **#506 aplicado:** es un componente nuevo y el margen del principal está agotado (#550).
- **Tope: 3,5 KiB (3 584 B) gzip** de `dist/nav-bar.js` (estimación de kiwi sin medir ≈ 2,5 KiB; lleva disclosure, pantalla con bucle, canal y seis avisos). Si no cabe, vuelve a lima; con más, decide el usuario.
- **Por `__shared`, sin copia:** `GLibIcon`, `utils/glide.js` (**`createPointerGlide` y `flashInstant` se añaden a `__shared`**, N-H2; hoy solo viajan `aimed` y `placeHighlight`), `utils/link.js` (`otherContext`), `utils/appShell.js` (`appShellKey`). El principal solo crece por esas dos exportaciones (lote de #1059).
- Declarar en `exports`, `typesVersions`, `ENTRIES` de `scripts/build-types.mjs` y `src/types.test.js` (#442, #443).
- **Compuertas de `gates.sh`:** `test -f packages/vue/dist/nav-bar.js`, `! grep -q "GNavBar" packages/vue/dist/grana.js`, `grep -q "g-nav-bar__screen" packages/vue/dist/grana.css`, y que `dist/nav-bar.js` no lleve copia de `glide.js` (bruno elige la cadena propia que lo demuestra).

## `meta.json` y tipos (#443)

Props, evento `navigate`, slots `brand`, `search`, `actions` (con `place`); `types/overrides.mjs`: `'GNavBar.items': 'Array<{ id: string; label: string; href: string; activeMatch?: string; external?: boolean; target?: string; rel?: string; lang?: string; hreflang?: string; [key: string]: unknown }>'`, ámbito de `actions` `{ place: 'bar' | 'more' | 'screen' }`. `status: "draft"` hasta la auditoría de coco.

## Recetas (README)

- **Disparador de búsqueda calcado (N-L3):** un `<button type="button">` de la aplicación (o `GBtn variant="ghost" color="neutral"`) con `aria-haspopup="dialog"`, `aria-keyshortcuts="Control+K Meta+K"`, nombre accesible completo («Buscar en la documentación»), lupa `search` decorativa, texto «Buscar» y el atajo en dos `kbd` dentro de un `aria-hidden`. 36 de alto (≥ 44 táctil), solo lupa con nombre por debajo del corte que la aplicación elija. **Qué `kbd` se pinta:** el servidor pinta «Ctrl K»; al montar, con plataforma Apple, «⌘ K» (#1033: nada del entorno en el primer render; mismo ancho por coco). Abre la búsqueda de `GCombobox appearance="command"` con `open()` (`combobox.md` «Modo comando»).
- **Interruptor de tema:** `GSwitch` con slots `icon-on`/`icon-off` (`moon`/`sun`, iconos de la aplicación) y **`aria-label`** sin `label` visible en `place: 'bar'` (el aviso de nombre de `GSwitch` ya acepta `aria-label`; bruno comprueba que llega al `<input>`, N-H4); con su etiqueta visible («Apariencia») en `more` y `screen`. El tamaño que calca 40 × 24 es medida de coco (N-H3).
- **Idioma:** `GMenu` con elementos-enlace (`lang`, `hreflang`, `current`, #743), que abre al pulsar (no al pasar: corrige el defecto 7 del original).

## Reservado (con nombre)

`mark` (P2), `contained` (cortes por la caja), `children` (desplegables de sección), un `nav` secundario. Ninguno cambia lo contratado.

## Verificación (criterio de hecho)

- **bruno (vitest + jsdom):** modelo y avisos 1 a 6; una sola actual por `activeMatch`/`href`, ninguna con externo o sin `current`; `activeMatch` compilada una vez; externos con `target`, `rel`, icono y texto oculto; `navigate` con la guarda (clic primario emite; modificadores, botón central, `target` y externos no; cancelado sigue cerrando); separadores antes de cada nodo de primer nivel de `bar` (con fragmentos); «…» con `aria-expanded` sincronizado y Esc con devolución del foco; pantalla: foco al primer enlace, bucle sin chasis, `cover(true/false)` con chasis, Esc, cierre al navegar, al cambiar `current` y al cruzar el corte; ids; hidratación sin desajuste.
- **Playwright (puerto propio, tres motores), sobre el componente real:** cortes a 1280, 1024, 768, 375 y 320 (qué se ve y sin desplazamiento horizontal); marca oculta con `GSidebar` expandido; P1 bajo el puntero sin mover el foco, sin `accent` en el hover, aparece sin viajar, reducido = fundido; Tab en orden; «…» y pantalla con teclado; con chasis lo de detrás `inert`; táctil ≥ 44; `forced-colors` (Chromium); rendimiento de P1 (`--workers=1`).
- **coco:** `GNavBar.css` sin literales (salvo 24/44, texto oculto y los cortes de contrato), contraste en claro y oscuro y con otro tema, la rúbrica, paridad con `referencia/` (`sitio-marco.md` §12), auditoría.
- **No verificado (entorno real):** lector de pantalla con dos `nav` y la pantalla abierta; trackpad inercial; Safari y táctil reales.
