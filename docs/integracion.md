# Integrar Grana en una aplicación con CSS propio y sin empaquetador

Guía para una aplicación que ya tiene su CSS (Bootstrap, hojas propias, estilos inyectados por scripts) y que carga Vue desde un `<script>`. Nació de una integración real (aplicación PHP con Bootstrap, sin empaquetador, Vue por UMD). Cada afirmación dice si se **verificó** (con qué) o si es solo lectura del código. Para la instalación con empaquetador, las entradas y los tipos, ver el [README principal](../README.md#instalación) y `docs/contract/api.md` «Paquete, entradas y tipos».

## 1. Las capas de Grana y por qué tu CSS le gana

`grana.css` declara dos capas, `grana.defaults` (tokens del tema por defecto) y `grana.components` (el CSS de los componentes), en ese orden. Una regla **sin capa gana siempre** a cualquier regla con capa, sin importar la especificidad ni el orden de carga. Consecuencias:

- **Tu tema (`tokens.css` del CLI) va sin capa y gana a los defaults** (DECISIONS #4). Verificado: un `:root { --g-color-brand: … }` sin capa cambió el fondo de `<g-btn>`.
- **Tu CSS existente, si no tiene capa, también gana a los componentes.** Verificado en Chromium con `<g-btn>` y una hoja con `button { background: red; color: blue; border: 5px solid green }`: el botón salió rojo, con texto azul y borde de 5px, es decir, **sin el aspecto de Grana**. Es el caso del reinicio de Bootstrap (`ul`, `a`, `button`, `h1…`) y de reglas globales como `input:focus-visible`, que pintaba un segundo anillo dentro de `GInput`.

### Receta: poner tu CSS heredado en una capa por debajo de Grana

Declara el orden de capas **antes** de cargar `grana.css` y mete el CSS que ya tenías en una capa anterior:

```html
<style>@layer legado, grana, app;</style>

<link rel="stylesheet" href="/vendor/grana/grana.css">

<style>
  /* tu CSS existente, en su orden de siempre, dentro de la capa «legado» */
  @import url("/css/bootstrap.min.css") layer(legado);
  @import url("/css/app-existente.css") layer(legado);
</style>
```

- `legado` queda por debajo de `grana` (las capas declaradas antes pierden contra las declaradas después), así que los componentes ya no sufren el reinicio ni las reglas globales. Verificado en Chromium con la misma hoja del ejemplo anterior: el botón volvió a `rgb(31, 31, 31)` de fondo, texto blanco y borde de 1px.
- `app` es la capa para el CSS **nuevo** de tu aplicación que debe ganar a Grana sin ser un tema (`@layer app { … }`).
- Las capas `grana.defaults` y `grana.components` quedan **dentro** de `grana` (así se anidan por llevar ese prefijo); la receta se verificó con ese `grana.css` real.
- `@import` en una hoja debe ir antes que cualquier otra regla (salvo `@layer` y `@charset`), por eso van en su propio `<style>`. Si puedes procesar tu CSS (Sass, PostCSS), envuelve tu hoja con `@layer legado { … }` y evitas los `@import`.
- **Tu tema sigue sin capa** y sigue ganando a todo lo anterior (verificado con el orden de la receta): un `tokens.css` de `grana theme` o a mano no necesita estar en ninguna capa.

### Excepción: CSS que inyectan los scripts

El CSS que un script añade al `<head>` en tiempo de ejecución (SweetAlert2, selectores de fecha, editores…) **queda sin capa** y, por tanto, gana a Grana igual que antes ganaba tu CSS. Eso solo importa si esa hoja tiene selectores de elemento o muy genéricos (`button`, `input`, `h2`); los selectores con clase propia del script (`.swal2-…`) no tocan a los componentes. **No se probó con SweetAlert2 en esta guía**: si ves que su CSS alcanza a un componente de Grana, la salida es acotar esa regla (que no sea global) o repetirla en tu tema; no hay forma de meter en una capa un CSS que inyecta otro script.

## 2. Cambiar de tema en caliente

El `tokens.css` que genera el CLI usa `:root` y `[data-theme="light"]` para el claro y, para el oscuro, `@media (prefers-color-scheme: dark) { :root:where(:not([data-theme="dark"])) { … } }` (verificado leyendo la salida de `grana theme` con `dark: false`; con el oscuro derivado no se revisó el texto del selector). Los selectores de la consulta oscura usan `:where`, así que **no suman especificidad**: un segundo `tokens.css` cargado después gana al primero. Esto último es lo que indica el cambio del CLI; **no se probó el cambio en caliente en un navegador** al escribir esta guía.

## 3. Uso sin empaquetador (UMD)

Los archivos `.umd.js` existen para esto (`dist/grana.umd.js`; el paquete aún no está publicado en npm: sírvelos tú desde tu servidor). Orden de carga: **Vue, luego Grana, luego las entradas propias**.

```html
<link rel="stylesheet" href="/vendor/grana/grana.css">
<link rel="stylesheet" href="/vendor/grana/fonts.css">   <!-- opcional: Instrument Sans -->

<div id="app"><g-btn>Guardar</g-btn></div>

<script src="/vendor/vue/vue.global.prod.js"></script>
<script src="/vendor/grana/grana.umd.js"></script>      <!-- global Grana -->
<script src="/vendor/grana/status.umd.js"></script>     <!-- global GranaStatus (opcional) -->
<script>
  Vue.createApp({}).use(Grana).mount('#app')
</script>
```

| Archivo | Global | Qué trae |
| --- | --- | --- |
| `grana.umd.js` | `Grana` | Los componentes del paquete principal y `install` (`app.use(Grana)`), `createToaster`, `useToast`, `createIcons`… |
| `speech.umd.js` | `GranaSpeech` | `createSpeech`, `useSpeech`, los tres componentes de voz y `GTranscript` |
| `status.umd.js` | `GranaStatus` | `createStatus`, `useStatus`, `GStatusIsland`, `GStatusMark`, `GStatus` |
| `combobox.umd.js`, `file-field.umd.js`, `time-field.umd.js`, `slider.umd.js`, `tag.umd.js`, `load-region.umd.js` | `GranaCombobox`, `GranaFileField`, `GranaTimeField`, `GranaSlider`, `GranaTag`, `GranaLoadRegion` | Un componente (o par) por archivo; se registran con `app.use(GranaCombobox)` |
| `testing.umd.js` | `GranaTesting` | Ayudas para probar; no es para producción |

- Los globales salen de la configuración de Vite de cada entrada (`packages/vue/vite.*.config.js`). Las entradas propias dependen del global `Grana` (comparten con él las piezas comunes), por eso `grana.umd.js` va antes.
- **Plantillas dentro del HTML (sin compilar):** escribe las etiquetas con cierre explícito, `<g-btn></g-btn>`: el compilador del navegador no admite componentes autocerrados, y los nombres van en kebab-case.
- **`fonts.css` y la carpeta `fonts/` van juntos:** `fonts.css` apunta a `./fonts/*.woff2`. Se genera con `scripts/build-fonts.mjs` en `npm run build`. Si tu tema define otra fuente, omítelo.
- **No guardes un gestor en `window.status`:** es una propiedad heredada del navegador (ver el README de `GStatusIsland`).
- Verificado: `grana.umd.js` + `status.umd.js` (este construido con `vite build -c vite.status.config.js` en una carpeta temporal) funcionan juntos con `vue.global.js` en Chromium, como en la sección siguiente.

## 4. Varias aplicaciones de Vue en la misma página

Es habitual montar una app «shell» (menú, cabecera) y otra de contenido en el mismo documento.

### Ids repetidos: `app.config.idPrefix`

Los componentes generan sus ids con `useId()` de Vue, que numera **por aplicación**. Dos apps sin prefijo repiten ids y se rompen `label for`, `aria-describedby` y `aria-labelledby`. **Verificado en Chromium:** dos apps con un `<g-input>` cada una dieron dos veces `g-input-v-0`; con `app.config.idPrefix = 'shell'` en una de ellas, el id pasó a `g-input-shell-0`. Pon un prefijo distinto en cada app:

```js
const shell = Vue.createApp(Shell);      shell.config.idPrefix = 'shell'
const contenido = Vue.createApp(Vista);  contenido.config.idPrefix = 'contenido'
```

### Un solo gestor compartido por varias apps

`createStatus` y `createToaster` devuelven un gestor que también es plugin: `app.use(gestor)` solo lo **provee** (y, el de estado, registra sus componentes). Puedes instalar **el mismo gestor en cada app** y montar **una sola** `GStatusIsland` y **un solo** `GToaster`, por ejemplo en el shell:

```js
const estado = GranaStatus.createStatus({ labels })      // textos de tu aplicación
const avisos = Grana.createToaster({ labels })

shell.use(Grana).use(estado).use(avisos)                 // aquí van <g-status-island> y <g-toaster>
contenido.use(Grana).use(estado).use(avisos)             // aquí solo se usa useStatus() / useToast()
```

**Verificado en Chromium:** con una isla y un toaster en el shell, un componente de la app de contenido llamó `useStatus().set(...)` y `useToast().show(...)`; la isla (una sola en el documento, «Sesión por caducar») y el aviso aparecieron en el shell, sin ids duplicados y sin avisos en consola. `createSpeech` tiene el mismo patrón de instalación (`install` provee el gestor y registra los componentes si no existen); **no se probó en navegador** con dos apps.

Una `GStatusIsland` por gestor: una segunda del mismo gestor no pinta nada y avisa.

## Qué no cubre esta guía

- Una aplicación con Shadow DOM (las capas CSS no cruzan la frontera).
- Navegadores sin soporte de `@layer` (no se fijó una versión mínima; ver «Limitaciones» del README principal).
- El cambio de tema en caliente en un navegador (sección 2) y el CSS de SweetAlert2 u otros scripts (sección 1).
