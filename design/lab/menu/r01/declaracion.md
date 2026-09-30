# Declaración de cumplimiento · Menú (GMenu) · r01

**Estado:** aprobada. Las decisiones de estructura y accesibilidad se derivan de estándares (WCAG 2.2 AA: 1.3.1, 1.4.1, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 4.1.2; patrones *Menu Button* y *Menu* de APG). El usuario decidió el alcance: acciones, separadores, grupos, casillas, opciones, submenús y elementos peligrosos; botón de menú; arreglo de items con slots; `GWidget` usa `GMenu`.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises.
**Siguiente dueño:** lima → `design/contracts/menu.md` y el cambio de `GWidget` (`design/contracts/widget.md`).

Prototipo: `index.html` (sin dependencias) con un **motor real** (botón, lista, roving focus, *type-ahead*, submenús de tres niveles, casillas y opciones, ajuste al visor, RTL). Verificado en Chromium con teclado real (Enter, flechas, Esc) y con eventos de teclado y de puntero para los demás casos.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | **Botón + lista:** el disparador lleva `aria-haspopup="menu"`, `aria-expanded` y `aria-controls`; la lista es `<ul role="menu" popover="manual">` con nombre por el disparador (`aria-labelledby`); cada elemento va en un `<li role="none">` | APG *Menu Button*; WCAG 4.1.2 |
| 2 | **Roles de elemento:** `menuitem` (acción y padre de submenú), `menuitemcheckbox` y `menuitemradio` (con `aria-checked`); los grupos son `role="group"` con un título visible (`role="presentation"`) que los nombra; los separadores, `role="separator"` | APG *Menu*; WCAG 1.3.1 |
| 3 | **Abrir:** clic, Enter, Espacio y ↓ abren con el foco en el **primer** elemento; ↑ abre con el foco en el **último**; un segundo clic cierra. Verificado: Enter abre en «Renombrar», ↑ abre en «Eliminar» | APG *Menu Button*; WCAG 2.1.1 |
| 4 | **Foco con *roving tabindex*:** solo el elemento activo es tabulable (`tabindex="0"`); ↑ ↓ recorren de forma **cíclica**, Inicio y Fin saltan a los extremos, y el elemento activo **siempre se ve** (desplaza la lista). Los deshabilitados **siguen enfocables** | APG *Menu*; WCAG 2.4.3 |
| 5 | **Escribir salta (*type-ahead*):** una letra salta al siguiente elemento que empieza por ella; un búfer de 500ms acumula varias (repetir la misma letra cicla). Verificado: «d» → «Duplicar», «r» desde «Eliminar» → «Renombrar» | APG *Menu* |
| 6 | **Activar:** Enter y Espacio. Una **acción cierra** el menú y **devuelve el foco** al disparador. Una **casilla o una opción no cierran** (se pueden cambiar varias seguidas); Esc cierra. Un elemento **deshabilitado** no hace nada ni cierra. Verificado | APG *Menu Item*; WCAG 3.2.2 |
| 7 | **Cerrar:** Esc cierra y devuelve el foco al disparador (y **no llega** a un ancestro, por ejemplo un diálogo); Tab cierra y el foco sigue su curso; un clic fuera cierra sin robar el foco | APG *Menu*; WCAG 2.1.2 |
| 8 | **Deshabilitado:** `aria-disabled="true"`, enfocable, con texto atenuado **y tachado** (no solo color) | WCAG 1.4.1, 4.1.2 |
| 9 | **Casilla y opción:** una marca dibujada: **cuadro con ✓** (casilla) y **círculo con ●** (opción), relleno al estar marcada; el estado lo lee el lector por `aria-checked`. Las opciones son **exclusivas dentro de su grupo**. Verificado: marcar «Cuadrícula» no cierra; elegir «Por fecha» desmarca «Por nombre» | WCAG 1.4.1 |
| 10 | **Peligroso:** marca de forma (**▲**) y texto en negrita, además del color; el nombre accesible no cambia (lo nombra la aplicación: «Eliminar») | WCAG 1.4.1 |
| 11 | **Atajo:** texto visible al final (`aria-hidden`) y `aria-keyshortcuts` en el elemento, para no leerlo dos veces. **Icono:** decorativo (`aria-hidden`), de la aplicación | WCAG 1.1.1 |
| 12 | **Submenús:** un elemento con `aria-haspopup="menu"` y `aria-expanded`; → (en RTL, ←) o Enter o Espacio lo abren con el foco en su primer elemento; ← (en RTL, →) o **Esc cierran solo ese nivel** y devuelven el foco al padre. Al pasar el puntero se abre tras **180ms** y se cierra al pasar a otro elemento; un padre **deshabilitado no abre**. Verificado hasta **tres niveles** | APG *Menu*; WCAG 1.4.13 |
| 13 | **Posición:** debajo del disparador, alineada a su borde de inicio; si no cabe y hay más sitio **arriba**, se abre hacia arriba; el alto se limita al espacio disponible y la lista se desplaza. El submenú se abre hacia el borde final del padre y **cambia de lado** si no cabe. Verificado con un disparador a pie de pantalla (688px de lista en 737px de visor) | WCAG 1.4.10 |
| 14 | **Sigue a su disparador** al desplazar o redimensionar, y se **cierra** si el disparador sale del visor. Un desplazamiento **dentro** de la lista no la recoloca (hallazgo: recolocar al desplazar la propia lista reiniciaba su posición) | Robustez |
| 15 | **RTL:** el menú se alinea al borde de inicio del disparador (derecho), los submenús se abren hacia la izquierda y **← abre** un submenú. Las flechas y el chevron **se espejan** (el chevron es de coco) | WCAG 1.3.2 |
| 16 | **Táctil:** elementos de 36px (44px con `pointer: coarse`); tocar un padre abre el submenú (sin depender del puntero encima) | WCAG 2.5.8 |
| 17 | **Sin anuncios propios:** al cerrar, el foco vuelve al disparador; el cambio de una casilla u opción lo anuncia el lector por `aria-checked`. Si la aplicación quiere anunciar el resultado de una acción, usa su propia región | APG; WCAG 4.1.3 |

