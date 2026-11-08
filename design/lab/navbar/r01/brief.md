# Brief · GNavBar, r01

> kiwi, 2026-11-08. Encargo: el usuario vio el marco A construido en `site/` (887c3779) y pide **«exactamente el mismo diseño que tenía antes, y que Grana lo logre»**. De A se conservan solo el filtro del índice (`/`) y los números 01–79. La barra superior del sitio anterior no existe en Grana: se hace como **componente real**, `GNavBar`. La forma visual está **fijada por la referencia** (`design/lab/sitio/referencia/`); esta ronda aporta la base funcional y una personalidad de comportamiento opcional que no cambia el aspecto.

## Para qué sirve y a quién

- **Quién:** quien llega a una documentación o a un sitio de producto hecho con Grana (evalúa, vuelve a consultar, cambia de idioma o de tema) y la aplicación que lo monta (VitePress hoy, cualquier SSR mañana).
- **Qué hace:** la navegación **de primer nivel entre secciones** del sitio (Guía · Componentes · Blocks · Playground · Cambios · GitHub), con la sección actual marcada por ruta (`activeMatch`), y el sitio para las acciones globales (búsqueda, idioma, tema, redes). En estrecho, lo recoge en «…» o en una pantalla de menú.
- **Qué no hace:** no es el índice de páginas (`GSidebar`), ni la barra inferior móvil de una aplicación (`GSidebar mode="navbar"`), ni pestañas (`GTabs`), ni el encabezado de la página (`GPageHeader`). No busca, no cambia el idioma ni el tema: aloja los controles que lo hacen.

## Auditoría previa (`docs/documentacion/auditoria-visual.md`)

| Punto | Estado en el sitio anterior (medido, `referencia/medidas.md`) | Consecuencia para la ronda |
| --- | --- | --- |
| Estructura | Barra de 64 a todo el ancho, marca sobre la columna izquierda, búsqueda a la izquierda, enlaces y acciones a la derecha | Se calca; la marca vive en `GSidebar` cuando la columna está (§2) |
| Jerarquía | Enlaces 14/500 en `text`; actual en `accent-text` | Se calca |
| Contraste y delimitación | Línea inferior `border`; actual/reposo **3,06:1** y hover igual que el actual | 1.4.1 frágil: P2 opcional y pregunta N-Q2 |
| Espaciado | Relleno 32 (24 en estrecho), enlaces con 12 por lado, separadores 1 × 24 | Se calca con `space` |
| Controles | Idioma al pasar el puntero; tema sin nombre accesible; «…» con nombre en inglés | No se calcan los defectos (§6 de la referencia) |
| Estados | Hover, actual, foco 2 px; panel de idioma; pantalla móvil | Se calcan con componentes reales |
| Consistencia | Iconos de VitePress recortados por la máscara | El calco usa Lucide entero |
| Reutilización | `GAppShell` (banda), `GMenu` (idioma), `GSwitch` (tema), `GDialog`+`GCombobox` (búsqueda), `GSidebar` (índice) | Solo la barra es nueva |

## Restricciones

- Tokens del tema por defecto; sin literales salvo 24/44 y el patrón de texto oculto. Iconos solo Lucide.
- SSR sin CLS: nada medido en el primer render; la actual sale de una prop.
- Un archivo, un dueño: la ronda no toca `site/`, contratos ni CSS de componente.
