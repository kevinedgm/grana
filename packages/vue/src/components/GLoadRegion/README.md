# GLoadRegion

La **región cuyo contenido llega tarde**: envuelve la plantilla de tu aplicación (una lista, un grupo de teselas, una ficha) y se ocupa de **cuándo** se ve la espera, **cuánto** se queda, **qué** se anuncia, **qué pasa con el foco** y de que **la página no se mueva**. En la primera carga la espera **es la propia plantilla sin tinta** (el molde) y la tinta llega a su sitio sin que nada se desplace. Al refrescar, **nada se borra**: lo de antes sigue a la vista, inerte, con un filo y «Actualizando»; lo nuevo llega marcado; y si el refresco falla, **lo conocido se queda**. No pide datos (sin `fetch`): le dices si carga (`loading`), qué hay (`items`) y si falló (`error`). Todo texto visible o accesible lo pones tú en `labels`.

**Etiqueta:** `<g-load-region>` · **Estado:** `candidate` (ver [`design/lab/empty-skeleton/auditoria.md`](../../../../../design/lab/empty-skeleton/auditoria.md) y «Verificación») · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/load-region` (global UMD `GranaLoadRegion`)

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GLoadRegion y GEmpty`, `#sec-load-region`). Exige Vue `^3.5.0` y un navegador actual.

## Instalación: entrada propia

`GLoadRegion` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga. Su compañero [`GEmpty`](../GEmpty/README.md) sí está en el principal.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import LoadRegion, { GLoadRegion } from '@grana/vue/load-region'
import '@grana/vue/style.css'          // el CSS de la región ya está en esta hoja única

createApp(App).use(Grana).use(LoadRegion).mount('#app')   // registra <g-load-region>
// o, sin plugin: components: { GLoadRegion }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/load-region.umd.js` (global `GranaLoadRegion`): `app.use(Grana).use(GranaLoadRegion)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-load-region ...></g-load-region>`.

La entrada exporta `GLoadRegion` y, por defecto, un plugin (`install`) que solo lo registra (y no pisa un registro previo). No hay gestor ni servicio. Los tipos van en `@grana/vue/load-region` (`load-region.d.ts`, generado desde el `meta.json`; la forma de `labels` y del alcance del slot está escrita a mano en `types/shared.d.ts` y `types/overrides.mjs`).

