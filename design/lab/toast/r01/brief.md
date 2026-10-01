# Brief — GToast: avisos breves no modales (r01)

> **El usuario eligió el componente y no entregó brief.** Este brief lo escribe kiwi desde los estándares (WAI-ARIA, WCAG 2.2, prácticas de sistemas de diseño consolidados) y desde lo que Grana ya decidió. Cada línea marcada **[propuesta]** es una recomendación de kiwi que se asume si el usuario no dice lo contrario; lo no marcado deriva de un estándar o de una decisión vigente de `DECISIONS.md` y no se pregunta.

## Qué es

Un **aviso breve y no modal** que confirma o informa del resultado de algo que el usuario acaba de hacer o que acaba de pasar en segundo plano («Cambios guardados», «No se pudo subir el archivo», «Copiado», «Proyecto archivado · Deshacer»). Aparece en una zona fija de la ventana, **no interrumpe la tarea** y **no recibe el foco**.

## Qué no es (y qué usar en su lugar)

| Necesidad | No es un toast | Usar |
| --- | --- | --- |
| Algo que exige decisión antes de seguir | Interrumpe, necesita foco | `GDialog role="alertdialog"` (#42) |
| Error de un campo o de un formulario | Debe estar junto al campo (WCAG 3.3.1) | Mensaje de error de `GInput`, `GSelect`… |
| Estado de una tarjeta o de un widget | El estado vive en su contenedor | `status` de `GCard` (#133), estados de `GWidget` (#73) |
| Ayuda contextual | Se abre a petición | `GHelper` (#101) |
| Información persistente de página | No desaparece | Banner o contenido de la página (fuera de este alcance) |
| Lista de notificaciones (bandeja, historial) | Es una vista, no un aviso | Fuera de alcance v0.1 **[propuesta]** |

**Regla:** nada que el usuario necesite para continuar puede estar **solo** en un toast (WCAG 2.2.1: si desaparece, la información no se pierde).

## Casos de uso

1. Confirmación de una acción: «Guardado», «Copiado al portapapeles», «Invitación enviada».
2. Acción reversible con **Deshacer**: «Proyecto archivado · Deshacer».
3. Resultado de una operación asíncrona (promesa): «Subiendo informe…» → «Informe subido» o «No se pudo subir».
4. Aviso del sistema: «Sin conexión, los cambios se guardarán al volver», «Nueva versión disponible · Recargar».
5. Error no bloqueante: «No se pudo sincronizar».
6. Avisos que llegan mientras hay un **diálogo modal** abierto (guardar dentro de un `GDialog`).

## Necesidades de Grana (derivadas de reglas vigentes)

- **Sin globals de la app ni `fetch`** (CLAUDE.md): Grana no crea una instancia global; la aplicación crea su gestor de avisos y lo instala.
- **Sin textos por defecto** (#29, #64, #97, #101): nombre de la región, «Cerrar», nombres de los tipos y plantillas los pone la aplicación (`labels`).
- **Iconos solo Lucide** con `GIcon` (#85–#87): tipo por **icono y texto**, nunca solo por color (WCAG 1.4.1).
- **Colores semánticos existentes** `info`, `success`, `warning`, `danger` y `neutral` (`tokens.md`); el nombre `error` de la API se pinta con `danger` (precedente de `GCard`, #133).
- **Región viva presente antes del cambio** (#14 `GBtn`, #137 `GCard`: `alert` solo para lo que aparece después del montaje).
- **Capa superior** (`popover`) para no quedar recortado ni debajo de otra capa (#55 `GSelect`, #101 `GHelper`) y **convivencia con `<dialog>` modal** (#42 `GDialog`).
- **Reutilizar**: `GBtn` (acción y cierre), `GIcon`, `GBadge` (contador de repetidos), tokens de movimiento `--g-duration-*` / `--g-ease-*` (#71), umbral de hoja móvil `space × 130` (#103).
- **No duplicar** `utils/anchor.js`: un toast no se ancla a un elemento sino al visor.

## Requisitos de estándar que el diseño debe cumplir

| Criterio | Exigencia |
| --- | --- |
| WCAG 4.1.3 Mensajes de estado | Se anuncia sin mover el foco: región viva `status` (cortés) o `alert` (enérgica) que **existe antes** del aviso |
| WCAG 2.2.1 Tiempo ajustable | Pausa con puntero, foco y ventana oculta; sin autocierre con acción o error; la aplicación puede desactivar el autocierre (preferencia del usuario) |
| WCAG 2.2.2 Pausar, detener, ocultar | El movimiento de entrada dura menos de 5 s y no se repite; nada parpadea |
| WCAG 2.4.3 Orden del foco / 2.1.1 Teclado | Acción y cierre alcanzables por teclado; atajo documentado para llegar a la región; el foco vuelve a donde estaba |
| WCAG 2.4.11 / 2.4.12 Foco no tapado | Un toast no oculta el elemento enfocado (mínimo: no del todo; mejor: nada) |
| WCAG 1.4.13 Contenido al pasar o enfocar | No aparece contenido nuevo al pasar el puntero (sin pila que se despliega con hover) y el cierre siempre es visible |
| WCAG 2.5.1 Gestos de puntero / 2.5.8 Tamaño del objetivo | Deslizar para cerrar es opcional y siempre hay botón; objetivos ≥ 24px (≥ 44px táctil) |
| WCAG 1.4.1 / 1.4.11 | Tipo por icono y texto; contraste 4.5:1 del texto y 3:1 del borde/icono (coco) |
| WCAG 2.3.3 / `prefers-reduced-motion` | Sin desplazamiento ni rebote con movimiento reducido |
| APG (live regions, alert) y HTML (`<dialog>` modal, `inert`, top layer) | Regiones vivas permanentes; lo de fuera de un modal es inerte |

## Alcance funcional pedido a esta ronda (lo pide el encargo)

API imperativa frente a declarativa; región viva única y permanente; cortés frente a enérgico por tipo; duración y pausas; sin autocierre con acción; una acción como máximo más cerrar; foco (no robar, atajo, Esc); apilado, límite visible y cola; deduplicación; 6 posiciones lógicas con RTL; móvil (abajo, ancho completo, deslizar opcional con alternativa); `safe-area`; no tapar el foco ni los controles; convivencia con `GDialog` modal; promesa (cargando → éxito/error); movimiento reducido; tipos con icono Lucide.

## Fuera de alcance v0.1 [propuesta]

Bandeja o historial de notificaciones; contenido enriquecido por slot (enlaces, imágenes, formularios dentro del aviso); más de una acción; barra de cuenta atrás visible; avisos anclados a un elemento; sonido o vibración; notificaciones del sistema operativo (Notification API).

## Estética

La define coco. Kiwi solo fija la estructura: superficie flotante compacta, icono de tipo al inicio, texto, acción y cierre al final; el tipo se reconoce por icono y texto aunque se quite el color.
