# Isla de estado (`createStatus`, `GStatusIsland`, `GStatusMark`, `GStatus`)

Una **región única y persistente** de la aplicación que reúne **lo que está pasando y dura**: condiciones de página (sin conexión, sesión por caducar, mantenimiento, solo lectura), fallos del servidor al guardar o al cargar y resultados que deben quedarse (un éxito con enlace a lo creado). Vive en el **borde superior del visor, fuera del flujo: nunca empuja ni mueve el contenido**, nunca toma el foco y, cuando la persona la reconoce, se repliega a un **punto** que sigue ahí mientras dure alguna condición. Cubre lo que `GToast` deja fuera a propósito: la información persistente de página.

Es un **servicio con clave**: tu aplicación crea un gestor (`createStatus`), lo instala como plugin, declara condiciones con `set(id, …)` (o con `<GStatus>` desde una vista) y monta **una** `<GStatusIsland />`. Una condición es **estado, no suceso**: declararla otra vez con el mismo `id` la sustituye **en el mismo elemento**; dura hasta que la aplicación la quita. Junto al origen (el botón «Guardar», el hueco de las filas) puede ir una `GStatusMark`, la cápsula que abre la isla en su aviso.

**Etiquetas:** `<g-status-island>` (región) · `<g-status-mark>` (marca junto al origen o línea de texto) · `<g-status>` (condición declarativa, sin pintura) · **Entrada:** `@grana/vue/status` (no viaja en `@grana/vue`) · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/alert/auditoria.md`](../../../../../design/lab/alert/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (playground en `packages/vue/playground/`, sección «Isla de estado»). Exige Vue `^3.5.0`; la región usa la API `popover`.

## Qué es y qué no es

La isla no sustituye a ningún otro componente de avisos: reparte el trabajo con ellos. **A la isla va lo que pasa; la advertencia que es contenido de una sección se queda en su sección como marca de texto.**

| Necesidad | Usa |
| --- | --- |
| Confirmar algo breve que acaba de pasar y puede perderse («Cambios guardados») | [`GToast`](../GToast/README.md) |
| Validación de un `GForm`, incluidos los 422 y los errores generales de `errors` | `GErrorSummary` + mensaje del campo ([`GForm`](../GForm/README.md)) |
| Error o ayuda de **un** campo | El mensaje del campo (`GInput`…) |
| Decisión obligatoria antes de seguir | `GDialog role="alertdialog"` |
| Estado breve del envío junto a los botones («Guardado hace 2 min») | `status` de `GFormActions` |
| Estado de una tarjeta que no cargó | `status` + `retryable` de `GCard` |
| **El servidor falló** (500, tiempo agotado, sin red) y no se arregla en un campo | **Isla** + marca enlace junto al origen |
| **Condición de página que dura** (mantenimiento, solo lectura, sesión por caducar, sin conexión) | **Isla** |
| **Resultado que debe quedarse** (éxito con enlace a lo creado) | **Isla** (se va al reconocerlo) |
| Advertencia o información que es **contenido** de una sección, tarjeta o diálogo | **Marca de texto** (`GStatusMark` sin `for`); no entra en la isla |

Dos reglas de uso que salen de la tabla:

- **Un suceso, un canal.** O aviso flotante o isla; o resumen de validación o isla. Nunca el mismo suceso en dos sitios. **Grana no lo detecta**: es regla de uso.
- **La validación nunca va a la isla.** Tampoco los errores generales que pones en `errors`.

## Por qué una isla y no una caja

La primera propuesta fue la caja de aviso de siempre (icono, título, cuerpo, botón, marca lateral). **El usuario la rechazó por genérica** y esa decisión de identidad es la razón de ser del componente: Grana no quiere un aviso en línea más con una animación encima. La isla es otra cosa, y lo que la hace distinta es medible (D1 a D5, #316):

- **D1 · Nada se mueve, nunca.** Ningún aviso cambia la posición de nada en la página: cinco elementos de referencia y el botón con foco no se desplazan ni un píxel al aparecer, abrirse o resolverse (Δ 0). Los avisos en línea de otros sistemas empujan el contenido.
- **D2 · Un solo sitio con memoria.** Reconocer no borra: la isla queda en un punto mientras dure la condición y conserva su nombre accesible. La persona sabe siempre dónde mirar y qué sigue pendiente.
- **D3 · Se abre sola sin estorbar.** Lo grave abre la isla sin tomar el foco y **solo si no tapa lo que se está usando**; si lo taparía, da un toque.
- **D4 · Continuidad de forma.** Punto, compacta y abierta son **una sola superficie** que cambia de tamaño; error, reintentando y éxito ocurren en **el mismo elemento**.
- **D5 · Ida y vuelta con el origen.** La marca abre la isla en su aviso; «Ir a…» repliega y enfoca el origen; `Alt+F8` va y vuelve.

## Instalación

```js
// main.js de la aplicación
import { createApp } from 'vue'
import Grana from '@grana/vue'
import { createStatus } from '@grana/vue/status'
import '@grana/vue/style.css'                       // el CSS de la isla va en la hoja de siempre

export const status = createStatus({
  labels: {
    region: 'Estado de la aplicación ({hotkey})',
    summary: (n) => (n === 1 ? 'Estado: 1 aviso.' : 'Estado: ' + n + ' avisos.'),
    more: 'y {count} más',
    types: { info: 'Información', success: 'Correcto', warning: 'Advertencia', error: 'Error' },
    acknowledge: 'Entendido',
    dismiss: 'Descartar: {title}',
    details: 'Detalle técnico', copy: 'Copiar', copied: 'Detalle copiado',
    remaining: 'Quedan {time}',
    sheetTitle: 'Estado de la aplicación', close: 'Cerrar'
  }
})

createApp(App).use(Grana).use(status).mount('#app')
```

```vue
<!-- App.vue: una sola isla, lo más alto posible y DESPUÉS de GToaster y GSpeechHost -->
<template>
  <RouterView />
  <GToaster />
  <GSpeechHost />
  <GStatusIsland />
