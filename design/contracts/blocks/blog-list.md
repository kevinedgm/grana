# Contrato · Blog list (`GbBlogList01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #815 a #817 y #825, 2026-10-22) · **Plan:** M13 (§4.1) · **Entrada:** `@grana/blocks/marketing` · **Común:** `_comun.md` · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GCard` (`interaction="link"`), `GTag` (`@grana/vue/tag`)

## Promesa

Las notas del sitio (guías, novedades, cómo llegar) como una lista de enlaces con **fecha legible y honesta**: en rejilla con foto, en lista con fecha o con una destacada.

## Props

```ts
interface GbBlogListProps {
  title: string
  description?: string
  posts: Post[]                        // 1 a 24 (C7 por encima de 24); el orden es el de la aplicación
  locale?: string                      // BCP 47 para las fechas; sin valor, el del entorno (Intl)
  labels?: {
    updated?: string | ((p: { date: string }) => string)   // «Actualizado {date}»
    external?: string
  }
}
```

**Fechas:** `<time datetime="{iso}">` con el texto de `Intl.DateTimeFormat(locale, { dateStyle: 'long' })` (con hora en el ISO, solo la fecha). Una fecha que no se lee se pinta tal cual con aviso P1. En SSR conviene dar `locale` (el del servidor y el del navegador pueden diferir).

## Variantes

| Variante | Concepto | Compone | Usa | Ignora |
| --- | --- | --- | --- | --- |
| **01 · Rejilla** | Tarjetas con foto lado a lado | `GSection` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-wide"` › `GCard as="article" interaction="link"` | `media` (slot `media`, arriba), fecha (slot `eyebrow`), `title`, `excerpt` (`description`, `descriptionLines` 3), `tags` (`GTag` estáticos en `footer`) | — |
| **02 · Lista con fecha** | Una lista que se lee de arriba abajo, sin fotos | `GSection` › `GStack as="ul" divided` › `GCard as="li" level="flat" interaction="link"` | fecha (`eyebrow`), `title`, `excerpt` (`descriptionLines` 2) | `media`, `tags` |
| **03 · Destacada + lista** | La primera nota grande con su foto al lado; las demás en lista | `GSection` › `GStack as="ul" gap="md"` › primer `GCard as="li" orientation="auto" mediaPosition="start"` (todo lo de 01) + el resto como 02 (en la misma lista) | todo en la primera; como 02 en las demás | — |

**Tarjeta = enlace:** `GCard interaction="link"` con `href`; el título es el enlace y la tarjeta entera responde (`card.md`); `navigate` se reemite (guarda #505 de la tarjeta); con `external`, `target="_blank"` y sin `navigate` (#574). Los `GTag` dentro son **estáticos** (sin `href`): un enlace dentro de otro no se admite. `GCard headingLevel` un nivel por debajo de la sección.

## Eventos y slots

`navigate`. Slot `post` `{ item, index }` (escape: el contenido de la tarjeta de un elemento).

## Qué lo hace distinto (#825)

**Lo vigente se distingue de lo viejo.** Si una nota tiene `updated`, la fecha que se ve es «Actualizado 3 de octubre de 2026» (no la de publicación), siempre en `<time datetime>` y en el idioma de la página: el viajero sabe si «Cómo llegar en temporada de lluvias» sigue valiendo antes de abrirla. La fecha va en el antetítulo de la tarjeta, por encima del título, para que se lea primero.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `updated` | Sí, si algún `post` tiene `updated` (C5; sin él se pinta la fecha de `updated` sin prefijo) |
| `external` | Sí, con un `post` externo (C5) |

## Avisos propios (`[Grana GbBlogList<NN>]`)

Comunes C1 a C7. Además: **P1** · `date` o `updated` que `Date` no lee (se pinta el texto tal cual), **P2** · `updated` anterior a `date`.

## Banco (`blog-list.bank.js`)

Cinco notas: «Cómo llegar desde el aeropuerto» (con `updated`), «Guelaguetza 2026» (con `media` y `tags`), «Mezcal en Santiago Matatlán» (`media`), una con la palabra larga de §7 en el título, una externa (artículo en una revista), una mínima (`title`, `href`, `date`); `locale: 'es-MX'`; `labels` completos.

## Verificación propia

Vitest: `<time datetime>` con el ISO y el texto de `Intl` para `es-MX` y `en-US`; `updated` gana con `labels.updated`; 02 sin imágenes; 03 una sola lista con la primera horizontal; `GTag` sin `href` dentro de la tarjeta; `navigate` de la tarjeta reemitido. Chromium: sin desbordamiento a 320 con la palabra larga.
