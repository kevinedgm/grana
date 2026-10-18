# Auditoría de coco · niveles anidados de GDialog (paso 5)

**Fecha:** 2026-10-17 · **Auditor:** coco (Opus, componente complejo)
**Alcance:** modo pasos B (`GDialogStep`, `useDialogSteps`, `steps.js`), el hilo, «Volver», el alto entre pasos, la hoja que no encoge, la llegada (`data-g-landed`), C con `GFormFold` dentro del diálogo, y los defectos #565 a #568 de `GDialog` sobre el componente real; #569 y #570 por sus specs. Contrato: `design/contracts/dialog.md` §«Niveles anidados» y §«Correcciones de defectos medidos», `form.md` §15, #580 a #591 y #651.
**Componente:** el real, de `dist/` reconstruido (`GDialog`/`GDialogStep` de `grana.umd.js`, `GFormFold` de `form-fold.umd.js`, `grana.css`, `fonts.css`).
**Banco:** `design/lab/dialog/auditoria-pasos-banco.html`. Es el flujo de kiwi (`r02/`) y el del banco de bruno (`packages/vue/playground/dialog-levels.html`), con Vue local, temas por parámetro y un `alertdialog` apilado encima. No inyecta marcado: lo pintan los componentes.
**Tema distinto al de defecto:** `auditoria-pasos-tema.json` → `auditoria-pasos-tema.css` (`node packages/cli/bin/grana.mjs theme …`): marca `#6B1E3A` vino, acento `#C2410C` naranja quemado (el acento que más aprieta a `on-accent-soft`), neutros teñidos, radio 14, `space` 5, texto 18, Georgia, borde 2px y foco 3px; claro y oscuro. Además los once temas de `design/lab/tema-oscuro/dark-color-presence/generated/`, claro y oscuro.
**Verificación propia:** `GRANA_PW_PORT=4209 node design/lab/dialog/auditoria-pasos-verificar.mjs`.

## Resultado (2026-10-17): **no pasaba a `candidate`** por H1 (de bruno). Cerrado el 2026-10-18: ver el addendum al final

| Motor | Comprobaciones |
| --- | --- |
| Estático (CSS fuente y publicado, tabla de clases de `dialog.md`) | 44/44 |
| Chromium | 744/748 (los 4 fallos son H1) |
| Firefox | 743/747 (los 4 fallos son H1) |
| WebKit | **sin verificar**: el binario de WebKit de Playwright 1.63 (`webkit-2359`) no está instalado en esta máquina y la auditoría no lo descargó. Hace falta `npx playwright install webkit` en `design/lab/theme-playground` y repetir la verificación |

Con H1 corregido sobre una copia del UMD (la clave del pie por paso, ver abajo), las 130 comprobaciones de marcado y comportamiento pasan en Chromium y Firefox: H1 es lo único que bloquea en esos dos motores.