</template>
```

```js
// en cualquier componente
import { useStatus } from '@grana/vue/status'
const status = useStatus()
```

- **`app.use(status)`** provee el gestor (`useStatus()` lo inyecta) y **registra** `GStatusIsland`, `GStatusMark` y `GStatus`, sin pisar uno ya registrado. Sin gestor provisto, o llamado fuera de `setup`, `useStatus()` devuelve `undefined` con un aviso en desarrollo. `statusKey` sirve para un `provide` manual (pruebas, microfrontends); cada componente acepta `:status="otro"`.
- **Una `GStatusIsland` por gestor.** Una segunda del mismo gestor no pinta nada y avisa.
- **Móntala después de `GToaster` y `GSpeechHost`.** En la capa superior manda el último `showPopover()`: montada después, la isla queda por encima.
- **Entrada propia, como la captura de voz (#328, que corrige #317).** Con gestor y tres componentes dentro del paquete principal, `dist/grana.js` pasaba de 154 745 a 169 451 bytes gzip (**+14,7 KB**) frente a un tope de 8 KB; la isla es un servicio que no todas las aplicaciones usan y quien no la usa no la paga. `dist/status.js` pesa **15 828 bytes gzip (15,8 KB)**, `dist/status.umd.js` **13 740 bytes**; `dist/grana.js` queda en 155 025 (+280 B por el registro de reservas de borde y la regla de `GForm` de #326). La entrada toma de `@grana/vue` lo compartido (`GBtn`, `GDialog`, el `GIcon` interno, el traslado al modal, los canales vivos y las reservas de borde) **sin copiarlo**: hay un solo registro de reservas de borde con `GToaster` y la voz. `createStatus` no está en `dist/grana.js`.
- **Sin empaquetador:** carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/status.umd.js` (global `GranaStatus`): `GranaStatus.createStatus(…)`. **No guardes el gestor en `window.status`:** es una propiedad heredada del navegador y siempre vale texto (el playground usa `window.gStatus`). En plantillas dentro del HTML, cierra las etiquetas: `<g-status-island></g-status-island>`.
- **Los textos no tienen valor por defecto** (Grana es internacional): todo va en `labels` (ver «Textos»).
- El gestor **no usa `fetch` ni toca `document`/`window` al importarse ni al crearse** (ver «SSR»). «Reintentar» llama a una función de tu aplicación.

## Uso

Los ejemplos son los casos del playground.

### Condiciones de página

```js
// Mantenimiento: informativo y descartable (quita solo esta condición)
status.info('maint', 'Mantenimiento programado esta noche', {
  description: 'De 23:00 a 23:30 no se podrá guardar.', dismissible: true
})

// Solo lectura, con enlace (un <a> nativo; la aplicación con router hace preventDefault y navega)
status.warning('readonly', 'Modo de solo lectura', {
  description: 'Otra persona está editando este expediente.',
  link: { label: 'Ver quién edita', href: '/expedientes/12/editores', onClick: (e) => { e.preventDefault(); router.push('/expedientes/12/editores') } }
})

// Sin conexión: se resuelve en el mismo elemento cuando vuelve
status.warning('offline', 'Sin conexión', { description: 'Los cambios se guardarán al volver.' })
window.addEventListener('online', () => status.resolve('offline', 'Conexión restablecida'))
```

### Sesión por caducar (`deadline` y `onExpire`)

```js
status.warning('session', 'La sesión está por caducar', {
  description: 'Guarda tu trabajo o sigue conectado.',
  deadline: Date.now() + 5 * 60 * 1000,
  action: { label: 'Seguir conectado', onClick: () => status.resolve('session', 'Sesión renovada') },
  onExpire: () => cerrarSesion()
})
```

La cuenta atrás se ve en el resumen y en el aviso (`m:ss`, `h:mm:ss` desde una hora) en un `role="timer"` con `aria-live="off"`: **no es una región viva** y solo se anuncia en los umbrales de 5 min, 1 min y 30 s. Al llegar a cero se llama a `onExpire`; **la condición no se quita sola**. Un solo intervalo de 1 s para todas, solo en el cliente y con la isla montada.

### Error del servidor al guardar: «Reintentar» que se resuelve en el sitio

```js
async function guardar() {
  try {
    const factura = await api.guardar(datos)
    status.success('save', 'Factura guardada con el folio ' + factura.folio, { link: { label: 'Ver factura', href: factura.url } })
  } catch {
    // ya hay un error visible: un segundo fallo idéntico no cambia tipo ni título, así que se reanuncia
    if (status.has('save') && status.get('save').type === 'error') return status.announce('save')
    status.error('save', 'No se pudo guardar la factura', {
      description: 'El servidor no respondió; tus datos siguen en el formulario.',
      details: 'POST /api/facturas · 500 Internal Server Error · req-2c41d7',     // Disclosure «Detalle técnico» con «Copiar»
      action: {
        label: 'Reintentar', busyLabel: 'Reintentando…',
        // devolver una PROMESA es lo que activa el estado «reintentando»
        onClick: () => api.guardar(datos).then((f) => ({
          type: 'success', title: 'Factura guardada con el folio ' + f.folio,
          description: '', action: undefined, origin: undefined, persistent: false,
          link: { label: 'Ver factura', href: f.url }
        }))
      },
      origin: { label: 'Ir al formulario', target: 'factura-form' }
    })
  }
}
```

Qué pasa, todo en **el mismo `li`** (la identidad del nodo está medida):

1. La persona pulsa «Reintentar»: se llama a `onClick(copia)`. Como devuelve una **promesa**, la condición pasa a `busy`: `aria-busy="true"`, la insignia cambia a `loader-circle` y gira (también la del resumen y la de la marca), el botón sigue **enfocable** con `aria-disabled="true"` y muestra `busyLabel`, que se anuncia por el canal cortés. Otra pulsación no hace nada.
2. **Se cumple con un objeto:** `update(id, objeto)`: el desenlace que decida tu aplicación (éxito, u otro error). Lo que ya no aplique (`action`, `origin`) se quita poniéndolo en `undefined`. **Se cumple con otra cosa:** solo termina `busy` (tu aplicación ya llamó a `resolve`, `remove` o `update`).
3. **Se rechaza:** termina `busy`, la condición queda como estaba y **se vuelve a anunciar** (el reintento falló otra vez). El gestor **consume** el rechazo (la promesa es suya).
4. Si la condición se retira con la promesa pendiente, el desenlace **no la vuelve a crear**.

No hay `type: 'loading'` ni `status.promise`: esa transición es de `GToast.promise`; aquí error, reintentando y éxito los da `action` al devolver una promesa.

### Fallo de carga de una tabla: `<GStatus>` y una marca en el slot `empty`

