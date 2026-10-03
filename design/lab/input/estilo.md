# Entrega de coco · GInput.css

**Archivo:** `packages/vue/src/components/GInput/GInput.css`
**Estado:** listo para bruno (registro pendiente en `components.css`, que es de bruno; el `.vue` aún no existe).
**Banco de pruebas:** `design/lab/input/estilo-banco.html`: marcado exacto de `design/contracts/input.md` con el CSS real y el tema por defecto. Se sirve desde la raíz del repo (`python3 -m http.server`, ruta `/design/lab/input/estilo-banco.html`).

## Verificación en Chromium

| Prueba | Resultado |
| --- | --- |
| Literales | Sin colores; medidas solo `24px`, `44px`; sin `var()` con respaldo, sin `@layer` ni `<style>` |
| Tokens consumidos | Solo los del contrato; ninguno nuevo |
| Altura de la caja: 5 tamaños × 3 densidades | Exacta en las 15 combinaciones (xs 24 / md 36 / xl 52 con espacio base 4; con base 5 y borde 2px también exacta) |
| Contraste en reposo | Etiqueta 17.4 · texto 16.1 · ayuda 7.46 · error 5.49 · marca de obligatorio 5.49 · `placeholder` 5.10 (4.72 sobre `soft`) · botón mostrar 7.46. Todos ≥ 4.5:1 |
| Borde de la caja (`border-control` sobre la página) | 3.45:1 (mínimo 3:1) |
| Variante `soft`: relleno solo contra la página | 1.08:1: **no llega a 3:1**; por eso conserva la línea inferior con `border-control` (3.45:1) |
| Foco con clic y con Tab | Anillo de 2px, color del tema, separación de 2px, en la **caja completa**; el `<input>` no lleva contorno; el botón mostrar tiene su propio anillo y la caja no lo duplica |
| Error | Borde de danger con trazo interior (doble grosor sin mover el contenido), marca ⚠ que un lector de pantalla no lee, texto en `danger-text` |
| Región del error vacía | Existe en el DOM, `display: block`, 0px de alto (no se quita a los lectores de pantalla) |
| Texto mínimo (ayuda, error, contador, botón) | 12px |
| Área táctil (`pointer: coarse`, emulado a 320px) | Caja ≥ 44px incluso en `xs compact`; xl 52px; botón mostrar 44px de alto; sin desborde horizontal |
| Contenedor de 220px con etiqueta, ayuda y error largos | Todo salta de línea; sin desborde |
| Cambio de tema (superficies, texto, borde, error, foco, fuente serif, radio 0, borde 2px, foco 3px con separación 4px, transición 300ms, peso 700, tamaños 15/13px, espacio base 5) | Ninguna propiedad conserva el valor del tema anterior; alturas exactas; `soft` y `placeholder` cambian; foco 3px con separación 4px |
| Errores de consola | Ninguno |

## Decisiones de estilo

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | `soft` = relleno `surface-sunken` + línea inferior de `border-control`, sin borde en los otros lados | El relleno solo (1.08:1) no cumple 3:1 para delimitar el control (WCAG 1.4.11) |
| 2 | Error: borde de danger + trazo interior + marca ⚠ + texto | No depende solo del color (WCAG 1.4.1) y no cambia el tamaño de la caja |
| 3 | Hover: el borde pasa a `text-muted`, solo con `hover: hover`, y no en deshabilitado, solo lectura ni inválido | Señal sutil sin tokens nuevos |
| 4 | `readonly`: fondo `surface-sunken` y borde discontinuo; el texto conserva su color | Se distingue de `disabled` (texto y etiqueta atenuados, borde `border-strong`) sin perder legibilidad |
| 5 | `color` cambia solo `--_focus` | Contrato: solo foco y borde en foco |

## Hallazgos para lima

| # | Hallazgo | Severidad | Propuesta |
| --- | --- | --- | --- |
| 1 | El contrato no dice **qué contiene** el botón mostrar/ocultar (`g-input__toggle`). Grana no trae iconos y el nombre accesible ya está en `aria-label` | Media | El botón muestra como texto visible la propia etiqueta (`showPasswordLabel` / `hidePasswordLabel`), sin icono ni slot nuevo. El CSS ya está listo para texto. **Resuelto por lima** (`design/contracts/input.md`, hallazgo 11) |
| 2 | Con `pointer: coarse` la caja mide 44px, pero el texto sigue a 14px (`body-sm`); iOS Safari amplía la página al enfocar un campo con menos de 16px | Baja | Decidir si `size` `md` en táctil pasa a `body` (16px), o se documenta como limitación. **Resuelto por lima:** límite conocido (hallazgo 12) |

