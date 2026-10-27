# Brief — isla de estado, r05: progreso determinado

> kiwi, 2026-10-27. Continúa `../r04/` (D1 · Cápsula de relevo, elegida) y el contrato vigente `design/contracts/status.md` (#693 a #707). Origen: DECISIONS #946 (rama `claude/project-thread-2ck6nd`): Cornisa queda aparte y Grana toma de ella **solo el progreso determinado**, con una ronda de kiwi sobre `GStatusIsland`.

## Usuario y tarea

Quien usa una aplicación de Grana y lanza algo que **tarda y se puede medir**: subir un informe de 30 MB, exportar 4 000 facturas, importar un CSV. Quiere cuatro cosas, en este orden:

1. **Saber que empezó** (y qué es).
2. **Poder mirar cuánto falta cuando quiera**, sin que la isla le estorbe mientras trabaja en otra cosa.
3. **Enterarse del final o del fallo** sin buscarlo.
4. **Poder cancelar** mientras dura.

## Qué problema resuelve

Hoy la isla solo conoce `busy` (la acción de una condición, indeterminado: insignia que gira). No hay forma de decir «40 %». Una aplicación que lo necesite tendría que inventar su propio aviso flotante (lo que hizo Cornisa) y chocaría con la isla en el borde superior.

## Decisiones vigentes que la ronda **no** reabre

- La isla es **transitoria** (#693: «siento que estorba»); **la memoria no flota**: lo pendiente vive en la marca junto al origen y en Alt+F8.
- **D1** (#695): una sola cápsula que cuenta su vida (`drop` → `grow` → titular → `fold` → `rise`), relevo por gravedad, «+N», asomo, lista.
- **El anillo de la insignia dice el tiempo de lectura** (#696) y se para en pausa.
- **Nunca se releva bajo la mano** (#702), **anuncia al llegar** (#698), **nunca toma el foco**, **nada se mueve** en la página (D1 de #316).
- **Frontera** (#704): si al irse queda algo pendiente, isla; si no, `GToast`.
- **Peso** (#706): `dist/status.js` ≤ 19 968 B gzip, medido 19 591 B. **No se vuelve a subir sin el usuario.**

## Qué se pide

1. Base funcional común (modelo, anuncios, teclado, foco, frontera) para el progreso determinado.
2. Dos o tres conceptos **divergentes** de forma y comportamiento, prototipados sobre **el CSS real de la isla** (`GStatusIsland.css`, `GStatusMark.css`, `defaults.css`), en claro y en oscuro.
3. Auditoría previa y posterior (`docs/documentacion/auditoria-visual.md`) y rúbrica de movimiento (`docs/documentacion/rubrica-movimiento.md`) en lo que aplique.
4. Comparativa, pregunta de elección y hallazgos para lima.

## Ver

`index.html?p=A|B|C` (`&theme=dark`, `&t=ms` fija el tiempo de lectura, `&speed=n` acelera la subida). Panel «Simular» abajo a la derecha; registro de anuncios visible. Verificación: `node design/lab/alert/r05/verificar.mjs` (`GRANA_PW_PORT=4214`).
