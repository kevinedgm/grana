# Brief funcional · GCalendar · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R2 (componente complejo con motor propio) · **Fidelidad:** F2 · wireframe mid-fi con kit neutral, con motor de layout real
**Fuente:** especificación "Calendar / Scheduler multirrecurso" entregada por el usuario (secciones 1–55).

## Enunciado

Un **desarrollador que usa Grana** necesita **representar y manipular tiempo, eventos, recursos, disponibilidad y bloqueos** en una agenda individual o compartida, sin que el componente conozca el significado comercial de esos datos (persona, sala, vehículo, máquina…), porque la planificación temporal es infraestructura que se repite en muchos productos y reconstruirla cada vez es caro y propenso a errores de accesibilidad y de zona horaria.

## Pregunta de diseño

¿Qué anatomía, capas, estados y comportamiento necesita `GCalendar` para que **Día, Semana, Mes y Timeline** respondan a preguntas distintas ("¿qué pasa ahora?", "¿cómo se distribuye el tiempo?", "¿qué pasa en general?", "¿cómo se comparan varios recursos?"), con eventos en **minutos arbitrarios**, traslapes en carriles, disponibilidad y bloqueos separados de los eventos, y una experiencia **accesible con teclado, lector de pantalla y táctil**, que cambia de estructura (no solo de tamaño) entre escritorio, tableta y teléfono?

## Decisiones del usuario (alcance de la v0.1)

| Decisión | Respuesta |
| --- | --- |
| Vistas | **Día, Semana, Mes y Timeline** (con un recurso o varios). Quedan para v0.2: Agenda, Año, matriz semanal recurso × día y mes agregado multirrecurso |
| Interacción y motor | **Núcleo completo, sin virtualización**: minutos arbitrarios, carriles de traslape, disponibilidad y bloqueos como capas, eventos abiertos y de día completo, indicador de ahora, zona horaria explícita, crear/mover/redimensionar (solo **solicitan**, no mutan), teclado y adaptación por dispositivo. La virtualización de cientos de recursos queda para v0.2 |

## Verbo y resultado

- **Verbo principal:** consultar y planificar el tiempo de uno o varios recursos.
- **Resultado verificable:** un evento que empieza a las 12:43 se dibuja exactamente en 12:43; crear, mover o redimensionar **emite una solicitud** con los valores previo y nuevo y **no modifica** el modelo del consumidor; y cada vista se puede recorrer y activar solo con teclado.

## Principios que fija la especificación (y que este prototipo verifica)

1. **Independiente del dominio:** solo `resource`, `event`, `availability`, `block`.
2. **El tiempo real no depende de la cuadrícula:** `gridInterval` (guía visual), `snapInterval` (interacción) y el intervalo de disponibilidad son tres cosas distintas.
3. **Disponibilidad ≠ evento ≠ bloqueo:** capas independientes.
4. **El componente detecta, la aplicación decide:** conflictos, traslapes, indisponibilidad, fuera de horario.
5. **Zona horaria explícita**, nunca la del servidor por omisión.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Raíz | Sí | Región con nombre; contiene barra, ventana y superposiciones |
| Barra de herramientas | Sí | Anterior, Hoy, Siguiente, título del rango, selector de vista, zona horaria |
| Ventana (viewport) | Sí | Contiene la vista activa |
| Eje de tiempo | En Día, Semana y Timeline | Etiquetas de hora; en Timeline, horizontal |
| Cuadrícula | En Día, Semana y Timeline | Guía visual cada `gridInterval` |
| Capa de disponibilidad | Si hay reglas | Sombrea lo no disponible; decorativa |
| Capa de bloqueos | Si hay bloqueos | Periodos no disponibles con motivo; cada bloqueo también existe como elemento de la lista accesible |
| Capa de eventos | Sí | Lista cronológica accesible; posición absoluta por tiempo real |
| Región de día completo | Si hay eventos de día completo | Fuera del eje horario |
| Indicador de ahora | Si `showNowIndicator` | Una sola línea por ventana; decorativo |
| Capa de selección y fantasma | Al crear, mover o redimensionar | Vista previa; nada se confirma hasta validar |
| Tirador de redimensión | Sobre el evento | Visible con hover, selección o foco |
| Detalle / popover | Bajo demanda | Lo pone el consumidor (slot) |
| Estados | Sí | Cargando (conserva la estructura), vacío, error con reintento, solo lectura |

