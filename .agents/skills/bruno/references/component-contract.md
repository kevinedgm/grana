# Contrato de componente

## Archivos por componente

Para `GBtn` (tag `g-btn`):

| Archivo | Dueño | Contenido |
| --- | --- | --- |
| `packages/vue/src/components/GBtn/GBtn.vue` | bruno | Componente (`<script setup>` + `<template>`, **sin `<style>`**) |
| `packages/vue/src/components/GBtn/GBtn.css` | coco | Estilo |
| `packages/vue/src/components/GBtn/GBtn.test.js` | bruno | Pruebas |
| `packages/vue/src/components/GBtn/GBtn.meta.json` | bruno | Metadatos |
| `packages/vue/src/components/GBtn/README.md` | mora-docs | Documentación |

**¿Por qué el `.vue` no lleva `<style>`?** Porque el estilo tiene otro dueño. Separar los archivos hace que la regla "un archivo, un dueño" se pueda verificar mirando el nombre del archivo.

## Registro (bruno)

`packages/vue/src/index.js`:

```js
import GBtn from './components/GBtn/GBtn.vue'

export { GBtn }
const components = { GBtn }

export function install(app) {
  for (const [name, component] of Object.entries(components)) {
    app.component(name, component)
  }
}
export default { install }
```

`packages/vue/src/styles/components.css`:

```css
@import url("../components/GBtn/GBtn.css");
```

(`grana.css` importa este archivo dentro de la capa `grana.components`.)

## Metadatos (`GBtn.meta.json`)

```json
{
  "schemaVersion": 1,
  "name": "GBtn",
  "tag": "g-btn",
  "status": "draft",
  "since": "0.1.0",
  "description": "Botón de acción.",
  "contract": "design/contracts/btn.md",
  "prototype": "design/lab/btn/r01/",
  "props": [{ "name": "color", "type": "String", "default": "brand", "values": ["brand", "accent", "neutral", "success", "warning", "danger", "info"] }],
  "events": [{ "name": "click", "payload": "MouseEvent", "trigger": "Activación con puntero o teclado, salvo disabled o loading" }],
  "slots": [{ "name": "default", "purpose": "Etiqueta" }],
  "tokens": ["--g-color-brand", "--g-color-on-brand"],
  "states": ["default", "hover", "focus-visible", "active", "disabled", "loading"],
  "pending": []
}
```

`status`: `draft` (en construcción) → `candidate` (auditoría de coco aprobada) → `stable` (documentado por mora).

## Pruebas mínimas

- Cada prop enumerada rechaza valores fuera de su lista (el validador existe).
- Las clases de estado cambian con las props.
- `disabled` y `loading` impiden el evento principal.
- Teclado: la activación funciona con Enter y Espacio donde aplique.
- Atributos ARIA según el contrato de lima.

## Terminado significa

- Las entregas de kiwi, lima y coco existen (o están anotadas en `pending` con autorización del usuario).
- Build y pruebas en verde.
- El `.vue` no tiene literales ni `<style>`.
- Registrado en `index.js` y `components.css`.
- `meta.json` coincide con el contrato de lima.
