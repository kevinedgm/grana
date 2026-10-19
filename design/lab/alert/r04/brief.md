# Brief — isla de estado, r04: tres propuestas sobre la base D

> kiwi, 2026-10-19. Continúa `../r03/` (reproducción del reporte del usuario, conceptos A a D). Separo la ronda en r04 porque cambia la pregunta: ya no es *qué comportamiento*, sino *qué forma y qué comportamiento fino* sobre una base elegida.

## Decisión de partida (del usuario)

Se toma la **base de D** de r03: la isla es **transitoria** (se muestra y se recoge sola, con pausa), **cae del borde superior** con suavidad y sin el primer cuadro a todo el ancho, **sin punto**, y lo que exige acción queda **en su marca** junto al control y en **Alt+F8**.

## Qué se pidió

1. Auditoría previa de la isla real y de D según `docs/documentacion/auditoria-visual.md` (regla obligatoria del usuario) §1 y §3, aplicada a una isla flotante, integrando la medición de movimiento de coco (`../auditoria-movimiento.md`).
2. Tres propuestas que difieran en forma y en comportamiento, con los tokens reales del tema por defecto, claro y oscuro.
3. Auditoría posterior con `verificar.mjs` en Chromium, Firefox y WebKit.
4. Comparativa, pregunta e informe en el formato del brief §5.

## Desenlace

Mientras la ronda estaba en curso, el usuario vio los prototipos y **eligió D1 · Cápsula de relevo**, con una nota: que la píldora sea **más atractiva, visual y moderna**. Eso es estética y pasa a **coco** sobre la estructura de D1 (`declaracion.md` §6). D2 y D3 quedan documentadas como descartadas.

## Ver

`index.html?p=D1` (también `?p=D2`, `?p=D3`; `&theme=dark`; `&t=ms` fija el tiempo de lectura). La cabecera es una zona de marca (`data-g-zone="brand"`): es el fondo más difícil para una isla oscura. Verificación: `node design/lab/alert/r04/verificar.mjs` (`GRANA_PW_PORT=4213`).
