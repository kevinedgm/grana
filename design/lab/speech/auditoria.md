# Auditoría de coco · captura de voz, Fase 1 (paso 5)

**Componentes:** `GSpeechHost` (con el panel, la flotante y la hoja), `GSpeechPill` y `GSpeechTrigger` reales de bruno (commits 53537f7..832286c, entrada propia `@grana/vue/speech` de #238 en d485a64 y 1e7b16f), con el CSS de coco (a70f366; `estilo.md`) y `dist/` reconstruido (`npm run build`). Contrato `design/contracts/speech.md` reconciliado por lima hasta #238.
**Método:** `node design/lab/speech/auditoria-verificar.mjs` (Playwright de `design/lab/theme-playground`; servidor del playground en 4173 o uno propio; Vue servido desde `node_modules` para no depender de la red). Sobre el **playground real** (`/playground/?speech=self#sec-speech`: gestor `GranaSpeech.createSpeech` con el adaptador simulado de `@grana/vue/testing` capturando por sí mismo, sin micrófono): una sesión por tema que recorre **dictado** (disparador vivo y nota con provisional), **conversación** en `ready` (panel de preparación), captura con un **fragmento fallido** y provisional en el panel (pill de cabecera y, soltando la cabecera fija y desplazando, **flotante**), `reconnecting` con captura, `paused`, `error` (captura interrumpida), `processing`, `completed` con la confirmación de descarte abierta, y `denied` (Permissions API sustituida por `denied`: Grana lo detecta sin abrir nada). Contraste **compuesto** (color de cada parte sobre su fondo efectivo, alfa incluida) 300 ms después de cada cambio de estado (los colores de la lámpara y de `GBtn` hacen una transición de 120 ms). Temas: **defecto**, **spotify** (`accent` `#A7F3C1`, 1.4:1 sobre blanco) y **amazon** (`#FF9900`, 2.1:1), **lustre** y **github** (generados en `design/lab/tema-oscuro/dark-color-presence/generated/`), claro y oscuro, en Chromium; defecto y spotify en Firefox y WebKit. Además: foco frente a énfasis, una pill (cabecera, flotante, `GDialog` modal), objetivos 24/44px, movimiento reducido y normal, «Ocultar actividad», 320×640 con hoja y aviso de `GToaster`, RTL, zoom 200 % (visor de 640×450), `forced-colors` y `prefers-contrast: more` (Chromium), regiones vivas, consola y revisión estática de `.vue`/`.js`. Y la **barra activa de `GSidebar`** en el tema por defecto y los 10 generados (Chromium), spotify y amazon (Firefox y WebKit).

**Resultado: 6 716 / 6 716 comprobaciones correctas** en los tres motores (Chromium 3 693, Firefox 1 511, WebKit 1 512), tras corregir `GSidebar.css` (hallazgo 1) y una prueba propia (hallazgo 2).

## Veredicto: aprobada. Un defecto de CSS corregido (fuera de la captura, en `GSidebar`); sin defectos bloqueantes en `.vue`; `status: "candidate"` en los tres `meta.json`

### Contraste (mínimo de todas las piezas visibles, 9 estados, temas y motores)

| Medida (umbral) | Mínimo | Dónde |
| --- | --- | --- |
| Pill: texto del estado (4.5) | 13.81 | spotify oscuro |
| Pill: duración, chevron, iconos alternar/finalizar (4.5 / 3) | 6.49 | lustre claro |
| Pill: icono de estado, incluido el glifo sobre la lámpara `active` (3) | 4.10 | spotify oscuro, `reconnecting` (`warning-text` sobre el tinte) |
| Pill: borde de estado, fuera / sobre su relleno (3) | 4.52 / 4.52 | defecto oscuro (`error` fuera; captura sobre el tinte) |
| Pill: medidor (3) | 4.52 | defecto oscuro |
| Panel: título, estado, error, fallo no fatal, título del transcript, confirmado, hablante (4.5) | 15.21 | amazon oscuro |
| Panel: modo, privacidad, duración, secundario, vacío, hora, ficha y **texto provisional** (4.5) | 7.38 | spotify claro |
| Panel: texto de la confirmación de descarte (4.5) | 16.09 | amazon claro |
| Panel: icono de privacidad, iconos de botón (3) | 7.38 | spotify claro |
| Panel: icono de estado, icono y marca de error (3) | 4.52 | defecto oscuro |
| Panel: icono y marca de fallo, icono del fragmento fallido (3) | 4.54 | defecto oscuro |
| Panel: onda viva (3) | 4.57 | amazon claro |
| Panel: texto de botones (4.5) / borde `outline` (3) | 4.62 / 3.19 | defecto oscuro / claro |
| Transcript: borde de la ficha «provisional» (3) | 3.43 | spotify claro |
| Disparador: icono (3) · texto de conversación (4.5) | 4.11 · 4.52 | spotify oscuro (`error`) · defecto oscuro |
| Disparador: contorno vivo fuera / sobre el tinte (3) | 4.86 / 4.52 | lustre oscuro / defecto oscuro |
| Disparador: contorno discontinuo de problema (3) | 4.52 | defecto oscuro |
| Nota: **texto provisional** (4.5) | 7.38 | spotify claro |

El provisional (cursiva, `text-muted`) se midió **en cada tema y modo**, en el panel y en la nota (la prueba exige las dos medidas). Los mínimos coinciden en Firefox y WebKit.

### `active` solo como relleno (#228)

Con defecto, spotify y amazon (claro y oscuro) se comprobó en el componente real que **la lámpara** es `--g-color-active` con el glifo en `--g-color-on-accent`, y que el **borde vivo** y el **medidor** son `--g-color-on-accent-soft` y la **onda** `--g-color-accent-text` (con movimiento reducido: relleno del segmento encendido o contorno del apagado). Con spotify claro, donde `active` sobre blanco da 1.4:1, el borde vivo da 4.64 sobre el tinte y 5.23 fuera, el medidor 4.64 y la onda 4.61.

### Pruebas por comportamiento (Chromium, Firefox y WebKit salvo indicación)

| Prueba | Resultado |
| --- | --- |
| Foco frente a énfasis vivo | Mayús+F8 desde un campo lleva el foco a la pill de cabecera (spotify): anillo sólido de 2px, **interior** (`outline-offset` negativo), a ≥ 2px del borde vivo de 2px sólido que rodea **toda** la pill; el anillo solo en el botón. Mayús+F8 de nuevo devuelve el foco al campo |
| Exactamente una pill visible y operable | Sin sesión: ninguna. Cabecera visible: solo la colocada. Cabecera fuera del visor: solo la flotante. Con el `GDialog` modal de la sección: solo la flotante, **dentro del modal** y pulsable (`elementFromPoint`); al cerrar el modal vuelve la colocada. A 320×640, una sola, también con un aviso de `GToaster` en pantalla |
| `GDialog` modal real | Clic en la flotante → panel dentro del modal, encima y dentro del visor, foco al título; **Esc cierra el panel, el diálogo sigue abierto y la sesión sigue**. Mayús+F8 desde el campo del diálogo: foco visible (2px sólido) en la flotante |
| Móvil 320×640 | `data-mobile`; flotante abajo al centro (centro a 160px), dentro del visor. Aviso de `GToaster`: **encima** de la pill, dentro del visor; la pill no se mueve. Panel = hoja `<dialog>` **modal** inferior ≤ 88 % del alto, sin desbordamiento, foco al título y visible al tabular dentro; Esc la cierra y la sesión sigue |
| Regiones vivas (#227) | Un `MutationObserver` anotó cualquier texto en `role="status"`/`alert`/`aria-live` de la pill, el panel y los disparadores fuera de los dos canales: **ninguno** en las sesiones completas de los 10 temas y modos, ni en la del modal ni en la de móvil |
| Objetivos | Todos los `GBtn` de pill, panel y disparadores ≥ 24px (área `::after`); pill de **34px**. Con `pointer: coarse` (Chromium y WebKit con `hasTouch`): todas las áreas ≥ 44px y sin pisarse dentro de la pill |
| Movimiento reducido | `data-reduced-motion`; onda de **5 segmentos**, medidor discreto (encendida = alta, apagada = mínima), panel solo con fundido, `loader-circle` sin giro en pill y panel |
| Sin preferencia | Onda de 32 barras; `loader-circle` gira en pill y panel |
| «Ocultar actividad» | `aria-pressed="true"`; sin onda ni medidores; texto del estado y duración (pill y panel) siguen; con y sin movimiento reducido |
| RTL | Icono a la derecha del texto, finalizar a la izquierda, duración del panel al final de línea, panel dentro del visor; flotante arriba al centro a 16px |
| Zoom 200 % (640×450) | Panel y pill dentro del visor, el panel se desplaza dentro de su alto, sin desbordamiento horizontal |
| `forced-colors` (Chromium, emulado) | Captura viva: borde 2px sólido, lámpara como disco invertido, barras y onda visibles; problema: borde **discontinuo** de 2px y marca de error de 4px |
| `prefers-contrast: more` (Chromium) | Borde de la pill y del panel a `border-control`; modo y duración a `text` |
| `.vue` y `.js` | `GSpeechHost.vue`, `SpeechPanel.vue`, `GSpeechPill.vue`, `SpeechPillView.vue`, `GSpeechTrigger.vue`, `speech.js`, `capture.js`, `view.js`, `simulatedAdapter.js`, `src/speech.js`, `src/shared.js`, `utils/topModal.js`, `utils/liveRegion.js`, `utils/edgeReserve.js`: **sin `<style>`** y sin literales de color ni de medida; en línea solo las variables dinámicas del contrato (`--_speech-bar`, `--_speech-x`/`-y`/`-max-block` con valores medidos) |
| Consola | Sin errores ni avisos de Vue o de Grana en ninguna página |

### Barra activa de `GSidebar` (#228)

| Tema | Antes (`active`) | Después (`accent-text`) |
| --- | --- | --- |
| spotify claro | **1.29** | 4.61 |
| amazon claro | **2.14** | 4.57 |
| linear claro · grana claro · notion claro | 3.28 · 3.74 · 3.88 | 4.54 · 4.58 · 4.60 |
| defecto claro / oscuro | 5.69 / 4.58 | 5.69 / 4.58 (sin cambio: mismo color) |
| Mínimo de los 22 temas y modos | 1.29 | **4.52** (apple claro) |

## Hallazgos

| # | Severidad | Dueño | Hallazgo y resolución |
| --- | --- | --- | --- |
| 1 | **Mayor, corregido** | coco (`GSidebar.css`) → lima | **La barra del ítem activo de `GSidebar` no llegaba a 3:1 con acentos pálidos** (spotify claro 1.29, amazon claro 2.14): pintaba `--g-color-active` como trazo de 2px sobre la superficie del ítem, el mismo riesgo que #228. Es un elemento gráfico necesario según #89 (WCAG 1.4.11). **Corregido** con la regla de #228: `background: var(--g-color-accent-text)` (≥ 4.5:1 sobre `surface` por derivación); mínimo medido 4.52 en los 11 temas, claro y oscuro, tres motores; el tema por defecto no cambia (mismo color). `forced-colors` sigue en `Highlight`. Para lima: `tokens.md` §17.2 («el ítem activo de `GSidebar` a `active`») y el texto de #223 («como el ítem activo de `GSidebar`») quedan desfasados: la barra es ahora `accent-text` |
| 2 | Informativo, corregido | coco (verificación) | En **Firefox**, el foco devuelto por script a la flotante tras abrir el panel **con el ratón** y cerrarlo con Esc no pinta el anillo (`:focus-visible` falso): es la heurística del navegador (la última interacción que movió el foco fue de puntero), no del componente. Desde el teclado (campo del diálogo + Mayús+F8) el anillo sale en los tres motores. Ajustada la prueba |
| 3 | Informativo | coco | La lámpara y los colores de `GBtn` hacen una transición de color de 120 ms (`--g-duration-fast`, también con movimiento reducido: no es desplazamiento). Medido **durante** la transición el contraste cae un instante (p. ej. al pausar); asentado, cumple. La verificación mide 300 ms después de cada cambio |
| 4 | Informativo | bruno | `GSpeechHost.vue` usa `spaceUnit() \|\| 4` como respaldo numérico de `--g-space-1` cuando no se puede leer (márgenes del panel y reserva del borde). Solo actúa sin tema cargado; no es un literal de tema, pero conviene que coincida con lo que hace `GToaster`/`GDialog` en el mismo caso o se documente en el `meta.json` |
| 5 | Informativo | lima | `@grana/vue` exporta `__shared` (interno, para la entrada `speech`; #238). Que conste en `api.md` y en DECISIONS como **no público** y sin promesa de estabilidad, para que nadie lo use desde una aplicación |
| 6 | Informativo | lima | El borde `outline` de los botones del panel en claro mide 3.19 (umbral 3): pasa, pero es el margen más estrecho de la captura (`border-control` de `GBtn`, igual que en `GToast`). Sin cambio |

## Sin ejecutar

- **Lector de pantalla real** (VoiceOver, NVDA, JAWS, TalkBack): cola cortés y `alert`, cambio de nombre de Pausar/Reanudar con el foco encima, `role="timer"`, traslado de canales al modal, las `g-btn__status` vacías al recorrer (#227). Riesgo principal.
- **Micrófono real en esta auditoría**: se usó la captura `self` del adaptador simulado (el micrófono falso y el nivel real los cubre bruno en `speech.spec.mjs` en los tres motores). Motores reales, PCM real contra un servicio.
- **Safari real**, **táctil real** y **teclado virtual** con la hoja; `safe-area` real; `forced-colors` real de Windows y `prefers-contrast` en Firefox/WebKit (solo Chromium los emula).
- Pill colocada en cabeceras con fondos distintos de `surface`; varios modales apilados; zoom real del navegador (aproximado con el visor de 640×450).