**Peso (DECISIONS #530 y #550).** Entrada propia por el peso conjunto de la Fase C: el principal ya creció 14,8 KiB y `GEmpty`, el motor y la adopción de `GTable` tienen que ir en el principal. bruno anotó el 2026-10-08 en `GLoadRegion.meta.json`: `dist/load-region.js` **4187 bytes gzip** (≈ 4,2 KB) y `dist/load-region.umd.js` **3872**. **Al documentar** se volvió a comprimir el `dist/` del árbol (posterior a las correcciones de bruno) con `gzip -9`: **4333** y **3995** bytes (≈ 4,2 KB): la misma cifra a este nivel de detalle, con un árbol algo posterior; no se afirma más precisión. `GEmpty`, `GBtn`, el `GIcon` interno, el motor de carga (`loadPhase`), el canal de página, `oneOf` y `template` llegan del principal por `__shared` **sin copia**; el CSS va en `grana.css`. Comprobado al documentar: `grana.js` no contiene `GLoadRegion`, `load-region.js` existe y `grana.css` contiene `g-load-region__pill`.

## Qué lo hace distinto

Formas **A «Molde»** y **B «Lo último conocido»**, elegidas por el usuario el 2026-10-08 mirando los prototipos de kiwi (`design/lab/empty-skeleton/r01/`, DECISIONS #529 y #542). **C «La frase»** (forma compacta de una línea) queda reservada con su nombre.

| | Qué hace | Por qué sirve |
| --- | --- | --- |
| **El molde es la plantilla (A)** | En la primera carga la región pinta **tu plantilla real con una muestra** y el CSS le quita la tinta: cada línea de texto es una barra de su largo real, las cajas quedan en contorno. No hay un segundo dibujo de la pantalla que mantener a mano | La espera tiene la forma exacta de lo que va a llegar: un párrafo se parte en las mismas líneas, y lo de debajo no se mueve |
| **La tinta llega a su sitio (A)** | Al llegar los datos, la misma forma recibe su tinta por fundido de color (`--g-duration-slow`): las barras se convierten en el texto **sin desplazarse ni escalar** | Sustituir un esqueleto por el contenido es un salto; aquí no hay sustitución |
| **Nada se borra (B)** | Al refrescar (`refresh="keep"`), lo de antes **sigue a la vista**, inerte, con un **filo de acento** arriba y la píldora «Actualizando»; lo nuevo llega con una marca de acento y, si tu plantilla lo pinta, con la palabra «Nueva»; si el refresco falla, **lo conocido se queda** con una barra de fallo y «Reintentar» | Refrescar lo que se está mirando no es vaciar la pantalla; fallar no es borrarla |
| **Sin parpadeo ni ruido** | Nada se ve antes de 200 ms, lo que se vio se queda al menos 400 ms, y a los 5 s aparece un texto visible y **no queda ninguna animación en curso**. Un solo canal cortés por página, con fusión: diez regiones que cargan a la vez dicen una frase | Una respuesta de 80 ms no deja un destello; una de 6 s no deja un pulso sin fin (WCAG 2.2.2) |
| **El foco nunca cae en `body`** | Si el foco está dentro cuando empieza la carga, pasa a la raíz y vuelve **al mismo control del mismo elemento** (por clave) cuando llegan los datos | Se vuelve a la fila y a la acción donde se estaba, no al principio de la página |

## Qué es y qué no (fronteras)

**Regla de una línea:** *¿una plantilla tuya espera datos? Es un `GLoadRegion` alrededor. ¿Ya tiene `loading` propio (`GTable`, `GCard`, `GWidget`, `GCalendar`)? No la envuelvas. ¿Hay un avance medible? Es un `GProgress`.*

| Necesidad | Usa | No uses |
| --- | --- | --- |
| Una lista, un grupo de teselas o una ficha tuya que espera datos | **`GLoadRegion`** alrededor | Un esqueleto dibujado a mano |
| [`GDataList`](../GDataList/README.md) o [`GMetric`](../GMetric/README.md) que esperan datos | **`GLoadRegion`** alrededor (receta abajo) | Una prop `loading` que no tienen |
| `GTable`, `GCard`, `GWidget`, `GCalendar` con `loading` | Su propio `loading`: ya adoptan el **mismo motor** (retraso, mínimo, 5 s) por dentro | Envolverlos en `GLoadRegion` |
| Una tarea con avance medible (subir, importar, 3 de 24) | [`GProgress`](../GProgress/README.md) (`progressbar` con valor). El molde nunca lleva `role="progressbar"` | `GLoadRegion` |
| Un fallo que afecta a la página y dura (sin conexión, servidor caído) | [`GStatusIsland`](../GStatusIsland/README.md); la región no lo repite con `announceError: false` | La barra de fallo de cada región |
| El resultado de una acción | [`GToast`](../GToast/README.md) | `GLoadRegion` |
| Un control que espera (`loading` de `GBtn`, `GInput`, `GSelect`, `GSwitch`) | El giro del propio control | `GLoadRegion` |
| Las líneas «Cargando» y «Sin resultados» del panel de [`GCombobox`](../GCombobox/README.md) y [`GSelect`](../GSelect/README.md) | Se quedan (son un panel con teclado propio) | `GLoadRegion` |
| El vacío de la región | [`GEmpty`](../GEmpty/README.md), que pintas tú **dentro** de la plantilla con tu `v-if` | Esperar que la región decida el vacío (no lo decide) |

## Uso

### Lo mínimo: una lista

```vue
<script setup>
import { ref } from 'vue'
import { GLoadRegion } from '@grana/vue/load-region'
import { GEmpty } from '@grana/vue'

const cargando = ref(false)
const muestras = ref(null)            // null hasta la primera respuesta
const error = ref(false)

// Muestra del molde: los MISMOS campos que una muestra real, con textos de largo típico y sin datos de personas
const muestra = [
  { id: 's1', nombre: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000' },
  { id: 's2', nombre: 'Tipo · Nombre Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000' },
  { id: 's3', nombre: 'Tipo largo · Nombre Apellido Apellido', meta: 'Recibida el 0 oct · Lote 0000-0000' }
]

const textos = {
  loading: 'Cargando muestras.',
  slow: 'Sigue cargando muestras…',
  loaded: ({ count, fresh }) => `${count} muestras${fresh ? `, ${fresh} nuevas` : ''}.`,
  refreshing: 'Actualizando',
  failed: 'No se pudo actualizar. Lo que ves es lo último que llegó.',
  retry: 'Reintentar'
}

async function cargar() {
  cargando.value = true
  error.value = false
  try {
    muestras.value = await api.muestras()      // se SUSTITUYE el arreglo; no se muta
  } catch {
    error.value = true
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <h3 id="h-muestras">Muestras</h3>
  <g-load-region :loading="cargando" :items="muestras" :sample="muestra" labelledby="h-muestras"
                 :error="error" :labels="textos" @retry="cargar">
    <template #default="{ items, mold, fresh, itemAttrs }">
      <ul v-if="items && items.length">
        <li v-for="m in items" :key="m.id" v-bind="itemAttrs(m)">
          <strong>{{ m.nombre }}</strong>
          <g-badge v-if="fresh(m)" size="sm" variant="soft" color="accent">Nueva</g-badge>
          <span>{{ m.meta }}</span>
        </li>
      </ul>
      <g-empty v-else-if="items && !mold" cause="none" title="Aún no hay muestras"></g-empty>
    </template>
  </g-load-region>
</template>
```

Cinco cosas que hace la región y que no tienes que escribir: **no enseña nada hasta los 200 ms**, mantiene lo que enseñó **al menos 400 ms**, anuncia con `labels`, devuelve el foco por clave y deja `aria-busy` desde el primer instante.

### `items: null` es «aún no sé»; `[]` es «respondió vacío»

La diferencia entre la primera carga (molde) y un vacío conocido que se refresca está en `items`:

| `items` | Qué significa | Qué pinta la región al cargar |
| --- | --- | --- |
| `null` | Aún no se sabe nada | **El molde** de la muestra (primera carga, forma A) |
| `[]` (o un objeto) | La última respuesta fue «vacío» | Lo de antes (el vacío), inerte (`keep`) o su molde (`replace`) |
| Datos | Hay contenido conocido | Los datos, inertes (`keep`) o su molde (`replace`) |

Pasa **`null` hasta la primera respuesta**. Una primera carga con `[]` se toma por «respondió vacío», no pinta el molde y avisa en desarrollo. Al **cambiar de entidad** (otra ficha, otra lista), pon `items` a `null` en el mismo ciclo en que pones `loading` a `true`: la región toma el valor y pinta el molde de la muestra, no los datos de la entidad anterior. Un `Object` (una ficha) vale como un arreglo de uno; las cuentas `{count}` solo existen con un arreglo.

### La región pinta su copia: sustituye `items`, no lo mutes

Lo que se pinta cambia **solo al terminar la carga** (retraso y mínimo incluidos). Si sustituyes `items` antes de poner `loading` a `false`, el cambio espera al final de la fase. Por eso **sustituyes el arreglo** (`muestras.value = nuevas`) en vez de mutarlo en el sitio (`muestras.value.push(...)`): una mutación la vería Vue en la copia y rompería la fase. Lo mismo vale para `error`: se aplica al terminar.

### `sample`: del tamaño de una respuesta típica

La muestra del molde necesita los **mismos campos** que un elemento real y **tantos elementos como una respuesta típica a la vista** (la de una página): de eso depende que lo de debajo no se mueva al llegar. Con más o menos elementos de los esperados, la altura cambia **por elementos enteros**, nunca por un salto dentro de un elemento. Sin `sample`, la primera carga no tiene forma que pintar y avisa. Con textos de largo típico y sin datos de personas reales («Tipo · Nombre Apellido», «Lote 0000-0000»). Recomendado: una muestra no mayor que lo que cabe a la vista, porque el coste es el de pintar la plantilla real.

### Qué pones tú en la plantilla: `data-g-key`, `fresh` y `data-g-known`

El slot por defecto recibe `{ items, mold, fresh, itemAttrs }`:

- **`items`**: lo que hay que pintar (la muestra durante el molde de la primera carga, lo último conocido durante el molde de `replace`, los datos el resto del tiempo; `null` si no hay nada).
- **`mold`**: `true` mientras se pinta como molde.
- **`itemAttrs(item)`**: atributos para el elemento de cada dato (`v-bind="itemAttrs(m)"`): `data-g-key` (la clave, para el foco y la medida del primer hueco) y, si es nuevo, `data-g-fresh`.
- **`fresh(item)`**: `true` si el elemento llegó en esta carga y no estaba en la anterior.

| Atributo | Dónde | Para qué |
| --- | --- | --- |
| `data-g-key` | Elemento de cada dato (con `itemAttrs`) | Vuelta del foco por clave y medida del primer hueco |
| `data-g-fresh` | Lo pone `itemAttrs` en lo nuevo | Marca de acento al inicio lógico, sin cambiar la caja del elemento |
| `data-g-known` | Un elemento cuyo texto ya se sabe (el rótulo de una tesela: «Muestras hoy») | **Conserva su tinta** en el molde: el molde solo cubre lo que falta |

**«Nueva» con texto.** La marca de acento no basta (WCAG 1.4.1): pinta la palabra en tu plantilla con `fresh(item)` (recomendado, un `GBadge` junto al título). La región no inyecta texto en tu plantilla; el anuncio de fin sí cuenta cuántas son nuevas (`{fresh}`).

**`keyBy`** da la clave: un nombre de campo (`'id'` por defecto) o una función `(item) => clave`. Claves repetidas o `undefined` avisan. La clave de lo nuevo se calcula en cualquier carga con contenido conocido antes (también con `replace`), nunca en la primera.

### Lo último conocido (B) o su molde: `refresh`

```vue
<!-- keep (por defecto): lo de antes sigue a la vista, inerte, con filo de acento y píldora -->
<g-load-region :loading="cargando" :items="muestras" :sample="muestra" labelledby="h" :labels="textos">…</g-load-region>

<!-- replace: al refrescar, el molde de lo último conocido (mismo alto exacto) -->
<g-load-region refresh="replace" …>…</g-load-region>
```

`keep` es lo habitual en una administración: lo que se mira sigue, quieto y marcado. `replace` es para dominios donde un dato viejo a la vista confunde (clínico, financiero): decide tu aplicación. Con `keep`, lo de antes queda **inerte desde el primer instante** (nadie actúa sobre datos que se van; `inert` lo saca también del árbol de accesibilidad) y **sin cambio de color**: se dice B con el filo, la píldora, el cursor `progress`, `aria-busy` y el anuncio, no desaturando (para que el texto conserve su contraste).

### Cuando falla: `error`, la barra y `retry`

```vue
<g-load-region :loading="cargando" :items="muestras" :error="error" :labels="textos" @retry="cargar" …>…</g-load-region>
```

`error` es el resultado de la **última carga** (`true`, o el texto del fallo como cadena) y se aplica al terminar:

- **Con contenido conocido a la vista:** lo conocido **se queda**, vuelve a ser usable y lleva encima, **en flujo**, la **barra de fallo** (`circle-alert`, `labels.failed` o el texto de `error`, y «Reintentar» —`GBtn` `sm`, `soft`, `neutral`— con `labels.retry`). La barra empuja el contenido una vez (límite aceptado: un fallo es información nueva que no debe tapar datos). Mientras corre la carga siguiente, la barra no se pinta. Pulsar «Reintentar» emite `retry`; tú pones `error` a `false` y cargas otra vez.
- **Sin contenido conocido** (primera carga que falla): no hay barra. Pinta tú un [`GEmpty cause="error"`](../GEmpty/README.md) en la plantilla (la región anuncia su título).

Para sustituir **el interior** de la barra (por ejemplo, una marca de la isla de estado o un texto propio), usa el slot `failed` con `{ retry, text }`:

```vue
<g-load-region … :error="error" @retry="cargar">
  <template #default="{ items }">…</template>
  <template #failed="{ retry, text }">
    <p>{{ text }}</p>
    <g-btn size="sm" variant="soft" color="neutral" @click="retry">Reintentar</g-btn>
  </template>
</g-load-region>
```

### Isla de estado: `announceError: false`

Si un fallo que afecta a la página lo anuncia ya la isla de estado, la región pinta su barra o el vacío de error pero **no lo anuncia**:

```vue
<g-load-region … :error="error" :announce-error="false" @retry="cargar">
  <template #default="{ items }">…</template>
  <template #failed="{ retry }">
    <g-status-mark for="muestras">No se pudieron cargar</g-status-mark>
    <g-btn size="sm" variant="soft" color="neutral" @click="retry">Reintentar</g-btn>
  </template>
</g-load-region>
```

El slot `failed` con contenido propio está probado en las pruebas de la región (`GLoadRegion.test.js`); **la combinación con una `GStatusMark` real de la isla no se ejecutó al documentar** (receta del contrato, #541).

### `GDataList` y `GMetric`: se envuelven

No tienen `loading` propio. Envuélvelos y pasa la ficha o el valor como `items`:

```vue
<g-load-region :loading="cargando" :items="resumen" :sample="[{ id: 'r', filas: filasMuestra }]" label="Resumen" :labels="textos">
  <template #default="{ items, itemAttrs }">
    <g-data-list v-if="items" v-bind="itemAttrs(items[0])" label="Por canal" :rows="items[0].filas"></g-data-list>
  </template>
</g-load-region>
```

Si tu plantilla no repite elementos, `items` es un arreglo de uno; `itemAttrs(items[0])` da la clave para el foco.

### Un grupo de teselas: la región sin carga propia habla por las que contiene

```vue
<h3 id="h-panel">Panel</h3>
<g-load-region labelledby="h-panel" :labels="{ loading: 'Cargando el panel.', slow: 'Sigue cargando el panel.', loaded: 'Panel actualizado.' }">
  <div class="teselas">
    <g-load-region v-for="t in teselas" :key="t.id" :loading="t.cargando" :items="t.items" :sample="muestraTesela(t)"
                   :label="t.rotulo" :labels="textosTesela">
      <template #default="{ items, itemAttrs }">
        <div v-if="items" v-bind="itemAttrs(items[0])">
          <p data-g-known>{{ items[0].rotulo }}</p>   <!-- su texto ya se sabe: conserva su tinta en el molde -->
          <p>{{ items[0].valor }}</p>
        </div>
      </template>
    </g-load-region>
  </div>
</g-load-region>
```

La región exterior no tiene `loading` propio y **habla por las teselas**: «Cargando el panel.» cuando se ve la primera y «Panel actualizado.» cuando termina la última; ninguna tesela dice nada. Una tesela anidada **no anuncia** si algún ancestro tiene `labels.loading` (hace todo lo demás: fases, molde, foco).

### Movimiento reducido

El revelado (la tinta que llega) es una transición de color con `--g-duration-slow`; con `prefers-reduced-motion: reduce` usa `--g-duration-fast`. No hay otro movimiento. Ver «Movimiento».

## Fases y tiempos

Constantes de diseño del motor (`utils/loadPhase.js`), **no tokens** ni props: **retraso 200 ms**, **mínimo 400 ms** y **espera larga 5000 ms** (DECISIONS #532). Sin props `delay`/`minimum` en v1 (reservadas). Los anfitriones (`GTable`) heredan las mismas.

| Fase | Cuándo | Primera carga (nada conocido) | Refresco `keep` | Refresco `replace` | `aria-busy` | Clases de la raíz |
| --- | --- | --- | --- | --- | --- | --- |
| reposo | sin carga | — | contenido (o vacío) | ídem | `false` | — |
| pendiente | de `loading: true` a 200 ms | molde **invisible**: reserva el sitio | lo de antes a la vista, **inerte** | ídem | `true` | `is-busy` `is-pending` (+ `is-mold` en la primera) |
| a la vista | desde 200 ms | molde visible | lo de antes inerte, **filo** y **píldora** | molde de lo último conocido | `true` | `is-busy` + `is-mold` o `is-stale` |
| espera larga | desde 5000 ms | + texto `labels.slow` | ídem | ídem | `true` | + `is-slow` |
| llegada | `loading: false` y, si se vio, ≥ 400 ms a la vista | datos (con revelado), vacío o error | datos nuevos (lo nuevo marcado) o barra de fallo | datos (con revelado) | `false` | `is-revealing` mientras dura el revelado; `is-failed` con la barra |

- **Si termina antes de 200 ms**, no se enseña nada ni se anuncia el inicio: se pasa a la llegada, sin revelado (el molde no llegó a verse).
- **Si se vio**, el estado visible se queda al menos 400 ms. Coste máximo: 400 ms sobre una respuesta de 201 ms.
- **Una carga que empieza mientras otra se ve** hereda la fase visible (sin volver a esconder ni a esperar el retraso; el mínimo cuenta desde que se vio); el anuncio de inicio no se repite.
- **A los 5 s**: aparece `labels.slow` como una **ficha** a `space × 2` del inicio lógico y del pie de la región, superpuesta y sin mover nada, y **no queda ninguna animación en curso** (WCAG 2.2.2).
- Las fases del revelado son tres: `is-mold`, `is-mold` + `is-revealing`, ninguna. Nunca `is-revealing` sin `is-mold`.

**Medido** (auditoría de coco, tema de la auditoría; los tres motores): a 100 ms nada visible y llegada a ≈ 110 ms; a 250 ms visible a ≈ 212 y llegada a ≈ 611 (**mínimo de 400 ms cumplido**); a 900 ms visible a ≈ 210 y llegada a ≈ 910; a 6000 ms `is-slow` a ≈ 5007 ms en Chromium y WebKit (en Firefox, 5319 frente a 5304 de un `setTimeout` de 5 s de referencia: el retraso es del motor de JavaScript), **0 animaciones en curso a los 5 s** y tres anuncios (inicio, 5 s, fin). Revelado ≈ 236 ms (`--g-duration-slow` 240).

## Anuncios

Un **canal cortés de página** (interno): un solo `<p class="g-load-live" aria-live="polite" aria-atomic="true">` por documento, creado por la primera región que se monta (nunca en el servidor), fuera de toda zona `aria-busy`, retirado cuando se desmonta la última. **Con un `<dialog>` modal abierto se traslada dentro de él** (lo que queda fuera del modal superior es inerte y no se anuncia) y vuelve a `body` al cerrarlo. Se escribe vaciando y escribiendo en el ciclo siguiente. Nunca `assertive`: lo que deba interrumpir es de la isla.

**Fusión:** lo escrito por varias regiones en el mismo ciclo sale en **una** escritura, en orden de llegada, unido con un espacio; un texto idéntico a otro pendiente **no se repite**. Termina tus `labels` con punto.

**Como mucho tres anuncios por carga y región:**

| Momento | Texto | Nota |
| --- | --- | --- |
| Al **verse** la carga (200 ms) | `labels.loading` | Una carga que no se ve no se oye (medido: a 100 ms no se anuncia) |
| A los 5 s | `labels.slow` | Una vez |
| Al **terminar, siempre** (se haya visto la espera o no) | 1) fallo con contenido conocido: `error` (cadena) o `labels.failed` · 2) un `GEmpty` registrado en la plantilla: **su `title`** · 3) `error` sin contenido conocido y sin `GEmpty` registrado: el texto del fallo (si no hay ninguno, nada, nunca `loaded`) · 4) si no, `labels.loaded` con `{count}` y `{fresh}` | Lo que se ve al final es lo que se oye. Con `announceError: false` el fallo no se anuncia |

