# Contrato · Reviews (`GbReviews01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #909 a #914, #912 y #920, 2026-10-23) · **Plan:** E6 (§4.2; adelantado de P2 a P1 por la calificación textual, §36) · **Entrada:** `@grana/blocks/ecommerce` · **Común:** `_comun.md` §1 a §5 y §26 a §38; anatomía de la cita de `testimonials.md` · **Compone:** `GSection`, `GStack`, `GAdaptiveLayout`, `GCard`, `GMetric`, `GProgress` (decorativa), `GAvatar`, `GText`, `GBtn`, `GPagination`, `GEmpty` · **Parte de bruno:** B

## Promesa

Lo que opinan quienes compraron este producto: **la calificación en palabras con cuántas la sostienen, cómo se reparten y cada opinión entera, con su fecha, lo que compró y la respuesta de la tienda**.

## Props

```ts
interface GbReviewsProps {
  title: string                        // «Opiniones»
  description?: string
  summary?: ReviewSummary              // average, max, count, distribution (de la aplicación)
  reviews: Review[]                    // la página (0 a 20; C7 por encima de 20)
  total?: number; page?: number; pageSize?: number   // v-model:page
  action?: Action                      // «Escribir una opinión» (secundaria)
  locale?: string
  labels: {
    average: string                    // rótulo de GMetric («Calificación media»)
    outOf: string | ((max: string) => string)        // unidad del promedio en GMetric: «de {max}»
    count: string | ((count: number) => string)      // contexto de GMetric: «{count} opiniones»
    noReviews: string                  // «Todavía sin opiniones»
    score: string | ((r: { value: string; max: string }) => string)    // la de cada opinión: «{value} de {max}»
    row: string | ((r: { value: string; max: string; count: number; countText: string; percent: string }) => string)   // fila de la distribución: «{value} de {max}: {count} ({percent})»
    distribution?: string              // nombre de la lista de la distribución («Cómo se reparten»)
    verified?: string                  // «Compra verificada» (verified: true)
    bought?: string                    // rótulo de lo que compró («Compró»)
    reply?: string | ((author: string) => string)   // «Respuesta de {author}»
    pagination?: GranaLabels           // a GPagination
    external?: string
  }
}
```

## Anatomía de una opinión (común)

```
figure                                   (GText as="figure"; en tarjeta size="body-sm")
├─ GText size="body-sm" › la puntuación en palabras («5 de 5») + `strong` title (si hay)
├─ blockquote [lang] [cite = source.href] (GText as="blockquote") › p × párrafos de `quote`
└─ figcaption (GText size="body-sm" tone="muted")
   ├─ author.name (· author.place) · <time datetime=date> (fecha en palabras, sin relativas)
   ├─ verified (labels.verified o el texto) · lo que compró (labels.bought + ChosenOption en «Talla M · Color Grana»)
   └─ cite › source.label (GBtn variant="link" si hay href; externo con marca) — solo si viene de otro sitio
[reply] GText as="div" size="body-sm" › `strong` labels.reply(author) + párrafos + time
```

