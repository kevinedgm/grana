# Reparto de responsabilidades

Regla de oro: **un archivo, un dueño.** Ningún agente edita un archivo que pertenece a otro; si necesita un cambio, se lo devuelve a su dueño.

## Quién hace qué

| Agente | Decide | Entrega | Dueño de |
| --- | --- | --- | --- |
| **kiwi** | Arquitectura visual: anatomía, estados, geometría, comportamiento adaptativo. Sin estilo. | Ronda de prototipo | `design/lab/<nombre>/rNN/` |
| **lima** | Contrato: API del componente, qué tokens consume, si hace falta un token nuevo | Contrato por componente; contrato global de tokens | `design/contracts/`, `docs/contract/` |
| **coco** | Estética: CSS del esqueleto, valores del tema por defecto, movimiento. Audita. | CSS del componente; tema por defecto; auditoría | `packages/vue/src/components/<Nombre>/<Nombre>.css`, `packages/vue/src/styles/defaults.css` |
| **bruno** | Funcionalidad: props, eventos, slots, v-model, accesibilidad funcional, rendimiento, empaquetado, CLI | Componente funcional, pruebas, registro | `*.vue`, `*.test.js`, `*.meta.json`, `src/index.js`, `packages/cli/` |
| **mora-docs** | Documentación de lo ya verificado | README del componente, sitio de docs | `packages/vue/src/components/<Nombre>/README.md` |

## Flujo A · Fundación del tema (una sola vez)

1. **lima** congela el contrato de tokens (`docs/contract/tokens.md`). Hecho: v0.1.
2. **coco** fija los valores por defecto de Grana (`defaults.css`).
3. **bruno** construye el mecanismo: capas CSS y `@grana/cli`, que valida el tema contra el contrato de lima.

## Flujo B · Por cada componente

| # | Agente | Entrega | Condición para avanzar |
| --- | --- | --- | --- |
| 1 | kiwi | Prototipo de estructura | `declaracion.md` aprobada |
| 2 | lima | Contrato del componente | API y tokens listados; tokens nuevos agregados al contrato global |
| 3 | coco | `<Nombre>.css` | Solo `var(--g-*)`, sin literales |
| 4 | bruno | `<Nombre>.vue` + pruebas + registro | Build y pruebas en verde |
| 5 | coco | Auditoría | Cambiar el tema no deja ningún valor fijo |
| 6 | mora-docs | README | Documenta lo verificado, no lo planeado |

Si falta una entrega previa, el siguiente agente **se detiene** e invoca al dueño. Nadie rellena el hueco de otro.

## Reglas que ningún agente puede romper

- Los componentes solo leen `var(--g-*)`, **sin valores de respaldo**. Los valores por defecto viven en un solo lugar: la capa `grana.defaults`.
- Los mínimos de accesibilidad no son tema: área táctil ≥ 24px (≥ 44px con `pointer: coarse`), texto ≥ 12px, contraste de texto ≥ 4.5:1, foco siempre visible.
- Los componentes no hacen `fetch` ni leen globals de la aplicación: presentan y emiten intención.
