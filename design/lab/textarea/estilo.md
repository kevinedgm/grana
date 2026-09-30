# Entrega de coco · GTextarea.css

**Archivo:** `packages/vue/src/components/GTextarea/GTextarea.css`
**Contrato:** `design/contracts/textarea.md` (DECISIONS.md #50 a #52).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe). No hace falta ningún valor nuevo en `defaults.css`.
**Banco de pruebas:** `design/lab/textarea/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/textarea/estilo-banco.html`). Trae un botón "Tema de prueba" y **simula la medición de `autosize`** de bruno (`--_autoh`).

## Mismo lenguaje que GInput (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **`rows` 1 iguala la altura de `GInput`** | El relleno vertical se calcula desde la altura de una fila de `GInput` (`--_units`, las mismas 6, 7, 9, 11 y 13 unidades) y el interlineado: `(altura − 2 × borde − interlineado) / 2`. Cada fila extra suma un interlineado |
| **Anillo de foco pegado al borde** | Mismo gesto que `GInput` (DECISIONS.md #35): línea del grosor de `--g-focus-width` en la caja, con transición de color, y el borde toma el color de foco |
| **Variantes, tamaños, densidad, colores de foco, error, `readonly`, `disabled`** | Idénticos a `GInput`: `soft` con línea inferior de `border-control`, error con doble trazo y ⚠, `readonly` con borde discontinuo |
| **`autosize` sin animar** | `block-size: var(--_autoh)` sin respaldo (mientras no exista, la altura queda automática) y `overflow-y: hidden`; con `is-capped`, `auto`. No hay transición de altura |
| **Tirador** | `resize: vertical` o `none`; nunca horizontal. Con `autosize` el contrato fuerza `none` |
| **Carga sin bloquear** | Anillo giratorio alineado con la primera línea, dentro de la caja, y el texto reserva su sitio (`padding-inline-end`) para no pasar por debajo |
| **Aviso del contador** | `g-textarea__count-live` con el patrón estándar de texto oculto (1px, `clip-path`); siempre presente |
| **`rounded="pill"`** | En una caja de varias líneas, una píldora completa se ve como un óvalo y recorta el texto y el tirador: se limita a `--g-radius-lg`. Es una decisión estética de coco (el contrato admite el valor) |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()` y el patrón de texto oculto; ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| `rows` 1 frente a `GInput`, 5 tamaños × 3 densidades | Alturas idénticas en las **15** combinaciones (24, 24, 24 · 28, 24.5, 24 · 36, 31.5, 27 · 44, 38.5, 33 · 52, 45.5, 39px); también con `space` 5 (30, 35, 45, 55 y 65px) |
| Altura con 3 filas | 76px = 3 × 20 + 2 × 7 + 2 × 1 (interlineado, relleno y borde) |
| Contraste (tema por defecto) | Borde de la caja 3.45:1 · línea inferior de `soft` 3.45 · borde inválido 5.49 · placeholder 5.10 · todo texto ≥ 4.5:1 |
| Contraste (tema de prueba) | Borde 4.86 · `soft` 4.86 · inválido 5.32 · placeholder 6.13 · todo texto ≥ 4.5:1 |
| Cambio de tema (superficies ámbar, texto marrón, colores de foco, radios, borde 2px, foco 3px, espacio 5, Georgia) | Las **298** propiedades medidas cambian; ninguna conserva el valor por defecto |
| Foco con teclado (real) | Anillo de 3px pegado al borde (`outline-offset` −2px) en el color del tema; el `<textarea>` no lleva contorno |
| Táctil (`pointer: coarse`, bloque aplicado sin condición) | Todas las cajas de 1 fila ≥ 44px |
| Movimiento reducido (bloque aplicado sin condición) | Transición a `0s` y giro del anillo más lento |
| Colores forzados (bloque aplicado sin condición) | Borde `ButtonText`, deshabilitado `GrayText`, foco `Highlight`, inválido con borde de 4px |
| Carga | El anillo queda dentro de la caja, alineado con la primera línea (desvío 0) y el texto no pasa por debajo |
| 240px con palabra larguísima (texto, ayuda y error) | Sin desborde |
| `autosize` (simulado) | rows 2 → 54px; con `maxRows` 4 y 8 líneas → 94px, `is-capped` y `overflow-y: auto`; sin `maxRows` crece a 174px sin barra |
| Errores de consola | Ninguno |

## Notas para bruno

- `--_autoh` es la altura **del `<textarea>`** en píxeles (incluye su relleno; el campo es `border-box`): mide `scrollHeight` con altura automática y limita a `maxRows` × interlineado + relleno vertical. Ambos se leen de los estilos calculados.
- `is-capped` va en la raíz mientras el contenido supera `maxRows`.
- El anillo de carga (`g-textarea__loader`) es un `span` dentro de `g-textarea__control`, **después** del `<textarea>`.

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; preferencias reales de `prefers-reduced-motion` y `forced-colors`; Firefox y Safari (tirador y `:has()`); tema oscuro (no existe); el tirador nativo sobre esquinas muy redondeadas con temas extremos.