## Estados

`loading`, `empty`, `error`, `readonly`, `disabled`, `dragging`, `resizing`, `selecting`, `conflict`, `offline`.

## Riesgo por acción

Mover, redimensionar y crear son **solicitudes**: el calendario nunca borra ni modifica silenciosamente eventos. Un bloqueo sobre eventos existentes emite `block-conflict` con los eventos impactados; la aplicación decide.

## Continuidad

- **Rango visible:** cada cambio de fecha o vista emite `range-change({ start, end })` para carga por rango.
- **Carga:** la vista conserva su estructura con filas esqueleto; nunca un spinner a pantalla completa.
- **Zoom 200% y 320px:** sin desborde horizontal de la página; la estructura cambia en teléfono.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Día, Semana, Mes, Timeline | Densidad `compact`/`comfortable`/`spacious` | Arrastrar entre recursos en Timeline | Agenda, Año |
| Minutos arbitrarios y carriles de traslape | Alto mínimo de evento | Recurrencia de bloqueos generada por el componente | Matriz semanal y mes agregado multirrecurso |
| Disponibilidad, bloqueos, día completo, evento abierto | `+N` y hoja del día | Filtros integrados | Virtualización de recursos |
| Indicador de ahora y zona horaria | Popover y menú contextual por slot | | Buscador de recursos integrado |
| Crear/mover/redimensionar como solicitudes | | | Formulario de creación integrado |
| Teclado completo y semántica de lista | | | Persistencia |
| Escritorio, tableta y teléfono | | | Recurrencia de eventos |

## Hechos, supuestos e incógnitas

**Hechos**
- La posición vertical sale de `minutos desde el inicio × píxeles por minuto`; no hay redondeo (`top = minutosDesdeInicio * ppm`, `height = duración * ppm`).
- Las horas se leen en la zona horaria del calendario con `Intl.DateTimeFormat` (sin bibliotecas), no en la del navegador.
- Una lista `<ul>` en orden cronológico es la forma más fiable de exponer eventos posicionados de forma absoluta a un lector de pantalla: el **orden del DOM es el orden temporal**, no el visual.
- Los eventos traslapados se reparten en **carriles** dentro de su grupo de conflicto; nunca se ocultan ni se desplazan artificialmente.
- WCAG 2.5.7 (arrastrar) exige una alternativa que no requiera arrastrar; WCAG 2.5.8 exige objetivos de 24px (44px con `pointer: coarse` según `tokens.md` §7).
- Un `<button>` no puede contener otro control interactivo.

**Supuestos**
- El consumidor entrega fechas como `Date` o ISO 8601 con desfase; el calendario las normaliza.
- El consumidor pone su propio formulario de creación/edición (modal, drawer, popover…).
- El componente no calcula la recurrencia: recibe ocurrencias concretas.

**Incógnitas (para lima)**
- ¿Una sola API `GCalendar` con vistas internas, o vistas exportadas por separado? Propuesta de kiwi: un componente con vistas internas y vistas exportables como piezas reutilizables después.
- ¿Cómo se entregan `Date` y zona horaria (Date, ISO, o ambos)? Propuesta: ambos, normalizados.
- Tokens nuevos probables: altura de hora, ancho de columna de recurso, ancho del eje, color de evento por tipo y estado, patrón de indisponibilidad.
- Textos traducibles (Hoy, Día, Semana, Mes, "+N", "ahora", "Día completo", mensajes de conflicto): props o mapa de textos sin valor por defecto.
- Una constante literal de umbral de ancho para cambiar de estructura en teléfono y tableta (excepción de umbral, DECISIONS.md #34 amplía el criterio).
