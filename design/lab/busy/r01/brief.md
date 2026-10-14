# Brief — operación en curso sobre una superficie (spinner, indicador y capa de carga de la propuesta del usuario), r01: auditoría, base funcional y tres conceptos

> kiwi, 2026-10-13. Origen: propuesta del usuario (escrita con prefijo `nn-`): `spinner`, `loading-indicator` y `loading-overlay`, cuatro escenarios (inline, card, diálogo, pantalla completa). Se toma como **entrada a cuestionar**. Componente con forma visible: base funcional **y** tres conceptos divergentes A/B/C con los tokens reales del tema por defecto (CLAUDE.md «Personalidad e innovación»).

## Por qué la carpeta se llama `busy` y no `loading`

`loading` ya tiene dueño en Grana: es **la llegada de contenido** (`GLoadRegion`, el motor `loadPhase.js`, la prop compartida `loading` de `api.md`, `design/lab/empty-skeleton/`). Lo que la propuesta pide de verdad con su capa es otra cosa: **una operación que la persona lanzó y que está en curso sobre contenido que ya está a la vista** (guardar, publicar, aplicar, cambiar de espacio). `busy` es el vocabulario que Grana ya usa para eso (`aria-busy`, `is-busy` de la isla y de la región, `busyLabel` de la acción de la isla) y evita que la ronda se lea como una segunda región de carga.

## Para qué

Una persona pulsa «Guardar cambios» en una tarjeta de ajustes, en un diálogo, o «Cambiar a Laboratorio Norte» en la cabecera. Mientras el servidor responde (de 100 ms a varios segundos):

- tiene que saber **que algo pasa y qué** (no «cargando»: «Guardando cambios»);
- tiene que saber **qué queda bloqueado** y qué no (esta tarjeta, este diálogo, toda la aplicación);
- **no debe poder actuar dos veces** ni editar lo que se está enviando;
- **no debe perder lo que miraba** ni el sitio del foco;
- si la operación lo permite, **puede cancelar**;
- al terminar, bien o mal, todo vuelve a ser usable, y el resultado lo dice quien debe (aviso, error del formulario, isla).

Lo usan administraciones, laboratorios, expedientes y paneles; con puntero, teclado, táctil y lector de pantalla. La aplicación sabe cuándo empieza y termina la operación; el componente no pide nada (sin `fetch`).

## El problema de lo que hay

- **La premisa común: un velo gris semitransparente con un spinner centrado.** Tapa (y baja el contraste de) lo que la persona acaba de escribir; no dice qué está bloqueado más allá del velo; el spinner dice «espera» pero no «qué»; casi siempre bloquea solo con `pointer-events` (el teclado sigue entrando), y si el foco estaba dentro, cae en `body`. Si la respuesta tarda 150 ms, el velo **parpadea**.
- **En Grana hoy** (inventario de esta ronda): `GBtn loading` (giro, `aria-disabled` sin perder el foco #17, `loadingText` en región propia #14), `GInput`/`GTextarea`/`GSelect`/`GSwitch`/`GCombobox` con giro que no bloquea, `GDialog loading` (`aria-busy` + un pulso infinito; **no bloquea nada**, `dialog.md`), la acción de la isla con `busy`, `GLoadRegion` con refresco `keep` (lo de antes inerte con filo y píldora: es una «capa» de lectura ya resuelta). **No hay** forma de bloquear una superficie mientras corre una **escritura**, ni de bloquear la aplicación entera, ni de impedir que Esc cierre un diálogo a medio guardar. `GForm` no tiene estado «enviando». `GProgress` solo es determinado (no hay modo indeterminado, y está bien así).

## Qué es esta ronda

1. **Auditoría de solapamiento** con lo existente: qué se reutiliza, qué se amplía, qué de la propuesta sobra o cambia.
2. **Base funcional** común: semántica, bloqueo real con `inert`, foco, anuncios sin duplicar, tiempos del motor (200/400/5000 ms), cancelar, fin y error, pantalla completa sin crear un diálogo de `GDialog`, integración con `GDialog` sin abrir otro.
3. **Tres conceptos** que cuestionan la premisa «velo + spinner centrado»: **A · El contorno** (el borde de la superficie es el indicador; nada se tapa), **B · En firme** (lo que se envía se queda a la vista como registro, congelado; la fila de acciones dice qué se está guardando), **C · Las etapas** (una hoja que sube desde la zona de acciones y narra las etapas reales de la operación).
4. **Comparativa, recomendación y una pregunta de elección.**

## Escenarios del prototipo (los cuatro de la propuesta, corregidos)

| # | Propuesta | En esta ronda | Por qué el cambio |
| --- | --- | --- | --- |
| 1 | Inline: «Cargando…» en acciones y botones | Campo + «Guardar» en una fila | Ya existe (`GBtn loading` + `loadingText`). Se enseña cómo encaja cada concepto con él, no un componente nuevo |
| 2 | Overlay de card: «Actualizando datos» | Tarjeta de ajustes: «Guardando cambios» | «Actualizando datos» es **lectura** y ya lo resuelven `GLoadRegion` (refresco `keep`) y los anfitriones (#540). La capa nueva es para **escrituras** |
| 3 | Overlay en diálogo: «Guardar cambios · Se están guardando tus cambios · Procesando…» | Diálogo de edición: «Guardando cambios» | Igual, sobre `GDialog` real (sus clases de `dist/grana.css`) |
| 4 | Pantalla completa: «Cargando aplicación» | «Cambiando a Laboratorio Norte» | La carga **inicial** de la aplicación ocurre antes de que Vue monte: no la puede pintar un componente (es HTML de la aplicación). Lo que sí bloquea la aplicación ya montada: cambiar de espacio, cerrar sesión, restaurar una copia |

## Cómo se juzga

`index.html` enseña los tres conceptos **lado a lado** en cada escenario con los tokens reales (`packages/vue/dist/grana.css`, tema por defecto, claro y oscuro, RTL, movimiento reducido emulado con `?motion=reduce`). Controles: duración (100 ms, 900 ms, 2,5 s, 7 s), resultado (bien/falla), cancelable, etapas. Registro visible de lo anunciado. `verificar.mjs` comprueba la base en los tres conceptos y en Chromium, Firefox y WebKit.
