# Entrega de coco · GCheckbox.css y GCheckboxGroup.css

**Archivos:** `packages/vue/src/components/GCheckbox/GCheckbox.css` y `packages/vue/src/components/GCheckboxGroup/GCheckboxGroup.css`
**Contrato:** `design/contracts/checkbox.md` (DECISIONS.md #36 y #37).
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; los `.vue` aún no existen).
**Banco de pruebas:** `design/lab/checkbox/estilo-banco.html`: marcado exacto del contrato con el CSS real y el tema por defecto (se sirve desde la raíz del repo, ruta `/design/lab/checkbox/estilo-banco.html`).

## Carácter propio (con tokens, sin literales de tema)

| Detalle | Cómo |
| --- | --- |
| La marca ✓ **se dibuja** al marcar | Dos bordes rotados con `clip-path` que se revela de izquierda a derecha en `--g-duration-press` con `--g-ease-out` |
| La mixta **se abre desde el centro** | Una raya que crece desde el centro con el mismo `clip-path` |
| El cuadro **se hunde** al pulsar | `scale: var(--g-press-scale)`, el mismo gesto que el botón |
| El anillo de foco **se abre** | `outline-offset` pasa de 0 a `--g-focus-offset` con transición (solo fuera de `forced-colors`) |
| **Tarjeta:** al seleccionar, el icono se rellena con el color | Fondo `--g-color-{color}` y marca `on`; borde de doble grosor sin mover el contenido (`box-shadow` interior) |
| **Chip:** el ✓ se desliza desde la izquierda y el chip se rellena | `inline-size` del ✓ de 0 a `--_fs`, más `opacity` |
| **Maestra:** raya que se abre y conteo con cifras de ancho fijo | `font-variant-numeric: tabular-nums`, para que "9 de 12" y "10 de 12" no bailen |

## Verificación en Chromium (banco de pruebas)

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px` y `0px` (un cero en `max(0px, …)`, no una medida de tema); ningún `var()` con respaldo, sin `@layer` ni `<style>` |
| Cuadro por tamaño (5) y fila por tamaño × densidad (15) | Exactos: 16, 16, 20, 24 y 28px con espacio 4; también con espacio 5 |
| Fila mínima | Nunca menor que el cuadro (corregido: en `xl compact` el cuadro de 35px superaba la fila de 33.75px) |
| Contraste en reposo | Etiqueta 17.4 · ayuda 7.46 · error 5.49 · borde del cuadro contra el fondo 3.45 (mínimo 3:1) · borde inválido 5.49 · marca sobre relleno: brand 16.48, accent 5.69, success 5.35, danger 5.49, solo lectura 7.46, deshabilitada 5.10 · etiqueta de tarjeta seleccionada 14.46 · ayuda sobre fondo suave 6.54 · texto de chip marcado 16.48 |
| Marca, mixta y error | Se ven en pantalla (✓ dibujada, raya, ⚠ que un lector de pantalla no lee); la región del error vacía mide 0px y sigue en el árbol |
| Foco con teclado (real) | Cuadro: anillo de 2px, separación de 2px, color del tema. Tarjeta y chip: el anillo rodea la tarjeta o el chip completos y el `<input>` no lleva contorno |
| Hover real con el ratón | Sin marcar: el borde pasa a `text-muted` (#555555). Marcada: el fondo pasa a `strong` (#333333) |
| Chip: contorno sin marcar | 3.45:1 (corregido: usaba `border-strong`, ~1.5:1, y el chip no tiene cuadro interior que lo identifique; WCAG 1.4.11) |
| Chip: el `<input>` cubre el chip | `opacity: 0`, 89 de 91px (dentro del borde); el clic en el borde también activa la casilla por el `<label>` |
| Grupo | `<fieldset>` sin aspecto del navegador; cabecera con maestra mixta y "2 de 4 seleccionadas" |
| Cambio de tema (superficies ámbar, texto marrón, brand/accent/success/danger nuevos, radio 0, borde 2px, foco 3px, espacio 5, Georgia) | Ninguna propiedad conserva el valor anterior (la única coincidencia, el texto blanco del chip marcado, viene de `on-brand`, que ese tema no cambió). Cuadro, tarjeta y chip a 0px de radio |
| Movimiento reducido (bloque del CSS aplicado sin condición) | Transición de cuadro, marca, tarjeta, icono, chip y ✓ a `0s` (corregido: tarjeta y chip seguían animando por menor especificidad) |
| Colores forzados (bloque aplicado sin condición) | Borde `ButtonText`; marcada y chip con `Highlight`; deshabilitada `GrayText`; inválida con borde de 2px |
| Táctil (`pointer: coarse`, 320px) | Filas de 44px en todos los tamaños, chips de 44px, filas del grupo de 44px; el cuadro sigue en 20px y **centrado** con la etiqueta (desvío 0); sin desborde horizontal |
| RTL (`dir="rtl"`) | El cuadro pasa a la derecha, la etiqueta a su izquierda, el relleno del error se espeja (propiedades lógicas) |
| Errores de consola | Ninguno |

## Decisiones de estilo

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | El cuadro es el propio `<input>` (`appearance: none`); la marca es su `::after` | Sin ocultar el control nativo; el estado sale de `:checked` e `:indeterminate` |
| 2 | Tarjeta: borde `border-strong`; el cuadro interior (3.45:1) es lo que identifica al control | WCAG 1.4.11 se cumple en el cuadro, la tarjeta es un contenedor |
| 3 | Chip: contorno `border-control` (3:1) | No tiene cuadro interior; el contorno es lo único que lo identifica |
| 4 | Borde de doble grosor con `box-shadow` interior (inválido, tarjeta o chip) | No cambia el tamaño ni mueve el texto |
| 5 | Solo lectura: fondo `surface-sunken` y borde discontinuo; marcada, relleno `text-muted` | Se distingue de `disabled` (atenuado, `text-subtle`) sin perder legibilidad |
| 6 | El anillo de foco del cuadro va separado (`--g-focus-offset`), no pegado como en `GInput` | Es un control pequeño y suelto, como el botón; en un campo el borde pegado se lee mejor |

## Hallazgos para lima

Ninguno.

## No verificado

- Los `.vue`: bruno.
- Las preferencias reales `prefers-reduced-motion` y `forced-colors` (la herramienta no las emula; se aplicó el contenido de cada bloque sin su condición).
- Zoom al 200% del navegador y dispositivo táctil real.
- La marca dibujada en Firefox y Safari: se comprobó en Chromium; dibujar en `::after` de un `<input>` con `appearance: none` es un patrón común, pero conviene revisarlo en esos navegadores.
- Casilla con `layout="card"` o `"chip"` dentro de un `GCheckboxGroup` con `disabled` heredado.
