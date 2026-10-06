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
| `GNumberField`: **hecho** (`candidate`, #309 a #314). Queda: en WebKit con la fuente de serie el cursor al final desplaza 1px el número con foco; arreglo medido = hueco del cursor de 1px a 2px en `__mirror`/`__measure` (constante de #313: lima enmienda, coco cambia dos líneas; el mínimo publicado sube 1px) | 2 | hallazgo 1 de `design/lab/number-field/auditoria.md` |
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
| `GCombobox`: **hecho** (`candidate`, #329 a #338, #356, #358; fichas con `GSummary`). Queda: en el campo, la ficha del valor recorta el título hasta 4ch antes que el identificador («Daniela C… Exp. 001399 +3» a 290 px; orden de cesión de `GSummary`; si el usuario prefiere el nombre primero, hace falta una prop u orden por anfitrión); WebKit abre 500 opciones en 122 ms (tope 150: volver a medir si se añade pintura); banco de estilo `estilo-banco.html`/`estilo-verificar.mjs` sin migrar al marcado de #356 (coco) | usuario / coco | `design/lab/combobox/auditoria.md` |
| `GAdaptiveLayout`: **hecho** (`candidate`, #339 a #348, #359 a #365). Queda: más de un nivel de grupos anidados sin probar; coste de redimensionar 5,4 ms por paso sobre `GFormLayout` medido solo en Chromium; `forced-colors` solo en Chromium | bruno / coco | `design/lab/adaptive-layout/auditoria-coco.md` |
| `GFileField`: **hecho** (`candidate`, #366 a #379). Reservas de #378: C `expected` (una casilla por documento) y B `appearance="gallery"` (mesa de luz), cada una con su entrega; sin aviso de desarrollo cuando falta `name` dentro de `GForm` (no puede bloquear el envío); `--g-form-min: 62` frente a 61,3 medido | bruno / lima | `design/lab/file-field/auditoria.md` |
| `GSummary`: **hecho** (`candidate`, #349 a #357). Reservas de #357: casillas alineadas de B (`align`, `heading`), `layout="auto"`/`"panel"`, segunda cara de C (`expandable`, «+N» como botón), `surface` propia (no recomendada), slot por dato, `status` en la opción de `GCombobox`; adopción en `GCard`, `cell-{key}` de `GTable`, `GMenu`, `GSelect` y `GSidebar`, cada una con su ronda. **Confirmar con el usuario (no bloquea):** vista previa de la paleta en `stack` y no como corriente de A sin límite. Como hijo directo de un `GAdaptiveLayout` probablemente necesite `hint` (lleva `contain: inline-size`; sin probar) | ronda propia / usuario | `design/contracts/summary.md` |
| `GCombobox` Fase 2 · `multiple` (modelo y `custom` como Array, `selectedOptions`, un oculto por valor) | ronda propia de kiwi | #338 |
| `GTagInput` (etiquetas sin catálogo) | ronda propia | #338 |
| `GCombobox`: ampliar a la paleta desde `field` (`expandable`, `labels.expand`, icono `maximize-2`) | ronda corta de kiwi: medir el disparador y el traspaso lista → modal con búsqueda pendiente | #338 |
| `GInputGroupCombobox` (CP + colonia) y `GCombobox` como editor de valor de `GFilterBar` (obligaría a revisar la entrada del paquete) | reservados | #338 |
| `GCombobox`: semillas descartadas (fichas en rejilla 2D, Tab que acepta siempre) y `autoHighlight: false` solo si el lector real lo pide | — | `design/lab/combobox/r02/` |
| `GCardGroup` | agrupa tarjetas de selección; hoy radios de `name` común | #124 |
| `GAvatarGroup` | pila con «+N», orden de lectura, anillo con `mask` | `avatar.md`, kiwi r01 |
| Archivo (`GFileField`), hora, deslizador, chip/etiqueta suelta | sin ronda; candidatos a próximos | — |
| Aviso persistente: conceptos **A** (nace de su causa) y **C** (nota al margen con línea de tiempo), reservados tras elegir **B · Isla de estado** | por si el usuario quiere mezclar | #315, `design/lab/alert/r02/` |

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
| `GTable` sin estado de error; «0 resultados» se anuncia junto al error de la isla; reservados prop `error` y slot `error` (#327) | lima / bruno |
| Isla de estado: replegada puede tapar un control pequeño bajo ella (se evita con `position`/`offset`); el panel de voz y la isla abierta se solapan si se abren por teclado o por programa (con puntero, abrir uno cierra el otro; montar la isla después de `GToaster` y `GSpeechHost`); en WebKit el radio cambia en 2 pasos en vez de 5–6; `Alt+F8` reservado por el gestor de ventanas en GNOME/Xfce (no comprobado; alternativa `Alt+Shift+F8`); color de superficie inversa en vez de `brand` (#325) pendiente de que el usuario lo vea con un tema de color | usuario / lima |
| `GAvatar`: con texto al 200 % las iniciales (en rem) se salen de la caja (en px), también fuera de un layout (hallazgo 7 de `design/lab/adaptive-layout/auditoria-coco.md`) | coco |
| `GSummary` en `inline`: el tamaño u otro dato puede verse cortado 1–10 px junto al nombre; `GFileField` lo corrige desde el anfitrión (hallazgo 3 de `design/lab/file-field/auditoria.md`), falta llevarlo a `GSummary.css` | coco |
| `GSummary` en `forced-colors`: la tesela del icono no se fuerza (`GIcon` con `preserve-parent-color`) y el icono puede desaparecer; `GFileField` lo corrige desde el anfitrión | coco |
| `GFormRow`: la caja de `GInput`/`GSelect`/`GInputGroup`/`GDatePicker` se estira junto a un vecino más alto (156 px junto a un `GFileField` con cuatro fichas); precisado en `form.md` §4 (#379), falta `align-self: start` en su CSS | coco |
| Playwright en pasadas largas con la máquina cargada: en WebKit `avatar.spec.mjs` (51, 128, 223) y `adaptive-layout.spec.mjs:50`, y en Firefox varias de personalidad y la de rendimiento de `GSummary`, superan el tiempo de espera; cada una pasa sola (2026-10-05). Diagnóstico de bruno (847e51b): **no es `GAdaptiveLayout`** (0 medidas durante el caso grande de `form-distribution`, mismos tiempos con y sin `#sec-adaptive`); probable contención del entorno (varios Playwright a la vez, `MTLCompilerService` al 100 %) y red: cada prueba descarga Vue de `unpkg.com/vue@3` sin versión fija. Arreglo propuesto: interceptar unpkg en las specs y servir `node_modules/vue/dist/vue.global.js` en local (o fijar la versión), y pasadas largas con `--workers=2` sin solapar con otros agentes | bruno |
| `GDialog`: con ratón en WebKit el botón «Quitar» no recibe foco, así que Esc en la confirmación devuelve el foco al `body` (hallazgo 4 de `form-section`) | bruno / lima |
| `GDialog`: cerrar en el playground completo bloquea cuadros > 1 s con la máquina cargada (relayout por `html:has(.g-dialog[open])`) | bruno |
| `GDialog`: `--_pin-top` con `offsetTop` entero deja ≤ 0,5px en Firefox/WebKit (aceptado, #307) | — |
| `GTabs`: WebKit sin `overflow-clip-margin` (desborde +16px solo durante la entrada a sangre); el recorte corta sombras a > 4px del borde | — |
| `GFormSection`: salto de 22px de lo de abajo al desaparecer la línea de resumen al abrir (aceptado, hallazgo 3) | lima |
| `GRadioGroup`: «ЖШ» en `md` circular deja 0,1px de aire; tipografías más anchas podrían recortar | — |
| `AGENTS.md` asigna `*.meta.json` a bruno pero el agente coco cambia `status` (unificar) | usuario |

## 7. Solo en entorno real (no automatizable)

`GSummary`: lector de pantalla sobre lo cedido y el texto accesible de la opción, `forced-colors` real, CJK y palabras muy largas. `GCombobox`: lector de pantalla (eco de escritura con la primera opción activa, texto fantasma junto a `aria-activedescendant`, dos `combobox` en la superficie, `aria-describedby` del valor, filas de acción), teclado virtual sobre la hoja, IME y `forced-colors` real. Isla de estado: lector de pantalla sobre el resumen, los canales tras el traslado al modal y `role="timer"`; `Alt+F8` en Linux y con lector; convivencia real con la sesión de voz. Lector de pantalla (VoiceOver, NVDA) sobre tabla, filtros, `GHelper`, formularios con `is-rejected`, `GMenu` con el foco siguiendo al puntero, `GTranscript`, `GAvatar`; Safari real (incluido Tab con acceso total por teclado); táctil y móvil reales; `forced-colors` real (Windows) y en Firefox/WebKit; zoom real 200/400 %; motor de transcripción real (Whisper local ya probado por el usuario en Chrome); evaluación ciega de Dark Color Presence por una segunda persona (`design/lab/theme-playground/blind/`).

## 8. Infraestructura

| Qué | Nota |
| --- | --- |
| Node 22 real | las pruebas se han corrido con Node 20 local; verificar en 22 |
| Playwright | un proceso por puerto (`GRANA_PW_PORT`); dos agentes en 4208 se tumban el servidor (lección en CLAUDE.md) |
| Carpetas sin seguimiento `.agents/skills/grana-component-flow/`, `grana-mora-docs/`, `improve-animations/` | no son de ningún rol; decidir si se versionan |
