# GCard

Superficie de contenido **contenida** con regiones opcionales que se combinan: media, encabezado (icono o avatar, eyebrow, título, subtítulo, insignia, menú), contenido libre, aviso de estado, vacío, metadata, región secundaria, acciones y pie. Sirve para resumir, representar una entidad, mostrar una métrica, ofrecer una acción o abrir una vista de detalle. **No impone qué contiene:** las doce composiciones del brief (básica, contenido, media, entidad, perfil, métrica, estado, interactiva, seleccionable, horizontal, acción, inset) son el mismo `GCard` con otras props y slots.

**Etiqueta:** `<g-card>` · **Estado:** `candidate` (auditoría de coco aprobada; ver [`design/lab/card/auditoria.md`](../../../../../design/lab/card/auditoria.md)) · **Desde:** 0.1.0

> `@grana/vue` está en la versión 0.0.0 y aún no se publica. Por ahora se usa desde el repositorio (ver el playground en `packages/vue/playground/`). Exige Vue `^3.5.0`; el menú de acciones usa la API `popover`.

> **La tarjeta nunca es el control.** La acción principal es un `<a>`, un `<button>` o un `<label>` real **dentro del título** que se «estira» para cubrir toda la tarjeta; el resto de controles van por encima y no la activan. Por eso una tarjeta admite varias acciones sin romper la accesibilidad (WCAG 4.1.2), y por eso **no se puede seleccionar texto con el puntero** en una tarjeta navegable.

## Uso

```js
import { createApp } from 'vue'
import Grana from '@grana/vue'
import '@grana/vue/style.css'

createApp(App).use(Grana).mount('#app')
```

```vue
<script setup>
const textos = { menu: 'Acciones de', loading: 'Cargando tarjeta', loaded: 'Tarjeta cargada', expand: 'Mostrar más', collapse: 'Mostrar menos', more: 'Más detalles', less: 'Menos detalles', retry: 'Reintentar', empty: 'Aún no hay proyectos' }
</script>

<template>
  <g-card title="Notas de la versión" description="Un resumen breve de lo que contiene esta tarjeta." :labels="textos"></g-card>
</template>
```

**Los textos no tienen valor por defecto** (Grana es internacional): el nombre accesible es `title` (o el slot `title`, o `aria-label`/`aria-labelledby`; sin ninguno, aviso en desarrollo) y los demás van en `labels`.

> **En plantillas dentro del HTML** (sin compilar), escribe `<g-card ...></g-card>`: Vue no admite etiquetas de componente autocerradas.

> **La tarjeta necesita un ancho definido por su contenedor** (una rejilla, una columna, `inline-size: 100%`), no por su contenido: mide su propio ancho con `ResizeObserver` para elegir `narrow`, `medium` o `wide`, y si el ancho dependiera del contenido la medida dependería de lo medido. Antes de montar (SSR) se renderiza como `medium`/`column` y se corrige al montar.

### Media: arriba, lateral, de fondo o en línea

```vue
<g-card href="/articulos/mercado" eyebrow="Artículo" title="Un paseo por el mercado" description="…" :description-lines="2" expandable :labels="textos" @navigate="ir">
  <template #media><img src="/mercado.jpg" alt=""></template>                    <!-- top (por defecto), a sangre, 16/9 -->
  <template #footer><span>5 min de lectura</span><span>12 jun</span></template>
</g-card>

<g-card href="/rutas/centro" orientation="auto" media-position="start" title="Recorrido por el centro histórico" :labels="textos">
  <template #media><img src="/centro.jpg" alt=""></template>                     <!-- lateral solo en wide; arriba en el resto -->
</g-card>

<g-card href="/rutas/centro" media-position="background" eyebrow="Ruta" title="Recorrido por el centro histórico" subtitle="3 h · ES" :labels="textos">
  <template #media><img src="/centro.jpg" alt=""></template>                     <!-- detrás, con velo y texto claro -->
  <template #actions><g-btn>Reservar</g-btn></template>
</g-card>

<g-card title="Mapa del recorrido" :labels="textos">
  <template #media><div role="img" aria-label="Mapa del recorrido con tres paradas"><MiMapa /></div></template>   <!-- inline: dentro del cuerpo, informativa -->
</g-card>
```

- La media es **decorativa** por defecto (`g-card__media` lleva `aria-hidden="true"`); si el nodo raíz del slot trae `role="img"` con nombre, el envoltorio no se oculta. Un control dentro de la media (reproducir) es un interactivo más por encima del estirado.
- `start`/`end` son lados **lógicos** (en RTL se espejan) y solo valen con `orientation="auto"` u `"horizontal"`; con `vertical` se pintan arriba y avisan.
- La media `top`/`start`/`end` y el pie sangran hasta el borde interior de la tarjeta (`--g-surface-padding`, publicada por `GSurface`); `inline` no sangra y toma el radio concéntrico.
- Con media de fondo, el texto y los `GBtn` leen `--g-card-on-scrim` sobre el velo `--g-card-scrim` (medido: ≥ 7.3:1 sobre una media blanca, el peor caso).