- **La misma anatomía que Testimonials** (`testimonials.md`, #841, #856): `GText as="figure"` › `blockquote` + `figcaption`; **la cita entera** (sin recorte ni «Leer más»); `lang` en el `blockquote`. Bruno la comparte por `common/` (§32).
- **La puntuación de cada opinión** en texto (`labels.score`, `Intl` sin decimales si es entera), **antes** de la cita: es lo primero que se busca y lo primero que se oye. Sin estrellas (§27 regla 5).
- **La respuesta de la tienda** (`reply`) va **después** de la `figure`, fuera de ella (no es parte de la cita), en el mismo elemento de la lista, con su autor y su fecha.
- **El resumen** (`summary`): `GMetric` (`label` = `labels.average`, `value` = `average` con un decimal en `Intl`, `unit` = `labels.outOf` («de 5»), `context` = `labels.count` con la cuenta en `Intl` («312 opiniones»)), o `labels.noReviews` con `count: 0`. Sin `summary`, sin resumen.
- **La distribución** (`summary.distribution`): **una lista** (`GStack as="ul" gap="sm"`, `aria-label` = `labels.distribution`) de `max` a 1, **con todas las filas aunque cuenten 0** (lo malo no se esconde); cada `li`: `GText size="body-sm"` con `labels.row` (el porcentaje con `Intl` `style: 'percent'`, redondeado al entero: cálculo de vista, §27 regla 4) y, **dentro de un `div aria-hidden="true"`**, un `GProgress` (`value` = `count`, `max` = `summary.count`, `label` = el mismo texto, `showLabel` y `showValue` `false`, `size="sm"`, `color="neutral"`) como barra **decorativa**: una distribución no es un progreso y `role="progressbar"` mentiría al lector (EC-L2; §36).
- **Vacío** (`reviews` vacío y `summary.count` 0 o sin `summary`): `GEmpty cause="none"` con `title` = `labels.noReviews` y la `action` en su slot `actions`.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Lista con resumen** | El resumen en una línea y, debajo, las opiniones una tras otra | `GSection` › `GStack gap="lg"` › `GMetric` + `GStack as="ul" divided` › `li` › opinión + paginación | `distribution` |
| **02 · Resumen y distribución** | A un lado cuánto y cómo se reparte; al otro, las opiniones | `GSection` › `GAdaptiveLayout gap="lg"` › [`div class="g-adapt-short"` › `GMetric` + distribución + `action`] + [`div class="g-adapt-wide"` › `GStack as="ul" divided` › opiniones + paginación] | — |
| **03 · Tarjetas** | Cada opinión en su tarjeta, en rejilla | `GSection` › `GStack gap="lg"` › `GMetric` + `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-wide"` › `GCard as="div" role="group"` (nombre: `aria-labelledby` al autor, #837; `lead` = `GAvatar` decorativo) con la opinión en el cuerpo + paginación | `distribution` |

## Eventos

`update:page` (`GPagination`); `navigate`/`activate` de `action` y de `source` interna (§4).

## Slots

`quote` `{ item }` (escape: contenido rico dentro del `blockquote`, como Testimonials), `description`.

## Estructura accesible

`GSection` con título; el resumen es un `GMetric` (se lee «Calificación media, 4,8 de 5, 312 opiniones»); la distribución es una lista de textos con nombre y sus barras están fuera del árbol de accesibilidad; cada opinión es `figure` › `blockquote` + `figcaption`, con `lang` y `time`; en 03 cada tarjeta es un `group` con el nombre del autor; la paginación, un `nav`. Sin `h1`, sin región viva.

## Qué lo hace distinto (#920)

**La calificación se dice en palabras con cuántas la sostienen, y lo malo no se esconde.** «4,8 de 5 · 312 opiniones», sin estrellas que el lector no ve ni medias estrellas que nadie distingue; la distribución enseña también los «1 de 5» aunque sean pocos, y cada opinión dice qué compró quien la escribe («Talla M») y si su compra está verificada, que es lo que de verdad ayuda a elegir talla en el teléfono. Si la tienda respondió, la respuesta va junto a la opinión, no en otra página. Ninguna opinión se recorta: recortar cambia lo que dice.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `average`, `outOf`, `count`, `noReviews`, `score` | Sí (C5) |
| `row`, `distribution` | Sí, con `summary.distribution` (C5) |
| `verified` | Sí, con alguna `verified: true` (C5) |
| `bought` | Sí, con alguna `options` (C5) |
| `reply` | Sí, con alguna `reply` (C5) |
| `pagination` | Los de `GPagination` (avisa él) |
| `external` | Sí, con una `source` externa (C5) |

## Avisos propios (`[Grana GbReviews<NN>]`)

C1 (sin aviso si hay `summary` con `count: 0`: es el vacío), C2 (opinión sin `quote`, `author.name`, `date` o `rating`), C3, C5, C7, EC2. Además: **RV1** · `rating` de una opinión fuera de 1..`max` (no se pinta la puntuación), **RV2** · `distribution` cuya suma no es `summary.count` (se pinta lo dado; la barra usa `summary.count` como máximo), **RV3** · una cita de más de 1 200 caracteres (se pinta entera).

## Banco (`reviews.bank.js`)

El huipil: `summary` 4.6 de 5 con 128 opiniones y su distribución (5: 92, 4: 21, 3: 8, 2: 3, 1: 4); cinco opiniones (una con `title`, una en inglés con `lang="en"` y dos párrafos, una de 2 de 5 con `reply` de la tienda, una `verified` con `options` Talla M · Grana, una mínima), `total` 128, `pageSize` 5, `action` «Escribir una opinión».

## Verificación propia

Vitest: la puntuación y el resumen en texto con `Intl` (`es-MX` y `en-US`); ningún `img`, icono ni `role="progressbar"` en el árbol de accesibilidad (las barras dentro de `aria-hidden`); todas las filas de la distribución, también las de 0; el porcentaje redondeado y la cuenta tal cual; `reply` fuera de la `figure`; `time` con `datetime`; la cita entera; 03 con `role="group"` nombrado por el autor. Chromium: 02 con las dos columnas a 1440 y en una a 390; las filas de la distribución sin desbordar a 320 con zoom 200 %.
