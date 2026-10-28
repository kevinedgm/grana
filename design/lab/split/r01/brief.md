# Brief · dos columnas (`GSplit`, nombre de trabajo), r01 · ronda corta

> kiwi, 2026-10-28. Origen: EC-L7 (`design/contracts/blocks/_comun.md` §37) y **#933** (enmendada por #942); el usuario aprobó la primitiva el 2026-10-28 («Sí, GSplit»). Propuesta de partida de lima en #933. Prototipo: `index.html` (`?vista=bloques&b=…` y `?vista=casos`), regla propuesta en `sp.css`, «después» sobre los bloques reales con `sp.js`, verificación `verificar.mjs` (puerto 4218).

## Para qué

Poner **un panel con varios controles al lado de otra cosa** y apilarlo cuando no cabe: el panel de compra junto a las fotos, el resumen junto a las líneas del carrito, el pedido junto al formulario de pago, la tarjeta de lo elegido junto al calendario. Lo usan primero los bloques de `@grana/blocks` (sin CSS, #763); después, cualquier aplicación.

## El problema medido (bloques reales, tema por defecto, `GContainer` de 1024 del banco)

| Bloque | Hoy | Por qué |
| --- | --- | --- |
| Product overview 01 (PO-L1) | Panel **debajo** de la galería también a 1440 | `GAdaptiveLayout` pone en línea propia un hijo con varios controles (#361, #365) |
| Cart 01 (CR-L1) | Resumen debajo de las líneas a 1440 | Igual |
| Checkout 03 | Pedido debajo del formulario a 1440 | Igual |
| Availability 03 (AV-L1, #892) | Tarjeta debajo del calendario (`GStack`) | La pista no actúa en una `table` |
| Booking summary 03 (#906) | Línea que se parte en dos a 768 | **No es este problema** (punto 21 de la declaración) |

Lima descartó enmendar `GAdaptiveLayout` (mínimo de agregados desconocidos, reabre #361) y la columna única (variantes duplicadas).

## Alcance de la ronda

Primitiva **sin forma visible**: no aplica «conceptos antes que caja» (#362). Sí «Qué lo hace distinto». Se decide: anatomía y slots, regla de colapso, proporción, separación, alineación, `sticky` (entra o se reserva), anidado, RTL, accesibilidad y foco, casos límite, densidad y peso. Fuera: CSS final (coco), `.vue` (bruno), contrato (lima).

## Verificación

`GRANA_PW_PORT=4218 node design/lab/split/r01/verificar.mjs` en Chromium, Firefox y WebKit: los cuatro bloques antes y después a 1440, 1024, 768, 390 y 320 con el texto al 100 % y al 200 %, una secuencia de cambios de tamaño, Booking summary 03 y once casos límite.
