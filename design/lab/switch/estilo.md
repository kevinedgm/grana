# Entrega de coco · GSwitch.css

**Archivo:** `packages/vue/src/components/GSwitch/GSwitch.css`
**Contrato:** `design/contracts/switch.md` (DECISIONS.md #47 a #49).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe). No hace falta ningún valor nuevo en `defaults.css`.
**Banco de pruebas:** `design/lab/switch/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (desde la raíz del repo: `/design/lab/switch/estilo-banco.html`). Trae un botón "Tema de prueba".

## Carácter propio (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| **El riel es el `<input>`; pulgar y marca son sus pseudo-elementos** | `::before` es el pulgar; `::after`, la marca (− apagado, ✓ encendido) centrada en el pulgar y con él |
| **El pulgar se desliza con `translate`, no con `inset`** | `translate: calc(var(--_dir) * var(--_x))` en `--g-duration-press` con `--g-ease-out`; `--_dir` vale −1 con `:dir(rtl)`, así que en RTL se espeja solo |
| **Geometría desde `space`** | Riel `5 × 9`, `5.5 × 10`, `6 × 11`, `7.5 × 13` y `9 × 16` unidades (`tokens.md` §4); pulgar = alto − 2 × (borde + media unidad); recorrido = ancho − 2 × (borde + media unidad) − pulgar. Todo sigue a `space` y a `--g-border-width` |
| **El riel se hunde al pulsar** | `scale: var(--g-press-scale)`, el mismo gesto que el botón y la casilla |
| **Anillo de foco que se abre** | `outline-offset` de 0 a `--g-focus-offset` con transición (solo fuera de `forced-colors`) |
| **Carga sin bloquear** | La marca se convierte en un anillo giratorio (`--g-duration-spin`); sin movimiento reducido queda el anillo quieto |
| **Iconos on/off** | Van sobre el pulgar y con él; sustituyen a la marca de su estado (`:has(~ .g-switch__icon--on)`) y desaparecen mientras carga |
| **Error en apagado y en encendido** | Apagado: borde y segundo trazo interior de `danger-text`. Encendido: borde de `danger-text` y trazo exterior (`box-shadow`), sin mover el contenido |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px` y `0px` en `max()`; ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| Riel por tamaño (5) con `space` 4 | 36×20, 40×22, 44×24, 52×30 y 64×36px; pulgares de 14, 16, 18, 24 y 30px |
| Fila por tamaño y densidad | 24, 24, 24, 32 y 40px; nunca menor que el riel (con `xl compact`, 36px en lugar de 30) |
| Con el tema de prueba (`space` 5, borde 2px) | Riel 45×25, 55×30 y 80×45; el pulgar termina a la misma separación de cada borde (2,5px) |
| Contraste (tema por defecto) | Contorno del riel apagado 3.45:1 · pulgar apagado contra riel 3.45 · marca contra pulgar 3.45 · encendido: riel contra fondo, pulgar contra riel y marca contra pulgar, respectivamente: brand 16.48, accent 5.69, danger 5.49, info 5.69, neutral 5.33, success 5.35, warning 5.73 (mínimo 3:1) · texto (etiqueta, ayuda, error) mínimo 5.49 |
| Contraste (tema de prueba) | Apagado 4.86 · encendido de 5.16 a 9.64 · texto mínimo 7.36 |
| Cambio de tema (superficies ámbar, texto marrón, los 7 colores, borde 2px, foco 3px, espacio 5, Georgia) | Las **322** propiedades medidas cambian; ninguna conserva el valor por defecto |
| Foco con teclado (real) | Anillo de 3px, separación de 2px, color del tema |
| Táctil (`pointer: coarse`, bloque aplicado sin condición) | Fila de 44px; riel de 24px centrado con la etiqueta (desvío 0) |
| Movimiento reducido (bloque aplicado sin condición) | El pulgar y la marca saltan de lado (sin desplazamiento ni escala al pulsar); los fundidos de color del riel, del pulgar y de la marca se conservan |
| Colores forzados (bloque aplicado sin condición) | Apagado: borde y pulgar `ButtonText`, riel `Canvas`. Encendido: riel `Highlight`, pulgar `HighlightText`. Deshabilitado `GrayText` |
| 240px y texto largo | Sin desborde (`scrollWidth` = `clientWidth`); la etiqueta salta de línea |
| RTL | Riel a la derecha; pulgar encendido a la izquierda con la misma separación; con etiqueta al inicio, el riel pasa a la izquierda; el ✓ **no** se espeja |
| Iconos | El icono de su estado se muestra; el otro no; la marca dibujada se oculta solo en el estado con icono |
| Errores de consola | Ninguno |

## Hallazgo corregido durante la entrega

- Una regla para espejar el ✓ en RTL lo deformaba (rotaba 45° y cambiaba los bordes). Un ✓ **no** se espeja en RTL: se eliminó y el mismo trazo sirve en los dos sentidos.

## Notas para bruno

- `g-switch__control` (contenedor posicionado) envuelve el `<input>` y los iconos; el `<input>` va **antes** de los iconos (los estilos usan `~`).
- El estado encendido, el sentido RTL (`:dir(rtl)`) y el hover salen de CSS; no hay clases para ellos.
- Los iconos `icon-on` e `icon-off` se dimensionan al pulgar (`font-size` = 0.65 del pulgar): funcionan con SVG de `1em`.

## Sin verificar (lo audita el paso 5 o queda pendiente)

Lector de pantalla real; preferencias reales de `prefers-reduced-motion` y `forced-colors`; Firefox y Safari (pseudo-elementos del `<input>` con `appearance: none`, `:dir()`, `:has()`); hover real del ratón; tema oscuro (no existe).

## Personalidad: rechazo al enviar (`is-rejected`; DECISIONS.md #304)

Con `GForm`, al enviar con errores el campo que bloquea niega una vez con la cabeza (sacudida horizontal decreciente de ≤ `--g-space-1`, `--g-duration-slow`, sin movimiento reducido): aquí se mueve `.g-switch__control` (el riel). Detalle, tabla de todos los campos y mediciones en `design/lab/input/estilo.md` («I2 extendido al resto de campos»).