## No verificado

- `prefers-reduced-motion` y `forced-colors`: reglas escritas, no emuladas.
- Hover real con puntero (las reglas están dentro de `@media (hover: hover)`); `:hover` no se pudo forzar.
- Estados con el `.vue` real: falta el componente de bruno.
- Lector de pantalla real: el ⚠ oculto con `content: … / ""` no se probó en Firefox anterior a 128 (allí no se muestra, pero tampoco se lee).
- Tema oscuro: no existe aún.

---

## Ampliación: botón de acción (slot `action`)

**Contrato:** `design/contracts/input.md`, sección "Botón de acción" (DECISIONS.md #33 y #34). Banco: `design/lab/input/estilo-banco.html` (ahora carga también `GBtn.css` y usa `.g-input__row`).

### Verificación en Chromium

| Prueba | Resultado |
| --- | --- |
| Acoplamiento: 8 combinaciones (texto, solo icono, inválido, deshabilitado, carga, `outline`, `soft`, píldora) | Botón pegado a la caja (bordes solapados exactamente 1 borde), misma altura, mismo borde superior |
| Altura caja = botón: 5 tamaños × 3 densidades | Iguales en las 15 combinaciones |
| Esquinas | Caja: exteriores redondeadas, interiores rectas. Botón: interiores rectas y exteriores con **el radio del campo** (no el del botón); en píldora, 999px |
| Foco con Tab (campo → botón) | Anillo del botón visible, por encima de la caja (`z-index: 1`); el del campo, igual con su caja |
| Tema distinto (radio `sm` 14px, borde 2px, espacio base 5, `brand` azul marino) | Esquinas exteriores de caja y botón a 14px, interiores a 0; solapamiento de 2px (= borde); ambas alturas 45px; el botón toma el color de la marca |
| Contenedor estrecho de 220px | Botón con texto: debajo, a ancho completo (220px) con 8px de separación, todas las esquinas redondeadas. Botón solo icono: sigue a la derecha (185 + 36px), cuadrado |
| Táctil (`pointer: coarse`, 320px) | Acoplado: botón de 44px de alto (se estira a la altura de la caja); sin desborde. Apilado: el botón mide su alto normal y su zona táctil de 44px la da `GBtn` |
| Literales en `GInput.css` | Ningún color; medidas: `24px`, `44px` y el umbral `300px` de la consulta de contenedor (excepción de DECISIONS.md #34) |

### Hallazgos propios (corregidos durante la ampliación)

1. **Ancho por defecto.** El campo mide 240px por defecto (menos que el umbral de 300px), así que con la consulta sobre `.g-input` un botón con texto **siempre** se apilaba. Con `g-input--has-action`, el ancho por defecto pasa a 360px (`--g-space-1` × 90); si el contenedor es más estrecho, el campo ocupa el 100% y se apila por debajo de 300px.
2. **Colisión de nombres.** `GBtn` define su propio `--_radius`; para que el botón use el radio del campo, `GInput` lo copia en `--_field-radius` y el botón lo lee de ahí.

### Decisiones

| # | Decisión | Por qué |
| --- | --- | --- |
| 1 | El anillo del botón se deja hacia **fuera** (el de `GBtn`), con `z-index: 1`, en vez de hacia dentro como en el prototipo de kiwi | Un anillo hacia dentro sobre un botón sólido oscuro no contrasta (el prototipo lo resolvía con un relleno blanco); el anillo exterior sigue visible sobre la caja porque el elemento enfocado queda por encima |
| 2 | El botón toma las esquinas exteriores del **campo**, no las suyas | Conjunto visual coherente: caja y botón forman un solo rectángulo redondeado |

### No verificado

- `prefers-reduced-motion` y `forced-colors` con acción: no cambian respecto a lo ya auditado; el botón hereda las reglas de `GBtn`.
- El slot real de Vue (`GInput.vue` aún no lo implementa): bruno.
- Hover del botón en el conjunto y contraste de un botón `soft`/`outline` sobre el fondo del tema.

---

## Ajuste de foco (comentario del usuario)

**Problema:** el foco se sentía tosco y, con botón de acción, el botón quedaba fuera del anillo. Causa: un anillo separado 2px del borde **y** el borde también en color de foco (dos líneas), que terminaba donde empezaba el botón.

**Cambio en `GInput.css`:**
- El anillo va en la **fila** (`.g-input__row`), no en la caja: rodea caja y botón cuando el foco está en el campo. Sin acción, la fila es la caja.
- **Pegado al borde:** `outline-offset: calc(var(--g-border-width) * -1)` con `outline` de `--g-focus-width`: una sola línea del grosor del token, sin hueco.
- **Transición** de `outline-color` en `--g-duration-fast`; la base transparente solo existe fuera de `forced-colors` (allí un contorno transparente se volvería visible).
- El botón de acción enfocado usa el mismo trazo pegado (no el separado de `GBtn`).
- Apilado (botón debajo): el anillo vuelve a rodear solo la caja. Solo icono: sigue rodeando el conjunto.
- `--g-focus-offset` ya no lo lee la caja (solo el botón mostrar/ocultar).

**Verificado en Chromium:** sin acción, con acción, `soft`, inválido (el borde de error queda dentro del anillo), apilado con texto (anillo solo en la caja) y apilado con icono (anillo del conjunto). Con tema (borde 2px, foco 3px violeta, radio 12px): anillo de 3px, `offset -2px`, esquinas de 12px. Botón de acción enfocado: anillo de 2px pegado, `z-index: 1`.
**No verificado:** `forced-colors` real (el bloque cambia el color a `Highlight`; la base transparente no aplica en ese modo por diseño).


---

## Personalidad (plan 018; DECISIONS.md #299 y #304; `input.md` «Personalidad», `form.md` §2 «Rechazo al enviar»)

**Qué le da personalidad:** el campo **habla con el cuerpo**, pero solo cuando importa. El mensaje no aparece pegado de golpe bajo la caja: **sale de ella** (baja `--g-space-1` mientras se funde), así el ojo va del campo a su mensaje. Y el «no» del formulario es un gesto físico de una sola vez: al enviar con errores, **cada campo que bloquea niega con la cabeza** (una sacudida horizontal, decreciente, ≤ 4px), incluidos los que quedan fuera del foco. Nunca al escribir, al salir del campo ni al montar: el campo no regaña mientras se trabaja, solo responde al envío.

### I1 · el mensaje sale del campo (`GInput.css`, bloque «Personalidad»)

- **Transición, no keyframes** (decisión del encargo, medida por bruno y comprobada aquí): estado de partida en `.g-input__message:empty` (`opacity: 0`; sin movimiento reducido además `translate: 0 calc(var(--g-space-1) * -1)`) y `transition` de `opacity` y `translate` (`--g-duration-press`, `--g-ease-out`) **solo bajo `.g-input.is-ready`**. Por qué no keyframes condicionadas: se reproducen al llegar `is-ready` si el campo monta con error, y cambiar la duración desde 0s las reanuda a medias. Con la transición, al llegar `is-ready` no cambia ningún valor (no hay transición), al pasar de vacía a con texto sí, y al cambiar el texto o el tipo con la región llena no cambia ningún valor (no se repite). `:empty` reconoce la región vacía porque Vue solo deja un comentario.
- **Para lima:** `input.md` «Personalidad» I1 dice «keyframes de nombre `g-*`» y #299 (5) cita «el mensaje que aparece» como ejemplo de keyframes. La implementación es una transición; conviene ajustar la frase del contrato y el ejemplo de #299 (5) (keyframes quedan para la sacudida y el giro de carga). La salida (texto → vacío) también transiciona, pero sin contenido no se ve; el hueco (`margin`) aparece y se va en un cuadro, como antes.
- **Movimiento reducido:** solo fundido, `opacity var(--g-duration-fast) linear` (patrón único de #299 (3)), sin desplazamiento.

### I2 · un solo aviso al enviar (`GInput.css`; extendido a `GTextarea.css` y `GSelect.css`)

- `.g-input.is-rejected .g-input__row { animation: g-reject-shake var(--g-duration-slow) linear }` dentro de `prefers-reduced-motion: no-preference`. Se mueve la fila (caja + acción), así el anillo de foco del campo enfocado va con ella. Keyframes `g-reject-shake`: `0 · −1 · 0.75 · −0.5 · 0.25 · 0 × --g-space-1` en `0 · 16 · 36 · 56 · 76 · 100 %` (constantes de coreografía de #299 (8)). `linear` entre puntos, como el prototipo medido por kiwi.
- **`GTextarea` y `GSelect`:** estructura equivalente trivial (la caja `__control` lleva el anillo de foco y no tiene otro `translate`), así que llevan la misma regla con keyframes propias `g-reject-shake-textarea` y `g-reject-shake-select` (prefijo `g-reject`, el que filtra bruno; cada archivo se sostiene solo). La lista de `GSelect` no es hija de la caja: no se mueve.
- **Movimiento reducido:** nada. La clase se pone igual (sin efecto visible); sin animación no hay `animationend`, así que se retira con el siguiente `input`/`change` o con el siguiente envío. El error ya es borde doble, icono y texto.
- **RTL:** la sacudida empieza hacia la izquierda física en los dos sentidos; no transmite dirección, así que no se refleja.
- **`forced-colors`:** sin cambios (`translate` y `opacity` no tocan colores del sistema).

### Mediciones (componente real del UMD; `design/lab/theme-playground/tests/personalidad-input.spec.mjs`, 10 pruebas × 3 motores, 30/30)

| Medida | Chromium | Firefox | WebKit | Criterio (kiwi) |
| --- | --- | --- | --- | --- |
| I2 desplazamiento máximo (muestreo determinista cada 2ms, `space-1` = 4px) | 3,958px | 3,958px | 3,958px | ≤ `space × 1` (kiwi 3,47px en tiempo real) |
| I2 picos en 16 · 36 · 56 · 76 % | 3,96 · 2,94 · 1,96 · 0,97 | igual | igual | decreciente |
| I2 cambios de sentido / final | 3 / 0px | 3 / 0px | 3 / 0px | 3 y vuelta a 0 |
| I2 duración / iteraciones | 240ms / 1 | 240ms / 1 | 240ms / 1 | `--g-duration-slow`, una vez |
| I2 en `GTextarea` y `GSelect` | mismas cifras | mismas | mismas | — |
| I2 retirada: `animationend` real `g-reject…` con la clase aún puesta; la clase dura ≥ 230ms | sí | sí | sí | por fin de animación, no por temporizador |
| I2 escribir y salir del campo (tras un envío) | 0 `animationstart` | 0 | 0 | 0 animaciones |
| I2 segundo envío | se repite | se repite | se repite | — |
| I2 movimiento reducido | clase presente, 0 animaciones, `translate` 0 | igual | igual | sin vaivén |
| I1 al aparecer | `opacity` + `translate` 160ms; −4 → 0px; 8 muestras intermedias de 10ms; monótono | igual | igual | cuadros intermedios de −space a 0 |
| I1 cambiar el texto con la región llena | 0 transiciones | 0 | 0 | no se repite |
| I1 error al montar (registro desde antes de cargar) | 0 `animationstart`/`transitionrun` en el mensaje, también al llegar `is-ready` | igual | igual | 0 animaciones al montar |
| I1 movimiento reducido | solo `opacity` 120ms, `translate` 0 | igual | igual | solo fundido |

Antes del CSS (mismo spec, Chromium): 7 de 10 fallan; pasan solo las tres negativas (montar con error, cambiar texto, reducido de I2), como se espera. Las medidas de la sacudida pausan la animación real en la microtarea en que llega `is-rejected` (MutationObserver) y recorren su tiempo: no dependen de la carga de la máquina. Contraste, tamaños y foco no cambian (solo `opacity`/`translate` temporales; el anillo viaja con la fila).

### Pendientes (extensión de coco, sin bloquear)

- **I2 en `GCheckbox`, `GSwitch`, `GDatePicker` y los grupos** (`GCheckboxGroup`, `GRadioGroup`, `GFieldGroup`, `GInputGroup`): ya reciben `is-rejected` (bruno, `b8381f2`) pero no tienen CSS. Cada uno necesita decidir qué se mueve (en grupos, ¿la lista de opciones o el conjunto de partes?, una pregunta = un gesto) y medirlo; no es trivial en esta tanda.
- **I1 en `GTextarea`, `GSelect` y demás campos:** requiere `is-ready` en su raíz (bruno); hoy solo `GInput` la tiene.
- **No verificado:** `forced-colors` real, lector de pantalla (la región viva no cambia, pero no se escuchó), Safari real y táctil real.
