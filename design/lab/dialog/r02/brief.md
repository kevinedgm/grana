# Brief — `GDialog` r02: niveles anidados (apilado o pasos)

> kiwi, 2026-10-13. Origen: hallazgo 5 (P1) de la integración real en NisaNabani, módulo de inventarios (página de Notion «Hallazgos de integración real · Grana»). Continúa `../r01/` (estructura del diálogo, no se reabre) y la personalidad de `GDialog` (#301, #307: D1 «viene de donde lo llamaste», D2 «crece hacia abajo»). Componente con forma visible: base funcional **y** tres conceptos divergentes con los tokens reales del tema por defecto (CLAUDE.md «Personalidad e innovación»).

## Para qué

Terminar una tarea que se interrumpe porque **falta algo**, sin perder lo que ya se llevaba hecho. El flujo real encadena cinco niveles:

1. **Detalle de producto** (Ácido clorhídrico 37 %) →
2. **Ingreso desde orden de compra** (OC-2291, tres partidas) →
3. **Partida 3** (en la orden viene «Tris base», que no está en el catálogo) →
4. **Producto nuevo** (Tris base; le falta la categoría) →
5. **Categoría nueva**.

Al crear la categoría, debe quedar **elegida en el producto**; al crear el producto, **elegido en la partida**; al guardar la partida, **la fila del ingreso** lo muestra. Lo usan almacenistas con teclado y ratón en escritorio, en tableta y en teléfono (hoja), y con lector de pantalla.

## El problema de lo que hay

`dialog.md` «Límites conocidos»: «Sin diálogos apilados ni no modales en v0.1: un diálogo sobre otro funciona con el navegador, pero no está verificado ni diseñado». El proyecto lo resolvió con pasos dentro de un solo diálogo, a mano: foco, título, «Volver», anuncios y retorno.

Medido en esta ronda con el **`GDialog` real** anidado cinco veces (`index.html?c=hoy`, tres motores):

| Qué | Medida |
| --- | --- |
| La pila nativa | Funciona: cinco `<dialog>` en `:modal`; `GToaster` se traslada al quinto (`topModal.js` ya sigue la pila) |
| Fondos | **Cinco fondos visibles**, opacidad compuesta **0,855** con el tema claro (0,32 cada uno); con el oscuro (0,6) serían 0,99 |
| Esc mantenida | Desde el nivel 5, **siete pulsaciones (seis repetidas) cierran los cinco niveles**: se pierde todo el flujo |
| Formularios | Un `GForm` dentro de un `GDialog` que está dentro de otro `GForm` **se pinta como `<div>`** (lo detecta como anidado por `inject`, que atraviesa el diálogo): el botón «Crear categoría» del nivel 5 **envía el formulario del nivel 2** (submit del ingreso 1, de la categoría 0) con los datos de los cuatro niveles mezclados |
| Retorno del foco | Nativo, al disparador de cada nivel; en WebKit, al `<dialog>`, porque el clic no enfoca el botón (#307) |
| Contexto | Ningún nivel dice de dónde viene ni adónde va su resultado; el lector de pantalla no sabe la profundidad |

## Qué es esta ronda

1. **Base funcional** común a cualquier forma: nombre y propósito de cada nivel, quién lo abre, foco al entrar, salidas hacia abajo (Esc sin repetición, Volver, Cancelar), fondo, borradores que no se pierden, resultado que baja con foco y anuncio, cierre del flujo entero, formularios por nivel, avisos, móvil y movimiento reducido.
2. **Tres conceptos** sobre el mismo flujo de cinco niveles:
   - **A · La baraja:** cada nivel es un diálogo modal de verdad; los de abajo quedan como **lomos** con su título y lo que esperan; un solo fondo; pulsar un lomo vuelve a ese nivel.
   - **B · El hilo:** **un solo diálogo** con historial de pasos; un hilo de números dice de dónde vienes y Volver devuelve el resultado al paso de abajo.
   - **C · En su sitio:** cuestiona la premisa: un nivel nuevo solo cuando **cambia la tarea**; lo que falta se crea **donde se echa en falta**, en un pliegue que se abre bajo el campo, sin tapar lo que se estaba llenando.
3. **Comparativa, recomendación de kiwi y una pregunta de elección** (la decide el usuario).

## Solapes revisados antes de proponer

| Pieza | Qué comparte | Decisión |
| --- | --- | --- |
| `GDialog` (`dialog.md`, #42, #152, #292, #301, #307) | `<dialog>` nativo, `dismiss` cancelable, foco inicial, D1 y D2 | **Se extiende, no se duplica.** A usa varios `GDialog`; B, uno con pasos; C, uno o dos. El orden de foco de #292 rige dentro de cada nivel |
| `utils/topModal.js` | Pila de `<dialog>` en `:modal` (avisos, isla, voz) | Ya sigue la pila (medido con `GToaster`). Sirve también para saber si un `GDialog` se abre **sobre** otro (A) |
| Canal cortés de página (`liveRegion.js`, #533) | Un solo `aria-live` por documento que viaja al modal superior | El anuncio del resultado («creada y elegida») usa ese patrón |
| `GSelect` `createLabel` / `create` | Fila «Crear…», devuelve el foco al selector y emite `create` | Es la **puerta** de los niveles 3 → 4 → 5. C propone que el campo aloje la creación (slot) en lugar de solo emitir |
| `GCombobox` (`v-model:custom`, A «el campo se abre») | Texto libre que no está en las opciones | C es el mismo gesto llevado a la creación completa |
| `GFormReveal`, `GFormSection` `addable` | Bloques que se abren dentro de un formulario, `inert` cerrados | C se parece al revelado, pero su pliegue tiene **su propio confirmar** y **no** viaja en el envío del formulario de abajo |
| `GStepper` | Pasos | **No se usa:** `GStepper` es un proceso **conocido y lineal**; aquí la pila es **dinámica** (crece por lo que falta) |
| `GBreadcrumbs` | Ruta de niveles con cesión | El hilo de B es su pariente, pero son **botones** de un historial (`aria-current="step"`), no enlaces de página: parte interna del diálogo, no `GBreadcrumbs` |
| Slot `tabs` de `GDialog` | Cabecera fija bajo el título | B pone el hilo en el mismo sitio; con pasos no hay pestañas (se reserva la combinación) |
| `GForm` | Un formulario por tarea, envío, errores, foco al primer error | Cada nivel lleva **su** formulario; hoy el anidamiento lo rompe (hallazgo L1) |

## Ver

`index.html?c=hoy` (componente real), `?c=A`, `?c=B`, `?c=C`; `&dir=rtl`. En cada concepto: «Abrir detalle de producto» → «Registrar ingreso…» → «Completar partida 3» → Producto: «Crear producto…» → Categoría: «Crear categoría…».

Verificación: `node design/lab/dialog/r02/verificar.mjs` (puerto 4212).
