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

---

# Fase 2 · `GTranscript`, panel compacto y diálogo de respaldo (entrega de coco, paso 3)

**Archivos:** `packages/vue/src/components/GTranscript/GTranscript.css` (vista: rejilla, filas y marcas, original y cambios, editor, solo lectura, gestor de hablantes, inserción) y, en `GSpeechHost/GSpeechHost.css`, el bloque «F2» (alto de `GTranscript compact` dentro de `__transcript` y la rejilla del diálogo de respaldo). **Sin tokens nuevos** ni cambios en `defaults.css` (`tokens.md` §24, #254). La familia `--g-color-cat-k` se lee sin respaldo con la excepción nombrada de `levels.test.js` (`CAT_FAMILY_READERS`, bruno 1db4e18).
**Contratos:** `speech.md` §20 a §32 (en especial §22.4, §22.5, §22.10, §22.14, §23.6, §24, §25, §28, §29), `tokens.md` §16.3, §23 y §24, `icons.md` v0.5; DECISIONS #241 a #256.
**Banco:** `design/lab/speech/estilo-banco-f2.html`: marcado exacto de §22.4/§29 con el CSS real registrado en `grana.components` después de `components.css` y los componentes reales desde `dist/grana.umd.js` (`GBtn`, `GIcon` con los 12 iconos de la F2 registrados por `createIcons`, `GCheckbox`, `GSelect`, `GMenu`, `GDialog`). Escenas: editable con dos hablantes y roles (confirmado, corregido con «Mostrar cambios», hablante cambiado, eliminado, dos seleccionados, «Usado en», «Cambió después de insertarlo», editor abierto, fallido, provisional, «N fragmentos nuevos», gestor de hablantes, inserción con dos destinos, vista previa, resultado y usos); solo selección; solo lectura; sin diarización; dictado (sin columna de hablante); vacío; columna de 360px con «Más» real (`GMenu`); sesión larga con alto máximo; panel en captura y en `completed` con `GTranscript compact` y «Revisar»; diálogo de respaldo (`GDialog` real, `size="lg"`, `mobile="fullscreen"`, `class="g-speech-review"`). Parámetros `?dark=1 ?rtl=1 ?theme=<generado> ?cat=<tema con categorías> ?dlg=1 ?only=<sección> ?narrowAt=<n>`.
**Temas con categorías** (para `speakerColors`; ningún generado las trae): `design/lab/speech/temas-f2/` — `spotify-cat6` (acento pálido), `default-cat12` y `lustre-cat8`, generados con `@grana/cli` desde sus `.json`.
**Verificación:** `node design/lab/speech/estilo-verificar-f2.mjs` (Playwright de `design/lab/theme-playground`, servidor propio en puerto libre; `--engines=`, `--verbose`).

## Carácter

La vista es una **rejilla de lectura**, no una tabla de datos: filas de texto con aire (relleno `space × 2`), separadas por una línea `border`, dentro de un área con borde `border-strong` y radio `md`. Todo lo secundario (hora, marcas, ayuda, original) va en `caption` o `body-sm` atenuado; el texto del fragmento es `body-sm` pleno. Cada estado tiene **forma** además de tono:

| Estado | Forma | Tono |
| --- | --- | --- |
| Seleccionada | **borde de inicio** de `space × 0.75` en `--g-color-text` | fondo `primary-soft` (el de `GTable`) |
| Provisional | cursiva + ficha «Provisional» con contorno | `text-muted` |
| Eliminada | **tachado** de 1,5 bordes + marca «Eliminado» (`trash`) | `text-muted` |
| Fallida | borde de inicio **discontinuo** + `triangle-alert` | `warning-text` |
| Corregida, hablante cambiado, usada | marca con icono y texto | `text-muted` |
| Cambió después de insertarlo | marca con `triangle-alert` | `warning-text` (sobre una fila seleccionada: texto en `text`, icono en `warning-text`) |
| `<del>` / `<ins>` | **tachado / subrayado** de 2 bordes (+ envoltura oculta) | relleno `danger-soft` / `success-soft` con `on-*-soft` (complemento) |
| Hablante | marca cuadrada con la letra, borde `border-control`; «Sin asignar» **discontinua** | con `speakerColors`: `cat-k-soft`, letra `on-cat-k-soft`, borde `cat-k-text` |

## Valores fijados (constantes derivadas de `space`, no tokens)

| Qué | Valor | Con `space` 4 |
| --- | --- | --- |
| Alto de control de fila (casilla, hablante, acciones) | `space × 7` (el de `GBtn sm` y la fila de `GCheckbox md`) | 28px |
| Columnas | selección y acciones `space × 7` (**44px con `pointer: coarse`**); hora `4,5 × caption + space × 2`; hablante `space × 40`; texto, el resto | 28 · 62 · 160px |
| Fila | relleno `space × 2` (`space × 1` en compacto); separación entre celdas `space × 2`; la primera línea del texto y de la hora se centra con el control (`(space × 7 − interlineado) / 2`) | |
| Marca de selección | `space × 0.75`, también en `__orig` (en `border-strong`) y en el fallido (discontinua) | 3px |
| Marca de letra | `space × 5` de lado (crece en ancho con «AA»), radio `xs`, `caption` 600 | 20px |
| Iconos de las marcas | `1,15 × caption` (proporción de `GBtn`) | ~14px |
| Editor | `space × 9` de caja por línea (la de `GTextarea md`), mínimo 2 líneas, máximo 8; `field-sizing: content` donde existe | |
| Vista previa de la inserción | alto máximo `space × 40`, se desplaza | 160px |
| **Umbral de «Más» y del apilado** (`data-narrow`) | **`space × 160`** (ver «Decisiones», 1) | 640px |
| Panel: área de `GTranscript compact` | crece con el panel; mínimo `space × 30` (unas dos filas apiladas) | 120px |
| Diálogo de respaldo: área de la rejilla | `max(space × 60, 100dvh − space × 100)` | 500px a 900 de alto; 240px a 640 |

**Tipografía** (§23.4): títulos internos (gestor de hablantes, inserción) **body-sm 14/20, 600** (vista densa, un rol por debajo de `GCard`; nunca por debajo de 14); texto del fragmento body-sm `text`; hablante body-sm 600 `text`; hora caption `muted` con cifras tabulares; marcas caption `muted`; original y cambios body-sm (`muted`, el cambio en `text`); ayuda de teclado, original y ayuda del editor caption `muted`; aviso sin diarización body-sm `text` sobre `surface-sunken`; contador body-sm `muted`; rótulo de la vista previa body-sm 500 `muted`.

## Botones (composición de `GBtn` de §28.3, fijada)

Se fija tal como la propuso lima, con estos detalles:

| Dónde | Props |
| --- | --- |
| Barra (todos) | `size="sm" variant="ghost" color="neutral"`, icono en `prepend`. Pulsados («Mostrar cambios» con `aria-pressed="true"`, «Hablantes» con `aria-expanded="true"`): relleno `neutral-soft` + borde `border-control` (como «Ocultar actividad»). Deshacer/Rehacer con `aria-disabled="true"`: `text-subtle`, sin hover |
| «Más» | igual que la barra, **`chevron-down` en `append`** y la clase `g-transcript__more` en el `GBtn` (el disparador del `GMenu`); el chevron gira media vuelta con `aria-expanded` |
| «Seleccionar todo» y casilla de fila | `GCheckbox` de tamaño por defecto (`md`: fila de `space × 7`), la de fila con `aria-label` |
| Hablante de la fila | `size="sm" variant="ghost" color="neutral"`; el CSS pone el texto en `text`, 600, y el relleno en línea a `space × 1` |
| Acciones de la fila | `icon size="sm" variant="ghost" color="neutral"`, `ellipsis-vertical` |
| Editor: Guardar · Cancelar | `size="sm"` sólido por defecto · `size="sm" variant="outline" color="neutral"`, **sin icono** |
| «Ir al final», «Deshacer inserción», Unir, Separar, Añadir hablante | `size="sm" variant="outline" color="neutral"` con su icono en `prepend` (`arrow-down`, `undo-2`, `merge`, `split`, `user-plus`); el CSS los pasa a `text` + `border-control` |
| «Insertar en {target}» | `size="md"`, sólido por defecto, `text-cursor-input` en `prepend` |
| Panel: Revisar · Revisar transcripción | los de §13.1 (secundaria `outline neutral` / principal sólido), `file-pen-line` en `prepend` |

**Icono de «Revisar»:** `file-pen-line` convence (documento con líneas y lápiz: «revisar un texto», distinto de `pencil` = editar un fragmento). Sin propuesta de cambio.

## Marcado que el CSS espera (además de §22.4 y §29)

1. **`data-narrow`** en la raíz bajo `space × 160` (no 120; «Decisiones», 1). Además de la barra con «Más», **apila las filas**: el contrato pide una consulta de contenedor, pero una consulta no admite `var(--g-space-1)` y un ancho literal no está permitido; la medición en ejecución de `data-narrow` es el equivalente (como el umbral móvil de la F1). bruno mide fuera del ciclo del `ResizeObserver` (`requestAnimationFrame`): en WebKit, cambiar el atributo dentro del callback da «ResizeObserver loop completed…» en la consola (visto en el banco y corregido así).
2. **Hablante sin botón** (solo selección, provisional): `<span class="g-transcript__speaker">` con la misma marca y la etiqueta. En el fallido, la celda de hablante va vacía.
3. **Marca de letra:** `__mark` con la letra; «Sin asignar» con `is-unassigned` y **sin letra** (vacía); `data-cat="k"` **solo** si `k ≤ speakerColors` (el CSS cubre k = 1 a 12).
4. **Fallido:** sin `__text`; la celda de texto lleva solo `__flags` con `__flag--failed` (`triangle-alert` + texto), que en el fallido toma el tamaño `body-sm`.
5. **Original y cambios:** `__orig` con un `<p>` por línea; el cambio va en `<p>{diff.changes} <span class="g-transcript__diff">…<del>…</del> <ins>…</ins>…</span></p>`; dentro de cada `del`/`ins`, la envoltura oculta en `__sr`. `__orig` lleva `user-select: none` (el bloque no participa en la selección de texto, §22.9).
6. **Editor:** `__editor` (`role="group"`) > `textarea.__field` + `p.__editor-orig` + `p.__editor-hint` + `div.__editor-actions`. Con el editor abierto la fila lleva `is-editing` (la celda deja su relleno vertical).
7. **Gestor de hablantes e inserción:** el título `h{headingLevel}` es **hijo directo** de `__speakers` / `__insert`; la ayuda del gestor, un `<p>` hijo directo; los hablantes, una `<ul>` de `li.__speaker-row` con `span.__speaker` (marca + etiqueta), un `<span>` **sin clase** para el recuento o «Unido a …» (secundario), los `GSelect` y los botones; «Añadir hablante» en un `<div>` propio al final.
8. **Inserción:** hijos directos de `__insert`: título, los tres `GSelect` (comparten línea si caben), `GCheckbox` «Con hablantes», un **`<p>` sin clase con el rótulo «Vista previa» justo antes de `__preview`**, `__preview` (**`tabindex="0"`, `role="region"`, `aria-labelledby` al rótulo**: se desplaza con `space × 40` de alto máximo y debe poder desplazarse con el teclado, WCAG 2.1.1), el botón en un `<div>`, `p.__result` (`circle-check` + texto + «Deshacer inserción») y `__uses` (`<details>` con `<summary>` y una `<ul>` de `<li>` con `<span>` + botón, o directamente una lista).
9. **Solo lectura:** la lista `__list` es su propio contenedor de desplazamiento; `--_max-height` puede ir en `__scroll` (se hereda) o en la lista. Si bruno la envuelve en `__scroll`, la envoltura cede borde y desplazamiento (`:has`). Partes del `__item`: `time.__time`, `span.__speaker` (con marca), `span.__text`, `span.__flags`.
10. **Diálogo de respaldo:** `class="g-speech-review"` en el `GDialog` del anfitrión (va al `<dialog>`). El alto de su rejilla lo pone `GSpeechHost.css` (gana a `--_max-height`).
11. Cualquier hijo con `hidden` dentro de la raíz queda oculto (`__kbd` en compacto, `__newer`, `__speakers` cerrado).

## Decisiones y desviaciones

1. **Umbral de «Más» `space × 160`, no `space × 120`.** Medido en el banco (Chromium, barra completa del modo editable, tema por defecto): con 120, entre 480 y ~600px de raíz la barra sin «Más» ocupa **3 líneas** (558px: 3); con 160 **nunca pasa de 2 líneas desde 440px** (478 · 558 · 638 · 718 · 798 · 958: 2) y por debajo, con «Más», 3 líneas a 320–400px (casilla y contador · Asignar y Eliminar · Deshacer, Rehacer y Más). Sin «Más», la barra cabe en 2 líneas desde ~600px; 640 deja margen para traducciones más largas. El mismo umbral apila las filas: por debajo de 640px el texto de una fila sin apilar se queda en ~270px, apilado ocupa todo el ancho. El panel (408px útiles) y una columna lateral quedan apiladas; el diálogo `lg` (~710px) no.
2. **Barra estrecha:** con `data-narrow`, los botones de texto de la barra bajan su relleno en línea a `space × 2` (alto y área táctil intactos): dos por línea a 320px.
3. **Hablante en estrecho:** la etiqueta se parte por palabras, nunca dentro de una (`overflow-wrap: normal`); si su palabra más larga no cabe en la línea («Acompañante (C)» con 254px de raíz), la celda baja a la línea siguiente con las acciones. La hora mide lo que mide.
4. **«Cambió después de insertarlo» sobre una fila seleccionada:** `warning-text` no tiene garantizado 4.5:1 sobre `primary-soft` (tema por defecto oscuro: 3.83). El texto pasa a `text` y el icono conserva el aviso (3.83 ≥ 3).
5. **Marca de color con `speakerColors`:** relleno `cat-k-soft`, letra `on-cat-k-soft` (par garantizado), **borde `cat-k-text`** (≥ 4.5:1 sobre la superficie por derivación; medido 3.94 como mínimo sobre la fila seleccionada en `default-cat12` oscuro). Con `radius-xs` de un tema `pill` la marca es un círculo.
6. **`<del>`/`<ins>`:** la forma basta en escala de grises (tachado / subrayado de 2 bordes con `skip-ink: none`); el relleno de `danger-soft` / `success-soft` con su par `on-*-soft` es complemento. En `forced-colors` desaparece el relleno y queda la forma.
7. **Fallido** con borde de inicio discontinuo `warning-text` (como el fragmento fallido del panel F1); no choca con la marca de selección porque un fallido no es seleccionable.
8. **Foco de celda interior** (`outline-offset` = −ancho): nunca lo recorta el área desplazable; `scroll-padding-block` y `scroll-margin-block` de `space × 2` dejan aire al desplazar la celda enfocada a la vista. El de los controles (`GBtn`, `GCheckbox`) es el suyo, exterior: cabe en el relleno de la fila.
9. **Diálogo de respaldo con la rejilla acotada** (y no barra fija): una barra pegajosa podría tapar la fila enfocada al subir (WCAG 2.4.11); con el área propia, barra e inserción quedan a mano y la fila enfocada siempre se ve.
10. **Panel:** el `GTranscript compact` sustituye a la lista F1 con las mismas reglas de alto (crece con el panel; por debajo encoge hasta su mínimo y se desplaza; con menos sitio se desplaza el panel).

## Verificación (Playwright; Chromium, Firefox y WebKit; movimiento reducido al medir)

`node design/lab/speech/estilo-verificar-f2.mjs`: **43 853 / 43 853** comprobaciones correctas en los tres motores.

Contraste **compuesto** sobre el fondo efectivo de cada pieza visible (página completa con el diálogo de respaldo abierto). Temas: **defecto**, los **11 generados** (`amazon`, `apple`, `caracol-purpura`, `github`, `grana`, `linear`, `lustre`, `medium`, `notion`, `spotify`, `stripe`) y los **3 con categorías** (`spotify-cat6`, `default-cat12`, `lustre-cat8`, con `speakerColors: 3`), claro y oscuro, en Chromium; defecto, `spotify`, `lustre` y `spotify-cat6` en Firefox y WebKit.

| Medida (umbral) | Mínimo | Dónde |
| --- | --- | --- |
| Texto, provisional, eliminado (tachado), contador, ayudas, rótulos (4.5) | 7.38 | `spotify` claro |
| Hora (4.5) | 6.49 | `lustre` claro |
| Original (4.5) · cambios (4.5) | 6.87 · 16.08 | `lustre` claro · `linear` claro |
| `<del>` / `<ins>` sobre su relleno (4.5) | 4.53 / 4.51 | defecto oscuro |
| Marcas (texto, incluido «Cambió después…» y el fallido) (4.5) | 4.53 | `linear` oscuro |
| Iconos de las marcas (3) | 3.83 | defecto oscuro, fila seleccionada |
| Hablante (4.5) · letra de la marca (4.5) | 12.82 · 4.53 | defecto oscuro · `spotify-cat6` oscuro |
| Borde de la marca de letra (3) · de color (3) | 3.01 · 3.94 | `linear` claro · `default-cat12` oscuro |
| Marca de selección sobre la fila / fuera (3) | 12.82 / 15.2 | |
| Marca del fallido (3) | 4.53 | `linear` oscuro |
| Anillo de foco sobre la fila / sobre la seleccionada (3) | 4.52 / 3.86 | `apple` claro / defecto oscuro |
| Borde del editor, de la ficha «Provisional», de los botones `outline` (3) | 3.43 | `spotify` claro |
| Texto de los botones (4.5) · iconos de botón (3) | 4.58 · 3.89 | `stripe` oscuro · defecto oscuro |

Además, en los tres motores salvo indicación:
- **`<del>`/`<ins>`** por forma (tachado / subrayado de 2px, sin el otro), con su envoltura oculta; eliminado tachado.
- **Foco** visible, sólido de 2px, **dentro del área desplazable y sin tapar** (`elementFromPoint`) en la última fila (texto, hora, acciones), una fila intermedia (hablante) y la primera (casilla, texto), con la lista desplazada; anillo de celda interior.
- **Objetivos** ≥ 24px (`::after` de `GBtn`; casillas); con `pointer: coarse` (Chromium y WebKit con `hasTouch`): columnas de selección y acciones ≥ 44px, áreas de hablante y acciones ≥ 44px y sin pisarse.
- **320×640** (también RTL): sin desbordamiento (página, vistas, barra, filas, inserción, gestor, panel); fila apilada con el texto debajo y a todo el ancho; «Más» real (`GMenu`) dentro del visor con sus 4 elementos; diálogo de respaldo a pantalla completa con la rejilla en 240px. **Zoom 200 %** (640×450): sin desbordamiento, también con el diálogo.
- **Escritorio:** rejilla del diálogo acotada a 500px y desplazable; **panel** con `GTranscript compact` apilado, sin selección ni ayuda visible, área ≥ `space × 30` y desplazable, «Revisar» con icono.
- **RTL:** marcas de selección y de original a la derecha, acciones a la izquierda, hora a la derecha del texto.
- **Movimiento reducido:** el chevron de «Más» sin transición.
- **forced-colors** (Chromium): selección y foco en `Highlight`, marca de letra sólida visible, `del`/`ins` con su forma, fallido discontinuo. **prefers-contrast: more:** secundarios (hora, marcas, provisional, eliminado) a `text` y bordes del área a `border-control`.
- **Consola limpia** en todas las páginas. F1 sin regresión (`estilo-verificar.mjs` en Chromium). `npx vitest run src/tokens` (con `CAT_FAMILY_READERS`) correcto; `npm run build` y las compuertas del CLAUDE.md correctas (el CSS de `GTranscript` aún no está en `dist`: lo registra bruno).

## Para bruno

1. Registrar `GTranscript/GTranscript.css` en `components.css` **después de** `GBtn.css`, `GCheckbox.css`, `GSelect.css` y `GSurface.css` (reasigna variables de `GBtn` y de `GSelect`); compuerta propuesta `grep -q "g-transcript__orig" packages/vue/dist/grana.css`.
2. Umbral de `data-narrow`: **`--g-space-1 × 160`** medido en la raíz, fuera del callback del `ResizeObserver` (`requestAnimationFrame`); también apila las filas.
3. Marcado: «Marcado que el CSS espera», 1 a 11 (en especial `__more` en el `GBtn` con `chevron-down` en `append`, `is-unassigned` sin letra, `data-cat` solo con `k ≤ speakerColors`, `__diff` como `<span>`, el rótulo y `tabindex`/`role` de `__preview`, `class="g-speech-review"` en el `GDialog`).
4. Composición de `GBtn` y `GCheckbox`: tabla «Botones».
5. **RTL de `undo-2`/`redo-2`/`arrow-down`:** valorar `g-icon--flip-rtl` en Deshacer/Rehacer (flechas con sentido; en RTL se leen al revés). Es decisión de marcado (y de lima si cambia `icons.md`).
6. El `GBtn` de cada fila trae su `g-btn__status` (#227): con 320 filas son ~640 regiones `role="status"` vacías. Ya conocido de la F1; aquí multiplica. Para lima (abajo).

## Para lima

1. **Umbral de «Más» = `space × 160`** (no 120; «Decisiones», 1) en `speech.md` §22.10, §29 (`data-narrow`) y `tokens.md` §24, y que `data-narrow` **también apila la fila** (§22.14 dice «consulta de contenedor»: aquí es el atributo medido, por la regla de literales).
2. Clases y marcado de «Marcado que el CSS espera» que §29 no lista: `g-speech-review` (GDialog de respaldo), `__more` en el `GBtn`, rótulo `<p>` + `__preview` con `tabindex`/`role`, `__diff` como `<span>` dentro del `<p>` de cambios, `is-unassigned` sin letra.
3. `tokens.md` §23.1: fila de `GTranscript` (títulos internos body-sm 600; texto body-sm; hora y marcas caption `muted`; hablante body-sm 600).
4. `tokens.md` §24 / DECISIONS: la excepción `CAT_FAMILY_READERS` de `levels.test.js` (solo `GTranscript.css` lee la familia `cat-k`) y la combinación medida (relleno `-soft`, letra `on-cat-k-soft`, borde `-text`).
5. `g-btn__status` × filas (Para bruno, 6): ¿`GBtn` sin región de estado cuando no hay `loading`? Afecta a la regla «ninguna otra región viva» de §22.12.

## No ejecutado

Lector de pantalla (la rejilla en modo foco, `del`/`ins` con envoltura, el editor en la celda); `forced-colors` real de Windows y `prefers-contrast` en Firefox/WebKit; táctil real y teclado virtual con el editor abierto; Safari real; zoom real del navegador (aproximado por 640×450); `field-sizing` en Firefox (no existe: el editor queda en su mínimo de 2 líneas con tirador); el componente real (no existe aún: el banco imita el marcado, sin foco itinerante, menús de fila ni editor vivo). La auditoría (paso 5) se hará sobre los `.vue` de bruno.