### Entidad: casilla, icono, insignia, metadata, menú y acciones

```vue
<g-card href="/proyectos/atlas" title="Proyecto Atlas" subtitle="Equipo de datos" badge="Activo" badge-color="success"
        :meta="[{ label: 'Responsable', value: 'Ana Pérez' }, { label: 'Tareas', value: 12 }, { label: 'Actualizado', value: 'hace 2 h', priority: 'low' }]"
        :menu="[{ id: 'rename', label: 'Renombrar' }, { id: 'del', label: 'Eliminar', danger: true }]"
        selectable v-model="elegidos" value="atlas" :labels="textos" @navigate="ir" @action="(e) => actuar(e.id)">
  <template #lead><img :src="atlas.avatar" alt=""></template>
  <template #actions>
    <g-btn variant="outline" @click="editar">Editar</g-btn>
    <g-btn variant="ghost" icon aria-label="Compartir" @click="compartir"><IconoCompartir /></g-btn>
  </template>
  <template #footer><span>Actualizado hace 2 h</span><a href="/proyectos/atlas/historial">Historial</a></template>
</g-card>
```

- `selectable` añade una **casilla real** antes del título para elegir sin abrir: marcarla no navega. Con `value`, el `v-model` es un arreglo; sin `value`, un booleano.
- `meta` se renderiza como `<dl>`; con `density="compact"` los de `priority: 'low'` no se pintan.
- El menú es un `GMenu` con tus `items`; se nombra «`labels.menu` + título» («Acciones de Proyecto Atlas») y emite `action` con `{ id }` (y `checked` en casillas y opciones). Vive en la capa superior: la tarjeta no lo recorta.
- Un `GBtn` de solo icono en `actions` necesita `aria-label` (aviso en desarrollo si falta).

### Acción, alternar y seleccionar con toda la tarjeta

```vue
<g-card interaction="button" title="Nuevo proyecto" description="Empieza desde cero o con una plantilla." :labels="textos" @activate="crear">
  <template #lead><IconoMas /></template>
</g-card>

<g-card interaction="toggle" title="Solo pendientes" description="Filtro de la vista." v-model="soloPendientes" :labels="textos"></g-card>

<div role="radiogroup" aria-label="Plan">
  <g-card v-for="p in planes" :key="p.id" interaction="select" select-type="radio" name="plan" :value="p.id" v-model="plan"
          :title="'Plan ' + p.nombre" :description="p.texto" color="accent" :labels="textos"></g-card>
</div>
```

| `interaction` | Elemento principal | Para qué |
| --- | --- | --- |
| `auto` (por defecto) | `link` si hay `href`; si no, `none` | |
| `none` | ninguno | Tarjeta informativa |
| `link` | `<a href>` en el título | Navegar: abrir en pestaña, clic derecho y arrastrar funcionan (es un enlace real) |
| `button` | `<button>` en el título; emite `activate` | Una tarjeta con un solo propósito |
| `toggle` | `<button aria-pressed>`; `v-model` booleano | Estado de la interfaz (filtros, preferencias), no un valor de formulario |
| `select` | `<input type="checkbox\|radio">` real; el título es su `<label>` | Un valor de formulario. Con `radio`, el grupo lo forman el mismo `name` y el mismo `v-model` dentro de un `role="radiogroup"` **tuyo** con nombre; las flechas mueven la selección (nativo) |

Navegar, accionar, alternar y seleccionar con toda la tarjeta son **excluyentes**: `href` con otra `interaction` avisa. Para «abrir una cosa y elegir otra» usa `selectable`.

### Métrica, estado, vacío

```vue
<g-card href="/ingresos" title="Ingresos mensuales" :menu="acciones" :labels="textos" @navigate="ir">
  <g-metric label="Ingresos" value="$48,200" trend="+12%" direction="up" trend-color="success" context="vs. mes anterior" size="lg"></g-metric>
  <template #footer><span>Actualizado 09:41</span></template>
</g-card>

<g-card title="Ingresos" status="error" status-text="No se pudo cargar la métrica." retryable :labels="textos" @retry="recargar"></g-card>

<g-card title="Proyectos" empty :labels="textos"></g-card>
```

