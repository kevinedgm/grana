# @grana/blocks

Capa de composición sobre `@grana/vue` para pantallas de negocio (CRUD, editor, detalle, dashboard). Un block ensambla componentes de Grana de forma transparente (props, eventos de intención, slots); no hace `fetch`, no valida ni guarda y no conoce endpoints.

**Estado: andamiaje, sin componentes.** El primer block previsto es `GResourceList`. Paquete privado (`0.0.0`), no se publica con la beta `0.1.0` de `@grana/vue`.

## Relación con `@grana/vue`

`@grana/vue` y `vue` son *peer dependencies* y externos en el build: este paquete no lleva copia de ninguno. La v1 de `@grana/vue` no cambia por él.

## Tipos

De momento `dist/blocks.d.ts` es mínimo (`export {}`). El contrato de tipos por `meta.json` (#443) se añadirá con el primer block.

## Comandos

```bash
npm test -w @grana/blocks
npm run build -w @grana/blocks   # dist/blocks.js (+ blocks.css cuando haya CSS)
```
