# Auditoría de coco · GTable, GFilterBar y GPagination (paso 5)

**Componentes:** `packages/vue/src/components/GTable/`, `GFilterBar/`, `GPagination/` (los reales, con `dist/` reconstruido).
**Método:** Chromium con el build real y Vue global: 12 clientes, 5 columnas (compuesta, plan, estado con `GBadge`, alta, total), selección, `pageSize` 5, acciones con `GMenu`, un filtro aplicado, el editor abierto con su error visible, una columna ordenada y una fila seleccionada. Medido con `getComputedStyle` en claro, con un tema distinto (granate, crema, radios mayores, `space` 5, borde 2px, foco de 3px verde azulado, serif), en oscuro, en RTL, con movimiento reducido, colores forzados y táctil emulados.

## Resultado: aprobado, sin correcciones

| Contraste (texto sobre su fondo efectivo) | Defecto | Tema distinto | Oscuro |
| --- | --- | --- | --- |
| Encabezado / encabezado ordenado | 7.46 / 17.4 | 6.99 / 15.73 | 8.59 / 15.22 |
| Título / subtítulo de la compuesta | 17.4 / 7.46 | 13.94 / 6.20 | 16.46 / 9.29 |
| Subtítulo en fila seleccionada | 6.54 | 5.69 | 7.24 |
| Celda | 17.4 | 13.94 | 16.46 |
| Insignia de estado (`GBadge` soft, en celda) | 4.80 | 4.80 | 4.53 |
| Chip aplicado / sugerido / borde del sugerido | 17.4 / 7.46 / 3.45 | 15.73 / 6.20 / 4.10 | 15.22 / 9.29 / 4.66 |
| «Agregar filtro» / recuento | 17.4 / 7.46 | 13.94 / 6.20 | 16.46 / 9.29 |
| Rango / página actual | 7.46 / 17.4 | 6.20 / 13.94 | 9.29 / 16.46 |
| Título del editor / error del editor | 17.4 / 5.49 | 15.73 / 5.29 | 15.22 / 4.52 |

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Cambian **816 de 2 151** propiedades medidas; las que no cambian son las que el tema no toca (tamaños de letra, rellenos 0, fondos transparentes, «sin sombra») y los colores de `GBadge` (`success`/`warning`/`danger`, que el tema no redefine). Medidas que siguen a `space`: casilla 22.5px, inicio de la compuesta 40px, botón de página 40px |
| Foco con Tab | Chips sugeridos, «Agregar filtro», «todo», los cuatro botones de orden, casillas y acciones: contorno **sólido de 3px con el `--g-color-focus` del tema** en todos (sin estilos propios) |
| RTL | La casilla queda a la derecha y las acciones a la izquierda; el recuento de la barra a la izquierda |
| Movimiento reducido | Sin pulso del esqueleto ni entrada del editor. Se conserva el **fundido de color** del hover de fila (0.12s): cambio de color, no movimiento, como en el resto de Grana |
| Colores forzados | Fila seleccionada con contorno sólido de sistema; chips con borde de sistema |
| Táctil (390px) | Chips, «Agregar filtro» y páginas **44px**; casillas 24px; la tabla se muestra en **tarjetas** |
| Consola | Sin errores ni avisos |

(El comportamiento completo —orden, filtros sugeridos y desde el menú, regla Y, selección mixta, acciones, paginación, tarjetas con el mismo árbol de accesibilidad y la hoja del editor en móvil— se verificó en la entrega de bruno con el build real.)

## Observaciones

- **La insignia de estado es de `GBadge`**, no de la tabla: su contraste (4.53:1 en oscuro) es el auditado en `GBadge`.
- **Error del editor en oscuro: 4.52:1**, justo sobre el mínimo, como en `GStepper`: depende de `--g-color-danger-text` del tema; lo vigila el CLI.
- **Sin ejecutar:** lector de pantalla real (sobre todo en tarjetas), Firefox y Safari (`:popover-open`, `@starting-style`, `accent-color`, `display: grid` en filas con roles explícitos), zoom al 200% y dispositivo táctil real.
