# Brief — aviso en línea y de página (r01, base funcional)

> Brief de kiwi a partir del encargo del usuario (2026-10-04): «aviso en línea tipo banner para errores de servidor y mensajes de página». Carpeta de trabajo `design/lab/alert/`; nombre propuesto **`GNotice`** (ver «Nombre»). **Estado de r01:** tras la crítica del usuario («se ve genérico»), r01 queda como **base funcional** (frontera, semántica, anuncios, foco, casos). La **forma** se decide en `r02/` (tres conceptos divergentes).

## Qué es

Un mensaje **persistente y no modal** que vive **donde está el asunto**: dentro del contenido (una sección, una tarjeta, un diálogo, junto a un botón) o a nivel de página. Dice qué pasó, qué puede hacer la persona y se queda hasta que la condición cambia o la persona lo cierra. Cubre el hueco que `toast.md` l. 30 deja fuera: «Información persistente de página → Banner o contenido».

## Frontera (leída en la fuente)

| Necesidad | Usar | Por qué no este componente | Fuente |
| --- | --- | --- | --- |
| Confirmar algo breve que acaba de pasar y puede perderse («Cambios guardados») | `GToast` | Transitorio, imperativo, fuera del flujo; «nada imprescindible solo en un aviso» | `toast.md` Principios |
| Errores de **validación** de un `GForm`, incluidos los que devuelve el servidor por campo (422) y los generales que la aplicación pone en `errors` | `GErrorSummary` + mensaje del campo | Lleva enlaces a los campos y recibe el foco al enviar; `errors` con claves sin campo ya son «errores generales o de servidor» | `form.md` «Envío» pasos 3, 4 y 6 |
| Error o ayuda de **un** campo | `__message` del campo (`GInput`…) | Debe estar junto al campo (WCAG 3.3.1) | `input.md` |
| Explicación a petición | `GHelper` | Se abre cuando la persona la pide | #101 |
| Estado o cuenta de un objeto («Activo», «3») | `GBadge` | Es un dato, no un mensaje | `badge.md` |
| Decisión obligatoria antes de seguir | `GDialog role="alertdialog"` | Interrumpe y toma el foco | #42 |
| Estado breve del envío junto a los botones («Guardado hace 2 min») | región `status` de `GFormActions` | Una línea de texto, sin acciones | `GFormActions.vue` l. 90 |
| Estado de **una tarjeta** (su dato no cargó) | `status` + `retryable` de `GCard` | La tarjeta ya lo resuelve | #133 |
| Tabla vacía o sin resultados | `empty` de `GTable` | No es un error | `GTable.vue` l. 288 |
| **El servidor falló** (500, tiempo agotado, sin red) al guardar o al cargar, y la persona no puede arreglarlo en un campo: «Reintentar», detalle técnico | **este** | — | — |
| **Condición de página que dura**: mantenimiento, solo lectura, sesión por caducar, sin conexión | **este** | — | — |
| **Resultado que debe quedarse** (éxito con enlace a lo creado) | **este** | Un `GToast` se va | — |
| Advertencia o información **dentro** de una sección, tarjeta o diálogo, con o sin acción | **este** | — | — |

Dos reglas de uso que salen de la tabla: **nunca dos mensajes para el mismo suceso** (resumen de validación *o* aviso de servidor; aviso persistente *o* flotante) y **`GTable` no tiene estado de error**: el fallo de carga es de este componente.

## Nombre

`GAlert` sugiere `role="alert"` (y casi nunca lo es) y choca con `alertdialog`; `GBanner` solo nombra la presentación de página. Propuesta: **`GNotice`** (`<g-notice>`): no promete un rol, cubre línea y página, y no se confunde con `GToast`. Es identidad: lo confirma el usuario (pregunta de r02).

## Lo que decide r01 (y se conserva)

Semántica y anuncio; foco al aparecer, al cerrar y al cambiar; anatomía mínima de contenido (tipo, título, cuerpo, acciones, detalle, cierre); señal no cromática; reglas de la presentación de página (posición en el DOM, apilado, `sticky`, reserva de borde); comportamiento «no mueve lo que estás usando». Todo medido en `verificar.mjs` (Chromium, Firefox, WebKit).

## Lo que NO es r01

No es la forma final (r02). No escribe contrato, CSS ni `.vue`. No incluye bandeja ni historial, ni agrupación «×3» (eso es de `GToast`).
