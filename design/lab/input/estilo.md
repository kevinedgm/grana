# Entrega de coco · GInput.css

**Archivo:** `packages/vue/src/components/GInput/GInput.css`
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/input/estilo-banco.html`: marcado exacto de `design/contracts/input.md` con el CSS real y el tema por defecto. Se sirve desde la raíz del repo (`python3 -m http.server`, ruta `/design/lab/input/estilo-banco.html`).

## Verificación en Chromium

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`; sin `var()` con respaldo, sin `@layer` ni `<style>` |
| Tokens consumidos | Solo los del contrato; ninguno nuevo |
| Altura de la caja: 5 tamaños × 3 densidades | Exacta en las 15 combinaciones (xs 24 / md 36 / xl 52 con espacio base 4; con base 5 y borde 2px también exacta) |
| Contraste en reposo | Etiqueta 17.4 · texto 16.1 · ayuda 7.46 · error 5.49 · marca de obligatorio 5.49 · `placeholder` 5.10 (4.72 sobre `soft`) · botón mostrar 7.46. Todos ≥ 4.5:1 |
| Borde de la caja (`border-control` sobre la página) | 3.45:1 (mínimo 3:1) |
| Variante `soft`: relleno solo contra la página | 1.08:1: **no llega a 3:1**; por eso conserva la línea inferior con `border-control` (3.45:1) |
| Foco con clic y con Tab | Anillo de 2px, color del tema, separación de 2px, en la **caja completa**; el `<input>` no lleva contorno; el botón mostrar tiene su propio anillo y la caja no lo duplica |
| Error | Borde de danger con trazo interior (doble grosor sin mover el contenido), marca ⚠ que un lector de pantalla no lee, texto en `danger-text` |
| Región del error vacía | Existe en el DOM, `display: block`, 0px de alto (no se quita a los lectores de pantalla) |
| Texto mínimo (ayuda, error, contador, botón) | 12px |
| Área táctil (`pointer: coarse`, emulado a 320px) | Caja ≥ 44px incluso en `xs compact`; xl 52px; botón mostrar 44px de alto; sin desborde horizontal |
| Contenedor de 220px con etiqueta, ayuda y error largos | Todo salta de línea; sin desborde |
| Cambio de tema (superficies, texto, borde, error, foco, fuente serif, radio 0, borde 2px, foco 3px con separación 4px, transición 300ms, peso 700, tamaños 15/13px, espacio base 5) | Ninguna propiedad conserva el valor del tema anterior; alturas exactas; `soft` y `placeholder` cambian; foco 3px con separación 4px |
| Errores de consola | Ninguno |

## Decisiones de estilo

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | `soft` = relleno `surface-sunken` + línea inferior de `border-control`, sin borde en los otros lados | El relleno solo (1.08:1) no cumple 3:1 para delimitar el control (WCAG 1.4.11) |
| 2 | Error: borde de danger + trazo interior + marca ⚠ + texto | No depende solo del color (WCAG 1.4.1) y no cambia el tamaño de la caja |
| 3 | Hover: el borde pasa a `text-muted`, solo con `hover: hover`, y no en deshabilitado, solo lectura ni inválido | Señal sutil sin tokens nuevos |
| 4 | `readonly`: fondo `surface-sunken` y borde discontinuo; el texto conserva su color | Se distingue de `disabled` (texto y etiqueta atenuados, borde `border-strong`) sin perder legibilidad |
| 5 | `color` cambia solo `--_focus` | Contrato: solo foco y borde en foco |

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | El contrato no dice **qué contiene** el botón mostrar/ocultar (`g-input__toggle`). Grana no trae iconos y el nombre accesible ya está en `aria-label` | Media | El botón muestra como texto visible la propia etiqueta (`showPasswordLabel` / `hidePasswordLabel`), sin icono ni slot nuevo. El CSS ya está listo para texto. **Resuelto por lima** (`design/contracts/input.md`, hallazgo 11) |
| 2 | Con `pointer: coarse` la caja mide 44px, pero el texto sigue a 14px (`body-sm`); iOS Safari amplía la página al enfocar un campo con menos de 16px | Baja | Decidir si `size` `md` en táctil pasa a `body` (16px), o se documenta como limitación. **Resuelto por lima:** límite conocido (hallazgo 12) |

## No verificado

- `prefers-reduced-motion` y `forced-colors`: reglas escritas, no emuladas.
- Hover real con puntero (las reglas están dentro de `@media (hover: hover)`); `:hover` no se pudo forzar.
- Estados con el `.vue` real: falta el componente de bruno.
- Lector de pantalla real: el ⚠ oculto con `content: … / ""` no se probó en Firefox anterior a 128 (allí no se muestra, pero tampoco se lee).
- Tema oscuro: no existe aún.
