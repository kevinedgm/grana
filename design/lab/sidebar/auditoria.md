# Auditoría de coco · GSidebar (paso 5)

**Componente:** `packages/vue/src/components/GSidebar/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`), con teclado real (Flechas, Enter, Esc con la herramienta de teclado del navegador) y eventos sintéticos donde se indica. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (ámbar, texto marrón, radios y borde de 2px, foco verde azulado de 3px, espacio base 5, Georgia). Los bloques `pointer: coarse`, `forced-colors` y `prefers-reduced-motion` se extrajeron de la hoja y se aplicaron sin condición. Se probó a 1240px (contenedor de 1000px), con el contenedor de 800px, 500px y 340px, en un móvil emulado de 375px, en RTL, con el contenedor bajo (scroll) y en las variantes flotante y superpuesta.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | De 12 elementos distintos (raíz, botón de contraer, búsqueda, atajo, título de grupo, enlace, padre, submenú, contador, pie, activo…), todo lo que depende del tema cambia; lo que no cambia es intencional: el blanco de `on-brand` en los contadores y el radio `xs` del atajo (no tematizado en la prueba) |
| Con el tema de prueba | Sidebar de 330px (`--g-sidebar-width` con `space` 5), item de 50px, radios y bordes de 2px |
| Contraste (tema por defecto) | Item 6.9:1 (sobre la carcasa) · título de grupo 4.72 · contador 16.48 · borde del campo de búsqueda **3.45:1** |
| Contraste (tema de prueba) | Item 6.83 · título de grupo 5.14 · contador 6.79 · borde de búsqueda 4.48 |
| Teclado real | ↓ recorre los items (Inicio → … → «Proyectos») con contorno de **3px** en el color de foco del tema (`outline-offset` −3px); Enter abre el submenú y el foco se queda en el padre; en el riel, ↓ muestra la pista con el foco visible («Bandeja», `aria-hidden`, a 8px) y → abre el panel con el foco en «Todos» (la pista de un padre no aparece); Esc cierra y devuelve el foco |
| Táctil (bloque aplicado sin condición) | Con `space` 5: item, botón de contraer y búsqueda de 50px (piso de 44px en cualquier `space`) |
| Colores forzados (bloque aplicado sin condición, 7 reglas) | El item activo pasa a un contorno de 2px `CanvasText` y pierde la sombra; el borde de la superficie a `CanvasText` |
| Movimiento reducido (bloque aplicado sin condición, 10 reglas) | La raíz pierde la transición; el submenú conserva solo un fundido de 120ms |
| Movimiento en el componente real | Contraer: 330 → 315 → 201 → 143 → 112 → 95 → 86 → 81 → 80px sobre **la misma raíz** (no se reconstruye); submenú: 93 → 45 → 17 → 4 → 1 → 0px; el panel y el drawer, como en el banco |
| Scroll | Con los submenús abiertos, la región de navegación mide 889px de contenido en 326px y hace scroll (`overflow-y: auto`); **la cabecera y el pie no se mueven** (0px) |
| Flotante | Margen de 12px, radio `--g-surface-radius`, sombra; altura 496px = 520 − 24 |
| Superpuesto | La expansión es `position: absolute` con `--g-shadow-3` sobre el riel (80px con `space` 5); **la aplicación debe reservar el ancho del riel** (`mode-change` trae `overlay`): el playground no lo hacía y el contenido se corría bajo el sidebar (corregido, ver abajo) |
| Navbar (340px) | `<nav>` a 10px del borde; **68px reservados = `--g-sidebar-bar`**; actual 114×48px, los demás **44×48px**; contador de 12 y punto de 8px **dentro** de su celda; sin desborde horizontal de la página |
| Drawer (Más) | 320px, 4 grupos, con búsqueda y usuario; elegir un destino cierra y el foco vuelve a «Más», que queda como rama activa |
| RTL | El sidebar pasa a la derecha; el panel sale hacia la izquierda a 4px, con `transform-origin` en el lado correcto (`200px 23px`) |
| Nombre accesible del riel | Las etiquetas siguen en el DOM (recortadas), los títulos de grupo también; los contadores llevan texto para lectores («Bandeja, 12 sin leer») |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **El punto de estado (`g-sidebar__badge--dot`) no tenía regla** en `GSidebar.css` (bruno lo dejó anotado): salía como una píldora vacía. Corregido: un círculo de `space × 2` (8px), sin relleno, en el riel, en el navbar y en el sidebar expandido. Verificado en el componente real: 8×8px y dentro de su celda en la barra.
2. **El playground de bruno no reservaba el ancho del riel con `overlay`**, así que el contenido se corría bajo el sidebar al expandirlo (`mainLeft: 0`). Corregido en `playground/index.html`: el contenido añade `--g-sidebar-rail` cuando `mode-change` trae `overlay`. El componente no cambia: es responsabilidad de la aplicación, como dice el contrato.

## Observaciones (no bloquean; requieren decisión)

- **La superficie del item activo es tenue frente a la carcasa:** **1.08:1** con el tema por defecto y **1.20:1** con el de prueba. Lo sostienen el contorno de `--g-color-border-strong`, el peso, el texto pleno (frente al atenuado) y, semánticamente, `aria-current`. Es lo que pidió el usuario («superficie ligeramente elevada, sin indicadores estridentes»). La salida, si no basta, es un contorno más fuerte (`border-control`), no un color de acento: decisión de estética.
- **El navbar con la píldora activa deja a los items inactivos sin nombre visible:** un usuario nuevo no ve sus etiquetas (existen para lectores y en la píldora del actual). Ya está documentado en el contrato como límite conocido.
- **Etiquetas del navbar largas:** con 5 celdas en ~340px se recortan con elipsis; deben ser de una palabra o la barra, de 4 items o menos.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (riel, ramas, contadores, panel, píldora, drawer); `forced-colors` y `prefers-reduced-motion` reales; RTL con datos en un idioma RTL real (solo se invirtió la dirección); Firefox y Safari (`popover`, `<dialog>`, `@starting-style`, `interpolate-size`, `rotate` y `translate` individuales); el navbar y el drawer en un dispositivo táctil real y con el teclado virtual; cientos de items; tema oscuro (no existe).
