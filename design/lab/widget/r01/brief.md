# Brief funcional · Sistema de widgets (GWidget, primitivas y GWidgetGrid) · r01

**Agente:** kiwi (ejecutado por el squad siguiendo `.agents/skills/bruno/references/handoffs.md`)
**Ruta:** R1 · prototipo directo **Fidelidad:** F2 · wireframe mid-fi con kit neutral

## Enunciado

Un **desarrollador que usa Grana** necesita construir **dashboards** con **widgets**: unidades visuales independientes que muestran información relevante de un vistazo (métricas, listas, progreso, estados, actividad, tablas compactas, gráficos), **sin recrear la carcasa cada vez** ni resolver por su cuenta los estados (cargando, vacío, error, desactualizado, deshabilitado), la **adaptación al espacio real** (un mismo widget en una rejilla, un panel lateral o un diálogo) ni el **reordenamiento y el redimensionado accesibles** (puntero y teclado). El contenido es intercambiable: la carcasa **no conoce su significado**.

Decisiones del usuario (respuestas de alcance): la primera entrega incluye **`GWidget`** (la carcasa con estados), las **primitivas de contenido** (métrica con tendencia, lista compacta, progreso, estado y leyenda; **sin gráficos propios**: el gráfico lo pone la aplicación en un slot) y **`GWidgetGrid`** (la rejilla del dashboard). **La galería y el panel de configuración quedan para una segunda entrega.** El widget **mide su propio ancho y alto** y elige un **nivel de detalle** (divulgación progresiva); la rejilla se **reordena y redimensiona con puntero y con teclado**, con anuncios para lectores de pantalla, y la aplicación guarda el layout.

Brief de diseño del usuario (resumen): carcasa con encabezado compacto (icono, categoría, título, badge/estado, menú de acciones), contenido, pie opcional y acciones; **familias de tamaño** (small, medium, large, wide, tall) donde el tamaño decide **cuánto detalle** se muestra, no solo la escala; layout fluido que se reorganiza; estados (cargando con **esqueleto que conserva la estructura**, con datos, vacío, error, desactualizado, deshabilitado); interacción limitada (un widget no es una aplicación dentro de otra); **drill-down** a página, diálogo o panel; personalización opcional (agregar, quitar, mover, redimensionar); responsive (varias columnas en escritorio, menos en tableta, una en móvil, **sin widgets distintos por dispositivo**); estética limpia, modular y de datos, con jerarquía por espaciado, tipografía y escala (no por bordes, sombras ni capas).

## Pregunta de diseño

¿Qué anatomía, niveles de detalle y comportamiento necesita el sistema para que **un widget conserve su significado al pasar de grande a pequeño** (menos espacio = menos detalle, no todo encogido), para que **los estados no cambien su estructura** (el esqueleto, el vacío y el error ocupan el mismo lugar que los datos) y para que **reordenar y redimensionar sea posible sin arrastrar** (WCAG 2.5.7), con el resultado anunciado y sin que un widget «se pierda» en la rejilla?

## Verbo y resultado

- **Verbo principal:** vigilar (ver de un vistazo) y organizar.
- **Resultado verificable:** el mismo widget muestra tres niveles de detalle según su tamaño real; un widget cargando ocupa exactamente el mismo espacio que con datos; un widget se mueve y cambia de tamaño con puntero **y** con teclado, y cada paso se anuncia; el layout es un dato que la aplicación guarda y restaura.

## Anatomía

| Parte | Obligatoria | Nota |
| --- | --- | --- |
| Widget (`g-widget`) | Sí | `<article>` con nombre por su título; atributos de nivel, forma y estado; **contenedor** (mide su propio tamaño) |
| Encabezado | No | Icono, categoría (*eyebrow*), título (nivel de encabezado configurable), subtítulo (desde el nivel medio), badge o estado, menú de acciones |
| Menú de acciones | No | Botón `aria-haspopup="menu"` con el patrón *menu button* de APG; las acciones las da la aplicación |
| Contenido | Sí | Slots por nivel: `compact`, `default`, `detail`; o un solo `default` que consulta el nivel; **la carcasa no interpreta su contenido** |
| Pie | No | Desde el nivel medio: «Actualizado hace…», enlace de detalle (*drill-down*), acción |
| Estados | Sí | Cargando (esqueleto de la estructura del nivel), vacío (mensaje y acción), error (mensaje y «Reintentar»), desactualizado (marca y hora), deshabilitado |
| Primitivas | No | Métrica (valor, unidad, tendencia), progreso, lista compacta (filas etiqueta–valor con muestra de color), leyenda; estado = insignia (`GBadge`) |
| Rejilla (`g-widget-grid`) | Para dashboards | Lista de widgets con columnas por el ancho, cada uno con columnas y filas ocupadas; modo de edición con asa de mover y asa de redimensionar |
| Anuncios | Con la rejilla | Región `status`: «recogido, posición 2 de 6», «movido a la posición 3», «tamaño 2 × 1» |

