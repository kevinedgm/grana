# GCombobox · estilo (coco)

> Paso 3 del flujo. Contrato: `design/contracts/combobox.md` (lima, #329 a #338). Estructura: `r01/` (base) y `r02/` (kiwi; el usuario eligió mirando `r02/index.html?c=AC` y `?c=B`). CSS: `packages/vue/src/components/GCombobox/GCombobox.css`. Banco: `estilo-banco.html` (componentes reales de `dist/` + marcado del contrato a mano). Verificación: `GRANA_PW_PORT=4209 node design/lab/combobox/estilo-verificar.mjs` (requiere `npm run build`).

## Personalidad: qué conservo de los prototipos elegidos y qué afiné

**Lo que da carácter al componente** (y lo que el CSS protege):

1. **Una sola forma (A).** Abierto, el campo no tiene un menú debajo: el campo *crece*. El popover empieza en el borde superior de la caja (o termina en el inferior, `is-up`), mide lo que ella y su zona alta es transparente y no captura el puntero. Contorno, anillo de foco y sombra (`--g-shadow-3`) son del popover; la caja los pierde mientras está abierta. Entre campo y lista, una línea fina (`--g-color-border`) que cae **exactamente** sobre la línea inferior de la caja (padding del popover = alto de la caja − 2 × borde). Con `rounded="pill"` el radio de la forma es medio alto de la caja, no 999px.
2. **El campo se completa (A).** El resto de la primera coincidencia se escribe en el propio campo sobre `--g-color-selection` (primer consumidor del rol), en `text-muted`: se lee como «texto propuesto, aceptable de un toque». Entra con un fundido corto (`@starting-style`, `--g-duration-fast`).
3. **El valor es un objeto (C).** En reposo, la ficha (avatar `xs` o código en su caja + nombre en peso `action` + dato secundario apagado) ocupa la celda sin cambiar la caja. Con el foco se pinta **seleccionada entera** (`--g-color-selection`): lo siguiente que se escribe la reemplaza. El texto libre lleva lápiz, cursiva y una **marca «Texto libre»** con borde (`border-strong`, `caption`): una etiqueta, no un adorno; no se recorta (cede la etiqueta).
4. **Las filas son fichas (C).** Nombre + una línea de datos con rótulo y separador; la activa **se levanta** en A (borde `--g-color-text` + `--g-shadow-1`, la del prototipo `?c=AC`) y **se invierte** en la superficie (par texto/superficie, #325, la del prototipo `?c=B`).
5. **La ficha llega.** Al elegir en la lista de A, la ficha sale de su fila y aterriza en el campo con `--g-ease-spring` (cuarto uso aprobado, #336). Opaca durante todo el viaje: es un objeto que llega, no un fundido.
6. **La paleta (B)** pone el campo de búsqueda como protagonista: `title-sm`, de borde a borde, con el foco como línea de `--g-focus-width` al pie; el título del diálogo baja a rótulo (`body-sm`, `action`, `text-muted`). Lista y ficha de la activa en proporción **6 : 5**, cuerpo de alto fijo (`space × 96`): la superficie no salta al cambiar los resultados.
7. **La hoja móvil va arriba** (no abajo como la de `GDialog`): el teclado virtual no tapa la lista. Entra desde arriba (`−space × 6`), espejo de la hoja de `GDialog`.

**Afinado respecto del prototipo:**

| Prototipo | Ahora | Por qué |
| --- | --- | --- |
| Despliegue de A con `--g-ease-spring` | `--g-ease-out` | #336: es una entrada |
| Llegada con opacidad 0,5 → 1 | Opaca | 0,5 sería una constante de coreografía nueva (#187); y un objeto que llega se lee mejor sólido |
| Llegada desde la fila exacta | Vector acotado a `space × 2 / 0.038` por eje | Rebase del muelle (3,8 %) ≤ `space × 2` también desde la fila más lejana (combobox.md «Movimiento») |
| Fantasma y ficha medidos por JS (`--_il`, `--_iw`) | Capas con `inset: 0` sobre la celda | La celda empieza donde el texto del `<input>`: nada que medir |
| Datos de la fila en varias líneas | **Máximo dos líneas** (nombre + una fila de datos con separador) | Reporte del usuario («amontonado, se desborda»): ver «Fichas de opción» |
| Transición de color por fila | La activa cambia en el acto | Reporte del usuario («tintinea»): dos fichas fundiéndose a la vez parecen dos marcos |
| Coincidencia en peso 700 | `--g-text-action-weight` + subrayado de `--g-focus-width` | Solo tokens; el subrayado lleva la señal (WCAG 1.4.1) |
| Ficha seleccionada solo en el nombre | La ficha entera | combobox.md «Teclado»: «la pinta seleccionada entera» |

## Fichas de opción (arreglo mínimo tras el reporte del usuario)

- Nombre en **una línea** con elipsis; datos en **una fila** con separador (línea vertical de `--g-border-width` en `border-strong`, no un carácter). Los datos que no caben pasan a una segunda línea que no se ve (alto de una línea, `overflow: hidden`): con más ancho caben más, ninguno queda partido. El primero (el identificador) va siempre al principio; si ni él cabe, se recorta él con elipsis. Sin `facts`, la `description` en una línea con elipsis.
- El lector recibe todo (lo recortado sigue en el DOM); el detalle completo vive en la vista previa de la paleta (`dl` que se parte).
- Las filas de acción («Usar «…» como texto libre») se parten, no se recortan: llevan lo que escribió la persona.
- **Pendiente para kiwi/lima:** el componente de fichas adaptable que pidió el usuario sustituirá esta regla; `GCombobox` lo adoptará.

## Medidas (banco, tres motores: 1370/1370 comprobaciones)

| Medida | Resultado |
| --- | --- |
| A · Δ caja–forma (izquierda, arriba, ancho), también hacia arriba | < 1px (0 en los tres motores) |
| A · costura | 0,00px (la línea cae sobre el borde inferior de la caja), por defecto, oscuro y Tema de prueba (borde 2px, space 5) |
| A · anillo | `outline` de la forma = `--g-focus-width` del color de foco; columna izquierda en píxeles sin cortes del campo a la lista; la caja sin anillo ni borde abierta |
| A · punto central del campo | el `<input>` (la zona alta del popover no captura el puntero) |
| A · abrir | Δ0 del campo y del alto del documento |
| A · cambio de lado al desplazar la página | 0 cuadros con la forma rota de 71, con 1 cambio de lado, en los tres motores |
| Fantasma | tinta de lo tecleado en el fantasma frente a la del `<input>`: Δ 0/0/0/0px (DPR 2, LTR y RTL); la prueba detecta 0,5px |
| C · Δ0 de alto con ficha | 0,00px en xs…xl frente a `GInput`, también con el Tema de prueba |
| C · ficha | centrada (±0,5px), su texto empieza donde el del `<input>` (±0,5px) |
| C · recorte | el secundario se recorta desde 350px de campo; la etiqueta, desde 215px (nunca antes que el secundario) |
| Fichas de opción a 240 / 320 / 480px de campo | bloque nombre + datos 44px (≤ 44,5 = `body-line + body-sm-line`), nada desborda, identificador visible; 1 / 2 / 3 de 4 datos (con «Médico» largo); en el playground real (420px), filas de 62px, 2 de 4 datos, 0 desbordes |
| Puntero sobre cinco opciones (ida y vuelta) | como máximo **1** superficie resaltada por cuadro |
| Llegada | ≥ 2 posiciones intermedias, termina en 0, se retira `is-arriving`; desde la cuarta fila (Δy 255–395px) parte acotada a 210,5px y rebasa 8,00px = `space × 2`; con un vector de 600px, igual |
| Despliegue | ≥ 2 alturas intermedias al abrir; cambiar los resultados no anima |
| Paleta 1280 | modal, dentro del visor, cuerpo 384px (`space × 96`), lista/vista 1,20, panel con desplazamiento, cuerpo del diálogo sin desplazamiento, foco en la búsqueda |
| Hoja 375 y 320 (`field` y `palette`) | arriba (top 0) a ancho completo, sin vista previa, filas ≥ 44px (62px), sin desborde, cuerpo sin desplazamiento |
| Fila de tres en `GFormRow` | `--g-form-min: 60`; 1100: en línea (342px); 720 y 320: se parte, el campo nunca < 239px; A funciona a esos anchos; el consumidor lo sobrescribe |
| `forced-colors` (Chromium, Firefox, WebKit emulados) | con `is-token` la ficha se retira y el `<input>` pinta `FieldText`; forma `CanvasText`; anillo `Highlight`; activa `Highlight`/`HighlightText` (también sus datos); fantasma `GrayText`; la coincidencia conserva peso y subrayado |
| Movimiento reducido | sin despliegue, sin giro de la flecha, la ficha no viaja (clase retirada en el acto); fundidos sí |

**Contraste** (mínimo de los 25 temas en Chromium: por defecto claro y oscuro, Tema de prueba, once generados claro y oscuro; en Firefox y WebKit, por defecto y spotify oscuro): todo ≥ 4.5:1 en texto y ≥ 3:1 en el borde de la activa. Mínimos en Chromium: etiqueta 15.2, coincidencia 15.2, rótulo de dato 6.99, fantasma 5.94, código 15.2, grupo 6.99, error de carga 4.51, ficha 15.2, secundario 6.99, marca «Texto libre» 6.99, ficha seleccionada 13.36 / 5.94, activa invertida 15.2, vista previa 13.36 / dt 5.94 (cifras completas en la salida del script).

## Constantes y alias (no son tokens)

- `space × 9` (alto mínimo de fila, el de la caja `md`), `space × 8` (hueco inicial = avatar `md`), `space × 14` (columna de códigos), `space × 96` (alto máximo de la lista de A y del cuerpo de la superficie), **6 : 5** (lista : vista previa), `space × 12` (campo de búsqueda, piso 44px). Medidas de diseño derivadas de `space` (tokens.md §32).
- `space × 2 / 0.038`: cota del vector de llegada (rebase máximo `space × 2` con el 3,8 % de `--g-ease-spring`). Alias local `--_cb-tx/ty` (§29.7).
- `/ 2`: geometría (radio de píldora = medio alto; costura y alineación del código centradas). `0.5turn`: media vuelta de la flecha. `2.5`: giro lento con movimiento reducido (el de `GInput`).
- Alias propios `--_cb-row`, `--_cb-r`, `--_cb-tx`, `--_cb-ty`. Lee de `GInput` `--_focus`, `--_radius`, `--_fs`, `--_lh`, `--_gap`, `--_density` y de `GDialog` `--_gap`, `--_inset-radius`.

## Marcado que espera el CSS (para bruno)

- Popup, región viva y superficie **descendientes de la raíz** `.g-combobox` (heredan `--_focus`, `--_radius`…). Variables en línea en `.g-combobox__popup`: `--_x`, `--_top`/`--_bottom` (el otro `auto`), `--_w`, **`--_field-h` = alto de borde a borde de `.g-input__control`**, `--_max` = sitio para la **lista** (sin la caja). `is-up` y las variables, en el mismo cuadro.
- `is-empty` en el popup lo oculta con `display: none` (así la llegada del panel cuenta como abrir y se despliega).
- Llegada: `--_travel-x/y` en `.g-combobox__token` (px, de la caja final de la ficha a su fila); retirar `is-arriving` en `animationend`/`animationcancel` de `g-combobox-arrive`.
- Vista previa: si el contenido se crea por opción (`key`), entra con un fundido corto.
- `GCombobox.css` va en `components.css` después de `GInput.css`, `GAvatar.css` y `GDialog.css` (sobrescribe la hoja de `GDialog` con especificidad 0,3,0).

## Para lima (ideas, no bloquean)

- **Resaltado único que viaja** entre opciones (como `GMenu`, #305): coherente con la personalidad de Grana y con las fichas altas. Requiere que bruno entregue `--_active-y/h` del panel; hoy la activa cambia en el acto (una superficie por cuadro, medido).
- La opacidad 0,5 → 1 del prototipo en la llegada, si se quiere recuperar, es una constante de coreografía nueva (§29.6).

## No verificado

`forced-colors` real (solo emulado); lector de pantalla; teclado virtual real sobre la hoja; IME con el fantasma; Safari real; zoom 200/400 % real. La auditoría del componente real (paso 5) con tema distinto y oscuro está en `auditoria.md`.
