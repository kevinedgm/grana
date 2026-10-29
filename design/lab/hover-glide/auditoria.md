# Una sola luz · auditoría posterior (coco)

Componentes reales: `GSidebar` y `GTable` de `dist/` (bruno 0f1fd97 sobre el CSS de coco 17608d0; `dist/` construido a las 07:31, después de los dos). Contrato: `docs/contract/api.md` «Una sola luz», `design/contracts/sidebar.md` y `table.md` «Una sola luz», DECISIONS #957 a #964 (#964: las medidas `--_highlight-*` van en la capa; `has-highlight` e `is-highlight-instant`, en el anfitrión). Estilo: `estilo.md`. Fecha: 2026-10-29.

**Motor: solo Chromium.** En `/opt/pw-browsers` solo está Chromium y la descarga de Firefox y WebKit falla en este entorno. Nada de lo que sigue está medido en Firefox ni en WebKit.

## Verificación

| Qué | Resultado (Chromium) |
| --- | --- |
| `node design/lab/hover-glide/auditoria-verificar.mjs chromium` (nuevo; `dist/` real en el playground y sus instancias `#pg-ic-sidebar` y `#sec-table`) | **115/115** |
| `node design/lab/hover-glide/estilo-verificar.mjs chromium` (banco ajustado a la capa, abajo) | **268/268** |
| `personalidad-sidebar-glide.spec.mjs` + `personalidad-table-glide.spec.mjs` (bruno) | **24/24** |
| `personalidad-menu.spec.mjs`, `personalidad-menu-links.spec.mjs`, `sidebar-activo`, `sidebar-asiento`, `sidebar-pista`, `table-load`, `table-rows`, `table-page-size` | **73/74**: falla 1 de `personalidad-menu-links` (H2, no es de este lote) |
| `glide-perf.spec.mjs --workers=1` | 5/6 la primera vez; con `--repeat-each=3`, `gt-detail` falla 1 de 3 (H1) |
| Vitest `GSidebar`, `GTable`, `GMenu`, `utils/glide.test.js` | **315/315** |

Cómo se sirvió Vue (unpkg bloqueado): el verificador usa `page.route` hacia `node_modules/vue/dist/vue.global.js`. Los specs que no lo hacen se corrieron con una configuración temporal (fuera del repo) que lleva `unpkg.com` a un servidor local con `--host-resolver-rules` y `bypass` del proxy. Puerto 4209.

### Lo que cubre `auditoria-verificar.mjs`

