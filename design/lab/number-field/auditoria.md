# Auditoría de coco · GNumberField (paso 5)

**Componente:** `packages/vue/src/components/GNumberField/` (`GNumberField.vue`, `GNumberField.meta.json` y `utils/numberInput.js` de bruno, commit `4c2df4c`; `GNumberField.css` de coco, commit `b212eb1`; `GInput.vue` con los slots internos `field`/`end` y el `id` de la etiqueta, #309; contrato `design/contracts/number-field.md`, #309 a #314). El real, con `dist/` reconstruido (`npm run build`), en tres páginas:

- `design/lab/number-field/auditoria-banco.html`: los mismos casos que el banco de estilo (`data-case` en la raíz, el id del caso en el `<input>`), montados con `GNumberField`, `GInput`, `GSelect`, `GForm`, `GFormLayout`, `GFormRow`, `GErrorSummary`, `GSwitch` y `GBtn` de `dist/grana.umd.js` y `dist/grana.css` (con `dist/fonts.css`: la fuente servida, no una local). El marcado lo pone el `.vue`, el idioma sale del `lang` del ancestro (sin prop `locale`), el mínimo lo publica el `.vue` a la fila, `is-rejected` lo pone `GForm` al enviar y el foco llega desde `GErrorSummary`. Secciones nuevas respecto del banco: mínimo publicado en una `GFormRow` real (6), bloquear/desbloquear (7) y envío con `GForm` + `GErrorSummary` (8).
- El **playground**: `#sec-number` y la fila de signos vitales de «Alta de paciente» (`#fm-vitals`), claro y oscuro.
- `design/lab/number-field/auditoria-ginput.html`: 29 `GInput` **sin** slots internos (cinco tamaños × dos densidades, `soft`, `pill`, prefijo, `output`, contraseña, contador, cargando, error, advertencia, válido, solo lectura, deshabilitado, obligatorio, `prepend`, `action`, sin etiqueta y una `GFormRow` con `GForm`), cargada con el `dist/` actual y con el `dist/` anterior a `GNumberField` (construido desde `c466132`).

**Tema distinto al por defecto:** `auditoria-tema.css`, generado por `@grana/cli` desde `auditoria-tema.json` (`brand: "#5B1A3A"`, `radius: 16`, `shape: "pill"`, **`space: 5`**, **`fontSize: 17`**): cambia a la vez la unidad de espacio (−/+ de 45px en `md`, P1 a 10px, P3 a 2,5px), los radios (esquina de + = 16px) y el texto. Además: defecto claro y oscuro, el de la auditoría en oscuro, «Tema de prueba» (Georgia, borde 2px, `space` 5) y los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro: **27 configuraciones de contraste por motor**.

**Método:** `node design/lab/number-field/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground/`, `GRANA_PW_PORT=4209`) en **Chromium, Firefox y WebKit**: **20798/20798** comprobaciones (incluida la comparación de `GInput` con `--old-dist`, en Chromium). Repite la batería de `estilo-verificar.mjs` sobre el componente real y añade lo que solo existe con él.

## Resultado: sin defecto bloqueante. Ningún cambio en `GNumberField.css`; un desplazamiento de 1px en WebKit con la fuente servida (hallazgo 1) queda para lima (constante de #313). `status: "candidate"`

### Contraste (mínimo en las 27 configuraciones; colores calculados y compuestos sobre el fondo real)

