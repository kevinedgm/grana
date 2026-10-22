# GbFeatures · GbFeatures01, GbFeatures02 y GbFeatures03

Lo que ofrece el lugar en piezas cortas (de una a doce ventajas, lo normal es de tres a seis) que se leen de un vistazo: en rejilla, alternadas con foto o en una columna de lectura, **con el mismo esquema de encabezados en las tres formas**. El bloque compone `GSection`, `GAdaptiveLayout`, `GStack`, `GContainer`, `GCard`, `GIcon` y `GBtn`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-features-01>`, `<gb-features-02>`, `<gb-features-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbFeatures01, GbFeatures02, GbFeatures03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/features.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La ventaja lleva a su prueba** (DECISIONS #819). Cada ventaja puede traer una `action`: «Terraza con vista a Santo Domingo» abre las fotos de la terraza. En 01 y 02 la tarjeta entera es la puerta (un toque grande en el teléfono, sin un «Saber más» genérico repetido seis veces); en 03 es un enlace que dice a dónde va. La persona no tiene que creerse la lista: la comprueba desde ella.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbFeaturesProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| `GbFeatures01` | Rejilla: tarjetas iguales lado a lado con icono | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem"` (pista `g-adapt-standard`) > `GCard` | `icon` (slot `lead`, decorativo), `title`, `description`, `action` | `media` |
| `GbFeatures02` | Alternada: texto y foto, la foto a un lado y al otro | `GSection` > `GStack as="ul"` > `GCard as="li" orientation="auto"`, con `mediaPosition` `start` y `end` alternos | `media` (sin ella, `icon` en `lead`), `title`, `description`, `action` | `icon` cuando hay `media` |
| `GbFeatures03` | Lectura: una columna a medida de lectura, una ventaja tras otra | `GSection` > `GContainer width="reading" horizontal="start"` > `GStack as="ul" divided` > `li` > `GSection` anidada | `title`, `description`, `icon` (antes del título, decorativo), `action` (`GBtn variant="link"`) | `media` |

- **Títulos:** en 01 y 02 el `GCard` lleva un nivel por debajo de la sección (leído con `useSectionLevel()`); en 03 lo pone la `GSection` anidada. Las tres dan el mismo esquema: sección y una entrada por ventaja. Dentro de una `GSection` tuya, el título de cada bloque baja solo.
- **`action`:** en 01 y 02 la tarjeta entera es el enlace (con `href`) o un botón (sin `href`, emite `activate`); en 03 es un `GBtn variant="link"` con `action.label`.
- **Alternancia de 02:** solo cambia `mediaPosition`; el orden del DOM es siempre texto y foto, y en estrecho la tarjeta pasa a una columna.

## Uso

```vue
<script setup>
import { GbFeatures01 } from '@grana/blocks/marketing'

const features = {
  title: 'Por qué Casa Alcalá',
  description: 'Lo que encuentras al llegar, contado en corto.',
  items: [
    { id: 'patio', title: 'Patio de cantera verde', description: 'Doce habitaciones alrededor de un patio con naranjos y fuente.' },
    {
      id: 'terraza',
      title: 'Terraza con vista a Santo Domingo',
      description: 'Al atardecer, con mezcal de la casa.',
      icon: 'image',
      action: { label: 'Ver las fotos de la terraza', href: '/fotos/terraza' }
    },
    { id: 'wifi', title: 'Wifi en toda la casa' }
  ],
  labels: { external: 'se abre en otra pestaña' }
}

function onNavigate({ event, href, item }) {
  event.preventDefault() // item es la ventaja; item.action lleva el destino
  // router.push(href)
}
</script>

<template>
  <GbFeatures01 v-bind="features" @navigate="onNavigate" />
</template>
```

El mismo `features` sirve para `GbFeatures02` y `GbFeatures03`. Un `icon` es un nombre de Lucide: los de la lista de la librería funcionan solos; los demás los registra tu aplicación con `createIcons` (el banco registra `coffee` y `wifi` así).

## Ejemplos

### e1 · Seis ventajas de un vistazo (`GbFeatures01`)

**Por qué:** cuando las ventajas son cortas, parejas y llevan icono. Ignora `media`: no la uses si tus ventajas se explican con foto. Con cuatro o más, en pantalla ancha el reparto puede dejar dos tarjetas más anchas en la última fila (observación MK-N1 de la auditoría).

```vue
<GbFeatures01 v-bind="features" />
```

### e2 · Ventajas que se enseñan con foto (`GbFeatures02`)

**Por qué:** cuando la foto es la prueba (el patio, el desayuno). Si ninguna ventaja trae `media` se pinta, pero sin la alternancia que da sentido a la forma, y avisa (F1). Las ventajas sin foto usan su `icon`.

```vue
<GbFeatures02
  :title="features.title"
  :items="[
    { id: 'patio', title: 'Patio de cantera verde', description: 'Con naranjos y fuente.', media: { src: '/fotos/patio.jpg', width: 1200, height: 900, alt: 'Patio con arcos de cantera verde' } },
    { id: 'desayuno', title: 'Desayuno oaxaqueño', description: 'Chocolate de metate y pan de yema.', media: { src: '/fotos/desayuno.jpg', width: 1200, height: 900, alt: 'Desayuno con chocolate y pan de yema' } }
  ]"
/>
```

### e3 · Una lectura pausada, una ventaja tras otra (`GbFeatures03`)

**Por qué:** cuando cada ventaja merece una frase entera y un enlace que diga a dónde lleva. La columna es de lectura y va al inicio, a ras del título de la sección.

```vue
<GbFeatures03 v-bind="features" />
```

### e4 · Cambiar el cuerpo de una ventaja (slot `item`)

**Por qué:** cuando una ventaja necesita algo que los datos no cubren (un precio, una cifra). El slot sustituye **el cuerpo**; el título, el icono, el nivel del encabezado y la tarjeta-enlace siguen saliendo de los datos.

```vue
<GbFeatures01 v-bind="features">
  <template #item="{ item, index }">
    <p>{{ item.description }} ({{ index + 1 }})</p>
  </template>
</GbFeatures01>
```

## Props

Una sola interfaz para las tres variantes (`GbFeaturesProps`). `Feature`, `Media` y `Action` salen de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (`GSection`) |
| `description` | `string` | Descripción de la sección; el slot `description` la sustituye |
| `items` | `Feature[]` (requerida) | De 1 a 12 (por encima de 12, aviso C7 y se pintan todas) |
| `labels` | `{ external?: string } = {}` | `external` («se abre en otra pestaña»), requerido con una `action` externa (C5) |

`Feature` es `{ id?, title, description?, icon?, media?, action? }`. `Media` es `{ src, srcset?, sizes?, width, height, alt?, decorative?, credit? }`; `Action`, `{ id?, label, href?, icon?, external? }`.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Feature>`) | Activación primaria de la `action` con `href` no externa; en 01 y 02 reemite el de `GCard`. `item` es la **ventaja**, no su `action` (`item.action` lleva el destino) |
| `activate` | `{ event, item }` (`BlockActivate<Feature>`) | Una `action` sin `href`; `item` es la ventaja |

Una `action` `external` no emite `navigate`; `tel:`, `mailto:` y `sms:` tampoco.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `item` | `{ item: Feature; index: number }` | Escape: sustituye **el cuerpo** del elemento (cuerpo de la tarjeta en 01 y 02; cuerpo de la sección anidada en 03) |
| `description` | — | Sustituye a la prop `description` en la `GSection` |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. Listas reales: en 01 `role="list"` con los `listitem` como hijos directos; en 02 y 03 `ul` y `li`. Una lista de un solo elemento sigue siendo lista (`medido`, auditoría; `prueba`, Vitest).
b. Encabezados por anidación: cada ventaja un nivel por debajo de la sección y sin saltos; dentro de una `GSection` de la aplicación (`?anidado=1`) el título de cada bloque baja a `h3` (`medido`, auditoría).
c. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo (`medido`, auditoría).
d. Una tarjeta con `action` usa la tarjeta entera como área táctil (`medido`, auditoría, 2.5.8).
e. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría; mide esas 27 variantes con el banco).
f. Nada se mueve: ni carrusel ni aparición al desplazar (regla 10 de `_comun.md`).

> **Peligro.** Un `icon` que no es de la lista de la librería y que tu aplicación no registró con `createIcons` no dibuja nada (`GIcon` solo avisa en desarrollo y dice cómo registrarlo): la ventaja queda sin icono en producción. Y `labels.external` es obligatorio con una `action` externa: sin él el enlace sale sin su aviso «se abre en otra pestaña» (aviso C5).

## Avisos de desarrollo

Prefijo `[Grana GbFeatures<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | `items` vacío | No pinta nada |
| C2 | Una ventaja sin `title` | Esa ventaja se omite |
| C3 | `id` repetido | Se usa el índice |
| C4 | En 02, `media` sin `width`/`height` o sin `alt` ni `decorative` | Se pinta con `alt=""` y sin reservar hueco |
| C5 | Falta `labels.external` con una `action` externa | Se pinta sin ese texto |
| C6 | Un `href` con esquema `javascript:` | En 01 y 02 la tarjeta queda sin interacción; en 03 el enlace es un `GBtn` deshabilitado |
| C7 | Más de 12 ventajas | Se pintan todas |
| F1 | En 02, ninguna ventaja trae `media` | Se pinta, sin la alternancia |

## Banco de datos de ejemplo

`features.bank.js` exporta `{ props, slots }`: seis ventajas de Casa Alcalá (patio, terraza, desayuno, ubicación, wifi, traslado), cuatro con `icon` (dos de la librería y dos que registra la página), cuatro con `media` de 1200 por 900, dos con `action` (una con `href` y una externa), una mínima (solo `title`) y una con una palabra larga sin espacios para la prueba de 320 px. Sin errores a propósito: con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbFeatures.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbFeatures01` 1659 B, `GbFeatures02` 1905 B, `GbFeatures03` 2007 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **MK-N1, anotado:** en 01 a 1440 px, con seis ventajas, la primera fila lleva cuatro tarjetas y la segunda dos del doble de ancho. Si molesta, la salida (`--g-adapt-chars` como tope) es un hallazgo para el contrato, no CSS del bloque.
- **La columna de lectura de 03 va al inicio** (`horizontal="start"`, DECISIONS #845): centrada flotaría a la derecha del título de la sección.
- **Sin CSS ni utilidades** (#763, #807). Si quieres la banda a sangre dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`.
- **Texto suelto con `GText`** (#841, #851 a #856): Features no la necesita, porque su texto va en `title` y `description` de `GCard` y `GSection`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbFeatures` (tres variantes con el mismo banco, sin avisos, `props` compartidas, listas, jerarquía de títulos, `navigate`/`activate`, columna de 03 a `start`, SSR) | 46/46 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia, 27 variantes | 3916/4327 en Chromium, Firefox y WebKit; los 411 fallos son hallazgos abiertos (ninguno de contraste, tamaño, área táctil, foco, reflujo ni movimiento) | `medido`, antes de los remates de bruno bc843a6 |
| MK-B2 (columna de 03 flotaba 160 px a la derecha del título) | Corregido por bruno (bc843a6) con `horizontal="start"`; **sin nueva medición de coco**, que dejó el paso a `candidate` sin nueva auditoría | `prueba` |

**No verificado:** la corrección de MK-B2 en el verificador de los tres motores (la auditoría la dio por cerrada sin repetirlo); Firefox y WebKit tras los remates de bruno y de coco, que solo se midieron en Chromium; lector de pantalla real; `forced-colors` real y en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** ninguno de la auditoría bloquea Features. MK-L2 (filas de tarjetas de distinto alto en rejillas) lo cerró coco con #847 en `GAdaptiveLayout.css`, verificado en Chromium.

## Fuentes

- Contrato: [`design/contracts/blocks/features.md`](../../../../../design/contracts/blocks/features.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md).
- Decisiones: #763, #764, #815 a #817, #819, #833, #834, #844, #845 en `DECISIONS.md`.
- Metadatos: [`GbFeatures.meta.json`](./GbFeatures.meta.json). Pruebas: [`GbFeatures.test.js`](./GbFeatures.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
