# Auditoría de coco · sistema de widgets (paso 5)

**Componentes:** `GWidget`, `GMetric`, `GProgress`, `GDataList`, `GWidgetGrid` (los reales, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`), con el tema por defecto, con el tema de prueba del playground (morado, radios) y con un tema propio más agresivo (ámbar, texto marrón, `space` 5, borde de 2px, Georgia, foco verde azulado de 3px, radios de 2px). Teclado real (Tab) para el foco; eventos sintéticos para el movimiento por teclado. Los bloques `pointer: coarse`, `forced-colors` y `prefers-reduced-motion` se comprobaron por presencia en la hoja (12 bloques en los cinco archivos), **no** aplicados sin condición. Anchos de la rejilla: 1000, 760, 740 y 420px.

## Resultado: aprobado, con 1 corrección del playground y 3 observaciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Con el tema propio cambian la superficie (`rgb(255,244,220)`), el borde (2px), el radio (2px), la fuente (Georgia), el texto, el paso de fila (140px = `space × 28`) y el hueco (20px = `space × 4`); las unidades salen de `--g-space-1`, no de literales |
| Contraste (tema por defecto) | Título 17.4:1 · categoría y pie 5.10 · subtítulo y etiqueta de métrica 7.46 · tendencia (verde) 5.35 · relleno del progreso 15.25 |
| Contraste (tema propio) | Título 13.3 · categoría y pie 7.28 · subtítulo 8.5 · tendencia **4.90** · relleno 3.75 (control, ≥ 3) |
| Tamaño del texto | Ninguno bajo 12px (categoría, subtítulo, pie y etiquetas a 12px) |
| Áreas de acción | Botón de menú 32px (40 con el tema propio), asas de mover y de redimensionar 28px (35), elementos del menú 36px: todos ≥ 24px. Los bloques `pointer: coarse` existen en `GWidget.css` (menú de 44px) y `GWidgetGrid.css` |
| Foco (teclado real) | Tab sobre el asa de redimensionar: contorno **3px sólido** en el `--g-color-focus` del tema (`rgb(15,118,110)`), `outline-offset` 2px. El foco por script sin teclado no muestra contorno (`:focus-visible`), como debe |
| Estados | `populated`, `loading`, `empty`, `error`, `stale` y `disabled` **no cambian el tamaño** del widget (mismas celdas en todos) |
| Menú de acciones | Popover con el elemento activo con contorno; separadores y el rótulo «Tamaño» (`presentation`); «Mover antes» deshabilitado en el primero; se coloca sobre el botón cuando no hay espacio debajo, sin salirse de la ventana (200px de ancho, 389px de alto) |
| Movimiento por teclado en el componente real | Espacio recoge, → mueve, Espacio suelta: anuncio «Posición 2 de 4» y «Ingresos soltado en la posición 2 de 4», el DOM pasa a `bacd` y el foco vuelve al asa |
| Nivel por ancho propio | 1000px de rejilla: `l · s · s · l`; 740px: `l · m · m · l`; 420px: `m` en todos |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **El playground de bruno daba alturas que no cabían:** los widgets de una fila (112px) con categoría, subtítulo, contenido y pie perdían **todo el contenido** (el cuerpo mide 0px) y el detalle de 2×2 recortaba la lista. Corregido en `playground/index.html`: 2×3, 1×2, 1×2 y 2×3. Verificado a 1000, 740 y 420px con el tema por defecto y con el propio: sin recortes salvo lo anotado abajo.

## Observaciones (no bloquean; requieren decisión de kiwi o lima)

- **(Resuelto, DECISIONS #90: el alto limita el nivel)** Un widget demasiado bajo pierde su contenido sin aviso. El nivel depende solo del ancho (contrato, DECISIONS #73); con una fila de alto (forma `wide`, nivel m o l) la cabecera y el pie ocupan todo y el cuerpo queda en 0px, recortado (`overflow: hidden`). El componente no falla, pero el usuario no ve datos. Salidas posibles: que la forma `wide` de alto limitado omita subtítulo y pie, que el nivel dependa también del alto, o una altura mínima documentada (2 filas para `m` y `l`). Es una decisión de estructura.
- **(Resuelto, DECISIONS #90: la hora va en el pie)** El estado `stale` añade una línea (`labels.staleText`) y consume alto:** con 2 filas (tema por defecto) el cuerpo `m` pasa de 114px disponibles a 147 necesarios y se recorta. Mismo origen: el contrato dice que los estados no cambian el espacio, pero el contenido sí compite por él.
- **La pista del progreso (`g-progress__track`) sobre la superficie es de 1.08:1 (1.23 con el tema propio).** No es información: el relleno tiene 15:1 y el valor va en texto; se mantiene como decoración. Si se quiere que se vea la barra vacía, sería `border-control` (decisión de estética).

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (menú, anuncios de la rejilla, `aria-roledescription`); `forced-colors`, `pointer: coarse` y `prefers-reduced-motion` reales (solo se comprobó su presencia); arrastre con puntero y táctil reales (solo eventos sintéticos); Firefox y Safari (`popover`, `inert`, `@starting-style`); animación al reordenar (con `order` CSS no hay; decisión de bruno: FLIP o aceptarlo); RTL con datos en un idioma RTL real; tema oscuro (no existe).
