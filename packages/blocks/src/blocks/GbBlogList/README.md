# GbBlogList · GbBlogList01, GbBlogList02 y GbBlogList03

Las notas del sitio (guías, novedades, cómo llegar) como una lista de enlaces con **fecha legible y honesta**: en rejilla con foto, en lista con fecha o con una nota destacada. El bloque compone `GSection`, `GAdaptiveLayout`, `GStack`, `GCard` (`interaction="link"`) y `GTag` (`@grana/vue/tag`); no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-blog-list-01>`, `<gb-blog-list-02>`, `<gb-blog-list-03>` · **Estado:** `candidate` (auditoría de coco, ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbBlogList01, GbBlogList02, GbBlogList03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/blog-list.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`; usa también `@grana/vue/tag`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Lo vigente se distingue de lo viejo** (DECISIONS #825). Si una nota tiene `updated`, la fecha que se ve es «Actualizado 3 de octubre de 2026» (no la de publicación), siempre dentro de `<time datetime>` y en el idioma de la página, y va en el antetítulo de la tarjeta, por encima del título. La persona sabe si «Cómo llegar en temporada de lluvias» sigue valiendo antes de abrirla. Nada de «hace 3 días»: cambia con la caché.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbBlogListProps`, el mismo objeto `props` de `props.js`).

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| `GbBlogList01` | Rejilla: tarjetas con foto lado a lado | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem"` (pista `g-adapt-wide`) > `GCard as="article" interaction="link"` | `media` (arriba), fecha, `title`, `excerpt` (3 líneas), `tags` (`GTag` estáticos) | — |
| `GbBlogList02` | Lista con fecha: se lee de arriba abajo, sin fotos | `GSection` > `GStack as="ul" gap="sm"` > `GCard as="li" level="flat" interaction="link"` | fecha, `title`, `excerpt` (2 líneas) | `media`, `tags` |
| `GbBlogList03` | Destacada y lista: la primera nota grande con su foto al lado, las demás en lista | `GSection` > `GStack as="ul" gap="md"` > primera `GCard orientation="auto"` con todo lo de 01, y el resto como 02, en la misma lista | todo en la primera; como 02 en las demás | — |

- **Tarjeta = enlace:** el título es el enlace y la tarjeta entera responde. `navigate` reemite el de `GCard` (clic primario, sin modificadores). Con `external`, la tarjeta abre en otra pestaña y no emite `navigate`.
- **Etiquetas dentro de la tarjeta:** los `GTag` son estáticos (sin `href`): un enlace dentro de otro enlace no se admite.
- **Títulos:** el de cada tarjeta, un nivel por debajo de la sección (`useSectionLevel()`).

## Fechas

`<time datetime="{iso}">` con el texto de `Intl.DateTimeFormat(locale, { dateStyle: 'long' })`. Si el ISO trae hora, se muestra solo la fecha (el día se lee tal como lo escribió tu aplicación, en UTC, así «2026-10-03» es el 3 de octubre en cualquier zona horaria). Una fecha que `Date` no lee se pinta tal cual y avisa (P1). **En SSR da `locale`:** el del servidor y el del navegador pueden diferir.

## Uso

```vue
<script setup>
import { GbBlogList01 } from '@grana/blocks/marketing'

const blog = {
  title: 'Para preparar tu viaje',
  description: 'Guías cortas escritas por la casa.',
  posts: [
    {
      id: 'aeropuerto',
      title: 'Cómo llegar desde el aeropuerto',
      href: '/notas/como-llegar',
      date: '2025-11-20',
      updated: '2026-10-03',
      excerpt: 'Taxi autorizado, colectivo o el traslado de la casa.'
    },
    { id: 'semana-santa', title: 'Horarios de Semana Santa', href: '/notas/semana-santa', date: '2026-03-01' }
  ],
  locale: 'es-MX',
  labels: { updated: 'Actualizado {date}', external: 'se abre en otra pestaña' }
}

function onNavigate({ event, href, item }) {
  event.preventDefault() // item es la nota
  // router.push(href)
}
</script>

<template>
  <GbBlogList01 v-bind="blog" @navigate="onNavigate" />
</template>
```

El mismo `blog` sirve para `GbBlogList02` y `GbBlogList03`.

## Ejemplos

### e1 · Notas con foto y etiquetas (`GbBlogList01`)

**Por qué:** cuando tus notas se reconocen por la foto y quieres que se vean varias a la vez. Las notas sin foto caben, pero se ven pobres junto a las que sí la tienen; si la mayoría no tiene foto, usa 02.

```vue
<GbBlogList01 v-bind="blog" />
```

### e2 · Una lista sobria de guías prácticas (`GbBlogList02`)

**Por qué:** cuando lo que importa es la fecha y el título (horarios, cómo llegar, avisos). Ignora `media` y `tags`. Las notas se separan por aire, sin línea (DECISIONS #843).

```vue
<GbBlogList02 v-bind="blog" />
```

### e3 · La nota del momento y las demás (`GbBlogList03`)

**Por qué:** cuando una nota merece la portada (una fiesta, una temporada) y el resto va debajo. La destacada es la **primera** de `posts`: el orden es el de tu aplicación.

```vue
<GbBlogList03 v-bind="blog" />
```

### e4 · Una nota en otro sitio (`external`)

**Por qué:** para el artículo de una revista que habla de ti. La tarjeta abre en otra pestaña, no emite `navigate` y necesita `labels.external` para decirlo.

```vue
<GbBlogList02
  :title="blog.title"
  :posts="[{ title: 'Casa Alcalá en la guía de hoteles pequeños', href: 'https://revista.example.com/oaxaca/casa-alcala', date: '2026-08-30', external: true }]"
  :labels="{ external: 'se abre en otra pestaña' }"
/>
```

## Props

Una sola interfaz para las tres variantes (`GbBlogListProps`). `Post` y `Media` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (`GSection`) |
| `description` | `string` | Descripción de la sección; el slot `description` la sustituye |
| `posts` | `Post[]` (requerida) | De 1 a 24 (por encima de 24, aviso C7 y se pintan todas); el orden es el de la aplicación |
| `locale` | `string` | BCP 47 para las fechas; sin valor, el del entorno. En SSR conviene darlo |
| `labels` | `{ updated?: DateLabel; external?: string } = {}` | `updated` («Actualizado {date}» o una función), requerido si algún `post` tiene `updated` (C5); `external`, requerido con una nota externa (C5) |

`Post` es `{ id?, title, href, date, updated?, excerpt?, media?, tags?, external? }` (`date` y `updated` en ISO 8601, `tags` una lista de textos). `DateLabel` es `string | ((p: { date: string }) => string)`; en un texto, `{date}` marca dónde va la fecha.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Post>`) | Activación primaria de una tarjeta-enlace no externa (reemite el `navigate` de `GCard`); síncrono, antes de navegar. `item` es la nota |

Una tarjeta `external` no emite `navigate`. Este bloque no emite `activate`: toda nota lleva `href`.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `post` | `{ item: Post; index: number }` | Escape: el contenido de la tarjeta de una nota |
| `description` | — | Sustituye a la prop `description` en la `GSection` |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. Fecha en `<time datetime>` con el ISO, en el idioma de `locale` (`prueba`, Vitest con `es-MX` y `en-US`; `medido`, auditoría).
b. Listas reales: en 01 `role="list"` con los `listitem` como hijos directos; en 02 y 03 `ul` y `li` (`medido`, auditoría; `prueba`).
c. Tarjeta entera como área táctil; el enlace de texto más pequeño de Marketing pasa 2.5.8 por la excepción de separación (`medido`, auditoría).
d. Contraste de todo el texto de Marketing de 4,68:1 como mínimo, que se da justo en el antetítulo de fecha (`medido`, auditoría).
e. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría; Vitest y banco con una palabra larga sin espacios).
f. Nada se mueve (regla 10 de `_comun.md`).

> **Peligro.** Una nota con `updated` y sin `labels.updated` muestra la fecha de actualización **sin prefijo**: se lee como si fuera la de publicación y el viajero no sabe que la nota se revisó (aviso C5). Pasa también si tu `href` es `javascript:` (C6): la tarjeta queda sin interacción.

## Avisos de desarrollo

Prefijo `[Grana GbBlogList<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | `posts` vacío | No pinta nada |
| C2 | Una nota sin `title`, `href` o `date` | Esa nota se omite |
| C3 | `id` repetido | Se usa el índice |
| C4 | `media` sin `width`/`height` o sin `alt` ni `decorative` (01 y la destacada de 03) | Se pinta con `alt=""` y sin reservar hueco |
| C5 | Falta `labels.updated` con un `post` con `updated`, o `labels.external` con una nota externa | Se pinta sin ese texto |
| C6 | Un `href` con esquema `javascript:` | La tarjeta queda sin interacción |
| C7 | Más de 24 notas | Se pintan todas |
| P1 | `date` o `updated` que `Date` no lee | Se pinta el texto tal cual |
| P2 | `updated` anterior a `date` | Aviso |

## Banco de datos de ejemplo

`blog-list.bank.js` exporta `{ props, slots }`: seis notas de Casa Alcalá (cómo llegar, con `updated`; Guelaguetza, con foto y etiquetas; mezcal, con foto y fecha con hora; una con una palabra larga sin espacios; un artículo externo; una mínima con solo `title`, `href` y `date`), `locale: 'es-MX'` y `labels` completos. Sin errores a propósito: con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 187 B gzip** (`medido`, 2026-10-22, según `GbBlogList.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbBlogList01` 2369 B, `GbBlogList02` 2128 B, `GbBlogList03` 2431 B; tope por variante 4096 B. `@grana/vue` y `@grana/vue/tag` son *peer*: los paga la aplicación.

## Alcance

- **Sin línea entre notas en 02 y 03** (DECISIONS #843): `GStack divided` no pinta sobre tarjetas con superficie y las separa el `gap`. La línea entre tarjetas planas queda reservada (B-L6).
- **Sin enlaces dentro de la tarjeta:** los `GTag` son estáticos.
- **Sin paginación, búsqueda ni filtro de etiquetas:** el bloque pinta la lista que le das; recortarla y ordenarla es de tu aplicación.
- **Sin CSS ni utilidades** (#763, #807). Si quieres la banda a sangre dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbBlogList` (tres variantes con el mismo banco, sin avisos, `props` compartidas, `<time datetime>` en `es-MX` y `en-US`, `updated` con `labels.updated`, 02 sin imágenes, 03 en una sola lista, `GTag` sin `href`, `navigate` reemitido, SSR) | 46/46 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia, 27 variantes | 3916/4327 en Chromium, Firefox y WebKit; los 411 fallos son hallazgos abiertos de otras secciones, y el único que toca a Blog list es el alto de las filas de 01 (MK-L2) | `medido`, antes de los remates de bruno bc843a6 |
| MK-L2 (filas de tarjetas de distinto alto en 01) | Cerrado por coco (#847, `GAdaptiveLayout.css`): tarjetas de una misma fila con el mismo alto a 1440 y 390 | `medido`, solo Chromium |
| Veredicto de coco | Blog list pasa a `candidate` sin defecto bloqueante | auditoría |

**No verificado:** Firefox y WebKit tras el cierre de MK-L2 (#847), que solo se midió en Chromium; lector de pantalla real (la lectura de `<time>` con «Actualizado …»); `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** MK-N3 (sin línea entre notas en 02 y 03) es conforme a contrato (#843); B-L6 reservado.

## Fuentes

- Contrato: [`design/contracts/blocks/blog-list.md`](../../../../../design/contracts/blocks/blog-list.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md).
- Decisiones: #763, #764, #815 a #817, #825, #843, #844, #847 en `DECISIONS.md`.
- Metadatos: [`GbBlogList.meta.json`](./GbBlogList.meta.json). Pruebas: [`GbBlogList.test.js`](./GbBlogList.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
