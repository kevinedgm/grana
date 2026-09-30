# Brief · Menú (GMenu) · r01

**Dueño:** kiwi · **Base:** el menú de acciones propio de `GWidget` (patrón *menu button* de APG; «propio, hasta que exista `GMenu`», DECISIONS.md #74).

## Decisiones del usuario (respuestas de alcance)

| Tema | Decisión |
| --- | --- |
| Tipos de elemento | **Acciones, separadores y grupos** con título; **casillas y opciones** (`menuitemcheckbox` y `menuitemradio`); **submenús**; **elementos peligrosos** (destructivos, con marca propia) |
| Apertura | **Botón de menú** (patrón *menu button* de APG). Sin menú contextual y sin método para anclarlo a cualquier elemento |
| Contenido | **Arreglo de items + slots**, como `GSidebar` (`items=[{ id, label, icon?, shortcut?, disabled?, danger?, type?, items? }]`); evento con el `id` |
| `GWidget` | **Pasa a usar `GMenu`** y deja su menú propio; las acciones de la rejilla se añaden como elementos |

## Qué se diseña

1. **Botón y lista:** el disparador (un slot de la aplicación) y la lista anclada a él.
2. **Elementos:** acción (icono y atajo opcionales), deshabilitado, peligroso, casilla, opción, grupo con título, separador y submenú.
3. **Teclado y foco** según los patrones *Menu Button* y *Menu* de APG, con submenús.
4. **Posición:** debajo del disparador, ajuste al visor, lista larga, RTL y táctil.

## Fuera de alcance

Menú contextual (clic derecho), anclaje a un elemento arbitrario, menús dentro de una barra de menús (*menubar*), elementos con campos o contenido libre, y un selector de valor (eso es `GSelect`).

## Criterios

WCAG 2.2 AA (1.3.1, 1.4.1, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 4.1.2); patrones APG *Menu Button*, *Menu* y *Menu Item* (casilla y opción); sin textos ni iconos propios (todo lo pone la aplicación); el significado se lee por texto y forma, no solo por color.
