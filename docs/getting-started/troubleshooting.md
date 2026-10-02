# Solución de problemas

> **Estado:** `pre-alpha` · **Paquetes:** `aún no publicados` · **Versión actual:** `0.0.0`

Esta guía reúne los problemas más frecuentes al seguir el [Quick Start](quick-start.md).

## No encuentro `@grana/vue` o `@grana/cli` en npm

Los paquetes todavía no están publicados. La instalación con `npm install @grana/vue` es el flujo previsto para la primera publicación, no un comando disponible hoy.

Mientras tanto:

- revisa los componentes dentro del monorepo;
- usa el playground de `packages/vue/playground/`;
- no abras un issue por `404` o “package not found” hasta que se anuncie la primera versión.

## Vue muestra “Failed to resolve component: g-btn”

Grana no está registrado o el componente no fue importado localmente.

**Registro global:**

```js
import { createApp } from 'vue'
import App from './App.vue'
import Grana from '@grana/vue'

createApp(App).use(Grana).mount('#app')
```

Después usa `<g-btn>` en las plantillas.

**Registro local:**

```vue
<script setup>
import { GBtn } from '@grana/vue'
</script>

<template>
  <GBtn>Guardar</GBtn>
</template>
```

## El componente aparece, pero no tiene estilos

Importa los estilos base una vez, normalmente en `src/main.js`:

```js
import '@grana/vue/style.css'
```

Si eliges la fuente por defecto, añade también:

```js
import '@grana/vue/fonts.css'
```

La fuente es opcional. Si tu aplicación carga una fuente propia, omite esa segunda importación.

## El tema no cambia o los tokens parecen ignorados

Comprueba estas tres cosas:

1. Genera el archivo con el CLI:
   ```bash
   npx @grana/cli theme grana.config.json --out src/styles/grana.css
   ```
2. Importa el archivo generado **después** de `@grana/vue/style.css`:
   ```js
   import '@grana/vue/style.css'
   import './styles/grana.css'
   ```
3. No copies sólo colores dentro de un `:root` manual. El CLI emite todos los tokens y sus variantes claro/oscuro; copiar una parte puede romper el esquema oscuro.

Consulta [Tema y tokens](../contract/tokens.md) para la configuración completa.

## El CLI rechaza mi tema

No ignores el mensaje: el CLI detiene la generación cuando detecta una ruptura de contraste, foco o legibilidad.

Ejecuta sólo la validación para ver el reporte:

```bash
npx @grana/cli check grana.config.json
```

Corrige el token o color que indique el reporte. Si necesitas resultados para integración continua:

```bash
npx @grana/cli check grana.config.json --json
```

## Mi app aparece oscura aunque no lo pedí

Por defecto, Grana sigue la preferencia del sistema cuando el tema tiene `"dark": true`.

Fuerza una opción en el elemento que contiene tu aplicación:

```html
<html data-theme="light">
```

o:

```html
<html data-theme="dark">
```

Para desactivar la generación de oscuro, usa `"dark": false` en `grana.config.json`.

## El botón no reacciona al hacer clic mientras carga

Es intencional. Un `<g-btn loading>` se comporta como inactivo para evitar clics duplicados, pero conserva el foco para no desorientar a quien navega con teclado. Cuando termine tu operación, cambia `loading` a `false`.

## Antes de abrir un issue

Incluye:

- versión de Grana, Vue y Node;
- entorno de build;
- navegador y sistema operativo;
- componente usado;
- fragmento mínimo para reproducirlo;
- tema claro, oscuro o forzado con `data-theme`.

Esto permite reproducir el problema sin pedir una aplicación completa.
