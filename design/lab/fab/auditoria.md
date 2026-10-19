# Auditoría de coco · GFab (paso 5)

**Fecha:** 2026-10-18 · **Auditor:** coco (Opus, componente complejo)
**Alcance:** `GFab` entero (A «La pila que crece», C «Acción con cola», `single`, `appearance="panel"`), con los remates de #686 (deshabilitada) y #687 (panel que cubre la pila a su ancho). Contrato: `design/contracts/fab.md` (#654 a #671, #676 a #678; #686 y #687 escritas en `fab.md`, aún no en `DECISIONS.md`).
**Componente:** el real, de `dist/` reconstruido (`npm run build`): `GFab` de `fab.umd.js` (entrada `@grana/vue/fab`, global `GranaFab`), `GBtn`, `GTooltip`, `GIcon`, `GToaster` y `GDialog` de `grana.umd.js`, `GStatusIsland` de `status.umd.js`, `GPageHeader` de `page-header.umd.js`, `grana.css` y `fonts.css`. La voz, en el playground (`#sec-fab` con `?fabanchor=viewport&speech=self`, adaptador simulado). Medido sobre una copia de `dist/` (`--dist`) para no leer un `dist/` a medio reconstruir.
**Banco:** `design/lab/fab/auditoria-banco.html`. No inyecta marcado: lo pinta `GFab.vue`. El acuse lo da la «aplicación» con el ticket de `select` (plan por id en `window.__b.plan`).
**Tema distinto al de defecto:** `auditoria-tema.json` → `auditoria-tema.css` (`node packages/cli/bin/grana.mjs theme …`): **marca rosa pálido `#F2B8C6`** (el relleno del FAB da 1,69:1 frente a la página: lo que tiene que salvar el contorno de #672), acento `#0E7490`, neutros teñidos, radio 10, **`space` 4,5** (FAB de 58,5px: alturas fraccionarias en la rejilla de medio píxel, #682), texto 17, Trebuchet MS, borde 2px y foco 3px; claro y oscuro, y dentro de la zona de marca. Además, en Chromium, los once temas de `design/lab/tema-oscuro/dark-color-presence/generated/`, claro y oscuro (y `lustre` y `spotify`, las marcas más pálidas, en los tres motores para #686).
**Verificación propia:** `GRANA_PW_PORT=4214 node design/lab/fab/auditoria-verificar.mjs` (opciones `--engines`, `--themes=all|base`, `--only`, `--dist=<copia>`).

## Resultado: **2686/2686; pasa a `candidate`**

| Motor | Comprobaciones |
| --- | --- |
| Estático (CSS fuente y publicado, `fab.md`, `GFab.vue`, `meta.json`, peso) | 33/33 |
| Chromium (15 temas) | 1430/1430 |
| Firefox (defecto y tema de la auditoría) | 607/607 |
| WebKit (defecto y tema de la auditoría) | 616/616 |

`tests/fab.spec.mjs` en el puerto 4214, un worker, los tres motores, sobre el `dist/` final: **59 pasan y 1 se omite por diseño** (el velo táctil en Firefox, que no emula el toque). Mi banco de estilo, `estilo-verificar.mjs`, con #686 al día: 3201/3201 (estático 36, Chromium 1601, Firefox 782, WebKit 782). `npx vitest run` (`packages/vue`): 3696/3696 en 131 archivos. `npm run build` y `bash .github/scripts/gates.sh`: build correcto y 73/73 compuertas.

## Qué se midió

| Prueba | Resultado |
| --- | --- |
| **Tokens y CSS** (`GFab.css`) | Solo `var(--g-*)` y alias `--_*` (los `--_bg`/`--_fg`/`--_border` y sus `-hover` son los alias de `GBtn` que #686 reescribe); todos los `--g-*` existen; sin respaldos, `@layer`, `!important`, colores literales (los del sistema solo en `forced-colors`; `color-mix` solo desde `currentColor`, la costura de C), `rem`/`vh`, duraciones ni curvas propias, `--g-ease-spring`/`--g-ease-bounce`, polígonos ni `path()`. Medidas literales: `24px`, `44px`, `0.5px` (#682) y el patrón de texto oculto. Tokens de color: los 17 de `fab.md` «Tokens consumidos» (con `neutral-soft` de #686) y ninguno más; ni `brand` ni `primary-text` |
| **Clases y datos** (`fab.md` «Clases y datos» ↔ CSS ↔ `.vue`) | Todas las clases, variables y datos de la tabla tienen regla en `GFab.css` (salvo `--_h`, que la tabla dice que no se escribe) y el `.vue` los escribe; el CSS no usa ninguna clase que la tabla no fije; `meta.json` apunta a `GFab.css` |
| **Publicado** | `GFab.css` dentro de `@layer grana.components` en `grana.css`, con la deshabilitada de #686; `GFab` solo en `fab.js` (#656); `fab.js` **10 147 B gzip** ≤ 10 496 (#676); fuente sin incrustar |
| **Marcado real** | Raíz con `data-position`/`anchor`/`appearance`/`state` y `--_reserve`; FAB `GBtn` hijo directo, botón de menú con `aria-expanded` y `aria-controls`, nombrado por `GTooltip`, con `g-fab__glyph--rest/--open` y `g-fab__badge` `aria-hidden`; `ul role="menu" popover="manual" tabindex="-1"` con `aria-labelledby`; `li role="none" > button role="menuitem"`; la pila que sube con la primera de `items` al final del DOM y la cola primero, «Más acciones (11)» con `aria-haspopup`/`aria-controls`/`aria-expanded`; una parada itinerante; la descripción en la pila como texto oculto; el panel nombrado por la cola con grupos `role="group"` nombrados por su título (`role="presentation"`); deshabilitada `aria-disabled` con su motivo; C: `role="group"` con `label`, la principal primero (etiqueta visible, insignia) y la cola último; cabecera de búsqueda `aria-hidden`, sin `textbox`; `single` sin `aria-haspopup` ni lista; velo con su cuarta pieza |
| **Contraste** (30 configuraciones en Chromium, 8 en Firefox y WebKit; claro, oscuro y zona) | Texto ≥ 4,5:1 y formas ≥ 3:1 en todas. Mínimos: etiqueta del panel 4,51; peligrosa del panel 4,51; motivo del fallo 4,51; icono del FAB y etiqueta de la principal 4,70; **contorno del FAB y de la principal 4,53** (con el relleno solo, 1,69:1 en el tema de la auditoría); confirmación 4,81 y su contorno 4,88; insignia hecha 4,90; foco 4,52; contorno de la cola, del panel, de «Cancelar», de la insignia en curso y **de la deshabilitada (#686) 3,43**. Zona de marca: ≥ 4,74 texto, ≥ 5,39 formas, foco 5,57. El texto de la deshabilitada (`text-subtle` sobre `neutral-soft`) baja a **4,44:1** con `spotify`: exento por 1.4.3 (control inactivo), legible |
| **Áreas y texto** | FAB ≥ 44 × 44 (52 y 58,5); píldoras, filas del panel (también de C), «Cancelar» y la confirmación ≥ 24px y, con puntero grueso (Chromium y WebKit con toque; Firefox forzado con `is-coarse`), ≥ 44px; principal y cola de C ≥ 44px. Texto ≥ 12px (mínimo 12,00, el `caption` del tema por defecto) |
| **Foco visible** (por defecto, tema claro y oscuro, zona) | Tab desde la página llega al FAB con `:focus-visible` sólido ≥ 2px y ≥ 3:1; la píldora enfocada con anillo exterior que el recorte de la fila no corta; ↑ lleva a la cola; el panel con anillo interior ≥ 3:1 y el resaltado que viaja; en C, principal y cola son dos paradas con foco visible; con teclado, «Cancelar» con foco visible al armar. En WebKit, Opción+Tab |
| **Abrir y cerrar** | Clic: foco en la primera por frecuencia; Esc: cierra y el foco al FAB; la flecha contraria abre en la más lejana (la cola); Tab cierra; clic fuera cierra (puntero fino); elegir emite `select`, cierra y devuelve el foco; doble clic en el FAB lo deja abierto (#661) |
| **A · la pila** | Las cuatro primeras no se mueven de 6 a 10 y 15 (Δ 0,00px con `space` 4,5); el panel de la cola encima de la pila (900px de alto, sin `--_minh`) o cubriéndola (480px, con `--_minh`), siempre dentro del visor y con el FAB fuera |
| **C · acción con cola** | La principal ejecuta a un toque sin abrir nada; escribir «exp» filtra sin campo («Exportar CSV», «1 acción», foco en ella); la primera Esc limpia lo escrito y la segunda cierra con el foco en la cola |
| **Peligrosa** | Un doble clic arma el par con «Cancelar» con el foco y bajo el puntero, sin ejecutar; armar no mueve ninguna fila (Δ 0,00px); Esc deshace con el foco en la fila; con teclado, Intro, → e Intro ejecutan una vez |
| **Acuse** | En curso: insignia visible que gira; fallo: el elemento habilitado, sin tachar, con «Sin conexión» en `danger-text`; reintentar lleva `retry`; hecho: insignia y el texto como descripción del FAB |
| **Se aparta** | Con el foco en una fila bajo el FAB: `is-tucked`, 24px visibles (ver H4), cubre 0 % de la fila y nunca su centro; el primer clic sobre el FAB apartado solo lo devuelve |
| **Seis posiciones × LTR y RTL** (tema de la auditoría) | FAB a `space × 4` de sus bordes (lógicos) o centrado, del alto de `GBtn xl` en la rejilla de medio píxel (58,5px); la primera pegada al FAB; pila dentro del visor con margen ≥ 8px y sin solapes; sin desplazamiento horizontal |
| **Velo táctil** (Chromium y WebKit con toque; A abajo, A `top-start` RTL y C) | Abierto a 0,5 con la ventana en px enteros; fuera de la ventana todo es velo; tocar una fila de la página no sigue el enlace, cierra y devuelve el foco al FAB (en C, a la cola) |
| **Bordes compartidos** | Abajo: un aviso de `GToaster` queda encima del FAB sin solaparse; en estrecho, el muelle de `GPageHeader` va más cerca del borde y el FAB encima, y la pila abierta no baja al muelle; con la voz (playground, 360px), desde el borde: pill → FAB → aviso, sin solapes. Arriba: la isla y el zócalo pegado de `GPageHeader` van antes del FAB |
| **Modal** | Abrir un `GDialog` con la lista abierta la cierra sin tocar el foco (lo toma el diálogo) y el FAB queda bajo el fondo (el toque no le llega); al cerrar el diálogo, el FAB vuelve a abrir |
| **Movimiento** (tema de la auditoría) | Píldoras: `translate` y recorte en `press`, opacidad en `fast`, escalonado `fast × i / 8`, sin muelle; nada supera 240ms; cada semilla parte del centro del FAB (Δ < 1px) e invisible; el `+` gira 45° y la `x` llega |
| **Reducido** | Solo fundido: sin escalonado, recorte, desplazamiento ni giro; se aparta sin moverse; insignia en curso quieta y sin escala; el panel de C sin recorte |
| **Reflujo a 320px** | Pila, panel de la cola, C, par de confirmación y la etiqueta larga: sin desplazamiento horizontal, todo dentro, ninguna etiqueta recortada |
| **Texto al 200 %** (1280 × 900) | Pila, panel de la cola y C: sin recortes, dentro del visor y sin desplazamiento horizontal |
| **`forced-colors`** (emulado en los tres motores) | Bordes `CanvasText` en píldoras y panel; sin capa de resaltado; semillas con contorno; FAB sin sombra; **deshabilitada no en curso y su icono en `GrayText`** (H1); `single` y principal deshabilitadas en `GrayText` también al pasar, con la junta de C en `ButtonFace` |
| **#686 · deshabilitada** (por defecto, tema de la auditoría claro y oscuro, zona, `lustre`, `spotify`) | `single` y principal de C con `aria-disabled`: relleno `neutral-soft`, texto e icono `text-subtle`, contorno `border-control` (≥ 3,43:1), `cursor: not-allowed`; `single` en `shadow-1` (también en la zona, con sus sombras literales); el grupo de C conserva su elevación; pasar y apretar no cambian nada y **sin escala**; pulsarla no ejecuta. En curso (`data-ack="busy"`) la `single` conserva el aspecto de la habilitada con cursor de progreso (#669) |
| **#686 · junta de C** con la principal deshabilitada y la cola habilitada | El contorno cambia de color en la junta (gris → el `primary-text` de la cola; entre ellos 1,32 a 2,34:1), pero **no se lee como un hueco**: medido en píxeles, ningún píxel del color de la página entre la principal y la cola dentro de la caja del grupo, en los cuatro temas y en los tres motores; la costura de la cola sigue siendo la única línea. **No hay pregunta para lima** |
| **#687 · panel que cubre la pila** (etiqueta larga; 1000px LTR, RTL, tema de la auditoría y `top-start`; 320px) | Cubre (`--_minh`) y contiene a la pila en línea y en bloque (±0,5px), con `--_w` = el ancho de la pila; dentro del visor sin desplazamiento horizontal; por los lados del panel solo asoma sombra (Δ ≤ 24), nunca texto. Sin CSS nuevo: `inline-size: var(--_w)` ya lo aplicaba |
| **Consola** | Sin errores ni avisos de Grana o de Vue en ninguna página |

## Hallazgos

| # | Gravedad | Dueño | Qué |
| --- | --- | --- | --- |
| H1 | Media · **corregido** | coco | **En `forced-colors`, la acción deshabilitada se pintaba como una disponible en Chromium.** `.g-fab__item[aria-disabled="true"] { color: GrayText }` (0,2,0) perdía contra la regla de fuera `…:not([data-ack="busy"]) { color: text-subtle }` (0,3,0), y el sistema convertía ese color en `CanvasText` (medido: `rgb(0, 0, 0)` frente a `GrayText`); el icono de la semilla, igual. El tachado seguía diciéndolo, pero no el color del sistema. Ahora la regla de forzados tiene la especificidad de las de fuera y cubre el icono, y excluye la acción en curso (que no es «no disponible», #669). Lo comprueban el análisis estático y la sección 7 en los tres motores |
| H2 | — · **aplicado** | coco | #686: la `single` y la principal deshabilitadas, no en curso, con el aspecto de `GBtn` deshabilitado y contorno `border-control` (arriba). Decisión de coco dentro de #686: en C la elevación es del **grupo** y se queda en `shadow-2` (la cola sigue habilitada y es una sola forma); `shadow-1` solo en `single` |
| H3 | Media (no bloquea) | bruno | **Falta `tests/personalidad-fab.spec.mjs`** y `tests/fab.spec.mjs` no cubre parte de `fab.md` §«Verificación · Playwright»: la voz, la isla y el muelle de `GPageHeader` en el borde, un `GDialog` modal que cierra la lista y deja el FAB inerte, la zona de marca, oscuro, la política con alturas medidas (#670), el rendimiento («abrir con 15 no supera 1 cuadro largo») y el movimiento (salida desde el FAB, reducido sin recorte en C). Esta auditoría lo mide sobre el componente real en los tres motores **salvo el rendimiento** (sin medir), pero no es una prueba de regresión del repo |
| H4 | Baja · límite | coco | **WebKit con DPR 1 redondea el `translate` de «se aparta» al píxel:** con un FAB fraccionario (58,5px con `space` 4,5) quedan **23,5px** visibles en vez de 24 (Chromium y Firefox, 24,0; WebKit con DPR 2, 24,0). Con el tema por defecto (52px) no pasa. No se corrige (redondear el desplazamiento hacia abajo añadiría una unidad literal por medio píxel en pantallas de 1×); para el README si mora-docs lo ve útil |
| H5 | Nota | lima | `fab.md` «Estados» y §47 dicen `--g-shadow-1` para «la `single` y la principal de C» deshabilitadas; en C la sombra es del grupo (`g-fab__main-group`) y se queda en `shadow-2` (H2). Precisarlo en el contrato. Y pasar #686 y #687 a `DECISIONS.md` |

## Lo que corregí

- `packages/vue/src/components/GFab/GFab.css`: la deshabilitada de #686 (alias de color de `GBtn`, contorno `border-control`, `shadow-1` en `single`, sin escala al apretar, `GrayText` en forzados) y H1 (deshabilitada e icono en `GrayText` en forzados).
- `design/lab/fab/estilo-verificar.mjs`: la comprobación de la deshabilitada al día con #686 (tokens, contraste, pasar y apretar, oscuro y zona) y `neutral-soft` en la lista de tokens de color.
- `design/lab/fab/estilo.md`: personalidad y fila de la deshabilitada (#686), panel que cubre (#687), forzados (H1), preguntas 12 y 13 cerradas y medidas nuevas.

## Sin verificar

- **Rendimiento** (H3): abrir con 15 acciones y el desplazamiento sin repintar Vue.
- `pointer: coarse` en Firefox (no se emula; se fuerza con `is-coarse`); `forced-colors` real (emulado en los tres motores; en WebKit el emulador no fuerza colores del autor).
- Lector de pantalla real (orden invertido de la pila, el par de confirmación dentro de un `menu`, el filtro de C), teclado en pantalla real, táctil real (velo, primer toque del FAB apartado) y Safari real.
- Los specs de `GMenu` que ya fallaban antes de `GFab` (Ctrl/⌘+clic y clic central, Ctrl+C en WebKit) y el intermitente del velo con carga: no los he vuelto a correr.

## Para cerrar

- **bruno:** H3 (spec de personalidad y lo que falta de §«Verificación»), sin bloquear `candidate`.
- **lima:** H5 (sombra del grupo en C en `fab.md`; #686 y #687 en `DECISIONS.md`).
- **mora-docs:** `GFab/README.md` desde `GFab.meta.json`, con los límites de `fab.md` y H4 si lo ve útil.
