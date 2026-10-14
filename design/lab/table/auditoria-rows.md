# Auditoría de coco · GTable, filas por página y activación de fila (paso 5)

**Componente:** `GTable` (bruno, `ef6c0a4`) con el lote de integración #592 a #602 (peso #650): filas por página con fila ancla y pie acoplado (`pageSizes`, `g-pagination--dock`, `is-stuck`), la puerta (`rowHref` → `<a class="g-table__door">` con `arrow-right`; `activatable` → `<button class="g-table__door">`), el despliegue (slot `detail`, `tr.g-table__detail`) y el estado de fila (`rowStatus`: `data-status`, lomo, `GBadge` y sello en la causa). CSS de coco `GTable.css` y la parte nueva de `GPagination.css` (selector `g-pagination__size*` y pie acoplado). Contrato `design/contracts/table.md` («Filas por página», «Activación de fila», «Estado de fila», «Notas para coco»). El `status` de `GTable.meta.json` no cambia: ya es `candidate`.

**Método:**

- Las dos specs de bruno: `tests/table-rows.spec.mjs` y `tests/table-page-size.spec.mjs` (desde `design/lab/theme-playground`, `GRANA_PW_PORT=4231`).
- Una verificación propia, `node design/lab/table/auditoria-rows-verificar.mjs`. Corre sobre el **componente real** (`dist/grana.umd.js` + `dist/grana.css`) en el banco de bruno `packages/vue/playground/table-rows.html` (`?c=A`, `?c=B`, `?c=size`, `&dir=rtl`). Para lo que el banco no cubre, usa una página propia servida en memoria: `activatable`, `appearance="surface"` con estado y ficha, y tarjetas a 360px con estado. Mide el contraste sobre el compuesto real (capas translúcidas incluidas), con el puntero y el teclado reales (`page.mouse`, `page.keyboard`; en WebKit, `Alt+Tab`, como Safari sin «Acceso total por teclado»).
- `npm run build` previo, con salida 0.

## Temas de prueba

- **Por defecto**, claro y oscuro.
- Los **diez generados** de `design/lab/tema-oscuro/dark-color-presence/generated/`, claro y oscuro: `amazon`, `apple`, `caracol-purpura`, `github`, `grana`, `linear`, `lustre`, `medium`, `notion`, `spotify`.
- Cobertura: **22 configuraciones en Chromium**; en Firefox y WebKit, 4: por defecto y **`caracol-purpura`** (el tema distinto al por defecto de referencia), claro y oscuro.
- Los comportamientos (RTL, movimiento reducido, pie acoplado, `activatable`, superficie, tarjetas) se miden con `caracol-purpura` claro.

Los temas generados no redefinen los colores de estado (`danger`/`warning`/`info`/`success` en `-text` y `-soft`): vienen de `defaults.css`. Por eso el lomo, la etiqueta y el sello dan los mismos valores en todos los temas. El CSS solo lee `--g-color-{familia}-text` y la etiqueta es `GBadge`, así que un tema que los redefina se aplica tal cual (comprobado de forma estática; ver la tabla).

## Resultado: aprobado, sin correcciones en el CSS de coco

No hay defecto bloqueante de estética ni de accesibilidad visual. Hay un defecto de comportamiento en WebKit, que corresponde a bruno y no bloquea (hallazgo 1), y tres notas para su dueño.

## Resultados prueba por prueba

### Specs de bruno

| Pasada | Resultado |
| --- | --- |
| Chromium (`--project=chromium`) | **28/28** |
| Tres motores | **79 pasan, 2 se omiten, 3 fallan** |
| `table-page-size.spec.mjs:110` «aquí estabas: la fila ancla lleva is-here…» en Firefox y WebKit | Falla con carga en paralelo. Repetida sola (`--workers=1 --repeat-each=3`): **6/6**. No es defecto |
| `table-rows.spec.mjs:125` «…al volver, foco en la puerta, rastro e is-here» en WebKit | **Falla siempre (3/3)**. Es un defecto real: hallazgo 1 |

### Verificación propia (`auditoria-rows-verificar.mjs`)

**717/717** comprobaciones en los tres motores (Chromium con las 22 configuraciones; Firefox y WebKit con 4). La consola queda sin errores.