Además, en el puerto 4209: `dialog-focus.spec.mjs`, `dialog-stack.spec.mjs` (#565 a #568), `personalidad-dialog.spec.mjs` (D1, D2, #307) y `card-group.spec.mjs` (#569 y #570), en Chromium y Firefox: **66 pasan, 2 se omiten por diseño**. `npx vitest run` en `packages/vue`: 3591/3591 (los avisos de desarrollo de pasos se comprueban ahí, en `GDialog.steps.test.js`; en el `dist/` de una página estática no salen por diseño, #653). `npm run build` y `bash .github/scripts/gates.sh`: 68/68.

## Qué se midió

| Prueba | Resultado |
| --- | --- |
| **Tokens y CSS** (`GDialog.css`, `GFormFold.css`) | Solo `var(--g-*)` y alias `--_*`, todos los `--g-*` existen en `defaults.css`, sin respaldos, sin `@layer` ni `!important`, sin colores literales (los del sistema, solo en `forced-colors`; `transparent` en `is-stacked::backdrop` es la palabra clave de #567, no un valor de tema), sin `cubic-bezier`, `--g-ease-spring` ni `--g-ease-bounce` (#299). Medidas literales: 24/44px, `0px`, el patrón de texto oculto (±1px) y los umbrales de `@media` |
| **Clases y variables frente a la tabla de `dialog.md` (#651)** | Las 22 clases, variables y atributos de los niveles (`g-dialog--steps`, `is-forward`/`is-back`, `has-sheet-hold`, `g-dialog__back`, el hilo y sus partes, `is-parent`/`is-current`, `g-dialog__step`, `is-entering`, `is-resizing`, `--_step-from-h`/`--_step-to-h`, `g-dialog__sr`, `--_fold-gap`, `data-g-landed`, `is-stacked`) están en la tabla y tienen regla. Ninguna clase del CSS falta en la tabla. `GFormFold.css` no consume `--_d`. El paso actual va en el par `accent-soft`/`on-accent-soft` (#651). Protocolo del alto: `g-dialog-resize` de `--_step-from-h` a `--_step-to-h` en slow + ease-out; sin `interpolate-size`. Los nombres de animación que el `.vue` reconoce (`g-dialog-step…`, `g-dialog-resize`, `g-landed…`) coinciden |
| **Publicado** | Hilo y pliegue dentro de `@layer grana.components`; `grana.css` coincide con los fuentes; `GDialogStep` en el principal y `GFormFold` solo en `form-fold.js` (#590); fuente sin incrustar |
| **Marcado real** (prof. 3 y 5; claro LTR y oscuro RTL con el tema) | `aria-labelledby`/`aria-describedby` del `<dialog>` a los del paso actual; encabezado «Volver» → títulos → cierre; «Volver» con nombre y `chevron-left` `flip-rtl`; `nav` «Recorrido» entre encabezado y cuerpo; un `li` por paso; los anteriores son `button type=button`, el actual un `span` con `aria-current="step"` no enfocable; número `aria-hidden`; `summary` como texto oculto; paneles `role=group`, los de debajo `hidden` + `inert`; en reposo sin `is-entering`, `is-forward`, `is-resizing` ni variables de alto |
| **Contraste** (26 configuraciones, dos motores) | Texto ≥ 4,5:1 y formas ≥ 3:1 en todas. Mínimos: paso actual (`on-accent-soft` sobre `accent-soft`) **4,50** (tema de la auditoría); número del actual 4,51 (apple); número del padre 4,53 (stripe oscuro); forma del número actual frente a su píldora 3,96 (linear); tramo del actual 4,19 y anillo de foco frente a la carcasa 4,19 (apple); raíl del pliegue y anillo de llegada 4,52 (apple); icono de «Volver» y del cierre 6,87; descripción 6,87; hover de «Volver» y de un paso del hilo ≥ 15 |
| **Texto ≥ 12px** | Número del hilo, títulos del hilo, descripción del paso y del pliegue: ≥ 12px en las 26 configuraciones |
| **Áreas** | «Volver», cierre y pasos del hilo ≥ 24×24px con el tema por defecto y con `space` 5; con `pointer: coarse` (Chromium, `isMobile` + `hasTouch`), ≥ 44×44px. En Firefox no se emula `pointer: coarse` |
| **Foco visible** | «Volver», paso del hilo, cierre y cuerpo desplazable (`long=1`) alcanzables con Mayús+Tab; anillo `solid` del grosor de `--g-focus-width` (2px y 3px), `:focus-visible`, ≥ 3:1 frente a lo que lo rodea, claro y oscuro |
| **Foco al avanzar** | Primer control del paso nuevo (`f-ingreso-oc`, el `GSelect` de partida, `f-producto-nombre`, `f-categoria-nombre`); nunca «Volver», el cierre ni el hilo |
| **Foco al volver** | «Volver» y Esc → al `from` del paso que se cierra (`f-detalle-ingreso`, `crear-categoria`, `crear-producto`); con `focus` → al campo que recibe el valor; salto del hilo con teclado (`backTo` al paso 1) → al `from` del paso de encima, un solo `step` con `reason: 'trail'`; `backTo(ingreso)` → `f-ingreso-p3`. **Nunca en `body`** |
| **Esc** | En un paso > 1 baja uno, sin `dismiss`; **mantenida** (`repeat`) baja uno solo (#565); con un paso, `dismiss` `escape`. Con pliegues anidados abiertos, recoge **solo** el de arriba, sin `dismiss`, foco a su `from` |
| **Fondo** | Con tres pasos, nada; con un pliegue abierto (un paso), nada; sin pliegues, `dismiss` `backdrop` con `depth: 1`. Con un modal debajo, el de arriba no cierra (#568) |
| **Cierre (X)** | Desde el paso 3, `dismiss` `close` con `depth: 3`; el foco vuelve al disparador (`from`) |
| **Apilado (#567)** | El `alertdialog` de encima lleva `is-stacked` y su `::backdrop` tiene alfa 0; el de abajo conserva el suyo; Esc cierra solo el de arriba, el de abajo sigue con su fondo y el foco vuelve a «Descartar borrador…» |
| **Resultado** | Error al confirmar: no baja y el foco va al campo con error. Con resultado: la llegada marca la **caja visible** (`data-g-tooltip-box`) del `GSelect`, o el propio `GBtn` cuando el destino no tiene caja; anima `g-landed` en `slow × 3` con `ease-out` y se retira sola; el anuncio va al canal **cortés** dentro del `<dialog>` modal |
| **Movimiento** (tema de la auditoría) | El paso entra con `g-dialog-step-from-end` (al ir más hondo) o `-from-start` (al volver), en `--g-duration-slow` + `--g-ease-out`, con el signo del eje en línea (espejado en RTL) y ≤ `space × 6`; el alto de la carcasa pasa por valores intermedios sin vaivén con `g-dialog-resize` (slow + ease-out) y `is-resizing` y las variables se retiran al terminar; sin barra horizontal en el cuerpo durante el cambio; **borde superior Δ 0,00px** al ir y al volver; el tramo del hilo no anima en reposo; el chevron de «Volver» se espeja en RTL |
| **Movimiento reducido** | Solo `g-dialog-step-fade` en `fast`; sin desplazamiento del paso; sin animación del alto (`is-resizing` no se queda); la llegada solo se funde (`g-landed-fade`); D2 sigue: Δ 0,00px |
| **Pliegue en el diálogo (D2)** | Al abrir: borde superior Δ 0,00px y lo de arriba Δ 0,00px dentro del cuerpo; el desplazamiento mínimo deja el pliegue entero a la vista (form.md §15) |
| **Desplazamiento restaurado** | Volver a un paso largo restaura su `scrollTop` (±1px) y el disparador queda donde estaba |
| **Hoja a 375px** (defecto y tema) | Sin desborde horizontal en la página, la carcasa, el encabezado, el hilo ni el pie en las cinco profundidades; la hoja **no baja** al ir más hondo ni al volver (`has-sheet-hold`) |
| **Reflujo a 320px y texto al 200 %** (1280px y 640px) | Sin desborde horizontal ni títulos recortados; la carcasa dentro del visor; el hilo parte línea o cede el nombre del padre con puntos suspensivos (el nombre sigue en el árbol) |
| **`forced-colors`** (Chromium y Firefox) | Paso actual, su número y su tramo en `Highlight`; número del padre en `CanvasText`; «Volver» en `ButtonText`; anillo de foco del hilo en `Highlight`; llegada y raíl del pliegue en `Highlight` |
| **Consola** | Sin errores ni avisos |

## Hallazgos

| # | Gravedad | Dueño | Qué |
| --- | --- | --- | --- |
| H1 | **Bloqueante** | bruno | **El pie de un paso conserva los atributos estáticos del pie del paso anterior.** Con plantillas compiladas (SFC o plantilla en el DOM), al pasar de un paso con `footer` a otro con `footer`, Vue reutiliza el bloque de `StepSlot` y solo parchea lo dinámico: el texto cambia, pero **`id`, `variant`, `color`, `type` y `form`** de los botones se quedan los del paso anterior. Medido en el banco: en «Partida 3» el pie es `ingreso-cancelar` / `ingreso-ok` con el texto «Guardar partida»; un `<GBtn type="submit" form="f-ingreso">` del ejemplo del contrato seguiría enviando el formulario del paso anterior. Las pruebas de vitest no lo ven porque montan con `h()`. **Arreglo:** dar al pie una clave por paso en los dos sitios de `GDialog.vue` (`<StepSlot v-if="stepsOn" :key="current" …>`), o que `StepSlot` envuelva su salida en un `Fragment` con la clave del paso. Comprobado sobre una copia del UMD con la clave puesta: 130/130 en Chromium y Firefox. Falta además una prueba con plantilla compilada (vitest con `compile` o el spec de abajo) |
| H2 | Media (no bloquea el CSS, sí el criterio de hecho de bruno) | bruno | **No existe el spec de Playwright de los niveles.** `packages/vue/playground/dialog-levels.html` dice «Lo verifica `design/lab/theme-playground/tests/dialog-levels.spec.mjs`», que nunca llegó al repo; `dialog.md` §«Verificación» lo pide en los tres motores. Habría cazado H1. Debe cubrir lo de §«Verificación» (Playwright) y, como mínimo, **que el pie de cada paso es el suyo** (ids y `form`) |
| H3 | Media | bruno | **Falta el spec de Playwright de `GFormFold`** (ya anotado en `design/lab/form-fold/auditoria.md`). Debe cubrir, en los tres motores: el recorrido C de kiwi dentro de un paso (tres pliegues anidados); **lo de arriba Δ 0px** al abrir y al cerrar, medido dentro del cuerpo (el desplazamiento mínimo «nearest» que pide §15 no cuenta), y el pliegue entero a la vista si cabe; el diálogo crece hacia abajo con el borde superior fijo (D2); 375px con tres pliegues sin desborde horizontal; RTL (raíl y sangría al inicio); reducido (sin deslizamiento; el alto en un cuadro, solo fundido); Esc recoge solo el de arriba y Esc mantenida uno solo; el fondo del diálogo no cierra con un pliegue abierto; confirmar con resultado (llegada en la caja y anuncio cortés en el modal) y con error (no se cierra, foco al primer error); y un pliegue abierto en la prueba obligatoria de distribución (`form-distribution.spec.mjs`, #184) |
| H4 | Baja | bruno | El banco `packages/vue/playground/dialog-levels.html`: las acciones de los pliegues llaman a `confirm` sin escuchar `@confirm`, así que «Guardar partida», «Crear y elegir» nunca cierran el pliegue (el alcance trae `close`; este banco usa `close(resultado)`). Además carga Vue de `unpkg.com` (red); los demás bancos usan `node_modules/vue` |
| H5 | Baja | lima / bruno | El alcance del slot `footer` fuera del modo pasos es `{ close }` en `GDialog.vue`, y `dialog.md` «Slots» dice `{ close, push, back, backTo, steps }`. Fuera de pasos no tienen uso: o el contrato lo precisa («con pasos») o el `.vue` los pasa |
| H6 | Corregido (coco) | coco | **Pulso infinito de `is-loading`** (`g-dialog-pulse`, #539: ninguna animación de carga pasa de 5 s). La barra de carga queda **quieta**; lo que dice «cargando» es `aria-busy` y el cursor. La verificación comprueba que `GDialog.css` no tiene ninguna animación `infinite`. **Para lima:** `dialog.md` «Límites conocidos» y la fila de `GDialog` en `load-region.md` siguen dando el pulso por pendiente |

## Lo que corregí

- `packages/vue/src/components/GDialog/GDialog.css`: sin el pulso infinito de `is-loading` (H6).
- `design/lab/dialog/estilo.md`: la personalidad de los niveles (el hilo, el paso que llega de su lado, el alto con el borde fijo, «Volver», la llegada, el raíl del pliegue) y la fila «Cargando» al día.

## Sin verificar

- **WebKit** (no instalado; ver arriba). Es lo primero que hay que correr al reauditar.
- `pointer: coarse` en Firefox (no se emula) y `forced-colors` en WebKit.
- Lector de pantalla real: cambio de nombre del `<dialog>` por paso, `role="group"` al recibir el foco, el hilo y el orden de la frase tras el foco; táctil y zoom reales; Safari real.

## Para cerrar

1. bruno corrige H1 (con su prueba) y entrega H2 y H3.
2. coco repite `GRANA_PW_PORT=4209 node design/lab/dialog/auditoria-pasos-verificar.mjs` en los **tres** motores (con WebKit instalado). Si pasa entero, `GDialogStep.meta.json` pasa a `"status": "candidate"`.

## Addendum · 2026-10-18 · reauditoría tras 8e3c300: **pasa a `candidate`**

bruno cerró H1 a H5 en 8e3c300. Reverificado sobre `main` con `dist/` reconstruido (`npm run build`), en el puerto 4209 y con el WebKit de Playwright (`webkit-2359`) ya instalado.

**Primera pasada en WebKit: 731/739.** Reproducidos los 8 fallos y clasificados uno a uno; **ninguno es del componente**:

| # | Fallo | Causa | Clase |
| --- | --- | --- | --- |
| 1-3 | Mayús+Tab no alcanza «Volver», el hilo ni el cierre (`mode=steps`, el tema oscuro y `long=1`) | WebKit en macOS, como Safari sin «acceso total por teclado», solo tabula a campos de texto. La verificación pulsaba Mayús+Tab | verificación |
| 4 | `forced-colors`: el foco no está en el hilo | La misma causa: Mayús+Tab y Tab desde el hilo saltaban los botones y acababan en el cuerpo | verificación |
| 5-6 | Confirmar con error deja el foco en el `<dialog>` (`theme=auditoria` y defecto) | El banco no enlazaba `:error` en los campos de los pasos: no había `[aria-invalid]` al que llevar el foco, y en Chromium y Firefox la comprobación pasaba solo porque el clic enfoca el botón (en WebKit no) | banco, y la comprobación era débil |
| 7-8 | Esc en el `alertdialog` devuelve el foco al `<dialog>`, no a «Descartar borrador…» | El `alertdialog` del banco no llevaba `from`; en WebKit un clic no enfoca el botón, así que el disparador implícito no existe (#307, el límite que `from` cierra, #583) | banco |

**Qué cambié:**
- `auditoria-pasos-verificar.mjs`: en WebKit, Opción+Tab y Opción+Mayús+Tab (el criterio del resto del repo: `tests/*.spec.mjs` con `TAB`, `tooltip/auditoria-verificar.mjs`); Chromium y Firefox siguen con Tab tal cual. La comprobación de error es ahora **más estricta en los tres motores**: el foco tiene que estar en el campo con error (el `GSelect` de Producto, con `aria-invalid="true"`), no basta con que siga dentro del diálogo.
- `auditoria-pasos-banco.html`: `:error` en los campos de los pasos (`partida`, `producto`, `categoria`), como el banco de bruno; `from="f-detalle-descartar"` en el `alertdialog` (#583).

**Resultado final:**

| Motor | Comprobaciones |
| --- | --- |
| Estático | 44/44 |
| Chromium | 748/748 |
| Firefox | 747/747 (sin `pointer: coarse`, no se emula) |
| WebKit | **748/748** (con `pointer: coarse` y `forced-colors` emulados) |

`tests/dialog-levels.spec.mjs` y `tests/form-fold.spec.mjs` en WebKit: 17/17. H1 queda cerrado (el pie de cada paso es el suyo en los tres motores: ids del paso actual en «Partida 3» y «Producto nuevo»). Sin defecto bloqueante: `GDialogStep.meta.json` pasa a `"status": "candidate"`.

**Sigue sin verificar:** lector de pantalla real, táctil y zoom reales, Safari real (`forced-colors` de WebKit es emulado). **Para mora-docs:** `GDialog/README.md` puede dar `GDialogStep` como `candidate` y enlazar esta auditoría. **Para lima** sigue en pie la nota de H6 (`dialog.md` «Límites conocidos» y `load-region.md` dan el pulso por pendiente).
