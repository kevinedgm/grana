# Orden de construcción (lima → coco) · cornisa · 2026-10-26

> Lima **no está instalada** como skill en este entorno. Esta orden se redactó a mano siguiendo `skills/lima/SKILL.md` (pasos 1–5 de «What lima does») y `reference/component-api.md`. **No es una ejecución de Lima.**

1. **Clasificación:** `cornisa` = **pattern** (superficie de feedback no modal, sin dominio). Para Coco: **UI Primitive** (sin endpoints ni conocimiento de dominio).
2. **Reutilización:** el registro solo contiene `cornisa` (draft). No hay nada que reutilizar → `new`.
3. **Registro:** `cornisa` en `draft` (hecho el 2026-10-26).
4. **Contrato** (congelado por las rondas r01 + r02 y las decisiones del usuario):
   - Estados públicos: queued · entering · compact · expanded · dismissing · removed. Fases de la gota internas.
   - API v0 de `docs/04-api-y-maquina-de-estados.md`, con `maxVisible` fijo en 1 y «+N» como botón que muestra la siguiente actividad.
   - Accesibilidad: contrato §4 de docs/04 (WCAG 2.2 AA).
   - Movimiento: r02 (D2-01…D2-05 congeladas; D2-02 con los valores del prototipo).
   - Identidad: neutra (tokens `--cornisa-*`).
   - Navegadores: Chrome/Edge ≥ 84, Firefox ≥ 69, Safari/iOS ≥ 14.
5. **Para Coco:** stack `vanilla-js + vanilla-css`, 0 dependencias runtime, ESM. Un solo paquete con subrutas (`cornisa`, `cornisa/core`, `cornisa/style.css`) en lugar de tres paquetes: misma separación de capas, menos superficie de publicación (principio «no sobrearquitectar»).
6. **Abiertos que resuelve Coco con valores por defecto documentados:** D-09 (raíz al final del contenedor), D-10 (las actividades en cola no consumen tiempo), D-12 (Esc en compacto no hace nada), D2-09 (forced-colors con colores del sistema).
7. **Fuera de la orden:** publicación, licencia (no decidida), identidad visual.
