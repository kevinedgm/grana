# Auditoría de coco · GDatePicker (paso 5)

**Componente:** `packages/vue/src/components/GDatePicker/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`), teclado real (Enter y flechas con la herramienta de teclado del navegador) y eventos sintéticos donde se indica. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (ámbar, texto marrón, radios y borde de 2px, foco verde azulado de 3px, espacio base 5, Georgia). Los bloques `pointer: coarse`, `forced-colors` y `prefers-reduced-motion` se extrajeron de la hoja y se aplicaron sin condición. Se probó a 688px, con el ancho del contenedor variable (600 a 900px), a 375px (móvil emulado), en RTL y con el popover cerca del borde inferior.

## Resultado: aprobado, sin correcciones al CSS; 1 observación de accesibilidad para decidir

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | De 24 elementos distintos, todo lo que depende del tema cambia (562 de 1890 propiedades medidas; el resto son geometría y transparentes). Lo que no cambia es intencional: el radio de píldora de los círculos y chips (`--g-radius-pill`), el texto blanco de la selección (mismo `on-brand` en ambos temas) y la fuente de los botones de mes, que no tienen texto |
| Contraste de texto (por defecto) | Día 17.4:1 · otro mes y no disponible 5.10 · título 17.4 · encabezados de columna y resumen 7.46 · aro de hoy 7.46 · selección 16.48 · texto sobre la franja 14.46 |
| Contraste de texto (tema de prueba) | Día 13.48 · otro mes y no disponible 6.18 · encabezados y resumen 8.2 · aro de hoy 8.2 · selección 6.79 · texto sobre la franja 9.10 |
| Bordes de controles (WCAG 1.4.11) | Campo y chips **3.45:1** (por defecto) y **4.48:1** (tema de prueba) |
| Medidas por defecto | Día 40×40 · nav y chips 32px · campo `md` 36px |
| Medidas con el tema (`space` 5) | Día 50×50 · nav 40px · chips 40px · campo 45px |
| Táctil (bloque aplicado sin condición) | Con `space` 5: día 50px, nav, chips y «Listo» de **44px**, campo 45px |
| Uno o dos meses | Por defecto: 1 mes con 640px y 2 con 650px (umbral ≈ 648); con `space` 5: 1 mes con 800px y 2 con 812px. Sin desborde horizontal de la superficie en ningún ancho (600 a 900px) |
| Popover | Debajo del campo a 8px; **se invierte hacia arriba** (`is-up`, mismo hueco de 8px, dentro del visor) cuando no cabe abajo; radio `--g-surface-radius` y borde del tema |
| Foco con teclado (real) | Enter abre y el foco va al día elegido; las flechas mueven (8 → 10 oct); contorno de **3px** en el color de foco del tema, `outline-offset: 2px` |
| Rango real (8–12 oct, cruza de fila) | Franja continua con extremos redondeados al saltar de fila; el campo muestra «8–12 oct 2026» (formato del idioma) |
| Hoja móvil a 375px | Ancho completo (375px), pegada abajo, fondo del tema, día y botones de **44px**, cierre de 44px, `::backdrop` activo, sin desborde horizontal de la página; deslizar cambia septiembre ↔ octubre; clic fuera cierra |
| RTL | Los encabezados y las celdas se invierten, «anterior» pasa a la derecha, el chevrón se espeja, la franja del inicio sale hacia la izquierda; ArrowRight = día anterior |
| Colores forzados (bloque aplicado sin condición, 9 reglas) | Franja sin relleno con **borde superior e inferior de 2px**; selección con borde de 4px; hoy con borde de 4px; no disponible `GrayText`; campo y superficie con `ButtonText`/`CanvasText` |
| Movimiento reducido (bloque aplicado sin condición) | Transiciones a `0s` |
| Consola | Sin errores |

## Hallazgo fuera del CSS (corregido en el playground, de bruno)

- **La barra de búsqueda de demostración (`#dp-bar`) tenía `flex-wrap: nowrap`** y ensanchaba toda la página a 421px en un móvil de 375px (no era el componente: el selector y la hoja no desbordan). Corregido con `flex-wrap: wrap` en `playground/index.html`.

## Observación (no bloquea `candidate`, requiere decisión)

- **(Resuelto, DECISIONS #89: borde superior e inferior en border-control)** La franja del rango es casi invisible frente a la superficie:** **1.14:1** con el tema por defecto y **1.22:1** con el de prueba (los tonos suaves de las marcas están pensados para relleno de texto, no para un elemento gráfico). Lo que identifica el rango sin la franja es el inicio y el fin (círculos de 16:1 y 6.7:1), el nombre accesible de cada día («dentro del rango») y el resumen; pero las fechas intermedias se distinguen poco a simple vista. WCAG 1.4.11 exige 3:1 solo a los objetos gráficos necesarios para entender el contenido, y aquí hay una lectura razonable de que no lo son (la información está en texto). Opciones:
  1. **Dejarla así** (estética del brief: «fondo más suave»).
  2. **Borde superior e inferior de `--g-color-border-control`** (3:1) en la franja, como ya hace `forced-colors`: se lee el rango sin depender del relleno, a costa de dos líneas finas.
  3. **Tono más fuerte** (mezcla del color de la selección con la superficie al ~30%): 1.6 a 2:1 con texto todavía legible, sin llegar a 3:1.
  Decisión de producto y de estética: se pregunta al usuario.
- **El hover** (`surface-sunken`, ≈ 1.06:1) es solo una ayuda: no es una señal de estado.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (cuadrícula, rango, título vivo, hoja móvil); `forced-colors` y `prefers-reduced-motion` reales (se aplicaron los bloques sin condición); RTL con datos en un idioma RTL real; hoja móvil con teclado virtual y deslizamiento en táctil real; Firefox y Safari (`popover`, `::backdrop`, `Intl.Locale.getWeekInfo`, `scale` y `rotate` individuales); tema oscuro (no existe).
