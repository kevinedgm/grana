# Brief — visor de documentos (`GDocumentPreview`), r01

**Pedido del usuario** (primer paso del Fruti Squad para un componente nuevo). El brief original lo llama `nn-document-preview`; en Grana es **`GDocumentPreview`** / `<g-document-preview>` / avisos `[Grana GDocumentPreview]` / tokens `--g-*`.

## Objetivo

Un componente compuesto y reutilizable para **ver, recorrer y usar** archivos, con foco en **PDF e imágenes**, integrado con la arquitectura, los tokens y las convenciones de Grana. No una pantalla aislada ni un visor con botones pegados sin estructura.

## Responsabilidades separadas (nombres de trabajo de las partes)

| Parte del brief | Nombre propuesto | Qué hace |
| --- | --- | --- |
| A. Document Preview | **escenario** (`g-document-preview__stage`) + **renderizadores** | Área principal; un renderizador por tipo con estructura visual compartida |
| B. Document Toolbar | **barra** (`__tools`, `role="toolbar"`) | Herramientas según archivo y vista activa; todas o una selección |
| C. Document Metadata | **ficha** (`__meta`, compone `GSummary`) | Nombre, tipo, tamaño, páginas, fecha, disponibilidad, datos del anfitrión |
| D. Document Navigation | **navegación** (`__pages`, `__zoom`, `__thumbs`) | Página anterior/siguiente, actual/total, zoom, ajustes, miniaturas; se adapta al tipo |
| E. Document Actions | **acciones** (`__actions`) | Descargar, imprimir, compartir, enviar por correo y las que la aplicación aporte, sin acoplarse a un proveedor |

## Tipos

- **PDF:** render, navegación, página actual/total, zoom y ajustes, miniaturas si es viable, descarga del original, impresión del documento completo, estados. Selección de texto, búsqueda, enlaces y giro **solo** si el renderizador lo permite (viabilidad investigada en la declaración, §3).
- **Imágenes:** los formatos que la aplicación sirva con seguridad; ajuste al contenedor, zoom, vista completa, descarga del original, impresión sin recortes, proporción conservada.
- **Otros:** estrategia extensible; si no se puede mostrar, vista alternativa (nombre, tipo, tamaño, icono, acciones compatibles). Nunca renderizar formatos desconocidos.

## Variantes

Integrado (`embedded`), panel (`panel`), diálogo (respeta `GDialog`) y pantalla completa (entrar, salir, conservar el estado, pantallas pequeñas).

## Estados

Carga inicial, listo, carga progresiva, error de carga, no encontrado, tipo no compatible, protegido o con autorización, error de descarga, impresión no disponible, demasiado grande para el modo, vacío o dañado, sin conexión, acción en curso / completada / fallida. En el área afectada y con una salida.

## Restricciones

- Accesibilidad: teclado completo, nombres, foco visible, estados por los canales vivos existentes, movimiento reducido, foco de diálogo correcto, nada solo por color.
- Seguridad: no inyectar contenido no confiable en el DOM, tipos validados en el anfitrión, permisos respetados, URL remotas según la política de la aplicación; ocultar un botón no protege el recurso; la extensión no es seguridad.
- Grana: solo tokens; iconos solo Lucide; mínimos 24/44 px; sin `fetch` en el componente (patrón de adaptador de `GFileField` y de la voz); sin dependencias nuevas sin justificar; peso del principal agotado (#550).
- Criterio del brief: lo que solo tiene botón **no** está implementado; lo no conectable es «punto de integración pendiente» explícito.

## Lo que entrega kiwi en esta ronda

Auditoría con límites técnicos honestos, base funcional, tres conceptos divergentes (A/B/C) con los tokens reales del tema por defecto, comparativa y una pregunta de elección; piezas de entrada propia y preguntas para lima. Sin contrato, sin CSS final, sin `.vue`.