| Medida (mínimo) | Defecto claro / oscuro | Auditoría claro / oscuro | Tema de prueba | Spotify claro / oscuro | Mínimo en los 27 |
| --- | --- | --- | --- | --- | --- |
| Valor (≥ 4.5) | 15.27 / 13.87 | 15.21 / 13.91 | 12.53 | 15.30 / 13.91 | **12.53** |
| Prefijo y sufijo (≥ 4.5) | 6.54 / 7.83 | 6.57 / 7.84 | 5.57 | 6.49 / 7.83 | **5.57** |
| Icono de −/+ (≥ 3) | 6.90 / 8.59 | 6.94 / 8.56 | 5.94 | 6.87 / 8.62 | **5.94** |
| Separador de −/+ (≥ 3) | 3.03 / 3.93 | 3.04 / 3.92 | 3.68 | 3.02 / 3.95 | **3.02** |
| Pasar y pulsar: icono `text` / `neutral-soft` (≥ 4.5) · separador / `neutral-soft` (≥ 3) | 15.27 · 3.03 / 13.87 · 3.93 | 15.21 · 3.04 / 13.91 · 3.92 | 12.53 · 3.68 | 15.30 · 3.02 / 13.91 · 3.95 | **12.53 · 3.02** |
| Playground `#sec-number` + signos vitales (claro y oscuro, todos los campos visibles no deshabilitados) | ≥ 4.5 / ≥ 3 | | | | sin fallos |

Los mismos mínimos que el banco de estilo: el componente real no cambia ningún color (los pone `GNumberField.css` sobre la caja de `GInput`).

### Pruebas por comportamiento (tres motores salvo donde se dice)

