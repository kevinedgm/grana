# GSummary · estilo (coco)

> Paso 3 del flujo. Contrato: `design/contracts/summary.md` (lima, #349 a #357; `tokens.md` §34). Estructura: `r01/` (base funcional) y `r02/` (el usuario eligió **A prioridad líquida + el contraste de B**; de C nada). CSS: `packages/vue/src/components/GSummary/GSummary.css`. Banco: `estilo-banco.html` (marcado exacto del contrato, `GAvatar`, `GBadge` y `GBtn` reales de `dist/`, y la medida del contrato simulada en `XSummary`: bruno aún no ha escrito el `.vue`). Verificación: `GRANA_PW_PORT=4211 node design/lab/summary/estilo-verificar.mjs` (requiere `npm run build`).

## Personalidad: qué hace distinta a la ficha

1. **No tiene maquetas, tiene prioridad (A).** Siempre es lo mismo: identidad, título y una **corriente** de datos que se bebe por el final. No hay umbrales, `@media` ni `@container`: cada ancho contesta «qué cabe aquí, con este texto». Al estrechar, antes de soltar un dato se callan los rótulos que se explican solos (`bare`); al final queda solo el valor del identificador.
2. **Filetes que respiran.** Los datos se separan con un **filete corto** (`--g-border-width` en `border-strong`, `space × 1` más corto por arriba y por abajo que la línea), no con un carácter ni con una línea de lado a lado: la corriente se lee como una frase con pausas, no como una tabla. Es un pseudoelemento con propiedades lógicas: se espeja en RTL sin reglas propias y en `forced-colors` pasa a `CanvasText`.
3. **El identificador manda.** Valor en peso de título (`--g-text-title-sm-weight`) con cifras tabulares en toda la ficha; su rótulo se queda en `text-subtle` y peso normal (la jerarquía la lleva el valor, no «Exp.»). Nunca se apaga, ni siendo compartido entre homónimos.
4. **Un solo acento de color: «+N».** Píldora `accent-soft` / `on-accent-soft`, `caption` en peso de título, con borde transparente de `--g-border-width` (que en `forced-colors` se ve). Es lo único que no es tinta neutra: dice «hay más» sin competir con los datos.
5. **Lo que vuelve a caber entra.** Al ensanchar, cada dato que pasa de recortado a visible se desliza `space × 3` desde el **inicio** de su sitio (izquierda en LTR, derecha en RTL, `:dir(rtl)`) mientras aparece, con `--g-duration-slow` + `--g-ease-out`. Como sale de detrás del filete de su vecino y su sitio ya era suyo, no hay salto de layout: el lector ve llegar los datos de uno en uno, no una tarjeta que «se rompe» en otra. Salir no se anima (no debe retener la mirada).
6. **El contraste de B es peso y tono.** Entre homónimos, lo único pesa (peso de título) y lo compartido se apaga (`text-subtle`); sin `diff`, nada lleva marca. Nunca solo color (WCAG 1.4.1): en `forced-colors` queda el peso.
7. **La coincidencia** (`highlight`) es peso de título + subrayado de `--g-border-width` a `space / 2` de la línea base: cabe dentro de una línea recortada de `1lh` (el subrayado de `GCombobox`, `--g-focus-width` a `space × 1`, se cortaba en la corriente: medido).

## Anatomía y cesión (lo que hace el CSS)

| Pieza | Regla |
| --- | --- |
| Raíz | `display: flex`, `inline-size: 100%`, `contain: inline-size` (no aporta ancho al anfitrión), body-sm, `tabular-nums`. El color del título y de los valores **se hereda** del anfitrión (no se fija en la raíz) |
| Identidad | Lado `space × 5/6/8/10/16` (`--_su-lead`); `GIcon` en una caja `surface-sunken` con `radius-sm` y relleno de 1/5; hueco a `space × 2` (xs, sm), `× 3` (md, lg) o `× 4` (xl) |
| Cabecera | Una línea (`max-block-size: 1lh` + `overflow: hidden`, salto con `flex-wrap`): `__name` con base `7ch` y el estado detrás; cuando el nombre ya no conserva sus 7ch, el estado **salta** a la línea recortada (cede entero, sigue en el árbol). Título body (md, lg) o title-sm con `--g-font-title` (xl), en peso de título; código `text-muted` en peso de título |
| Corriente (`row`, `lines: 2`) | `__flow` = identificador (`flex: 0 1 auto`, elipsis, margen `space × 3`) + `__facts` (`flex: 1 1 0`, salto, `max-block-size: 1lh`, `overflow: hidden`) con **centinela** de ancho cero y `1lh` de alto. Lo que no cabe salta entero a la segunda línea, que no se ve. «+N» al final de la línea |
| `--multi` (`lines` ≥ 3 o 0) | Identificador y datos fluyen juntos en `--_lines` líneas con `row-gap: space × 1`; cada dato lleva elipsis si él solo no cabe; identidad arriba; `--free` sin tope |
| `inline` | Una línea, tipografía **heredada** del anfitrión, `block-size: 1lh` (Δ0 por construcción: una identidad mayor que la línea desborda sin empujar). `__head`, `__name`, `__data` y `__flow` son `display: contents`; el estado y la secundaria (si hay datos) van al texto oculto. El título encoge primero (`flex-shrink: 1000`) hasta `4ch`; el identificador **no encoge por reparto** (`flex: none`, tope `100%`; con reparto proporcional perdía fracciones de píxel y mostraba una elipsis falsa: medido); el cuerpo recorta (`overflow: hidden`) solo sin medida |
| `data-terse` | Rótulos `is-bare` (no el del identificador) al texto oculto |
| `data-tight` | Rótulo del identificador al texto oculto; «+N» fuera; **los demás datos al texto oculto** (en `inline` y en `row` de una línea: si no, al callar el rótulo del identificador cabría otra vez un dato y el orden de cesión se invertiría: medido); el identificador pierde su margen final (es ancho útil: medido, «MED-000482-MX» cabía y se cortaba por 12px); en `inline` el suelo del título cede hasta 0 y el identificador se limita a `100% − space × 2` |
| `stack` | Rejilla `auto minmax(0, 1fr)` (una columna sin identidad); identidad a lo alto de cabecera y secundaria; cabecera, título y secundaria **saltan de línea** (`overflow-wrap: anywhere`); pares en `repeat(auto-fill, minmax(min(space × 28, 100%), 1fr))` con rótulo `caption` sobre el valor, sin filetes ni elipsis; «+N» no existe; acción al pie, a la izquierda, con salto |
| Vacío | Marcador en el sitio del título, peso de cuerpo, `text-muted` |
| Carga | `__bone` con el alto exacto de su línea (`1lh − space × 2` + márgenes de `space × 1`), `radius-xs`; identidad redonda del lado de la ficha; en `--multi`, la forma de datos mide las `--_lines` líneas (el alto máximo). Sin pulso (contrato: una sola pieza de movimiento) |

**Constante de diseño** (`tokens.md` §34): mínimo de columna de la rejilla de `stack` = **`space × 28`** (112px con el tema por defecto: «Última revisión» en caption cabe en una línea; con `space` 5, 140px). Otras proporciones del CSS, no de tema: relleno del icono `lado / 5`, relleno de «+N» `space × 1,5`, filete `space × 1` más corto por cada extremo, ancho de las formas de carga (60 %, 85 %, 70 %).

## Afinado respecto del prototipo

| Prototipo (r01/r02 A) | Ahora | Por qué |
| --- | --- | --- |
| Separador: borde de lado a lado de la línea | Filete corto (`inset-block: space × 1`) | Más ligero; la corriente se lee como frase |
| Identificador entero en peso 600 | Solo el valor, en `--g-text-title-sm-weight` | Sin literales; la jerarquía la lleva el valor |
| «+N» en `accent-strong` | `on-accent-soft` | Par garantizado del contrato (tokens.md §34) |
| `stack` con valores cortados por elipsis | Saltan de línea | Contrato: `stack` es la vista completa |
| Formas de carga en `border-strong` sin medir | `border-strong` y Δ0 medido | Ver «Para lima» (el contrato dice `surface-sunken`, invisible sobre la vista previa) |
| `inline`: el identificador encoge con `flex-shrink: 1` | `flex: none` con tope | Elipsis falsa por fracciones de píxel (medido en los tres motores) |
| `data-tight` solo callaba rótulo y «+N» | También retira los datos (texto oculto) | Sin esto, un dato volvía a la vista con el rótulo del identificador callado |

## Medidas (banco, tres motores)

**4015/4015** comprobaciones en Chromium, Firefox y WebKit. Con el tema por defecto:

| Medida | Resultado |
| --- | --- |
| Barrido 120 a 640px (paso 20), 30 fichas en 17 casos (opción, campo sm/md/lg, vista previa, tarjetas `lines` 4/3/0, celda, árabe, hebreo, latino en RTL, tamaños) | 0 defectos en Chromium, Firefox y WebKit: sin desborde, nada cortado a medias, identificador entero (con elipsis solo si **él solo** no cabe, apretado y con `title`: «MED-000482-MX» y la ficha `xl` a 160px, paso 6), título ≥ 20px, «+N» = `data-clipped`, recortados = final de la prioridad, `data-terse` antes de soltar, el estado solo con el nombre en 7ch, el lector lo recibe todo, `stack` sin elipsis |
| Datos visibles en la opción a 240 / 360 / 520px | 1/4 · 2/4 · 4/4 (las de kiwi) |
| Alto `row` `lines: 2` xs/sm/md/lg/xl | 40 / 40 / **44** / 44 / 64, constante en todos los anchos |
| `inline` en campo sm/md/lg | Δ0 frente al campo con texto plano en todos los anchos |
| Carga | Δ0 en `row` `lines: 2`, `inline` y `row` `lines: 4` (al máximo); forma/fondo ≥ 1,45:1 |
| Contraste (mínimo de claro, oscuro, Tema de prueba y los once generados en claro y oscuro) | Rótulo y compartido 5,05 sobre `bg`, **4,70** sobre `surface-sunken` (kiwi: 4,72); caption de `stack` igual; código y marcador ≥ 5,94; título ≥ 13; «+N» **4,51** |
| Sobre `selection` (informativo: lo reapunta el anfitrión) | Rótulo y compartido **4,43**: **< 4,5** |
| `forced-colors` (emulado en los tres) | Filete y borde de «+N» en `CanvasText`, formas en `GrayText`, lo único conserva su peso (600 / 400) |
| Entrada | `g-summary-enter` (LTR, desde −12px) y `g-summary-enter-rtl` (desde +12px), 240ms; al 25 %: opacidad 0,78, −2,7px; se retira `data-enter`; nada al montar; con `reduce`, ni atributo ni animación |
| Bidi | Árabe y hebreo reales y latino en contenedor RTL: rótulo a la derecha del valor, el anfitrión no se desplaza (texto oculto contenido) |
| Móvil 320 | Sin desplazamiento horizontal |

## Para bruno (lo que el CSS espera del `.vue`)

- Raíz: `g-summary g-summary--layout-{inline|row|stack} g-summary--size-{xs…xl}`; `g-summary--multi` en `row` con **`lines` ≥ 3 o 0** (ver «Para lima»); `g-summary--free` con `lines: 0`; `--_lines` en línea = líneas de datos (≥ 1; en carga, el máximo); `is-loading`, `is-empty`; `data-terse`, `data-tight` medidos.
- Partes exactamente como el contrato; cada `__sep` **dentro** de su parte (`__name`, `__status`, `__fact`; el de la secundaria, hermano dentro de `__body`).
- Vacío: `__body > __head > __name > __title` con el texto de `placeholder` (y la identidad si la hay).
- **Carga:** `__lead[aria-hidden] > __bone` solo si habrá identidad (slot, `avatar` o `icon`); `__body[aria-hidden] > __head > __bone` y, salvo en `inline`, `__data > __bone`.
- «+N»: `__more[aria-hidden][hidden]` con el texto `+N`.
- **Medida:** con el identificador `flex: none` en `inline`, el «no cabe» aparece como `__body.scrollWidth > clientWidth` antes que como elipsis del identificador: hay que mirar las dos. Comparar el texto del valor (un `Range`) con la caja del identificador con tolerancia 0,01px (una elipsis aparece con 0,03px de exceso). `data-enter`: retirar en `animationend`/`animationcancel` cuyo nombre empiece por `g-summary-enter` (son dos: `g-summary-enter` y `g-summary-enter-rtl`), o en el acto si `animationName` es `none`.

## Para lima (huecos del contrato)

1. **`g-summary--multi`:** la tabla dice «más de una línea de datos», pero `lines: 3` con `subtitle` deja **una** línea de datos y la secundaria debe verse. El CSS no puede leer `--_lines`: la secundaria se retira (texto oculto) en `row` **sin** `--multi` cuando hay datos. Propuesta: `--multi` ⇔ `row` con `lines` ≥ 3 o 0 (lo dice el párrafo «`lines` en `row`»); `--_lines` puede valer 1.
2. **Tono de las formas de carga:** §34 y «Tokens consumidos» dicen `surface-sunken`; sobre la vista previa de la paleta (que es `surface-sunken`) no se ven. Uso **`border-strong`** (como `GCard`), 1,45:1 mínimo. Actualizar §34.
3. **Marcado de carga:** el contrato no lo fija; propuesta en «Para bruno».
4. **`data-tight` retira también los datos** (en `inline` y `row` de una línea) y, en `inline`, deja ceder el suelo del título antes que el valor del identificador. Conviene escribirlo en «Orden de cesión» (pasos 4 a 6).
5. **Identificador con `bare`:** `data-terse` no calla su rótulo (solo `data-tight`). Confirmar.
6. **Contraste al filo:** «+N» 4,51:1 y rótulo/compartido sobre `surface-sunken` 4,70:1 con el tema por defecto; sobre `--g-color-selection` 4,43:1 (< 4,5): la ficha «seleccionada» de `GCombobox` tiene que reapuntar rótulos y compartidos a `text-muted` (auditoría del combobox).
7. **`stack` a muy poco ancho:** el estado puede llevar la elipsis propia de `GBadge` (antes que desbordar) y un botón del slot `action` (`white-space: nowrap`) puede desbordar: contenido de la aplicación, regla para el README.

## No verificado

Lector de pantalla real; `forced-colors` real (solo emulado); `prefers-contrast: more` (regla escrita, sin medir); Safari y táctil reales; CJK y palabras muy largas; la ficha dentro de `GCombobox` (después, con la adopción); el componente real de bruno (el banco simula su medida).
