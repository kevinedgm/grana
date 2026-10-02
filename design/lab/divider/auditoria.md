# Auditoría de coco · GDivider (paso 5)

**Componente:** `packages/vue/src/components/GDivider/` (`GDivider.vue` de bruno, commit 5edb797; `GDivider.css` de coco, commit 6175d52; contrato `design/contracts/divider.md`, #190 a #195), el real con `dist/` reconstruido (`npm run build`) y Vue global, en el **playground** (`/playground/#sec-divider`, servido en `http://localhost:4173`).
**Método:** `node design/lab/divider/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground/`) en **Chromium, Firefox y WebKit**: **1579/1579** comprobaciones. Contraste **medido** sobre el compuesto real (color calculado de la línea o del texto sobre el fondo efectivo de la anfitriona, capas translúcidas incluidas) y, para las escalas, **por píxeles** sobre la captura del visor en píxeles de dispositivo. Temas: **defecto** (claro y oscuro), **«Tema de prueba»** del playground (claro y oscuro), un tema con **`space` 5, borde 2px y serif**, y los **diez generados** de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro (entre ellos **Spotify**, marca pálida `#1ED760`, y **lustre**): 25 configuraciones por motor. Además: RTL de página y local, 320px, `prefers-contrast: more` (tres motores), `forced-colors` emulado (Chromium), escalas 1.25/1.5/2, zoom del navegador 125/150/200 % y zoom CSS 150/200 %, un diálogo real con divisores decorativos y el árbol de accesibilidad.

## Resultado: aprobado sin defectos. Sin cambios en `GDivider.css`; `status: "candidate"`

### Contraste (mínimo de cada medida; línea o texto sobre su fondo efectivo)

| Medida | Defecto claro / oscuro | Spotify claro / oscuro | Lustre claro / oscuro | Tema de prueba claro / oscuro | `space` 5 | Mínimo en las 25 |
| --- | --- | --- | --- | --- | --- | --- |
| `strong` / `surface` | **3.45** / 4.32 | 3.43 / 4.35 | 3.44 / 4.33 | 5.35 / 4.32 | 4.62 | **3.43** (≥ 3:1) |
| `strong` / `surface-sunken` | **3.19** / 4.82 | 3.19 / 4.86 | 3.19 / 4.83 | 4.95 / 4.82 | 3.93 | **3.19** (≥ 3:1) |
| Líneas `::before`/`::after` del texto `strong` (las dos superficies) | ídem `strong` | ídem | ídem | ídem | ídem | **3.19** |
| Texto / `surface` | **7.46** / 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.47 / 8.60 | 6.99 | **6.99** (≥ 4.5:1) |
| Texto / `surface-sunken` | **6.90** / 9.59 | 6.87 / 9.62 | 6.87 / 9.61 | 6.91 / 9.60 | 5.94 | **5.94** (≥ 4.5:1) |
| Texto / `bg` de la página | 7.46 / 8.59 | 7.38 / 8.62 | 7.41 / 8.61 | 7.47 / 8.60 | 6.99 | 6.99 |
| `subtle` / `surface` · `surface-sunken` (informativo) | 1.20 · 1.20 / 1.34 · 1.29 | 1.17 · 1.17 / 1.32 · 1.27 | 1.17 · 1.17 / 1.32 · 1.27 | 1.17 · 1.17 / 1.32 · 1.27 | 1.20 · 1.19 | 1.17 · 1.17 |

