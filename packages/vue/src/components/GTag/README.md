# GTag y GTagGroup

Etiquetas: **elementos de un conjunto que clasifican o resumen una elección** (las alergias de un expediente, los filtros aplicados sobre una lista, los temas de un artículo, el «Solo pendientes» de la cabecera de una tabla). Una etiqueta se **lee**, se **quita**, se **alterna** o se **sigue**. `GTag` es **una** etiqueta; `GTagGroup` es un **conjunto dirigido por datos** (`v-model:items`) que añade lo que una etiqueta suelta no puede tener: la **huella** al quitar (con «Deshacer» en el sitio), los **racimos** por faceta, el tope «Ver N más», «Quitar todas» y un foco que nunca se pierde. Neutra o de categoría, **nunca semántica** (para el estado de otra cosa, `GBadge`). No es un campo: no se envía y no se registra en `GForm`. Todo texto visible o accesible lo pones tú en `labels` y en los datos.

**Etiquetas:** `<g-tag>` y `<g-tag-group>` · **Estado:** `candidate` (ver [`design/lab/chip/auditoria.md`](../../../../../design/lab/chip/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/tag` (global UMD `GranaTag`)

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GTag y GTagGroup`, `#sec-tag`). Exige Vue `^3.5.0` (usa `useId`) y un navegador actual.

## Instalación: entrada propia

`GTag` y `GTagGroup` **no** viajan en `@grana/vue`: ni los exporta ni los registra su `install`. Van en su propia entrada y quien no los usa no los paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Tag, { GTag, GTagGroup } from '@grana/vue/tag'
import '@grana/vue/style.css'          // el CSS de las etiquetas ya está en esta hoja única

createApp(App).use(Grana).use(Tag).mount('#app')   // registra <g-tag> y <g-tag-group>
// o, sin plugin: components: { GTag, GTagGroup }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/tag.umd.js` (global `GranaTag`): `app.use(Grana).use(GranaTag)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-tag-group ...></g-tag-group>`.

La entrada exporta `GTag`, `GTagGroup` y, por defecto, un plugin (`install`) que solo registra los dos (y no pisa un registro previo). No hay gestor ni servicio. Los tipos van en `@grana/vue/tag` (`tag.d.ts`, generado desde los `meta.json`; la forma de `TagItem`, de `labels` y de `emptyFocus` está escrita a mano en `types/api/tag.d.ts` y `types/overrides.mjs`); `GTag` y `GTagGroup` entran en `GlobalComponents` desde el `install` de la entrada.

**Peso (DECISIONS #472 y #510).** Primero iban en el principal con un tope de 8 KB gzip; bruno midió **+9,2 KB** (179 558 a 188 760 B en `grana.js`), así que la decisión volvió a lima y pasaron a entrada propia. Peso anotado por bruno el 2026-10-08 en `GTagGroup.meta.json`: `dist/tag.js` **10 446 bytes gzip** (≈ 10,4 KB) y `dist/tag.umd.js` **9 264**; con la entrada propia, `grana.js` crece solo 25 B (las dos claves nuevas de `__shared`). **Al documentar** se volvió a comprimir el `dist/` que había en el árbol con `gzip` (nivel por defecto): 10 515 y 9 309 bytes, es decir, la misma cifra con otro nivel de compresión o con un árbol algo distinto; no se afirma más precisión. `GAvatar`, `GBtn`, los dos `GIcon`, el motor de la pista (`utils/visualTip.js`), `createLiveWriter`, `fill` y `categoryOf` llegan del principal por `__shared` **sin copia**; el motor de las huellas, el foco y la agrupación viaja solo aquí. Comprobado al documentar: `grana.js` no contiene `GTag` y `dist/tag.js` existe.

## Qué lo hace distinto

Formas **A «Huella»** y **B «Racimo»**, elegidas por el usuario el 2026-10-07 mirando los prototipos de kiwi (`design/lab/chip/r01/`, DECISIONS #460). **C «Palabra»** (etiquetas como palabras en la línea) queda reservada con su nombre.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **Huella (A)** | Al quitar una etiqueta en un `GTagGroup`, el **modelo cambia en el acto**, pero en pantalla queda su **huella**: el contorno discontinuo del mismo ancho, con «Deshacer» en el sitio y **con el foco**. Nada se recoloca hasta que **ni el puntero ni el foco** están en el grupo; entonces todas las huellas se recogen a la vez y se emite `settle` | El error clásico de las etiquetas (quitar dos seguidas y que la segunda sea la que estaba al lado) desaparece por construcción: lo que hay bajo el puntero no cambia mientras el puntero está ahí. La vuelta atrás aparece donde actuaste, no en un aviso que hay que ir a buscar |
| **Tapa entera** | «Quitar» ocupa **toda la altura** de la etiqueta, al final lógico, separada por un filo. Apuntarla o enfocarla con teclado **tacha el texto** (vista previa) e invierte la tapa | Una zona grande en vez de una × de 16 px; se ve cuál se va, sin rojo (una etiqueta no lleva color semántico) |
| **Racimo (B)** | Con `layout="facets"`, las etiquetas con la misma faceta forman un racimo: el **nombre de la faceta una vez** y un **lomo** de color al inicio; la elegida lleva una raya del mismo trazo | Lee como piensa la persona: «Estado: pendiente o en curso; prioridad: alta», no seis píldoras de colores. Caben más valores por línea |
| **Mismo color que su avatar** | La categoría se deriva con el **mismo hash** que `GAvatar` | La misma clave da el mismo color en una etiqueta y en un avatar, entre motores y en el servidor |

Todo con tokens, sin muelle ni rebote, y quieto con `prefers-reduced-motion: reduce`. Nada de la etiqueta se anima al montar.

## Qué es y qué no (fronteras)

**Regla de una línea:** *¿dice el estado o la cantidad de otra cosa y no se toca? Es un [`GBadge`](../GBadge/README.md). ¿Es un elemento de un conjunto que clasifica o resume una elección? Es una `GTag`. ¿Se envía con el formulario? Es el chip de `GCheckboxGroup` o `GRadioGroup`.*

| Necesidad | Usa | No uses |
| --- | --- | --- |
| Estado o cantidad de **otra cosa** que no se toca («Pagado», «3», «En línea») | [`GBadge`](../GBadge/README.md) (colores semánticos) | `GTag` con color semántico (se ignora y avisa) |
| Un elemento de un conjunto que clasifica una elección (alergias, temas, áreas) | **`GTag` en un `GTagGroup`** (estática, enlace, alternar o quitable) | `GBadge` (no se quita ni se alterna) |
| Un filtro de la **vista** que actúa en el acto («Solo pendientes») | **`GTag` de alternar** (`aria-pressed`) | Una casilla con etiqueta, ayuda y registro en `GForm` que aquí sobran |
| Una elección que **se envía con el formulario** (tiene `name`, error, `GForm`) | [`GCheckboxGroup`](../GCheckboxGroup/README.md) `layout="chip"` · [`GRadioGroup`](../GRadioGroup/README.md) `appearance="chip"` | `GTag` de alternar (no se envía) |
| Filtros con regla y valor (editor) | [`GFilterBar`](../GFilterBar/README.md) (sus chips son internos; la adopción de `GTag` está reservada) | `GTagGroup` con un editor a mano |
| Elegir varios de un catálogo | [`GCombobox`](../GCombobox/README.md) `multiple` | `GTagGroup` más un buscador a mano |
| Una pieza con varios datos (título, código, hechos) | [`GSummary`](../GSummary/README.md) | `GTag` (un solo texto corto, más un icono o avatar opcional) |
| Un adjunto | La ficha de [`GFileField`](../GFileField/README.md) | `GTag` |
| Una acción que no es quitar, alternar ni navegar | [`GBtn`](../GBtn/README.md) `size="sm"` | `GTag` con `click` (no existe) |
| Escribir etiquetas de texto libre | `GTagInput` (**reservado**, #338; compondrá `GTagGroup`) | `GInput` más `GTagGroup` a mano |

## Uso

### Una etiqueta suelta: cuatro casos

```vue
<script setup>
import { ref } from 'vue'
const soloPendientes = ref(false)
const textos = { remove: 'Quitar {label}' }
</script>

<template>
  <!-- estática: solo se lee; sin foco; si el texto no cabe, se parte en líneas -->
  <g-tag label="Cardiología" :categories="8"></g-tag>

  <!-- enlace: un <a href> de verdad -->
  <g-tag label="Vue" href="/temas/vue"></g-tag>

  <!-- alternar: botón con aria-pressed y marca check; funciona con o sin v-model -->
  <g-tag label="Solo pendientes" v-model:pressed="soloPendientes"></g-tag>

  <!-- quitable: tapa «Quitar» hermana del cuerpo; la aplicación la quita -->
  <g-tag label="Látex" removable :labels="textos" @remove="quitarLatex"></g-tag>
</template>
```

Una `GTag` **suelta** quitable solo emite `remove`: **no deja huella, no anuncia y no gestiona el foco**; la aplicación la quita y decide a dónde va el foco. Para eso existe el grupo.

### Con icono o avatar: slot `lead`

```vue
<g-tag label="Vue" href="/temas/vue">
  <template #lead><g-icon name="tag"></g-icon></template>
</g-tag>

<g-tag label="Ana López" size="sm" removable :labels="textos">
  <template #lead><g-avatar name="Ana López" size="xs" :categories="8"></g-avatar></template>
</g-tag>
```

El hueco es decorativo (`aria-hidden`). Un `<g-icon name>` busca el nombre en el registro de tu aplicación (`createIcons`); un avatar va en tamaño `xs`. No hay props `icon` ni `avatar` en `GTag`: van en el slot. En un grupo llegan como datos (`item.icon`, `item.avatar`).

### Un grupo con huella: lo mínimo

```vue
<script setup>
import { ref } from 'vue'
const alergias = ref([
  { id: 'pen', label: 'Penicilina', removable: true },
  { id: 'lat', label: 'Látex', removable: true },
  { id: 'nue', label: 'Nueces', removable: true }
])
const textos = {
  remove: 'Quitar {label}',
  removed: '{label} quitada. Deshacer disponible',
  undo: 'Deshacer: quitar {label}',
  restored: '{label} restaurada',
  empty: 'Sin alergias'
}
</script>

<template>
  <g-tag-group label="Alergias" v-model:items="alergias" :categories="8" :labels="textos"></g-tag-group>
</template>
```

`id` (único) y `label` son obligatorios en cada elemento; el grupo necesita `label` o `labelledby` (el nombre de la lista). Cada gesto emite un **arreglo nuevo** en `update:items`, con las referencias de lo que no cambia conservadas. **Funciona con o sin `v-model:items`:** sin él, el grupo guarda su copia y la sustituye cuando la prop cambia.

### Borrar en el servidor solo cuando ya no hay vuelta atrás: `settle`

El modelo cambia **al quitar**, no al recogerse la huella. Si tu aplicación prefiere confirmar el borrado en el servidor cuando ya no se puede deshacer, escucha `settle`:

```vue
<g-tag-group label="Alergias" v-model:items="alergias" :labels="textos"
             @remove="({ item }) => marcarComoQuitada(item.id)"
             @restore="({ items }) => desmarcar(items.map((i) => i.id))"
             @settle="({ items }) => api.borrar(items.map((i) => i.id))"></g-tag-group>
```

`settle` se emite con **lo que dejó de poder deshacerse**: las huellas al recogerse, el «Deshacer» de «Quitar todas» al irse (con las huellas que recogió), y **al desmontar el grupo** con algo pendiente. No hay garantía medida de que llegue si el navegador cierra la pestaña sin desmontar Vue.

### Racimos por faceta: B

```vue
<g-tag-group label="Filtros aplicados" layout="facets" v-model:items="filtros"
             :categories="8" clearable :labels="textos"></g-tag-group>
```

```js
const filtros = ref([
  { id: 'e1', label: 'Pendiente', facet: 'Estado', removable: true },
  { id: 'p1', label: 'Alta', facet: 'Prioridad', removable: true },
  { id: 'e2', label: 'En curso', facet: 'Estado', removable: true },
  { id: 'm1', label: 'Este mes', removable: true },                    // sin faceta: suelta, con lomo neutro
  { id: 'i1', label: 'Alta', facet: 'Impacto', removable: true }
])
// textos: añade removeIn, undoIn y removedIn (con {label} y {facet}):
//   removeIn: 'Quitar {label} de {facet}', undoIn: 'Deshacer: quitar {label} de {facet}',
//   removedIn: '{label} quitada de {facet}. Deshacer disponible'
```

Los racimos salen en **orden de primera aparición** de su faceta («Estado», «Prioridad», «Impacto»), con los valores en el orden de `items`. «Alta» existe en dos facetas y sus botones se llaman «Quitar Alta de Prioridad» y «Quitar Alta de Impacto»: por eso los nombres con faceta (`removeIn`). Un racimo también deja huella. Con `layout="facets"` el color de un racimo es el de su primer elemento, derivado de la faceta, así que todas las etiquetas de una misma faceta coinciden.

### Un filtro de la vista: alternar

```js
const vista = ref([
  { id: 'v1', label: 'Solo pendientes', pressed: true },
  { id: 'v2', label: 'Con adjuntos', pressed: false },
  { id: 'v4', label: 'Archivadas', pressed: false, disabled: true }
])
```

```vue
<g-tag-group label="Vista" v-model:items="vista" @toggle="({ item, pressed }) => aplicar(item.id, pressed)"></g-tag-group>
```

Un elemento con `pressed` booleano es de alternar. Si **todos** lo son (y ninguno lleva `href`), el contenedor es un `role="group"` con nombre en vez de una lista: un conjunto de interruptores. En un racimo de alternar, el racimo es un grupo nombrado por la faceta: un filtro de facetas en una línea. `toggle` trae el elemento **nuevo** (con `pressed` invertido).

### Tope «Ver N más» y «Quitar todas»

```vue
<g-tag-group label="Temas" size="sm" :limit="3" clearable v-model:items="temas" :labels="textos"></g-tag-group>
<!-- textos: more: 'Ver {count} más', less: 'Ver menos', clearAll: 'Quitar todas',
     cleared: 'Se quitaron {count} etiquetas', undoAll: 'Deshacer: volver a poner {count}',
     restoredAll: '{count} etiquetas restauradas' -->
```

`limit` muestra las primeras N (**las huellas cuentan** en esa ventana) y un botón «Ver N más» con `aria-expanded` y `aria-controls`; el foco se queda en el botón, que pasa a `labels.less`. `clearable` pone «Quitar todas» cuando hay **dos o más** etiquetas quitables y habilitadas: las quita **sin huella**, y **el mismo botón** pasa a «Deshacer: volver a poner N» con el foco, hasta que el foco y el puntero salen del grupo. `limit` se **ignora** con `layout="facets"` (avisa).

### Con router: `navigate` cancelable

```vue
<g-tag-group label="Temas del artículo" :items="temas" :labels="textos"
             @navigate="({ event, href }) => { event.preventDefault(); router.push(href) }"></g-tag-group>
<!-- suelta: <g-tag label="Vue" href="/temas/vue" @navigate="..."> -->
```

`navigate` se emite con el evento nativo del clic, **cancelable** (`preventDefault()` síncrono deja la navegación a tu router) y **solo con activación primaria** (clic con el botón 0 sin Ctrl, ⌘, Mayús ni Alt, o Intro; DECISIONS #505). Con modificadores o clic central no se emite y el navegador abre la pestaña nueva. No existe la prop `to`.

### Textos propios del cuerpo y del hueco: slots del grupo

```vue
<g-tag-group label="Responsables" v-model:items="personas" :categories="8" :labels="textos">
  <template #label="{ item }">{{ item.label }} <b>{{ item.cargo }}</b></template>
  <template #lead="{ item }"><MiInsignia :tipo="item.tipo" /></template>
</g-tag-group>
```

Los slots ceden el texto y el hueco, **nunca la anatomía**. El contenido del slot de texto es de frase y **no interactivo** (en `GTag`, un `a`, `button`, `input`, `select`, `textarea` o `[tabindex]` en el slot avisa al montar). `label` de cada elemento sigue siendo obligatorio: da los nombres de «Quitar» y la clave del color. Otros campos del elemento (`cargo`, `tipo`) se conservan tal cual y llegan a los slots y a los eventos.

### Elemento con avatar o icono (datos)

```js
const personas = ref([
  { id: 'ana', label: 'Ana María López', avatar: true, removable: true },                 // GAvatar con name = label
  { id: 'luis', label: 'Luis Torres', avatar: { initials: 'LT', color: 4 }, removable: true },
  { id: 'cal', label: 'Agenda', icon: 'calendar', removable: true }                       // nombre de Lucide
])
```

`item.avatar` (`true` u objeto con las props de `GAvatar`: `src`, `name`, `initials`, `icon`, `color`, `categories`, `colorKey`, `shape`; `size` y `label` se ignoran: siempre `xs` y decorativo) **gana a `item.icon`**. Un avatar sin `color` ni `categories` propios **hereda las `categories` del grupo** (DECISIONS #513): `avatar: true` en un grupo con `categories: 8` ya colorea las iniciales; si el objeto trae `color` o `categories`, manda lo suyo.

### Foco cuando el grupo se queda vacío: `emptyFocus`

```vue
<g-tag-group label="Alergias" v-model:items="alergias" :labels="textos" empty-focus="#agregar-alergia"></g-tag-group>
<g-btn id="agregar-alergia" size="sm" variant="outline" @click="agregar">Agregar alergia</g-btn>
```

Si la última etiqueta con control desaparece y el foco estaba en ella, el foco va a donde diga `emptyFocus` (un selector CSS, un elemento o instancia con `$el`, o una función que lo devuelve; se resuelve en ese momento). Sin él, o si no se encuentra (avisa), va al **contenedor** del grupo (`tabindex="-1"`, que se quita al salir), que lee su nombre y el texto `labels.empty`. Nunca queda en `<body>`.

## La huella en detalle (A)

Comportamiento de **toda** etiqueta quitable de un `GTagGroup` (sin prop para desactivarlo en v1).

1. **Quitar** (clic en la tapa, Supr o Retroceso): se emite `update:items` **sin** el elemento y después `remove`; el grupo guarda una **huella** como estado interno (no es un `item` del modelo). Anuncia `labels.removed`.
2. **La huella conserva la caja:** antes del cambio, el `.vue` mide el ancho de la etiqueta y lo escribe como `--_ghost-w` en la huella (**Δ0** en posición y ancho de todas las etiquetas, por construcción). Se ve como un contorno discontinuo, el texto tachado y atenuado (fuera del árbol de accesibilidad), el icono o avatar en gris y a media tinta, y la tapa convertida en «Deshacer» (`undo-2`), **con el foco**.
3. **Deshacer** devuelve el elemento **a su sitio**: delante del primer elemento que le seguía al quitarlo y que aún existe; si no, detrás del anterior más cercano que exista; si no, al final. Emite `update:items` y `restore` (`source: 'undo'`), anuncia `labels.restored` y lleva el foco a su «Quitar».
4. **Se recogen cuando nadie apunta.** Todas a la vez, cuando el foco **no** está dentro del grupo **y** ningún puntero con hover (ratón, lápiz) está sobre él; se evalúa al salir el foco, al salir el puntero del grupo y al pulsar fuera. En táctil cuenta solo el foco. Recoger es una salida (el ancho de la huella a 0 y la opacidad a 0) y emite `settle`.
5. **Varias huellas** pueden convivir, cada una con su «Deshacer». Un doble clic rápido sobre la misma tapa quita y deshace: la vecina no se mueve ni se quita (medido).
6. **El foco se mueve por programa, también tras un clic** (WebKit no deja el foco en un botón al pulsarlo): quitar lleva a «Deshacer»; deshacer, a «Quitar»; «Quitar todas», al mismo botón ya convertido; deshacer todas, a «Quitar todas». Un foco por programa **no abre la pista visual**.

Una `GTag` suelta tiene la forma (tapa entera y vista previa) pero no la huella.

## Teclado

Sin widget compuesto (DECISIONS #465): **cada control es una parada de Tab nativa**, sin *roving tabindex* ni flechas (APG no define un patrón de etiquetas, y las flechas chocarían con la edición de `GTagInput`).

| Tecla | Dónde | Acción |
| --- | --- | --- |
| Tab / Mayús + Tab | Enlace, botón de alternar, «Quitar», «Deshacer», «Ver N más», «Quitar todas» | Recorre los controles en el orden del documento; una etiqueta estática no es parada |
| Intro | Enlace | Sigue el enlace y emite `navigate` |
| Espacio / Intro | Botón de alternar | Alterna (`update:pressed`, `toggle`) |
| Espacio / Intro | «Quitar», «Deshacer», «Ver N más», «Quitar todas» | Activa el botón |
| Supr / Retroceso | Cuerpo interactivo o «Quitar» de una etiqueta quitable y habilitada | Quita (`source: 'key'`, `preventDefault()`). Es un atajo: la vía principal es el botón con nombre |
| Esc | — | No hace nada propio; la pista visual la cierra su motor sin mover el foco |

**Si el control con el foco desaparece por otra causa** (tu aplicación cambia `items`, una etiqueta deja de ser quitable, «Ver N más» se va), el foco va, en este orden: al control **equivalente** de la siguiente etiqueta con control («Quitar» a «Quitar», cuerpo a cuerpo; en `facets`, primero dentro del mismo racimo), a la anterior más cercana, a `emptyFocus` y, por último, al contenedor del grupo. Las estáticas se saltan.

## Anuncios

Una **región viva cortés** por grupo (`g-tag-group__live`, `role="status"`, oculta visualmente), **vacía al montar** y escrita con `createLiveWriter` (vaciar y escribir en el ciclo siguiente). Se anuncian quitar (`removed`/`removedIn`), deshacer (`restored`), quitar todas (`cleared`) y deshacer todas (`restoredAll`). **No** se anuncian alternar (lo dice `aria-pressed`), desplegar (lo dice `aria-expanded`) ni recoger. Una `GTag` suelta no anuncia.

**Manda el último gesto (DECISIONS #514).** La región es una sola: un anuncio nuevo **sustituye** al anterior si aún no se leyó. Quitar y deshacer seguidos (o dos quitar rápidos) anuncian lo último («restaurada»), no una cola de mensajes. Es el comportamiento aceptado: una cola retrasaría el estado actual detrás de uno ya caduco, y el estado real está en el árbol (la huella con su «Deshacer», o la etiqueta devuelta).

## Props

### GTag

| Prop | Tipo | Valores | Por defecto | Obligatoria |
| --- | --- | --- | --- | --- |
| `label` | String | texto de la etiqueta (salvo slot), base de los nombres de «Quitar» y clave del color sin `colorKey` | — | **sí** |
| `href` | String | URL; con valor, el cuerpo es un `<a href>` y gana a `pressed` | sin valor | no |
| `pressed` | Boolean \| null | `true` · `false` · `null` (`v-model:pressed`) | `null` | no |
| `removable` | Boolean | añade «Quitar» (necesita `labels.remove`) | `false` | no |
| `disabled` | Boolean | deshabilita el cuerpo interactivo y «Quitar»; no emite | `false` | no |
| `size` | String | `sm` · `md` (es la **altura**) | `md` | no |
| `color` | String \| Number | `'neutral'` o una categoría `1` a `12` (número o cadena numérica) | sin valor | no |
| `categories` | Number | `0` a `12`; con `n > 0` y sin `color`, deriva la categoría de `colorKey ?? label` | `0` | no |
| `colorKey` | String \| Number | clave estable del color (como `GAvatar`) | sin valor | no |
| `labels` | Object | `{ remove }`, cadena con `{label}` o función | `{}` | no |

- **`pressed` es `Boolean` con `default: null`:** ausente = no alterna; `true` o `false` = botón de alternar con `aria-pressed`. Funciona **con o sin** `v-model:pressed`: sin él, la etiqueta guarda su estado y lo sincroniza cuando cambia la prop.
- **`href` gana a `pressed`**: navegar y cambiar un estado son dos intenciones; con los dos, `pressed` se ignora y avisa. Deshabilitado, un enlace es `role="link" aria-disabled="true"` **sin `href`** y sale del orden de Tab.
- **`color`:** `'neutral'` gana a `categories`; `k` (1 a 12) fija la categoría. **Cualquier otro valor, semánticos incluidos (`danger`, `brand`…), se ignora y avisa**: para estado, `GBadge`. Sin valor: derivado si `categories > 0`, si no, neutro.
- Una cadena vacía o solo con espacios en `label`, `href` o `colorKey` **cuenta como ausente**; sin `label`, la etiqueta no se pinta (avisa).
- **No existen:** `icon`, `avatar`, `variant`, `rounded`, `density`, `value`, `name`, `to` ni el evento `click`.

### GTagGroup

| Prop | Tipo | Valores | Por defecto | Obligatoria |
| --- | --- | --- | --- | --- |
| `items` | Array | `TagItem[]` (abajo), `v-model:items` | — | **sí** |
| `label` | String | nombre del grupo (`aria-label` del contenedor) | sin valor | uno de `label` / `labelledby` |
| `labelledby` | String | id de un elemento visible que nombra el grupo | sin valor | uno de `label` / `labelledby` |
| `layout` | String | `flow` · `facets` | `flow` | no |
| `size` | String | `sm` · `md` (se aplica a todas las etiquetas) | `md` | no |
| `categories` | Number | `0` a `12` (se aplica a todas; un `item.color` gana) | `0` | no |
| `limit` | Number | entero ≥ 1: muestra las primeras N y «Ver N más» | sin valor | no |
| `clearable` | Boolean | «Quitar todas» con dos o más etiquetas quitables y habilitadas | `false` | no |
| `emptyFocus` | String \| Object \| Function | selector CSS, elemento (o instancia con `$el`) o función | sin valor | no |
| `disabled` | Boolean | deshabilita los controles de las etiquetas y «Quitar todas»; **«Ver N más» sigue activo** | `false` | no |
| `labels` | Object | ver «Textos» | `{}` | no |

- **`layout="facets"`:** racimos por `item.facet` (recortado; vacío = sin faceta) en orden de primera aparición; las sueltas sin faceta conservan su lugar y llevan un lomo neutro. Sin ningún `item.facet`, funciona como `flow` con lomo neutro y avisa.
- **`limit` y `disabled`:** `disabled` no esconde etiquetas sin forma de leerlas, así que «Ver N más» sigue activo (DECISIONS #512; WCAG 1.3.1 y 4.1.2); lo que se deshabilita son los controles de las etiquetas (cuerpos interactivos, «Quitar», «Deshacer») y «Quitar todas».
- **Atributos:** `class`, `style`, `id` y `data-*` van a la raíz `<div>`; el nombre del grupo va en el contenedor (`label` / `labelledby`), no en la raíz.
- **No existen:** `modelValue` (las etiquetas presentes **son** los datos; un arreglo de ids aparte duplicaría la fuente), slot por defecto (si recibe hijos, avisa), `as`/`appearance` (reservados con C).

### `TagItem`

| Campo | Tipo | Qué |
| --- | --- | --- |
| `id` | String \| Number | **Obligatorio y único** en el grupo; la huella, el foco y el deshacer se apoyan en él. Sin `id` o repetido, se omite y avisa |
| `label` | String | **Obligatorio.** Como `GTag.label`. Sin él, se omite y avisa |
| `href` | String | Enlace |
| `pressed` | Boolean | Presente (`true` o `false`) = etiqueta de alternar |
| `removable` | Boolean | Añade «Quitar» (con huella) |
| `disabled` | Boolean | Como `GTag.disabled` |
| `color`, `colorKey` | como `GTag` | Color de la etiqueta (o del racimo) |
| `facet` | String | Nombre visible de la faceta; agrupa con `layout="facets"` y entra en la clave del color |
| `icon` | String | Nombre de Lucide, en el hueco `lead` |
| `avatar` | Boolean \| Object | `true` o props de `GAvatar`; gana a `icon`; hereda las `categories` del grupo |

### `labels` y textos

Sin valores por defecto (Grana es internacional, DECISIONS #226). Cada clave es una **cadena con marcadores** o una **función** que recibe las mismas variables y devuelve la cadena; falta una que se va a usar y avisa una vez.

| Clave | Variables | Dónde | Ejemplo (es) |
| --- | --- | --- | --- |
| `remove` | `{label}` | Nombre de «Quitar» (`GTag` y grupo) | «Quitar {label}» |
| `removeIn` | `{label}`, `{facet}` | Ídem en un racimo | «Quitar {label} de {facet}» |
| `removed` | `{label}` | Anuncio al quitar | «{label} quitada. Deshacer disponible» |
| `removedIn` | `{label}`, `{facet}` | Ídem en un racimo | «{label} quitada de {facet}. Deshacer disponible» |
| `undo` | `{label}` | Nombre de «Deshacer» de la huella | «Deshacer: quitar {label}» |
| `undoIn` | `{label}`, `{facet}` | Ídem en un racimo | «Deshacer: quitar {label} de {facet}» |
| `restored` | `{label}` | Anuncio al deshacer | «{label} restaurada» |
| `more` | `{count}` | «Ver N más» | «Ver {count} más» |
| `less` | — | Desplegado | «Ver menos» |
| `clearAll` | — | «Quitar todas» | «Quitar todas» |
| `cleared` | `{count}` | Anuncio | «Se quitaron {count} etiquetas» |
| `undoAll` | `{count}` | El botón en modo deshacer | «Deshacer: volver a poner {count}» |
| `restoredAll` | `{count}` | Anuncio | «{count} etiquetas restauradas» |
| `empty` | — | Grupo vacío | «Sin etiquetas» |

`GTag` suelta solo usa `remove`. Las formas con faceta, si faltan, **caen a su forma base** (`remove`, `undo`, `removed`) y avisan.

## Eventos

### GTag

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:pressed` | `Boolean` | La persona alterna (clic, Espacio, Intro). No con `disabled` |
| `remove` | `{ event, source: 'button' \| 'key' }` | «Quitar» o Supr/Retroceso sobre un control de la etiqueta. La suelta **no se quita sola** |
| `navigate` | `{ event, href }` | Activación **primaria** del enlace (sin Ctrl, ⌘, Mayús, Alt ni `defaultPrevented`, o Intro); `event.preventDefault()` síncrono evita la navegación |

Los tres están declarados en `emits`: una escucha `onClick` **no se enlaza** (avisa y remite a `navigate`, `update:pressed` o `remove`). Sin evento `click`.

### GTagGroup

Una vez por gesto y **después** de `update:items`:

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `update:items` | `TagItem[]` | Quitar, deshacer, quitar todas, deshacer todas, alternar. Siempre un arreglo nuevo |
| `remove` | `{ item, index, source: 'button' \| 'key' }` | La persona quita una etiqueta (deja huella); `index` es la posición en `items` |
| `restore` | `{ items, source: 'undo' \| 'undo-all' }` | «Deshacer» de una huella o de «Quitar todas» |
| `clear` | `{ items }` | «Quitar todas» |
| `toggle` | `{ item, pressed }` | La persona alterna; `item` es el objeto nuevo |
| `navigate` | `{ event, href, item }` | Como `GTag`: solo activación primaria; `preventDefault()` para un router |
| `settle` | `{ items }` | Lo quitado deja de poder deshacerse (ver «Borrar en el servidor») |

**Métodos expuestos:** ninguno.

## Slots

| Componente | Slot | Alcance | Propósito |
| --- | --- | --- | --- |
| `GTag` | `default` | — | Sustituye el texto visible dentro de `g-tag__text` (p. ej. «Vue · 12»); no interactivo. `label` sigue siendo obligatoria |
| `GTag` | `lead` | — | Icono (`GIcon`) o `GAvatar size="xs"` antes del texto; hueco decorativo |
| `GTagGroup` | `label` | `{ item, index }` | Texto visible de cada etiqueta (no interactivo) |
| `GTagGroup` | `lead` | `{ item }` | Hueco inicial de cada etiqueta; con el slot, manda el slot sobre `item.avatar` e `item.icon` |

## Color por categoría

| Entrada | Resultado | `data-cat` |
| --- | --- | --- |
| Sin `color` y `categories` 0 | **Neutro** | — |
| `color="neutral"` | Neutro (gana a `categories`) | — |
| `color="k"` (1 a 12) | Categoría `k` | `k` |
| `categories="n"` sin `color` | `k` derivada de la clave | `k` |
| `k` mayor que las categorías que declara el tema | **Sin relleno** (la variable no resuelve); el texto sigue legible | `k` |

- **Clave:** `colorKey ?? facet ?? label` en un grupo (con `flow` y con `facets`); una `GTag` suelta no tiene faceta: `colorKey ?? label`. La faceta va antes que el texto para que las etiquetas de una misma categoría compartan color; `colorKey` permite fijarlo. Junto a un avatar con el mismo `colorKey`, el color coincide.
- **El hash es el de `GAvatar`, sin copia** (`utils/categoryHash.js`): FNV-1a de 32 bits sobre los octetos UTF-8 de la clave normalizada, más una mezcla final; el mismo resultado entre motores y en el servidor. **Cambiar `categories` reparte los colores de nuevo.**
- Una categoría que el tema no declara (9 a 12 con `categories: 8`) **queda sin relleno y no avisa**: no se puede detectar sin leer estilos.

## Accesibilidad

Semántica por caso (DECISIONS #464):

| Caso | Cuerpo | Rol y nombre | Estado |
| --- | --- | --- | --- |
| Estática | `<span class="g-tag__body">` | Ninguno: su texto es contenido de la lista. **Sin `tabindex`** | — |
| Enlace | `<a class="g-tag__body" href>` | «enlace, Vue» | — |
| Enlace deshabilitado | `<a role="link" aria-disabled="true">` **sin `href`** | «enlace, Vue, no disponible»; fuera del Tab | — |
| Alternar | `<button type="button" aria-pressed>` | El texto; **no cambia con el estado** (APG *Button*) | `aria-pressed="true\|false"`; marca `check` decorativa; sin anuncio propio |
| Quitable | El cuerpo de su caso **más** `<button class="g-tag__remove">` hermano | `labels.remove` (o `removeIn`): «Quitar Penicilina»; **único entre hermanos** | `aria-keyshortcuts="Delete Backspace"` |
| Huella | `<span aria-hidden="true">` + `<button class="g-tag__undo">` | `labels.undo`: «Deshacer: quitar Látex» | El texto tachado está **fuera del árbol** |

```html
<div class="g-tag-group g-tag-group--layout-flow g-tag-group--size-md">
  <ul class="g-tag-group__list" role="list" aria-label="Alergias" id="…-list">
    <li class="g-tag-group__item" data-id="pen">
      <span class="g-tag g-tag--size-md is-removable" data-cat="3">
        <span class="g-tag__body"><span class="g-tag__text" dir="auto">Penicilina</span></span>
        <button type="button" class="g-tag__remove" aria-keyshortcuts="Delete Backspace">
          <svg class="g-icon" aria-hidden="true">…</svg><span class="g-tag__sr">Quitar Penicilina</span>
        </button>
      </span>
    </li>
    …
  </ul>
  <span class="g-tag-group__live" role="status"></span>      <!-- vacía al montar -->
  <div class="g-tooltip" popover="manual" aria-hidden="true">…</div>   <!-- pista visual, fuera de la lista -->
</div>
```

- **Enlace y «Quitar» son hermanos**, nunca anidados. «Quitar» y «Deshacer» son de **solo icono** (`x`, `undo-2`): su nombre va en un texto oculto (`g-tag__sr`) dentro del botón. Nunca `title`.
- **`role="list"` explícito** en la lista: Safari quita la semántica de lista a un `<ul>` sin viñetas, y la cuenta («lista, 4 elementos») informa en filtros aplicados. Con todas de alternar, `<div role="group">` con el mismo nombre. En `facets`, cada racimo es un `<li>` con el nombre de la faceta (`id`) y una lista interior `aria-labelledby` ese nombre (o `role="group"` si todas alternan); las sueltas sin faceta van sin lista interior de un solo elemento.
- **Grupo vacío:** el contenedor sigue en el DOM con su rol y su nombre, sin hijos; `g-tag-group__empty` (con `id`) lo describe con `aria-describedby` mientras está vacío (no mientras haya huellas o el «Deshacer» de «Quitar todas»).
- **El texto** lleva `dir="auto"`. El avatar decorativo conserva `translate="no"`.
- **El color nunca va solo** (WCAG 1.4.1): el texto dice qué es; el estado pulsado lleva la marca `check` y no solo el relleno; la categoría es un complemento.
- **Foco visible** en cada control (`--g-focus-width`, `--g-color-focus`, `--g-focus-offset`); en un racimo, hacia dentro para no cortarse.
- **Áreas:** cuerpo interactivo y tapas ≥ 24 × 24 px con puntero fino y **44 × 44 con puntero grueso** (un `::after` centrado que no cambia el dibujo, también en RTL).
- **Recorte y pista:** solo se recorta (una línea, `…`, tope de ancho `space × 60`) el texto de una etiqueta **con control enfocable y habilitada**; su nombre accesible es el texto entero y la **pista visual** lo enseña. Una etiqueta **estática, o deshabilitada, no se recorta: se parte en líneas** (`overflow-wrap: anywhere`), porque sin foco no habría forma de leerla con teclado.

**Pista visual** (modo visual del motor de [`GTooltip`](../GTooltip/README.md), DECISIONS #433 y #470): un nodo `aria-hidden` por control, sin rol ni `id`, al final de la raíz del grupo (fuera de la lista) o, en una `GTag` suelta, al final de su raíz. En un cuerpo interactivo está **activa solo si el texto está recortado**; en «Quitar» y «Deshacer» enseña su nombre **siempre**. En un grupo la pista **viaja** entre etiquetas.

**Contraste medido** (auditoría de coco sobre el componente real: **42 configuraciones por motor**, tres motores con las mismas cifras; el tema por defecto, el de la auditoría —granate, azul petróleo, forma cuadrada, `space` 3, Georgia de 19 px— con 8 y 12 categorías, los cuatro del banco de estilo y los once de Dark Color Presence, claro y oscuro):

| Pieza | Mínimo | Exigido |
| --- | --- | --- |
| Reposo (estática y quitable): texto sobre `soft` · icono de la tapa | **4,50** · 4,50 | 4,5 · 3 |
| Tapa al pasar (invertida) | **4,50** | 3 |
| Alternar sin pulsar: contorno `border-control` / superficie | **3,43** | 3 |
| Alternar pulsada: texto sobre relleno · marca | 4,70 · 4,70 | 4,5 · 3 |
| **Pulsada: contorno `-text` / superficie** (DECISIONS #431) | **4,51** | 3 |
| Racimo, elegida: texto sobre `soft` | 4,50 | 4,5 |
| Racimo, elegida: raya / `soft` · raya / superficie | **4,04** · 4,51 | 3 |
| Lomo / superficie (neutro `border-control`) · marco del racimo | **3,43** | 3 |
| Nombre de faceta | 7,38 | 4,5 |
| Huella: «Deshacer» · contorno discontinuo · texto tachado | 15,20 · **3,43** · 7,38 | 4,5 · 3 · 4,5 |
| Anillo de foco / superficie | 4,52 | 3 |
| «Ver N más» (`GBtn` link) · texto de vacío | 4,52 · 7,38 | 4,5 |

Nada baja de lo exigido. Lo más justo vive en pares que el motor del tema garantiza en el límite (los `soft` en 4,50; `border-control` en 3,43); el CSS no añade ninguna combinación no garantizada (la tapa invertida reutiliza el par del estado).

**`forced-colors`** (emulado en Chromium; tema por defecto claro y el de la auditoría oscuro): ninguna caja cambia de tamaño; contorno en reposo; pulsada con `Highlight` / `HighlightText` y la marca `check` que sigue diciendo el estado; filo de la tapa; marco y lomo del racimo; la elegida del racimo se distingue (la raya, que es una sombra, se sustituye por relleno); huella discontinua; anillo sólido visible.

## Táctil, RTL y tamaños

- **Táctil** (`pointer: coarse`, emulado en Chromium y WebKit a 390 px, tema de la auditoría): área **≥ 44 × 44** centrada en la tapa, en «Deshacer» y en el cuerpo interactivo (también `sm`, racimo `sm` y grupo `sm`); sin desplazamiento horizontal; **un toque** en la tapa deja la huella con el foco en «Deshacer»; un toque en «Deshacer» la devuelve; «Quitar todas» y su «Deshacer» con el dedo funcionan en los dos motores.
- **RTL:** tapa al final lógico, lomo y marca `check` al inicio lógico, avatar al inicio; `undo-2` con `flip-rtl`; `x` y `check` no se espejan. Medido con el tema lustre en los tres motores y a 320 px, LTR y RTL.
- **320 px:** ninguna etiqueta ni racimo fuera de su contenedor, el nombre de faceta en una línea y sin desplazamiento horizontal.
- **Alturas** (medidas): etiqueta `md` 32 px y `sm` 24 con el tema por defecto; 40 y 30 con `space` 5; 26 y 22 con el tema de la auditoría; 50 y 42 con el texto al 200 % en el tema de la auditoría. Alto = `max(space × 6 | × 8, línea de texto + 2 bordes)`: **crece con el texto** y la tapa sigue cuadrada (hallazgo 1 de la auditoría, corregido). La tapa mide alto por alto de borde a borde. El tope de recorte (`space × 60` = 240 px por defecto) **no crece con el texto**: al 200 % se recortan más etiquetas (todas con pista y nombre entero) y las estáticas se parten.
- **Separación** entre etiquetas `space × 2`. **Avatar del hueco:** `GAvatar size="xs"` (`space × 5`), concéntrico y sin cambiar el alto de la etiqueta.

## Movimiento

Con tokens, sin muelle (`--g-ease-spring`) ni rebote (`--g-ease-bounce`), y **nada se anima al montar**.

| Pieza | Qué hace | Tokens |
| --- | --- | --- |
| Recoger huellas | `inline-size` (desde `--_ghost-w` a 0), margen y opacidad: una salida | `--g-duration-fast`, `--g-ease-out` |
| Marca `check` al pulsar | Se abre de 0 a 1em | `--g-duration-press`, `--g-ease-out` |
| Color y fondo (pulsar, huella que aparece, tapa) | Transición de color | `--g-duration-fast`, `--g-ease-standard` |
| Icono de «Quitar»/«Deshacer» al pulsar | `scale` a `--g-press-scale` (con `1` se desactiva) | `--g-press-scale` |
| Vista previa tachada | Aparece sin animar | — |

Con `prefers-reduced-motion: reduce`: la recogida es instantánea (sin anchos intermedios), la marca aparece sin abrirse y el icono de la tapa no escala. `:hover` va solo dentro de `@media (hover: hover)`. Medido en la auditoría: la marca se abre de 0 a 1em con anchos intermedios (con movimiento reducido aparece sin abrirse), la recogida pasa por anchos intermedios con la salida de `--g-duration-fast` y emite un solo `settle` con las etiquetas recogidas (sin anchos intermedios con movimiento reducido), y nada de la etiqueta se anima al montar.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_tag-*`, `--_tgg-*`). **No define tokens nuevos** (DECISIONS #471 y #511), no usa valores de respaldo y no lleva colores literales. En las hojas solo hay literales de `24px`, `44px`, el patrón de texto oculto y el dato `--_ghost-w`; ningún selector toma hijos de tu aplicación por estructura (DECISIONS #383).

| Token | Para qué |
| --- | --- |
| `--g-space-1` | Alturas, relleno, separación, lomo (`× 0.75`), tope de recorte (`× 60`) |
| `--g-color-neutral-soft`, `--g-color-on-neutral-soft` | Etiqueta neutra |
| `--g-color-cat-{1…12}-soft`, `-on-cat-{k}-soft`, `-cat-{k}`, `-on-cat-{k}`, `-cat-{k}-strong`, `-cat-{k}-text` | Categoría (familia condicional); `GTagGroup` solo lee `cat-{k}-text` (lomo) |
| `--g-color-primary`, `-on-primary`, `-primary-strong`, `-primary-text`, `-primary-soft`, `-on-primary-soft` | Alternar pulsada neutra y valor pulsado de un racimo neutro |
| `--g-color-surface`, `--g-color-surface-sunken` | Alternar sin pulsar; valor sin pulsar de un racimo al pasar |
| `--g-color-text`, `-text-muted`, `-text-subtle` | Texto, huella y faceta, deshabilitada |
| `--g-color-border`, `-border-strong`, `-border-control` | Filos, filo de la tapa, contorno de alternar, huella, lomo neutro |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Foco |
| `--g-radius-shape`, `--g-radius-sm` | Forma de la etiqueta y del racimo (la de las acciones del tema, no la píldora fija); anillo del contenedor enfocado por programa |
| `--g-border-width`, `--g-font-ui` | Contornos y texto |
| `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight` | Texto `md` / `sm`; nombre de faceta |
| `--g-press-scale`, `--g-duration-fast`, `--g-duration-press`, `--g-ease-out`, `--g-ease-standard` | Movimiento |

**Forma:** sigue `--g-radius-shape`; con un tema `shape: "pill"` es píldora y con `radius: 0`, cuadrada (medido en el tema de la auditoría y en lustre). **Las categorías vienen del tema** (`categories` en la configuración de `@grana/cli`): sin `categories` en el tema, ninguna etiqueta de categoría tiene relleno.

## SSR

Sin lecturas de `document` ni `window` fuera de `onMounted`. `GTag.ssr.test.js` (3 pruebas) comprueba en servidor el marcado del contrato y el `data-cat` del hash de una quitable con categoría, el `aria-pressed` y la marca de una de alternar, y la lista con nombre, la región viva vacía y los racimos de `GTagGroup`. La huella, la pista visual y las medidas existen solo en el cliente.

## Avisos de desarrollo

Prefijos `[Grana GTag]` y `[Grana GTagGroup]`; una vez por instancia, causa y valor; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| GTag 1 | `role`, `tabindex` o `aria-*` (salvo `aria-describedby`) como atributos | Los ignora; el nombre lo da el texto |
| GTag 2 | `href` con `pressed` no `null` | Ignora `pressed` (enlace) |
| GTag 3 | `color` que no es `'neutral'` ni 1 a 12 | Lo ignora; para estado, `GBadge` |
| GTag 4 | `categories` fuera de 0 a 12 o no entero | Lo trata como `0` |
| GTag 5 | `removable` sin `labels.remove` | Pinta «Quitar» sin nombre |
| GTag 6 | Contenido interactivo en el slot `default` (al montar) | Lo pinta; remite a `href`, `pressed` o `GBtn` |
| GTag 7 | Escucha `onClick` | No se enlaza |
| GTag 8 | `label` ausente o vacía | No pinta la etiqueta |
| Grupo G1 | Sin `label` ni `labelledby` | Pinta la lista sin nombre |
| Grupo G2 | Un `item` sin `id` o con `id` repetido | Omite ese elemento |
| Grupo G3 | Un `item` sin `label` | Lo omite |
| Grupo G4 | Dos etiquetas con control y el mismo texto y la misma faceta | Las pinta; los nombres de «Quitar» no son únicos (usa `facet` o textos distintos) |
| Grupo G5 | Falta una clave de `labels` que se va a usar (o la forma con faceta) | Sin texto en ese sitio, o la forma base |
| Grupo G6 | `limit` con `layout="facets"` | Ignora `limit` |
| Grupo G7 | `layout="facets"` sin ningún `item.facet` | Funciona como `flow` con lomo neutro |
| Grupo G8 | Un `item` con `href` y `pressed`; `color` o `categories` inválidos | Como los avisos 2 a 4 |
| Grupo G9 | Hijos en el slot por defecto | No los pinta; remite a `items` |
| Grupo G10 | `emptyFocus` no se encuentra cuando hace falta | Foco al contenedor del grupo |

## Clases

- **`GTag`:** raíz `<span>` con `g-tag`, `g-tag--size-{sm|md}`, `is-removable`, `is-toggle`, `is-pressed`, `is-link`, `is-disabled`, `is-ghost` (con `--_ghost-w`, solo en un grupo), `is-plain` (valor de un racimo), `data-cat="k"` (solo con categoría). Partes: `__body` (`span`, `a` o `button`), `__check`, `__lead`, `__text`, `__remove`, `__undo`, `__sr`.
- **`GTagGroup`:** `g-tag-group`, `--layout-{flow|facets}`, `--size-{sm|md}`, `is-disabled`. Partes: `__list`, `__item`, `__facet` (con `data-cat`), `__facet-name`, `__values`, `__value`, `__tools`, `__more`, `__clear` (`is-undo` en modo deshacer), `__empty`, `__live`; `is-settling` en `__item` / `__value` mientras se recoge; `data-id` en `__item` / `__value`.
- **Interno:** los datos del `.vue` al CSS (`--_ghost-w`, `is-ghost`, `is-settling`) y la clave de contexto que lleva la huella y el encaminamiento de «Quitar» no son API.

## Limitaciones conocidas

- **En los anuncios manda el último gesto (DECISIONS #514):** dos acciones muy seguidas no se leen juntas; la segunda sustituye a la primera si aún no se leyó. No hay cola.
- **El tope de recorte no crece con el texto** (`space × 60` en píxeles): con el texto al 200 % se recortan más etiquetas (todas con pista y nombre entero) y las estáticas y deshabilitadas se parten en líneas; una deshabilitada quitable partida lleva la tapa del alto entero (50 × 98 px en la auditoría). No es un defecto bloqueante.
- **La cuenta de la lista incluye las huellas** hasta recogerlas: el `li` de una huella sigue contando en «lista, N elementos».
- **Una `GTag` suelta quitable no gestiona el foco ni anuncia:** es de tu aplicación; para eso existe el grupo.
- **Categoría inexistente en el tema:** una etiqueta con `k` mayor que las categorías del tema queda sin relleno y sin aviso.
- **El lomo es un borde:** con `space` fraccionario el navegador lo ajusta a píxeles enteros (3,75 a 3); la diferencia es de 1 px como máximo.
- **`limit` no se combina con `layout="facets"`** (se ignora con aviso).
- **Mismo texto y misma faceta:** dos etiquetas así tienen botones «Quitar» con el mismo nombre (avisa G4); usa `facet` o textos distintos.
- **Necesitas pasar los textos:** sin `labels`, los botones de solo icono no tienen nombre y no hay anuncios.
- **Navegadores:** usa `:has()`, capas CSS, `popover` y `ResizeObserver`. No se midió ningún navegador anterior a los tres motores de Playwright.

## Reservado (fuera de v0.1)

Hoy no existen (DECISIONS #473):

- **C «Palabra»:** `appearance="text"` en `GTagGroup` (etiquetas como palabras en la línea, con su raíz en línea), que se medirá antes dentro de una celda de `GTable`.
- **`GTagInput`** (#338): etiquetas de texto libre que compondrán `GTagGroup` con la huella.
- **Adopción de `GTag` en `GFilterBar`:** ronda propia.
- Solo con consumidor: `limit` con `facets`, reordenar etiquetas, Ctrl/⌘ + Z en el grupo, desactivar la huella (`undo: false`), exportar `categoryOf`, un `categories` por aplicación.

## Verificación

- **Pruebas** (vitest con jsdom): `GTag.test.js` **39 de 39**, `GTag.ssr.test.js` **3 de 3** y `GTagGroup.test.js` **60 de 60**, todas en verde al documentar (ejecutadas de nuevo). Además `src/types.test.js` (los tipos se generan del `meta.json`), que no se ejecutó al documentar.
- **Auditoría de coco** con el componente real publicado (`dist/tag.umd.js` más `dist/grana.umd.js`, `dist/grana.css` y `dist/fonts.css`) y un tema distinto al por defecto (generado con `@grana/cli`): `node design/lab/chip/auditoria-verificar.mjs`. La versión del informe en el árbol de trabajo (`50fc024`) registra **24 279 de 24 279** comprobaciones (estático 543, Chromium 7923, Firefox 7907, WebKit 7906) con tres hallazgos de bruno abiertos como notas (2: «Ver N más» con `disabled`; 3: avatar sin las `categories` del grupo; 5, bloqueante: en WebKit un clic en el «Deshacer» de «Quitar todas» no deshacía). **bruno los cerró en `d585178`** (y el hallazgo 6, la clave del color con `flow`) y anotó en ese commit **24 280 de 24 280** sin notas «HALLAZGO»; las cifras de 24 280 son las de ese commit y el informe `auditoria.md` aún no está actualizado a ese estado. **No se repitió el verificador al documentar.**
- **Specs de bruno** (`tag.spec.mjs`, `personalidad-tag.spec.mjs`, sobre `#sec-tag` del playground): según el commit `d585178`, el spec cubre el deshacer de «Quitar todas» con clic en los tres motores; el informe de coco registra los dos specs de bruno en Chromium con el CSS corregido, **28 de 28**. **No se corrieron al documentar.**
- **Empaquetado** (al documentar, sobre el `dist/` del árbol): `dist/grana.js` no contiene `GTag`; `dist/tag.js`, `dist/tag.umd.js` y `dist/tag.d.ts` existen; `dist/grana.css` contiene las clases de las etiquetas. El peso es el anotado por bruno (10 446 B), con la recompresión de arriba.

## No verificado

- **Lectores de pantalla reales** (VoiceOver, NVDA, JAWS, TalkBack): cómo se anuncian la huella (el `li` sigue contando en la lista), el racimo anidado, el grupo vacío enfocado y los anuncios por último gesto. Solo se comprobó el marcado y el árbol de accesibilidad.
- **Safari real:** el comportamiento de «Deshacer» de «Quitar todas» con ratón y el foco por programa tras un clic se midieron con el WebKit de Playwright, que no es Safari con su sistema.
- **Táctil real** (iOS, Android): el área de 44 px con el dedo y la recogida al tocar fuera solo se emularon.
- **`forced-colors` real** (Windows): emulado solo en Chromium; en Firefox y WebKit, ni siquiera emulado. **Puntero grueso en Firefox:** Playwright no lo emula.
- **Zoom real** de solo texto y de página al 200 y 400 % (aproximado con `html` al 200 %).
- **Cientos de etiquetas:** el rendimiento de la recogida y de un nodo de pista por control no se midió; `limit` lo acota.
- **IME y escrituras mezcladas** más allá del árabe del playground.
- **`RouterLink` y `NuxtLink` reales** con `navigate`: se probó con `preventDefault()` en el playground.
- **Cifras de este README tomadas de otros informes** (peso de bruno, contraste y geometría de coco) y no remedidas al documentar, salvo las marcadas como «ejecutadas de nuevo» o «al documentar».

## Fuentes

- API: [`GTag.meta.json`](./GTag.meta.json), [`GTagGroup.meta.json`](../GTagGroup/GTagGroup.meta.json) · Contrato: [`design/contracts/tag.md`](../../../../../design/contracts/tag.md) (DECISIONS #460 a #473, #505 y #510 a #514) · Ronda de kiwi: [`design/lab/chip/r01/`](../../../../../design/lab/chip/r01/) · Estilo: [`design/lab/chip/estilo.md`](../../../../../design/lab/chip/estilo.md) · Auditoría: [`design/lab/chip/auditoria.md`](../../../../../design/lab/chip/auditoria.md) · Motor de la pista: [`GTooltip`](../GTooltip/README.md) · Frontera: [`GBadge`](../GBadge/README.md), [`GCheckboxGroup`](../GCheckboxGroup/README.md), [`GRadioGroup`](../GRadioGroup/README.md), [`GFilterBar`](../GFilterBar/README.md), [`GCombobox`](../GCombobox/README.md), [`GSummary`](../GSummary/README.md), [`GAvatar`](../GAvatar/README.md)