- `status` (`info` `success` `warning` `error`) pinta un aviso **de la tarjeta** con icono, texto (`statusText`, obligatorio) y una marca de borde de inicio con **forma distinta por valor** (puntos, doble, discontinua, sólida): nunca solo color. `error` es `role="alert"` solo cuando aparece después de montar (al montar con él, `role="status"`). Con `retryable` y `labels.retry` añade «Reintentar» (sin `labels.retry` no se dibuja y avisa).
- `empty` muestra el slot `empty` o `labels.empty` **conservando el encabezado**; sustituye al slot por defecto.

### Carga (esqueleto)

```vue
<g-card :loading="cargando" title="Proyecto Atlas" subtitle="Equipo de datos" badge="Activo" :meta="meta" :menu="acciones" :labels="textos">
  <template #actions><g-btn>Abrir</g-btn></template>
</g-card>

<g-card loading title="Ingresos" :skeleton="{ media: true, descriptionLines: 0, meta: 0, actions: 2 }" :labels="textos"></g-card>

<g-card loading title="Gráfico" :labels="textos">
  <template #loading="{ size }"><MiEsqueletoDeGrafico :compacto="size === 'narrow'" /></template>
</g-card>
```

Con `loading` los datos no existen: el esqueleto se **deriva de lo que la tarjeta declara** (media, `lead`, eyebrow, subtítulo, insignia, menú, líneas de descripción, filas de `meta`, acciones, pie), con la altura de línea real de cada región. `skeleton` precisa o corrige esa derivación (`false`/`0` quita una región); el slot `loading` sustituye **solo el cuerpo** (la tarjeta conserva su superficie, `aria-busy` y la región viva). Sin nada declarado: título y dos líneas. Durante la carga no hay controles enfocables; `labels.loading` se anuncia al empezar y `labels.loaded`, si lo das, al terminar. **No se promete la misma altura** que la tarjeta cargada. La animación se detiene con `prefers-reduced-motion`.

### Horizontal con región secundaria, y lista

```vue
<g-card href="/rutas/centro" orientation="auto" media-position="start" eyebrow="Resultado" title="Recorrido por el centro histórico"
        description="Un recorrido a pie por las plazas y mercados." :meta="[{ label: 'Duración', value: '3 h' }]" :labels="textos" @navigate="ir">
  <template #media><img src="/centro.jpg" alt=""></template>
  <template #more><p>Punto de encuentro: plaza principal. Cancelación gratuita hasta 24 h antes.</p></template>
  <template #actions><g-btn>Guardar</g-btn></template>
</g-card>

<ul class="personas">
  <g-card v-for="p in personas" :key="p.id" as="li" level="flat" density="compact" orientation="horizontal" :href="p.url" :current="p.id === actual"
          :title="p.nombre" :title-lines="1" :subtitle="p.equipo" :menu="acciones" :labels="textos" @navigate="ir">
    <template #lead>{{ p.iniciales }}</template>
  </g-card>
</ul>
```

- En `wide` (≥ `space × 130`, 520px con `space` 4) la tarjeta horizontal pone la media al lado, el contenido en medio y las acciones en columna al final. En `narrow` (< `space × 80`) la media pasa arriba, las acciones se apilan a ancho completo y `more` se pliega con «Más detalles» (`labels.more`/`labels.less`; sin ellos, queda visible y avisa).
- **No hay `GListItem`:** una fila de lista es un `GCard` con `as="li"`, `level="flat"`, `orientation="horizontal"` y `density="compact"` dentro de tu `<ul>`; `current` marca la fila actual (`aria-current="true"`, borde, fondo y chevron). La metadata se reordena visualmente antes del menú sin cambiar el DOM.

### Router: `navigate` cancelable

```vue
<g-card :href="router.resolve({ name: 'proyecto', params: { id } }).href" title="Proyecto Atlas" :labels="textos"
        @navigate="({ event, href }) => { if (!event.metaKey && !event.ctrlKey) { event.preventDefault(); router.push(href) } }"></g-card>
```

`navigate` llega con el **evento nativo**: `preventDefault()` (síncrono) evita la navegación del navegador. No hay prop `to`: el enlace sigue siendo un `<a href>` real y, si no cancelas con modificadores, «abrir en pestaña nueva» sigue funcionando.

## Props

