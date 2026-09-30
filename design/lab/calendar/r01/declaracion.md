# Declaración de cumplimiento · GCalendar · r01

**Estado:** aprobada. Las decisiones de estructura se derivan de la especificación entregada por el usuario (secciones 1–55), de WCAG 2.2 AA y de los contratos vigentes; el alcance (Día, Semana, Mes y Timeline; núcleo completo sin virtualización) lo decidió el usuario. Quedan hallazgos de API y de tokens para lima y comprobaciones sin ejecutar.
**Ruta:** R2 · **Fidelidad:** F2 · **Material:** kit neutral de grises, **con motor de layout real** (las posiciones salen de los datos).
**Siguiente dueño:** lima → `design/contracts/calendar.md`.

## Estados cubiertos

Día (1 a 5 recursos en columnas), Semana (un recurso, siete columnas), Mes (un recurso y varios mezclados, con `+N` y hoja del día), Timeline (varios recursos sobre el mismo eje). En cada una: disponibilidad, bloqueos, eventos con minutos arbitrarios, traslapes en carriles, evento abierto, evento de día completo, evento fuera del rango visible, indicador de ahora, selección, fantasma de arrastre, conflicto. Por dispositivo: escritorio (recursos en panel fijo), tableta (panel plegable con `aria-expanded`), teléfono (lista de recursos con estado, tira de días + agenda, mes compacto + hoja inferior). Estados del componente: `loading` (esqueleto que conserva la barra), `empty` (rejilla, disponibilidad y bloqueos siguen visibles), `error` (aviso con reintento), `readonly` (sin tiradores ni celdas de creación).

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | **Posición = tiempo real, sin redondeo.** `top = (minutoInicio − minutoInicioVisible) × píxelesPorMinuto`; `height = duración × píxelesPorMinuto`. La cuadrícula (`gridInterval`), el `snap` de interacción y el intervalo de disponibilidad son tres cosas distintas | Especificación §2.2, §21, §22 |
| 2 | **Los eventos van en una lista `<ul>` en orden cronológico**; el orden del DOM es el orden temporal, no el visual (la posición es absoluta). Los bloqueos son elementos de la misma lista, con texto para lector de pantalla | WCAG 1.3.1 y 1.3.2; es la forma fiable de exponer eventos posicionados |
| 3 | **Traslapes en carriles** dentro de su grupo de conflicto; el ancho se reparte; nada se oculta ni se desplaza. El alto mínimo (20px) cuenta para calcular los carriles, así un evento de 5 minutos no se dibuja encima de otro | Especificación §20, §44, §45 |
| 4 | **Disponibilidad ≠ evento ≠ bloqueo:** capas separadas. La disponibilidad sombrea lo no disponible (decorativa); el bloqueo es un periodo con motivo | Especificación §2.3, §4, §19, §48 |
| 5 | **Evento abierto (sin `end`):** se dibuja de su inicio hasta ahora (mínimo 30 min), con borde inferior punteado y etiqueta "ahora"; no admite redimensionar | Especificación §4.4, §18 |
| 6 | **Día completo en una región propia** sobre el eje horario, por columna | Especificación §4.5 |
| 7 | **Una sola línea de ahora por ventana** (en Timeline cruza todas las filas); decorativa (`aria-hidden`) | Especificación §11, §23 |
| 8 | **Zona horaria explícita** con `Intl.DateTimeFormat` (sin bibliotecas); las horas se leen en la zona del calendario, no en la del navegador | Especificación §26 |
| 9 | **Crear, mover y redimensionar solo emiten solicitudes** con valores previo y nuevo y la lista de conflictos; nada muta el modelo. La aplicación decide | Especificación §2.4, §30, §53 |
| 10 | **Alternativa al arrastre con teclado:** `Alt`+flecha mueve un `snap`; `Shift`+flecha cambia la duración; `Enter` sobre "Crear evento" (botón visualmente oculto por columna) emite `create-request` | WCAG 2.5.7 (arrastrar), 2.1.1 |
| 11 | **Un solo punto de tabulación** por vista (tabulación itinerante): flechas recorren eventos (misma lista) y listas vecinas; `Enter` abre el detalle; `Esc` lo cierra y devuelve el foco | WCAG 2.1.1, 2.4.3 |
| 12 | **Tirador de redimensión visible con hover, selección o foco** (la selección cubre el táctil, que no tiene hover). El tirador no está dentro del `<button>` del evento | Especificación §40; un botón no contiene otro control |
| 13 | **El evento pequeño oculta la hora pero conserva el título** y un alto mínimo visible; la posición sigue siendo la real | Especificación §44 |
| 14 | **La estructura cambia por dispositivo, no solo el tamaño:** teléfono = lista de recursos con estado ("Ocupado hasta 10:30", "Bloqueado"), tira de días + agenda, mes compacto + hoja inferior; tableta = recursos en panel plegable | Especificación §37–§39 |
| 15 | **El color nunca es el único indicador:** tipo por forma del borde (sólido, discontinuo, redondeado), estado por patrón (activo rayado, tentativo punteado) y texto en el nombre accesible | Especificación §42; WCAG 1.4.1 |
| 16 | **Cada cambio de rango emite `range-change({ start, end })`** para carga por rango | Especificación §46, §47 |
| 17 | **Cargando conserva la estructura** (esqueleto bajo la barra); vacío no oculta disponibilidad ni bloqueos | Especificación §32 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| Minutos arbitrarios | Cumple | Evento 12:43–13:12: `top` 343px y `height` 29px, exactos con 1px por minuto |
| Alto mínimo | Cumple | Evento de 5 minutos: 20px, en su posición real (09:03 → 123px) |
| Evento abierto | Cumple | 09:37 → ahora (10:10): 157px de `top` y 33px de alto |
| Carriles | Cumple | Tres eventos traslapados: tres carriles de 33.33% de ancho |
| Orden del DOM = orden temporal | Cumple | Las posiciones verticales de la lista son no decrecientes |
| Una sola línea de ahora | Cumple | 1 en Día y Semana (solo en la columna de hoy) y 1 en Timeline que cruza las 4 filas (alto igual al de las filas) |
| Zona horaria | Cumple | Madrid: 12:43 se ve 20:43 y "ahora" 18:10 en el píxel esperado; Tokio: los eventos que cruzan la medianoche pasan a "fuera del rango visible" |
| Semana | Cumple | 7 columnas, una sola línea de ahora en la columna de hoy, fin de semana sombreado |
| Mes | Cumple | 42 celdas, máximo 3 eventos visibles y `+N más` correcto; hoy marcado |
| Timeline | Cumple | Mismo eje para todas las filas (09:00 en el mismo píxel para A y D); disponibilidad y bloqueos por recurso; filas que crecen con sus carriles |
| Teclado | Cumple | Un punto de tabulación; ↓ pasa al siguiente evento de la lista; → salta al primer evento del recurso vecino; `Enter` abre el detalle, `Esc` lo cierra y devuelve el foco |
| Alternativa al arrastre (WCAG 2.5.7) | Cumple | `Alt`+↓ movió 12:43 → 12:48; `Shift`+↓ ×2 alargó el fin, con solicitud emitida, foco conservado y anuncio |
| Conflicto | Cumple | Alargar hasta el bloqueo de 14:00: se emite la solicitud con `blockedTime`, se emite `conflict`, la aplicación lo rechaza y el estado no cambia; con "permite conflictos" lo aplicaría |
| Arrastre con puntero | Cumple | Mover: 12:43 → 11:40 (60px, `snap` 5); redimensionar por el tirador: 09:30–10:00 → 09:30–10:30; crear con un clic: solicitud con inicio ajustado a `snap`; ninguna abre el detalle por error |
| Tirador en táctil | Cumple | Un clic o toque selecciona el evento y muestra el tirador aunque no haya hover (corregido: antes solo aparecía con hover) |
| Semántica ARIA | Cumple | Botones de vista con `aria-pressed` (true/false), panel de recursos con `aria-expanded` y `aria-controls` (corregido en el prototipo: los booleanos `aria-*` no se emitían como texto) |
| Teléfono | Cumple | Lista de 4 recursos con estado (A "Ocupado · evento activo", B "Ocupado hasta 10:30", C "Bloqueado", D "Ocupado hasta 12:00"); tocar uno abre su día; semana como tira de 7 días + agenda con 9 elementos; mes con puntos y hoja inferior de 9 eventos; sin desborde horizontal |
| Tableta | Cumple | Recursos plegables con `aria-expanded`; sin desborde |
| Estados | Cumple | `loading` con `aria-busy` y barra conservada; `empty` sin eventos pero con rejilla, disponibilidad y bloqueo; `error` con `role="alert"` y reintento; `readonly` sin tiradores ni botones de creación |
| Errores de consola | Cumple | Ninguno |

