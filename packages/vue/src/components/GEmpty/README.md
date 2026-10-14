# GEmpty

El **vacío con causa**: lo que una región enseña cuando no tiene nada que enseñar, diciendo **por qué** y **cómo salir**. No es un póster con ilustración centrado en media pantalla: ocupa el sitio y el tamaño de **un elemento** (el primero que llegará) y su texto lo escribes tú. Hay cuatro causas (`none`, `filtered`, `error`, `forbidden`); cuando la causa es un filtro, el vacío dice **cuántas había, qué filtro quitar y cuántas vuelven con cada uno**. Es contenido de flujo (sin `role`, sin región viva, sin foco propio): lo anuncia quien lo contiene, sobre todo [`GLoadRegion`](../GLoadRegion/README.md). Todo texto visible o accesible lo pones tú, en `title`, `description` y `labels`.

**Etiqueta:** `<g-empty>` · **Estado:** `candidate` (ver [`design/lab/empty-skeleton/auditoria.md`](../../../../../design/lab/empty-skeleton/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** principal, `@grana/vue`

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GLoadRegion y GEmpty`, `#sec-load-region`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: paquete principal

`GEmpty` viaja en `@grana/vue`: lo exporta y lo registra su `install`. Va en el principal (y no en una entrada propia) porque lo usan `GTable` por defecto y el motor de carga común; importado solo, está marcado como puro y quien no lo usa no lo carga.

```js
import { createApp } from 'vue'
import Grana, { GEmpty } from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')   // registra <g-empty>
// o, sin plugin: components: { GEmpty }
```

Sin empaquetador, queda registrado al cargar `dist/grana.umd.js` (global `Grana`) y hacer `app.use(Grana)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-empty ...></g-empty>`.

**Peso (DECISIONS #530 y #550).** bruno anotó el 2026-10-08 en `GEmpty.meta.json`: `GEmpty` con el motor de carga (`utils/loadPhase.js`), el canal de página (`utils/liveRegion.js`) y las claves de `__shared` suman **+3,1 KB gzip** en `grana.js` (190 617 a 193 723 B); con la adopción de `GTable`, **+4,1 KB** (a 194 706 B). El acumulado de la Fase C en el principal es **+15 200 B sobre 179 506 B = 14,8 KiB**, dentro del tope de +15 KiB de #506: **el margen está agotado** y todo componente nuevo que entre al principal abre la valoración. **Al documentar** se volvió a comprimir el `dist/` del árbol con `gzip -9`: `grana.js` pesa 194 702 B, la misma cifra con un árbol algo posterior; no se afirma más precisión. Comprobado: `grana.css` contiene `g-empty__count` y `load-region.js` no contiene `g-empty__` (llega del principal por `__shared`, sin copia).

## Qué lo hace distinto

Formas **A «El primer hueco»** y **B «La salida con cuentas»**, elegidas por el usuario el 2026-10-08 mirando los prototipos de kiwi (`design/lab/empty-skeleton/r01/`, DECISIONS #529 y #542). **C «La frase»** (la forma compacta de una línea con acciones como enlaces) queda reservada con su nombre.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **El primer hueco (A)** | El vacío es **un elemento en el sitio donde aparecerá el primero**, del tamaño de uno: contorno discontinuo, un círculo discontinuo donde irá el avatar o el icono, el texto en medio y las acciones al final. Dentro de una `GLoadRegion` su alto mínimo es el **alto exacto del primer elemento de la plantilla** | La lista no salta cuando llegan los datos, y el vacío no se confunde con un aviso ni con una pantalla aparte. Medido: 69 px frente a 69 de una fila con el tema por defecto y 72 frente a 72 con `space` 3 |
| **La salida con cuentas (B)** | Con `cause="filtered"` y `filters`, dice cuántas había antes («Antes había 4; con Urgentes y Cerradas, ninguna.»), ofrece **un botón por filtro que devuelve algo, de más a menos, con la cuenta visible** («Quitar «Cerradas» 2») y «Quitar todos» | Quitar el filtro que de verdad ayuda es un clic, no un tanteo. La información es la salida |
| **Cuatro causas, cuatro salidas** | `none` (aún no hay nada: crear o importar), `filtered` (quitar filtros), `error` (reintentar), `forbidden` (pedir acceso). La causa la dice el **texto**, no el icono ni el color | Un solo póster para «no hay nada», «tus filtros lo dejaron en cero» y «falló el servidor» no dice cómo salir |
| **Nunca un botón deshabilitado** | Sin salida (un `forbidden` sin a quién pedir), no hay acción | Un botón inútil es peor que ninguno |

Sin movimiento propio: no hay entrada, salida ni animación (nada que reducir con `prefers-reduced-motion`).

## Qué es y qué no (fronteras)

**Regla de una línea:** *¿una región no tiene nada que enseñar? Es un `GEmpty` dentro de ella. ¿Es un fallo de toda la página que dura? Es la isla de estado. ¿Es el resultado de una acción? Es un `GToast`.*

| Necesidad | Usa | No uses |
| --- | --- | --- |
| Una región sin datos (lista, panel, ficha) | **`GEmpty`** dentro de la región (y de [`GLoadRegion`](../GLoadRegion/README.md) si carga) | Un párrafo suelto o una imagen centrada |
| Los huecos `empty`/`error` de [`GTable`](../GTable/README.md) | `GEmpty` por defecto (o dentro del slot) | Un texto a mano |
| «Sin resultados», «Cargando» y error de carga del panel de [`GCombobox`](../GCombobox/README.md) y [`GSelect`](../GSelect/README.md) | **No**: son líneas de un panel con su propio teclado; se quedan | `GEmpty` dentro del panel |
| Un fallo que afecta a toda la página y dura (sin conexión, servidor caído) | [`GStatusIsland`](../GStatusIsland/README.md) (y, si hace falta en la región, un `GStatusMark` en el slot `actions`) | `GEmpty cause="error"` repetido en cada región |
| El resultado transitorio de una acción | [`GToast`](../GToast/README.md) | `GEmpty` |
| Cuánto falta de una tarea con medida | [`GProgress`](../GProgress/README.md) | `GEmpty` |
| Que algo carga | [`GLoadRegion`](../GLoadRegion/README.md) | `GEmpty` |

## Uso

### Las cuatro causas

```vue
<!-- Fragmento: `nueva`, `importar`, `reintentar` y `pedirAcceso` son de tu aplicación -->
<script setup>
import { GEmpty, GBtn, GIcon } from '@grana/vue'
</script>

<template>
  <!-- none: aún no hay nada. Sin icono propio; el de tu aplicación va en el slot icon -->
  <g-empty cause="none" title="Aún no hay muestras" description="Aparecen aquí al registrarlas o importarlas.">
    <template #icon><g-icon name="inbox"></g-icon></template>
    <template #actions>
      <g-btn size="sm" @click="nueva">Registrar muestra</g-btn>
      <g-btn size="sm" variant="ghost" @click="importar">Importar CSV</g-btn>
    </template>
  </g-empty>

  <!-- error: no se pudo cargar. El icono (circle-alert) es propio -->
  <g-empty cause="error" title="No se pudieron cargar las muestras" description="El servidor no respondió (503).">
    <template #actions><g-btn size="sm" variant="soft" color="neutral" @click="reintentar">Reintentar</g-btn></template>
  </g-empty>

  <!-- forbidden: sin permiso. El icono (lock) es propio -->
  <g-empty cause="forbidden" title="No tienes permiso para ver estas muestras"
           description="Pídeselo a la responsable del laboratorio, Laura Ortiz.">
    <template #actions><g-btn size="sm" variant="outline" @click="pedirAcceso">Pedir acceso</g-btn></template>
  </g-empty>
</template>
```

`cause` y `title` son obligatorias. `cause` elige el icono propio, el modificador `g-empty--cause-*` y, con `filtered`, la salida; **no cambia el texto**: el título y la descripción los escribes tú. Las acciones del slot `actions` son botones de tu aplicación (usa `GBtn` en `size="sm"`).

### Icono de tu aplicación: `inbox` en el slot `icon`

`none` no trae icono (el hueco queda vacío, el círculo discontinuo donde irá el primero). `inbox` no está en la lista de la librería (DECISIONS #201): se registra por aplicación y se pone en el slot.

```js
import Grana, { createIcons } from '@grana/vue'
import { Inbox } from 'lucide-static'

createApp(App).use(Grana).use(createIcons([Inbox])).mount('#app')
```

```vue
<g-empty cause="none" title="Aún no hay muestras">
  <template #icon><g-icon name="inbox"></g-icon></template>
</g-empty>
```

El slot sustituye al icono propio de **cualquier** causa y recibe `{ cause }`. El hueco es decorativo (`aria-hidden`): un `GIcon` con `label` ahí avisa. No hay prop `icon` (DECISIONS #202: plantilla a slot).

### Título como encabezado: `headingLevel`

```vue
<g-empty cause="none" title="Aún no hay muestras" :heading-level="3"></g-empty>
```

Sin `headingLevel` el título es un `<p>`: un encabezado por cada vacío ensuciaría el índice de encabezados, y el vacío vive dentro de una sección que ya tiene el suyo. Con él (2 a 6), es `h2`…`h6`.

### Descripción con enlace: slot por defecto

```vue
<g-empty cause="forbidden" title="No tienes permiso">
  Pídeselo a la responsable del laboratorio o <a href="/ayuda/permisos">lee cómo se conceden</a>.
</g-empty>
```

El slot por defecto **sustituye** a `description` (que es solo texto).

### La salida con cuentas (B)

Las cuentas las calcula **tu aplicación**: `count` es cuántos elementos volverían quitando **solo ese filtro**.

```vue
<script setup>
import { computed, ref } from 'vue'

const FILTROS = {
  urgentes: { label: 'Urgentes', test: (m) => m.urgente },
  cerradas: { label: 'Cerradas', test: (m) => m.cerrada }
}
const aplicados = ref(['urgentes', 'cerradas'])
const universo = [/* todas las muestras */]

const salida = computed(() => aplicados.value.map((key) => ({
  key,
  label: FILTROS[key].label,
  // cuántas volverían quitando solo este filtro
  count: universo.filter((m) => aplicados.value.filter((k) => k !== key).every((k) => FILTROS[k].test(m))).length
})))

const textos = {
  relax: 'Quitar «{label}»',
  returns: '{count} vuelven',
  clear: 'Quitar todos',
  before: 'Antes había {total}; con {filters}, ninguna.'
}
const quitar = (key) => { aplicados.value = aplicados.value.filter((k) => k !== key) }
const limpiar = () => { aplicados.value = [] }
</script>

<template>
  <g-empty cause="filtered" title="Ninguna muestra con estos filtros"
           :filters="salida" :total="universo.length" :labels="textos"
           @relax="quitar" @clear="limpiar"></g-empty>
</template>
```

Lo que pinta, en este orden:

1. **La traza** (con `total` y `labels.before`): «Antes había 4; con Urgentes y Cerradas, ninguna.» `{filters}` llega como **una sola cadena** con los nombres unidos con `Intl.ListFormat` (`conjunction`, en el `locale`), **sin comillas** (una plantilla no puede ponérselas a cada nombre; cada nombre va aislado en un `<bdi>`). Redacta la frase para que se lea sin ellas.
2. **Un botón por filtro que devuelve algo**: solo los que traen `count > 0`, **de más a menos** (orden estable ante empates, el de `filters`). Texto `labels.relax`, la cuenta visible en una ficha y la cuenta para el lector (`labels.returns`). Emite `relax` con la `key`.
3. **«Quitar todos»** (`labels.clear`): si hay **más de un filtro** o si **ningún** botón del punto 2 se ofrece. Emite `clear`.
4. El slot `actions`, si lo hay, **después** de todo lo anterior.

Jerarquía (DECISIONS #555): los botones de filtro son `outline` y `color="brand"` (la acción principal); «Quitar todos» es `ghost` y `neutral` si hay botones de filtro, y `outline` y `brand` si va **solo** (entonces es la acción principal). El color se fija en `GEmpty`, no se hereda del valor por defecto de `GBtn`.

**Sin cuentas** (la aplicación no sabe cuántas vuelven): solo «Quitar todos». Un filtro sin `count` entre otros con `count` **no se ofrece suelto** (no se sabe qué devuelve). `filters` y `total` solo se usan con `cause="filtered"`; con otra causa se ignoran y avisa.

**Con `labels` como función**, recibe las mismas variables: `before({ total, filters })` (con `filters` ya unido como cadena y `total` como número sin formatear) y `returns({ count })`.

### Dentro de una `GLoadRegion`

```vue
<!-- Fragmento: `cargando`, `muestras`, `muestra` y `textosRegion` son de tu aplicación -->
<script setup>
import { GLoadRegion } from '@grana/vue/load-region'
</script>

<template>
  <h3 id="h-muestras">Muestras</h3>
  <g-load-region :loading="cargando" :items="muestras" :sample="muestra" labelledby="h-muestras" :labels="textosRegion">
    <template #default="{ items, mold, itemAttrs }">
      <ul v-if="items && items.length"><li v-for="m in items" :key="m.id" v-bind="itemAttrs(m)">{{ m.nombre }}</li></ul>
      <g-empty v-else-if="items && !mold" cause="none" title="Aún no hay muestras"></g-empty>
    </template>
  </g-load-region>
</template>
```

Dentro de la región, el vacío se **registra** (por inyección) y:

- su `title` es **lo que la región anuncia** al terminar la carga (DECISIONS #533);
- su alto mínimo es el del primer elemento de la plantilla (la región lo mide y lo publica);
- si se desmonta con el foco dentro (quitar un filtro), la región recoge el foco en vez de dejarlo caer en `<body>` (#534).

Ver [`GLoadRegion`](../GLoadRegion/README.md) para el molde, lo último conocido y la barra de fallo.

### Dentro de `GTable`

`GTable` ya pinta un `GEmpty` por defecto: `cause="none"` con `labels.empty`, `cause="filtered"` con `labels.emptyFiltered` y un botón `labels.clearFilters`, y `cause="error"` con `labels.failed` y «Reintentar». Si quieres la salida con cuentas, ponla en el slot `empty` (`{ filtered, clear }`):

```vue
<!-- Fragmento: `columns`, `filas`, `textos`, `salida`, `universo`, `textosSalida` y `quitar` son de tu aplicación -->
<g-table :columns="columns" :rows="filas" caption="Muestras" :labels="textos">
  <template #empty="{ filtered, clear }">
    <g-empty v-if="filtered" cause="filtered" title="Ninguna muestra con estos filtros"
             :filters="salida" :total="universo.length" :labels="textosSalida"
             @relax="quitar" @clear="clear"></g-empty>
    <g-empty v-else cause="none" title="Aún no hay muestras"></g-empty>
  </template>
</g-table>
```

Ver [`GTable`](../GTable/README.md), sección «Carga, error y vacío».

### Vacío suelto: el foco es tuyo

Fuera de una `GLoadRegion` y de un anfitrión, `GEmpty` **no se anuncia** y **no recoge el foco** al desaparecer: es contenido que tu aplicación pone en una vista que ya cambió. Si el vacío se va porque el usuario pulsó uno de sus botones (por ejemplo «Quitar «Cerradas»»), ese botón desaparece con el foco dentro: lleva el foco a donde tenga sentido (el encabezado de la sección, el primer elemento nuevo o un contenedor con `tabindex="-1"`).

```vue
<!-- Fragmento: `quitar` es de tu aplicación -->
<h3 id="h-muestras" tabindex="-1">Muestras</h3>
<g-empty cause="filtered" ... @relax="quitar($event); $nextTick(() => document.getElementById('h-muestras').focus())"></g-empty>
```

## Teclado

`GEmpty` no tiene teclado propio ni parada de Tab propia: **no lleva `tabindex`** y nunca toma el foco. Las acciones son `GBtn` reales (Tab, Intro y Espacio), en el orden del documento: los botones de filtro, «Quitar todos» y después los del slot `actions`.

## Anuncios

Ninguna región viva propia, nunca `role="status"` ni `role="alert"`. Lo anuncia quien lo contiene:

| Dónde | Qué se anuncia |
| --- | --- |
| Dentro de `GLoadRegion` | Su `title`, al terminar la carga (si hay un `GEmpty` registrado). Con `announceError: false` y `cause="error"`, nada |
| En `GTable` | `labels.results` con `{count}` (también con 0) o, con `error`, `labels.failed` |
| Suelto | **Nada.** Es contenido que está en la vista |

## Props

| Prop | Tipo | Valores | Por defecto | Obligatoria |
| --- | --- | --- | --- | --- |
| `cause` | String | `none` · `filtered` · `error` · `forbidden` | — | **sí** |
| `title` | String | el nombre del vacío; lo que se anuncia dentro de una `GLoadRegion` | — | **sí** |
| `description` | String | la causa o el paso siguiente | sin valor | no |
| `headingLevel` | Number | entero `2` a `6`; sin valor, el título es un `<p>` | sin valor | no |
| `filters` | Array | `{ key, label, count? }[]`, solo con `cause="filtered"` | `[]` | no |
| `total` | Number | ≥ 0: cuántas había antes de los filtros (la traza) | sin valor | no |
| `locale` | String | etiqueta BCP 47 para unir nombres y formatear cuentas | ver abajo | no |
| `labels` | Object | `relax`, `returns`, `clear`, `before` (ver «Textos») | `{}` | no |

- **`filters`:** `key` (String o Number) es lo que devuelve `relax`; `label` es el nombre visible; `count` es cuántos elementos volverían quitando solo ese filtro (lo calcula tu aplicación). Un elemento sin `count` numérico no se ofrece suelto; con `count` 0 tampoco (no devuelve nada).
- **`locale`:** prop, luego el `lang` del ancestro más cercano, luego `navigator.language` (se lee **al montar**; un cambio posterior del `lang` de un ancestro no se observa). Solo afecta a `Intl.ListFormat` y `Intl.NumberFormat` (las cuentas y `{total}`).
- **`title` vacío:** el elemento se pinta con un título sin texto; no hay aviso. Dale siempre un nombre.
- **Atributos:** `class`, `style`, `id` y `data-*` van a la raíz `<div>`.
- **No existen:** `icon` (slot), `role`, `size`, `appearance` (reservado con C), `cause="done"` (reservado).

## Textos (`labels`)

Sin valores por defecto (Grana es internacional, DECISIONS #226). Solo los usa la salida. Cada clave es una **cadena con marcadores** o una **función** que recibe las mismas variables y devuelve la cadena.

| Clave | Marcadores | Dónde | Necesaria | Ejemplo (es) |
| --- | --- | --- | --- | --- |
| `relax` | `{label}` | Texto visible del botón de un filtro | Si se ofrece algún filtro suelto | «Quitar «{label}»» |
| `returns` | `{count}` | Cuenta para el lector, oculta, dentro del mismo botón | Si algún filtro trae `count` | «{count} vuelven» |
| `clear` | — | «Quitar todos» | Con `filters` | «Quitar todos» |
| `before` | `{total}`, `{filters}` | La traza | Con `total` | «Antes había {total}; con {filters}, ninguna.» |

Si falta una clave que se va a usar, el botón se pinta igual con el texto que haya y avisa una vez. Recomendación: termina las frases con punto (se leen en una cadena con otras).

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `relax` | `String \| Number` (la `key` del filtro) | La persona pulsa «Quitar «…»» de un filtro de la salida |
| `clear` | — | La persona pulsa «Quitar todos» |

Los dos están declarados en `emits`. `GEmpty` no quita nada: **emite la intención** y tu aplicación quita el filtro. Las acciones del slot `actions` emiten lo suyo (son tus `GBtn`). **Métodos expuestos:** ninguno.

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| `default` | — | Descripción rica; **sustituye** a `description` |
| `icon` | `{ cause }` | Sustituye al icono propio (un `GIcon` de tu aplicación, p. ej. `inbox` para `none`); decorativo, dentro del hueco `aria-hidden` |
| `actions` | `{ cause }` | Acciones (`GBtn`): crear o importar, reintentar, pedir acceso. Con la salida, van **después** de ella |

## Accesibilidad

Estructura (sin `role`, sin `tabindex`, sin región viva):

```html
<div class="g-empty g-empty--cause-filtered is-exit">
  <span class="g-empty__icon" aria-hidden="true"><svg class="g-icon" aria-hidden="true">…</svg></span>
  <div class="g-empty__text">
    <p class="g-empty__title" dir="auto">Ninguna muestra con estos filtros</p>
    <p class="g-empty__trace">Antes había 4; con <bdi>Urgentes</bdi> y <bdi>Cerradas</bdi>, ninguna.</p>
  </div>
  <div class="g-empty__actions">
    <button class="g-btn g-empty__relax" type="button">
      Quitar «<bdi>Cerradas</bdi>» <span class="g-empty__count" aria-hidden="true">2</span><span class="g-empty__sr"> 2 vuelven</span>
    </button>
    <button class="g-btn" type="button">Quitar todos</button>
  </div>
</div>
```

- **Es contenido, no aviso.** Texto real en el árbol de accesibilidad, a veces con un control. El título es un párrafo (o un `hN` con `headingLevel`), sin rol.
- **La causa la dice el texto**, no el icono ni el color (WCAG 1.4.1): el icono es decorativo y el hueco `aria-hidden`.
- **Nombre accesible de los botones de filtro:** empieza por el texto visible (WCAG 2.5.3) y termina con la cuenta en palabras: medido «Quitar «Hoy» 12 vuelven» y «Quitar «Cerradas» 2 vuelven». La cifra visible va `aria-hidden` para no leerse dos veces.
- **`dir="auto"`** en el título, la descripción y la traza; cada nombre de filtro, aislado en un `<bdi>`.
- **Foco visible** en cada botón (el de `GBtn`). **Áreas:** ≥ 24 × 24 px con puntero fino y **≥ 44 × 44 con puntero grueso** (las del propio `GBtn`).
- **No se anuncia solo.** Una región viva propia repetiría lo que la región que lo contiene ya dice (DECISIONS #533).

**Contraste medido** (auditoría de coco sobre el componente real: **28 configuraciones**, con las mismas cifras en los tres motores; el tema por defecto, el de la auditoría —petróleo y magenta, `space` 3, Georgia de 18 px, borde de 2 px— y el del banco de estilo, y los once de Dark Color Presence, claro y oscuro):

| Pieza | Mínimo | Exigido |
| --- | --- | --- |
| Título del vacío | **15,19** | 4,5 |
| Descripción y traza (`text-muted`) | **7,38** | 4,5 |
| Cuenta de la salida (`on-neutral-soft` sobre `neutral-soft`) | **4,53** | 4,5 |
| «Quitar «…»» (`outline`, `brand`) | **4,53** | 4,5 |
| «Quitar todos» (`ghost`, `neutral`) sobre la superficie | **4,58** | 4,5 |
| Icono de error (decorativo) | 4,51 | 3 |

Nada baja de lo exigido. El contorno discontinuo es decorativo (la información la lleva el texto).

**`forced-colors`** (emulado en Chromium): contorno y hueco en `CanvasText`; el icono sigue el color del texto.

## Táctil, RTL y tamaños

- **Táctil** (`pointer: coarse`, emulado en los tres motores a 390 px, con el tema por defecto y el de la auditoría): todos los botones con área **≥ 44 × 44** y **ninguna solapada**. Las filas de acciones se separan `max(space × 4, 44px − 24px)` con puntero grueso (44 menos el alto mínimo de un `GBtn`), para que dos áreas de 44 no se toquen con ningún `space` (hallazgo 5 de la auditoría, corregido); con puntero fino, `space × 2` entre botones.
- **RTL:** todo con propiedades lógicas; el hueco del icono queda al inicio lógico (a la derecha) y la salida alineada con el texto. Medido con árabe.
- **320 px:** ninguna pieza fuera del vacío, también con un filtro de 62 caracteres (el `GBtn` parte su etiqueta) y sin desplazamiento horizontal. A poco ancho las acciones bajan bajo el texto sin `@media` ni `@container` (disposición intrínseca).
- **Alto:** relleno de bloque `space × 3 − borde` y de inicio `space × 4`, **sin hueco entre título y descripción** (se apilan como título y meta de una fila; la traza conserva `space × 1` encima). El vacío mide **exactamente un elemento**: 69 = 69 con el tema por defecto y 72 = 72 con `space` 3, en las cuatro causas. Con acciones que bajan o con la salida, **crece por su contenido** (es un mínimo, no una altura fija). Sin margen exterior propio: lo pone el anfitrión.

## Movimiento

Ninguno. No hay entrada, salida ni animación, así que no hay nada que cambiar con `prefers-reduced-motion`.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_load-slot`). **No define tokens nuevos**, no usa valores de respaldo y no lleva colores literales. En la hoja solo hay literales de `24px` y `44px` (la separación táctil), el patrón de texto oculto y el dato `--_load-slot`.

| Token | Para qué |
| --- | --- |
| `--g-color-border-strong`, `--g-border-width`, `--g-radius-md` | Contorno discontinuo de la caja y del círculo del hueco |
| `--g-color-text`, `--g-color-text-muted` | Título; descripción, traza e icono |
| `--g-color-danger-text` | Icono de `error` y su círculo (decorativo) |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft`, `--g-radius-pill` | Ficha de la cuenta de la salida |
| `--g-space-1` a `--g-space-4` | Relleno, separaciones, hueco del icono (`space × 10`), traza |
| `--g-text-body-*`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui` | Título, descripción y traza, cifra de la cuenta |

Los de `GBtn` y `GIcon` llegan por composición. `--_load-slot` lo escribe `GLoadRegion` en su raíz (el alto del primer elemento); fuera de una región no existe y el vacío mide lo que su contenido.

## SSR

Sin lecturas de `document` ni `window` fuera de `onMounted`. `GLoadRegion.ssr.test.js` renderiza en servidor un `GEmpty cause="filtered"` con filtros (la salida con sus botones) junto a la región y la tabla. En servidor el idioma de las cuentas es el de la prop `locale` o el predeterminado de `Intl`; el `lang` del ancestro y `navigator.language` se leen al montar.

## Avisos de desarrollo

Prefijo `[Grana] <GEmpty>`; una vez por instancia y causa, sin contenido de la aplicación; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | `filters` o `total` con una `cause` distinta de `filtered` | Los ignora |
| 2 | Salida con filtros sueltos sin `labels.relax`; con `count` sin `labels.returns`; con `filters` sin `labels.clear`; con `total` sin `labels.before` | Pinta el botón igual con el texto que haya |
| 3 | `cause="filtered"` sin `filters` y sin slot `actions` | Pinta un vacío por filtro sin salida |
| 4 | Un `GIcon` con `label` en el slot `icon` | Lo pinta dentro del hueco `aria-hidden` (aviso de `GIcon`) |

## Clases

Raíz `g-empty`, `g-empty--cause-{none|filtered|error|forbidden}` e `is-exit` (`filtered` con `filters` no vacío). Partes: `__icon`, `__text`, `__title`, `__description`, `__trace`, `__actions`; en los botones de la salida, `__relax` (solo marcado, sin regla), `__count` y `__sr`. `--_load-slot` (en línea, en la raíz de la región) es un dato interno, no API.

## Limitaciones conocidas

- **Suelto, no se anuncia ni recoge el foco al desaparecer:** dentro de `GLoadRegion` y de `GTable` sí; fuera, lo decide tu aplicación.
- **Las cuentas las calcula tu aplicación.** Sin ellas, la salida se reduce a «Quitar todos». `GTable` no las calcula todavía en `filterMode: 'local'` (reservado, #543).
- **`{filters}` no lleva comillas ni formato por nombre** (DECISIONS #553): una plantilla no puede ponérselos a cada elemento; redacta la frase para que se lea sin ellos.
- **`forbidden` sin a quién pedir:** sin acción. No pongas un botón deshabilitado.
- **Fuera de una región el alto mínimo es el de su contenido:** no hay elemento que medir.
- **El `lang` del ancestro se lee al montar:** un cambio posterior de idioma sin cambiar `locale` no reformatea las cuentas.
- **Necesitas pasar los textos:** sin `labels` la salida se pinta con botones sin nombre.

## Reservado (fuera de v0.1)

Hoy no existen (DECISIONS #543):

- **`cause="done"`:** «al día», el vacío positivo (una bandeja resuelta), sin salida.
- **`appearance="phrase"` (C «La frase»):** la frase en una línea con sus acciones como enlaces, para celdas y paneles pequeños.
- **Revelado escalonado** (DECISIONS #549): idea de la segunda tanda de personalidad; no entra en v1.

## Verificación

- **Pruebas** (vitest con jsdom, ejecutadas de nuevo al documentar): `GEmpty.test.js` **18 de 18**; las de lo que comparte: `GLoadRegion.test.js` 31 de 31, `GTable.test.js` 57 de 57, `loadPhase.test.js` y `liveRegion.test.js` 20 de 20, y `src/load-region.test.js` (la entrada) 9 de 9. `GLoadRegion.ssr.test.js` pasa **2 de 2** (en la primera pasada, con la máquina cargada, el primer `import` superó el tiempo de espera de 5 s; repetida sola, pasa). `src/types.test.js` no se ejecutó.
- **Specs de navegador** (Playwright, Chromium, puerto 4210, sobre el `dist/` del árbol): `empty.spec.mjs`, `load-region.spec.mjs`, `personalidad-load-region.spec.mjs` y `table-load.spec.mjs`, **45 de 45**, ejecutados al documentar.
- **Auditoría de coco** con el componente real publicado (`dist/grana.umd.js` y `dist/load-region.umd.js`, `dist/grana.css`) y un tema distinto al por defecto: `node design/lab/empty-skeleton/auditoria-verificar.mjs`. El informe registra **5350 de 5350** comprobaciones (estático 31, Chromium 1777, Firefox 1771, WebKit 1771) con cuatro hallazgos abiertos para bruno; **bruno los cerró en `93cb273`** (hallazgos 1, 6, 7 y 8, y el color de #555) y anotó en ese commit **5353 de 5353** sin las notas de los hallazgos 6 y 8. El informe `auditoria.md` aún muestra el estado anterior y **no se repitió el verificador al documentar**.
- **Empaquetado** (al documentar, sobre el `dist/` del árbol): `grana.js` contiene `GEmpty`, `grana.css` contiene `g-empty__count`, `load-region.js` no contiene `g-empty__` y `dist/grana.d.ts` declara `GEmptyProps`.

## No verificado

- **Lectores de pantalla reales** (VoiceOver, NVDA, JAWS, TalkBack): cómo se leen el título sin rol, la traza con `<bdi>`, el nombre de los botones con la cuenta y el anuncio del título por la región. Solo se comprobó el marcado y el árbol de accesibilidad.
- **Safari real y táctil real** (iOS, Android): el área de 44 px con el dedo se emuló en Chromium, Firefox y WebKit de Playwright.
- **`forced-colors` real** (Windows) y en Firefox o WebKit: emulado solo en Chromium.
- **Zoom real** de solo texto y de página al 200 y 400 %: aproximado con 320 px.
- **CJK y nombres de filtro muy largos** más allá del caso de 62 caracteres.
- **Cifras de este README tomadas de otros informes** (peso de bruno, contraste y geometría de coco) y no remedidas al documentar, salvo las marcadas como «ejecutadas», «ejecutados» o «al documentar».

## Fuentes

- API: [`GEmpty.meta.json`](./GEmpty.meta.json) · Contrato: [`design/contracts/empty.md`](../../../../../design/contracts/empty.md) (DECISIONS #529, #530, #533, #534, #537, #540 a #543, #547, #550 a #556) · Ronda de kiwi: [`design/lab/empty-skeleton/r01/`](../../../../../design/lab/empty-skeleton/r01/) · Estilo: [`design/lab/empty-skeleton/estilo.md`](../../../../../design/lab/empty-skeleton/estilo.md) · Auditoría: [`design/lab/empty-skeleton/auditoria.md`](../../../../../design/lab/empty-skeleton/auditoria.md) · Compañera: [`GLoadRegion`](../GLoadRegion/README.md) · Anfitrión: [`GTable`](../GTable/README.md) · Frontera: [`GStatusIsland`](../GStatusIsland/README.md), [`GToast`](../GToast/README.md), [`GProgress`](../GProgress/README.md), [`GCombobox`](../GCombobox/README.md), [`GSelect`](../GSelect/README.md) · Botones: [`GBtn`](../GBtn/README.md)
