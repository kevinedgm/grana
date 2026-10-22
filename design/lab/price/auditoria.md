# GPrice, GPriceScope, GNumberField currency y día con precio · auditoría de coco (paso 5)

**Dueño:** coco · **Fecha:** 2026-10-22 · **Sobre:** el componente real (`GPrice.vue`, `GPriceScope.vue`, `GNumberField currency`, `GDatePicker dayDescription` + `g-datepicker--day-content`; bruno, f0b63e5; `dist/price.umd.js` + `dist/grana.umd.js`), banco `packages/vue/playground/price.html` · **Contrato:** `design/contracts/price.md` (#768 a #779), `number-field.md` «Moneda», `datepicker.md` «Precio y otros datos del día» · **Estilo:** `estilo.md`, `GPrice.css`, `GPriceScope.css`, bloque «Día con contenido» de `GDatePicker.css` (3fab3f3)

**Verificación propia:** `GRANA_PW_PORT=4209 node design/lab/price/auditoria-verificar.mjs` (común en `../hero/auditoria-comun.mjs`; Vue de `node_modules`, tema inyectado antes de montar). Estado final: **496/497 en Chromium, Firefox y WebKit**; el único fallo es la tarea larga de rendimiento de A en Chromium (53 ms en la pasada final; P-A4, de bruno). Todo lo de estilo pasa en los tres motores. Además: `tests/price.spec.mjs` y `tests/personalidad-price.spec.mjs` de bruno en Chromium con un worker y `--repeat-each=3`: 74/75 (el que falla es el de rendimiento, P-A4).

## Auditoría previa

- **Estructura y jerarquía:** el precio es contenido de frase (raíz `inline-block`); por dentro, una línea por idea: total (A) → referencia (C) → precio actual. La cifra lleva el rol de título del tamaño y todo lo demás un rol por debajo en `text-muted`.
- **Contraste y delimitación:** nada depende del color (el ahorro es texto, la referencia se nombra, el tachado es forma, el sello lleva borde).
- **Controles y formularios:** el campo es el `GNumberField` existente; la moneda elegible es la receta `GSelect` + `GNumberField` en una `GFormRow`.
- **Estados:** importe, gratis (con y sin referencia), a consultar, aproximado, negativo, rango, `trace`, `strike`, total (A), día con precio. **Carga:** la del molde de `GLoadRegion` (la cifra es texto; no se audita aquí). **Error, deshabilitado, solo lectura:** no aplican a `GPrice` (no es control); los del campo son los de `GNumberField`, ya auditados.
- **Consistencia:** capa de cifras = P2 de `GNumberField`; filete = separador de `GSummary`; ahorro = par garantizado `success-soft`; ningún token nuevo.
- **Temas:** por defecto, tres del CLI de coco (terracota, añil, pálida) y cinco generados (stripe, linear, notion, amazon, caracol-púrpura), claro y oscuro, en Chromium; por defecto, terracota y stripe, claro y oscuro, en Firefox y WebKit.

## Hallazgos

| # | Gravedad | Dueño | Hallazgo | Estado |
| --- | --- | --- | --- | --- |
| P-A1 | Media | coco | **RTL: el importe quedaba pegado a su vecino.** Las partes se separan con `margin-inline-end`, pero `__amount` y `__total-amount` llevan `dir="ltr"`, así que su margen lógico se resolvía a la derecha física; en una línea RTL el vecino está a su izquierda. Medido: hueco **0 px** entre el importe de la referencia y la flecha en `ar-EG`, y entre importe, «a» y unidad con la página en `rtl`, en Chromium (en el banco de estilo no salió porque la comprobación de pares comparaba los `top` y la flecha SVG tiene otro). | **Corregido** en `GPrice.css`: con `:dir(rtl)` en la línea, el hijo `[dir="ltr"]` pone la separación en el lado físico izquierdo (también el último de la línea en `strike`). Medido antes (falla, hueco 0) y después (≥ `--_gap`) en los tres motores, `ar-EG` y página `rtl`. |
| P-A2 | Baja | bruno | Banco `price.html`: `TODAY = new Date().toISOString().slice(0, 10)` es la fecha **UTC**. Por la tarde en UTC−6 el día de hoy sale como pasado: deshabilitado, tachado y sin precio (se ve en todas las capturas del 21 de octubre). | Pendiente de bruno (solo banco): fecha local (`toLocaleDateString('sv')` o los componentes de `Date`). No afecta a la medida: el día de hoy no entra en las comprobaciones de celda. |
| P-A3 | Info (límite) | lima | **P-C1 reconfirmado sobre el componente real:** a 320 px la celda del día mide 38 px y un precio de cinco cifras («12,400») desborda **10 de 10** celdas en los tres motores. Cuatro cifras caben (medido con el banco real). | Límite documentado; decide lima con `notation: 'compact'` (reservado, #778). No bloquea: el contrato lo prevé. |
| P-A4 | **Alta (bloquea A)** | bruno | **Rendimiento de A por encima del umbral del contrato.** Con 50 `GPrice` con `total` y un cambio de noches, Chromium registra una tarea larga de **51 a 83 ms** (umbral 50 ms con un worker): el spec de bruno `personalidad-price.spec.mjs › rendimiento` falla **4 de 6** repeticiones (54; 56, 51; 79, 83; 67 ms) y mi verificación falló en 4 de 6 pasadas (52, 51 y 52, 64, 53 ms). Desglose medido: el script síncrono del cambio (actualización de Vue de los 50 precios) cuesta **48 a 82 ms**; estilo, maquetación y pintura del cuadro siguiente, **0 a 8 ms**; con movimiento reducido el coste es el mismo. **No es el CSS** (sin animación tarda igual). Máquina con carga media 5 durante la medida. | Pendiente de bruno: repetir con la máquina descargada y, si sigue por encima, aligerar el render (p. ej. no recalcular `formatPrice` del precio de contexto ni la frase completa si solo cambia `total`, o compartir el resultado por instancia). Hasta entonces la fila «Rendimiento» de la rúbrica queda **No cumple**. |
| P-A5 | Info | — | En el banco, la fila árabe usa los `labels` españoles («Ahorras») y la página `?dir=rtl` deja el texto español en una línea RTL (el «/» de «/ noche» se reordena como neutro, que es lo correcto para bidi). | Sin acción: son textos de la aplicación; la medida RTL se apoya en la fila `ar-EG`. |

## Auditoría posterior

- **Contraste** (§«Temas»; C, A y B con la vista en USD, y el calendario con un tramo elegido): todas las partes ≥ 4,5:1 en todos los temas y motores: cifra, lead, unidad, código, aprox., separador del rango, nombre e importe de la referencia, ahorro, rótulos e importe del total, gratis, a consultar, sello, leyenda, impuestos, afijos del campo, y el precio del día suelto, del **día elegido** (`on-{color}`) y de la **franja** (`on-{color}-soft`). Mínimo: **ahorro 4,51:1** (por defecto, oscuro), igual en los tres motores.
- **Tamaños** (en el componente real: `xs` día, `sm` carta, `md` tarjeta, `lg` total del carrito, `xl` plan): cifra caption / body-sm / title-sm / title / display y secundario caption / caption / body-sm / body / body; todo ≥ 12 px; cifras `tabular-nums lining-nums`; el importe en una sola línea.
- **Árbol:** `__visual` `aria-hidden`, la frase en texto oculto de 1 px con el nombre de la moneda; `ariaSnapshot` de la tarjeta sin «$» ni «MXN».
- **Carta alineada:** todos los precios contra el mismo borde final, sin código (la región dice MXN). **Carrito:** mismo borde final; el código solo en lo extranjero («USD 190.00»), menos tipográfico «−$200.00», `cents="always"`.
- **C · `trace`:** la referencia encima del precio actual, el ahorro en texto sobre su pastilla. **`strike`:** `<s>` detrás del precio, en su misma línea, tachado y sin ahorro.
- **B · `GPriceScope`:** leyenda primer hijo, sin «·», filete sólido, sello ≥ 24 px y `aria-hidden`; con la vista en MXN, lo propio sin código y el tour en USD con el suyo; al cambiar a USD, sello, leyenda y todos los precios cambian a la vez con «aprox.».
- **A · `total`, marcado real de bruno:** `__total-amount` pinta `__minus`/`__symbol`/`__number`/`__code` sin `__amount` dentro y el CSS lo cubre (cifra con el rol de título, código secundario en `text-muted`, `ltr` aislado); la tarifa baja al rol secundario.
- **RTL** (`ar-EG` y página `rtl`): flecha espejada, importe `ltr`, cifras arábigo-índicas sin marcas bidi, cada parte separada de su vecina (P-A1), sin desplazamiento horizontal.
- **320 px** (base, A, B, C y página `rtl`): sin desplazamiento horizontal, ningún importe partido, todos los precios dentro del visor.
- **Campo `currency`:** `es-MX` «$ MXN» delante y «1,850.00»; `en-US` «MX$» sin código; `de-DE` «€» detrás y «1.850,00»; JPY con su afijo; la lectura con el nombre de la moneda («pesos mexicanos», «yenes japoneses») por `aria-describedby`; afijos `aria-hidden`, ≥ 12 px y ≥ 4,5:1; cambiar a JPY redondea modelo y texto (2500,5 → 2501, defecto 1 de P-L7) con `inputmode="numeric"`.
- **Día con precio** (1100 y 320 px): `g-datepicker--day-content`, todas las celdas iguales y el número a la misma altura con y sin precio, precio de 12 px dentro de su celda, área ≥ 24 px, `dayDescription` en el nombre del día («…, 1,850 pesos mexicanos»).
- **forced-colors** (Chromium emulado): ahorro, sello y filete con borde del sistema; la flecha en `CanvasText`.
- **Sin literales:** los tres CSS sin color literal ni respaldo, sin `@layer` ni `!important`; los `.vue` sin `<style>`; `GPrice.css` + `GPriceScope.css` solo leen los tokens de `tokens.md` §54.
- **Consola limpia** en todas las páginas (sin errores ni avisos de Vue o de Grana).

## Rúbrica de movimiento de A (`docs/documentacion/rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| Propósito | Cumple | Al cambiar las noches solo ruedan los caracteres del total que cambian (medido: menos ranuras que caracteres) | Bajo | — |
| Comodidad visual | Cumple | `--g-duration-press` + `--g-ease-out`, desplazamiento vertical del 100 % de la cifra dentro de su recorte; sin muelle ni rebote | Bajo | — |
| Estabilidad | Cumple | Δ ancho 0 durante la capa en los tres motores (cifras tabulares); la línea base no se mueve; ≥ 2 posiciones intermedias | Bajo | — |
| Interrumpible | Cumple | Dos cambios seguidos durante la capa: ninguna ranura anidada, una sola capa como mucho (regla de P2) | Bajo | — |
| Control | Cumple | Solo cambia cuando la aplicación cambia el total tras un gesto de la persona; la capa se retira sola al terminar | — | — |
| Accesibilidad | Cumple | Capa dentro de `__visual` (`aria-hidden`); la frase tiene el total nuevo desde el primer cuadro; con `reduce`, sin animación calculada y el total nuevo en su sitio en el acto (tres motores) | — | — |
| Rendimiento | **No cumple** | 50 totales a la vez: tarea larga de 51 a 83 ms en Chromium (umbral 50 ms); el coste es el script del render, no el CSS (igual con `reduce`; pintura ≤ 8 ms) | Medio | P-A4 (bruno) |

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** todo lo de la auditoría posterior, en los tres motores, con el tema por defecto, tres temas del CLI y cinco generados, claro y oscuro; seis de las siete dimensiones de la rúbrica de A.

**Correcciones (coco, `GPrice.css`):** P-A1 (separación del importe `ltr` en líneas RTL).

**Pendientes:** **P-A4 (bruno, bloquea `candidate`)**: rendimiento de A con 50 precios; P-A2 (bruno, banco); P-A3 (lima, límite de cinco cifras en el día a 320 px, `compact` reservado). **No verificado:** lector de pantalla real (pronunciación de «1,850 pesos mexicanos», el «-» de los negativos, la frase dentro de una tarjeta enlace); `forced-colors` real y en Firefox y WebKit (solo emulado en Chromium); zoom 200–400 % (se midió el reflujo a 320 px); teléfono real; puntero grueso en el día con precio (el área de 44 px es la de `GDatePicker`, ya auditada, no se remidió aquí); la carga con `GLoadRegion`.

**Veredicto:** sin defectos bloqueantes de estilo. `GPriceScope` no tiene ningún pendiente propio. **`GPrice` no pasa aún a `candidate`**: falta que bruno cierre P-A4 (o lo mida en verde con la máquina descargada y lo documente). Cuando el spec de rendimiento pase de forma estable, bruno puede poner `"status": "candidate"` en `GPrice.meta.json` y `GPriceScope.meta.json` sin nueva auditoría de coco.

## Addendum · 2026-10-22 (tras 6f9d3c6 y #812)

**Verificación:** `dist/` reconstruido (`npm run build`, posterior a 6f9d3c6) y `GRANA_PW_PORT=4209 node design/lab/price/auditoria-verificar.mjs` en Chromium, Firefox y WebKit: **497/497** en dos pasadas seguidas (carga de la máquina 5,5). Los 50 totales cambiando ×3 en Chromium: tareas largas, ninguna (antes 51 a 83 ms). Contraste mínimo 4,51:1; el límite de 320 px con cinco cifras sigue siendo el de P-A3.

**Estado de P-A1 a P-A5:**
- P-A1 (separación del importe `ltr` en RTL): cerrado (coco, `GPrice.css`).
- P-A2 (fecha local en el banco): cerrado por bruno en 6f9d3c6.
- P-A3 (cinco cifras en el día a 320 px): límite documentado por lima (#801), `compact` reservado; el verificador lo sigue anotando como límite, no como fallo.
- P-A4 (rendimiento con 50 precios): cerrado por bruno en 6f9d3c6 (un `requestAnimationFrame` por cuadro, tramos contiguos en una ranura); medido sin tareas largas.
- P-A5: sin defecto pendiente de estilo.

**Fallo intermitente de mora-docs en Firefox (495/497):** las dos comprobaciones fallidas («≥ 2 posiciones intermedias» con 0 y «solo ruedan los caracteres que cambian» con 0 de 9) miden ambas 0, es decir, la capa de ranuras no existía en el instante de muestreo: la muestra cayó después de que la animación terminara o antes de que el cuadro agrupado la creara. Es una carrera de temporización del verificador con la máquina saturada, no un defecto del CSS ni de la animación (con la máquina descargada pasa 497/497 de forma repetida). La regla «ranuras < caracteres» sigue valiendo con las ranuras por tramo (se exige 0 < ranuras < caracteres; un tramo contiguo cuenta como una ranura, así que el margen solo crece). Pendiente de bruno/coco, no bloqueante: si vuelve a aparecer, muestrear con reintento hasta ver la capa en lugar de a un instante fijo (verificador propio de coco).

**Cumplimientos / Correcciones / Pendientes:** Cumplimientos: 497/497 en los tres motores, rúbrica de movimiento de A completa (Rendimiento ahora cumple). Correcciones: comentario de `GPrice.css` actualizado a «cada tramo contiguo de caracteres que cambian». Pendientes: los de «No verificado» del cuerpo (lector de pantalla real, `forced-colors` real, zoom, teléfono).