| Prop | Tipo | Valores | Por defecto |
| --- | --- | --- | --- |
| `as` | String | `article` `li` `div` `section` | `article` |
| `level` | String | `flat` `outlined` `raised` `inset` | `outlined` |
| `padding` | String | `xs` `sm` `md` `lg` | `md` |
| `rounded` | String | `none` `xs` `sm` `md` `lg` `xl` `pill` | según `level` (de `GSurface`) |
| `density` | String | `default` `comfortable` `compact` | `default` |
| `color` | String | `brand` `accent` `neutral` | `brand` |
| `orientation` | String | `vertical` `horizontal` `auto` | `vertical` |
| `mediaPosition` | String | `top` `start` `end` `background` `inline` | `top` |
| `eyebrow`, `title`, `subtitle`, `description` | String | | sin valor |
| `headingLevel` | Number | 2 a 6 | `3` |
| `titleLines` | Number \| String | `1` `2` `3` `4` `none` | `2` |
| `descriptionLines` | Number \| String | `1` `2` `3` `4` `none` | `none` |
| `expandable` | Boolean | «Mostrar más» solo si la descripción se recortó de verdad | `false` |
| `badge` | String \| Number | | sin valor |
| `badgeColor` | String | `brand` `accent` `neutral` `success` `warning` `danger` `info` | `neutral` |
| `meta` | Array | `[{ label, value, priority?: 'high' \| 'low' }]` | `[]` |
| `menu` | Array | `items` de [`GMenu`](../GMenu/README.md) | `[]` |
| `status` | String | `info` `success` `warning` `error` | sin valor |
| `statusText` | String | obligatorio con `status` | sin valor |
| `retryable` | Boolean | solo con `status="error"` | `false` |
| `empty` | Boolean | | `false` |
| `loading` | Boolean | | `false` |
| `skeleton` | Object | `{ media, lead, eyebrow, subtitle, badge, menu, footer: Boolean; descriptionLines: 0 a 6; meta, actions: Number }` | sin valor |
| `disabled` | Boolean | | `false` |
| `interaction` | String | `auto` `none` `link` `button` `toggle` `select` | `auto` |
| `href`, `target`, `rel` | String | como en `<a>`; con `target="_blank"` y sin `rel`, `noopener noreferrer` | sin valor |
| `current` | Boolean | solo con enlace: `aria-current="true"` | `false` |
| `modelValue` (`v-model`) | Boolean \| Array \| String \| Number | `toggle` y casilla sin `value`: Boolean; casilla con `value`: Array; `radio`: el valor elegido | `false` |
| `selectable` | Boolean | casilla explícita en una tarjeta `link` o `button` | `false` |
| `selectType` | String | `checkbox` `radio` | `checkbox` |
| `name`, `value` | String \| Number | como en `<input>`; `name` es necesario con `radio` | sin valor |
| `labels` | Object | ver abajo | `{}` |
| `id` | String | base de los ids internos | generado |

Un valor fuera de la lista muestra una advertencia en desarrollo. **El componente nunca cambia `modelValue` por su cuenta:** emite y vuelve a alinear el control nativo con el prop.

- **`level`:** los de `GSurface` sin `floating`; `interactive` y `selected` no son niveles. Una tarjeta `inset` sobre una superficie hundida toma el tono contrario; una región `inset` dentro de la tarjeta toma el radio concéntrico, y una `inset` dentro de otra `inset` se aplana (máximo dos pasos).
- **`padding`:** sin `none`: las regiones a sangre y el radio concéntrico se calculan desde el relleno.
- **`color`:** familia de la marca de selección, de «actual» y del indicador; no colorea el fondo.
- **`density`:** relleno (vía `GSurface`), separación, tamaño de la media lateral y la metadata de prioridad baja; no cambia la tipografía. `spacious` del brief = `default`.
- **`disabled`:** atenuada y título tachado; el enlace pierde el `href` (`role="link" aria-disabled="true"`), botones e `input` `disabled`, el menú `disabled`, y contenido, acciones, pie y `more` pasan a `inert`: Tab salta la tarjeta entera. No emite.
- **Resto de atributos** (`class`, `style`, `data-*`, `aria-*`, escuchas): van a la raíz; `aria-label`/`aria-labelledby` sustituyen al nombre por el título.

### `labels`

| Clave | Uso | Si falta |
| --- | --- | --- |
| `menu` | Prefijo del nombre del botón de menú («Acciones de») | Aviso en desarrollo (con `menu`) |
| `loading` | Anuncio al empezar a cargar | Aviso (con `loading`) |
| `loaded` | Anuncio al terminar | No se anuncia |
| `expand`, `collapse` | «Mostrar más» / «Mostrar menos» | Aviso (con `expandable`) |
| `more`, `less` | «Más detalles» / «Menos detalles» | La región no se pliega; aviso (con el slot `more`) |
| `retry` | «Reintentar» | El botón no se dibuja; aviso (con `retryable`) |
| `empty` | Mensaje del vacío sin slot `empty` | No se dibuja nada; aviso (con `empty`) |

## Eventos

