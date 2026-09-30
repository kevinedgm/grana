# Brief funcional · GSurface · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral (con profundidad: aquí la profundidad *es* la estructura)

## Enunciado

Un **desarrollador que usa Grana** (y los propios componentes de Grana) necesita **una superficie genérica** sobre la que viva cualquier contenido —sección, grupo de formulario, tarjeta, popover, carcasa de diálogo, zona incrustada— para que todas compartan **un solo lenguaje de profundidad** en lugar de que cada componente decida su fondo, borde, radio y sombra.

## Pregunta de diseño

¿Qué niveles, reglas de anidación y anatomía mínima necesita `GSurface` para que cinco relaciones visuales (integrada, delimitada, elevada, flotante, incrustada) se distingan con **diferencias sutiles**, se anidan sin «cards dentro de cards» y sirvan de base a `GPanel`, `GSheet`, `GDialog`, `GMenu` y `GWidget` sin cambiar su aspecto actual?

## Alcance de la ronda (decisión del usuario)

Solo la primitiva `GSurface`. `GPanel`, `GSheet`, `Drawer`, `Popover` y la migración de `GDialog`/`GSidebar`/`GMenu`/`GWidget` quedan fuera; esta ronda solo comprueba que **podrán** apoyarse en ella.

## Verbo y resultado

- **Verbo principal:** agrupar contenido con una relación de profundidad.
- **Resultado verificable:** en escala de grises, cada nivel se distingue del fondo y de los otros por al menos **dos** señales (fondo, borde, sombra, radio); una superficie incrustada se lee **dentro** de su padre (radio concéntrico, sin sombra propia); nunca hay más de dos pasos de tono visibles.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Superficie | Sí | Un solo elemento. Sin encabezado, cuerpo ni pie: eso es de `GPanel` |
| Contenido | Sí | Libre (slot) |

No tiene rol ni significado: el elemento lo elige el consumidor (`div`, `section`, `article`, `aside`, `form`…).

## Niveles

| Nivel | Relación | Para |
| --- | --- | --- |
| `flat` | Integrada al layout | Secciones, contenido base |
| `outlined` | Delimitada por borde | Grupos, formularios, configuración |
| `raised` | Ligeramente elevada | Tarjetas, widgets |
| `floating` | Claramente separada | Popovers, menús, diálogos |
| `inset` | Incrustada en su padre | Resúmenes, zonas dentro de diálogos y paneles |

## Continuidad

- **Anidación:** una superficie dentro de otra conoce el radio y el relleno del padre (radio concéntrico).
- **Tema oscuro:** la elevación no puede depender solo de la sombra (casi invisible sobre negro).
- **Zoom 200% / 320px:** sin desborde horizontal.
- **Colores forzados:** cada nivel conserva un borde visible (el fondo y la sombra desaparecen).
