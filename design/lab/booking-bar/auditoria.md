# GBookingBar y GPartyField · auditoría de coco (paso 5)

**Dueño:** coco · **Fecha:** 2026-10-21 · **Sobre:** el componente real (`GBookingBar.vue`, `GPartyField.vue` y las enmiendas de `GDatePicker.vue`, bruno, 3353d75; `dist/booking.umd.js`), banco `packages/vue/playground/booking.html` · **Contrato:** `design/contracts/booking-bar.md` (#736 a #742, #744, #745, #757, #759; `datepicker.md` «Noches y salida») · **Estilo:** `estilo.md`, `GBookingBar.css`, `GPartyField.css`, `GDatePicker.css` (`--trigger`, `is-checkout-only`)

**Verificación propia:** `node design/lab/booking-bar/auditoria-verificar.mjs` (puerto 4244; común en `../hero/auditoria-comun.mjs`). **760/760 en Chromium, Firefox y WebKit** sobre el estado final. Además: `booking.spec.mjs` de bruno en verde en los tres motores (WebKit con un worker), banco de estilo 214/214 (Chromium), compuertas 99/99, vitest de `GDatePicker` en verde.

## Auditoría previa

Estructura (título, frase o barra, mensajes, acción; resumen compacto; muelle), jerarquía (la frase en `title`, los valores con peso), formularios (huecos con límite visible por forma, etiquetas, foco), estados (vacío, lleno, error, deshabilitado, pendiente; compacto; muelle oculto y visible), consistencia (la caja de `GSelect` en `GPartyField`, el `GDatePicker` real). Temas: por defecto, terracota, añil, pálida, stripe, amazon, linear y notion, claro y oscuro.

## Hallazgos

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| B-A1 | **Alta** | coco | En el calendario real, el día «solo salida» que además es el **fin elegido** de la estancia (p. ej. llegada el 23 y dos noches con la noche del 25 agotada) se pintaba con `text-muted` sobre el relleno de la selección: la cifra casi no se veía (`.is-checkout-only` y `.is-selected` tienen la misma especificidad y la mía iba después). | **Corregido** en `GDatePicker.css`: la voz baja solo con `:not(.is-selected)`; el elegido conserva `on-{color}` y el punteado. Medido ≥ 4,5:1 elegido y sin elegir, tres temas (Chromium) y por defecto (tres motores), claro y oscuro. Antes, visto en captura. |
| B-A2 | Baja | bruno | Banco `booking.html`: `?tail=0` pinta el mismo `div.tall` en las dos ramas (el parámetro no cambia nada), y `GPartyField` suelto (`?party=1`) queda pegado a la acción de la barra sin separación. | Pendiente de bruno (solo banco). La cola del muelle se verificó igualmente: el último control queda por encima del muelle al final de la página. |
| B-A3 | Baja | coco | A 320 px el hueco «2 adultos · 1 habitación» se parte en dos líneas dentro de su botón y el punto final de la plantilla queda solo en la línea siguiente. Legible, sin desplazamiento, diana intacta. | Pendiente (estética, no bloquea): estudiar que el valor del hueco refluya como texto en línea sin perder la tinta de un solo trazo. |
| B-A4 | Info | — | La frase lleva `dir="auto"`: con la plantilla en español resuelve LTR aunque la página sea RTL, y la tinta empieza a la izquierda; con una frase RTL empieza a la derecha (medido). Es lo correcto: sigue al idioma del texto. | Cumple. |

## Auditoría posterior

- **La frase, contraste** (ocho temas × claro/oscuro en Chromium; tres en Firefox y WebKit): frase, título y mensaje ≥ 4,5:1; valor del hueco ≥ 4,5:1 (mínimo 7,44:1); subrayado ≥ 3:1 (mínimo 3,44:1); error = tinta continua `danger-text` ≥ 3:1; lleno = tinta continua ≥ 3:1.
- **La tinta que se asienta:** vacío discontinuo sin tinta; lleno con la tinta en `slow`; reducido sin transición; empieza en el inicio de la línea (izquierda en LTR, derecha en RTL).
- **Diana:** ≥ 24 px con puntero fino y 44 px con grueso, siempre ≤ el interlineado (no pisa la línea de al lado).
- **Anchos** (1100, 390, 320, 320×256; LTR y RTL): sin desplazamiento horizontal; los paneles de noches, huéspedes y calendario se abren dentro del visor.
- **La barra** (stay, table, tour; LTR y RTL): en fila a 1100 con las cajas a la misma altura (`GPartyField` = `GSelect` = `GDatePicker`) y la acción alineada con ellas; compacta a 390, 320 y 320×256 (resumen ≥ 44 px, textos ≥ 4,5:1, borde ≥ 3:1); vuelve a la fila al ensanchar (histéresis).
- **El muelle** (1100 y 390, con y sin reducido): oculto = `display: none` + inerte; visible con el alto de contrato, de borde a borde y abajo; cola `:root::after` y `scroll-padding-block-end` = su alto (#757); el último control nunca queda bajo el muelle; resumen ≥ 4,5:1; reducido sin desplazamiento.
- **`GPartyField` suelto:** foco visible ≥ 3:1, alto ≥ 36 px (fino) y ≥ 44 px (grueso).
- **forced-colors** (Chromium): subrayado `CanvasText`; error en `Highlight` y más grueso (forma, no solo color).
- **Sin literales:** los tres CSS sin color literal ni respaldos; los `.vue` sin `<style>`.

## Rúbrica de movimiento

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| A · Propósito | Cumple | La tinta dice «este dato ya está»; el muelle entra al dejar atrás la consulta; los paneles salen de su hueco. | Bajo | — |
| B · Comodidad visual | Cumple | Trazos finos, `scale` horizontal, sin parpadeo. | Bajo | — |
| C · Estabilidad | Cumple | Nada de la frase se desplaza al llenarse; el muelle reserva su alto (lo enfocado no queda debajo). | Bajo | — |
| D · Transiciones | Cumple | La tinta se recoge en `fast` al vaciarse y se dibuja en `slow`; el muelle sale en `press`, más corto que la entrada. | Bajo | — |
| E · Control | Cumple | Valida al enviar, nunca al escribir; el muelle no aparece si pasa del cuarto del visor (presupuesto de bruno). | Bajo | — |
| F · Accesibilidad | Cumple | Reducido: la tinta aparece, muelle y paneles solo funden; vacío / lleno / error por forma, también en colores forzados. | Bajo | — |
| G · Rendimiento | Cumple | `scale`, `translate`, `opacity`; `display` discreto. | Bajo | — |
| H · Inmersión | N/A | — | — | — |

## Enmiendas de otros componentes en este lote

- **`GDatePicker`:** `g-datepicker--trigger` (raíz `display: contents`, panel con letra propia) medido dentro de la frase; `is-checkout-only` corregido (B-A1).
- **`GDialog`:** `bare` y `from` vivo, medidos en el visor de `GGallery` (`design/lab/gallery/auditoria.md`).
- **`GMenu`:** `lang` y `hreflang` no tocan el CSS; solo cubiertos por las pruebas de bruno (vitest). No auditado visualmente.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** todo lo de la auditoría posterior; B-C1 de mi estilo resuelto por la cola del muelle (#757) y medido en el componente real.

**Correcciones (coco, `GDatePicker.css`):** B-A1.

**Pendientes:** B-A2 (bruno, banco), B-A3 (coco, estética). **No verificado:** lector de pantalla con la frase en modo lectura; móvil real con teclado virtual sobre la hoja; zoom real del navegador (se emuló con 320×256); otros idiomas en la frase (RTL solo con la plantilla en español y una frase forzada a `rtl`); `forced-colors` en Firefox y WebKit; el contraste del botón «Cambiar» del muelle (es el `GBtn` `outline` `neutral` ya auditado, no se midió aquí).

**Veredicto:** sin defectos bloqueantes. `GBookingBar` y `GPartyField` pueden pasar a `"status": "candidate"` (cambio de bruno en los `meta.json`).
