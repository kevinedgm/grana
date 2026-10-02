# GIcon

Icono de [Lucide](https://lucide.dev) en línea: un `<svg>` de **1em** que toma el color del texto (`currentColor`), **decorativo** por defecto o **imagen con nombre** con `label`, y nunca enfocable. Dibuja los iconos que ya usan los componentes de Grana (la **lista de la librería**) y los que tu aplicación **registra** con `createIcons` importándolos de `lucide-static`. **Solo Lucide:** lo que no es Lucide (logotipos, pictogramas propios, ilustraciones) va por el slot del componente, nunca por `GIcon`.

**Etiqueta:** `<g-icon>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/icons/auditoria.md`](../../../../../design/lab/icons/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver la sección «Iconos» del playground en `packages/vue/playground/`). Exige Vue `^3.5.0`.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // install registra <g-icon> / <GIcon>
```

```vue
<span><g-icon name="lock"></g-icon> Formulario bloqueado</span>      <!-- decorativo: lo dice el texto -->
<g-icon name="lock" label="Bloqueado"></g-icon>                       <!-- imagen con nombre: no hay texto -->
<g-btn icon aria-label="Cerrar"><g-icon name="x"></g-icon></g-btn>    <!-- el nombre va en el control -->
```

También se puede importar solo el componente: `import { GIcon } from '@grana/vue'`.

> En plantillas dentro del HTML (sin compilar), escribe `<g-icon ...></g-icon>`: Vue no admite etiquetas de componente autocerradas.

### Cuándo `GIcon` y cuándo un slot

| Quieres | Usa |
| --- | --- |
| Un icono de Lucide junto a un texto, en un botón, en un campo, en un título | `<GIcon name="…">` (en el slot del componente si lo tiene: `prepend`, `lead`, `icon`…) |
| Un icono de Lucide como dato de una lista (`GTabs`, `GMenu`, `GSidebar`) | `icon: 'nombre'` en el item, **sin** slot (ver «Iconos como dato») |
| Un **logotipo**, un pictograma propio de tu aplicación, una ilustración, una imagen | El **slot** del componente con tu propio marcado. `GIcon` no los dibuja (no hay forma de pasarle otro SVG) y Grana no valida el contenido de un slot: que sea decorativo o tenga nombre es cosa tuya |

### Decorativo o con nombre

- **Sin `label` (o vacío): decorativo.** El `svg` lleva `aria-hidden="true"` y queda fuera del árbol de accesibilidad. Es lo normal: el texto de al lado ya dice lo mismo.
- **Con `label`: imagen con nombre** (`role="img"` + `aria-label`). Solo cuando el icono es **la única fuente del significado** y **no** está dentro de un control (una celda de estado «Bloqueado» sin texto). `label` no tiene valor por defecto: Grana es internacional.
- **Si hay que pulsarlo**, el nombre y el foco van en el **control**: `<g-btn icon aria-label="Desbloquear"><g-icon name="lock-open" /></g-btn>`, con el `GIcon` decorativo dentro.
- Los huecos de icono de los componentes son decorativos (`aria-hidden`): un `GIcon` con `label` dentro de uno pierde el nombre, y en desarrollo avisa.

### Iconos direccionales: `flip-rtl`

```vue
<g-btn variant="outline">Continuar<template #append><g-icon name="arrow-right" flip-rtl></g-icon></template></g-btn>
```

`flip-rtl` espeja el dibujo en horizontal **solo cuando la dirección efectiva es RTL** (la del antecesor, `:dir(rtl)`): un `dir="rtl"` en la página o en un contenedor lo activa; un `dir="ltr"` local dentro de RTL no. Es para flechas y chevrons de avance o retroceso, «ir a», «responder». **Nunca es automático:** Lucide no marca qué iconos son direccionales y espejar un `check` sería un error. El espejo usa la propiedad `scale`, así que **se compone** con un `rotate` o un `transform` que pongas en el icono (verificado: el giro se conserva y el espejo se aplica). Ten en cuenta que el espejo se aplica **antes** del giro: si giras un chevron espejado, en RTL el giro se ve invertido.

### Registrar iconos de tu aplicación: `createIcons`

La librería trae solo los iconos que usan sus componentes (ver «Lista de la librería»). Cualquier otro icono de Lucide lo registra tu aplicación, **una vez**, con las cadenas de `lucide-static`:

1. **Instala `lucide-static`** en tu aplicación (tu versión; Grana lo declara como `peerDependency` opcional con el rango verificado, `^1.49.0`):

   ```sh
   npm install lucide-static
   ```

2. **Importa** los iconos que uses (un módulo por icono: el empaquetador solo lleva los importados) y **crea el registro** en el mismo `main.js`:

   ```js
   import { createApp } from 'vue'
   import Grana, { createIcons } from '@grana/vue'
   import { LockOpen, MapPin, Image } from 'lucide-static'

   createApp(App)
     .use(Grana)
     .use(createIcons([LockOpen, MapPin, Image]))
     .mount('#app')
   ```

3. **Úsalos por su nombre canónico**, en minúsculas con guiones:

   ```vue
   <g-icon name="lock-open"></g-icon>
   <g-icon name="map-pin"></g-icon>
   ```

**El nombre no se escribe: sale de la marca** `class="lucide lucide-<nombre>"` que trae cada cadena de `lucide-static`. Así no hay erratas ni desajustes entre nombre y dibujo. Consecuencia: **el nombre es el canónico de Lucide, no el de la exportación**. `lucide-static` exporta el mismo icono con varios nombres (alias), y todos registran el canónico:

| Importas | Se registra | Nota |
| --- | --- | --- |
| `LockOpen` o `Unlock` | `lock-open` | `<g-icon name="unlock">` **no** existe |
| `CircleHelp`, `HelpCircle` o `CircleQuestionMark` | `circle-question-mark` | Es el nombre canónico (el que muestra lucide.dev) y ya viene en la librería (lo usa `GHelper`): `name="circle-question-mark"` funciona sin registrar nada. `circle-help` también funciona (alias de compatibilidad obsoleto, mismo dibujo; se retira en la siguiente versión mayor) |
| `Building2` o `BuildingComplex` | `building-complex` | |
| `Trash2` o `Trash` | `trash` | |
| `House` o `Home` | `house` | |

Si dudas, mira la clase de la cadena: `console.log(LockOpen)` muestra `class="lucide lucide-lock-open"`.

- **Repetidos:** dos entradas con el mismo nombre registran una; si sus dibujos difieren (dos versiones de Lucide), se queda la primera y avisa en desarrollo.
- **Nombres de la librería** (`lock`, `x`…): se pueden registrar sin aviso (sirve de seguro si la lista cambia en una versión mayor).
- **Un registro por aplicación:** un segundo `createIcons` en la misma aplicación **sustituye** al primero y avisa («pasa todos los iconos en una sola lista»). Para un subárbol con otro registro (pruebas, microfrontends), `provide(iconsKey, createIcons([...]))`: el más cercano gana **entero** (no se mezclan).
- **Funciona sin `install`:** si importas componentes sueltos para podar el paquete, `app.use(createIcons([...]))` basta. `install` no acepta opciones de iconos (un solo camino).

#### Validación estricta (y qué se rechaza)

Cada entrada se valida **por texto** (sin `DOMParser`: funciona en SSR) y **igual en desarrollo y en producción**. Se acepta solo si es una cadena con **un único** `<svg>` que lleva la marca de Lucide y contiene **solo** elementos de dibujo vacíos (`path`, `circle`, `rect`, `line`, `ellipse`, `polyline`, `polygon`) con atributos geométricos y `fill` `none` o `currentColor`. Los atributos del `<svg>` raíz se descartan (pone los suyos `GIcon`). **Todo lo demás se rechaza entero** (nunca se registra una versión «limpiada»): no se registra, avisa en desarrollo con el motivo, en producción se ignora en silencio, y nunca lanza un error.

| Rechazado | Por qué |
| --- | --- |
| `'lock-open'` (el nombre como texto) | No es una cadena de `lucide-static`: se importa la cadena, no se escribe el nombre |
| Un SVG escrito a mano o de otra colección | Le falta la marca de Lucide |
| Un componente u objeto (`lucide-vue-next`, un `.svg` importado como componente) | No es una cadena |
| `<script>`, atributos `on*`, `style`, `href` / `xlink:href` | Fuera de la lista: no se ejecuta nada ni entra nada al DOM |
| `<g>`, `<use>`, `<image>`, `<foreignObject>`, `<title>`, `<style>`, texto suelto | Elemento fuera de la lista |
| `fill="#f00"`, `fill="url(#a)"` | Color literal o referencia |
| Un argumento que no es arreglo | Registro vacío y aviso |

**Límite:** la marca prueba la **procedencia declarada**, no la autenticidad. Una cadena hecha a mano con `class="lucide lucide-…"` y solo elementos de dibujo pasaría. No es un riesgo de seguridad (solo entra geometría), pero sí una infracción de la regla «solo Lucide»: no lo hagas; lo que no es Lucide va por slot.

### Iconos como dato: «dato → nombre; plantilla → slot»

Los componentes cuyo contenido llega en un arreglo (`GTabs`, `GMenu`, `GSidebar`) aceptan `icon` **cadena** en cada item: sin slot `icon`, dibujan un `GIcon` con ese nombre en su hueco (decorativo). Se resuelve como un `GIcon` de tu plantilla (tu registro y luego la librería). **Con slot `icon`, manda el slot**; un `icon` que no es cadena sigue llegando solo al slot.

```vue
<g-tabs v-model="vista" :items="[{ id: 'perfil', label: 'Perfil', icon: 'user' }, { id: 'acceso', label: 'Acceso', icon: 'lock-open' }]" label="Cuenta"></g-tabs>

