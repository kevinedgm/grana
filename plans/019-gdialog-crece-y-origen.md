# 019 — GDialog: crece hacia abajo (D2) y viene de donde lo llamaste (D1)

- **Status**: DONE (bruno pasos 1–3, `f86be45`; coco pasos 4–6)
- **Dueños**: bruno (pasos 1–3: `GDialog.vue`, pruebas, `GDialog.meta.json`; `dialog-focus.spec.mjs` sigue en verde), coco (pasos 4–6: `GDialog.css`, `design/lab/dialog/estilo.md`, spec).
- **Contrato**: `design/contracts/dialog.md` «Personalidad»; DECISIONS.md #281, #299 y #301 (y #152, #292 intactos).
- **Category**: Personalidad (kiwi r01 §4; decisión del usuario 2)
- **Estimated scope**: ~40 líneas de JS, ~25 de CSS, 5–6 pruebas, 1 spec
- **Modelo**: Opus para los dos (se posiciona sobre otros elementos: «componente complejo», CLAUDE.md)
- **Depende de**: nada (no usa las curvas nuevas). Orden interno: **D2 primero** (cierra #281), luego D1; en cada uno, bruno → coco.

## Problem

1. **D2**: centrado, un diálogo cuyo contenido crece (un `GFormReveal`, errores, `GTextarea autosize`) crece hacia arriba y hacia abajo y **mueve lo que el usuario está mirando** (kiwi: el botón del pie sube ~126px al abrir un bloque de 240px). #281 lo dejó abierto.
2. **D1**: el diálogo entra siempre desde el mismo sitio (`translate: 0 space-2`), sin relación con el botón que lo abrió, adonde vuelve el foco al cerrar.

Lugares: `GDialog.css:317-382` (entrada y salida con `@starting-style`, `reduce`); `GDialog.vue` (apertura con `showModal()`, foco de #292, cierre de #152).

## Target (resumen; la regla exacta está en `dialog.md`)

- **D2 (bruno)**: tras montar el contenido y poner el foco, en el cuadro siguiente, `--_pin-top` (px, `offsetTop`) + `is-pinned`; al redimensionar la ventana, se quita, se recentra y se vuelve a fijar; al terminar la salida, se limpia. **(coco)**: con `is-pinned`, borde superior fijo y alto máximo hasta el margen inferior del visor; el cuerpo desplaza como hoy.
- **D1 (bruno)**: antes de `showModal()`, si hay disparador enfocado fuera del diálogo, vector completo centro del visor → centro del disparador en `--_origin-x/y` (px) + `has-origin`; al cerrar, se remide desde el centro real del diálogo hasta el elemento al que vuelve el foco, o se quita `has-origin` si ya no existe. **(coco)**: con `has-origin`, entrada desde `clamp(−space×8, 0.25 × vector, space×8)` por eje (más fundido y escala de hoy) y salida hacia él; sin `has-origin`, lo de hoy.
- Solo `placement="center"`, sin `fullscreen`, por encima del umbral móvil. **Reduce**: D1 solo fundido; D2 rige.
- Referencia: capa de `design/lab/personalidad/r01/index.html`, bloques «GDialog · D1» y «D2» (líneas ~81–112; allí `--p-ox/--p-oy`, `--p-top` y `p-pinned`).

## Steps

1. **bruno** · `GDialog.vue`: D2 (`--_pin-top`, `is-pinned`, escucha de `resize` con rAF) y D1 (`--_origin-x/y`, `has-origin` antes de `showModal()`; remedición al cerrar).
2. **bruno** · `GDialog.test.js`: las pruebas listadas en `dialog.md` «Notas para bruno»; no cambia el orden de foco de #292 ni el momento de `closed` (#152).
3. **bruno** · `GDialog.meta.json` (clases nuevas). Verifica que `dialog-focus.spec.mjs` sigue en verde.
4. **coco** · `GDialog.css`: D2 y D1 según el contrato; `reduce`.
5. **coco** · `design/lab/dialog/estilo.md`: entrada desde el disparador y crecimiento hacia abajo.
6. **coco** · `design/lab/theme-playground/tests/personalidad-dialog.spec.mjs` con la medida de kiwi (abrir con teclado en WebKit, como kiwi: con clic WebKit no enfoca el botón).

## Boundaries

- La colocación **inicial** sigue centrada (cambiarla sería pregunta al usuario, #281).
- Hoja lateral, móvil y pantalla completa no cambian. La hoja inferior que conserva su borde superior sigue abierta (#281).
- Sin `--g-ease-spring` ni `--g-ease-bounce` en el diálogo (#299).
- No toques el slot `tabs` (#119) ni la convivencia con `GToaster`.

## Verificación (por niveles)

- **Durante** (Chromium): vitest de `GDialog` (bruno); `GRANA_PW_PORT=4209 npx playwright test tests/personalidad-dialog.spec.mjs tests/dialog-focus.spec.mjs --project=chromium` (coco), viendo que el nuevo falla antes y pasa después.
- **Al cerrar el plan**: `npx vitest run`, `npm run build`, iconos, compuertas, y los specs nuevo, `dialog-focus`, `form-reveal` y `form-section` en los tres motores (usan diálogos).
- **Criterio de hecho (medida de kiwi):** D2: al abrir un bloque de 240px con el diálogo abierto, Δ 0px en el borde superior y en el botón del pie, sin salir del visor; D1: primer cuadro desplazado con el signo del vector, desplazamiento absoluto ≤ `space × 8` por eje, termina centrado, al cerrar se aleja hacia el disparador (Chromium), foco de vuelta en los tres motores; con `reduce`, sin desplazamiento.

## Después

Auditoría de coco (con `GFormReveal` dentro, `GTextarea autosize`, tableta y móvil); mora-docs actualiza `GDialog/README.md` (entrada, crecimiento, límites).
