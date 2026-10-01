# Auditoría de coco · GCard (paso 5)

**Componente:** `packages/vue/src/components/GCard/` (`GCard.vue` de bruno, commit b98742d; `GCard.css`; contrato `design/contracts/card.md` reconciliado por lima en c7824ce, decisión #137), el real con `dist/` reconstruido (`npm run build`) y Vue global.
**Método:** Chromium con el build real en una página de medición propia (46 tarjetas: reposo con todas las regiones, entidad con casilla + `lead` + insignia + menú a 360 y 320px, hover/pressed/selected/current/selected+current/disabled, `toggle`, `button`, `select` casilla y radios en `role="radiogroup"`, cuatro `status` con «Reintentar», vacío, métrica, media de fondo sobre blanco, gris 8A, negro y degradado, media `top`/`start`/`end`/`inline`, estrecha a 260px con `more` y tres acciones, esqueleto en `outlined`, `inset` (sola y dentro de una superficie), `raised` y con media de fondo, tarjeta dentro de una `inset` y con una `inset` dentro, los cuatro niveles, lista `li` compacta y una tarjeta en una barra lateral de 280px y en un `GDialog` `sm` a 320px) más el playground real (`/playground/`, sección «Tarjetas») a 320px. Contraste **medido por píxeles** sobre el compuesto real (texto oculto; alfa de bordes y velos compuesto sobre el tono muestreado), no estimado. Temas: **defecto** (claro y oscuro), **Spotify** (marca pálida `#1ED760`; claro y oscuro, generado por el CLI), **lustre** (claro y oscuro, generado) y **tema de prueba** (Georgia, borde 2px, `space` 5, radios pequeños, granate + verde azulado). Además: táctil (`pointer: coarse`), RTL, `prefers-reduced-motion` y `forced-colors` emulados, y **Firefox y WebKit** (selección, velo, estrecha, lista, 320px con insignia larga, esqueleto oscuro, foco, menú abierto y la página entera a 320px).

## Resultado: aprobado con dos defectos de CSS corregidos aquí (hallazgos 1 y 2). Sin defectos bloqueantes en `.vue`; `status: "candidate"`

### Contraste (mínimo por fila; texto sobre su fondo efectivo)

| Medida | Defecto claro | Defecto oscuro | Spotify claro / oscuro | Lustre claro / oscuro | Prueba |
| --- | --- | --- | --- | --- | --- |
| Título, meta `dd`, enlace del pie | 17.40 | 15.22 | 17.41 / 15.31 | 17.38 / 15.23 | 15.73 |
| Eyebrow, subtítulo, descripción, meta `dt`, pie, «Mostrar más», «Más detalles», vacío, icono del menú | 7.46 | 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 6.99 |
| Texto de `status` (los cuatro) | 15.20 | 13.65 | 15.20 / 13.72 | 15.18 / 13.67 | 14.27 |
| Icono y marca de borde de `status` (3:1; misma `-text` de la familia) | 4.76 a 5.01 | 4.13 a 4.20 | 4.76 a 5.01 / 4.13 a 4.20 | 4.76 a 5.01 / 4.13 a 4.20 | 4.76 a 5.01 |
| «Reintentar» (texto / fondo `-soft`), **tras corregir** | 15.20 (antes 14.40) | 14.14 | 15.20 / 8.25 (**antes 3.96**) | 15.18 / 8.97 (**antes 4.11**) | 8.84 |
| Hover · descripción / pressed · descripción | 6.96 / 6.37 | 7.83 / 6.65 | 6.89 / 6.31 | 6.92 / 6.33 | 6.52 / 5.96 |
| Selected · descripción / selected+hover | 6.78 / 6.31 | 7.24 / 6.46 | 6.71 / 6.25 | 6.74 / 6.27 | 6.35 / 5.91 |
| Marca de selected (borde, anillo interior, borde del indicador, chevron de `current`) / tono (3:1) | 14.99 | 12.82 | **4.12** / 7.58 | **4.28** / 8.22 | 8.84 |
| Icono del indicador / relleno | 16.48 | 16.19 | 9.45 | 10.27 | 10.12 |
| Casilla o radio sin marcar · borde / tarjeta (3:1) | 3.45 | 4.32 | 3.43 / 4.35 | 3.44 / 4.33 | 4.62 |
| Radio marcado `neutral` · borde / tono | 4.85 | 3.89 | 4.80 / 3.92 | 4.82 / 3.92 | 4.66 |
| `select` marcado `accent` · borde / tono | 5.17 | 3.91 | 4.19 / 11.10 | 5.91 / 3.91 | 5.23 |
| Anillo de foco / tono de la tarjeta (3:1) | 5.69 | 4.58 | 4.61 / 13.18 | 6.50 / 4.64 | 5.77 |
| Anillo de foco sobre el velo (media blanca / negra / foto) | 9.89 / 21 / 13.24 | 12.08 / 21 / 15.03 | ídem | ídem | 9.89 / 21 / 13.24 |
| Velo, media **blanca** (peor caso): título / eyebrow / descripción / pie | 7.69 / 7.34 / 9.44 / 14.16 | 9.59 / 9.15 / 11.55 / 16.29 | ídem | ídem | 7.34 / 7.11 / 8.45 / 14.55 |
| Velo blanca: botón sólido texto / plano; plano / fondo; outline texto; link; icono del menú | 21; 10.86; 11.90; 11.90; 7.23 | 21; 13.01; 14.16; 14.16; 9.00 | ídem | ídem | 21; 9.44; 11.73; 12.82; 7.00 |
| Insignia `success` soft (de `GBadge`) | 4.76 | 4.51 | 4.76 / 4.51 | 4.76 / 4.51 | 4.76 |

Lo que **no** llega a 3:1 y es esperado: el **relleno** del indicador marcado con marca pálida (Spotify claro 1.74, lustre claro 1.60; `accent` de Spotify 1.18): el indicador se delimita por su **borde** (`-text` de la familia, 4.12 a 4.28) y el icono sobre el relleno llega a 9.45; el tono de selected sobre la tarjeta en reposo es 1.10 a 1.19 por diseño (el velo acompaña al borde doble y al indicador, nunca solo). El anillo de foco y la marca de selected comparten color en Spotify y lustre (1.02 a 2.08 entre sí): los separa el **halo** de 4px del color de la superficie y el que el anillo va 2px hacia dentro; además la selección mantiene el borde exterior y el indicador. El esqueleto (decorativo, `aria-hidden`) queda a 1.37 a 1.90:1 de la tarjeta (`--g-color-border-strong`), visible en los siete temas e idéntico sobre `inset` y dentro de una superficie.

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Tema de prueba: menú 40×40, indicador 25, `lead` 50, media lateral 140, botón estrecho 50 de alto, borde doble de 2+2px, serif y radios pequeños; Spotify y lustre cambian marca, foco, velos y familias. Nada queda fijo en el componente |
| Hover | Solo con `hover: hover`; velo `--g-card-hover` en `::before` (claro `.03`, oscuro `.04`), `transform: none`, borde a `border-control` al 70 %; sobre una acción interna el velo es transparente. Táctil: sin hover |
| Pressed | `--g-card-pressed` (`.07` / `.09`) mientras se pulsa la principal |
| Foco | Anillo `--g-color-focus` de `--g-focus-width` hacia dentro (`outline-offset` −2px) con halo `inset` de 4px en `::after`; aparece con el foco en el título **o en la casilla**, no con el foco en el menú ni en «Mostrar más» (estos llevan el suyo: menú con anillo hacia dentro 2px; botones de texto con `outline-offset`) |
| Selected / current / ambos | Selected: borde `--_mark` + anillo interior en `::after` (mismo color) + indicador relleno + velo; current: borde + velo + `chevron-right`, `::after` transparente; selected+current: anillo + chevron. Igual en Firefox y WebKit |
| Disabled | `opacity .55`, título tachado, `<a>` sin `href` con `role="link" aria-disabled="true"` (fuera del orden de Tab), `content`/`actions`/`footer` `inert`, menú `disabled`: Tab salta la tarjeta entera |
| Tamaños (puntero fino) | Menú 32×32, casilla 24×24 (indicador 20), «Mostrar más» y «Más detalles» 24 de alto, enlace del pie 24, botón de acción en estrecha 40 de alto y ancho completo (228/228 en la barra lateral), «Reintentar» 36, solo icono 36 (su `::after` da 44) |
| Táctil (`pointer: coarse`) | **44px** en menú, casilla (área e `<input>`), «Mostrar más», «Más detalles», enlace del pie y botón de acción en estrecha; también en la lista compacta |
| 320px | Playground real a 320px en los tres motores: 16 tarjetas `narrow/column`, ninguna sobresale ni desborda; la página de medición a 320px sin desborde de tarjeta en Firefox y WebKit. Entidad con casilla + `lead` + insignia + menú: título «Proyecto Atlas» en dos líneas con 106px (antes «Proy ect…»); con insignia larga el lateral pasa a la segunda línea y el título conserva 200px (ver hallazgo 1) |
| RTL | Media `start` a la derecha, chevron de `current` espejado, lateral al final de la línea, metadata y textos alineados al inicio; ningún elemento fuera de la tarjeta. (`scrollWidth` de Chromium da 68 a 209px de más en las tarjetas con media a sangre o acciones apiladas en RTL sin ningún elemento fuera: artefacto de medida, no visible) |
| Modo lista (`li` horizontal plana compacta) | Orden visual casilla → `lead` → títulos → metadata → lateral (26, 59, 108, 534, 622px), línea inferior `--g-color-border`, `aside` sin margen vertical; en Firefox y WebKit igual |
| Horizontal con `more` | 560px `wide/row` con media lateral de 160px; 260px `narrow/column`: media arriba, acciones apiladas, `more` plegado con «Más detalles» (`aria-expanded`) |
| Barra lateral (280px) y diálogo (`sm` a 320px) | `narrow/column` en ambos; en el diálogo la tarjeta mide 272px, sin desborde y dentro del visor |
| Media de fondo | Velo en `::before`-menos (`.g-card__scrim` con degradado desde el token); texto `--g-card-on-scrim`; `GBtn` sólido = plano `on-scrim` con texto del tono opaco del velo (color relativo), outline y link en `on-scrim`; menú y foco en `on-scrim`; hover cambia el borde a `on-scrim` al 70 % |
| Esqueleto | `aria-busy="true"`, `g-card__skeleton` `aria-hidden` + `inert`, **0 controles**; formas con la altura de línea real; sobre `inset`, dentro de una superficie, `raised` y con media de fondo (media a `--_sk-tone`, sin hijos); animación `g-card-pulse` 1.4s solo sin preferencia de movimiento |
| Movimiento reducido | `transition: none` en raíz, `::before`, indicador, menú y chevron; `animation-name: none` en el esqueleto |
| Colores forzados (emulados) | Borde de la tarjeta `CanvasText`, velo fuera, anillo de foco `Highlight`, selected con borde `Highlight` doble e indicador `Highlight/HighlightText`, casilla sin marcar `ButtonText` sobre `Canvas`, marcas de `status` `CanvasText`, media de fondo y escrim ocultos (texto `CanvasText`), esqueleto `GrayText`. Legible en captura; la paleta emulada no es la de Windows |
| Radio concéntrico | Raíz 8px; `status`, vacío, media `inline` y una `inset` interna 3px (publicado por `GSurface`); una tarjeta dentro de una `inset` conserva su radio (8px) y su `inset` interna se aplana (fondo transparente, borde `--g-color-border`) sin `rounded` del consumidor |
| Menú abierto | `popover` en la capa superior, visible con `overflow: clip` en la raíz; Esc cierra y devuelve el foco (Chromium, Firefox, WebKit) |
| Consola | Sin errores ni avisos en Chromium, Firefox y WebKit en la página de medición (siete temas, táctil, RTL, 320px). Ver hallazgo 5 |
| `.vue` y CSS | `GCard.vue` sin `<style>`, sin colores ni medidas (solo números de decisión en comentarios); `GCard.css` solo con `var(--g-*)`/`--_*` y las medidas permitidas (`24px`, `44px`, `1px` del texto oculto, `16 / 9`); sin valores de respaldo |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Mayor, corregido** | coco (`GCard.css`) | **A 320px el título se vaciaba** («Pr / o…», `g-card__titles` de 20px) cuando casilla + `lead` + insignia + menú no cabían: el lateral era `flex: none` y los títulos absorbían todo el recorte. Ahora `g-card__titles` tiene `flex: 1 1 0` y un mínimo de `space × 24` (≈ 8 caracteres), el encabezado admite `flex-wrap` y el lateral lleva `margin-inline-start: auto`: si no cabe, pasa a una segunda línea alineado al final; con insignia corta todo sigue en una línea (títulos 106px, «Proyecto Atlas» en dos líneas). Modo lista sin cambio (el encabezado es `display: contents`) |
| 2 | **Mayor, corregido** | coco (`GCard.css`) | **«Reintentar» por debajo de 4.5:1 con marca pálida**: el `GBtn` outline leía `primary-text` sobre el fondo `danger-soft` (Spotify claro 3.96, lustre claro 4.11). Dentro de `g-card__status` se reasignan sus alias (`--_text`, `--_on-soft` → `--g-color-text`; `--_soft` → `--g-card-pressed`): 15.2 en claro, 8.25 a 14.14 en oscuro; borde = texto (≥ 3:1) |
| 3 | Menor, corregido | coco (`GCard.css`) | La caja de `lead` medía 42×42 (contenido + borde) y no `space × 10`: `box-sizing: border-box` (40×40; 50×50 con `space` 5) |
| 4 | Decisión (pendiente 2 de bruno) | coco → **bruno** | **`chevron-down` sí va** en «Mostrar más» y «Más detalles» (ya en `icons.md` §4 y en el contrato): refuerza el gesto de desplegar y es coherente con «Más» de `GTabs`. El CSS y el banco ya lo dibujan (`.g-card__expand > .g-icon`, `.g-card__more-toggle > .g-icon`: `space × 4`, separación `space × 1`, `rotate: 180deg` con `aria-expanded="true"`, sin transición con movimiento reducido). **Para bruno:** renderizar `GIcon` `chevron-down` como **hijo directo tras el texto** en los dos botones y actualizar el pendiente correspondiente de `GCard.meta.json` (aquí solo se cambió `status`); sin el icono, los botones siguen correctos (solo texto) |
| 5 | Informativo | bruno | En **WebKit** y solo con el **playground completo a 320px** aparece `pageerror: ResizeObserver loop completed with undelivered notifications` (no en Chromium ni Firefox, no a 1280px, y **no** con las 46 tarjetas solas a 320px): no es atribuible a `GCard`; si la prueba entre navegadores se extiende a 320px, convendrá ver qué componente lo provoca |
| 6 | Informativo | lima | Deshabilitada: el `<a>` sin `href` (`role="link" aria-disabled="true"`) **no entra en el orden de Tab** (de la tarjeta anterior el foco salta a la siguiente: enlace, menú, contenido y pie quedan fuera), aunque `el.tabIndex` devuelva 0 en Chromium. Coincide con el contrato («no enfocable, se sigue leyendo»); lo que falta es confirmar con lector de pantalla real que se anuncia como enlace no disponible, junto con el nombre del `article` |
| 7 | Informativo | lima | Con una marca pálida el **relleno** del indicador marcado queda bajo 3:1 contra la tarjeta (1.18 a 1.74): lo delimita el borde `-text` (≥ 4.12) y el icono `on-*` (≥ 9.45). Cumple WCAG 1.4.11 por el borde; si se quiere además relleno a 3:1, el indicador debería rellenarse con `-text` en vez de `primary` (cambio de contrato: `tokens.md` §19 / `card.md` «Estados») |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): nombre del `article` sin `aria-labelledby` con principal, título-enlace, `aria-busy`, `role="status"`/`role="alert"`, «Acciones de Título».
- **Táctil con dedo** (pulsación larga sobre el enlace estirado, selección de texto) y **zoom al 200 %**.
- **`forced-colors` real de Windows** (solo emulado) y `prefers-contrast: more` con un tema real de alto contraste (solo revisado el CSS).
- **Rendimiento con cientos de tarjetas** (un `ResizeObserver` por tarjeta).
- **Esqueleto con datos ausentes reales** (la altura no se promete).
- Fuentes de los temas generados (Inter, DM Sans) no cargadas en la página de medición: las medidas de contraste no dependen de la fuente; las de ancho de título sí varían ligeramente con ella.
