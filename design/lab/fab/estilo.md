# GFab · estilo (coco)

Contrato: `design/contracts/fab.md` (DECISIONS.md #654 a #671; `tokens.md` §29.5, §29.6 y §47). Estructura: `r01/` (kiwi). CSS: `packages/vue/src/components/GFab/GFab.css`. Banco: `estilo-banco.html` + `estilo-banco.js` (`python3 -m http.server 4244` desde la raíz → `/design/lab/fab/estilo-banco.html`; parámetros `?scene=a3|a6|a15|panel|c|single|main1`, `?pos=…` (las seis), `?anchor=container`, `?dark=1`, `?theme=nsa|<generado>`, `?zone=1`, `?rtl=1`, `?coarse=1`, `?slow=1`, `?open=1`, `?more=1`, `?arm=purge`, `?ack=busy|done|failed` (con `&ackid=<id>` o `&ackmain=1`; por defecto `csv`), `?tuck=1`, `?find=exp|zzz`). Verificación: `GRANA_PW_PORT=4214 node design/lab/fab/estilo-verificar.mjs` (sirve el banco en ese puerto) (opciones `--engines=…`, `--themes=all|base`, `--verbose`).

**Sin cambios en `defaults.css`.** Comprobado: ningún valor del tema se queda corto; todo sale de tokens existentes, de constantes de diseño derivadas de `space` (abajo) y de `24px`/`44px`. El CSS no se registra en `components.css`: ese archivo es de bruno (AGENTS.md); el banco lo importa en `layer(grana.components)` como lo hará el registro.

## Qué le da personalidad

**La pila son brotes del botón.** Cada píldora lleva su icono en una **semilla**: un círculo en el extremo del lado del FAB, concéntrico con su extremo redondo **y con el FAB** (la lista se aparta `(fab − píldora)/2` del borde del FAB para que extremo, semilla y FAB compartan eje; medido ±0,75px en las seis posiciones, LTR y RTL). Abierta, la pila se lee como una columna de semillas que crece del botón, con las etiquetas hacia dentro.

**Cada acción sale del FAB como semilla y se despliega mientras viaja.** El estado de partida recorta la fila a su semilla (`clip-path: inset(…)` con el lado sacado de `--_k`) y la traslada para que **el centro de la semilla** (no el de la fila) coincida con el centro del FAB: el vector `--_fx` del `.vue` se corrige con `50 % − píldora/2` hacia su lado. Al pasar a `open`, el recorte se abre y la fila viaja a la vez (`press` + `ease-out`), la más cercana primero (`fast × i / 8`). Vuelve al FAB como semilla, más corta y sin escalonado. Es la misma idea que el panel de C (todo nace de su botón), a escala de una fila.

**La semilla se enciende.** La fila activa (foco, también el que pone el puntero, M1) se hunde a `surface-sunken` y su semilla se invierte (`text` / `surface`, el par inverso de #325; en una peligrosa, `danger` / `on-danger`). Una deshabilitada se hunde pero no se enciende: se ve que está pero que no responde.

**El + gira 45° y es la x.** Los dos iconos se cruzan: el `plus` gira 45° mientras se funde y la `x` llega desde −45°; a mitad de camino son la misma forma. En C, igual con `ellipsis-vertical`.

**La cola se convierte en el panel (C).** Transformación de contenedor completa: el recorte parte de la cola (`--_clip-from`) y crece hasta la caja, el relleno pasa **del color de la cola a la superficie** (`primary` → `surface`, `slow` + `ease-out`) y el contenido entra al final (`fast` tras `fast`). Se ve una gota de la cola que se abre en panel.

**Confirmar parte la píldora por una costura.** En la pila, el par «Cancelar | Vaciar» conserva los extremos redondos de fuera y une los medios con radio `sm`: es la misma píldora partida, no dos botones nuevos.

**La insignia mira al contenido.** El acuse va en la esquina **de dentro** (arriba con el FAB abajo; al inicio con el FAB al final), con su centro sobre el borde del círculo a 45°. Así no tapa el borde de la pantalla y **sigue a la vista cuando el FAB se aparta** (medido en las seis posiciones).

**El velo deja al FAB fuera, y solo al FAB.** El velo táctil se abre en una ventana del tamaño del disparador (más `space × 1`): el FAB, que es el cierre, queda sin velar y se puede tocar; todo lo demás, **también la franja entre el FAB y su borde** (la pill de la voz, el muelle de `GPageHeader`), se traga el toque. Son **cuatro piezas** que cierran la ventana por los cuatro lados (#668): el elemento (banda de arriba), `::before` y `::after` (los lados) y `span.g-fab__scrim-part` (banda de abajo). Primero fue un hueco recortado con un polígono (prohibido, `icons.md` §1; una máscara no cambia dónde cae el toque) y luego tres bandas que dejaban la franja del borde abierta.

**La acción que se está haciendo no parece rota (#669).** «Exportar CSV» mientras exporta no se tacha ni se apaga: se lee como cualquier otra, con «Exportando…» debajo y el cursor de progreso; solo no responde (sigue `aria-disabled`). Si falla, vuelve a estar disponible y el motivo se pone en `danger-text`: la fila dice «inténtalo otra vez» con el texto, y el color lo subraya.

## Decisiones de coco

| Pieza | Decisión | Por qué |
| --- | --- | --- |
| Sitio | `fixed` (`absolute` con `container`), `z-index: 3`; margen `space × 4` + `env(safe-area-inset-*)` del lado (solo `viewport`, con `:dir(rtl)`) + `--_offset` + `--_reserve`; centro con `inset-inline: 0` y márgenes automáticos | `translate` queda libre para apartarse; el centro no depende de `dir` |
| FAB | Lo pinta `GBtn` (`brand` → `primary`, #300 incluido). `GFab.css` añade `--g-shadow-2` y un contorno de `--g-border-width` en `--g-color-primary-text` | Contorno de §7.1: en el tema por defecto es del color del relleno y no se ve; con una marca pálida separa el FAB de la página (≥ 3:1 medido en los trece temas) |
| C | Grupo con radio `pill` y la sombra; la principal cede su extremo final y la cola su inicio; cola de `max(44px, space × 11)`; costura `currentColor` al 35 % (decorativa) | Una sola forma con dos destinos; la cola, más estrecha, se lee secundaria |
| Píldora | Alto `max(24px, space × 10)` (44px con `pointer: coarse` o `is-coarse`); semilla `píldora − space × 2`; icono `space × 5`; relleno del lado de la etiqueta `space × 4`; `surface`, borde `border`, `--g-shadow-2`; etiqueta `body-sm` + peso de acción; motivo en segunda línea, `caption` + `text-muted` | Flota sobre cualquier contenido: la sombra la separa; el borde es decorativo (la etiqueta identifica la acción) |
| Pila | Columna con separación `space × 2`; alineada a su lado (`flex-end` / `flex-start` / centro) con la sangría `(fab − píldora)/2`; `max-inline-size: 100 % − 2 × margen` (100 % = visor) | Semillas en el eje del FAB; reflujo a 320px |
| Cola «Más acciones (N)» | Contorno discontinuo `border-control` (≥ 3:1); expandida, contorno pleno `text` y fondo hundido | Forma además de color |
| Panel | `surface`, borde `border-control`, radio `lg`, **`--g-shadow-3`**, relleno `space × 1,5`; filas de `max(24px, space × 9)` (44px táctil), radio `md`; icono `space × 5` en la línea de la etiqueta, `text-muted`; etiqueta con peso de acción; descripción y motivo `caption` + `text-muted`; títulos de grupo `caption`, peso de acción, `text-subtle` | `shadow-3` lo separa de la pila cuando la cubre (las píldoras llevan `shadow-2`); las descripciones explican, la etiqueta manda |
| Resaltado (M1) | `::before` del panel, viaja con `--_active-y/h` (`press` + `ease-out`), `surface-sunken`; anillo de foco interior | El de `GMenu`, sin elemento extra |
| Cabecera de búsqueda | Primera fila pegada arriba al desplazar, alto constante `max(24px, space × 9)`, `caption`; pista en `text-subtle`; lo escrito como ficha (`g-fab__find-query`, `surface-sunken` + `text` + peso de acción) y el recuento en `text-muted`; sin coincidencias, `text` y peso de acción | Nada en ella es propio de C: vale para el panel de «Más acciones» si el usuario extiende el filtro (#658), sin tocar el CSS |
| Par de confirmación | `div` en fila; «Cancelar» `surface` + `border-control`, la confirmación `danger` + `on-danger`; aparece con un fundido (`@starting-style`); en la pila, píldora partida (extremos de fuera `pill`, medios `sm`, sombra en el grupo) | Nada se mueve; la forma dice que es la misma fila |
| Insignia | `space × 5`, icono `space × 3,5`; en curso `surface` + `text` con borde `border-control` (≥ 3:1 frente a la página); hecha `success` + `on-success`; fallida `danger` + `on-danger`; anillo de `2 × border-width` en `surface` que la separa del FAB; centro a `(1 − 1/√2)/2` del lado, escrito `calc((1 - 1 / sqrt(2)) / 2)` (#671) | «Siempre un relleno con su par» (§47) |
| Acuse en el elemento (#669) | `data-ack="busy"`: sin tachado ni atenuado (los selectores de deshabilitada llevan `:not([data-ack="busy"])`), semilla sin atenuar, `cursor: progress`; el motivo («Exportando…») en `text-muted` como cualquier motivo. `data-ack="failed"`: habilitada, motivo en `danger-text`. En `single` y en la principal de C, el `GBtn` en curso conserva contorno y `shadow-2` (no baja a `shadow-1` como un deshabilitado) y lleva `cursor: progress`. La semilla de una acción en curso no se enciende al enfocarla (no responde) | 1.3.1: lo que se ve dice lo mismo que el estado (en marcha ≠ no disponible). El fallo, con texto y color (nunca solo color) |
| Se aparta | `translate` de `100 % + distancia al borde − 24px` hacia su borde (esquinas en línea, centro en bloque), con `:dir(rtl)` | Sale de la caja real del FAB (A o C) sin medir en JS |
| Velo | `--g-surface-backdrop` con **opacidad 0,5** (≈ 16 % de negro en claro, 30 % en oscuro con el tema por defecto) en el elemento, que la aplica al grupo; fundido `fast`. **Cuatro piezas** sin solaparse, iguales en las seis posiciones y en RTL (coordenadas físicas del visor): el elemento es la banda de arriba (todo el ancho, `0 → --_hole-y`), `::before` y `::after` los lados de la ventana (`--_hole-y → +--_hole-h`) y `span.g-fab__scrim-part` la banda de abajo (todo el ancho, hasta el borde). Las cuatro son `fixed` con el visor como bloque contenedor (100 % = visor); sin `transform`, `filter`, `contain` ni `will-change`. **Anillo: `space × 1`** (el máximo que permite #668), sumado por el `.vue` en `--_hole-*` | Más ligero que el fondo de un modal. Sin solapes (un velo translúcido doble se vería más oscuro); costuras en píxeles enteros. El anillo de `space × 1` deja sin velar el contorno del FAB y el arranque de su sombra; menos anillo velaría el contorno y apenas reduce lo que pasa (las esquinas de la caja fuera del círculo pasan igual) |
| Impresión | El FAB no se imprime | |

## Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Píldoras al abrir | Semilla en el centro del FAB → su sitio: `translate` y `clip-path` en `press` + `ease-out`, opacidad `fast`, retardo `fast × --_i / 8` (máximo 160 + 60 = 220ms) | Solo opacidad `fast`, sin retardo, sin recorte ni desplazamiento |
| Píldoras al cerrar | Vuelven a semilla en `fast`, sin escalonado | Fundido |
| Iconos del FAB | Cruce: opacidad `fast`, giro ±45° en `press` | Solo opacidad |
| Panel de la cola y `panel` | Opacidad y `scale: 0.96` desde la esquina del FAB (`transform-origin` por posición y `dir`) en `press`; salida `fast` | Solo opacidad |
| Panel de C | Recorte `--_clip-from` → caja ampliada, relleno `primary` → `surface` y borde en `slow` + `ease-out`; contenido `fast` tras `fast`; salida `press` | Solo opacidad; ni recorte ni relleno de la cola |
| Resaltado | `translate` y alto en `press`; primera colocación (`is-highlight-instant`) solo fundido | Solo fundido |
| Insignia | Opacidad `fast` y escala 0,5 → 1 en `press`; en curso, giro `g-fab-spin` en `--g-duration-spin` | Sin escala; **quieta** |
| Se aparta | `translate` en `press` + `ease-out` | Aparece en su sitio |
| Par de confirmación, velo | Opacidad `fast` | Igual |

- **`opening` es un estado de partida sin transición** (`.g-fab .g-fab__list[data-state="opening"]` y sus `li`, `transition: none`, fuera de las consultas de movimiento). Medido en el banco: el `.vue` escribe `--_x`, `--_fx`… con la lista ya mostrada y cada lectura de la caja fija el estilo; con transición en `opening`, la fila empezaba a ir hacia la semilla desde donde estaba y al pasar a `open` volvía: **no había entrada**. Así funciona con cualquier orden de escrituras.
- Sin `--g-ease-spring` ni `--g-ease-bounce` (#299, #655; lo comprueba el análisis estático). El rebote al soltar es el de `GBtn`.
- Nada supera 240ms (duración + retardo, medido en todo el subárbol en los tres motores).

## Medidas (Chromium, Firefox y WebKit)

`estilo-verificar.mjs` (2026-10-18, tras #668 y #669): **2946/2946** comprobaciones: estático 30, **Chromium 1518** (los 13 temas: por defecto, NisaNabani y los once de `dark-color-presence/generated/`, claro y oscuro, más la zona de marca por defecto y NisaNabani, claro y oscuro), **Firefox 699** y **WebKit 699** (por defecto y NisaNabani, claro y oscuro, y la zona; `--themes=all` los mide con los trece). Las cifras de contraste coinciden en los tres motores. Antes de #668 y #669: 2197/2197.

- **Geometría** (seis posiciones × LTR y RTL, en los tres motores): FAB 52 × 52 a `space × 4` de sus bordes (o centrado); píldoras ≥ 40px (44px con puntero grueso); sin solapes y con margen ≥ 8px; semillas y extremos en el eje del FAB (±0,75px); «Nueva muestra» pegada al FAB; insignia a 26 ± 1,2px del centro, del lado del contenido; apartado con **24,0px** visibles y la insignia dentro del visor; las cuatro primeras **Δ 0,02px** de 6 a 15; panel de `space × 80` dentro del visor con el FAB fuera; C con cola de 44px y panel a `space × 3`; 320px sin desplazamiento horizontal ni etiquetas recortadas (pila, C, panel de la cola, par de confirmación); texto al 200 % sin recortes.
- **Velo (#668)**, 16 casos por motor (seis posiciones × LTR y RTL, C abajo y C `top-start` RTL, `anchor="container"` abajo y `top-center`): ventana en px enteros, de disparador + 0 a `space × 1` (+ redondeo); el toque en el centro y en los bordes del disparador (en C, principal y cola) llega a él; a 1px de cada lado de la ventana, en sus cuatro esquinas, **en la franja hasta su borde de bloque y de línea** y en los bordes del visor, es velo; las cuatro piezas cubren el visor menos la ventana con solape 0 (también con `container`: el visor entero); mismo color en las cuatro; **sin costuras**: con la página vacía, captura de pantalla con un solo color de velo fuera de la ventana (bottom-end, top-start RTL y C, en los tres motores); `forced-colors`: transparente y sigue tragándose el toque, también en la franja.
- **Acuse en el elemento (#669)**, en los tres motores: en curso, `data-ack` en la raíz y en el elemento, `aria-disabled`, etiqueta sin tachar y con el color de una disponible (pila y panel; la deshabilitada del panel sigue tachada), semilla sin atenuar, `cursor: progress`, motivo visible; fallida, habilitada, sin tachar, motivo en `danger-text`; hecha, el elemento vuelve a reposo; `single` en curso con el mismo contorno y elevación que en reposo; la principal de C lleva `data-ack`.
- **Movimiento:** la semilla parte del centro del FAB (Δ < 1px), recortada a su círculo e invisible; escalonado 0/15/30/45/60ms; salida `fast` sin escalonado; nada supera 240ms; `+` a 45° y `x` a 0°; C parte del recorte de la cola con el relleno de la cola y el contenido oculto, abre a `inset(-48px round 8px)` en 240ms. Reducido: solo opacidad, sin retardo, sin recorte, giro, escala ni desplazamiento; insignia quieta; C sin recorte ni relleno de la cola.

**Contrastes mínimos** (peor caso de los trece temas, claro y oscuro):

| Qué | Mínimo | | Qué | Mínimo |
| --- | --- | --- | --- | --- |
| Etiqueta de la píldora | 15,20 | | Icono de la semilla / encendida | 16,08 / 15,20 |
| Etiqueta del panel (incluida la peligrosa) | 4,51 | | Icono del panel | 7,38 |
| Etiqueta sobre el resaltado | 5,04 | | Contorno de la cola «Más acciones» | 3,43 |
| Descripción y motivo | 7,38 | | Borde del panel frente a la página | 3,43 |
| Título de grupo (`text-subtle`) | 5,05 | | Foco frente a la página y al panel | 4,52 |
| Pista de búsqueda (`text-subtle`) | 5,05 | | Icono del FAB / etiqueta de la principal | 4,70 |
| Lo escrito / recuento | 16,08 / 7,38 | | **Contorno del FAB** (`primary-text`) | **4,53** |
| Peligrosa en la pila | 5,04 | | Insignia: en curso / hecha / fallida (icono) | 15,20 / 4,90 / 4,81 |
| «Cancelar» / confirmación | 16,08 / 4,81 | | Borde de la insignia en curso, de «Cancelar» | 3,43 |
| En curso: etiqueta / motivo (panel) | 15,20 / 7,38 | | Motivo del fallo (`danger-text`): pila y panel, reposo / activa | 4,51 / 5,04 |

**El relleno del FAB solo, frente a la página, baja a 1,77:1 (`lustre`, claro) y 1,92:1 (`spotify`, claro)**: el contorno `primary-text` lo lleva a ≥ 4,53:1. En el tema por defecto no se ve (mismo color).

**Dentro de la zona de marca** (por defecto y NisaNabani, claro y oscuro): el FAB es la tinta invertida (16,48); mínimos 4,84 (etiqueta sobre el resaltado, peligrosa en la pila y motivo del fallo activo, `on-brand-danger`), 4,81 (confirmación e insignia fallida: rellenos con su par, no se redeclaran) y ≥ 5,59 el foco.

## Colores forzados, RTL y táctil

- `forced-colors` (Chromium): bordes `CanvasText` en píldoras, cola, panel, par e insignia; las semillas ganan contorno (su relleno desaparece); sin capa de resaltado ni semilla encendida: el foco (también el del puntero) es un contorno `Highlight`; peligrosa y marca en `LinkText` (la marca es un icono); deshabilitada `GrayText`; FAB sin sombra (el borde `ButtonText` es de `GBtn`); velo transparente (sigue tragándose el toque; medido también en la franja del borde). El motivo de un fallo queda en el color del sistema (el texto lo dice).
- RTL: todo lógico salvo lo que es físico por naturaleza (`left`/`top` de las listas, el recorte y el vector de la semilla), que sigue a `--_k` con `:dir(rtl)`. Medido en las seis posiciones.
- `pointer: coarse` (Chromium y WebKit con `isMobile`; Firefox sin emulación, se fuerza con `is-coarse`): píldoras y filas de 44px, semillas de 36px aún en el eje del FAB, velo en cuatro piezas (medidas arriba).
- **Límite del velo (aceptado en #668, para el README):** el anillo de `space × 1` alrededor del disparador y las esquinas de su caja fuera de la forma redonda dejan pasar el toque a lo que haya debajo, a ≤ `space × 1` del borde visible del FAB.

## Preguntas para lima

Las nueve de la primera entrega quedaron respondidas en #668 a #671 (96927a4) y el CSS ya las sigue: clases `g-fab__glyph--rest/--open`, `g-fab__find-query`/`-count`; `--_offset`, `--_minh` solo cuando cubre la pila, `--_hole-*`; §47 con `primary`/`primary-text`; constantes de #671 (el factor de la insignia ya como `(1 − 1/√2)/2`); `opening` sin transición; par de confirmación como dos hijos directos (los selectores del par pasaron a `>`); velo en cuatro piezas; acuse en el elemento; `k` con alturas medidas (es del `.vue`). Quedan dos, ninguna bloquea:

10. **El anillo en `--_hole-*`:** leo «`--_hole-*` de la ventana» (§«Velo táctil» 3) como la ventana **con** el anillo, de modo que el `.vue` suma `space × 1` por lado (lo elegido por coco) antes de redondear hacia fuera; el CSS no suma nada (con un `space` fraccionario, sumar el anillo en CSS dejaría las costuras en medio píxel). Propuesta: decirlo así en el contrato y en «Clases y datos» («caja del disparador + `space × 1` por lado»).
11. **#672 y el contorno del FAB:** con #672 (otra sesión, aún sin commit) el `solid` de `GBtn` lleva su propio borde `primary-text`. El anillo exterior que pone `GFab.css` (§47, «Contorno de `--g-border-width` del FAB y del grupo de C») quedaría doble con una marca pálida, y la costura de C (`border-inline-start-color` de la cola) pasaría a pisar ese borde. Propuesta: cuando #672 entre, quitar el anillo de `GFab.css` y dejar solo `--g-shadow-2` (el contorno lo da `GBtn`), y corregir la fila de §47. Lo mido y lo ajusto en la auditoría.

## Para bruno

- Marcado que el CSS espera: el FAB de A es un `GBtn` hijo directo de `.g-fab`; en C, `.g-fab__main-group` con la principal como **primer `button`** y la cola como **último** (los `div.g-tooltip` hermanos no cuentan); dentro del FAB y de la cola, `span.g-fab__glyph.g-fab__glyph--rest` (con `plus`/`trigger-icon` o `ellipsis-vertical`) y `span.g-fab__glyph.g-fab__glyph--open` (`x`), y `span.g-fab__badge` con su icono.
- Escribir `--_x`, `--_fx`, `--_fy`, `--_i` y `--_clip-from` **en `opening`** y pasar a `open` en el segundo cuadro; volver a abrir durante `closing` va directo a `open`.
- `data-appearance="main"` en la raíz es lo que activa la transformación de contenedor del panel de C.
- El velo es `div.g-fab__scrim` con **un hijo** `span.g-fab__scrim-part` (la cuarta pieza; #668). La ventana va en `--_hole-x/-y/-w/-h`: caja del disparador contraído (A y `single`: el FAB; C: `g-fab__main-group`) **más `space × 1` por lado**, en px **enteros** del visor, `floor` del origen y `ceil` del extremo (`x = floor(left − s)`, `w = ceil(right + s) − x`; igual en bloque). Siempre en coordenadas del visor, también con `anchor="container"`; sin `--_x/--_y/--_w/--_h` en el velo. Sin `--_hole-*`, el velo lo cubre todo (también el FAB). Nada de transform, filter, contain ni will-change en el velo: sus piezas son fijas. Referencia: `placeScrim()` de `estilo-banco.js`.
- Acuse por elemento (#669): `data-ack="busy"` o `"failed"` en el `button.g-fab__item` de esa acción (o en el `GBtn` de `single` y de la principal de C, por `$attrs`); ausente en reposo y tras `done`/`cancel`. En curso el elemento sigue `aria-disabled="true"` con su motivo; fallido, sin `aria-disabled` y con el texto del fallo en `g-fab__reason`.
- `is-coarse` es opcional: la consulta `pointer: coarse` ya lo resuelve; sirve para forzarlo (Firefox no emula el puntero grueso).
