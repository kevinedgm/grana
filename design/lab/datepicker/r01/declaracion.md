# Declaración de cumplimiento · GDatePicker · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.3.1, 1.4.1, 1.4.10, 1.4.11, 2.1.1, 2.4.3, 2.5.8, 4.1.2, 4.1.3; patrón *date picker dialog* de APG). El usuario decidió el alcance: **un componente con campo(s) + popover + calendario en línea**, valor **ISO `YYYY-MM-DD`**, **hoja inferior con un mes** en móvil.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (el significado se lee por forma y texto, no por color).
**Siguiente dueño:** lima → `design/contracts/datepicker.md`.

Prototipo: `index.html` (sin dependencias). Contiene: los 11 estados de día (más vista previa e inicio = fin), rango en línea con control de ancho (uno o dos meses), fecha única en línea, tres campos (rango, Desde / Hasta, fecha) con popover, barra de búsqueda, Dialog con superficie hundida y hoja móvil a 360px.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | Un solo componente: `inline` es la superficie sola; sin `inline`, campo(s) + popover. Distinto de `GCalendar` (planificador) | Decisión del usuario; no hay componentes por dispositivo |
| 2 | Valor = cadena ISO de fecha (`2026-10-28`), rango = `{ start, end }`. Sin hora ni zona | Evita el desfase de un día por zona horaria; ordenable como texto |
| 3 | Cada mes es un `role="grid"` con `<th scope="col">` (letra visible + nombre completo oculto) y celdas `gridcell` que contienen un `<button>` por día | APG date picker; WCAG 1.3.1 |
| 4 | Cada día se nombra completo: «miércoles, 28 de octubre de 2026, inicio del rango» (+ «hoy», «dentro del rango», «fin del rango», «seleccionada», «no disponible»). Verificado en el prototipo | WCAG 1.1.1, 1.4.1, 4.1.2: el rango se entiende sin ver la franja |
| 5 | Un solo *tabstop* en toda la superficie (`tabindex` móvil entre los botones de día); flechas ±1 y ±7, Inicio/Fin de semana, RePág/AvPág mes, Mayús+RePág/AvPág año; Enter/Espacio elige. Verificado: 1 tabstop; salto de mes con teclado (28 oct → 2 nov → 2 dic → Inicio = 30 nov) | APG; WCAG 2.1.1 |
| 6 | El rango es una **franja** (`td::before`) detrás de botones circulares, no una fila de botones. Extremos redondeados al saltar de fila y al terminar un mes en dos meses; inicio y fin llevan círculo relleno. Verificado: 28 oct → 3 nov cruza de mes con extremos correctos (`31 oct` cierra, `1 nov` abre y cierra por ser domingo y primer día) | Petición del usuario: superficie continua; WCAG 1.4.1: forma y texto, no solo color |
| 7 | Seleccionar no cambia el tamaño de la celda: el círculo mide lo mismo que el botón (40px, 44px con `pointer: coarse`) y la franja va detrás con su propio alto | Petición del usuario; WCAG 2.5.8 |
| 8 | Hoy = aro y punto (forma), no relleno; distinto de seleccionado (círculo lleno). Combinados: círculo lleno con aro interior | Petición del usuario; WCAG 1.4.1 |
| 9 | **Inactive** (interpretación mía, a confirmar por lima): día elegible que queda antes del inicio mientras se elige el final; texto atenuado en cursiva; al tocarlo **reinicia el inicio**. **Disabled**: no elegible, tachado, `aria-disabled="true"`, sigue en el orden de flechas (no se salta) | El brief lista ambos estados sin definir la diferencia; WCAG 1.4.1 (tachado y cursiva, no solo gris) |
| 10 | **Outside Month**: días del mes vecino atenuados pero elegibles en un mes; en **dos meses** se dejan en blanco (no duplican fechas visibles del otro mes) | Petición del usuario: no confundir con deshabilitados; evita fechas repetidas |
| 11 | Uno o dos meses **por ancho disponible**, con un único código: dos con ≥ 648px (≥ 704px táctil); si no, uno. Se mide el contenedor (en línea) o la ventana (popover). Verificado: 1100px → 2 meses; 622px de contenedor → 1 | Petición del usuario: mejor un mes bien resuelto; celdas nunca < 40px (44px táctil) |
| 12 | Navegación: anterior solo en el primer mes y siguiente solo en el último (el otro botón conserva su hueco, `visibility:hidden` y sin tabstop); título = mes en negrita + año | Petición del usuario: encabezado limpio, título centrado |
| 13 | Rango en dos toques: inicio (con vista previa al mover el puntero o el foco), fin; un tercer toque abre un rango nuevo; tocar un día anterior al inicio mientras se elige el final **cambia el inicio** | Patrón habitual de reservas; evita rangos invertidos |
| 14 | Proximidad: chips «± 1 día», «± 3 días», «± 7 días» (lista configurable) que amplían **ambos** extremos; deshabilitados sin rango completo; respetan `min` y `max`. Verificado: ± 3 sobre 28 oct – 3 nov → 25 oct – 6 nov. Nombre accesible: «Ampliar el rango 3 días por cada lado» | Petición del usuario; WCAG 2.5.3 (etiqueta visible contenida en el nombre) |
| 15 | Campo = `<button aria-haspopup="dialog" aria-expanded>` con el valor formateado; Desde / Hasta son dos botones que abren la **misma** superficie. Al abrir, el foco va al día elegido (o hoy); Esc y Listo devuelven el foco al campo; fecha única cierra al elegir; el rango cierra al completarse **si no hay proximidad** (entonces, con Listo). Verificado | APG; WCAG 2.4.3 |
| 16 | Popover: `role="dialog"` no modal (`popover="manual"`), anclado bajo el campo o la barra (invierte hacia arriba si no cabe); cierra con Esc, clic fuera y foco fuera. Verificado | APG; WCAG 2.1.2 |
| 17 | Móvil (≤ 520px): **hoja inferior** de ancho completo con asa, título, cierre (44px), un mes, objetivos de 44px, telón de fondo; deslizamiento horizontal cambia de mes (umbral 48px y más horizontal que vertical). Verificado: hoja 375px, `bottom: 0`, sin desborde horizontal, días de 44px, deslizar cambia septiembre ↔ octubre | Petición del usuario; WCAG 2.5.8 |
| 18 | Barra de búsqueda (Destino / Fecha / Personas / Buscar): el campo Fecha abre la superficie **debajo de la barra**, con el ancho de la barra como espacio disponible (dos meses) | Petición del usuario |
| 19 | Dialog: la superficie va **en línea** sobre una superficie hundida; no abre popover ni otro Dialog | Petición del usuario |
| 20 | Anuncios: una región `role="status"` (`aria-live="polite"`) dice «Inicio del rango: …», «Rango de … a …, N días», «Rango ampliado…»; el título del mes es `aria-live="polite"` al navegar | WCAG 4.1.3 |
| 21 | El resumen dice lo elegido con texto («28 oct – 3 nov 2026 · 7 días»; «Inicio: 28 oct · elige la fecha final») | Riesgo de interpretación; WCAG 1.4.1 |
| 22 | **Escribir la fecha a mano** en el campo queda fuera de la ronda | Análisis de formato por idioma; alcance a decidir con el usuario |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.1.1 / 4.1.2 Nombre, función, valor | Cumple por diseño, sin confirmar con lector real | Nombre completo por día (verificado en el DOM); `aria-selected` en la celda |
| WCAG 1.3.1 Información y relaciones | Cumple | `grid`, `th scope=col` con nombre completo oculto, título del mes ligado por `aria-labelledby`; **corregido**: el título se leía «septiembre2026» (faltaba un espacio entre mes y año) |
| WCAG 1.4.1 Uso del color | Cumple por diseño | Prototipo en grises; estados por forma: círculo lleno, aro y punto, tachado, cursiva, franja y texto |
| WCAG 1.4.10 Reajuste | Cumple | Un mes a 375px sin desborde horizontal de la página |
| WCAG 2.1.1 / 2.4.3 Teclado y foco | Cumple | Un tabstop, flechas, Inicio/Fin, paginación; foco al abrir y al cerrar |
| WCAG 2.5.8 Tamaño del objetivo | Cumple | 40px (44px táctil); chips y acciones de 32px, 44px táctil |
| WCAG 1.4.3 / 1.4.11 Contraste | Sin verificar con tema real | Grises del kit: el texto atenuado usa #757575 (4.6:1 sobre blanco); lo audita coco |
| WCAG 4.1.3 Mensajes de estado | Cumple por diseño, sin confirmar con lector real | Región `status` y título vivo |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`, viewports 1100px, 688px y 375px (móvil). Sin errores en consola.
- Rango que cruza de mes en dos meses (28 oct → 3 nov): vista previa de 7 celdas, franja de 7 celdas, extremos redondeados en 31 oct, 1 nov, 2 nov.
- Nombres por día: inicio, dentro del rango, fin. Resumen «28 oct – 3 nov 2026 · 7 días». Proximidad ± 3.
- Teclado: ArrowRight/Down, PageDown (cambia de mes y sigue visible), Home (lunes de la semana); un solo tabstop.
- Campos: rango (abre a 8px del campo, dos meses, foco en hoy, no cierra al completar por la proximidad, Esc devuelve el foco), Desde / Hasta (comparten superficie; `aria-expanded` solo en el activo), fecha (cierra al elegir), barra (abre bajo la barra o la invierte si no cabe).
- Móvil: hoja inferior, un mes, días de 44px, deslizar cambia de mes.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): cómo se anuncia la cuadrícula, el rango y el título vivo.
- **Contraste** y `forced-colors` con el tema real: lo audita coco.
- **RTL** (las propiedades son lógicas, pero el espejo de navegación y franja no se probó).
- **Dispositivo táctil real** (el deslizamiento se probó con eventos simulados) y teclado virtual.
- **Firefox y Safari** (`popover`, `:has`, `inset-inline`).
- Meses de 28 a 31 días y años bisiestos más allá de lo que muestra el mes actual; cambio de horario de verano (las fechas son ISO y se comparan como texto, pero no se recorrió octubre/marzo de una zona con cambio).
- Foco atrapado en el popover con Tab (el prototipo lo **cierra** al salir del popover en vez de atraparlo).

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Nombre y forma | Alta | `GDatePicker`; `inline` (Boolean), `mode` (`single` \| `range`), `v-model`: `String` ISO en `single`, `{ start, end }` en `range` |
| 2 | Límites | Alta | `min`, `max` (ISO) y `disabledDates` (función `(iso) => boolean`) |
| 3 | Meses | Alta | `months`: `auto` (por defecto), `1` o `2`; el umbral de `auto` sale de `--g-space-1` y del puntero, sin valores literales |
| 4 | Semana y idioma | Alta | `locale` (por defecto el del documento) y `firstDay` (0–6, por defecto el del idioma); textos de la aplicación (`labels`) para «Limpiar», «Listo», «Mes anterior», «Mes siguiente», «Ampliar», «inicio del rango», etc.: **sin textos por defecto en un idioma** o con defaults en español y sobreescribibles (decisión de lima) |
| 5 | Proximidad | Media | `proximity`: `Array<number>` (vacío por defecto = sin chips); solo en `range` |
| 6 | Campo | Alta | Sin `inline`: `label`, `placeholder`, `hint`, `error`, `disabled`, `required`, `name`; en `range`, `split` (Boolean: Desde / Hasta con dos botones) con `labelStart` y `labelEnd`; `size`; **reutilizar la anatomía y los tokens de `GInput` / `GSelect`** |
| 7 | Anclaje | Media | Prop `anchor` (elemento o selector) para que la superficie se ancle a una barra en lugar del campo; sin ella, el campo |
| 8 | Eventos | Alta | `update:modelValue` (siempre), `open`, `close`, `change` (solo al completar), `navigate` (`{ month }`) |
| 9 | Cierre | Media | `closeOnSelect` (Boolean, por defecto: fecha única y rango sin proximidad cierran al completar) |
| 10 | Estados de día | Alta | Un token de estructura por estado si hace falta color propio (`--g-datepicker-*`), o reutilizar `--g-color-accent*`, `--g-color-surface-*` y `--g-glass-*`; la superficie debe usar `--g-surface-*` como `GDialog` y `GSelect` (móvil) |
| 11 | Inactive | Media | Confirmar o corregir mi definición (decisión 9) |
| 12 | Superficie | Media | Radio amplio, sombra suave y borde sutil salen de tokens vigentes; en Dialog, superficie interior hundida (`--g-surface-*`) |
| 13 | Escribir a mano | Media | Decisión de producto pendiente con el usuario (análisis de formato) |
| 14 | `GBtn` en chips y acciones | Baja | Chips y acciones son botones propios en el prototipo; en el componente real, ¿`GBtn`? Decide lima (peso de la dependencia frente a coherencia) |
