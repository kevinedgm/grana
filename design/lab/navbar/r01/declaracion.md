# Declaración · GNavBar (barra superior de navegación), r01

> kiwi, 2026-11-08. Prototipo: `index.html?p=comp|guide|blocks|home` (`&theme=dark`, `&glide=1` P1, `&mark=1` P2). Es el **marco del sitio anterior calcado** con componentes **reales** de `packages/vue/dist/` (`GAppShell`, `GSidebar` con `@grana/vue/sidebar-filter` y `code` 01–79, `GMenu` de idioma con elementos-enlace, `GSwitch` de tema con sol y luna, `GDialog` + `GCombobox appearance="palette"` para «Buscar», `GIcon`, `GBtn`) y los dos prototipos que faltan: `navbar.js`/`navbar.css` (→ `GNavBar`) y `../../page-index/r01/` (→ `GPageIndex appearance="list"`). Tokens reales del tema por defecto, claro y oscuro. Referencia medida: `design/lab/sitio/referencia/medidas.md`. Verificación: `node design/lab/navbar/r01/verificar.mjs` (puerto 4238) **772/772** en Chromium, Firefox y WebKit; paridad vista a vista en `paridad.json`. **Preguntas de producto: tres** (§8).
>
> **La forma no se elige:** la fija la referencia. No hay conceptos A/B/C; la personalidad es de **comportamiento**, opcional y sin cambiar el aspecto en reposo (regla del usuario aplicada a un calco).

---

## 0. Solapes revisados (antes de proponer)

