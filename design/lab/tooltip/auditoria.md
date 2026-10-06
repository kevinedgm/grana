# GTooltip · auditoría de coco (paso 5)

> Sobre el **componente real**: `GTooltip.vue` + motor `utils/tooltip.js` de bruno (`0b521b5`, caja visible `5374d51`, elemento resuelto `d36bcef`), `dist/grana.umd.js`, `dist/combobox.umd.js`, `dist/file-field.umd.js` y `dist/grana.css` tal como se publican. Contrato `design/contracts/tooltip.md` (#380 a #399); estilo `design/lab/tooltip/estilo.md` (`8df1d85`, `fa09691`).
> Banco: `auditoria-banco.html` (`?theme=audit|<generado>`, `?dark=1`, `?part=matrix|sides|edge|rtl|narrow|motion|x383`). Verificación: `GRANA_PW_PORT=4209 node design/lab/tooltip/auditoria-verificar.mjs` (requiere `dist/`; `--engines=…`, `--shots`, `--verbose`).
> Tema de esta auditoría, generado con `@grana/cli`: `auditoria-tema.json` → `auditoria-tema.css` (brand `#14532D`, accent `#B45309`, neutros teñidos, **radius 14** (`--g-radius-md` 14px, `--g-radius-sm` 10px), **space 5**, fontSize 17, **borde 2px**; claro y oscuro). Distinto del de la entrega de estilo (radius 2) para cargar las esquinas y las curvas de unión.

## Resultado

**6944/6944** comprobaciones: Chromium **2344/2344**, Firefox **2300/2300**, WebKit **2300/2300** (Chromium mide además el contraste de los once temas generados de `dark-color-presence`, claro y oscuro). Antes de corregir el hallazgo 1, la misma verificación daba 2231/2344 en Chromium (113 fallos «una curva de unión asoma fuera de la etiqueta»).

Sin defectos bloqueantes abiertos: **`status: "candidate"`** en `GTooltip.meta.json`.

Además, tras la corrección: `estilo-verificar.mjs` 1454/1454 (Chromium), `tests/tooltip.spec.mjs` 29/29 (Chromium, puerto 4209), `vitest` de `GTooltip` 55/55, `npm run build` y compuertas (`g-tooltip__tab`, `g-btn--variant-soft`, sin `data:font`, sin `createApp`).

## Hallazgos

| # | Dueño | Gravedad | Estado | Hallazgo |
| --- | --- | --- | --- | --- |
| 1 | coco | Defecto visible (no de accesibilidad) | **Corregido** | **Mota de la curva de unión fuera de la etiqueta.** El cuadrado de cada curva medía `curva + --g-border-width` aunque no hubiera curva (`curva = 0`), y se colocaba junto a la pestaña. Cuando la pestaña llega al borde de la etiqueta (alineación `-start`/`-end`, botón de 120px, control junto al borde del visor) el cuadrado quedaba **fuera** de la etiqueta y su esquina pintada asomaba como una mota de 1–2px; con un control **más ancho que la etiqueta** (cualquier campo de más de `space × 70`, un `block`) la mota quedaba **flotando** a la altura del borde de la etiqueta, a decenas de px de ella (−40px en los campos de la matriz con el tema por defecto, −396px en el `block`). Con el borde de 2px del tema de auditoría se veía a simple vista (capturas a 4×). El banco de estilo no lo cazaba porque solo medía la posición de la pestaña, no la de las curvas. **Corrección** (`GTooltip.css`, cuatro reglas `--_s`): el borde que entra se acota a lo que sobra de etiqueta junto a la pestaña, `calc(clamp(0, sobra − r, curva) + clamp(0, sobra, borde))`; sin sobra, el cuadrado mide 0. Sin cambio en ningún otro caso (la curva y su entrada de borde son las mismas cuando sobra ≥ borde). Comprobación nueva en la verificación (§1): ninguna curva con tamaño sale de la etiqueta. |
| 2 | — (límite aceptado, #394) | Observación | Abierto, no bloqueante | **Esquinas de la pestaña junto a un control relleno con radio grande.** Con el tema de auditoría (`--g-radius-md` 14px en el botón, `--g-radius-sm` 10px en la pestaña) y la pestaña a ancho completo de un `GBtn` relleno, las esquinas superiores de la pestaña asoman en la curva del botón (más visible en oscuro, donde pestaña y botón son claros). Es el límite medido y aceptado en el contrato (§«Control más ancho que su etiqueta», ~2px con el tema por defecto); con radius 14 la cuña es mayor. Si se quisiera cerrar: la esquina de la pestaña del lado del control tomaría el radio del control (no hay token del radio de cada control; decisión de lima). |
| 3 | — (por diseño) | Observación | No es defecto | **Control pegado al borde del visor.** La etiqueta conserva su margen `space × 2` del visor y la pestaña se acota a la parte de la caja que la etiqueta cubre: 9,5–10,4px menos que el control en las cuatro esquinas, en los tres motores. Con `placement="left"` o `right-end` en las esquinas inferiores, `anchor.js` elige `top` (el lado pedido no cabe con su margen en el eje cruzado); la etiqueta queda dentro del visor y con la forma correcta. |
| 4 | — (motor de prueba) | Observación | No medible aquí | `forced-colors` y `pointer: coarse` se emulan en los tres motores de Playwright; la pulsación larga es **sintética** (`PointerEvent` con `pointerType: "touch"`). En el táctil emulado, `GSwitch`, `GCheckbox` y `GFileField` resuelven a un `<input>` (casilla o archivo), que conserva `user-select` por la regla `:not(input, textarea)`: no tiene texto que seleccionar y la caja de `GFileField` (`g-file-field__add`) sí queda en `none`. |
| 5 | bruno | Menor | Abierto, no bloqueante | `GTooltip.meta.json`: `"decisions": "DECISIONS.md #380 a #398"` no incluye #399 (elemento resuelto), que ya está construido (`d36bcef`). |

## Qué se midió (`auditoria-verificar.mjs`)

### Forma A sobre el componente real

- **Matriz completa de hijos admitidos** (tema de auditoría claro y oscuro y tema por defecto): `GBtn` button y `a`, `GInput` con `prefix`/`suffix` y un `GBtn tooltip` en `action` (los dos tooltips), contraseña, `GTextarea`, `GSelect`, `GNumberField` con −/+, `GCombobox` campo y `palette`, `GDatePicker`, `GSwitch`, `GCheckbox`, `GHelper`, `GFileField` vacío y con archivos. Abiertos con el puntero en el centro de su **caja visible** (`data-g-tooltip-box`; comprobado que el ancla es la caja y no el elemento resuelto en los nueve casos con marca). Pestaña = caja ∩ etiqueta, Δ ≤ **0,25px** en los tres motores; toca el borde de la caja (Δ ≤ 0,5px), entra `--g-border-width` en la etiqueta, nunca sobresale; hueco `space × 1,5`; etiqueta ≥ caja hasta `min(space × 70, visor − space × 4)`; uno solo abierto.
- **Esquinas y curvas evaluadas en cada caso**: el radio de cada esquina del lado de la pestaña es lo que sobra de etiqueta, hasta `--g-radius-md` (la expresión computada `clamp(0px, calc(100% − …), r)` se evalúa con el ancho de la etiqueta); cada curva mide `clamp(sobra − r, 0, curva) + clamp(sobra, 0, borde)`, toca la pestaña y no sale de la etiqueta (hallazgo 1).
- **Control relleno** (`GBtn` sólido) a los **doce lados**: lado pedido y alineación `start`/`center`/`end` (centros y bordes Δ ≤ 0,5px); a los lados, con un nombre de tres líneas (curvas verticales). **120px** con «Listo»: etiqueta = control y esquinas del lado de la pestaña rectas (arriba y abajo). **`block`**: etiqueta al máximo (280px; 350px con space 5), pestaña acotada a ella y centrada sobre el control. **Segunda etapa** del relleno: forma correcta con el detalle y el atajo, borde junto al control fijo.
- **Visor**: cuatro controles fijos en las esquinas (observación 3). **RTL**: barra, `placement="left"` al lado físico derecho, `bottom-start` alineada a la derecha, `right-end` a la izquierda física y abajo, `GInput` con prefijo y sufijo; curvas espejadas (`::before`/`::after` de `left` en RTL con el degradado de `right` en LTR). **320px** (zoom al 400 %): nombre largo, `block` y campo dentro del visor con su margen, con space 4 (8–288px) y space 5 (10–310px).

### Movimiento (tema de auditoría, `--g-duration-press` a 1000 ms para contar cuadros)

- **Viaje por relevo** en una barra `role="toolbar"` (Deshacer → Compartir, cuatro controles): **una sola etiqueta visible en los 97 cuadros y ninguno vacío**, el entrante sin fundido de entrada, 43 cuadros intermedios, monótono, sin rebase, la pestaña dentro de la etiqueta en cada cuadro, Δ0 al llegar y `data-travel` e `inline-size` retirados. Igual en los tres motores.
- **Segunda etapa** abajo (barra, `bottom`) y arriba (`placement="top"`): el borde junto al control no se mueve (Δ ≤ 0,5px) mientras el alto crece de forma monótona (≥ 8 cuadros); no cambia de lado.
- **Movimiento reducido**: el viaje salta (0 cuadros intermedios), la segunda etapa aparece sin crecer, el fundido de opacidad se queda.
- **Entrada en frío** con fundido (`opacity` < 1 en el primer cuadro); **reabrir antes de `SKIP`** con `data-instant` y opacidad 1 en el primer cuadro.

### Accesibilidad

- **Contraste** del nombre, el detalle y el atajo sobre la superficie inversa, borde del atajo, pestaña y etiqueta frente a la página: mínimo **15,2:1** (Chromium, 26 temas: defecto, auditoría y los once generados, claro y oscuro), 15,22:1 en Firefox y WebKit (cuatro temas).
- **Texto**: nombre, detalle y atajo ≥ 12px en todos los casos (el atajo, el menor: 12px con el tema por defecto y 12,75px con el de auditoría); sin recorte en ningún caso.
- **WCAG 1.4.13**: Esc cierra con el foco en el control (no lo mueve); el puntero baja del control a la etiqueta **cruzando la pestaña** en 12 pasos sin cerrarla; persiste 2 s sobre la etiqueta y 3 s con el puntero quieto en el control; el texto de la etiqueta se puede seleccionar.
- **Foco solo por navegación**: Tab (Alt+Tab en WebKit) abre; el clic y el foco por programa no.
- **`forced-colors` emulado** (tres motores): pestaña `Canvas` con sus dos lados de `--g-border-width` en `CanvasText`, borde de la etiqueta `CanvasText`, sin curvas; `CanvasText`/`Canvas` ≥ 3:1. La pestaña sigue visible.
- **Táctil emulado** (`hasTouch`, `pointer: coarse` en los tres): `user-select: none` y `-webkit-touch-callout: none` (donde existe) en el control y en la caja visible; campos de texto editables (observación 4). Pulsación larga sintética: nada a 300 ms, nombre a ~500 ms con `data-touch`, **soltar no activa** (0 clics), queda el tiempo de lectura; un toque corto activa una vez y no muestra.

### #383 en componentes reales (Δ0 frente al mismo marcado sin tooltip; temas por defecto y de auditoría)

Descendientes de cada contenedor (sin el nodo `.g-tooltip`): caja relativa (Δ ≤ 0,05px por columnas en posiciones fraccionarias), márgenes, rellenos, anchos y colores de borde, sombra, `white-space`, mínimos y `display`, **idénticos** con y sin tooltip, y sin cambio al **abrir** el tooltip:

- `GInput` con `GBtn tooltip` en `action`;
- `GInputGroup` con un `GBtn tooltip` como parte seguida de su unidad («mmHg»), y en estado de advertencia con el `GBtn tooltip` como última parte;
- `GFormRow` con un `GInput` envuelto y un `GBtn tooltip`;
- `GAdaptiveLayout` con un `GInput` envuelto (`g-adapt-short`) y un `GBtn tooltip`;
- `GCard` `size="narrow"` con un `GBtn tooltip` en un `dl.g-card__meta` del slot `meta` y dos en `actions`;
- `GDialog`: el último control del cuerpo con tooltip conserva `margin-block-end: 0`, cuerpo y panel con el mismo alto que sin tooltip, y abrir el tooltip no mueve el cuerpo.

## No verificado

Lector de pantalla real; táctil real (lupa y menú contextual de iOS con `-webkit-touch-callout`, que no existe en los motores de escritorio); Safari real con Tab por defecto; `forced-colors` real (Windows); la salida con fundido en Firefox y WebKit (sus motores de Playwright no transicionan `display` de un popover; ver `estilo.md`).
