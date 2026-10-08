# Entrega de coco · GSlider.css

**Archivo:** `packages/vue/src/components/GSlider/GSlider.css`. **`defaults.css` sin cambios:** ningún token nuevo (#454, `tokens.md` §38).
**Contratos:** `design/contracts/slider.md` (DECISIONS.md #445 a #457, redactadas en `slider.pendientes.md`; personalidad B «El valor es el asa», #452), `tokens.md` §7.1, §17.2, §29 y §38, `form.md` §4, `api.md` §«Foco visible…» (#450). **Estructura:** `design/lab/slider/r01/?v=B` (kiwi).
**Estado:** listo para bruno (`.vue`, motor y pruebas) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/slider/estilo-banco.html`. El CSS se carga **dentro de la capa `grana.components`**, como lo registrará `components.css`. `XSlider` emite el marcado **exacto** del contrato («Estructura accesible», «Clases y datos») y hace solo lo que el estilo necesita, con el motor de referencia de kiwi (`r01/engine.js`); los vecinos (`GInput`, `GNumberField`, `GSelect`, `GForm`, `GFormLayout`, `GFormRow`) son los reales de `dist/`. Secciones: alto por densidad en una fila real, estados, siete familias (y sobre `surface-sunken` y `bg`), rango (separado, fundido, en los extremos, `snap="marks"`), fila real a 1100/720/320 con la receta `GSlider` + `GNumberField` del mismo `v-model`, RTL `ar-EG`, 320 y mínimo de referencia. Parámetros `?dark=1`, `?theme=propio|<generado>`, `?slow=1`.
**Tema propio de esta entrega (clave `primary` propia, #107):** `estilo-tema.json` → `estilo-tema.css` (`node packages/cli/bin/grana.mjs theme design/lab/slider/estilo-tema.json --out design/lab/slider/estilo-tema.css`): brand `#1E3A5F`, accent `#C2410C`, **primary `#2BB3A3`** (pálido, con `on-primary` oscuro y `primary-text` `#008578` distinto del relleno), neutros teñidos, radius 6, **space 5**, **borde 2px**; claro y oscuro.
**Verificación:** `GRANA_PW_PORT=4212 node design/lab/slider/estilo-verificar.mjs` (Chromium, Firefox y WebKit; `GRANA_DIST=<copia de dist/>` para no depender de un build en curso) → **17475/17475**.

## Personalidad (lo que lo hace distinto)

El riel con bolita esconde el valor; aquí **el asa es el valor** y el CSS lo trata como una pieza física que se agarra:

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **La cifra vive en el asa (B1)** | Píldora de celda única: el texto a la vista y los de referencia apilados invisibles (`visibility: hidden`, `grid-area: 1 / 1`), `tabular-nums`, `unicode-bidi: plaintext`. Recorrido recogido media píldora: `c(x) = pill-w/2 + x · (100% − pill-w)`, igual para asas, tramo y marcas | No baila de ancho, nunca sale del riel, la raya de la marca cae bajo su centro |
| **Se funden en una cápsula (B2)** | `is-merged`: esquinas interiores a 0 con `--g-duration-press` + `--g-ease-out` (el radio es `min(--g-radius-pill, alto/2)` para que la transición se vea de verdad: de 999px a 0 solo cambiaría en el último instante) y **una sola raya** `on-{color}`: el borde final de la mitad 0 toma su propio relleno y el inicial de la 1 la raya | «18 a \| 24 a» se lee como un intervalo, no como dos fichas montadas |
| **Lo que se agarra se levanta** | Mientras dura el arrastre, la píldora enfocada pasa a `{color}-strong` **y a `--g-shadow-2`** (fundido de sombra con `--g-duration-fast`; no se desplaza) | El dedo nota qué tiene cogido; con movimiento reducido sigue igual (es color y sombra) |
| **El tramo pesa más que el riel** | Tramo `× 1.5` del grosor del riel (6px frente a 4px), en `{color}-text`, centrado en el riel | `{color}-text` y `border-control` pasan 3:1 contra la superficie pero entre sí quedan a 1,04–1,9:1 (medido): con `color="neutral"` y en oscuro se confundían. El grosor los separa sin depender del color (1.4.1) |
| **El campo dentro de la píldora (B4)** | `is-typing`: superficie, texto y contorno de la familia, sin sombra, con un **cursor fijo** absoluto tras el texto que no ocupa sitio (la píldora no cambia de ancho) | Se teclea «35» donde se mira |
| **El tope (B5)** | `g-slider-bump-up/-down` en el **asa** enfocada (píldora y anillo juntos): `--g-space-1 × 0.5` hacia la dirección visual (`--_dir` con `:dir(rtl)`) y vuelta, `--g-duration-press` + `--g-ease-out` | El límite se siente sin texto nuevo |
| **El salto se desliza (B6)** | Transición de `inset-inline-start` del asa y del tramo **solo** con `is-jumping` y bajo `is-ready` | Arrastre y teclado van pegados al dedo y a la tecla |
| **«Sin elegir» de verdad** | Sin píldora ni tramo; el asa cubre el área (el anillo de teclado rodea el riel entero como una cápsula); riel en trazos `border-control`, **que pasan a `danger-text` con error** | Una escala obligatoria sin responder se ve en el propio control, no solo en el mensaje |

Lo que **no** hace (a propósito): ni `--g-ease-spring` ni `--g-ease-bounce` (#452), nada al montar, ninguna transición de posición al arrastrar ni al teclear, ningún `:focus-visible` (#450).

## Medidas (tokens; ninguna constante nueva)

| Medida | default | comfortable | compact | `pointer: coarse` |
| --- | --- | --- | --- | --- |
| Alto del área (= caja md de `GInput`, `space × 9 × densidad`, piso 24; crece con su texto como la caja) | 36 | 31,5 | 27 | 44 |
| Alto de la píldora (`space × 7 × densidad`, piso 24; crece con su texto) | 28 | 24,5 | 24 | 28 (zona de toque 44 × 44) |
| Riel / tramo | 4 / 6 | 4 / 6 | 4 / 6 | 4 / 6 |
| Zona de toque del asa (ancho × alto) | ≥ 44 × 36 | ≥ 44 × 31,5 | ≥ 44 × 27 | ≥ 44 × 44 |
| Zona agarrable del tramo (rango) | 36 | 31,5 | 27 | 44 |

Con el tema propio (`space` 5): área 45 · 39,4 · 33,8; píldora 35 · 30,6 · 26,3. **Área y píldora crecen con su texto** (auditoría, hallazgo 2): las dos son el mayor entre lo de la tabla y una línea de `body-sm` + los dos bordes (`--_text-box`), como la caja de `GInput`. Con el tema de la auditoría (`space` 3, texto 19, Georgia) área 27 · 26 · 26 y píldora 26 en las tres densidades; con el texto al 200 %, 42 y 42 (= `GInput`). Relleno en línea de la píldora `space × 3`; rayas de marca `space × 1.5` de alto y `--g-border-width` de grosor; nombres a `space × 2` bajo el borde del área.

- **Fila real:** el centro del área coincide con el de la caja de `GInput`, `GNumberField` y `GSelect` de la misma línea (Δ ≤ 1px, alturas iguales) a 1100 y 720 y en ventanas de 720/480/360/320, en las tres densidades, con el tema por defecto, oscuro, lustre y el propio.
- **La píldora en reposo** (`es-MX`, «40 %»): `--_pill-w` 59,6px; «$2,400» (rango MXN de 0 a 5000) 72,0px; «5» (dolor) 42,8px.

## Mínimo de referencia (#453), `md`, `space` 4, Instrument Sans servida

| Caso | `space × 40` | Píldoras | Marcas (+ `space × 2` entre cada dos) | **Mínimo** |
| --- | --- | --- | --- | --- |
| Dolor 0–10, «Sin dolor · Moderado · El peor» | 160 | 3 × 42,8 = 128,4 | 159,9 | **160px** |
| Volumen 0–100 % | 160 | 3 × 59,6 = 178,8 | — | **179px** |
| Precio en rango, MXN 0–5000 | 160 | 4 × 72,0 = 288,1 | — | **289px** |
| Tema propio (`space` 5): dolor · volumen · precio | 200 | | | **200 · 203 · 321px** |

kiwi estimó ≈ 144px por las marcas del dolor sin la fuente servida; con ella son 159,9px (las tres juntas casi igualan `space × 40`). La receta `g-form-w-lg` las cubre.

## Contraste (`estilo-verificar.mjs`: por defecto, lustre, spotify y propio con `primary`, claro y oscuro; siete familias; tres motores, mismas cifras)

| Tema | Texto de la píldora | Al pasar | Contorno | Tramo | Riel | Tecleando | Solo lectura | Error | Nombres, «sin elegir», ayuda |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Por defecto claro | 5,33 | 7,46 | 4,93 | 4,93 | 3,19 | 15,25 | 6,90 | 5,08 | 7,46 |
| Por defecto oscuro | 4,81 | 6,10 | 4,52 | 4,52 | 4,32 | 15,22 | 8,59 | 4,52 | 8,59 |
| Lustre claro | 5,30 | 7,44 | 4,36 | 4,36 | 3,19 | 4,36 | 6,87 | 5,09 | 7,41 |
| Lustre oscuro | 4,81 | 6,10 | 4,52 | 4,52 | 4,33 | 9,64 | 8,61 | 4,52 | 8,61 |
| Spotify claro | 5,28 | 7,02 | 4,21 | 4,21 | 3,19 | 4,21 | 6,87 | 5,11 | 7,38 |
| Spotify oscuro | 4,81 | 6,10 | 4,52 | 4,52 | 4,35 | 8,88 | 8,62 | 4,52 | 8,62 |
| Propio claro (`primary` propia) | 5,18 | 5,11 | 4,20 | 4,20 | 3,20 | 4,20 | 6,91 | 5,12 | 7,48 |
| Propio oscuro | 4,87 | 6,16 | 4,58 | 4,58 | 4,32 | 6,57 | 8,60 | 4,68 | 8,60 |
| **Mínimo** | **4,81** | **5,11** | **4,20** | **4,20** | **3,19** | **4,20** | **6,87** | **4,52** | **7,38** |

**Solo lectura tras la auditoría** (hallazgo 1, `auditoria.md`): texto sobre `neutral-soft` ≥ 13,83 y contorno `border-control` ≥ 3,18 en las 28 configuraciones medidas; la columna «Solo lectura» de arriba es la del texto con el diseño anterior.

Texto ≥ 4.5:1 (on-{color} sobre {color} y sobre {color}-strong, el par que garantiza el motor); contorno, tramo y riel ≥ 3:1 contra `surface`, `bg` y `surface-sunken` (cada uno medido contra los tres); «tecleando» es el peor de texto (≥ 15) y contorno (`-text` contra `surface`). El mínimo de contorno y tramo (4,20, propio claro con la `primary` pálida) es el de §7.1 en `GCheckbox` (4,21 spotify claro). **Informativo:** tramo contra riel 1,04–1,9:1 según familia y tema (por eso el grosor, arriba); la raya de la cápsula, ≥ 4,81 (es el par `on`/relleno).

## Decisiones de CSS

- **`color="brand"` lee `primary`** (`--g-color-primary*`, §17.2, #95, `roles.test.js`), como `GSwitch`, `GCheckbox` y `GRadioGroup`; las otras seis familias leen la suya. En el tema propio, `primary` ≠ `brand` y el deslizador sigue a `primary`.
- **Variables de la píldora en el asa** (`--_pill-bg`, `--_pill-fg`, `--_pill-edge`, `--_pill-shadow`, `--_seam`, `--_rs`/`--_re`): cada estado (pasar, arrastrar, error, tecleando, solo lectura, deshabilitado, fusión) reasigna variables y la píldora las pinta una vez. En `forced-colors` las mismas variables se fijan **en la propia píldora**, así ganan a cualquier estado sin pelear especificidades.
- **Radio animable:** `--_r: min(--g-radius-pill, alto/2)`. Mismo dibujo que la píldora; necesario para que la transición de las esquinas de la fusión exista (de 999px a 0 no se vería).
- **Posición sin `translate`:** el asa se centra en vertical con `inset-block-start: calc(50% − alto/2)`, para que el tope pueda usar `translate` en el asa sin pisar el centrado.
- **Asa con `inline-size: max-content` y `min-inline-size: var(--_pill-w)`:** antes de medir (`--_pill-w: 0px`, SSR) la píldora tiene su ancho natural y no se aplasta en el extremo final.
- **Zona de toque del asa = alto del área** (`::after`, ≥ 44 de ancho): la franja del área por encima y por debajo de la píldora cuenta como píldora, no como tramo ni como riel.
- **Nombres de marcas en los extremos** sin conocer su ancho: el contenedor de marcas es de consulta (`container-type: inline-size`) y el nombre se coloca con `translate: calc(--_dir × clamp(−c, −50%, 100cqi − c − 100%))`. Centrado bajo su raya mientras cabe; pegado al borde cuando no. Medido dentro en LTR, RTL y a 320.
- **Cabecera vacía** (sin etiqueta visible y con valor): `:empty { display: none }`, no deja el margen de la etiqueta.
- **Solo lectura** (auditoría, hallazgo 1): lo de `GInput` de solo lectura, relleno `neutral-soft`, texto `text` y contorno **`border-control` en trazo discontinuo** (≥ 3:1; `border-strong` es translúcido y quedaba a ≈ 1,5:1). La raya de la cápsula, `border-control`.
- **Solo lectura con error:** contorno `danger-text` (la píldora de solo lectura con error no puede perder la señal).
- **`forced-colors`:** riel `GrayText`, tramo `Highlight` (también en solo lectura), píldora `ButtonFace`/`ButtonText` con borde `ButtonText` y raya `ButtonText`, tecleando `Field`/`FieldText`, deshabilitado `GrayText` sobre `Canvas`, anillo `Highlight`, rayas de marca `CanvasText`; **error con borde doble** (sin color no hay otra señal en el control); `forced-color-adjust: none` en riel, tramo, píldora y rayas.
- **#383:** ningún selector toma hijos por estructura; la única combinación de hijo es `.g-slider__pill-ref > span` (las referencias que pinta el propio componente) y los tres hijos de la raíz en `GFormRow` por su clase.
- `vertical-align: -0.125em` del icono del mensaje: el mismo valor que `GInput` y `GSelect` (paridad visual del mensaje).

## Para bruno (lo que el CSS espera del `.vue`)

Además de «Clases y datos» del contrato:

1. **Clases que faltan en la tabla del contrato:** `g-slider--density-{default|comfortable|compact}` en la raíz (el área sigue a la caja de `GInput` de esa densidad; sin la clase, `default`), e `is-warning` / `is-valid` en la raíz para el color del mensaje (como `GInput` y `GSelect`). Icono del mensaje con la clase **`g-slider__message-icon`** en el `GLibIcon`.
2. **`--_pill-w` medido:** el ancho mayor de las píldoras **con `--_pill-w: 0px` puesto** (si se mide con el valor anterior, nunca encoge: la píldora lleva `min-inline-size: var(--_pill-w)`), o bien `__pill-ref` + relleno + bordes. Vuelve a medir con las fuentes, al cambiar textos y con el `ResizeObserver`.
3. **Tope: la animación está en `.g-slider__thumb`** (el asa enfocada, para que el anillo se mueva con la píldora), no en `.g-slider__pill`. La retirada «en el acto si no hay animación calculada» debe mirar el asa (`thumb.getAnimations()` o `getComputedStyle(thumb).animationName`), o el `data-bump` se quitaría siempre.
4. **`is-jumping` y `transitionend`:** el evento llega desde `.g-slider__thumb` y `.g-slider__fill`, y el nombre de la propiedad lo da cada motor (`inset-inline-start`, `left` o `right`): filtrar por el elemento (el asa), no por el nombre. La píldora y el asa también emiten `transitionend` de colores, sombra y `border-radius`.
5. **`is-merged`** cuando los centros quedan a menos de `--_pill-w` (`(f1 − f0) · (ancho − pill-w) < pill-w`), con `--_mid = (f0 + f1) / 2` en la raíz. El tramo **no** se arrastra con `is-merged` (queda bajo la cápsula).
6. **`is-dragging`** en la raíz en cuanto un gesto de puntero mueve (sobre la píldora, desde el `pointerdown`): pinta `{color}-strong` + `--g-shadow-2` en el asa **enfocada**, así que el foco debe ir al asa que se mueve (también al arrastrar el tramo, a la más cercana al punto).
7. **`is-ready`** tras montar y medir (dos cuadros), nunca antes: con `is-merged` desde el servidor, las esquinas no deben animarse al montar (verificado en el banco: 0 animaciones al cargar).
8. Con `is-empty` no se pinta `__pill` ni `__fill` y el asa no lleva `--_at` (el CSS la extiende a toda el área).
9. `__marks` dentro de `__row` detrás de `__area` (es el contenedor de consulta de los nombres); `__mark-label` solo si la marca tiene nombre.

## Para lima (huecos de contrato)

1. **Tramo `× 1.5` del riel** (decisión de coco, sin token): `{color}-text` frente a `border-control` mide 1,04–1,9:1 (con `neutral` y en oscuro no se distinguen); el grosor separa tramo y riel sin color. Anotar en `slider.md` «Tokens consumidos» (`--g-space-1` del riel `× 1`, tramo `× 1.5`) y en `tokens.md` §38.
2. **`--g-shadow-2` al arrastrar** («lo que se agarra se levanta»): no está en la tabla de tokens de `slider.md` (solo `--g-shadow-1`). Es la sombra existente de un elemento elevado; color y sombra, no desplazamiento (se queda con movimiento reducido). Registrar en #452/#454 o pedirme que lo quite.
3. **Píldora por densidad:** el contrato dice `max(24px, space × 7)`; la entrega la multiplica por la densidad como el área (28 · 24,5 · 24). Sin ello, en `compact` la píldora (28) sería más alta que el área (27).
4. **Tope en el asa, no en la píldora** (punto 3 de bruno): `slider.md` B5 dice «coco anima la píldora del nativo enfocado»; anima el asa (píldora + anillo).
5. **Trazos con error en «sin elegir»** (`danger-text`): no está en el contrato; es la única señal del error en el propio control cuando no hay píldora.
6. **Contorno de la píldora en solo lectura:** aplicado en la auditoría (hallazgo 1), derivado del estándar de `GInput`: `border-control` discontinuo sobre `neutral-soft` en vez de `border-strong` (≈ 1,5:1). `slider.md` «Tokens consumidos» debe cambiar `border-strong` → `border-control` para el contorno en `readonly` y añadir `neutral-soft`.
7. Tabla «Clases y datos»: añadir `g-slider--density-*`, `is-warning`, `is-valid` y `g-slider__message-icon`.

## Lo que NO se verificó

- El **componente real** (`GSlider.vue` aún no existe): medición real de `--_pill-w`, `setIntrinsicMin` en una `GFormRow` (aquí solo el mínimo de referencia calculado), `GErrorSummary` y la regla de modalidad de `utils/keyFocus.js`. Lo hará la auditoría (paso 5) en `design/lab/slider/auditoria.md`.
- `forced-colors` en Firefox y WebKit y puntero grueso en Firefox (Playwright no los emula); Windows con contraste alto real, Safari, iOS/Android reales (táctil, `pan-y` con desplazamiento real); zoom 200/400 %; lectores de pantalla.
- Temas generados distintos de lustre y spotify (los otros nueve de `dark-color-presence/generated/` se pueden abrir en el banco, pero el verificador no los recorre).
