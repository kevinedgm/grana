# Auditoría · el texto sigue la densidad (pieza 3, paso 5, coco)

**Pieza:** escala B «hermano menor» (`density.md` §16, `tokens.md` §5.1, #986 a #995) · **CSS:** cuatro reglas M1 al final de `packages/vue/src/styles/defaults.css`, tras las de `--g-density` · **Fecha:** 2026-10-29 · **Resultado:** sin defecto propio ni bloqueante; la parte del CLI y los temas generados son de bruno y quedan sin verificar aquí.

**Verificación propia:** `DIST=<dist con la pieza> BASE=<dist de 5ad561d> node design/lab/density-text/auditoria-verificar.mjs` sobre `banco.html` (componentes reales de `dist/`) y el playground. Ambos `dist/` se construyeron en worktrees aparte (5ad561d y 5ad561d + `defaults.css`), Vue desde `node_modules` (unpkg bloqueado), puerto 4209. La comprobación discrimina: contra el `dist/` anterior como `DIST` fallan 26 de las 172.

| Motor | Comprobaciones |
| --- | --- |
| Chromium | **172/172** |
| Firefox, WebKit | No verificados (no instalados en este entorno) |

## Criterios de `density.md` §16.6 que tocan a coco

| # | Estado | Evidencia (Chromium, tema por defecto) |
| --- | --- | --- |
| 1 Tabla por rol | Cumple | Siete roles en página, comfortable y compact: 12/16 · 14/20 · 16/24 · 20/28 · 25/36 · 31,25/40 · 39,06/48 y, en compact, 12/16 · 13,125/20 · 15/24 · 18,75/28 · 23,44/32 · 29,30/36 · 36,62/44 (± 0,02). El esperado lo calcula la prueba con la función de §16.1 y coincide con la tabla de §5.1 (0.1). Peso del título sin cambio. Valor fuera de contrato: paso 1 |
| 2 Piso de 12 | Cumple | Ningún nodo de texto del banco por debajo de 12 px con `<html>` en cada paso y con regiones |
| 3 Cajas Δ0 | Cumple | `GBtn` xs a xl, cajas de `GInput`/`GSelect`/`GTextarea` y fila de `GTable` idénticas al `dist/` de 5ad561d en los 9 juegos (página, comfortable, compact, prop, anidados); `md` 36 / 31,5 / 27. Texto centrado ≤ 1 px y sin desbordar (≤ 1 px de redondeo de la rejilla de medio píxel, que da también el `xs` de la página) |
| 4 Anidación y prop | Cumple | default en compact → 14; compact en comfortable → 13,125; compact › comfortable › compact → 13,125; con `default` al final → 14; `GBtn density="default"` en compact → 14 y 36; `density="compact"` en la página → 13,125 y 27 |
| 5 Heredados | Cumple | `GMenu` desde región compact: item = disparador = 13,125. `GDialog` sin prop en compact: 18,75 › 15 › 13,125 › 12; con `density="default"`: 20 › 16 › 14 › 12 |
| 6 `<html>` y clave (sin tema) | Cumple | `<html compact>` y clave compact (emulada con la forma de §16.5 con texto de `DEFAULTS`) → §5.1; `<html default>` sobre la clave → paso 1; región comfortable dentro → paso 1. **H5** probado: un `--g-text-body-size` a mano en `:root` vale fuera de la región (18) y la región compacta lo reasigna (15) |
| 9 P2 táctil | Cumple | `hasTouch`+`isMobile`: región compact, `<html compact>` y clave compact → paso 1 en los siete roles; `GBtn density="compact"` → 13,125; `GInput` (en región y con prop compact): texto ≥ 16 y caja ≥ 44 (pieza 1 intacta) |
| 10 Fijadas Δ0 | Cumple | Aviso de `GToaster` con acción: texto y cajas idénticos con `<html compact>`, con la clave y trasladado a un `GDialog` compact, y Δ0 frente a 5ad561d en los casos comparables (la clave no se compara con el `dist/` anterior: emula la regla nueva). `GStatusIsland`: raíz con `data-g-density="default"` y roles a paso 1 con `<html compact>` (contenido de la isla no medido; la voz no está en el banco) |
| 11 Ritmo | Cumple | Interlineado de `caption`, `body-sm`, `body`, `title-sm` = 16/20/24/28 en los tres pasos; el párrafo de varias líneas mide múltiplo exacto del renglón en compact y default |
| 12 Prosa, `GText`, `GMetric` | Cumple | `<p>` de la aplicación y `GText` body en región compact → 15/24; valor de `GMetric` md 23,44 frente a 25 |
| 13 Icono de `GBtn` | Cumple | md: 15,09 px en compact, 16,1 en página y comfortable |
| 14 Δ0 sin regiones | Cumple | Playground entero frente a 5ad561d, puntero fino (10 801 elementos, 9 363 fuera de regiones) y grueso (10 790 / 9 352): ancho, alto, tamaño e interlineado iguales; 27 regiones del playground excluidas junto con sus ancestros |
| 15 Cambio en marcha | Cumple (parcial) | `<html>` y región: el texto cambia en el siguiente cuadro; ningún `CSSTransition` ni `transitionrun` sobre `font-size`, `line-height` o `letter-spacing`; ninguna regla de `grana.css` los transiciona. **No medido:** reajuste de `GSummary`/`GBreadcrumbs` en ≤ 2 cuadros (spec de bruno) |
| 18 Grep | Cumple | Ninguna hoja de `components/` cambia; sin selector `[data-g-density…]` con descendiente; `24px`/`44px`/`16px` como en 5ad561d; sin `calc()` sobre tokens de texto; las reglas quedan tras la marca OSCURO |

## Peso (gzip -9, `dist/` de 5ad561d frente a +reglas)

`dist/grana.css`: 103 046 → 103 151 B (**+105 B**, tope +384, kiwi midió +272 sin la repetición que comprime bien). `dist/grana.js` idéntico (`cmp`). Sin entradas nuevas ni cambios de `.js`.

## Rúbrica de movimiento (`rubrica-movimiento.md`)

| Dimensión | Estado | Evidencia |
| --- | --- | --- |
| Propósito | No aplica | El cambio de densidad no se anima (§16.8) |
| Comodidad visual | Cumple | Texto y caja cambian en el mismo cuadro; renglón de lectura sin cambio de paso |
| Estabilidad | Cumple | Sin desbordes ni descentrados en los 9 juegos |
| Interrumpible / control | No aplica | Sin animación |
| Accesibilidad | Cumple | Sin movimiento nuevo; 12/16/24/44 intactos; contraste sin cambio (no se toca color) |
| Rendimiento | No verificable aquí | Solo CSS sin observador nuevo; el coste de reflujo es el de la pieza 2 y no se midió |

## Auditoría visual posterior

Captura del banco (siete roles, botones, campos, párrafo, `GMetric`, tabla en nueve juegos): jerarquía conservada, títulos más contenidos en compact sin chocar con `body`, campos y botones alineados con su texto, nada desbordado ni cortado. Sin decoración nueva, sin color nuevo.

## Defectos y notas por dueño

- **bruno:** (1) `design/lab/theme-playground/tests/campo-tactil.spec.mjs` escribe `--g-text-*` en `:root` (H5): solo vale fuera de elementos con `data-g-density`; si su página de prueba usa una región, las reglas del tema la reasignan. (2) Los bancos de `design/lab/*/auditoria-tema.css` y temas de `packages/blocks/playground/marketing/temas/` escriben `--g-text-*` a mano en `:root`; ninguno usa `data-g-density`, sin conflicto hoy. (3) Pendiente suyo: criterios 6 con tema, 7, 8, 16, 17 y el reajuste de medidores del 15.
- **mora-docs:** H3 (G5 y `GCalendar` bajan el texto pero no la caja hasta la pieza 4) y H5 en la guía de densidad.

## Límites

Solo Chromium. Sin Firefox, WebKit, Safari real de iPhone ni lector de pantalla. Sin temas generados (14/1,2 y 18/1,333) ni el CLI de bruno. La impresión de lectura del 6,25 % en pantallas reales no se juzga aquí.