## Hallazgos para lima (contrato)

| # | Hallazgo | Prioridad | Propuesta |
| --- | --- | --- | --- |
| 1 | Nombre y alcance | Alta | `GMenu` (`g-menu`, categoría superposiciones), con `GWidget` usándolo en lugar de su menú propio |
| 2 | Modelo de datos | Alta | `items`: `[{ id, label, icon?, shortcut?, disabled?, danger?, type?: 'item' \| 'checkbox' \| 'radio' \| 'separator' \| 'group', checked?, items? }]`; un grupo lleva `label` e `items`; un elemento con `items` es un submenú |
| 3 | Estado de casillas y opciones | Alta | El componente **presenta y emite intención** (como el resto de Grana): `checked` viene de `items` y `select` emite `{ id, item, checked? }`; **la aplicación actualiza `items`**. El prototipo guarda el estado por dentro solo para ser autónomo |
| 4 | Apertura | Alta | `modelValue` (abierto, con `update:modelValue`), slot `trigger` con el alcance para el disparador (`{ open, attrs }` con `aria-*` y `onClick`/`onKeydown` listos), sin valor por defecto de texto |
| 5 | Posición | Media | `align` (`start` \| `end`) y `placement` (`bottom` \| `top`, automático por defecto); límites y ajuste por el componente |
| 6 | Slots de contenido | Media | `icon` (alcance `{ item }`) y `item` (contenido de un elemento, conservando el texto como nombre accesible) |
| 7 | Cierre al elegir | Media | Por defecto, las acciones cierran y las casillas y opciones no; una prop `closeOnSelect` para cambiarlo |
| 8 | `GWidget` | Alta | El widget sustituye su menú propio: las `actions` pasan a `items` y las acciones de la rejilla (mover, tamaños, quitar) se añaden como un separador, un grupo «Tamaño» y un elemento peligroso «Quitar»; los nombres y el comportamiento se conservan |
| 9 | Teclado y foco | Media | Sin foco nativo del popover (`popover="manual"`): el componente gestiona *roving focus*, *type-ahead*, Esc y Tab |
| 10 | Tokens | Baja | Probablemente ninguno nuevo: anchos mínimo y máximo derivados de `space` (200 y 320px con `space` 4) |
| 11 | Submenús en pantallas angostas | Baja | Con poco ancho, el submenú se superpone al padre (cascada); un menú que reemplace al padre queda fuera de v0.1 |
