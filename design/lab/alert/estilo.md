# Estilo · Isla de estado (coco)

**Contrato:** `design/contracts/status.md` (lima, #315 a #327; personalidad #316, curva #324, color #325). **Estructura:** `design/lab/alert/r02/` (kiwi, **B · Isla de estado**, `index.html?c=B`: el prototipo que el usuario aprobó mirándolo) y `r01/` (base funcional).
**CSS:** `packages/vue/src/components/GStatusIsland/GStatusIsland.css` (isla, avisos `g-status-item`, hoja `g-status-sheet`) y `packages/vue/src/components/GStatusMark/GStatusMark.css`.
**Banco:** `estilo-banco.html` (componentes reales de `dist/`: `GBtn`, `GDialog` de la hoja, `GFormActions`; el marcado exacto del contrato en `XIsland`, `XList` y `XMark`, que hacen de `.vue` solo en lo que el CSS necesita: medir `__inner`, escribir `--_island-w/h`, `is-ready`, `is-nudge`). **Verificación:** `node design/lab/alert/estilo-verificar.mjs` (Chromium, Firefox y WebKit; puerto `GRANA_PW_PORT`, por defecto 4209). Resultado: **2107/2107** en Chromium (incluye los once temas generados, claro y oscuro) y **466/466** en Firefox + WebKit.

## 1. Geometría (constantes derivadas de `space`, no tokens)

| Pieza | Medida | Nota |
| --- | --- | --- |
| Margen al borde | `space × 2`, con `env(safe-area-inset-*)` y `--_status-offset-top` | también en móvil |
| Compacta | alto `space × 12` (48px) **con el borde** | `max(44px, …)` con `pointer: coarse` |
| Punto | `space × 8` (32px) **con el borde** | `max(44px, …)` con `pointer: coarse` (la forma recorta: el área no puede salir por un `::after`, así que crece el punto) |
| Abierta | `min(space × 104, ancho disponible)` (416px) | la compacta **nunca** la supera: compacta → abierta siempre crece |
| Insignia | `space × 8` (resumen, abierta, avisos), `space × 6` (punto y marcas); icono `space × 5` / `space × 4` | |
| Anillo de insignia | `border-width × 2`: **sólido** `error`, **discontinuo** `warning`, **punteado** `info`, **sin anillo** `success` | señal no cromática; a 1px el punteado no se leía en 24px |
| Radio | compacta `min(radius-pill, alto / 2)`, punto igual, abierta `radius-xl`, aviso `radius-lg`, detalle `radius-md` | el radio de estadio sale del alto (no de `999px`), así interpola sin salto hacia `xl` |
| Cápsula de la marca | alto `space × 8` con el borde; `::after` ≥ 24/44 | |

- La forma (`__shape`) mide `--_island-w/h` **+ el borde** con `box-sizing: border-box` explícito: un reinicio de la aplicación sin capa (`* { box-sizing: border-box }`) gana a la capa de Grana; el banco lo tiene a propósito y la medida pasa.
- `__inner` se mide a su tamaño natural: `max-content` hasta `min(space × 104, 100cqi) − 2 × borde`. La raíz es contenedor (`container-type: inline-size`): `100cqi` es el visor menos márgenes y no depende del tamaño animado de la forma (sin ciclo).
- Abierta: `__inner` limita su alto a `100dvh − top − margen`; el panel es columna flexible: la lista desplaza (`overflow-y: auto`, `overscroll-behavior: contain`) y el pie «Entendido» queda siempre visible (medido con 9 condiciones a 900 y 600px de alto).
- En móvil (`data-mobile`) la forma se queda compacta aunque `data-form="open"` (la abierta es la hoja).

## 2. Color (#325)

- **Superficie inversa:** fondo `--g-color-text`, tinta `--g-color-surface` (texto, iconos de los botones, anillos, «+N», enlace). Nunca `brand`: medido en `spotify` y `caracol-purpura` (marca de color), la isla sigue siendo `--g-color-text`.
- **Todo el texto en la tinta plena** (sin `opacity` ni mezclas de texto): un tema solo garantiza el par texto/superficie, y apagar la descripción lo bajaría de 4,5 en los temas justos. La jerarquía la da el peso (`action-weight` en título, temporizador y enlace; normal en la descripción).
- **Aviso dentro de la isla:** tinte `color-mix(surface 8 %)`; reconocido, sin tinte y con contorno `surface 16 %` («ya visto»). Detalle técnico: pozo `surface 8 %` sobre el tinte.
- **Insignia:** relleno `--g-color-{info|success|warning|danger}`, icono `on-…`, anillo en la tinta.
- **Botones (GBtn, alias reasignados):** acción y «Entendido» `outline` en la tinta; **al pasar se encienden** (relleno `surface`, texto `text`: par garantizado). «Ir a…», detalle, copiar y descartar `ghost` con velo `surface 12 %` al pasar. Reintentando: `aria-disabled`, mismo color, cursor de progreso, sin pulsación.
- **Hoja móvil:** los mismos avisos sobre la superficie del diálogo (tile `surface` + borde `border`, anillo de insignia en `text`, botones como `GToast`: texto `text`, borde `border-control`).
- **Marca enlace:** cápsula inversa (`text` / `surface`). **Marca de texto:** sin caja; insignia **sin relleno** (anillo e icono en `--g-color-{tipo}-text`), texto `--g-color-text`.
- **Foco:** replegada, el resumen **es** la isla: anillo **exterior** `--g-color-focus` alrededor de la forma (`:has(:focus-visible)`), porque un anillo interior en el punto coincidiría con el anillo de la insignia. Abierta, anillo **interior** en la tinta sobre la fila del resumen; dentro de los avisos, anillos en la tinta (#325). Marca enlace: anillo exterior `--g-color-focus`.

**Contraste medido** (mínimo entre el tema por defecto y los once generados, claro y oscuro, los cuatro tipos): texto del resumen 15,20; título, descripción, temporizador, enlace y acciones de los avisos 13,01; detalle técnico 10,83; botones fantasma al pasar 9,52; «+N» 15,20; marca enlace 15,20; marca de texto 15,20 (texto) y 4,51 (insignia, `linear` oscuro `error`); icono sobre la insignia 4,81; anillos 13,01. Tema por defecto claro: texto 17,40; icono de insignia `error` 5,49, `warning` 5,73, `info` 5,69, `success` 5,35. Relleno de la insignia sobre la isla (informativo, no obligatorio: la insignia tiene anillo o el icono la define): mínimo 3,03.

## 3. Movimiento (#324, `tokens.md` §29)

| Qué | Curva y duración | Con `reduce` |
| --- | --- | --- |
| Cambio de forma (ancho, alto, radio) | `--g-ease-spring` + `--g-duration-slow` dentro de `@supports (linear())`; fuera, `--g-ease-out` | instantáneo |
| Toque (`is-nudge`) | `g-status-nudge`, `scale` 0,86 → 1, muelle + `slow` | no existe |
| Nacer | `@starting-style` opacidad 0 y escala 0,86, `--g-duration-press` + `--g-ease-out` (entrada: sin muelle) | solo fundido `fast` |
| Vaciarse | fundido `fast` (`display` con `allow-discrete`) | igual |
| Recolocación por la reserva de borde | `inset-block-start`, `press` + `ease-out` | instantánea |
| Contenido del panel | cascada: cada aviso cae `space × 1` y se funde en `press`, retardo `fast / 5` por aviso, como mucho 3 escalones (≤ 232ms) | solo fundido `fast` |
| Pulsar la isla replegada | `--g-press-scale` (como `GBtn`) | no |
| Reintentando | `loader-circle` gira en `--g-duration-spin` | sin giro |

- **Nada se anima al montar:** toda transición de forma, cascada y nacer vive bajo `.is-ready`.
- **Medido** (tres motores): compacta → abierta 295×48 → 416×448, **sobrepaso 3,6–3,8 %** del cambio, asienta en 209–238ms; abierta → punto y punto → compacta igual. Toque: `g-status-nudge` desde 0,86 en 240ms y la clase se retira en `animationend`. Con `reduce`: 0 animaciones en curso salvo fundidos; la forma salta a su tamaño.

## 4. Personalidad: qué conserva del prototipo aprobado y qué afiné

**Conserva (lo que el usuario vio en `?c=B`):** la píldora oscura colgada del borde superior; una sola superficie que crece de la compacta a la abierta y se repliega a un **punto** (D2, D4) con el muelle; la insignia redonda rellena del tipo con su anillo en el color de la tinta y la forma del anillo por tipo; el título en peso de acción; «+N» como cápsula con contorno; el toque desde 0,86; avisos como piezas redondeadas dentro de la isla con «Reintentar» en contorno de cápsula; la marca enlace como cápsula del mismo lenguaje; la marca de texto como una línea sin caja.

**Afinado (coco):**

1. **Insignia concéntrica.** El hueco al inicio es el mismo que arriba y abajo (`(alto − insignia) / 2`, borde incluido): la insignia es un círculo concéntrico con el extremo de la píldora, en la compacta (8/8/8px), en el punto y en la cápsula de la marca. El prototipo tenía 4px al inicio y 8px arriba. Medido en LTR y RTL.
2. **La isla cuelga del borde.** El toque y el nacer escalan con origen **arriba** (centro, inicio o fin según `data-align`): el borde que toca el visor no se mueve, solo «respira» hacia abajo. Coherente con D1 (nada se mueve) y con la idea de un objeto anclado al shell.
3. **El radio también es forma.** Estadio (mitad del alto) → `radius-xl` con la misma curva; con `999px` el radio saltaba al final.
4. **Memoria visible en el punto.** Con más de una condición, un eco fino rodea la insignia del resumen (anillo de la tinta a dos bordes de distancia), también en el punto: el punto dice «hay varias» sin texto. Decorativo; el número está en el nombre accesible.
5. **El panel se vierte desde el resumen.** Al abrirse, los avisos caen `space × 1` en una cascada corta (tres escalones como mucho, dentro de los 240ms). Al llegar una condición con la isla abierta, ese aviso entra igual.
6. **«Reintentar» se enciende al pasar** (relleno de la tinta): la única acción de cada aviso se lee como tal sin color de marca.
7. **La compacta no supera a la abierta** (`space × 104`): abrir siempre es crecer, nunca encoger de ancho.
8. **Pulsar la isla replegada** la aprieta como un `GBtn` (no la abierta).
9. **Marca de texto con sangría francesa:** la insignia cuelga a la izquierda del texto; al partirse, las líneas y la acción quedan alineadas con el texto (medido en 320px). Insignia sin relleno, en el color `-text` del tipo, para que sea contenido y no una segunda isla.

## 5. Para bruno (marcado que espera el CSS)

Coincide con `status.md` y con `StatusList.vue` / `GStatusIsland.vue` en curso. Lo que el CSS da por hecho:

- Raíz `div.g-status-island` con `popover`, `data-align` (`start|center|end`), `data-form`, `data-type`, `data-mobile`, `is-ready`, `is-nudge`, `--_status-offset-top` en línea. **No** poner `display` en la raíz (lo decide `:popover-open`).
- `section.g-status-island__shape` con `--_island-w`/`--_island-h` = `offsetWidth`/`offsetHeight` de `__inner` (sin el borde: el CSS lo suma). Sin ellos la forma mide `auto`.
- `__summary` > `__badge` (`data-type`, `is-busy`, `.g-icon` hijo directo) + `__text` (con `__sr` dentro) + `__timer` + `__more`; `__panel` > `__list` + `__foot` > `__ack`.
- `li.g-status-item.g-status-item--type-*` (+ `is-busy`, `is-acknowledged`, `is-dismissible`): `__badge`, `__content` (título, descripción, temporizador, enlace, `__details-toggle`, `__details` > `__details-text` + `__copy`), `__actions` (`__action`, `__origin`), `__dismiss`. Si `__actions` no tiene hijos, mejor no pintarlo (el CSS lo oculta con `:empty`).
- Botones: acción y «Entendido» `size="sm" variant="outline" color="neutral"`; «Ir a…», detalle y copiar `size="sm" variant="ghost" color="neutral"`; descartar `icon size="sm" variant="ghost" color="neutral"` con `x`. (Es lo que ya hace `StatusList.vue`.)
- Hoja: `GDialog class="g-status-sheet" mobile="sheet"` dentro de la raíz; «Entendido» en el pie del diálogo.
- Marca: `button.g-status-mark.g-status-mark--link.g-status-mark--type-*` (+ `is-busy`) > `__badge` + `span.__text` (> `__type`); `div.g-status-mark--text` > `__badge` + `p.__text` + `div.__action`.
- **Toque con movimiento reducido:** no hay animación y por tanto no hay `animationend`; `is-nudge` debe retirarse sin esperar ese evento (el `.vue` en curso ya comprueba `getAnimations`). Filtrar `animationend` por `animationName === 'g-status-nudge'` (el giro `g-status-spin` es infinito y la cascada son transiciones).

## 6. Accesibilidad y preferencias

- Tipo sin color: forma del icono, prefijo oculto y forma del anillo (sólido, discontinuo, punteado, ninguno). En `forced-colors` (Chromium) el anillo conserva su forma en `CanvasText`, la isla y la marca llevan borde `CanvasText` (siempre presente, transparente fuera de ese modo: sin cambio de tamaño, medido) y el foco pasa a `Highlight`.
- `prefers-contrast: more`: avisos sin tinte y con contorno pleno.
- Texto ≥ 12px (detalle técnico y «+N» en `caption`, 12px).
- 375 y 320px: hoja inferior a todo el ancho pegada abajo, detalle partido, sin desplazamiento horizontal, isla dentro del margen.
- RTL: insignia al inicio (derecha) y concéntrica; marca de texto con la sangría espejada.

## 7. No verificado aquí

- Con el `.vue` real de bruno (el banco usa el marcado del contrato a mano): queda para la auditoría (paso 5), igual que zoom 200 % / 400 %, el traslado al modal, la convivencia con la píldora de voz (`--_status-offset-top`) y la isla junto a `GToaster`.
- `pointer: coarse` solo en Chromium (`isMobile`); en Firefox y WebKit el táctil no se emula.
- `forced-colors` real, Safari y táctil reales, lector de pantalla.
- `@starting-style` y `transition-behavior: allow-discrete` (nacer y vaciarse): soportados en los tres motores de Playwright; en navegadores sin ellos la isla aparece y desaparece sin fundido (degrada sin romper).
