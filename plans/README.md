# Planes de animación (improve-animations)

Planes autocontenidos para que cualquier agente los ejecute sin el contexto de la auditoría. Cada plan dice su dueño del Fruti Squad (AGENTS.md: un archivo, un dueño), los archivos, el código actual citado, el cambio exacto y cómo verificarlo.

| # | Plan | Componente | Dueño | Severidad | Estado |
| --- | --- | --- | --- | --- | --- |
| 001 | [Respuesta al pulsar en GBtn](001-gbtn-press-feedback.md) | GBtn | lima + coco + bruno | MEDIUM | DONE |
| 002 | [Indicador de carga con movimiento reducido](002-gbtn-reduced-motion-spinner.md) | GBtn | coco | MEDIUM | DONE |
| 003 | [Llenado continuo del conector, segmento y barra](003-gstepper-llenado-continuo.md) | GStepper | coco | HIGH | DONE |
| 004 | [Indicador: anillo, pulsación reversible, línea y movimiento reducido](004-gstepper-transiciones-indicador.md) | GStepper | coco | MEDIUM | DONE |
| 005 | [Continuidad del indicador al cambiar de botón a texto, e `is-ready`](005-gstepper-continuidad-indicador.md) | GStepper | bruno | HIGH | DONE |
| 006 | [Entradas: lista del compacto, contenido vertical y check](006-gstepper-entradas.md) | GStepper | coco | MEDIUM | TODO |

## Auditoría de GStepper (commit 49ad85b)

Pregunta del usuario: «siento que [las animaciones] son muy bruscas y no son fluidas». Observado con Playwright en el playground (`#sec-stepper`) en Chromium, Firefox y WebKit, muestreando el estilo computado cuadro a cuadro y con `getAnimations()`.

Qué transiciona hoy: colores del indicador (`background-color`, `border-color`, `color`, 120 ms), `background-color` del conector y de la barra (120 ms) y la escala al pulsar (160 ms). Qué salta: el llenado de conectores, segmentos y barra (gradientes), el anillo del actual (`box-shadow`), número → check, el subrayado de `line`, el color de la etiqueta, todo el indicador cuando el paso cambia de botón a texto, la lista de «Ver todos los pasos», el contenido del paso en vertical y el cambio de tramo.

| # | Severidad | Categoría | Lugar | Hallazgo | Plan |
| --- | --- | --- | --- | --- | --- |
| 1 | HIGH | Estado que salta + defecto | `GStepper.css:217-235`, `:361-364`, `:401-403`, `:439-447`, `:517-520` | El llenado (gradiente) no se interpola y el conector **desaparece 1–3 cuadros** (`rgba(0,0,0,0)`) antes de fundirse; igual el segmento y la barra | 003 |
| 2 | HIGH | Interrupción | `GStepper.vue:215` | Con `navigation="back"`/`"free"`, `button` ↔ `span` hace que Vue rehaga el indicador: salta sin transición y la pulsación se corta (nodo desconectado al soltar) | 005 |
| 3 | MEDIUM | Interrupción / físico | `GStepper.css:153-156`, `:513-516`, `:296-309`, `:101-109` | El anillo aparece de golpe; `:active` sustituye la lista de transiciones y la escala vuelve en un cuadro; `line` y la etiqueta sin transición | 004 |
| 4 | MEDIUM | Accesibilidad | `GStepper.css:522-524`, `design/lab/stepper/estilo.md:31` | Con `reduce` se quitan también los fundidos de color | 004 |
| 5 | MEDIUM | Oportunidad | `GStepper.vue:247`, `:221-223`, `:183` | «Ver todos los pasos» (64 → 332 px), contenido vertical (52 px) y número → check aparecen en un cuadro | 006 |
| 6 | LOW | Layout | `GStepper.css:170-173` | El peso 600 del actual mueve los pasos siguientes 1 px al cambiar de paso (más con etiquetas largas) | sin plan |
| 7 | LOW | Layout | tramo `--current-only` | Al cambiar de paso, el texto visible salta ~90 px al paso nuevo (402 → 494 px); animarlo exige FLIP de anchos o una señal de «paso que llega» desde bruno | sin plan |

Bien como está: el cambio de tramo al redimensionar no se anima (depende del ancho, que cambia de forma continua; animarlo iría siempre por detrás). Tokens y curvas son coherentes con el resto de Grana.

## Orden recomendado (GStepper)

1. **003** (coco): quita el parpadeo y el salto del llenado. Es lo que más se nota y no depende de nada.
2. **004** (coco): reescribe el bloque de movimiento que dejó el 003 (incluye su regla del segmento) y cambia `estilo.md`.
3. **005** (bruno): independiente del CSS; puede ir en paralelo con 003/004. Añade `is-ready`, que el 006 necesita.
4. **006** (coco): **requiere 005** (sin `is-ready` todo se animaría al cargar) y se escribe sobre el bloque que dejó el 004.

Después: auditoría de coco en los tres navegadores (Chromium, Firefox, WebKit) y, si cambia algo del comportamiento descrito, mora-docs actualiza `packages/vue/src/components/GStepper/README.md`.

## Tokens

Ningún plan necesita tokens nuevos. Valores vigentes (`packages/vue/src/styles/defaults.css:151-156`): `--g-duration-fast` 120ms, `--g-duration-press` 160ms, `--g-duration-spin` 800ms, `--g-ease-standard` `cubic-bezier(0.2, 0, 0, 1)`, `--g-ease-out` `cubic-bezier(0.23, 1, 0.32, 1)`, `--g-press-scale` 0.97. Los 240 ms del llenado salen de `calc(var(--g-duration-press) * 1.5)`, la misma derivación que `GSidebar` (`--_t-slow`, DECISIONS.md #71).

Propuesta para lima (sin plan): si un tercer componente necesita esos 240 ms, promover `--_t-slow` a un token `--g-duration-slow` (valor de coco: `calc(var(--g-duration-press) * 1.5)`) en lugar de repetir la derivación.

## Pendiente para otra ronda (observado, sin planificar)

- **Movimiento reducido que apaga también los colores** (el mismo patrón que corrige el 004): `GCheckbox.css:448-457`, `GSwitch.css:370-376`, `GCard.css:766-772` y `GDialog.css:345-349` ponen `transition: none`. `GMenu` y `GToast` ya conservan el fundido (patrón correcto).
- **`GProgress`** anima `inline-size` (`GProgress.css:43-45`): propiedad de layout; candidata al mismo `@property` o a `scale` (comprobar los extremos redondeados).
- **`GCard`**: fondos con `background-image: linear-gradient(...)` para el seleccionado (`GCard.css:632`, `:638`) junto a transiciones de `background-color`; revisar si el cambio de selección parpadea como el conector de `GStepper` (sin medir).
- **`GDialog`** entra con `@keyframes` (`GDialog.css:316-341`); revisar si la salida se anima o desaparece de golpe (sin medir).
- `GTabs` ya hace bien lo que aquí falta (`is-ready`, entrada de paneles con `@starting-style`): sirve de referencia, no de hallazgo.
