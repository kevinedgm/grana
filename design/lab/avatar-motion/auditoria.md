# Auditoría de coco · GAvatarMotion (paso 5)

**Componente:** `packages/vue/src/components/GAvatarMotion/` (el real, con `dist/` reconstruido).
**Método:** Chromium con el build real y Vue global: 4 tamaños, 7 colores y, aparte, 60 avatares en `thinking`. Medido con `getComputedStyle` en claro, con un tema distinto (`primary` granate `#7A1E3A`, `accent` verde azulado, `space` 5), en oscuro, en RTL, con colores forzados y movimiento reducido emulados.

## Resultado: aprobado, sin correcciones

| Prueba | Resultado |
| --- | --- |
| Sensibilidad al tema | En los avatares `brand` y `accent`, cambian **102 de 114** colores de forma; los 12 que no cambian son los ojos, porque el tema de prueba deja `on-primary`/`on-accent` en blanco, igual que el defecto. Los avatares de las familias que el tema no toca conservan su color (esperado). Con el granate del tema, el avatar toma el color del prototipo del usuario |
| Tamaños | 24/32/48/96px; con `space` 5, **30/40/60/120** |
| Ojo sobre el cuerpo (mínimo de los 7 colores) | **5.33:1** (defecto) · **5.23:1** (tema) · **4.81:1** (oscuro) |
| Pupila sobre el ojo | ≥ 7.46:1 · 7.46:1 · 6.10:1 |
| Silueta sobre el fondo | ≥ 7.46:1 · 7.46:1 · 6.20:1 |
| RTL | El dibujo **no** se refleja (es una figura, no texto): la antena «start» sigue a la izquierda |
| Rendimiento | 60 avatares en `thinking` (382 animaciones CSS de `transform`): **~60 fps** en Chromium sin limitar CPU |
| Colores forzados | Silueta `CanvasText`, ojos `Canvas`: la figura se reconoce |
| Movimiento reducido | **0** animaciones |
| Consola | Sin errores ni avisos |

(El comportamiento de estados, `animationend`, `done`, `v-model:state` y la pose con movimiento reducido se verificó en la entrega de bruno con el build real: vuelta a reposo a ~680ms tras `success`, ~815ms de pose con movimiento reducido.)

## Observaciones

- **Con el tema por defecto de Grana, el avatar es casi negro** (`brand` = `#1F1F1F`). Es la regla de tema: el color lo pone cada proyecto.
- Las **bandas** del cuerpo contrastan 2.3–4.8:1 con el núcleo: detalle decorativo, sin exigencia.
- **Sin ejecutar:** lector de pantalla con `label`, rendimiento en un móvil de gama baja, Firefox y Safari (`transform-box: fill-box` en SVG).