**Anidación y grupos (solo habla la más externa):** una región dentro de otra que tenga `labels.loading` no anuncia. Una región **sin carga propia** (`loading: false`) que contiene regiones que cargan habla por ellas: `labels.loading` cuando se ve la primera y `labels.loaded` (sin `{count}`) cuando termina la última, **siempre**. El grupo **no anuncia `labels.slow`** (no tiene temporizador propio; las hijas callan): el texto visible de espera larga de cada hija se queda. Un anfitrión con región propia (`GTable`) dentro de una `GLoadRegion` habla por la suya; no se coordinan.

## Foco

1. **El molde nunca toma el foco** (`inert`, 0 enfocables) **y la carga nunca lo roba:** con el foco fuera de la región, nada cambia (medido: «Refrescar la lista» conserva su foco).
2. **Al empezar**, si el foco está **dentro** de lo que queda inerte o desaparece, la región recuerda **dónde** (la clave del `[data-g-key]` más cercano y el **índice** del enfocado entre los enfocables de ese elemento) y **enfoca su raíz** (`tabindex="-1"`, con su nombre; sin desplazar). **Nunca `body`.**
3. **Al llegar**, si el foco sigue en la raíz o en `body`, vuelve al **mismo control del elemento con la misma clave**, o a su primero, o se queda en la raíz si la clave ya no existe.
4. **Fuera de una carga**, la misma regla: si tras un cambio de la plantilla (un filtro local, un `GEmpty` que se desmonta con el foco dentro) el foco cayó en `body`, vuelve por clave o a la raíz.
5. Si la persona movió el foco a otro sitio durante la carga, la región no lo toca.

