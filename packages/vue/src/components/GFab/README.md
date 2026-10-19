# GFab

Botón flotante con acciones para **crear o capturar desde cualquier sitio**: un círculo con icono en un borde del visor (o de un contenedor) que, al abrirse, despliega sus acciones con icono y etiqueta siempre visibles. Es un **botón de menú** (APG *Menu Button* + *Menu*) que comparte el motor de teclado de [`GMenu`](../GMenu/README.md) y suma lo que solo tiene algo flotante: sitio en el borde con área segura, convivencia con la voz, el muelle de [`GPageHeader`](../GPageHeader/README.md) y los avisos, confirmación de lo peligroso en la misma fila, acuse en el propio botón y una sola activación por gesto. **No trae color propio** (el relleno es la acción principal del tema), **no pide datos** (sin `fetch`) y **no trae textos**: todo texto visible o accesible lo pones tú.

**Etiqueta:** `<g-fab>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/fab/auditoria.md`](../../../../../design/lab/fab/auditoria.md)) · **Desde:** 0.1.0 · **Entrada:** propia, `@grana/vue/fab` (global UMD `GranaFab`)

> `@grana/vue` está en la versión `0.1.0-beta.0` y aún no se publica en npm. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`, sección `GFab`, `#sec-fab`). Exige Vue `^3.5.0` y un navegador actual.

