# GbTestimonials · GbTestimonials01, GbTestimonials02 y GbTestimonials03

Lo que dicen quienes ya estuvieron, **entero, en su idioma y con su fuente**: en tarjetas iguales, con una voz destacada y las demás debajo, o en una lista que asoma con el nombre y la primera línea a la vista. El bloque compone `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GAvatar`, `GAccordion`, `GBtn` y `GText`; no trae color, CSS ni textos propios (el tema lo pone y lo que no viene en tus datos va en `labels`).

**Etiquetas:** `<gb-testimonials-01>`, `<gb-testimonials-02>`, `<gb-testimonials-03>` · **Estado:** `candidate` (ver «Verificación») · **Desde:** `0.0.0` (paquete privado, aún sin publicar) · **Entrada:** `@grana/blocks/marketing`

```js
import { GbTestimonials01, GbTestimonials02, GbTestimonials03 } from '@grana/blocks/marketing'
```

> `@grana/blocks` es privado (`0.0.0`) y no se publica con la beta `0.1.0` de `@grana/vue`. Por ahora se usa desde el repositorio (banco real en `packages/blocks/playground/marketing/testimonials.html`). Exige `@grana/vue` (peer, `>=0.1.0-beta.0 <1.0.0`) y Vue `^3.5.0`. Reglas comunes e instalación: [`packages/blocks/README.md`](../../../README.md).

## Qué lo hace distinto