Medido (tres motores): foco en el enlace de M-0008 y refresco de 900 ms: la raíz lo recibe (con anillo visible, foco tras teclado) y vuelve **al mismo enlace por clave**, sin pasar por `body`; «Reintentar» con Intro: la barra se va, la raíz recibe el foco y se queda; quitar un filtro de un `GEmpty` con Intro: el foco queda en la raíz en todos los cuadros.

## Teclado

Sin teclado propio ni parada de Tab: la raíz lleva `tabindex="-1"` (solo recibe el foco por programa) y el molde y lo de antes en `keep` están `inert`. Todo lo interactivo (los controles de tu plantilla, «Reintentar») son los tuyos, con su Tab, Intro y Espacio.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `loading` | Boolean | `aria-busy` en la raíz desde el inicio; arranca las fases | `false` |
| `items` | Array \| Object \| null | los datos que pinta la plantilla; `null` = aún no se sabe | `null` |
| `sample` | Array \| Object \| null | muestra del molde de la primera carga | `null` |
| `keyBy` | String \| Function | nombre de campo, o `(item) => clave` | `'id'` |
| `refresh` | String | `keep` · `replace` | `keep` |
| `error` | Boolean \| String | `true` o el texto del fallo | `false` |
| `announceError` | Boolean | `false`: el fallo lo anuncia otro (la isla) | `true` |
| `label` | String | nombre del `role="group"` | sin valor |
| `labelledby` | String | id del encabezado que nombra el grupo | sin valor |
| `labels` | Object | ver «Textos» | `{}` |