> **Una sola forma por defecto, una opción.** **A · «La pila que crece»** (por defecto): salen del botón las acciones que caben, la más usada pegada a él. **C · «Acción con cola»** (prop `main`): el botón es la acción principal, con su nombre visible, y una cola abre el resto. La forma **B · «Arco con gesto»** está reservada (`appearance="arc"`, ver [Alcance](#alcance)).

## En esta página

[§ Cuándo usarlo](#cuándo-usarlo) · [§ Uso](#uso) · [§ Ejemplos](#ejemplos) · [§ API](#props) · [§ Formas y estados](#formas-y-estados) · [§ Teclado y foco](#teclado-y-foco) · [§ Posición y convivencia](#posición-y-convivencia-en-el-borde) · [§ Accesibilidad](#accesibilidad) · [§ Personalidad](#personalidad) · [§ Tema](#tema) · [§ Alcance](#alcance) · [§ Verificación](#verificación)

## Cuándo usarlo

**Regla de una línea:** *¿es algo que quieres poder hacer desde cualquier pantalla (crear, capturar, dictar)? Es un `GFab`. ¿Es de esta página o de esta selección? No lo es.*

| Necesito | Uso | No uso |
| --- | --- | --- |
| Crear o capturar desde cualquier pantalla («Nueva muestra», «Subir imagen», «Dictar nota») | **`GFab`** | — |
| Acciones **de la página** (editar, exportar esta vista) | [`GPageHeader`](../GPageHeader/README.md): el zócalo y, en estrecho, su muelle. No pongas la misma acción en los dos | El FAB |
| Acciones **sobre una selección** | La barra de selección de [`GTable`](../GTable/README.md), junto a lo elegido | El FAB |
| Un menú anclado a un botón cualquiera, casillas, opciones, submenús o enlaces | [`GMenu`](../GMenu/README.md) | El FAB: no tiene casillas, opciones, enlaces ni submenús propios |
| Una acción que pide datos | [`GDialog`](../GDialog/README.md) (o [`GHelper`](../GHelper/README.md) para una nota) que abres desde `select` | Un campo dentro del FAB: solo contiene comandos |
| Dictar | Una acción cuyo `select` llama a `speech.start()` de tu aplicación ([`GSpeechHost`](../GSpeechHost/README.md)) | Alojar la voz dentro del FAB |

**¿No es un `GMenu` con otro disparador?** El panel de C sí es, por dentro, el mismo menú: por eso comparten motor. Lo que `GMenu` no tiene y un FAB necesita: sitio fijo en el borde con área segura, convivencia con el resto del borde, que se aparte del foco, velo táctil, orden de las acciones que nace del botón, pila con cola, confirmación en el sitio, acuse y una activación por gesto.

## Uso

`GFab` **no** viaja en `@grana/vue`: ni lo exporta ni lo registra su `install`. Va en su propia entrada y quien no lo usa no lo paga.

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import Fab, { GFab } from '@grana/vue/fab'
import '@grana/vue/style.css'          // el CSS del FAB ya está en esta hoja única

createApp(App).use(Grana).use(Fab).mount('#app')   // registra <g-fab>
// o, sin plugin: components: { GFab }
```

Sin empaquetador, carga en orden `vue.global.js`, `dist/grana.umd.js` (global `Grana`) y `dist/fab.umd.js` (global `GranaFab`): `app.use(Grana).use(GranaFab)`. En plantillas dentro del HTML (sin compilar), Vue no admite etiquetas de componente autocerradas: escribe `<g-fab ...></g-fab>`.

La entrada exporta `GFab` y, por defecto, un plugin (`install`) que solo lo registra (y no pisa un registro previo). No hay gestor ni servicio. Los tipos van en `@grana/vue/fab` (`fab.d.ts`, generado desde el `meta.json`; la forma de `items` y de la carga de `select` está escrita a mano en `types/overrides.mjs`).

Lo mínimo, en A:

```vue
<!-- Fragmento: `alSeleccionar` es de tu aplicación -->
<GFab
  label="Crear y capturar"
  :items="[
    { id: 'sample', label: 'Nueva muestra', icon: 'pencil' },
    { id: 'photo',  label: 'Subir imagen',  icon: 'image' },
    { id: 'note',   label: 'Nueva nota',    icon: 'file-text' },
  ]"
  @select="alSeleccionar"
/>
```

Los iconos de las acciones son **nombres de Lucide** de tu aplicación (el registro de `createIcons`, o la lista de la librería). El nombre que no existe deja el hueco vacío con el aviso de [`GIcon`](../GIcon/README.md).

**Peso.** La entrada pesa **10 136 B gzip** (`dist/fab.js`, nivel `medido` por bruno el 2026-10-18; coco midió 10 147 B en la auditoría: el ruido entre compilaciones es de ±60 B) y `fab.umd.js` 9 248 B, dentro del tope de 10 496 B (DECISIONS #676). En producción, minificada y sin los avisos de desarrollo, lo que paga la aplicación es ≈ 8,3 KiB (8 453 B, medido por lima en una copia aislada). `GBtn`, `GTooltip`, los dos `GIcon`, el motor de menú, el registro de reservas de borde y las utilidades de posición llegan del principal por `__shared`, **sin copia**; el CSS va en `grana.css`. En el paquete principal solo crecen el motor de menú extraído de `GMenu` (`utils/menuNav.js`) y `EDGE_ORDER.fab`: **+461 B gzip** (215 555 → 216 016 B, medido por bruno; presupuesto de 512 B).

## Ejemplos

Los ejemplos montan el componente real con `anchor="container"` dentro de un marco con `position: relative` (la aplicación pone esa posición en el contenedor). Con el valor por defecto, `viewport`, el botón va fijo al borde del visor.

### e1 · Una sola acción: el botón es la acción

```vue demo
<script setup>
import { ref } from 'vue'
const ultima = ref('ninguna')
</script>
<template>
  <p>Última acción: <strong>{{ ultima }}</strong></p>
  <div style="position: relative; block-size: 220px; border: var(--g-border-width) solid var(--g-color-border-strong); border-radius: var(--g-radius-md);">
    <GFab
      anchor="container"
      :items="[{ id: 'sample', label: 'Nueva muestra', icon: 'pencil' }]"
      @select="ultima = $event.id"
    />
  </div>
</template>
```

**Por qué:** con una sola acción no hay menú; esconderla detrás de un despliegue cuesta un toque más y no aporta nada. El botón **es** esa acción: se nombra como ella (`label` no hace falta), un toque la ejecuta y no lleva `aria-haspopup`. Sin acciones (por ejemplo, un permiso las quitó todas), no se pinta nada y no hay aviso.

### e2 · Tres acciones: la pila

```vue demo
<template>
  <div style="position: relative; block-size: 320px; border: var(--g-border-width) solid var(--g-color-border-strong); border-radius: var(--g-radius-md);">
    <GFab
      label="Crear y capturar"
      anchor="container"
      :items="[
        { id: 'sample', label: 'Nueva muestra', icon: 'pencil' },
        { id: 'photo',  label: 'Subir imagen',  icon: 'image' },
        { id: 'note',   label: 'Nueva nota',    icon: 'file-text' },
      ]"
    />
  </div>
</template>
```

**Por qué:** es el caso de las acciones que caben. Salen del botón como píldoras con icono y etiqueta, **la primera de `items` pegada al botón**. El orden del arreglo es el de frecuencia: pon primero la que más se usa. Úsalo cuando todas caben (hasta 5) y la aplicación no necesita agruparlas.

### e3 · Seis acciones: «Más acciones (N)» y las primeras no se mueven

```vue demo
<template>
  <div style="position: relative; block-size: 420px; border: var(--g-border-width) solid var(--g-color-border-strong); border-radius: var(--g-radius-md);">
    <GFab
      label="Crear y capturar"
      anchor="container"
      :labels="{ more: 'Más acciones ({count})' }"
      :items="[
        { id: 'sample', label: 'Nueva muestra',  icon: 'pencil' },
        { id: 'photo',  label: 'Subir imagen',   icon: 'image' },
        { id: 'note',   label: 'Nueva nota',     icon: 'file-text' },
        { id: 'upload', label: 'Subir archivo',  icon: 'upload' },
        { id: 'agenda', label: 'Programar toma', icon: 'calendar', group: 'Planear' },
        { id: 'print',  label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
      ]"
    />
  </div>
</template>
```

**Por qué:** pasar de 5 a 6 acciones **no cambia de forma**: las cuatro primeras siguen donde estaban y aparece «Más acciones (2)», que abre el resto **agrupado por `group`**. La memoria del gesto manda: añadir acciones cambia la cola, no el sitio de lo aprendido. Necesita `labels.more`; sin él, el resto se abre en un panel directo y avisa en desarrollo (aviso 11).

### e4 · Quince acciones, una peligrosa y el acuse en el botón

```vue demo
<script setup>
const espera = (ms, ok, texto) => new Promise((resolver, rechazar) => {
  setTimeout(() => (ok ? resolver(texto) : rechazar({ message: texto })), ms)
})

const items = [
  { id: 'sample', label: 'Nueva muestra',  icon: 'pencil', description: 'Registro con código de barras' },
  { id: 'photo',  label: 'Subir imagen',   icon: 'image' },
  { id: 'note',   label: 'Nueva nota',     icon: 'file-text' },
  { id: 'upload', label: 'Subir archivo',  icon: 'upload', description: 'PDF, imagen o CSV' },
  { id: 'agenda', label: 'Programar toma', icon: 'calendar' },
  { id: 'csv',    label: 'Exportar CSV',   icon: 'download', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
  { id: 'print',  label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
  { id: 'share',  label: 'Compartir lote', icon: 'share-2', group: 'Compartir', description: 'Con el equipo del laboratorio' },
  { id: 'mail',   label: 'Enviar por correo', icon: 'mail', group: 'Compartir' },
  { id: 'link',   label: 'Copiar enlace',  icon: 'globe', group: 'Compartir' },
  { id: 'tag',    label: 'Etiquetar',      icon: 'tag', group: 'Organizar' },
  { id: 'move',   label: 'Mover a carpeta', icon: 'folder', group: 'Organizar' },
  { id: 'copy',   label: 'Duplicar',       icon: 'copy', group: 'Organizar' },
  { id: 'prefs',  label: 'Preferencias',   icon: 'settings', group: 'Mantenimiento', disabled: 'Solo para coordinación' },
  { id: 'purge',  label: 'Vaciar borradores', icon: 'trash', group: 'Mantenimiento', danger: true,
    confirm: '¿Vaciar los 12 borradores?', confirmLabel: 'Vaciar' },
]

function alSeleccionar(evento) {
  if (evento.id === 'csv') evento.waitUntil(espera(1200, true, 'CSV exportado'))
  if (evento.id === 'photo') evento.waitUntil(espera(800, false, 'Sin conexión'))
}
</script>
<template>
  <div style="position: relative; block-size: 480px; border: var(--g-border-width) solid var(--g-color-border-strong); border-radius: var(--g-radius-md);">
    <GFab
      label="Crear y capturar"
      anchor="container"
      :items="items"
      :labels="{
        more: 'Más acciones ({count})',
        cancel: 'Cancelar',
        busy: 'En curso…',
        done: 'Hecho',
        failed: 'No se pudo',
      }"
      @select="alSeleccionar"
    />
  </div>
</template>
```

**Por qué:** es el caso real de un producto con muchas acciones. Quince es la **guía de diseño**, no un tope: con más se pintan todas (en el panel) y el aviso 14 sugiere una página de acciones. Las que no caben se agrupan con `group` y `description`; la deshabilitada con motivo (`disabled: 'texto'`) sigue enfocable y enseña por qué; la peligrosa **parte su fila en «Cancelar» y «Vaciar»** sin mover nada más (necesita `labels.cancel`, o queda inoperable por seguridad); y el ticket de `select` da el acuse en el propio botón: «Exportar CSV» tarda y termina con su texto, «Subir imagen» falla con su motivo y se puede reintentar (`retry: true`). Pruébalo con el teclado: Intro abre en la primera, la flecha contraria en la más lejana.

### e5 · Acción con cola: la principal a un toque

```vue demo
<script setup>
import { ref } from 'vue'
const ultima = ref('ninguna')
const items = [
  { id: 'sample', label: 'Nueva muestra',  icon: 'pencil' },
  { id: 'photo',  label: 'Subir imagen',   icon: 'image' },
  { id: 'note',   label: 'Nueva nota',     icon: 'file-text', description: 'Texto libre ligado a la muestra' },
  { id: 'csv',    label: 'Exportar CSV',   icon: 'download', group: 'Exportar', description: 'Lo filtrado, en UTF-8' },
  { id: 'print',  label: 'Imprimir etiquetas', icon: 'printer', group: 'Exportar' },
  { id: 'share',  label: 'Compartir lote', icon: 'share-2', group: 'Compartir', description: 'Con el equipo del laboratorio' },
  { id: 'mail',   label: 'Enviar por correo', icon: 'mail', group: 'Compartir' },
]
</script>
<template>
  <p>Última acción: <strong>{{ ultima }}</strong> · en el panel, escribe «exp» o «equipo».</p>
  <div style="position: relative; block-size: 420px; border: var(--g-border-width) solid var(--g-color-border-strong); border-radius: var(--g-radius-md);">
    <GFab
      label="Crear y capturar"
      anchor="container"
      main="sample"
      :items="items"
      :labels="{
        moreShort: 'Más acciones',
        findHint: 'Escribe para buscar',
        matches: '{count} acciones',
        matchesOne: '1 acción',
        none: 'Ninguna acción con',
      }"
      @select="ultima = $event.id"
    />
  </div>
</template>
```

**Por qué:** cuando **una acción domina** («Nueva muestra»), esconderla detrás de un despliegue cobra dos toques por todo. Con `main` el botón es esa acción, con su etiqueta visible, y pegada lleva la cola «Más acciones». El panel de la cola **filtra al escribir**, sin campo: «exp» deja «Exportar CSV» y lo escrito se ve en la cabecera con su recuento. No lo uses si no hay una acción dominante: la principal la elige tu aplicación y, si miente, el botón miente.

### e6 · Dictar desde el FAB, con la voz en el mismo borde

```vue
<!-- Fragmento: `items`, `labels`, `nuevaMuestra` y `subirImagen` son de tu aplicación; la voz la creó `createSpeech` -->
<script setup>
import { useSpeech } from '@grana/vue/speech'

const speech = useSpeech()

function alSeleccionar({ id }) {
  if (id === 'sample') nuevaMuestra()
  else if (id === 'photo') subirImagen()
  else if (id === 'note') speech.start({ mode: 'dictation' })   // dictar es una acción más
}
</script>

<template>
  <GFab label="Crear y capturar" :items="items" :labels="labels" @select="alSeleccionar" />
</template>
```

**Por qué:** el FAB no aloja la voz. «Dictar nota» es una acción más que llama a `speech.start()`; la pill de la voz y el FAB comparten el borde sin solaparse (orden en [Posición y convivencia](#posición-y-convivencia-en-el-borde)). Úsalo cuando dictar es una de las cosas que se capturan, no cuando la voz es la protagonista de la pantalla.

## Props

| Prop | Tipo | Valores | Default | Descripción |
| --- | --- | --- | --- | --- |
| `items` | `Array` | ver [Elementos](#elementos-items) | `[]` | Acciones. El **orden del arreglo es el de frecuencia**: la primera, la más cercana al botón. Sin `label` o sin `id` no se pinta (avisos 3 y 4); un `id` repetido se pinta (aviso 5); más de 15 se pintan todas (aviso 14) |
| `modelValue` (`v-model`) | `Boolean` | | sin valor | Abierto. Con valor, **controlado** (emite `update:modelValue` y no cambia por su cuenta); sin valor, guarda su estado y emite igual. `true` con una sola acción, sin acciones o bajo un modal no abre (aviso 12) |
| `label` | `String` | texto | — | Nombre del botón (A) o del grupo principal + cola (C). **Obligatorio salvo con una sola acción** (aviso 2) |
| `main` | `String \| Number` | `id` de una acción | — | `id` de la acción principal: activa C. Se ignora (forma A) si no es pintable, si es peligrosa o si falta `labels.moreShort` (avisos 8, 9 y 11) |
| `appearance` | `String` | `'auto'` `'panel'` | `'auto'` | `auto`: política de A (pila, pila con cola o panel según el sitio, con alturas medidas); `panel`: siempre panel. `arc` está reservado (B): avisa (aviso 10) y se comporta como `auto`. Con `main` no cuenta |
| `position` | `String` | `'bottom-end'` `'bottom-start'` `'bottom-center'` `'top-end'` `'top-start'` `'top-center'` | `'bottom-end'` | Borde y alineación **lógicos** (`start`/`end` siguen a `dir`). Abajo la lista sube; arriba baja |
| `anchor` | `String` | `'viewport'` `'container'` | `'viewport'` | `viewport`: fijo al visor, publica y lee reservas de borde. `container`: absoluto en el antecesor posicionado, sin reservas (sin uno de la aplicación, aviso 15) |
| `offset` | `Object` | `{ top?, bottom? }` | `{}` | Longitudes CSS (o `px` en número) que se suman al margen seguro de su borde; la del lado contrario limita el alto de la lista |
| `closeOnSelect` | `String` | `'auto'` `'never'` | `'auto'` | `auto` cierra al elegir (`event.preventDefault()` en `select` lo mantiene abierto esa vez); `never` no cierra |
| `labels` | `Object` | ver [Textos](#textos-labels) | `{}` | Textos, **sin valores por defecto**. Los que llevan `{count}` admiten una función `({ count }) => string` |
| `id` | `String` | | generado (SSR-seguro) | Base de los ids: raíz, `{id}-trigger`, `{id}-main`, `{id}-menu`, `{id}-tail` y `{id}-more` |

`class`, `style` y `data-*` van a la **raíz** (`div.g-fab`).

No hay `color` (el botón es la acción principal de la pantalla y lee la familia `primary`), `size`, `density`, `variant`, `disabled` (se deshabilitan las acciones, no el lanzador), `showLabels` (las etiquetas siempre se ven) ni `direction` (se deriva de `position`).

### Elementos (`items`)

```js
{
  id: 'csv',                    // String | Number, obligatorio, único
  label: 'Exportar CSV',        // String, obligatorio: el nombre accesible
  icon: 'file-down',            // nombre de Lucide, opcional
  description: 'Lo filtrado…',  // opcional
  group: 'Exportar',            // opcional
  disabled: 'Sin conexión',     // Boolean | String (motivo visible), opcional
  danger: true,                 // opcional
  confirm: '¿Vaciar…?',         // String | false, solo con danger
  confirmLabel: 'Vaciar',       // solo con danger y confirm
}
```

| Campo | Tipo | Regla |
| --- | --- | --- |
| `id` | `String \| Number` | **Obligatorio y único.** Sin él no se pinta (aviso 4). Repetido, se pintan **los dos** (aviso 5): `select` lleva `item` para distinguirlos y el acuse va por elemento, no por `id` |
| `label` | `String` | **Obligatorio.** Sin él no se pinta (aviso 3): una acción sin nombre no se puede anunciar ni operar. La letra y el filtro buscan aquí |
| `icon` | `String` | Nombre de Lucide de tu aplicación. La pila y el panel funcionan sin icono |
| `description` | `String` | En el **panel**, segunda línea visible y `aria-describedby`. En la **pila** no se pinta (la píldora es una línea) pero sigue como descripción accesible. La busca el filtro de C |
| `group` | `String` | Título del grupo **en el panel**; los grupos van por primera aparición y los elementos sin `group` primero, sin título. En la pila no hay grupos: manda la frecuencia |
| `disabled` | `Boolean \| String` | `aria-disabled="true"`, **sigue enfocable**; no ejecuta ni cierra. Con `String`, ese motivo es su descripción visible |
| `danger` | `Boolean` | Marca de forma (`triangle-alert`, decorativa) y color de peligro, nunca solo color. Pide confirmación en el sitio |
| `confirm` | `String \| false` | Solo con `danger`. `String`: la pregunta. `false`: sin confirmación (solo si tu aplicación ofrece «Deshacer»). Ausente con `danger`: confirma igual con la `label` como pregunta (aviso 6). Sin `danger`, se ignora (aviso 7) |
| `confirmLabel` | `String` | Texto del botón que confirma; sin él, la `label` |

Sin manejador por elemento (escucha `select`), sin `order`, sin `shortcut` y sin `href`: un FAB no navega. Un destino es un [`GMenu`](../GMenu/README.md) con elementos-enlace, o la navegación de tu aplicación dentro de `select`.

### Textos (`labels`)

Sin valores por defecto. Cada clave se necesita solo en el caso que dice; si falta, el componente tiene una salida segura y avisa en desarrollo (aviso 11).

| Clave | Para qué | Cuándo hace falta | Sin ella |
| --- | --- | --- | --- |
| `more` | Nombre de la cola de A («Más acciones ({count})»; `{count}` = acciones en el panel) | Hay cola | Panel directo, sin cola |
| `moreShort` | Nombre de la cola de C («Más acciones») | Con `main` y resto no vacío | `main` se ignora: forma A |
| `cancel` | «Cancelar» del par de confirmación | Alguna peligrosa que confirma | Esas acciones quedan `aria-disabled` (fallo seguro: nada destructivo sin poder cancelar) |
| `findHint` | Pista visible del panel de C | C | Sin filtro: salta por letra |
| `matches` (`{count}`), `matchesOne` | Recuento del filtro, en la cabecera y en el anuncio | C | Igual que `findHint` (van juntas) |
| `none` | Sin coincidencias («Ninguna acción con») | C | Igual |
| `busy`, `done`, `failed` | Texto del acuse cuando el ticket no lo trae | Opcional | Insignia sin texto ni anuncio |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `select` | `FabSelectEvent` | Se activa una acción: también la principal de C, la única de `single` y la confirmación de una peligrosa. **Nunca** una deshabilitada, una en curso, la cola ni «Cancelar». Es síncrono en el gesto |
| `update:modelValue` | `Boolean` | Se abre o cierra por una vía del usuario (con o sin `v-model`) |
| `open` | — | La lista ya se muestra |
| `closed` | — | La lista ya se ocultó |

### La carga de `select`: el ticket del acuse

```ts
type FabSelectEvent = {
  id: string | number
  item: FabItem            // el objeto de items (distingue ids repetidos)
  event: Event             // nativo; event.preventDefault() mantiene abierto esa vez
  retry: boolean           // la acción venía de un fallo
  busy(text?: string): void
  done(text?: string): void
  failed(text?: string): void
  cancel(): void
  waitUntil(p: Promise<string | { message?: string } | boolean | null | void>): void
}
```

- **`waitUntil(promesa)`** equivale a `busy()` y, al asentarse: un `String` o `{ message }` → `done(texto)`; `true` → `done()`; `false`, `null` o `undefined` → `cancel()`; un rechazo `{ message? }` → `failed(message)`. Es la vía normal.
- **Sin ticket no hay acuse:** el FAB nunca muestra un éxito que no se confirmó.
- El ticket vale hasta asentarse o hasta que **ese mismo elemento** vuelve a empezar; puedes usarlo más tarde (tras un `GDialog` de tu aplicación). Una llamada fuera de tiempo se ignora y avisa (aviso 13).
- Si la acción abre un [`GDialog`](../GDialog/README.md) desde el manejador, el diálogo recibe el foco y, al cerrarse, lo devuelve al botón.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `trigger-icon` | `{ open: boolean }` | Icono del botón contraído en A (sustituye a `plus`; decorativo, un `<GIcon>` dentro). En C no se usa: la principal lleva el icono de su elemento |

## Formas y estados

### Qué se pinta según los datos

| Caso | Qué se pinta | `data-appearance` |
| --- | --- | --- |
| `items` vacío (tras validar) | **Nada**: ni botón ni panel vacío; sin aviso (los permisos pueden quitarlas todas) | — |
| Una sola acción, sin `main` | El botón **es** esa acción: solo icono, nombre = su `label`, un toque la ejecuta, sin `aria-haspopup` | `single` |
| `main` y el resto vacío | La principal de C sola (icono + etiqueta), sin cola | `single` |
| `main` (C) | Grupo principal + cola; la cola abre el **panel** | `main` en la raíz; `panel` en la lista |
| `appearance="auto"` (A) | Pila, pila con cola o panel según la política | `stack` · `panel` |
| `appearance="panel"` | Panel directo | `panel` |

### La política de A: cuántas caben

`k₀ = min(n, 5, ⌊(H + g) / (p + g)⌋)`, con `n` las acciones pintables, `H` el espacio entre el botón y el margen seguro del lado hacia el que crece, `p` el alto de una píldora (`max(24px, space × 10)`; 44px con puntero grueso) y `g` la separación (`space × 2`). El componente **mide** las alturas reales (una píldora con motivo o una etiqueta partida en dos líneas ocupan más) y baja `k` de uno en uno mientras la pila no quepa; nunca lo sube por encima de `k₀`.

- `n ≤ k`: todas en la pila. `n > k ≥ 2`: `k − 1` píldoras + «Más acciones (N)». `k ≤ 1`: panel directo.
- `k` se calcula **al abrir**, **al redimensionar** con la lista abierta y **cuando la pila abierta deja de caber**; nunca al desplazar.
- **Promesa de A:** con el mismo `H`, pasar de 6 a 10 o 15 acciones **no mueve** ninguna de las cuatro primeras (Δ ≤ 0,5 px; medido Δ 0,00 px).

### El panel

- Contiene las acciones que no están en la pila (A), todas (`appearance="panel"`) o todas menos `main` (C), **agrupadas por `group`** en el orden escrito, con descripciones visibles.
- Ancho: `min(space × 80, ancho disponible)`; en **estrecho** (menos de `space × 130`), todo el ancho menos los márgenes.
- Alto: el espacio entre el botón y el margen seguro; si el contenido es mayor, **el panel se desplaza** y el botón (el cierre) queda siempre fuera y visible.
- En A con cola, el panel va **encima de la pila** si en ese lado quedan al menos `space × 40`; si no, **la cubre entera** y nunca es más estrecho que ella, para que nada de la pila asome. Abrir el panel no mueve la pila.

### Estados

| Estado | `data-state` | Comportamiento |
| --- | --- | --- |
| Contraído | `closed` | Lista oculta y fuera del árbol de accesibilidad; `aria-expanded="false"`; reserva de borde publicada |
| Abriéndose | `opening` | Dos cuadros: la lista ya es operable y tiene el foco; el segundo clic de una ráfaga se ignora |
| Abierto | `open` | Foco itinerante en la lista; el botón no se aparta |
| Cerrándose | `closing` | La lista es **inerte**. Volver a abrir durante la salida la cancela y pasa directo a `open` |
| Deshabilitadas | — | `aria-disabled`, enfocables, con su motivo visible. **Todas** deshabilitadas: el botón abre igual y enseña los motivos. Una sola (`single`): el botón lleva `aria-disabled` y el motivo es el detalle de su tooltip |
| Acción en curso | `data-ack="busy"` | Insignia que gira, el texto como descripción del botón, anuncio cortés; la acción queda `aria-disabled` con ese texto (no se lanza dos veces) pero **no se pinta como no disponible** |
| Hecha | `data-ack="done"` | Insignia `check` durante 4000 ms y anuncio; la acción vuelve a estar disponible |
| Fallida | `data-ack="failed"` | Insignia de fallo y anuncio; el motivo queda visible en la acción (en color de peligro) y se puede reintentar (`retry: true`) |
| Apartado | `is-tucked` | Ver [Posición y convivencia](#posición-y-convivencia-en-el-borde) |
| Bajo un modal | — | La lista se cierra sin mover el foco y el botón queda inerte bajo el fondo |

Con varias acciones a la vez, cada elemento tiene su estado; la insignia muestra el más prioritario (en curso, fallo, hecho). Una `single` o la principal de C **deshabilitadas** se apagan como un `GBtn` deshabilitado (relleno neutro, icono y etiqueta tenues, contorno de control, `cursor: not-allowed`) y no cambian al pasar ni al apretar.

### Errores de configuración

Nunca lanza y nunca descarta en silencio: pinta lo que se puede pintar y avisa en desarrollo (`[Grana GFab]`, una vez por instancia y motivo; sin avisos en producción).

| # | Cuándo | Qué hace |
| --- | --- | --- |
| 1 | `items` no es un arreglo | No pinta nada |
| 2 | Más de una acción y sin `label` | Pinta; el botón (o el grupo de C) sin nombre |
| 3 | Elemento sin `label` | No lo pinta |
| 4 | Elemento sin `id` | No lo pinta |
| 5 | `id` repetido | Pinta **los dos**; `select` lleva `item`; el acuse va por elemento |
| 6 | `danger` sin `confirm` | Confirma con la `label` como pregunta |
| 7 | `confirm` o `confirmLabel` sin `danger` | Los ignora |
| 8 | `main` que no es una acción pintable | Lo ignora: forma A |
| 9 | `main` que apunta a una peligrosa | Lo ignora: forma A (lo destructivo no va a un toque) |
| 10 | `appearance="arc"` (reservado) | Se comporta como `auto` |
| 11 | Falta un texto de `labels` que hace falta | La salida de la tabla de [Textos](#textos-labels) |
| 12 | `modelValue` `true` sin nada que abrir | No abre |
| 13 | Un método del ticket tras asentarse o ser sustituido | Lo ignora |
| 14 | **Más de 15** acciones | Pinta **todas** (el resto, en el panel); el límite es una guía de diseño, no un recorte |
| 15 | `anchor="container"` sin antecesor posicionado de la aplicación | Funciona como `viewport`, sin reservas |

Con **18 elementos, un duplicado y uno sin nombre**, se pintan 17 y salen 3 avisos (nivel `prueba`, `GFab.test.js`).

## Teclado y foco

| Tecla | Dónde | Efecto |
| --- | --- | --- |
| Intro · Espacio | Botón o cola | Abre con el foco en la **primera por frecuencia**. En `single` y en la principal de C, ejecuta |
| Flecha hacia la lista · la contraria | Botón o cola | Abre en la primera · en la **más lejana** (con el botón abajo, ↑ hacia la lista y ↓ la contraria) |
| ↑ ↓ | Lista | Anterior · siguiente en el DOM, **cíclico** (en la pila que sube, ↑ se aleja del botón y ↓ se acerca) |
| Inicio · Fin | Lista | Primer · último del DOM |
| Letra | Pila, panel de A y `appearance="panel"` | Salta a la siguiente acción cuya **etiqueta** empieza por lo escrito (búfer de 500 ms) |
| Letra · Retroceso | Panel de C | **Filtra** por «contiene» sobre etiqueta y descripción, sin mayúsculas ni diacríticos · corrige |
| Intro · Espacio | Lista | Activa. En C, Espacio no forma parte de lo escrito |
| → (← en RTL) · Intro · Espacio | Cola «Más acciones» de A | Abre su panel con el foco en su primera |
| ← (→ en RTL) · Esc | Panel de la cola de A | Vuelve a la cola |
| ← → | Par de confirmación | Entre «Cancelar» y la confirmación (espejadas en RTL) |
| Esc | Lista | **Un paso por pulsación**: deshace la confirmación armada → limpia lo escrito (C) → cierra el panel de la cola (A) → cierra y devuelve el foco al botón. La Esc repetida se ignora |
| Tab · Mayús+Tab | Lista | Cierra; el foco sigue su curso **desde el botón** (en C, hacia atrás es la principal) |

- **Foco al cerrar:** Esc, elegir y pulsar el botón lo devuelven **al botón** (en C, a la cola; tras elegir la principal, a la principal). Un clic fuera con puntero fino cierra **sin robar** el foco. Si el botón sale del visor (o de su contenedor con `anchor="container"`), cierra sin devolver el foco. Si se abre un modal, cierra sin tocar el foco: lo toma el modal.
- **El puntero mueve el foco:** al entrar con ratón o lápiz en una acción habilitada pasa a ser la activa; el puntero quieto no desplaza la lista. No hay *hover* para abrir nada: todo se abre con un toque o una tecla.
- **Una activación por gesto:** el segundo clic de una ráfaga (doble clic) no cierra el botón, no ejecuta otra acción y no confirma una peligrosa; Intro o Espacio **mantenidos** no repiten la acción ni reabren el botón.
- **El orden de Tab es el del DOM.** El FAB es una parada donde tu aplicación lo monte: recomendamos al final del contenido principal, antes del pie. En C son **dos** paradas (principal y cola).
- **Lo escrito en C no lleva espacios** (Espacio activa, como en APG). Con 15 acciones, dos letras bastan.

### La confirmación en el sitio

Activar una acción con `danger` **parte su fila en dos sin mover nada más**: «Cancelar» (`labels.cancel`) con el foco y bajo el punto de la pulsación, y la confirmación (`confirmLabel`) al lado, dentro de un grupo cuyo nombre es la pregunta. Se deshace **sin temporizador**: «Cancelar», Esc o el foco que sale del par. Un doble clic nunca ejecuta. Con teclado: Intro en la acción, → a la confirmación, Intro; se ejecuta **una vez**.

## Posición y convivencia en el borde

- **Sitio:** `position` fija el borde y la alineación (lógicos: en RTL, `bottom-end` va a la izquierda); `*-center` centra el botón. El margen seguro es `space × 4` desde el borde, más `env(safe-area-inset-*)` (solo en `viewport`), más `offset`, más lo que otros ya ocupan. La lista siempre crece **hacia dentro**; si no hay sitio, se limita el alto y el panel desplaza.
- **Contenedor:** con `anchor="container"` el botón es absoluto en el antecesor posicionado más cercano (un mapa, un panel); ahí **no publica ni lee reservas de borde**. Si ese contenedor lo saca de la vista, la lista se cierra sin devolver el foco.
- **Cabecera fija de tu aplicación:** pasa su alto en `offset`: `:offset="{ top: '56px' }"` con las posiciones `top-*`. Es la receta de «una sola variable» de la aplicación; el botón no la adivina.
- **Registro de bordes** (`EDGE_ORDER`, `anchor="viewport"`): el FAB publica su alto **contraído** más el margen y lee lo que otros ya ocupan. De más cerca del borde a más lejos: la pill de la voz (10), el muelle de `GPageHeader` (15), la isla de estado (20) y **el FAB (25)**; `GToaster`, que suma todo, queda **más allá** del FAB. Abajo, el FAB queda encima de la voz y del muelle; arriba, debajo del zócalo pegado y de la isla.
- **`GPageHeader`:** lo que es de la página va en su muelle; crear o capturar, en el FAB; nunca la misma acción en los dos.
- **Se aparta (WCAG 2.4.11):** al llegar el foco a un elemento de fuera cuya caja se cruza con la del botón, éste se desplaza contra su borde y deja **24 px** visibles y operables (`is-tucked`). Con puntero grueso, también al enfocar un campo editable (teclado en pantalla). Cubre como mucho el 5 % del elemento con foco y nunca su centro; nada de la página se mueve; la reserva de borde no cambia. Vuelve cuando el foco sale a algo no cubierto, llega al propio botón o se suelta el campo. **El primer toque o clic sobre el botón apartado solo lo devuelve** (no abre ni ejecuta). No se esconde al desplazar.
- **Velo táctil:** con `pointer: coarse`, bajo la lista va un velo (`--g-surface-backdrop` a la mitad) que cubre el visor entero salvo una ventana sobre el botón. **Tocar fuera cierra sin activar lo de debajo** y el botón sigue siendo el cierre. Con puntero fino no hay velo y el clic fuera llega a su destino.
- **Modal:** el FAB **no se traslada** al `<dialog>`: al abrirse un modal, la lista se cierra sin mover el foco y el botón queda inerte bajo el fondo. Un `GFab` montado **dentro** de un `<dialog>` (con `anchor="container"`) funciona y no toca reservas.

## Accesibilidad

a. **Semántica de botón de menú:** el botón lleva `aria-haspopup="menu"`, `aria-expanded` y `aria-controls`, y su nombre es `label` (por `GTooltip`); la lista es `ul role="menu"` con `li role="none" > button role="menuitem"`, grupos `role="group"` con nombre y una sola parada de teclado. En C, `role="group"` con nombre que contiene la principal y la cola. Misma semántica en todas las formas (3.2.4). Nivel `medido`: sección «Marcado real» de la auditoría (2686/2686 en los tres motores) y `tests/fab.spec.mjs`.

b. **Orden:** DOM = visual = foco. La pila que sube invierte el DOM para que la primera acción sea la más cercana al botón (1.3.2, 2.4.3). Nivel `prueba` (`GFab.test.js`) y `medido` (spec). **Cómo lo lee un lector de pantalla real** («Nueva muestra, 5 de 5» al abrir) está `sin verificar`.

c. **Contraste** (30 configuraciones en Chromium, 8 en Firefox y WebKit; claro, oscuro y zona de marca; nivel `medido`): texto ≥ 4,5:1 y formas ≥ 3:1 en todas. Mínimos: etiqueta del panel 4,51; peligrosa del panel 4,51; motivo del fallo 4,51; icono del botón y etiqueta de la principal 4,70; **contorno del botón 4,53** (con una marca pálida, el relleno solo da 1,69:1 frente a la página: lo salva el contorno); confirmación 4,81; foco 4,52. El texto del botón deshabilitado baja a 4,44:1 con un tema (`spotify`): queda exento por 1.4.3 (control inactivo) y legible.

d. **Áreas y texto** (`medido`): botón ≥ 44 × 44 px; píldoras, filas del panel, «Cancelar» y la confirmación ≥ 24 px y, con puntero grueso, ≥ 44 px (Chromium y WebKit con toque; en Firefox, forzado con `is-coarse`). Texto ≥ 12 px.

e. **Foco visible** (`medido`, claro, oscuro y zona de marca): Tab llega al botón con `:focus-visible` sólido de ≥ 2 px y ≥ 3:1; la píldora enfocada lleva un anillo que el recorte no corta.

f. **Estados con forma, no solo color** (1.4.1): la peligrosa lleva una marca de forma (icono), la deshabilitada se tacha o se apaga con su motivo escrito, el acuse tiene insignia con icono y texto.

g. **Anuncios:** el acuse y el recuento del filtro van por el canal cortés de página, uno por cambio y nunca como `role="alert"`; abrir y cerrar se anuncian por `aria-expanded`. Nivel `prueba` (`GFab.test.js`) y `medido` (spec).

h. **Reflujo y texto grande** (`medido`): a 320 px sin desplazamiento horizontal (1.4.10) y con el texto al 200 % (1280 × 900) sin recortes. En estrecho el panel ocupa el ancho menos los márgenes.

i. **Sin temporizadores en lo que decide** (2.2.1): la confirmación se deshace por el usuario; el «hecho» es informativo y el texto también va al lector.

j. **Una activación por gesto** (2.5.2, `prueba` y `medido`) y **objetivos** de 24 px y 44 px táctil (2.5.8).

k. **`forced-colors`** (emulado en los tres motores, `medido`): bordes `CanvasText`, la deshabilitada en `GrayText` y el resaltado del panel sustituido por el foco del sistema. En WebKit el emulador no fuerza colores del autor.

> **Peligro.** Un FAB con más de una acción y **sin `label`** es un botón de solo icono **sin nombre accesible**: nadie que no lo vea sabrá para qué sirve (aviso 2 en desarrollo). Dale siempre `label`; con una sola acción se nombra como ella. Y si una acción lleva `danger`, pasa también `labels.cancel`: sin él, esa acción queda `aria-disabled` por seguridad y no se puede ejecutar.

## Personalidad

### Qué lo hace distinto

- **El orden nace del botón.** Lo más usado está siempre pegado al FAB, también en el foco y en el DOM: menos recorrido para el pulgar y el foco cae en lo más probable.
- **La pila que crece y no se mueve (A).** Salen del botón las que caben, cada una como un brote con su icono en una semilla concéntrica con el botón. Añadir acciones cambia la cola («Más acciones (N)»), no el sitio de lo aprendido: de 6 a 15 acciones, las cuatro primeras no se mueven (Δ 0,00 px medido).
- **La cola que se vuelve panel (C).** Una acción dominante no se esconde: un toque y se ejecuta, con su nombre visible. La cola se abre como una gota que crece hasta ser el panel, y en él **escribir filtra sin campo** (dos letras llevan a cualquiera de 15).
- **Lo que confirma nunca nace bajo el puntero.** La confirmación se abre en la misma fila, partida por una costura, con «Cancelar» bajo el dedo: sin diálogo, sin temporizador y sin que un doble clic pueda borrar.
- **El FAB cuenta lo que hizo.** «En curso…» → «CSV exportado» en la propia insignia del botón, sin otro flotante que tape pantalla, y la acción no se lanza dos veces. Si falla, el motivo queda en la acción y se puede reintentar.
- **Nunca tapa lo que usas.** Se aparta del foco y del teclado en pantalla y se queda en 24 px operables; tocar fuera, en táctil, no activa lo de debajo.

### Movimiento

| Qué | Cómo | Con `prefers-reduced-motion: reduce` |
| --- | --- | --- |
| Píldoras de la pila al abrir | Cada una sale del centro del botón y viaja a su sitio con `--g-duration-press` + `--g-ease-out`, la más cercana primero (un escalonado corto, derivado de `--g-duration-fast`) | Fundido, sin desplazamiento ni escalonado |
| Píldoras al cerrar | Vuelven hacia el botón, más cortas y sin escalonado | Fundido |
| Icono del botón | `plus` ↔ `x` (o `ellipsis-vertical` ↔ `x`) se cruzan con un giro corto de 45° | Fundido, sin giro |
| Panel de la cola de A y `appearance="panel"` | Entrada de popover (`--g-duration-press` + `--g-ease-out`, como `GMenu`) | Fundido |
| Panel de C | Transformación de contenedor: nace con el tamaño y el sitio de la cola y crece hasta su caja (`--g-duration-slow` + `--g-ease-out`) | Fundido, sin recorte |
| Se aparta · vuelve | `translate` con `--g-duration-press` | Aparece en su sitio |
| Insignia en curso | Giro de carga | Quieta |

Sin muelle ni rebote propios (el rebote al soltar es el de `GBtn`). Nada supera 240 ms (`medido` en la auditoría) y nada se anima al montar. Los efectos de puntero solo se activan con `@media (hover: hover)`.

## Tema

El color lo pone tu hoja de variables `--g-*`; el FAB no escribe ninguno y **no tiene propiedades de entrada propias**. Su relleno es el de `GBtn color="brand"` (la familia `primary`) con el contorno `primary-text` de `GBtn` `solid`: con una marca pálida, es el contorno el que da el contraste.

| Token | Qué controla |
| --- | --- |
| `--g-color-primary`, `--g-color-on-primary`, `--g-color-primary-text` (por `GBtn`) | Relleno, icono y contorno del botón, de la principal y de la cola; relleno de partida del panel de C |
| `--g-color-surface`, `--g-color-surface-sunken`, `--g-color-border`, `--g-color-border-control` | Píldoras, panel, acción activa, separadores, contorno de la cola |
| `--g-color-text`, `--g-color-text-muted`, `--g-color-text-subtle` | Etiqueta, descripción y motivo, título de grupo y pista de C; icono y etiqueta del botón deshabilitado |
| `--g-color-neutral-soft` | Relleno del botón deshabilitado |
| `--g-color-danger`, `--g-color-on-danger`, `--g-color-danger-text` | Peligrosa, botón que confirma, insignia de fallo y motivo del fallo |
| `--g-color-success`, `--g-color-on-success`, `--g-color-success-text` | Insignia «hecho» |
| `--g-color-focus`, `--g-focus-width`, `--g-focus-offset` | Anillo de foco |
| `--g-surface-backdrop` | Velo táctil (a la mitad de su opacidad) |
| `--g-radius-pill`, `--g-radius-lg`, `--g-radius-md`, `--g-radius-sm`, `--g-border-width` | Forma |
| `--g-shadow-1`, `--g-shadow-2`, `--g-shadow-3` | Elevación: botón deshabilitado, botón y píldoras, panel |
| `--g-text-*`, `--g-font-ui` | Etiquetas, descripciones y títulos de grupo |
| `--g-space-*` | Márgenes, separaciones y constantes de la política |
| `--g-duration-fast`, `--g-duration-press`, `--g-duration-slow`, `--g-duration-spin`, `--g-ease-out`, `--g-ease-standard` | Movimiento |

```css
:root {
  --g-space-1: 5px;        /* el botón mide 65 px (space × 13) y las píldoras 50 px (space × 10) */
  --g-border-width: 2px;   /* el contorno del botón, de la principal y de la cola pasa a 2 px */
}
```

Las medidas de la coreografía (giro de 45°, escala de partida de 0,96, opacidad de 0,5 del velo, tamaño del botón `space × 13`…) son constantes de diseño derivadas de `space`, **no tokens**: un tema no las cambia. Los mínimos de accesibilidad (24 px, 44 px táctil, 12 px de texto, contraste, foco visible) tampoco son tema.

## Clases

Las emite el componente y las estiliza `GFab.css`:

- **Raíz:** `g-fab` con `data-position`, `data-anchor`, `data-appearance` (`single` · `stack` · `panel` · `main`), `data-state` (`closed` · `opening` · `open` · `closing`) y `data-ack` (`busy` · `done` · `failed`); `is-tucked` (apartado) e `is-coarse` (opcional: fuerza el modo táctil).
- **Botón:** `g-fab__glyph` (`--rest`, `--open`), `g-fab__badge`; en C, `g-fab__main-group` y `g-fab__main`.
- **Listas:** `g-fab__list` (`--stack`, `--panel`); elementos `g-fab__item` (`--danger`, `--more`, `is-expanded`) con `g-fab__icon`, `__label`, `__desc`, `__reason`, `__mark`; `g-fab__group-title`; cabecera de C `g-fab__find` (`is-empty-result`) con `__find-query` y `__find-count`; par de confirmación `g-fab__confirm`, `__cancel`, `__confirm-action`; `g-fab__scrim` y `g-fab__scrim-part`; `g-fab__sr` (texto oculto accesible).
- **Selector sobre hijos de tu aplicación:** uno, `.g-fab__glyph > svg`, que da al icono del slot `trigger-icon` el tamaño del hueco.

## Alcance

- **Forma B · «Arco con gesto»** (`appearance="arc"`): reservada con su nombre (DECISIONS #654). Prototipada y medida en `design/lab/fab/r01/`; hoy avisa y se comporta como `auto`.
- **Slot `icon` `{ item }` y slot `item`** (icono y contenido por elemento): reservados (#666). El icono de cada acción es un nombre en `items[].icon`.
- **`shortcut`/`keyshortcuts` por elemento, `color`, `size` y `density` del botón:** fuera de v1 (#654).
- **`description` en `GMenu`:** reservado con el mismo nombre y significado (#658).
- **Buscar al escribir más allá de C** (en el panel de «Más acciones» de A, en `appearance="panel"` y en `GMenu`): hoy salta por letra; ampliar el filtro es una pregunta al usuario (#658).
- **Ocultar el botón al desplazar:** descartado por el riesgo vestibular; el botón no se mueve con el desplazamiento.
- **No navega, no abre casillas ni submenús, y no aloja controles:** un destino es `GMenu` con enlaces; una acción que pide datos es `GDialog`.
- **Sin textos por defecto** (#226): todo va en `label`, en los elementos o en `labels`.
- **Por borde, sin mirar la alineación:** un FAB en `bottom-end` también eleva los avisos de `bottom-start`. Se acepta, como en la isla de estado.
- **La pill de la voz arriba** no lee reservas de borde (límite conocido de la voz, #631).
- **El teclado en pantalla** se detecta por el foco en un campo editable, no por `visualViewport`.
- **Velo táctil:** un toque a menos de `space × 1` del botón (el anillo de la ventana) o en las esquinas de su caja fuera de la forma redonda llega a lo que haya debajo (#668).
- **Sombras de tu tema** más extensas que `space × 6` (píldoras) o `space × 12` (panel de C) se recortan en reposo. Las del tema por defecto caben con margen.
- **Estilos de elemento de tu aplicación** sin capa ganan a los de la librería (#516): no estilices `button`, `ul` o `li` sin capa si hay un `GFab` en la página.

## Verificación

- **Auditoría de coco, `medido`** (2026-10-18, sobre el componente real de `dist/`, con un tema distinto al de defecto —marca rosa pálido, `space` 4,5— y, en Chromium, los temas generados de Dark Color Presence: 15 temas en total): `node design/lab/fab/auditoria-verificar.mjs` **2686/2686** (estático 33, Chromium 1430, Firefox 607, WebKit 616).
- **Banco de estilo de coco, `medido`:** `node design/lab/fab/estilo-verificar.mjs` 3201/3201 en los tres motores.
- **Playwright, `medido`:** `tests/fab.spec.mjs` en Chromium, Firefox y WebKit, un worker: 59 pasan y 1 se omite por diseño (el velo táctil en Firefox, que no emula el toque).
- **Vitest, `prueba`:** `GFab.test.js` (59), `GFab.ssr.test.js` (2) y `src/fab.test.js` (10, la entrada): 71 en verde. Cubren formas por cantidad, orden y foco, teclado y filtro de C, confirmación, ticket y acuse, `modelValue`, reservas de borde, se aparta y los quince avisos.
- **Límites medidos de motor:** en WebKit con DPR 1 y un botón de medida fraccionaria (58,5 px con `space` 4,5), el desplazamiento al apartarse se redondea al píxel y quedan **23,5 px** visibles en vez de 24 (Chromium y Firefox, 24,0; WebKit con DPR 2, 24,0; con el tema por defecto de 52 px no ocurre). Firefox no emula el puntero grueso ni el toque: se fuerza con `is-coarse` y el velo se mide en Chromium y WebKit.
- **Solo en entorno real, `sin verificar`:** lector de pantalla (VoiceOver, NVDA, TalkBack) sobre el orden invertido de la pila, el par de confirmación dentro de un `menu` y el filtro de C; `forced-colors` real; teclado en pantalla real; táctil real (el velo y el primer toque del botón apartado); Safari real.
- **Sin medir:** el rendimiento de abrir con 15 acciones (no más de un cuadro largo) y que el desplazamiento no vuelva a pintar Vue.
- **Pendientes abiertos:** los de este componente están en [`PENDIENTES.md`](../../../../../PENDIENTES.md): la prueba de personalidad `tests/personalidad-fab.spec.mjs`, la prueba de rendimiento y lo que falta de la verificación del contrato (bruno), precisar la sombra de la principal de C deshabilitada en el contrato (lima), y la pregunta al usuario sobre buscar al escribir más allá de C (#658).

## Fuentes

- Contrato: [`design/contracts/fab.md`](../../../../../design/contracts/fab.md)
- Decisiones: #654 a #671 y #676 a #678 en [`DECISIONS.md`](../../../../../DECISIONS.md)
- API: [`GFab.meta.json`](GFab.meta.json)
- Ronda de kiwi: [`design/lab/fab/r01/declaracion.md`](../../../../../design/lab/fab/r01/declaracion.md)
- Estilo de coco: [`design/lab/fab/estilo.md`](../../../../../design/lab/fab/estilo.md)
- Auditoría de coco: [`design/lab/fab/auditoria.md`](../../../../../design/lab/fab/auditoria.md)
- Pruebas: [`GFab.test.js`](GFab.test.js), [`GFab.ssr.test.js`](GFab.ssr.test.js) y [`src/fab.test.js`](../../fab.test.js) (71, nivel `prueba`); Playwright [`design/lab/theme-playground/tests/fab.spec.mjs`](../../../../../design/lab/theme-playground/tests/fab.spec.mjs) (nivel `medido`)