<g-menu v-model="abierto" :items="[{ id: 'unlock', label: 'Desbloquear', icon: 'lock-open' }, { id: 'del', label: 'Eliminar', icon: 'trash', danger: true }]" label="Acciones">
  <template #trigger="{ attrs }"><g-btn v-bind="attrs" variant="outline">Acciones</g-btn></template>
</g-menu>

<g-sidebar v-model="actual" :items="[{ id: 'inicio', label: 'Inicio', href: '/', icon: 'house' }, { id: 'acceso', label: 'Acceso', href: '/acceso', icon: 'lock-open' }]" label="Principal" :labels="textos"></g-sidebar>
```

Los componentes que se escriben en plantilla (`GBtn`, `GInput`, `GSelect`, `GSwitch`, `GBadge`, `GCard`, `GDialog`, `GFormSection`…) **no** tienen props de icono: llevan un slot y tú pones el `GIcon`. En `GBtn`, `icon` es **Boolean** (botón solo icono).

```vue
<g-btn><template #prepend><g-icon name="plus"></g-icon></template>Nuevo</g-btn>
<g-input label="Correo"><template #prepend><g-icon name="mail"></g-icon></template></g-input>

<g-form-section title="Acceso y seguridad" description="Quién puede editar este registro.">
  <template #lead><g-icon name="lock-open"></g-icon></template>   <!-- icono antes del título; sin icono por defecto -->
  …
