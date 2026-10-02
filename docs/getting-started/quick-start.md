# Quick Start con Vue 3 y Vite

Esta guía crea una aplicación Vue 3 con Vite, instala Grana, aplica un tema mínimo y muestra un primer botón.

> **Estado:** `pre-alpha` · **Paquetes:** `aún no publicados` · **Versión actual:** `0.0.0`
>
> Este es el flujo oficial de consumo para la primera publicación. Mientras tanto, los componentes se exploran desde el [playground del monorepo](../../packages/vue/playground/).

## Antes de empezar

Necesitas:

- Node.js 20 o superior;
- npm;
- conocimientos básicos de Vue 3.

## 1. Crea una aplicación Vue con Vite

```bash
npm create vite@latest mi-app-grana -- --template vue
cd mi-app-grana
npm install
```

## 2. Instala Grana

Cuando los paquetes estén publicados:

```bash
npm install @grana/vue
npm install -D @grana/cli
```

Grana usa Vue 3 como peer dependency. El template de Vite ya lo instala.

## 3. Crea el tema del producto

En la raíz de tu aplicación, crea `grana.config.json`:

```json
{
  "brand": "#7A1F5C",
  "accent": "#0F766E",
  "radius": 12,
  "space": 4,
  "font": "Inter",
  "dark": true
}
```

Genera los tokens en una ruta que tu aplicación pueda importar:

```bash
npx @grana/cli theme grana.config.json --out src/styles/grana.css
```

El CLI genera `tokens.css` y detiene el comando si el tema no cumple los mínimos de contraste, foco o legibilidad.

## 4. Registra Grana

Reemplaza el contenido de `src/main.js`:

```js
import { createApp } from 'vue'
import App from './App.vue'
import Grana from '@grana/vue'

import '@grana/vue/style.css'
import '@grana/vue/fonts.css'
import './styles/grana.css'

createApp(App).use(Grana).mount('#app')
```

`style.css` incorpora los estilos base de los componentes. `fonts.css` es opcional: omítelo si defines y cargas una fuente propia.

## 5. Usa tu primer componente

Reemplaza el contenido de `src/App.vue`:

```vue
<script setup>
import { ref } from 'vue'

const saved = ref(false)

function save() {
  saved.value = true
}
</script>

<template>
  <main class="page">
    <p class="eyebrow">Mi aplicación con Grana</p>
    <h1>La interfaz conserva tu identidad.</h1>
    <p>El botón usa los tokens del tema, pero su comportamiento y foco vienen de Grana.</p>

    <g-btn @click="save">
      {{ saved ? 'Guardado' : 'Guardar cambios' }}
    </g-btn>
  </main>
</template>

<style>
.page {
  max-width: 42rem;
  margin: 0 auto;
  padding: 4rem 1.5rem;
}

.eyebrow {
  color: var(--g-color-brand-text);
}
</style>
```

## 6. Inicia el servidor

```bash
npm run dev
```

Abre la dirección que indique Vite. Al pulsar el botón, su etiqueta cambia a “Guardado”.

## Qué acaba de ocurrir

1. Vite creó y sirve tu aplicación Vue.
2. Grana registró sus componentes globalmente mediante `.use(Grana)`.
3. El CLI transformó tu configuración corta en tokens CSS.
4. `<g-btn>` tomó color, radio, espaciado y tipografía del tema, sin que tu aplicación tuviera que sobrescribir el CSS del componente.

## Alternativa: registro local

Si prefieres registrar sólo los componentes que utilizas, no instales el plugin global:

```vue
<script setup>
import { GBtn } from '@grana/vue'
</script>

<template>
  <GBtn>Guardar cambios</GBtn>
</template>
```

Mantén las importaciones de CSS en `main.js`.

## Siguiente paso

- Consulta [Tema y tokens](../contract/tokens.md) para personalizar la identidad.
- Consulta la página de cada componente para sus props, estados y accesibilidad.
- Cuando los paquetes se publiquen, esta guía se validará en CI con una aplicación Vite mínima.
