# Entrega de coco · GSelect.css

**Archivo:** `packages/vue/src/components/GSelect/GSelect.css`
**Contrato:** `design/contracts/select.md` (DECISIONS.md #53 a #56).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe). No hace falta ningún valor nuevo en `defaults.css`.
**Banco de pruebas:** `design/lab/select/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/select/estilo-banco.html`). Trae un botón "Tema de prueba" y un **motor mínimo** (abrir, teclado, posición por variables) que imita lo que hará bruno.

## Mismo lenguaje que GInput (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **Misma altura que `GInput`** | Las mismas unidades (`--_units`: 6, 7, 9, 11 y 13) y densidad; la **opción** mide como la caja, con piso de 24px y 44px con puntero grueso |
| **Foco pegado al borde** | Mismo gesto que `GInput` (DECISIONS.md #35): línea del grosor de `--g-focus-width` en la caja, con transición, y el borde toma el color de foco. Abierta, el borde conserva el color de foco aunque el foco venga del ratón |
| **Variantes, tamaños, densidad, colores de foco, error, `readonly`, `disabled`, `loading`** | Idénticos a `GInput` (`soft` con línea inferior de `border-control`, error con doble trazo y ⚠, `readonly` discontinuo) |
| **Flecha y cruz dibujadas con bordes** | La flecha (dos bordes rotados) gira al abrir; la cruz de limpiar son dos barras de borde: ambas **sobreviven a `forced-colors`** (un fondo no) |
| **Lista en la capa superior** | `position: fixed` con `--_x`, `--_top`, `--_bottom`, `--_min` y `--_max` de bruno; sin ellas (cerrada) valen `auto`. Sin respaldos en `var()`. Alto máximo `min(--_max, 8 opciones, 60dvh)` |
| **Opción activa** | Relleno `surface-sunken` y contorno del grosor de `--g-focus-width` en el color de foco (el foco vive en el selector; la activa lo señala) |
| **Elegida** | Más peso y marca ✓ dibujada con bordes al final de la fila (no depende del color) |
| **Deshabilitada** | `text-subtle` y tachado; sin depender del color |
| **Aparición** | Fundido breve con desplazamiento de `--g-space-1` (hacia abajo o hacia arriba con `is-up`), en `--g-duration-press`; solo con `no-preference` |
| **Hoja inferior (≤ 520px)** | Pegada abajo, ancho completo, esquinas superiores con `--g-surface-radius`, fondo `--g-surface-inset`, relleno `--g-surface-gap` (más `env(safe-area-inset-bottom)`), sombra `--g-shadow-3` y `::backdrop` con `--g-surface-backdrop`; el mismo sistema de superficies que `GDialog` |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`, `0px` en `max()` y el umbral `520px` de `@media` (excepción #42 y #56); ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| Caja frente a `GInput`, 5 tamaños × 3 densidades | Alturas idénticas en las **15** combinaciones (24, 24, 24 · 28, 24.5, 24 · 36, 31.5, 27 · 44, 38.5, 33 · 52, 45.5, 39px); también con `space` 5 (30, 35, 45, 55 y 65px) |
| Lista | Ancho igual al de la caja (240px), a 4px debajo; opción de 36px (= caja) |
| Contraste (tema por defecto) | Borde de la caja 3.45:1 · línea inferior de `soft` 3.45 · borde inválido 5.49 · placeholder 5.10 · opción activa 16.1 · encabezado de grupo 7.46 · **contorno de la lista 4.86** · todo texto ≥ 4.5:1 |
| Contraste (tema de prueba) | Borde 4.86 · `soft` 4.86 · inválido 9.46 · placeholder 5.93 · activa 10.29 · grupo 7.36 · contorno de la lista 3.45 · todo texto ≥ 4.5:1 |
| Cambio de tema (superficies ámbar, texto marrón, colores de foco, radios, borde 2px, foco 3px, espacio 5, Georgia, fondo propio) | Las **423** propiedades medidas cambian; ninguna conserva el valor por defecto |
| Foco con teclado (real) | Anillo de 3px pegado al borde (`outline-offset` −2px) en el color del tema; el botón no lleva contorno |
| Táctil (`pointer: coarse`, bloque aplicado sin condición) | Caja y opciones de 45px con `space` 5 (≥ 44px); botón de limpiar de 44×44px |
| Movimiento reducido (bloque aplicado sin condición) | Transiciones a `0s`; el giro del anillo de carga, más lento |
| Colores forzados (bloque aplicado sin condición) | Caja y lista `ButtonText`/`CanvasText`; opción activa con contorno `Highlight`; deshabilitada `GrayText`; inválido con borde de 4px |
| RTL | El botón de limpiar y la flecha pasan a la izquierda (propiedades lógicas) |
| Hoja inferior a 375px con el tema | Ancho completo (375px), esquinas superiores de 28px (`--g-surface-radius`), fondo propio, `::backdrop` `rgb(59 42 26 / 0.45)`, opciones de 45px, sin desborde horizontal |
| Hacia arriba, 40 opciones con scroll, lista vacía, texto largo | Correctos (selector al fondo abre sobre él; sin desborde con etiqueta, valor y ayuda largos) |
| Errores de consola | Ninguno |

## Hallazgo corregido durante la entrega

- **El contorno de la lista usaba `border-strong` (translúcido, ~1.5:1).** Una lista blanca sobre una página blanca dependía solo de la sombra. Corregido: usa `--g-color-border-control` (≥ 3:1, WCAG 1.4.11). El contrato lista ambos tokens; solo se usa el segundo para la lista.

## Notas para bruno

- Las variables de posición van **sobre la lista** (`style` con `--_x`, `--_top`, `--_bottom`, `--_min`, `--_max`); en el hacia arriba, `--_top` es `auto` y `--_bottom` la distancia al borde inferior del visor. En móvil el CSS las ignora.
- `is-up` va en la lista; `is-active` en la opción activa; `is-open` en la raíz.
- El botón de limpiar y el anillo de carga son hermanos del botón `combobox` dentro de `g-select__control`.
- El botón `combobox` no lleva contorno propio: el anillo lo dibuja la caja con `:has()`.

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real (incluido el riesgo de `aria-activedescendant` en la hoja móvil); la hoja con el teclado virtual; preferencias reales de `prefers-reduced-motion` y `forced-colors`; Firefox y Safari (`popover`, `::backdrop`, `:popover-open`, `:has()`); tema oscuro (no existe).