`subtle` no llega a 3:1 **por diseño** (#190): refuerza una separación que ya dan el espacio o un título y no es la única señal; con `prefers-contrast: more` sube a `border-control` (3.45 / 3.19 en claro, ≥ 3:1 también en oscuro). Los diez temas generados dan los mismos valores que el defecto (±0.04): `border-control` y `text-muted` se derivan del neutro, no de la marca, así que una marca pálida no los toca.

### Pruebas por comportamiento

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Con `space` 5 y borde 2px: `--g-divider-inset` 10px, `<hr>` de 2px, verticales de 2px de ancho y 15/35 · 25/45 · 35/55px con `GBtn` reales `sm`/`md`/`lg` (35/45/55px); el «Tema de prueba» cambia `border-control` (`strong` 5.35:1). Nada queda fijo en el componente |
| Vertical con `GBtn` reales (`sm`/`md`/`lg`, fila flex con `align-items: center`) | Con `inset="both"` **12 / 20 / 28px**; sin inset **28 / 36 / 44px** (= alto del botón), ancho = `--g-border-width`; `role="separator"` `aria-orientation="vertical"`. Igual en RTL de página, en oscuro, en la fila RTL local y a 320px, en los tres motores |
| Inset | `none` ocupa la caja de contenido exacta (0 / 0); `both` 8 / 8; `start` 8 / 0, y 0 / 8 en RTL (página y `dir="rtl"` local); lista anfitriona que redefine el token: la línea empieza donde el texto (±1px) en `default` **y** `compact` (y termina donde el texto en RTL) |
| Texto | Centrado (±1px) en LTR y RTL; el texto largo a 200px envuelve (≥ 2 líneas) sin recorte, cada línea ≥ `space × 4` (16px); 14px; sin fondo |
| Reseteo del `<hr>` | Márgenes 0, `overflow: visible`, borde `solid` solo arriba, alto = grosor |
| 320px | LTR, RTL, RTL oscuro y Spotify: ningún divider fuera de la sección ni con desborde propio; documento 320/320 en los tres motores; los verticales conservan su alto |
| RTL | Sin prop: inset `start` al final físico derecho, texto centrado, verticales con el mismo alto; nada fuera de su contenedor |
| Diálogo (decorativo) | Los dos `GDivider decorative` del `GDialog` real: `aria-hidden="true"` sin `role`, **mismo color calculado** que la línea del pie del diálogo, dentro de la caja del cuerpo (no sangran); ningún `separator` dentro del diálogo |
| Árbol | 17 `separator` en la sección (1 + 6 verticales + 4 de énfasis + 3 de inset + 1 de la lista + 2 RTL), **ninguno con nombre**; ningún divider con texto lleva rol; ninguno es enfocable (`tabIndex` < 0 y sin `tabindex`) |
| `prefers-contrast: more` (emulado, tres motores, claro y oscuro) | `<hr>`, vertical, `::before` y `::after` pasan a `--g-color-border-control`; el texto a `--g-color-text` (17.4 / 16.1:1 sobre `surface` / `surface-sunken` en claro) |
| `forced-colors` (emulado, Chromium, claro y oscuro) | `<hr>`, `strong`, `::before`, `::after` y vertical con borde `solid` ≥ 1px en `CanvasText`; **por píxeles** 21:1 en `<hr>` y vertical. El texto lo pone el sistema. Legible en captura |
| Escalas y zoom (por píxeles, tres motores) | La línea **se pinta siempre** y en **una sola franja** (no se duplica ni desaparece) a DPR 1, 1.25, 1.5 y 2, zoom del navegador 125/150/200 % y zoom CSS 150/200 % (este último en Chromium y Firefox). A escala entera (`strong` a 1×, 2×, zoom 200 %) conserva **3.45:1 en píxeles**. Ver hallazgo 1 para 1.25× |
| Consola | Sin errores, avisos ni peticiones fallidas en los tres motores (todas las configuraciones) |
| `.vue` y CSS | `GDivider.vue` sin `<style>`, sin colores, medidas ni `style` en línea (solo números de decisión en comentarios); `GDivider.css` solo con `var(--g-*)`/`--_*`, sin literales de medida ni valores de respaldo |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | Informativo | lima | **Escala fraccionaria 1.25× (zoom 125 % o pantallas a 125 %):** cuando la línea cae en una posición de píxel de dispositivo no entera, el motor la reparte con antialias entre dos filas y el **pico** de `strong` en píxeles baja de 3.45 a **2.41:1** (Chromium, Firefox) o **1.74:1** (WebKit); a 1.5× y a escalas enteras se mantiene en 3.45. La línea sigue visible y en una sola franja. No es del componente: le pasa igual a cualquier borde de 1px de Grana (`border-control` de los campos incluido) y WCAG mide el color especificado, no el antialias. No se puede corregir desde `GDivider.css` sin literales (la posición la decide el contenido de encima). Si se quisiera margen, sería una decisión global (`--g-border-width` o un `border-control` más oscuro), no de este componente |
| 2 | Informativo | bruno | La sección del playground no tiene un vertical **en grid** ni un vertical `strong` (sí los tiene el banco de coco y la prueba de bruno en los tres motores). No bloquea; si se amplía el playground, añadir una fila grid y un `strong` vertical |
| 3 | Informativo | bruno | `GDivider.meta.json` (aquí solo se cambió `status`): retirar de `pending` «Auditoría de coco (paso 5)…» y, tras el README de mora-docs, «README (mora-docs)…». Siguen vigentes los de lector de pantalla real, #194 y la fila que envuelve |
| 4 | Informativo | bruno | Ajeno a `GDivider`: en `design/lab/theme-playground` (`npm test`, 198 pruebas), «disabled: el botón y el campo… no responden al hover» falló en **WebKit** en una ejecución completa (y 3 de 3 con `--repeat-each=3` en paralelo) y pasa sola y en la siguiente ejecución completa (191 pasan, 7 omitidas). Parece una carrera entre `hover` y la lectura del color; conviene esperar con `expect.poll` o desactivar transiciones en esa prueba |
| 5 | Informativo | — (método) | En **WebKit** con `zoom` CSS en la raíz, `getBoundingClientRect` y el desplazamiento no coinciden con la captura (el elemento queda «fuera» del visor, y −6300px): artefacto de la medida, no del componente. En WebKit vale el zoom del navegador (DPR + visor más estrecho), que pasa |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, TalkBack): si anuncian «separador» en el `<hr>` y en el vertical, si VoiceOver los omite, cómo se lee el texto entre líneas.
- **`forced-colors` real de Windows** y en Firefox/WebKit (solo emulación de Chromium); **`prefers-contrast: more`** con un tema de alto contraste real (solo la emulación sobre el `.vue` real).
- **Fila que envuelve** (`flex-wrap`) con un vertical al borde de una línea (límite conocido, sin aviso).
- **Inset de anfitriona > mitad de la fila** (#194): no se fuerza aquí; es un límite documentado, no un defecto.
- Fuentes de los temas generados (Inter, DM Sans) no cargadas: el contraste no depende de la fuente; el ancho del texto sí varía ligeramente.