| Área | Qué se mide | Resultado (mínimo en todas las configuraciones) |
| --- | --- | --- |
| Estático `GTable.css` y `GPagination.css` | Sin hex ni `rgb()`/`oklch()`, sin colores con nombre, sin `var()` con respaldo, solo `--g-*` y `--_*`, medidas literales solo `24px`/`44px` y el `1px` del patrón de texto oculto, `GTable.vue` sin `<style>` | Cumple |
| A · título de la puerta | Texto frente al fondo de la fila | **16,43** (amazon oscuro) |
| A · subtítulo | `text-muted` frente a `surface` | **7,38** (spotify claro) |
| A · puerta en hover | Solo la celda principal pasa a `surface-sunken` (las demás no). La flecha entra con opacidad 1, el título se subraya. Flecha **16,08**, subtítulo **6,87** | Cumple |
| A · anillo de foco | Teclado → la puerta. El anillo se dibuja en la celda (`outline` sólido de `--g-focus-width`) y la puerta no lleva el suyo. Contraste **4,52** (apple claro) ≥ 3 | Cumple |
| A · área | Celda principal entera ≥ 24 × 24. La esquina inferior de la celda es la puerta (prueba de impacto) | Cumple |
| A · guarda de #505 | Ctrl, ⌘, Mayús y Alt + clic no emiten `navigate`. El doble clic emite una sola vez (el primer clic; el segundo, con `detail > 1`, no) | Cumple en los tres motores |
| «Aquí estabas» (`is-here`) | Con movimiento reducido queda quieto en `accent-soft` (`animation: none`). Subtítulo encima **6,49** (linear claro) | Cumple |
| Fila seleccionada | Título y subtítulo sobre `primary-soft`: subtítulo **7,28** (Firefox, defecto claro) | Cumple |
| `activatable` (página propia) | `has-door`; `<button type="button">` dentro de `g-table__title`, sin flecha, con `aria-describedby` hacia la etiqueta de estado. El clic emite `activate` una vez. El anillo va en la celda principal, **≥ 4,5** | Cumple en los tres motores |
| B · raíz | `has-detail`, sin `has-door`, con `has-row-status` | Cumple |
| B · chevron | Cerrado y abierto ≥ 3: **7,38** (spotify claro). Abierto gira 90° (−90° en RTL) | Cumple |
| B · semántica | Cerrado: `aria-expanded="false"`, sin `aria-controls`, sin ficha montada. Abierto: `aria-expanded="true"` y `aria-controls` hacia `g-table__detail-body` con `role="group"` y `aria-label` | Cumple |
| B · Esc | Pliega, devuelve el foco a la puerta, la ficha sigue montada mientras se pliega y **se desmonta al terminar** | Cumple |
| B · ficha | Texto **16,08** sobre `surface-sunken`. El anillo de un enlace de dentro **no se recorta** (la ficha lleva `overflow: hidden`, pero el relleno deja sitio al anillo) | Cumple |
| B · hover de fila | Fila entera en `surface-sunken`, `cursor: pointer`, subtítulo **6,87** | Cumple |
| Estado · lomo | `border-inline-start` del primer `td`: **4,88** (linear oscuro) ≥ 3. Ancho ≥ 3px (6px en el tema por defecto). Forma por valor: error `solid`, warning `dashed`, info `dotted` | Cumple |
| Estado · etiqueta (`GBadge` soft sm) | Texto **4,52** (defecto oscuro) ≥ 4,5; icono **4,15** ≥ 3. El fondo de la etiqueta frente a la fila da 1,14, pero es informativo: el texto y el icono llevan la información, no el contorno | Cumple |
| Estado · sello de la causa | Filo inferior `inset` de 2 × `--g-border-width`: **4,9** (linear oscuro) ≥ 3 | Cumple |
| Estado · superficie (página propia) | Las columnas y el contenido no se mueven entre filas con y sin estado (Δ ≤ 0,5px). Lomo ≥ 3px. La ficha cuelga de su fila: la separa de ella la misma junta que a las filas (`border-spacing` + borde = 9px en el tema por defecto) y queda más cerca de su fila que de la siguiente. Lleva el lomo de su fila | Cumple |
| Estado · tarjetas a 360px (página propia) | `g-table--mode-cards`, lomo ≥ 3px, sin desborde horizontal, las puertas alineadas | Cumple |
| Filas por página · selector | Cifra marcada: borde `border-control` frente a la pista `surface-sunken` **3,19** (defecto claro) ≥ 3. Cifras marcada y sin marcar **6,87** ≥ 4,5 | Cumple |
| Pie acoplado | Con 100 filas a media tabla lleva `g-pagination--dock is-stuck` y `position: sticky` pegado al borde inferior. Fondo = `--g-color-surface`, filo superior = `--g-color-border`, sombra presente. `scroll-margin-block-end` de lo enfocable = `--_dock-size`. Con la última fila a media vista se suelta (`is-stuck` fuera, filo transparente) | Cumple |
| Movimiento reducido | Chevron y ficha sin transición. La ficha se desmonta igual al plegar. Flecha sin transición ni desplazamiento | Cumple |
| RTL | Lomo a la derecha (`border-inline-start`). Flecha espejada (`flip-rtl`), a la izquierda del título y sin desplazamiento negativo en reposo. Chevron abierto a −90° | Cumple en los tres motores |
| `forced-colors` (Chromium emulado) | Lomo con color de sistema y su forma (`dashed` en warning); filas sin estado en `Canvas`. La causa lleva contorno. Anillo de la puerta sólido. `is-here` con contorno `dashed`. Ficha con contorno sólido. Pie acoplado con filo `CanvasText` y cifra marcada en `Highlight` | Cumple |

## Hallazgos

