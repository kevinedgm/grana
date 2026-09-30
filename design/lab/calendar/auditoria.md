# Auditoría de coco · GCalendar (paso 5)

**Componente:** `packages/vue/src/components/GCalendar/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 9 instancias reales con datos de prueba (4 recursos, disponibilidad con pausa, bloqueos, evento abierto, de 5 minutos, tentativo, día completo, los 7 colores): Día, Semana, Mes, Timeline, cargando, con error, vacío, compacta y espaciosa. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (marca vino, acento verde azulado, superficies ámbar, texto marrón, radios 0, borde 2px, foco 3px, espacio base 5, Georgia, tokens `--g-calendar-*` propios). Foco con Tab real. Los bloques `pointer: coarse`, `prefers-reduced-motion` y `forced-colors` se aplicaron sin condición.

## Resultado: aprobado, con 3 correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | 1 292 de 1 341 propiedades medidas cambian con el tema, en las 9 instancias. Las 49 iguales son elementos sin color ni fuente propios |
| Radios y fuente | Eventos a 0px; raíz en Georgia |
| Geometría con `space` 5 (ppm 1,25) | Evento abierto 09:37 a 196,25px (esperado 196,25); columna de 1 125px; sin redondeo |
| Contraste de texto (todo nodo con texto, las 9 instancias) | Todo ≥ 4,5:1 y ≥ 12px, salvo el aviso de error (ver hallazgo 1) |
| Foco con teclado | Anillo de 3px en el color del tema sobre el botón de crear |
| Área táctil (`coarse`) | Todo control ≥ 44px de alto. Los eventos en carril estrecho (7 traslapes en la demo) miden 30 a 38px de ancho pero 44px o más de alto: es efecto del reparto de carriles, no del CSS |
| Movimiento reducido | Sin transiciones ni animaciones, salvo `retry` (hallazgo 3) |
| Colores forzados | Evento en `ButtonText`/`Canvas`; bloqueos con `GrayText` y trama; línea de ahora y vista activa en `Highlight` |

## Hallazgos y correcciones

1. **Aviso de error con 4,49:1.** `--g-color-danger-text` se calcula contra `surface`, pero el aviso iba sobre `surface-sunken`, que con un tema ámbar es más oscuro. Corregido: el aviso de error va sobre `surface`.
2. **`<select>` de recurso (Semana) sin estilo.** Medía 19px, sin borde, tema ni foco propio: incumplía 24px y 44px. Corregido: mismas reglas que los botones de la barra (mínimo 24px, 44px en `coarse`, borde, radio, fuente, foco y deshabilitado).
3. **`retry` y `sheet-close` conservaban su transición con movimiento reducido.** Añadidos al bloque `prefers-reduced-motion`.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real, dedos reales, horario de verano con el componente montado, rendimiento con más de 1 000 eventos, arrastre entre recursos en Timeline, preferencias reales del sistema (solo se aplicó el bloque sin condición), tema oscuro (no existe), Firefox y Safari.
