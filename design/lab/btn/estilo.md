# Entrega de coco · GBtn.css

**Archivo:** `packages/vue/src/components/GBtn/GBtn.css`
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno).

## Verificación en Chromium (banco de pruebas con el marcado de `design/contracts/btn.md`)

| Prueba | Resultado |
| --- | --- |
| Contraste texto/fondo: 7 colores × 5 variantes, en reposo y hover (70 pares) | Todos ≥ 4.5:1. Mínimo: 4.76 (`success` soft) |
| Altura: 5 tamaños × 3 densidades | Exacta según el contrato (p. ej. md 36 / 31.5 / 27; xs con piso de 24) |
| `loading` conserva el ancho | 160.56px antes y después |
| Área táctil en el botón más pequeño (xs compacto) | 24px de alto por pseudo-elemento |
| Foco con teclado | Contorno sólido de 2px, color `focus`, separación de 2px |
| Texto largo en contenedor de 220px | Salta de línea; el alto crece (56px), no se corta |
| Cambio de tema (marca azul marino, `shape` píldora, `space` 5, fuente serif) | Todo cambia; ningún botón conserva valores del tema anterior |
| Literales | Sin colores; medidas solo `24px`, `44px` y el patrón de texto oculto |
| Errores de consola | Ninguno |

## Hallazgo corregido durante la entrega

`min-block-size` fija un mínimo, no una altura: con padding fijo, `xs` medía 26 en lugar de 24, y la densidad no reducía los tamaños pequeños. El padding vertical ahora se calcula desde la altura objetivo: `(altura − interlineado) ÷ 2 − borde`.

## Tokens que faltaban en el contrato

`--g-radius-shape`, `--g-border-width`, `--g-focus-width`, `--g-focus-offset`, `--g-duration-fast`, `--g-duration-spin`, `--g-ease-standard`, `--g-text-action-weight`. Agregados por lima a `docs/contract/tokens.md`; valores por defecto en `defaults.css`.

## No verificado

- Alturas fraccionarias (`comfortable`: 31.5px, 38.5px…) pueden verse con bordes difusos en pantallas de baja densidad. Pendiente evaluar `round()` de CSS.
- `forced-colors` y `prefers-reduced-motion`: reglas escritas, no emuladas en esta prueba.
- Tema oscuro: no existe aún.
