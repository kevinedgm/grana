# `@grana/blocks/booking` · lote 3 · auditoría de coco (paso 5, flujo reducido #766)

**Dueño:** coco · **Fecha:** 2026-10-23 · **Sobre:** las 33 variantes reales (`packages/blocks/dist/booking.js` de bruno da30a5e, 0a70920 y a916fdf) con `packages/vue/dist` reconstruido tras las correcciones de esta auditoría, en el banco de bruno `packages/blocks/playground/booking/*.html` · **Contratos:** `design/contracts/blocks/_comun.md` Parte B (§14 a §25) y los once de sección (lima, #860 a #885) · **Regla del lote:** el bloque no lleva CSS (#763): un defecto de estilo se corrige en el CSS del componente de `@grana/vue` que lo pinta, o es un hallazgo con dueño.

**Verificación propia:** `GRANA_PW_PORT=4219 node design/lab/blocks/booking/auditoria-verificar.mjs [--engines=…] [--solo=structure,query,motion,generic,states,shapes,focus,extras]` (común en `../../hero/auditoria-comun.mjs`). Chromium, Firefox y WebKit; tema por defecto, rústico y lujo (`playground/marketing/temas/`, del CLI), claro y oscuro; 1440, 390 y 320 px y 320 con el texto al 200 %. Itinerary con `?hoy=1` (el «ahora» a la vista). Estados por `?estado=` del banco y, donde el banco no los trae (Availability vacía y llena), cambiando las props en vivo con `window.blockViews`.

## Auditoría previa (`docs/documentacion/auditoria-visual.md` §1)

- **Estructura y jerarquía:** ningún bloque pinta `h1` (§15 regla 1); cada sección es un `GSection` o una `GCard as="section"` raíz (o `GBookingBar` en Search, que ya es región con encabezado); lo de dentro un nivel por debajo con `useSectionLevel()`.
- **La consulta es el hilo** (§15 regla 3): la misma `BookingQuery` dicha con `describeQuery` en Offer list, Guest form 03, Confirmation, Offer detail, Booking summary y Availability 03; la referencia es el resumen de `GBookingBar` (Search 02).
- **Contraste y delimitación:** superficies de `GCard`, `GSurface`; leyenda de `GPriceScope`; filetes de `GSummary`; nada propio del bloque.
- **Espaciado:** solo el `gap` de `GStack`, `GSection`, `GAdaptiveLayout`, `GForm` y el ritmo de `GText` (#851, #856, #863).
- **Controles:** `GBtn` (§3), `GCard interaction`, campos de `GForm`, `GPartyField`, `GDatePicker`, `GTabs`, `GAccordion`, `GGallery`/`GGalleryViewer`, `GBookingBar`.
- **Estados:** Guest form (vacío al enviar, error del servidor, error general, `busy`), Confirmation pedida, Offer list con oferta no disponible, Menu agotado, Availability vacía y llena.
- **Consistencia:** ningún token nuevo; todo lo pintan componentes ya auditados.
- **Movimiento:** solo lo compuesto: plegado de `GAccordion` (Itinerary 02, Policies 01, Offer detail 03), `GTabs` (Menu 02, Offer detail 02), apertura de `GGalleryViewer`, el total que rueda de `GPrice` (Booking summary) y el muelle de `GBookingBar` (Search 03).

## Hallazgos

`BK-C*`: CSS de coco, corregido en esta auditoría. `BK-B*`: bruno. `BK-L*` y los de bruno `BS-L1`/`AV-L1`: lima.

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| BK-C1 | Media | coco | **`GSummary layout="stack"` partía el valor en una columna de ~115 px aunque la ficha midiera 1000** (Confirmation 01–03, Booking summary 01–02): la rejilla de datos usaba `auto-fill`, así que un solo dato (la consulta) quedaba en una pista de `space × 28` y las demás vacías. «13–15 nov · 2 noches · 2 adultos · 1 niño · 1 habitación» ocupaba 4 líneas a 1440. | **Corregido** en `GSummary.css`: `auto-fit` (las pistas vacías se pliegan). Antes: valor de 113–118 px y 80 px de alto (4 líneas) a 1440, 156–173 px y 3 líneas a 390. Después: el valor mide el ancho de la ficha (990/1024/998 px), una línea a 1440 y 1–2 a 390. `summary.spec.mjs` y `design/lab/summary/auditoria-verificar.mjs` en Chromium sin regresión. |
| BK-C2 | Media | coco (hallazgo de la parte A en `PENDIENTES.md` §6) | **`GBtn` con una palabra larga desbordaba a 320 px** (378–403 px en un contenedor de 288, también en el pie apilado de `GFormActions`). Dos causas: la etiqueta no se partía y, en el pie apilado (`flex-direction: column` con `wrap`), el ancho de la línea lo daba el contenido. | **Corregido** en `GBtn.css` (`max-inline-size: 100%` en el botón y `overflow-wrap: break-word` en la etiqueta: no cambia el ancho mínimo ni parte palabras que caben) y `GFormActions.css` (`flex-wrap: nowrap` en el pie apilado). Medido con la palabra del banco en Guest form 01, Confirmation 02, Location 02 y Booking summary 03: antes 378/378/403/370 px y desplazamiento horizontal; después 288 px, dos líneas, sin desplazamiento. Specs de `GBtn` (4), `form-distribution`, `form-section` y `summary` en Chromium: 81/81. |
| BK-C3 | Baja | coco | **Viñeta distinta en la misma lista según la variante**: lo incluido de Offer list 02 salía con `circle` (la hoja del navegador da `circle` a todo `ul` con un `ul` antepasado, y aquí el antepasado es la tarjeta `li` de `GStack as="ul"`), en 01 y 03 con `disc`. | **Corregido** en `GText.css`: `ul` lleva `disc` y solo un `ul` anidado **dentro** de la `GText` lleva `circle`. Después: `disc` en las tres. `text.spec.mjs` y `design/lab/text/auditoria-verificar.mjs` (331/331) en Chromium. |
| BK-C4 | Media | coco | **Filete suelto al principio de línea en la leyenda de `GPriceScope`**: en estrecho, «IVA incluido» bajaba a una línea propia y empezaba con su borde «\|» (Availability ×3 y Guest form 03 a 390, tema por defecto). | **Corregido** en `GPriceScope.css`: el filete es un `::before` en el hueco anterior a los impuestos y la leyenda recorta lo que sale de su caja; en una línea se ve igual (texto · 8 · filete · 8 · impuestos). Antes: impuestos a 0 px del inicio con borde `solid`. Después: sin filete visible al inicio. `price.spec.mjs` y `design/lab/price/auditoria-verificar.mjs` (237/237, actualizado para leer el filete del `::before`). |
| BK-C5 | Media | coco | **El punto final de la frase de `GBookingBar` bajaba solo a una línea** (Search 01 y 03 a 390 y 320, tres temas): el hueco de personas ocupaba el 100 % y «.» no cabía detrás. | **Corregido** en `GBookingBar.css`: el hueco mide como mucho `100% − space × 3`, lo justo para una coma o un punto en `title`. Antes: el punto 7 px por debajo del hueco (línea propia). Después: en la línea del hueco. `booking.spec.mjs` y `design/lab/booking-bar/auditoria-verificar.mjs` (344/344) en Chromium. |
| BK-B1 | **Alta (bloquea Guest form)** | bruno (contrato #880 ya escrito) | **Consentimientos sin `GFieldGroup` ni `legend`** (#880 no aplicado): las casillas van en un `GFormLayout` suelto, sin nombre de grupo (1.3.1), y el banco no trae `labels.consents` (G7 nunca avisa). **En 02 se ven en el primer paso** y el `GStepper` tiene dos pasos en vez de tres (los consentimientos deben ser el último). Medido en las tres variantes, tres temas, tres motores; 02 en la captura a 1440. | Pendiente de bruno: `GFieldGroup` con `legend` = `labels.consents`, último paso en 02 (oculto hasta entonces; depende de que `GFormLayout`/`GFormSection` respeten `hidden`, hallazgo (1) de la parte A) y `labels.consents` en el banco. |
| BK-B2 | Baja | bruno / lima | **«Quién viene» dicho dos veces en 02**: el rótulo y la descripción del paso en `GStepper` y, justo debajo, el título y la descripción del `GFormSection` del mismo grupo. | Propuesta: en 02, el `GFormSection` del paso actual sin título visible (el paso ya lo nombra) o el paso sin descripción. Lo decide lima con BK-B1. |
| BK-B3 | Baja | bruno | **Canales de Confirmation desalineados 8 px** en las tres variantes y temas: el botón sin ayuda («951 555 0000») baja respecto a los que la llevan (`GStack orientation="horizontal"` centra en vertical por defecto). | Pendiente: `vertical="start"` en la pila de canales. |
| BK-B4 | **Media (bloquea Itinerary)** | bruno | **Itinerary 03 pierde la hora de fin**: «Gran Plaza 9:00–10:30» y «Comida 13:00–14:30» en 01 y 02 salen como «9:00» y «13:00» en la tabla. La tabla es la vista breve, pero sin el fin no se sabe cuánto dura la parada. | Pendiente: la celda de hora con `time`–`time` como el eyebrow de 01. |
| BK-B5 | **Alta (bloquea Offer detail)** | bruno | **Las pestañas de Offer detail 02 no cambian**: `GTabs` sin `v-model` y sin estado propio; al pulsar «Qué incluye» la seleccionada sigue siendo «Descripción» (tres motores; con y sin movimiento reducido). Menu 02 sí lleva `v-model` y funciona. | Pendiente: `v-model` con un `ref` de la pestaña (estado de vista, §15 regla 9). |
| BS-L1 | **Media (bloquea Booking summary)** | lima (de bruno) | **Booking summary 03 «Línea» no es una línea**: el `GSummary layout="inline"` ocupa la fila entera de la `GStack horizontal` y el total, la garantía y la acción van debajo (tres motores, tres temas). Es el concepto de la variante. | Lo decide lima: componer la fila de otra forma (p. ej. `GAdaptiveLayout` con pistas) o enmendar el contrato a dos líneas. |
| AV-L1 | **Media (bloquea Availability)** | lima (de bruno) | **Availability 03 sin dos columnas a 1440**: `GAdaptiveLayout` deja el calendario (una `table`) en su fila y el resumen debajo; el contrato y su verificación piden dos columnas. El resumen queda 870 px de ancho con un botón «Elegir estas fechas» de 870 px. | Lo decide lima (pista de `GAdaptiveLayout` que respete una `table`, o enmienda). |
| BK-L7 | Media (no bloquea) | lima | **Offer list 01: la última tarjeta sola ocupa la fila entera** (1024 px frente a 244 de las demás) y su foto mide 575 px de alto (frente a 136). Es el reparto de `GAdaptiveLayout` (como MK-N1), pero aquí con una foto que domina la sección. | Propuesta: tope de `--g-adapt-chars` o `g-adapt-standard` con máximo; lo decide lima. |
| BK-L8 | Baja | lima | **El enlace de la política no se alinea con el texto de su casilla**: empieza en el borde de la casilla (208 px) y no bajo «Acepto…» (240 px). El contrato lo pone junto a la casilla y fuera del `label`. | Propuesta: un hueco de descripción en `GCheckbox` (fuera del `label`, alineado con el texto). |
| BK-L9 | Baja | lima | **Los contadores del grupo se marcan «opcional»** (Adultos, Niños, Habitaciones) en las tres variantes: siempre tienen valor, así que la marca confunde. | Propuesta: `GPartyField` dentro de `GForm` sin marca (o como requerido sin asterisco). |
| BK-L10 | Baja | lima / bruno | **Booking summary 03 hereda el tamaño de la página**: `GSummary layout="inline"` toma la tipografía de su anfitrión y aquí no hay anfitrión; en rústico sale a 16 px (el `body` del tema es 17). | Propuesta: el `GSummary` dentro de una `GText size="body"`. |
| BK-L11 | Baja | lima | **Las paradas de Itinerary 01 entran 16 px respecto al título del día** sin una caja visible que lo explique (relleno de `GCard level="flat"`); la parada con foto empieza en el borde. | Anotado para la regla de tarjetas planas en lista (como B-L6). |
| BK-L12 | Info | lima | **Policies 03: la línea que decide (`summary`) va en `text-muted` y el texto completo en `text`**: lo importante pesa menos que lo largo. Contraste ≥ 4,5:1 en los dos. | Anotado; si se quiere invertir, `description` de `GCard` en tono normal en esta variante. |
| BK-L13 | Info | lima | **Las variantes «tarjeta» a todo el ancho (Confirmation 01, Location 01, Booking summary 01) abren con una foto de 560 a 700 px de alto a 1440**, que baja el código de reserva o la dirección del primer pantallazo. Pensadas para una columna (el banco las monta a 1024). | Anotado para el README (mora-docs): montar en columna. |
| BK-L14 | Info | lima | Booking summary 03 repite la leyenda de moneda de `GPriceScope` en una variante de una línea. | Anotado (`legend: false` con la moneda dicha en otro sitio, si lima lo quiere). |
| BK-N1 | Info | — | **Insignias «Ahora»/«Siguiente» en neutro** (pregunta de bruno): **correcto**. El significado va en el texto y en `aria-current="time"`; un color de estado (éxito, aviso) diría algo que no es. Contraste ≥ 4,5:1 en los tres temas, claro y oscuro. | Sin acción. |
| BK-N2 | Info | — | Availability 01 y 03 enseñan diciembre entero inactivo (`months="auto"` con `max` a 30 de noviembre). | Conforme a contrato. |
| BK-N3 | Info | — | Contraste mínimo **4,51:1**: la insignia «Confirmada» (`GBadge` `success` suave) en oscuro (defecto y rústico). Pasa con 0,01 de margen. | Anotado para la auditoría de `GBadge` si el tema cambia. |

## Auditoría posterior, por sección

**Común a las 33 variantes (tres motores, tres temas, claro y oscuro):** contraste del texto ≥ 4,5:1 (mínimo 4,51:1, BK-N3), texto ≥ 12 px, controles ≥ 24 × 24 (contando la diana `::after` de `GBtn`) o con la separación de 2.5.8, sin desplazamiento horizontal a 1440, 390, 320 y 320 al 200 %, consola sin errores, `[Vue warn]` ni `[Grana …]`, todo el texto en la escala del tema salvo BK-L10, sin márgenes ni cursivas del navegador, foco visible en todo lo que se alcanza con Tab (Alt+Tab en WebKit), ningún `h1`, encabezados sin saltos y, anidados en una `GSection` (`?anidado=1`), el título del bloque baja a `h3`; listas reales; toda fecha y hora en `<time datetime>` ISO; ningún `p`, `dl`, `address` ni `blockquote` fuera de un componente que lo tipografía. **La consulta, con las mismas palabras** que el resumen de `GBookingBar` en las 14 variantes que la dicen, a 1440 y 390 (WebKit la formatea «13 – 15 nov», con espacios, igual en todas). RTL (Chromium, 390): sin desbordar y títulos al borde derecho. `forced-colors` (Chromium emulado): acciones y tarjetas con borde del sistema, foco con contorno.

| Sección | Estructura | Consulta y precio | Controles y estados | Movimiento | Veredicto |
| --- | --- | --- | --- | --- | --- |
| **Search** 01 · 02 · 03 | Encabezado de `GBookingBar`; nota en `GText` | Referencia de la consulta | 03: el muelle aparece al dejar atrás la consulta, ≤ ¼ del alto, resumen ≥ 4,5:1, no tapa el último botón ni su foco; punto final en su línea (BK-C5, corregido) | Muelle: con reducido entra sin desplazamiento | **`candidate`** |
| **Offer list** 01 · 02 · 03 | Rejilla y lista reales; una sola acción principal | Línea «Para …» igual; un `GPriceScope` | No disponible con su motivo ≥ 4,5:1, sin «Elegir» ni tarjeta-botón; visor: Esc cierra y el foco vuelve | Visor: 160 ms (escala y desplazamiento); reducido sin movimiento | **`candidate`** (BK-L7 anotado) |
| **Guest form** 01 · 02 · 03 | **Consentimientos sin grupo (BK-B1)** | 03: lo pedido igual a la consulta | Enviar vacío revela ≥ 5 errores, resumen a la vista y ningún `submit`; error del servidor ligado al teléfono; error general ≥ 4,5:1; `busy` ≥ 4,5:1; 03 a 390 × 844: ningún control enfocado bajo el pie pegado | Nada se mueve | **`draft`** por BK-B1 |
| **Confirmation** 01 · 02 · 03 | Código primero (`GMetric`) | La consulta en una línea (BK-C1, corregido) | Pedida: «Pendiente de confirmar» en texto ≥ 4,5:1; 03 cabe en 390 × 844 (544 px); canales desalineados (BK-B3) | Nada se mueve | **`candidate`** (BK-B3 no bloquea) |
| **Itinerary** 01 · 02 · 03 | `ol` real, `time`, «Ahora» con texto | — | Insignias neutras correctas (BK-N1); **03 sin hora de fin (BK-B4)** | 02: plegado de 240 ms, encabezado quieto, interrumpible; reducido sin movimiento; el día de hoy no se abre solo | **`draft`** por BK-B4 |
| **Location** 01 · 02 · 03 | `address` en `GText`; mapa en `media` | — | «Cómo llegar» externo con su marca; sin red de terceros (spec de bruno) | Nada se mueve | **`candidate`** |
| **Policies** 01 · 02 · 03 | Ancla estable; línea a la vista | — | — | 01: plegado de 240 ms, encabezado quieto, interrumpible; reducido sin movimiento | **`candidate`** (BK-L12 anotado) |
| **Offer detail** 01 · 02 · 03 | Galería por espacios, ficha | La consulta en la ficha | **02: las pestañas no cambian (BK-B5)** | 03: plegado de 240 ms; 02 no medible hasta BK-B5 | **`draft`** por BK-B5 |
| **Booking summary** 01 · 02 · 03 | `dl` del desglose en `GText` | La consulta en una línea (BK-C1); el total dado | Garantía en `aria-describedby` (spec de bruno); **03 no es una línea (BS-L1)** | El total rueda (cifras que cambian) sin mover el precio; reducido no rueda | **`draft`** por BS-L1 |
| **Menu** 01 · 02 · 03 | `dl` en `GText`, `dd` sin sangría | Un `GPriceScope`; filete corregido (BK-C4) | «Agotado hoy» ≥ 4,5:1 en las tres | 02: cambio de pestaña en 240 ms, la fila no se mueve; reducido sin movimiento | **`candidate`** |
| **Availability** 01 · 02 · 03 | `time` en 02 | 03: la selección igual a la consulta | Vacía y llena: 02 sin lista (V4, la aplicación pone su mensaje en `empty`), el día lleno dice «lleno», sin desbordar; **03 sin dos columnas (AV-L1)** | Nada se mueve | **`draft`** por AV-L1 |

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`) · lo compuesto

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| Propósito | Cumple | El plegado abre la respuesta bajo su encabezado; el visor crece desde su botón; el total rueda solo en las cifras que cambian; el muelle entra cuando la consulta queda atrás | Bajo | — |
| Comodidad visual | Cumple | Plegado 240 ms, pestañas 240 ms, visor 160 ms, rodar ≤ 600 ms; sin rebotes en lo compuesto | Bajo | — |
| Estabilidad | Cumple | Encabezado del acordeón Δ 0 px, fila de pestañas Δ 0 px, el precio no cambia de sitio al rodar (tres motores) | Bajo | — |
| Interrumpible | Cumple | Abrir y cerrar un acordeón en el mismo cuadro termina cerrado | Bajo | — |
| Control | Cumple | Nada se mueve solo al cargar en las 21 páginas (2.2.2); el día de hoy de Itinerary 02 no se abre solo; el muelle sigue al desplazamiento del usuario | — | — |
| Accesibilidad | Cumple | Con movimiento reducido: acordeón, pestañas, visor y muelle sin desplazamiento ni escala (solo fundidos); el total no rueda | — | — |
| Rendimiento | No verificable aquí | Sin tareas largas a la vista; no se midió con el perfilador | Bajo | Medirlo si Menu o Itinerary crecen mucho |

## Resultado de la verificación

Pasada final (2026-10-23, `dist/` de `@grana/vue` reconstruido con BK-C1 a BK-C5; `dist/booking.js` de a916fdf):

| Motor | Correctas | Fallos |
| --- | --- | --- |
| Chromium (con RTL y `forced-colors`) | 1982 / 2015 | 33 |
| Firefox | 1925 / 1958 | 33 |
| WebKit | 1925 / 1958 | 33 |

Los 99 fallos son, todos, hallazgos abiertos de la tabla, iguales en los tres motores (por motor): BK-B3 9, BK-B1 3, BK-B4 3, BK-L7 3, BK-L8 3, BK-L9 3, BS-L1 3, AV-L1 3, BK-B5 2, BK-L10 1. Ninguno de contraste, tamaño, área táctil, foco, reflujo, consola, estructura, consulta ni movimiento. (En la primera pasada de WebKit la referencia de la consulta no se leyó porque WebKit formatea el intervalo con espacios; corregido el verificador, la comprobación de la consulta da 34/34 en WebKit.)

**Regresión de las correcciones (Chromium):** specs `btn-*` y `personalidad-btn`, `summary`, `form-distribution`, `form-section` (81/81); `text`, `price`, `booking`, `blocks-booking` (271/271, incluidas las 228 de bruno); verificadores de `GSummary`, `GBookingBar` (344/344), `GPrice` (237/237), `GText` (331/331) y Marketing (1496/1496); `bash .github/scripts/gates.sh` 142/142. Vitest de `@grana/vue`: 4121/4126; los 5 fallos no son de CSS: `devWarnings.test.js` señala `GFormActions.vue:76` (cambio de bruno en curso en el árbol) y cuatro tiempos agotados con la máquina cargada (`GAdaptiveLayout`, `GCombobox`, `GFormSection`, `GSpeechHost` SSR), que pasan solos.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** en las 33 variantes, tres motores, tres temas, claro y oscuro: contraste ≥ 4,5:1, texto ≥ 12 px, 2.5.8, reflujo a 1440/390/320 y 200 %, consola limpia, foco visible, ningún `h1` y niveles por anidación, listas reales, `time` ISO, texto suelto solo en componentes, la consulta con las mismas palabras en todas, estados de Guest form, Confirmation, Offer list, Menu y Availability, 2.4.11 en Guest form 03 y en el muelle de Search 03, Confirmation 03 en una pantalla, rúbrica de movimiento (seis de siete dimensiones), RTL y `forced-colors` en Chromium.

**Correcciones (coco, `@grana/vue`):** BK-C1 `GSummary.css`, BK-C2 `GBtn.css` y `GFormActions.css`, BK-C3 `GText.css`, BK-C4 `GPriceScope.css` (y su verificador), BK-C5 `GBookingBar.css`. Medidas antes y después en la tabla de hallazgos.

**Pendientes:**
- **bruno:** BK-B1 (bloquea Guest form), BK-B4 (bloquea Itinerary), BK-B5 (bloquea Offer detail), BK-B3; con lima, BK-B2. Cambiar `status` en los `meta.json` (es suyo) según el veredicto.
- **lima:** BS-L1 (bloquea Booking summary) y AV-L1 (bloquea Availability); BK-L7 a BK-L14.
- **mora-docs:** las variantes tarjeta en columna (BK-L13) en los README.
- **No verificado:** lector de pantalla real (la consulta, el «ahora», el nombre del día con precio, el grupo de consentimientos cuando exista); `forced-colors` real y en Firefox/WebKit; teléfono real y puntero grueso (la diana de 44 px de `GBtn` no se midió); rendimiento con el perfilador; las pestañas de Offer detail 02 (BK-B5) y los consentimientos como paso de 02 (BK-B1), que no se pueden medir hasta corregirlos.

**Veredicto:** pueden pasar a **`candidate`** **Search, Offer list, Confirmation, Location, Policies y Menu** (sin defecto bloqueante; lo anotado no bloquea). Siguen en **`draft`**: **Guest form** (BK-B1), **Itinerary** (BK-B4), **Offer detail** (BK-B5), **Booking summary** (BS-L1) y **Availability** (AV-L1). Cada uno pasa en cuanto su comprobación esté en verde en el verificador, sin nueva auditoría salvo que el arreglo cambie la forma.

## Addendum · 2026-10-23 · tras el remate de bruno (8eb1e8b) y los contratos de lima (#897 a #907)

**Sobre:** `dist/` de `@grana/vue` y `@grana/blocks` reconstruidos; `auditoria-verificar.mjs` actualizado (AV-L1 cerrado: Availability 03 en una columna; BS-L1 mide los hijos de `GAdaptiveLayout`; BK-L7 y BK-L8 pasan a nota de límite; nueva medida de Booking summary 03 a 1440, 1024, 768, 390 y 320).
**Resultado:** pasada completa, tres motores, tres temas, claro y oscuro: 6000/6045; los 45 fallos eran solo la cuenta de líneas de Booking summary 03 (error del propio verificador: contaba cimas distintas y no filas; corregido). Tras corregirlo, `--solo=shapes` 396/396 en los tres motores. No se repitió la pasada completa tras esa última corrección (solo tocó la medida de Booking summary 03).

| # | Estado |
| --- | --- |
| BK-B1 | **Cerrado** (consentimientos con `legend`, en verde en los tres motores). |
| BK-B3 | Cerrado (canales alineados, en verde). |
| BK-B4 | **Cerrado** (Itinerary 03 dice su fin). |
| BK-B5 | **Cerrado** (pestañas de Offer detail 02 cambian). |
| AV-L1 | Cerrado (#899, una columna; sin solapes ni desbordes). |
| BS-L1 | Cerrado en 1440 y 1024 (una línea, #897/#906); ver Booking summary abajo. |
| BK-L7, BK-L8 | **Límites aceptados** (#904, #901); el verificador los anota, no fallan. |
| BK-L9, BK-L10 | Cerrados por bruno. |
| BK-L11 a L14 | Anotados (sin cambio; mora-docs para L13). |
| BK-C1 a BK-C5 | Siguen en verde (sin regresión). |

**Booking summary 03, medida (hijos de `> .g-adaptive-layout`, tres motores, tres temas):** 1440 y 1024: una línea. 768: dos líneas limpias (resumen y precio con su leyenda arriba, acción debajo), sin desbordar ni solapar. 390 y 320: **tres bloques apilados** (resumen, precio con leyenda, acción), también limpios, sin desbordar ni solapar; la garantía queda siempre bajo la línea. Diferencia con #906: lima esperaba «resumen en una línea; total y acción en otra» y por debajo de 768 el total y la leyenda de moneda ocupan una fila propia, así que son tres. No es un defecto de CSS ni bloquea (la leyenda de moneda se conserva, #906). Observación para lima/bruno (no bloquea): a 768 el `GSummary inline` cede el identificador («Suit…») y a 390 corta «1 hab…» con puntos suspensivos; es la cesión por prioridad de `GSummary` y deja la consulta legible en otras partes del bloque, pero si se quiere que el identificador sobreviva a 768, `layout="stack"` o más espacio para el resumen.

**Cambios de forma revisados a ojo:** garantía bajo la línea en Booking summary 03: bien (a 768 y 390, alineada al inicio, contraste ≥ 4,5:1); precio dentro de la `description` de la tarjeta-botón de Availability 02 (1440): sin solapes, bajo el nombre del día.

**Veredicto:** **`candidate`**: Guest form, Itinerary y Offer detail (BK-B1, BK-B4, BK-B5 en verde), Availability y **Booking summary** (puede pasar ya: la medida de 768 son dos líneas limpias sin desbordar; el apilado en tres bloques a ≤ 390 es limpio y no es defecto bloqueante; solo falta que lima confirme que acepta tres bloques en estrecho o lo ajuste). Con lo anterior, las 11 secciones sin defecto bloqueante.

**Cumplimientos / Correcciones / Pendientes.** Cumplimientos: contraste, tamaños, foco, reflujo, consola y estructura sin fallos en los tres motores. Correcciones: ninguna de CSS nueva (solo el verificador). Pendientes: lima, aceptar tres bloques apilados de Booking summary 03 a ≤ 390 y valorar el identificador cedido; bruno, cambiar `status` en los `meta.json`; mora-docs, BK-L13. No verificado: lector de pantalla real, teléfono real, rendimiento con perfilador, repetición de la pasada completa tras la última corrección del verificador.

## Addendum · 2026-10-28 · Availability 03 con `GSplit` (bruno 8710e80, #946 a #951) · coco

**Sobre:** `dist/` reconstruidos; AV-L1 ya no se mide como «una columna» (#899, superado por la enmienda de #950) sino con `design/lab/blocks/split-comun.mjs`: calendario · tarjeta con `GSplit 2:1 lg`, las dos columnas a 1440 cuando la caja alcanza el umbral (con el tema por defecto y lujo, 651 · 325), proporción exacta, lado estrecho ≥ `collapse`, separación de 48 px, apilado limpio a 1024, 768, 390 y 320 (cada región a todo el ancho, nada sobresale de su región), Tab del calendario a la tarjeta, 768 → 1440 y 320 → 1440 sin atascarse, texto al 200 %, RTL y consola; más la comprobación de S-L11(a) (el mes y su rejilla caben en la caja a 320 con el texto al 200 %).

**Resultado (pasada completa, tres motores, tres temas, claro y oscuro):** Chromium 2207/2210, Firefox 2150/2153, WebKit 2150/2153: **6507/6516**. Los 9 fallos son uno solo, igual en cada tema y motor y **nuevo**: **AV-C1** (abajo). Todo lo demás en verde, incluidos PO-L1/AV-L1 de la recomposición y S-L11(a) (mes y rejilla dentro de la caja a 320 al 200 %, también en lujo).

| # | Hallazgo | Estado |
| --- | --- | --- |
| AV-L1 | Cerrado dos veces (#899 una columna; ahora #950, dos columnas con `GSplit 2:1`). A 1440 va al lado con el tema por defecto y lujo (651 · 325); **con rústico (cuerpo 17 px) el lado estrecho de `md` es 340 y la pareja pide 1068 px frente a la caja de 1024: se apila a 1440 por la regla, no por un defecto** (anotado como SP-N1 en `split/auditoria.md`). | Cerrado |
| S-L11(a) | El calendario ya no sobresale a 320 con el texto al 200 % (`GDatePicker.css`, 8db1877): el mes y su rejilla caben en la caja en los tres temas. | Cerrado |
| **AV-C1** | **Con el texto al 200 %, el precio de cada día mide ~58 px (24 px de cuerpo) en una columna de 32 a 46 px y se solapa con el de los vecinos** (18 pares de 26 días; a 320 y también a 1440; con el texto al 100 % no hay ninguno). Es del slot `day` con `GPrice` y de `GDatePicker.css` («Día con contenido»), anterior a la recomposición: el verificador solo medía el desbordamiento de la caja. Una columna que crezca con el texto (7 × ~60 px) no cabe en 320; no pintar el precio cuando no cabe lo deja solo en el nombre accesible y en la tarjeta. | **Abierto:** pide decisión de lima antes de tocar el CSS |

**Veredicto:** **Availability sigue `candidate`**: la recomposición no añade ningún defecto bloqueante (dos columnas medidas, apilado limpio, sin desbordes, Tab en orden, consola limpia). AV-C1 es anterior y es de `GDatePicker` con precios en el día (afecta por igual a Availability 01 y 02), así que se sigue en ese componente y no en este bloque; si lima prefiere que lo bloquee, es la única comprobación roja del verificador.

**Cumplimientos / Correcciones / Pendientes.** Cumplimientos: contraste, tamaños, foco, reflujo, consola, estructura, estados; nada de las otras diez secciones cambió (verde en los tres motores). Correcciones: ninguna de CSS (solo el verificador). Pendientes: **lima**, AV-C1 (decisión de producto sobre el precio del día a 200 % de texto) y SP-N1; **mora-docs**, README de Availability con la receta del `GSplit`; **bruno**, nada. No verificado: lector de pantalla real, teléfono real, rendimiento con perfilador.
