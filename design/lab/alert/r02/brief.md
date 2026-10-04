# Brief — aviso persistente, r02: la forma

> kiwi, 2026-10-04. Continúa `../r01/` (base funcional: frontera, anuncios, foco, casos; no se reabre).

## Por qué hay r02

El usuario vio r01 y dijo: «se ve muy genérico, algo que ya vi en otros frameworks; no le veo lo innovador». r01 era la caja de siempre (icono, título, cuerpo, botón, marca lateral) con buen comportamiento. La regla «Personalidad e innovación» no se cumple animando una caja convencional.

## Qué se pidió

Tres conceptos **divergentes de forma y comportamiento**, sobre los componentes reales de `dist/` y con los **tokens del tema por defecto** (no el kit gris), resolviendo los mismos cinco casos: error de servidor al guardar, error al cargar una tabla, aviso persistente de página, éxito que se queda, advertencia en una sección o un diálogo.

| | Concepto | Idea |
| --- | --- | --- |
| A | Nace de su causa | El mensaje sale del control que lo provocó: «Guardar» se abre y pasa a «Reintentar»; el fallo de carga ocupa el hueco de las filas |
| B | Isla de estado | Una sola píldora persistente en el shell; no ocupa sitio en el contenido; se abre sola si es grave; reconocida, se repliega a un punto |
| C | Nota al margen | Sin caja: una regla en el margen de la región y texto que cuenta la secuencia (qué pasó, qué se hace, cómo acabó) |

## Decisión

El usuario eligió **B · Isla de estado** al ver el prototipo (decisión transmitida por la coordinación el 2026-10-04). A y C quedan reservadas. `declaracion.md` desarrolla B al nivel que lima necesita.

## Ver

`index.html?c=B` (también `?c=A`, `?c=C`; `&dir=rtl`). Verificación: `node design/lab/alert/r02/verificar.mjs` (`GRANA_PW_PORT=4209`).
