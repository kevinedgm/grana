# Entrega de coco · GDatePicker.css

**Archivo:** `packages/vue/src/components/GDatePicker/GDatePicker.css`
**Contrato:** `design/contracts/datepicker.md` (DECISIONS.md #63 a #66).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe). No hace falta ningún valor nuevo en `defaults.css` ni ningún token nuevo.
**Banco de pruebas:** `design/lab/datepicker/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/datepicker/estilo-banco.html`). Trae un botón "Tema de prueba" y un **motor mínimo** (meses, rango, teclado, popover por variables) que imita lo que hará bruno.

## Decisiones estéticas

| Detalle | Cómo |
| --- | --- |
| **Ligero y de baja densidad** | Sin líneas de cuadrícula ni cajas por día: el día es un círculo sin fondo; el encabezado de columna es pequeño y de peso de acción, en `text-muted`; 40px por celda (`--g-space-1 × 10`) y 40px entre meses |
| **Franja de rango continua** | `td::before` detrás del botón, en el tono suave del color (`--_soft`), a 80% del alto de la celda. Salen de la celda, no la agrandan. El inicio la abre desde su centro y el fin la cierra en su centro; al saltar de fila y en los bordes de mes se redondea (`is-cap-start`, `is-cap-end`) |
| **Selección** | Círculo relleno con `--_color` y texto `--_on`; **no cambia la celda** (el círculo mide lo mismo que el botón) |
| **Hoy** | Aro de `border-width × 2` en `text-muted` y un punto de una unidad de espacio; en un día seleccionado, el aro pasa a `--_on` (círculo lleno con aro interior). No compite con la selección: no tiene relleno |
| **Salida del popover** | Fundido de `--g-duration-fast` sin desplazamiento (también el fondo de la hoja móvil); con movimiento reducido, entrada y salida solo con fundido de 120 ms |
| **Otro mes / Inactive / Disabled** | `text-subtle` (5.10:1 con el tema por defecto) más una señal que no es color: Inactive en **cursiva**, Disabled **tachado**, Outside Month solo atenuado (sigue siendo elegible, por eso no lleva marca) |
| **Hover / foco** | Hover: relleno `surface-sunken` (solo con `hover: hover`). Foco: contorno de `--g-focus-width` en `--g-color-focus` con `--g-focus-offset` (fuera del círculo, no lo recorta) |
| **Vista previa** | La misma franja al 60% de opacidad |
| **Título del mes** | Mes en peso de título pequeño, año en peso normal, mayúscula inicial (`capitalize`); botones de mes discretos (sin borde, `text-muted`); el botón que no toca conserva su hueco (`visibility: hidden`) para centrar el título |
| **Proximidad** | Chips de píldora con `border-control`; deshabilitados: borde **discontinuo** y `text-subtle` (no solo gris). Acciones: «Limpiar» como texto subrayado y «Listo» relleno con `--_color` |
| **Campo** | Mismo lenguaje que `GSelect` y `GInput` (mismas unidades, foco pegado al borde, `soft` con línea inferior, error de doble trazo con ⚠, `readonly` discontinuo, `disabled` punteado). El icono de calendario se dibuja con bordes (sobrevive a `forced-colors`) cuando el slot `icon` no da otro. `split`: dos campos que **comparten un borde** (el segundo solapa 1 borde) y solo se redondean los extremos |
| **Superficie** | Popover: `--g-color-surface`, borde `--g-color-border`, radio `--g-surface-radius` y `--g-shadow-2`. En línea: la superficie lleva borde sutil y `--g-surface-radius-inset` (concéntrico con la superficie hundida del Dialog) |
| **Hoja inferior (≤ 520px)** | Pegada abajo, ancho completo, esquinas superiores con `--g-surface-radius`, fondo `--g-surface-inset`, sombra `--g-shadow-3`, `::backdrop` con `--g-surface-backdrop`, asa dibujada con borde de `--g-color-border-strong`, cierre de 44px con la cruz dibujada por bordes, un mes sin separación lateral; sube con una animación breve (solo con `no-preference`) |

## Cómo la unidad y el puntero mandan (sin literales de tema)

