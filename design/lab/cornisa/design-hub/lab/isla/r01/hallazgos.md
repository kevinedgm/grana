# Hallazgos · Isla · r01

Todos salieron del QA en navegador (Playwright) o de revisar las capturas. Se corrigieron en el prototipo **y** se trasladaron al contrato propuesto.

| Id | Sev. | Hallazgo | Decisión | Responsable | Estado |
|---|---|---|---|---|---|
| H-01 | Alta | Las actividades en cola se quedaban en `entering` para siempre: faltaba un estado de espera | Nueva fase `queued` + `demote` (D-06) | kiwi → lima (contrato) | Corregido en el prototipo |
| H-02 | Alta (a11y) | El anunciador descartaba mensajes: en una ráfaga de 4, solo se anunciaba el último | Cola FIFO coalescida por actividad; al degradar a la cola se retira su anuncio pendiente (D-03) | kiwi → coco | Corregido en el prototipo |
| H-03 | Alta (API) | `show(...).expand()` inmediato se ignoraba | La intención se guarda en la cola (D-06) | lima (contrato) | Corregido en el prototipo |
| H-04 | Alta (a11y) | En 393 px el expandido tapa la acción primaria del anfitrión: incumple WCAG 2.4.11 si el foco va ahí | Contraer al salir el foco o al pulsar fuera (D-07) | kiwi → coco | Corregido en el prototipo y verificado con un test |
| H-05 | Alta | La secundaria no recibía clics: `all:unset` heredaba `pointer-events:none` del contenedor | Declarar `pointer-events:auto` de forma explícita. **Regla para coco:** no usar `all:unset` sin restaurar las propiedades heredadas | coco | Corregido en el prototipo |
| H-06 | Media | En una ráfaga síncrona se promovía y degradaba la misma actividad en el mismo tick, con doble anuncio | Render por lotes en microtarea (decisión de arquitectura para el núcleo) | lima → coco | Corregido en el prototipo |
| H-07 | Media | El título largo seguía truncado en el expandido | El expandido muestra el texto completo | kiwi | Corregido en el prototipo |
| H-08 | Media | La isla compacta tapa parte de la cabecera del anfitrión en compact | Pendiente: `--isl-reserved` / `scroll-padding-top` (D-08) | producto | **Abierto** |
| H-09 | Baja | El morph anima `width/height`, que provoca layout | Evaluar en F3 (D-11). No se ha medido el rendimiento | coco + improve-animations | **Abierto** |
