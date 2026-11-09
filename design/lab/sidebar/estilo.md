# Entrega de coco · GSidebar.css

**Archivo:** `packages/vue/src/components/GSidebar/GSidebar.css` · **Defaults:** `packages/vue/src/styles/defaults.css` (3 tokens de estructura) y `packages/cli/src/defaults.js` (sincronizado; las 51 pruebas del CLI pasan).
**Contrato:** `design/contracts/sidebar.md` (DECISIONS.md #67 a #70) y `docs/contract/tokens.md` §13.
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/sidebar/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/sidebar/estilo-banco.html`). Trae un botón «Tema de prueba» y un **motor mínimo** (formatos, panel, pista, navbar, drawer) que imita lo que hará bruno. El contenido de la aplicación (logo, usuario, iconos) se estiliza en el propio banco con clases `bk-*`.

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Una sola superficie vertical continua** | El sidebar es la **carcasa** del sistema de superficies (`--g-surface-shell`) con un borde fino en su lado interior; sin tarjetas ni separadores por item. Solo hay una línea sobre el pie y, en el riel, una entre grupos |
| **Activo silencioso** | El item actual es la **inset** del sistema (`--g-surface-inset`) sobre la carcasa: fondo apenas más claro, contorno de `--g-color-border-strong` y `--g-shadow-1`, y `--g-text-action-weight`. Sin barras ni colores de acento. **Hover** oscurece la carcasa con el borde translúcido (`--g-color-border`), así hover y activo no se confunden |
| **Rama activa** | Un padre con un hijo actual: texto pleno y peso de acción, sin superficie |
| **Jerarquía por espacio** | Títulos de grupo en `caption`, `text-subtle` y peso de acción (sin mayúsculas ni tracking); hijos con sangría de `space × 5`, línea de conexión de `--g-color-border` y altura de `space × 9` (36px); sin niveles más profundos |
| **Búsqueda** | Botón con aspecto de campo compacto: inset con borde `--g-color-border-control` (3:1) y atajo en una `kbd` discreta; en riel, un botón de icono de 44px |
| **Indicadores** | Píldora con `--_color`/`--_on` (el `color` del componente) y texto `caption`; en riel y en el navbar, una marca sobre el icono |
| **Riel** | `--g-sidebar-rail`; etiquetas, títulos, chevrones e hijos ocultos **visualmente** (patrón de texto oculto, siguen en el DOM); items de 44px; los padres llevan un punto en la esquina que anuncia el panel |
| **Panel flotante** | Superficie con borde `--g-color-border-control`, radio `--g-radius-lg`, `--g-shadow-2` y una **muesca** girada que lo conecta al centro del item (`--_notch`); título en `caption`; hijos de 36px (44px táctil). Aparece con un desplazamiento corto |
| **Pista** | Fondo `--g-color-text` y texto `--g-color-surface` (17:1 por defecto), `caption`, radio `sm`, sin interacción |
| **Navbar «píldora activa»** | Barra flotante con `--g-color-surface`, borde, radio `--g-radius-xl` y `--g-shadow-3`, a `space × 3` de los lados y `space × 2.5` del borde inferior (más el área segura). El item actual (o rama, o «Más») se rellena con `--_color` y muestra icono y etiqueta; el ancho de su celda crece (`flex-grow` 3.2, animado) y la etiqueta aparece con un desplazamiento corto |
| **Drawer** | `<dialog>` a pantalla completa de alto, ancho `min(space × 80, 86vw)`, esquinas finales redondeadas (`--g-surface-radius`), la carcasa como fondo, `--g-shadow-3` y `::backdrop` con `--g-surface-backdrop`; entra desde el lado inicial |
| **Flotante y superpuesto** | `floating`: margen de `space × 3`, radio `--g-surface-radius` y `--g-shadow-2`; `overlay`: la expansión se posiciona encima con `--g-shadow-3` y no desplaza el diseño |
| **Movimiento** | Ancho de la barra, chevrón, panel, píldora y drawer con `--g-duration-fast/press` y `--g-ease-*`; nada decorativo. Con `prefers-reduced-motion` se quitan |

## Movimiento (ronda de animaciones)

Petición del usuario: «le faltan animaciones para transiciones y movimiento». Todo con **transiciones** (se interrumpen y se revierten) y los tokens `--g-duration-*` / `--g-ease-*`; alias locales `--_t` (160ms), `--_t-slow` (240ms) y `--_stagger` (30ms), **derivados** de esos tokens (sin curvas ni duraciones propias). Detalle en `design/contracts/sidebar.md`, «Movimiento», y DECISIONS.md #71.

| Movimiento | Medido en Chromium (banco, muestras cada 25 a 40ms) |
| --- | --- |
| Contraer (264 → 64px) | 262, 262, 199, 130, 99, 81, 71, 66, 64: ~240ms, con desaceleración; **la raíz es la misma** (no se reconstruye) |
| Expandir | El ancho sube (64 → 264) y las etiquetas **entran un instante después**: opacidad 0, 0, 0.51, 0.76, 0.95, 1 |
| Submenú (acordeón) | Cierra 112 → 54 → 12 → 0px con la opacidad; abre 0 → 59 → 100 → 112px; al terminar queda `inert` y `visibility: hidden` |
| Activo | El fondo del item que pasa a ser el actual se cruza en ~150ms (transparente → superficie), sin re-render |
| Panel flotante | Entra con opacidad 0 → 1, escala 0.96 → 1 y desplazamiento de −6px → 0 desde la **muesca** (`transform-origin: 0 23px`); **sale con fundido** y solo entonces pasa a `display: none`; el mismo elemento se reutiliza |
| Pista | La primera aparece tras 350ms con un fundido (0.5 a los 380ms → 1); la siguiente, con `is-instant`, **al instante** |
| Navbar | Entra desde el borde (`translate` de 100% + margen → 0, opacidad 0 → 1); al cambiar de página, la celda vieja se encoge (114 → 44px) mientras la nueva crece (44 → 114px) y su etiqueta entra |
| Drawer | Entra: `translate` −100% → 0 y opacidad 0 → 1, con el fondo 0 → 1; **sale igual** (−100%) y solo entonces `display: none`; los grupos entran escalonados |
| Movimiento reducido (bloque aplicado sin condición) | Drawer y panel: sin `translate` ni `scale`, solo fundido de 120ms; feedback de pulsación y volteo del icono quitados |

Decisiones de criterio (con la guía de movimiento del repositorio):
- **Sin movimiento en lo que se usa a diario:** el hover de un item es solo color; el teclado no añade animación propia.
- **Nada nace de la nada:** las entradas parten de `scale(0.96)` y opacidad 0, nunca de `scale(0)`; el panel crece desde su muesca, no desde el centro.
- **Entradas y salidas de un solo sentido, sin `ease-in`:** todas usan `--g-ease-out` (entradas) o `--g-ease-standard` (mover en pantalla).
- **Solo transform y opacidad** en lo que se repite (panel, pista, drawer, píldora, etiquetas); ancho y altura solo en expandir y en el acordeón (estructurales, una vez por acción).
- **Sin `transition: all`.**

### Notas para bruno (movimiento)

- **No reconstruyas el sidebar** al contraer, expandir, navegar ni abrir un submenú: alterna clases y atributos sobre el mismo DOM (si se recrea el nodo, la transición no corre). El banco lo hace así (`patch`, `syncSubs`, `syncActive`).
- **Submenú:** `is-open` + `inert` + `aria-expanded` (sin `hidden`).
- **Panel persistente:** `showPopover()` / `hidePopover()`, sin quitarlo del DOM. **La pista del riel** ya no es `g-sidebar__tip` (retirado de `GSidebar.css` con `is-instant`): es el motor de `GTooltip` en modo visual (#436), con `GTooltip.css` y ningún estilo propio del sidebar; auditada en `design/lab/tooltip/auditoria-pista.md`.
- **is-ready** en la raíz (lateral, drawer y navbar) dos cuadros después de montar, e **is-expanding** al pasar de riel a expandida ya montada (600 ms): las insignias y las etiquetas no se animan al cargar.
- **Navbar:** pon `is-entering` en la raíz al pasar a ese formato y quítala a los ~600ms; cambia `is-current` en el mismo `<li>` para animar la píldora.
- **Drawer:** no lo desmontes al cerrar; `close()` y deja terminar la transición (~240ms) antes de cambiar de foco o quitar el nodo.
- Los alias de movimiento (`--_t*`) están en la raíz **y** en el drawer (el `<dialog>` envuelve a la raíz y no los hereda).

## Sin literales de tema

Colores y radios solo de tokens; medidas solo de `space` y de la altura del item derivada (`space × 10`, con `density`). Únicos literales: `24px` (piso de la densidad), `44px` (área táctil, incluida la celda mínima del navbar) y `1px` del texto oculto. **Sin consultas de medios de ancho**: la adaptación es de bruno por el ancho del contenedor (DECISIONS.md #69); solo `pointer: coarse`, `hover`, `prefers-reduced-motion` y `forced-colors`.

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()` y `1px` del texto oculto; ningún `var()` con respaldo; sin `@layer` ni `<style>`; ninguna consulta de medios de ancho |
| Expandida | Ancho 264px (= `--g-sidebar-width`); item 40px, hijo 36px, icono 20px; con `space` 5, item 50px y barra de 330px |
| Contraste (tema por defecto) | Item 6.9:1 (sobre la carcasa) · activo 17.4 · título de grupo 4.72 · atajo 7.46 · contador 16.48 · deshabilitado 5.10 · borde del campo de búsqueda **3.45:1** |
| Contraste (tema de prueba) | Item 6.83 · título de grupo 5.14 · borde de búsqueda 4.48 · contador 6.79 |
| Activo frente a la carcasa | Superficie **1.08:1 (por defecto) y 1.20:1 (tema de prueba)** más contorno de `border-strong`, peso y texto pleno: ver «Observaciones» |
| Riel | Barra de 64px (= `--g-sidebar-rail`); items, búsqueda y toggle de 44px; etiquetas `clip-path: inset(50%)`; el contador queda dentro del item |
| Panel flotante | Abre a 4px del riel con nombre «Proyectos» y 3 hijos de 36px (44px táctil); hereda `--_color` de la raíz (vive dentro de ella); borde 3.45:1, título 5.10, enlaces 7.46 |
| Pista | A 8px del item, 17.4:1, 12px |
| Navbar (335px) | Barra de 58px a 10px del borde: **68px reservados = `--g-sidebar-bar`**; el actual 109px, los demás **44×48px**; etiqueta del actual de 14px; píldora 16.48:1; contador dentro de su celda |
| Drawer | 320px, alto completo, borde derecho de 12px, fondo de la carcasa, `::backdrop` activo |
| Táctil (bloque aplicado sin condición) | Item, hijo, búsqueda y toggle de **44px** |
| RTL | El sidebar pasa a la derecha, el borde queda en su lado interior y el chevrón se espeja |
| Colores forzados (bloque aplicado sin condición, 8 reglas) | Activo con contorno `CanvasText` en lugar de la sombra; deshabilitado `GrayText`; píldora con `Highlight` y borde de 4px |
| Movimiento reducido (bloque aplicado sin condición) | Sin desplazamientos ni escalas; se conservan los fundidos de color y de opacidad (también al cerrar el submenú) |
| Tema de prueba (ámbar, marrón, espacio 5, radios y borde de 2px, Georgia) | Todo lo que depende del tema cambia; lo que no cambia es intencional (el blanco de `on-brand` y el radio `xs` de la `kbd`, no tematizado en la prueba) |
| Flotante y superpuesto | Flotante a 12px de los bordes con radio 12px y `--g-shadow-2`; superpuesto: la expansión es `position: absolute` con `--g-shadow-3` y el contenido no se mueve |
| Consola | Sin errores del CSS |
| Movimiento | Ver «Movimiento (ronda de animaciones)» |

## Hallazgos corregidos durante la entrega

1. **El panel flotante hereda del riel** (vive dentro de la raíz para heredar `--_color` y `--_item`): las reglas del riel que ocultaban etiquetas y fijaban 44px lo alcanzaban. Acotadas a `.g-sidebar__nav`.
2. **El texto del disparador de búsqueda** seguía visible en el riel («Q B»): ahora se oculta visualmente y sigue dando el nombre.
3. **Las celdas inactivas del navbar** quedaban en 40px con 5 items en 335px: la celda mínima es `44px` (el actual cede el resto).
4. **El contador del navbar** se salía por arriba de la barra: ahora queda dentro de su celda.
5. **El alto reservado** medía 70px frente a 68px del token: margen inferior a `space × 2.5`.

## Observaciones (no bloquean; requieren atención de la auditoría)

- **El activo se distingue poco por superficie** (1.08:1). Lo sostienen el contorno de `border-strong`, el peso, el texto pleno frente al atenuado y, semánticamente, `aria-current`. Es la petición del usuario («superficie ligeramente elevada, sin indicadores estridentes»). La auditoría con otro tema lo revisará; si no basta, la salida es un contorno más fuerte (`border-control`), no un color de acento.
- **Iconos:** Grana no los trae; el CSS solo da tamaño a un `svg` (`--_ico`). El **trazo, el peso y el relleno** son del conjunto de iconos de la aplicación; en el banco se usan trazos de 1.6 tipo Lucide.
- **Etiquetas del navbar:** 14px en la píldora (`body-sm`) y de una palabra; con más de 4 items y anchos de ~335px, las etiquetas largas se recortan con elipsis.

## Notas para bruno

- **El panel flotante y los nodos de la pista van dentro de la raíz `g-sidebar`** (el panel hereda `--_color`, `--_item`, `--_sub`…). Variables dinámicas sobre el panel: `--_x` (distancia **inicial** al borde del visor: en RTL, medida desde la derecha), `--_top`, `--_bottom`, `--_max` y `--_notch` (posición de la muesca). Los nodos de la pista son del motor (#436): ningún selector sobre los hijos de la raíz los cuenta (#383, Δ0 medido).
- **`g-sidebar--mode-*` decide el formato; `g-sidebar--contained`** posiciona el navbar dentro del contenedor (`absolute`), sin él es `fixed` al visor.
- **La clase `is-current` va en el `<li>` del navbar** (no en el enlace); la etiqueta de los demás lleva `g-sidebar__label--hidden`. Para animar la píldora al navegar, cambia la clase sobre el mismo DOM (no lo reconstruyas).
- **`floating`** añade el margen (`space × 3`) al propio sidebar: la aplicación reserva `--g-sidebar-width` (o `--g-sidebar-rail`) **más dos márgenes**.
- El chevrón se dibuja con bordes en un `span` vacío; no le pongas un icono.
- Con `forced-colors`, la píldora usa `Highlight` y el resto conserva contornos; en el banco solo se **aplicaron** los bloques (no el modo real).

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; `forced-colors` y `prefers-reduced-motion` reales; RTL con datos en un idioma RTL real; Firefox y Safari (`popover`, `<dialog>`, `::backdrop`, `rotate`/`translate` individuales); el navbar y el drawer en un dispositivo táctil real y con el teclado virtual; muchos items (cientos); tema oscuro (no existe).

---

# Apariencia `index` y grupos plegables (r03; #1060 a #1065) · coco, 2026-11-08

Piel de `GSidebar.css` para el índice de documentación calcado (`appearance="index"`) y el botón de grupo plegable de las dos apariencias. Banco: `design/lab/sidebar/r03-estilo/` (el `GSidebar` real dentro del marco calcado de kiwi; `node design/lab/sidebar/r03-estilo/verificar.mjs`, puerto 4242). Valores de la ronda r03 de kiwi (`r03/indice.css`, paridad Δ 0) llevados a las clases del contrato.

## Qué le da personalidad (regla de `CLAUDE.md`)

El reposo es el calco al píxel; la identidad está en cómo se comporta, y nada de esto cambia lo que se ve quieto:

- **I2 · la marca que llega.** Una sola marca de 2 × 20 por `<nav>` que viaja de la entrada anterior a la nueva con el muelle del actual de `GSidebar` (`slow` + `--g-ease-spring`, la gramática del asiento de #617) y, si pliegas el grupo del actual, **sube al título y se vacía** (contorno de 1 px): «estás aquí dentro». En un paso de una fila rebasa 1,2 px.
- **I1 · la luz que no imita al actual.** La luz de #957 ensanchada `space × 2` por lado (el texto empieza a ras y la luz no lo corta) y el hover en `text`; el actual sigue en `accent-text` aunque el puntero pase por encima.
- **I3 · el filtro que espera en la banda.** Sin caja en reposo (lupa, «Filtrar», `/`); con el foco o con texto se vuelve campo y crece de `space × 30` a lo ancho (`slow` + `ease-out`) tapando la marca, que se funde (`fast`) y queda fuera del orden de Tab mientras está tapada (`visibility`).
- **El plegado sin saltos.** La rejilla del grupo y su relleno inferior (24 → 10) se mueven a la vez con la misma curva: el grupo siguiente sube de una vez, sin el salto de 14 px al asentar.

## Decisiones

| Pieza | Valor | Por qué |
| --- | --- | --- |
| Fila, título y botón de grupo | `max(24px, space × 8)`; 44 con `pointer: coarse` | El calco (32) con el mínimo táctil |
| Banda | `max(space × 14, 44px, --g-app-shell-header)`; línea como **borde** de un pseudo-elemento | La fórmula de `GAppShell` (#713); un borde sobrevive en `forced-colors` (un fondo no) |
| Marca | `--_ix-mark-c` (= `accent-text`; `Highlight` en `forced-colors`), borde + relleno del mismo color; hueca = sin relleno | Un solo cambio de color para la llena, la hueca y el indicador estático; el contorno no depende de sombras (que `forced-colors` quita) |
| Indicador estático (SSR) | La misma forma en `::before` del actual o del botón del grupo plegado con el actual, hasta `has-mark` | El primer HTML ya lleva la segunda señal (1.4.1) |
| Cuerpo del grupo | Rejilla `0fr → 1fr`; la lista recorta **solo en bloque** (`overflow-y: clip`) y solo plegada o moviéndose | Abierta, la luz ensanchada y los anillos de foco salen libres |
| `hidden` del cuerpo | Sin `display` de autor sobre `[hidden]` | `until-found` funciona donde existe y el `hidden` simple oculta donde no (SB-B4) |
| Con consulta y en el riel | El CSS pinta abierto el grupo aunque lleve `is-closed`, sin transición | Regla 5 de #1061 sin depender del orden de clases |
| Flecha del grupo | `span.g-sidebar__chevron` con el svg dentro (flip-rtl); el span anula el espejo de la flecha de los padres; RTL abierto −90° | Abierta apunta abajo en LTR y en RTL |
| Botón de grupo en `default` | Aspecto del título de siempre (caption, `text-subtle`), flecha de 16 al final, hover a `text-muted` | #1061 regla 9 |

## Medido (banco, tres motores, componente real de la rama `bruno/sidebar-index` 8fc75c10 + este CSS)

**1130/1130** (Chromium 408, Firefox 361, WebKit 361). Paridad con `sitio/referencia/medidas.json` en 1280, 1024, 768 y 375, claro y oscuro: columna, grupo, título, enlace y actual **Δ 0**; marca **Δ 0** (tolerancia 2); en el cajón la lista baja 32 (desviación aceptada). Tipografía y color de título, enlace, actual y fondo iguales al original. Contraste (tema por defecto, claro/oscuro): enlace 6,90/9,59, actual y marca 5,27/5,12, número 4,72/6,93 (margen 0,22 en claro), flecha 6,90/9,59, foco 5,27/5,12, hover sobre la luz 13,43/13,17; en los 11 temas, el número ≥ 4,70 y el enlace ≥ 6,87 (el actual, H1). Táctil ≥ 44 y texto editable 16 en el cajón. RTL, `forced-colors` (Chromium), movimiento reducido (sin viaje ni transición de altura). Sobrepaso del muelle: 1,2 px en una fila, ≈ 15 px en un salto de 408 px.

## Hallazgos (para sus dueños)

- **H1 (lima, CLI):** en 8 de los 11 temas de Dark Color Presence (claro), el actual en `accent-text` sobre la columna `surface-sunken` queda en **4,19 a 4,32:1** (< 4,5): el motor garantiza `accent-text` sobre `surface`, no sobre `surface-sunken` (el mismo caso de `GFileField soft`). El tema por defecto y el del sitio cumplen (5,27). Opciones: que el CLI valide `accent-text` también sobre `surface-sunken`, o una ranura `--g-sidebar-index-current`.
- **H2 (lima, rúbrica B):** el muelle rebasa el 3,8 % del recorrido: ≤ 2 px solo hasta ~52 px (una o dos filas). En saltos largos (≈ 400 px) rebasa ≈ 15 px. Opciones: aceptarlo (como la marca de `GTabs`), o que bruno coloque con `is-instant` + fundido cuando el salto pase de N filas.
- ~~**H3 (lima):** `motion.json` con `count: 2`~~ — resuelto en ca4b7742 (#1070): 3 usos, `check-motion` 0 fallos.
- **H5 (bruno):** `src/tokens/levels.test.js` no admite `--g-app-shell-header` en `GSidebar.css` (lectura permitida por #1070, tokens.md §48): falta `'GSidebar/GSidebar.css': ['--g-app-shell-header']` en su lista, como `GNavBar.css`.

**Peso (#1069, tope +1792 B gzip, CSS en `grana.css`):** la piel suma **+1534 B** gzip (zlib por defecto; +1515 con nivel 9) a `grana.css` frente a la base anterior al lote (incluye 6 B del ajuste de `--_more-*` de `GNavBar.css`).
- **H4 (lima, contrato):** el CSS usa `is-animating` e `is-instant` en `g-sidebar__group` (los de `useCollapse`, como `GAccordionItem`); no constan en la tabla de clases de `sidebar.md`. La rama de bruno ya los emite.

## Sin verificar

Lector de pantalla, Ctrl+F real (solo `beforematch`), táctil y `forced-colors` reales, padres con `children` en `index` (sangría `space × 4`, sin línea ni nodo: no hay datos en el banco), la barra de `/blocks/`.
