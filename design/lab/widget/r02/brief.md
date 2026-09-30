# Brief · Galería y configuración de widgets · r02

**Dueño:** kiwi · **Base:** `design/lab/widget/r01/` (primera entrega, cerrada) · **Decisión previa (DECISIONS #72):** galería y configuración son la segunda entrega.

## Decisiones del usuario (respuestas de alcance)

| Tema | Decisión |
| --- | --- |
| Presentación de la galería | **Hoja lateral** (panel desde el borde, modal): la rejilla sigue a la vista y, al elegir un widget, se añade al final del panel |
| Tarjeta de la galería | **Vista previa con datos simulados** (un widget real, por slot), **búsqueda y categorías**, **tamaños disponibles** (elegir el tamaño inicial) y **marca de widgets ya añadidos** |
| Panel de configuración | **Carcasa con pestañas; el contenido lo pone la aplicación**: Datos, Estilo y Ajustes; vista previa en vivo, Aplicar y Cancelar; Grana no conoce las opciones de cada widget |
| Apertura de la configuración | Acción **«Configurar»** del menú del widget (la aplicación abre el panel en una hoja lateral) |

## Qué se diseña

1. **Galería:** encabezado, búsqueda, filtro por categoría, contador de resultados, lista de tarjetas (nombre, categoría, descripción, vista previa, tamaño inicial, botón Añadir), estado vacío, marca «ya añadido».
2. **Configuración:** hoja con vista previa en vivo, pestañas, campos (con validación), Restablecer, Cancelar y Aplicar, y confirmación al descartar cambios.
3. **Integración:** cómo se conectan con `GWidget` (acción `configure`) y `GWidgetGrid` (añadir al final, anuncio).

## Fuera de alcance

Guardado automático, deshacer, widgets de negocio concretos, arrastrar desde la galería a una posición (se añade al final; después se reordena con la rejilla), un constructor de gráficos, y las opciones reales de cada widget (las pone la aplicación).

## Criterios

WCAG 2.2 AA (1.3.1, 1.4.1, 1.4.13, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 3.3.1, 3.3.3, 4.1.2, 4.1.3); patrones APG de diálogo modal y de pestañas; sin textos ni iconos propios (todo lo pone la aplicación); el significado se lee por texto y forma, no solo por color.
