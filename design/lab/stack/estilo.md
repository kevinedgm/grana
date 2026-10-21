# GStack · estilo (coco)

**CSS:** `packages/vue/src/components/GStack/GStack.css` · **Contrato:** `design/contracts/stack.md` (#717, #719, #723) · **Banco:** `design/lab/stack/estilo-banco.html` · **Verificación propia:** `node design/lab/stack/estilo-verificar.mjs` (Playwright de `design/lab/theme-playground`; 2962/2962 en Chromium, Firefox y WebKit).

## Qué le da personalidad aunque no tenga forma

La separación es una **relación**, no una cifra: `sm` «va con lo anterior» (`space × 3`), `md` «lo siguiente» (`× 6`), `lg` «otro tema» (`× 12`), y `density` la escala 1 · 0,875 · 0,75. Todo sale de **un solo alias `--_gap`** calculado sobre `--g-space-1`, así que cambiar `space` en el tema cambia el ritmo de una pantalla entera (medido con `space 5`: md 30 px) y nunca hay un número a mano. La pila es la **única fuente de aire**: los márgenes de bloque de sus hijos valen 0 en la capa de Grana, de modo que un `p` y un `h3` no suman su margen al `gap` (y una regla de la aplicación sin capa sigue ganando, #516, medido). No tiene superficie, ni movimiento, ni estados.

## Decisiones de estilo

- `--_gap` y `--_d` son alias locales; las constantes `3`, `6`, `12`, `0,875`, `0,75` son relación del contrato (#717), no tema. Ningún literal de medida, ningún token nuevo, ningún respaldo.
- En horizontal siempre `flex-wrap: wrap` (1.4.10): medido a 320 px, varias filas, sin desplazamiento, con la misma separación entre filas y columnas.
- `horizontal`/`vertical` usan `flex-start`/`flex-end`: **lógicos**, siguen RTL sin reglas aparte (medido en LTR y RTL).
- `divided`: la línea es el **borde del hijo** (`--g-border-width`, `--g-color-border`), nunca un fondo, para que sobreviva a `forced-colors` (medido: borde sólido visible en Chromium con colores forzados). Se selecciona con `~` y `:not(.g-tooltip, [hidden])`, así un hijo `hidden` entre dos no deja a uno sin línea. Distancia entre contenidos = `2 × gap` + grosor de la línea (medido en `default` y `compact`).
- Todos los selectores de hijos excluyen el nodo hermano de `GTooltip` (`:where(:not(.g-tooltip))`, #383; medido con el popover abierto: la separación no cambia).

## Mediciones

| Qué | Resultado |
| --- | --- |
| `gap` none/sm/md/lg con `space` 4 | 0 · 12 · 24 · 48 px (con `space` 5: 0 · 15 · 30 · 60) |
| `density` comfortable / compact (md) | 21 · 18 px; sm y lg proporcionales |
| Margen de hijos directos | `0px/0px` en `p`, `h3`; la regla sin capa de la aplicación gana (10 px) |
| `divided` | línea en cada visible salvo el primero, ninguna tras el último, `hidden` ignorado, `2 × gap + borde` |
| Horizontal a 320 px | parte en filas, separación = `gap`, sin desborde (LTR, RTL y «Tema de prueba») |
| Temas | defecto claro/oscuro, «Tema de prueba» (`space` 5, Georgia, borde 2 px), RTL, notion, caracol-purpura y spotify claro/oscuro |
| Consola | limpia en los tres motores |
| Peso | `GStack.css` ≈ 400 B gzip minificado; con `GSection.css`, 664 B gzip juntos (ver `design/lab/section/estilo.md`) |

## Encargos

**bruno:** `GStack.vue` con las clases del contrato; matiz medido: `g-stack--h-*` actúa en **los dos ejes** (en vertical es el ancho de los hijos; en horizontal, dónde va la fila), `g-stack--v-*` solo con `orientation="horizontal"` y `g-stack--divided` solo con `orientation="vertical"` (como dice el contrato, el `.vue` no las pone si no actúan). Sin `h`/`v` no se pone clase: el CSS ya estira (vertical) y centra (horizontal). El CSS de GStack **no** está en el JS: va a `grana.css` por `components.css`. Para medir el peso del `.vue` no cuentes el CSS. El banco incluye la fábrica `stack()` que reproduce lo que debe emitir el `.vue`.

**lima:**
1. **Límite de `divided` que el contrato no cita:** la línea es el borde superior del hijo y el aire bajo la línea es su `padding-block-start`, así que **un hijo con superficie propia** (`GSurface`, `GCard`) pinta ese aire con su fondo, y un hijo con su propio `border-block-start` o `padding-block-start` lo pierde. Propongo añadir a «Reglas de los hijos»: `divided` es para hijos **sin superficie ni borde superior**; para tarjetas, usa `gap`. No hay alternativa sin elemento extra por hijo (un pseudoelemento cae dentro del mismo hijo y un `box-shadow` desaparece en `forced-colors`).
2. Un hijo que la aplicación oculta con una clase (`display: none`) sigue contando (límite ya anotado en el contrato, regla 3).
3. Ningún token nuevo hace falta.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos:** sin literales de tema, respaldos ni tokens nuevos; gap, density, márgenes de hijos, #516, #383, `divided`, alineaciones lógicas y partición en horizontal medidos en Chromium, Firefox y WebKit con cinco temas (defecto, «Tema de prueba», notion, caracol-purpura, spotify; claro y oscuro) y RTL; `forced-colors` de `divided` medido en Chromium; sin movimiento (rúbrica de movimiento: no aplica).
**Correcciones:** ninguna sobre contrato; el selector de `divided` usa `~` en lugar del `+` del prototipo de kiwi (con un `hidden` entre dos hijos el `+` dejaba al segundo sin línea).
**Pendientes:** decisión de lima sobre el límite de `divided` (arriba); `forced-colors` en Firefox y WebKit no se emula en Playwright (no verificable ahí); el contraste de la línea de `divided` (`--g-color-border`, decorativa: la separación también la da el aire) no se midió porque el contrato no la exige; no se ha medido el `.vue` ni la compuerta de peso (de bruno).
