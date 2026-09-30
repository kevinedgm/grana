# Auditoría de coco · GSwitch (paso 5)

**Componente:** `packages/vue/src/components/GSwitch/` (el real, `.vue` + `.css`, con `dist/` reconstruido).
**Método:** Chromium, playground (`localhost:4173`). Se montaron 37 instancias reales: apagado, encendido, con ayuda, deshabilitado y solo lectura (cada uno apagado y encendido), inválido (apagado y encendido), cargando (apagado y encendido), etiqueta al inicio, con iconos on/off, los 7 colores, los 5 tamaños × 3 densidades y una etiqueta larguísima sin espacios. Se compararon los estilos computados bajo el tema por defecto y bajo un tema distinto (marca vino, acento verde azulado, los 7 colores propios, superficies ámbar, texto marrón, borde 2px, foco 3px, espacio base 5, Georgia). Tab y ratón reales. Los bloques `pointer: coarse`, `prefers-reduced-motion` y `forced-colors` se aplicaron sin condición.

## Resultado: aprobado, con 1 corrección

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | Las 266 propiedades medidas (color, fondo, borde, pulgar, fuente, contorno, sombra) cambian; ninguna conserva el valor por defecto |
| Contraste (tema por defecto) | Riel apagado contra fondo, pulgar contra riel y marca contra pulgar: 3.45:1 · encendido: brand 16.48, accent 5.69, neutral 5.33, success 5.35, warning 5.73, danger 5.49, info 5.69 · solo lectura encendido 7.46 y apagado 3.45 · borde inválido 5.49 · texto mínimo 5.49 |
| Contraste (tema de prueba) | Apagado 4.86 · encendido de 5.16 a 9.64 · solo lectura 7.36 · borde inválido 9.46 · texto mínimo 7.08 |
| Geometría con el tema (`space` 5, borde 2px) | Riel 45×25, 50×27.5, 55×30, 65×37.5 y 80×45px; pulgares de 16, 18.5, 21, 28.5 y 36px; el pulgar encendido queda a 2,5px del borde derecho, igual que el apagado del izquierdo |
| Fila por tamaño y densidad | 30, 30, 30, 40 y 50px con `space` 5; `xl compact` nunca menor que el riel (45px) |
| Foco con teclado (real) | Anillo de 3px, separación de 2px, color del tema |
| Hover real con el ratón | Apagado: contorno y pulgar pasan a `text-muted`. Encendido: relleno a `strong` |
| Táctil (`pointer: coarse`) | Todas las filas ≥ 44px; el riel y la etiqueta comparten centro (22px de 44px) |
| Movimiento reducido (bloque aplicado sin condición) | Transición del riel, del pulgar y de la marca a `0s`; el giro del anillo solo existe con `no-preference` |
| Colores forzados (bloque aplicado sin condición) | Apagado: borde y pulgar `ButtonText`, riel `Canvas`. Encendido: riel `Highlight`, pulgar `HighlightText`. Deshabilitado: `GrayText` |
| RTL (`dir="rtl"`) | El riel pasa a la derecha; el pulgar encendido se desplaza en sentido inverso (`translate` −25px) |
| Iconos on/off | Se muestra el icono de su estado, el otro no, y la marca dibujada se oculta solo en ese estado |
| Cargando | `aria-busy`, anillo giratorio en lugar de la marca; los iconos se ocultan mientras dura |
| Etiqueta larguísima sin espacios | Ya no desborda (ver hallazgo 1) |
| Consola | Sin errores |

## Hallazgos y correcciones

1. **Una palabra larguísima sin espacios desbordaba.** Una etiqueta (o ayuda) sin puntos de corte, como una URL o un identificador, sacaba el contenido de la columna y aparecía scroll horizontal (WCAG 1.4.10). Corregido en `GSwitch.css`: `overflow-wrap: anywhere` en `g-switch__text`.

## Observación para otros componentes

`GCheckbox.css` y `GInput.css` no tienen `overflow-wrap`, así que probablemente les pase lo mismo con una palabra larguísima. No se toca aquí (cada CSS es de su auditoría); queda anotado para revisarlo.

## Sin verificar (no bloquea `candidate`)

Lector de pantalla real (rol `switch`, "activado", ayuda, error, `aria-busy`), preferencias reales del sistema (solo se aplicaron los bloques sin condición), Firefox y Safari (pseudo-elementos del `<input>` con `appearance: none`, `:dir()` y `:has()`), un dispositivo táctil real y el tema oscuro (no existe).
