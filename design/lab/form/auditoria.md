# Auditoría de coco · Sistema de formularios, Fase 1 (paso 5) · **interrumpida**

**Componentes:** `GForm`, `GFormSection`, `GFormGrid`, `GFieldGroup`, `GFormActions`, `GErrorSummary` y los seis campos (`GInput`, `GTextarea`, `GSelect`, `GCheckbox`/`GCheckboxGroup`, `GSwitch`, `GDatePicker`), reales (`dist/` reconstruido; commits b4db77c…4a778c7 de bruno; contrato `design/contracts/form.md` con #169 y #170 de lima).
**Método:** página de medición propia con el build real (todos los estados de los seis campos: reposo, ayuda, «(opcional)», error, advertencia, válido, solo lectura y deshabilitado por `GForm`; `marks="required"`; resumen fuera de `GForm`; pie con estado; tramos a 926/566/326px en las tres densidades; cuatro `g-form-row`; pie fijo con 28 controles; formulario en `GDialog` y en drawer `placement="end"`), más el playground real (`#sec-form`). Contraste **calculado** sobre el fondo compuesto (colores computados resueltos por canvas, alfa compuesto sobre los ancestros). Temas: **defecto**, **Spotify** (marca pálida) y **lustre**, claro y oscuro (generados por el CLI). Chromium, Firefox y WebKit para comportamiento.

## Resultado: **no aprobado**. La composición visual se rediseña (decisión del usuario); `status` sigue en `draft`

La auditoría se detuvo a petición del usuario, que rechazó la distribución visual de la Fase 1. Lo medido hasta ese punto queda abajo como referencia para la siguiente ronda; lo que depende de la distribución (anchos, filas, alineación) tendrá que medirse de nuevo.

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Bloqueante** (usuario) | kiwi → lima → coco | **Filas con huecos y borde derecho dentado**: los anchos por contenido (`g-form-w-*`) y los máximos de lo compacto (`--g-form-max-xs`/`-sm`) dejan filas de largo distinto y huecos a la derecha. Se rediseña la distribución (nueva ronda de kiwi) |
| 2 | **Bloqueante** (usuario) | kiwi → lima → coco | **Campos desalineados verticalmente**: la `<legend>` de `GFieldGroup` / `GCheckboxGroup` y las etiquetas de parte empujan sus cajas hacia abajo respecto de los campos sueltos de la misma fila (la rejilla general alinea arriba y no tiene *subgrid*, form.md §4). Se rediseña |
| 3 | **Bloqueante** (usuario) | coco (con la nueva distribución) | **Fondo negro en «Edad»** (campo de solo lectura con sufijo del formulario mediano del playground). Pendiente de reproducir con el tema y modo en que lo vio el usuario; en las medidas de abajo (claro y oscuro de tres temas) el solo lectura resuelve a `--g-color-surface-sunken` |
| 4 | Mayor, **corregido** | coco (`GErrorSummary.css`) | Con puntero grueso los enlaces del resumen medían 24px (40px solo si el texto ocupaba dos líneas): ahora `min-block-size: 44px` bajo `pointer: coarse` (medido: 44) |
| 5 | Menor, **corregido** | coco (CSS de los seis campos) | Quitado el alias de transición `__error`/`__error-icon` (bruno ya pinta solo `__message`): GInput, GTextarea, GSelect, GCheckbox, GCheckboxGroup, GSwitch, GDatePicker. Capturas del playground antes/después del cambio **idénticas píxel a píxel** (seis secciones de campo y `#sec-form` con y sin errores, claro y oscuro) |
| 6 | Informativo | lima | Pie fijo **apilado**: 177px a 320px (42 % de un contenedor de 420px), igual en los tres motores, y sin tapar el foco. Pendiente de valorar con la nueva distribución |
| 7 | Informativo | — | Casilla marcada con estado válido y marca pálida: el relleno de la marca queda a 1.77–1.92:1 (Spotify, lustre claros); es el estado marcado de `GCheckbox`, previo al sistema de formularios (mismo caso que el hallazgo 7 de `GCard`) |

## Medido antes de la interrupción

### Contraste (Chromium; defecto · Spotify · lustre, claro / oscuro)

| Medida | Defecto | Spotify | Lustre |
| --- | --- | --- | --- |
| Etiquetas, «(opcional)», ayuda, descripción de sección, frase de obligatorios, estado del pie, prefijo/sufijo | 7.46 / 8.59 | 7.38 / 8.62 | 7.41 / 8.61 |
| Asterisco | 5.49 / 4.52 | ídem | ídem |
| Mensaje e icono de error · borde de error | 5.49 / 4.52 | ídem | ídem |
| Mensaje e icono de advertencia · borde (discontinuo; 2px en cajas, 1px en casilla e interruptor) | 5.73 / 4.54 | ídem | ídem |
| Mensaje e icono de válido · borde | 5.35 / 4.61 | 5.35 / 4.61 | 5.35 / 4.60 |
| Solo lectura: valor / sufijo sobre `sunken` | 16.10 / 15.22 · 6.90 / 9.59 | 16.19 / 15.31 · 6.87 / 9.62 | 16.12 / 15.23 · 6.87 / 9.61 |
| Solo lectura: borde discontinuo fuera / dentro | 3.45 / 4.32 · 3.19 / 4.82 | 3.43 / 4.35 · 3.19 / 4.86 | 3.44 / 4.33 · 3.19 / 4.83 |
| Deshabilitado (exento): texto mínimo; bordes `solid`/`dotted` frente al `dashed` de solo lectura | 4.72 / 6.21 | 4.70 / 6.23 | 4.70 / 6.22 |
| Resumen: título y error general / enlace / borde e icono | 17.40 / 15.22 · 5.49 / 4.52 · 5.49 / 4.52 | ídem | ídem |
| Insignia «Opcional» | 6.54 / 4.56 | 4.64 / 4.58 | 4.65 / 4.59 |
| Borde de reposo de las cajas | 3.45 / 4.32 | 3.43 / 4.35 | 3.44 / 4.33 |
| Anillo de foco (2px) en campos de todos los estados, casilla, interruptor, resumen y sus enlaces | ≥ 4.81 / ≥ 4.01 | ≥ 3.91 / ≥ 11.08 | ≥ 5.42 / ≥ 4.06 |

### Comportamiento (Chromium, Firefox, WebKit salvo indicación)

- **Tramos:** 894 → `wide`, 534 → `medium`, 294 → `narrow`; `stack` emite `narrow`. Densidad: caja 36 / 31.5 / 27px, fila 20 / 17.5 / 15px. Compactos en una columna: `xs` 120px, `sm` 192px.
- **`g-form-row` con subgrid:** cajas a la misma altura en las cuatro filas (etiqueta de dos líneas, error en una sola, tres hijos con fecha + campo + textarea, casilla + interruptor), a 1280 y 352px.
- **Pie fijo:** Tab por 28 controles (25 en WebKit, que no enfoca botones con Tab por defecto) sin ninguno tapado; margen mínimo 12px (Chromium) / 15px; `--g-form-actions-size` = 61px (177px apilado) y `g-form--sticky-actions` presentes.
- **Táctil** (`pointer: coarse`, compacto): 44px en input, select, fecha, filas de casilla e interruptor y enlaces del resumen (tras el hallazgo 4); botones del pie 36px con `::after` de 44px (`GBtn`).
- **320px:** sin desborde dentro de ningún formulario; diálogo a 320 `narrow`, pie apilado 80px, sin desborde.
- **RTL:** primaria a la izquierda, partes de `GFieldGroup` espejadas, prefijo a la derecha, icono del mensaje al inicio, marca gruesa del resumen en el lado inicial.
- **Diálogo y drawer:** el envío desde el pie (`form="id"`) lleva el foco al resumen (4 elementos); su primer enlace enfoca el campo; drawer `stack` en `narrow` con `xs` a 120px.
- **Consola:** limpia en los tres motores en la página de medición.

## Sin ejecutar (por la interrupción)

`forced-colors` y `prefers-contrast: more` emulados, movimiento reducido, playground completo a 320px en los tres motores, revisión de literales y `<style>` en los `.vue`, zoom 200 %, lector de pantalla. Se harán en la auditoría de la nueva distribución.
