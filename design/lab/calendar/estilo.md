# Entrega de coco · GCalendar.css

**Archivo:** `packages/vue/src/components/GCalendar/GCalendar.css` (más `styles/defaults.css`: valores por defecto de los tres tokens `--g-calendar-*`)
**Contrato:** `design/contracts/calendar.md` (DECISIONS.md #38 a #41).
**Estado:** listo para bruno (registro pendiente en `components.css`; el `.vue` aún no existe), con **un contrato de variables dinámicas y de marcado** que bruno debe emitir (ver abajo).
**Banco de pruebas:** `design/lab/calendar/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (se sirve desde la raíz del repo; carga los CSS con parámetro anti-caché).

## Contrato de variables dinámicas (lo que bruno debe emitir)

Las posiciones **no** llegan en píxeles: llegan como **minutos sin unidad** en variables CSS locales, y el CSS las convierte con la escala de la densidad (así la escala sigue a `--g-space-1` y al tema sin que el `.vue` conozca ningún píxel). Es la única excepción a "sin estilos en línea" (`api.md`: variables CSS dinámicas justificadas).

| Variable | En qué elemento | Significado |
| --- | --- | --- |
| `--_grid` | `.g-calendar` (raíz) | `gridInterval`, en minutos |
| `--_cols` | `.g-calendar__grid` | Número de columnas de recurso o de día |
| `--_minutes` | `.g-calendar__grid` y `.g-calendar__timeline` (lo heredan eje, filas y pistas) | Minutos visibles (rango × 60) |
| `--_start` | `li` de eventos y bloqueos, franjas de disponibilidad, etiquetas del eje, línea de ahora | Minutos desde el inicio visible |
| `--_dur` | `li` de eventos y bloqueos, franjas de disponibilidad | Duración en minutos |
| `--_lane`, `--_lanes` | `li` de eventos | Índice de carril y total de carriles de su grupo de conflicto |
| `--_lanes` | `.g-calendar__track` (Timeline) | Carriles de la fila (su alto crece con ellos) |

## Marcado que el CSS espera y el contrato no listaba

Coco lo necesitó al escribir el estilo; queda como hallazgo para lima (abajo).

- **Hoy sin texto propio:** la cabecera del día actual y la celda de hoy llevan `aria-current="date"` (y clase `is-today`); el CSS los marca con un relleno, sin escribir "hoy" (no depende del idioma).
- **Color del evento:** `data-color="brand|accent|neutral|success|warning|danger|info"`, además de `data-type` y `data-status`, sobre `.g-calendar__event`.
- **Clases internas:** `g-calendar__event-title`, `g-calendar__event-time`, `g-calendar__head-title`, `g-calendar__label-title`, `g-calendar__label-sub`, `g-calendar__rows` (lista de filas de Timeline), `is-today` (cabecera y columna) e `is-outside` (celda de otro mes en Mes).
- **Etiquetas del eje** y **etiqueta de la línea de ahora:** hijos directos de `.g-calendar__axis` y de `.g-calendar__now`.

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, el patrón de texto oculto y los dos umbrales de contenedor (700px y 520px, excepción #34/#39); ningún `!important`; ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| Posición exacta (densidad `comfortable`, 1px por minuto) | Evento 12:43–13:12: `top` 343px, alto 29px; evento de 5 minutos en su posición real (123px) con alto mínimo 24px; evento abierto 157px, 33px de alto hasta "ahora" |
| Escala por densidad | Altura de una hora: 44, 60 y 80px |
| Escala con el tema (espacio base 5) | Las 12:43 caen en 428.75px (= 343 × 1.25); columna de 1125px; eje de 70px |
| Carriles | Cinco carriles por el grupo de conflicto de la mañana, cada uno de 1/5 del ancho de la columna |
| Disponibilidad y bloqueos | Franjas con patrón diagonal; bloqueo con borde discontinuo y patrón denso, sin capturar el puntero (`pointer-events: none`) |
| Estados sin depender del color | Tentativo: borde punteado; activo: patrón de rayas y borde inferior punteado; seleccionado: trazo interior; conflicto: borde y trazo de `danger` |
| Línea de ahora | Una por ventana (`top` 190px = las 10:10); en Timeline, una sola que cruza todas las filas (alto igual al de las filas) |
| Timeline | Pista de 1680px (900 min × 1.867 px); 'Cita corta' a 640.27px; eje con las etiquetas en su sitio; filas que crecen con sus carriles (176px con seis carriles); **seis eventos en seis carriles distintos, sin solapes** |
| Mes | 42 celdas, máximo tres fichas visibles y `+N más`; hoy marcado; celdas de otro mes atenuadas |
| Teléfono | Lista de recursos (61px por fila), tira de siete días (56px), agenda (50px por evento), mes compacto con puntos; ningún marco desborda |
| Estados | Esqueleto que conserva la barra (`aria-busy`), error con color y peso de `danger`, aviso de estado vacío sin altura |
| Contraste | Texto de evento sobre su relleno: 4.76 a 14.46 (mínimo `success`); hora de evento 6.51 o más; borde de evento contra la superficie 5.35 o más; línea y etiqueta de ahora 5.49; cabecera de hoy y botón de vista activo 16.48; botón `+N` 17.4 (borde 3.45); texto de bloqueo 6.9; etiquetas del eje 7.46; día fuera de mes 4.72 |
| Foco con teclado | Evento: anillo de 2px pegado (`outline-offset` negativo) y su `li` sube de capa; botones de barra: anillo de 2px con separación |
| Táctil (`pointer: coarse`, 320px) | Botones de barra de 44px; evento de 5 minutos, ficha del Mes, `+N` y evento de Timeline de **44px** (corregido: en Mes y Timeline quedaban en 24px); tirador de 44px; día del Mes de 44×44; carriles de Timeline de 48px; sin desborde |
| Cambio de tema (marca, acento, superficies ámbar, texto marrón, radio 0, borde 2px, espacio 5, Georgia, tokens de calendario propios) | Ninguna propiedad conserva el valor anterior; la escala de posiciones sigue a `space` |
| Movimiento reducido (bloque aplicado sin condición) | Eventos y botones conservan los fundidos de color; el esqueleto deja de pulsar |
| Colores forzados (bloque aplicado sin condición) | Borde de evento `ButtonText`, fondo `Canvas`; línea de ahora y botón de vista activo con `Highlight`; bloqueos y disponibilidad con `GrayText` (corregido: el bloqueo no cambiaba por menor especificidad) |
| RTL (`dir="rtl"`) | El eje pasa a la derecha y las columnas a su izquierda (propiedades lógicas) |
| Errores de consola | Ninguno |

## Hallazgos propios corregidos durante la entrega

1. **Tokens sin definir en el banco:** el navegador tenía en caché el `defaults.css` anterior y los tres tokens `--g-calendar-*` salían vacíos (sin línea de ahora ni patrones). Se añadió un parámetro anti-caché a los `<link>` del banco.
2. **`--_minutes` en el lugar equivocado:** la rejilla de las filas de Timeline lo leía de la pista y la etiqueta medía 1807px; ahora lo lleva el contenedor `.g-calendar__timeline`.
3. **Colisión de nombres:** `--_lane` era a la vez el índice de carril de cada evento y el alias raíz del alto de un carril; en Timeline todos los eventos de un recurso caían en la misma fila. El alto pasó a `--_laneh`.
4. **Alto táctil en Mes y Timeline** (44px), por arriba.
5. **Etiqueta "Día completo"** cruzaba la marca de las 07:00; la fila lleva ahora espacio inferior de media línea.
6. **Bloqueos en colores forzados** sin efecto por especificidad.

## Decisiones de estilo

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | Las posiciones son minutos; la escala sale de `--g-space-1` × unidades por densidad | El tema cambia la escala sin tocar el componente; sin píxeles en el `.vue` |
| 2 | Indisponibilidad y bloqueo con **patrón de líneas** (no solo color) sobre `surface-sunken`; el bloqueo además con borde discontinuo | WCAG 1.4.1; se distinguen entre sí y de un evento |
| 3 | Estados por patrón y forma (tentativo punteado, activo rayado con borde inferior punteado) | El color nunca es el único indicador |
| 4 | Color del evento por `data-color`: borde con `-text`, relleno con `-soft`, texto con `on-…-soft` | Contraste derivado por el contrato de tokens |
| 5 | La línea de ahora usa `--g-calendar-now-color` (por defecto `danger`, ≥ 3:1) con etiqueta del mismo color | Se distingue de la cuadrícula y de los eventos |
| 6 | El foco del evento es pegado al borde y su `li` sube de capa | Igual que `GInput`: una sola línea, sin hueco; nunca lo tapa un vecino |
| 7 | Alto de carril de Timeline = `--_evmin` + espacio | Sigue al mínimo táctil (24px → 28, 44px → 48) |
| 8 | Hoy se marca con relleno y `aria-current`, sin texto | No depende del idioma |

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | El contrato no lista el marcado auxiliar (`aria-current="date"`, `is-today`, `is-outside`, `data-color`) ni las clases internas (`__event-title`, `__event-time`, `__head-title`, `__label-title`, `__label-sub`, `__rows`) | Media | Agregarlos a la tabla de clases del contrato |
| 2 | El contrato de **variables dinámicas de posición** (`--_start`, `--_dur`, `--_lane`, `--_lanes`, `--_minutes`, `--_cols`, `--_grid`) es una API entre bruno y coco | Media | Registrarlo en el contrato como parte del marcado, con la excepción a "sin estilos en línea" |
| 3 | El botón de creación por teclado (`g-calendar__create`) solo se hace visible al enfocarlo; su comportamiento visual no se pudo verificar en el banco | Baja | Verificarlo con el componente real |

## No verificado

- Los `.vue`: bruno. Las interacciones (arrastre, redimensión, creación, teclado) son suyas; este CSS solo estiliza sus resultados (fantasma, tirador, selección, conflicto).
- **Solo con el banco (marcado estático):** el fantasma de arrastre, el detalle (`g-calendar__detail`), la hoja inferior con eventos reales, el botón de creación enfocado y el estado `is-disabled`.
- **Preferencias reales** `prefers-reduced-motion` y `forced-colors` (la herramienta no las emula; se aplicó el contenido de cada bloque sin su condición).
- **Contraste del texto sobre los patrones** de disponibilidad y de bloqueo (el texto va sobre `surface-sunken`; el patrón es de líneas finas): revisado a ojo, no medido píxel a píxel.
- **Tema oscuro:** no existe aún.
- **Cambio de horario de verano:** es cosa del motor de bruno, no del CSS.
