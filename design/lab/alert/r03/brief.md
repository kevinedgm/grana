# Brief — isla de estado, r03: que se entienda

> kiwi, 2026-10-18. Continúa `../r02/` (B · Isla de estado, elegida por el usuario, #315) y el componente real (`GStatusIsland`, `GStatusMark`, `GStatus`, contrato `design/contracts/status.md`, #315 a #328 y #692). No reabre la frontera de r01 ni la elección de la isla frente a la caja en línea.

## Por qué hay r03

Reporte del usuario al usar la isla real en el playground (2026-10-18), en lo esencial: la forma en que aparece es abrupta y tosca; no sabe cuándo se cierra porque se queda; un error siempre se queda y, aunque «se cierre», queda solo un icono flotando que no sabe qué significa; no le queda clara la intención del comportamiento.

El usuario **eligió** este concepto y aun así no entiende su intención. Es un hallazgo de diseño: si el comportamiento contratado no se explica solo, hay que cambiar el comportamiento o cómo se comunica.

## Qué se pidió

1. Reproducir el ciclo completo en el playground como lo haría alguien que no conoce el contrato, y separar **defecto** (no cumple el contrato), **intención que no se comunica** (cumple, pero no se puede saber) y **decisión que conviene reabrir**.
2. Revisar fronteras y uso real (NisaNabani, playground, README).
3. Dos o tres conceptos de **comportamiento** (A/B/C) con la base funcional intacta, tokens reales del tema por defecto, verificados en los tres motores.
4. Comparativa y una pregunta de elección.

## Ver

- Reproducción sobre la isla real: `node design/lab/alert/r03/reproducir.mjs` (`ENGINES=chromium,firefox,webkit`; `SHOTS=1` guarda capturas en `r03/capturas/`, no versionadas). Evidencia del nacimiento: `evidencia-nacer.png`.
- Conceptos: `index.html?c=A`, `?c=B`, `?c=C` (`&t=ms` cambia el tiempo de lectura). Verificación: `node design/lab/alert/r03/verificar.mjs` (`GRANA_PW_PORT=4213`).
