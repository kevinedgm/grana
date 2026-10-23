# Contrato · Offer list (`GbOfferList01` · `02` · `03`)

**Dueño:** lima · **Estado:** contratado (DECISIONS.md #860 a #866 y #868, 2026-10-22) · **Plan:** B2 (§4.3); receta R4 de `design/lab/marketing/r01/` · **Entrada:** `@grana/blocks/booking` · **Común:** `_comun.md` §1 a §5 y §14 a §25 · **Compone:** `GSection`, `GAdaptiveLayout`, `GStack`, `GCard`, `GPrice` + `GPriceScope` (`@grana/vue/price`), `GGalleryViewer` (`@grana/vue/gallery`), `GBadge` (vía `GCard badge`), `GBtn`, `GText`, `describeQuery` (`@grana/vue/booking`) · **Parte de bruno:** A

## Promesa

Las habitaciones, mesas o recorridos que se pueden pedir, **con su foto, lo que incluyen, su precio y, si ya hay consulta, lo que cuestan para esa consulta**; cada una se elige o se abre, y sus fotos se ven sin salir de la lista.

## Props

```ts
interface GbOfferListProps {
  title: string
  description?: string
  offers: Offer[]                        // 1 a 24 (C7 por encima de 24)
  query?: BookingQuery | null            // la consulta que la lista responde (K1, K2)
  partyRows?: PartyRow[]                 // para decirla (con query)
  context?: Omit<QueryContext, 'partyRows'>   // times/tours para decir una consulta table/tour
  prices?: PriceRegion                   // un GPriceScope alrededor de la lista
  locale?: string
  labels?: {
    select?: string                      // «Elegir» (botón de cada oferta)
    photos?: string | ((count: number) => string)   // «Ver {count} fotos»
    unavailable?: string                 // «No disponible en tus fechas» (available: false)
    forQuery?: string                    // «Para {query}» (línea de la consulta)
    query?: QueryLabels
    price?: PriceLabels & { legend?: string }        // a GPriceScope (#772)
    gallery?: GranaLabels                // a GGalleryViewer, tal cual (gallery.md «Textos»)
    external?: string
  }
}
```

## Anatomía de una oferta (común)

```
GCard (as según variante) · interaction "link" si offer.href, "button" si no (activa = select)
├─ media: <img> portada (photos[0]) — 01 y 02
├─ eyebrow: offer.kind · title: offer.name (nivel min(sección + 1, 6)) · description: offer.summary
├─ badge: offer.badge
├─ meta: offer.facts → { label, value } (dl de GCard; 03 solo los dos primeros)
├─ default: GText as="div" size="body-sm" › ul de perks  +  GPrice (offer.price; con query y price.total, la cuenta)
│           + (no disponible) GText size="body-sm" › motivo
├─ actions: [GBtn variant="outline" · labels.select → select] (solo con href y disponible)
│           [GBtn variant="link" · labels.photos(count) → abre el visor] (con dos o más fotos)
```

- **La tarjeta tiene una sola acción principal.** Con `href`, la tarjeta es el enlace a la página de la oferta (`navigate`) y «Elegir» va como botón secundario; sin `href`, la tarjeta entera es el botón «elegir esta» (`interaction="button"`, `activate` → `select`) y no se pinta «Elegir». **Nunca un `GBtn solid` por tarjeta** (en una lista de seis competirían seis principales, §3).
- **No disponible:** sin «Elegir», tarjeta sin interacción de elegir (con `href` sigue siendo enlace: se puede leer la oferta), el motivo en texto en el cuerpo y el precio a la vista (§15 regla 7).
- **«Ver fotos»** abre **un solo** `GGalleryViewer` de la sección (no uno por tarjeta) con las `photos` de esa oferta, `index` 0, `title` = `offer.name`, `from` = el botón (el foco vuelve a él) y `zone` por defecto; emite `photos`. Con una foto, no hay botón (la portada basta).
- **Precio:** `GPrice` con el `PriceSpec` tal cual (`size="md"`). Con `query` y `price.total` (lo calcula la aplicación para esa consulta), la tarjeta muestra la cuenta (A de `price.md`: el total arriba y la tarifa como contexto). Con `prices`, la lista va dentro de **un** `GPriceScope` y la moneda se dice una vez.
- **La línea de la consulta** (con `query`, `partyRows` y `labels.query`): debajo del título de la sección, `GText size="body-sm" tone="muted"` con `labels.forQuery` y `{query}` = `describeQuery(query, …).text`, y en `stay` la salida en palabras (`checkout`, «Salida el miércoles, 15 de noviembre»). Una vez por lista, no por tarjeta.

## Variantes

| Variante | Concepto | Compone | Ignora |
| --- | --- | --- | --- |
| **01 · Tarjetas** | Una rejilla de tarjetas iguales con foto arriba | `GSection` › [línea de la consulta] + `GPriceScope` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-standard"` › `GCard as="div" mediaPosition="top"` | — |
| **02 · Renglones** | Una oferta por renglón, foto al lado y todo el detalle a la vista | `GSection` › [línea] + `GPriceScope` › `GStack as="ul" gap="md"` › `GCard as="li" orientation="auto" mediaPosition="start"` (con `facts` y `perks` completos) | — |
| **03 · Rejilla compacta** | Muchas ofertas en poco sitio: sin foto, lo esencial y el precio | `GSection` › [línea] + `GPriceScope` › `GAdaptiveLayout role="list"` › `div role="listitem" class="g-adapt-short"` › `GCard as="div" density="compact"` sin `media` | `media` (portada) y `perks`; `facts` más allá de dos. **«Ver fotos» se queda** |

## Eventos

| Evento | Carga | Cuándo |
| --- | --- | --- |
| `select` | `{ event, offer, query }` | «Elegir» o la tarjeta-botón, con la oferta disponible |
| `photos` | `{ event, offer, index: 0 }` | Al abrir el visor (informativo) |
| `navigate` | `{ event, href, item: offer }` | La tarjeta-enlace (reemite el de `GCard`, #505, #574) |

## Slots

`offer` `{ offer }` (escape: contenido extra al final del cuerpo de la tarjeta, después del precio), `description`.

## Qué lo hace distinto (#868)

**Cada oferta responde a tu consulta.** Con la consulta, la lista dice una vez **para qué** responde («Para 13–15 nov · 2 noches · 2 adultos · 1 niño · Salida el domingo, 15 de noviembre»), y cada tarjeta enseña **lo que cuesta lo que pediste** (el total que da el lugar, no «desde» multiplicado por Grana) con la tarifa por noche como contexto. Lo que no está libre en tus fechas **se queda en la lista** con el motivo en palabras, en lugar de desaparecer y hacerte dudar de si existe. Y las fotos se abren en el visor sin perder la lista: al cerrar, vuelves al botón de esa oferta.

## Textos (`labels`)

| Clave | Requerido |
| --- | --- |
| `select` | Sí, con alguna oferta con `href` y disponible (C5) |
| `photos` | Sí, con alguna oferta con dos o más fotos (C5; sin él, no hay botón) |
| `unavailable` | Sí, con `available: false` (C5) |
| `forQuery`, `query` | Sí, con `query` (K2) |
| `price` | Los de `GPriceScope`/`GPrice` (avisa `GPrice`) |
| `gallery` | Los de `GGalleryViewer` (avisa el visor) |
| `external` | Sí, con una oferta `external` (C5) |

## Avisos propios (`[Grana GbOfferList<NN>]`)

C1 a C7, K1 a K5. Además: **OL1** · una oferta sin `photos` en 01 o 02 (se pinta sin media; la tarjeta no reserva hueco vacío).

## Banco (`offer-list.bank.js`)

Casa Alcalá: cinco habitaciones (Suite Jardín con 9 fotos agrupadas, `badge`, `facts` de capacidad, m² y cama, `perks`, `price` con `lead` «desde», `unit` «/ noche» y `total` para la consulta común; Doble Patio con `href`; Sencilla Cantera con `available: 'No quedan para el 14 de noviembre'`; Terraza con precio `null` «a consultar»; una mínima con `id`, `name` y una foto), `prices` `{ currency: 'MXN', taxes: 'IVA incluido' }`, la consulta común, `labels` completos.

## Verificación propia

Vitest: una sola acción principal por tarjeta (enlace o botón) y ningún `GBtn solid`; «Elegir» solo con `href` y disponible; no disponible en el DOM con su motivo y sin `select`; un solo `GGalleryViewer` en la sección, `from` = el botón, foco de vuelta al cerrar; la línea de la consulta igual a `describeQuery`; `GPrice` con el `PriceSpec` tal cual y un `GPriceScope`; 03 sin `media`. Chromium: 01 con tarjetas a la misma altura a 1440 (regla de #847) y una columna a 320; 02 con la foto al lado en ancho y arriba en estrecho; el visor abre y vuelve al botón.

## Límites aceptados tras la auditoría (#904)

- **BK-L7 · la última tarjeta sola llena la fila** en 01: es el reparto de `GAdaptiveLayout` (los límites ganan a los pesos, pero una `standard` no tiene máximo) con la regla de llenado de fila de #847. Con una foto `top` que domina la sección (575 px de alto frente a 136). **Se acepta como límite** y no se cambia a `g-adapt-short`, que daría tarjetas de ≤ 16 glifos. Receta para quien necesite un tope: montar el bloque en una columna (`GContainer`, ancho de lectura) o en una rejilla de la aplicación. **Reservado**, en ronda de kiwi si el usuario lo pide: un máximo de familia para `standard`.
