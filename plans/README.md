# Planes de animación

Generados con la skill `improve-animations` sobre el commit 34d80bb.

| # | Título | Severidad | Estado |
| --- | --- | --- | --- |
| 001 | Añadir respuesta al pulsar en GBtn | Media | TODO |
| 002 | Mantener el indicador de carga visible con movimiento reducido | Media | DONE |

## Orden recomendado

1. **002** primero: cambia una línea de CSS, no necesita tokens y es de accesibilidad.
2. **001** después: exige tokens nuevos, así que pasa por lima (contrato) antes de coco (CSS) y bruno (meta).

## Dependencias

- Los dos planes tocan `GBtn.css`, en zonas distintas (001: `transition` y `:active`; 002: bloque `prefers-reduced-motion`). Haz uno y verifícalo antes del otro. 001 también añade una regla dentro del bloque de movimiento reducido: ejecuta 002 antes para evitar conflictos.
- Recuerda: un archivo, un dueño (AGENTS.md).

## Hallazgos sin plan

- Fundido al entrar en carga (baja).
- Curva `--g-ease-standard` más suave que la recomendada (baja, de gusto).
