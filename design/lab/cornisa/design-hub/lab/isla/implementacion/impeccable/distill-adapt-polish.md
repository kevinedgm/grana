# impeccable · distill → adapt → polish · cornisa · 2026-10-26

**Cómo se ejecutó (honesto):** `impeccable context` se ejecutó de verdad (lanzador v4.3.1). Critique se ejecutó en **modo degradado** (un solo contexto: sin subagentes; A guardada antes de B), con el detector CLI, overlay `detect.js` inyectado y `live-server` arrancado y parado, y la instantánea persistida con `critique-storage write`. distill, adapt y polish: se cargaron sus playbooks y se aplicaron **a mano** (= `manual-playbook` en el registro). No se modificó ningún archivo vendorizado de impeccable.
Aviso del lanzador: hay una versión nueva de impeccable (v4.7.0). No se actualizó.

## Lo que se tomó de la critique
| Problema | Pasada | Resultado |
|---|---|---|
| P1 nº 1 Expandido inalcanzable en pantallas bajas | adapt | ✅ Alto limitado a `viewport − 8 px`, detalle desplazable (`overflow:auto`, `overscroll-behavior:contain`). 844×390 + 200 %: la forma pasa de 677 a 382 px; «Cerrar» se alcanza con el teclado (prueba nueva en 7 proyectos) |
| P1 nº 2 Acciones ocultas en compacto | — | ⛔ **No aplicado.** Cambia la anatomía congelada de r02 → `unresolved`, devuelto a **kiwi** (r03) para decisión del usuario |
| P1 nº 3 Glifos Unicode como iconos | polish | ✅ Iconos SVG dibujados (trazo 2/24, una familia) creados con `createElementNS` |
| P2 nº 4 Sin pista de expansión | polish | ✅ Chevron SVG `aria-hidden`; gira al expandir (sin transición con movimiento reducido) |
| P2 nº 5 Hover/active, «Cerrar» discontinuo, padding del ejemplo | polish | ✅ `(hover:hover)` + `:active`; «Cerrar» con borde sólido discreto; `::selection` tematizada; padding de los botones y del relleno del ejemplo |

## distill: lo que se quitó
- Bordes CSS por intención (`border-radius` 50 % / 4 px / 0 y la forma de «warning»): sobraban con iconos dibujados.
- La regla `.cornisa-icon:has(svg, img)`: ya no es necesaria (también eliminaba una dependencia de `:has()` por debajo del suelo de navegadores).
- `ICON_GLYPH`.
No se quitó ninguna funcionalidad. Se mantienen el `%` y la barra (precisión + forma).

## Detector tras los cambios (una sola pasada)
`impeccable detect --json cornisa/examples/index.html` → **1 hallazgo**: `marquee` en el progreso indeterminado. **Excepción revisada** y documentada en el CSS: indica un estado en curso, no es contenido que se desplace; se detiene con `prefers-reduced-motion` y desaparece al llegar un progreso o un resultado. `cramped-padding`: resuelto.

## Verificación tras las pasadas
núcleo 20/20 · navegador 161/161 (23 pruebas × 7 proyectos, 2 workers) · tsc 0 errores · mutación de continuidad sigue detectándose · capturas en `cornisa/evidence/hoja-*`.
Incidencia: «CSP estricta» falló **una vez** en WebKit 1440 en una ejecución con 3 workers y la máquina cargada; aislada, 10/10 OK, y en la ejecución completa con 2 workers, OK. Registrada como intermitente **sin causa identificada**.

## Instantánea de critique
`.impeccable/critique/2026-10-26T19-10-04Z__cornisa-examples-index-html.md` (24/36). **No se cierra** (`critique-storage close`): el P1 nº 2 sigue abierto, como manda polish.