## Comprobaciones ejecutadas

- Chromium, `localhost:4174`; mediciones de píxel exactas por JavaScript sobre el DOM.
- Teclado con eventos reales (`Alt`+↓, `Shift`+↓ ×10, ↓, →, `Enter`, `Esc`), ratón real (arrastrar, redimensionar, clic para crear) y clic en la selección.
- Zona horaria (México, Madrid, Tokio), densidad, `snap`, cuadrícula, dispositivo simulado y estados desde el panel del prototipo.

## Correcciones hechas durante la ronda

1. **Línea de ahora en Timeline:** había una por fila; ahora es una sola que cruza todas las filas.
2. **Tirador solo con hover:** inalcanzable en táctil; se añadió la selección como condición para mostrarlo.
3. **`aria-pressed` y `aria-expanded`:** el helper del prototipo descartaba `false` y emitía `true` como cadena vacía; ahora son `"true"`/`"false"`.
4. **Estado `empty`:** mostraba el aviso pero seguía dibujando eventos; ahora simula un periodo sin eventos y conserva rejilla, disponibilidad y bloqueos.

## Comprobaciones NO ejecutadas

- **Lector de pantalla real** (VoiceOver, NVDA): cómo se anuncia la lista cronológica, el conteo de eventos, las solicitudes y los mensajes de conflicto. Es la comprobación más importante pendiente de este componente.
- **Dispositivos táctiles reales:** el arrastre, el tirador y la hoja inferior se probaron con ratón y con la emulación de tamaño; no con dedos.
- **Zoom al 200%** del navegador.
- **Cambio de horario de verano** (una jornada de 23 o 25 horas): el motor calcula minutos transcurridos desde el inicio del día, pero no se probó una zona con cambio de hora en la fecha visible.
- **Rendimiento** con 1000+ eventos y 100+ recursos (la virtualización queda para v0.2).
- **Una primera secuencia de teclas con `Alt` produjo movimientos sobre otro evento** y no pude reproducirla al repetir el escenario limpio (las mismas teclas se comportaron bien). Lo más probable es un modificador retenido por la herramienta de pruebas; queda anotado por si reaparece con `Alt` pulsado antes de una flecha.
- `forced-colors`, `prefers-reduced-motion`: el estilo final es de coco.
- Contraste: no aplica a un wireframe en grises; lo audita coco con el tema real (en particular los patrones de disponibilidad y bloqueo, y el texto de eventos pequeños).
- `scripts/check_artifact.py` y referencias del protocolo de gobernanza: no existen en el entorno.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | **Estructura de componentes.** La especificación lista 20 piezas (`TimeGrid`, `EventBlock`, `NowIndicator`…) y una sola API `Calendar` | Alta | Un componente `GCalendar` con las vistas como piezas internas; solo se exportan de forma pública `GCalendar` y, más adelante, las vistas reutilizables. La decisión de nombres es del contrato |
| 2 | **Tipos de datos y zona horaria.** `Date`, ISO 8601 con desfase o ambos | Alta | Aceptar ambos y normalizar a instantes; `timezone` explícita (sin valor por defecto en producción: en desarrollo, aviso si falta) |
| 3 | **Textos traducibles** (Hoy, Día, Semana, Mes, Timeline, "ahora", "Día completo", "+N más", "Ocupado hasta…", mensajes de conflicto, nombres de botones) | Alta | Un mapa `labels` sin valores por defecto, con aviso en desarrollo si falta; funciones para los que llevan datos (`moreText(n)`, `busyUntil(hora)`) |
| 4 | **Eventos emitidos** (`create-request`, `event-move-request`, `event-resize-request`, `range-change`, `conflict`, `block-conflict`, `event-click`, `more-events-click`, `resource-click`, `date-click`, `time-click`) | Alta | Adoptar la lista de la especificación con los `payload` del prototipo (valores previo y nuevo, `conflicts[]`, `timezone`) |
| 5 | **Umbrales de estructura por ancho** (teléfono ~520px, tableta ~700px) | Media | Constantes literales de contenedor, ampliando la excepción de DECISIONS.md #34 (una consulta de contenedor no admite `var()`) |
| 6 | **Tokens nuevos probables:** altura de hora, ancho del eje, ancho mínimo de columna y de etiqueta de recurso, alto mínimo de evento, color de evento por tipo y por estado, patrón de indisponibilidad, línea de ahora | Alta | Lista de tokens `--g-calendar-*` (la especificación §49 propone `--calendar-*`); lima decide nombres y cuáles derivan de tokens vigentes |
| 7 | **Slots** (`resource`, `event`, `event-content`, `day-header`, `month-day`, `all-day-event`, más `popover`/`detail`) | Media | Adoptar la lista de la especificación; el contenido de los slots no puede llevar controles interactivos dentro del botón del evento |
| 8 | **`density` del calendario** (`compact`/`comfortable`/`spacious`) no coincide con el de la API compartida (`default`/`comfortable`/`compact`) | Media | Mantener los tres valores de la especificación como prop propio o reconciliar con la API compartida; decisión de lima |
| 9 | **Reglas de conflicto:** la aplicación puede permitir, bloquear o pedir confirmación | Media | El componente solo emite; `validate` es opcional y sus tipos (`overlap`, `blockedTime`, `outsideAvailability`, `invalidDuration`, `resourceConflict`) son los de la especificación |
| 10 | **Alternativa por teclado al arrastre:** combinaciones `Alt`/`Shift` + flecha | Media | Contratarlas como comportamiento del componente; documentar que `snapInterval` fija el paso |
| 11 | **Selección de recursos y filtros** son externos (§35, §36) | Baja | El componente recibe `resources` ya filtrados; el panel de recursos del prototipo es demostración, no parte del componente |
| 12 | **Vista Semana multirrecurso** y **mes agregado** | Baja | Quedan para v0.2; en v0.1 Semana admite un recurso y Mes mezcla eventos con la inicial del recurso |
| 13 | **Virtualización** | Baja | v0.2; la API no debe impedirla (recursos y eventos por rango) |
