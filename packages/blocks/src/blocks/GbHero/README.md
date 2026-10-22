# GbHero · GbHero01, GbHero02 y GbHero03

La apertura de una página de sitio: **un `h1`, la foto que vende y una sola acción principal**, en tres formas que comparten los mismos datos. El bloque no pinta nada propio: compone `GHero` (`@grana/vue/hero`), `GBtn` y `GIcon`, decide **cuál botón es el principal** y no pasa a `GHero` lo que la forma elegida no usa, así que cambiar de `GbHero01` a `GbHero03` no toca los datos ni hace avisar a nadie. No trae color, CSS ni textos: el tema lo pone y todo texto de interfaz va en `labels`.

**Etiquetas:** `<gb-hero-01>`, `<gb-hero-02>`, `<gb-hero-03>` · **Estado:** `candidate` (auditoría de coco, ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbHero01, GbHero02, GbHero03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/hero.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Instalación del paquete y reglas comunes: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**Una sola acción principal, decidida por la forma** (DECISIONS #818). El dato no dice qué botón manda: lo dice el bloque, por posición y por apariencia. En el teléfono, el primer toque es siempre «Reservar» (01, 02) o «Ver disponibilidad» dentro de la consulta (03), nunca dos botones sólidos que compiten.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbHeroProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora en silencio.

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| `GbHero01` | La ventana: la foto vista por el vano junto al texto, con una ventana de detalle | `GHero appearance="window"` | `title`, `eyebrow`, `lead`, `aside`, `media`, `detail`, `labels.pause` | `views`, slot `consult` |
| `GbHero02` | Vistas: foto a sangre y una placa de marca con dos a cuatro vistas que la persona elige | `GHero appearance="views"` | `title`, `eyebrow`, `lead`, `aside`, `media`, `views`, `labels.views`, `labels.pause` | `detail`, slot `consult` |
| `GbHero03` | El umbral: foto a sangre y una tarjeta que cruza su borde con la consulta | `GHero appearance="threshold"` y slot `consult` | `title`, `eyebrow`, `lead`, `aside`, `media`, `labels.pause`, slot `consult` | `detail`, `views` |

**Jerarquía de las acciones** (`GBtn size="lg"`, como mucho dos; la tercera se ignora con el aviso C8):

| Caso | Primera | Segunda |
| --- | --- | --- |
| 01 y 02 | `solid` | `link` |
| 03 con slot `consult` | `outline` | `outline` (la consulta es la principal) |
| 03 sin slot `consult` | `solid` | `link` |

En 02 la placa es zona de marca y la acción principal se invierte sola.

## Uso

```vue
<script setup>
import { GbHero01 } from '@grana/blocks/marketing'

const hero = {
  title: 'Casa Alcalá',
  eyebrow: 'Hotel boutique · Centro histórico de Oaxaca',
  lead: 'Doce habitaciones alrededor de un patio de cantera verde, a dos calles de Santo Domingo.',
  aside: 'Desayuno incluido · Llegada desde las 15:00',
  media: { src: '/fotos/patio.jpg', width: 1600, height: 2000, alt: 'Patio con arcos de cantera verde al atardecer' },
  detail: { src: '/fotos/mezcal.jpg', width: 600, height: 600, alt: 'Copa de mezcal sobre barra de madera' },
  actions: [
    { id: 'reservar', label: 'Reservar', href: '/reservar' },
    { id: 'habitaciones', label: 'Ver habitaciones', href: '/habitaciones' }
  ],
  labels: { pause: 'Pausar el movimiento', external: 'se abre en otra pestaña' }
}

function onNavigate({ event, href }) {
  event.preventDefault() // la navegación pasa al router de la aplicación
  // router.push(href)
}
</script>

<template>
  <GbHero01 v-bind="hero" @navigate="onNavigate" />
</template>
```

El mismo `hero` sirve para `GbHero02` y `GbHero03`. Cambiar la importación basta.

## Ejemplos

### e1 · La apertura de un hotel con la foto y una ventana de detalle (`GbHero01`)

**Por qué:** cuando tienes una foto vertical fuerte y una segunda que cuenta un detalle (el mezcal, la fuente). No la uses si solo tienes una foto horizontal: el vano recorta.

```vue
<GbHero01 v-bind="hero" />
```

### e2 · Dos a cuatro vistas de la casa (`GbHero02`)

**Por qué:** cuando la persona decide por el lugar (patio, terraza, habitación) y quieres que lo elija en la propia apertura. Exige `views` (2 a 4, cada una con `media.alt`) y `labels.views`, el nombre del grupo de vistas. Con menos de dos `views` se pinta como 01 y avisa (H1).

```vue
<GbHero02
  v-bind="hero"
  :views="[
    { value: 'patio', label: 'Patio', media: { src: '/fotos/patio.jpg', width: 1600, height: 900, alt: 'Patio de cantera' } },
    { value: 'terraza', label: 'Terraza', media: { src: '/fotos/terraza.jpg', width: 1600, height: 900, alt: 'Terraza de noche' } }
  ]"
  :labels="{ ...hero.labels, views: 'Vistas' }"
/>
```

### e3 · Consultar disponibilidad desde la apertura (`GbHero03`)

**Por qué:** cuando la acción que importa es una consulta (fechas y huéspedes) y no un enlace. La consulta es del slot `consult` (por ejemplo `GBookingBar` de `@grana/vue/booking`) y va **antes** de las acciones en el DOM; las acciones pasan a `outline`.

```vue
<script setup>
import { GbHero03 } from '@grana/blocks/marketing'
import { GBookingBar } from '@grana/vue/booking'
</script>

<template>
  <GbHero03 v-bind="hero">
    <template #consult>
      <GBookingBar kind="stay" title="Consulta disponibilidad" :labels="bookingLabels" />
    </template>
  </GbHero03>
</template>
```

`bookingLabels` y `partyRows` de la consulta son de tu aplicación; el banco trae un juego completo en `hero.bank.js`.

## Props

Una sola interfaz para las tres variantes (`GbHeroProps`). Los tipos `Media` y `Action` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El `h1` de la página (`GHero headingLevel` 1) |
| `eyebrow` | `string` | Antetítulo |
| `lead` | `string` | Párrafo de entrada |
| `aside` | `string` | Dato corto bajo las acciones («Desayuno incluido · Llegada desde las 15:00») |
| `media` | `Media` (requerida) | Foto principal: la prioritaria de la página (`fetchpriority` es de `GHero`) |
| `detail` | `Media` | Segunda ventana; solo la usa 01 |
| `views` | `{ value: string \| number; label: string; media: Media }[]` | De 2 a 4, cada `media` con `alt`; solo la usa 02 |
| `actions` | `Action[] = []` | De 0 a 2: la primera solid y la segunda link (03 con `consult`: las dos outline); más de dos, aviso C8 |
| `labels` | `{ views?: string; pause?: string; external?: string } = {}` | `views` (02), `pause` (con vídeo en el slot `media`), `external` (con una acción externa, C5). Sin valores por defecto |

`Media` es `{ src, srcset?, sizes?, width, height, alt?, decorative?, credit? }` (`width` y `height` reservan el hueco; `credit` solo lo pinta `GHero`). `Action` es `{ id?, label, href?, icon?, external? }`: con `href` es un enlace (`navigate`) y sin `href` un botón (`activate`).

Sin `headingLevel`: el héroe es siempre el `h1`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Action>`) | Activación primaria (clic sin modificadores o Intro) de una acción con `href` no externa; síncrono, antes de navegar. `event.preventDefault()` deja la navegación a tu router |
| `activate` | `{ event, item }` (`BlockActivate<Action>`) | Una acción sin `href` |

Las vistas de 02 no emiten: elegir una vista no es una intención que la aplicación deba atender. Una acción `external` no emite `navigate`. Los enlaces `tel:`, `mailto:` y `sms:` tampoco: los abre el sistema.

## Slots

| Slot | Variantes | Qué va |
| --- | --- | --- |
| `consult` | 03 | La consulta (`GBookingBar`); en 01 y 02 se ignora |
| `media` | las tres | Un `<video muted playsinline loop poster>` de tu aplicación en lugar de la foto (requiere `labels.pause`) |
| `actions` | las tres | Escape: sustituye a los botones generados desde `actions`; la jerarquía pasa a ser tuya |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro, salvo que se diga otra cosa:

a. `section` con nombre por el `h1`; el contenido va antes que la foto en el DOM (contrato `hero.md`). Un solo `h1` por página y es este (`medido`, auditoría; `prueba` en Vitest).
b. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo, también la acción principal invertida en 02 (`medido`, auditoría).
c. Acción principal sin desplazar la página a 390 por 844 en 01 y 03 (`medido`, spec de bruno citado en la auditoría; Chromium).
d. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría).
e. Un enlace externo lleva su nombre en el control, «{label}, {labels.external}», y la marca es decorativa (DECISIONS #832; `prueba`).
f. Movimiento: el de `GHero` (mirada y fundido), auditado en [`design/lab/hero/auditoria.md`](../../../../../design/lab/hero/auditoria.md) (`medido`, 1114/1114 en los tres motores). El bloque no añade ninguno.

> **Peligro.** Un vídeo en el slot `media` sin `labels.pause` se queda sin botón de pausa con nombre: `GHero` avisa en desarrollo (aviso 10), pero en producción la persona no podrá detener un movimiento de más de cinco segundos (WCAG 2.2.2).

## Avisos de desarrollo

Prefijo `[Grana GbHero<NN>]`, una vez por instancia y motivo, solo en desarrollo. Lo que ya avisa `GHero` (por ejemplo `media` sin `width`) no se repite.

| Código | Motivo |
| --- | --- |
| C4 | `detail` (01) o `views[].media` (02) sin `width`/`height` o sin `alt` ni `decorative` |
| C5 | Falta `labels.external` con una acción externa |
| C6 | Un `href` con esquema `javascript:`: se ignora y el `GBtn` queda deshabilitado con su texto |
| C8 | Más de dos `actions`: se pintan las dos primeras |
| H1 | 02 con menos de dos `views`: se pinta como 01 sin `detail` |

## Banco de datos de ejemplo

`hero.bank.js` exporta `{ props, slots }`: Casa Alcalá (título, antetítulo, entradilla, dato, foto 1600 por 2000, ventana 600 por 600, tres vistas, dos acciones, `labels` completos y una consulta mínima). Es el mismo juego que pasa por las tres variantes en Vitest, en el playground y en el spec; no trae errores a propósito, así que ninguna variante avisa con él.

## Peso

`dist/marketing.js` pesa **17 187 B gzip** (`gzip -c`, `medido`, 2026-10-22, según `GbHero.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbHero01` 1821 B, `GbHero02` 1883 B, `GbHero03` 1849 B; tope por variante 4096 B. Los componentes que compone (`@grana/vue/hero`, `@grana/vue`) son *peer* y no cuentan: los paga la aplicación.

## Alcance

- **El `id` es el de `GHero`, no el de la raíz** (DECISIONS #835): `id="inicio"` llega a `GHero` y es la base de sus ids. Para enlazar a la apertura usa `#inicio-title` (el `h1`).
- **Una variante por página:** una página tiene un solo `h1`. Dos héroes avisan (aviso 5 de `GHero`). El banco del playground monta una por carga (`?v=01|02|03`, #836).
- **`v-model:view` de `GHero` queda reservado** en el bloque (las vistas de 02 no emiten).
- **Sin CSS ni utilidades** (#763, #807): lo que falte de forma es un hallazgo para el contrato o para el componente, nunca CSS del bloque. Si quieres la banda a sangre dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbHero` (tres variantes con el mismo banco, sin avisos, `props` compartidas, jerarquía de acciones, `navigate`/`activate`, SSR) | 42/42 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia, 27 variantes | 3916/4327 en Chromium, Firefox y WebKit; los 411 fallos son hallazgos de otras secciones, ninguno de Hero | `medido`, antes de los remates de bruno bc843a6 |
| `GHero` (lo que Hero compone) | 1114/1114 en los tres motores | `medido` |
| Veredicto de coco | Hero pasa a `candidate` sin defecto bloqueante | auditoría |

**No verificado:** Firefox y WebKit tras los remates de bruno (bc843a6) y de coco (#847, #848), que solo se midieron en Chromium; lector de pantalla real; `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso (el área de 44 px no la contratan los bloques); el héroe con vídeo en el slot `media`; WebKit no lleva el Tab a los enlaces con su preferencia por defecto, así que su foco solo se midió donde hay botones o campos.

**Pendientes abiertos:** ninguno de la auditoría afecta a Hero. B-L1 a B-L7 (reservados del lote) en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/hero.md`](../../../../../design/contracts/blocks/hero.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md).
- Decisiones: #763, #764, #815 a #818, #831, #832, #835, #836, #844 en `DECISIONS.md`.
- API de bloques: `docs/contract/api.md` «Grana Blocks».
- Metadatos: [`GbHero.meta.json`](./GbHero.meta.json). Pruebas: [`GbHero.test.js`](./GbHero.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
