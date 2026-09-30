# Auditoría de coco · GCheckbox y GCheckboxGroup (paso 5)

**Componentes:** `packages/vue/src/components/GCheckbox/` y `GCheckboxGroup/` (los reales, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron los componentes reales con 53 casillas (5 tamaños × 3 densidades; sin marcar, marcada, mixta, con ayuda, inválida, deshabilitada, solo lectura; los 7 colores; tarjeta y chip en todos sus estados) y 4 grupos (con maestra y conteo, de tarjetas, de chips con error, deshabilitado). Se compararon bajo el tema por defecto y bajo un tema distinto (marca azul marino, acento violeta, superficies ámbar, texto marrón, radio 0 en cuadro, tarjeta y chip, borde 2px, foco 3px con separación 4px, espacio base 5, Georgia). Teclado y clics reales.

## Tema de prueba

Los 7 colores cambiados, `surface` y `surface-sunken` ámbar, `text`, `text-muted`, `text-subtle`, `border-control`, `border-strong` marrones, `danger-text` #8A0F00, `--g-color-focus` violeta, `--g-radius-xs/md/lg/pill` a 0, `--g-border-width` 2px, `--g-focus-width` 3px, `--g-focus-offset` 4px, `--g-space-1..4` en base 5, `--g-font-ui` Georgia.

## Resultado: aprobado

| Prueba | Resultado |
| --- | --- |
| Relleno de lo marcado por color (7) | Todos cambian: p. ej. `accent` de #0B63CE a #6D28D9 |
| Propiedades sensibles al tema (fondo, borde, radio, fuente, texto, error, obligatorio, icono) en los 41 casos | Ninguna conserva el valor por defecto (las únicas coincidencias son ruido: filas sin fondo ni radio en ambos temas, y el texto blanco del chip marcado, que viene de `on-brand`, no cambiado por ese tema) |
| Radios | Cuadro, tarjeta y chip a 0px con el tema |
| Cuadro y fila: 5 tamaños × 3 densidades, espacio base 5 y borde 2px | Exactos en las 15 combinaciones (cuadro 20, 20, 25, 30, 35px; fila nunca menor que el cuadro) |
| Contraste con el tema | Borde del cuadro 6.92 · etiqueta 16.67 · ayuda 9.89 · error 9.77 · borde inválido 9.77 · borde del chip sin marcar 6.92 · texto de chip marcado 15.94 · etiqueta de tarjeta seleccionada 13.95 · ayuda de tarjeta 8.65 · solo lectura 9.89 · marca sobre relleno: brand 12.14, accent 7.10, neutral 7.58, success 5.47, warning 7.09, danger 6.47, info 5.93. Mínimo: 5.47 |
| Foco con teclado (tema: 3px, separación 4px, violeta) | Cuadro, marcada, mixta y maestra: anillo alrededor del cuadro. Tarjeta y chip: anillo alrededor de la tarjeta o del chip, sin contorno en el `<input>` |
| Espacio y Tab reales | Espacio marca la casilla enfocada y Tab pasa a la siguiente con `:focus-visible` |
| Grupo con maestra | Cuadro mixto con "1 de 2 seleccionadas"; la hija deshabilitada se ve atenuada y no cuenta |
| Grupo de tarjetas | Una columna en 320px; las dos seleccionadas con borde doble, fondo suave e icono relleno |
| Grupo de chips con error | Chips en fila que salta de línea; el error del grupo bajo la fila, con marca ⚠ |
| Grupo deshabilitado (`<fieldset disabled>`) | Título, maestra y hijas atenuados; la maestra deshabilitada |
| Movimiento reducido (bloque del CSS aplicado sin condición) | Transición de cuadro, marca, tarjeta, icono y chip a `0s` |
| Colores forzados (bloque aplicado sin condición) | Bordes del cuadro y de la tarjeta a `ButtonText`; casilla marcada y chip marcado con `Highlight` |
| Táctil (`pointer: coarse`, 375px) | Filas de casillas y de grupo de 44px; chips de 44px; tarjetas de 66px; el cuadro sigue en 20px y **centrado** con la etiqueta (desvío 0); el clic en el texto alterna la casilla; sin desborde horizontal |
| RTL (`dir="rtl"`) | La maestra a la derecha y el conteo a la izquierda (propiedades lógicas) |
| Errores y avisos en la consola | Ninguno |

## Hallazgos

Ninguno bloquea; **ningún ajuste de CSS fue necesario** en esta auditoría (los defectos del CSS, el chip sin contorno de 3:1, la fila menor que el cuadro y la tarjeta y el chip sin movimiento reducido, ya se corrigieron en la entrega de coco, y el orden de las escuchas del consumidor lo corrigió bruno).

1. **Artefacto de medición descartado.** Una primera comparación mostró que "los colores no cambiaban": se midió antes de que el navegador terminara las transiciones (el mismo artefacto de auditorías anteriores). Repetida con todo asentado, los 7 colores cambian.
2. **Marca dibujada en `::after` del `<input>`:** solo verificada en Chromium (ver "No verificado").

## No verificado

- **Firefox y Safari:** dibujar la marca en el `::after` de un `<input>` con `appearance: none` es un patrón común, pero no se comprobó fuera de Chromium.
- **Emulación real de `prefers-reduced-motion` y `forced-colors`:** la herramienta no la permite; se aplicó el contenido de cada bloque sin su condición.
- **Lector de pantalla real** (VoiceOver, NVDA): cómo se anuncia el estado `mixed`, el conteo del grupo, el error y el nombre de la tarjeta (título + precio con la descripción aparte).
- **Zoom al 200%** y **dispositivo táctil real** (se usó la emulación de `pointer: coarse`).
- **Hover real con el ratón sobre los componentes montados:** verificado en el banco de pruebas con el mismo CSS; no se repitió en el playground.
- **Casilla `card` o `chip` dentro de un grupo con `disabled` heredado**, visualmente: se comprobó el grupo deshabilitado con casillas por defecto.

## Corrección posterior: palabras largas sin espacios

Una etiqueta, ayuda, error o conteo sin puntos de corte (una URL, un identificador) desbordaba en `GCheckbox` (por defecto y tarjeta) y en `GCheckboxGroup` (encabezado, conteo, ayuda y error). Se agregó `overflow-wrap: anywhere` a `g-checkbox__text`, `g-checkbox__error`, `g-checkbox-group__label`, `__count`, `__hint` y `__error`, y el chip ya puede encogerse (`flex: 0 1 auto` en su texto). Comprobado a 300px con una palabra de 90 caracteres, con y sin la regla: sin ella desbordaban 6 elementos por casilla; con ella, ninguno (WCAG 1.4.10).