</g-form-section>
```

El slot `lead` de `GFormSection` es decorativo y queda **fuera** del `hN` (el encabezado se llama solo por su título). Sin el slot no existe el hueco ni queda aire.

### Sin empaquetador (UMD o CDN)

`createIcons` necesita las **cadenas** de `lucide-static`, y sin empaquetador no hay `import { LockOpen } from 'lucide-static'`. Dos salidas, las dos verificadas en este repositorio:

- **Módulo ES del icono** (`<script type="module">`): `import LockOpen from '…/node_modules/lucide-static/dist/esm/icons/lock-open.mjs'` y luego `app.use(Grana).use(Grana.createIcons([LockOpen]))` (así lo hace la migración del modal de Bootstrap, `design/lab/migraciones/analisis/`).
- **Un archivo propio con las cadenas completas** cargado con `<script>` (así lo hace el playground: `scripts/build-icons.mjs` genera `playground/lucide-icons.js` con `window.LUCIDE_STATIC = { LockOpen: '<svg class="lucide lucide-lock-open" …>…</svg>', … }` y la página llama a `Grana.createIcons(Object.values(window.LUCIDE_STATIC))`). Las cadenas deben ser las **completas**, con su marca: unos trazos copiados a mano se rechazan.

No hay CLI (`grana icons add`) ni importación desde una CDN de `lucide-static` documentada todavía.

## Props

| Prop | Tipo | Valores | Por defecto | Nota |
| --- | --- | --- | --- | --- |
| `name` | String | Nombre canónico de Lucide (`lock-open`, `map-pin`) | **obligatorio** | Un nombre que no se encuentra **no dibuja nada** y avisa en desarrollo con cómo registrarlo |
| `label` | String | texto de la aplicación | sin valor | Sin valor o vacío: decorativo. Con valor: `role="img"` + `aria-label` |
| `filled` | Boolean | | `false` | Rellena con `currentColor` (figuras de estado, puntos) |
| `flipRtl` (`flip-rtl`) | Boolean | | `false` | Espejo horizontal solo con dirección efectiva RTL |

**No hay** `size`, `color`, `strokeWidth`, `spin` ni `title` (ver «Tamaño y color»). Los atributos `class`, `id`, `data-*` y `style` pasan al `<svg>`; los que fija `GIcon` (`viewBox`, `fill`, `stroke*`, `focusable`, `aria-hidden`) no se pueden cambiar desde fuera, y `role`, `aria-*` y `tabindex` se ignoran y avisan en desarrollo (el nombre va en `label`, el foco en el control).

## Exportaciones

| Exportación | Qué es |
| --- | --- |
| `GIcon` | El componente |
| `createIcons(icons)` | Registro de iconos de la aplicación a partir de un arreglo de cadenas de `lucide-static`. Devuelve un **plugin de Vue** (`app.use`). Su forma interna no es API. No toca `document` ni `window`, no hace `fetch` y no guarda nada en el módulo |
| `iconsKey` | Clave de inyección para `provide` manual (pruebas, microfrontends, un subárbol con otro registro) |

## Orden de búsqueda de un nombre

| Quién pide el icono | Orden |
| --- | --- |
| **Tu aplicación:** un `GIcon` en tu plantilla, o el `icon` cadena de un item de `GTabs`, `GMenu` o `GSidebar` | (1) el registro **más cercano** → (2) la lista de la librería → (3) nada y aviso en desarrollo |
| **Un componente de Grana:** sus iconos propios (la `x` de `GDialog`, el `check` de `GCheckbox`…) | **Solo** la lista de la librería: tu registro nunca se consulta, así no puedes cambiar por accidente un icono de un componente |

## Tamaño y color

- **Color:** siempre `currentColor`: lo hereda del texto o del control que lo contiene (también en `forced-colors`). Para cambiarlo, cambia el `color` del contenedor (o del propio icono con una clase).
- **Tamaño:** **1em** del texto que lo rodea (16px junto a un texto de 16px). Fuera de un hueco, cámbialo con **tu propia clase**: gana sin `!important` (verificado: 48px).

  ```css
  .icono-grande { inline-size: 3rem; block-size: 3rem; }
  ```

- **Dentro de un hueco de un componente, el tamaño lo pone el hueco** (medido con el tema por defecto: `GTabs` 1,15em de la pestaña, 16px a 14px; `GMenu` el tamaño de su marca, ≈ 18px; `GSidebar` 20px en expandido, riel y navbar; `lead` de `GFormSection` = tamaño del título, 16px; `GBtn` 1,15em de su texto en `prepend` y `append`, 16,1px en `md`, y 1,4em en el solo icono, 19,6px en `md`). `GInput` no lo fija: ahí el icono mide 1em de su texto (16px).
- **No pongas clases de tamaño a un icono dentro de un hueco.** **Tu clase gana siempre, también dentro de un hueco, y gana por capa, no por especificidad:** el CSS de Grana va en la capa `grana.components` y el tuyo sin capa, así que ninguna regla de un hueco puede ganarle (medido: 48px en el slot `icon` de `GTabs`, que desborda su caja de 16px, y en el `prepend` de `GBtn`). El tamaño del hueco ya sigue al del componente (su `size`, su texto, su densidad): si necesitas otro, **cambia el contenedor** (`size`, `density`, el tema) y no el icono.
- **Grosor:** el de Lucide (2 en una caja de 24). **Sin giro propio:** los componentes que lo necesitan (carga) ya lo resuelven.

## Lista de la librería

Los iconos que trae `@grana/vue` sin registrar nada son **API pública**: la lista puede crecer (cambio menor) y **quitar uno es un cambio mayor**. Son los que usan los componentes: `loader-circle`, `check`, `minus`, `circle-alert`, `triangle-alert`, `circle-check`, `chevron-down`, `chevron-left`, `chevron-right`, `chevrons-up-down`, `x`, `plus`, `calendar`, `circle`, `square`, `diamond`, `triangle`, `arrow-up`, `arrow-down`, `ellipsis-vertical`, `grip-vertical`, `move-diagonal-2`, `lock`, `circle-question-mark` e `info`. `circle-help` sigue funcionando como **alias obsoleto** de `circle-question-mark` (mismo dibujo, sin aviso); se retira en la siguiente versión mayor, así que usa el canónico. La tabla completa (qué componente usa cada uno) está en [`docs/contract/icons.md` §4](../../../../../docs/contract/icons.md). Un icono que pide una aplicación **no** entra en la lista: lo registra ella (así el paquete no crece con cada aplicación).

## Accesibilidad

Medido con los componentes reales en Chromium, Firefox y WebKit ([`design/lab/icons/auditoria.md`](../../../../../design/lab/icons/auditoria.md), 3558 comprobaciones):

- **Árbol de accesibilidad:** en la sección «Iconos» del playground hay **un solo** `img` (el de `label="Bloqueado"`); el decorativo no aparece («Formulario bloqueado» se lee solo por el texto); el botón solo icono se llama por su `aria-label`; el encabezado con `lead` se llama solo por su título; pestañas, enlaces del sidebar y elementos del menú con icono por nombre se llaman por su texto.
- **Nunca enfocable:** `focusable="false"` y sin `tabindex` en todos los `svg`.
- **Sin `<title>`:** el tooltip nativo es inconsistente y el nombre va en `aria-label`. Un tooltip, cuando exista el componente, irá en el control.
- **Contraste** (decorativo, informativo): el `lead` de `GFormSection` (`text-muted`) ≥ 7,38:1 en claro y ≥ 8,59:1 en oscuro con el tema por defecto, el «Tema de prueba» y diez temas generados (incluida una marca pálida); los iconos por nombre de `GTabs` ≥ 4,96:1 y de `GSidebar` ≥ 6,87:1. Un icono con `label` que sea la única fuente del significado debe llegar a 3:1 con su fondo: eso depende del color que le des.
- **`forced-colors`:** el trazo sigue a `currentColor` (`CanvasText`): 21:1 (emulado en Chromium).
- **RTL:** `flip-rtl` solo con dirección efectiva RTL; el `lead` queda al inicio del título (a la derecha) y alineado con su primera línea.
- **320px:** sin desplazamiento horizontal.

## SSR

Registro **por aplicación** con `provide`/`inject`, sin estado en el módulo: dos aplicaciones en la misma página o dos peticiones simultáneas en un servidor no comparten iconos (lo prueba `GIcon.ssr.test.js` con `renderToString`). La validación es por texto y el `svg` se renderiza igual en el servidor que en el cliente. El aviso de «`label` dentro de un hueco `aria-hidden`» solo corre al montar en el cliente.

## Tamaño del paquete

- `GIcon` público, el registro y la validación suman **+2,3 KB gzip** a `dist/grana.js` (122 441 → 124 765 B, medido con `npm run build`).
- Cada icono que registras cuesta lo que importas de `lucide-static`: ≈ 373 B gzip uno, ≈ 583 B gzip cuatro (medido con Vite; las cadenas traen espacios y el aviso de licencia). Registrar toda Lucide no tiene sentido: importa solo los que uses.
- La licencia ISC de Lucide viaja en tu bundle con el aviso `@license` de cada cadena.

## Clases

`g-icon`, `g-icon--filled` y `g-icon--flip-rtl` (las emite el componente y las estiliza `GIcon.css`). No hay clase por nombre de icono. La regla base va en `:where(.g-icon)` (especificidad 0) dentro de la capa `grana.components`.

## Tema

Sin tokens propios: `GIcon` solo hereda `color` y `font-size`. El tamaño en un componente lo deciden los tokens de ese componente.

## Limitaciones conocidas

- **Sin verificar con lector de pantalla real** (VoiceOver, NVDA, TalkBack) el `role="img"` en `svg` ni el encabezado con `lead`: solo el árbol de accesibilidad de Playwright. `forced-colors` solo emulado en Chromium.
- **Empaquetadores:** la poda de `lucide-static` (solo se lleva lo importado) está verificada con **Vite**; no con webpack, Rollup puro ni esbuild.
- **Sin empaquetador** no hay un camino de una línea: hay que importar el módulo ES de cada icono o generar un archivo con las cadenas (ver «Sin empaquetador»).
- **Formato de la marca:** verificado con `lucide-static` 1.49.0 (las 2117 exportaciones); una prueba falla si Lucide cambia el formato.
- **Alias:** el nombre es el canónico de la marca, no el de la exportación (`Trash2` → `trash`; `import { CircleHelp }` registra `circle-question-mark`). La librería trae un solo alias, `circle-help` (obsoleto, mismo dibujo que `circle-question-mark`, se retira en la siguiente mayor).
- **Sin tipos de TypeScript** para los nombres (sin autocompletado).
- **Sin tooltip** para un icono solo; el nombre accesible sí está (en el control o en `label`).

## Fuentes

- API: [`GIcon.meta.json`](./GIcon.meta.json) · Contrato: [`docs/contract/icons.md`](../../../../../docs/contract/icons.md) (v0.2, DECISIONS #197 a #203) · Prototipo: [`design/lab/icons/r01/`](../../../../../design/lab/icons/r01/) · Estilo: [`design/lab/icons/estilo.md`](../../../../../design/lab/icons/estilo.md) · Auditoría: [`design/lab/icons/auditoria.md`](../../../../../design/lab/icons/auditoria.md)