- **Celda:** `max(24px, --g-space-1 × 10)` y `max(44px, …)` con `pointer: coarse`. Con `space` 5 es de 50px; con puntero grueso, 44px. Los botones de mes, chips, acciones y cierre: `--g-space-1 × 8` (32px) y 44px táctil.
- **Meses:** `min-inline-size: 7 celdas`, `max-inline-size: 8.5 celdas` por mes. Bruno usa esas mismas medidas para decidir uno o dos meses (contrato, «Uno o dos meses»).
- **Color de la selección** (`--color-*`): reasigna `--_color`, `--_on`, `--_soft` y `--_on-soft`; **el foco no cambia** (siempre `--g-color-focus`).

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()`, `1px` del texto oculto y el umbral `520px` de `@media` (excepción #42, #56 y #65); ningún `var()` con respaldo; sin `@layer` ni `<style>` |
| Medidas por defecto | Día 40×40 en celda de 40; franja de 32px de alto (80%); chips 32px; botones de mes 32px; campo `md` 36px (igual que `GSelect` md) |
| Dos meses (820px) | Superficie de 820px con dos meses de 340px; botón anterior solo en el primero y siguiente solo en el segundo (el otro `visibility: hidden`) |
| Popover (1100px) | 770px de ancho, a 13px bajo el campo (`--_top`); dos meses; radio y sombra del sistema; sin desborde horizontal; se abre hacia abajo aunque `--_max` limite (el banco lo mide antes con `--_max: none`) |
| Franja al cruzar de mes | Extremos redondeados en el último día del primer mes y el primero del segundo; el inicio y el fin sin franja hacia fuera |
| Contraste (tema por defecto) | Texto de día 17.4:1 · deshabilitado y otro mes 5.10:1 · seleccionado 16.48:1 · texto sobre la franja 14.46:1 · borde del campo 3.45:1 · **borde del chip 3.45:1** |
| Hoja móvil a 375px con el tema de prueba | Ancho 375px pegado abajo, esquinas de 28px, fondo del tema, `::backdrop` del tema, día 50px (`space` 5), botones de mes, chips, acciones y cierre de 44px, sin desborde horizontal |
| Cambio de tema (ámbar, marrón, radios, borde 2px, foco 3px, espacio 5, Georgia) | La hoja, el campo, el aro de hoy y el color del fondo cambian; los tamaños siguen la unidad de espacio |
| Errores de consola | Ninguno |

## Riesgo conocido (para el paso de auditoría)

- **La franja del rango es muy tenue con el tema por defecto:** `--g-color-brand-soft` sobre la superficie da **1.14:1** (la marca es casi negra; su tono suave es un gris muy claro). No es lo único que marca el rango (el inicio y el fin son círculos de 16:1 y el nombre accesible dice «dentro del rango»), pero las fechas intermedias se distinguen poco. Si la auditoría con otro tema lo confirma, la salida es un token de tono para la franja (propuesta de lima), no un valor de coco.
- **El hover** (`surface-sunken`) es muy sutil: no es una señal de estado, solo una ayuda.

## Notas para bruno

- Las variables de posición van **sobre el popover** (`--_x`, `--_top`, `--_bottom`, `--_max`); en la hoja móvil el CSS las ignora. **Mide el alto natural sin `--_max` antes de decidir si va arriba** (el banco lo hace con `--_max: none`). `is-up` en el popover; `is-open` en la raíz.
- **El popover va dentro de la raíz** `g-datepicker` (la caja hereda de ella `--_color`, `--_on`, `--_soft` y `--_on-soft`). Si se moviera a `body`, perdería el color de la selección.
- Las clases de la franja van en la **celda `td`** (`is-in-range`, `is-range-start`, `is-range-end`, `is-preview`, `is-cap-start`, `is-cap-end`); las de estado del día en el **botón** (`is-selected`, `is-today`, `is-outside`, `is-inactive`, `is-disabled`).
- Clases agregadas al contrato al escribir el CSS: `g-datepicker__fields` y `g-datepicker__item` (con `split`).
- Con `forced-colors`, la franja se convierte en borde superior e inferior y el círculo de selección usa `Highlight`; en el banco solo se **escribió** ese bloque (no se aplicó el modo).

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; `forced-colors` y `prefers-reduced-motion` reales (los bloques están escritos pero solo se revisó su sintaxis); RTL (franja y flechas con propiedades lógicas y `[dir="rtl"]` para el chevrón); Firefox y Safari (`popover`, `::backdrop`, `:has()` no se usa aquí, `scale`/`rotate` individuales); teclado virtual con la hoja; dispositivo táctil real; tema oscuro (no existe).

## Personalidad: rechazo al enviar (`is-rejected`; DECISIONS.md #304)

Con `GForm`, al enviar con errores el campo que bloquea niega una vez con la cabeza (sacudida horizontal decreciente de ≤ `--g-space-1`, `--g-duration-slow`, sin movimiento reducido): aquí se mueve `.g-datepicker__field` (o `.g-datepicker__fields` con `split`; nada con `inline`). Detalle, tabla de todos los campos y mediciones en `design/lab/input/estilo.md` («I2 extendido al resto de campos»).

## Rejilla de medio píxel (#682)

Regla única de #682 (`docs/contract/tokens.md` §4 y §7; precedente `GBtn`, #667): dentro de `@supports (inline-size: round(1px, 1px))`, con `--_snap: 0.5px` declarado en la raíz, la altura base pasa a `--_h: max(24px, round(calc(var(--g-space-1) * var(--_units) * var(--_density)), var(--_snap)))` (la caja del campo). El piso va **después** del redondeo (y el de 44px táctil, que lee la misma variable o se aplica detrás); lo que deriva de esa altura la sigue sin redondeo propio; anchos, radios, bordes, rellenos, interlineados y formas no se redondean. Fuera de `@supports`, la fórmula sin `round()`. Las celdas y botones del panel (`--_cell`, `--_btn`) no entran: son cuadrados del calendario, fuera del alcance de §7. Medido con `node design/lab/redondeo/verificar.mjs` (banco `design/lab/redondeo/banco.html`, tres motores, `space` 4 / 4,375 / 3,75): alto × 2 entero en todas las combinaciones con 4,375 y 3,75 (antes no), y con el tema por defecto ninguna altura cambia frente al `dist/` anterior.

## Recorrer los días (#1002)

Rejilla: una marca por día y nunca dos a la vez (`api.md` «Una sola luz», regla 9). La transición de `background-color` deja la regla base y pasa a los estados que llegan (hover y elegido): entra con fundido `fast` y sale en el acto. Medido al barrer en Chromium: como máximo 1 día con fondo por cuadro (3 con la transición en la regla base).

## r02 · Un mes, salto a mes y año, compacto (#1020 a #1029)

Contrato: `datepicker.md` §«Un mes por defecto y salto a mes y año (r02)». Banco: `estilo-banco-r02.html` (marcado estático con las clases del contrato; `?theme=`, `?dark`, `?dir=rtl`, `?prueba` con `space` 5 y `--g-press-scale` 0,94). Verificación: `GRANA_PW_PORT=4232 node design/lab/datepicker/estilo-r02-verificar.mjs` (1868/1868 en Chromium, Firefox y WebKit; los once temas generados, claro y oscuro, solo en Chromium). Es el banco, **no el componente**: la auditoría sobre el `.vue` de bruno queda para después.

### Qué le da personalidad

- **Bajar acerca, subir aleja, desde la pieza.** La vista nueva entra con fundido y un 3 % de escala (`--g-press-scale` al bajar, su inverso al subir) con origen en la celda elegida o en la que se viene; `press` + `ease-out`, sin rebote, la anterior sale en el acto. Es la amplitud de la pulsación de `GBtn`: se lee «otro nivel», no «otra página», y no marea. Un tema que pone `--g-press-scale: 1` deja solo el fundido. Reducido: fundido `fast` `linear`, sin escala (`--_zoom-amp: 0`).
- **El año se escribe en sus huecos.** Cuatro rayas dibujadas con borde (`border-control`, 3:1), sin «·» ni caracteres de relleno; la cifra escrita llega con un fundido `fast` y su raya pasa a texto pleno. De izquierda a derecha también en RTL (`direction: ltr` aislado).
- **La franja que sigue.** El extremo en el borde visible no se redondea y se desvanece hacia el borde con una máscara de alfa (`currentColor` → `transparent`; sin color literal). En `forced-colors` la máscara se quita y queda la franja con sus bordes llegando al borde, sin redondear.
- **Piezas con el peso de un día.** La rejilla de 3 × 4 llena el escenario, pero la pieza mide la altura de una celda de día y como mucho dos de ancho, centrada: con dos meses la celda pasa de 180 px y la marca sigue siendo una píldora tranquila, no una losa.

### Medidas (tema por defecto)

| Medida | default | comfortable | compact | táctil |
| --- | --- | --- | --- | --- |
| Celda (día) | 40 | 35 | 30 | 44 (también compacto) |
| Flechas y botones del título | 32 | 28 | 24 | 44 |
| Escenario (encabezado + 6 filas) | 268 | — | 208 | 292 |
| Filas de años | 62 | — | 47,3 | — |
| Panel de un mes (con borde) | 330 | — | 248 | — |

- **Δ 0** del escenario, la cabecera y la superficie entre días, meses y años en las tres densidades, en el par de meses (con `g-datepicker__months--pair`) y con el tema de prueba; la rejilla de meses llena el escenario y las cuatro filas de años miden igual; la pista queda dentro.
- **Panel:** un mes mide siete celdas (`.g-datepicker__pop .g-datepicker__month`), como dice §8: 330 px de panel por defecto, 254 px en compacto. **Dos meses conservan el ancho de antes de la r02 (#1030, decisión del usuario):** `--_pair-cells` celdas por mes (8,5: 340 px por mes, 770 px de panel, igual que antes; 7 en compacto), y en la vista de meses o de años la única columna mide `--_pair-cells × 2` celdas + la separación (Δ 0). Si el visor no da para tanto, los meses ceden hasta siete celdas, como antes. En línea sigue creciendo hasta 8,5 celdas; en la hoja llena el ancho.
- **Hoja a 320 px táctil:** relleno lateral `max(0px, min(space × 4, (100% − 7 × celda) / 2))` = 5 px; sin desborde; celda, flechas y título de 44 px. A 375 px, 16 px. La hoja lleva `overflow-x: hidden` para que el 3 % del zoom no asome una barra.
- **Contraste** (por defecto): texto de pieza 17,40 · elegido 16,48 (acento 5,69) · trazo del elegido 16,48 (acento 5,69) · aro del actual 7,46 · no disponible 5,10 · punto 17,40 · pista 7,46 · raya vacía 3,45 · cifra 17,40 · título 17,40 · chevron 7,46 · flecha en el borde 5,10. Todos ≥ 4,5 (texto) / 3 (marcas) en los once temas, claro y oscuro.
- **Zoom:** de 0,97 (0,94 con el tema de prueba) y de 1,03 (1,06) a 1, 160 ms, `cubic-bezier(0.23, 1, 0.32, 1)`; origen x en la pieza también en RTL (`calc(100% − --_zoom-x)`); reducido 120 ms `linear`, escala 1.
- **Una sola luz:** las piezas no tienen transición en reposo; el fundido solo en el hover que llega y en lo elegido.

### Nombres y notas para bruno y lima

- **`g-datepicker__months--pair`** (contratada en #1030): en `__months` cuando se ven dos meses. Con la vista de meses o de años la única columna ocupa la caja de los dos (Δ 0). Sin ella, el panel de dos meses se estrecha al cambiar de vista.
- **Punto de `is-in-value`:** se estiliza `.g-datepicker__pick > .g-icon` (el `circle` relleno que emita bruno, como el punto de hoy); coco no lo dibuja.
- **`--_zoom-x` / `--_zoom-y`:** porcentajes desde el **inicio en línea** (columna 0 = inicio); el CSS invierte la x en RTL.
- La pista y las cifras funcionan como hijos de `__view--years` en cualquier orden; si `__typed` va fuera de `__years-hint`, ocupa otra fila del escenario.
- Densidad: todo lee `--_density` de `g-datepicker--density-*`; las flechas del borde con `aria-disabled` se atenúan y pierden el hover.
- Sin `@layer` en el archivo (lo pone el registro, regla de la skill de coco y de la mayoría de componentes).

### Auditoría r02 (paso 5)

- Contraste de lo marcado elegido **y** actual (mes) o hoy (día): el trazo `{color}-text` queda por fuera y el aro on-`{color}` va dentro (dos sombras interiores). Antes el aro on-`{color}` sustituía al trazo y, con un `{color}` claro (tema `spotify`), el relleno quedaba a 1,92:1 con la superficie; ahora 4,53:1. Sin cambio visible en el tema por defecto (trazo y relleno son el mismo tono). Detalle en `auditoria-r02.md`.