| Prueba | Resultado |
| --- | --- |
| **Marcado real frente al que espera el CSS** | Coincide en los 66 `GNumberField` del banco: raíz con las clases de `GInput` + `g-number-field` (+ `--has-steppers` solo con −/+ pintados, nunca en solo lectura); `__value` hijo directo de `g-input__control` con `__mirror` primero y `__field`, `__roll` y `__measure` como hijos directos (ningún hijo ajeno); el campo lleva `g-input__field` (el anillo de foco de `GInput` lo encuentra con `:has(.g-input__field:focus-visible)`), `type="text"`, `role="spinbutton"`, `dir="ltr"` y ningún `name`; `__steppers` es el **último** hijo de la caja con `__step--decrement` y `__step--increment` en ese orden, `type="button"`, `tabindex="-1"`, sin `aria-hidden` y con el icono como `svg.g-icon` hijo directo; ningún estilo en línea en la celda ni en −/+; `__measure` solo dentro de una `GFormRow` con −/+ (también en solo lectura, #312); el oculto canónico con `display: none`; en reposo no queda `is-rolling`, `is-bumping` ni capa |
| Tamaños | −/+ cuadrados del alto de la caja de borde a borde (arriba, abajo y al final ±0,5px): **24 · 28 · 36 · 44 · 52**, `md` compacto 27, `xs` compacto 24 (piso); con el tema de la auditoría y el de prueba (`space` 5) **30 · 35 · 45 · 55 · 65**, 33,75, 24. Caja = `GInput` del mismo tamaño; icono = `1em` del texto |
| P1 | Separación valor–sufijo = `gap` de la caja con 1, 4 y 6 caracteres en los siete tamaños/densidades: **4 · 4 · 8 · 8 · 12**, compacto 6 y 3 (auditoría: 5 · 5 · 10 · 10 · 15); tinta a `gap + 1px`. **También con el foco** (texto crudo, sin agrupar) y en RTL. Pulsar el hueco libre de la caja enfoca con el cursor al final |
| Estados | Error (doble trazo), advertencia (discontinuo de 2×), válido, `soft`, `pill`, prefijo y deshabilitado: −/+ tapan exactamente el borde real con trazo transparente del grosor correcto y fondo recortado; separador sólido del grosor del borde; esquina de + = esquina de la caja (16px en la auditoría, píldora en `pill`); cursores `text`/`pointer`/`default` (`not-allowed` deshabilitado); solo lectura sin −/+ |
| Filas reales | Cajas de cada línea con el mismo `top` (±1px) y la misma altura con `GInput` y `GSelect`, en marcos de 1100/720/320 y ventanas de 1280/720/480/360/320; con ayuda («Sin ropa.») y con un error en la misma fila |
| **Mínimo publicado (#312) en una `GFormRow` real** | «Cantidad» 1–99 con −/+ (valor 99) junto a un `GInput` `xs`, barrido de 420 a 140px de 1 en 1: mientras comparten línea, **«99» cabe entero** (celda ≥ medidor, el campo no desplaza); la fila se parte; y en el último ancho de una línea el campo mide lo que necesita (±2px): el mínimo **no** sobrecuenta el hueco libre de P1. Medido: **111px** en `md` (defecto, tres motores), **135px** con la auditoría, **129px** con el Tema de prueba, **127px** con puntero grueso (Chromium y WebKit) |
| **Bloquear y desbloquear (#266)** | Fila «Producto · Cantidad · Presentación» de 900 a 260px cada 20: con y sin `readonly` la **misma distribución** (`data-line` de los tres), la misma caja (alto, `top`, ancho ±0,5px); −/+ desaparecen y vuelven |
| P2 (tiempos reales del `.vue`) | 19→20 rueda **dos** ranuras, 20→21 **una**; arriba al sumar, abajo al restar; 9–11 cuadros con capa y 5–7 posiciones intermedias; el `<input>` tiene el valor nuevo desde el primer cuadro; texto del campo transparente con cursor y capa con color; la capa coincide con el espejo (extremos con el rango completo ±0,1px); **retirada por `animationend` a los 142–177ms**; no rueda al escribir; con −/+ el primer paso rueda y al mantener 1s nada más rueda |
| P3 | ↑ en el máximo: **−2px** (defecto) y **−2,5px** (auditoría, `space` 5) = `--g-space-1 × 0.5`, vuelta a 0, el valor no cambia, clase retirada; ↓ en el mínimo hacia abajo; fuera del límite, nada |
| Movimiento reducido | P2 sin desplazamiento ni `animation-name` (capa ≤ 2 cuadros, retirada en el acto); P3 quieto y sin clase; I2 por `GForm` con la clase puesta y **sin** sacudida; I1 solo fundido (sin `translate`) |
| **I2 puesto por `GForm`** | Enviar con «Cantidad» vacía (obligatoria): `is-rejected` en ese campo y en ningún otro; **una sola** animación (`g-reject-shake` en `g-input__row`); −/+ se mueven con la fila (Δ = 0 respecto de la fila en cada cuadro); `aria-invalid="true"`; evento `invalid`; la clase se retira al terminar. Defecto y auditoría |
| **Foco desde `GErrorSummary`** | El enlace del resumen enfoca `#ef-qty`, visible en el visor, con el anillo de `GInput` (sólido ≥ 1,5px) en el conjunto. Defecto y auditoría |
| I1 | Con `is-ready`, el mensaje que llega entra con fundido (opacidad < 1 → 1) y baja desde la caja (`translate` < −0,5 → 0) |
| Foco | Anillo de `GInput` en el conjunto (también con error); −/+ con anillo interior si una tecnología de apoyo los enfoca. Pasar: fondo `neutral-soft` e icono `text`; pulsar − no mueve el foco y resta |
| `forced-colors` (Chromium; defecto, oscuro, auditoría) | Icono y separador visibles; deshabilitado en `GrayText`; con error −/+ tapan el borde doble real; pasar con `Highlight`; foco visible |
| Táctil (Chromium y WebKit) | −/+ **44×44** (52×52 en `xl`); cajas ≥ 44 e iguales a `GInput`; unidad dentro; sin desborde; **un toque en + suma sin enfocar el campo** |
| Escalas y zoom 200 % | DPR 1.25/1.5/2: separador ≥ 1 píxel de dispositivo. Visor de 640px con DPR 2 (lo que pinta un navegador a 1280 con zoom 200 %) en defecto, auditoría y Tema de prueba: filas alineadas, sin desborde de página, ningún hijo de la caja sale de ella, unidad dentro |
| RTL | `ar-EG` y `he` por el `lang` del ancestro: «-٤٫٥» con cifras arábigo-índicas y «72.5»; texto anclado a la derecha (`text-align: right` desde `:dir(rtl)`), sufijo a la izquierda del valor a `gap`, −/+ a la izquierda con + en el extremo |
| 320 | Número de 16 cifras: la celda encoge, la unidad «personas» sigue entera dentro de la caja, sin desborde |
| CSS publicado (`dist/grana.css`) | Reglas de `g-number-field` y keyframes `g-number-*` dentro de `@layer grana.components` y **después** de `GInput`: sin colores literales, sin `var()` con respaldo, solo `--g-*`/`--_*`, medidas literales solo `24px`, `44px` y `1px`; colores de sistema solo dentro de `@media (forced-colors: active)` |
| **`GInput` sin slots internos** (Chromium, `--old-dist`) | 29 campos, 245 elementos: HTML idéntico salvo el `id="{id}-label"` (N1), y **cajas y 26 propiedades calculadas idénticas** elemento a elemento (el cargador que gira se compara sin su caja); la sacudida I2 por `GForm` y el anillo de foco, idénticos. `node design/lab/form/auditoria-verificar.mjs`: **587/587**. (`design/lab/input/` no tiene script de verificación: sus bancos son marcado estático sobre `GInput.css`, que no cambió) |
| Consola | Sin errores ni avisos (banco y playground, los tres motores) |
| Suites | `npx vitest run` **2061/2061** (65 archivos); `npm run build`; compuertas del CLAUDE.md más `g-number-field`; `check-icons`; `tests/number-field.spec.mjs`, `tests/form-distribution.spec.mjs` y `tests/personalidad-input.spec.mjs` en los tres motores: **131 pasan y 7 se omiten** por diseño |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | No bloqueante · **abierto** | lima (constante de #313, `tokens.md` §7 y §29.6) → coco | **WebKit desplaza 1px el número enfocado con el cursor al final** (P1). Con la fuente servida por `dist/fonts.css`, WebKit redondea hacia arriba el ancho del texto del `<input>` y reserva además el cursor: el `1px` del espejo no alcanza y **27 de 63** campos del banco se desplazan 1px (`scrollLeft` 1; el número se corre 1px y pierde 1px del lado inicial del primer glifo). Mismo efecto, en esos campos, al final de P2 (la capa se retira y el texto queda 1px a la izquierda). Chromium y Firefox: 0 de 63. Medido en WebKit con el hueco del espejo y del medidor a **1,5px: 3 de 63; a 2px: 0 de 63**. El banco de estilo no lo vio: no carga `dist/fonts.css` y, con otros anchos de glifo, el caso no se dio. **Propuesta:** el hueco del cursor pasa a **2px** (1px de cursor + 1px de redondeo del ancho del texto en WebKit) en `__mirror` y `__measure`; el mínimo publicado sube 1px y la tinta de P1 queda a `gap + 2px`. Es la constante neutra que fijó #313 («el `1px` del cursor del espejo»), así que no la cambio sin que lima la enmiende; cuando lo haga, es una línea por regla en `GNumberField.css` y el estático de `estilo-verificar.mjs` (y `auditoria-verificar.mjs` deja de tolerar 1px en WebKit) |
| 2 | Informativo | lima, mora-docs | **Mínimo de referencia con la fuente servida: 111px**, no 112. `tokens.md` (§29.6, «No son tokens») y `estilo.md` dan 112px («Cantidad» 1–99 con −/+, `md`, `space` 4), medidos en el banco de estilo sin `dist/fonts.css`. Con la fuente real: **111px** (tres motores), 127px con puntero grueso, 129px con el Tema de prueba y 135px con el tema de la auditoría. Depende de la fuente (por eso se publica medido); sugerencia para el texto: «unos 110px en `md` (unos 130px en táctil)». Anotado en `estilo.md` |
| 3 | Informativo | bruno | El marcado de `GNumberField.vue` coincide con lo que espera el CSS en todos los casos («Marcado real»); la medida por posiciones del mínimo es exacta (±2px en el corte de la fila, tres temas) y el `margin-inline-start: auto` de `__steppers` y el `padding-inline-end` de `__measure` **no cambian** en esta auditoría. Nada que cambiar. En `GNumberField.meta.json` solo toqué `status`; en `pending` sobra «Auditoría de coco con un tema distinto…» |
| 4 | Informativo | kiwi, lima | **Número que no cabe sin el foco:** «1.234.567.890.12…» (la elipsis es la de `g-input__field`, `text-overflow: ellipsis` de `GInput.css`). El contrato dice «el valor se desplaza y la unidad sigue visible», y así es con el foco; sin el foco, la elipsis **avisa** de que faltan cifras (un recorte limpio mostraría otro número sin avisar), así que la dejo. Si se prefiere otro tratamiento para números (p. ej. alinear al final para ver las unidades menores), es decisión de estructura |
| 5 | Informativo | — (método) | WebKit ajusta al píxel el rectángulo de un rango de **un** carácter (medido: «2» del espejo 84→93, su ranura 84→92,406; el rango de dos caracteres mide 16,8 = 2 × 8,406). La comparación carácter a carácter de la capa de P2 tolera 1px en x en WebKit y se completa con los extremos de la capa frente al rango completo del espejo (±0,1px). Zoom del navegador aproximado con visor 640 y DPR 2; `forced-colors` y puntero grueso solo se emulan en Chromium (y táctil en WebKit) |

## Personalidad

Lo que hace a `GNumberField` distinto (estilo.md «Personalidad»), comprobado ahora **sobre el componente real** y con un tema que cambia espacio, radio y texto a la vez:

- **P1 · la unidad va pegada al número.** «72,5 kg» a la separación de la caja (8px en `md`, 10px con `space` 5) aunque la fila haga la caja de 300px; con el foco, el texto crudo cambia de ancho y la unidad lo sigue sin saltos (salvo el píxel de WebKit, hallazgo 1). Es la diferencia más visible frente a un campo genérico: en la fila de signos vitales del playground, las cuatro unidades se leen junto a su número.
- **P2 · las cifras ruedan.** Un contador mecánico: solo la cifra que cambia, en su ranura, arriba al sumar y abajo al restar; 5–7 posiciones intermedias en 142–177ms (`--g-duration-press`), quieto al repetir y con movimiento reducido. La capa cae sobre el texto del campo al subpíxel, así que al retirarse no hay salto (salvo el píxel de WebKit).
- **P3 · el tope.** El número se asoma `--g-space-1 × 0.5` (2px; 2,5px con `space` 5) hacia donde no puede ir y vuelve; sigue a la escala del tema sin constante propia.
- **−/+ dentro de la caja.** Parte de la caja y no botones sueltos: cuadrados de su alto en cualquier tamaño y tema (24 a 65px), de borde a borde sin pisar el doble trazo del error ni el discontinuo de la advertencia, con la esquina de la caja (16px o píldora). Se mueven con la fila en la sacudida I2 y desaparecen en solo lectura sin repartir la fila.

Ninguno de los cuatro pide un token ni una curva nueva, y ninguno baja un contraste ni un área táctil.

## Sin ejecutar

- Lector de pantalla real (VoiceOver, NVDA, TalkBack), Safari real, iOS/Android reales (teclado decimal, −/+ sin abrir el teclado), `forced-colors` real en Windows, zoom real del navegador (200 y 400 %), IME real. No es estética lo primero; lo demás queda en `pending` del `meta.json`.

## Archivos

- `design/lab/number-field/auditoria-banco.html`, `auditoria-ginput.html`, `auditoria-verificar.mjs`, `auditoria-tema.json` y `auditoria-tema.css` (generado por `@grana/cli`; no editar a mano).
- `estilo.md`: nota del mínimo con la fuente servida (hallazgo 2). `GNumberField.css` sin cambios.
- `GNumberField.meta.json`: `"status": "candidate"`.
