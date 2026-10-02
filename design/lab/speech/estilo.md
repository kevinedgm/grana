# Entrega de coco · captura de voz, Fase 1 (pill, anfitrión, panel, hoja, transcript, disparador y nota)

**Archivos:** `packages/vue/src/components/GSpeechPill/GSpeechPill.css` (pill colocada y flotante, medidor), `GSpeechHost/GSpeechHost.css` (raíz en la capa superior, canales, envoltura flotante, panel, onda, transcript, hoja móvil), `GSpeechTrigger/GSpeechTrigger.css` (disparador y nota). El contrato no fija carpetas: una por componente público, como `GWidgetConfig` o `GFormRow` (bruno pone ahí sus `.vue`; si prefiere otra, mueve el CSS sin cambiarlo). **Sin tokens nuevos** y sin cambios en `defaults.css` (`tokens.md` §24, #223).
**Contratos:** `design/contracts/speech.md` (§6, §7, §8, §12 a §14, §17), `toast.md` «Convivencia con la captura de voz» (#225), `tokens.md` §23 y §24, `icons.md` v0.4; DECISIONS #207 a #226.
**Banco:** `design/lab/speech/estilo-banco.html` — marcado exacto del contrato con el CSS real registrado en `grana.components` después de `components.css` (como lo hará bruno) y los componentes reales desde `dist/grana.umd.js` (`GBtn`, `GIcon` con los iconos nuevos registrados por `createIcons`, `GSelect`, `GCheckbox`, `GProgress`, `GTextarea`, `GDialog`, `GToaster`). Sesión viva (pill en la cabecera y flotante de respaldo, panel anclado, hoja bajo `space × 130`, traslado al `GDialog` modal, reserva del borde para `GToaster`) y galerías estáticas: los 13 estados en pill colocada y flotante, 10 paneles (confirmado y provisional, privacidad local/dispositivo/externa, preparación con consentimiento, reconexión con señal plana y fragmento fallido, error fatal, denegado sin captura, procesando, completada con confirmación de descarte, movimiento reducido, «Ocultar actividad») y 10 disparadores con su nota. Parámetros `?dark=1 ?rtl=1 ?theme=<generado> ?rm=1 ?still=1 ?status= ?mode= ?open=1 ?only=live`. Requiere `npm run build`.
**Verificación:** `node design/lab/speech/estilo-verificar.mjs` (Playwright de `design/lab/theme-playground`, servidor propio en puerto libre; `--engines=`, `--verbose`).

## Carácter

Discreto y de confianza: superficies `floating` neutras, sin rojo para grabar. El estado se lee siempre por **icono + texto**; el color acompaña y cada familia de estado tiene además su **forma**:

| Estado | Pill (y panel) | Forma |
| --- | --- | --- |
| Captura viva (`listening`, `speech`, `transcribing`) | **Lámpara**: disco relleno del rol **`active`** con el icono en `on-accent` (par de contraste garantizado por el motor); fondo `accent-soft`; borde doble en `on-accent-soft`; medidor en `on-accent-soft` | disco relleno + borde del doble de grosor |
| `reconnecting` con captura | Icono `warning-text` (sin lámpara: manda el aviso), tinte y borde doble como la captura | borde doble |
| `reconnecting` retenida, `requesting`, `ready`, `paused`, `processing` | Icono `text-muted`, borde `border-strong` 1px (decorativo; colocada) | — |
| `denied`, `unavailable`, `error` (`is-problem`) | Icono `danger-text`, borde doble **discontinuo** `danger-text` | discontinuo |
| `completed` | Icono `success-text` | — |

`listening` usa el punto (`circle` relleno) a `space × 2.5` dentro de la lámpara de `space × 5` (más grande se leía como un anillo). En el panel, el icono de estado sigue las mismas reglas (`__status-icon`). El **foco** nunca se confunde con el énfasis: dentro de la pill el anillo es **interior** al botón enfocado (como `GSidebar`), un borde más adentro, y queda a ≥ 2px del borde vivo; el borde vivo rodea toda la pill y va pegado al tinte, el anillo solo el botón y sin relleno. En el disparador vivo el contorno es **interior** (`box-shadow inset`) y el foco de `GBtn` es exterior con hueco.

## Valores fijados (constantes derivadas de `space`, no tokens)

| Qué | Valor | Con `space` 4 |
| --- | --- | --- |
| Pill: relleno / alto | `space × 0.5` (el borde doble resta del relleno: no cambia de tamaño) / `GBtn sm` + relleno + borde | 2px / **34px** |
| Lámpara / icono quieto / punto de `listening` / glifo en lámpara | `space × 5` / `× 4` / `× 2.5` / `× 3.5` | 20 / 16 / 10 / 14px |
| Medidor de la pill | 4 barras de `space × 0.75`, separación `× 0.5`, alto `× 4`, mínimo 20 % | |
| Margen al borde (flotante) | `space × 4`; `× 2` con `data-mobile`; `max(margen, env(safe-area-inset-*)) + --_speech-offset-*`; inicio/fin de `safe-area` se intercambian con `:dir(rtl)` | 16 / 8px |
| Panel: ancho | `min(space × 110, 100vw − space × 8)` (440px de kiwi) | 440px |
| Panel: relleno en línea / separación entre partes | `space × 4` / `space × 3` (`__sub` pegado al estado: `space × 1`) | |
| Onda | alto `space × 8`; barras de `space × 0.75`, separación `× 0.5`, mínimo 8 %; 32 barras (las del prototipo) | |
| Onda discreta (movimiento reducido) | 5 segmentos de alto `space × 2`, máx. `space × 8` de ancho: encendido relleno, apagado solo contorno | |
| Lista del transcript | alto mínimo `space × 20`; crece con el panel hasta `--_speech-max-block`; la lista se desplaza | 80px |
| Hoja | alto máximo `88dvh`, a sangre por abajo, `radius-xl` arriba, `--g-shadow-3` (capa modal, #100), relleno inferior `max(space × 4, safe-area-inset-bottom)` | |
| Disparador | fila bajo el campo a `space × 2`; botón y nota en línea, la nota baja si no cabe (base `space × 40`) | |

**Tipografía** (§23.4): título del panel **body 16/24, 600** (como `GCard`/`GFormSection`: panel compacto, no un diálogo), modo body-sm `muted`, estado body-sm 600, secundarios body-sm `muted`, privacidad caption 12/16 `muted` con icono de 16px, título del transcript body-sm 600, metadatos de fragmento caption `muted` con el hablante en 600 `text`, texto del fragmento body-sm `text`; **provisional en cursiva y `text-muted`** (≥ 4.5:1 medido); nota del dictado body-sm `muted` (es contenido, no ayuda de campo). Duraciones con cifras tabulares.

## Botones (bruno aplica estas props de `GBtn`)

| Dónde | Props |
| --- | --- |
| Pill: principal | `variant="ghost" color="neutral" size="sm"`; icono, texto, `__sr`, medidor y chevron en el hueco por defecto (dentro de `g-btn__label`, que el CSS vuelve fila) |
| Pill: alternar / finalizar | `icon variant="ghost" color="neutral" size="sm"`; `pause`/`mic`/`rotate-ccw` · `square` **relleno** |
| Panel: cerrar | `icon variant="ghost" color="neutral" size="sm"`, `x` |
| Panel: principal (Empezar a grabar, Finalizar en captura/pausa/reconexión, Cerrar sesión, Reanudar o Reintentar en un problema) | `size="md"` sólido por defecto (`brand`), con su icono en `prepend` |
| Panel: secundarias (Pausar, Reanudar en pausa, Cancelar, Finalizar en un problema) | `size="md" variant="outline" color="neutral"` (el CSS las pasa a `text` + `border-control`, como la acción de `GToast`) |
| Panel: Descartar, Cerrar (`dismiss`) | `size="md" variant="ghost" color="neutral"`, sin icono |
| Confirmación de descarte | Cancelar `outline neutral` · Sí, descartar `solid danger` (§17.7: destructivo), `size="md"` |
| Ocultar actividad | `size="sm" variant="ghost" color="neutral"` con `aria-pressed` (pulsado: relleno neutro + borde de control) |
| Reintentar fragmento · Insertar · Deshacer dictado | `size="sm" variant="outline" color="neutral"` |
| `GProgress` del procesamiento | `color="neutral"` (tono neutro del estado; un `brand` pálido no lo rompe) |
| Disparador de dictado | `icon variant="ghost" color="neutral"` + `size`/`density` de la prop |
| Disparador de conversación | `variant="outline" color="neutral"` con el icono en `prepend` |

## Movimiento

- Pill: color de fondo y borde con `--g-duration-fast`; chevron gira media vuelta con `aria-expanded` (`--g-duration-press`); medidor con `scale` (sin recalcular la disposición) y transición lineal `--g-duration-fast` (≈ un fotograma de 100 ms).
- Flotante y panel: entrada por `@starting-style` con fundido y un paso corto desde su borde (`space × 2` la flotante, `space × 1` el panel, `space × 6` la hoja). Al trasladarse al modal se repite el fundido (corto, aceptable).
- `loader-circle` gira con `is-spinning` (`--g-duration-spin`) en la pill y en `__status-icon`.
- **Movimiento reducido** (`prefers-reduced-motion` y `data-reduced-motion` en la raíz): solo fundido; sin giro; medidor con barras altas (`data-on`) o mínimas, sin escala continua; onda de 5 segmentos rellenos o de contorno, sin historial. **«Ocultar actividad»** quita onda y medidor; estado y duración siguen (verificado).

## Decisiones y desviaciones

1. **El borde vivo no es `active`.** Con un acento pálido (`spotify` `#A7F3C1`: 1.4:1 sobre blanco; `amazon` `#FF9900`: 2.1:1) `active` no llega a 3:1 como trazo sobre la superficie. Por eso `active` va donde su par lo garantiza (**la lámpara**, con `on-accent` dentro) y los trazos usan la familia del acento con contraste propio: borde y medidor sobre el tinte en **`on-accent-soft`**, onda sobre la superficie en **`accent-text`**. En el tema por defecto los tres son el mismo azul. Mínimo medido del borde vivo: 4.51 (dentro y fuera).
2. **Estado del panel**: el CSS necesita `data-status`, `is-live` e `is-problem` en `.g-speech-panel` (mismos valores que la pill; §14 no los lista).
3. **Línea de aviso en `__sub`** (señal plana): `is-warning` en su elemento → `warning-text`.
4. **Mensaje fatal en `__error`**: un hijo de `__error` que **no** sea `__issue`, con el título como primer hijo (icono `circle-alert` + texto) y el texto compuesto después. Marca de inicio **sólida** `danger-text` de `space × 1`, el lenguaje de mensajes de `GToast`/`GCard`. Los `__issue` llevan marca **discontinua** `warning-text` de 2 bordes; el fragmento `is-failed` igual. (El discontinuo de la pill es su señal de problema; en los mensajes sigue la convención de la librería: sólido error, discontinuo aviso.)
5. **Textos ocultos nuevos**: `g-speech-panel__sr` (prefijo «Duración:» en `__time` del panel) y `g-speech-trigger__sr` (prefijo «Texto provisional:» de la nota). En el transcript, `g-speech-segment__sr` (ya en §14).
6. **Coordenadas del panel**: `--_speech-x`, `--_speech-y` (físicas, `left`/`top`, de `placeBlock`) y `--_speech-max-block`, declaradas con valor neutro. El panel también se desplaza entero si no cabe (zoom 200 %); la lista del transcript es su propio contenedor de desplazamiento (`tabindex="0"` para teclado; anillo interior).
7. **Vacío del transcript**: un `<p>` dentro de `__transcript` (en `muted`) en lugar de una lista vacía.
8. **`__confirm`** sirve como parte del panel o dentro de `__controls` (ocupa su fila).
9. **`is-spinning` también en `__status-icon`** del panel.
10. **Envoltura flotante**: la `GSurface floating` da la sombra y el radio `pill`, sin relleno ni borde propio (`border-style: none`, también en colores forzados); el borde de estado lo pinta la pill.
11. **Pill estrecha**: el texto del estado se recorta con puntos suspensivos; con alternar y finalizar la pill cabe hasta ~160px (`space × 40`) y por debajo desborda (medido: `listening`, `denied` y `reconnecting · grabando` a 160 bien, a 120 desbordan). La flotante tiene siempre el ancho del visor menos el margen; la ranura de cabecera la pone la aplicación.
12. **Táctil**: con `pointer: coarse` la separación de la pill sube a `space × 2` y «Finalizar» suma otro `space × 2`: las áreas de 44px de dos botones de icono seguidos no se pisan (verificado).

## Verificación (Playwright; Chromium, Firefox y WebKit; movimiento reducido al medir)

`node design/lab/speech/estilo-verificar.mjs`: **47 070 / 47 070** comprobaciones correctas (Chromium 30 433, Firefox 8 318, WebKit 8 319).

Contraste **compuesto** sobre el fondo efectivo de cada pieza de la página (galerías + sesión viva con el panel abierto), en los estados de sesión `listening`, `reconnecting` y `error`. Temas: **defecto** y los **10 generados** (`amazon`, `apple`, `caracol-purpura`, `github`, `grana`, `linear`, `lustre`, `medium`, `notion`, `spotify`) en claro y oscuro en Chromium; defecto, `spotify` (acento pálido) y `lustre` en Firefox y WebKit.

| Medida (umbral) | Mínimo en todos los temas y motores | Dónde |
| --- | --- | --- |
| Texto de la pill (4.5) | 4.51 | `grana` claro, disparador vivo (`on-accent-soft` sobre `accent-soft`) |
| Duración, chevron, iconos alternar/finalizar (4.5 / 3) | 6.49 | `linear` claro |
| Icono de estado de la pill (3) | 4.08 | `medium` oscuro, `reconnecting` con captura (`warning-text` sobre el tinte) |
| Lámpara: icono sobre `active` (3) | 4.51 | `apple` claro |
| Medidor (3) / onda viva (3) | 4.51 / 4.52 | `grana` claro / `apple` claro |
| Borde de estado (vivo o problema) fuera / borde vivo sobre el tinte (3) | 4.51 / 4.51 | `linear` oscuro (`denied`) / `grana` claro |
| Borde de problema, marca de error (3) | 4.51 | `linear` oscuro |
| Marca de aviso, icono de fallo (3) | 4.53 | `linear` oscuro |
| Contorno del disparador vivo fuera / tinte (3) | 4.86 / 4.51 | |
| Título, estado, confirmado, hablante, error (4.5) | 15.2 | |
| Modo, privacidad, hora, ficha, **provisional** (panel y nota) (4.5) | 7.38 | `spotify` claro |
| Secundario / señal plana (4.5) | 4.53 | `linear` oscuro |
| Botones del panel: texto (4.5) / borde `outline` (3) | 4.62 / 3.19 | defecto oscuro / confirmación sobre `surface-sunken` |
| Borde de la ficha «provisional» (3) | 3.43 | `spotify` claro |

Además, en los tres motores:
- **Foco frente a énfasis**: anillo sólido de 2px, interior (`outline-offset` negativo), a ≥ 2px del borde vivo; borde vivo de 2px sólido alrededor de toda la pill; el anillo solo en el botón enfocado.
- **Objetivos**: todos los `GBtn` de pill, panel y disparadores ≥ 24px (área `::after`); pill de **34px**. Con `pointer: coarse` (Chromium y WebKit con `hasTouch`): áreas ≥ 44px y sin pisarse en la pill.
- **Movimiento reducido**: sin giro; panel solo con fundido; onda de 5 segmentos (relleno / contorno); medidor discreto. «Ocultar actividad» quita onda y medidor y deja estado y duración.
- **Modal (`GDialog` real)**: anfitrión dentro del `<dialog>` abierto como popover; flotante visible y pulsable (`elementFromPoint`); el panel se abre dentro y encima con el foco en el título; Esc lo cierra y el diálogo sigue abierto; foco visible en la flotante dentro del modal.
- **320×640**: sin desbordamiento; pill de cabecera dentro; la flotante abajo al centro dentro del visor; **un aviso de `GToaster` queda encima de la pill** (reserva = alto de la pill + su margen, escrita con `toaster.configure({ offset })` en el banco); hoja modal ≤ 88 % del visor, sin desbordamiento, foco al título, Esc la cierra.
- **RTL**: icono a la derecha del texto, controles a la izquierda, marcas de fallo en el borde derecho, duración del panel al final de línea (izquierda), panel dentro del visor, flotante centrada a 16px.
- **Zoom 200 %** (visor de 640×450): panel y pill dentro, el panel se desplaza dentro de su alto, sin desbordamiento.
- **forced-colors** (Chromium): borde vivo 2px sólido y de problema discontinuo; lámpara como disco invertido (`CanvasText`/`Canvas`, distinto del foco `Highlight`); barras de medidor y onda en `CanvasText`; marca de error de 4px; contorno vivo del disparador como borde real de 2px; la envoltura flotante sin borde (no se duplica). **prefers-contrast: more**: bordes `border-control`, secundarios en `text`.
- Consola limpia en todos los casos. `npx vitest run src/tokens` (incluye `levels.test.js` con los tres CSS nuevos) correcto; `npm run build` y las compuertas del CLAUDE.md correctas (el CSS de voz aún no está en `dist`: lo registra bruno).

## Para bruno

1. Registrar en `components.css`, **después de `GSurface.css`** (y de `GBtn.css`): `GSpeechPill/GSpeechPill.css`, `GSpeechHost/GSpeechHost.css`, `GSpeechTrigger/GSpeechTrigger.css`; compuerta propuesta `grep -q "g-speech-panel__privacy" packages/vue/dist/grana.css`.
2. Botones y props: tabla «Botones». El contenido del principal de la pill va en el hueco por defecto de `GBtn`.
3. Marcado que el CSS espera y §14 no lista: `data-status`/`is-live`/`is-problem` en `.g-speech-panel`; `is-warning` en la línea de señal plana de `__sub`; mensaje fatal = hijo de `__error` que no es `__issue` (título primero); `g-speech-panel__sr`, `g-speech-trigger__sr`; `is-spinning` en `__status-icon`; `tabindex="0"` en `g-speech-transcript`; vacío como `<p>` en `__transcript`; `hidden` en `__time`, `__toggle`, `__finish`, `g-speech-meter`, `g-speech-wave`, la envoltura flotante y el panel (el CSS los respeta).
4. Variables en línea: `--_speech-x`, `--_speech-y` (físicas, de `placeBlock`), `--_speech-max-block` en el panel; `--_speech-bar` en cada barra (0..1); `data-on` en cada barra o segmento con movimiento reducido (5 segmentos en la onda); `--_speech-offset-*` en la raíz.
5. **Reserva del borde** (#225): alto de la envoltura flotante + su margen (`space × 4`, o `space × 2` con `data-mobile`); con eso el aviso queda a un margen por encima de la pill (verificado en el banco).
6. **Regiones vivas de `GBtn`**: `GBtn` pinta siempre un `<span class="g-btn__status" role="status">` hermano del botón. Dentro de la pill, el panel y el disparador eso añade regiones vivas (vacías) además de los dos canales: choca con §6.2 («son los únicos») y con la prueba de §17 («ninguna otra región viva en la página»). Revisar con lima (p. ej. no pintarlo sin `loading`).
7. La nota es un `<p>` dentro de la raíz `<span>` del disparador (contenido no conforme en HTML; el CSS no depende del elemento): mejor raíz `<div>` o nota `<span>`/`<div>` (anotado también para lima).

## Para lima

1. Desviación 1 (`active` solo en la lámpara; borde/medidor en `on-accent-soft`, onda en `accent-text`): reflejar en `speech.md` §13 y `tokens.md` §24 («`active` como trazo sobre la superficie no garantiza 3:1 con un acento pálido»).
2. Añadir a §14 el marcado de «Para bruno» 3 y las variables de 4 (`--_speech-x`, `--_speech-y`).
3. `tokens.md` §23.1: fila de `GSpeechHost` (título del panel body 16/600; modo body-sm `muted`; transcript h3 body-sm 600).
4. Decidir lo de `g-btn__status` (Para bruno 6) y el elemento de la nota (7).
5. Fijados: panel `space × 110`, pill 34px, márgenes `× 4`/`× 2`, onda de 32 barras (5 segmentos con movimiento reducido), hoja `88dvh`.

## No ejecutado

Lector de pantalla; `forced-colors` real de Windows y `prefers-contrast` en Firefox/WebKit (solo Chromium los emula); `env(safe-area-inset-*)` con valores reales (dispositivo con muesca; aquí valen 0); táctil con dedo real y teclado virtual con la hoja; Safari real (WebKit de Playwright no es Safari); zoom del navegador (aproximado por visor de 640×450); la pill colocada en cabeceras de otros fondos que no sean `surface`; el componente real (no existe aún: el banco imita el marcado). La auditoría (paso 5) se hará sobre los `.vue` de bruno.
