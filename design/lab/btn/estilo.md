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

## Tamaño del icono · `--_icon` (#205, coco)

Alias local de `GBtn.css`, sin token ni literal nuevo. Se define como `calc(var(--_fs) * factor)` (el factor se aplica a `--_fs`, no en un `em` suelto, para que no cambie si el hueco trae otro `font-size`) y se aplica al `svg` hijo directo del hueco.

| Hueco | Tamaño | Cómo |
| --- | --- | --- |
| `prepend`, `append` | **1.15em** del texto (13,8px en `xs`, 16,1 en `sm`/`md`, 18,4 en `lg`/`xl`) | `.g-btn__prepend > svg`, `.g-btn__append > svg`; antes 1em (14px en `md`) |
| Slot por defecto con `icon` | **1.4em** del texto (16,8 en `xs`, 19,6 en `sm`/`md`, 22,4 en `lg`/`xl`) | `.g-btn--icon { --_icon }` y `.g-btn--icon .g-btn__label > svg`; sigue a `size`, **no** a `density` |
| `g-btn__loader` | `--_icon` del modo (igual que el icono al que sustituye) | Antes `--_fs`: encogía al cargar |

**Por qué 1.4em en solo icono.** La condición de #205 es caber sin tocar el borde en todos los tamaños y densidades. El peor caso es el piso de 24px (`xs` en cualquier densidad y `sm` en `compact`): interior de 22px (borde 1px). El dibujo `circle` de Lucide, el más ancho, ocupa 22/24 de su caja (trazo incluido). Con 1.5em, `sm`/`compact` dejaba 1,38px entre el trazo y el borde, ya justo; con **1.4em deja 2,0px** (`xs`: 3,3px; con el tema de borde 2px y `space` 5: ≥ 2,1px). Es 0,25em mayor que el de `prepend`/`append` y ocupa del 54 % (`md`/`default`: 19,6 de 36px) al 70 % (`sm`/`default`: 19,6 de 28) de la caja.

**El icono no añade altura.** El icono del solo icono (hasta 22,4px) es mayor que el interlineado de `sm` y `md` (20px) y haría crecer el botón (padding calculado desde la altura objetivo). `.g-btn--icon .g-btn__label` mide el interlineado (`block-size: var(--_lh)`) y el icono lo desborda por igual (centrado en flex). Alto medido igual que el del botón con texto en las 15 combinaciones: 24 a 52px, exactos.

### Mediciones (Chromium, Firefox y WebKit; tema por defecto, sin diferencias de más de 0,02px entre motores)

| size | texto | prepend/append | solo icono | altura default / comfortable / compact | holgura trazo–borde (default / compact) |
| --- | --- | --- | --- | --- | --- |
| xs | 12px | 13,8px | 16,8px | 24 / 24 / 24 (piso) | 3,3 / 3,3 |
| sm | 14px | 16,1px | 19,6px | 28 / 24,5 / 24 (piso) | 4,0 / 2,0 |
| md | 14px | 16,1px | 19,6px | 36 / 31,5 / 27 | 8,0 / 3,5 |
| lg | 16px | 18,4px | 22,4px | 44 / 38,5 / 33 | 10,7 / 5,2 |
| xl | 16px | 18,4px | 22,4px | 52 / 45,5 / 39 | 14,7 / 8,2 |

- **Loader sin salto:** tamaño igual al icono de `prepend` (13,8 a 18,4px) y al del solo icono (16,8 a 22,4px) en las 15 combinaciones; centrado (≤ 0,6px); ancho y alto del botón iguales cargando y sin cargar (0,01px).
- **Contraste:** sin cambios (el icono es `currentColor`): 35 combinaciones de color × variante, mínimo 4,76:1 (`success` soft), ≥ 4,5 en todas.
- **Área táctil:** 24px de `::after` como mínimo; con `pointer: coarse` (Chromium con `isMobile`, WebKit con `hasTouch`) 44px en las 15 combinaciones del solo icono. Firefox no emula `pointer: coarse`: no verificado ahí.
- **RTL:** solo icono centrado a 0,6px; los iconos de hueco con `g-icon--flip-rtl` espejan y miden lo mismo.
- **Tema oscuro y tema de prueba** (Georgia, borde 2px, `space-1` 5px, forma píldora): mismas relaciones; el icono sigue a `size` y la altura a `space`, así que con otra `space` el solo icono puede ocupar menos o más de la caja, siempre sin tocar el borde (holgura mínima 2,1px).
- **Clase de la aplicación (#204):** con el CSS real en capas (el banco carga `grana.css`), una clase de 48px sobre el icono de `prepend` gana al hueco en los tres motores. No se pone: el tamaño lo manda `size`.
- **Consola:** limpia en los tres motores. Sin literales ni tokens nuevos.
- **Verificación propia:** `node design/lab/btn/estilo-verificar.mjs --engines=chromium,firefox,webkit` (3350 comprobaciones), sobre `design/lab/btn/estilo-banco.html`.

### Sin verificar

- Contenido del hueco que no sea un `svg` (imagen, logotipo): lo dimensiona la aplicación.
- `link` con `icon` (sin altura mínima): no se prueba; no es un caso del contrato.
- Pantallas de baja densidad con alturas fraccionarias (`comfortable`: 24,5, 31,5, 38,5px): los bordes del icono pueden verse difusos; sigue el pendiente de `round()`.

## No verificado

- Alturas fraccionarias (`comfortable`: 31.5px, 38.5px…) pueden verse con bordes difusos en pantallas de baja densidad. Pendiente evaluar `round()` de CSS.
- `forced-colors` y `prefers-reduced-motion`: reglas escritas, no emuladas en esta prueba.
- Tema oscuro: no existe aún.
