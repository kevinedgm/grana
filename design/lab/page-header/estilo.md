# GPageHeader · estilo (coco)

Contrato: `design/contracts/page-header.md` (DECISIONS.md #626 a #634; `tokens.md` §44 y §45). Estructura: `r01/` (kiwi). CSS: `packages/vue/src/components/GPageHeader/GPageHeader.css`. Banco: `estilo-banco.html` (`python3 -m http.server 4234` desde la raíz → `/design/lab/page-header/estilo-banco.html`, parámetros `?dark=1`, `?theme=nsa`, `?theme=<generado>`, `?zone=1`, `?rtl=1`, `?w=390`, `?slow=1`). Verificación: `GRANA_PW_PORT=4234 node design/lab/page-header/estilo-verificar.mjs` (opciones `--engines=…`, `--themes=base`, `--verbose`).

Sin cambios en `defaults.css` (el contrato no añade tokens). La zona de marca se **inyecta** en el banco (`#zone-css`) con las fuentes de §44.8 y los valores «de coco» de `design/lab/surface/r02/zona.js` mientras el bloque `[data-g-zone="brand"]` de `defaults.css` no exista; cuando exista, el banco debe quitar la inyección y volver a medir.

## Qué le da personalidad

**El zócalo es el suelo de la cabecera.** El encabezado no encoge ni se copia: se hunde, y lo que queda a la vista es su última fila. Esa fila se dibuja como un suelo y no como una barra: las pestañas **apoyan** en él (la marca de la pestaña elegida toca la línea del zócalo pegado) y las acciones se centran a su altura. Al pegarse, el suelo gana su línea y la raíz su sombra, con un fundido corto; nada más se anima, porque el movimiento lo pone la mano al desplazar.

**El título sube al ritmo de la mano.** El título compacto no tiene transición ni temporizador: su opacidad, su subida (como mucho `space × 4`) y su ancho se calculan a partir de `--_p`. Si el usuario se detiene a media página, el título se queda a medias, y si vuelve atrás, el título vuelve. Con `--_p` a 0 no ocupa ni un píxel y las pestañas empiezan donde empieza el título de la página.

**El muelle llega con masa.** En estrecho, las mismas acciones bajan al pulgar en una barra de borde a borde de la caja del encabezado que **entra con `--g-ease-spring`** en `--g-duration-slow` (decisión del usuario del 2026-10-13, que amplía #299 y corrige #632). El rebase es del 3,8 % y, para que no deje una rendija sobre el borde, un faldón del mismo fondo cuelga bajo el muelle (se anula solo cuando debajo está la voz). La salida, más corta, va con `--g-ease-out` en `--g-duration-press`.

## Decisiones de coco

| Pieza | Decisión | Por qué |
| --- | --- | --- |
| Raíz | Relleno `space × 6` arriba y a los lados (`space × 4` en estrecho), separación `space × 4` entre filas, sin relleno debajo si hay zócalo | El zócalo es el borde inferior: no hay aire bajo el suelo |
| Fondo | `--_bg` opaco con mapa de anfitrionas (`--_page-header-on`: `GSurface` elevada → `surface`, `inset` → `surface-sunken`, `GDialog` → `surface-shell`); en la zona, `--g-color-bg` resuelto en la raíz | Pegado tapa la página que pasa por debajo. Sin la regla de la zona, la anfitriona daría el tono de la página y no el de la marca (un `var()` heredado ya llega resuelto) |
| `hN` | `title-lg` en los tres niveles | El nivel es semántico; un encabezado de página es uno por vista |
| Zócalo | `block-size: max(space-12, 44px)` con el borde dentro; sangra hasta los bordes de la raíz y devuelve el relleno a `GTabs` con `--g-tabs-inset` | La primera pestaña alinea su texto con el del título (medido ±1,5 px) y el desbordamiento de las pestañas llega al borde |
| Pestañas | Apoyadas en el suelo (`align-items: flex-end`); las acciones, centradas | Con `GTabs` de 40 px en un zócalo de 48, centrar dejaría la marca 4 px por encima de la línea del pegado. Es la única desviación de «centra el contenido» |
| Línea del suelo | Solo pegado, `inset` de `--g-border-width` en `--g-color-border`; `__tabs` opaco con `--_bg` | La línea base de `GTabs` usa el mismo token. Sin el fondo opaco, las dos translúcidas se sumaban y el suelo salía más oscuro bajo las pestañas (0,08 + 0,08 de alfa) |
| Pegado | `--g-shadow-2` en la raíz; borde y sombra con `--g-duration-fast` + `--g-ease-out` | Contrato |
| Título compacto | `title-sm`, ancho máximo `space × 64 × --_p`, `opacity: --_p`, `translate: 0 (1 − --_p) × space × 4`; el hueco del principio lo da el zócalo (`padding-inline-start: --_pad × --_p`) | El título lleva `dir="auto"`: sus propiedades lógicas seguirían al texto, no a la página (en RTL el margen caía en el lado equivocado; medido y corregido) |
| Muelle | `--g-color-surface`, filo `--g-color-border-strong`, **`--g-shadow-3`**, relleno `space × 2` / `space × 4` + área segura | La sombra larga sube ≈ 12 px sobre el contenido que pasa por debajo: el muelle flota y no parece una pestaña del navegador. `shadow-2` solo sube 4 px y se pierde con el filo |
| Enlace del muelle | Bloque con `align-content: center`, elipsis, `body-sm` + `action-weight`; ≥ 24 px, ≥ 44 px con `pointer: coarse` | `text-overflow` no recorta el texto de un contenedor flex |
| `z-index` | Raíz pegada 2, muelle 3 | Encima de un `GAccordion` pegado de la página; debajo de la isla, los avisos y la barra de la aplicación |
| Regla 7 | Ni la raíz ni el zócalo llevan `transform`, `translate`, `filter`, `contain`, `container-type` ni `will-change` | El muelle es `fixed` dentro de la raíz (lo comprueba el análisis estático) |
| Impresión | Sin pegado ni sombra; muelle oculto | |

## Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Hundirse y pegarse | Sin animación | Igual |
| Título compacto | Ligado a `--_p` | `--_p` ∈ {0, 1} (lo hace el `.vue`) y `translate: none` |
| Línea y sombra del pegado | `fast` + `ease-out` | Se quedan (color y sombra) |
| Muelle que entra | `translate` en `slow` con **`--g-ease-spring`** dentro de `@supports (transition-timing-function: linear(0, 1))`; fuera, `ease-out`. Opacidad `fast` + `ease-out`. Punto de partida con `@starting-style` (el `.vue` ya pone `is-open` un cuadro después) | Solo fundido de opacidad en `fast`; `translate: none` también en `@starting-style` y dentro de `@supports` |
| Muelle que sale | `press` + `ease-out` | Fundido `fast` (el `.vue` pone `hidden` al instante) |

## Medidas (Chromium, Firefox y WebKit)

`estilo-verificar.mjs` (2026-10-14): **1284 comprobaciones** en Chromium, Firefox y WebKit con los 13 temas (por defecto, NisaNabani y los once de `dark-color-presence/generated/`), claro y oscuro, más la zona (por defecto y NisaNabani, claro y oscuro); todas correctas tras filtrar un aviso de descarga de la fuente de Firefox con la máquina cargada (no es del componente). Las cifras de contraste coinciden en los tres motores.

| Tema | `h1` | descripción / antetítulo | pestaña / elegida | principal | foco | ruta | muelle título / principal |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Defecto claro | 17,40 | 7,46 | 7,46 / 17,40 | 16,48 | 5,69 | 5,00 | 17,40 / 16,48 |
| Defecto oscuro | 16,46 | 9,29 | 9,29 / 16,46 | 16,19 | 4,95 | 4,52 | 15,22 / 16,19 |
| NisaNabani claro | 17,42 | 7,47 | 7,47 / 17,42 | 11,57 | 4,64 | 4,65 | 17,42 / 11,57 |
| NisaNabani oscuro | 16,46 | 9,29 | 9,29 / 16,46 | 5,60 | 11,07 | 9,26 | 15,23 / 5,60 |
| Zona · defecto (claro y oscuro) | 16,48 | 10,90 | 10,90 / 16,48 | 16,48 (tinta invertida) | 5,59 | 10,90 | 16,48 / 16,48 |
| Zona · NisaNabani (claro y oscuro) | 11,57 | 8,11 | 8,11 / 11,57 | 11,57 (tinta invertida) | 6,95 (lima) | 7,64 | 11,57 / 11,57 |

**La banda pegada frente a la página** (fondo de la banda / línea del suelo contra la página que pasa por debajo):

| Caso | banda / página | suelo / página | filo del muelle / página |
| --- | --- | --- | --- |
| Zona defecto, claro | 16,48 | 9,89 | 6,04 |
| Zona defecto, **oscuro** | **1,12** | 1,86 | 3,05 |
| Zona NisaNabani, claro | 11,57 | 7,15 | 4,71 |
| Zona NisaNabani, oscuro | 1,59 | 2,58 | 3,91 |
| Sin zona (referencia), defecto oscuro | 1,00 | 1,32 | 2,06 |

**Conclusión:** en el oscuro del tema por defecto la banda casi no se separa por su fondo (1,12:1, el valor que preveía §44.2), pero **pegada sí se separa por su suelo**: la línea del zócalo de la zona (`border` = tinta al 16 %) da 1,86:1 frente a la página, más que la línea de una cabecera sin zona en la misma página (1,32:1), y la sombra `shadow-2` de la zona es la densa del oscuro. **En reposo** (sin pegar, sin línea), la banda solo se separa por su fondo: 1,12:1. Ahí `GPageHeader` sí necesitaría `zone-edge`; se devuelve a lima (ver Pendientes). El muelle siempre se separa por su filo (≥ 3,05:1).

## Colores forzados, RTL y táctil

- `forced-colors` (Chromium): el suelo pegado lleva `border-block-end` `CanvasText` (el `inset` de `box-shadow` desaparece con los colores forzados); el filo del muelle pasa a `CanvasText`; el faldón se oculta. El zócalo sigue midiendo 48 px con el borde. El foco es el del sistema.
- RTL: todo lógico salvo la caja física del muelle, que da el `.vue`. Título compacto al principio lógico (derecha), acciones al final (izquierda), enlace del muelle a la derecha.
- `pointer: coarse` (Chromium y WebKit con `isMobile`; Firefox sin emulación de puntero): enlace del muelle ≥ 44 px; los `GBtn` traen su diana de 44 × 44.

## Pendientes

- **lima:** la banda de zona en reposo no se separa de la página en el oscuro del tema por defecto (1,12:1). Pegada se separa por el suelo (1,86:1). Si se quiere el filo también en reposo, la excepción de §44.2 se amplía a `GPageHeader.css` (`border-block-end` de la raíz con `zone-edge` solo dentro de la zona; obliga a restarlo del alto o a dibujarlo con un `inset`, porque el zócalo es de alto fijo).
- **bruno:** el `GBreadcrumbs` del slot `trail` arranca 8 px por dentro del título (su propio relleno de pastilla). No es del encabezado (el contrato no deja estilizar piezas internas); se mira en la auditoría.
- **coco (auditoría):** sustituir la zona inyectada por el bloque real de `defaults.css`, medir hover/activo/deshabilitado dentro de la zona, `GMenu` abierto en el muelle y el componente real de bruno.
