# Estilo · `GPrice` y `GPriceScope` (coco, paso 3)

**Contrato:** `design/contracts/price.md` (#768 a #779) · **Ronda:** `design/lab/price/r01/` (kiwi) · **Archivos:** `packages/vue/src/components/GPrice/GPrice.css`, `packages/vue/src/components/GPriceScope/GPriceScope.css`, bloque «Día con contenido» de `packages/vue/src/components/GDatePicker/GDatePicker.css` · **Banco:** `estilo-banco.html` (marcado exacto de «Anatomía» con el CSS real de `src/` y `GDatePicker` real de `dist/`) · **Verificación:** `GRANA_PW_PORT=4209 node design/lab/price/estilo-verificar.mjs` → **230/230** en Chromium, Firefox y WebKit (2026-10-21).

## Auditoría previa (`docs/documentacion/auditoria-visual.md`)

- **Estructura y jerarquía:** el precio es contenido de frase (raíz `inline-block`, cabe en `<p>`, `<dd>`, `<td>` y en el `<button>` de un día). Por dentro, una línea por idea: total (A) → referencia (C) → precio actual. La cifra lleva el rol de título; todo lo demás va un rol por debajo y en `text-muted`.
- **Reutilización:** la capa de cifras que ruedan es la P2 de `GNumberField` (misma geometría, mismas curvas, keyframes con prefijo propio); el filete de la leyenda es el de `GSummary`; el sello sigue la medida de un control pequeño (24px); el ahorro usa el par garantizado `success-soft`/`on-success-soft`. Ningún token nuevo.
- **Contraste y delimitación:** nada depende del color (el ahorro dice «Ahorras $450»; la referencia se nombra; el tachado es una forma).
- **Espaciado:** los espacios entre partes los pone el CSS (`margin-inline-end` de `--_gap`: `space × 1` en `xs`/`sm`, `× 2` en `md`/`lg`, `× 3` en `xl`); el código va `space × 1` detrás de la cifra.
- **Estados:** importe, gratis, a consultar, aproximado, negativo, rango, referencia (`trace`/`strike`), total (A), y el día con precio.

## Qué le da personalidad

- **La referencia que no miente (C):** en lugar del tachado, una línea encima en voz baja que dice qué es («Temporada alta $2,300 →»), con el ahorro como una pastilla de texto. Se lee igual que se ve.
- **La moneda dicha una vez (B):** la leyenda de la región lleva un **sello** tipográfico (código en mayúsculas tabulares, borde fino de `border-strong` y esquina `radius-xs`, como un sello de caucho) y, separado por un filete y no por un «·», el aviso de impuestos. Dentro, los precios quedan limpios.
- **La cuenta que se mueve solo donde cambia (A):** al añadir una noche, solo ruedan los caracteres del total que cambian (la nueva sube desde abajo cuando el total crece y baja cuando decrece); el resto queda quieto. Cifras tabulares: la caja no cambia de ancho.
- **El día como cápsula:** con precio, todas las celdas del calendario pasan del círculo a una cápsula vertical (número arriba, precio debajo, `radius-lg`); el punto de hoy sube a la esquina.

## Tabla de roles (medida, tema por defecto)

| `size` | Cifra (rol · px · peso) | Secundario (rol · px) | `--_gap` |
| --- | --- | --- | --- |
| `xs` | caption · 12 · 500 (`caption-weight`) | caption · 12 | space × 1 |
| `sm` | body-sm · 14 · 600 (`title-sm-weight`) | caption · 12 | space × 1 |
| `md` | title-sm · 20 · 600 | body-sm · 14 | space × 2 |
| `lg` | title · 25 · 600 | body · 16 | space × 2 |
| `xl` | display · 39,06 · 600 (`--g-font-display`) | body · 16 | space × 3 |

- Cifras `tabular-nums lining-nums` en todos los tamaños (medido en los tres motores).
- En `xs` todo sigue el color de su sitio (`color: inherit`): el día elegido pone `on-{color}`, la franja `on-{color}-soft`. Sin esto, la cifra del día elegido quedaba a 1,06:1 (corregido durante la medida).
- `--free` usa la cifra; `--on-request` el secundario en `text-muted`.

## Mediciones (`estilo-verificar.mjs`)

| Qué | Resultado |
| --- | --- |
| Estático | Solo `--g-*`/`--_*`, sin respaldo, sin color literal, sin `@layer` ni `!important`; literales: `1px` (texto oculto), `100%`, `24px` (sello); keyframes `g-price-roll-*` (4), solo dentro de `no-preference` |
| Roles | Los de la tabla, en los tres motores; todo ≥ 12px |
| Contraste ≥ 4.5:1 | Todas las partes (cifra, lead, unidad, código, aprox., separador del rango, nombre e importe de la referencia, ahorro, rótulos e importe del total, gratis, a consultar, sello, leyenda, impuestos, precio del día) en el tema por defecto y en 11 temas generados (`dark-color-presence/generated/`), claro y oscuro, en Chromium; por defecto y 2 temas en Firefox y WebKit. Mínimos por defecto: ahorro **4,76** (claro) y **4,51** (oscuro); el resto ≥ 7,46 |
| Carta | Todos los precios contra el mismo borde final; el propio sin código, lo extranjero con el suyo |
| `strike` | El importe de referencia tachado (la decoración se pone en el importe: no entra en cajas en línea atómicas) |
| Reflujo 320px | Sin desplazamiento horizontal en base, A, B, C y el calendario; también en `ar-EG` (RTL) |
| Día con precio | Celdas iguales con y sin precio, el número en la misma posición en todas, precio 12px, área ≥ 24px (44px con puntero grueso por `--_cell`), punto de hoy dentro de la cápsula; **cuatro cifras («1,850», «2,300») caben a 320px sin tocar al vecino** (celda 38px) |
| A · ruedan | ≥ 2 posiciones intermedias; solo las ranuras de lo que cambia (2 de 6 en 3,700 → 6,000); **Δ ancho 0** durante la capa; retirada al terminar; un cambio durante la capa la retira y no apila; reducido: sin animación calculada y retirada en el acto |
| RTL | La flecha se espeja (`g-icon--flip-rtl`); el importe `ltr` aislado |
| `forced-colors` (Chromium emulado) | Ahorro, sello y filete con borde del sistema |

## Rúbrica de movimiento de A (`rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- |
| Propósito | Cumple | Señala qué parte del total cambió | Bajo | — |
| Comodidad visual | Cumple | Solo los caracteres que cambian; `--g-duration-press` + `--g-ease-out`; desplazamiento del 100 % de la cifra dentro de su recorte | Bajo | — |
| Estabilidad | Cumple | Δ ancho 0 medido en los tres motores; la ranura se alinea arriba en la línea del propio importe, la línea base no se mueve | Bajo | — |
| Interrumpible | Cumple (banco) | Un cambio durante la capa la retira sin apilar | Bajo | bruno lo reproduce en `personalidad-price.spec.mjs` |
| Control | Cumple | Solo tras un cambio del total de la aplicación | — | — |
| Accesibilidad | Cumple | Capa en `__visual` (`aria-hidden`); reducido: sin animación calculada | — | — |
| Rendimiento | No verificable (estilo) | Solo `translate` en dos cajas por carácter | Medio | bruno mide 50 `GPrice` con `total` a la vez |

## Tokens consumidos (lista exacta para lima, `tokens.md` §54)

`GPrice.css` + `GPriceScope.css`: `--g-text-{caption|body-sm|body|title-sm|title|display}-{size|line}`, `--g-text-{caption|body-sm|title-sm|title|display}-tracking` (no `body-tracking`), `--g-text-{caption|body-sm|body|title-sm|title|display}-weight`, **`--g-text-action-weight`** (ahorro y sello; no estaba en la lista provisional), `--g-font-ui`, `--g-font-display` (`xl`), `--g-color-text`, `--g-color-text-muted`, `--g-color-success-soft`, `--g-color-on-success-soft`, `--g-color-border-strong`, `--g-border-width`, `--g-radius-xs` (sello), `--g-radius-pill` (ahorro), `--g-space-1`, `--g-duration-press`, `--g-ease-out`. `defaults.css` no cambia.

`GDatePicker.css` (día con contenido): solo tokens que ya leía (`--g-text-body-sm-line`, `--g-text-caption-{size|line|weight}`, `--g-space-1`, `--g-radius-lg`) y `--_cell`.

## Para lima

1. **Cinco cifras no caben a 320px** (medido en los tres motores): «12,400» desborda su cápsula en la celda de 38px. Cuatro cifras caben. Un hotel con tarifas ≥ 10,000 (o JPY, COP, CLP) en el calendario estrecho necesita `notation: 'compact'` (reservado, #778): **hallazgo P-C1**, a decidir.
2. `--g-text-action-weight` entra en la lista de §54 (ahorro y sello).
3. El filete de impuestos, cuando la leyenda se parte a 320px, queda al inicio de la segunda línea (aceptable; no hay forma de quitarlo con CSS sin medir).

## Para bruno

1. `g-datepicker--day-content` en la raíz de `GDatePicker` con el slot `day` (el banco la pone a mano). El contenido del slot debe ser **un elemento** (va a la segunda fila); un nodo de texto suelto se uniría al número del día.
2. La flecha: `GLibIcon name="arrow-right" class="g-price__arrow g-icon--flip-rtl"` (`GLibIcon` no tiene prop `flipRtl`; la clase de `GIcon.css` hace el espejo).
3. `__total-amount` con `dir="ltr"` como `__amount` (el CSS lo aísla con `unicode-bidi: isolate`).
4. Las animaciones de la capa viven en `__roll-new`/`__roll-old` (descendientes de `__roll-slot`), como la P2: la comprobación de «animación calculada» recorre los descendientes (`computedAnimations` de `GNumberField`).
5. `<s class="g-price__compare">` en `strike` lleva dentro el `__amount--compare` (el tachado se pinta en él).

## No verificado

Lector de pantalla real, `forced-colors` real (solo emulado en Chromium), zoom 200–400 %, teléfono real; el componente real (`GPrice.vue` aún no existe: todo se midió sobre el marcado del contrato). Queda para la auditoría (paso 5) en `design/lab/price/auditoria.md`.