| Evento | Payload | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href }` | `link`: el usuario activa el enlace. **Cancelable** con `event.preventDefault()` |
| `activate` | `{ event }` | `button`: el usuario activa el botón principal |
| `update:modelValue` | Boolean, Array o el `value` elegido | `select`, `toggle` o casilla explícita |
| `action` | `{ id }` (y `checked`) | Elemento del menú elegido |
| `retry` | `{ event }` | «Reintentar» |
| `expand` | `{ expanded, region: 'description' \| 'more' }` | Se despliega o pliega la descripción o `more` |

Ninguno se emite con `disabled` ni `loading`. Todos están declarados en `emits`: un `@click` tuyo en la tarjeta llega a la raíz y se dispara también con las acciones internas; usa los eventos de arriba.

## Slots

| Slot | Alcance | Contenido |
| --- | --- | --- |
| `media` | `{ size, layout }` | Imagen, vídeo, mapa, gráfico; decorativa salvo `role="img"` en su raíz |
| `lead` | `{ size, layout }` | Icono o avatar (iniciales, imagen); decorativo; la caja mide `space × 10` y el contenido la llena |
| `eyebrow`, `title`, `subtitle`, `description` | | Texto con contenido rico (sin interactivos); `title` conserva el texto para el nombre y la tarjeta lo envuelve con la principal |
| `badge` | `{ state }` | Sustituye a la insignia (con texto, no solo color) |
| `default` | `{ size, layout, state, selected }` | Contenido libre: [`GMetric`](../GMetric/README.md), [`GProgress`](../GProgress/README.md), [`GDataList`](../GDataList/README.md), un gráfico con `role="img"`, una `GSurface level="inset"` |
| `status` | `{ status }` | Sustituye al icono y al texto del aviso (mantiene el rol) |
| `empty` | `{ size }` | Estado vacío propio |
| `meta` | | Metadata con estructura propia (`<dl>` o equivalente) |
| `more` | `{ size }` | Región secundaria que se pliega en `narrow` |
| `actions` | `{ size, layout }` | [`GBtn`](../GBtn/README.md) principal, secundarias, solo icono; anclado al fondo |
| `footer` | `{ size }` | Pie a sangre con línea fina |
| `loading` | `{ size, layout }` | Esqueleto propio (solo el cuerpo; decorativo) |

`size` es `wide`, `medium` o `narrow` y `layout` es `row` o `column` (también como `data-size`/`data-layout` y clases en la raíz). No hay slot `avatar` ni `GAvatar`: va en `lead`.

## Teclado y orden de foco

Orden del DOM = orden de lectura = orden de foco: **[casilla] → título → menú → acciones → controles del contenido → enlace del pie.** Verificado con Tab en Chromium y Firefox (WebKit en macOS no tabula a enlaces y botones por defecto).

| Contexto | Teclas |
| --- | --- |
| `link` / `button` | **Tab** entra en el título y el anillo cubre la tarjeta; **Enter** activa el enlace; **Enter** o **Espacio** el botón |
| `toggle` | **Enter** o **Espacio** alternan `aria-pressed` |
| `select` casilla | **Espacio** marca o desmarca (nativo) |
| `select` radio | **Tab** entra en el elegido del grupo; **flechas** mueven la selección (nativo, con `name` común) |
| Casilla explícita | **Espacio**; no navega |
| Menú | Como `GMenu`: **Enter/Espacio/↓** abren; ↑/↓/Inicio/Fin con vuelta; **Esc** cierra, devuelve el foco al botón y no cierra un `GDialog` anfitrión; **Tab** cierra |
| «Mostrar más», «Más detalles», «Reintentar» | **Enter** o **Espacio** |
| Lista de tarjetas | Sin *roving tabindex*: Tab recorre título → menú de cada fila |

Una acción interna con foco **no** activa la principal; Enter en el título **no** abre el menú.

## Accesibilidad

- **Estructura:** la raíz es una `GSurface` (`article` por defecto). Con título y **sin** acción principal lleva `aria-labelledby` → título; **con** acción principal no (el control ya da el nombre y se evita «artículo, Título… enlace, Título»); con `li`, `div` o `section` nunca. Esta omisión está pendiente de confirmar con lector de pantalla real.
- **Principal:** `aria-describedby` → descripción. `aria-pressed` solo en `toggle`; nunca `aria-selected`. En `select` el `<input>` nativo aporta el estado y el título es su `<label>`; con la casilla explícita el `<input>` se nombra por el título.
- **Menú:** `aria-haspopup="menu"`, `aria-expanded`, nombre «`labels.menu` + título».
- **Carga:** `aria-busy="true"`; una región `role="status"` existe desde el montaje y anuncia `labels.loading` y `labels.loaded`; el esqueleto es `aria-hidden` e `inert`, sin controles.
- **Avisos:** `role="status"`; `role="alert"` solo cuando el `error` aparece después de montar.
- **Decorativos** (`aria-hidden`): `lead`, escrim, indicadores, iconos, chevron de «actual», media sin `role="img"`.
- **Sin depender del color:** selected = borde de doble grosor + indicador con icono + fondo; current = borde + fondo + chevron; foco = anillo distinto de la marca, hacia dentro, con halo del color de la superficie para verse sobre cualquier media; `status` = icono + texto + marca de forma distinta por valor; disabled = atenuada + título tachado.
- **Contraste medido** (tema por defecto, Spotify con marca pálida, lustre y un tema de prueba con serif, `space` 5 y borde 2px; claro y oscuro): título ≥ 15.2:1, textos secundarios ≥ 6.99:1 y ≥ 5.91:1 en hover, pressed y selected; texto de `status` ≥ 13.65:1, «Reintentar» ≥ 8.25:1; marca de selección, chevron de «actual» y anillo de foco ≥ 3:1 (mínimo 4.12:1 con marca pálida); casilla sin marcar ≥ 3.43:1; sobre el velo de una media blanca, texto ≥ 7.11:1 y foco ≥ 9.89:1. Con marca pálida el **relleno** del indicador marcado queda bajo 3:1 (lo delimita el borde, ≥ 4.12:1, y el icono sobre el relleno ≥ 9.45:1).
- **Tamaños:** menú 32px, casilla 24px (indicador 20), botones de texto y enlace del pie 24px de alto, botón de acción en `narrow` 40px de alto a ancho completo; **44px** en todos con `pointer: coarse` (el solo icono de `GBtn` lo da su propio `::after`).
- **Movimiento:** solo pintura (opacidad, color y fondo); **la tarjeta no se mueve ni se escala** (sin `transform` en hover, #127). Con `prefers-reduced-motion` no hay círculo de selección ni halo (la selección solo se funde, 120ms) ni animación del esqueleto. Detalle en [Personalidad](#personalidad).
- **RTL:** propiedades lógicas; media lateral, lateral del encabezado y chevron de «actual» espejados.
- **Colores forzados:** borde `CanvasText`, velos fuera, foco `Highlight`, selección `Highlight`/`HighlightText`, marcas de `status` `CanvasText`, media de fondo y escrim ocultos, esqueleto `GrayText`.
- **Navegadores:** medido en Chromium; selección, velo, apilado en `narrow`, lista, 320px, esqueleto oscuro, foco y menú comprobados también en Firefox y WebKit (Playwright).

## Personalidad

Dos detalles de **pintura** que dan causa y efecto sin mover nada: la tarjeta nunca cambia de caja ni lleva `transform` (#127). Sin props, slots, eventos ni clases nuevas. Origen: ronda de kiwi [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) (§6); decisión #303 (y #299, el lenguaje de movimiento) en `DECISIONS.md`.

**La selección nace de la casilla.** Al marcar una tarjeta seleccionable, el fondo de seleccionada (`--g-card-selected`) se extiende en círculo **desde el centro del indicador** (la casilla o el radio; en `toggle`, la marca estática) hasta cubrir la tarjeta, y al desmarcar se recoge hacia él. Crece en `--g-duration-slow` y se recoge en `--g-duration-press`, las dos con `--g-ease-out` (la salida, más corta). El borde doble y el icono de la marca siguen fundiéndose: **la selección no depende del círculo**. Por qué: lo que marcaste y lo que cambió quedan unidos; en una rejilla se ve qué tarjeta acabas de elegir. El origen se calcula **solo con CSS** por anclaje (el indicador es el ancla de su tarjeta; las tarjetas anidadas no se cruzan), sin escribir datos desde JS. Rige en horizontal con media lateral, `compact`, modo lista y RTL. Sin indicador (`button`, `link` sin `selectable`, `current`), sin soporte de anclaje o con movimiento reducido, el tinte se funde como antes. En `forced-colors` no hay círculo: la selección es el anillo del sistema.

**La luz sigue al puntero.** Sobre el velo uniforme de hover (que sigue siendo la señal), un halo del **mismo `--g-card-hover`** (dos capas concentradas, radio `--g-space-1 × 40`) se centra donde está el puntero. Aparece y se va con el hover (fundido de `--g-duration-press`) y su posición no se transiciona: va con el puntero. **Al apretar se apaga** y manda el velo de pulsación. Por qué: distingue a la vista una tarjeta interactiva de una estática. Reglas:

- **Solo** con `(hover: hover) and (pointer: fine)` y sin `prefers-reduced-motion: reduce`, en tarjetas interactivas sin `disabled` ni `loading` y sin media de fondo; nunca en `forced-colors`. En táctil no hay halo ni escuchas.
- `GCard` escribe `--_pointer-x` y `--_pointer-y` (px desde la caja de borde de la raíz) en `pointerenter` y `pointermove` de ratón y lápiz, **una escritura por cuadro**, y quita las escuchas si la consulta deja de cumplirse. Son datos internos, no API.
- **Sin token nuevo:** como usa `--g-card-hover`, cambiarlo ajusta a la vez el velo y la intensidad del halo.

**Con `prefers-reduced-motion: reduce`:** sin halo; la selección solo se funde.

### Verificación

Spec `design/lab/theme-playground/tests/personalidad-card.spec.mjs` sobre el `GCard` real del UMD, en Chromium, Firefox y WebKit (coco, [`estilo.md`](../../../../../design/lab/card/estilo.md), «Personalidad»):

| Qué | Medida |
| --- | --- |
| Selección: origen (7 modos: casilla, radio, `toggle`, media lateral, `compact`, RTL, lista) | Δ 0,00px en x e y; el radio llega a la esquina más lejana del relleno (≤ 1,1px, el borde) |
| Selección: crecer y recoger | 240ms con `--g-ease-out`: 0 → 39,8 → 77,5 → 96,6 % del radio a 10, 25 y 50 % del tiempo; recoger en 160ms con el tinte puesto hasta el final; caja Δ 0 y `transform: none` |
| Selección: píxeles (Chromium y Firefox) | a mitad del crecimiento, el tinte está junto al indicador y la esquina lejana sin teñir; al final, teñida |
| Selección con `reduce` | capa igual a la tarjeta, radio fijo 100 %, el tinte se funde en 120ms |
| Halo: centro | el centroide del halo coincide con el puntero (330,00; 230,00) en los tres motores; caja Δ 0, `transform: none` y velo uniforme conservado |
| Halo: sin halo | con `reduce`, en táctil (375px, `hover: none`; Chromium y WebKit), en `forced-colors` (Chromium), en tarjetas no interactivas, deshabilitadas o con media de fondo |
| Contraste en el centro del halo (texto / atenuado) | claro por defecto: hover 14,07 / 6,03; seleccionada + hover 12,81 / 5,49; seleccionada + pulsada 13,56 / 5,81. Oscuro por defecto: 10,96 / 6,18; 9,12 / 5,15; 9,85 / 5,56. Tema generado `spotify` claro: 14,08 / 5,97; 12,82 / 5,44; oscuro: 11,14 / 6,27; 9,28 / 5,22 (Chromium; Firefox y WebKit ±0,15) |

El spec lee `--_pointer-x/y` del componente real y, si faltaran, instala un sustituto mínimo y lo anota en el informe de la prueba.

**Notas de motor:** WebKit (26.6) cancela las transiciones de un elemento colocado con `anchor()`, así que velo, tinte y radio se animan en la raíz con propiedades registradas privadas y el `::before` las hereda; no cambia la API ni el resultado. La captura de WebKit da por terminadas las transiciones de propiedades registradas, por eso la prueba de píxeles del círculo no se ejecuta allí (en vídeo de WebKit y de Chromium sí se ve crecer desde la casilla).

**Sin verificar:** táctil real, `forced-colors` real de Windows y Safari real (la selección y el halo se midieron en el WebKit de Playwright).

## Tema

Los valores por defecto están en `defaults.css`; cambiarlos en tu tema los sobreescribe.

| Token | Por defecto (claro / oscuro) | Qué es |
| --- | --- | --- |
| `--g-card-hover` | `rgb(0 0 0 / 0.03)` / `rgb(255 255 255 / 0.04)` | Velo sobre la anfitriona en hover de la acción principal |
| `--g-card-pressed` | `rgb(0 0 0 / 0.07)` / `rgb(255 255 255 / 0.09)` | Velo mientras se pulsa |
| `--g-card-selected` | `rgb(0 0 0 / 0.045)` / `rgb(255 255 255 / 0.06)` | Fondo de la seleccionada o «actual» (nunca solo fondo) |
| `--g-card-scrim` | `rgb(0 0 0 / 0.62)` / `rgb(0 0 0 / 0.68)` | Velo sobre la media de fondo (mínimo arriba, más fuerte abajo) |
| `--g-card-on-scrim` | `#FFFFFF` | Texto, iconos, foco y botones sobre el velo |

