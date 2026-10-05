# GFileField · estilo (coco)

> Paso 3 del flujo. Contrato: `design/contracts/file-field.md` (lima, #366 a #378; `tokens.md` §35). Estructura: `r01/` (base) y `r02/` (kiwi; concepto A en `r02/index.html?c=A`). CSS: `packages/vue/src/components/GFileField/GFileField.css`. Banco: `estilo-banco.html` (componentes reales de `dist/` + marcado del contrato a mano; el `GProgress` de la ficha va escrito a mano con el marcado de `showLabel: false`, que aún no está en `dist/`). Verificación: `GRANA_PW_PORT=4211 node design/lab/file-field/estilo-verificar.mjs` (requiere `dist/`; con `GRANA_DIST=<ruta relativa>` usa otra copia sin tocar la del repositorio).

## Qué le da personalidad

Todo lo que distingue a A sale del contrato («Qué lo hace distinto»); el CSS lo hace visible sin un solo rectángulo reservado para soltar:

1. **Un campo que mide lo que un campo.** Vacía, la caja es la de un `GInput` del mismo `size` y `density` (mismo `--_h`, mismo borde, mismo anillo pegado). El icono de «Adjuntar» empieza donde empieza el texto de un `GInput` vecino (relleno del campo menos el de la caja). La pista va **dentro** de la cara, separada por un filete corto (no un carácter), y cede antes que la cara.
2. **La ficha nace de «Adjuntar».** Al añadir por un gesto, la ficha aterriza escalando desde `0.86` con el **origen en el lado del final de la lectura** (derecha en LTR, izquierda en RTL): sale de la cara que la trajo, no del centro. `--g-duration-press` + `--g-ease-out`, sin muelle (#299, L24); medido: escala monótona 0,860 → 1,000, nunca > 1.
3. **La ficha es su barra.** El `GProgress` real es una capa detrás del contenido (sin carril, sin contorno, del tamaño de la ficha); su relleno pinta `accent-soft` y lleva un **frente de avance** nítido de doble grosor que avanza hacia el final de la lectura con el `translate` de `GProgress`. Se ve qué archivo va por dónde sin otra línea, y nada cambia de alto.
4. **Terminar subraya.** La subida terminada en esta sesión deja un **filo de éxito** bajo la ficha (`success-text`, doble grosor, sin tocar las esquinas), que entra con un fundido. Los guardados no lo llevan: se distingue lo que acabas de subir de lo que ya estaba.
5. **El error dice qué y qué pasó.** La ficha entera pasa a `danger-soft`; el nombre conserva el peso de título y el mensaje va en peso de texto, y **ceden a la par** (el mensaje el doble de rápido): `GSummary` trata el mensaje como identificador y, sin el reapunte, borraba el nombre del archivo.
6. **La página despierta entera.** Todos los destinos aparecen a la vez con un fundido (despertar `--g-duration-press`, dormir `--g-duration-fast`), un poco mayores que su caja. Encima, el destino que admite **se enciende** (relleno sólido `accent`).
7. **Un solo archivo es valor + acción.** Sin `multiple`, la ficha llena la línea y «Cambiar archivo» queda al final, como el valor y la acción de un campo; con `multiple`, las fichas tienen todas el mismo ancho base y «Adjuntar» las sigue o baja a su línea.

**Afinado respecto del prototipo (`r02/concepts.css`, A):**

| Prototipo | Ahora | Por qué |
| --- | --- | --- |
| Aterrizaje con `--g-ease-spring` y `--g-duration-slow`, desde el centro | `--g-ease-out` + `--g-duration-press`, origen al final de la lectura | #376 / L24 (entrada sin muelle); el origen cuenta de dónde viene la ficha |
| Relleno de la ficha con `::before` y `--_p` | El `GProgress` real como capa, frente de avance en su relleno | #375 / L20: la semántica es lo que se ve |
| Lista con `display: contents` | La lista es su propio contenedor flexible | `display: contents` en `<ul>` ha perdido el rol de lista en motores aún en uso; con la lista propia, «Adjuntar» sigue a las fichas o baja a su línea |
| Destino `color-mix(accent-soft 88 %)`, borde `accent`, sobresaliente `space × 2` | `accent-soft` **sólido** (L25), borde `on-accent-soft`, sobresaliente `space × 1` acotado | Ver «Destino» |
| Despertar con escala `0.97` y muelle | Solo fundido | #376: sin escala (constante nueva sin necesidad) |
| Error con borde `danger-text` en la caja de destino «encima no admite» | Discontinuo, tono apagado | Contrato: no admite = discontinuo; encima, el borde sube de tono y el texto lo dice |
| Separador de la pista «·» | Filete corto de `border-strong` | Iconos y signos: nada de caracteres decorativos (como `GSummary`) |

## Constantes de diseño (derivadas de `space`; no son tokens)

| Constante | Valor | Dónde |
| --- | --- | --- |
| Alto de la ficha | `max(24px, --_h − space × 2)` (md 28 en 36; lg 36; xl 44; xs y sm, 24) | Una línea de fichas mide lo que la caja vacía; la caja reparte `(--_h − ficha) / 2 − borde` arriba y abajo (negativo → 0, como `GBtn`) |
| Relleno lateral de la caja | `space × 0.75` | La ficha casi toca el borde (radio `xs` dentro de `sm`) |
| Ancho base de una ficha (`multiple`) | `space × 52` (208px) | El del prototipo; es `inline-size` (no `flex-basis`) para que la lista mida lo que suman sus fichas |
| Suelo de la lista con un archivo | `min(100 %, space × 24)` (96px) | Lo mínimo que se conserva antes de que «Cambiar archivo» baje de línea |
| Ancho por defecto fuera de una fila | `min(100 %, space × 90)` | El de `GInput` con acción (`GInput.css`) |
| Sobresaliente del destino | En línea `min(space × 1, column-gap × 0.375)`; arriba y abajo `space × 1` | `0.375` = densidad `compact` (0,75) / 2: dos destinos vecinos de una `GFormRow` no se solapan **en ninguna densidad** (no depende de la densidad del campo); arriba llega al pie de la etiqueta sin taparla. Medido: 4px por lado, 4px entre vecinos en `compact` |
| Frente de avance y filo de éxito | `--g-border-width × 2` | Grosor visible a 3:1 |
| Escala de partida del aterrizaje | `0.86` | §29.6 (la del nacer de la isla) |
| `--g-form-min` | **62** | Medido (abajo) |

## Destino: sólido, no `color-mix` (L25)

`accent-soft` **sólido**: el texto del destino ya nombra el campo (no hace falta ver la caja debajo) y así el par `accent-soft` / `on-accent-soft` está garantizado por el tema sin una constante de mezcla.

| Apariencia | Clases | Forma (sin color) | Colores |
| --- | --- | --- | --- |
| Dormido | `__target` | No existe para la vista ni para el puntero (`opacity 0`, `visibility hidden`, `pointer-events none`) | — |
| Admite | `is-awake is-awake-ok` | Borde **sólido** + relleno **suave**; recibe el puntero | `accent-soft`, texto y borde `on-accent-soft` |
| Encima y admite | `+ is-over` | Borde sólido + relleno **sólido** | `accent` con `on-accent` (par garantizado) |
| No admite / lleno | `is-awake is-awake-no` | Borde **discontinuo**, relleno apagado | `surface-sunken`, texto `text-muted`, borde `border-control` |
| Encima y no admite | `+ is-over` | Discontinuo; el borde sube a `text-muted`; el texto lo dice («INE no admite…») | Idem |

**Desviación de la tabla de tokens (para lima):** el contrato pide `--g-color-accent` para el frente de avance y el borde del destino, y `--g-color-border-strong` para el discontinuo. Medido en los once temas generados: `accent` **no** llega a 3:1 en claro sobre la ficha ni sobre la página (spotify 1,15–1,29; amazon 1,88–2,14; stripe 2,34–2,64; linear 2,86); `on-accent-soft` (la tinta del par de `accent-soft`) da ≥ 4,51:1 contra el relleno, ≥ 4,74:1 contra la ficha y ≥ 4,86:1 contra la página en todos. `border-strong` es translúcido (≈ 1,5:1); `border-control` da 3,43:1 mínimo. Uso `on-accent-soft` y `border-control` (ya consumidos por el componente o por la caja). Igual en la cara de la variante `soft`: `accent-text` sobre `surface-sunken` baja a 4,19:1 (apple claro) y uso `on-accent-soft` (4,74:1 mínimo).

## `--g-form-min: 62` (medido)

Criterio: con un archivo y sin `multiple`, en `md`, la lista en su suelo (`space × 24`) y «Adjuntar archivo» **entero en la misma línea** (si no, la caja crece una línea junto a un `GInput` de una). Suma medida en los tres motores, Instrument Sans: borde 2 + relleno 6 + lista 96 + separación 4 + «Adjuntar archivo» 137 = **245px = space × 61,3 → 62**. Barrido de una `GFormRow` (`GInput` + campo) de 900 a 300px de 4 en 4: mientras comparten línea, la caja tiene una línea y el alto de la del `GInput` vecino en todos los anchos; la fila se parte a 552px (con 60 se quedaba sin sitio entre 552 y 536: por eso 62 y no 60). Con `style="--g-form-min: 80"` del consumidor, la fila se parte antes (696px). Depende de la fuente y del idioma de `labels.add`: el consumidor la sube con `style`.

## Mediciones (Chromium, Firefox, WebKit; 2683/2683)

- **Δ0 en una `GFormRow` con `GInput`** (5 tamaños × 3 densidades, tema por defecto y Tema de prueba con `space` 5 y borde 2px): caja vacía Δtop 0 y Δalto 0; etiqueta Δtop 0; con un archivo, Δtop 0 y alto = `max(--_h, 24 + 2 × borde)`. Donde la ficha toca su piso de 24px (xs, sm/comfortable, sm/compact y xs/compact), la caja con un archivo mide 26 frente a 24–24,5 de la de `GInput` (28 frente a 24–26,25 en el Tema de prueba): permitido por el contrato («Disposición»), y el `GInput` vecino **se estira** a 26 (ver Pendientes).
- **Ficha:** Δ0 entre `ready`, `queued`, `uploading`, `done`, `error` y guardado en los cinco tamaños; alto xs 24 · sm 24 · md 28 · lg 36 · xl 44 (Tema de prueba 24 · 27 · 37 · 47 · 57); botones ≥ 24 × 24. Con `pointer: coarse` (Chromium, `isMobile`): caja, ficha y botones ≥ 44px.
- **Contraste** (peor caso; Chromium en claro, oscuro, Tema de prueba y los once temas generados claro y oscuro; Firefox y WebKit en por defecto claro y oscuro y spotify claro y oscuro): cara 4,52 · pista y estado 6,99 · nombre 13,36 · tamaño 5,94 · subiendo sobre el relleno: nombre 13,36, tamaño 5,94 · **frente de avance** 4,51 contra el relleno y 4,74 contra la ficha · **filo de éxito** 4,37 · **error**: nombre 4,53, mensaje 4,53, iconos 4,27 · Quitar 4,36 · soft: cara 4,74 · solo lectura: cara 5,57 · aviso 4,66 · mensajes 4,51 / 4,53 / 4,60 · borde de la caja 3,43 · borde con error 4,51 · foco 4,52 · destino: admite 4,51 (borde 4,86), encima 4,51 (borde 4,86), no admite 5,94 (borde 3,43).
- **Destino:** mayor que la caja (4px por lado), Δ0 de todas las cajas, raíces y pies al despertar, vecinos sin solape en `compact` (4px entre ellos), puntero solo con `is-awake-ok`, firmas sin color sólido/suave · sólido/sólido · discontinuo/apagado, despertar 160ms y dormir 120ms.
- **Foco:** anillo de `--g-focus-width` (2px) en `--g-color-focus` sobre la caja con el control en `:focus-visible`.
- **RTL y 320px:** sin desborde en LTR ni en RTL (contando solo lo que se pinta); el relleno llega al 42 % desde el inicio de la lectura y el frente está en el borde final (derecho en LTR, izquierdo en RTL).
- **Movimiento:** aterrizaje `g-file-field-land` con escalas intermedias, termina en 1 sin rebase y la clase se retira; sacudida `g-reject-file-field` y clase retirada. Con `reduce`: la ficha solo se funde (`g-file-field-land-fade`, sin escala), sin sacudida, el mensaje no se desplaza.
- **`forced-colors` emulado** (los tres motores): anillo `Highlight`; ficha con contorno `CanvasText` (discontinuo en error, sin layout); progreso sin relleno, con frente y línea inferior `Highlight`; filo `CanvasText`; destino admite con borde `Highlight`, encima `Highlight`/`HighlightText`, no admite discontinuo; la tesela del icono pasa a `Canvas` (`GIcon` conserva el color del padre y el trazo desaparecía sobre la superficie clara); con el destino despierto, lo de debajo se funde a 0 (Chromium pintaba la placa de lectura de «Adjuntar» por encima del destino encendido).
- **Consola** limpia.

## Clases y atributos que el CSS espera del `.vue` (bruno)

Las del contrato («Clases y datos»), más:

- `is-multiple` en la raíz con `multiple` (cambia la disposición: sin ella, una ficha que llena la línea).
- `data-state` en cada `__chip` y `data-stored` (atributo vacío) en los guardados; el filo de éxito sale de `[data-state="done"]:not([data-stored])`.
- El mensaje con las partes de `GInput`: `g-file-field__message-type` (prefijo oculto) y `g-file-field__message-icon` en el `GIcon` (no figuran en la tabla del contrato).
- `g-file-field__add-hint` **solo** vacío y editable: su presencia oculta a la vista la pista del pie (`:has`).
- El `GProgress` de la ficha con `class="g-file-field__progress"`, `showLabel: false` y `showValue: false`: sin `g-progress__row` (si existiera, su texto quedaría dentro de la capa).
- `is-landing` retirada en `animationend`/`animationcancel` cuyo nombre empiece por `g-file-field-land` (con `reduce` también hay animación: `g-file-field-land-fade`), o en el acto si `animationName` es `none`.
- `is-ready` tras montar (las transiciones del destino y del mensaje solo existen con ella).
- La lista lleva `list-style: none`: VoiceOver deja de anunciar como lista un `<ul>` sin viñetas; con `role="list"` explícito se conserva.

## Pendientes

- **coco (fuera de este encargo):** el `GInput` vecino (y `GSelect`, `GInputGroup`, `GDatePicker`, que tampoco ponen `align-self` en la pista de la caja) **se estira** en una `GFormRow` cuando la caja de archivos es más alta: medido 156px de `GInput` junto a un campo con cuatro fichas en dos líneas (`tall-in` en el banco). Propuesta: `align-self: start` en `.g-form-row > .g-input > .g-input__row` y en sus equivalentes (como `GRadioGroup` inline/segmentado y este campo). No lo toco aquí (archivos de otros componentes).
- **coco:** `GSummary` en `forced-colors`: la tesela del icono (`surface-sunken`) no se fuerza (`GIcon` con `preserve-parent-color`) y el trazo `CanvasText` puede desaparecer; aquí lo corrijo en el anfitrión.
- **lima:** tabla de tokens de `file-field.md` y `tokens.md` §35 (frente y borde del destino `on-accent-soft`, discontinuo `border-control`, cara `soft` `on-accent-soft`); el sobresaliente del destino es `space × 1` acotado (no `space × 2`); `--g-form-min: 62`; añadir `is-multiple`, `__message-type` y `__message-icon` a «Clases y datos».
- **bruno:** `showLabel` en `GProgress`; `role="list"` en `__list`; lo de «Clases y atributos».
- **Auditoría (paso 5)** sobre el componente real, con estos mismos casos.

## No verificado

Lector de pantalla real, arrastre real del sistema (el banco simula las clases), `forced-colors` real (solo emulado), táctil real (solo `isMobile` de Chromium), zoom de texto al 200 %, el componente real (aún no existe).
