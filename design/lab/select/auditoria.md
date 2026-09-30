# Auditoría de coco · GSelect (paso 5)

**Componente:** `packages/vue/src/components/GSelect/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 30 instancias reales (vacío con placeholder, con valor y limpiar, con ayuda, requerido, deshabilitado, solo lectura, inválido `outline` y `soft`, cargando, `soft`, 40 opciones, sin opciones, 4 colores de foco, 5 tamaños × 2 densidades, 3 formas y una etiqueta, ayuda, error y opción de 90 caracteres sin espacios), además de un selector **dentro de un `GDialog` modal**. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (superficies ámbar, texto marrón, radios 0, 2, 14 y 28, borde 2px, foco 3px, espacio base 5, Georgia, fondo propio). Teclado real (Tab, flechas, Enter, Esc). Los bloques `pointer: coarse`, `prefers-reduced-motion` y `forced-colors` se aplicaron sin condición.

## Resultado: aprobado, con 2 correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 404 propiedades medidas (color, fondo, borde, radio, fuente, contorno, sombra) cambian; ninguna conserva el valor por defecto |
| Contraste (tema por defecto) | Borde 3.45:1 · línea inferior de `soft` 3.45 · borde inválido 5.49 · placeholder 5.10 · opción activa 16.1 · encabezado de grupo 7.46 · contorno de la lista 3.45 · todo texto ≥ 4.5:1 |
| Contraste (tema de prueba) | Borde 4.86 · `soft` 4.86 · inválido 9.46 · placeholder 5.93 · activa 10.29 · grupo 7.36 · contorno de la lista 4.86 · todo texto ≥ 4.5:1 |
| Altura con el tema (`space` 5) | 30, 35, 45, 55 y 65px: igual que `GInput` de cada tamaño |
| Formas | `none` 0px, `lg` 14px, `pill` 999px |
| Foco con teclado (real) | Anillo de 3px pegado al borde (`outline-offset` −2px) en el color del tema; el botón no lleva contorno |
| Selector dentro de `GDialog` | La lista queda **por encima del diálogo** (capa superior), es clicable y elige; Enter elige y cierra solo la lista |
| Táctil (`pointer: coarse`) | Caja de 45px, opciones de 45px, botón de limpiar de 44×44px (ver hallazgo 2) |
| Movimiento reducido | Transiciones a `0s` |
| Colores forzados | Caja y lista `ButtonText`/`CanvasText`; opción activa con contorno `Highlight` |
| RTL | El botón de limpiar y la flecha pasan a la izquierda |
| Etiqueta, ayuda, error y opción de 90 caracteres sin espacios | Sin desborde horizontal (el valor mostrado se recorta con elipsis) |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **Esc con la lista abierta cerraba también el `GDialog` contenedor.** El selector cancelaba el evento (`preventDefault`) pero no lo detenía, así que el diálogo lo recibía y se cerraba junto con la lista (verificado: `dismiss: ["escape"]` con un solo Esc). Es un defecto de `GSelect.vue` (dueño: bruno), devuelto y corregido: con la lista abierta, Esc llama a `stopPropagation()`. Verificado en el navegador: el primer Esc cierra solo la lista y el diálogo sigue abierto; el segundo Esc, con la lista cerrada, sí lo cierra. Prueba nueva.
2. **Con puntero grueso, un selector `clearable` medía 48px frente a los 45px sin limpiar.** Los 44px del botón, más el borde, agrandaban la caja. Corregido en `GSelect.css`: margen negativo en `coarse` para que el botón mantenga sus 44px sin agrandar la caja (verificado: 45px con el botón de 44×44).

## Alcance nuevo pedido durante la auditoría

El usuario pidió **prefijo e iconos** (slot `prepend` en el selector y icono en cada opción) y una forma de **agregar una opción que no está en el catálogo** (fila «Agregar nuevo…» al final de la lista que emite `create`). No estaban en el alcance de r01; entran en una ronda **r02** (kiwi → lima → coco → bruno → auditoría → README).

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (incluido el riesgo de `aria-activedescendant` en la hoja móvil), la hoja con el teclado virtual, preferencias reales del sistema, Firefox y Safari (`popover`, `::backdrop`, `:popover-open`, `:has()`), un dispositivo táctil real y el tema oscuro (no existe).