```css
:root {
  --g-color-primary-text: #7A1E3A;   /* marca de selección y de «actual» (exige 3:1 sobre la superficie) */
  --g-color-primary: #7A1E3A;        /* relleno del indicador marcado */
  --g-color-border-control: #8a6d4b; /* casilla y radio sin marcar: debe llegar a 3:1 */
  --g-card-scrim: rgb(20 10 0 / 0.66);
  --g-space-1: 5px;                  /* relleno, lead (50px), media lateral (200px) y umbrales de tamaño escalan */
}
```

La marca lee el rol `-text` de la familia (`primary-text`, `accent-text`, `neutral-text`) y el indicador se rellena con la familia (`primary`, `accent`, `neutral`) con su `on-*` encima. Consume además `--g-color-{info|success|warning|danger}[-soft|-text]`, `--g-color-surface`, `--g-color-text`, `--g-color-text-muted`, `--g-color-border`, `--g-color-border-strong`, `--g-color-border-control`, `--g-color-neutral-soft`, `--g-color-focus`, `--g-focus-width`, `--g-focus-offset`, `--g-border-width`, `--g-radius-*`, `--g-space-*`, `--g-font-ui`, `--g-text-*`, `--g-shadow-2`, `--g-duration-{fast|press|slow|spin}`, `--g-ease-{standard|out}` y la propiedad `--g-surface-padding` que publica `GSurface`. Los umbrales de tamaño (`space × 80` y `× 130`) son constantes de diseño, no tokens. El CLI **aún no emite** los `--g-card-*`: los temas generados usan los de `defaults.css`.