| # | Hallazgo | Severidad | Dueño | Estado |
| --- | --- | --- | --- | --- |
| 1 | **WebKit: al volver de la puerta con el ratón no aparece «aquí estabas».** Es lo que hace fallar siempre `table-rows.spec.mjs:125`. Causa, diagnosticada con un script de depuración: en WebKit, el clic de ratón en un enlace no lo enfoca, así que el foco queda en `<table tabindex="-1">`. Al cerrar el diálogo de la aplicación, WebKit devuelve primero el foco a esa tabla (`relatedTarget` = botón del diálogo). Después la aplicación enfoca la puerta con `relatedTarget` = la tabla. Como la tabla está dentro de la raíz, la guarda de `onFocusin` (`e.relatedTarget && root.value.contains(e.relatedTarget)`) da la vuelta como «el foco venía de dentro» y `markHere` no se llama. En Chromium y Firefox, la puerta ya tenía el foco y funciona. Con teclado (`Alt+Tab` + Intro) WebKit sí marca. El rastro `is-last-opened` (flecha visible) sí aparece; lo que falta es el destello. Arreglo propuesto: marcar «el foco salió de la tabla» en un `focusout` cuyo `relatedTarget` cae fuera de la raíz y consumirlo en el siguiente `focusin` de una puerta, o tratar `relatedTarget === <table>` como procedente de fuera | Media (Safari; señal de orientación, no de acceso) | **bruno** (`GTable.vue`, `onFocusin`) | Anotado |
| 2 | **`activatable` no está en el banco ni en las specs.** La puerta como `<button>` (sin slot `detail`), su evento `activate`, el anillo en la celda y la ausencia de flecha solo los cubre esta auditoría, con una página propia. Tampoco hay prueba de Alt+clic ni de doble clic en la puerta A (las specs prueban Meta, Mayús y botón central) | Baja (cobertura) | **bruno** (`table-rows.html`, `table-rows.spec.mjs`) | Anotado |
| 3 | **El contrato dice `border-strong` para la cifra marcada; el CSS usa `border-control`.** `table.md` «Notas para coco», viñeta «Selector»: «borde `border-strong`». `GPagination.css` usa `--g-color-border-control` porque `border-strong` daba 1,39:1 frente a la pista en amazon claro, y la regla de contraste de lo marcado (§7.1) exige ≥ 3. Medido ahora: **3,19** como mínimo en 22 configuraciones. Gana el CSS (lo exige §7.1); falta alinear el texto del contrato | Baja (texto) | **lima** (`design/contracts/table.md`) | Anotado |
| 4 | **Márgenes justos que vienen del tema, no del componente.** Texto de la etiqueta de estado **4,52** (defecto oscuro, `on-*-soft` sobre `*-soft` de `GBadge`); anillo de foco **4,52** (apple claro); borde de la cifra marcada **3,19**. Todos cumplen y el componente solo lee los tokens del rol | Informativo | `@grana/cli`, si algún tema bajara | Cumple |
| 5 | **Arnés de esta auditoría** (no son defectos del producto): (a) tras cambiar de tema hay que esperar a que terminen las transiciones de color (`duration-fast`) antes de medir, porque sin espera una cifra a medio fundir daba 3,36; (b) `scrollIntoView` sobre un elemento `sticky` mide su posición pegada, así que para soltar el pie se baja hasta dejar la última fila a media vista; (c) WebKit lleva el Tab a enlaces y botones con `Alt+Tab` | — | coco | Hecho |

## Personalidad

Se conserva lo que el contrato pide:

- La puerta es la **celda entera**, con la flecha que entra deslizándose al pasar, al enfocar y en el rastro.
- La ficha **cuelga de su fila** con el lomo continuo y se despliega con `--g-ease-spring` desde `@starting-style`, sin medir alturas.
- El lomo distingue el estado **por forma**, no solo por color (sólido, discontinuo, punteado, doble), y se mantiene en `forced-colors`.
- «Aquí estabas» se apaga solo y queda quieto con movimiento reducido.
- El pie acompaña la lectura y se separa con un filo y una sombra solo mientras está pegado.

Nada que corregir.

## No verificado

- Lector de pantalla real (VoiceOver, NVDA): anuncio de `aria-expanded`, el grupo de la ficha, `aria-describedby` de la puerta hacia la etiqueta de estado y el recuento al cambiar las filas por página.
- Safari real (el hallazgo 1 se reprodujo en el WebKit de Playwright), `forced-colors` real (solo emulado en Chromium; Firefox y WebKit no lo emulan en esta pasada) y táctil real.
- `pointer: coarse` (44px) de las cifras: la regla está en `GPagination.css`, pero esta pasada no la emula.
- Temas que redefinan los colores de estado: ninguno de los generados lo hace.

## Ejecutar

```bash
npm run build
node design/lab/table/auditoria-rows-verificar.mjs                 # tres motores (Chromium con 22 temas)
node design/lab/table/auditoria-rows-verificar.mjs --engines=chromium --themes=few --verbose
cd design/lab/theme-playground && GRANA_PW_PORT=4231 npx playwright test tests/table-rows.spec.mjs tests/table-page-size.spec.mjs
```

La verificación propia levanta su servidor en un puerto efímero, así que no choca con los de otros agentes.
