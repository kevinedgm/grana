# coco · GAdaptiveLayout · estilo

**Estado (2026-10-05, ronda 2):** CSS adaptado a la revisión de lima (#359 a #365) y a la auditoría propia de coco (`auditoria-coco.md`, la que vale); en la ronda 2, alias de colocación registrados sin herencia por coste. El componente no tiene superficie, color, fuente, radio, sombra ni movimiento propios; no toca `defaults.css` ni el CSS de los hijos. Archivo: `packages/vue/src/components/GAdaptiveLayout/GAdaptiveLayout.css`.

> Este documento sustituye al `estilo.md` inicial que escribió Codex fuera del flujo. Sus notas de integración (#346 reveal cerrado, `[hidden]`, refinamiento C12 #348) siguen vigentes y se resumen abajo; sus «bancos» en `/private/tmp/` no existen en el repositorio y no cuentan como evidencia.

## Qué le da personalidad (regla del usuario, #362)

La identidad de `GAdaptiveLayout` no es una forma ni un movimiento: es **el reparto**. Lo que el usuario ve y en otro framework no:

1. **El contenido dice cuánto sitio necesita.** No hay filas, columnas ni breakpoints; el ancho sale de la etiqueta, el dominio del número, `maxlength`, las opciones y el chrome real del control, medidos con la fuente del tema. Con el tema de esta auditoría (Georgia 18 px, `space` 5) las líneas se recomponen solas al mismo ancho.
2. **Un campo corto parece corto aunque esté solo.** «Exterior 0–9» mide 103 px a 240 y a 1280 px: su forma anuncia qué cabe. El aire sobrante queda al final de la línea, del lado que diga `horizontal` (lógico: en RTL, `start` es la derecha).
3. **Los campos de una misma línea se alinean solos** (#348): etiqueta, caja y pie comparten pistas, de modo que una etiqueta de dos líneas no descuadra la caja del vecino. Cada caja conserva su alto propio (`align-self: start` en la pista de caja).
4. **Nada se mueve mientras escribes.** Los nodos nunca cambian de padre ni de orden; teclear no provoca ni una escritura de colocación (medido: 0 escrituras, Δ0 en todas las raíces).

**Movimiento: ninguno, a propósito.** Se exploró animar la recolocación con transiciones de `margin-inline-start` e `inline-size` (los alias cambian y CSS podría interpolar): se descarta porque solo animaría los cambios dentro de una línea (un salto de línea, `grid-row`, no se interpola), haría convivir saltos y deslizamientos en el mismo cambio, desplazaría campos bajo el cursor durante un redimensionado continuo y el motor mediría geometría a medio camino. #344 y #362 lo dejan fuera; si algún día se retoma, iría como plan en `plans/` con la condición de animar solo cambios discretos (revelado, alta/baja de un hijo), nunca el redimensionado, y con `prefers-reduced-motion` a cero.

## Integración (contrato bruno ↔ coco)

Raíz `.g-adaptive-layout`: una columna `minmax(0, 1fr)`, filas `auto`, `position: relative` (bloque contenedor del reveal cerrado). Variantes `--horizontal-{start|center|end}` (sin reglas: el motor resuelve el desplazamiento), `--vertical-{top|center|bottom}`, `--gap-{none|sm|md|lg}`, `--density-{default|comfortable|compact}`.

| Alias | Dónde | Lo escribe | Neutro en CSS |
|---|---|---|---|
| `--_adaptive-line` | hijo | bruno, línea 1-based | `auto` |
| `--_adaptive-track` | hijo | bruno, `4 × (línea − 1) + 1` con pistas compartidas | `auto` |
| `--_adaptive-width` | hijo | bruno, ancho border-box en px | `100%` |
| `--_adaptive-start` | hijo | bruno, desplazamiento desde el inicio en línea en px (#359) | `0` |
| `--_adaptive-rows` | raíz | bruno, `auto auto auto` por línea con `var(--_adaptive-row-gap)` entre líneas | `none` |
| `--_adaptive-column-gap`, `--_adaptive-row-gap`, `--_adaptive-density`, `--_adaptive-gap-factor` | raíz | coco | — |

Colocación **solo lógica**: `justify-self: start` + `margin-inline-start: var(--_adaptive-start)` + `inline-size: var(--_adaptive-width)`. Varias raíces de una línea comparten la celda de la fila; ancho y desplazamiento calculados impiden el solape (medido: cero solapes en 4 temas × LTR/RTL × 10 anchos × 3 motores). El selector repite la clase raíz (especificidad 0,2,0) para ganar a `.g-input--block` y similares aunque carguen después; el `style` en línea del consumidor sigue ganando.

**Pistas en el hijo (#364):** el CSS registra al principio `@property --g-adapt-chars` y `--g-adapt-weight` (`<number>`, `inherits: false`, inicial `0`), como `--g-form-min` en `GFormRow.css`: una pista puesta en un grupo no baja a sus campos y un valor no numérico cae a `0` (medido en los tres motores, `estilo-verificar.mjs`). Viven aquí porque las lee el motor de este componente; no en `defaults.css` (no son tema). **Ninguna regla** lee `var(--g-adapt-*)` ni selecciona `.g-adapt-*`: son datos para el JS, no aspecto; la pila sin medir las ignora. La prop `hints` desaparece.

**Alias de colocación sin herencia (ronda 2, coste):** `--_adaptive-line`, `--_adaptive-track`, `--_adaptive-width`, `--_adaptive-start` y `--_adaptive-rows` van registrados con `@property { syntax: "*"; inherits: false; }` (sin valor inicial: el neutro sigue declarado en la regla de cada hijo y de la raíz). El motor los reescribe en cada redimensionado; como alias heredables, cada cambio obligaba a recalcular el estilo de todo el subárbol del hijo (etiqueta, caja, input, iconos, espejos de `GNumberField`…). Cada alias lo lee **solo el elemento donde se escribe**, salvo `--_adaptive-width`, que también leen etiqueta y pie en las pistas compartidas (#348): esos dos nietos lo toman con `--_adaptive-width: inherit` explícito en su propia regla, así su valor calculado es exactamente el de su raíz (comprobado en `auditoria-coco-verificar.mjs` §9e) y el resto del campo no se entera. `syntax: "*"` conserva el valor tal cual (`auto`, `100%`, `Npx`, la plantilla con `var(--_adaptive-row-gap)`, que se sustituye en la raíz). Medido en Chromium, mismo banco, variantes intercaladas (20 barridos de 53 anchos cada una): estilo **654 → 398 ms**, sobrecoste frente a `GFormLayout` **10,5 → 5,4 ms por paso**; registrar solo `line`/`track`/`start`/`rows` daba 583 ms (9,0 ms por paso). Los separadores (`--_adaptive-row-gap`, densidad, factor) siguen heredables: no cambian al redimensionar.

**Separación** (#360): base `--g-form-column-gap` (en línea) y `--g-form-gap` (entre líneas) × densidad (1 · 0,875 · 0,75, los de `GFormLayout`/`GFormRow`) × factor de `gap` (0 · 0,5 · 1 · 2). Son los únicos tokens que lee el CSS.

**Vertical:** `top` = `start`; `center` y `bottom` usan `align-content: safe center | safe end` (con la forma sin `safe` antes, para motores que no la conozcan). Corrección de la auditoría (hallazgo 2): sin `safe`, un contenedor de altura fija más bajo que su contenido dejaba las primeras raíces por encima del área desplazable (−70 px con `center`, −140 px con `bottom`), inalcanzables.

**Palabras largas:** `overflow-wrap: break-word` en cada raíz hija (hallazgo 1). Parte solo lo que de verdad desborda su ancho asignado y **no rebaja el min-content** que heredan los descendientes; con el `anywhere` anterior, una `GTable` hija partía palabras de sus celdas («septiem|bre») en vez de usar su propio desplazamiento. El contrato dice `anywhere` en el párrafo de mínimos: anotado para lima.

**Reveal cerrado (#346):** solo el hijo directo `.g-form-reveal:not(.is-open)[inert]` sale del flujo (absoluto en el origen lógico, ancho 100 %, `opacity: 0`, `visibility: hidden`, sin transición): no reserva línea ni separación y sus descendientes siguen midiéndose. Abierto vuelve al grid como bloque completo. **`[hidden]`:** hijo directo con `hidden` → `display: none` con especificidad suficiente para ganar al `display: grid` de las pistas compartidas.

**Pistas compartidas (#348):** solo con `.is-ready.has-shared-tracks` y dentro de `@supports (grid-template-rows: subgrid)`. `GInput` (y `GNumberField`/`GCombobox`), `GSelect` y `GTextarea` toman `subgrid` con etiqueta en pista 1 (abajo), caja en pista 2 (`align-self: start`, conserva su alto) y pie en pista 3; la raíz pasa a `row-gap: 0` porque la separación va en la plantilla. Etiqueta y pie limitan `max-inline-size` a `--_adaptive-width`, tomado con `inherit` explícito (Firefox calculaba su alto con el ancho de toda la columna). `container-type: normal` solo en ese ámbito, como en `GFormRow`.

**Estados:** el contenedor no es interactivo: no recorta el foco de los hijos (sin `overflow`), no cambia sus colores en `forced-colors`, ni sus dianas, ni su opacidad o transiciones. `prefers-reduced-motion` no necesita regla: no hay movimiento propio (medido: ninguna animación en raíz ni hijos al recolocar, con y sin reducción).

## Evidencia

CSS fuente con alias a mano (colocación lógica en LTR y RTL, factores de `gap`, pila sin medir, `@property` sin herencia): `estilo-banco.html` + `estilo-verificar.mjs`, 14 comprobaciones por motor, 42/42 en Chromium, Firefox y WebKit. Componente real: banco `design/lab/adaptive-layout/auditoria-coco.html` (componentes reales desde `dist/`; con `?base=1` el mismo contenido en `GFormLayout`, para comparar coste) y `auditoria-coco-verificar.mjs`. Resultados y hallazgos en `auditoria-coco.md`.