## Clases

Las emite el componente y las estiliza `GCard.css` sobre las de `GSurface`:

- **Raíz:** `g-card` + `g-surface--*`; `g-card--orientation-*`, `--color-*`, `--media-*`, `--interaction-*` (la efectiva), `--size-*`, `--layout-*`, `--status-*`; `data-size`, `data-layout`; `is-interactive`, `is-selected`, `is-current`, `is-disabled`, `is-loading`, `is-empty`, `has-status`, `is-expanded`.
- **Elementos:** `__media` (`--inline`), `__scrim`, `__main`, `__body`, `__stack`, `__header`, `__selectbox[data-type]` > `__select` + `__tick` (`--static` en `toggle`), `__lead`, `__titles`, `__eyebrow`, `__title[data-lines]` > `__primary`, `__subtitle`, `__aside`, `__current`, `__menu`, `__content`, `__description[data-lines]`, `__expand`, `__status`, `__empty`, `__meta` > `__meta-item` (`--low`), `__more`, `__more-toggle`, `__actions`, `__footer`, `__skeleton` > `__sk` (`--eyebrow|title|meta|footer|btn|circle`), `__live`.
- **Modo lista:** sin clase propia; el CSS lo reconoce por `li.g-card.g-card--orientation-horizontal.g-surface--level-flat`.