```vue
<GStatus v-if="loadFailed" id="invoices" type="error" title="No se pudieron cargar las facturas"
         description="El servidor tardó demasiado en responder." details="GET /api/facturas · 504 Gateway Timeout"
         :action="{ label: 'Reintentar', busyLabel: 'Cargando…', onClick: reload }"
         :origin="{ label: 'Ir a Facturas', target: 'invoices-region' }" @remove="loadFailed = false" />

<div id="invoices-region" role="region" aria-label="Facturas">
  <GTable :columns="columns" :rows="rows" caption="Facturas">
    <template #empty>
      <GStatusMark for="invoices">No se pudieron cargar</GStatusMark>
      <span v-if="!loadFailed">Sin facturas todavía.</span>
    </template>
  </GTable>
</div>
```

`GTable` **no tiene estado de error propio** (#327): hoy el fallo de carga es una condición `error` de la isla y una marca con `for` en el slot `empty`. Nombres reservados para una ronda de `GTable`: prop `error` y slot `error`. Mientras tanto, la tabla vacía anuncia «0 resultados» junto al error de la isla (límite conocido). El `<GStatus>` **limpia al desmontarse**: el fallo de una vista no sobrevive a la vista.

### Resultado que debe quedarse

```js
status.success('created', 'Factura F-0043 creada', { link: { label: 'Ver factura', href: '/facturas/F-0043' } })
```

Un resultado (`persistent: false`, el valor por defecto de `success`) **se retira al reconocerlo**; una condición se queda como punto.

### Advertencia de una sección: marca de texto

```vue
<GStatusMark type="warning">
  Tu tarjeta caduca este mes.
  <template #action><GBtn size="sm" variant="outline" color="neutral">Actualizar</GBtn></template>
</GStatusMark>
```

No entra en la isla, no anuncia, no se cierra: es contenido de la sección. Va igual dentro de un diálogo.

## El gestor (`createStatus(options)`)

### Opciones (`createStatus(options)` y `configure(patch)`)

| Opción | Tipo | Valores | Por defecto | Regla |
| --- | --- | --- | --- | --- |
| `position` | String | `top-center` `top-start` `top-end` | `top-center` | Lógica (`start`/`end` siguen el `dir`). **Siempre arriba**, también en móvil |
| `offset` | Object | `{ top? }`: Number (px) o longitud CSS | `{}` | Reserva para una cabecera fija; se suma al margen, a `safe-area` y a la reserva del borde |
| `hotkey` | String \| `false` | sintaxis de `aria-keyshortcuts` | `'Alt+F8'` | Va a la isla y vuelve; `false` lo quita (se llega con Tab y con la marca). `F6` o un valor ilegible se rechaza y se conserva el anterior; `F8` y `Shift+F8` se aceptan con aviso (son los de `GToaster` y la voz) |
| `autoOpen` | Boolean | | `true` | Un `error` nuevo abre la isla sola, con los límites de «Apertura automática». `false`: nunca se abre sola (da el toque) |
| `labels` | Object | ver «Textos» | `{}` | **Sin valores por defecto** |

`configure(patch)` fusiona (`labels` y `offset` por clave), aplica en vivo y no reanuncia. Un valor fuera de lista avisa en desarrollo y conserva el anterior. **No existen** `limit` (no hay máximo: el panel desplaza), `position` abajo ni cierre automático (lo transitorio es de `GToast`).

### Métodos

| Método | Firma | Devuelve | Hace |
| --- | --- | --- | --- |
| `set` | `set(id, options)` | `id` o `null` | **Declara** la condición. `id` nuevo: la crea. `id` existente: **sustituye** su declaración en el mismo elemento (conserva `acknowledged` salvo que cambie `type`) |
| `info` · `success` · `warning` · `error` | `(id, title, options?)` | `id` | Atajos de `set(id, { ...options, type, title })` |
| `update` | `update(id, patch)` | `true` si existía | Fusiona `patch` en el sitio |
| `resolve` | `resolve(id, result?)` | `true` si existía | Con `result` (String = título, u Object): pasa **en el mismo elemento** a `type: 'success'`, `persistent: false`, sin `action`, sin `busy`, sin `deadline`, más lo que traiga `result` (p. ej. `link`). Sin `result`: la retira |
| `remove` | `remove(id)` | `true` si existía | La retira (motivo `api`) |
| `clear` | `clear()` | | Retira todas (motivo `clear`) |
| `announce` | `announce(id)` | `true` si existía | **Vuelve a anunciar** la condición tal como está y le quita el reconocimiento (un segundo fallo idéntico no cambia `type` ni `title`). Si es `error`, aplica «Apertura automática» |
| `acknowledge` | `acknowledge()` | | Reconoce **todas** las actuales (lo mismo que «Entendido») |
| `open` | `open(id?, { focus = false }?)` | `true` si hay condiciones | Abre la isla (en móvil, la hoja); con `id`, desplaza a esa condición. **No mueve el foco** salvo `focus: true` (solo para gestos de la persona; la marca lo usa) |
| `close` | `close()` | | Repliega (no mueve el foco si estaba fuera) |
| `has` · `get` | `(id)` | Boolean · copia o `undefined` | Lectura |
| `configure` | `configure(patch)` | | Ver arriba |
| `conditions` | propiedad reactiva de solo lectura | `Condition[]` | En el **orden de la isla** |
| `state` | propiedad reactiva de solo lectura | `{ form: 'empty' \| 'dot' \| 'compact' \| 'open', count: number, mobile: boolean }` | Para la aplicación y las pruebas |
| `install` | `install(app)` | | `provide(statusKey, status)` y registro de los tres componentes |

**Ningún método lanza**: devuelven `false` o `null` y avisan en desarrollo. Se pueden llamar fuera de componentes (un interceptor HTTP, un guardia del router) importando el mismo gestor. `set` y no `add`: declarar dos veces la misma clave no añade otra.

### Modelo de una condición (`set(id, options)`)

| Opción | Tipo | Valores | Por defecto | Regla |
| --- | --- | --- | --- | --- |
| `type` | String | `info` `success` `warning` `error` | `info` | Icono, color, canal y gravedad. Sin `neutral` ni `loading` |
| `title` | String | **obligatorio** | | Sin título: aviso y no se registra (`set` devuelve `null`) |
| `description` | String | | sin valor | El mismo nombre que en `GToast`. Varias líneas; no se recorta en el panel |
| `details` | String | traza, código, id de petición | sin valor | **Detalle técnico**: Disclosure cerrado, `dir="ltr"`, se parte en 320px, con «Copiar» |
| `action` | Object | `{ label, busyLabel?, onClick(condition) }` | sin valor | **Una** (ver «Reintentar que se resuelve en el sitio») |
| `link` | Object | `{ label, href, target?, rel?, onClick?(event, condition) }` | sin valor | **Uno**. `<a>` nativo; `onClick` recibe el evento nativo **cancelable**. Activarlo repliega la isla |
| `origin` | Object | `{ label, target }`; `target`: `id`, `Element` o función que lo devuelve | sin valor | Botón «Ir a…»: repliega y enfoca el origen (`tabindex="-1"` temporal si no es enfocable). Si el destino no existe al pulsar: aviso y no hace nada |
| `persistent` | Boolean | | `type !== 'success'` | `true` = **condición**: al reconocerla se queda (punto). `false` = **resultado**: al reconocerlo se retira |
| `dismissible` | Boolean | | `false` | Botón de descartar propio: quita **solo** esa condición |
| `deadline` | Number \| Date | marca de tiempo | sin valor | Cuenta atrás (WCAG 2.2.1) |
| `politeness` | String | `polite` `assertive` | `assertive` en `error`; `polite` en el resto | Como `GToast` (bajar un `error` avisa en desarrollo) |
| `onRemove` | Function | `(reason, condition) => void` | sin valor | Una vez, al retirarse por cualquier vía |
| `onExpire` | Function | `(condition) => void` | sin valor | Una vez, cuando `deadline` llega a cero |

**Solo texto:** sin `icon`, `actions` en plural, slots, HTML ni `component`. Una opción desconocida se ignora con aviso en desarrollo. Los títulos de más de 60 caracteres avisan (el resumen los recorta con elipsis; el texto completo está en el nombre accesible y en el panel).

**Forma de solo lectura** (`status.conditions[i]`, `get(id)` y la **copia** que reciben `onClick`, `onRemove` y `onExpire`): las opciones resueltas más `id`, `acknowledged`, `busy`, `since` (creación o último cambio de `type`; ordena) y `updatedAt`.

**Motivos de retirada (`reason`):** `dismiss` (botón descartar) · `acknowledge` (un resultado al reconocerlo) · `api` (`remove`, `resolve` sin resultado) · `clear` · `unmount` (`<GStatus>` desmontado).

## `GStatusIsland`

| Prop | Tipo | Por defecto | Qué es |
| --- | --- | --- | --- |
| `status` | Object | el inyectado (`statusKey`) | Gestor que pinta esta isla |

Sin eventos ni slots: todo va por el gestor. Los atributos (`id`, `class`, `data-*`) van a la raíz.

### Las tres formas

Una sola superficie (`g-status-island__shape`) que cambia de tamaño. `data-form` en la raíz:

| Forma | `data-form` | Cuándo | Qué se ve |
| --- | --- | --- | --- |
| Vacía | `empty` | Cero condiciones | La `section` está `hidden`; la raíz y los canales vivos siguen montados |
| **Compacta** | `compact` | Hay alguna condición **sin reconocer** y la isla no está abierta | Resumen de una línea: insignia de la primera, su título (con elipsis), cuenta atrás si la tiene y «+N» |
| **Abierta** | `open` | La abre la persona (clic, Enter, Espacio, `Alt+F8`, marca) o un `error` nuevo | Resumen + panel con la lista y «Entendido» |
| **Punto** | `dot` | **Todas** las condiciones actuales están reconocidas | Solo la insignia de la primera; el texto del resumen queda oculto y el nombre accesible no cambia |

- **Orden** (el del DOM, que es el de lectura y el del foco): gravedad `error`, `warning`, `info`, `success` y, dentro, la más reciente (`since`) primero. El resumen muestra la primera. **Sin máximo**: el panel desplaza cuando no cabe (`overscroll-behavior: contain`, «Entendido» siempre visible; medido con 9 condiciones a 900 y 600px de alto).
- **Reconocer** («Entendido» o `acknowledge()`): las `persistent` quedan reconocidas y la isla se repliega a **punto**; los resultados se retiran; si no queda nada, la isla se vacía. **Reconocer no la hace desaparecer** mientras dure alguna condición. El reconocimiento vive en memoria (no sobrevive a una recarga).
- **De punto a compacta:** llega una condición nueva, una reconocida cambia de `type`, o `announce(id)`.
- **Cerrar la abierta:** Esc con el foco dentro, pulsar fuera (**no mueve el foco**), «Entendido», «Ir a…», el enlace, el atajo, o que **el foco vaya a un elemento que la isla abierta tapa** (WCAG 2.4.11).
- **Tipo sin color** (WCAG 1.4.1): forma del icono (`info`, `circle-check`, `triangle-alert`, `circle-alert`; `loader-circle` al reintentar) + prefijo de texto oculto (`labels.types.<tipo>`) + borde de la insignia (**sólido** `error`, **discontinuo** `warning`, **punteado** `info`, sin borde `success`).

### Apertura automática: lo grave se abre solo, con límites

Un `error` que aparece, una condición que pasa a `error` o `announce(id)` de un `error` abre la isla **solo si se cumplen las cuatro**:

1. `autoOpen` es `true`.
2. **No es móvil** (visor de al menos `space × 130`): en móvil abrir es una hoja modal y solo la abre la persona.
3. La isla estaba montada **antes** del suceso: lo que existe al montar ni abre, ni anuncia, ni da el toque.
4. **El rectángulo de la isla abierta no se solapa con el elemento en uso** (`document.activeElement` si no es `body`; si es `body`, el destino del último `pointerdown`, porque WebKit no enfoca botones con el ratón). Se mide antes de pintarla, en el mismo cuadro.

Si no se cumple alguna, la isla se queda compacta, muestra el error en su línea y **da un toque** (`is-nudge`). **Nunca toma el foco y nunca se cierra por tiempo.**

## `GStatusMark`

Complemento en línea de la isla. Dos usos según `for`; ver [`GStatusMark/README.md`](../GStatusMark/README.md).

```vue
<GFormActions>
  <GStatusMark for="save" v-slot="{ type, busy }">{{ type === 'success' ? 'Guardada' : busy ? 'Reintentando…' : 'No se guardó' }}</GStatusMark>
  <GBtn type="submit">Guardar</GBtn>
</GFormActions>
```

- **Con `for` (enlace):** una cápsula `button` que **existe solo mientras exista la condición**; su tipo y su `busy` **se derivan de ella** (no son props, para que nunca se desincronicen). Al activarla abre la isla en su condición y el foco va a su acción (si está habilitada; si no, a «Ir a…», al enlace, a descartar o al propio aviso). No anuncia nada, ni al ir ni al volver. Se coloca donde su aparición **no desplace nada**: en `GFormActions`, como hijo del slot por defecto **antes** del botón (Δ 0px medido); en `GTable`, dentro del slot `empty`. **Nunca en el slot `status` de `GFormActions`**: es `role="status"` y duplicaría el anuncio.
- **Sin `for` (texto):** una línea con insignia, texto y una acción opcional, sin caja, sin detalle ni varias acciones. Estática: no anuncia, no se cierra, no entra en la isla.

## `GStatus` (declarativo)

No pinta nada: mientras está montado, su condición existe. Ver [`GStatus/README.md`](../GStatus/README.md). Al montar hace `set`, al cambiar una prop hace `update`, al desmontar hace `remove` (motivo `unmount`). Montado junto con la isla al cargar no anuncia; montado después (una vista nueva, un fallo) anuncia como cualquier condición nueva.

## Teclado

| Tecla | Dónde | Acción |
| --- | --- | --- |
| **Alt+F8** (`hotkey`) | En cualquier parte, con al menos una condición y el foco **fuera** de la isla | Guarda el elemento enfocado, **abre** la isla y lleva el foco al resumen (en móvil, abre la hoja) |
| **Alt+F8** | Foco **dentro** de la isla o su hoja | Repliega y devuelve el foco al elemento guardado |
| **Alt+F8** sin condiciones | | No se intercepta |
| Enter / Espacio | Resumen | Abre o repliega (nativo del botón) |
| Tab / Mayús+Tab | Abierta | Resumen, luego por condición (enlace, detalle, acción, «Ir a…», descartar) y «Entendido». **No está atrapado** (no es modal) |
| Esc | Foco dentro de la isla abierta | Repliega con `preventDefault()` + `stopPropagation()` (no cierra el `GDialog` anfitrión) y deja el foco en el resumen |
| Esc | Isla replegada o foco fuera | Nada |

El atajo coincide por `event.key` y modificadores **exactos**; con composición de texto (IME) no se trata. Completa la familia F8 (avisos), Mayús+F8 (voz) y Alt+F8 (isla). **Límite no comprobado:** en escritorios Linux como GNOME y Xfce el gestor de ventanas reserva `Alt+F8` (redimensionar) y puede no llegar a la página; la isla se alcanza igual con Tab y con la marca, y puedes cambiar `hotkey` (por ejemplo a `Alt+Shift+F8`) o quitarla. En macOS, `Ctrl+F8` y `Ctrl+Opción+F8` (VoiceOver) no coinciden porque los modificadores son exactos.

## Foco

- **Nunca lo toma:** ni al aparecer, ni al abrirse sola, ni al actualizarse.
- **Si el control con foco desaparece** («Reintentar» al resolverse, una condición descartada o retirada): el foco va al **resumen** (en la hoja móvil, al aviso o al cierre de la hoja; **nunca fuera del modal**). Medido: el foco no cae a `body` al reintentar ni al resolver.
- **Si la isla se vacía con el foco dentro:** al elemento guardado (por el atajo o la marca) si sigue conectado y no es inerte; si no, al **siguiente elemento tabulable** del anfitrión; si no hay, al anterior. **Nunca a `body`.**
- «Entendido» con el foco en él: al resumen si la isla sigue (punto). «Ir a…» y el enlace repliegan; «Ir a…» enfoca el origen. Pulsar fuera repliega sin mover el foco.
- **Medido:** el botón «Guardar» enfocado no se mueve en ningún cuadro (0px) al aparecer el error, abrirse la isla ni resolverse.

## Anuncios y accesibilidad

- **Mecanismo:** un **par propio de canales vivos** (`role="status"` cortés y `role="alert"` enérgico, `aria-atomic`) **dentro de la raíz, vacíos y presentes desde el montaje**, fuera de la `section` (para que `hidden` no los afecte); viajan con la raíz al modal. La isla, la lista, el resumen y las marcas **no** son regiones vivas. Se escribe como `GToaster`: el canal se vacía y se reescribe 50 ms después, y se limpia a los 5 s. No se comparte con `GToaster` (puede no estar montado).
- **Texto:** `[Tipo:] título[.] [descripción]`, sin nombres de botones. `error` va al canal enérgico; el resto, al cortés.
- **Se anuncia, una vez por suceso:** una condición que aparece; un cambio de `type`, `title` o `description`; `announce(id)`; el rechazo del reintento; `busyLabel` al empezar a reintentar; los umbrales de la cuenta atrás (5 min, 1 min, 30 s); `labels.copied`.
- **No se anuncia:** lo que ya existe al montar la isla (**0 anuncios al cargar**), abrir, replegar, reconocer, descartar, «Ir a…», abrir el detalle, la marca, el traslado al modal, ni **el cambio que quita el control con foco cuando el foco queda leyendo esa misma condición** (el resumen la muestra porque es la primera, o es la hoja móvil, donde el foco va a su aviso: el foco ya lee el nombre nuevo). **Si el resumen muestra otra condición, ese cambio sí se anuncia** (#328).
- **Sin duplicados:** medido que ningún texto se repite entre las regiones vivas del documento con `GToaster` y `GErrorSummary` montados; entre servicios lo garantiza la regla «un suceso, un canal».
- **Estructura:** `section` con nombre (`labels.region`, con `{hotkey}`) y `aria-keyshortcuts` en el resumen; el resumen es un `button` con `aria-expanded` y `aria-controls`; su nombre accesible es el contenido: «Estado: 3 avisos. Error: título, y 2 más». Insignia decorativa (`aria-hidden`). Reconocida (punto), **el nombre accesible no cambia**. Detalle técnico: Disclosure (`aria-expanded`, `aria-controls`) con un indicador `chevron-down` que gira al abrirse (el giro, con movimiento permitido, es de coco).
- **Contraste medido** sobre el componente real, el mínimo en **ocho temas** (tema por defecto y «Tema de prueba» del playground, un `spotify` generado con marca de color y el de la auditoría con `space` 3 y `fontSize` 19; claro y oscuro) y los tres motores, con hover y foco reales: texto del resumen, «+N», temporizador del resumen, «Entendido», marca enlace y marca de texto **15,22:1**; título, descripción, enlace, temporizador y acciones del aviso **13,02:1**; detalle técnico 10,83:1; botones fantasma al pasar 9,44:1 («Copiar» 7,46:1); icono sobre la insignia **4,81:1**; marca de texto: icono y anillo **4,52:1**. Foco: anillo exterior de la isla replegada y de la marca **4,61:1** sobre la página; anillos interiores 13,02 a 15,22:1. Con el tema por defecto claro, el texto de la isla da 17,40:1. La hoja móvil (375 y 320, claro y oscuro): todo cumple 4,5:1 (3:1 en controles).
- **Tamaños:** con el tema por defecto, compacta 48px, punto 32px (resumen 30px) y abierta 416px; con `space` 3, 36, 26 (resumen 24px) y 312. El resumen, que es la diana, mide **≥ 24px** y **≥ 44px con `pointer: coarse`** también en punto (medido en Chromium; en Firefox y WebKit el puntero grueso no se emula). La marca mide 134 × 32px.
- **Movimiento reducido:** con `prefers-reduced-motion: reduce` la isla **no se mueve**: sin cambio de tamaño animado, sin toque, sin giro; solo fundidos de `--g-duration-fast`. Medido: 0 animaciones en curso salvo fundidos y la clase `is-nudge` no se queda puesta.
- **Colores forzados** (`forced-colors`, emulado en Chromium): borde `CanvasText` en la isla, el aviso y la marca; las insignias conservan su forma (sólido, discontinuo, punteado); foco visible; el borde existe siempre (transparente fuera de ese modo) y no cambia el tamaño. `prefers-contrast: more`: avisos sin tinte y con contorno pleno.
- **Texto ≥ 12px** (detalle técnico y «+N» en `caption`). **320px:** sin desplazamiento horizontal, isla dentro del margen, detalle técnico partido. **RTL:** insignias al inicio (derecha), concéntricas; `top-start` pegada a la derecha.
- **Zoom** (aproximado con visor de 640×450 a DPR 2 y 320×225 a DPR 4): isla abierta dentro del visor, «Entendido» visible, sin texto recortado.

## Convivencia

### Dentro de un diálogo modal

No hay que hacer nada. Con un `<dialog>` modal abierto todo lo de fuera es inerte, así que la raíz **se traslada al modal superior** (los mismos nodos: canales, condiciones, reconocimiento, forma y cuenta atrás no se reinician) y **vuelve al `body`** al cerrarse. Medido en los tres motores con `GDialog`: sigue en la capa superior **por encima** del diálogo y, al cerrarse, vuelve abierta. **Esc en la isla no cierra el diálogo.** El traslado no anuncia.

### Móvil: hoja inferior

Con un visor de menos de `--g-space-1 × 130` (520px con `space` 4; el umbral de hoja de `GDialog`; `data-mobile`) la isla replegada **sigue arriba** y la abierta es una **hoja inferior modal con un `GDialog` real** (`mobile="sheet"`, `title = labels.sheetTitle`, `closeLabel = labels.close`, clase `g-status-sheet`) con la misma lista y «Entendido». **Solo la abre la persona** (resumen, marca, atajo, `open()`); lo grave no abre nada solo. El foco y Esc son los de `GDialog`; al cerrarse, el foco vuelve al resumen o a la marca que la abrió. Al cruzar el umbral con la isla abierta, se repliega. Medido en 375 y 320px, claro y oscuro: hoja a todo el ancho, sin desplazamiento horizontal.

### Borde compartido: voz, isla, avisos

Orden desde el borde superior: **píldora de voz** (su indicador de grabación es una garantía) → **isla** → **avisos flotantes** (decisión del usuario: dos píldoras, la voz primero; `GSpeechHost` no cambia). La isla **lee** lo reservado por quien va antes y se coloca debajo; **publica** el alto de su forma **replegada** (nunca el de la abierta) más su margen mientras no esté vacía; `GToaster` suma todo, así que con los avisos arriba quedan bajo la isla. El orden es por **prioridad, no por montaje**. Si la píldora de voz aparece o cambia de borde, la isla se recoloca con una transición de `--g-duration-press`. Medido: `GToaster` en `top-center` empieza 14px bajo la isla replegada y la isla no se mueve al llegar un aviso; con la voz, la isla empieza bajo la píldora. Con puntero, abrir la isla cierra el panel de voz abierto y pulsar la píldora repliega la isla (ver «Limitaciones conocidas» para el teclado).

## Textos (`labels`)

| Clave | Marcadores | Dónde | Si falta |
| --- | --- | --- | --- |
| `region` | `{hotkey}` | Nombre de la `section` | Aviso al montar; sin nombre |
| `summary` | `{count}` (String o Function) | Prefijo oculto del resumen | Aviso; sin prefijo |
| `more` | `{count}` (String o Function) | Texto oculto de «+N» | Aviso al haber más de una; «+N» queda sin texto |
| `types.info` · `types.success` · `types.warning` · `types.error` | | Prefijo oculto del título, del resumen, de la marca y del anuncio | Aviso al usar ese tipo; sin prefijo |
| `acknowledge` | | «Entendido» | Aviso al montar; **el botón no se dibuja** (sin texto no tiene nombre) y no hay forma de punto |
| `dismiss` | `{title}` | Nombre del botón descartar | Aviso al primer `dismissible`; el botón se dibuja igual |
| `details` · `copy` · `copied` | | Conmutador del detalle, «Copiar», anuncio tras copiar | Aviso al primer `details`; sin `details` no hay detalle; sin `copy` no hay botón |
| `remaining` | `{time}` (String) o Function `(ms) => String` | Anuncio de los umbrales de la cuenta atrás | Aviso al primer `deadline`; no se anuncian los umbrales |
| `sheetTitle` · `close` | | Título y cierre del `GDialog` de la hoja | Aviso al montar en móvil |

Con `hotkey: false`, `{hotkey}` queda vacío. «Copiar» escribe `details` con `navigator.clipboard.writeText` solo al pulsar.

## Tema

**Sin tokens nuevos** (`tokens.md` §31). La isla y la marca enlace usan **superficie inversa**: fondo `--g-color-text` y tinta `--g-color-surface` (#325). **No usan `brand`**: «un solo elemento sólido de `brand` por vista» y la isla es permanente; en un tema de marca amarilla sería un aviso amarillo fijo. Medido con `spotify` y con el tema de la auditoría (marca de color): la isla **no se tiñe de marca**. Con el tema por defecto se ve igual que con `brand` (casi negra). Esta decisión **está pendiente de confirmar con el usuario**, igual que `Alt+F8`.

**Cómo se ve en oscuro.** La superficie inversa se invierte sola: en oscuro la isla es una **píldora clara sobre la página oscura**. Conserva la identidad de objeto aparte colgado del borde y da el contraste más alto de todos (15,22:1 el resumen, 13,03:1 los avisos, 4,81:1 el icono sobre la insignia). Visualmente pesa más que en claro con el panel abierto, pero solo dura mientras se lee; replegada es una píldora pequeña.

Tokens que consume: `--g-color-text` (fondo) y `--g-color-surface` (texto, iconos, borde de insignia y anillos de foco interiores); `--g-color-{info|success|warning|danger}` y `--g-color-on-{…}` (insignias); `--g-color-{info|success|warning|danger}-text`, `--g-color-text-muted` (marca de texto); `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`; `--g-color-border`, `--g-color-border-control`, `--g-color-surface-sunken`, `--g-color-neutral-soft`, `--g-color-link` (hoja móvil); `--g-radius-{xs|md|lg|xl|pill}`; `--g-shadow-2`; `--g-border-width`; `--g-space-*`; `--g-font-ui`, `--g-text-{body-sm|caption}-{size|line}`, `--g-text-action-weight`, `--g-text-caption-weight`, `--g-text-title-sm-weight` (título del aviso, 600); `--g-press-scale`; `--g-duration-{fast|press|slow|spin}` y `--g-ease-{out|standard|spring}`.

Constantes derivadas de `space`, no tokens: margen al borde `space × 2` (con `env(safe-area-inset-top)`), alto de la compacta `space × 12`, del punto `space × 8`, ancho de la abierta `min(space × 104, ancho disponible)`, insignia `space × 8` (`× 6` en punto y marca), umbral de móvil `space × 130`; la escala de nacer y del toque, **0,86**; los umbrales de la cuenta atrás (300 000, 60 000 y 30 000 ms). Las únicas medidas literales son `24px` y `44px` (área táctil).

**Si tu aplicación tiene una cabecera fija, pasa su alto como `offset.top` a la isla y al toaster**, o la isla replegada puede tapar sus controles:

```js
// al montar y cada vez que cambie el alto de la cabecera (se parte en varias filas en pantallas estrechas)
const sync = () => {
  status.configure({ offset: { top: cabecera.offsetHeight } })
  toaster.configure({ offset: { top: cabecera.offsetHeight } })
}
sync(); new ResizeObserver(sync).observe(cabecera)
```

Es lo que hace el playground con su `.pg-bar` (55px a 1280, 137px a 375): con ello la isla replegada no solapa ningún control de la cabecera, medido a 1280 y 375px.

## Personalidad: movimiento (#324)

Todo con tokens y ninguna curva nueva. Con movimiento reducido, nada de esto se mueve.

| Qué | Cómo | Medido (tres motores) |
| --- | --- | --- |
| **Cambio de forma** (punto, compacta, abierta) | Ancho, alto y radio de la misma superficie con `--g-ease-spring` y `--g-duration-slow` (tercer uso aprobado del muelle); el radio de estadio sale del alto, así interpola hacia `radius-xl` sin salto | Intermedios en cada paso, **sobrepaso 3,1 a 3,7 %**, asienta en 222 a 245ms |
| **Toque** (`is-nudge`) | Cuando llega una condición con la isla visible y no se abre sola: escala desde **0,86** hasta 1 con el muelle, con origen arriba (la isla cuelga del borde) | `g-status-nudge` en 240ms; la clase se retira |
| **Nacer** | Fundido y la misma escala con `--g-ease-out` y `--g-duration-press` (es una entrada: sin muelle) | |
| **Insignia concéntrica** | El hueco al inicio es el mismo que arriba y abajo: la insignia es concéntrica con el extremo de la píldora (LTR y RTL) | 8px en la compacta |
| **Cascada** | Al abrirse, los avisos caen `space × 1` y se funden, con retardo escalonado de 24ms por aviso (tres escalones como mucho) | 0, 24, 48, 72 y 72ms dentro de 160ms |
| **Eco de «hay varias»** | Con más de una condición, un anillo fino rodea la insignia, también en el punto: el punto dice «hay varias» sin texto (decorativo; el número está en el nombre accesible) | Visible en capturas |
| **Reintentando** | `loader-circle` gira con `--g-duration-spin` | |

**Nada se anima al montar** (`is-ready` dos cuadros después). Resolver en el sitio: la forma nunca se oculta (alto 244 a 196px, mayor salto entre cuadros 13 a 24px).

## SSR

Importar `@grana/vue/status` y llamar a `createStatus` no toca `document`, `window` ni `navigator`. En el servidor `GStatusIsland` no renderiza nada, `GStatus` no hace nada, `GStatusMark` de texto renderiza normal y con `for` no renderiza (aparece al montar). Las escuchas (`keydown`, `pointerdown`, `resize`, `focusin`), el intervalo de la cuenta atrás, el `ResizeObserver` y el seguimiento del modal se crean al montar la isla y se retiran al desmontarla. Los métodos del gestor, llamados en el servidor, guardan estado y no arrancan nada; las condiciones declaradas antes de montar existen al montar (sin anunciarse).

## Avisos de desarrollo

Con prefijo `[Grana Status]`, una vez por caso, solo fuera de producción: `set` con el cliente y ninguna isla montada para ese gestor; dos islas del mismo gestor; isla, `GStatus` o `GStatusMark` con `for` sin gestor; condición sin `title` o sin `id`; `type`, `position` o `politeness` fuera de lista y opciones desconocidas (también `actions` en plural, `action` sin `label` u `onClick`, `link` sin `label` o `href`, `origin` sin `label` o `target`); `error` con `politeness: 'polite'`; `hotkey` `F6` o ilegible (rechazado) y `F8` o `Shift+F8` (aceptado, choca con `GToaster` o la voz); falta de un `labels` la primera vez que se necesita; `origin.target` que no existe al pulsar «Ir a…»; título de más de 60 caracteres; dos `<GStatus>` con el mismo `id`, `GStatusMark` con `for` y `type` a la vez, marca de texto sin prefijo de tipo; marca con `for` activada sin isla; **y la isla replegada tapa por completo el elemento enfocado** (usa `position` u `offset`). **En la versión UMD cargada con `<script>` no hay avisos** (no hay `process`): el último caso solo se ve en una compilación con empaquetador; está cubierto por las pruebas.

## Clases

- **Raíz:** `g-status-island`, `g-status-island--position-top-{start|center|end}`; `data-position`, `data-align`, `data-form` (`empty` `compact` `open` `dot`), `data-type` (el de la primera condición), `data-mobile`; `is-ready`, `is-nudge`; `--_status-offset-top` en línea.
- **Partes de la isla:** `g-status-island__live` (2), `__shape` (con `--_island-w` y `--_island-h` en línea), `__inner`, `__summary`, `__badge` (`data-type`, `is-busy`), `__text`, `__sr`, `__timer`, `__more`, `__panel`, `__list`, `__foot`, `__ack`; hoja móvil `g-status-sheet`.
- **Cada aviso:** `g-status-item`, `g-status-item--type-{info|success|warning|error}`, `data-type`; `is-busy` (con `aria-busy`), `is-acknowledged`, `has-action`, `has-details`, `is-dismissible`; `g-status-item__badge`, `__content`, `__title`, `__type`, `__description`, `__timer`, `__link`, `__details-toggle`, `__details`, `__details-text`, `__copy`, `__actions`, `__action`, `__origin`, `__dismiss`.
- **Marca:** `g-status-mark`, `g-status-mark--link` o `--text`, `g-status-mark--type-*`, `data-type`, `is-busy`; `g-status-mark__badge`, `__text`, `__type`, `__action`.

## Limitaciones conocidas

- **El panel de voz abierto y la isla abierta se solapan** si se abren por teclado o por programa (con la voz y la isla bajo `top-center`): la isla queda encima. Con puntero, abrir uno cierra el otro (medido en los tres motores).
- **La isla replegada puede tapar por completo un control pequeño** situado bajo ella (por ejemplo un buscador centrado en la cabecera): un elemento persistente no cambia de borde. Se evita con `position` u `offset` (aviso de desarrollo). WCAG 2.4.11 solo se garantiza para la isla **abierta**. Sin `offset`, a 1280px la compacta cubría controles de la cabecera fija del playground: ver la receta de «Tema».
- **`GTable` no tiene estado de error propio** (#327): hoy, `GStatus` + marca en `empty`, y se anuncia «0 resultados» junto al error de la isla hasta que la tabla lo tenga.
- **Sin historial y sin persistencia:** el reconocimiento no sobrevive a una recarga. **Sin duplicados** entre servicios solo por regla de uso.
- **WebKit:** no enfoca los botones con el ratón (la apertura automática usa el destino del último `pointerdown`) y el cambio de radio durante el morfo se interpola en solo 2 pasos medidos (frente a 5 o 6 en Chromium y Firefox); ancho y alto sí interpolan. No se ha visto a ojo en Safari real.
- **Reservado y sin construir:** el control que pasa a «Reintentar» en el sitio (concepto A) y la línea de tiempo dentro del aviso (concepto C); historial; `icon` por condición; varias acciones; contenido rico; la sesión de voz como aviso de la isla.
- **No verificado:** lector de pantalla real (nombre del resumen al cambiar, canales tras el traslado al modal, `role="timer"`, `Alt+F8` con lector y en teclados sin fila de función), **Safari real**, **táctil real** (en Firefox y WebKit `pointer: coarse` no se emula), **`forced-colors` real** (solo emulado en Chromium), **zoom real del navegador** (aproximado con visor reducido y DPR), `Alt+F8` en escritorios Linux, y el aviso de desarrollo del tapado en navegador (la UMD no tiene avisos).

## Verificación

- **Pruebas unitarias** (vitest, jsdom): 72 pruebas en los tres archivos de la isla (`status.test.js` del gestor, `GStatusIsland.test.js` y `GStatusIsland.ssr.test.js`; la entrada, `src/status.test.js`, va aparte) y **2150/2150 en vitest completo**: modelo, acción y resolución, formas, apertura automática, anuncios con reloj falso, teclado y foco, marca, `GStatus`, traslado a un `GDialog` real, borde compartido, hoja móvil y SSR. Dos pruebas de apertura automática fallaban en la auditoría (hallazgo 5): el fallo era de la prueba (el `requestAnimationFrame` falso iba desfasado un cuadro), no del navegador, y quedó corregido.
- **Navegador** (Playwright en Chromium, Firefox y WebKit): `design/lab/theme-playground/tests/status.spec.mjs` sobre el playground, con 17 casos (entrada propia, carga sin anuncios, error al guardar, reintentar y éxito en el mismo nodo, marca y origen, condición de página, teclado, sin condiciones y lo grave que taparía, borde compartido con la voz y `GToaster`, diálogo, 320px, RTL, movimiento reducido, más de 6 condiciones, cabecera fija con `offset.top` a 1280 y 375px, «Alta de paciente»); en la pasada de la auditoría, `status.spec.mjs` + `speech.spec.mjs` + `form-blur-click.spec.mjs`: **75/75**.
- **Auditoría de coco** (`design/lab/alert/auditoria-verificar.mjs`, playground real, ocho temas, tres motores): **2647/2647** comprobaciones y 6 pendientes del playground (hallazgo 4, que no cuentan); banco de estilo `estilo-verificar.mjs` **2535/2535**. Tres correcciones del CSS en esa auditoría (diana del resumen, negrita del título, «Ir a…» subrayado).
- **Compuertas:** `grep -q "g-status-island__shape" packages/vue/dist/grana.css`, `! grep -q "createStatus" packages/vue/dist/grana.js` y `test -f packages/vue/dist/status.js`; el CSS `g-status-*` sin colores literales, sin `var()` con respaldo, sin `!important` y sin `brand`; toda `animation` dentro de `prefers-reduced-motion: no-preference`. `check-icons.mjs`: 0 archivos con glifos.

## Fuentes

- API: [`GStatusIsland.meta.json`](./GStatusIsland.meta.json) · [`GStatusMark.meta.json`](../GStatusMark/GStatusMark.meta.json) · [`GStatus.meta.json`](../GStatus/GStatus.meta.json)
- Contrato: [`design/contracts/status.md`](../../../../../design/contracts/status.md) · Prototipo: [`design/lab/alert/r02/`](../../../../../design/lab/alert/r02/) (y la base funcional [`r01/`](../../../../../design/lab/alert/r01/)) · Estilo: [`design/lab/alert/estilo.md`](../../../../../design/lab/alert/estilo.md) · Auditoría: [`design/lab/alert/auditoria.md`](../../../../../design/lab/alert/auditoria.md) · Decisiones: #315 a #328 en `DECISIONS.md` (isla #315 y #316, nombres #317, servicio #318, formas #319, anuncios #320, atajo #321, convivencia #322, marca #323, muelle #324, color #325, `GForm` #326, `GTable` #327, entrada propia #328)
