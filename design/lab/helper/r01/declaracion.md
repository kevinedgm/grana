# Declaración de cumplimiento · GHelper y GHelperScope · r01

**Estado:** aprobada. Las decisiones de estructura se derivan de estándares (WCAG 2.2 AA; patrón *disclosure* y diálogo no modal de WAI-ARIA APG; API `popover` de HTML), de la especificación del usuario y de sus tres decisiones de alcance: **solo `GHelperScope` + `GHelper`** (el avatar después), **posicionamiento extraído de `GMenu` sin dependencias**, **hoja móvil con `GDialog`**.
**Ruta:** R1 · **Fidelidad:** F2 · **Material:** kit neutral de grises; icono `circle-help` de Lucide (añadido a `scripts/icons.json`).
**Siguiente dueño:** lima → `design/contracts/helper.md`.

## Composiciones verificadas

Inline en barra de herramientas; float con `attach` `inside`, `edge` y `outside`; los 12 `placement`; contenido con otra orientación dentro de una región con `overflow: hidden`; colisión con el borde inferior del visor; scope implícito; disparador personalizado (texto); 320px (hoja); RTL.

## Decisiones de estructura

| # | Decisión | Fundamento |
| --- | --- | --- |
| 1 | `GHelperScope` es un contenedor con `position: relative` y **nada más** (sin fondo, borde, relleno ni margen) | Especificación §5–6 |
| 2 | En `float`, el disparador usa `position: absolute` respecto al **ancestro posicionado más cercano**: `GHelperScope` o, sin él, el que haya (scope implícito, p. ej. el cuerpo de un diálogo). Sin búsqueda por selector | Especificación §7; es la semántica nativa de CSS, sin JavaScript |
| 3 | El disparador **se coloca solo con CSS**: `placement` (lado + alineación) × `attach` × `offset` (en unidades de `space`). Verificado: `inside` a 8px del borde, `edge` con el centro sobre el borde (1px de diferencia por el borde de la región), `outside` a 8px fuera; los 12 `placement` caen en 3/50/97% de cada lado | Especificación §9–12 |
| 4 | En `inline`, **nada de `position: absolute`** (verificado: `static`) | Especificación §9.1 |
| 5 | `left`/`right` como **lado** se leen **lógicos** (`inline-start`/`inline-end`): en RTL se reflejan (verificado) | Especificación §10 (compatibilidad RTL). Hallazgo 3 |
| 6 | El disparador es **siempre un `<button type="button">`** con `aria-expanded`, `aria-controls` y `aria-haspopup="dialog"`; con el disparador por defecto (icono solo), nombre por `aria-label` | Especificación §22; WCAG 4.1.2 |
| 7 | El **contenido** es un **diálogo no modal** (`role="dialog"` con nombre), en la **capa superior** (`popover="manual"`) con posición fija calculada: **ningún `overflow: hidden` lo recorta** (verificado) y va **justo después del disparador en el DOM**, así que Tab entra en él sin mover el foco a mano (verificado: Tab → «Explicar») | APG (diálogo no modal); WCAG 2.4.3; especificación §23 (sin trampa de foco) |
| 8 | **Colisión:** posición pedida → opuesta → perpendiculares; en la elegida, desplazamiento sobre el eje secundario hasta quedar dentro del visor con un margen (verificado: `bottom-start` junto al fondo → `top`) | Especificación §20 |
| 9 | **Adaptación por espacio real:** si **ninguna** posición cabe, o el visor no ofrece el **ancho cómodo del contenido** (`space × 80` = 320px más márgenes), el contenido se abre en una **hoja inferior modal** (verificado a 320px) | Especificación §21 (no solo `innerWidth`: la decisión depende de si el contenido cabe); decisión del usuario (`GDialog`) |
| 10 | Teclado: Enter y Espacio abren y cierran (nativo del botón); **Esc** cierra y **devuelve el foco** al disparador; Tab navega normal (verificado) | Especificación §23; WCAG 2.1.1, 2.1.2 |
| 11 | Un **clic fuera** cierra sin mover el foco; **el foco que sale** del disparador y del contenido cierra el popover | Patrón de popover no modal; evita contenido abierto huérfano |
| 12 | **Un solo helper abierto a la vez**: abrir uno cierra el anterior | Consistencia con los popovers `auto` de HTML |
| 13 | En la hoja, el comportamiento es el de `GDialog`: foco atrapado, Esc cierra, el foco vuelve al disparador (verificado con el `<dialog>` del prototipo) | Especificación §23; decisión del usuario |
| 14 | Foco visible del disparador con el sistema de Grana (el prototipo usa 3px; el final lo pone coco con `--g-focus-*`); con `pointer: coarse`, disparador ≥ 44px | Especificación §24; `tokens.md` §7 |

