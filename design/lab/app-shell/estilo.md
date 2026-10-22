# GAppShell · estilo (coco)

Contrato: `design/contracts/app-shell.md` (DECISIONS.md #708 a #717; `tokens.md` §48; `api.md` «Piezas pegadas» y «Cabecera fija de la aplicación»). Estructura: `r01/` (kiwi). CSS: `packages/vue/src/components/GAppShell/GAppShell.css`. Banco: `estilo-banco.html` (`python3 -m http.server 4212` desde la raíz → `/design/lab/app-shell/estilo-banco.html`; parámetros `?header=relay`, `?mode=…`, `?overlay=1`, `?variant=floating`, `?dir=rtl`, `?theme=<generado>`, `?dark=1`, `?zone=header|side`, `?ph=0`, `?phsticky=0`, `?nohead=1`, `?hh=72`, `?acc=1`, `?space=5`, `?appRecipe=1`). Verificación: `GRANA_PW_PORT=4212 node design/lab/app-shell/estilo-verificar.mjs` (opciones `--engines=…`, `--themes=base`, `--parts=static,base,budget,s1,A,B,theme,perf`, `--verbose`).

El banco usa `GSidebar`, `GPageHeader`, `GAccordion`, `GBtn` y `GIcon` reales de `dist/` y un `XAppShell` que pinta el marcado exacto del contrato y hace solo lo que el estilo necesita (clases, salto, el manejador de B y la relectura de `GPageHeader` tras ceder, que en el componente real será el canal `appShellKey`). No es el `.vue` de bruno. El CSS del chasis, de `GContainer` y de `GPageHeader` se carga desde `src/` dentro de la capa `grana.components`, como lo registrará bruno.

**Sin cambios en `defaults.css`:** el contrato no añade tokens del tema y no hizo falta ninguno.

## Qué le da personalidad

**La página no se recompone delante de quien lee (A · Cortina).** La pista del sidebar es una propiedad registrada que cambia con una transición **discreta** (`0s` con retardo), nunca interpolada: al contraer, la página se ensancha en el primer cuadro y el riel se encoge **encima** de ella; al expandir, el sidebar crece encima de la página quieta y la página se aparta **una sola vez**, justo cuando ya está cubierta. La espera es `--g-duration-slow`, la misma duración que la transición de ancho de `GSidebar.css`: **están acopladas** (L9, #709) y el análisis estático del banco lo comprueba en las dos hojas.

**La cabecera y el encabezado de la página se pasan el borde sin costura (B · Relevo de franja).** El contrato decía «la banda sale con `translate` de su alto y la cifra pasa a 0». Medido, eso deja un hueco: la banda se mueve el doble que el zócalo y, en los cuadros intermedios, asoma la página entre las dos franjas (hasta 29 px en Chromium y 51 px en WebKit al ceder). Mi decisión: **la banda no lleva `translate`**; sale por su propia posición pegada (`inset-block-start: --g-app-shell-top − banda`) con la cifra animada, la misma que mueve el zócalo. Así el borde de abajo de la banda y el de arriba del zócalo son **la misma línea en cada cuadro** (medido: separación máxima 0 px al ceder y al volver en los tres motores). Se lee como una sola franja que cambia de dueño, que es lo que el concepto promete.

**El enlace de salto es una pestaña que cuelga del borde del visor.** Sin borde ni radio arriba, pegada al borde superior, baja con el foco en `--g-duration-fast` + `--g-ease-out` (el mismo lenguaje de pestaña colgante que la de `GTooltip`). Como toca el borde, el anillo va **por dentro** (`outline-offset` negativo): por fuera perdería su lado de arriba.

**El foco que entra en la banda cedida la devuelve al instante.** Con teclado no hay deslizamiento: el anillo nunca se pinta fuera del visor y ningún navegador desplaza la página para buscarlo (ver «Hallazgo de la construcción»).

## Decisiones de coco

| Pieza | Decisión | Por qué |
| --- | --- | --- |
| Raíz | Rejilla `[--_app-shell-nav | minmax(0, 1fr)]`, áreas `nav head / nav frame`; `min-block-size: 100dvh`; fondo `bg`, texto `text`, fuente `font-ui` | Las áreas solo ponen la pista a un lado: el orden del DOM sigue siendo el de lectura (1.3.2) |
| Cifra | `--_app-shell-band` (alias), `--_app-shell-pinned` (la cifra sin ceder, alias) y `--g-app-shell-top` (publicada) = `pinned`, 0 sin cabecera o cedida | `pinned` no se anima: es lo que necesita el `scroll-margin` de la banda en B |
| Zócalo contado | `--_app-shell-base` = `max(space-12, 44px)` con `.g-page-header.is-sticky:not(dialog *)` en `main` (en la raíz y en `:root`) | #713: un zócalo que no se pega no ocupa |
| Receta en `<html>` | `:root:has(.g-app-shell:not(dialog *))` con la misma función escalón; sin cabecera o cedida, solo el zócalo | El `scroll-padding` vive en el desplazador; nada dentro de un `<dialog>` (aviso 7) |
| Reserva | `:has(> …)` sobre hijos directos con las clases de #712 | Correcta en el primer pintado; navbar con `--g-sidebar-bar` **+ `env(safe-area-inset-bottom)`** al final del marco (la barra deja el área segura debajo; en escritorio vale 0) |
| A | `transition: --_app-shell-nav 0s linear var(--_app-shell-delay)`; espera `--g-duration-slow` solo con destino `expanded` sin `overlay` **y el sidebar ya montado (`.is-ready`)** | Sin `is-ready`, la primera reserva al hidratar (de `drawer` a `expanded`) esperaría 240 ms con la página tapada: nada se anima al montar (§29.3) |
| B | `--g-app-shell-top` con `--g-duration-fast` + `--g-ease-out`; sin `translate` (arriba); sin muelle (#299, #710) | Relevo sin costura |
| Banda | Sticky, `block-size` de contrato con el borde dentro, `flex` con `gap: space-3`, `padding-inline: space-4`, fondo `bg`, borde inferior real `border` | 1.4.11 y `forced-colors` |
| S1 de la banda | `scroll-margin-block: −(pinned + base) (pinned + base)` en la banda y lo de dentro (`:not(:where(.g-tooltip))`, #383) | Con la cifra sin ceder y el área desplazada hacia abajo lo mismo que resta: vale pegada, cedida y a media vuelta |
| Sidebar | `position: fixed; inset-block: 0 auto; inset-inline-start: 0; block-size: 100dvh` (flotante: `100dvh − space-3 × 2`), `z-index: 5` | S1 y S2; el superpuesto también (la regla de `GSidebar.css` lo pondría `absolute` contra el chasis) |
| Marco | `flex` en columna, `overflow-x: clip`, `padding-block-end: --_app-shell-bar`; `main` con `flex: 1 0 auto` y sin anillo | Contrato |
| Pie | `padding: space-4`, borde superior `border`, `text-muted`, `body-sm` | Sobrio: el pie de la aplicación no compite con la página |
| Salto | `fixed`, `z-index: 10`, al inicio lógico + `space-4`; `surface`, borde `border-strong` sin el de arriba, radio `md` abajo, `shadow-2`, `body-sm` + `action-weight`; ≥ 24 px (`space × 10` = 40 px) y 44 px con `pointer: coarse` | Pestaña colgante; 2.5.8 |
| `z-index` | Banda 4, sidebar 5, salto 10 | Encima de `GPageHeader` pegado (2) y su muelle (3); el sidebar tapa la página y la banda mientras crece (A) |
| Zona de marca | La banda lee `bg`, `text` y `border`, que la zona redeclara (§44.5): nada propio | `headerZone` pone el atributo en la banda (bruno) |

## Movimiento

| Qué | Cómo | Reducido |
| --- | --- | --- |
| Pista (A) | Discreta: al instante al encoger; tras `--g-duration-slow` al crecer (con el sidebar montado) | Sin espera (`transition: none`) |
| Ancho del sidebar | De `GSidebar.css` | El de `GSidebar` |
| Cifra y banda (B) | `--g-app-shell-top` en `--g-duration-fast` + `--g-ease-out`; la banda sigue a la cifra (sin `translate`) | Instantáneo |
| Foco que entra en la banda cedida | Vuelve al instante (sin transición de la cifra mientras la banda tiene `:focus-within`) | Igual |
| Pegarse y despegarse | Sin animación | Igual |
| Enlace de salto | `translate` en `--g-duration-fast` + `--g-ease-out` | Aparece |
| Rejilla | Nunca se anima | Igual |

## Hallazgo de la construcción: el foco hacia la banda cedida

Con B cedida, **enfocar un control de la banda desplazaba la página** en los tres motores (1600 → 1122 en Chromium, → 1094 en WebKit): el foco llega antes de que el chasis quite `is-yielded`, la banda aún está fuera por arriba y el navegador la «busca». WebKit, además, lo hace un cuadro después, cuando la cifra ya empezó a subir desde 0. Dos correcciones en el CSS, sin cambiar el contrato de bruno:

1. **El `scroll-margin` de la banda usa la cifra sin ceder** (`--_app-shell-pinned`) y desplaza el área hacia abajo lo mismo que resta (margen de abajo positivo): el navegador considera la banda en el sitio al que va a volver.
2. **`:focus-within` en la banda anula la cesión en CSS** (`.is-yielded:not(:has(> .g-app-shell__header:focus-within))` y lo mismo en `:root`) **y quita la transición de la cifra**: en el cuadro en que llega el foco, la banda ya está en su sitio.

Medido después: 1600 → 1600 con `.focus()` y con Mayús+Tab desde el sidebar, en los tres motores. bruno sigue quitando `is-yielded` en `focusin` (contrato); el CSS solo cubre el cuadro de en medio.

## Medidas (Chromium, Firefox y WebKit)

`estilo-verificar.mjs`: **227/227 en Chromium, 225/225 en Firefox y 225/225 en WebKit** (Firefox y WebKit no emulan `forced-colors`), con el tema por defecto y los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/`, claro y oscuro.

| Qué | Resultado |
| --- | --- |
| Análisis estático | Sin colores literales (solo `CanvasText`), sin respaldos, sin `@layer`; solo los tokens de «Tokens consumidos»; las seis `@property` con su sintaxis; literales de medida solo `24px`, `44px`, `100svh`, `100dvh` (y `0s` de la transición discreta); sin muelle; sin contención; #383; acoplamiento de A con `GSidebar.css`; regla S5 en `GPageHeader.css` |
| Landmarks | `banner`, `navigation "Principal"`, `main`, `contentinfo` |
| Salto | Fuera del visor sin foco; con el primer Tab (Opción+Tab en WebKit) cuelga en 0, 40 px de alto, anillo por dentro; Intro → foco en `main` sin anillo |
| Reserva | Expandida 264, riel 64, riel superpuesto 64 (la expansión encima, fija tras desplazar, del alto del visor: S2), flotante 288 y 88 (fijo con su margen de 12 arriba y abajo), drawer 0, navbar 0 con 68 al final del marco y el pie encima de la barra; RTL: sidebar al final, banda y página a su izquierda, salto a la derecha |
| Cifra | Banda 56, `--g-page-header-top` 56, acordeón 104, `scroll-padding` 104; `--g-app-shell-header: 72` en `:root` → 72 / 72 / 120; `sticky: false` → 56; sin `GPageHeader` → 56; sin cabecera → 0 y 48, zócalo en 0; receta de la aplicación sin capa → gana; `space` 5 → banda 70, `scroll-padding` 130, pista 330 |
| Presupuesto | 1440×900 y 800×430 pegada; 800×400 y 320×256 despegada (`scroll-padding` 48, la banda se va con la página); lo pegado ≤ 25 % del visor; sin desplazamiento horizontal en los cuatro |
| S1 | Con la página en 1200, enfocar el botón de contraer, un enlace del sidebar, un botón de la banda y las dos acciones del zócalo: Δ0 en los tres motores |
| S5 | Δ0 también **antes de pegarse** (scrollY 60, 120 y 180, con solo `is-sticky`) y **sin chasis** (banco de `GPageHeader` con la receta de la aplicación). Control sin la regla: 1200 → 778 (Chromium), → 1158 (WebKit), 1200 (Firefox) |
| `GAccordion sticky` (encargo de lima) | Encabezado abierto pegado en 104 = `--g-accordion-sticky-top` = `scroll-padding`; enfocar su botón y su acción con la página desplazada: **Δ0 en los tres motores**. No sufre S1: se pega justo en el borde de la banda, no dentro. Nada que arreglar en `GAccordion.css` |
| A | Contraer: dos posiciones (264 → 64), la página se mueve en el primer cuadro y el riel se encoge encima; Δ0 del párrafo leído (alto y posición) y el foco sigue en el botón. Expandir: entre 90 y 160 ms la página en 64 y el sidebar creciendo encima; se aparta una vez, a ≈ `--g-duration-slow` (240 ms). Interrumpir a 80 ms: la página no salta. Reducido: sin espera. Al cargar, la pista reserva 264 sin espera |
| B | Bajar 1600: cede (banda fuera, zócalo en 0, `scroll-padding` 48) y `GPageHeader` sigue `is-stuck`; relevo sin costura (0 px de separación en cada cuadro al ceder y al volver) con cuadros intermedios; subir 160 en dos pasos: vuelve; foco y Mayús+Tab a la banda cedida: vuelve, Δ0; sin `GPageHeader` y con la banda despegada por el presupuesto: no cede; reducido: sin deslizarse |
| Contraste (mínimo de los 24 temas) | Texto de la banda 16,43:1; pie (`text-muted`) 7,38:1; salto 15,20:1; anillo del salto 4,52:1 contra la pestaña. Zona de marca en la banda (por defecto, grana, spotify y stripe, claro y oscuro): texto ≥ 4,5:1 |
| `forced-colors` (Chromium) | Borde real de la banda y del pie |
| `GContainer` dentro | La banda `g-bleed` llega al borde del marco (nunca bajo el sidebar) y su texto sigue en la columna |
| Rendimiento (medida, no compuerta) | Alternar una clase en un nodo con 2000 hermanos y leer el `scroll-padding`: ≈ 0,01 ms por cambio con `:root:has()` en los tres motores (0,005 a 0,011 sin las reglas de `:root`): el coste de `:has()` no se distingue del ruido |

## Rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`)

| Dimensión | A · Cortina | B · Relevo | Evidencia | Riesgo | Recomendación |
| --- | --- | --- | --- | --- | --- |
| A. Propósito | Cumple | Cumple | A: causa-efecto (la navegación cubre, luego la página se aparta), 2 posiciones medidas. B: recupera 56 px de lectura sin perder el título ni las acciones | Bajo | — |
| B. Comodidad visual | Cumple | Cumple | Un solo cambio de ancho en vez de 15; B, una banda de 56 px en 120 ms sin costura | Bajo | — |
| C. Estabilidad | Cumple | Parcial | A: el texto que se lee no cambia de alto ni de posición (Δ0). B: una banda ancha que se mueve arriba, ligada al desplazamiento | Bajo (B es opción de la aplicación) | README: elegir B para lectura larga, no para paneles de trabajo |
| D. Transiciones | Cumple | Cumple | A interrumpible a 80 ms sin salto; B se revierte subiendo; ambas parten del estado actual (transiciones CSS) | Bajo | — |
| E. Control | Cumple | Parcial | A la dispara la persona; B no se pide, pero vuelve al subir `space × 4` o al entrar el foco | Bajo | — |
| F. Accesibilidad | Cumple | Cumple | Reducido: sin espera y sin deslizarse (medido); el foco nunca queda fuera de la vista (S1, B con foco); 1.4.10 con el presupuesto | Bajo | — |
| G. Rendimiento | Cumple | Parcial | A: un reflujo por cambio, sin JS. B: la cifra animada mueve dos piezas pegadas (reflujo por cuadro durante 120 ms) y un manejador pasivo | Bajo | bruno: confirmar que el desplazamiento con B no vuelve a pintar Vue (spec de rendimiento) |
| H. Inmersión | N/A | N/A | — | — | — |

**Resumen:** A cumple en todo; B cumple salvo estabilidad, control y rendimiento, parciales por ser movimiento ligado al desplazamiento que la aplicación elige. El riesgo principal (foco hacia la banda cedida) apareció en la construcción y queda corregido y medido. **No verificable aquí:** móvil real (barra del navegador que se recoge con `svh`/`dvh`), lector de pantalla real, zoom real del navegador, `forced-colors` en Firefox y WebKit.

## Para bruno

1. **`.is-ready` de `GSidebar`** en la espera de A: la lee `GAppShell.css` (`:has(> .g-sidebar--mode-expanded.is-ready:not(.g-sidebar--overlay))`). Hoy la pone `GSidebar.vue` dos cuadros después de montar; no cambiarla sin avisar (pasa a contrato entre componentes, ver «Para lima»).
2. **Clases del contrato** sin cambios: `g-app-shell`, `--header-relay`, `is-yielded`, `has-header`/`has-footer` (el CSS no las lee: detecta la banda con `:has(> .g-app-shell__header)`), `__skip`, `__header`, `__frame`, `__main`, `__footer`, `data-g-zone` en `__header`.
3. **B:** quitar `is-yielded` en `focusin` como dice el contrato; el CSS cubre además el cuadro en que el foco llega antes que la clase (`:focus-within`). El umbral `space × 4` se mide como en el banco; «despegada por el presupuesto» se puede leer del alto de la banda y de `--_app-shell-base` (o de `--g-app-shell-top` antes de ceder).
4. **El registro de bordes abajo:** el CSS reserva `--g-sidebar-bar + env(safe-area-inset-bottom)`; si el `edgeReserve` publica solo `--g-sidebar-bar`, con muesca el muelle y el FAB quedarían el área segura más bajos que el pie. Publicar el `padding-block-end` resuelto del marco (lo que de verdad reserva) evita la diferencia.
5. **Spec de rendimiento** de B (que el desplazamiento no vuelva a pintar Vue) y la medida de `:root:has()` en la página real del playground.

## Para lima

1. **`is-ready` de `GSidebar` pasa a la lista de clases entre componentes** de #712 (la lee la espera de A para no animar al montar). Propuesta de texto en `app-shell.md` «Reserva»: «… y `is-ready` (montado: A solo espera con él)».
2. **B sin `translate`:** el contrato («Movimiento» y §B.1) dice que la banda sale con `translate` de su alto; la construí sin él porque con las dos cosas la banda se mueve el doble que el zócalo y asoma la página entre ambas (medido: hasta 29 px en Chromium y 51 px en WebKit en los cuadros intermedios; sin `translate`, 0 px). El efecto visible es el mismo (sale por arriba en `fast` + `ease-out`) y sin costura. Pido actualizar el texto.
3. **El foco que entra en la banda cedida la devuelve al instante** (sin deslizarse), por `:focus-within` en CSS. El contrato dice «vuelve antes de que el foco se pinte»; esto lo cumple también en el cuadro intermedio. Anotarlo en §B.2.
4. **Reserva del navbar con el área segura** (`+ env(safe-area-inset-bottom)`): no cambia nada sin muesca; con muesca el pie no queda bajo la barra. Anotarlo en «Reserva» si se acepta.
5. **S5 con `is-sticky` y no `is-stuck`** (`page-header.md` dice `is-stuck`): mientras el encabezado se hunde y aún no está pegado, el zócalo ya cae dentro de la banda del `scroll-padding`; medido Δ0 con solo `is-sticky`. Pido cambiar el texto de la enmienda de #715 en `page-header.md` y en el encargo de `app-shell.md`.
6. **`GAccordion sticky` no sufre S1** (medido en los tres motores): se puede cerrar el punto 3 de `api.md` «Piezas pegadas» («está por medir»).

## Cumplimientos / Correcciones / Pendientes

**Cumplimientos.** `GAppShell.css` con la base, A, B, reducido, `forced-colors`, RTL y zona en la banda, solo con tokens y las constantes de §48; las cuatro `@property` privadas y las dos públicas; la espera de A acoplada a `GSidebar.css`; S1 en la banda y el sidebar fijo; S5 en `GPageHeader.css`; medido en tres motores y 24 temas.

**Correcciones (hechas en esta entrega).** B sin `translate` (relevo sin costura); el foco hacia la banda cedida ya no desplaza la página (`pinned` en el `scroll-margin` y `:focus-within`); la espera de A no se dispara al montar (`is-ready`); la reserva del navbar suma el área segura; la comprobación estática de `design/lab/page-header/estilo-verificar.mjs` admite ahora solo el `scroll-margin` negativo de S5 (antes prohibía cualquiera, #515).

**Pendientes.** Auditoría de coco sobre el `GAppShell.vue` real de bruno (paso 5), con el canal `appShellKey` en vez del `resize` simulado; las notas a lima de arriba; lo no verificable (móvil real, lector de pantalla, zoom real, `forced-colors` en Firefox y WebKit).
