# Brief — Cards como familia de superficies composables (r01)

> Brief del usuario, tal como lo entregó.

No quiero diseñar una sola tarjeta específica, sino una familia de superficies reutilizables capaces de representar distintos tipos de contenido manteniendo una estructura, comportamiento y lenguaje visual coherentes.

## Concepto

La Card debe funcionar como una **superficie de contenido contenida**. Puede utilizarse para: resumir información; representar una entidad; mostrar métricas; presentar contenido; ofrecer acciones; agrupar información relacionada; funcionar como punto de entrada hacia una vista más detallada.

La Card no debe imponer qué información contiene. Debe proporcionar una estructura flexible sobre la cual cada producto pueda construir diferentes composiciones.

## Principio de composición

Regiones opcionales combinables. Conceptualmente: **Card Surface → Header → Media → Content → Metadata → Actions → Footer**. No todas deben existir simultáneamente. Una Card simple puede contener únicamente contenido; una compleja combina varias regiones.

## Anatomía

Una Card puede contener: eyebrow o categoría; título; subtítulo; descripción; icono; avatar; imagen o media; metadata; badges; estado; métricas; contenido personalizado; acciones principales; acciones secundarias; menú contextual; footer. La estructura debe permitir componer estas piezas sin crear un componente diferente para cada combinación.

## Variantes de superficie

- **Flat:** integrada al fondo con separación mínima.
- **Outlined:** definida principalmente por un borde sutil.
- **Elevated:** ligeramente separada mediante elevación o sombra.
- **Inset:** parece integrada o incrustada dentro de otra superficie.
- **Interactive:** elemento seleccionable o navegable.
- **Selected:** representa una selección activa.

El contenido y la estructura deben mantenerse independientes de estas variantes visuales.

## Cards informativas

Títulos, descripciones, estados, pequeños grupos de información. Priorizan claridad y lectura.

## Cards de entidad

Personas, productos, proyectos, documentos, recursos, servicios, ubicaciones. Combinan **Identidad + información principal + metadata + acciones**, sin depender de un dominio específico.

## Cards de métricas

Valor principal; label; variación; tendencia; comparación; indicador visual; gráfico pequeño opcional. La métrica principal domina visualmente. La Card no debe convertirse en un dashboard en miniatura lleno de numeritos.

## Cards con media

Imagen; ilustración; video preview; mapa; gráfico; contenido visual personalizado. La media puede aparecer: arriba; lateral; como fondo; dentro del contenido.

## Cards horizontales

Además de la vertical, una horizontal: **Media / Identity → Content → Actions**. Útil para resultados de búsqueda, listas, directorios, recursos, productos, perfiles.

## Cards interactivas

Una Card puede ser navegable o seleccionable. Debe distinguir claramente entre: clic en toda la Card; acciones internas; seleccionar la Card; abrir un menú contextual. Las acciones internas no deben activar accidentalmente la acción principal.

## Estados

Al menos: default; hover; focused; pressed; selected; disabled; loading; error; warning; success. No todos necesitan modificar completamente la superficie; cambios sutiles y coherentes.

## Hover

Cambios ligeros (elevación; borde; background; transformación mínima). Evitar movimientos excesivos: nada de Cards que salten cinco píxeles hacia arriba al acercar el cursor.

## Selección

Una Card seleccionable diferencia hover, focus y selected. La selección no depende exclusivamente del color: borde; indicador; icono; check; cambio de superficie.

## Actions

Acción principal; acciones secundarias; icon buttons; overflow menu. Con jerarquía: no todas compiten visualmente. Cuando toda la Card es interactiva, las acciones secundarias siguen siendo accesibles sin conflictos de interacción.

## Footer

Acciones; metadata; timestamps; estados; navegación secundaria. Conectado con la Card. Puede separarse con spacing, cambio sutil de superficie o borde ligero cuando sea necesario.

## Densidad

compact; comfortable; spacious. Puede modificar padding, gaps, tamaño de media, cantidad de metadata visible. No modifica la semántica.

## Adaptabilidad

Sin versiones independientes por dispositivo. La misma Card reorganiza su contenido según el espacio disponible: **amplio** media lateral + contenido + acciones; **intermedio** media superior + contenido; **mobile** composición vertical simplificada. La adaptación es por espacio disponible, no solo por dispositivo.

## Container-aware

Responde al tamaño de su propio contenedor: grids, sidebars, dashboards, dialogs, drawers, páginas completas. Una Card estrecha se reorganiza aunque la aplicación esté en desktop.

## Cards en Grid

Alturas iguales cuando el diseño lo necesite; alturas naturales cuando el contenido sea variable; separación consistente; comportamiento responsive. La Card individual no asume cuántas columnas existen.

## Cards en listas

También elemento repetido verticalmente; puede reducir radio, elevación, padding; debe poder acercarse a un `ListItem` sin convertirse en un componente distinto.

## Contenido truncado

Títulos o descripciones largas: truncarse; limitar líneas; expandirse; mostrarse completos según configuración. Nunca depender de que todos los títulos tengan doce caracteres.

## Loading

Mantiene la estructura aproximada de la Card; skeletons que respetan la anatomía esperada (no una única caja gris).

## Empty

Cuando la Card contenga información y no haya datos, estado vacío claro. No todas requieren empty state.

## Accesibilidad

Cards interactivas por teclado: focus visible; semántica apropiada; orden de navegación lógico; labels accesibles para acciones solo de icono. No convertir automáticamente toda Card en botón si contiene múltiples elementos interactivos.

## Jerarquía visual

1. información principal; 2. estado o métrica relevante; 3. metadata; 4. información auxiliar; 5. acciones secundarias. Permite escanear rápido.

## Superficies anidadas

Pueden contener superficies internas con razón funcional (resumen, métricas, estado, información agrupada), con el lenguaje de **Inset Surface** del Design System. Evitar demasiadas capas: Card dentro de Card dentro de Card no debe ser el lenguaje visual.

## Estética

minimalista; limpia; moderna; refinada; ligera; baja densidad visual; basada en superficies; radios consistentes; bordes sutiles; sombras suaves cuando correspondan. Evitar: sombras pesadas; bordes oscuros; padding excesivo; exceso de badges; demasiados niveles de superficie; estilos rígidos ligados al contenido.

## Responsive

**Desktop:** verticales, horizontales, grids, media lateral, acciones persistentes. **Tablet:** reorganiza cuando el ancho es insuficiente. **Mobile:** lectura vertical, targets táctiles, contenido principal, acciones claras; la información secundaria puede simplificarse, reorganizarse o pasar a una región expandible.

## Variantes principales (por composición)

Basic Card; Content Card; Media Card; Entity Card; Profile Card; Metric Card; Status Card; Interactive Card; Selectable Card; Horizontal Card; Action Card; Inset Card. No deben ser implementaciones independientes: comparten sistema de superficie, spacing, estados y anatomía.

## Objetivo

Sistema de Cards altamente reusable y composable, sin acoplarse a un dominio; primitiva de composición para organizar contenido dentro de una superficie coherente. Prioridad: flexibilidad; jerarquía visual; adaptabilidad; consistencia; accesibilidad; reutilización. Desde una Card mínima con título y descripción hasta una rica con media, métricas, metadata y acciones, sin perder la identidad del Design System.