## Criterios revisados

| Criterio | Resultado | Cómo |
| --- | --- | --- |
| WCAG 1.4.10 Reajuste | Cumple | 320px: `scrollWidth` = 320; el contenido pasa a hoja |
| WCAG 1.4.13 Contenido al pasar el puntero o al enfocar | Cumple por diseño | El contenido se abre solo por activación, se descarta con Esc y permanece mientras el foco está dentro |
| WCAG 2.1.1 / 2.1.2 Teclado, sin trampa | Cumple | Enter, Espacio, Esc y Tab verificados; sin trampa en el popover |
| WCAG 2.4.3 Orden del foco | Cumple | Contenido después del disparador en el DOM; Esc devuelve el foco |
| WCAG 2.5.8 Tamaño del objetivo | Cumple por diseño | 32px; 44px con `pointer: coarse` |
| WCAG 4.1.2 Nombre, función, valor | Cumple | `button` + `aria-expanded` + `aria-controls` + `aria-haspopup`; contenido `role="dialog"` con nombre |

## Comprobaciones ejecutadas

- Chromium (`localhost`), sin errores propios en consola.
- Geometría de `attach` y de los 12 `placement` medida con `getBoundingClientRect`.
- Teclado real: Enter, Tab, Esc (retorno del foco), Espacio; clic fuera.
- Región con `overflow: hidden`: contenido completo dentro del visor.
- Colisión con el borde inferior; 320px → hoja; Esc cierra la hoja y el foco vuelve; RTL.

## Comprobaciones NO ejecutadas

- Lector de pantalla real (anuncio de `aria-expanded`, del diálogo no modal y de su nombre).
- Contenido muy alto (más que el visor) en escritorio: se trata como «no cabe» y va a hoja; no se probó cómo se ve.
- Desplazamiento de la página con el popover abierto (se recalcula; no se midió), zoom al 200%, táctil real.
- `forced-colors` y movimiento: estilo final de coco.

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta de la ronda |
| --- | --- | --- | --- |
| 1 | `ariaLabel` con valor por defecto `'Abrir ayuda'` (especificación §13) | Alta | **Sin valor por defecto** (regla de Grana: sin textos propios, como `closeLabel`); obligatorio con el disparador por defecto, aviso en desarrollo si falta. Nombre sugerido `triggerLabel` o mantener `ariaLabel` |
| 2 | Nombre del contenido | Alta | El diálogo no modal necesita nombre: prop `contentLabel` (también título de la hoja) |
| 3 | `left`/`right` en `placement` | Alta | Se interpretan **lógicos** (inicio/fin de línea) para que RTL se refleje, o se renombran a `start`/`end` en el lado. Decidir y documentar |
| 4 | Estado abierto | Alta | `open` con `update:open` (`v-model:open`); sin `v-model`, el componente gestiona su estado |
| 5 | Slot `trigger` | Alta | Su contenido va **dentro** del `<button>` del helper (los ejemplos de la especificación: `GIcon`, `GAvatarMotion`); **no** admite controles (un `GBtn` dentro sería un botón anidado). Alcance `{ open }` para que un avatar reaccione. Aviso en la documentación |
| 6 | Slot `default` | Media | Alias de `content` (`content` gana) |
| 7 | Hoja | Media | Con `GDialog` (`mobile="sheet"`): necesita `title` (= `contentLabel`) y `closeLabel` (prop propia sin valor por defecto). Por encima de ~520px, `GDialog` se muestra centrado: aceptable cuando «no cabe» en escritorio |
| 8 | Umbral de adaptación | Media | Ancho cómodo del contenido = `space × 80`; no es un token (constante derivada de `space`, como los umbrales de `GStepper`) |
| 9 | `offset` | Media | Número × `--g-space-1`, como variable CSS dinámica en línea (`--_offset`): única excepción justificada al «sin estilos en línea» |
| 10 | Eventos | Media | `update:open` y `toggle` con `{ open, presentation: 'popover' \| 'sheet' }` |
| 11 | Posicionamiento compartido | Media | Utilidad interna (`src/utils/anchor.js`) extraída de `GMenu`, con los 12 lados/alineaciones, volteo y desplazamiento; `GMenu` pasa a usarla en la misma entrega de bruno (sus pruebas la protegen) |
| 12 | `disabled` | Baja | `disabled` nativo en el botón; no abre |
| 13 | Tokens | Baja | Sin tokens nuevos previstos: el disparador y el popover reutilizan `--g-radius-*`, `--g-shadow-2`, superficies y foco. El popover puede apoyarse en `GSurface` (`level="floating"`) |
