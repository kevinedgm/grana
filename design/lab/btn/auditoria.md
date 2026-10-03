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