**La cita entera y su fuente a la vista** (DECISIONS #821). Nada de carrusel (2.2.2) ni de opiniones recortadas con «Leer más»: recortar una reseña cambia lo que dice. La fuente siempre está visible y enlazada (`cite`), así que se puede comprobar, y cada cita lleva su `lang`: la reseña de una viajera de Toronto se queda en inglés y el lector de pantalla la pronuncia en inglés (3.1.2), en lugar de una traducción que nadie firmó. En 03, el nombre y la primera línea bastan para recorrer muchas opiniones en el teléfono sin desplegar ninguna.

## Las tres variantes

Las tres reciben la misma `interface Props` (`GbTestimonialsProps`, el mismo objeto `props` de `props.js`). Lo que una forma no usa, lo ignora.

| Variante | Concepto | Compone |
| --- | --- | --- |
| `GbTestimonials01` | Tarjetas: todas las opiniones en tarjetas iguales | `GSection` > `GAdaptiveLayout role="list"` > `div role="listitem"` (pista `g-adapt-wide`) > `GCard as="div"` sin título, con `GAvatar size="lg"` en `lead` y la `figure` en el cuerpo |
| `GbTestimonials02` | La voz: la primera opinión destacada y el resto debajo, más discretas | `GSection` > `GStack gap="lg"` > [`GCard orientation="auto" mediaPosition="start"` con `GAvatar size="xl"` en `media` y la primera `figure`] + [`GStack as="ul" divided` > `li` > `figure` de las demás] |
| `GbTestimonials03` | Avance: una lista que asoma, la opinión entera al abrir | `GSection` > `GAccordion` (un nivel por debajo) > `GAccordionItem` por opinión: `title` = `author.name`, `meta` = `source.label`, `peek` = primer párrafo de `quote`; el panel lleva la `figure` completa |

**Anatomía de una opinión** (la misma en las tres):

```text
figure
├─ blockquote [lang] [cite = source.href]
│  └─ p × párrafos de `quote`
└─ figcaption
   ├─ author.name · author.role
   └─ cite > source.label  (GBtn variant="link" si hay source.href)
```

- **El avatar** va fuera de la `figure`, en el hueco `lead` de la tarjeta (en 02, `media`), y es decorativo: el nombre ya está en el `figcaption`. En 02 el hueco adopta la caja del avatar.
- **Nombre de la tarjeta (01 y 02):** sin título visible, la tarjeta es un `role="group"` cuyo nombre es el del autor (#837).
- **La cita no se recorta** (sin `descriptionLines` ni «Leer más»). `quote` es texto plano; los párrafos se separan con una línea en blanco.
- **`rating` queda reservado:** no hay icono de estrella en la lista de la librería. Una calificación agregada («4,8 de 5») va en Stats.

## Dónde va `GText`

`GText` es la primitiva de texto suelto de `@grana/vue` ([`GText/README.md`](../../../../vue/src/components/GText/README.md)). La `figure`, el `blockquote` y el `figcaption` son tres `GText` anidadas: la de fuera da la pausa entre la cita y su pie y la de la cita, la de sus párrafos.

| Variante | Texto suelto | `GText` |
| --- | --- | --- |
| 01 y la destacada de 02 (en tarjeta) | `figure` > `blockquote` > `p` + `figcaption` | `as="figure" size="body-sm"` > `as="blockquote" size="body-sm" :lang :cite` (los `p` de `quote`, o el slot `quote`, dentro) + `as="figcaption" size="body-sm" tone="muted"` |
| Las de la lista de 02 y el panel de 03 | ídem | `as="figure"` > `as="blockquote" :lang :cite` + `as="figcaption" size="body-sm" tone="muted"` |

- **En tarjeta** el contexto es `body-sm` (el cuerpo de `GCard`); en la lista de 02 y en 03, `body`.
- La cita arranca en el borde de la figura (sin la sangría de 40 px del navegador) y `cite` y el nombre no salen en cursiva.
- `lang` y `cite` van a la raíz del `blockquote`. El slot `quote` recibe la misma tipografía.
- El `peek` de 03 es de un slot de `GAccordionItem` con rol propio: **no** lleva `GText`.

## Uso

```vue
<script setup>
import { GbTestimonials01 } from '@grana/blocks/marketing'

const testimonials = {
  title: 'Lo que dicen quienes ya vinieron',
  description: 'Opiniones enteras, en su idioma y con su fuente.',
  items: [
    {
      id: 'lucia',
      quote: 'Despertar con el patio lleno de luz y el chocolate de metate ya servido.',
      author: { name: 'Lucía Hernández', role: 'Viajó en pareja', avatar: '/fotos/lucia.jpg' },
      source: { label: 'Google, septiembre de 2026', href: '/opiniones#google' }
    },
    {
      id: 'emily',
      lang: 'en',
      quote: 'We booked two nights and stayed five.\n\nThe rooftop at sunset is the best view in the city.',
      author: { name: 'Emily Clarke', role: 'Toronto' },
      source: { label: 'Google, August 2026', href: 'https://maps.google.com/?q=Casa+Alcala+Oaxaca', external: true }
    }
  ],
  labels: { external: 'se abre en otra pestaña' }
}
</script>

<template>
  <GbTestimonials01 v-bind="testimonials" />
</template>
```

El mismo `testimonials` sirve para `GbTestimonials02` y `GbTestimonials03`.

## Ejemplos

### e1 · Todas las voces al mismo nivel (`GbTestimonials01`)

**Por qué:** cuando tienes varias opiniones de peso parecido y quieres que se lean juntas. Con 12 como tope recomendado (por encima, aviso C7 y se pintan todas).

```vue
<GbTestimonials01 v-bind="testimonials" />
```

### e2 · Una voz que manda y las demás que la acompañan (`GbTestimonials02`)

**Por qué:** cuando una opinión resume la casa y las otras la confirman. La **primera** de `items` es la destacada: el orden del dato es el orden de jerarquía.

```vue
<GbTestimonials02 v-bind="testimonials" />
```

### e3 · Muchas opiniones en un teléfono (`GbTestimonials03`)

**Por qué:** cuando hay más de cuatro y no quieres una pared de texto. Cada una asoma con el nombre, la fuente y su primera línea; la persona abre la que quiere leer entera. El `peek` sale del primer párrafo de `quote`; si usas el slot `quote`, sigue saliendo de ahí.

```vue
<GbTestimonials03 v-bind="testimonials" />
```

### e4 · Una cita con enlaces (slot `quote`)

**Por qué:** cuando la cita necesita algo que el texto plano no cubre. El slot sustituye el contenido del `blockquote`; la `figure`, el pie y la fuente siguen saliendo de los datos.

```vue
<GbTestimonials01 v-bind="testimonials">
  <template #quote="{ item }">
    <p>{{ item.quote }}</p>
  </template>
</GbTestimonials01>
```

## Props

Una sola interfaz para las tres variantes (`GbTestimonialsProps`). `Testimonial` sale de `@grana/blocks/marketing`.

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `title` | `string` (requerida) | El título de la sección (`GSection`) |
| `description` | `string` | Descripción de la sección; el slot `description` la sustituye |
| `items` | `Testimonial[]` (requerida) | De 1 a 12 (por encima de 12, aviso C7 y se pintan todas) |
| `labels` | `{ external?: string } = {}` | `external` («se abre en otra pestaña»), requerido con una `source` externa (C5) |

`Testimonial` es `{ id?, quote, lang?, author: { name, role?, avatar? }, source?: { label, href?, external? } }`. `author.avatar` es la URL de la foto.

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `navigate` | `{ event, href, item }` (`BlockNavigate<Testimonial>`) | Activación primaria del enlace de una `source` con `href` interno; `item` es la opinión |

Una `source` `external` no emite `navigate` (las fuentes suelen ser externas); `tel:`, `mailto:` y `sms:` tampoco. No hay `activate`: una fuente siempre es un enlace.

## Slots

| Slot | Alcance | Qué va |
| --- | --- | --- |
| `quote` | `{ item: Testimonial }` | Escape: contenido rico dentro del `blockquote` de cada opinión |
| `description` | — | Sustituye a la prop `description` en la `GSection` |

## Accesibilidad

Cifras de la auditoría de coco ([`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md)) sobre las 27 variantes de Marketing, tres motores, tres temas, claro y oscuro:

a. `figure` > `blockquote` + `figcaption` en las tres; la `figure` toma su nombre del pie. La tarjeta de 01 y 02 es un `group` con el nombre del autor (`prueba`, Vitest; `medido`, auditoría).
b. Cada cita lleva su `lang` en el `blockquote` (3.1.2) y el nombre y la fuente no van en cursiva (`prueba`).
c. Contraste de todo el texto pintado de Marketing de 4,68:1 como mínimo, también la fuente de una opinión (`medido`, auditoría).
d. El enlace de la fuente (`GBtn variant="link"`, de 20 a 22 px de alto) cumple 2.5.8 por la excepción de separación en los tres motores (`medido`, MK-N2).
e. Una fuente externa lleva su nombre en el control, «{label}, {labels.external}», y la marca es decorativa (DECISIONS #832; `prueba`).
f. Sin desplazamiento horizontal a 1440, 390 y 320 px, ni a 320 con el texto al 200 % (`medido`, auditoría). En 01 las tarjetas de una misma fila tienen el mismo alto (`medido` en Chromium, tras #847).
g. Sin carrusel, sin cita recortada y sin movimiento propio. En 03 el movimiento es el de `GAccordion` «Avance», auditado aparte en la rúbrica de movimiento de la auditoría.

> **Peligro.** Una cita en otro idioma sin `lang` se lee con la voz del idioma de la página: el lector de pantalla la pronuncia mal y la persona no entiende una opinión que sí estaba bien escrita. Pon `lang` en cada opinión que no esté en el idioma de la página. Y una opinión sin `source` se pinta (aviso T1), pero deja de ser comprobable.

## Avisos de desarrollo

Prefijo `[Grana GbTestimonials<NN>]`, una vez por instancia y motivo, solo en desarrollo.

| Código | Motivo | Qué pasa |
| --- | --- | --- |
| C1 | `items` vacío | No pinta nada |
| C2 | Una opinión sin `quote` o sin `author.name` | Esa opinión se omite |
| C3 | `id` repetido | Se usa el índice |
| C5 | Falta `labels.external` con una `source` externa | Se pinta sin ese texto |
| C6 | Un `href` con esquema `javascript:` | La fuente es un `GBtn` deshabilitado, sin enlace |
| C7 | Más de 12 opiniones | Se pintan todas |
| T1 | Una opinión sin `source` | Se pinta igual (una opinión sin fuente no es comprobable) |
| T2 | Una cita de más de 600 caracteres | Se pinta entera; se recomienda elegir un fragmento con su enlace |

## Banco de datos de ejemplo

`testimonials.bank.js` exporta `{ props, slots }`: cuatro opiniones de Casa Alcalá, dos en español (Google con `href` interno y TripAdvisor con `href` externo), una en inglés con `lang="en"` y dos párrafos, y una mínima (`quote`, `author.name` y `source.label` sin `href` ni foto), más `labels` completos y una palabra larga sin espacios para la prueba de 320 px. Todas con `source`: con él ninguna variante avisa.

## Peso

`dist/marketing.js` pesa **17 446 B gzip** (`medido`, 2026-10-22, según `GbTestimonials.meta.json`; tope conjunto de la entrada **18 432 B**, DECISIONS #844). Una variante importada sola (esbuild minificado, `vue` y `@grana/vue*` externos): `GbTestimonials01` 2460 B, `GbTestimonials02` 2535 B, `GbTestimonials03` 2447 B; tope por variante 4096 B. `@grana/vue` es *peer*: lo paga la aplicación.

## Alcance

- **Sin carrusel ni cita recortada** (#821): ni «Leer más» ni `rating` (reservado, sin icono de estrella).
- **La destacada de 02 es la primera de `items`:** el bloque no tiene una prop `featured`.
- **Sin CSS ni utilidades** (#763, #807). Las únicas clases que escribe son las pistas `g-adapt-*`; si quieres la banda a sangre dentro de un `GContainer`, `class="g-bleed"` va en la raíz y llega por `$attrs`.
- **Sin `fetch`, sin estado de negocio, sin región viva propia** (#780, #792).
- **Anotado:** MK-C5 (el título de cada opinión de 03 medía lo mismo que el de su sección) lo cerró coco con #848 en `GAccordion.css`.

## Verificación

| Qué | Resultado | Nivel |
| --- | --- | --- |
| Vitest de `GbTestimonials` (tres variantes con el mismo banco, sin avisos, `props` compartidas, `figure > blockquote + figcaption` con `GText` y su `size`, `lang`, `cite`, `peek`, grupo con el nombre del autor, `navigate`, C5/C6/T1/T2, SSR) | 50/50 (`npm test -w @grana/blocks`, 2026-10-22) | `prueba` |
| Verificador propio de la familia con `GText` real, 27 variantes, tema por defecto, rústico y lujo, claro y oscuro (36 `GText` reales en Testimonials, 0 `p` desnudos) | 4327/4327 en Chromium, Firefox y WebKit (coco, addendum de `design/lab/blocks/marketing/auditoria.md`, tras baea37f) | `medido` |
| Veredicto de coco | Testimonials puede pasar a `candidate`: MK-L1 en 0; MK-C4 (avatar en `media`) y MK-C5 cerrados | auditoría |

**No verificado:** lector de pantalla real (la cita en inglés dentro de una página en español, el nombre de la `figure` por su `figcaption`); `forced-colors` en Firefox y WebKit; teléfono real y puntero grueso.

**Pendientes abiertos:** MK-L2 (filas de tarjetas de distinto alto en 01) se cerró con #847 y se verificó en Chromium. B-L1 a B-L7 en `design/contracts/blocks/_comun.md` §11.

## Fuentes

- Contrato: [`design/contracts/blocks/testimonials.md`](../../../../../design/contracts/blocks/testimonials.md) y [`_comun.md`](../../../../../design/contracts/blocks/_comun.md) (§11 B-L5, reparto de `GText`).
- Decisiones: #815 a #817, #821, #837, #841, #842, #844, #851 a #856 en `DECISIONS.md`.
- Metadatos: [`GbTestimonials.meta.json`](./GbTestimonials.meta.json). Pruebas: [`GbTestimonials.test.js`](./GbTestimonials.test.js). Auditoría: [`design/lab/blocks/marketing/auditoria.md`](../../../../../design/lab/blocks/marketing/auditoria.md).
