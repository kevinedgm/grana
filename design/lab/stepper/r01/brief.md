# Brief funcional · GStepper · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita **mostrar el avance de un proceso dividido en pasos** (formulario de varios pasos, onboarding, checkout, asistente, flujo de aprobación) porque el usuario final debe entender de inmediato **dónde está, qué ya hizo y qué falta**, sin que el desarrollador reconstruya estados, conectores, teclado ni la adaptación a móvil.

## Pregunta de diseño

¿Qué anatomía, estados y comportamiento necesita `GStepper` para que **una sola lógica de pasos** (actual, completado, pendiente, error, advertencia, bloqueado, opcional) se vea igual de clara en horizontal, vertical, compacta y segmentada, y para que en móvil **se transforme** (no se encoja) sin perder las tres respuestas?

## Separación de capas (requisito del usuario)

**Lógica de progreso → estado del paso → variante visual.** El estado de un paso se calcula igual aunque cambie la variante; la variante solo cambia cómo se dibuja.

## Verbo y resultado

- **Verbo principal:** orientarse en un proceso (y, si es navegable, volver a un paso permitido).
- **Resultado verificable:** el usuario sabe el paso actual, cuántos hay y cuáles quedaron hechos, por forma, texto y posición, **no solo por color**; un lector de pantalla anuncia lo mismo.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Contenedor | Sí | `<nav>` con nombre accesible; dentro, una lista ordenada `<ol>` |
| Paso | Sí | `<li>`; el actual lleva `aria-current="step"` |
| Indicador | Sí | Punto, número o icono (o segmento en la variante segmentada). Nunca es lo único que nombra al paso |
| Etiqueta | Sí | Título del paso; se trunca con elipsis en una línea y conserva el nombre completo (`title` no: el nombre completo queda en el DOM) |
| Descripción | No | Segunda línea; se omite en tableta y en móvil horizontal |
| Texto de estado | Sí (oculto) | Texto solo para lector de pantalla: «completado», «error», «bloqueado»… lo aporta el consumidor (i18n) |
| Conector | No | Línea entre pasos; tres estados: hecho, hacia el actual, pendiente |
| Contenido del paso | No | Solo en vertical: región bajo el paso (típicamente el actual) |
| Resumen compacto | Solo en compacto | «Paso 2 de 5» + nombre del paso actual + barra fina |

## Estados del paso

`pending`, `current`, `complete`, `error`, `warning`, `disabled`, `optional`.
`complete`/`current`/`pending` **se derivan** de `current` (índice); `error`, `warning`, `disabled` y `optional` son **marcas** del consumidor que se combinan con lo derivado (un paso completado puede tener advertencia; un paso opcional puede estar pendiente).

## Composiciones (un solo componente: orientación × indicador)

1. **Horizontal · línea (minimal):** etiquetas con una línea continua y marca en el activo.
2. **Horizontal · puntos:** nodos pequeños conectados.
3. **Horizontal · numerado:** círculo con número; `check` al completar.
4. **Horizontal · iconos:** icono opcional por paso; sin icono, número.
5. **Segmentado:** cada paso es un tramo de una sola barra; etiqueta debajo.
6. **Vertical:** lista con descripción y contenido asociado; conector vertical.
7. **Compacto / móvil:** «Paso 2 de 5» + barra segmentada fina + nombre actual; botón opcional que despliega la lista vertical completa.
8. **Adaptativo:** por ancho **del contenedor**: amplio → horizontal completo; medio → sin descripciones; estrecho → compacto.

## Interacción

- **Informativo** (por defecto): ningún paso es un control.
- **Navegable:** los pasos permitidos son `<button>`; la regla de qué pasos se pueden elegir **la recibe**, no la decide.
- Un paso bloqueado o el actual **no** son botones.

## Overflow (muchos pasos)

Con más pasos de los que caben: pasar a compacto; y en compacto, el detalle completo va en la lista vertical desplegable. No hay scroll horizontal en r01.

## Continuidad

- **Teclado:** Tab recorre solo pasos navegables; Enter/Espacio activan. Sin flechas (no es `tablist`).
- **Foco:** visible en cada paso navegable; en compacto, en el botón de desplegar.
- **Zoom 200% / 320px:** sin desborde horizontal.
- **Movimiento:** cambio de estado sin animación obligatoria; coco decide una transición breve con `prefers-reduced-motion`.
