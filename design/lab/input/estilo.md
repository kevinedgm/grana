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

---

## Ampliación: botón de acción (slot `action`)

**Contrato:** `design/contracts/input.md`, sección "Botón de acción" (DECISIONS.md #33 y #34). Banco: `design/lab/input/estilo-banco.html` (ahora carga también `GBtn.css` y usa `.g-input__row`).

### Verificación en Chromium

| Prueba | Resultado |
| --- | --- |
| Acoplamiento: 8 combinaciones (texto, solo icono, inválido, deshabilitado, carga, `outline`, `soft`, píldora) | Botón pegado a la caja (bordes solapados exactamente 1 borde), misma altura, mismo borde superior |
| Altura caja = botón: 5 tamaños × 3 densidades | Iguales en las 15 combinaciones |
| Esquinas | Caja: exteriores redondeadas, interiores rectas. Botón: interiores rectas y exteriores con **el radio del campo** (no el del botón); en píldora, 999px |
| Foco con Tab (campo → botón) | Anillo del botón visible, por encima de la caja (`z-index: 1`); el del campo, igual con su caja |
| Tema distinto (radio `sm` 14px, borde 2px, espacio base 5, `brand` azul marino) | Esquinas exteriores de caja y botón a 14px, interiores a 0; solapamiento de 2px (= borde); ambas alturas 45px; el botón toma el color de la marca |
| Contenedor estrecho de 220px | Botón con texto: debajo, a ancho completo (220px) con 8px de separación, todas las esquinas redondeadas. Botón solo icono: sigue a la derecha (185 + 36px), cuadrado |
| Táctil (`pointer: coarse`, 320px) | Acoplado: botón de 44px de alto (se estira a la altura de la caja); sin desborde. Apilado: el botón mide su alto normal y su zona táctil de 44px la da `GBtn` |
| Literales en `GInput.css` | Ningún color; medidas: `24px`, `44px` y el umbral `300px` de la consulta de contenedor (excepción de DECISIONS.md #34) |

### Hallazgos propios (corregidos durante la ampliación)

1. **Ancho por defecto.** El campo mide 240px por defecto (menos que el umbral de 300px), así que con la consulta sobre `.g-input` un botón con texto **siempre** se apilaba. Con `g-input--has-action`, el ancho por defecto pasa a 360px (`--g-space-1` × 90); si el contenedor es más estrecho, el campo ocupa el 100% y se apila por debajo de 300px.
2. **Colisión de nombres.** `GBtn` define su propio `--_radius`; para que el botón use el radio del campo, `GInput` lo copia en `--_field-radius` y el botón lo lee de ahí.

### Decisiones

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | El anillo del botón se deja hacia **fuera** (el de `GBtn`), con `z-index: 1`, en vez de hacia dentro como en el prototipo de kiwi | Un anillo hacia dentro sobre un botón sólido oscuro no contrasta (el prototipo lo resolvía con un relleno blanco); el anillo exterior sigue visible sobre la caja porque el elemento enfocado queda por encima |
| 2 | El botón toma las esquinas exteriores del **campo**, no las suyas | Conjunto visual coherente: caja y botón forman un solo rectángulo redondeado |

### No verificado

- `prefers-reduced-motion` y `forced-colors` con acción: no cambian respecto a lo ya auditado; el botón hereda las reglas de `GBtn`.
- El slot real de Vue (`GInput.vue` aún no lo implementa): bruno.
- Hover del botón en el conjunto y contraste de un botón `soft`/`outline` sobre el fondo del tema.

---

## Ajuste de foco (comentario del usuario)

**Problema:** el foco se sentía tosco y, con botón de acción, el botón quedaba fuera del anillo. Causa: un anillo separado 2px del borde **y** el borde también en color de foco (dos líneas), que terminaba donde empezaba el botón.

**Cambio en `GInput.css`:**
- El anillo va en la **fila** (`.g-input__row`), no en la caja: rodea caja y botón cuando el foco está en el campo. Sin acción, la fila es la caja.
- **Pegado al borde:** `outline-offset: calc(var(--g-border-width) * -1)` con `outline` de `--g-focus-width`: una sola línea del grosor del token, sin hueco.
- **Transición** de `outline-color` en `--g-duration-fast`; la base transparente solo existe fuera de `forced-colors` (allí un contorno transparente se volvería visible).
- El botón de acción enfocado usa el mismo trazo pegado (no el separado de `GBtn`).
- Apilado (botón debajo): el anillo vuelve a rodear solo la caja. Solo icono: sigue rodeando el conjunto.
- `--g-focus-offset` ya no lo lee la caja (solo el botón mostrar/ocultar).

**Verificado en Chromium:** sin acción, con acción, `soft`, inválido (el borde de error queda dentro del anillo), apilado con texto (anillo solo en la caja) y apilado con icono (anillo del conjunto). Con tema (borde 2px, foco 3px violeta, radio 12px): anillo de 3px, `offset -2px`, esquinas de 12px. Botón de acción enfocado: anillo de 2px pegado, `z-index: 1`.
**No verificado:** `forced-colors` real (el bloque cambia el color a `Highlight`; la base transparente no aplica en ese modo por diseño).

