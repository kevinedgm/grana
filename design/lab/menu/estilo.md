# Entrega de coco · menú (GMenu)

**Archivos:** `packages/vue/src/components/GMenu/GMenu.css` · se **retira** de `GWidget.css` el CSS del menú antiguo (`g-widget__actions`, `g-widget__action` y sus reglas de movimiento y de colores forzados; queda solo el botón `g-widget__menu`).
**Contrato:** `design/contracts/menu.md` y `design/contracts/widget.md` (DECISIONS.md #82 a #84). **Sin tokens nuevos** (ni cambios en `defaults.css`).
**Estado:** listo para bruno. **Registro pendiente en `components.css`** (es de bruno) y **`GWidget.vue` todavía emite las clases antiguas**: hasta que bruno lo migre a `GMenu`, el menú del widget en el playground saldrá sin estilo.
**Banco de pruebas:** `design/lab/menu/estilo-banco.html` (desde la raíz: `/design/lab/menu/estilo-banco.html`): el marcado exacto del contrato con el CSS real y un motor mínimo que imita lo que hará bruno; botones de tema de prueba, oscuro, RTL y densidad compacta. El banco de widgets (`design/lab/widget/estilo-banco.html`) se actualizó al menú nuevo.

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Lista** | Superficie con borde `--g-color-border-control` (3:1), `--g-radius-lg`, `--g-shadow-2` y relleno de `space × 1.5`; ancho mínimo `space × 50` (200px) y máximo `space × 80` (320px); entra con un fundido y una escala de 0.96 desde la esquina más cercana al disparador (`data-side`/`data-align`, físicas) y sale igual en 120 ms, montada e inerte hasta terminar; con `prefers-reduced-motion` solo el fundido |
| **Coordenadas físicas** | La lista se coloca con `left` y `top` (`--_x`, `--_y`): el componente calcula coordenadas del visor, y con propiedades lógicas el menú salía en el lado equivocado en RTL (hallazgo de kiwi) |
| **Elemento** | Alto `max(24px, space × 9)` (44px con `pointer: coarse`), radio `md`; **sin fondo propio** en hover, foco ni con su submenú abierto: el activo (el enfocado, también por el puntero, o el padre expandido) lo marca **la capa única de su lista** en `--g-color-surface-sunken` (§«Personalidad», #305); el foco visible es un contorno de `--g-focus-width` **hacia dentro**, sin cambios |
| **Icono y atajo** | Icono de `space × 4.5` en `text-muted`; atajo en `caption` y `text-subtle`, a la derecha |
| **Deshabilitado** | `text-subtle` y **tachado**; sigue enfocable (el foco sí lo destaca) |
| **Peligroso** | `danger-text`, **negrita** y un **triángulo** recortado con `clip-path` antes de la etiqueta |
| **Casilla y opción** | Marca de `space × 4.5`, borde `border-control`; marcada: relleno de `brand`, con un **✓** hecho con dos bordes girados (casilla) o un **punto** (opción), en `on-brand`; la opción es un círculo |
| **Submenú** | Chevron dibujado con dos bordes; **en RTL se gira +45°** (los bordes son lógicos, así que la esquina ya está en el lado contrario) y apunta a la izquierda |
| **Grupo y separador** | Título en `caption` y `text-subtle`; separador de `border-strong` |
| **Colores forzados** | Borde, marcas, foco y deshabilitado pasan a colores del sistema; la marca de la casilla y el punto de la opción se siguen viendo (`CanvasText` sobre `Canvas`) |
| **Sin literales de tema** | Solo tokens y `space`; únicos literales de medida: `24px` y `44px`. Sin consultas de medios de ancho |

## Personalidad (plan 020, M1 «una sola luz que viaja»; DECISIONS.md #299 y #305; `menu.md` «Personalidad»)

**Qué le da personalidad:** el menú tiene **una sola luz por lista** que se desliza hasta el elemento activo, en lugar de que cada elemento encienda y apague su fondo. Al barrer con el ratón no queda estela de medio encendidos (antes, dos elementos con fondo a la vez), y como el puntero mueve el foco, ratón y teclado son la misma señal: lo que se ve iluminado es donde seguirá la flecha. El movimiento es corto y firme (respuesta de `press`, sin rebote) porque un menú se abre cien veces al día: se nota el recorrido, no se espera.

| Detalle | Cómo |
| --- | --- |
| **Capa** | `g-menu__highlight` (primer hijo de cada `g-menu__list`, marcado de bruno) en `position: absolute`, `inset-inline: var(--_pad)` (el relleno de la lista, `space × 1.5`), `block-size: var(--_active-h)` y `translate: 0 var(--_active-y)`; radio `md`, `--g-color-surface-sunken`, `pointer-events: none`. Va dentro de la lista, así que se desplaza con su contenido; queda bajo los elementos por orden del árbol (son `position: relative`), sin `z-index` |
| **Datos** | `--_active-y` y `--_active-h` (px, los escribe `GMenu.vue`); se declaran a `0px` en la lista como alias locales (no son valores de respaldo: el estilo en línea los sustituye). Visible con `has-highlight` (`opacity: 1`) |
| **Viaje** | `translate` y `block-size` en `--g-duration-press` (160 ms) con `--g-ease-out`; fundido de `opacity` en `--g-duration-fast` con `--g-ease-standard`. **Sin `--g-ease-spring`** (#299 no lo aprueba en menús) |
| **Primera colocación** | Con `is-highlight-instant` (al abrir, al abrir un submenú o tras quedarse sin activo; dos cuadros) solo transiciona la opacidad: aparece en su sitio, sin venir desde arriba |
| **Submenús** | Cada submenú tiene su propia capa; el padre expandido conserva la suya |
| **Deshabilitado** | Con el puntero no recibe la capa (no toma el foco, `GMenu.vue`); con el teclado sí, como antes (sigue enfocable). Ya no hay reglas de fondo propias del deshabilitado |
| **Movimiento reducido** | La capa **salta** (`transition: opacity fast linear`): sin desplazamiento ni cambio de alto animado, con fundido |
| **Colores forzados** | La capa se oculta (`display: none`) y el activo se marca **por elemento** con el contorno `Highlight` que ya tenía `:focus` (también el foco puesto por el puntero) y el padre expandido |
| **Corrección de paso** | El reinicio `.g-menu__list ul` quitaba el relleno a los **submenús** (también son `ul` dentro de la lista): ahora es `ul:not(.g-menu__list)` y el submenú tiene el mismo relleno que la raíz (`space × 1.5`), así la capa y los elementos coinciden y la primera fila del submenú queda alineada con su padre |

### Medidas (spec `design/lab/theme-playground/tests/personalidad-menu.spec.mjs`, GMenu real del UMD)

| Qué | Resultado |
| --- | --- |
| Barrido con el puntero (9 elementos, ida y vuelta, incluido el deshabilitado) | **0** elementos con fondo propio y como máximo **1** superficie por lista en todos los cuadros (Chromium 102, Firefox 108, WebKit 128 cuadros); el puntero mueve el foco; termina exacto (±1px en las cuatro aristas) |
| Trayecto (Renombrar → Por nombre, 6 → 225px), recorrido determinista cada 8ms | `translate` 160 ms `cubic-bezier(0.23, 1, 0.32, 1)`; 15 valores intermedios, monótono, **sin sobrepaso**, termina exacto; igual en los tres motores |
| Tiempo real (Chromium) | **7** cuadros intermedios entre el primero y el último (kiwi: 7) |
| Teclado | La capa sigue al foco en los 8 elementos (incluido el deshabilitado), en el submenú (su propia capa) y el padre expandido conserva la suya; vuelve con Esc |
| Primera colocación | Al abrir con clic, con ↑ (sobre el último) y al abrir un submenú: `is-highlight-instant` en los dos primeros cuadros, **0** transiciones de posición o alto, en su sitio desde el primer cuadro |
| Lista con desplazamiento y RTL | Con la lista desplazada (End y luego `scrollTop − 60`) la capa sigue exacta al elemento; en RTL ocupa el ancho del elemento |
| Movimiento reducido | `transition-property: opacity` (120 ms); 0 transiciones de `translate`; en su sitio desde el primer cuadro |
| Colores forzados (Chromium) | Capa `display: none`; contorno `solid` de 3px en el activo (puesto por el puntero) y en el padre expandido |
| Contraste sobre la capa (texto · atajo e icono · deshabilitado · peligroso) | Claro por defecto: 16.10 · 4.72 y 6.90 · 4.72 · 5.08. Oscuro por defecto: 17.00 · 6.93 y 9.59 · 6.93 · 5.05. Tema generado `spotify` claro: 16.19 · 4.70 y 6.87 · 4.70 · 5.11; oscuro: 17.09 · 6.96 y 9.62 · 6.96 · 5.05 (iguales en los tres motores) |
| Consumidor | Menú de fila de `GTable` en el playground (Chromium): 0 fondos propios, el puntero mueve el foco, la capa termina exacta |

**Banco:** `estilo-banco.html` dibuja la capa y su motor mínimo imita a `GMenu.vue` (activo, `--_active-*`, `has-highlight`, `is-highlight-instant` y el puntero que mueve el foco).

**Para bruno (defecto previo, no de M1; medido igual en `fd3a253`):** con el puntero **quieto** sobre un elemento de la lista padre, abrir un submenú con → (o Enter) lo cierra al instante y **el foco cae al `body`**. Repro: abrir, poner el ratón sobre «Archivar» y no moverlo, End, ↑ hasta el padre, →: el submenú se muestra y desaparece en < 60 ms. Si el puntero sale de la lista antes, no pasa. El spec lo esquiva sacando el puntero (comentado en el caso de colores forzados).

**Sin verificar:** lector de pantalla real con el foco siguiendo al puntero; `forced-colors` real (solo emulado en Chromium); táctil real (`pointer: coarse`: el toque no mueve el foco por puntero, la capa sigue al foco).

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores literales ni valores de respaldo; sin `@layer` ni `<style>` |
| Medidas por defecto | Lista de 200px (mínimo), elemento de 36px, marca de 18px; con `space` 5, lista de 250px, elemento de 45px y marca de 23px |
| Contraste (tema por defecto) | Etiqueta 17.4:1 · atajo, deshabilitado y título de grupo **5.1** · peligroso **5.49** · borde de la lista **3.45:1** · casilla sin marcar (borde) 3.45 · casilla marcada (relleno) 16.48 |
| Contraste (tema propio) | Etiqueta 13.3 · atajo 7.28 · peligroso 7.46 · borde 5.22 · casilla marcada 4.6 · sin marcar 6.05 |
| Contraste (oscuro) | Etiqueta 15.22 · atajo y deshabilitado 6.21 · peligroso **4.52** · borde 4.66 · casilla marcada 15.22 · sin marcar 4.32 |
| Separador | 1.45:1 (decorativo: no lleva información) |
| Foco | El elemento activo recibe un contorno de 3px en el color de foco (tema por defecto, en el banco con teclado) |
| Submenús y RTL | Submenú a la derecha del padre; en RTL, a la izquierda, con el chevron apuntando a la izquierda (**corregido en la verificación**: salía apuntando hacia arriba) |
| Posición | Debajo del disparador del widget (verificado en el banco de widgets); lista larga con `--_max` y desplazamiento |
| Oscuro | Con `data-theme="dark"`, lista y marcas legibles y coherentes |
| Consola | Sin errores |

## Hallazgos y observaciones

1. **El chevron de RTL salía mal** con `rotate: 135deg` (apuntaba hacia arriba): con bordes lógicos hay que girar +45°. Corregido y verificado.
2. **El texto peligroso en oscuro queda en 4.52:1**, el mínimo de la regla de derivación del tema oscuro (los semánticos como texto rozan 4.5:1; ver `design/lab/tema-oscuro/estilo.md`).
3. **`GWidget.vue` y `GWidgetGrid.vue`** aún generan el menú antiguo: bruno debe migrarlos a `GMenu` (contrato `widget.md`), y sus pruebas esperan las clases `g-widget__action`.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla; `forced-colors` y `pointer: coarse` reales (solo comprobé que las reglas existen); Firefox y Safari (`popover`, `:dir()`, `@starting-style`); textos largos o traducidos; el menú dentro de un `GDialog`.