## Limitaciones conocidas

- **`GCardGroup`** (selección de grupo con `v-model`, mínimo y máximo) y **`GAvatar`** quedan diferidos: radios con `name` común y `role="radiogroup"` tuyo; el avatar va en `lead`.
- **Sin menú de clic derecho, `subgrid` ni tooltip** para solo iconos (el nombre accesible sí está).
- **Sin selección de texto con el puntero** en una tarjeta navegable (enlace estirado).
- **Personalidad:** el círculo de selección necesita anclaje CSS (`anchor()`); sin él, el tinte se funde. El halo solo existe con ratón o lápiz sobre hover; la tarjeta con media de fondo no lo lleva.
- **El esqueleto no promete la altura** de la tarjeta cargada; `skeleton` fiel reduce el salto.
- **Chevron en «Mostrar más» y «Más detalles»:** el CSS ya lo contempla; el componente todavía no lo renderiza (pendiente de bruno).
- **Sin verificar:** lector de pantalla real (nombre del `article` sin `aria-labelledby`, título-enlace, `aria-busy`, `role="status"`/`"alert"`, «Acciones de Título»), táctil real (pulsación larga sobre el enlace estirado), zoom al 200 %, `forced-colors` real de Windows (solo emulado), rendimiento con cientos de tarjetas (un `ResizeObserver` por tarjeta) y el esqueleto con datos ausentes reales.

## Fuentes

- API: [`GCard.meta.json`](./GCard.meta.json) · Contrato: [`design/contracts/card.md`](../../../../../design/contracts/card.md) · Prototipo: [`design/lab/card/r01/`](../../../../../design/lab/card/r01/) · Estilo: [`design/lab/card/estilo.md`](../../../../../design/lab/card/estilo.md) · Personalidad: [`design/lab/personalidad/r01/`](../../../../../design/lab/personalidad/r01/) · Auditoría: [`design/lab/card/auditoria.md`](../../../../../design/lab/card/auditoria.md)
