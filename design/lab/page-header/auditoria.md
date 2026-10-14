# GPageHeader · auditoría de coco (paso 5)

**Fecha:** 2026-10-14  
**Auditor:** coco  
**Componente:** `GPageHeader` (`@grana/vue/page-header`, `design/contracts/page-header.md`)  
**Estado antes:** `draft` · **Estado tras la auditoría:** `candidate`

---

## Base de verificación

El componente llegó con:

- `design/lab/page-header/estilo.md` (documentación de estilo de coco, con 1284 comprobaciones del banco de estilo en los tres motores)
- `design/lab/page-header/estilo-verificar.mjs` (verificación automatizada del banco)
- `design/lab/page-header/estilo-banco.html` (banco con el marcado exacto del contrato)
- `design/lab/theme-playground/tests/page-header.spec.mjs` (19 pruebas Playwright)
- `GPageHeader.test.js` (28 pruebas jsdom)

Esta auditoría de paso 5 verifica el componente **real** (bruno), no solo el banco de estilo.

---

## Criterios verificados

| # | Criterio | Resultado | Notas |
|---|----------|-----------|-------|
| 1 | Solo `var(--g-*)` y alias `var(--_*)`, sin valores de respaldo | PASA | Todos los `var()` usan `--g-*` o `--_*`. La única excepción documentada es `--g-page-header-top`, propiedad pública de entrada registrada con `@property` (permitida explícitamente por el contrato #629 como análoga a `--g-accordion-sticky-top`). Sin fallbacks. |
| 2 | Sin `@layer` en el CSS del componente | PASA | Ausente. |
| 3 | Sin literales de color ni de tema | PASA | Los únicos literales permitidos: `44px` (área táctil), `0px` (valor inicial de `@property`). |
| 4 | Área táctil ≥ 44px en interactivos propios | PASA | `g-page-header__dock-title`: `min-block-size: 24px` por defecto; `min-block-size: 44px` con `pointer: coarse`. `GBtn`, `GTabs` y `GBreadcrumbs` traen sus propias dianas. |
| 5 | Contraste texto ≥ 4.5:1 (controles ≥ 3:1) | PASA | Verificado en estilo-banco con 13 temas (ver tabla de estilo.md). h1 ≥ 11,57:1, descripción ≥ 7,46:1, pestañas ≥ 4,64:1 en todos los temas medidos. |
| 6 | Foco siempre visible | PASA | `g-page-header__title:focus-visible` y `g-page-header__dock-title:focus-visible` usan `--g-focus-width`, `--g-color-focus`, `--g-focus-offset`. Con el foco en el `hN` (tabindex=-1), el anillo solo aparece con `:focus-visible`. |
| 7 | RTL | PASA | Propiedades lógicas en toda la raíz. La caja física del muelle (`--_dock-left`, `--_dock-right`) la escribe el `.vue` y tiene en cuenta el ancho real. Título compacto al inicio lógico (RTL: derecha). Verificado en la prueba Playwright «RTL: pegado y título compacto al principio lógico» y «RTL: el muelle ocupa la caja del encabezado». |
| 8 | `forced-colors` | PASA | `@media (forced-colors: active)`: el suelo pegado gana `border-block-end: var(--g-border-width) solid CanvasText` (el `inset` de `box-shadow` desaparece con colores forzados); el filo del muelle pasa a `CanvasText`; el faldón se oculta. |
| 9 | `prefers-reduced-motion` | PASA | Con `reduce`: `base-title` sin `translate`; muelle sin `translate` (solo fundido de opacidad en `fast`); también dentro de `@supports`. `@starting-style` adaptado. |
| 10 | `--g-ease-spring` en el muelle | PASA | Dentro de `@supports (transition-timing-function: linear(0, 1))` según el patrón de §29.1. Sin el soporte cae a `--g-ease-out`. Decisión #635. |
| 11 | `@starting-style` | PASA | Presente para la entrada del muelle (`is-open`). El `.vue` ya pone `is-open` un cuadro después de quitar `hidden`. |
| 12 | Impresión | PASA | `@media print`: sin pegado ni sombra en la raíz; muelle oculto. |
| 13 | Zona de marca (`data-g-zone="brand"`) | PASA | `--_bg` resolviéndose en la raíz con los tokens de la zona (no el que trae la anfitriona). Fondo del muelle sin zona (siempre `--g-color-surface`). Verificado en Playwright «zona de marca: h1, descripción y ruta ≥ 4,5:1 sobre la raíz». |
| 14 | Pegado y `edgeReserve` | PASA | `EDGE_ORDER.pageHeader` = 15. Dos dueños: zócalo arriba y muelle abajo. La isla (`GStatusIsland`) y los avisos (`GToaster`) respetan la reserva. Verificado en Playwright con la isla real y el toaster real. |
| 15 | Regla del cuarto | PASA | Sin `is-sticky` cuando el zócalo supera el 25% del alto del visor. Verificado en Playwright «regla del cuarto: con un visor de 180 px de alto no se pega». |
| 16 | Δ0: la página no se mueve | PASA | `docTop` del panel de pestañas permanece constante al pegarse y al volver. 0 mudanzas en escritorio. Verificado en Playwright. |
| 17 | «Los mismos nodos» al mudar al muelle | PASA | Acciones en el mismo `role="group"`. `Teleport :disabled` conmutado. Estado de la acción estateful (`Stateful` en test) sobrevive a la mudanza. Verificado en jsdom y Playwright. |
| 18 | Tokens en defaults.css | PASA | `--g-color-surface`, `--g-color-bg`, `--g-shadow-2`, `--g-shadow-3`, `--g-ease-spring`, `--g-duration-slow`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-font-title`, `--g-font-ui`, `--g-border-width`, `--g-color-border`, `--g-color-border-strong`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-radius-xs`, `--g-space-*`, `--g-text-*` existen. |
| 19 | vitest (jsdom) | PASA | 28 pruebas pasan. |
| 20 | Playwright Chromium | PASA | 19/19 pruebas pasan. |

---

## Hallazgos

### H1 · Contraste del fondo de zona en reposo en el oscuro por defecto (no bloqueante; pendiente de lima)

En el oscuro del tema por defecto, la banda de la zona de marca sin pegar no separa su fondo de la página (1,12:1). Pegada sí se separa por la línea del zócalo (1,86:1 frente a página) y la sombra `shadow-2`. Documentado en `estilo.md` «Conclusión».

La resolución requiere una decisión de lima: si se quiere el filo también en reposo (`zone-edge` token o `border-block-end` con `inset` para no sumar al alto fijo). No es un defecto de coco; se devuelve a lima.

### H2 · El `GBreadcrumbs` del slot `trail` arranca 8px por dentro del título (nota para bruno)

El relleno de pastilla de `GBreadcrumbs` crea una sangría visual que no es del encabezado (el contrato no deja estilizar piezas internas). No afecta a la estructura ni a la accesibilidad. Pendiente de revisar si hace falta un ajuste de `GBreadcrumbs` o una receta de la aplicación. No es bloqueante.

---

## Pendientes para otros roles

- **lima:** decidir si añadir `zone-edge` token o borde en reposo para `GPageHeader` en la zona oscura (H1). Pendiente de decisión de producto.
- **coco (seguimiento):** cuando se cree el bloque `[data-g-zone="brand"]` en `defaults.css`, sustituir la zona inyectada del banco (`#zone-css`) por el bloque real y re-ejecutar `estilo-verificar.mjs`.
- **mora-docs:** README de `GPageHeader`.

---

## Conclusión

No queda ningún defecto bloqueante de coco. El componente cumple el contrato de tokens, accesibilidad, RTL, `forced-colors`, `prefers-reduced-motion`, zona de marca y `edgeReserve`. La personalidad (hundimiento, título ligado a la mano, muelle con `--g-ease-spring`) está implementada y documentada. Status actualizado a **`candidate`**.
