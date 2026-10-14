# GMenu · r02 · Elementos que son enlaces · brief

**Dueño:** kiwi · **Origen:** integración real de Grana (página de Notion «Hallazgos de integración real», hallazgo 12, P2) · **Ronda previa:** `design/lab/menu/r01/` y la personalidad M1/M4 (#305, #308).

## Problema

Los elementos de `GMenu` son siempre `<button>`. Un menú de cuenta («Perfil», «Ajustes», «Documentación», «Cerrar sesión») resuelve sus destinos en `select` con `window.location`. Consecuencias medidas en la integración:

- no se pueden abrir en otra pestaña (Ctrl/⌘+clic, clic central, Mayús+clic);
- no se puede copiar el enlace ni usar el menú contextual del navegador sobre el destino;
- el navegador no enseña la URL (barra de estado) ni la vista previa de enlace al mantener pulsado en móvil;
- un router tiene que reimplementar la guarda de modificadores en cada aplicación (lo que #505 prohíbe repetir).

Propuesta del reporte: un elemento con `href` (+ `target`) pintado como `<a role="menuitem">`.

## Qué decide esta ronda

Extensión de API y de comportamiento, no una forma nueva: el menú se ve igual (M1, M4, densidades, marcas). La ronda fija:

1. Anatomía del elemento-enlace y campos de `items` (`href`, `target`, `rel`, `external`, `current`).
2. Teclado (Intro, Espacio, con y sin modificadores), clic central, Ctrl/⌘+clic, Mayús+clic, Alt+clic, menú contextual del navegador, toque largo.
3. `navigate` (regla común #505, sin la excepción #523) y su relación con `select`.
4. Cierre del menú y destino del foco en cada gesto.
5. Cómo se ve un enlace a otro sitio y uno que abre pestaña nueva.
6. `aria-current` para la página actual.
7. Enlace deshabilitado.
8. Mezcla de enlaces y acciones en el mismo menú.
9. Qué aporta Grana más allá del `<a role="menuitem">` genérico: **conceptos A, B y C** sobre el destino.

## Solapes revisados (no duplicar)

| Componente | Qué comparte | Frontera |
| --- | --- | --- |
| `GSidebar` | `href` + `navigate` cancelable `{ item, event }`; `aria-current="page"`; enlace deshabilitado sin `href` | La barra es **navegación del sitio**; `GMenu` es un **botón de menú de acciones** que puede llevar algunos destinos (menú de cuenta, «Abrir en…», «Ver documentación»). Navegación principal con muchos destinos sigue en `GSidebar` |
| `GBreadcrumbs` (puertas) | Lista de enlaces en un panel anclado, `aria-current="true"` + `check` para «el de esta ruta» | Las puertas son **disclosure** de enlaces (`role="menu"` descartado allí a propósito); `GMenu` mantiene `role="menu"` porque mezcla acciones, casillas y submenús |
| `GTag`, `GCard` | Regla de #505 y atributos del enlace (`target`, `rel`, `download`…) | Mismos nombres de campo; mismo trato del enlace deshabilitado (sin `href`) |
| `GTooltip` | Mostrar información al pasar | No se usa para el destino: un tooltip sobre un elemento de menú pisa al submenú y al resaltado M1. El concepto B lleva el destino **dentro** de la lista |

## Fuentes

- WAI-ARIA APG, *Menu Button* (ejemplo «Navigation Menu Button», enlaces con `role="menuitem"`) y *Menu*.
- HTML: activación de `<a>` (Intro sí, Espacio no), `auxclick`, `noopener` implícito con `target="_blank"`.
- WCAG 2.2: 2.4.4 propósito del enlace, 3.2.5 cambio a petición (G201: avisar de ventana nueva), 4.1.2, 1.4.1, 2.5.8.
- `docs/contract/api.md` «Enlaces y `navigate`» (#505, #523); `design/contracts/menu.md`; `design/contracts/sidebar.md`; `design/contracts/tag.md`; `design/contracts/breadcrumbs.md`.

## Entregables

- `index.html` + `r02.css` + `r02.js`: prototipo con el **CSS real de `GMenu` y los tokens del tema por defecto** (`packages/vue/dist/grana.css`), base funcional y conceptos A, B y C.
- `verificar.mjs`: comprobaciones en Chromium, Firefox y WebKit (puerto 4216).
- `declaracion.md`: puntos numerados, «Qué lo hace distinto», comparativa, hallazgos para lima y pregunta de elección.