## Niveles de detalle (divulgación progresiva)

El widget mide su **propio** ancho (y alto) con un observador de tamaño, **no** el ancho de la ventana:

| Nivel | Ancho propio | Qué muestra (por convención de contenido) |
| --- | --- | --- |
| `s` (pequeño) | < ~240px | Una métrica, un icono y una tendencia mínima; sin subtítulo ni pie |
| `m` (medio) | ~240 a 439px | Métrica, contexto (subtítulo) y una visualización pequeña; pie opcional |
| `l` (grande) | ≥ ~440px | Varias métricas, visualización completa, acciones e información secundaria |

La **forma** (`wide`, `tall`, `square`) sale de la proporción medida (ancho ≥ 1.9 × alto es ancha; alto ≥ 1.3 × ancho es alta) y permite reorganizar columnas y filas dentro del contenido. La aplicación recibe `{ level, shape }` en los slots.

## Comportamiento

- **Estados sin saltos:** cargando conserva la estructura (esqueleto con las mismas zonas del nivel actual) y marca `aria-busy`; vacío y error ocupan el área del contenido; **desactualizado** añade una marca y la hora sin ocultar los datos; **deshabilitado** atenúa y vuelve inerte el contenido.
- **Interacción limitada:** botón, enlace, interruptor o selector simples; el detalle se abre **fuera** (página, diálogo, panel) y el widget solo lo pide (`drilldown`).
- **Rejilla adaptable:** 4 columnas con ≥ ~960px de ancho, 2 con ≥ ~560px y 1 por debajo; los widgets **conservan su orden** y sus columnas se recortan al máximo disponible; cada widget ocupa 1 a 4 columnas y 1 a 4 filas.
- **Editar:** en modo de edición, cada widget muestra un **asa de mover** y un **asa de redimensionar**.
  - **Puntero:** arrastrar el asa reordena en vivo; arrastrar la esquina cambia columnas y filas de celda en celda.
  - **Teclado (mismo resultado):** en el asa de mover, Espacio o Enter **recoge**; ← ↑ mueven antes, → ↓ mueven después; Espacio o Enter **suelta**; Esc cancela y devuelve a su lugar. En el asa de redimensionar, las flechas cambian columnas (← →) y filas (↑ ↓).
  - **Sin arrastre (WCAG 2.5.7):** el menú del widget trae «Mover antes», «Mover después» y tamaños predefinidos (pequeño, mediano, grande, ancho, alto), y «Quitar».
- **Layout como dato:** una lista ordenada de `{ id, w, h }`; la aplicación la guarda y la restaura; la rejilla emite el cambio (`update:modelValue`) y el motivo.
- **Anuncios:** cada recoger, mover, soltar, cancelar y redimensionar se anuncia con texto de la aplicación.

## Riesgo por acción

Bajo: reordenar y redimensionar son reversibles. **Quitar** un widget es la acción con más riesgo: se pide desde el menú, no desde un asa, y emite una petición (la aplicación decide si confirma). El riesgo de **orientación** es perder un widget (mover sin saber adónde): por eso los anuncios dicen la posición.

## Continuidad

- **Objetivos:** asas de al menos 24px (44px con `pointer: coarse`); menú de 32px (44px táctil).
- **Zoom 200% y 320px:** la rejilla baja a una columna; los widgets no desbordan.
- **Movimiento:** el reordenamiento se anima con una transición corta (la posición cambia, no el contenido); se quita con `prefers-reduced-motion`.
- **Colores forzados:** el widget conserva un contorno; el estado no depende del color (texto y forma).
- **RTL:** propiedades lógicas; las asas y el menú se espejan.

## Alcance

| Must | Should | Could | Won't (v0.1) |
| --- | --- | --- | --- |
| Carcasa con encabezado, contenido, pie y menú | Estado desactualizado y deshabilitado | Variantes de énfasis del widget | **Galería** de widgets y **vista previa** |
| Niveles `s`/`m`/`l` y forma por medida propia | Primitivas: métrica, progreso, lista, leyenda | Gráficos propios | **Panel de configuración** (Datos, Estilo, Ajustes) |
| Cargando, vacío y error | Tamaños predefinidos en el menú | Agregar widgets desde la rejilla | Un motor de gráficos; widgets de negocio ya hechos |
| Rejilla 4 / 2 / 1 columnas, reordenar y redimensionar con puntero y teclado, anuncios | Layout persistible (dato) | Guardado automático | Colocación libre por coordenadas; widgets de más de 4 columnas |
