# Auditoría de coco · GCombobox Fase 2 (`multiple`) (paso 5)

**Componente:** `GCombobox` con `multiple` (bruno, `accf2c7`; despliegue de A corregido en `fca3496`, también para la Fase 1), entrada `@grana/vue/combobox` (`dist/combobox.umd.js`, global `GranaCombobox`); CSS de coco «FASE 2 · VARIAS» de `GCombobox.css` (`f1dcbba`, casilla con `primary` en `0a83801`, #430; **corregido en esta auditoría**, hallazgo 1). Contrato `design/contracts/combobox.md` «Fase 2 · Selección múltiple» (#417 a #430). Estilo `design/lab/combobox/estilo.md` «Fase 2».

**Total de la pasada final:** 2656/2656 (estático 20, Chromium 1398, Firefox 610, WebKit 628).

**Método:** `node design/lab/combobox/auditoria-multiple-verificar.mjs` sobre el **componente real**: el playground (`packages/vue/playground/index.html`, `#sec-combobox-multiple`; sin `?cm` cada caso enseña su concepto, con `?cm=A|B|C` toda la batería toma uno) y un banco propio, `auditoria-multiple-banco.html`, solo para lo que el playground no tiene (un slot `chosen` de cuatro líneas en la receta y en la cesta, y un `GTooltip` envolviendo el campo en A, B y C). `dist/` construido tras la corrección y servido desde una copia fija (`GRANA_DIST`); puntero real (`page.mouse`), teclado real y medida por cuadro (`requestAnimationFrame`). Además, los specs de bruno en los tres motores y las dos compuertas de rendimiento con un solo worker.

Temas: por defecto, el de auditoría (`auditoria-tema.css`: `brand` #0F5C5C, radius 2, **space 3**, **fontSize 15**) y el de **`primary` propia** (`auditoria-tema-primary.css`: además `primary` #7D1230), claro y oscuro en los tres motores; en Chromium, también los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/`, claro y oscuro (**28 configuraciones**; 6 en Firefox y WebKit). Contraste sobre el compuesto real (capas translúcidas incluidas).

Ejecutar (requiere `npm run build`): `GRANA_PW_PORT=4209 node design/lab/combobox/auditoria-multiple-verificar.mjs` (`--engines=`, `--only=static,phrase,recipe,basket,deploy,contrast,keys,motion,rtl,forced,zoom,tooltip,phase1`, `--serve`; `GRANA_DIST=<copia de dist>` si otra sesión está compilando).

## Resultado: sin defectos bloqueantes. Una corrección en el CSS de coco; la Fase 2 queda auditada en `GCombobox.meta.json`

| Verificación | Chromium | Firefox | WebKit |
| --- | --- | --- | --- |
| `auditoria-multiple-verificar.mjs` (estado final; el análisis estático, 20, va aparte) | **1398/1398** | **610/610** | **628/628** |
| Specs de bruno (`combobox-multiple`, `personalidad-combobox-multiple`, `combobox-despliegue`; `--workers=2`) | 57/57 | 57/57 | 57/57 |
| `personalidad-combobox-multiple.spec.mjs` tras la corrección del CSS | 5/5 | 5/5 | 5/5 |
| Compuerta de `multiple` (#428, `--workers=1`, mediana de tres) | A 31 · C 42 ms | A 50 · C 67 ms | A 71 · **C 133 ms** (< 200) |
| Fase 1 «quinientas opciones < 150 ms» (`--workers=1`, cinco repeticiones) | | | **97 · 101 · 109 · 116 · 120 ms** |

`npx vitest run src/components/GCombobox`: 167/167. Compuertas del `CLAUDE.md` y de #337/#350 sobre `dist/` (`g-combobox__sentence`, `g-combobox__trace`, `g-combobox__ghost`, sin `GCombobox` en `grana.js`, sin `g-summary__` en `combobox.js`, sin fuente incrustada, sin Vue empaquetado): pasan.

Las cifras de rendimiento se tomaron con la máquina cargada (media de carga 8,4 con otras sesiones abiertas), así que sin carga serían iguales o menores: la de WebKit que bruno midió en 162–224 ms queda ahora entre 97 y 120 ms, y la cesta en WebKit a 133 ms frente a los 169 que él anotó.

## Hallazgos

| # | Hallazgo | Severidad | Dueño | Estado |
| --- | --- | --- | --- | --- |
| 1 | **El rastro no medía lo mismo que el renglón con un slot `chosen` alto.** La enmienda #429 pide que el CSS use `--_row-h` (el alto medido que el `.vue` escribe en línea al convertir el renglón) como alto mínimo del rastro. bruno lo escribe bien (`--_row-h: 93px`), pero `GCombobox.css` seguía con el mínimo fijo de dos líneas (`--_cb-rowh`). Con el slot `chosen` de cuatro líneas del banco, la receta pasaba de **93 a 52px (Δ 41)** y lo de debajo subía 41px, y en la cesta de **94 a 52px**. Con el `GSummary` por defecto no se notaba (52 → 52). **Corregido:** `.g-combobox__row` declara el valor por defecto `--_row-h: var(--_cb-rowh)` (el de línea siempre gana; no es un respaldo de `var()`), el rastro toma `min-block-size: var(--_row-h)`, y el pliegue `g-combobox-row-out` parte de `--_row-h` (antes partía del mínimo de dos líneas y daba un salto al empezar a plegarse). Comprobado que **fallaba antes**, con una copia de `dist/` previa a la corrección (4 fallos en Chromium: 93 → 52 y 94 → 52), y que **pasa después** en los tres motores (93 → 93 y 94 → 94, lo de debajo Δ 0) | Media (Δ0 del rastro, contrato #429) | coco | Corregido y verificado |
| 2 | **Pendiente obsoleto en `GCombobox.meta.json`.** El último elemento de `pending` aún dice que abrir A con ↓ desplaza el panel ~82px y tapa la primera activa. `fca3496` lo corrigió. Lo medí con la **duración real** (sin dilatar, a diferencia del spec) y sin reduced motion, en los temas por defecto, de auditoría y oscuro, sobre `cm-alg`, `cm-big`, `cm-f-tags` (A, en una `GFormRow`), `cm-dx` y `cm-big-b` (B): en todos los cuadros (Chromium 51–52, Firefox 32–52, WebKit 13–38) `scrollTop` vale 0, la forma no se mueve, la primera opción (`-opt-c0` con «Elegidas», `-opt-0` sin ella) está activa y nunca queda bajo el campo ni fuera del panel, y al terminar se ve entera. Hay que retirar ese pendiente | Baja (documentación) | bruno (`GCombobox.meta.json`) | Anotado |
| 3 | **Casilla no elegible por el tope:** borde `border` sobre `surface-sunken`, **1,17:1**. Es intencionado: la casilla se apaga con la fila, igual que una deshabilitada, y WCAG 1.4.11 exime a los componentes inactivos. La razón se lee de tres formas: el estado del tope con su icono (4,66 mínimo), `aria-disabled` y el anuncio `max`. Se deja así | Informativo | coco | Cumple |
| 4 | **Abrir la superficie con ↓ no deja ninguna fila activa.** Hace falta una segunda ↓ antes de Intro, tanto en la paleta como en la hoja a 375 y 320px. Es igual en la Fase 1 (`cb-pal`, `cb-dx` a 375px) y lo manda el contrato en §«Superficie» (en el disparador, «abrir no elige ni mueve»). La tabla de «Teclado (Fase 2)» dice en general «↓ abre; la primera / la última fila», lo que vale para `field`. Conviene precisar en esa tabla que en la superficie sigue la regla de la Fase 1 | Baja (texto del contrato) | lima (`combobox.md` «Teclado (Fase 2)») | Anotado |
| 5 | **Arnés** (no son defectos del producto): (a) WebKit sin cabeza pinta cada 40–75 ms, y con los 300 ms de `--g-duration-slow` el viaje a la cesta solo dejaba 3 o 4 cuadros, cuando el muelle ya había llegado. Por eso el viaje se mide con la duración dilatada a 1500 ms, en un tema sin capa, en los tres motores; el despliegue de A se mide con la duración real; (b) en la superficie hace falta ↓ antes de Intro (hallazgo 4); (c) WebKit, igual que Safari sin «Acceso total por teclado», solo llega por Tab a los botones con `Alt+Tab`; (d) Firefox no emula `pointer: coarse`: las áreas de 44px se miden en Chromium y WebKit; (e) la comparación de la Fase 1 en WebKit encuentra 150 diferencias entre `dist/` y la fuente (`-webkit-user-select`, el prefijo que añade el minificador). Son ruido del método: con y sin la Fase 2 las dos variantes salen de la fuente, y entre ellas hay 0 diferencias | — | coco | Hecho |

## Lo medido (tres motores salvo donde se dice)

| Área | Resultado |
| --- | --- |
| Estático (`GCombobox.css`, `dist/grana.css`) | Sección «FASE 2 · VARIAS» solo con `var(--g-*)` y alias `--_*` (propios `--_cb-*`; los del `.vue` `--_travel-x/y` y `--_row-h`, este con su valor por defecto); sin respaldos, literales de color, `@layer`, `@property` ni `!important`; medidas literales solo `24px`/`44px`; keyframes `g-combobox-*` (ninguno `g-reject…`); `animation` solo con `no-preference`; `--g-ease-bounce` y `--g-ease-spring` solo dentro de `@supports`; colores de sistema solo en `forced-colors`; el rastro con `--_row-h` también en `dist/` |
| **A · Δ0** (`#cm-row`: folio, etiquetas, servicio; y la línea de debajo) con 0, 1, 2, 3, 5, 8, 12, 20 y 40 elegidas | caja, raíz, vecinas, alto de la fila y lo de debajo **0,00px** en defecto, auditoría (space 3), `primary` propia y oscuro, en los tres motores; también con el texto al 200 % |
| A · la frase | una línea centrada en la del campo (alto ≤ el del `<input>`), todos los trozos a la misma altura, dentro de su celda, sin desbordar tras ceder; elementos a la vista + «N más» = elegidas en todos los casos; con los insumos largos de la fila cede desde 2 |
| A · con el foco | la frase ocupa **55,0 %** de la celda con 8 elegidas («y 7 más»), el campo ≥ 45 %, en `text-muted` |
| A · Retroceso | 1.ª pulsación: el último a la vista, **tachado + `selection`** (no solo color), sin quitar; 2.ª: quita; Ctrl+Z lo devuelve **a su posición** |
| A · «Elegidas» (`cm-big`, 40) | primer grupo; **12 filas + «Ver las 40» como última fila del propio grupo**; recuento «40»; rótulo en `text`; ejecutarla con el puntero pinta las 40 y deja activa **`-opt-c12`** (la 13), entera a la vista |
| **B · receta** (`cm-dx`, `numbered`, `max` 3) | último hijo de `g-input__support`; renglón «1»; agregar con el puntero: renglón «2» con **«Nueva»** (`accent-soft`) y su **barra al inicio** (`--g-focus-width`, `accent-text`); caja y etiqueta **Δ 0**; lo de debajo baja **exactamente un renglón** (52px por defecto, 50 con space 3) |
| B · rastro | **Δ 0,00px** de alto y de posición (`--_row-h` 52/50px en línea); tachado en `text-muted`; «Deshacer» en píldora `accent-soft`; **el foco pasa a «Deshacer»**; Intro devuelve el renglón y deja el foco en su «Quitar» |
| B · slot `chosen` de cuatro líneas | receta 93 → **93px**, lo de debajo Δ 0; cesta 94 → **94px** (hallazgo 1) |
| B · tope 6 (`cm-big-b`, 40) | 6 renglones + «Ver los 40» (`aria-expanded="false"`); desplegado: 40, «Ver menos», chevron girado `180deg`; se vuelve a plegar |
| Tope (`max` 3) | `is-full`; estado `--max` fuera del `listbox`, con icono y fondo `warning-soft`; las no elegidas con `aria-disabled="true"` **se recorren con ↓**; Intro sobre una no cambia el modelo |
| **C · cesta** (`cm-resp`) | vacía con su texto y título; sin vista previa; resultados : cesta **6 : 5 (1,200)** sin solaparse; renglones dentro de la cesta, nada desborda; dos «Ana López Ruiz» con **4 datos `is-diff`** en la cesta; pie con «2 seleccionados» y «Listo» (`GBtn`) dentro del diálogo, bajo el cuerpo |
| C · viaje (puntero real; duración dilatada a 1500 ms, ver 5a) | `g-combobox-arrive` con `linear(…)` (= `--g-ease-spring`); parte a 214px por defecto (la cota `space × 2 / 0,038` = 210,5 más el redondeo del primer cuadro; 162 con space 3) y llega a 0; `is-arriving` se retira |
| C · rastro de la cesta | mismo alto, borde discontinuo, foco en «Deshacer»; «Listo» cierra conservando y devuelve el foco al campo |
| C · hoja 375 × 812 y 320 × 640 | arriba, ancho completo, sin cesta, **«Elegidas» primer grupo**, opciones ≥ 62px (≥ 44), sin desborde de página ni de la hoja, «Listo» dentro del visor |
| Despliegue de A con movimiento (hallazgo 2) | `scrollTop` 0 en todos los cuadros, la forma no se mueve y la primera activa está a la vista, también con «Elegidas» y en B |
| Teclado (`cm-alg`, `cm-dx`) | Intro alterna, la lista sigue abierta y el texto «ibu» queda seleccionado (0–3); Tab con «sulf» no elige y cierra; Retroceso en dos tiempos; Ctrl+Z a su posición; con el tope, ↓ recorre las `aria-disabled` |
| Movimiento | con `no-preference`: `g-combobox-tick` (la casilla, con `linear(…)` = rebote), `-roll` (cifras), `-row-in` (renglón nuevo), `-arrive` (viaje); al final no queda ninguna clase `is-*` pendiente. Con `reduce`: **ninguna animación `g-combobox-*`** tras marcar en A, agregar en B y marcar en C, y ninguna clase pendiente |
| Áreas táctiles | puntero fino: «Quitar» ≥ 24 × 24, «Deshacer» y «Ver los N» ≥ 24 de alto; **puntero grueso** (Chromium y WebKit): los tres **≥ 44 × 44** |
| RTL | la frase empieza en el borde de inicio (Δ 0); barra de «Nueva» a la derecha (`right: 0`) y «Quitar» a la izquierda de la ficha, sin desborde; la cesta queda a la izquierda de los resultados |
| `forced-colors` (emulado en los tres) | casilla sin marcar `CanvasText`, marcada `Highlight` con la marca `HighlightText`; frase marcada por Retroceso `Highlight`/`HighlightText` + **tachado**; «Nueva» con borde y barra `CanvasText`; rastro `CanvasText` tachado |
| Texto al 200 % (raíz a 32px; los tamaños del tema son `rem`) | campo a 28px; A Δ 0 de 0 a 40 en la fila, frase en una línea, sin desplazamiento horizontal; B sin renglones desbordados («Quitar» dentro y ≥ 24); C con cesta sin solape ni desborde |
| `GTooltip` envolviendo el campo (A, B y C) | `aria-describedby` = `ID-about` **primero** + el del tooltip (también tras elegir); abre al llegar con el teclado; **se cierra al abrir la lista o la paleta** (no tapa el panel); tras «Listo» el foco devuelto al campo no lo enciende; tras Esc en A y B, cerrado |
| **Fase 1 intacta** | estilo calculado de **todas** las cajas de los combobox de `#sec-combobox` (elementos, `::before` y `::after`) en reposo (915), con A abierta (2802) y con la paleta abierta (3231), con y sin la sección de la Fase 2 (las dos variantes salen de la fuente en `grana.components`): **0 diferencias** en los tres motores. `dist/` frente a la fuente: 0 (salvo el ruido de 5e) |
| Consola | sin errores |

**Contraste** (mínimo de 28 configuraciones en Chromium; Firefox y WebKit, 6, con mínimos iguales o mayores): frase 15,18 · texto libre 15,18 · lápiz 7,38 · «y N más» 15,18 · frase con el foco 7,38 · marcada por Retroceso 14,51 · «Elegidas» 15,18 y su recuento 7,38 · **casilla: borde 3,43; contorno de la marcada (`text`) 15,18; marca `on-primary` sobre `primary` 4,70; en la activa invertida de la paleta, contorno 15,18 y marca 4,70**; casilla marcada = `primary` también con la `primary` propia · estado del tope 4,66 (icono 4,66) · número 7,38 · título del renglón 15,18 · **«Nueva» 4,51 · barra 4,52** · «Quitar» 7,38 · renglón marcado 14,60 · **rastro 6,87 · «Deshacer» 4,51** (también al pasar el puntero y en la cesta) · «Ver los N» 15,18 · cesta: vacía 6,87, título 16,06, recuento 6,87, renglón 15,18 · pie 7,38 · casilla no elegible 1,17 (hallazgo 3).

## Personalidad: lo aprobado frente al componente real

El componente real conserva lo que `estilo.md` señala como su identidad, y está medido:

- **La frase** se escribe en la línea del campo y nunca lo hace crecer (Δ 0 de 0 a 40, también al 200 %). Cede por texto («y N más», con peso de acción) y con el foco se aparta al 55 % y se apaga.
- **La casilla salta** con el rebote, el segundo uso aprobado, y es lo único que rebota.
- **Quitar deja huella**: tachado + selección antes de quitar, y un rastro del mismo alto con «Deshacer» como la única pieza de color. Ahora lo cumple con cualquier slot (hallazgo 1).
- **La receta registra la pasada** con «Nueva» y su barra al inicio, también en espejo en RTL.
- **Lo marcado viaja a la cesta** con el muelle de la Fase 1.

Con movimiento reducido no se mueve nada y la información sigue toda ahí. Nada que corregir en la forma.

## No verificado

- Lector de pantalla (VoiceOver, NVDA, TalkBack): `aria-selected` con `aria-activedescendant` y el anuncio propio, `ID-about` con 40 nombres, la frase `aria-hidden`, «Elegidas», receta y cesta como listas, foco en «Deshacer», `GTooltip` + `ID-about` en `aria-describedby`.
- `forced-colors` real (solo emulado), Safari real, táctil y teclado virtual reales sobre la hoja, IME con varios, zoom real del navegador (el 200 % se emula con el tamaño de la raíz; 400 % no).
- `pointer: coarse` en Firefox (no emulable).
- El pliegue `is-leaving` del rastro con un slot alto (`g-combobox-row-out` desde `--_row-h`). La regla está en el CSS, pero solo la cubre el spec de personalidad con el `GSummary` por defecto.
