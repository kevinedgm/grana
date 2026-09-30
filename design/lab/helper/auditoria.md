# Auditoría de coco · GHelper y GHelperScope (paso 5)

**Componentes:** `packages/vue/src/components/GHelper/` y `GHelperScope/` (los reales, con `dist/` reconstruido).
**Método:** Chromium con el build real (`dist/grana.umd.js` y `grana.css`) y Vue global: disparador por defecto, personalizado y deshabilitado; tres regiones `GHelperScope` con `attach` `inside`, `edge` y `outside`; los 12 `placement`; un helper `right-start` para RTL. Medido con `getComputedStyle` en claro, con un tema distinto (crema, `space` 5, radios 10/16, borde 2px, foco de 3px verde azulado, serif), en oscuro, en RTL, con movimiento reducido y colores forzados emulados.

## Resultado: aprobado, sin correcciones

| Prueba | Por defecto | Tema distinto | Oscuro |
| --- | --- | --- | --- |
| Tamaño del disparador | 32px | **40px** (sigue a `space`) | 32px |
| Icono sobre su fondo | 7.46:1 | 15.73:1 | 15.22:1 |
| Borde sobre la página / la región | 3.45 / 3.45 | 6.20 / 6.99 | 9.29 / 8.59 |
| Geometría (centro sobre el borde · distancia al final) | `inside` 25/9 · `edge` **1**/9 · `outside` −23/9 | `inside` 31/11 · `edge` **1**/11 · `outside` −29/11 | igual que por defecto |
| 12 `placement` (% del ancho, % del alto) | 3·50·97 en cada lado; laterales a 9/50/91% | laterales a 11/50/89% (el `offset` sigue a `space`) | igual |
| Popover: texto · radio · ancho máximo · sombra | 17.4:1 · 8px · 320px · sí | 15.73:1 · **16px** · **400px** · sí | 15.22:1 · 8px · 320px · sí |
| Disparador abierto (borde) | `text` | `text` del tema | `text` del oscuro |
| Disparador personalizado | 24px de alto mínimo; texto 17.4:1 | 13.94:1 | 16.46:1 |
| Foco | — | **3px** sólido con el `--g-color-focus` del tema (sin estilo propio) | — |

| Prueba | Resultado |
| --- | --- |
| RTL | Los tres `attach` quedan al **inicio** físico (izquierda) a 9px; los 12 `placement` se reflejan (`top-start` al 97%, `right-*` a la izquierda) |
| RTL, contenido `right-start` | El disparador queda junto al borde izquierdo del visor: el contenido no cabe al final de línea (izquierda) y **se voltea** al opuesto (derecha). Es el volteo correcto; el caso con espacio lo cubre la prueba unitaria de `placeAround` («RTL: left/right lógicos») |
| Movimiento reducido | Transición del popover: **0s** |
| Colores forzados (emulación) | Borde del disparador y del popover con colores de sistema; el icono toma el color de texto del sistema |
| Deshabilitado | `disabled` nativo; opacidad 0.5 |
| Consola | Sin errores ni avisos |

## Observaciones

- **El ancho máximo del popover sigue a `space`** (`space × 80`: 320px → 400px con `space` 5). Es coherente con el sistema; un tema con `space` grande tendrá popovers más anchos.
- **Sin ejecutar:** `forced-colors` real, Firefox y Safari (`@starting-style`, API `popover`), lector de pantalla, zoom al 200%, dispositivo táctil real (el área de 44px se verificó con la emulación táctil de Chromium en la entrega de bruno).