- **`label` / `labelledby`:** nombre del `role="group"` (normalmente `labelledby` con el id del encabezado de la sección). **Sin ninguno, la raíz no lleva `role`** (un `group` sin nombre no aporta) y avisa: el foco puede llegar a ella y no tendría nombre.
- **El rol es `group`, no `region`:** no es un punto de referencia (habría uno por lista).
- **Atributos:** `class`, `style`, `id` y `data-*` van a la raíz `<div>`.
- **No existen:** `delay`, `minimum`, `cancel`, `moldLimit`, `appearance` (reservados con C), ni evento de fase (la fase es presentación: tu aplicación ya sabe cuándo carga).

## Textos (`labels`)

Sin valores por defecto (Grana es internacional, DECISIONS #226). Cada clave es una **cadena** o, `loaded`, una **función** que recibe `{ count, fresh }`.

| Clave | Marcadores | Uso | Necesaria |
| --- | --- | --- | --- |
| `loading` | — | Anuncio al **verse** la carga (≥ 200 ms). Sin ella la región carga en silencio (válido en regiones secundarias) | Recomendada |
| `slow` | — | Texto **visible** y anuncio, una vez, a los 5 s | Con `loading` |
| `loaded` | `{count}`, `{fresh}` | Anuncio al terminar con datos («4 muestras, 1 nueva.»); como función recibe `{ count, fresh }` | Con `loading` |
| `refreshing` | — | Texto visible de la píldora de B («Actualizando»; `aria-hidden`: lo anunciado es `loading`) | Con `refresh="keep"` |
| `failed` | — | Texto visible y anuncio del fallo con contenido conocido; `error` (cadena) lo sustituye | Con `error` y contenido conocido |
| `retry` | — | El botón de la barra de fallo | Ídem |

`labels.loading`, `labels.slow` y `labels.loaded` van juntos: faltar uno avisa. Con `loaded` como cadena, los marcadores se rellenan; `{count}` solo existe si `items` es un arreglo.

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `retry` | — | La persona pulsa «Reintentar» en la barra de fallo (o llama a `retry()` del slot `failed`) |

Declarado en `emits`. **Métodos expuestos:** ninguno.

## Slots

| Slot | Alcance | Propósito |
| --- | --- | --- |
| `default` | `{ items, mold, fresh, itemAttrs }` | **La plantilla de tu aplicación**, con tu `GEmpty` y su `v-if` |
| `failed` | `{ retry, text }` | Sustituye el **interior** de la barra de fallo (la barra conserva su caja y su sitio); `retry()` emite `retry` |

## Accesibilidad

```html
<p class="g-load-live" aria-live="polite" aria-atomic="true"></p>   <!-- canal de página: uno por documento -->

<div class="g-load-region is-busy is-stale" role="group" aria-labelledby="h-muestras" tabindex="-1" aria-busy="true">
  <div class="g-load-region__failed">…</div>                       <!-- barra de fallo (solo con error y contenido conocido) -->
  <div class="g-load-region__body" aria-hidden="true" inert>…</div> <!-- molde: aria-hidden + inert; keep: inert -->
  <p class="g-load-region__slow">Sigue cargando muestras…</p>      <!-- desde los 5 s, en el árbol -->
  <span class="g-load-region__pill" aria-hidden="true">…Actualizando</span>
</div>
```

- **El molde no es contenido:** decorativo (`aria-hidden` e `inert`), nunca enfocable, nunca `progressbar`. Se anuncia la región, no sus piezas.
- **`aria-busy`** en la raíz desde el inicio de la carga (aunque aún no se vea nada) y `false` en la llegada. Como `aria-busy` solo no lo anuncia la mayoría de lectores, el aviso va por el canal cortés.
- **El texto de la espera larga y la barra de fallo están en el árbol** (son texto real); la píldora no (dice lo mismo que el anuncio).
- **El color nunca va solo** (WCAG 1.4.1): el molde se acompaña de `aria-busy`, el anuncio y el texto visible a los 5 s; lo nuevo, de «Nueva» en tu plantilla.
- **Foco visible** en la raíz cuando lo recibe por programa tras teclado (el anillo de siempre).
- **Áreas:** «Reintentar» es un `GBtn` (≥ 24 × 24, ≥ 44 × 44 con puntero grueso).

**Contraste medido** (auditoría de coco sobre el componente real: **28 configuraciones**, mismas cifras en los tres motores):

| Pieza | Mínimo | Exigido |
| --- | --- | --- |
| Tono del molde (`--g-color-mold`) sobre `surface` (opaco) | **1,46** | ≥ 1,3 y < 3 (que se perciba la forma sin leerse como texto) |
| Espera larga (`text-muted`) | **7,38** | 4,5 |
| Lo conocido en el molde (`data-g-known`) | **7,38** | 4,5 |
| Píldora «Actualizando» | **4,51** | 4,5 |
| Filo de B y marca de lo nuevo (`accent-text`) | **4,52** | 3 |
| B: lo de antes durante el refresco | **Δ 0** (mismo color, sin filtro, opacidad 1) | sin cambio |
| Barra de fallo: texto · icono | **14,08** · 4,53 | 4,5 · 3 |
| «Reintentar» (`soft`, `neutral`) en las barras y el vacío | **4,53** | 4,5 |

El tono del molde no se mide contra 4,5 porque es relleno decorativo con redundancia (`aria-busy`, anuncio y texto a los 5 s).

**`forced-colors`** (emulado en Chromium): la muestra del molde sigue sin tinta; barras y bordes del molde en `GrayText`; `data-g-known` en `CanvasText`; el filo en `Highlight`; la ficha de espera con borde y texto `CanvasText`. Sin esto el sistema anula los fondos y el molde desaparece, o fuerza `color` y la muestra se leería como dato real.

## Táctil, RTL y tamaños

- **Táctil** (`pointer: coarse`, emulado en los tres motores a 390 px, con el tema por defecto y el de la auditoría): todos los `GBtn` de las barras de fallo y los vacíos con área ≥ 44 × 44, ninguna solapada, página sin desborde.
- **RTL:** propiedades lógicas; el molde hereda la dirección de cada línea (también la de `dir="auto"`); la píldora al final lógico (a `space × 4` del borde físico izquierdo en RTL) y la marca de lo nuevo al inicio lógico (a la derecha). Medido con árabe en los tres motores.
- **320 px:** ninguna pieza fuera del contenedor y sin desplazamiento horizontal.
- **Barra de fallo:** 40 px más margen = **46 px** que empuja el contenido una vez.
- **Δ0:** con la muestra del tamaño de la respuesta, lista (con `GAvatar` y `GBadge` dentro), teselas y ficha en texto libre **no mueven nada** al pasar del molde a los datos, con el tema por defecto y el de la auditoría; `refresh="replace"` no mueve ninguna pieza (≤ 0,5 px) en el molde, a mitad del revelado y al final.

## Movimiento

Sin keyframes, sin pulsos ni barridos. El molde es quieto. El único movimiento es el **revelado de A**: una transición de `color`, `text-decoration-color`, `background-color` y `border-color` (y `outline-color`, `box-shadow`) con `--g-duration-slow` y `--g-ease-out`; con `prefers-reduced-motion: reduce`, `--g-duration-fast`. B y la barra de fallo no se animan. **Ninguna animación de carga pasa de 5 s** (DECISIONS #539).

El revelado termina cuando no queda ninguna transición en curso en el cuerpo; al cumplirse el respaldo (duración más 80 ms) las restantes se terminan antes de quitar la fase (≈ 316 ms en Chromium y ≈ 246 en Firefox, DECISIONS #559). Medido: sin animación pasados 400 ms; con movimiento reducido el revelado dura ≈ 121 ms.

**Excepción a la regla de capas.** El molde y su revelado usan `!important`, **y solo ellos**, en reglas con `.is-mold`: tu CSS va sin capa y gana siempre, así que sin `!important` el `color` de tu plantilla pintaría el texto de la muestra como si fuera un dato (y un `text-decoration: none` o una `transition` propia cortarían el fundido). No tienes que tocar nada de tu plantilla.

## Tema

El componente solo lee tokens `--g-*` y alias locales (`--_load-slot`, `--_mold`). No usa valores de respaldo. La hoja solo lleva el literal `0.72em` (el grosor de la barra del molde, constante de la técnica), el patrón de texto oculto accesible y el dato `--_load-slot`.

| Token | Para qué |
| --- | --- |
| `--g-color-mold` | **El tono único del molde** (neutro, opaco, derivado de `text` y `surface`; ≥ 1,3:1 y < 3:1 frente a `surface`, claro y oscuro). Es el único token nuevo de esta pieza (DECISIONS #538); lo definen el tema por defecto (`defaults.css`, claro y oscuro) y el motor de `@grana/cli` (`defaults.js`) |
| `--g-color-accent-text`, `--g-color-accent-soft`, `--g-color-on-accent-soft` | Filo de B y marca de lo nuevo; píldora |
| `--g-color-danger-soft`, `--g-color-on-danger-soft`, `--g-color-text` | Barra de fallo |
| `--g-color-text-muted`, `--g-color-surface`, `--g-color-border`, `--g-color-border-strong`, `--g-radius-md`, `--g-radius-pill` | Espera larga (ficha), `data-g-known` y bordes |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width` | Foco de la raíz |
| `--g-space-*`, `--g-text-body-size`, `--g-text-body-sm-*`, `--g-text-caption-*`, `--g-text-action-weight`, `--g-font-ui` | Medidas y texto de la píldora, la ficha y la barra |
| `--g-duration-slow`, `--g-duration-fast`, `--g-ease-out` | Revelado |

Los de `GBtn` y `GIcon` llegan por composición. `--_load-slot` (el alto del primer `[data-g-key]`, en píxeles) lo escribe el componente en la raíz y lo lee `GEmpty` como alto mínimo.

## SSR

Importar la entrada, el principal y el motor **no toca `document` ni `window`**. Renderizada en servidor con `loading`, la región sale como molde invisible (`class="g-load-region is-busy is-pending is-mold"`, `aria-busy="true"`, `data-g-key` de la muestra), **sin programar temporizadores** (los fija al montar) y **sin crear el canal** `g-load-live`. `GLoadRegion.ssr.test.js` lo comprueba (2 pruebas), junto con un `GEmpty` con salida y una `GTable` cargando.

## Avisos de desarrollo

Prefijo `[Grana] <GLoadRegion>`; una vez por instancia y causa, sin datos de la aplicación; solo fuera de producción.

| # | Causa | Qué hace el componente |
| --- | --- | --- |
| 1 | Una carga sin `labels.loading`, solo si ninguna región que la contiene habla | Carga en silencio |
| 2 | `labels.loading`, `labels.loaded` y `labels.slow` incompletos (van juntos) | Anuncia solo lo que tenga |
| 3 | Refresco `keep` a la vista sin `labels.refreshing` | Píldora sin texto |
| 4 | Barra de fallo sin `labels.failed` (ni `error` como texto), o sin `labels.retry` (y sin slot `failed`) | Barra sin texto o sin nombre en el botón |
| 5 | Primera carga sin `sample` | No hay forma que pintar |
| 6 | Primera carga con `items = []` | Se toma por «respondió vacío» (sin molde); pasa `null` hasta la primera respuesta |
| 7 | Sin `label` ni `labelledby` | La raíz va sin `role="group"` |
| 8 | `keyBy` que devuelve `undefined` o claves repetidas (en `items` o en `sample`) | Esa clave no sirve para el foco ni lo nuevo |

## Clases

Raíz `g-load-region` con `is-busy`, `is-pending`, `is-mold`, `is-stale`, `is-slow`, `is-revealing` (siempre con `is-mold`) e `is-failed`; el estado va en clases del render, no escrito fuera de él. Partes: `__body`, `__failed`, `__failed-icon`, `__failed-text`, `__slow`, `__pill`. Canal de página: `g-load-live`. Datos de tu plantilla: `data-g-key`, `data-g-fresh`, `data-g-known`. `--_load-slot` (en línea) es un dato interno, no API.

## Limitaciones conocidas

- **Δ0 del total** depende de que `sample` tenga el tamaño de una respuesta típica: si llegan más o menos elementos, el alto cambia por elementos enteros.
- **La barra de fallo empuja el contenido una vez** (en flujo, para no tapar datos): 46 px medidos.
- **Molde:** el texto directo de un elemento que también tiene hijos no recibe barra; los controles de formulario dentro del molde quedan como cajas vacías; el coste es el de pintar la plantilla real.
- **`items` se sustituye, no se muta** en el sitio.
- **`inert` en `keep` saca lo de antes del árbol de accesibilidad** mientras dura la carga: quien usa lector no lee datos que se van (decidido), pero tampoco puede releerlos hasta la llegada.
- **Un anfitrión con región propia dentro de una `GLoadRegion` habla por la suya:** no se coordinan.
- **El grupo no anuncia `labels.slow`** (se reserva).
- **`GTable` con celdas compuestas (avatar):** el esqueleto mide 44 px frente a 60 de la fila (tema de la auditoría); la tabla encoge durante la carga y vuelve a crecer. En la tabla simple, 44 = 44. Se cierra con el molde de `GTable` desde una muestra de filas, reservado (DECISIONS #543 y #558).
- **Necesitas pasar los textos:** sin `labels`, la carga es muda.
- **Navegadores:** usa `inert`, `:has()`, capas CSS y `getAnimations`. No se midió ningún navegador anterior a los tres motores de Playwright.

## Reservado (fuera de v0.1)

Hoy no existen (DECISIONS #543 y #549):

- **`appearance="phrase"`** (C «La frase»): la forma compacta de una línea.
- **`delay` y `minimum`** como props; **«Cancelar»** en la espera larga (evento `cancel`, sin `fetch`); **cuenta de avance** en el texto de 5 s (`labels.slow` con `{done}`/`{total}`); **tope de elementos del molde** para listas largas (`moldLimit`).
- **B completo en los anfitriones** (`GTable` con `refresh` `keep`/`replace`), molde de `GTable` desde una muestra de filas y la salida con cuentas calculada por la tabla.
- **Revelado escalonado por elemento** (DECISIONS #549): idea de la segunda tanda de personalidad.

## Verificación

- **Pruebas** (vitest con jsdom, temporizadores falsos, ejecutadas de nuevo al documentar): `GLoadRegion.test.js` **31 de 31**, `loadPhase.test.js` y `liveRegion.test.js` **20 de 20**, `src/load-region.test.js` (la entrada) **9 de 9** y `GLoadRegion.ssr.test.js` **2 de 2** (en la primera pasada, con la máquina cargada, el primer `import` superó el tiempo de espera de 5 s; repetida sola, pasa). `src/types.test.js` no se ejecutó.
- **Specs de navegador** (Playwright, Chromium, puerto 4210, sobre el `dist/` del árbol): `empty.spec.mjs`, `load-region.spec.mjs`, `personalidad-load-region.spec.mjs` y `table-load.spec.mjs`, **45 de 45**, ejecutados al documentar. Los de Firefox y WebKit no se corrieron al documentar.
- **Auditoría de coco** con el componente real publicado (`dist/load-region.umd.js`, `dist/grana.umd.js`, `dist/grana.css` y `dist/fonts.css`) y un tema distinto al por defecto (generado con `@grana/cli`): `node design/lab/empty-skeleton/auditoria-verificar.mjs`. El informe registra **5350 de 5350** comprobaciones (estático 31, Chromium 1777, Firefox 1771, WebKit 1771) con un defecto bloqueante (hallazgo 6: `items: null` y `loading: true` en el mismo ciclo daban un refresco B con lo anterior en vez del molde) y tres menores abiertos para bruno; **bruno los cerró en `93cb273`** (hallazgos 1, 6, 7 y 8) y anotó en ese commit **5353 de 5353** sin las notas de los hallazgos 6 y 8. El informe `auditoria.md` aún muestra el estado anterior y **no se repitió el verificador al documentar**.
- **Empaquetado** (al documentar, sobre el `dist/` del árbol): `grana.js` no contiene `GLoadRegion`; `load-region.js`, `load-region.umd.js` y `load-region.d.ts` existen; `grana.css` contiene `g-load-region__pill`; `load-region.js` no contiene `g-empty__`.

## No verificado

- **Lectores de pantalla reales** (VoiceOver, NVDA, JAWS, TalkBack): si `aria-busy` silencia la región, cómo suena la frase fusionada de varias regiones, la raíz `group` con el foco, el molde oculto en la exploración y el texto de la espera larga. Solo se comprobó el marcado, el árbol de accesibilidad y el canal.
- **Safari real y táctil real** (iOS, Android): el WebKit de Playwright no es Safari con su sistema; el área de 44 px con el dedo se emuló.
- **`forced-colors` real** (Windows) y en Firefox o WebKit: emulado solo en Chromium.
- **Zoom real y texto agrandado:** aproximado con 320 px.
- **CJK y nombres muy largos en el molde.**
- **Rendimiento del molde con 50 a 200 elementos:** no se midió; usa una `sample` corta.
- **Imágenes de tamaño desconocido** en la plantilla.
- **La combinación de `GStatusMark` de la isla dentro del slot `failed`** y la **receta de `GDataList`/`GMetric` envueltos** (que `itemAttrs` llegue a la raíz del componente): son recetas del contrato, no se ejecutaron.
- **`GCard`, `GWidget`, `GCalendar`, `GDialog` y `GSummary`** con el motor común: la segunda entrega de la adopción, fuera de este README y de esta auditoría.
- **Cifras de este README tomadas de otros informes** (peso de bruno, contraste, tiempos y geometría de coco) y no remedidas al documentar, salvo las marcadas como «ejecutadas», «ejecutados» o «al documentar».

## Fuentes

- API: [`GLoadRegion.meta.json`](./GLoadRegion.meta.json) · Contrato: [`design/contracts/load-region.md`](../../../../../design/contracts/load-region.md) (DECISIONS #529 a #548, #550 a #559) · Ronda de kiwi: [`design/lab/empty-skeleton/r01/`](../../../../../design/lab/empty-skeleton/r01/) · Estilo: [`design/lab/empty-skeleton/estilo.md`](../../../../../design/lab/empty-skeleton/estilo.md) · Auditoría: [`design/lab/empty-skeleton/auditoria.md`](../../../../../design/lab/empty-skeleton/auditoria.md) · Compañero: [`GEmpty`](../GEmpty/README.md) · Anfitrión: [`GTable`](../GTable/README.md) · Frontera: [`GStatusIsland`](../GStatusIsland/README.md), [`GProgress`](../GProgress/README.md), [`GToast`](../GToast/README.md), [`GDataList`](../GDataList/README.md), [`GMetric`](../GMetric/README.md), [`GCombobox`](../GCombobox/README.md), [`GSelect`](../GSelect/README.md)
