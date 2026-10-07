# @grana/vue

Componentes **Vue 3** con tema por tokens. Los componentes traen la **estructura**; tu tema les da el **color**.

> *The only bug you'll want in your UI.*

**Estado: `0.1.0-beta`.** La API puede cambiar entre betas y falta la verificación en entorno real (lectores de pantalla, Safari real, móvil real). Todos los componentes están en `candidate`: con contrato, CSS, pruebas y auditoría en Chromium, Firefox y WebKit. Documentación completa, catálogo de componentes, tematización y contribución: [README del repositorio](https://github.com/kevinedgm/grana#readme).

## Instalación

```bash
npm i @grana/vue
```

Requiere **Vue `^3.5.0`**. `lucide-static` (`^1.49.0`) es dependencia par opcional: solo hace falta si registras iconos propios con `createIcons`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'     // componentes y tema por defecto (obligatorio)
import '@grana/vue/fonts.css'     // Instrument Sans (opcional)

createApp(App).use(Grana).mount('#app')
```

```vue
<template>
  <g-btn variant="soft">Guardar</g-btn>
</template>
```

También por componente: `import { GBtn } from '@grana/vue'`. En plantillas dentro del HTML sin compilar, escribe las etiquetas con cierre explícito (`<g-btn></g-btn>`).

## Entradas del paquete

| Entrada | Contenido |
| --- | --- |
| `@grana/vue` | Los componentes principales, `createToaster`, `useToast`, `createIcons`, `useFormField` |
| `@grana/vue/style.css` | La hoja de CSS única (todos los componentes, las entradas propias y el tema por defecto) |
| `@grana/vue/fonts.css` | Fuente por defecto (opcional) |
| `@grana/vue/speech` | Captura de voz: `createSpeech`, `GSpeechHost`, `GTranscript`… |
| `@grana/vue/status` | Isla de estado: `createStatus`, `GStatusIsland`… |
| `@grana/vue/combobox` | `GCombobox` |
| `@grana/vue/file-field` | `GFileField` |
| `@grana/vue/time-field` | `GTimeField` |
| `@grana/vue/testing` | Adaptadores simulados para probar tu aplicación (voz y subida de archivos); no para producción |

Las cinco entradas propias no viajan en el paquete principal: solo las paga quien las importa. Se registran con `app.use`:

```js
import Combobox from '@grana/vue/combobox'
createApp(App).use(Grana).use(Combobox)
```

Para generar tu tema (y rechazar los que rompan los mínimos de accesibilidad) usa [`@grana/cli`](https://github.com/kevinedgm/grana/blob/main/packages/cli/README.md).

## Licencia

MIT. Iconos de Lucide (ISC), ver `THIRD-PARTY-NOTICES.md`. Fuente por defecto: Instrument Sans (SIL OFL).
