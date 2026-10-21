# GContainer · estilo (coco)

Contrato: `design/contracts/container.md` (DECISIONS.md #717, #721 a #724; `tokens.md` §50; `api.md` «Contención en línea»). Estructura: `r01/` (kiwi). CSS: `packages/vue/src/components/GContainer/GContainer.css`. Banco: `estilo-banco.html` (`python3 -m http.server 4212` desde la raíz → `/design/lab/container/estilo-banco.html`; parámetros `?s=widths|nested|start|bleed|prose|max|intrinsic|sticky|reflow`, `?dir=rtl`, `?theme=<generado>`, `?dark=1`, `?space=5`, `?w=<px>`). Verificación: `GRANA_PW_PORT=4212 node design/lab/container/estilo-verificar.mjs` (opciones `--engines=…`, `--themes=base`, `--verbose`).

El banco pinta el marcado exacto del contrato con un `XContainer` (clases por prop, sin JS; no es el `.vue` de bruno) y carga `GContainer.css`, `GStack.css`, `GSection.css` y `GPageHeader.css` de `src/` dentro de la capa `grana.components`, con `GSurface` real de `dist/`. El comportamiento dentro de `GAppShell` se mide en el banco del chasis (`design/lab/app-shell/estilo-banco.html`).

**Sin cambios en `defaults.css`:** el contrato no añade tokens del tema y no hizo falta ninguno.

## Qué le da personalidad

El contenedor no pinta nada y no se mueve: su personalidad es **de comportamiento**, y está toda en el CSS.

- **Mide su sitio, no el visor.** La raíz es contenedor de consultas en línea y la columna se calcula en `cqi` de esa caja: al plegar la barra lateral del chasis, la columna se recoloca sola, sin saber que hay barra.
- **El margen respira.** `clamp(space-4, 4cqi, space-12)` crece de forma continua con la caja (medido: +4 px por cada 100 px, sin un solo escalón entre 500 y 1100) en vez de saltar en puntos de corte.
- **La banda sabe dónde está la columna.** La columna publica sus márgenes ya resueltos (`--g-container-inset-start/-end`) y `g-bleed` los usa dos veces: margen negativo hasta el borde de la caja y el mismo valor como relleno y `scroll-padding-inline`. El fondo llega al borde; el texto, el foco y una tabla desplazable se quedan alineados con la columna (en reposo y al final del desplazamiento).
- **Con `prose`, el contenedor limita la línea, no la caja.** La prosa se queda en 66 caracteres de la fuente de la columna, con el mismo borde final para párrafos, títulos y listas (la lista cuenta su sangría dentro de la medida), mientras lo ancho usa la columna entera.

## Decisiones de coco

| Pieza | Decisión | Por qué |
| --- | --- | --- |
| Raíz | `container-type: inline-size`, `display: block`, `min-inline-size: 0`, `contain-intrinsic-inline-size` = el máximo pedido | #562; sin contención de layout ni de paint (#724) |
| Ancho pedido | Alias `--_container-w` escrito en la raíz como texto (`calc(space-1 × N)`, `100cqi` con `full`) y **resuelto en la columna**, donde `cqi` es la caja | Las unidades de contenedor no valen en la propia raíz (miden el contenedor de fuera) |
| `reading` | `--_container-w: var(--_container-measure)` en la columna, no en la raíz | En la raíz valdría la medida del contenedor de fuera (o 0) |
| `--g-container-max` | La raíz lo pasa a su columna como alias (`--_container-max`, px ya resueltos); límite `calc(w + sign(max) × (max − w))` | `inherits: false` (no pasa a un anidado) y sin respaldo: `0px` = sin valor. `sign()` medido en los tres motores |
| Margen | `--_container-gutter` registrada en la columna; `max(clamp(…), env(safe-area-inset-left), env(safe-area-inset-right))`; `none` = 0 sin área segura | Contrato |
| Anfitrionas | `:where(.g-container__body, .g-surface, .g-dialog__body) .g-container:not(--gutter-none, -sm, -md, -lg) > .g-container__body` → 0 | Vale con la clase `--gutter-auto` y también sin ninguna clase de `gutter` |
| Columna | `inline-size: min(100cqi − 2 × margen, límite)`, `margin-inline` = los publicados, `overflow-wrap: break-word` | Contrato; los publicados son los márgenes reales (medido = real en 6 visores × 7 anchos × LTR/RTL) |
| `g-bleed` / `g-bleed-raw` | `.g-container__body :where(…)`: especificidad (0,1,0), en la capa de Grana | El relleno propio de la aplicación gana; receta: sumar el publicado |
| `prose` | `@scope (.g-container--prose > .g-container__body) to (componente de Grana, table, .g-wide)` con `:where(p, ul, ol, dl, blockquote, h1–h6, figcaption, address) { box-sizing: border-box; max-inline-size: --_container-measure }` | Especificidad 0 (la aplicación siempre gana); los límites del ámbito excluyen el elemento y lo de dentro. **Las primitivas de página no cortan la medida** (`.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed`, `.g-bleed-raw`): ver «Para lima» |
| Pintura y movimiento | Ninguno | Contrato |

## Medidas (Chromium, Firefox y WebKit)

`estilo-verificar.mjs`: **254/254 en cada motor** (Chromium, Firefox y WebKit), con el tema por defecto y los once generados, claro y oscuro.

| Qué | Resultado |
| --- | --- |
| Análisis estático | Sin color ni pintura, sin respaldos ni `@layer`; solo `--g-space-1`, `-3`, `-4`, `-6`, `-12`, `-16` y las tres públicas; las cinco `@property` con su sintaxis; literales solo `66ch`, `100cqi`, `2cqi`, `4cqi`, `6cqi`; sin `contain:`; sin movimiento |
| Anchos | Los siete (`sm` … `2xl`, `full`, `reading`) en 320, 390, 768, 1024, 1440 y 1920, LTR y RTL: columna = `min(caja − 2 × margen, máximo)` centrada al píxel, publicados = reales; los cuatro `gutter` con su `clamp`; sin desplazamiento horizontal |
| Margen continuo | `md` +4,00 px por cada 100 px de caja entre 500 y 1100 |
| Anidado | La caja interior es la columna y `auto` no añade margen; un `gutter` explícito gana; dentro de `GSurface` empieza en su relleno (Δ0) |
| `start` | Margen al inicio lógico y sobrante al final (LTR y RTL), publicados; con `full`, sin efecto |
| B · Sangrado (390 y 1440, LTR y RTL) | Banda, banda profunda, zona de marca, desplazable, `g-bleed-raw` y relleno propio llegan a los bordes de la caja; su contenido sigue en la columna; receta del relleno propio a +16 px; margen publicado en un descendiente profundo = real; desplazable alineado en reposo y al final (WebKit, ±1,4 px al final: desplaza a píxel entero con celdas fraccionarias, límite del motor); sin desplazamiento horizontal, también a 320×256 |
| A · `prose` | `h2`, `p`, `ul`, la prosa dentro de `GStack`, `GSection` y una banda, y un párrafo al 200 %: en 66ch de la columna y al inicio; la de una tabla, `g-wide` (en el ancestro o en el propio párrafo) y `GSurface`: fuera; una regla de la aplicación gana |
| `reading` | Columna = 66ch de su fuente; con el texto al 200 % la medida crece con el texto y se queda en la columna, sin desbordar |
| `--g-container-max` | Gana a `width` (también a `full`): 600 px centrados; el anidado lee `0px` (no hereda) |
| Intrínseco (#562) | En `inline-block`, celda de tabla y flex: `lg` 1024, `sm` 640, `md` 768, `full` 1024 (`space × 256`), `reading` 66ch, con máximo 600: nunca 0 |
| Lo fijo y lo pegado (#724) | Un `fixed` dentro sigue en el visor; un `sticky` dentro se pega |
| Reflujo | 320×256: una URL larga se parte dentro de la columna |
| Otro `space` (5) | `lg` 1280, `sm` 800, margen `md` 60 en 1920 |
| Temas | En los 24: la medida es 66ch de la fuente de cada tema, `lg` 1024, sangrado alineado y nada pintado |
| Dentro de `GAppShell` | La banda llega al borde del marco, nunca bajo el sidebar (banco del chasis) |

## Para bruno

1. **Las clases de los cuatro ejes siempre**, también las de los valores por defecto (`--width-lg`, `--horizontal-center`, `--gutter-auto`): el CSS funciona sin ellas, pero las pruebas y la auditoría las esperan.
2. **`--g-container-max` va en la raíz** (`inherits: false`): `.mi-vista .g-container { --g-container-max: 70rem }` funciona; en un ancestro del contenedor, no (README).
3. **Aviso 5** (sangrado fuera de sitio): mide con la caja de la columna (`.g-container__body`), no con la raíz.
4. `prose` usa `@scope` (Chromium 118+, Safari 17.4+, Firefox 146+; medido en los tres motores del repo). En un navegador sin `@scope` la prosa no se limita (mejora progresiva, nada se rompe).

## Para lima

1. **Exclusión de `prose` y las primitivas de página (enmienda de `container.md` «A · Medida»).** El contrato excluye la prosa «de dentro de un componente de Grana (`[class^="g-"]`, `[class*=" g-"]`)». Tomado al pie de la letra, `prose` no haría nada en la página típica (`GContainer > GStack > GSection > p`), porque `GStack` y `GSection` son componentes de Grana, y tampoco dentro de una banda `g-bleed` (clase pública con prefijo `g-`). Lo construí con esas cinco clases **transparentes** (`.g-stack`, `.g-section`, `.g-section__body`, `.g-bleed`, `.g-bleed-raw`): no cortan la medida. El título y la descripción de `GSection` siguen fuera (son del componente). Pido registrar la lista y que una primitiva de página nueva se añada a ella (como el mapa de anfitrionas).
2. **`box-sizing: border-box` en la prosa medida:** con `content-box`, una lista con sangría terminaba 40 px más allá que el párrafo (medido 743 frente a 703); con `border-box` todos los bloques comparten el borde final que pide el contrato. Especificidad 0: la aplicación lo cambia si quiere.
3. **`sign()` para `--g-container-max`** (el contrato lo sugiere): medido en los tres motores; no necesita constante nueva.
4. **L4 (relleno lateral de `GPageHeader` dentro de la columna)** sigue pendiente (`PENDIENTES.md`): en el banco del chasis el `h1` queda 24 px por dentro del texto de la página.

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** `GContainer.css` con base, B, A (`reading` y `prose`), `--g-container-max`, intrínseco, anfitrionas, área segura y RTL, solo con `--g-space-*` y las constantes de §50; sin pintura ni movimiento; 254/254 por motor en tres motores y 24 temas.

**Correcciones (en esta entrega).** `reading` resuelto en la columna (en la raíz, la medida valía la del contenedor de fuera o 0); la prosa de `GStack`, `GSection` y las bandas sí se mide; las listas comparten el borde final.

**Pendientes.** Auditoría sobre el `GContainer.vue` real de bruno (paso 5); las notas a lima; L4 de `GPageHeader`; aviso 5 (bruno). `forced-colors`: nada que perder (sin pintura), no emulado.