| Pieza existente | Qué hace | Por qué no es esto |
| --- | --- | --- |
| `GAppShell` | Chasis: banda `header` (banner) de alto de contrato, `nav`, `main`, `footer` | Pone la **banda**, no su contenido. `GNavBar` va **dentro** del slot `header` |
| `GSidebar mode="navbar"` | Barra **inferior** móvil de una aplicación, píldora activa, «Más» → drawer | Navega entre las páginas de una app desde abajo; `GNavBar` navega entre **secciones de un sitio** desde arriba y convive con un `GSidebar` (el índice). Frontera en §3 |
| `GTabs` | Pestañas que intercambian paneles **en la misma página** | Los destinos de `GNavBar` son otras páginas; una `tablist` de enlaces es un antipatrón (APG) |
| `GPageHeader` | Encabezado **de la página** en `main` (título, acciones, zócalo) | No es navegación del sitio ni vive en el banner |
| `GMenu` (elementos-enlace, #571) | Botón de menú con destinos | Es temporal (se abre y se cierra); la barra es persistente. La usa para el idioma |
| `GBreadcrumbs` | Ruta jerárquica con puertas | Es «dónde estoy en el árbol», no «a qué sección voy» |
| `design/contracts/sitio-marco.md` · #1041 (S-L6) | «Sin `GNavBar`»: en A la fila la hacía el índice | **Enmienda para lima (N-L1):** el usuario la pide ahora como componente real |

Ninguna pieza cubre **enlaces de sección persistentes con la actual por ruta, acciones globales, desbordamiento y pantalla de menú en estrecho**. Componente nuevo justificado (y pedido por el usuario).

## 1. Anatomía (contrato propuesto; prototipo `.nb` → `.g-nav-bar`)

```html
<div class="g-nav-bar [g-nav-bar--glide] [g-nav-bar--mark]" id="ID">     <!-- dentro de header.g-app-shell__header -->
  <div class="g-nav-bar__brand">[slot brand]</div>                       <!-- logo + nombre, enlace de la aplicación -->
  <div class="g-nav-bar__search">[slot search]</div>                     <!-- ocupa el hueco; el disparador es de la app -->
  <nav class="g-nav-bar__nav" aria-label="{label}">
    <ul class="g-nav-bar__list">
      <li class="g-nav-bar__light" aria-hidden="true"></li>              <!-- P1, capa primera (#962) -->
      <li><a class="g-nav-bar__link" href aria-current="page">Componentes</a></li>
      <li><a class="g-nav-bar__link" href target="_blank" rel="noreferrer">GitHub<span aria-hidden>↗</span><span class="sr">(se abre en otra pestaña)</span></a></li>
      <li class="g-nav-bar__mark" aria-hidden="true"></li>               <!-- P2 -->
    </ul>
  </nav>
  <div class="g-nav-bar__actions">[sep][acción][sep][acción]</div>       <!-- slot actions { place: 'bar' } -->
  <div class="g-nav-bar__more"><button aria-expanded aria-controls="ID-more" aria-label="{labels.more}">…</button>
    <div id="ID-more" popover>[slot actions { place: 'more' }]</div></div>
  <div class="g-nav-bar__toggle"><button aria-expanded aria-controls="ID-screen" aria-label="{labels.menu}">≡ / ×</button></div>
  <div class="g-nav-bar__screen" id="ID-screen" hidden>
    <nav aria-label="{label}"><ul>… los mismos enlaces en filas de 48 …</ul></nav>
    [slot actions { place: 'screen' }]
  </div>
</div>
```

1. **La raíz no es un landmark;** el banner es la banda de `GAppShell` (fuera del chasis, la aplicación pone `<header>`). Dentro hay **un `nav` con nombre** (`label`, obligatoria): «Secciones». El índice de páginas (`GSidebar`, «Documentación») es otro `nav` con otro nombre: dos navegaciones distinguibles en la lista de puntos de referencia.
2. **Lista de enlaces, sin roles de menú** (APG «Disclosure Navigation»; `menubar` es para aplicaciones de escritorio y obligaría a flechas que nadie espera en un sitio). Se recorre con **Tab**. Medido: Tab = salto → búsqueda → Guía → … → GitHub → idioma → tema (tres motores; en WebKit los enlaces no tabulan por defecto, límite conocido de S7).
3. **`items`:** `{ id, label, href, activeMatch?, external?, target?, rel?, lang? }`. Sin `id`, `label` o `href` se ignora y avisa. `children` (desplegables de sección, que VitePress admite) **reservado**: el sitio no los usa.
4. **La actual:** `aria-current="page"` en **un solo** enlace: el primero cuyo `activeMatch` (cadena de `RegExp`) casa con la prop **`current`** (la ruta que da la aplicación); sin `activeMatch`, `href === current`. Un externo nunca es actual. **No lee `location`** (SSR, #1033): con la ruta en una prop, el HTML del servidor ya trae la actual. Medido: Componentes en la ficha, Guía en Empezar, Blocks en Blocks, ninguno en la portada (tres motores, claro y oscuro, cinco anchos).
5. **Externos:** `target="_blank"` + `rel="noreferrer"`, icono `arrow-up-right` decorativo (calco: 11 px en `text-subtle`) y **texto oculto** `labels.newTab` («se abre en otra pestaña»), la misma regla y los mismos textos que los elementos-enlace de `GMenu` (#575; sin texto, aviso como E6 de `GMenu`).
6. **`navigate` `{ item, event }`** con la guarda común (#505 + #574): solo clic primario sin modificadores ni otro contexto; cancelable para el router. Un externo no lo emite. Elegir un destino **cierra** «…» y la pantalla (también si la aplicación cancela).
7. **Slots:** `brand` (marca, enlace de la aplicación), `search` (el disparador de búsqueda de la aplicación), `actions` con alcance `{ place: 'bar' | 'more' | 'screen' }` (la aplicación pinta en cada sitio lo que corresponde: en la barra, el `GMenu` de idioma y el `GSwitch`; en «…», la lista de idiomas y la fila «Apariencia»; en la pantalla, lo mismo en grande). Se pintan los tres en el HTML; el CSS enseña uno (§4). Un `GMenu` en cada sitio genera su `id` (SSR-seguro): sin duplicados.
8. **Separadores** (calco: 1 × 24 antes de idioma y antes del tema): `GNavBar` pinta un separador decorativo **antes de cada nodo de primer nivel** del slot `actions` en `place: 'bar'` (aplanando fragmentos). Así la aplicación no dibuja rayas ni usa `GDivider` vertical, que estira a los 64 de la banda (no a 24).

## 2. La marca y la columna izquierda

9. **Con un `GSidebar` expandido o en riel en el chasis, la marca de la barra no se pinta** (calco: la marca «pertenece» a la columna, sobre su fondo hundido y con su línea). La regla es CSS, por las clases públicas de `GSidebar` que ya son contrato entre componentes (#712): `.g-app-shell:has(> .g-sidebar--mode-expanded, > .g-sidebar--mode-rail) .g-nav-bar__brand { display: none }`. Sin JS, sin desajuste al hidratar. La aplicación pone la misma marca en el slot `logo` de `GSidebar`. Medido: la búsqueda empieza a 48 del borde de la columna, como antes (Δ 0 px a 1280 y 1024).
10. **Pendiente de paridad (N-L10, coco + lima):** la cabecera de `GSidebar` en el chasis debería medir **el alto de la banda** y llevar su línea inferior, para que marca y barra compartan la misma raya (hoy la cabecera es más baja y sin línea; ver `proto-comp-1280-claro.png`).

## 3. Relación con `GAppShell` y con `GSidebar mode="navbar"`

11. **Banda:** el alto lo pone el tema del sitio con la entrada pública `--g-app-shell-header: calc(var(--g-space-1) * 16)` (64, la de VitePress; #713). `GNavBar` ocupa la banda entera (`block-size: 100%`) y suma `space-4` al relleno de la banda para el 32 del calco (24 en estrecho). **Medido: banda 64 en las 40 vistas × 3 motores.**
12. **`EDGE_ORDER`:** `GNavBar` **no reserva borde propio**: vive dentro de la banda, que ya está en el registro (`appShell = 5`, #714). La pantalla de menú se coloca bajo la cifra publicada `--g-app-shell-top`.
13. **Pantalla abierta con chasis (N-L7):** la pantalla tapa la página, así que lo de detrás no debe recibir foco ni lectura. Con chasis, `GNavBar` pide por el canal interno (`appShellKey`, #710) que el chasis ponga `inert` en el marco y en la pista del índice mientras está abierta, y bloquee el desplazamiento del documento; sin chasis, el foco queda en bucle **botón ↔ pantalla** (Tab y Mayús+Tab no salen) y Esc cierra. Medido en el prototipo: bucle y Esc con devolución del foco en los tres motores. No usa `GSidebar` drawer: el sitio ya tiene un `GSidebar` (el índice) y dos cajones serían dos navegaciones superpuestas; además son 6 enlaces y 2 acciones, una *disclosure*, no un `<dialog>`.
14. **Frontera con `GSidebar mode="navbar"`:** aquella es la barra **inferior** de una aplicación (píldora, «Más»); esta, la superior de un sitio. Pueden convivir (la app de producto con barra inferior y la web con barra superior), pero en una misma página **no** se recomiendan las dos. **Nombre:** el usuario lo llamó `GNavBar` (`g-nav-bar`); la clase `g-sidebar--mode-navbar` ya existe. Lima decide si mantiene el nombre (y lo explica en las dos fichas) o propone otro; kiwi recomienda mantenerlo: es lo que se busca en la documentación de cualquier librería.
15. **Desplazamiento:** en el sitio anterior, por debajo de 960 la barra **se iba con la página** y solo quedaba la barra local de 48 pegada. `GAppShell` hoy la deja siempre pegada (o la cede con `header="relay"` si hay un `GPageHeader` pegado, que este sitio ya no tiene). El prototipo la deja pegada. **Pregunta N-Q3.**

## 4. Cortes, desbordamiento y estrecho (SSR sin CLS)

16. **Cortes del visor, no de la caja (N4):** `< 48rem` marca + búsqueda en icono + hamburguesa; `48–80rem` enlaces + «…» con las acciones; `≥ 80rem` todo en la barra. Son los de la referencia (768/1280 con 16 px de raíz). **Por qué del visor:** la banda vive al lado de la columna izquierda solo cuando esta existe, así que su caja mide 688 a 960 y 1008 a 1280; con consultas a la caja la portada (sin columna) y la ficha (con ella) no pueden coincidir a la vez con la referencia. `@container` sobre `GAppShell` no sirve: la contención de diseño convertiría la raíz en bloque contenedor de lo fijo (`GSidebar` fijo, la isla). En `rem`, los cortes crecen con el texto del navegador (1.4.4). **`contained` (consulta a la propia caja) queda reservado** para demos y paneles.
17. **Todo en el HTML, el CSS elige:** enlaces de la barra, «…» y pantalla están en el HTML del servidor (`hidden` en los cerrados); nada se mide en el primer render. Medido: sin desplazamiento horizontal en 40 vistas × 3 motores; banda de 64 siempre.
18. **«…» es una *disclosure*, no un menú:** contiene una lista de enlaces de idioma y un interruptor (VitePress igual). Botón con `aria-expanded` y nombre de `labels.more` (el original decía «extra navigation» en inglés y `aria-expanded="false"` estando abierto). Propuesta para bruno: el panel con `popover="auto"` (cierre por fuera y Esc nativos, capa superior sin recortes). Medido: abre con idioma y apariencia; Esc cierra y devuelve el foco (tres motores).
19. **Pantalla:** bajo la banda, a todo el visor, enlaces en filas de 48 con línea inferior (calco), la actual marcada, y debajo las acciones (`place: 'screen'`). Al pasar a ancho se cierra sola. Medido: abre a y = 64 con el foco dentro, filas ≥ 44, Esc devuelve el foco al botón.
20. **Táctil:** con `pointer: coarse`, enlaces, «…», hamburguesa y disparadores ≥ 44 (medido 44 en la barra y la barra local).

## 5. Teclado, foco y anuncios

21. Tab recorre marca (si se pinta) → slot `search` → enlaces → acciones. Sin flechas. **Esc** cierra «…» o la pantalla y devuelve el foco a su botón. **`/` y ⌘K no son de `GNavBar`**: los registra la aplicación (Grana no escucha el documento, regla de #1035); `GNavBar` no tiene métodos de foco porque los atajos van al filtro de `GSidebar` (`focusFilter()`) o a la búsqueda de la aplicación.
22. Foco visible de Grana (`--g-focus-width` en `--g-color-focus`), por dentro de la banda en los enlaces de 64 para que no lo corte el borde.
23. Sin regiones vivas: cambiar de página cambia el título y el foco lo lleva la aplicación (al `h1`), como hoy.

## 6. Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Color del enlace (hover, actual) | `--g-duration-slow` + `--g-ease-out` (el calco usaba .25 s) | Igual (solo color) |
| P1 · luz | `translate` e `inline-size` con `--g-duration-slow` + `--g-ease-out`; aparece sin viajar (`flashInstant`) | Solo `opacity` `fast` |
| P2 · marca | `translate` e `inline-size` con `--g-duration-slow` + **`--g-ease-spring`** (un cambio de forma «estás aquí», como el asiento de `GSidebar`, #635) | Solo `opacity` `fast` |
| «…», pantalla | Sin animación propia (el calco animaba la opacidad del panel .25 s): **pendiente de coco** con el patrón de entrada de `GMenu` (#1002) | — |

Rúbrica (`docs/documentacion/rubrica-movimiento.md`): A cumple (P1 dice dónde está el puntero, P2 a dónde fuiste); C cumple (nada empuja: capas absolutas, la barra no cambia de medida); D cumple (transiciones, no `@keyframes`: un cambio a mitad parte de donde está); E cumple (todo lo provoca el usuario); F cumple; G **a medir** con bruno (P1 lee dos cajas por cambio de destino, ninguna si no; P2 una por cambio de ruta). **No verificable aquí:** comodidad con trackpad inercial.

## 7. Qué lo hace distinto (regla del usuario)

El aspecto es un calco; lo distinto es **cómo se comporta**, y todo es **opcional** para no romper la paridad visual en reposo.

- **P1 · Una sola luz (`glide`).** La luz de #957 (`GMenu`, `GSidebar`, `GTable`) en la barra: una capa que **se desliza** de enlace en enlace bajo el puntero, sobre la fila de texto (no los 64 de la banda). Con ella, **el hover deja de pintar en `accent` como el actual**: el puntero tiene su señal (la luz) y la actual la suya (el color). **Por qué sirve:** en el original hover y actual se pintaban igual (§7 de la referencia), así que al pasar el puntero se perdía «dónde estoy»; además la luz da continuidad al cruzar seis enlaces seguidos y es la misma gramática del resto de Grana. El puntero no mueve el foco (medido en los tres motores). Captura: `proto-estado-p1-p2-1280-*.png`.
- **P2 · La marca que viaja (`mark`).** Una línea de 2 px en el borde de la banda bajo el texto del actual que, **al cambiar de sección, se desliza del enlace anterior al nuevo** con `--g-ease-spring` (la primera vez aparece sin viajar). **Por qué sirve:** al navegar entre secciones, el ojo ve **a dónde ha ido** sin buscar el color, y la actual deja de depender solo del color (1.4.1, ver N-Q2). Es la misma idea del asiento de `GSidebar` (#612) en horizontal. Medida: bajo el texto (±2 px) y en el borde de la banda; contraste de forma 5,69:1 claro, 4,95:1 oscuro.
- **No se propone** animar «…» ni la pantalla como «personalidad» (sería animar una caja); su entrada y salida, si las hay, son las comunes de #1002.

## 8. Preguntas de producto (solo las abiertas de verdad)

- **N-Q1 · ¿Qué hace «Buscar ⌘K»?** El original abría una búsqueda modal de texto completo (VitePress). En A, `/` enfoca el filtro del índice y el texto completo sale como grupo «En el texto» del filtro. Opciones: **(a)** «Buscar» y ⌘K enfocan el filtro del índice (en estrecho o en la portada, sin columna, abren el cajón con el filtro): cero piezas nuevas, pero en la portada se abre un cajón para buscar; **(b)** «Buscar» y ⌘K abren una búsqueda modal (`GDialog` + `GCombobox appearance="palette"`, como el prototipo), y `/` sigue yendo al filtro: paridad completa, pero reabre S-L1 de #1041 (modo comando, `open()`, fragmento). **Recomendación de kiwi: (b)**, porque es lo que había y la portada no tiene índice.
- **N-Q2 · ¿La marca P2 va siempre, aunque cambie el calco?** Sin ella, la actual se distingue **solo por color** a 3,06:1 de los demás (claro) y el hover pinta igual (G183 pide ≥ 3:1 **y** otra señal al pasar o enfocar). Con P1 se arregla el hover; con P2, la señal de forma. **Recomendación:** P1 y P2 activadas en el sitio (cambia la barra en reposo: aparece la línea de 2 px bajo «Componentes») o, si se quiere el calco exacto, al menos P1.
- **N-Q3 · En estrecho, ¿la barra se va con la página (como antes) o se queda pegada?** Antes: por debajo de 960 se iba y quedaba solo la barra local (Menú · En esta página). Para calcarlo hace falta una enmienda de `GAppShell` (banda que se despega por debajo de un corte, N-L8). Pegada: 112 px arriba en un teléfono (64 + 48 = 15 % de 740; el presupuesto del cuarto de #713 lo permite). **Recomendación:** como antes (más lectura en el teléfono), con la enmienda.

## 9. Enmiendas y piezas para lima

| Id | Qué | Dónde |
| --- | --- | --- |
| **N-L1** | Enmendar #1041 / `sitio-marco.md`: el sitio vuelve a la barra superior, ahora `GNavBar` (decisión del usuario del 2026-11-08) | `DECISIONS.md`, `sitio-marco.md` |
| **N-L2** | Contrato de `GNavBar`: §1 a §6 (props `items`, `current`, `label`, `labels` {`more`, `menu`, `newTab`}, `glide`, `mark`, `id`; slots `brand`, `search`, `actions` con `place`; eventos `navigate`, `update:open`; avisos) | `design/contracts/nav-bar.md` |
| **N-L3** | Receta del disparador de búsqueda calcado (lupa + «Buscar» + `kbd`) con `GBtn` y su `aria-keyshortcuts`; o pieza propia si N-Q1 = (b) | `nav-bar.md` «Recetas» |
| **N-L4** | Icono `arrow-up-right` en la lista de la librería para el externo (calco). Alternativa: `external-link` como `GMenu` (#575), que cambia el calco | `docs/contract/icons.md` |
| **N-L5** | Regla CSS entre componentes: la marca se oculta con un `GSidebar` expandido o en riel en el chasis (clases de #712) | `app-shell.md` «Reserva», `nav-bar.md` |
| **N-L6** | Cortes del visor `48rem` y `80rem` como constantes de contrato; `contained` reservado | `nav-bar.md` |
| **N-L7** | Canal del chasis para la pantalla abierta (`inert` en marco y pista, bloqueo del desplazamiento) | `app-shell.md` «Canal interno», `utils/appShell.js` |
| **N-L8** | (si N-Q3 = como antes) Banda que se despega por debajo de un corte (`header="pinned"` + `unpinBelow`, o un valor `header="scroll-narrow"`) | `app-shell.md` |
| **N-L9** | Estado «arriba del todo» de la banda en la portada: transparente y sin línea hasta desplazar (calco). O aceptar la línea siempre | `app-shell.md` o CSS del sitio |
| **N-L10** | Cabecera de `GSidebar` en el chasis con el alto de la banda y su línea (§2) | `sidebar.md`, coco |
| **N-L11** | Peso y entrada: `GNavBar` **no entra al principal** (margen agotado, #506/#550): entrada propia `@grana/vue/nav-bar` con tope a fijar tras medir el `.vue` (estimación de kiwi, sin medir: ≈ 2,5 KiB gzip; P1 reutiliza `utils/glide.js` por `__shared`) | `api.md` «Paquete, entradas y tipos» |

## 10. Hallazgos para otros dueños

- **N-H1 (bruno):** `design/lab/lucide-icons.js` sigue sin `sun`, `moon`, `languages`, `arrow-up-right`, `ellipsis`, `align-left` (ya lo decía S-H3). La ronda los toma de `lucide-static` con `lucide-extra.js` generado (no a mano); conviene añadirlos al banco.
- **N-H2 (bruno):** `createPointerGlide` no viaja en `__shared` (solo `aimed` y `placeHighlight`); `GNavBar` en su entrada propia lo necesitará por `__shared` sin copia.
- **N-H3 (coco):** `GSwitch md` mide 44 de riel y la fila 56 aunque la etiqueta esté oculta (el calco: 40 y 40). Desvía 16 px el bloque de acciones a 1280 (`paridad.json`). Además el encendido se rellena (`color="neutral"`); el interruptor del original no. Valorar una receta «interruptor de tema» o aceptarlo.
- **N-H4 (lima + bruno):** `GSwitch` no tiene etiqueta oculta: el prototipo la esconde con CSS del sitio. Un `hideLabel` (o `aria-label` reenviado al `input`) evitaría la receta.
- **N-H5 (mora-docs):** la portada del anterior decía «64 componentes»; son 79 (S-H2 sigue abierto).

## 11. Tabla de paridad · sitio anterior → Grana

Δ medidos en `paridad.json` (Chromium, la misma página y ancho; x y ancho en px). «Cubre» = componente real, sin cambios.

| # | Elemento del sitio anterior | Lo hará | Qué falta |
| --- | --- | --- | --- |
| 1 | Barra de 64, fija ≥ 960 | `GAppShell` banda + `--g-app-shell-header: 64px` del tema | Cubre (Δ alto 0). En estrecho se iba con la página: N-Q3 / N-L8 |
| 2 | Línea inferior que no cruza la columna | `GAppShell` (la banda está en la columna de la página) | Cubre |
| 3 | Portada: barra transparente arriba del todo | — | N-L9 |
| 4 | Marca (logo 24 + Instrument Serif 20) | `GNavBar` slot `brand`; con columna, `GSidebar` slot `logo` | Cubre con N-L5; la serif es CSS del sitio (no token: solo la documentación la usa) |
| 5 | Marca sobre la columna con su línea a 64 | `GSidebar` cabecera | N-L10 |
| 6 | Botón «Buscar ⌘K» (36 de alto, lupa sola en estrecho) | slot `search` + receta (N-L3) | Δ x 0 a 1280, 1024 y 768 (+4 a 375 y 320); ancho −11 a 1280 y −37 a 1024 (el original desbordaba su hueco a 1024) |
| 7 | Búsqueda modal de texto completo | `GDialog` + `GCombobox palette` | N-Q1 (S-L1 de #1041) |
| 8 | Seis enlaces 14/500, actual en `accent-text` por `activeMatch` | **`GNavBar`** | Nuevo (N-L2). Δ ancho de cada enlace 0; x −21 a −23 a 1280 y 1024 (el `GSwitch`, N-H3, y el «…» del original, que se salía 2 px del visor); +1,4 a 768 |
| 9 | GitHub con flecha, otra pestaña | `GNavBar` `external` | N-L4 (icono) |
| 10 | Separadores 1 × 24 | `GNavBar` (§1.8) | Nuevo |
| 11 | Idioma (`languages` + chevron, panel con el actual en negrita) | `GMenu` con elementos-enlace (`current`, `lang`, `hreflang`, #743) | Cubre. Abre al pulsar, no al pasar (corrige el defecto 7) |
| 12 | Interruptor de tema con sol/luna | `GSwitch` + slots `icon-on`/`icon-off` | Casi: N-H3, N-H4 |
| 13 | «…» con idioma y apariencia (960–1279) | `GNavBar` `more` + `actions { place: 'more' }` | Nuevo; Δ x 0 a 768, −22 a 1024 (el original se salía del visor) |
| 14 | Hamburguesa + pantalla de menú (< 768) | `GNavBar` toggle + pantalla | Nuevo; N-L7; Δ x +4 a 375 y 320 |
| 15 | Índice izquierdo 272, fondo hundido, grupos plegables, filas de 32 en texto, actual en color | `GSidebar` expandido + `--g-sidebar-width: 272` + filtro + `code` 01–79 | **Difiere** (decisión del usuario: se conservan filtro y números; el resto del aspecto del índice —asiento #612, títulos de grupo, grupos no plegables— no es el del original). Fuera de este encargo: si se quiere calcar, ronda propia de `GSidebar` |
| 16 | Cajón < 960 (320) | `GSidebar mode="drawer"` | Cubre |
| 17 | Barra local de 48 pegada (Menú · En esta página) | Maqueta del sitio + botón + `GPageIndex` plegado | Receta de barra pegada en `scroll-padding` (PI-L6 de `page-index/r01`) |
| 18 | Columna «En esta página» | **`GPageIndex appearance="list"`** | Nuevo (`page-index/r01`); Δ x/y 0 |
| 19 | Desplegable en estrecho | `GPageIndex` `fold` | Nuevo; Δ x 0 a 1024, −12 a 768, −4 a 375 |
| 20 | `h1`/`h2` en Instrument Serif, prosa 16/28 | CSS del sitio (+ `GContainer prose` si se quiere la medida) | Cubre (Δ `h1` x/y/ancho ≤ 1 px en los cinco anchos) |
| 21 | Anterior / siguiente (304 × 66) | `GCard interaction="link"` ×2 o pieza «páginas vecinas» (inventario #8) | Casi: medir `GCard` contra el calco (coco) |
| 22 | Pie (portada) | `GAppShell` slot `footer` | Cubre |
| 23 | Saltar al contenido | `GAppShell` | Cubre |
| 24 | Bloques de código con copiar | — (inventario #4, `GCode`) | Falta; es contenido, no marco |

## Comprobaciones (`verificar.mjs`)

Por motor (Chromium, Firefox, WebKit) × tema (claro, oscuro) × página (ficha, guía, Blocks, portada) × ancho (1280, 1024, 768, 375, 320): consola limpia; sin desplazamiento horizontal; un banner y un `main`; toda `nav` visible con nombre; banda de 64; una sola actual en la barra según `activeMatch` (≥ 768). Comportamiento a 1280: contraste del enlace en reposo y del actual ≥ 4,5:1, marca P2 ≥ 3:1 y bajo el texto del actual; P1 se posa bajo el puntero, no mueve el foco y apaga el hover en `accent`; Tab en orden visual (Chromium y Firefox); idioma con `lang`/`hreflang` y `aria-current="page"`; el interruptor cambia `data-theme`. «…» a 1024: `aria-expanded`, nombre en español, Esc devuelve el foco. Pantalla a 375: bajo la banda con el foco dentro, filas ≥ 44, bucle de foco, Esc devuelve el foco, táctil ≥ 44. **772/772** (Chromium 258, Firefox 258, WebKit 256), 2026-11-08. Capturas (Chromium): `proto-{comp,guide,blocks,home}-{1280,1024,768,375,320}-{claro,oscuro}.png` y `proto-estado-{p1-p2-1280,idioma-1280,busqueda-1280,mas-1024,menu-movil-375}-{claro,oscuro}.png`.

**No verificado:** lector de pantalla real con dos `nav` y la pantalla abierta; `forced-colors` real (solo la regla CSS); trackpad inercial; SSR real (el prototipo no se renderiza en servidor: la garantía es de diseño, nada se mide en el primer render).
