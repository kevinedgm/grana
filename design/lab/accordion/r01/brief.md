# Brief — acordeón / sección plegable fuera de formularios (`GAccordion`, nombre de trabajo), r01

> kiwi, 2026-10-07. Origen: Fase C del plan de v1, punto 12. Base funcional y tres conceptos de forma en la misma ronda (regla del usuario, CLAUDE.md «Personalidad e innovación»).

## Para qué

- **Preguntas frecuentes**: muchas preguntas cortas, respuestas de uno a tres párrafos. Se recorren con la vista (o con la tecla H del lector) buscando «la mía»; se abren una o varias; se comparan dos respuestas.
- **Paneles de detalles**: la información secundaria de una ficha (preparación de un estudio, condiciones de un pedido). A veces es **larga**: se abre, se baja leyendo y hay que volver a cerrarla.
- **Ajustes agrupados** que se aplican al momento (interruptores de notificaciones, privacidad, idioma). Lo que más se pregunta es «¿cómo lo tengo ahora?», sin abrir cada grupo.

Lo usan personas en escritorio (puntero y teclado), en móvil (pulgar, pantalla corta) y con lector de pantalla (navegación por encabezados). También llegan desde fuera: un enlace a `#pregunta`, un resultado de buscador con `#:~:text=` o Ctrl+F.

## El problema de lo que hay

- La **caja con chevron** de los frameworks: un encabezado cerrado no dice nada de lo que guarda (hay que abrir para saber), en «uno a la vez» el encabezado que tocas **salta** hacia arriba bajo el dedo cuando se cierra el de encima (medido: 336 px), y cerrar una sección larga desde abajo te manda lejos de donde leías.
- `<details>/<summary>` resuelve la búsqueda y la exclusividad, pero pone el encabezado **dentro** del botón (al revés que APG), no anima el cierre fuera de Chromium y no sabe de «deshabilitado» (punto 2 de la declaración).
- Lo plegado suele quedar **fuera de la búsqueda de la página** y **fuera de la impresión**.

## Solapes revisados antes de proponer

| Componente | Qué comparte | Decisión |
| --- | --- | --- |
| `GFormSection mode="collapsible"` (#284 a #292) | `hN > button[aria-expanded][aria-controls]`, chevron `chevron-right` al inicio que gira y se espeja, rejilla `0fr → 1fr` con `--g-duration-slow`, `is-ready`/`is-animating`/`is-instant`, foco al botón antes de ocultar, `OPEN_REQUEST` (#287) | **Comparte el motor de plegado y el marcado**; no comparte la API de formulario (`summary` con errores, `addable`, `headerPlacement`, registro en `GForm`). Frontera en el punto 15 de la declaración |
| `GFormReveal` (#274 a #280) | Rejilla `0fr → 1fr`, contenido **nunca desmontado** | Mismo motor de altura; `GFormReveal` lo abre una respuesta, no un botón, y no tiene encabezado |
| `GTabs` | Encabezados que muestran un panel; flechas | No: en pestañas solo se ve un panel y el resto no está en la página; en el acordeón todo está en la página, en orden, y se puede abrir varios. C no es pestañas verticales (no hay `tablist`) |
| `GCard` `expandable` / región `more` | Divulgación «Mostrar más» | No se toca: divulga una parte de una tarjeta, sin encabezado propio |
| `GSidebar` (submenú), `GStepper` (lista móvil), `GHelper` | Divulgaciones | Otra cosa (navegación, pasos, ayuda). Se reutiliza el chevron de #71 |
| `GDataList` | Lista de datos | Sin filas plegables; no hay solape |
| `GSummary` | Ficha de resumen | Puede ir **dentro** del avance de A (ajustes) en una ronda futura; no se compone en r01 |

## Entregables

- `accordion.js` (prototipo `XAccordion`/`XAccordionItem` sobre Vue global; no es el componente), `accordion.css` (tokens reales del tema por defecto), `index.html` (`?c=base|A|B|C|all`, `&dir=rtl`, `&slow=1`).
- `serve.mjs` + `verificar.mjs` (Playwright de `design/lab/theme-playground/`, **puerto 4214**, Chromium, Firefox y WebKit).
- `declaracion.md`: decisiones numeradas, conceptos y comparativa, «Qué lo hace distinto», comprobaciones, hallazgos L1… para lima y las preguntas de producto.

## Ver

`design/lab/accordion/r01/index.html` servido desde la raíz del repo. Verificación: `node design/lab/accordion/r01/verificar.mjs` (requiere `npm run build`; `ENGINES=`, `PARTS=base,A,B,C`, `VERBOSE=1`).
