# 020 — GMenu: una sola luz que viaja (M1), submenú con intención (M4) y aviso del `id` del disparador

- **Status**: TODO
- **Dueños**: bruno (pasos 1–4: `GMenu.vue`, pruebas, `GMenu.meta.json`), coco (pasos 5–7: `GMenu.css`, `design/lab/menu/estilo.md`, spec).
- **Contrato**: `design/contracts/menu.md` «Personalidad» y «Disparador con `id` propio»; DECISIONS.md #299 y #305.
- **Category**: Personalidad (kiwi r01 §8) + defecto (hallazgo 8 de kiwi)
- **Estimated scope**: ~70 líneas de JS, ~25 de CSS, 8–10 pruebas, 1 spec
- **Modelo**: Opus para los dos (teclado compuesto y posicionado: «componente complejo», CLAUDE.md)
- **Depende de**: nada. Orden interno: bruno → coco. Dentro de bruno, primero el aviso del `id` (independiente y pequeño), luego M1, luego M4.

## Problem

1. **Estela**: hover y foco pintan cada uno su fondo (`GMenu.css:91-99`); al barrer con el puntero hay **dos** elementos resaltados a la vez (medido por kiwi), y el foco se queda donde estaba (el teclado no sigue al puntero).
2. **Submenús que se cierran solos**: al ir en diagonal hacia un submenú abierto, cruzar otro elemento del padre lo cambia a los 180ms (`GMenu.vue:236-243`, `onEnter`).
3. **`id` propio en el disparador**: si la aplicación pone su `id` después de `v-bind="attrs"`, el menú no se abre y no avisa (`GMenu.vue:93-97`, `:353-361`).

## Target (resumen; la regla exacta está en `menu.md`)

- **M1 (bruno)**: el puntero (`mouse`/`pen`) sobre un elemento habilitado lo hace activo y lo enfoca (`preventScroll`) en el acto; `--_active-y/h` (px) en cada lista, `has-highlight`, `is-highlight-instant` (primera colocación, dos cuadros). Activo = enfocado; con el foco en un submenú, el padre expandido. **(coco)**: un resaltado por lista (capa bajo el contenido) que se desplaza en `press` + `ease-out`; los elementos sin fondo propio en hover y foco; en `forced-colors`, oculto; `reduce`, salta.
- **M4 (bruno)**: triángulo de seguridad entre la posición del puntero y las dos esquinas del borde cercano del submenú abierto (lado lógico); dentro, cruzar elementos del padre no cambia nada; parado 180ms, cambia como hoy.
- **Aviso** de desarrollo si el disparador tiene un `id` distinto de `{id}-trigger`.
- Referencia: capa de `design/lab/personalidad/r01/index.html`, bloque «GMenu · M1» (líneas ~209–236; allí `--p-hy/--p-hh`, `p-lit`, `p-lit-instant`, y la página no mueve el foco). M4 no está prototipada. **M2 (cascada) no se implementa.**

## Steps

1. **bruno** · aviso del `id` (al montar y al abrir) y prueba; confirma en la prueba por qué la referencia no basta hoy para abrir y anótalo en `GMenu.meta.json` o en el README pendiente.
2. **bruno** · M1 en `GMenu.vue`: el puntero mueve el foco; variables y clases por lista; escrituras solo si cambian.
3. **bruno** · M4 en `GMenu.vue`: triángulo con la geometría del submenú abierto; RTL; sin efecto en cascada ni con teclado o toque.
4. **bruno** · `GMenu.test.js`: puntero mueve el foco y el *roving tabindex*; deshabilitado con puntero no cambia nada; `--_active-*` del activo y del padre expandido; `is-highlight-instant` solo en la primera colocación; triángulo (diagonal sin cambio de `path`, recto a los 180ms, RTL); aviso del `id`. `GMenu.meta.json` (clases).
5. **coco** · `GMenu.css`: resaltado único, fondos de elemento retirados, `forced-colors`, `reduce`.
6. **coco** · `design/lab/menu/estilo.md`, fila «Elemento»: el activo pasa a la capa única (#305).
7. **coco** · `design/lab/theme-playground/tests/personalidad-menu.spec.mjs` con la medida de kiwi (puntero y teclado; submenú en diagonal).

## Boundaries

- El teclado de APG no cambia (flechas, letra, Esc, Tab, ← →).
- El anillo de foco de cada elemento no cambia; nada de M2 ni M3.
- Sin `--g-ease-spring` ni `--g-ease-bounce` (#299).
- `GMenu` lo usan `GWidget`, `GFilterBar`, `GCard`, `GTable` y «Más» de `GTabs`: sus pruebas deben seguir en verde.

## Verificación (por niveles)

- **Durante** (Chromium): vitest de `GMenu` (bruno, viendo que fallan antes); `GRANA_PW_PORT=4209 npx playwright test tests/personalidad-menu.spec.mjs --project=chromium` (coco).
- **Al cerrar el plan**: `npx vitest run` (incluye los consumidores de `GMenu`), `npm run build`, iconos, compuertas, el spec nuevo y `playground.spec.mjs` en los tres motores.
- **Criterio de hecho (medida de kiwi):** al barrer, 0 elementos con fondo propio y una sola superficie por lista; cuadros intermedios entre elementos (kiwi: 7); termina exacto sobre el elemento; con teclado sigue al foco; el puntero mueve el foco; trayecto diagonal sin cambio de `path`, recto a los 180ms; aviso con `id` propio; con `reduce`, el resaltado salta.
- **No verificable aquí:** lector de pantalla real con el foco siguiendo al puntero (pendiente de entorno real, CLAUDE.md «Siguientes pasos» 3).

## Después

Auditoría de coco (submenús, RTL, `forced-colors`, `pointer: coarse`); mora-docs actualiza `GMenu/README.md` (puntero y foco, «El disparador»).
