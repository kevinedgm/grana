# Auditoría · GContainer (paso 5, coco)

**Componente:** `GContainer` (`GContainer.vue` de bruno, 199f170; principal) sobre `GContainer.css` (coco, 2971e33) y `container.md` (lima, 86297b9; #717, #721 a #724) · **Fecha:** 2026-10-21 · **Resultado:** sin defecto bloqueante → **`candidate`**

**Verificación propia:** `GRANA_PW_PORT=4215 node design/lab/container/auditoria-verificar.mjs` (requiere `npm run build`). Dos bancos con componentes **reales** de `dist/`: el de bruno (`packages/vue/playground/container.html`, sin chasis: el contenedor es el `main`) y el de esta auditoría (`design/lab/container/auditoria-banco.html`): la página del prototipo r01 de kiwi reconstruida con piezas reales dentro de `GAppShell` + `GSidebar` (`GPageHeader` de primer hijo, prosa, `GSection` con un contenedor anidado, tabla desplazable `g-bleed`, banda `g-bleed` con `data-g-zone="brand"`, `GTable` con `g-bleed`, `GSurface` con un contenedor y `GDialog` abierto con otro).

| Motor | Comprobaciones |
| --- | --- |
| Chromium | 159/159 |
| Firefox | 157/157 |
| WebKit | 157/157 |
| **Total** | **473/473** |

Además, los specs de bruno sobre el estado final (`GRANA_PW_PORT=4217 npx playwright test tests/app-shell.spec.mjs tests/app-shell-perf.spec.mjs tests/container.spec.mjs tests/stack-section.spec.mjs`, tres motores): **196 pasan, 2 omitidos por diseño** (`forced-colors` solo en Chromium); aquí cuentan `container.spec.mjs`.

**Temas:** por defecto, `spotify` y `medium` de `generated/`, `spotify` y `grana` derivados por `@grana/cli` en el momento (con su zona de marca), el de prueba (`space` 5, títulos serif, borde 2 px), todos en claro y oscuro; además el texto al 200 %. Capturas lado a lado prototipo ↔ real: `auditoria-bleed.png` (B · `g-bleed`), `auditoria-prose.png` (`xl` + `prose`) y `auditoria-reading.png` (`width="reading"`).

## Auditoría previa

- **Estructura:** dos cajas (raíz que se mide, columna que se coloca); ni relleno de bloque, ni separación entre hijos, ni pintura. El ritmo lo pone `GStack` y la superficie `GSurface`: el contenedor no reconstruye ninguno.
- **Riesgos al empezar:** L4 (relleno de `GPageHeader` dentro de la columna), anfitrionas (`GSurface`, `.g-dialog__body`), `GTable` con `g-bleed` (L10), `prose` con primitivas de página, `reading` con fuentes de otro tema, desplazable alineado al final en WebKit.

## Auditoría posterior

| Aspecto | Estado | Evidencia (componente real, tres motores) |
| --- | --- | --- |
| Columna y margen | Cumple | En el chasis, a 1440×900, 1024×768, 390×800 y 320×256, LTR y RTL: columna `md` = `min(caja − 2 × clamp(space-4, 4cqi, space-12), 768)` centrada al píxel, márgenes publicados = reales, la caja es el marco del chasis; sin chasis (`as="main"`): `sm`, `lg`, `xl`, `full` con su máximo |
| Anidado sin acumular | Cumple | Contenedor `sm` al inicio dentro de la columna (en una `GSection`): empieza en la columna; dentro de `GSurface`: empieza en su relleno, publicados 0; dentro de `.g-dialog__body` de un `GDialog` abierto: sin margen propio |
| B · Sangrado | Cumple | A 1440 (LTR y RTL) y 390: la banda con zona de marca y la tabla desplazable llegan a los dos bordes de la caja (nunca bajo el sidebar); título y botón de la banda en la columna; el desplazable arranca alineado con el texto y termina alineado con el final de la columna (WebKit ±2 px al final, desplazamiento a píxel entero, límite del motor ya anotado en `estilo.md`); sin desplazamiento horizontal |
| `GTable` con `g-bleed` | Cumple (con límite) | La raíz llega a los bordes de la caja y, como `g-bleed` le da relleno en línea, su leyenda y sus celdas arrancan en la columna en reposo (LTR y RTL). El límite L10 se precisa: lo que no llega al borde es el **desplazable interno** de la tabla cuando es más ancha que la columna |
| A · `prose` | Cumple | Con la fuente de cada tema (por defecto, `medium`, prueba): el párrafo en `66ch` al inicio; lista y título comparten su borde final; la prosa dentro de `GSection` y de una banda `g-bleed` también se mide (primitivas transparentes); la de `GSurface` queda fuera; el desplazable y `GTable` usan el ancho entero; texto al 200 %: sin desbordar |
| A · `reading` | Cumple | La columna es `66ch` de su fuente en los tres temas |
| `GPageHeader` de primer hijo | Cumple (L4 anotado) | El zócalo se pega bajo la banda del chasis a toda la página (#724) y ocupa la columna. **L4 medido:** el `h1` queda **24 px (= `space × 6`) por dentro** del texto de la página y las acciones terminan 24 px antes del final de la columna, en los tres motores; no se arregla aquí (decisión pendiente en `GPageHeader.css`, `PENDIENTES.md`) |
| Reflujo (1.4.10) | Cumple | 320×256 con y sin chasis: sin desplazamiento horizontal; la URL larga se parte dentro de la columna |
| Contraste | Cumple | El contenedor no pinta (fondo transparente en los 12 temas); la banda `g-bleed` con zona de marca, título y texto ≥ 4,5:1 en todos |
| `forced-colors` (Chromium) | Cumple | Sin fondo, borde ni contorno: nada que perder |
| Estados, carga, vacío, error | N/A | No interactivo, sin datos |
| Movimiento | N/A | Ninguno (contrato); con el chasis el cambio de ancho llega una vez por A · Cortina (auditoría de `GAppShell`) |
| Consola | Cumple | Sin errores ni avisos en ningún banco |

**Prototipo ↔ real:** misma columna y mismo sangrado; el real lleva además el zócalo pegado de `GPageHeader` y la zona de marca real (`--g-color-brand-zone`). En los dos se ve el desfase L4.

**Nota de temas:** los CSS de `design/lab/tema-oscuro/dark-color-presence/generated/` no traen `--g-color-brand-zone` (se generaron antes de #620): con ellos, la zona de marca es la del tema por defecto. Por eso la auditoría deriva también `spotify` y `grana` con el CLI actual.

## Correcciones de esta auditoría

Ninguna en `GContainer.css`.

## Para lima (consolidado desde `estilo.md`)

1. **Primitivas transparentes para `prose`** (enmienda de «A · Medida»): `.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed`, `.g-bleed-raw` no cortan la medida; el título y la descripción de `GSection` siguen fuera. Medido con el real: la prosa de una `GSection` y de una banda `g-bleed` se mide. Registrar la lista (una primitiva nueva se añade, como el mapa de anfitrionas).
2. **`box-sizing: border-box` en la prosa medida** (la lista con sangría termina donde el párrafo; medido con el real).
3. **`sign()` para `--g-container-max`**: sin constante nueva.
4. **L4 medido:** 24 px (`space × 6`) de `h1` y de acciones, en los tres motores, con y sin chasis. Sigue pendiente la decisión en `GPageHeader.css`.
5. **L10 precisado:** `GTable` con `g-bleed` alinea su leyenda y sus celdas con la columna en reposo; lo que no llega al borde de la caja es su desplazable interno cuando la tabla es más ancha. Ajustar el texto de «Límites conocidos».

## Para bruno

Nada bloqueante. (Las notas de `estilo.md` —clases de los cuatro ejes siempre, `--g-container-max` en la raíz, aviso 5 contra la columna— están cumplidas en el `.vue`.)

## Para mora-docs (`GContainer/README.md`)

Las dos recetas (con chasis `as="div"`, sin chasis `as="main"` con `GPageHeader` de primer hijo); `g-bleed` con la receta del relleno propio; `prose`, `g-wide` y las primitivas que no cortan la medida; límites: L4 (24 px), `GTable` con `g-bleed` (desplazable interno), `--g-container-max` no se hereda.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Columna, margen continuo, anidado y anfitrionas (`GSurface`, `.g-dialog__body`), B con piezas reales y zona de marca, A (`prose`, `reading`) con la fuente de cada tema, reflujo a 320×256, RTL, nada pintado en 12 temas, `forced-colors`, consola limpia, en los tres motores.

**Correcciones.** Ninguna.

**Pendientes.** L4 (decisión en `GPageHeader.css`); las notas a lima; `forced-colors` en Firefox y WebKit y zoom real del navegador, no verificables aquí.

## Addendum L4 (2026-10-21, coco): `GPageHeader` de primer hijo, a ras de la columna

**Hallazgo (#751):** con `GPageHeader` hijo directo de `.g-container__body`, su relleno lateral `--_pad` se sumaba al margen del contenedor. Medido antes del cambio con `node design/lab/container/l4-verificar.mjs` (Chromium, 84/192): `h1`, acciones, primera pestaña y título compacto **24 px** por dentro de la columna en ancho (1440 y 1024, con y sin chasis, LTR, RTL, `horizontal="start"`) y **16 px** en estrecho (390, `--_pad` = `space × 4`); el muelle arrancaba su título 16 px por dentro; en estrecho RTL la primera pestaña quedaba además **15 px fuera** del inicio de la columna. El zócalo pegado ocupaba la columna, no la caja: a 1440 sin chasis dejaba 336 px a cada lado por donde pasaba la página.

### Opciones medidas

| Opción | Qué hace | Medida | Riesgo |
| --- | --- | --- | --- |
| **(a) Sangrar como `g-bleed`** | Hijo directo de la columna: margen negativo `--g-container-inset-*` y relleno igual; el zócalo devuelve `--g-tabs-inset` | Texto a ras: **0 px** en todo (abajo). Fondo, línea del suelo y sombra del pegado llegan a los dos bordes de la caja | Con una columna centrada ancha el zócalo pegado es una banda de borde a borde de la caja (es lo que hace la banda del chasis; antes era una tira de 768 px con la página asomando a los lados). `--g-tabs-inset` es simétrico en `GTabs`: con el sangrado entero en él, una columna centrada daría ~200 px de relleno al final de las pestañas; por eso el zócalo solo le pasa `min(--_pad, inicio)` y el resto va en su relleno |
| (b) Aceptar con receta | La aplicación resta: `.g-container__body > .g-page-header { margin-inline: calc(var(--g-space-6) * -1) }` | 0 px de texto en ancho, pero en estrecho hay que repetirla con `space × 4`, y si el margen de la columna es menor de 24 px (`gutter="sm"`/`none`, o 4cqi en cajas de 400 a 600 px) desborda la caja: desplazamiento horizontal | La receta depende de un relleno interno (`--_pad`), cambia con `is-narrow` y el zócalo pegado sigue sin llegar a la caja |
| (c) Relleno 0 sin sangrar | `--_pad: 0` dentro de la columna | Texto a ras, 0 px | El zócalo pegado sigue en la columna: con bandas `g-bleed` y la tabla sangrada, la página pasa a los lados del zócalo pegado; la línea del suelo y la sombra acaban en el filo del texto |

**Elegida: (a).** Es el mismo mecanismo que el contrato ya ofrece para «algo que ocupa la columna y llega al borde de la caja» (B · Sangrado alineado, #722), se apoya en los márgenes publicados (registrados, en px) y no deja nada a la aplicación. Con margen 0 (contenedor anidado, `GSurface`, `.g-dialog__body`) no sangra y el texto va a ras del de la anfitriona.

### Qué cambia en `GPageHeader.css`

- Relleno por lado `--_pad-s`/`--_pad-e` (por defecto `--_pad`) y `--_tabs-in: min(--_pad, --_pad-s)`.
- `.g-container__body > .g-page-header`: `--_pad-s/-e` = `--g-container-inset-start/-end` y `margin-inline` negativo con los mismos.
- Zócalo: `margin-inline: -pad-s -pad-e`; relleno del inicio `calc(pad-s − tabs-in × (1 − --_p))` (fuera del contenedor es `--_pad × --_p`, como antes); `--g-tabs-inset: --_tabs-in`; sin pestañas, `--_pad-s`.
- Muelle: relleno lateral `max(space × 4, --_pad-s/-e)` (fuera del contenedor, idéntico: en estrecho `--_pad` = `space × 4`).
- Fuera de la columna de un contenedor, todo resuelve a los valores anteriores (lo confirman 1284/1284 de `estilo-verificar.mjs` y 41/41 de los specs).

### Medido después (tres motores)

`l4-verificar.mjs`: 32 casos por motor (1440 y 1024, con y sin chasis, LTR y RTL, `horizontal="start"`, con y sin pestañas, y 390 estrecho con muelle), en reposo y pegado. **Chromium 192/192, Firefox 192/192, WebKit 192/192.** En todos: `h1` Δ **0 px**, acciones Δ **0 px**, primera pestaña Δ **0 px**, título compacto con `--_p = 1` Δ **0 px**, título del muelle Δ **0 px**; raíz y zócalo pegado a **0…0 px** de los bordes de la caja; muelle de borde a borde de la caja; línea del suelo y sombra presentes; sin desplazamiento horizontal; consola limpia.

| | Antes (ancho / estrecho) | Después |
| --- | --- | --- |
| `h1` y acciones, con chasis | 24 / 16 px | 0 px |
| `h1` y acciones, sin chasis | 24 / 16 px | 0 px |
| Primera pestaña (RTL estrecho) | 24 / −15 px | 0 px |
| Zócalo pegado | la columna | la caja |

`auditoria-verificar.mjs`: la comprobación de L4 pasa a «a ras» y la del pegado a «llega a los bordes de la caja»: Chromium 159/159; partes `base,bleed,prose,hosts` en Firefox 109/109 y WebKit 109/109. `design/lab/page-header/estilo-verificar.mjs` 1284/1284 (se admiten los dos márgenes publicados de `GContainer` como propiedades fuera del tema). Specs `page-header` + `container` en Chromium 41/41. Compuertas 84/84.

### Para lima

- `container.md` L4: «(a) **cerrado** (#751, coco): de primer nivel en la columna, `GPageHeader` sangra como `g-bleed` (margen negativo con `--g-container-inset-*` y el mismo relleno); el `h1`, las pestañas, las acciones, el título compacto y el muelle quedan a ras de la columna y el fondo, la línea y la sombra del zócalo pegado llegan a los bordes de la caja; medido 0 px en los tres motores, con y sin chasis (`design/lab/container/l4-verificar.mjs`)».
- `container.md` «Límites conocidos»: quitar la viñeta de `GPageHeader` dentro de la columna, o sustituirla por: «**`GPageHeader` solo sangra de primer nivel** (hijo directo de la columna). Dentro de un `GStack` u otro envoltorio conserva su relleno propio (`space × 6`, `space × 4` en estrecho) y queda por dentro de la columna; para alinearlo, que sea hijo directo».
- `page-header.md`: añadir a «Clases y datos» o a la anatomía que, como hijo directo de `.g-container__body`, la raíz sangra hasta la caja del contenedor y consume `--g-container-inset-start/-end`.
- Registrar en `DECISIONS.md` el cierre de L4 con la opción (a) y lo descartado ((b) desborda con márgenes < 24 px y cambia con `is-narrow`; (c) deja pasar la página a los lados del zócalo pegado).

### Para bruno

- `is-narrow` se calcula con `root.clientWidth` (`GPageHeader.vue`, «mide la raíz»): sangrada, la raíz mide la caja y no la columna, así que entre ~600 y ~650 px de caja el encabezado ya no es estrecho aunque su columna mida menos de `space × 150`. No se ve como defecto en el banco (ni desborde ni acciones fuera), pero si se quiere el umbral por el ancho útil, medir `clientWidth − padding-inline`. No bloquea.

### Para mora-docs

- `GContainer/README.md`, límites: quitar «el `h1` y las acciones de `GPageHeader` quedan 24 px más adentro»; poner «`GPageHeader` de primer hijo de la columna sangra hasta los bordes de la caja (como `g-bleed`) y deja su texto a ras de la columna; dentro de un envoltorio conserva su relleno».
- `GPageHeader/README.md`: en la receta con `GContainer`, decir que va como hijo directo y que su zócalo pegado ocupa la caja del contenedor.

### No verificado

`GPageHeader` de primer hijo de un contenedor anidado o dentro de `GSurface`/`.g-dialog__body` (margen 0: por cálculo no sangra; sin banco); `forced-colors` de este caso en Firefox y WebKit; zoom real del navegador; lector de pantalla (no cambia nada semántico).

### Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** Texto del encabezado a ras de la columna (0 px) y zócalo pegado al borde de la caja en los tres motores, con y sin chasis, LTR y RTL, `horizontal="start"`, pestañas, título compacto y muelle; nada cambia fuera de un contenedor; solo `var(--g-*)` y `--_*`, sin respaldos.

**Correcciones.** `GPageHeader.css` (sangrado de primer nivel en la columna y relleno por lado); `auditoria-verificar.mjs` y `estilo-verificar.mjs` actualizados; banco con `?tabs=1` y `?h=start`; script nuevo `l4-verificar.mjs`.

**Pendientes.** Los textos de lima y mora-docs de arriba; la nota de `is-narrow` para bruno; lo no verificado.

