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
