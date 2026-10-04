# Entrega de coco · GNumberField.css

**Archivo:** `packages/vue/src/components/GNumberField/GNumberField.css`. **`defaults.css` sin cambios:** ningún token nuevo (#313, `tokens.md` §30). **`GInput.css` sin cambios** (#309: lo propio va aquí).
**Contratos:** `design/contracts/number-field.md` (DECISIONS.md #309 a #314), `design/contracts/input.md` «Cambio por `GNumberField`», `docs/contract/tokens.md` §29.6, §30 y §7. **Estructura:** `design/lab/number-field/r01/` (kiwi).
**Estado:** listo para bruno (el `.vue` se escribe a la vez) y para la auditoría (paso 5) sobre el componente real.
**Banco:** `design/lab/number-field/estilo-banco.html` (requiere `npm run build`; desde la raíz, `python3 -m http.server 4209`). El CSS se carga **dentro de la capa `grana.components`, después de `GInput`**, como lo registra `components.css`; los vecinos (`GForm`, `GFormLayout`, `GFormRow`, `GInput`, `GSelect`) son los reales de `dist/`. `XNumberField` emite el marcado **exacto** del contrato («Estructura accesible», «Clases y datos») a mano y hace lo mínimo que el estilo necesita (formato `Intl`, pasos, −/+ con `pointerdown` + `preventDefault` y repetición 400/60, capa de P2, `is-bumping`, retirada por `animationend` o en el acto). Seis secciones: tamaños junto a `GInput`, P1 con 1/3/6 caracteres por tamaño, estados, fila real a 1100/720/320, RTL (`ar-EG`, `he`) y 320, mínimo de referencia. Controles: tema (por defecto, «Tema de prueba» y los once generados), oscuro, lento ×5, rechazo (I2). Parámetros `?dark=1`, `?test=1`, `?theme=<nombre>`, `?slow=1`.
**Verificación:** `node design/lab/number-field/estilo-verificar.mjs` (Chromium, Firefox y WebKit) → **17354/17354** (ver abajo).

## Personalidad (lo que lo hace distinto)

`GNumberField` no es «un `<input>` con flechitas». Tres gestos propios (#313, adoptados por el usuario), todos sin tokens nuevos, con `--g-duration-press` y `--g-ease-out`, y **quietos con `prefers-reduced-motion: reduce`**:

| Pieza | Qué hace el CSS | Por qué es de Grana |
| --- | --- | --- |
| **P1 · La unidad va pegada al número** | La celda `__value` es una rejilla de una celda donde el espejo invisible y el `<input>` se superponen: el `<input>` no aporta ancho (`inline-size: 0; min-inline-size: 100%`) y el espejo, con la misma tipografía y `tabular-nums`, decide el ancho. El sufijo y el `output` quedan **al `gap` de la caja** detrás del número; el hueco libre queda después, antes de −/+ | «72,5 kg» se lee como en papel aunque la fila haga la caja ancha. En los campos genéricos la unidad se va al otro extremo de la caja |
| **P2 · Las cifras ruedan** | Solo las cifras que cambian, cada una en su ranura con recorte, se deslizan el **100 % de su propio alto**: hacia arriba al sumar (la nueva entra desde abajo, la vieja sale por arriba), hacia abajo al restar. El texto del `<input>` se vuelve transparente mientras dura la capa, **el cursor no** (`caret-color: --g-color-text`) | Un contador mecánico: dice el sentido y la magnitud del cambio (una decena que pasa) justo cuando la persona mira el valor y no el teclado. Medido: 9–10 cuadros, 5–6 posiciones intermedias, retirada a los 167–177ms |
| **P3 · El tope** | El número (la celda entera, con el cursor) sube o baja `--g-space-1 × 0.5` y vuelve, una vez, en el 45 % de `--g-duration-press` | La pulsación de teclado en el límite deja de ser muda, sin sonido ni color. Medido: 2px (= tope) y vuelta a 0 en los tres motores |
| **−/+ dentro de la caja** | No son botones que flotan junto al campo: son **parte de la caja**, cuadrados de su alto, de borde a borde, separados por líneas `border-control` del grosor del borde. Su trazo de bloque y final es transparente y cae exactamente sobre la línea de la caja: el fondo de pasar/pulsar nunca pisa el borde (tampoco el doble trazo del error ni el discontinuo de la advertencia) | Se leen como una sola pieza con el número; la esquina final sigue la forma de la caja (también `pill`) |

Lo que **no** hace (a propósito): ningún rebote ni curva nueva (#299 (1)), ninguna animación propia del rechazo (la sacudida I2 es la de `GInput` y ya mueve `g-input__row` con −/+ dentro), ningún color de marca en −/+ (son neutros: el foco y el estado los pone la caja).

## Medidas (de tokens; constantes de diseño, no tokens nuevos)

| Medida | xs | sm | md | lg | xl | md compact | xs compact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| −/+ (= `--_h` de `GInput`, piso 24px) | 24 | 28 | 36 | 44 | 52 | 27 | 24 |
| −/+ con `pointer: coarse` | 44 | 44 | 44 | 44 | 52 | 44 | 44 |
| P1 valor–sufijo (= `calc(--_gap × --_density)` de `GInput`) | 4 | 4 | **8** | 8 | 12 | 6 | 3 |

- **Icono** `minus`/`plus` a `1em` del texto escrito del tamaño (`--_fs`); color `text-muted` en reposo, `text` al pasar y pulsar, `text-subtle` deshabilitado. Fondo de pasar y pulsar `neutral-soft`; transición de color y fondo `--g-duration-fast` + `--g-ease-standard`.
- **Separador** `--g-border-width` en `border-control` (≥ 3:1 sobre la superficie y sobre `neutral-soft`); con el campo deshabilitado, `border-strong` (el borde deshabilitado de la caja de `GInput`).
- **P1:** la distancia medida desde el borde de la celda es el `gap` exacto; la de tinta es `gap + 1px` (el hueco del cursor, #313). Con una fuente sin cifras tabulares, un solo dígito estrecho puede ir sobre el piso de `1ch` (+0,5px: «Tema de prueba», Georgia).
- **P3:** `--g-space-1 × 0.5` = 2px con `space` 4 (2,5px con 5).

## Decisiones de CSS

- **Alias propios `--_nf-border` y `--_nf-stroke`** (prefijo `--_nf-` para no pisar los de `GInput`): el borde real de la caja (lo que −/+ tapan con margen negativo: `bw`, ×2 en advertencia y en el error con colores forzados) y el trazo visible (×2 en error por el `box-shadow` interior de `GInput`, ×2 en advertencia). Así −/+ cubren la caja de borde a borde y su fondo se recorta (`background-clip: padding-box`) **dentro** del trazo en todos los estados.
- **La celda lleva `overflow: clip`:** ni el espejo ni el medidor de #312 (fuera de flujo) generan desborde; el número que no cabe encoge la celda y la unidad sigue entera (medido a 320 con «1.234.567.890.123.456 personas»).
- **`text-align: match-parent` no basta en Chromium** (medido: resuelve contra la dirección del propio `<input dir="ltr">` y deja el texto a la izquierda en RTL; Firefox y WebKit lo anclan a la derecha). Se fija `right` desde `__value:dir(rtl)` para el campo y la capa de P2.
- **El medidor `__measure` lleva el mismo `1px` de cursor que el espejo**, así «medidor» y «celda» miden lo mismo para el mismo texto. `white-space: pre`: con varios textos de referencia en líneas, su ancho ya es el del más ancho.
- **Keyframes** `g-number-roll-{up,down}-{new,old}` y `g-number-bump-{up,down}` (nunca `g-reject…`: `GInput` y `GForm` retiran `is-rejected` por ese prefijo). Toda declaración `animation` está dentro de `@media (prefers-reduced-motion: no-preference)`: con `reduce` no hay animación calculada y el `.vue` retira la capa y la clase en el acto.
- **Cursor:** de texto en el área vacía de la caja (pulsarla enfoca el campo, P1), `pointer` sobre −/+ (como el botón de contraseña de `GInput`), normal en el contenedor; `not-allowed` deshabilitado.
- **Foco de −/+:** no entran en el Tab ni toman el foco al pulsarlos; si una tecnología de apoyo los enfoca, anillo `--g-focus-width` del color de foco del campo (`--_focus`), por dentro.

## Mínimo de referencia (#312) · «Cantidad» 1–99 con −/+

Medido en el banco (texto de referencia «99», el más ancho entre `min` y `max`), **al píxel** (con ese ancho de caja «99» cabe entero; con 1px menos, no), en los tres motores:

| Contexto | Mínimo |
| --- | --- |
| **`md`, `space` 4, puntero fino** | **112px** (≈ `--g-form-min` 28) |
| `md`, `space` 4, puntero grueso (Chromium y WebKit) | 128px (−/+ de 44) |
| «Tema de prueba» (`space` 5, borde 2px, Georgia) | 129px |

Para mora-docs (receta, no normativo): «un campo con −/+ en una fila necesita unos 112px en `md` (128px en táctil); el campo lo publica él mismo a la fila».

## Para bruno (lo que el CSS espera del marcado)

- **Marcado exacto del contrato.** La referencia ejecutable es `XNumberField` en `estilo-banco.html`. Lo que el CSS lee: raíz con las clases de `GInput` + `g-number-field` (+ `g-number-field--has-steppers` solo con −/+ pintados); `__value` **hijo directo** de `g-input__control` con `__mirror`, `__field`, `__roll` y `__measure` como hijos directos (el CSS usa `__value > __field` y `__value > __roll`); `__steppers` hijo directo de `g-input__control`, con `__step--decrement` y `__step--increment` (el **último** es el que lleva la esquina de la caja: `:last-child`); el icono es el `GLibIcon` (`.g-icon`) dentro del botón, sin clase propia.
- **P2:** `is-rolling` en `__value` mientras exista `__roll`; `data-direction="up|down"` en `__roll`; cada carácter cambiado en `__roll-slot > __roll-new (+ __roll-old)`, los demás como texto. Hasta dos animaciones por ranura (nueva y vieja), con `fill: both`: para retirar la capa, esperar a que **todas** terminen (`animationend` de `g-number-roll…` y ninguna animación de la capa sin terminar) o retirarla en el acto si en el cuadro siguiente `animation-name` es `none`.
- **P3:** `is-bumping` + `data-bump="up|down"` en `__value`; retirar en `animationend`/`animationcancel` de `g-number-bump…` (el evento sale de `__value`, que es su `target`).
- **Medidor:** el CSS le da al `__measure` el mismo `1px` del espejo; la medida por posiciones de `GNumberField.vue` (lo de antes de la celda + medidor + lo de entre la celda y −/+ + −/+) es la correcta. Ojo con la fórmula literal del contrato (ver «Notas para otros dueños»).
- **`:active` con `pointerdown` cancelado:** medido en los tres motores, el fondo de pulsar se aplica igual; no hace falta una clase `is-pressed`.
- **Sin `<style>` en el `.vue`** y sin estilos en línea para estas partes (el banco solo usa `display: contents` en el envoltorio del SVG, que el `.vue` no tiene).

## Verificación (`estilo-verificar.mjs`, Playwright, Chromium, Firefox y WebKit: 17354/17354)

**Contraste medido en la página** (colores calculados compuestos sobre el fondo real), 25 configuraciones por motor: tema por defecto claro y oscuro, «Tema de prueba» y los once generados de `design/lab/tema-oscuro/dark-color-presence/generated/` en claro y oscuro, todos los casos no deshabilitados:

| Medida (mínimo) | Defecto claro | Defecto oscuro | spotify claro / oscuro | Mínimo en los 25 |
| --- | --- | --- | --- | --- |
| Valor (≥ 4.5) | 15.27 | 13.87 | 15.30 / 13.91 | **12.53** |
| Sufijo y prefijo (≥ 4.5) | 6.54 | 7.83 | 6.49 / 7.83 | **5.57** |
| Icono de −/+ (≥ 3) | 6.90 | 8.59 | 6.87 / 8.62 | **5.94** |
| Separador de −/+ (≥ 3) | 3.03 | 3.93 | 3.02 / 3.95 | **3.02** |
| Icono al pasar, `text` / `neutral-soft` (≥ 4.5); separador / `neutral-soft` (≥ 3) | 15.27 | 13.87 | 15.30 / 13.91 | **12.53**; ≥ 3 en los 25 |

**Geometría** (por defecto, oscuro y Tema de prueba): −/+ cuadrados del alto de la caja por tamaño (±0,5px), de borde a borde (arriba, abajo y al final, ±0,5px) en reposo, error, advertencia, válido, `soft`, `pill`, prefijo y deshabilitado; trazo transparente del grosor correcto por estado y fondo recortado; separador sólido del grosor del borde; esquina de + = esquina de la caja; caja = `GInput` del mismo tamaño; icono = `1em`; P1 = `gap` exacto con 1, 3 y 6 caracteres en los siete tamaños/densidades y sufijo pegado (no al final de la caja); el `<input>` no desborda ni se desplaza con el cursor al final (también RTL); `tabular-nums` en campo, espejo y medidor; medidor fuera de flujo; solo lectura sin −/+; cursores; fila real con `GInput` y `GSelect`: cajas de cada línea con el mismo `top` (±1px) y la misma altura a 1280 con marcos de 1100/720/320 y con ventana de 720/480/360/320; RTL `ar-EG` y `he`: −/+ a la izquierda con + en el extremo, sufijo pegado a `gap`, texto anclado a la derecha; 320: número largo con la unidad entera dentro de la caja y la celda encogida; sin desborde de página.
**P2** (los tres motores): 19→20 rueda **dos** ranuras, 20→21 **una**; ≥ 2 posiciones intermedias; la nueva entra desde abajo y la vieja sale por arriba al sumar, al revés al restar; el `<input>` tiene el valor nuevo desde el primer cuadro; texto del campo transparente, cursor y capa con color; **cada carácter de la capa coincide con el del espejo** (±0,5px en x e y, descontado el desplazamiento); la capa se retira en ≤ 300ms; al mantener + 1s, nada rueda.
**P3:** ↑ en el máximo: −2px (tope `space × 0.5`), vuelve a 0, el valor no cambia, la clase se retira; ↓ en el mínimo hacia abajo; fuera del límite, nada.
**Movimiento reducido:** P2 sin desplazamiento ni `animation-name` (la capa dura ≤ 2 cuadros), P3 sin desplazamiento, I2 sin animación.
**I2:** con `is-rejected`, **una sola** animación en todo el campo (`g-reject-shake` en `g-input__row`); −/+ se mueven con la fila; la clase se retira al terminar.
**Foco:** anillo de `GInput` (`--g-color-focus`, sólido, ≥ 1,5px) en el conjunto con el campo enfocado; −/+ con anillo interior si se enfocan. **Pasar y pulsar** (con `pointerdown` cancelado): fondo `neutral-soft`, icono `text`, el foco no se mueve.
**`forced-colors`** (Chromium, claro y oscuro): icono y separador visibles, deshabilitado en `GrayText` (distinto del habilitado), con error −/+ tapan el borde doble real, pasar con `Highlight`.
**Táctil** (Chromium y WebKit, `pointer: coarse`): −/+ 44×44 (52×52 en `xl`), cajas ≥ 44 e iguales a `GInput`, unidad dentro de la caja, sin desborde. **Escalas** 1,25/1,5/2: separador ≥ 1 píxel de dispositivo.
**Estático:** sin colores literales, sin `var()` con respaldo, sin `@layer`, `@property` ni `!important`; solo `--g-*` que existen en `defaults.css`, los alias de `GInput` (`--_h`, `--_fs`, `--_lh`, `--_radius`, `--_focus`) y los propios `--_nf-*`; literales solo `24px`, `44px`, el `1px` del texto oculto y el `1px` del cursor (espejo y medidor), `1ch`, `0.5` y `100%`; seis keyframes `g-number-roll…`/`g-number-bump…` y ningún `g-reject…` ni regla de `is-rejected`; animaciones solo con `no-preference`; `:hover` solo con `(hover: hover)`. `levels.test.js` en verde; `npm run build` y las compuertas del `CLAUDE.md` en verde. **Consola limpia** en los tres motores.

**Prueba de humo sobre el `.vue` en curso de bruno** (sin confirmar, no forma parte de los 17354): con el `GNumberField.vue` y el `dist/` del árbol de trabajo en este momento, en los tres motores: −/+ 36×36 de borde a borde, P1 a 8px, cajas de la fila con el mismo `top` y alto que `GInput`, P2 rueda dos ranuras con posiciones intermedias, consola limpia.

## Qué NO verifiqué (queda para la auditoría sobre el componente real)

- **Todo lo anterior sobre `GNumberField.vue`** (la batería entera se ejecutó sobre el marcado del contrato): en particular el mínimo publicado por el `.vue` a una `GFormRow` real y que una fila se parte antes de que «99» deje de caber; el desbloqueo de un `readonly` (#266) sin repartir la fila ni cambiar la altura; `is-rejected` puesto por `GForm` en un envío (no a mano); `is-ready` (I1) con el mensaje que sale del campo; el foco que llega desde `GErrorSummary`; la retirada de la capa y de `is-bumping` con los tiempos reales del `.vue`; el texto crudo al entrar y el formateado al salir (P1 cambia de ancho con el foco); `Intl` real en `ar-EG`/`he` con cifras del idioma.
- `forced-colors` en Firefox y WebKit y puntero grueso en Firefox (Playwright no los emula); Windows con contraste alto, Safari, iOS/Android reales (−/+ sin abrir el teclado, doble toque sin zoom); zoom 200/400 %.
- Lector de pantalla (no es estética; abierto en el contrato).

## Notas para otros dueños (no bloquean)

- **lima (contrato, #312):** la fórmula «Mínimo = ancho de la caja − ancho de la celda `__value` + ancho del texto de referencia» **sobrecuenta el hueco libre** que deja P1 (la celda mide su texto y el resto de la caja queda vacío antes de −/+): en el banco daría 295px en lugar de 112px. La lista entre paréntesis del contrato (relleno, prefijo, sufijo, `output`, separaciones, −/+ y bordes) es la intención correcta; la redacción debería ser «lo que hay en la caja salvo la celda y el hueco libre + el texto de referencia». `GNumberField.vue` ya mide por posiciones y lo hace bien.
- **lima (tabla de tokens):** el CSS usa además `--g-color-border-strong` para el separador con el campo deshabilitado (el borde deshabilitado de la caja de `GInput`) y `--g-focus-width` + el color de foco del campo para el anillo de −/+ si una tecnología de apoyo los enfoca (el contrato dice «sin anillo propio» porque no reciben foco; el anillo es una red de seguridad, no un estilo nuevo). «Cursor normal sobre −/+»: se usa `pointer` en los botones, como el botón de contraseña de `GInput`.
- **mora-docs (README):** el mínimo de referencia de la tabla de arriba; P1/P2/P3 quietos con movimiento reducido.
