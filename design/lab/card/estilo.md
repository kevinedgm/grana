# Entrega de coco · GCard.css, tokens `--g-card-*` y `--g-surface-padding`

**Archivos:** `packages/vue/src/components/GCard/GCard.css`; valores de `--g-card-{hover|pressed|selected|scrim|on-scrim}` en `styles/defaults.css` (claro, oscuro por media y `[data-theme="dark"]`); una línea en `GSurface/GSurface.css` (`--g-surface-padding: var(--_pad)`, no cambia nada visible).
**Contratos:** `design/contracts/card.md`, `surface.md` («Cambio aparte»), `tokens.md` §19 (DECISIONS #123 a #135).
**Banco:** `design/lab/card/estilo-banco.html` (marcado exacto del contrato; 15 secciones, las 12 composiciones; `?dark=1`, `?rtl=1`, `?theme=<generado>`, `?test=1`). El script hace lo que hará bruno (ResizeObserver, `is-selected`, `aria-pressed`, `is-expanded`, recorte, menú, pliegue de «más»).

## Carácter propio
- **Silencio:** una sola raíz `GSurface`; el hover no mueve nada: un **velo** translúcido (`::before`, bajo el contenido) más un paso de borde; en `raised`, `shadow-2`. Título subrayado fino solo en hover.
- **Selected:** borde de doble grosor **sin cambiar el tamaño** (borde de la raíz + anillo interior en `::after`), indicador (casilla/radio con `check`/`circle`), fondo `--g-card-selected` en el `::before` (con indicador, nace de él: «Personalidad», C2). **Current:** borde + fondo + `chevron-right` (sin anillo doble ni indicador).
- **Foco:** anillo hacia dentro en `::after` de la raíz (`:has(:focus-visible)`), con halo de `surface` (o del velo) para verse sobre media; `outline-offset: -max(focus-width, focus-offset)` (no sale de la raíz aunque el tema cambie el ancho).
- **Status:** marca de borde de inicio de **forma** distinta (error sólida, aviso discontinua, info de puntos, éxito doble) + icono + texto; fondo `-soft`, texto `--g-color-text`.
- **Velo de media de fondo:** gradiente que parte del token (mínimo = token, más fuerte abajo); botones de `GBtn` reasignados por sus alias (sólido = plano `on-scrim` con texto del tono del velo opaco).
- Radios: media a sangre con el radio interior de la raíz; inline, inset, status y vacío con el concéntrico publicado por `GSurface`.

## Valores (defaults.css)
| Token | Claro | Oscuro |
| --- | --- | --- |
| `--g-card-hover` | `rgb(0 0 0 / .03)` | `rgb(255 255 255 / .04)` |
| `--g-card-selected` | `rgb(0 0 0 / .045)` | `rgb(255 255 255 / .06)` |
| `--g-card-pressed` | `rgb(0 0 0 / .07)` | `rgb(255 255 255 / .09)` |
| `--g-card-scrim` | `rgb(0 0 0 / .62)` | `rgb(0 0 0 / .68)` |
| `--g-card-on-scrim` | `#FFFFFF` | `#FFFFFF` |
Velos sobre la anfitriona (orden hover < selected < pressed). Velo, peor caso analítico (media blanca, parte alta sin refuerzo): blanco sobre 255×(1−a) → 6.2:1 claro, 8.0:1 oscuro.

## Decisiones y desviaciones
1. **Selección: clases no listadas en el contrato** `g-card__selectbox` (envoltorio) y `g-card__tick` (+ `--static` para `toggle`), con el `<input class="g-card__select">` justo antes del `tick`. Un `<input>` no puede contener un icono Lucide. Para lima/bruno.
2. **Recorte:** el contrato no dice cómo llega el número de líneas; el CSS usa `data-lines="1|2|3|4|none"` en `g-card__title` y `g-card__description`. `is-expanded` en la raíz lo anula.
3. **Esqueleto:** clases propuestas `g-card__skeleton` (sustituye al `body`, usa dentro las clases reales de región) y `g-card__sk` (+ `--eyebrow|title|meta|footer|btn|circle`; ancho por `--_sk-w` en línea). **Tono:** `--g-color-border-strong`, no `surface-sunken` (1.07:1 sobre blanco, invisible, y es el fondo de una `inset`); sin animación con movimiento reducido.
4. **Línea del pie:** `--g-color-border` (≈1.2:1), no 3:1 como pide el hallazgo 15: es separador decorativo (WCAG 1.4.11 no la exige; el brief pide «borde ligero»). Con `prefers-contrast: more` sube a `border-control`. Si lima la quiere a 3:1, una línea.
5. **Modo lista:** se activa con `li.g-card.g-card--orientation-horizontal.g-surface--level-flat` (no hay clase propia).
6. `aspect-ratio: 16 / 9` literal (proporción sin unidad) en media top/inline; el consumidor puede fijar el suyo.
7. **Textos de control** («mostrar más», pie) en `text-muted`/`text`, no en acento: sobre los velos de selected/pressed del oscuro el acento bajaba de 4.5:1.
8. `forced-colors`: velos fuera, anillos `Highlight`, indicador `Highlight/HighlightText`, media de fondo y velo ocultos (texto `CanvasText`), marcas de status `CanvasText`.
9. Alturas iguales/naturales: son de la rejilla del consumidor (`align-items`); la tarjeta no fija `block-size`.
10. **Selección que se funde:** la selección (tinte por `--_card-selected` registrada, anillo interior, borde e indicador con su ✓) se funde en `--g-duration-fast`, también con movimiento reducido (es color). Desde el plan 017 el tinte vive en el `::before` (lo hereda de la raíz) y, con indicador y sin movimiento reducido, en vez de fundirse nace de la casilla (C2). El chevrón de «Mostrar más» gira en `--g-duration-press` con `--g-ease-out`, como `GSelect` y `GSidebar`.

## Personalidad (#303, plan 017): la selección nace de la casilla y la luz sigue al puntero

Qué le da carácter: **causa y efecto sin mover nada** (#127). Lo que marcas es de donde sale el cambio, y la tarjeta interactiva «responde» a la luz del puntero mientras la estática no; todo es pintura, la caja nunca cambia.

### C2 · la selección nace de la casilla (solo CSS)
- **Forma:** el tinte `--g-card-selected` es un círculo `farthest-corner` en el `::before` que crece desde el **centro del indicador** (casilla o radio; en `toggle`, el ✓ estático) hasta la esquina más lejana, y al desmarcar se **recoge hacia él**. El borde doble y el ✓ siguen fundiéndose (plan 008): la selección no depende del círculo.
- **Origen sin JS (anclaje):** el indicador lleva `anchor-name: --g-card-select` (con `anchor-scope` en cada tarjeta: las anidadas no se cruzan). El `::before` usa en las cuatro inseta la misma expresión, `min(0%, calc(anchor(--g-card-select center, 50%) * 2 - 100%))`: cada lado mide desde sí mismo, así que la capa queda **centrada en el indicador** con medio lado igual a la mayor distancia a los bordes y su `farthest-corner` es exactamente la esquina más lejana (LTR, RTL, horizontal con media lateral, `compact`, modo lista). La raíz recorta (`overflow: clip` con su radio). No hizo falta `--_select-x/y` (siguen reservados en `card.md`).
- **Tiempo:** crecer `--g-duration-slow` con `--g-ease-out` (bloque que llega); recoger `--g-duration-press` (la salida, más corta, #152) y el color se apaga con un retardo igual a la recogida (`0s` de duración), así el círculo se ve volver a la casilla.
- **WebKit (26.6) cancela las transiciones de un elemento colocado con `anchor()`** (cualquier propiedad, medido en una página mínima). Por eso el velo, el tinte y el radio (`--_card-veil`, `--_card-selected`, `--_card-reach`, registradas) se animan **en la raíz** y el `::before` los hereda (`inherit`): verificado en vídeo de WebKit y de Chromium (el círculo crece desde la casilla y se recoge). Dos rarezas de WebKit sin pintar que no afectan al usuario: `page.screenshot` da por terminadas las transiciones de propiedades registradas (en el vídeo sí se ven los intermedios) y `getComputedStyle(::before)` puede tardar en reflejar lo heredado hasta el siguiente pintado (el spec lee la raíz).
- `--_card-reach` es `<percentage>` (0 % ↔ 100 %): WebKit no interpola `<length-percentage>` entre una longitud y un porcentaje.
- **Sin indicador** (`button`, `link` sin `selectable`, `current`), **sin anclaje** o con **movimiento reducido**: capa = tarjeta y el tinte se funde como en el plan 008. `forced-colors`: sin `::before` (la selección es el anillo `Highlight`).

### C1 · la luz sigue al puntero (CSS listo; el dato lo escribe `GCard.vue`)
- **Halo** en el fondo de la raíz (bajo el velo y el tinte): dos capas `radial-gradient(circle calc(space × 40) at var(--_pointer-x) var(--_pointer-y), var(--_card-glow), transparent)` con `background-origin: border-box` (el dato se mide desde la caja de borde). **Concentración:** dos capas del **mismo** `--g-card-hover` (sin token nuevo ni mezcla con otro color; `color-mix` solo puede diluir el alfa): en el centro, velo + halo ≈ 3 × el velo (claro: 255 → 231; oscuro: 28 → 53), cae a 0 en `space × 40`.
- **Aparece y se va** con el hover: `--_card-glow` (registrada) se funde en `--g-duration-press`; la **posición no se transiciona** (sigue al puntero en el mismo cuadro). **Al apretar** se apaga y manda el velo de pulsación: con halo, pulsada + seleccionada en oscuro bajaba a 4,40:1.
- **No hace nada sin el dato:** sin `--_pointer-x/y` el gradiente no es válido y `background-image` queda en `none`. Solo con `(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)`, en `is-interactive` sin `is-disabled`/`is-loading` ni media de fondo; `forced-colors`: fuera.

### Medidas (`design/lab/theme-playground/tests/personalidad-card.spec.mjs`, tres motores)
| Qué | Resultado |
| --- | --- |
| C2 origen (7 modos: casilla, radio, toggle, horizontal con media lateral, compact, RTL, lista) | Δ 0,00px en x e y; radio = esquina más lejana del relleno (≤ 1,1px, el borde) |
| C2 crecer / recoger | 240ms `ease-out`: 0 → 39,8 → 77,5 → 96,6 % (10, 25, 50 % del tiempo); 160ms al recoger, con el tinte puesto hasta el final; caja Δ0, `transform: none` |
| C2 píxeles (Chromium, Firefox) | a 35 % del tiempo (89 %): tinte junto al indicador y esquina lejana sin teñir; al final, teñida |
| C2 con `reduce` | capa = tarjeta, radio fijo 100 %, el tinte se funde en 120ms |
| C1 centro | centroide del halo = puntero (330,00; 230,00) en los tres; caja Δ0, `transform: none`, velo conservado; salto de 80px en el siguiente cuadro |
| C1 sin halo | `reduce`, táctil 375px (`hover: none`; Chromium y WebKit), `forced-colors` (Chromium), no interactiva, media de fondo |
| Contraste en el centro del halo (texto / atenuado) | defecto claro: hover 14,07 / 6,03; sel.+hover 12,81 / 5,49; sel.+pulsada 13,56 / 5,81 · defecto oscuro: 10,96 / 6,18; 9,12 / 5,15; 9,85 / 5,56 · spotify claro: 14,08 / 5,97; 12,82 / 5,44 · spotify oscuro: 11,14 / 6,27; 9,28 / 5,22 (Chromium; Firefox y WebKit ±0,15) |

Mientras `GCard.vue` no escriba `--_pointer-x/y`, el spec instala un sustituto mínimo (las dos variables en `pointerenter`/`pointermove` de ratón o lápiz) y lo anota; cuando el componente las escriba, mide el real sin cambios.

## Verificación (Chromium, Playwright; contraste medido por píxeles con el texto oculto, animaciones en reposo)
Temas: defecto claro/oscuro, «Tema de prueba» (serif, borde 2px, space 5px) y los 10 generados × claro/oscuro. Mínimos en los 23:
| Medida | Defecto claro / oscuro | Mínimo en todos |
| --- | --- | --- |
| Título / texto muted / meta dt | 17.4 / 7.46 / 7.46 · 15.2 / 8.59 / 8.59 | 15.2 / 6.99 / 6.99 |
| Hover · descripción; pressed; selected; selected+hover | 6.96; 6.37; 6.78; 6.31 | 6.52; 5.96; 6.35; 5.91 |
| Marca de selected (borde, anillo, indicador) / tono | 14.99 / 13.0 | 3.87 (stripe oscuro) |
| Icono del indicador / relleno | 16.5 / 16.2 | 4.70 |
| Casilla sin marcar / tarjeta | 3.45 / 4.32 | 3.43 |
| Foco / tarjeta; foco / velo blanco | 5.69 / 4.58; 9.9 | 4.52; 9.89 |
| Iconos de status (marca) | 4.8–5.0 / 4.1–4.2 | 4.13 |
| Texto sobre velo (media blanca, el peor) | título 7.46; 9.29 oscuro | 7.23 |
| Botón sólido sobre velo: texto/plano | 21 | 21 (tras corregir color relativo con alpha) |
- **Hover:** velo `.03`, `transform: none`; sobre una acción interna el velo es transparente. **Pressed:** `.07`.
- **Tamaños:** ratón: menú 32×32, casilla 24×24 (indicador 20), «mostrar más» y enlace del pie 24 de alto, botón estrecho 40; táctil (`pointer: coarse`): 44 en todos. Solo icono de `GBtn` 36 (su `::after` da 44).
- **320px:** sin desborde de página ni de tarjeta; `data-size` correcto (260px `narrow/column`, 560px `wide/row`; sidebar y diálogos 360/680 probados en el banco). **RTL**, **forced-colors**, **prefers-contrast**, **táctil** y **movimiento reducido** revisados. Consola sin errores.
- `npm run build` y las tres compuertas OK. `vitest`: 1004 de 1006; fallan `levels.test.js` (lee `--g-surface-padding`, previsto: bruno) e `icons.test.js` (previo a esta entrega: `icons.md` §4 trae `circle-check`, `image`, `info`, `map-pin`… que el script no tiene).

## Hallazgos para bruno
1. `levels.test.js`: aceptar `--g-surface-padding` leído sin declarar (tokens.md §19).
2. Registrar `GCard.css` en `components.css` **después** de `GSurface.css` + compuerta `grep -q "g-card--media-background" dist/grana.css`. Hoy `dist` solo trae los tokens.
3. Iconos: `info` (y `image`, `map-pin`, `play` si se usan en docs) faltan en `lucide-icons.js`/script; el banco los inyecta con la geometría de Lucide.
4. Marcado: `g-card__selectbox` + `g-card__tick`; `data-lines`; `g-card__skeleton`/`g-card__sk*`; `g-card__meta-item` como elemento de `meta`; `g-card--layout-*`/`--size-*` además de `data-*`; `is-expanded` en la raíz. La media `end` funciona esté primera o última en el DOM; el scrim puede ir dentro o fuera de la media.
5. `GIcon` hijo directo de `g-card__menu`, `__current`, `__status`, `__tick`, `__empty`.
## Hallazgos para lima
1. Hallazgo 15, línea del pie: ver decisión 4. 2. Documentar las clases y `data-lines` de arriba. 3. Radio concéntrico de una `inset` bajo una `inset` con superficie intermedia: en el banco (sec. 14) la tarjeta nueva dentro de una inset se ve bien; sin fallo, el consumidor no necesitó `rounded`.

## No ejecutado
Firefox/WebKit (`:has()`, `line-clamp`, color relativo, `overflow: clip`), `forced-colors` real de Windows, lector de pantalla, zoom 200%, táctil con dedo, rendimiento con cientos de tarjetas.
