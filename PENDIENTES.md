# Pendientes de Grana

Lista única de lo aplazado, con su origen y a quién le toca. Se actualiza al cerrar cada componente; `CLAUDE.md` solo enlaza aquí. Nada de esta lista bloquea el trabajo en curso.

## 1. Personalidad, segunda tanda (decisión del usuario pendiente)

Ideas medidas o reservadas en `design/lab/personalidad/r01/declaracion.md` y `design/lab/avatar/auditoria.md`. Son identidad: se eligen con el usuario antes de planificar.

| Componente | Idea | Estado |
| --- | --- | --- |
| `GMenu` | M2 entrada escalonada de items con `linear()` | medida, fuera por frecuencia de apertura |
| `GMenu` | M3 (ver declaración) | sin prototipo |
| `GCard` | C3 imagen que respira al pasar, C4 (ver declaración) | sin prototipo |
| `GDialog` | D3, D4 (ver declaración); D2 para la hoja móvil (`sheet`) sigue abierto (#307) | sin prototipo |
| `GInput` | I3, I4 (ver declaración); I1 (mensaje que sale del campo) en `GTextarea` y `GSelect` (ya tienen `is-ready`, falta CSS de coco) | coco |
| `GAvatar` | fundido entre foto anterior y nueva; revelado desde el color de la foto; centrado óptico con `text-box`; presencia que nace del contorno; anillo de pila; iniciales que cambian con fundido | reservadas (`avatar.md` «Fuera de v0.1») |
| Campos con `is-rejected` | sección «Personalidad» en los README de `GCheckbox`, `GSwitch`, `GDatePicker` y grupos (hoy solo en `GForm/README.md`) | mora-docs |
| Notas desfasadas | `design/lab/input/estilo.md` «Pendientes» y `design/lab/card/estilo.md` («mientras GCard.vue no escriba `--_pointer-x/y`») | coco |

## 2. Sistema de formularios

| Qué | Fase | Origen |
| --- | --- | --- |
| `GNumberField`: **contratado** (#309 a #314, `number-field.md`), en construcción | 2 | #154, #168 |
| `GInputGroupNumber` (número como parte de `GInputGroup`, estructura reservada en `form.md` §13) y `field` en `GNumberField` (necesita antes `field` en `GInput`) | 2 | #310, #314 |
| `GSelect` y `GNumberField` como parte de `GInputGroup` | 2 | `form.md` §«Fases siguientes» |
| «Agregar…» de varias instancias (`addable` repetible) y `GFormNav` (scroll-spy, estados) | 3 | `form.md` §3, #292 |
| Autosave, `revert()`/`guard`, permisos por rol en el bloqueo con interruptor | 4 | #266, `form.md` §8 |
| Moneda con `Intl.NumberFormat` | 4 | `design/lab/form/r01/declaracion.md` |
| Buscar en la página dentro de secciones plegadas (`hidden="until-found"`) | — | L11 `design/lab/form-section/r01/` |
| Extender #270 (`aria-required` en vez de `required` nativo) a `GInput`, `GTextarea` y `GInputGroupSelect` tras medir Chromium | — | lima |
| `GFormReveal`: perfilar `readGap`/`longest` con decenas de bloques; cuenta de cuadros del spec en WebKit (hallazgos 3 y 4) | — | bruno |

## 3. Componentes nuevos aplazados

| Componente | Nota | Origen |
| --- | --- | --- |
| `GCombobox` / `GTagInput` | el más complejo que queda: posicionamiento, teclado, datos | ronda r01 de formularios |
| `GCardGroup` | agrupa tarjetas de selección; hoy radios de `name` común | #124 |
| `GAvatarGroup` | pila con «+N», orden de lectura, anillo con `mask` | `avatar.md`, kiwi r01 |
| Archivo (`GFileField`), hora, deslizador, chip/etiqueta suelta, aviso en línea (`GAlert`/banner) | sin ronda; candidatos a próximos | — |

## 4. Captura de voz, Fase 3

Recuperación tras cerrar la aplicación, contrato y kit de pruebas del audio temporal (`speech.md` §4.6), elección de dispositivo, segundo plano, virtualización de transcripts a partir de ~2000 fragmentos. `speech.md` §18.

## 5. Tema y motor

| Qué | Origen |
| --- | --- |
| Dark Color Presence: evidencia reunida, opción D preferida pero **no adoptada**; exige especificación, pruebas del motor y decisión del usuario | `design/lab/tema-oscuro/dark-color-presence/recommendation.md` |
| Tema opcional grana + añil | `tokens.md` §9 |
| `round()` para alturas fraccionarias | CLAUDE.md |
| `--g-radius-shape` se describe como «chip» pero los chips de opción usan `pill` fijo (solo documentación) | `radio-group.md` |

## 6. Defectos y límites conocidos

| Qué | Dueño |
| --- | --- |
| `GDialog`: con ratón en WebKit el botón «Quitar» no recibe foco, así que Esc en la confirmación devuelve el foco al `body` (hallazgo 4 de `form-section`) | bruno / lima |
| `GDialog`: cerrar en el playground completo bloquea cuadros > 1 s con la máquina cargada (relayout por `html:has(.g-dialog[open])`) | bruno |
| `GDialog`: `--_pin-top` con `offsetTop` entero deja ≤ 0,5px en Firefox/WebKit (aceptado, #307) | — |
| `GTabs`: WebKit sin `overflow-clip-margin` (desborde +16px solo durante la entrada a sangre); el recorte corta sombras a > 4px del borde | — |
| `GFormSection`: salto de 22px de lo de abajo al desaparecer la línea de resumen al abrir (aceptado, hallazgo 3) | lima |
| `GRadioGroup`: «ЖШ» en `md` circular deja 0,1px de aire; tipografías más anchas podrían recortar | — |
| `AGENTS.md` asigna `*.meta.json` a bruno pero el agente coco cambia `status` (unificar) | usuario |

## 7. Solo en entorno real (no automatizable)

Lector de pantalla (VoiceOver, NVDA) sobre tabla, filtros, `GHelper`, formularios con `is-rejected`, `GMenu` con el foco siguiendo al puntero, `GTranscript`, `GAvatar`; Safari real (incluido Tab con acceso total por teclado); táctil y móvil reales; `forced-colors` real (Windows) y en Firefox/WebKit; zoom real 200/400 %; motor de transcripción real (Whisper local ya probado por el usuario en Chrome); evaluación ciega de Dark Color Presence por una segunda persona (`design/lab/theme-playground/blind/`).

## 8. Infraestructura

| Qué | Nota |
| --- | --- |
| Node 22 real | las pruebas se han corrido con Node 20 local; verificar en 22 |
| Playwright | un proceso por puerto (`GRANA_PW_PORT`); dos agentes en 4208 se tumban el servidor (lección en CLAUDE.md) |
| Carpetas sin seguimiento `.agents/skills/grana-component-flow/`, `grana-mora-docs/`, `improve-animations/` | no son de ningún rol; decidir si se versionan |
