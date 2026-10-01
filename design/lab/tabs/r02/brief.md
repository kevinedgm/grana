# Brief — Tabs modernos, adaptables y jerárquicos (r02)

> Brief del usuario, tal como lo entregó. Amplía y sustituye el alcance de `r01`.

Quiero crear un componente genérico de **Tabs** para un Design System.

Debe funcionar como un patrón de navegación secundaria y cambio de contexto dentro de una misma vista, manteniendo una estética minimalista, moderna y clara.

## Concepto

Los Tabs deben permitir cambiar entre secciones relacionadas sin navegar a una página completamente distinta.

La prioridad es que el usuario entienda rápidamente:

- qué secciones existen;
- cuál está activa;
- cuáles tienen información adicional;
- cuáles están deshabilitadas;
- cuándo existen más opciones fuera del espacio visible.

El componente debe sentirse ligero y limpio, sin convertirse en una barra pesada llena de bordes.

## Casos de uso

Debe poder utilizarse en: dashboards; formularios; perfiles; configuración; detalle de entidades; dialogs; drawers; cards; filtros; vistas de datos; herramientas administrativas; PWAs.

## Variantes visuales

Quiero contemplar varias variantes del mismo componente.

- **Underline:** la pestaña activa se identifica mediante una línea inferior. Adecuada para navegación horizontal tradicional.
- **Pill:** la pestaña activa utiliza una superficie redondeada. Debe sentirse compacta y suave, no como una colección de botones independientes.
- **Segmented:** todas las opciones viven dentro de una superficie común y la activa se destaca dentro de ella. Adecuada para cambiar entre pocas vistas equivalentes.
- **Contained:** los tabs pueden integrarse dentro de una superficie como panel, dialog o card.
- **Vertical:** debe existir una variante vertical para configuraciones, paneles laterales y layouts con suficiente ancho.

## Anatomía

Cada tab puede contener: label; icono opcional; badge opcional; contador opcional; indicador de estado; acción secundaria opcional sólo cuando tenga sentido.

La información adicional no debe competir visualmente con el label principal.

## Estados

Diseñar claramente: default; hover; focused; active; disabled; loading; attention; with badge; with counter.

El estado activo debe ser evidente sin depender únicamente del color.

## Jerarquía

Los Tabs representan navegación entre vistas del mismo nivel. No deben utilizarse para representar árboles profundos o jerarquías complejas. Cuando exista navegación secundaria dentro de una pestaña, debe utilizarse otro patrón en lugar de encadenar múltiples niveles de tabs.

## Iconos

Los tabs pueden utilizar iconos cuando ayuden a reconocer rápidamente la sección. Los iconos deben ser opcionales. Evitar utilizar iconos decorativos en todos los tabs sin necesidad.

En desktop pueden mostrarse **Icono + Label**. En espacios muy reducidos pueden existir variantes compactas basadas principalmente en iconos, siempre manteniendo labels accesibles.

## Badges y contadores

Debe poder mostrarse información como: cantidad; estado; notificaciones; contenido nuevo. Ejemplos conceptuales: Messages · 8, Errors · 2, Updates · New. Los badges deben ser visualmente secundarios.

## Overflow

El componente debe funcionar cuando existen más pestañas de las que caben en pantalla. No quiero reducir indefinidamente el ancho de cada tab.

Estrategias: scroll horizontal; botones anterior/siguiente; overflow menu; combinación de tabs visibles + “More”. La estrategia puede cambiar según el espacio disponible.

## Scrollable Tabs

Cuando exista una cantidad grande de tabs, deben poder desplazarse horizontalmente. El tab activo debe permanecer visible automáticamente. El scroll debe sentirse natural tanto con mouse/trackpad como con touch.

## Adaptación responsive

No quiero versiones independientes por dispositivo. Debe existir un único sistema adaptable.

- **Desktop:** puede mostrar todas las pestañas cuando exista espacio. Puede utilizar underline, pill o segmented dependiendo del contexto.
- **Tablet:** puede mantener navegación horizontal con scroll cuando sea necesario.
- **Mobile:** los tabs deben sentirse táctiles y cómodos. No deben comprimirse hasta volver ilegibles los labels. Puede utilizarse scroll horizontal; swipe; tabs compactos; segmented control cuando existen pocas opciones. El usuario debe poder deslizar horizontalmente la lista sin interferir accidentalmente con el contenido.

## Mobile nativo

Experiencia cercana a aplicaciones nativas: targets táctiles amplios; navegación horizontal fluida; indicador activo claro; scroll con momentum; snap opcional; mantener visible la pestaña activa; sin depender de hover. Cuando existan muy pocas opciones, puede comportarse como un **segmented control**.

## Tabs dentro de Dialogs

Debe integrarse correctamente dentro del sistema de Dialogs. Puede utilizarse debajo del header para cambiar entre secciones del mismo proceso. Ejemplo: **General · Permissions · Activity**. No debe competir visualmente con el título del Dialog.

## Tabs dentro de Panels

Debe poder utilizarse como navegación local dentro de una superficie. Alineación: al inicio; centrado; distribuido; ocupando todo el ancho. Dependerá del contexto.

## Tabs con contenido dinámico

El cambio entre tabs puede modificar tablas, formularios, gráficos, listas, configuraciones, paneles. El componente debe mantener clara la relación entre el tab activo y el contenido mostrado.

## Animaciones

Discretas. Puede animarse: el indicador activo; el fondo seleccionado; desplazamiento del underline; entrada suave del contenido. Evitar animaciones grandes o movimientos innecesarios. El indicador debe moverse de forma fluida entre pestañas.

## Persistencia

Cuando tenga sentido, el estado activo puede mantenerse al: recargar; navegar hacia atrás; compartir URL. El componente debe poder integrarse con rutas sin depender obligatoriamente de ellas.

## Accesibilidad

Debe respetar el patrón accesible de tabs. Completamente por teclado: Tab; Shift + Tab; flechas izquierda/derecha; flechas arriba/abajo en vertical; Home; End; Enter o Space cuando corresponda. Relación clara entre tab, tablist y tabpanel. El foco no debe confundirse con el estado activo.

## Densidad

compact; comfortable; spacious. Puede modificar altura, padding, separación y tamaño del indicador. No debe alterar la lógica del componente.

## Estética

minimalista; limpia; moderna; refinada; silenciosa; ligera; de baja densidad visual.

Evitar: bordes alrededor de cada pestaña por defecto; sombras pesadas; colores fuertes innecesarios; botones visualmente separados cuando conceptualmente pertenecen al mismo grupo; indicadores activos exagerados.

## Integración con superficies

Pueden existir: sobre fondo plano; dentro de una surface; dentro de una inset surface; dentro de dialog; dentro de sidebar; dentro de cards. El componente debe adaptarse al contexto sin cambiar su comportamiento fundamental.

## Objetivo

Sistema de Tabs reutilizable, desde una navegación secundaria simple hasta interfaces complejas con múltiples secciones. Prioridad: claridad; orientación; consistencia; accesibilidad; adaptabilidad; buen comportamiento en espacios reducidos. Identidad visual limpia; el contenido sigue siendo protagonista.