1. **Expandida, compact y riel**, con el submenú abierto: una sola luz sobre la caja de cada enlace habilitado, recortada por la junta (padre, hijos, actual y representante). Barrido a 1 px de cada grupo: como mucho 1 luz, 0 fondos propios y 0 apagones fuera del deshabilitado. Luz ≥ 24 px de alto en compact. Deshabilitado, título de grupo y sangría de los hijos (33 px) apagan. El asiento del actual no cambia bajo la luz. Medidas en la capa y no en el anfitrión (#964). Capa `li[role=none][aria-hidden]`. Token `--g-color-border`. El puntero no mueve el foco (sigue en un campo de texto) y el teclado no enciende la luz. Anillo de teclado y luz del puntero se ven a la vez en filas distintas. Viaja con cuadros intermedios y sin muelle.
2. **Panel flotante del riel:** se abre con el puntero y la rama queda iluminada. En el cruce del riel al panel (20 pasos) hay como mucho una luz. El panel lleva su propia luz (`g-sidebar__fly-list`) sobre cada enlace, y la del riel se apaga. Barrido sin fondos propios. Texto sobre la luz: 14,60:1.
3. **Drawer** (390 × 844, `<dialog>` modal): luz única sobre cada enlace, barrido limpio y una capa por lista. El toque (contexto táctil) no la enciende.
4. **Navbar:** la barra no tiene capa y, al barrerla cada 2 px, como mucho una pestaña tiene fondo de hover. El `<dialog>` de «Más» sí lleva capas, pero es la lista vertical del drawer, no la barra.
5. **Tabla llana, A y B:** la luz cubre la fila (llana y B) o la celda principal (A). Barridos con 0 fondos propios, ≤ 1 luz y 0 apagones. En A, otra celda de la fila y la casilla no se iluminan y la casilla no tiene fondo. La cabecera apaga. Una fila seleccionada pinta su `primary-soft` encima de la luz (`elementFromPoint` no llega a la capa). En B, desplegar mantiene la luz en su fila y la ficha la apaga. Durante la carga la luz se apaga y nada se registra; al llegar los datos no se enciende con el puntero quieto, sino con el siguiente movimiento. Un cambio de filas sin gesto la apaga. Medidas en la capa `div[aria-hidden]`. Token `surface-sunken`. El puntero no mueve el foco.
6. **`surface`, A en `surface` y `cards`:** sin capa. Hover por fila con como mucho una fila pintada en `surface-sunken` en cada muestra del barrido.
7. **Cabecera pegada y scroll horizontal** (`maxHeight` 260 px y siete columnas en 420 px):
   - Con un scroll horizontal y el puntero quieto, la luz sigue a la fila (mismo x y ancho).
   - Con un scroll vertical y el puntero quieto, pasa a la fila que queda debajo, con `is-highlight-instant` (observado con un `MutationObserver`).
   - El `th` pegado, opaco, tapa la luz de la fila que pasa por debajo.
   - El puntero sobre el `th` la apaga.
8. **RTL:** sidebar, A, llana y panel flotante del riel, cada luz sobre su caja (px físicos).
9. **Contraste del texto sobre la luz** (luz compuesta con un lienzo sobre el fondo opaco real):

   | Tema | Sidebar, etiqueta | Sidebar, icono | Tabla, título | Tabla, subtítulo |
   | --- | --- | --- | --- | --- |
   | Claro | 13,43 | 13,43 | 16,10 | 6,90 |
   | Oscuro | 13,17 | 13,17 | 17,00 | 9,59 |
   | Zona de marca (clara y oscura) | 8,59 | 8,59 | 14,35 | 9,49 |

   Los temas generados están en el banco (`estilo.md`, mínimo 5,68).
10. **`reduce`:** las dos capas solo transicionan `opacity` y la luz no pasa por posiciones intermedias. **`forced-colors` (emulado):** capas en `display: none`, el puntero no añade fondos (igual que en reposo) y el anillo de foco sigue visible.
11. **`GMenu` sin cambio** (barrido de la ronda): el puntero mueve el foco en 58 de 58 muestras, hay una luz y como mucho un fondo, sigue con `--_active-y/-h` y nunca escribe `--_highlight-*`. Además, `personalidad-menu.spec.mjs` da 15/15.
12. **Instancias del playground:** `#pg-ic-sidebar` y la tabla de `#sec-table` (selección, avatares, insignias, menú de fila) dan luz única y un barrido limpio, con la consola limpia en todas las escenas.

### Banco ajustado a la capa (#964)

`estilo-banco.html` montaba el motor de laboratorio de kiwi (`r01/hg.js`) cuando el `dist/` no traía capas, y ese motor escribe `--_highlight-*` en el anfitrión. El CSS ya leía las medidas solo en la regla de la capa, así que funcionaba con los dos motores, pero el banco no reflejaba el contrato. Ahora usa solo el motor real (`window.hgEngine` vale `'real'`, o `'missing'` si el `dist/` no trae capas) y ya no carga `hg.js`. `estilo-verificar.mjs` comprueba que el motor sea el real y que, en cada enlace medido, `--_highlight-y` esté en la capa y no en el anfitrión.

## Auditoría posterior (`auditoria-visual.md` §3)

| Aspecto | Estado | Evidencia |
| --- | --- | --- |
| Estructura y jerarquía | Cumple | La luz es una capa bajo el contenido: no cambia el orden, el paso de las filas ni el asiento (paso idéntico a 3109911, `estilo.md`) |
| Estados de interacción | Cumple | Hover (luz), foco (anillo, sin cambio), pulsado (bruno, spec), seleccionado (`primary-soft` encima), actual (asiento intacto), deshabilitado (apaga) |
| Carga, vacío y error | Cumple | Con carga la luz se apaga y no registra nada; esqueleto, vacío y cabecera nunca se iluminan (spec de bruno y apartado 5) |
| Alineación y espaciado | Cumple | La luz coincide con la caja del destino (±1 px) en todos los formatos, también en RTL |
| Contraste | Cumple | Todo el texto sobre la luz ≥ 4,5:1 (mínimo 5,68 en el banco y 6,90 aquí). La luz no informa de ningún estado (1.4.1) |
| Delimitación («nada flota») | Cumple | La luz del panel flotante queda dentro de su panel. En la tabla la tapa el `th` pegado y la recorta el contenedor desplazable |
| Consistencia con tokens | Cumple | Mismos tokens que el hover de antes (`border` y `surface-sunken`), sin tokens nuevos ni literales |
| Nunca dos fondos | Cumple | Hay una luz por anfitrión. En el cruce del riel al panel hay como mucho una, y en navbar, `surface` y `cards`, como mucho un fondo |

## Rúbrica de movimiento (`rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | Continuidad entre filas que se tocan. La estela de dos fondos desaparece: ≤ 1 luz en todos los barridos, también en el panel flotante, el drawer y en RTL | Bajo: interacción muy frecuente | Mantener `press` (160 ms) sin muelle |
| B · Comodidad visual | Cumple | Superficie plana con el token del hover de siempre; luz frente a su superficie de 1,08 a 1,67, la misma diferencia que antes. Sin profundidad ni brillo | Bajo | — |
| C · Estabilidad | Cumple | La capa va en absoluto: no hay reflujo y las filas no se mueven. Con scroll en los dos ejes la luz va con su fila; el `th` la tapa | Bajo: en un barrido rápido la luz recorre varias filas | — |
| D · Transiciones | Cumple | Transiciones CSS interrumpibles (el viaje se retoma desde donde va) que no bloquean el clic. `is-highlight-instant` dura dos cuadros y se limpia (MutationObserver) | Bajo | Sin keyframes |
| E · Control | Cumple | La luz aparece y se va con el puntero. No mueve el foco ni el desplazamiento. El toque no hace nada (drawer y specs) | Bajo | — |
| F · Accesibilidad | Cumple (emulado) | `reduce` solo funde. `forced-colors` oculta la capa y mantiene el anillo. Capas `aria-hidden`. El foco no se mueve (3.2.1, 2.4.3) y el anillo convive con la luz | Medio: sin lector real ni `forced-colors` real | Lector de pantalla y Windows de contraste alto reales: **No verificable** aquí |
| G · Rendimiento | **Parcial** | Sidebar de 60 items: p95 0,50 ms. Llana y A con 500 filas: p95 de 1,0 a 1,9 ms. **B con 500 filas: p95 de 1,1 a 3,1 ms**, por encima de 2 ms en 2 de 4 pasadas (H1). Cero tareas largas en las pasadas que pasan. En las que fallan, la prueba se detiene en el p95 y no llega a comprobar las tareas largas. Ninguna escucha por fila | Medio: compuerta de #963 intermitente en B; dispositivo modesto **No verificable** | H1 (bruno) |
| H · Inmersión | N/A | — | — | — |

**Resumen ejecutivo.** La luz cumple su propósito en todos los formatos que faltaba ver: panel flotante, drawer, riel, compact, RTL, oscuro, zona de marca, A, B, carga, selección, cabecera pegada y scroll en los dos ejes. Nunca hay dos fondos y lo iluminado es siempre lo que recibe el clic. `GMenu` no cambió. El único riesgo medido es el rendimiento intermitente de B con 500 filas en Chromium. Firefox, WebKit, el lector real y `forced-colors` real quedan sin verificar.

**Riesgos principales:**

1. Compuerta de #963 intermitente en B (H1).
2. Sin Firefox ni WebKit.
3. Sin lector ni `forced-colors` reales.
4. La sangría de los hijos (33 px) apaga la luz al bajar por el borde izquierdo de un submenú abierto. Es el hueco del contrato (la caja es la del enlace), no un defecto.

## Defectos por dueño

**coco (corregido en este commit):** solo comentarios. Las cabeceras de `GSidebar.css` (línea 13) y `GTable.css` (línea 11) y el comentario de la capa del sidebar decían que las medidas iban en el anfitrión; ahora dicen que van en la capa (#964). No cambia ninguna regla, así que no hace falta reconstruir `dist/` (los comentarios no llegan a `dist/grana.css`).

**bruno:**

- **H1 · `glide-perf.spec.mjs` «tabla de 500 filas · gt-detail» falla de forma intermitente en Chromium.**
  - Reproducción: `npx playwright test tests/glide-perf.spec.mjs -g gt-detail --workers=1 --repeat-each=3` (puerto 4209). Medido: p95 2,10 y 3,10 ms frente a un tope de 2 ms; en otras pasadas, 1,10 y 1,40 ms.
  - Con 15 cuadros por barrido, el p95 es en la práctica el máximo, así que un solo cuadro lento hace fallar la prueba.
  - B tiene el doble de nodos (cada fila lleva su `tr.g-table__detail` oculto) y la búsqueda hace `closest` sobre `glideTarget()` en cada evento.
  - Recomendación: estabilizar la medida (más cuadros, o calentar antes de medir) o reducir el trabajo en B. Si el tope no se puede cumplir con margen, vuelve a lima.
- **H2 (fuera de este lote) · `personalidad-menu-links.spec.mjs:108` «Ctrl/⌘+clic y clic central…» falla 3 de 3.** La región viva de página recibe «Panel actualizado.», el anuncio del panel de `GLoadRegion` del playground (`DASH_LABELS`, `index.html:4292`), en lugar de «Ajustes abierta en otra pestaña». Es un choque entre un anuncio del playground y la prueba, no tiene que ver con la luz (`GMenu` solo comparte `flashInstant`, y los otros 10 casos del spec y los 15 de M1 pasan). No lo comparé con la base anterior al lote. Recomendación: aislar la prueba (esperar a que el panel termine o leer el anuncio propio).

**lima:** nada nuevo. #964 ya recoge las medidas en la capa.

## Límites

- Solo Chromium. Firefox y WebKit no están instalados y la descarga falla.
- `forced-colors` y `reduce` están emulados. Sin lector de pantalla, Windows de contraste alto ni dispositivo modesto reales.
- No ejecuté `npm run build` (no cambió ninguna regla de CSS) ni `gates.sh`.
- El peso (+1 432 B en `grana.js`, aceptado por el usuario; +401 B en `grana.css`) es la medida de bruno. No lo repetí.

## Veredicto

Sin defecto bloqueante de estilo, estructura ni accesibilidad. `GSidebar` y `GTable` siguen en `candidate` (ya lo estaban; los `meta.json` no cambian con la luz, #962). La rúbrica G queda **Parcial** hasta que se cierre H1: la compuerta de rendimiento de #963 en B no debe darse por cumplida mientras falle de forma intermitente.
