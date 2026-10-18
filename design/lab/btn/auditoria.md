# Auditoría de coco · GBtn (paso 5)

**Componente:** `packages/vue/src/components/GBtn/` (el real, con `dist/` reconstruido en el commit `d7a39c1`).
**Método:** Chromium, playground en `localhost:4173`. Se montaron los 55 botones (7 colores × 5 variantes, 5 tamaños × 3 densidades, 5 botones de icono) con el marcado del contrato y se compararon los estilos calculados bajo el tema por defecto y bajo un tema distinto, escrito sin capa como lo haría un proyecto.

## Tema de prueba

Los 7 colores cambiados (`brand` #0B1F4D, `accent` violeta, `neutral` pizarra, `success` verde azulado, `warning` ámbar oscuro, `danger`, `info`), más: `--g-font-ui` Georgia, `--g-radius-shape` 0 (y luego píldora), `--g-border-width` 2px, `--g-focus-width` 3px, `--g-focus-offset` 4px, `--g-color-focus` naranja, `--g-duration-fast` 300ms, `--g-duration-press` 250ms, `--g-press-scale` 0.9, `--g-text-action-weight` 700, `--g-text-body-sm-size/line` 15px/22px, `--g-space-1..6` en base 5.

## Resultado: aprobado

| Prueba | Resultado |
| --- | --- |
| Colores (35 botones): ¿alguno conserva un valor del tema por defecto? | Ninguno. Fondo, texto y borde cambian en todas las combinaciones |
| Radio | Con `--g-radius-shape: 0`, los 55 botones dan `0px`; con píldora, `999px` |
| Borde, fuente, peso, tamaño de letra, padding, separación interna | Cambian en todos los botones que dependen de ese token |
| Transición | `0.3s` en color, fondo y borde; `0.25s` en `transform`. Sigue el tema |
| Altura: 5 tamaños × 3 densidades con espacio base 5 y borde 2px | Exacta en las 15 combinaciones (p. ej. md 45 / 33.75 / 39.375; xs compacto con piso de 24) |
| Contraste texto/fondo en reposo (35 pares) | Todos ≥ 4.5:1. Mínimo: 5.47 |
| Contraste borde `outline` sobre fondo blanco | 5.33 a 16.48 (mínimo exigido 3:1) |
| Contraste `solid` en hover (fondo `strong` con texto `on`) | 7.56 a 12.14 |
| Foco con teclado (`:focus-visible`) | Contorno sólido de 3px, color y separación del tema (4px) |
| Área táctil del botón más pequeño | El pseudo-elemento mide 24px de alto |
| Botones de icono (5 tamaños), con el tema nuevo | Icono centrado: desvío 0,00 px en ambos ejes |
| Literales en `GBtn.css` | Ningún color; medidas literales solo `24px`, `44px` y el patrón de texto oculto. Ningún `var()` con valor de respaldo, sin `@layer` ni `<style>` |

## Hallazgos

Ninguno bloquea. El componente cumple "cambiar el tema no deja ningún valor fijo".

1. **Falso positivo descartado.** Al cambiar de tema a `--g-duration-fast: 300ms`, los colores se leyeron a mitad de transición y parecían no cambiar. Fue un artefacto de la medición: tras 500 ms, todo correcto. No es un defecto del componente.
2. **Alturas fraccionarias** (26.25, 39.375, 56.875 px con `comfortable` y espacio base 5). Ya estaba pendiente evaluar `round()`; sigue abierto.
3. **Tamaño del icono sin definir.** `GBtn.css` no fija el tamaño de los iconos de los slots; el playground usa `1em` en el SVG. Falta decidir si un token de tamaño de icono escala con el botón (xs a xl). Decisión de coco y lima; no bloquea.
4. **Nombre accesible vacío en `loading` (kiwi, `design/lab/personalidad/r01/declaracion.md`). Corregido.** `GBtn.css` ocultaba `.g-btn__label` con `visibility: hidden`, y el árbol de accesibilidad de Chromium leía «» en vez del nombre, contra `design/contracts/btn.md` (el nombre no cambia al cargar). Ahora la etiqueta lleva `opacity: 0`, `pointer-events: none` y `user-select: none`: ocupa su espacio (ancho y alto del botón sin salto, spinner centrado) y sigue en el árbol. Los huecos `prepend`/`append` conservan `visibility: hidden` (son `aria-hidden`). `forced-colors` y `prefers-reduced-motion` comprobados: la etiqueta sigue invisible y accesible, y el spinner no cambia. Prueba: `design/lab/theme-playground/tests/btn-loading-name.spec.mjs` (Chromium; falla antes, 4/4 después) y un caso en `GBtn.test.js`. No se implementa aún la propuesta B2 de kiwi (la etiqueta se funde y sube 4px), que espera decisión del usuario.

## No verificado

- **`:active` con `scale`:** no se pudo forzar `:active` en el navegador. Se comprobó el token (`0.9` con el tema de prueba) y la regla en el CSS, pero no la escala vista.
- **`prefers-reduced-motion` y `forced-colors`:** las reglas existen en el CSS (`GBtn.css:270-290`) pero no se emularon.
- **Hover y active de las variantes `soft`, `outline`, `ghost` y `link`:** solo se comprobó `solid`.
- **Tema oscuro:** no existe aún.

---

# Addendum 2026-10-18 · cierre de las «Limitaciones conocidas» del README (coco)

**Archivos:** `packages/vue/src/components/GBtn/GBtn.css` (round() de la altura; forced-colors de hover, active y enlace) y el spec nuevo `design/lab/theme-playground/tests/btn-limitaciones.spec.mjs` (13 pruebas por motor; marcado del contrato con el `dist/grana.css` real, sin Vue ni red). Se ejecuta con `GRANA_PW_PORT=4209 npx playwright test tests/btn-limitaciones.spec.mjs --workers=1` (`VERBOSE=1` imprime las tablas). Todo se midió en Chromium, Firefox y WebKit.

## 1. Altura fraccionaria · `round()`

**Cambio.** Dentro de `@supports (inline-size: round(1px, 1px))`, `--_h` pasa a `max(24px, round(space × unidades × densidad, 0.5px))`. Fuera del `@supports` queda la declaración sin redondeo (un `round()` no soportado dentro de `var()` invalidaría `--_h` en tiempo de cómputo y dejaría el botón sin alto; mismo patrón que `linear()`). El piso de 24px se aplica después del redondeo. De `--_h` salen `min-block-size`, `padding-block` y el `inline-size` de `--icon`.

**Decisión de coco: el paso es 0,5px, no 1px.** Con el tema por defecto, `comfortable` da 24,5 / 31,5 / 38,5 / 45,5px (`sm`, `md`, `lg`, `xl`; ver `estilo.md`). Redondear a enteros los movería ±0,5px (con el empate hacia arriba: 25 / 32 / 39 / 46), contra el criterio de «sin cambio con el tema por defecto». En media rejilla, una pantalla de 2× cae en píxel físico entero y el tema por defecto no cambia. El paso vive en el alias `--_snap` (un solo sitio); pasar a enteros es cambiar `0.5px` por `1px` y aceptar esas cuatro alturas nuevas. Es decisión de producto: queda para el usuario/lima.

**Padding.** No se redondea: sale de `--_h` y la suma `2 × padding + interlineado + 2 × borde` es `--_h` exacta; el contenido se centra por flex (desvío del centro ≤ 0,5px en las 45 celdas de cada tema, medido). Redondear el padding no cambiaría la altura ni el borde.

**`--_px` y el gap con densidad.** Dan fracciones horizontales (p. ej. `sm` comfortable: `space-3` 12 × 0,875 = 10,5px; gap 3,5px). No se redondean: solo mueven el ancho del botón y el texto ya tiene ancho fraccionario. `GFormSection.css` sigue leyendo `--_px` y `--_density` sin cambios.

**Hallazgo.** El «borde difuso» del README **no se reproduce estáticamente**: con una caja de 39,375px y borde de 1px en DPR 1, los tres motores pintan la línea de un píxel negro puro (se midió el píxel). El coste real de las fracciones es la deriva entre controles vecinos (un botón de 39,375 junto a un campo de 40) y el difuminado bajo `transform` (la escala de `:active`); el redondeo ataca lo primero.

| Medida (los tres motores) | Resultado |
| --- | --- |
| Tema por defecto, 5 tamaños × 3 densidades | Alturas idénticas a `estilo.md` (24/24/24, 28/24,5/24, 36/31,5/27, 44/38,5/33, 52/45,5/39) |
| `--g-space-1: 4.375px` (15 combinaciones) | Todas múltiplos de 0,5px = `max(24, round(…))`: p. ej. md 39,5 / 34,5 / 29,5 (antes 39,375 / 34,453 / 29,53); xl 57 / 50 / 42,5 |
| `--g-space-1: 4.5px` (15 combinaciones) | Todas múltiplos de 0,5px: md 40,5 / 35,5 / 30,5; xl 58,5 / 51 / 44 |
| Piso de 24px | Se respeta (xs en todas las densidades, sm compact) |
| Solo icono | Ancho = alto = alto del botón en las 45 celdas |
| Contenido centrado | Desvío del centro de la etiqueta ≤ 0,5px |
| Respaldo (el `@supports` reescrito a una condición imposible) | `--_snap` no existe y el botón conserva su alto sin redondear (34,453 y 42,656 con 4,375px; Firefox ajusta el diseño a 1/60px) |
| `estilo-verificar.mjs` (los tres motores) | 3350/3350, sin cambio |

**No se extiende al sistema.** #525 («si se hace round() para todo el sistema, también aquí», `GTag`) sigue abierto: solo `GBtn`. Decisión propuesta para lima en el informe de la entrega.

## 2. Contraste en oscuro (tema por defecto, `data-theme="dark"`)

Medido con las mismas definiciones que el README en claro: texto contra el fondo del botón (compuesto sobre la superficie), borde de `outline` y relleno de `solid` contra la superficie, en reposo, hover y active; 7 colores × 5 variantes. Se exige ≥ 4,5 el texto y ≥ 3 la forma de `outline` y `solid`. **Pasa todo.**

| Medida | Oscuro | Claro (referencia) |
| --- | --- | --- |
| Texto, mínimo de las 35 combinaciones × 3 estados | **4,51** (`success` `soft`; sigue `soft`/`outline`/`ghost` de `danger` en 4,52 a 4,53) | 4,76 (`success` `soft`) |
| Borde de `outline` contra la superficie, mínimo | 4,52 (`danger`) | 5,33 (`neutral`) |
| Relleno de `solid` contra la superficie, mínimo | 4,52 (`danger`) | 5,33 (`neutral`) |
| Texto del `solid` en hover y active | 6,10 a 18,13 (sube: pasa a `strong`) | 7,46 a 12,63 |
| Texto de `soft`, `outline` y `ghost` en hover y active | 4,51 a 12,82 (baja hasta el de `soft`) | 4,76 a 14,46 |
| Texto de `disabled` | 5,65 (`solid`/`soft`/`outline`) y 6,21 (`ghost`/`link`) | 4,47 y 5,10 |
| Forma de `soft` (fondo contra la superficie) | 1,08 a 1,19; el borde de hover (30 %) la sube a 1,52 a 1,58 | 1,12 a 1,15; hover 1,54 a 1,62 |

Lectura:

- **Margen mínimo en oscuro.** El texto de `soft` y el de hover y active de `outline` y `ghost` en `success`, `accent`, `danger` e `info` pasan por centésimas (4,51 a 4,53). Cualquier tema de usuario que oscurezca un poco `*-soft` o `on-*-soft` las bajará de 4,5: no es un defecto del tema por defecto, pero no hay holgura.
- **En oscuro el texto de los siete `soft` (4,51 a 4,66) mide menos que el del `disabled` (5,65).** El README ya lo dice de `neutral` y `accent`; vale para los siete colores. No hay defecto de contraste (los controles inactivos están exentos), pero un `soft` se lee con menos contraste que uno deshabilitado.
- `soft`, `ghost` y `link` no dependen de la forma contra la superficie: su afordancia es el texto (≥ 4,5). No hay exigencia de 3:1 sobre un relleno tenue y no se encontró defecto. Cualquier cambio de `*-soft` en `defaults.css` que busque más presencia sería decisión de tema (Dark Color Presence), no de este cierre: no se tocó `defaults.css`.

## 3. forced-colors, hover y active

Emulado con `page.emulateMedia({ forcedColors: 'active' })`. Chromium fuerza los colores de verdad. **Firefox y WebKit solo activan la consulta de medios**: sus colores calculados siguen siendo los del autor, así que en esos dos motores se miden las reglas de Grana (borde, foco, `GrayText`) pero no la sustitución de color del sistema; el dispositivo real (Windows con contraste alto) queda pendiente.

**Defectos encontrados y corregidos en `GBtn.css`:**

1. **Hover y active.** La regla `.g-btn { border-color: ButtonText }` (especificidad 0,1,0) perdía contra `.g-btn:hover { border-color: var(--_border-hover) }` (0,2,0). En Chromium el navegador cubría el hueco con su propio indicador (`Highlight`); en **Firefox el borde calculado quedaba transparente** (`solid`, `ghost`, `link`) o con el color del tema (`outline`, `soft`). Ahora `.g-btn:hover, .g-btn:active { border-color: Highlight }` dentro de `@media (forced-colors: active)`: mismo resultado en los tres motores.
2. **`link`.** En forced-colors el enlace recibía el borde `ButtonText` de 1px con padding 0: una caja pegada a las letras y al subrayado. Ahora `.g-btn.g-btn--variant-link { border-color: Canvas }` (el fondo del sistema), después de la regla de `disabled` y con la misma especificidad, así que el enlace no lleva caja ni en reposo, ni deshabilitado, ni en hover y active.

| Medida (Chromium, forzado de verdad) | Resultado |
| --- | --- |
| Borde en reposo, 7 × 5 | `ButtonText` en solid, soft, outline y ghost; `Canvas` en link |
| Hover y active, 7 × 5 × 2 | `Highlight` (link: `Canvas`); el texto nunca iguala al lienzo |
| `disabled`, 7 × 5 | Texto `GrayText`; borde `GrayText` (link: `Canvas`) |
| Foco con teclado (Chromium, Firefox) | Contorno sólido de 2px, color `Highlight` |
| Texto visible en las cinco variantes | Sí (el sistema fuerza `ButtonText` sobre `ButtonFace`/transparente; captura revisada en Chromium) |

En forced-colors las cuatro variantes con caja se ven iguales (todas con borde de sistema): es lo esperado del modo, no hay jerarquía visual entre `solid`, `soft`, `outline` y `ghost`.

**Hover y active de `soft`, `outline`, `ghost` y `link` con el tema por defecto** (los colores calculados coinciden con las reasignaciones `--_*-hover` en los siete colores, claro y oscuro): `soft` conserva el fondo y gana un borde de `on-soft` al 30 %; `outline` y `ghost` toman `soft` como fondo y `on-soft` como texto; `link` no cambia de color (solo el grosor del subrayado); `solid` pasa a `strong`. Contraste de todos en la tabla del punto 2.

## 4. Personalidad

- **(a) Sin `linear()`.** Se sirvió el `grana.css` real con la condición del `@supports` reescrita a una función inexistente (el navegador sí soporta `linear()`, así que la prueba lo comprueba antes). La transición queda con la lista de cuatro (`background-color`, `border-color`, `color`, `transform`), `transform` a `--g-duration-press` (160ms) con `--g-ease-out` (no `--g-duration-slow` 240ms ni `--g-ease-bounce`), y la transición de `background-color` se crea con 120ms (`--g-duration-fast`). Con el CSS real, la base usa 240ms y una curva `linear(`. Los tres motores.
- **(b) Conteo de cuadros en tiempo real, Firefox y WebKit.** Con `--workers=1` es estable: al soltar, 21 a 22 cuadros en 320ms, **13 valores de escala distintos** y 4 cuadros por encima de 1 (el rebote), en Chromium, Firefox y WebKit, 5 repeticiones cada uno, sin variación en Firefox y WebKit. La prueba exige ≥ 6 valores distintos y se omite fuera de Chromium si hay más de un worker (mismo criterio que la voz F2). La medición determinista (Web Animations) de `personalidad-btn.spec.mjs` sigue siendo la que decide el pico 1,006.
- **(c) Táctil.** Con `hasTouch` (y `isMobile` en Chromium y WebKit; Firefox no lo admite pero sí cumple `pointer: coarse`) el área de `::after` mide 44 × 44 en `xs`, `md` y solo icono `sm`, y un toque a 9px por encima de la caja de 24px de `xs` activa el botón además del toque central. **No automatizable, pendiente de entorno real:** un dispositivo táctil real (el rebote visto al levantar el dedo, el calor del tacto, el tamaño real del dedo).

## No verificado (queda abierto)

- **Windows con contraste alto / forced-colors reales** y la sustitución de color de Firefox y WebKit (la emulación solo cambia la consulta de medios).
- **Dispositivo táctil real** (ver 4c).
- **Redondeo a enteros** si el usuario lo prefiere sobre media rejilla (cuatro alturas del tema por defecto cambian ±0,5px).
- **Generalizar `round()` al sistema** (decisión nueva para lima; no se hizo).
- Un tema generado con `@grana/cli` (los resultados dependen de la marca) sigue sin medirse en este cierre.
