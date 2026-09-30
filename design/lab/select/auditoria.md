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

---

# Auditoría de coco · GSelect r02 (prefijo, iconos y fila «Agregar nuevo…»)

**Componente:** `GSelect.vue` y `GSelect.css` con `createLabel`, `create`, `prepend` e `icon`, con `dist/` reconstruido.
**Método:** Chromium, playground (`localhost:4173`). Se montaron 11 instancias reales (completo, con valor con icono, solo prefijo, solo iconos, lista vacía + crear, inválido, `soft`, deshabilitado, texto largo, `xl` y `xs`) y un selector cuyo `create` abre un `GDialog` de la aplicación. Se compararon los estilos computados bajo el tema por defecto y bajo el tema distinto de la auditoría r01 (ámbar, Georgia, radios 0, 2, 14 y 28, borde 2px, foco 3px, espacio 5). Teclado real. Los bloques `pointer: coarse` y `forced-colors` se aplicaron sin condición.

## Resultado: aprobado, sin correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 290 propiedades medidas cambian; ninguna conserva el valor por defecto |
| Contraste (tema por defecto) | Texto de la fila 17.4:1 · «+» 17.4 · icono de opción 6.9 · prefijo 5.1 |
| Contraste (tema de prueba) | Texto de la fila 13.27 · «+» 13.27 · icono de opción 5.7 · prefijo 5.93 |
| Altura de la caja con prefijo y con iconos | 45px con `space` 5, igual que sin ellos |
| Fila y opciones | 36px por defecto y 45px con `space` 5, iguales; 44px en la hoja móvil y con puntero grueso (45px con `space` 5) |
| El icono del valor sustituye al prefijo | Sin valor, el prefijo se ve; con una opción elegida con icono, se oculta |
| Flujo completo con teclado real | `↓`, `Fin`, `Enter`: la fila se activa, cierra, no cambia el valor, devuelve el foco al botón y emite `create`; la aplicación abre su `GDialog` (el foco entra en él); con Esc, el diálogo se cierra y **el foco vuelve al botón del selector**, con el valor sin cambio |
| Agregar y elegir | La aplicación agrega la opción y la elige: la lista pasa de 4 a 5 filas, el valor muestra su icono y el prefijo se oculta |
| Tab sobre la fila | Cierra sin crear; el foco sigue el orden |
| Deshabilitado | Sin fila y sin abrir |
| Colores forzados (bloque aplicado sin condición) | Separador `CanvasText`; el «+» (bordes de 4px) se mantiene |
| RTL | El «+» pasa a la derecha y el relleno (36.2px) al lado derecho; a la izquierda, 15px |
| Hoja inferior a 375px | Ancho completo, fila y opciones de 44px, fila visible, fondo `rgba(0, 0, 0, 0.32)`, sin desborde horizontal; el toque en la fila cierra y emite `create` |
| Texto largo | La fila parte el texto y crece (62px); sin desborde en la lista ni en la página |
| Consola | Sin errores |

## Observaciones

- **El separador de la fila no llega a 3:1** (1.75:1 con el tema de prueba): es un refuerzo decorativo; la fila se identifica por su texto y por el «+» dibujado (13:1 o más).
- **Una fila sin icono entre opciones con icono no reserva espacio** (por diseño del contrato): si solo algunas opciones traen icono, el texto queda desalineado. La aplicación debe dar icono a todas las opciones o a ninguna.

## Sin verificar (no bloquea)

Lector de pantalla real (cómo anuncia la fila crear como opción y los iconos), preferencias reales del sistema, Firefox y Safari, y un dispositivo táctil real.
