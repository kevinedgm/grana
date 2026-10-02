# Entrega de coco · GDivider.css y `--g-divider-inset`

**Archivos:** `packages/vue/src/components/GDivider/GDivider.css`, valor de `--g-divider-inset` en `packages/vue/src/styles/defaults.css` (capa `grana.defaults`, `:root`, bloque que no depende del esquema de color).
**Contratos:** `design/contracts/divider.md`, `docs/contract/tokens.md` §22 (DECISIONS.md #190 a #192).
**Estado:** listo para bruno (`GDivider.vue`, pruebas, `meta.json` y el registro en `components.css` aún no existen).
**Banco de pruebas:** `design/lab/divider/estilo-banco.html` (desde la raíz del repo, `python3 -m http.server 4190`): marcado exacto del contrato generado por una fábrica que hace lo que hará bruno (elemento y atributos por caso, clase de inset efectiva, `--labeled` solo con texto en horizontal). Ocho secciones: horizontal simple, con texto (superficie, hundida, texto largo a 200px), inset `none`/`both`/`start` (y una lista con icono que redefine el token, en `default` y `compact`), vertical entre grupos de acciones con `GBtn` reales `sm`/`md`/`lg` y en grid, `subtle` frente a `strong` sobre las dos superficies, decorativo frente a separador, dentro de un `GDialog` real y RTL local. Controles: tema (por defecto, «Tema de prueba» y los diez generados), oscuro, RTL, ancho 320/375. Parámetros `?dark=1`, `?rtl=1`, `?theme=<nombre>`, `?test=1`.
**Verificación:** `node design/lab/divider/estilo-verificar.mjs` (Chromium por defecto; `--engines=chromium,firefox,webkit`; `--verbose` para la tabla por tema).

## Carácter

Una línea fina y discreta: un solo grosor (`--g-border-width`), dos tonos del neutro, sin sombra, sin fondo, sin radio, sin estados ni movimiento. El divider no pone aire: lo pone la pila o la fila (`gap`), y solo el inset acorta la línea.

| Detalle | Cómo |
| --- | --- |
| **Reseteo del `<hr>`** | `margin: 0`, `padding: 0`, `border: 0`, `color: inherit`, `background: none`, `overflow: visible` (el agente pone margen de bloque, margen de línea `auto`, borde `inset` de 1px, color gris y `overflow: hidden`). Verificado: márgenes 0, solo el borde de arriba, estilo `solid`, alto = grosor del borde |
| **Horizontal** | `display: block`, `block-size: 0`, `border-block-start`; `align-self: stretch` para que una columna flex que centra a sus hijos no lo encoja a 0 |
| **Vertical** | `display: block`, `flex: none`, `align-self: stretch` (también con `align-items: center`), `inline-size: 0`, `block-size: auto`, `border-inline-start`. Nunca `block-size: 100%` ni alto fijo |
| **Con texto** | Raíz flex con `align-items: center` y `gap` = `space × 3`; líneas en `::before`/`::after` con `flex: 1 1 0`, mínimo `space × 4` y **borde** de arriba; el texto `flex: 0 1 auto`, sin fondo, `overflow-wrap: anywhere`, centrado. Tipografía `body-sm` completa (tamaño, interlínea, peso y tracking) en `--g-color-text-muted`, familia `--g-font-ui` |
| **Énfasis** | `subtle` = `--g-color-border`; `strong` = `--g-color-border-control` (alias `--_line`). Con texto afecta a las líneas, no al texto |
| **Inset** | Horizontal `both` → `margin-inline`, `start` → `margin-inline-start`; vertical `both` → `margin-block`; siempre `var(--g-divider-inset)` |
| **`prefers-contrast: more`** | Las dos líneas suben a `border-control` (≥ 3:1) y el texto a `--g-color-text` (precedente de `GFormActions` y `GTabs`) |
| **`forced-colors`** | Raíz, `::before` y `::after` con `border-color: CanvasText` (como `GMenu` y `GDialog`); el texto ya es `CanvasText` por el sistema |
| **RTL** | Solo propiedades lógicas y flex; sin `:dir()` ni prop |
| **Literales** | Ninguno: ni colores, ni medidas, ni respaldos (no es interactivo, así que tampoco `24px`/`44px`). Sin `@layer` |

## Valor de `--g-divider-inset`: `space × 2` (8px), no `space × 4`

`--g-divider-inset: calc(var(--g-space-1) * 2)` en `:root`. No es de color: no se repite en el oscuro.

kiwi usó `space × 4` en el prototipo, pero el contrato fija **un solo token para las dos orientaciones** (#191), así que el valor por defecto tiene que funcionar también en vertical, donde el inset se resta **dos veces** del alto de la fila:

| Fila de `GBtn` | Alto | Vertical `inset="both"` con `space × 4` | con `space × 3` | con **`space × 2`** |
| --- | --- | --- | --- | --- |
| `xs` | 24 | 0 (desaparece) | 0 | 8 |
| `sm` | 28 | 0 (desaparece) | 4 | **12** |
| `md` | 36 | 4 | 12 | **20** |
| `lg` | 44 | 12 | 20 | **28** |

Con `space × 4` un separador vertical con inset en la fila más común (`md`) quedaría en 4px, y en `sm` mediría 0: **desaparece en silencio** (seguiría en el árbol como `separator`, sin señal visual). `space × 2` deja en `md` una línea del 55 % del alto, la proporción habitual de un separador de barra de herramientas. En horizontal, 8px por extremo sigue siendo un acortamiento visible (la prop no es inútil por defecto, que es lo que pide #191). La alineación exacta con el texto de una lista o con el relleno de una tarjeta **no** la puede dar ningún valor por defecto: la da la anfitriona redefiniendo el token (el banco lo hace con relleno + icono + separación y la línea arranca en el texto, ±1px, en `default` y `compact`).

## Hallazgo 7 de kiwi: líneas internas (`GMenu` con `border-strong`; `GDialog`, `GTable`, `GCard` con `border`)

**Decisión: `GDivider` se queda con `border` / `border-control` tal como dice el contrato, y `GMenu` no se toca.** No hay nada que unificar; la diferencia responde a una regla que ya siguen los componentes:

- **`border`** es la línea **entre secciones que ya tienen aire o título**: `g-dialog__section`, el pie de `GDialog`, el pie fijo de `GFormActions`, las filas de `GTable`, el pie de `GCard`, la línea base de `GTabs`. Es exactamente el papel de `GDivider subtle` (refuerza una separación que el espacio o un título ya dan). Verificado en el banco: el divider dentro del cuerpo de un `GDialog` real tiene **el mismo color calculado** que la línea de sección y la del pie, sobre la misma superficie, y no sangra.
- **`border-strong`** es la línea **estructural dentro de un componente denso**, donde es la señal principal y compite con rellenos: el separador de `GMenu` (elementos pegados, con el activo en `surface-sunken` justo al lado de la línea) y la cabecera de `GTable` (límite cabecera/cuerpo). Con `border` (1.2:1 sobre la superficie y ~1.1:1 contra el relleno de un elemento activo vecino) el separador del menú se perdería junto al hover; con `border-strong` mide 1.45:1 en claro y 1.9:1 en oscuro.
- **No hay choque de tono en la práctica:** el contrato prohíbe `GDivider` dentro de `GMenu` (aviso 2), y el menú es una capa flotante (borde `border-control`, `shadow-2`), nunca coplanaria con el contenido donde vive un divider. Y cuando un divider sí es la única señal, el contrato ya lo resuelve con `strong` (`border-control`, ≥ 3:1), que es más fuerte que `border-strong` (que no llega a 3:1, #89).
- Unificar el menú en `border` le quitaría la única señal de grupo en una lista densa; subir `GDivider subtle` a `border-strong` lo separaría del tono de `GDialog`/`GTable`/`GCard`, que son los vecinos reales de un divider. Ninguno de los dos cambios mejora nada.

Para lima (opcional, no bloquea): dejar escrita esta regla de uso de `border` frente a `border-strong` en `tokens.md`, para que el próximo componente no la reabra.

## Verificación en Chromium (banco, Playwright)

Contraste **medido** en la página (color calculado de la línea o del texto compuesto sobre el fondo real de la anfitriona, capas translúcidas incluidas), en el tema por defecto claro y oscuro, el «Tema de prueba» (Georgia, borde 2px, `space` 5) y los diez temas generados de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro (23 configuraciones).

| Medida | Defecto claro | Defecto oscuro | Spotify (marca pálida) claro / oscuro | Caracol púrpura claro / oscuro | Mínimo en los 23 |
| --- | --- | --- | --- | --- | --- |
| Línea `subtle` / `surface` · `surface-sunken` | 1.2 · 1.2 | 1.34 · 1.29 | 1.17 · 1.17 / 1.32 · 1.27 | 1.17 · 1.17 / 1.32 · 1.26 | 1.17 · 1.17 (informativo: no es la única señal) |
| Línea `strong` / `surface` · `surface-sunken` | **3.45 · 3.19** | **4.32 · 4.82** | 3.43 · 3.19 / 4.35 · 4.86 | 3.47 · 3.2 / 4.32 · 4.81 | **3.43 · 3.19** (≥ 3:1) |
| Texto / `surface` · `surface-sunken` | **7.46 · 6.9** | **8.59 · 9.59** | 7.38 · 6.87 / 8.62 · 9.62 | 7.49 · 6.91 / 8.61 · 9.6 | **6.99 · 5.94** (≥ 4.5:1) |
| Referencia hallazgo 7: `border` / `border-strong` sobre `surface` | 1.2 / 1.45 | 1.34 / 1.9 | 1.17 / 1.39 · 1.32 / 1.83 | 1.17 / 1.39 · 1.32 / 1.82 | — |

- **Vertical:** alto = alto de contenido de la fila − márgenes del inset, en filas flex con `align-items: center` y en grid: `sm` con inset 12px, `md` 36px (= `GBtn md`), `md` con inset 20px, `lg` en barra con borde y `start` pedido → clase `both`, grid 36px, RTL; ancho = grosor del borde. También con el «Tema de prueba» (`space` 5: inset 10px, `GBtn md` 45px) y en oscuro.
- **Inset:** `none` ocupa la caja de contenido exacta (0 / 0); `both` 8 / 8; `start` 8 / 0, y 0 / 8 bajo `dir="rtl"` (página y local); lista con icono: la línea arranca donde el texto (±1px) en `default` y `compact`.
- **Texto:** centrado (±1px) en LTR y RTL; texto largo a 200px envuelve en varias líneas sin recorte y cada línea conserva ≥ `space × 4`; 14px; sin fondo.
- **Grosor:** el `<hr>` mide exactamente `--g-border-width` (1px; 2px en el «Tema de prueba»).
- **320px** (LTR, RTL y RTL oscuro): sin desborde de página ni de ningún divider.
- **`forced-colors`** (emulado): `hr`, `::before`, `::after` y vertical con borde `solid` de 1px en `CanvasText`.
- **`prefers-contrast: more`:** las líneas `subtle` y las del texto pasan a `border-control`; el texto a `text`.
- **Escalas 1.25, 1.5, 2 y 3** (`deviceScaleFactor`) y **zoom 200 %**: la línea nunca baja de un píxel físico ni desaparece.
- **Consola:** sin errores ni avisos, sin peticiones fallidas.
- `estilo-verificar.mjs`: **477/477** en Chromium y **946/946** en Firefox + WebKit (las mismas comprobaciones salvo `forced-colors`, que solo emula Chromium).
- `npx vitest run` en `packages/vue` (41 archivos, 1311 pruebas, incluida `levels.test.js`), `npm run build` y las tres compuertas del `CLAUDE.md`, en verde. `check-icons.mjs`: sin infracciones.

## Hallazgos para bruno

1. **Registro:** `@import url("../components/GDivider/GDivider.css");` en `components.css` y la compuerta `grep -q "g-divider--labeled" packages/vue/dist/grana.css`. Hoy `dist/grana.css` solo contiene el token, no el componente.
2. **Marcado:** el de «Semántica» y «Estructura» del contrato, sin más; el banco trae la fábrica de referencia (`divider()`). El CSS no depende de `aria-hidden` ni de `role`: el aspecto solo sale de las clases.
3. **Medidas para las pruebas de Playwright**, con el valor por defecto del token (8px): vertical con `inset="both"` en fila de `GBtn sm`/`md`/`lg` = 12 / 20 / 28px; sin inset = alto del botón (28 / 36 / 44px). El CSS trata `--inset-start` en vertical como `both` por robustez; la prueba de clase efectiva sigue siendo de bruno.
4. **Texto largo:** el texto envuelve dentro del `<span>`; cada línea mide al menos `space × 4` (16px por defecto).

## Hallazgos para lima

1. **`tokens.md` §22 y `divider.md` («Tokens», «Reglas de props»):** el valor es `space × 2`, no el `space × 4` de kiwi, por la razón de arriba (un token para dos orientaciones; el vertical resta el inset dos veces). Conviene anotarlo en el contrato y en DECISIONS (con la tabla de alturas).
2. **Límite a documentar (README/contrato):** si una anfitriona define un inset mayor que la mitad del alto de su fila, un vertical con `inset="both"` mide 0 y desaparece sin aviso. No lo detecta el componente (exigiría medir); es responsabilidad de la anfitriona.
3. **`levels.test.js` y anfitrionas de Grana:** `--g-divider-inset` está en `defaults.css`, así que **ningún componente de Grana podrá redefinirlo** como anfitrión (la prueba prohíbe redeclarar un token del tema). Para los consumidores no hay problema; si un componente propio (una lista, `GFormSection` en la Fase 3, `GSidebar`) llega a hospedar dividers con inset, hará falta la excepción nombrada en la prueba (como `PUBLISHED`) o el patrón de `--g-tabs-inset`. Lo mismo que el hallazgo 1 de `GTabs`, pero al revés.
4. **Tokens consumidos:** además de los listados, el texto lee `--g-text-body-sm-weight` y `--g-text-body-sm-tracking` (el rol `body-sm` completo; el contrato dice «peso normal»). Existentes; solo falta añadirlos a la lista.
5. **`prefers-contrast: more`:** el contrato no lo menciona; aquí `subtle` y `strong` se igualan en `border-control` y el texto sube a `text`. Si se quiere en «Geometría y estilo», es una línea.
6. **Hallazgo 7:** resuelto sin cambios (sección de arriba). Opcional: escribir la regla `border` (entre secciones con aire o título) frente a `border-strong` (estructural en un componente denso) en `tokens.md`.

## No ejecutado

Lector de pantalla real (el CSS no cambia el árbol); `forced-colors` real de Windows y en Firefox/WebKit (solo emulación de Chromium); `GDivider.vue` real (la fábrica del banco imita a bruno); fila que envuelve (`flex-wrap`) con un vertical al borde de una línea; `prefers-contrast` con un tema de alto contraste real; texto con fuentes reales de los temas generados (Inter, DM Sans… no se descargan en el banco: se mide con la familia de reserva).
