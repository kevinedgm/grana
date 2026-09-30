# Declaración de cumplimiento · GSurface · r01

**Estado:** aprobada. La estructura se deriva de estándares (WCAG 2.2 AA: 1.4.1, 1.4.10, 1.4.11; `forced-colors`) y del lenguaje de superficies vigente (`tokens.md` §11, DECISIONS.md #43). El usuario decidió el alcance: **solo la primitiva `GSurface`**; `GPanel`, `GSheet`, drawer, popover y la migración de componentes existentes quedan para después. Esta ronda **reabre DECISIONS.md #43** («sin `GSurface` en v0.1») con el motivo nuevo que esa decisión pedía: varios consumidores.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises (con sombras: la profundidad es la estructura).
**Siguiente dueño:** lima → `design/contracts/surface.md`.

## Composiciones verificadas

Cinco niveles sobre el fondo; inset dentro de una tarjeta (más oscura que su padre); carcasa de diálogo con inset (más clara que su padre); radio concéntrico con tres rellenos; tercer nivel aplanado; sección con grupo, zona incrustada y popover; 320px; claro y oscuro.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | **Un solo componente, un solo elemento**, sin encabezado, cuerpo ni pie; el contenido es un slot | El brief: sin significado funcional. Organizar contenido es de `GPanel` |
| 2 | El elemento lo elige el consumidor (`div` por defecto; `section`, `article`, `aside`, `form`…); `GSurface` **no añade rol** | WCAG 1.3.1: la semántica depende del uso, no del aspecto |
| 3 | **Cinco niveles**: `flat`, `outlined`, `raised`, `floating`, `inset` | Brief; cubren las relaciones pedidas sin variantes por componente |
| 4 | Cada nivel no plano se distingue del fondo por **al menos dos señales** (fondo, borde, sombra, radio). `flat` no tiene ninguna: es layout | Verificado en claro y oscuro; la sombra sola no basta en oscuro |
| 5 | **Tono** de la superficie: claro (`surface`) o hundido (`sunken`). Una `inset` toma **el tono contrario al de su padre** | Resuelve la tensión con `GDialog`, cuya inset es **más clara** que su carcasa hundida, frente al brief, que la pide **hundida** dentro de una tarjeta: las dos cosas son «un paso de tono respecto al padre» |
| 6 | Una `inset` más clara que su padre lleva una sombra mínima; una más oscura, **ninguna** | Una placa clara sobre fondo hundido se lee apoyada; un hueco oscuro no proyecta sombra. Reproduce `GDialog` sin reglas propias |
| 7 | **Radio concéntrico automático**: la inset toma radio = radio del padre − relleno del padre, con un mínimo (verificado: 6 → 14px, 8 → 12px, 16 → 4px) | Regla de radios anidados (DECISIONS.md #43); la inset se lee dentro, no encima |
| 8 | **Mecanismo sin JavaScript**: una superficie no-inset *publica* a sus descendientes su tono contrario, su sombra y su radio concéntrico en alias locales; la inset solo los *lee* | CSS nativo (propiedades heredadas). Hallazgo propio: si la inset redeclarara el mismo alias que lee, se leería a sí misma (ciclo; en la primera versión dio radio 0 y tono equivocado). Se corrigió separando «publica» de «usa» |
| 9 | **Máximo dos pasos de tono visibles**: una inset dentro de otra no cambia de tono ni lleva sombra; solo conserva la línea y el radio concéntrico | Brief («demasiados niveles»); `tokens.md` §11 («sin más de dos niveles de superficie por defecto») |
| 10 | Una inset **sin superficie padre** usa tono hundido y el radio por defecto del sistema | Debe funcionar suelta |
| 11 | `GSurface` **no es interactiva**: sin hover, foco ni pulsación. Una tarjeta pulsable es otro componente | Evita un `div` clicable sin teclado (WCAG 2.1.1) |
| 12 | Colores forzados: fondo y sombra desaparecen; **todo nivel no plano conserva un borde** visible | `forced-colors`: sin borde, una superficie desaparecería |
| 13 | Tema oscuro: la elevación se apoya en el **tono más claro** de la superficie y en el borde, no en la sombra | Verificado: con fondo `#141414`, `surface` `#1F1F1F` y borde al 10–22% |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.3.1 Información y relaciones | Cumple | Sin rol propio; el elemento lo decide el consumidor |
| WCAG 1.4.1 Uso del color | Cumple | Cada nivel se distingue por borde, sombra o radio, no solo por tono |
| WCAG 1.4.10 Reajuste | Cumple | 320px: `scrollWidth` = 320 |
| WCAG 1.4.11 Contraste no textual | No aplica al nivel | Una superficie no es un componente de interfaz ni un gráfico con información; el contraste de su contenido es del contenido |
| Colores forzados | Cumple por diseño | Borde conservado en todo nivel no plano (bloque escrito; sin emulación en esta ronda) |
| Heurística: consistencia | Cumple | La carcasa de `GDialog` se reproduce con dos `GSurface` (floating hundida + inset) |

## Comprobaciones ejecutadas

- Chromium (`localhost`), claro y oscuro, sin errores en consola.
- Valores computados de los cinco niveles (fondo, borde, sombra, radio), de la inset en tarjeta y en carcasa, del tercer nivel y del radio concéntrico con tres rellenos.
- 320px sin desborde horizontal.

## Comprobaciones NO ejecutadas

- `forced-colors` emulado o real; zoom al 200%; lector de pantalla (no aplica: sin rol).
- Contraste real del contenido sobre cada tono (lo audita coco con el tema real).
- Anidación con superficies **no-inset** dentro de una inset (por ejemplo, una tarjeta dentro de un resumen): no se diseñó; publicaría de nuevo y rompería el límite de dos pasos.
- Distinción `outlined` / `raised` sobre el fondo de página: se ve, pero es sutil (la sombra de `raised` es corta); lo ajusta coco.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | Nombre del eje principal | Alta | Prop `level` (`flat` `outlined` `raised` `floating` `inset`). **No** `variant`: sus valores compartidos (`solid`, `soft`…) no describen una superficie |
| 2 | Tono | Alta | Prop `tone`: `surface` (por defecto) o `sunken`. Lo necesita la carcasa de `GDialog` (floating hundida) |
| 3 | Elemento | Alta | Prop `as` (etiqueta HTML), `div` por defecto; sin rol |
| 4 | Relleno | Alta | Prop `padding`: `none` `xs` `sm` `md` `lg`, derivados de `space`. El relleno **forma parte del radio concéntrico**, por eso es prop y no CSS del consumidor |
| 5 | Radio | Media | `rounded` compartida (la instancia gana); por defecto: `flat` 0, `outlined`/`raised` `radius-lg`, `floating` `--g-surface-radius`, `inset` concéntrico |
| 6 | Sombras por nivel | Media | Hoy los componentes usan `--g-shadow-2` (menús, selects, calendario) y `--g-shadow-3` (diálogo, sidebar): `floating` necesita **dos intensidades** o el diálogo sube la suya. Propuesta: `floating` = `shadow-2`; una capa modal (diálogo, sheet) añade `shadow-3` por su cuenta |
| 7 | Tokens | Media | Reutilizar `--g-surface-*` (§11); el tono hundido es `--g-surface-shell`/`--g-color-surface-sunken`. Valorar si hacen falta `--g-surface-border` y un radio mínimo de inset (el prototipo usa 4px) |
| 8 | Mecanismo de publicación | Media | Nombres de alias locales para lo que publica una superficie (`--_pub-*`) y para el tercer nivel; son internos de coco, pero el contrato debe decir que **la anidación funciona entre descendientes, no solo hijos directos** |
| 9 | `density` | Baja | Compartida: multiplica el relleno (y por tanto el radio concéntrico) |
| 10 | Migración | Baja | Fuera de alcance: `GDialog`, `GWidget`, `GMenu`, `GSelect` y `GSidebar` podrán apoyarse en `GSurface` en una ronda propia; esta ronda solo demuestra que `GDialog` se reproduce |
