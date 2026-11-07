# Brief · GDatePicker · r02 · un mes y salto a mes y año

**Dueño:** kiwi · **Fecha:** 2026-11-07 · **Ronda anterior:** `design/lab/datepicker/r01/` (estructura base, contrato `design/contracts/datepicker.md`).

## Pedido del usuario (literal)

> «La versión que sale es de 2 calendarios, de 2 meses. Tenemos que tener un date picker de 1 mes, y además una versión más compacta, no tan grande, con poder seleccionar un año diferente o un mes diferente.»

## Lo que pasa hoy (medido en el código)

- `months` vale `auto` por defecto. Con `auto`, `fit()` pone **dos meses** si el ancho disponible (el visor en el popover, el ancla con `anchor` o el contenedor en `inline`) llega a `14 × celda + separación + relleno`: unos 648 px con el tema por defecto. En cualquier escritorio sale de dos meses, en `single` y en `range`. Un mes ya se puede pedir con `months="1"`, pero no es el defecto (#65).
- **No hay salto a otro mes ni a otro año.** Solo las flechas y RePág/AvPág (Mayús = ±12 meses). Una fecha de nacimiento a 40 años obliga a 480 pulsaciones o a 40 de Mayús+RePág, que nadie conoce (contrato, «Límites conocidos»: «sin vista de años ni de meses»).
- `density` solo cambia el **campo**; la superficie mide lo mismo en las tres densidades (celda `space × 10`, 40 px; un mes ocupa unos 330 × 370 px con pie).
- `compact` del slot `day` (precios) está reservado (#801) y no tiene que ver con esto.

## Quién lo usa y para qué

| Uso | Lo que necesita |
| --- | --- |
| Fecha de un formulario de gestión (vencimiento, alta, entrega) | Un mes, pequeño, cerca del campo; saltar un par de meses |
| Fecha de nacimiento o de expedición | **Saltar décadas** sin flechas; el día se elige al final |
| Reserva de hotel (`GBookingBar`, `GbAvailability`) | Rango que cruza meses; hoy aprovecha los dos meses |
| Informe por periodos | Rango; saltar al mes y al año de un cierre |

## Alcance de la ronda

1. **Un solo mes como forma principal**: proponer si `months` pasa a valer `1` por defecto (también en `range`) y qué pasa con quien hoy usa `auto` sin escribirlo.
2. **Variante compacta** más pequeña que la actual **con salto directo a otro mes y a otro año**. Base funcional común y **tres conceptos divergentes** (A, B, C) con los tokens reales del tema por defecto.

Fuera: escribir la fecha completa a mano en el campo (sigue abierta, contrato «Abierto»), hora, varias fechas sueltas, `compact` de precios (#801).

## Restricciones que se respetan

- APG *date picker dialog*: un tabstop por rejilla, nombre completo por día, Esc cierra lo de arriba primero.
- #63/#64: valor ISO, sin textos por defecto (todo texto nuevo va en `labels`).
- #65: la celda nunca baja de 24 px y en táctil es de 44 px; la hoja móvil sigue en ~520 px.
- #358 y #1002: el panel anclado **no cambia de tamaño** mientras se usa (lado con histéresis, `--_max` fijo); entrada `press`/`ease-out`, salida instantánea o fundido `fast` + `linear` (#1019).
- #739, #778, #952: noches, `dayDescription` y lectura del día no cambian.
- #977: el panel en su sitio sigue la densidad de la región de su disparador.
- Mínimos: texto ≥ 12 px, contraste 4,5:1 (controles 3:1), foco visible, iconos solo Lucide.

## Solapes revisados

- `GCalendar` (planificador) no tiene vista de meses ni de años: no hay nada que reutilizar ni duplicar.
- `GSelect` daría el «dos `<select>` en la cabecera»: se descarta como forma (es lo genérico), pero su apertura y su panel quedan como referencia si el usuario lo prefiriera.
- `GTimeField` («La hora dicha», `utils/timeInput.js`) ya interpreta texto libre en varios idiomas con `Intl`: el concepto C reutiliza esa idea y, si se elige, la utilidad.
- `GTabs`/`GRadioGroup` dan la semántica de la tira del concepto B (`radiogroup` con selección que sigue al foco).
- `utils/menuNav.js` (búsqueda al escribir, #797) y `keyFocus.js` (foco con flechas en WebKit): reutilizables en la rejilla de meses y años.
